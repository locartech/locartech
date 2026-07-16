do $migration$
begin
  execute $definition$
    create or replace function public.delete_archived_kanban_history(p_task_ids uuid[])
    returns integer
    language plpgsql
    security definer
    set search_path = public
    as $function$
    declare
      v_actor public.profiles;
      v_deleted integer;
    begin
      select * into v_actor from public.profiles
      where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin';
      if v_actor.id is null then raise exception 'Apenas administradores podem excluir historicos.'; end if;

      delete from public.kanban_tasks
      where id = any(coalesce(p_task_ids, array[]::uuid[]))
        and archived = true
        and organization_id = v_actor.organization_id;
      get diagnostics v_deleted = row_count;

      insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, metadata)
      values (v_actor.organization_id, v_actor.id, 'archived_history_deleted', 'kanban_task', jsonb_build_object('deleted_count', v_deleted, 'ids', p_task_ids));
      return v_deleted;
    end;
    $function$
  $definition$;

  execute $definition$
    create or replace function public.delete_archived_request_history(p_request_ids uuid[])
    returns integer
    language plpgsql
    security definer
    set search_path = public
    as $function$
    declare
      v_actor public.profiles;
      v_deleted integer;
    begin
      select * into v_actor from public.profiles
      where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin';
      if v_actor.id is null then raise exception 'Apenas administradores podem excluir historicos.'; end if;

      delete from public.requests
      where id = any(coalesce(p_request_ids, array[]::uuid[]))
        and archived = true
        and organization_id = v_actor.organization_id;
      get diagnostics v_deleted = row_count;

      insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, metadata)
      values (v_actor.organization_id, v_actor.id, 'archived_history_deleted', 'request', jsonb_build_object('deleted_count', v_deleted, 'ids', p_request_ids));
      return v_deleted;
    end;
    $function$
  $definition$;

  execute $definition$
    create or replace function public.delete_member_account(p_profile_id uuid)
    returns jsonb
    language plpgsql
    security definer
    set search_path = public, auth, storage
    as $function$
    declare
      v_actor public.profiles;
      v_target public.profiles;
      v_target_auth_id uuid;
      v_direct_conversations integer;
    begin
      select * into v_actor from public.profiles
      where auth_user_id = auth.uid() and status = 'Ativo' and account_type = 'admin';
      if v_actor.id is null then raise exception 'Apenas administradores podem excluir contas.'; end if;

      select * into v_target from public.profiles where id = p_profile_id;
      if v_target.id is null then raise exception 'Conta nao encontrada.'; end if;
      if v_target.organization_id is distinct from v_actor.organization_id then raise exception 'Conta fora da organizacao atual.'; end if;
      if v_target.id = v_actor.id then raise exception 'Voce nao pode excluir a propria conta.'; end if;
      if exists (select 1 from public.organizations where admin_profile_id = v_target.id) then
        raise exception 'Transfira a administracao principal antes de excluir esta conta.';
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
      delete from storage.objects
      where bucket_id = 'avatars'
        and v_target_auth_id is not null
        and (storage.foldername(name))[1] = v_target_auth_id::text;

      delete from public.profiles where id = v_target.id;
      if v_target_auth_id is not null then delete from auth.users where id = v_target_auth_id; end if;

      insert into public.audit_logs (organization_id, actor_profile_id, action, entity_type, entity_id, metadata)
      values (
        v_actor.organization_id,
        v_actor.id,
        'member_account_deleted',
        'profile',
        v_target.id,
        jsonb_build_object('name', v_target.name, 'email', v_target.email, 'direct_conversations_deleted', v_direct_conversations)
      );

      return jsonb_build_object('deleted_profile_id', v_target.id, 'direct_conversations_deleted', v_direct_conversations);
    end;
    $function$
  $definition$;

  revoke all on function public.delete_archived_kanban_history(uuid[]) from public;
  revoke all on function public.delete_archived_request_history(uuid[]) from public;
  revoke all on function public.delete_member_account(uuid) from public;
  grant execute on function public.delete_archived_kanban_history(uuid[]) to authenticated;
  grant execute on function public.delete_archived_request_history(uuid[]) to authenticated;
  grant execute on function public.delete_member_account(uuid) to authenticated;
end
$migration$;
