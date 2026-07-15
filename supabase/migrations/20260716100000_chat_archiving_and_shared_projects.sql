-- Conversation archiving is personal to each participant. Projects is a shared
-- knowledge area, so every active member may maintain its documents.
do $migration$
begin
  alter table public.conversation_participants
    add column if not exists archived_at timestamptz;

  create index if not exists idx_conversation_participants_archived
    on public.conversation_participants(profile_id, archived_at);

  execute $definition$
    create or replace function public.can_manage_sector(p_sector_ref_id uuid, p_sector_key text default null)
    returns boolean
    language sql stable security definer set search_path = public
    as $function$
      select public.is_active_admin()
        or (
          public.is_active_profile()
          and lower(trim(coalesce(p_sector_key, ''))) = 'projetos'
        )
        or exists (
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

  grant execute on function public.can_manage_sector(uuid, text) to authenticated;
end
$migration$;
