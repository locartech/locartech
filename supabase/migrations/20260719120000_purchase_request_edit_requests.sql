-- Obra accounts cannot edit a submitted purchase request directly (there is no
-- direct UPDATE policy on public.requests - all writes go through RPCs). This
-- adds a formal edit-request flow: the requester proposes changes, and Compras
-- (or an admin) approves or rejects them.
create table if not exists public.purchase_request_edit_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  request_id uuid not null references public.requests(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  proposed_description text not null,
  proposed_notes text not null default '',
  proposed_work_location text not null default '',
  proposed_priority text not null,
  proposed_due_date date not null,
  reason text,
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_request_edit_requests enable row level security;

drop policy if exists "purchase edit requests visible to requester or compras" on public.purchase_request_edit_requests;
create policy "purchase edit requests visible to requester or compras"
  on public.purchase_request_edit_requests for select
  using (
    requester_id = public.current_profile_id()
    or public.is_active_admin()
    or exists (
      select 1 from public.requests r
      where r.id = purchase_request_edit_requests.request_id
        and public.can_manage_sector(r.target_sector_id, 'Compras')
    )
  );

revoke all on public.purchase_request_edit_requests from public, authenticated;
grant select on public.purchase_request_edit_requests to authenticated;

create or replace function public.create_purchase_request_edit(
  p_request_id uuid,
  p_description text,
  p_notes text,
  p_work_location text,
  p_priority text,
  p_due_date date,
  p_reason text
)
returns public.purchase_request_edit_requests
language plpgsql security definer set search_path = public
as $$
declare
  v_actor public.profiles;
  v_request public.requests;
  v_edit public.purchase_request_edit_requests;
begin
  select * into v_actor from public.profiles where auth_user_id = auth.uid() and status = 'Ativo';
  if v_actor.id is null then raise exception 'Usuario nao autenticado ou inativo'; end if;

  select * into v_request from public.requests where id = p_request_id for update;
  if v_request.id is null then raise exception 'Solicitacao nao encontrada'; end if;
  if v_request.requester_id <> v_actor.id then raise exception 'Sem permissao para editar esta solicitacao'; end if;
  if v_request.from_sector <> 'Gestao da obra' or v_request.to_sector <> 'Compras' then
    raise exception 'Esta solicitacao nao pertence ao fluxo de compras';
  end if;
  if v_request.status not in ('pending_approval', 'approved') then
    raise exception 'Esta solicitacao nao pode mais ser editada';
  end if;
  if nullif(trim(p_description), '') is null or p_due_date is null
    or p_priority not in ('low', 'medium', 'high', 'urgent')
  then
    raise exception 'Dados da edicao invalidos';
  end if;
  if exists (
    select 1 from public.purchase_request_edit_requests
    where request_id = p_request_id and status = 'pending'
  ) then
    raise exception 'Ja existe um pedido de edicao pendente para esta compra';
  end if;

  insert into public.purchase_request_edit_requests (
    organization_id, request_id, requester_id, proposed_description, proposed_notes,
    proposed_work_location, proposed_priority, proposed_due_date, reason
  ) values (
    v_actor.organization_id, v_request.id, v_actor.id, trim(p_description), coalesce(trim(p_notes), ''),
    coalesce(trim(p_work_location), ''), p_priority, p_due_date, nullif(trim(p_reason), '')
  ) returning * into v_edit;

  insert into public.notifications (
    user_id, organization_id, recipient_sector_id, actor_profile_id, title, message,
    category, type, entity_type, entity_id, target_sector_name, target_user_name
  )
  select p.id, v_actor.organization_id, v_request.target_sector_id, v_actor.id,
    'Pedido de edicao de compra',
    v_actor.name || ' pediu para editar a solicitacao de compra "' || left(v_request.title, 80) || '".',
    'Compras solicitadas', 'purchase_edit_requested', 'purchase_request_edit_request', v_edit.id,
    'Compras', v_actor.name
  from public.profiles p
  where p.organization_id = v_actor.organization_id
    and p.sector_ref_id = v_request.target_sector_id
    and p.status = 'Ativo'
    and p.id <> v_actor.id;

  return v_edit;
end;
$$;

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
      title = left(regexp_replace(v_edit.proposed_description, E'[\\n\\r]+', ' ', 'g'), 120),
      step_name = left(regexp_replace(v_edit.proposed_description, E'[\\n\\r]+', ' ', 'g'), 120),
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

  return v_edit;
end;
$$;

revoke all on function public.create_purchase_request_edit(uuid, text, text, text, text, date, text) from public;
revoke all on function public.review_purchase_request_edit(uuid, boolean, text) from public;
grant execute on function public.create_purchase_request_edit(uuid, text, text, text, text, date, text) to authenticated;
grant execute on function public.review_purchase_request_edit(uuid, boolean, text) to authenticated;
