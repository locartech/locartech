-- A user who can manage the task's sector may permanently delete it,
-- including tasks generated from approved requests. The request record is
-- preserved and its generated_task_id is cleared by the existing FK.
drop trigger if exists prevent_source_task_deletion on public.kanban_tasks;

create or replace function public.audit_kanban_task_deletion()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
begin
  insert into public.audit_logs(
    organization_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    old.organization_id,
    v_actor_id,
    'kanban_task_deleted',
    'kanban_task',
    old.id,
    jsonb_build_object(
      'title', old.title,
      'sector_id', old.sector_id,
      'sector_name', old.sector_name,
      'source_request_id', old.source_request_id,
      'was_archived', old.archived
    )
  );
  return old;
end;
$$;

drop trigger if exists audit_kanban_task_deletion on public.kanban_tasks;
create trigger audit_kanban_task_deletion
  after delete on public.kanban_tasks
  for each row execute function public.audit_kanban_task_deletion();
