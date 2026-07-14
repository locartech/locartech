-- Reports of exported/archived Kanban activities, so archived rows can eventually be
-- cleaned up without losing the record of what was exported (the CSV + Drive link is the
-- permanent record; this table just tracks which report covers which task ids).

create table if not exists public.archived_activity_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  period_start date,
  period_end date,
  total_exported integer not null default 0,
  exported_task_ids jsonb not null default '[]'::jsonb,
  drive_link text,
  status text not null default 'Pendente de Drive',
  generated_by uuid references public.profiles(id) on delete set null,
  generated_by_name text,
  generated_at timestamptz not null default now(),
  cleaned_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.archived_activity_reports add constraint archived_activity_reports_status_check
    check (status in ('Pendente de Drive', 'Salvo no Drive', 'Limpeza realizada'));
exception when duplicate_object then null;
end $$;

create index if not exists idx_archived_reports_org on public.archived_activity_reports(organization_id);
create index if not exists idx_archived_reports_status on public.archived_activity_reports(status);

drop trigger if exists set_updated_at on public.archived_activity_reports;
create trigger set_updated_at before update on public.archived_activity_reports
  for each row execute function public.set_updated_at();

alter table public.archived_activity_reports enable row level security;

drop policy if exists "archived reports readable by active members" on public.archived_activity_reports;
create policy "archived reports readable by active members"
  on public.archived_activity_reports for select
  using (public.is_active_profile());

drop policy if exists "archived reports writable by active members" on public.archived_activity_reports;
create policy "archived reports writable by active members"
  on public.archived_activity_reports for all
  using (public.is_active_profile())
  with check (public.is_active_profile());

do $$
begin
  alter publication supabase_realtime add table public.archived_activity_reports;
exception when duplicate_object then null;
end $$;
