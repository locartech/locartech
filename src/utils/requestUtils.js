import { requestStatusIds } from '../data/requestsData';

export function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
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
