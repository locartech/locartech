-- Keep every organization attached to an active primary administrator. Account
-- deletion and ordinary profile updates cannot bypass the transfer workflow.
create or replace function public.enforce_primary_admin_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.organizations o
    where o.admin_profile_id = old.id
  ) then
    if tg_op = 'DELETE' then
      raise exception 'Transfira a administracao antes de excluir o administrador principal.';
    end if;

    if new.account_type <> 'admin'
      or new.status <> 'Ativo'
      or new.organization_id is distinct from old.organization_id
    then
      raise exception 'O administrador principal deve permanecer ativo. Transfira a administracao primeiro.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_primary_admin_profile on public.profiles;
create trigger enforce_primary_admin_profile
  before update or delete on public.profiles
  for each row execute function public.enforce_primary_admin_profile();

create or replace function public.enforce_organization_admin_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.admin_profile_id is null or not exists (
    select 1 from public.profiles p
    where p.id = new.admin_profile_id
      and p.organization_id = new.id
      and p.account_type = 'admin'
      and p.status = 'Ativo'
  ) then
    raise exception 'A organizacao deve possuir um administrador principal ativo.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_organization_admin_reference on public.organizations;
create trigger enforce_organization_admin_reference
  before insert or update of admin_profile_id on public.organizations
  for each row execute function public.enforce_organization_admin_reference();

create or replace function public.transfer_admin(p_new_admin_profile_id uuid)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_org public.organizations;
  v_new_admin public.profiles;
begin
  if v_actor_id is null or not public.is_active_profile() then
    raise exception 'Usuario nao autenticado ou inativo';
  end if;

  select * into v_org
  from public.organizations
  where admin_profile_id = v_actor_id
  for update;
  if v_org.id is null then
    raise exception 'Apenas o administrador principal pode transferir a administracao';
  end if;

  select * into v_new_admin
  from public.profiles
  where id = p_new_admin_profile_id
    and organization_id = v_org.id
  for update;
  if v_new_admin.id is null or v_new_admin.status <> 'Ativo' or v_new_admin.id = v_actor_id then
    raise exception 'O novo administrador precisa ser outro membro ativo da organizacao';
  end if;

  -- Promote first, repoint the organization, then demote the former admin. This
  -- order guarantees that an active administrator exists throughout the transaction.
  update public.profiles
  set account_type = 'admin', updated_at = now()
  where id = v_new_admin.id;

  update public.organizations
  set admin_profile_id = v_new_admin.id, updated_at = now()
  where id = v_org.id
  returning * into v_org;

  update public.profiles
  set account_type = 'member', updated_at = now()
  where id = v_actor_id;

  insert into public.notifications (
    user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id
  ) values (
    v_new_admin.id, v_org.id, v_actor_id,
    'Administracao transferida',
    'Voce agora e o administrador principal da Locartech.',
    'Administracao', 'admin_transferred', 'organization', v_org.id
  );

  insert into public.audit_logs (
    organization_id, actor_profile_id, action, entity_type, entity_id, metadata
  ) values (
    v_org.id, v_actor_id, 'admin_transferred', 'organization', v_org.id,
    jsonb_build_object('new_admin_profile_id', v_new_admin.id)
  );

  return v_org;
end;
$$;

create or replace function public.delete_member_account(p_profile_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.profiles;
  v_target public.profiles;
  v_target_auth_id uuid;
  v_direct_conversations integer;
begin
  select * into v_actor from public.profiles
  where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin';
  if v_actor.id is null then raise exception 'Apenas administradores podem excluir contas.'; end if;

  select * into v_target from public.profiles where id = p_profile_id for update;
  if v_target.id is null then raise exception 'Conta nao encontrada.'; end if;
  if v_target.organization_id is distinct from v_actor.organization_id then raise exception 'Conta fora da organizacao atual.'; end if;
  if v_target.id = v_actor.id then raise exception 'Voce nao pode excluir a propria conta.'; end if;
  if exists (select 1 from public.organizations where admin_profile_id = v_target.id) then
    raise exception 'Transfira a administracao principal antes de excluir esta conta.';
  end if;
  if v_target.account_type = 'admin' and not exists (
    select 1 from public.profiles p
    where p.organization_id = v_target.organization_id
      and p.id <> v_target.id
      and p.account_type = 'admin'
      and p.status = 'Ativo'
  ) then
    raise exception 'A organizacao deve manter pelo menos um administrador ativo.';
  end if;

  v_target_auth_id := v_target.auth_user_id;

  delete from public.conversations c
  where c.type = 'direct'
    and c.organization_id = v_actor.organization_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.profile_id = v_target.id
    );
  get diagnostics v_direct_conversations = row_count;

  delete from public.notifications where actor_profile_id = v_target.id;
  delete from public.profiles where id = v_target.id;
  if v_target_auth_id is not null then delete from auth.users where id = v_target_auth_id; end if;

  insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id, metadata)
  values (
    v_actor.organization_id, v_actor.id, 'member_account_deleted', 'profile', v_target.id,
    jsonb_build_object('name', v_target.name, 'email', v_target.email, 'direct_conversations_deleted', v_direct_conversations)
  );

  return jsonb_build_object('deleted_profile_id', v_target.id, 'direct_conversations_deleted', v_direct_conversations);
end;
$$;

revoke all on function public.delete_member_account(uuid) from public;
grant execute on function public.delete_member_account(uuid) to authenticated;
revoke all on function public.transfer_admin(uuid) from public;
grant execute on function public.transfer_admin(uuid) to authenticated;
