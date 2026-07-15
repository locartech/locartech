export function normalizeSectorKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');
}

export function isAdminUser(user) {
  return user?.accountType === 'admin';
}

export function canManageSector(user, sector) {
  if (isAdminUser(user)) return true;
  if (!user || !sector) return false;

  const targetId = typeof sector === 'object' ? sector.id : null;
  const targetName = typeof sector === 'object' ? sector.name || sector.slug : sector;

  if (normalizeSectorKey(targetName) === 'projetos') return true;

  if (targetId && user.sectorId && targetId === user.sectorId) return true;
  return normalizeSectorKey(targetName) === normalizeSectorKey(user.sector);
}

export function isRequestOwner(user, request) {
  if (!user || !request) return false;
  return request.requesterUserId === user.id || request.requesterName === user.name;
}

export function canManageIncomingRequest(user, request) {
  return isAdminUser(user) || canManageSector(user, request?.targetSector);
}

export function canEditPendingRequest(user, request) {
  return request?.requestStatus === 'pending_approval' && (isAdminUser(user) || isRequestOwner(user, request));
}

export function canArchiveRequest(user, request) {
  return isAdminUser(user) || isRequestOwner(user, request) || canManageIncomingRequest(user, request);
}
