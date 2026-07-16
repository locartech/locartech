-- Personal notification state and atomic chat operations.

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists idx_notification_reads_user on public.notification_reads(user_id, read_at desc);
alter table public.notification_reads enable row level security;

drop policy if exists "notification reads readable by owner" on public.notification_reads;
create policy "notification reads readable by owner"
  on public.notification_reads for select
  using (user_id = public.current_profile_id());

drop policy if exists "notification reads insertable by owner" on public.notification_reads;
create policy "notification reads insertable by owner"
  on public.notification_reads for insert
  with check (user_id = public.current_profile_id());

drop policy if exists "notification reads updatable by owner" on public.notification_reads;
create policy "notification reads updatable by owner"
  on public.notification_reads for update
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

insert into public.notification_reads(notification_id, user_id, read_at)
select id, user_id, created_at
from public.notifications
where user_id is not null and read
on conflict do nothing;

-- A notification inbox is personal. Admin audit data belongs in audit_logs.
drop policy if exists "notifications readable by recipient" on public.notifications;
create policy "notifications readable by actual recipient"
  on public.notifications for select
  using (
    user_id = public.current_profile_id()
    or (
      user_id is null
      and recipient_sector_id = public.current_sector_id()
      and public.is_active_internal_profile()
    )
    or (
      user_id is null
      and recipient_sector_id is null
      and public.is_active_internal_profile()
      and organization_id = public.current_organization_id()
    )
  );

drop policy if exists "notifications insertable by authenticated users" on public.notifications;
drop policy if exists "notifications editable by recipient" on public.notifications;
drop policy if exists "notifications deletable by recipient" on public.notifications;

-- System messages are rendered as compact timeline events in the group chat.
alter table public.messages add column if not exists message_type text not null default 'user';
alter table public.messages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('user', 'system'));

alter table public.conversations add column if not exists direct_key text;

-- Merge historical duplicate direct conversations before adding the unique key.
do $$
declare
  v_group record;
  v_keep uuid;
  v_duplicate uuid;
begin
  for v_group in
    with direct_pairs as (
      select c.id, c.created_at,
        string_agg(cp.profile_id::text, ':' order by cp.profile_id::text) as pair_key
      from public.conversations c
      join public.conversation_participants cp on cp.conversation_id = c.id
      where c.type = 'direct'
      group by c.id, c.created_at
      having count(*) = 2
    )
    select pair_key, array_agg(id order by created_at, id) as conversation_ids
    from direct_pairs
    group by pair_key
    having count(*) > 1
  loop
    v_keep := v_group.conversation_ids[1];
    foreach v_duplicate in array v_group.conversation_ids[2:array_length(v_group.conversation_ids, 1)]
    loop
      update public.messages set conversation_id = v_keep where conversation_id = v_duplicate;

      update public.conversation_participants keep
      set last_read_at = greatest(keep.last_read_at, duplicate.last_read_at),
          archived_at = case
            when keep.archived_at is null or duplicate.archived_at is null then null
            else greatest(keep.archived_at, duplicate.archived_at)
          end
      from public.conversation_participants duplicate
      where keep.conversation_id = v_keep
        and duplicate.conversation_id = v_duplicate
        and keep.profile_id = duplicate.profile_id;

      delete from public.conversations where id = v_duplicate;
    end loop;
  end loop;
end $$;

update public.conversations c
set direct_key = pairs.pair_key
from (
  select cp.conversation_id,
    string_agg(cp.profile_id::text, ':' order by cp.profile_id::text) as pair_key
  from public.conversation_participants cp
  join public.conversations c2 on c2.id = cp.conversation_id and c2.type = 'direct'
  group by cp.conversation_id
  having count(*) = 2
) pairs
where c.id = pairs.conversation_id;

create unique index if not exists idx_conversations_direct_key on public.conversations(direct_key);

-- Direct table writes are removed; the RPCs below validate participants and
-- keep conversations, messages and notifications in one transaction.
drop policy if exists "conversations insertable by authenticated users" on public.conversations;
drop policy if exists "conversations updatable by participants" on public.conversations;
drop policy if exists "participants insertable by authenticated users" on public.conversation_participants;
drop policy if exists "participants deletable by creator or self" on public.conversation_participants;
drop policy if exists "messages insertable by participants" on public.messages;

