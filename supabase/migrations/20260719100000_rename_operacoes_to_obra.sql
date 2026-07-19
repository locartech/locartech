-- Renames the "Operacoes" sector's display name to "Obra" across the UI.
-- The internal slug ('operacoes') and account_type id ('operacao') stay
-- unchanged since they're referenced by RLS/RPC logic; only the human-facing
-- name changes.
update public.sectors set name = 'Obra' where slug = 'operacoes' and name <> 'Obra';

-- protect_profile_privilege_fields() blocks non-admin changes to profiles.sector;
-- this is a direct data migration, not an end-user edit, so bypass it for this statement.
set local session_replication_role = replica;
update public.profiles set sector = 'Obra' where sector = 'Operações';
set local session_replication_role = origin;
