-- Locartech: organizations, sectors, request/kanban workflow, audit log, storage, RPCs, RLS.
-- Additive migration: evolves the existing live schema (see supabase/schema.sql) instead of
-- replacing it, so existing data and in-flight frontend code keep working.

create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. organizations
-- =========================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  admin_profile_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.organizations (name, slug)
select 'Locartech', 'locartech'
where not exists (select 1 from public.organizations where slug = 'locartech');

-- =========================================================================
-- 2. sectors
-- =========================================================================
create table if not exists public.sectors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  initial_manager_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

insert into public.sectors (organization_id, slug, name, description, initial_manager_name)
select o.id, v.slug, v.name, v.description, v.manager
from public.organizations o
cross join (
  values
    ('compras', 'Compras', 'Centraliza compras, fornecedores e aquisicoes internas.', 'Marina Costa'),
    ('contabilidade', 'Contabilidade', 'Organiza documentos contabeis, conferencias e fechamentos.', 'Patricia Gomes'),
    ('financeiro', 'Financeiro', 'Acompanha pagamentos, recebimentos e controles financeiros.', 'Lucas Almeida'),
    ('frotas', 'Frotas', 'Gerencia veiculos, manutencoes e disponibilidade operacional.', 'Bruno Teixeira'),
    ('planejamento', 'Planejamento', 'Acompanha capacidade, prioridades e previsoes de demanda.', 'Clara Ribeiro'),
    ('recursos-humanos', 'Recursos Humanos', 'Cuida de pessoas, documentacao interna e desenvolvimento.', 'Juliana Freitas')
) as v(slug, name, description, manager)
where o.slug = 'locartech'
  and not exists (
    select 1 from public.sectors s where s.organization_id = o.id and s.slug = v.slug
  );

-- =========================================================================
-- 3. Extend existing tables (additive columns only)
-- =========================================================================
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.profiles add column if not exists sector_ref_id uuid references public.sectors(id);
alter table public.profiles add column if not exists job_title text;

alter table public.kanban_tasks add column if not exists organization_id uuid references public.organizations(id);
alter table public.kanban_tasks add column if not exists sector_ref_id uuid references public.sectors(id);
alter table public.kanban_tasks add column if not exists source_request_id uuid;
alter table public.kanban_tasks add column if not exists requester_profile_id uuid references public.profiles(id) on delete set null;
alter table public.kanban_tasks add column if not exists requester_sector_id uuid references public.sectors(id);
alter table public.kanban_tasks add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.requests add column if not exists organization_id uuid references public.organizations(id);
alter table public.requests add column if not exists requester_sector_id uuid references public.sectors(id);
alter table public.requests add column if not exists target_sector_id uuid references public.sectors(id);
alter table public.requests add column if not exists step_name text;
alter table public.requests add column if not exists approved_by uuid references public.profiles(id) on delete set null;
alter table public.requests add column if not exists approved_at timestamptz;
alter table public.requests add column if not exists rejected_by uuid references public.profiles(id) on delete set null;
alter table public.requests add column if not exists rejected_at timestamptz;
alter table public.requests add column if not exists rejection_reason text;
alter table public.requests add column if not exists cancelled_at timestamptz;
alter table public.requests add column if not exists generated_task_id uuid references public.kanban_tasks(id) on delete set null;

alter table public.knowledge_records add column if not exists organization_id uuid references public.organizations(id);
alter table public.knowledge_records add column if not exists sector_ref_id uuid references public.sectors(id);

alter table public.conversations add column if not exists organization_id uuid references public.organizations(id);
alter table public.conversations add column if not exists sector_ref_id uuid references public.sectors(id);

alter table public.notifications add column if not exists organization_id uuid references public.organizations(id);
alter table public.notifications add column if not exists recipient_sector_id uuid references public.sectors(id);
alter table public.notifications add column if not exists actor_profile_id uuid references public.profiles(id) on delete set null;
alter table public.notifications add column if not exists type text;
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id uuid;

