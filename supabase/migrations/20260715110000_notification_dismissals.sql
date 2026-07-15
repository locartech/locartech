-- Keeps notification cleanup private to each account. Sector notifications are shared rows,
-- so deleting them directly would also remove them for other members of the same sector.

do $$
begin
create table if not exists public.notification_dismissals (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists idx_notification_dismissals_user
  on public.notification_dismissals(user_id);

alter table public.notification_dismissals enable row level security;

drop policy if exists "notification dismissals readable by owner" on public.notification_dismissals;
create policy "notification dismissals readable by owner"
  on public.notification_dismissals for select
  using (user_id = public.current_profile_id());

drop policy if exists "notification dismissals insertable by owner" on public.notification_dismissals;
create policy "notification dismissals insertable by owner"
  on public.notification_dismissals for insert
  with check (user_id = public.current_profile_id());

drop policy if exists "notification dismissals deletable by owner" on public.notification_dismissals;
create policy "notification dismissals deletable by owner"
  on public.notification_dismissals for delete
  using (user_id = public.current_profile_id());

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notification_dismissals'
  ) then
    alter publication supabase_realtime add table public.notification_dismissals;
  end if;
end $$;
