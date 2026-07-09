-- Adds the initial-kanban-status field the request form already exposes, and uses it
-- (instead of a hardcoded 'todo') when approve_request() creates the kanban task.

alter table public.requests add column if not exists kanban_status text default 'todo';

update public.requests set kanban_status = 'todo'
where kanban_status is null or kanban_status not in ('todo', 'doing', 'done', 'canceled');

do $$
begin
  alter table public.requests add constraint requests_kanban_status_check
    check (kanban_status in ('todo', 'doing', 'done', 'canceled'));
exception when duplicate_object then null;
end $$;

create or replace function public.approve_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_actor_sector_id uuid := public.current_sector_id();
  v_is_admin boolean := public.is_active_admin();
  v_request public.requests;
  v_task_id uuid;
begin
  if v_actor_id is null or not public.is_active_profile() then
    raise exception 'Usuario nao autenticado ou inativo';
  end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception 'Solicitacao nao encontrada';
  end if;

  if not (v_is_admin or v_request.target_sector_id = v_actor_sector_id) then
    raise exception 'Sem permissao para aprovar esta solicitacao';
  end if;

  if v_request.status <> 'pending_approval' then
    raise exception 'Solicitacao ja foi processada';
  end if;

  if v_request.generated_task_id is not null then
    return v_request;
  end if;

  insert into public.kanban_tasks (
    title, description, sector_id, sector_name, sector_ref_id, organization_id,
    responsible_id, responsible_name, status, priority, due_date, next_step,
    source_request_id, requester_profile_id, requester_sector_id, created_by
  )
  select
    v_request.title, v_request.description, s.slug, s.name, s.id, v_request.organization_id,
    v_request.responsible_id, v_request.responsible_name, coalesce(v_request.kanban_status, 'todo'),
    coalesce(v_request.priority, 'medium'), v_request.due_date, v_request.step_name,
    v_request.id, v_request.requester_id, v_request.requester_sector_id, v_actor_id
  from public.sectors s
  where s.id = v_request.target_sector_id
  returning id into v_task_id;

  update public.requests
  set status = 'approved', approved_by = v_actor_id, approved_at = now(),
      generated_task_id = v_task_id, updated_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.notifications (user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id)
  values (
    v_request.requester_id, v_request.organization_id, v_actor_id,
    'Solicitacao aprovada',
    'Sua solicitacao "' || v_request.title || '" foi aprovada e virou uma tarefa no Kanban.',
    'Solicitacoes', 'request_approved', 'request', v_request.id
  );

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id, metadata)
  values (v_request.organization_id, v_actor_id, 'request_approved', 'request', v_request.id, jsonb_build_object('generated_task_id', v_task_id));

  return v_request;
end;
$$;