drop policy if exists "conversations readable by participants" on public.conversations;
create policy "conversations readable by internal participants"
  on public.conversations for select
  using (public.is_active_internal_profile() and public.is_conversation_participant(id));

drop policy if exists "participants readable by participants" on public.conversation_participants;
create policy "participants readable by internal participants"
  on public.conversation_participants for select
  using (
    public.is_active_internal_profile()
    and public.is_conversation_participant(conversation_id)
  );

drop policy if exists "participants editable by self" on public.conversation_participants;
create policy "participants editable by internal self"
  on public.conversation_participants for update
  using (
    public.is_active_internal_profile()
    and profile_id = public.current_profile_id()
  )
  with check (
    public.is_active_internal_profile()
    and profile_id = public.current_profile_id()
  );

drop policy if exists "messages readable by participants" on public.messages;
create policy "messages readable by internal participants"
  on public.messages for select
  using (
    public.is_active_internal_profile()
    and public.is_conversation_participant(conversation_id)
  );

create or replace function public.ensure_direct_conversation(p_other_profile_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_other public.profiles;
  v_key text;
  v_conversation_id uuid;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  select * into v_other from public.profiles
  where id = p_other_profile_id and status = 'Ativo' and account_type <> 'operacao';

  if v_actor.id is null or v_other.id is null or v_actor.organization_id is distinct from v_other.organization_id
    or v_actor.id = v_other.id
  then raise exception 'Contato invalido'; end if;

  v_key := least(v_actor.id::text, v_other.id::text) || ':' || greatest(v_actor.id::text, v_other.id::text);
  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

  select id into v_conversation_id from public.conversations where direct_key = v_key;
  if v_conversation_id is null then
    insert into public.conversations (
      type, title, description, sector, created_by, organization_id, direct_key
    ) values (
      'direct', v_actor.name || ' / ' || v_other.name, 'Conversa iniciada', v_other.sector,
      v_actor.id, v_actor.organization_id, v_key
    ) returning id into v_conversation_id;

    insert into public.conversation_participants(conversation_id, profile_id)
    values (v_conversation_id, v_actor.id), (v_conversation_id, v_other.id);
  else
    update public.conversation_participants set archived_at = null
    where conversation_id = v_conversation_id and profile_id = v_actor.id;
  end if;

  return v_conversation_id;
end;
$$;

create or replace function public.create_group_conversation(
  p_title text,
  p_description text,
  p_sector text,
  p_participant_ids uuid[]
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_conversation_id uuid;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  if v_actor.id is null then raise exception 'Usuario nao autorizado'; end if;
  if nullif(trim(p_title), '') is null then raise exception 'Informe o nome do grupo'; end if;

  insert into public.conversations(type, title, description, sector, created_by, organization_id)
  values ('group', trim(p_title), coalesce(trim(p_description), ''), trim(p_sector), v_actor.id, v_actor.organization_id)
  returning id into v_conversation_id;

  insert into public.conversation_participants(conversation_id, profile_id)
  select v_conversation_id, p.id
  from public.profiles p
  where p.organization_id = v_actor.organization_id
    and p.status = 'Ativo'
    and p.account_type <> 'operacao'
    and (p.id = v_actor.id or p.id = any(coalesce(p_participant_ids, '{}'::uuid[])))
  on conflict do nothing;

  if (select count(*) from public.conversation_participants where conversation_id = v_conversation_id) < 2 then
    raise exception 'Selecione pelo menos um participante';
  end if;

  insert into public.messages(conversation_id, sender_id, text, message_type, metadata)
  values (v_conversation_id, v_actor.id, v_actor.name || ' criou o grupo.', 'system',
    jsonb_build_object('action', 'group_created', 'actor_id', v_actor.id));

  return v_conversation_id;
end;
$$;

create or replace function public.update_group_conversation(
  p_conversation_id uuid,
  p_title text,
  p_description text,
  p_sector text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_conversation public.conversations;
  v_changes text[] := '{}'::text[];
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  select * into v_conversation from public.conversations where id = p_conversation_id and type = 'group' for update;
  if v_actor.id is null or v_conversation.id is null or not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Sem permissao para editar o grupo';
  end if;
  if nullif(trim(p_title), '') is null then raise exception 'Informe o nome do grupo'; end if;

  if v_conversation.title is distinct from trim(p_title) then
    v_changes := array_append(v_changes, 'alterou o nome do grupo para "' || trim(p_title) || '"');
  end if;
  if v_conversation.description is distinct from coalesce(trim(p_description), '') then
    v_changes := array_append(v_changes, 'alterou a descricao do grupo');
  end if;
  if v_conversation.sector is distinct from trim(p_sector) then
    v_changes := array_append(v_changes, 'alterou o setor principal para ' || trim(p_sector));
  end if;

  update public.conversations set title = trim(p_title), description = coalesce(trim(p_description), ''),
    sector = trim(p_sector), updated_at = now()
  where id = p_conversation_id;

  if array_length(v_changes, 1) is not null then
    insert into public.messages(conversation_id, sender_id, text, message_type, metadata)
    values (p_conversation_id, v_actor.id, v_actor.name || ' ' || array_to_string(v_changes, ', ') || '.',
      'system', jsonb_build_object('action', 'group_updated', 'actor_id', v_actor.id));
  end if;

  return p_conversation_id;
end;
$$;

create or replace function public.add_group_participant_rpc(p_conversation_id uuid, p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_target public.profiles;
  v_inserted integer;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  select * into v_target from public.profiles
  where id = p_profile_id and status = 'Ativo' and account_type <> 'operacao';
  if v_actor.id is null or v_target.id is null or not public.is_conversation_participant(p_conversation_id)
    or not exists (select 1 from public.conversations where id = p_conversation_id and type = 'group'
      and organization_id = v_actor.organization_id)
    or v_target.organization_id is distinct from v_actor.organization_id
  then raise exception 'Sem permissao para adicionar este membro'; end if;

  insert into public.conversation_participants(conversation_id, profile_id)
  values (p_conversation_id, p_profile_id) on conflict do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    insert into public.messages(conversation_id, sender_id, text, message_type, metadata)
    values (p_conversation_id, v_actor.id, v_actor.name || ' adicionou ' || v_target.name || '.', 'system',
      jsonb_build_object('action', 'participant_added', 'actor_id', v_actor.id, 'profile_id', v_target.id));
    update public.conversations set updated_at = now() where id = p_conversation_id;
  end if;
end;
$$;

create or replace function public.remove_group_participant_rpc(p_conversation_id uuid, p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_target public.profiles;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  select * into v_target from public.profiles where id = p_profile_id;
  if v_actor.id is null or v_target.id is null or not public.is_conversation_participant(p_conversation_id)
    or not exists (select 1 from public.conversations where id = p_conversation_id and type = 'group')
  then raise exception 'Sem permissao para remover este membro'; end if;

  if (select count(*) from public.conversation_participants where conversation_id = p_conversation_id) <= 2 then
    raise exception 'O grupo precisa manter pelo menos dois participantes';
  end if;

  insert into public.messages(conversation_id, sender_id, text, message_type, metadata)
  values (p_conversation_id, v_actor.id,
    case when v_actor.id = v_target.id then v_actor.name || ' saiu do grupo.'
      else v_actor.name || ' removeu ' || v_target.name || '.' end,
    'system', jsonb_build_object('action', 'participant_removed', 'actor_id', v_actor.id, 'profile_id', v_target.id));

  delete from public.conversation_participants
  where conversation_id = p_conversation_id and profile_id = p_profile_id;
  update public.conversations set updated_at = now() where id = p_conversation_id;
end;
$$;

create or replace function public.send_chat_message(p_conversation_id uuid, p_text text)
returns public.messages
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_conversation public.conversations;
  v_message public.messages;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type <> 'operacao';
  select * into v_conversation from public.conversations where id = p_conversation_id;
  if v_actor.id is null or v_conversation.id is null or not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Sem permissao para enviar mensagem';
  end if;
  if nullif(trim(p_text), '') is null then raise exception 'Digite uma mensagem'; end if;

  insert into public.messages(conversation_id, sender_id, text, message_type)
  values (p_conversation_id, v_actor.id, trim(p_text), 'user') returning * into v_message;
  update public.conversations set updated_at = now() where id = p_conversation_id;

  insert into public.notifications (
    user_id, organization_id, actor_profile_id, title, message, category, type,
    entity_type, entity_id, target_user_name
  )
  select cp.profile_id, v_actor.organization_id, v_actor.id,
    case when v_conversation.type = 'group' then 'Nova mensagem em ' || v_conversation.title
      else 'Nova mensagem no chat' end,
    v_actor.name || ': ' || left(trim(p_text), 120), 'Chat', 'chat_message',
    'conversation', p_conversation_id, v_actor.name
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.profile_id <> v_actor.id
    and not exists (
      select 1 from public.notifications n
      where n.user_id = cp.profile_id
        and n.type = 'chat_message'
        and n.entity_id = p_conversation_id
        and not exists (
          select 1 from public.notification_reads nr
          where nr.notification_id = n.id and nr.user_id = cp.profile_id
        )
        and not exists (
          select 1 from public.notification_dismissals nd
          where nd.notification_id = n.id and nd.user_id = cp.profile_id
        )
    );

  return v_message;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
begin
  if v_actor_id is null or not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Conversa invalida';
  end if;
  update public.conversation_participants set last_read_at = now()
  where conversation_id = p_conversation_id and profile_id = v_actor_id;

  insert into public.notification_reads(notification_id, user_id, read_at)
  select n.id, v_actor_id, now()
  from public.notifications n
  where n.user_id = v_actor_id and n.type = 'chat_message' and n.entity_id = p_conversation_id
  on conflict (notification_id, user_id) do update set read_at = excluded.read_at;
end;
$$;

create or replace function public.list_my_conversations()
returns table (
  id uuid,
  conversation_type text,
  title text,
  description text,
  sector text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  participant_ids uuid[],
  last_read_at timestamptz,
  archived_at timestamptz,
  last_message_id uuid,
  last_message_text text,
  last_message_sender_id uuid,
  last_message_type text,
  last_message_created_at timestamptz,
  unread_count bigint
)
language sql stable security definer set search_path = public
as $$
  select c.id, c.type, c.title, c.description, c.sector, c.created_by, c.created_at, c.updated_at,
    array_agg(distinct cp_all.profile_id) as participant_ids,
    cp_me.last_read_at, cp_me.archived_at,
    lm.id, lm.text, lm.sender_id, lm.message_type, lm.created_at,
    count(distinct m_unread.id) filter (where m_unread.sender_id <> cp_me.profile_id) as unread_count
  from public.conversations c
  join public.conversation_participants cp_me
    on cp_me.conversation_id = c.id and cp_me.profile_id = public.current_profile_id()
  join public.conversation_participants cp_all on cp_all.conversation_id = c.id
  left join lateral (
    select m.id, m.text, m.sender_id, m.message_type, m.created_at
    from public.messages m where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) lm on true
  left join public.messages m_unread
    on m_unread.conversation_id = c.id
    and m_unread.created_at > coalesce(cp_me.last_read_at, '-infinity'::timestamptz)
  where public.is_active_internal_profile()
  group by c.id, cp_me.last_read_at, cp_me.archived_at,
    lm.id, lm.text, lm.sender_id, lm.message_type, lm.created_at
  order by coalesce(lm.created_at, c.updated_at, c.created_at) desc;
$$;

revoke all on function public.ensure_direct_conversation(uuid) from public;
revoke all on function public.create_group_conversation(text, text, text, uuid[]) from public;
revoke all on function public.update_group_conversation(uuid, text, text, text) from public;
revoke all on function public.add_group_participant_rpc(uuid, uuid) from public;
revoke all on function public.remove_group_participant_rpc(uuid, uuid) from public;
revoke all on function public.send_chat_message(uuid, text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
revoke all on function public.list_my_conversations() from public;
grant execute on function public.ensure_direct_conversation(uuid) to authenticated;
grant execute on function public.create_group_conversation(text, text, text, uuid[]) to authenticated;
grant execute on function public.update_group_conversation(uuid, text, text, text) to authenticated;
grant execute on function public.add_group_participant_rpc(uuid, uuid) to authenticated;
grant execute on function public.remove_group_participant_rpc(uuid, uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.list_my_conversations() to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.notification_reads;
exception when duplicate_object then null;
end $$;