-- kanban_tasks.source_request_id -> requests.id (added after both tables exist)
do $$
begin
  alter table public.kanban_tasks
    add constraint kanban_tasks_source_request_id_fkey
    foreign key (source_request_id) references public.requests(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- =========================================================================
-- 4. Backfill organization_id and sector references on existing rows
-- =========================================================================
update public.profiles set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and profiles.organization_id is null;

update public.kanban_tasks set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and kanban_tasks.organization_id is null;

update public.requests set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and requests.organization_id is null;

update public.knowledge_records set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and knowledge_records.organization_id is null;

update public.conversations set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and conversations.organization_id is null;

update public.notifications set organization_id = o.id
from public.organizations o where o.slug = 'locartech' and notifications.organization_id is null;

-- profiles.sector holds the display name (e.g. 'Compras')
update public.profiles p set sector_ref_id = s.id
from public.sectors s
where p.sector_ref_id is null and lower(trim(p.sector)) = lower(s.name);

-- kanban_tasks.sector_id holds the slug (e.g. 'compras')
update public.kanban_tasks k set sector_ref_id = s.id
from public.sectors s
where k.sector_ref_id is null and lower(trim(k.sector_id)) = lower(s.slug);

-- requests.from_sector / to_sector hold display names
update public.requests r set requester_sector_id = s.id
from public.sectors s
where r.requester_sector_id is null and lower(trim(r.from_sector)) = lower(s.name);

update public.requests r set target_sector_id = s.id
from public.sectors s
where r.target_sector_id is null and lower(trim(r.to_sector)) = lower(s.name);

update public.knowledge_records kr set sector_ref_id = s.id
from public.sectors s
where kr.sector_ref_id is null and lower(trim(kr.sector)) = lower(s.name);

update public.conversations c set sector_ref_id = s.id
from public.sectors s
where c.sector_ref_id is null and c.sector is not null and lower(trim(c.sector)) = lower(s.name);

-- Primary admin bootstrap: earliest active admin profile becomes organizations.admin_profile_id
update public.organizations o
set admin_profile_id = p.id
from (
  select id, organization_id from public.profiles
  where account_type = 'admin' and status = 'Ativo'
  order by created_at asc
  limit 1
) p
where o.slug = 'locartech' and o.admin_profile_id is null and p.organization_id = o.id;

-- =========================================================================
-- 5. Normalize status/priority vocabularies before adding check constraints
-- =========================================================================
update public.requests set status = case status
  when 'Pendente' then 'pending_approval'
  when 'pending' then 'pending_approval'
  when 'Aprovada' then 'approved'
  when 'Recusada' then 'rejected'
  when 'Cancelada' then 'canceled'
  when 'cancelled' then 'canceled'
  else status
end
where status not in ('pending_approval', 'approved', 'rejected', 'canceled');

update public.requests set priority = case lower(coalesce(priority, 'media'))
  when 'baixa' then 'low'
  when 'media' then 'medium'
  when 'alta' then 'high'
  when 'urgente' then 'urgent'
  else lower(priority)
end
where priority is null or lower(priority) not in ('low', 'medium', 'high', 'urgent');

update public.kanban_tasks set status = case status
  when 'cancelled' then 'canceled'
  when 'in_progress' then 'doing'
  when 'waiting' then 'todo'
  else status
end
where status not in ('todo', 'doing', 'done', 'canceled');

update public.kanban_tasks set priority = case lower(coalesce(priority, 'media'))
  when 'baixa' then 'low'
  when 'media' then 'medium'
  when 'alta' then 'high'
  when 'urgente' then 'urgent'
  else lower(priority)
end
where priority is null or lower(priority) not in ('low', 'medium', 'high', 'urgent');

alter table public.requests alter column status set default 'pending_approval';
alter table public.requests alter column priority set default 'medium';
alter table public.kanban_tasks alter column status set default 'todo';
alter table public.kanban_tasks alter column priority set default 'medium';

do $$
begin
  alter table public.requests add constraint requests_status_check
    check (status in ('pending_approval', 'approved', 'rejected', 'canceled'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.requests add constraint requests_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.kanban_tasks add constraint kanban_tasks_status_check
    check (status in ('todo', 'doing', 'done', 'canceled'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.kanban_tasks add constraint kanban_tasks_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent'));
exception when duplicate_object then null;
end $$;

-- =========================================================================
-- 6. audit_logs
-- =========================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 7. Indexes
-- =========================================================================
create index if not exists idx_profiles_organization on public.profiles(organization_id);
create index if not exists idx_profiles_sector on public.profiles(sector_ref_id);
create index if not exists idx_profiles_status on public.profiles(status);

create index if not exists idx_kanban_tasks_sector on public.kanban_tasks(sector_ref_id);
create index if not exists idx_kanban_tasks_status on public.kanban_tasks(status);
create index if not exists idx_kanban_tasks_source_request on public.kanban_tasks(source_request_id);

create index if not exists idx_requests_requester on public.requests(requester_id);
create index if not exists idx_requests_target_sector on public.requests(target_sector_id);
create index if not exists idx_requests_requester_sector on public.requests(requester_sector_id);
create index if not exists idx_requests_status on public.requests(status);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_sector on public.notifications(recipient_sector_id);
create index if not exists idx_notifications_read on public.notifications(read);

create index if not exists idx_knowledge_sector on public.knowledge_records(sector_ref_id);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_conversation_participants_profile on public.conversation_participants(profile_id);

create index if not exists idx_audit_logs_org on public.audit_logs(organization_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_profile_id);

-- =========================================================================
-- 8. updated_at trigger helper
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'conversations', 'kanban_tasks', 'requests', 'knowledge_records', 'organizations', 'sectors']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;

-- =========================================================================
-- 9. Auth helper functions (security definer, used by RLS + RPCs)
-- =========================================================================
create or replace function public.current_profile_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.current_sector_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select sector_ref_id from public.profiles where auth_user_id = auth.uid();
$$;

create or replace function public.is_active_profile()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where auth_user_id = auth.uid() and status = 'Ativo'
  );
$$;

create or replace function public.is_active_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin'
  );
$$;

-- =========================================================================
-- 10. RPCs
-- =========================================================================
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
    v_request.responsible_id, v_request.responsible_name, 'todo', coalesce(v_request.priority, 'medium'),
    v_request.due_date, v_request.step_name,
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

create or replace function public.reject_request(p_request_id uuid, p_reason text default null)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_actor_sector_id uuid := public.current_sector_id();
  v_is_admin boolean := public.is_active_admin();
  v_request public.requests;
begin
  if v_actor_id is null or not public.is_active_profile() then
    raise exception 'Usuario nao autenticado ou inativo';
  end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception 'Solicitacao nao encontrada';
  end if;

  if not (v_is_admin or v_request.target_sector_id = v_actor_sector_id) then
    raise exception 'Sem permissao para recusar esta solicitacao';
  end if;

  if v_request.status <> 'pending_approval' then
    raise exception 'Solicitacao ja foi processada';
  end if;

  update public.requests
  set status = 'rejected', rejected_by = v_actor_id, rejected_at = now(),
      rejection_reason = p_reason, updated_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.notifications (user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id)
  values (
    v_request.requester_id, v_request.organization_id, v_actor_id,
    'Solicitacao recusada',
    'Sua solicitacao "' || v_request.title || '" foi recusada.' ||
      case when p_reason is not null and p_reason <> '' then ' Motivo: ' || p_reason else '' end,
    'Solicitacoes', 'request_rejected', 'request', v_request.id
  );

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id, metadata)
  values (v_request.organization_id, v_actor_id, 'request_rejected', 'request', v_request.id, jsonb_build_object('reason', p_reason));

  return v_request;
end;
$$;

create or replace function public.transfer_admin(p_new_admin_profile_id uuid)
returns public.organizations
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_org public.organizations;
  v_new_admin public.profiles;
begin
  if v_actor_id is null or not public.is_active_profile() then
    raise exception 'Usuario nao autenticado ou inativo';
  end if;

  select * into v_org from public.organizations limit 1;
  if v_org.admin_profile_id is distinct from v_actor_id then
    raise exception 'Apenas o administrador principal pode transferir a administracao';
  end if;

  select * into v_new_admin from public.profiles where id = p_new_admin_profile_id;
  if v_new_admin.id is null or v_new_admin.status <> 'Ativo' then
    raise exception 'O novo administrador precisa estar com status Ativo';
  end if;

  update public.organizations set admin_profile_id = p_new_admin_profile_id, updated_at = now()
  where id = v_org.id
  returning * into v_org;

  update public.profiles set account_type = 'admin', updated_at = now() where id = p_new_admin_profile_id;

  insert into public.notifications (user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id)
  values (
    p_new_admin_profile_id, v_org.id, v_actor_id,
    'Administracao transferida',
    'Voce agora e o administrador principal da Locartech.',
    'Administracao', 'admin_transferred', 'organization', v_org.id
  );

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id, metadata)
  values (v_org.id, v_actor_id, 'admin_transferred', 'organization', v_org.id, jsonb_build_object('new_admin_profile_id', p_new_admin_profile_id));

  return v_org;
