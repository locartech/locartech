-- Let each participant clear and hide a conversation only for their own account.
alter table public.conversation_participants
  add column if not exists cleared_at timestamptz,
  add column if not exists hidden_at timestamptz;

create index if not exists idx_conversation_participants_hidden
  on public.conversation_participants(profile_id, hidden_at);

create or replace function public.delete_conversation_for_me(p_conversation_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
begin
  if v_actor_id is null or not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Conversa invalida';
  end if;

  update public.conversation_participants
  set cleared_at = clock_timestamp(),
      hidden_at = clock_timestamp(),
      archived_at = null,
      last_read_at = clock_timestamp()
  where conversation_id = p_conversation_id and profile_id = v_actor_id;

  insert into public.notification_reads(notification_id, user_id, read_at)
  select n.id, v_actor_id, now()
  from public.notifications n
  where n.user_id = v_actor_id
    and n.type = 'chat_message'
    and n.entity_id = p_conversation_id
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
    and m_unread.created_at > greatest(
      coalesce(cp_me.last_read_at, '-infinity'::timestamptz),
      coalesce(cp_me.cleared_at, '-infinity'::timestamptz)
    )
  where public.is_active_internal_profile()
    and (cp_me.hidden_at is null or lm.created_at > cp_me.hidden_at)
  group by c.id, cp_me.last_read_at, cp_me.archived_at, cp_me.cleared_at, cp_me.hidden_at,
    lm.id, lm.text, lm.sender_id, lm.message_type, lm.created_at
  order by coalesce(lm.created_at, c.updated_at, c.created_at) desc;
$$;

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
    insert into public.conversation_participants(conversation_id, profile_id)
    values (v_conversation_id, v_actor.id)
    on conflict (conversation_id, profile_id) do update
      set archived_at = null, hidden_at = null;
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.delete_conversation_for_me(uuid) from public;
grant execute on function public.delete_conversation_for_me(uuid) to authenticated;
