-- Consume the transaction-local authorization immediately after one role change,
-- preventing it from being reused by another update in the same transaction.
create or replace function public.protect_admin_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.account_type is not distinct from old.account_type then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if coalesce(current_setting('app.admin_role_change', true), '') <> 'allowed' then
    raise exception 'Use a acao de administrador para alterar este acesso.';
  end if;

  perform set_config('app.admin_role_change', '', true);
  return new;
end;
$$;
