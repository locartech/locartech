-- Fixes two silent RLS-caused failures reported live:
--
-- 1) "Cancelar solicitacao" always failed. The UPDATE policy on requests had no explicit
--    WITH CHECK, so Postgres reused the USING clause for both - and USING requires
--    status = 'pending_approval'. The moment the UPDATE sets status to 'canceled', the
--    post-update row no longer satisfies that same condition, so RLS silently rejected it
--    (0 rows affected -> the .single() call throws "no rows returned").
drop policy if exists "requests editable by requester while pending" on public.requests;
create policy "requests editable by requester while pending"
  on public.requests for update
  using (requester_id = public.current_profile_id() and status = 'pending_approval')
  with check (requester_id = public.current_profile_id());

-- 2) Editing a group's name/description/sector always failed. public.conversations has
--    RLS enabled but never had an UPDATE policy at all, so every update was rejected
--    outright regardless of who ran it.
drop policy if exists "conversations updatable by participants" on public.conversations;
create policy "conversations updatable by participants"
  on public.conversations for update
  using (created_by = public.current_profile_id() or public.is_conversation_participant(conversations.id))
  with check (created_by = public.current_profile_id() or public.is_conversation_participant(conversations.id));
