-- Final security and workflow hardening.
-- Business state transitions are RPC-only; RLS remains the last line of defense.

create or replace function public.current_organization_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select organization_id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.is_operation_profile()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    left join public.sectors s on s.id = p.sector_ref_id
    where p.auth_user_id = auth.uid()
      and p.status = 'Ativo'
      and (p.account_type = 'operacao' or s.slug = 'operacoes')
  );
$$;

create or replace function public.is_active_internal_profile()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and status = 'Ativo'
      and account_type <> 'operacao'
  );
$$;

grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.is_operation_profile() to authenticated;
grant execute on function public.is_active_internal_profile() to authenticated;

create or replace function public.can_manage_sector(p_sector_ref_id uuid, p_sector_key text default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_active_admin()
    or (
      public.is_active_internal_profile()
      and lower(trim(coalesce(p_sector_key, ''))) = 'projetos'
    )
    or exists (
      select 1
      from public.profiles p
      left join public.sectors s on s.id = p.sector_ref_id
      where p.auth_user_id = auth.uid()
        and p.status = 'Ativo'
        and p.account_type <> 'operacao'
        and (
          (p_sector_ref_id is not null and p.sector_ref_id = p_sector_ref_id)
          or (
            p_sector_key is not null
            and (
              lower(trim(p.sector)) = lower(trim(p_sector_key))
              or lower(trim(s.name)) = lower(trim(p_sector_key))
              or lower(trim(s.slug)) = lower(trim(p_sector_key))
            )
          )
        )
    );
$$;

grant execute on function public.can_manage_sector(uuid, text) to authenticated;

-- Pending or regular users may edit presentation fields only. Privilege-bearing
-- columns can only be changed by an active administrator or the service role.
create or replace function public.protect_profile_privilege_fields()
returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.role() = 'service_role' or public.is_active_admin() then
    return new;
  end if;

  if old.auth_user_id is distinct from auth.uid() then
    raise exception 'Sem permissao para editar este perfil';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id
    or new.organization_id is distinct from old.organization_id
    or new.sector_ref_id is distinct from old.sector_ref_id
    or new.sector is distinct from old.sector
    or new.account_type is distinct from old.account_type
    or new.status is distinct from old.status
    or new.email is distinct from old.email
  then
    raise exception 'Campos de acesso so podem ser alterados por um administrador';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privilege_fields on public.profiles;
create trigger protect_profile_privilege_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privilege_fields();

-- Profile creation is only possible through create_pending_profile().
drop policy if exists "profiles insertable during signup" on public.profiles;

drop policy if exists "profiles editable by admins or self" on public.profiles;
create policy "profiles editable by admins or active self"
  on public.profiles for update
  using (
    public.is_active_admin()
    or (auth_user_id = auth.uid() and status = 'Ativo')
  )
  with check (
    public.is_active_admin()
    or (auth_user_id = auth.uid() and status = 'Ativo')
  );

drop policy if exists "profiles readable by self active or admin" on public.profiles;
drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by allowed members"
  on public.profiles for select
  using (
    auth_user_id = auth.uid()
    or (
      public.is_active_admin()
      and organization_id = public.current_organization_id()
    )
    or (
      public.is_active_internal_profile()
      and status = 'Ativo'
      and organization_id = public.current_organization_id()
    )
  );

-- The old trigger confirmed every auth account as soon as any profile row was
-- inserted. Auth confirmation now remains an Auth concern.
drop trigger if exists confirm_profile_auth_user on public.profiles;

create or replace function public.create_pending_profile(
  p_auth_user_id uuid,
  p_name text,
  p_email text,
  p_sector_name text,
  p_role text
)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_org_id uuid;
  v_sector_id uuid;
  v_sector_name text;
  v_sector_slug text;
  v_profile public.profiles;
begin
  if auth.uid() is null or auth.uid() is distinct from p_auth_user_id then
    raise exception 'Usuario de autenticacao invalido';
  end if;

  if lower(coalesce(auth.jwt() ->> 'email', '')) is distinct from lower(trim(p_email)) then
    raise exception 'O e-mail do perfil deve ser o mesmo da conta autenticada';
  end if;

  if exists (select 1 from public.profiles where auth_user_id = p_auth_user_id) then
    raise exception 'Ja existe um perfil para este usuario';
  end if;

  if exists (select 1 from public.profiles where email = lower(trim(p_email))) then
    raise exception 'Ja existe uma conta com este e-mail';
  end if;

  select id into v_org_id from public.organizations order by created_at limit 1;
  select id, name, slug into v_sector_id, v_sector_name, v_sector_slug
    from public.sectors
    where organization_id = v_org_id and name ilike trim(p_sector_name)
    limit 1;

  if v_org_id is null or v_sector_id is null then
    raise exception 'Setor ou organizacao invalida';
  end if;

  insert into public.profiles (
    auth_user_id, organization_id, sector_ref_id, name, email, sector, role, job_title,
    account_type, status, avatar_initials
  ) values (
    p_auth_user_id, v_org_id, v_sector_id, trim(p_name), lower(trim(p_email)), v_sector_name,
    trim(p_role), trim(p_role),
    case when v_sector_slug = 'operacoes' then 'operacao' else 'member' end,
    'Pendente',
    upper(left(split_part(trim(p_name), ' ', 1), 1) || coalesce(left(split_part(trim(p_name), ' ', 2), 1), ''))
  ) returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.create_pending_profile(uuid, text, text, text, text) from public, anon;
grant execute on function public.create_pending_profile(uuid, text, text, text, text) to authenticated;

-- Operation accounts can only read their own purchase requests. Internal users
-- retain their normal requester/sector visibility.
drop policy if exists "kanban readable by active members" on public.kanban_tasks;
create policy "kanban readable by internal members"
  on public.kanban_tasks for select
  using (
    public.is_active_internal_profile()
    and organization_id = public.current_organization_id()
  );

drop policy if exists "knowledge readable by active members" on public.knowledge_records;
create policy "knowledge readable by internal members"
  on public.knowledge_records for select
  using (
    public.is_active_internal_profile()
    and organization_id = public.current_organization_id()
  );

drop policy if exists "requests readable by requester target sector or admin" on public.requests;
create policy "requests readable by authorized members"
  on public.requests for select
  using (
    organization_id = public.current_organization_id()
    and (
      requester_id = public.current_profile_id()
      or (
        public.is_active_internal_profile()
        and (target_sector_id = public.current_sector_id() or public.is_active_admin())
      )
    )
  );

-- Requests are created and transitioned only through the RPCs below.
drop policy if exists "requests insertable by requester" on public.requests;
drop policy if exists "requests editable by requester while pending" on public.requests;

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check
  check (status in ('pending_approval', 'approved', 'rejected', 'canceled', 'completed'));

create unique index if not exists idx_kanban_tasks_unique_source_request
  on public.kanban_tasks(source_request_id) where source_request_id is not null;

create or replace function public.fill_kanban_tenant_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.organization_id := coalesce(new.organization_id, public.current_organization_id());
    new.created_by := coalesce(new.created_by, public.current_profile_id());
  end if;

  if new.responsible_id is null and nullif(trim(new.responsible_name), '') is not null then
    select p.id into new.responsible_id
    from public.profiles p
    where p.organization_id = new.organization_id
      and p.status = 'Ativo'
      and lower(trim(p.name)) = lower(trim(new.responsible_name))
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists fill_kanban_tenant_fields on public.kanban_tasks;
create trigger fill_kanban_tenant_fields
  before insert or update of responsible_name on public.kanban_tasks
  for each row execute function public.fill_kanban_tenant_fields();

drop policy if exists "archived reports readable by active members" on public.archived_activity_reports;
create policy "archived reports readable by internal members"
  on public.archived_activity_reports for select
  using (
    public.is_active_internal_profile()
    and organization_id = public.current_organization_id()
  );

drop policy if exists "purchase reports readable by active members" on public.purchase_request_reports;
create policy "purchase reports readable by internal members"
  on public.purchase_request_reports for select
  using (
    public.is_active_internal_profile()
    and organization_id = public.current_organization_id()
  );

create or replace function public.create_general_request(
  p_target_sector_name text,
  p_step_name text,
  p_description text,
  p_responsible_name text,
  p_kanban_status text,
  p_priority text,
  p_due_date date
)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_target public.sectors;
  v_request public.requests;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null or v_actor.account_type = 'operacao' then
    raise exception 'Sem permissao para criar solicitacoes entre setores';
  end if;

  if nullif(trim(p_step_name), '') is null or p_due_date is null
    or p_priority not in ('low', 'medium', 'high', 'urgent')
    or p_kanban_status not in ('todo', 'doing', 'done', 'canceled')
  then
    raise exception 'Dados da solicitacao invalidos';
  end if;

  select * into v_target from public.sectors
  where organization_id = v_actor.organization_id and name ilike trim(p_target_sector_name)
  limit 1;
  if v_target.id is null then raise exception 'Setor de destino invalido'; end if;

  insert into public.requests (
    title, description, step_name, from_sector, to_sector, requester_sector_id,
    target_sector_id, requester_id, requester_name, responsible_name, status,
    kanban_status, priority, due_date, organization_id
  ) values (
    trim(p_step_name), coalesce(trim(p_description), ''), trim(p_step_name), v_actor.sector,
    v_target.name, v_actor.sector_ref_id, v_target.id, v_actor.id, v_actor.name,
    nullif(trim(p_responsible_name), ''), 'pending_approval', p_kanban_status,
    p_priority, p_due_date, v_actor.organization_id
  ) returning * into v_request;

  insert into public.notifications (
    user_id, organization_id, recipient_sector_id, actor_profile_id, title, message,
    category, type, entity_type, entity_id, target_sector_name, target_user_name
  )
  select p.id, v_actor.organization_id, v_target.id, v_actor.id,
    'Nova solicitacao recebida',
    'Nova solicitacao recebida de ' || v_actor.sector || ': ' || v_request.title || '.',
    'Solicitacoes', 'request_created', 'request', v_request.id, v_target.name,
    nullif(trim(p_responsible_name), '')
  from public.profiles p
  where p.organization_id = v_actor.organization_id
    and p.sector_ref_id = v_target.id
    and p.status = 'Ativo'
    and p.id <> v_actor.id;

  return v_request;
end;
$$;

create or replace function public.create_purchase_request(
  p_description text,
  p_requester_name text,
  p_priority text,
  p_due_date date
)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_target public.sectors;
  v_request public.requests;
  v_title text;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;
  if nullif(trim(p_description), '') is null or nullif(trim(p_requester_name), '') is null
    or p_due_date is null or p_priority not in ('low', 'medium', 'high', 'urgent')
  then
    raise exception 'Dados da compra invalidos';
  end if;

  select * into v_target from public.sectors
  where organization_id = v_actor.organization_id and name ilike 'Compras' limit 1;
  if v_target.id is null then raise exception 'Setor de Compras nao encontrado'; end if;

  v_title := left(regexp_replace(trim(p_description), E'[\\n\\r]+', ' ', 'g'), 120);
  insert into public.requests (
    title, description, step_name, from_sector, to_sector, requester_sector_id,
    target_sector_id, requester_id, requester_name, status, kanban_status, priority,
    due_date, organization_id
  ) values (
    v_title, p_description, v_title, 'Gestao da obra', v_target.name, v_actor.sector_ref_id,
    v_target.id, v_actor.id, trim(p_requester_name), 'pending_approval', 'todo', p_priority,
    p_due_date, v_actor.organization_id
  ) returning * into v_request;

  insert into public.notifications (
    user_id, organization_id, recipient_sector_id, actor_profile_id, title, message,
    category, type, entity_type, entity_id, target_sector_name, target_user_name
  )
  select p.id, v_actor.organization_id, v_target.id, v_actor.id,
    'Nova compra solicitada', trim(p_requester_name) || ' enviou uma nova solicitacao de compra.',
    'Compras solicitadas', 'purchase_created', 'request', v_request.id, 'Compras', p.name
  from public.profiles p
  where p.organization_id = v_actor.organization_id
    and p.sector_ref_id = v_target.id
    and p.status = 'Ativo'
    and p.id <> v_actor.id;

  return v_request;
end;
$$;

create or replace function public.update_pending_request(
  p_request_id uuid,
  p_target_sector_name text,
  p_step_name text,
  p_description text,
  p_responsible_name text,
  p_kanban_status text,
  p_priority text,
  p_due_date date
)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_request public.requests;
  v_target public.sectors;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if v_request.status <> 'pending_approval' or not (v_request.requester_id = v_actor_id or public.is_active_admin()) then
    raise exception 'Somente solicitacoes pendentes do proprio usuario podem ser editadas';
  end if;
  if nullif(trim(p_step_name), '') is null or p_due_date is null
    or p_priority not in ('low', 'medium', 'high', 'urgent')
    or p_kanban_status not in ('todo', 'doing', 'done', 'canceled')
  then raise exception 'Dados da solicitacao invalidos'; end if;

  select * into v_target from public.sectors
  where organization_id = v_request.organization_id and name ilike trim(p_target_sector_name) limit 1;
  if v_target.id is null then raise exception 'Setor de destino invalido'; end if;

  update public.requests set
    title = trim(p_step_name), step_name = trim(p_step_name), description = coalesce(trim(p_description), ''),
    to_sector = v_target.name, target_sector_id = v_target.id,
    responsible_name = nullif(trim(p_responsible_name), ''), kanban_status = p_kanban_status,
    priority = p_priority, due_date = p_due_date, updated_at = now()
  where id = p_request_id returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.cancel_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_request public.requests;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if v_request.status <> 'pending_approval' or not (v_request.requester_id = v_actor_id or public.is_active_admin()) then
    raise exception 'Esta solicitacao nao pode ser cancelada';
  end if;
  update public.requests set status = 'canceled', cancelled_at = now(), updated_at = now()
  where id = p_request_id returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.update_purchase_request_status(p_request_id uuid, p_status text)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_request public.requests;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;
  if p_status not in ('pending_approval', 'approved', 'rejected', 'canceled', 'completed') then
    raise exception 'Status de compra invalido';
  end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if v_request.from_sector <> 'Gestao da obra' or v_request.to_sector <> 'Compras' then
    raise exception 'Esta solicitacao nao pertence ao fluxo de compras';
  end if;
  if not public.can_manage_sector(v_request.target_sector_id, 'Compras') then
    raise exception 'Sem permissao para alterar esta solicitacao';
  end if;

  update public.requests set
    status = p_status,
    approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else approved_at end,
    rejected_at = case when p_status = 'rejected' then coalesce(rejected_at, now()) else rejected_at end,
    cancelled_at = case when p_status = 'canceled' then coalesce(cancelled_at, now()) else cancelled_at end,
    updated_at = now()
  where id = p_request_id returning * into v_request;

  if v_request.requester_id is not null and v_request.requester_id <> v_actor.id then
    insert into public.notifications (
      user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id,
      target_sector_name, target_user_name
    ) values (
      v_request.requester_id, v_request.organization_id, v_actor.id,
      'Compra solicitada atualizada',
      'Sua solicitacao de compra mudou para ' ||
        case p_status when 'pending_approval' then 'Nova' when 'approved' then 'Em andamento'
          when 'rejected' then 'Recusada' when 'canceled' then 'Cancelada' else 'Concluida' end || '.',
      'Compras solicitadas', 'purchase_status_changed', 'request', v_request.id,
      'Compras', v_request.requester_name
    );
  end if;

  return v_request;
end;
$$;

create or replace function public.archive_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_request public.requests;
  v_task public.kanban_tasks;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if not (
    public.is_active_admin()
    or (
      v_actor.account_type <> 'operacao'
      and (v_request.requester_id = v_actor.id or v_request.target_sector_id = v_actor.sector_ref_id)
    )
  ) then
    raise exception 'Sem permissao para arquivar esta solicitacao';
  end if;
  if v_request.status = 'pending_approval' then
    raise exception 'Solicitacoes pendentes precisam ser processadas ou canceladas antes de arquivar';
  end if;
  if v_request.status = 'approved' and v_request.generated_task_id is not null then
    select * into v_task from public.kanban_tasks where id = v_request.generated_task_id;
    if v_task.id is not null and not (v_task.archived or v_task.status in ('done', 'canceled')) then
      raise exception 'Conclua, cancele ou arquive a atividade vinculada antes de arquivar a solicitacao';
    end if;
  end if;
  update public.requests set archived = true, archived_at = now(), archived_by = v_actor.id,
    archived_by_name = v_actor.name, updated_at = now()
  where id = p_request_id returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.restore_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_request public.requests;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;
  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if not (
    public.is_active_admin()
    or (
      v_actor.account_type <> 'operacao'
      and (v_request.requester_id = v_actor.id or v_request.target_sector_id = v_actor.sector_ref_id)
    )
  ) then raise exception 'Sem permissao para restaurar esta solicitacao'; end if;

  update public.requests set archived = false, archived_at = null, archived_by = null,
    archived_by_name = null, updated_at = now()
  where id = p_request_id returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.prevent_source_task_deletion()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if not old.archived and old.source_request_id is not null and exists (
    select 1 from public.requests r
    where r.id = old.source_request_id and r.status = 'approved'
  ) then
    raise exception 'Atividades originadas por solicitacoes devem ser arquivadas, nao excluidas';
  end if;
  return old;
end;
$$;

create or replace function public.delete_archived_kanban_history(p_task_ids uuid[])
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_deleted integer;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin';
  if v_actor.id is null then raise exception 'Apenas administradores podem excluir historicos.'; end if;

  update public.requests r
  set archived = true,
      archived_at = coalesce(r.archived_at, now()),
      archived_by = coalesce(r.archived_by, v_actor.id),
      archived_by_name = coalesce(r.archived_by_name, v_actor.name),
      generated_task_id = null,
      updated_at = now()
  from public.kanban_tasks t
  where t.id = any(coalesce(p_task_ids, array[]::uuid[]))
    and t.archived
    and t.organization_id = v_actor.organization_id
    and r.id = t.source_request_id;

  delete from public.kanban_tasks
  where id = any(coalesce(p_task_ids, array[]::uuid[]))
    and archived
    and organization_id = v_actor.organization_id;
  get diagnostics v_deleted = row_count;

  insert into public.audit_logs(organization_id, actor_profile_id, action, entity_type, metadata)
  values (v_actor.organization_id, v_actor.id, 'archived_history_deleted', 'kanban_task',
    jsonb_build_object('deleted_count', v_deleted, 'ids', p_task_ids));
  return v_deleted;
end;
$$;

drop trigger if exists prevent_source_task_deletion on public.kanban_tasks;
create trigger prevent_source_task_deletion
  before delete on public.kanban_tasks
  for each row execute function public.prevent_source_task_deletion();

-- Repair historical inconsistencies before enforcing the unique source link.
update public.requests
set status = 'canceled', cancelled_at = coalesce(cancelled_at, archived_at, now()), updated_at = now()
where archived and status = 'pending_approval';

do $$
declare
  v_request public.requests;
  v_task_id uuid;
begin
  for v_request in
    select r.* from public.requests r
    where r.status = 'approved'
      and r.generated_task_id is null
      and not (r.from_sector = 'Gestao da obra' and r.to_sector = 'Compras')
  loop
    insert into public.kanban_tasks (
      title, description, sector_id, sector_name, sector_ref_id, organization_id,
      responsible_id, responsible_name, status, priority, due_date, next_step,
      source_request_id, requester_profile_id, requester_sector_id, created_by
    )
    select v_request.title, v_request.description, s.slug, s.name, s.id, v_request.organization_id,
      v_request.responsible_id, v_request.responsible_name, coalesce(v_request.kanban_status, 'todo'),
      coalesce(v_request.priority, 'medium'), v_request.due_date, v_request.step_name,
      v_request.id, v_request.requester_id, v_request.requester_sector_id, v_request.approved_by
    from public.sectors s where s.id = v_request.target_sector_id
    on conflict (source_request_id) where source_request_id is not null do nothing
    returning id into v_task_id;

    if v_task_id is not null then
      update public.requests set generated_task_id = v_task_id, updated_at = now()
      where id = v_request.id;
    end if;
  end loop;
end $$;

revoke all on function public.create_general_request(text, text, text, text, text, text, date) from public;
revoke all on function public.create_purchase_request(text, text, text, date) from public;
revoke all on function public.update_pending_request(uuid, text, text, text, text, text, text, date) from public;
revoke all on function public.cancel_request(uuid) from public;
revoke all on function public.update_purchase_request_status(uuid, text) from public;
grant execute on function public.create_general_request(text, text, text, text, text, text, date) to authenticated;
grant execute on function public.create_purchase_request(text, text, text, date) to authenticated;
grant execute on function public.update_pending_request(uuid, text, text, text, text, text, text, date) to authenticated;
grant execute on function public.cancel_request(uuid) to authenticated;
grant execute on function public.update_purchase_request_status(uuid, text) to authenticated;
