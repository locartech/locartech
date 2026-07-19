-- Adds an optional Drive-link field to general "Nova solicitacao" requests.
alter table public.requests add column if not exists drive_link text;

drop function if exists public.create_general_request(text, text, text, text, text, text, date);
drop function if exists public.update_pending_request(uuid, text, text, text, text, text, text, date);

create or replace function public.create_general_request(
  p_target_sector_name text,
  p_step_name text,
  p_description text,
  p_responsible_name text,
  p_kanban_status text,
  p_priority text,
  p_due_date date,
  p_drive_link text default null
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
    kanban_status, priority, due_date, drive_link, organization_id
  ) values (
    trim(p_step_name), coalesce(trim(p_description), ''), trim(p_step_name), v_actor.sector,
    v_target.name, v_actor.sector_ref_id, v_target.id, v_actor.id, v_actor.name,
    nullif(trim(p_responsible_name), ''), 'pending_approval', p_kanban_status,
    p_priority, p_due_date, nullif(trim(p_drive_link), ''), v_actor.organization_id
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

create or replace function public.update_pending_request(
  p_request_id uuid,
  p_target_sector_name text,
  p_step_name text,
  p_description text,
  p_responsible_name text,
  p_kanban_status text,
  p_priority text,
  p_due_date date,
  p_drive_link text default null
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
    priority = p_priority, due_date = p_due_date, drive_link = nullif(trim(p_drive_link), ''), updated_at = now()
  where id = p_request_id returning * into v_request;
  return v_request;
end;
$$;

revoke all on function public.create_general_request(text, text, text, text, text, text, date, text) from public;
revoke all on function public.update_pending_request(uuid, text, text, text, text, text, text, date, text) from public;
grant execute on function public.create_general_request(text, text, text, text, text, text, date, text) to authenticated;
grant execute on function public.update_pending_request(uuid, text, text, text, text, text, text, date, text) to authenticated;
