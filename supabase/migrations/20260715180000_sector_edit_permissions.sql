-- Active members can read shared operational data, but may only mutate records
-- owned by their sector. Active admins retain unrestricted management access.
do $migration$
begin
  alter table public.archived_activity_reports
    add column if not exists sector_ref_id uuid references public.sectors(id);

  execute $definition$
    create or replace function public.can_manage_sector(p_sector_ref_id uuid, p_sector_key text default null)
    returns boolean
    language sql stable security definer set search_path = public
    as $function$
      select public.is_active_admin() or exists (
        select 1
        from public.profiles p
        left join public.sectors s on s.id = p.sector_ref_id
        where p.auth_user_id = auth.uid()
          and p.status = 'Ativo'
          and (
            (p_sector_ref_id is not null and p.sector_ref_id = p_sector_ref_id)
            or (
              p_sector_key is not null
              and (
                lower(trim(p.sector)) = lower(trim(p_sector_key))
                or lower(trim(s.name)) = lower(trim(p_sector_key))
                or lower(trim(s.slug)) = lower(trim(p_sector_key))
              )
            )
          )
      );
    $function$
  $definition$;

  execute 'drop policy if exists "kanban writable by authenticated users" on public.kanban_tasks';
  execute 'drop policy if exists "kanban writable by active members" on public.kanban_tasks';
  execute 'drop policy if exists "kanban insertable by own sector" on public.kanban_tasks';
  execute 'drop policy if exists "kanban updatable by own sector" on public.kanban_tasks';
  execute 'drop policy if exists "kanban deletable by own sector" on public.kanban_tasks';
  execute 'create policy "kanban insertable by own sector" on public.kanban_tasks for insert with check (public.is_active_profile() and public.can_manage_sector(sector_ref_id, sector_id))';
  execute 'create policy "kanban updatable by own sector" on public.kanban_tasks for update using (public.can_manage_sector(sector_ref_id, sector_id)) with check (public.can_manage_sector(sector_ref_id, sector_id))';
  execute 'create policy "kanban deletable by own sector" on public.kanban_tasks for delete using (public.can_manage_sector(sector_ref_id, sector_id))';

  execute 'drop policy if exists "knowledge writable by authenticated users" on public.knowledge_records';
  execute 'drop policy if exists "knowledge writable by active members" on public.knowledge_records';
  execute 'drop policy if exists "knowledge insertable by own sector" on public.knowledge_records';
  execute 'drop policy if exists "knowledge updatable by own sector" on public.knowledge_records';
  execute 'drop policy if exists "knowledge deletable by own sector" on public.knowledge_records';
  execute 'create policy "knowledge insertable by own sector" on public.knowledge_records for insert with check (public.is_active_profile() and public.can_manage_sector(sector_ref_id, sector))';
  execute 'create policy "knowledge updatable by own sector" on public.knowledge_records for update using (public.can_manage_sector(sector_ref_id, sector)) with check (public.can_manage_sector(sector_ref_id, sector))';
  execute 'create policy "knowledge deletable by own sector" on public.knowledge_records for delete using (public.can_manage_sector(sector_ref_id, sector))';

  execute 'drop policy if exists "archived reports writable by active members" on public.archived_activity_reports';
  execute 'drop policy if exists "archived reports insertable by own sector" on public.archived_activity_reports';
  execute 'drop policy if exists "archived reports updatable by own sector" on public.archived_activity_reports';
  execute 'drop policy if exists "archived reports deletable by own sector" on public.archived_activity_reports';
  execute 'create policy "archived reports insertable by own sector" on public.archived_activity_reports for insert with check (public.is_active_profile() and public.can_manage_sector(sector_ref_id, null))';
  execute 'create policy "archived reports updatable by own sector" on public.archived_activity_reports for update using (public.can_manage_sector(sector_ref_id, null)) with check (public.can_manage_sector(sector_ref_id, null))';
  execute 'create policy "archived reports deletable by own sector" on public.archived_activity_reports for delete using (public.can_manage_sector(sector_ref_id, null))';

  execute 'drop policy if exists "purchase reports writable by active members" on public.purchase_request_reports';
  execute 'drop policy if exists "purchase reports writable by compras" on public.purchase_request_reports';
  execute 'create policy "purchase reports writable by compras" on public.purchase_request_reports for all using (public.can_manage_sector(null, ''Compras'')) with check (public.can_manage_sector(null, ''Compras''))';

  execute 'drop policy if exists "requests editable by requester while pending" on public.requests';
  execute 'create policy "requests editable by requester while pending" on public.requests for update using ((requester_id = public.current_profile_id() and status = ''pending_approval'') or public.is_active_admin()) with check (requester_id = public.current_profile_id() or public.is_active_admin())';

  execute $definition$
    create or replace function public.update_purchase_request_status(p_request_id uuid, p_status text)
    returns public.requests
    language plpgsql security definer set search_path = public
    as $function$
    declare
      v_request public.requests;
    begin
      if not public.is_active_profile() then
        raise exception 'Usuario nao autenticado ou inativo';
      end if;

      if p_status not in ('pending_approval', 'approved', 'rejected', 'canceled') then
        raise exception 'Status de compra invalido';
      end if;

      select * into v_request from public.requests where id = p_request_id for update;
      if v_request.id is null then
        raise exception 'Solicitacao nao encontrada';
      end if;

      if v_request.from_sector <> 'Gestao da obra' or v_request.to_sector <> 'Compras' then
        raise exception 'Esta solicitacao nao pertence ao fluxo de compras';
      end if;

      if not public.can_manage_sector(v_request.target_sector_id, 'Compras') then
        raise exception 'Sem permissao para alterar esta solicitacao';
      end if;

      update public.requests
      set status = p_status,
          approved_at = case when p_status = 'approved' then coalesce(approved_at, now()) else approved_at end,
          rejected_at = case when p_status = 'rejected' then coalesce(rejected_at, now()) else rejected_at end,
          cancelled_at = case when p_status = 'canceled' then coalesce(cancelled_at, now()) else cancelled_at end,
          updated_at = now()
      where id = p_request_id
      returning * into v_request;

      return v_request;
    end;
    $function$
  $definition$;

  grant execute on function public.can_manage_sector(uuid, text) to authenticated;
  grant execute on function public.update_purchase_request_status(uuid, text) to authenticated;
end
$migration$;
