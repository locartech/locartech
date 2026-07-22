-- Administrators are managed from each member's action menu. Multiple active
-- administrators are allowed, but the organization can never be left without one.
create or replace function public.protect_admin_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.account_type is distinct from old.account_type
    and auth.role() <> 'service_role'
    and coalesce(current_setting('app.admin_role_change', true), '') <> 'allowed'
  then
    raise exception 'Use a acao de administrador para alterar este acesso.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_admin_role_changes on public.profiles;
create trigger protect_admin_role_changes
  before update of account_type on public.profiles
  for each row execute function public.protect_admin_role_changes();

create or replace function public.set_member_admin_status(p_profile_id uuid, p_make_admin boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.profiles;
  v_target public.profiles;
  v_org public.organizations;
  v_replacement_id uuid;
  v_other_admins integer;
begin
  select * into v_actor
  from public.profiles
  where auth_user_id = auth.uid();
  if v_actor.id is null then raise exception 'Usuario nao autenticado.'; end if;

  select * into v_org
  from public.organizations
  where id = v_actor.organization_id
  for update;

  -- Recheck after locking the organization so concurrent role changes are serialized.
  select * into v_actor
  from public.profiles
  where id = v_actor.id and status = 'Ativo' and account_type = 'admin';
  if v_actor.id is null then raise exception 'Apenas administradores podem alterar este acesso.'; end if;

  select * into v_target
  from public.profiles
  where id = p_profile_id and organization_id = v_org.id
  for update;
  if v_target.id is null then raise exception 'Membro nao encontrado nesta organizacao.'; end if;

  perform set_config('app.admin_role_change', 'allowed', true);

  if p_make_admin then
    if v_target.status <> 'Ativo' then
      raise exception 'Apenas membros ativos podem ser administradores.';
    end if;
    update public.profiles
    set account_type = 'admin', updated_at = now()
    where id = v_target.id
    returning * into v_target;
  else
    if v_target.account_type <> 'admin' then
      return v_target;
    end if;

    select count(*) into v_other_admins
    from public.profiles p
    where p.organization_id = v_org.id
      and p.id <> v_target.id
      and p.account_type = 'admin'
      and p.status = 'Ativo';
    if v_other_admins < 1 then
      raise exception 'O site deve manter pelo menos um administrador ativo.';
    end if;

    if v_org.admin_profile_id = v_target.id then
      select p.id into v_replacement_id
      from public.profiles p
      where p.organization_id = v_org.id
        and p.id <> v_target.id
        and p.account_type = 'admin'
        and p.status = 'Ativo'
      order by case when p.id = v_actor.id then 0 else 1 end, p.joined_at, p.id
      limit 1;

      update public.organizations
      set admin_profile_id = v_replacement_id, updated_at = now()
      where id = v_org.id;
    end if;

    update public.profiles
    set account_type = 'member', updated_at = now()
    where id = v_target.id
    returning * into v_target;
  end if;

  if v_target.id <> v_actor.id then
    insert into public.notifications (
      user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id
    ) values (
      v_target.id, v_org.id, v_actor.id,
      case when p_make_admin then 'Acesso administrativo concedido' else 'Acesso administrativo removido' end,
      case when p_make_admin
        then 'Voce agora possui acesso administrativo na Locartech.'
        else 'Seu acesso administrativo foi removido.'
      end,
      'Administracao',
      case when p_make_admin then 'admin_granted' else 'admin_removed' end,
      'profile', v_target.id
    );
  end if;

  insert into public.audit_logs (
    organization_id, actor_profile_id, action, entity_type, entity_id, metadata
  ) values (
    v_org.id, v_actor.id,
    case when p_make_admin then 'admin_role_granted' else 'admin_role_removed' end,
    'profile', v_target.id,
    jsonb_build_object('member_name', v_target.name, 'primary_admin_id',
      (select admin_profile_id from public.organizations where id = v_org.id))
  );

  return v_target;
end;
$$;

revoke all on function public.set_member_admin_status(uuid, boolean) from public;
grant execute on function public.set_member_admin_status(uuid, boolean) to authenticated;

-- The former transfer endpoint is no longer part of the permission model.
revoke all on function public.transfer_admin(uuid) from authenticated;
