-- Adds archiving support to kanban_tasks: archived activities leave the open board but
-- stay in the database (never deleted) with a record of who archived them and when.

alter table public.kanban_tasks add column if not exists archived boolean not null default false;
alter table public.kanban_tasks add column if not exists archived_at timestamptz;
alter table public.kanban_tasks add column if not exists archived_by uuid references public.profiles(id) on delete set null;
alter table public.kanban_tasks add column if not exists archived_by_name text;

create index if not exists idx_kanban_tasks_archived on public.kanban_tasks(archived);
