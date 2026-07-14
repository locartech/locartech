-- Adds archiving to `requests` (covers both regular inter-sector requests and purchase
-- requests, since purchase requests are just filtered rows of the same table), plus lets a
-- user delete their own personal notifications ("limpar notificacoes").

alter table public.requests add column if not exists archived boolean not null default false;
alter table public.requests add column if not exists archived_at timestamptz;
alter table public.requests add column if not exists archived_by uuid references public.profiles(id) on delete set null;
alter table public.requests add column if not exists archived_by_name text;

create index if not exists idx_requests_archived on public.requests(archived);

create or replace function public.archive_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_actor_sector_id uuid := public.current_sector_id();
  v_is_admin boolean := public.is_active_admin();
  v_actor_name text;
  v_request public.requests;
begin
  if v_actor_id is null or not public.is_active_profile() then
    raise exception 'Usuario nao autenticado ou inativo';
  end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then
    raise exception 'Solicitacao nao encontrada';
  end if;

  if not (v_is_admin or v_request.requester_id = v_actor_id or v_request.target_sector_id = v_actor_sector_id) then
    raise exception 'Sem permissao para arquivar esta solicitacao';
  end if;

  select name into v_actor_name from public.profiles where id = v_actor_id;

  update public.requests
  set archived = true, archived_at = now(), archived_by = v_actor_id, archived_by_name = v_actor_name, updated_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function public.restore_request(p_request_id uuid)
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

  if not (v_is_admin or v_request.requester_id = v_actor_id or v_request.target_sector_id = v_actor_sector_id) then
    raise exception 'Sem permissao para restaurar esta solicitacao';
  end if;

  update public.requests
  set archived = false, archived_at = null, archived_by = null, archived_by_name = null, updated_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

drop policy if exists "notifications deletable by recipient" on public.notifications;
create policy "notifications deletable by recipient"
  on public.notifications for delete
  using (user_id = public.current_profile_id());
