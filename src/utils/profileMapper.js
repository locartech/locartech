export function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'LT'
  );
}

export function mapProfileFromDb(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    authUserId: profile.auth_user_id,
    organizationId: profile.organization_id,
    sectorId: profile.sector_ref_id,
    name: profile.name,
    email: profile.email,
    sector: profile.sector,
    role: profile.role,
    jobTitle: profile.job_title,
    accountType: profile.account_type,
    status: profile.status,
    joinedAt: profile.joined_at,
    lastAccess: profile.last_access?.slice(0, 10) ?? null,
    avatarInitials: profile.avatar_initials || getInitials(profile.name),
    photoUrl: profile.photo_url,
  };
}

export function mapProfileToDb(member) {
  return {
    name: member.name?.trim(),
    email: member.email?.trim().toLowerCase(),
    sector: member.sector,
    sector_ref_id: member.sectorId ?? undefined,
    role: member.role,
    job_title: member.jobTitle ?? member.role,
    account_type: member.accountType,
    status: member.status,
    avatar_initials: member.avatarInitials || getInitials(member.name),
    photo_url: member.photoUrl || null,
  };
}
