import { requestStatusIds } from '../data/requestsData';

export function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatRequestDate(value, fallback = '-') {
  if (!value) return fallback;

  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getReceivedRequests(requests, user) {
  return requests.filter((request) => request.targetSector === user.sector);
}

export function getSentRequests(requests, user) {
  return requests.filter(
    (request) =>
      request.requesterUserId === user.id ||
      request.requesterName === user.name ||
      request.requesterSector === user.sector,
  );
}

export function getTodayReceivedRequests(requests, user) {
  const today = getCurrentDate();
  return getReceivedRequests(requests, user).filter((request) => request.createdAt === today);
}

export function getPendingApprovalRequests(requests, user) {
  return getReceivedRequests(requests, user).filter(
    (request) => request.requestStatus === requestStatusIds.pendingApproval,
  );
}

export function filterRequests(requests, filters) {
  return requests.filter((request) => {
    const statusMatches = filters.status === 'all' || request.requestStatus === filters.status;
    const requesterSectorMatches =
      filters.requesterSector === 'all' || request.requesterSector === filters.requesterSector;
    const targetSectorMatches = filters.targetSector === 'all' || request.targetSector === filters.targetSector;
    const priorityMatches = filters.priority === 'all' || request.priority === filters.priority;
    const dateMatches = !filters.date || request.createdAt === filters.date || request.dueDate === filters.date;

    return statusMatches && requesterSectorMatches && targetSectorMatches && priorityMatches && dateMatches;
  });
}
