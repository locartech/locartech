-- Preserve operational purchase edit history when a member account is deleted.
-- The requester name remains available through the linked request, while the
-- personal profile reference is cleared.
alter table public.purchase_request_edit_requests
  alter column requester_id drop not null;

alter table public.purchase_request_edit_requests
  drop constraint if exists purchase_request_edit_requests_requester_id_fkey;

alter table public.purchase_request_edit_requests
  add constraint purchase_request_edit_requests_requester_id_fkey
  foreign key (requester_id) references public.profiles(id) on delete set null;

create or replace function public.review_purchase_request_edit(
  p_edit_id uuid,
  p_approve boolean,
  p_review_note text default null
)
returns public.purchase_request_edit_requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_edit public.purchase_request_edit_requests;
  v_request public.requests;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;

  select * into v_edit from public.purchase_request_edit_requests where id = p_edit_id for update;
  if v_edit.id is null then raise exception 'Pedido de edicao nao encontrado'; end if;
  if v_edit.status <> 'pending' then raise exception 'Este pedido de edicao ja foi avaliado'; end if;

  select * into v_request from public.requests where id = v_edit.request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if not (public.can_manage_sector(v_request.target_sector_id, 'Compras') or public.is_active_admin()) then
    raise exception 'Sem permissao para avaliar este pedido de edicao';
  end if;

  if p_approve then
    update public.requests set
      description = jsonb_build_object(
        'kind', 'purchase_request',
        'description', v_edit.proposed_description,
        'notes', v_edit.proposed_notes,
        'workLocation', v_edit.proposed_work_location
      )::text,
      title = left(regexp_replace(v_edit.proposed_description, E'[\n\r]+', ' ', 'g'), 120),
      step_name = left(regexp_replace(v_edit.proposed_description, E'[\n\r]+', ' ', 'g'), 120),
      priority = v_edit.proposed_priority,
      due_date = v_edit.proposed_due_date,
      updated_at = now()
    where id = v_request.id;
  end if;

  update public.purchase_request_edit_requests set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = v_actor.id, reviewed_at = now(), review_note = nullif(trim(p_review_note), ''),
    updated_at = now()
  where id = p_edit_id
  returning * into v_edit;

  if v_edit.requester_id is not null then
    insert into public.notifications (
      user_id, organization_id, actor_profile_id, title, message, category, type, entity_type, entity_id,
      target_sector_name, target_user_name
    ) values (
      v_edit.requester_id, v_request.organization_id, v_actor.id,
      case when p_approve then 'Pedido de edicao aprovado' else 'Pedido de edicao recusado' end,
      case when p_approve
        then 'Sua edicao da solicitacao de compra "' || left(v_request.title, 80) || '" foi aprovada.'
        else 'Sua edicao da solicitacao de compra "' || left(v_request.title, 80) || '" foi recusada.'
      end,
      'Compras solicitadas', 'purchase_edit_reviewed', 'purchase_request_edit_request', v_edit.id,
      'Compras', v_request.requester_name
    );
  end if;

  return v_edit;
end;
$$;

revoke all on function public.review_purchase_request_edit(uuid, boolean, text) from public;
grant execute on function public.review_purchase_request_edit(uuid, boolean, text) to authenticated;