end;
$$;

create or replace function public.approve_member(p_profile_id uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_profile public.profiles;
begin
  if not public.is_active_admin() then
    raise exception 'Apenas administradores podem aprovar membros';
  end if;

  update public.profiles set status = 'Ativo', updated_at = now()
  where id = p_profile_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Membro nao encontrado';
  end if;

  insert into public.notifications (user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id)
  values (
    p_profile_id, v_profile.organization_id, v_actor_id,
    'Conta aprovada', 'Sua conta foi aprovada. Voce ja pode acessar o sistema.',
    'Membros', 'member_approved', 'profile', p_profile_id
  );

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id)
  values (v_profile.organization_id, v_actor_id, 'member_approved', 'profile', p_profile_id);

  return v_profile;
end;
$$;

create or replace function public.reject_member(p_profile_id uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_profile public.profiles;
begin
  if not public.is_active_admin() then
    raise exception 'Apenas administradores podem recusar membros';
  end if;

  update public.profiles set status = 'Rejeitado', updated_at = now()
  where id = p_profile_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Membro nao encontrado';
  end if;

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id)
  values (v_profile.organization_id, v_actor_id, 'member_rejected', 'profile', p_profile_id);

  return v_profile;
end;
$$;

create or replace function public.deactivate_member(p_profile_id uuid)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_org public.organizations;
  v_profile public.profiles;
