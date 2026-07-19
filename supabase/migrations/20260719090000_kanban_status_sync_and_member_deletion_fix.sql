-- 1) Notify the original requester when a linked Kanban task changes status,
--    and keep requests.kanban_status mirrored to the task so the Solicitacoes
--    tab reflects real Kanban progress instead of freezing at the initial value.
create or replace function public.sync_kanban_status_to_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_actor_id uuid := public.current_profile_id();
  v_actor_name text;
  v_request public.requests;
  v_status_label text;
begin
  if new.source_request_id is null or new.status is not distinct from old.status then
    return new;
  end if;

  update public.requests
  set kanban_status = new.status, updated_at = now()
  where id = new.source_request_id
  returning * into v_request;

  if v_request.id is null or v_request.requester_id is null or v_request.requester_id = v_actor_id then
    return new;
  end if;

  select name into v_actor_name from public.profiles where id = v_actor_id;

  v_status_label := case new.status
    when 'todo' then 'A fazer'
    when 'doing' then 'Fazendo'
    when 'done' then 'Feito'
    when 'canceled' then 'Cancelado'
    else new.status
  end;

  insert into public.notifications (
    user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id,
    target_sector_name, target_user_name
  ) values (
    v_request.requester_id, v_request.organization_id, v_actor_id,
    'Atividade atualizada',
    coalesce(v_actor_name, 'Alguem') || ' alterou o status de "' || new.title || '" para ' || v_status_label || '.',
    'Solicitacoes', 'kanban_status_changed', 'kanban_task', new.id,
    new.sector_name, v_request.requester_name
  );

  return new;
end;
$$;

revoke all on function public.sync_kanban_status_to_request() from public;

drop trigger if exists trg_sync_kanban_status_to_request on public.kanban_tasks;
create trigger trg_sync_kanban_status_to_request
  after update of status on public.kanban_tasks
  for each row execute function public.sync_kanban_status_to_request();

-- 2) Fix member deletion: Supabase Storage does not allow direct SQL DELETE
--    against storage.objects ("Direct deletion from storage tables is not
--    allowed. Use the Storage API instead."). Drop that block; avatar files
--    for deleted accounts are simply left orphaned in the bucket, which is a
--    low-cost tradeoff versus blocking account deletion entirely.
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
$$;

revoke all on function public.delete_member_account(uuid) from public;
grant execute on function public.delete_member_account(uuid) to authenticated;
