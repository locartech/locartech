-- Managing a group's member list (remove/add) needs a DELETE policy on
-- conversation_participants - there wasn't one, so every removal was
-- silently rejected by RLS. Same permission model already used for
-- editing the group itself (creator or any current participant).
drop policy if exists "participants deletable by creator or self" on public.conversation_participants;
create policy "participants deletable by creator or self"
  on public.conversation_participants for delete
  using (
    profile_id = public.current_profile_id()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_participants.conversation_id
        and (c.created_by = public.current_profile_id() or public.is_conversation_participant(c.id))
    )
  );