begin
  if not public.is_active_admin() then
    raise exception 'Apenas administradores podem desativar membros';
  end if;

  select * into v_org from public.organizations limit 1;
  if v_org.admin_profile_id = p_profile_id then
    raise exception 'Transfira a administracao antes de desativar o administrador principal';
  end if;

  update public.profiles set status = 'Inativo', updated_at = now()
  where id = p_profile_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Membro nao encontrado';
  end if;

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id)
  values (v_profile.organization_id, v_actor_id, 'member_deactivated', 'profile', p_profile_id);

  return v_profile;
end;
$$;

-- =========================================================================
-- 11. Storage: avatars bucket
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================================================================
-- 12. Row Level Security
-- =========================================================================
alter table public.organizations enable row level security;
alter table public.sectors enable row level security;
alter table public.audit_logs enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.kanban_tasks enable row level security;
alter table public.requests enable row level security;
alter table public.knowledge_records enable row level security;

-- organizations: readable by active members, no direct writes (RPC only)
drop policy if exists "organizations readable by active members" on public.organizations;
create policy "organizations readable by active members"
  on public.organizations for select
  using (public.is_active_profile());

-- sectors: readable by active members, writable by admins only
drop policy if exists "sectors readable by active members" on public.sectors;
create policy "sectors readable by active members"
  on public.sectors for select
  using (public.is_active_profile());

drop policy if exists "sectors writable by admins" on public.sectors;
create policy "sectors writable by admins"
  on public.sectors for all
  using (public.is_active_admin())
  with check (public.is_active_admin());

-- audit_logs: readable by admins only, no direct insert (RPCs use security definer)
drop policy if exists "audit logs readable by admins" on public.audit_logs;
create policy "audit logs readable by admins"
  on public.audit_logs for select
  using (public.is_active_admin());

-- profiles: self, active members, or admins (admins also see pending/inactive/rejected)
drop policy if exists "profiles readable by authenticated users" on public.profiles;
drop policy if exists "profiles readable by self active or admin" on public.profiles;
create policy "profiles readable by self active or admin"
  on public.profiles for select
  using (
    auth_user_id = auth.uid()
    or public.is_active_profile()
    or public.is_active_admin()
  );

drop policy if exists "profiles insertable during signup" on public.profiles;
create policy "profiles insertable during signup"
  on public.profiles for insert
  with check (auth_user_id = auth.uid());

drop policy if exists "profiles editable by admins or self" on public.profiles;
create policy "profiles editable by admins or self"
  on public.profiles for update
  using (auth_user_id = auth.uid() or public.is_active_admin());

