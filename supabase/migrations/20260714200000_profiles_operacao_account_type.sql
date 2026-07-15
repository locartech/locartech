-- Allow the new "operacao" account type (restricted to Solicitacoes de compras only).
alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check
  check (account_type = any (array['admin', 'member', 'operacao']));
