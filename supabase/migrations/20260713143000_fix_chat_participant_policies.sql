create or replace function public.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = target_conversation_id
      and cp.profile_id = public.current_profile_id()
  );
$$;

grant execute on function public.is_conversation_participant(uuid) to authenticated;

drop policy if exists "conversations readable by participants" on public.conversations;
create policy "conversations readable by participants"
  on public.conversations for select
  using (
    created_by = public.current_profile_id()
    or public.is_conversation_participant(conversations.id)
  );

drop policy if exists "participants readable by participants" on public.conversation_participants;
create policy "participants readable by participants"
  on public.conversation_participants for select
  using (
    profile_id = public.current_profile_id()
    or public.is_conversation_participant(conversation_participants.conversation_id)
  );

drop policy if exists "participants insertable by authenticated users" on public.conversation_participants;
create policy "participants insertable by authenticated users"
  on public.conversation_participants for insert
  with check (
    public.is_active_profile()
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_participants.conversation_id
        and (
          c.created_by = public.current_profile_id()
          or public.is_conversation_participant(c.id)
        )
    )
  );

drop policy if exists "participants editable by self" on public.conversation_participants;
create policy "participants editable by self"
  on public.conversation_participants for update
  using (profile_id = public.current_profile_id());

drop policy if exists "messages readable by participants" on public.messages;
create policy "messages readable by participants"
  on public.messages for select
  using (public.is_conversation_participant(messages.conversation_id));

drop policy if exists "messages insertable by participants" on public.messages;
create policy "messages insertable by participants"
  on public.messages for insert
  with check (
    sender_id = public.current_profile_id()
    and public.is_conversation_participant(messages.conversation_id)
  );
