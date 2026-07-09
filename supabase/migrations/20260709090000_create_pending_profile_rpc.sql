-- Fixes account registration hanging forever: supabase.auth.signUp() does not return an
-- active session when email confirmation is required, so the client has no auth.uid() yet
-- for the "profiles insertable during signup" RLS check (auth_user_id = auth.uid()) to pass.
-- This RPC creates the pending profile server-side instead of a direct table insert, so
-- registration works regardless of the project's email-confirmation setting. The existing
-- confirm_profile_auth_user trigger (fires on insert of profiles) still auto-confirms the
-- new auth user's email, so they can log in right after this call succeeds.

create or replace function public.create_pending_profile(
  p_auth_user_id uuid,
  p_name text,
  p_email text,
  p_sector_id uuid,
  p_role text
)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  v_org_id uuid;
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
  select name into v_sector_name from public.sectors where id = p_sector_id;

  insert into public.profiles (
    auth_user_id, organization_id, sector_ref_id, name, email, sector, role, job_title,
    account_type, status, avatar_initials
  )
  values (
    p_auth_user_id, v_org_id, p_sector_id, trim(p_name), lower(trim(p_email)), v_sector_name,
    trim(p_role), trim(p_role), 'member', 'Pendente',
    upper(left(split_part(trim(p_name), ' ', 1), 1) || coalesce(left(split_part(trim(p_name), ' ', 2), 1), ''))
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.create_pending_profile(uuid, text, text, uuid, text) to anon, authenticated;
