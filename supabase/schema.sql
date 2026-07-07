create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  sector text not null,
  role text not null,
  account_type text not null default 'member' check (account_type in ('admin', 'member')),
  status text not null default 'Pendente' check (status in ('Ativo', 'Inativo', 'Pendente', 'Rejeitado')),
  avatar_initials text not null default 'LT',
  photo_url text,
  joined_at date not null default current_date,
  last_access timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  title text not null,
  description text default '',
  sector text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  category text not null default 'Geral',
  target_sector_name text,
  target_user_name text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.kanban_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  sector_id text not null,
  sector_name text not null,
  responsible_id uuid references public.profiles(id) on delete set null,
  responsible_name text,
  status text not null default 'todo',
  priority text default 'media',
  due_date date,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  from_sector text not null,
  to_sector text not null,
  requester_id uuid references public.profiles(id) on delete set null,
  requester_name text,
  responsible_id uuid references public.profiles(id) on delete set null,
  responsible_name text,
  status text not null default 'Pendente',
  priority text not null default 'Media',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_records (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  title text not null,
  description text not null,
  type text not null,
  responsible_id uuid references public.profiles(id) on delete set null,
  responsible text not null,
  published_at date not null,
  drive_link text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.kanban_tasks enable row level security;
alter table public.requests enable row level security;
alter table public.knowledge_records enable row level security;

drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by authenticated users"
  on public.profiles for select
  using (true);

drop policy if exists "profiles insertable during signup" on public.profiles;
create policy "profiles insertable during signup"
  on public.profiles for insert
  with check (true);

drop policy if exists "profiles editable by admins or self" on public.profiles;
create policy "profiles editable by admins or self"
  on public.profiles for update
  using (
    auth.uid() = auth_user_id
    or exists (
      select 1 from public.profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.account_type = 'admin'
        and admin_profile.status = 'Ativo'
    )
  );

drop policy if exists "conversations readable by participants" on public.conversations;
create policy "conversations readable by participants"
  on public.conversations for select
  using (auth.uid() is not null);

drop policy if exists "conversations insertable by authenticated users" on public.conversations;
create policy "conversations insertable by authenticated users"
  on public.conversations for insert
  with check (auth.uid() is not null);

drop policy if exists "participants readable by participants" on public.conversation_participants;
create policy "participants readable by participants"
  on public.conversation_participants for select
  using (auth.uid() is not null);

drop policy if exists "participants insertable by authenticated users" on public.conversation_participants;
create policy "participants insertable by authenticated users"
  on public.conversation_participants for insert
  with check (auth.uid() is not null);

drop policy if exists "participants editable by self" on public.conversation_participants;
create policy "participants editable by self"
  on public.conversation_participants for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = conversation_participants.profile_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "messages readable by participants" on public.messages;
create policy "messages readable by participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profile_id
      where cp.conversation_id = messages.conversation_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "messages insertable by participants" on public.messages;
create policy "messages insertable by participants"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.profiles p
      join public.conversation_participants cp on cp.profile_id = p.id
      where p.auth_user_id = auth.uid()
        and cp.conversation_id = messages.conversation_id
        and p.id = messages.sender_id
    )
  );

drop policy if exists "notifications readable by recipient" on public.notifications;
create policy "notifications readable by recipient"
  on public.notifications for select
  using (
    user_id is null
    or exists (
      select 1 from public.profiles p
      where p.id = notifications.user_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "notifications insertable by authenticated users" on public.notifications;
create policy "notifications insertable by authenticated users"
  on public.notifications for insert
  with check (auth.uid() is not null);

drop policy if exists "notifications editable by recipient" on public.notifications;
create policy "notifications editable by recipient"
  on public.notifications for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = notifications.user_id
        and p.auth_user_id = auth.uid()
    )
  );

drop policy if exists "kanban readable by authenticated users" on public.kanban_tasks;
create policy "kanban readable by authenticated users" on public.kanban_tasks for select using (auth.uid() is not null);
drop policy if exists "kanban writable by authenticated users" on public.kanban_tasks;
create policy "kanban writable by authenticated users" on public.kanban_tasks for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "requests readable by authenticated users" on public.requests;
create policy "requests readable by authenticated users" on public.requests for select using (auth.uid() is not null);
drop policy if exists "requests writable by authenticated users" on public.requests;
create policy "requests writable by authenticated users" on public.requests for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "knowledge readable by authenticated users" on public.knowledge_records;
create policy "knowledge readable by authenticated users" on public.knowledge_records for select using (auth.uid() is not null);
drop policy if exists "knowledge writable by authenticated users" on public.knowledge_records;
create policy "knowledge writable by authenticated users" on public.knowledge_records for all using (auth.uid() is not null) with check (auth.uid() is not null);

alter table public.profiles replica identity full;
alter table public.conversations replica identity full;
alter table public.conversation_participants replica identity full;
alter table public.messages replica identity full;
alter table public.notifications replica identity full;
alter table public.kanban_tasks replica identity full;
alter table public.requests replica identity full;
alter table public.knowledge_records replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversation_participants;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.kanban_tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.requests;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.knowledge_records;
exception when duplicate_object then null;
end $$;