-- conversations / participants / messages: only participants (or the creator) can see them
drop policy if exists "conversations readable by participants" on public.conversations;
create policy "conversations readable by participants"
  on public.conversations for select
  using (
    created_by = public.current_profile_id()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.profile_id = public.current_profile_id()
    )
  );

drop policy if exists "conversations insertable by authenticated users" on public.conversations;
create policy "conversations insertable by authenticated users"
  on public.conversations for insert
  with check (public.is_active_profile());

drop policy if exists "participants readable by participants" on public.conversation_participants;
create policy "participants readable by participants"
  on public.conversation_participants for select
  using (
    profile_id = public.current_profile_id()
    or exists (
      select 1 from public.conversation_participants cp2
      where cp2.conversation_id = conversation_participants.conversation_id
        and cp2.profile_id = public.current_profile_id()
    )
  );

drop policy if exists "participants insertable by authenticated users" on public.conversation_participants;
create policy "participants insertable by authenticated users"
  on public.conversation_participants for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_participants.conversation_id
        and (
          c.created_by = public.current_profile_id()
          or exists (
            select 1 from public.conversation_participants cp2
            where cp2.conversation_id = c.id and cp2.profile_id = public.current_profile_id()
          )
        )
    )
  );

drop policy if exists "participants editable by self" on public.conversation_participants;
create policy "participants editable by self"
  on public.conversation_participants for update
  using (profile_id = public.current_profile_id());

drop policy if exists "messages readable by participants" on public.messages;
create policy "messages readable by participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.profile_id = public.current_profile_id()
    )
  );

drop policy if exists "messages insertable by participants" on public.messages;
create policy "messages insertable by participants"
  on public.messages for insert
  with check (
    sender_id = public.current_profile_id()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.profile_id = public.current_profile_id()
    )
  );

-- notifications: recipient (user or sector) can read/mark read
drop policy if exists "notifications readable by recipient" on public.notifications;
create policy "notifications readable by recipient"
  on public.notifications for select
  using (
    user_id is null
    or user_id = public.current_profile_id()
    or recipient_sector_id = public.current_sector_id()
    or public.is_active_admin()
  );

drop policy if exists "notifications insertable by authenticated users" on public.notifications;
create policy "notifications insertable by authenticated users"
  on public.notifications for insert
  with check (public.is_active_profile());

drop policy if exists "notifications editable by recipient" on public.notifications;
create policy "notifications editable by recipient"
  on public.notifications for update
  using (
    user_id = public.current_profile_id()
    or recipient_sector_id = public.current_sector_id()
    or public.is_active_admin()
  );

-- kanban_tasks: visible/editable by any active member of the organization
drop policy if exists "kanban readable by authenticated users" on public.kanban_tasks;
create policy "kanban readable by active members"
  on public.kanban_tasks for select
  using (public.is_active_profile());

drop policy if exists "kanban writable by authenticated users" on public.kanban_tasks;
create policy "kanban writable by active members"
  on public.kanban_tasks for all
  using (public.is_active_profile())
  with check (public.is_active_profile());

-- requests: requester or target-sector/admin can read; only requester can write directly
-- (approve/reject transitions are RPC-only, via security definer functions above)
drop policy if exists "requests readable by authenticated users" on public.requests;
create policy "requests readable by requester target sector or admin"
  on public.requests for select
  using (
    requester_id = public.current_profile_id()
    or target_sector_id = public.current_sector_id()
    or public.is_active_admin()
  );

drop policy if exists "requests writable by authenticated users" on public.requests;
create policy "requests insertable by requester"
  on public.requests for insert
  with check (requester_id = public.current_profile_id() and public.is_active_profile());

drop policy if exists "requests editable by requester while pending" on public.requests;
create policy "requests editable by requester while pending"
  on public.requests for update
  using (requester_id = public.current_profile_id() and status = 'pending_approval');

-- knowledge_records: readable/writable by active members
drop policy if exists "knowledge readable by authenticated users" on public.knowledge_records;
create policy "knowledge readable by active members"
  on public.knowledge_records for select
  using (public.is_active_profile());

drop policy if exists "knowledge writable by authenticated users" on public.knowledge_records;
create policy "knowledge writable by active members"
  on public.knowledge_records for all
  using (public.is_active_profile())
  with check (public.is_active_profile());

-- =========================================================================
-- 13. Realtime publication (existing tables already added in schema.sql)
-- =========================================================================
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
