-- Fixes account registration failing with "null value in column sector" for every
-- sector: fetchSectorIdByName() runs as the signing-up user, but "sectors readable
-- by active members" (using is_active_profile()) always blocks it here, since that
-- profile doesn't exist yet - it's what this call is trying to create. The client
-- was silently getting back a null sector id, which cascaded into a null sector
-- name in this RPC and tripped the NOT NULL constraint on profiles.sector.
-- Fix: resolve the sector by name here instead, inside this SECURITY DEFINER
-- function, which bypasses RLS.
drop function if exists public.create_pending_profile(uuid, text, text, uuid, text);

create or replace function public.create_pending_profile(
  p_auth_user_id uuid,
  p_name text,
  p_email text,
  p_sector_name text,
  p_role text
)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_org_id uuid;
  v_sector_id uuid;
  v_sector_name text;
  v_profile public.profiles;
begin
  if p_auth_user_id is null then
    raise exception 'Usuario de autenticacao invalido';
  end if;

  if exists (select 1 from public.profiles where auth_user_id = p_auth_user_id) then
    raise exception 'Ja existe um perfil para este usuario';
  end if;

  if exists (select 1 from public.profiles where email = lower(trim(p_email))) then
    raise exception 'Ja existe uma conta com este e-mail';
  end if;

  select id into v_org_id from public.organizations limit 1;
  select id, name into v_sector_id, v_sector_name
    from public.sectors where name ilike trim(p_sector_name) limit 1;

  if v_sector_id is null then
    raise exception 'Setor invalido';
  end if;

  insert into public.profiles (
    auth_user_id, organization_id, sector_ref_id, name, email, sector, role, job_title,
    account_type, status, avatar_initials
  )
  values (
    p_auth_user_id, v_org_id, v_sector_id, trim(p_name), lower(trim(p_email)), v_sector_name,
    trim(p_role), trim(p_role), 'member', 'Pendente',
    upper(left(split_part(trim(p_name), ' ', 1), 1) || coalesce(left(split_part(trim(p_name), ' ', 2), 1), ''))
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.create_pending_profile(uuid, text, text, text, text) to anon, authenticated;
