-- Remove impossible legacy dates that can crash browser date formatters, then prevent
-- malformed operational deadlines from being stored again.
update public.kanban_tasks
set due_date = null,
    updated_at = now()
where due_date < date '1900-01-01'
   or due_date > date '2100-12-31';

alter table public.kanban_tasks
  drop constraint if exists kanban_tasks_due_date_operational_range;

alter table public.kanban_tasks
  add constraint kanban_tasks_due_date_operational_range
  check (due_date is null or due_date between date '1900-01-01' and date '2100-12-31');
