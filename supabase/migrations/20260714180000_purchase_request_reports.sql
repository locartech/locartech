-- Mirrors public.archived_activity_reports for the "Compras solicitadas" report/drive-link flow.
-- (No cleanup step here: purchase requests are archived through archive_request/restore_request,
-- this table just tracks which report covers which purchase request ids and its Drive link.)

create table if not exists public.purchase_request_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  period_start date,
  period_end date,
  total_exported integer not null default 0,
  exported_request_ids jsonb not null default '[]'::jsonb,
  drive_link text,
  status text not null default 'Pendente de Drive',
  generated_by uuid references public.profiles(id) on delete set null,
  generated_by_name text,
  generated_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.purchase_request_reports add constraint purchase_request_reports_status_check
    check (status in ('Pendente de Drive', 'Salvo no Drive'));
exception when duplicate_object then null;
end $$;

create index if not exists idx_purchase_reports_org on public.purchase_request_reports(organization_id);
create index if not exists idx_purchase_reports_status on public.purchase_request_reports(status);

drop trigger if exists set_updated_at on public.purchase_request_reports;
create trigger set_updated_at before update on public.purchase_request_reports
  for each row execute function public.set_updated_at();

alter table public.purchase_request_reports enable row level security;

drop policy if exists "purchase reports readable by active members" on public.purchase_request_reports;
create policy "purchase reports readable by active members"
  on public.purchase_request_reports for select
  using (public.is_active_profile());

drop policy if exists "purchase reports writable by active members" on public.purchase_request_reports;
create policy "purchase reports writable by active members"
  on public.purchase_request_reports for all
  using (public.is_active_profile())
  with check (public.is_active_profile());

do $$
begin
  alter publication supabase_realtime add table public.purchase_request_reports;
exception when duplicate_object then null;
end $$;
