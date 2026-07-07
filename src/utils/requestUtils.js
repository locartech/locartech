const today = '2026-07-04';

export function getReceivedRequests(requests, user) {
  return requests.filter((request) => request.targetSector === user.sector);
}

export function getSentRequests(requests, user) {
  return requests.filter(
    (request) => request.requesterName === user.name || request.requesterSector === user.sector,
  );
}

export function getTodayReceivedRequests(requests, user) {
  return getReceivedRequests(requests, user).filter((request) => request.createdAt === today);
}

export function getPendingRequests(requests, user) {
  return getReceivedRequests(requests, user).filter((request) =>
    ['pending', 'in_progress'].includes(request.status),
  );
}

export function createRequest(requestData, user) {
  return {
    id: `sol-${crypto.randomUUID()}`,
    title: requestData.title.trim(),
    description: requestData.description.trim(),
    requesterName: user.name,
    requesterSector: user.sector,
    targetSector: requestData.targetSector,
    responsibleName: requestData.responsibleName.trim() || null,
    status: 'pending',
    priority: requestData.priority,
    createdAt: today,
    dueDate: requestData.dueDate,
    completedAt: null,
  };
}

export function updateRequestStatus(requests, requestId, newStatus) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status: newStatus,
          completedAt: newStatus === 'completed' ? today : request.completedAt,
        }
      : request,
  );
}

export function completeRequest(requests, requestId) {
  return updateRequestStatus(requests, requestId, 'completed');
}

export function cancelRequest(requests, requestId) {
  return updateRequestStatus(requests, requestId, 'canceled');
}

export function updateRequest(requests, requestId, values) {
  return requests.map((request) => (request.id === requestId ? { ...request, ...values } : request));
}

export function filterRequests(requests, filters) {
  return requests.filter((request) => {
    const statusMatches = filters.status === 'all' || request.status === filters.status;
    const sectorMatches =
      filters.sector === 'all' ||
      request.targetSector === filters.sector ||
      request.requesterSector === filters.sector;
    const dateMatches = !filters.date || request.createdAt === filters.date || request.dueDate === filters.date;

    return statusMatches && sectorMatches && dateMatches;
  });
}

export function buildRequestCreatedNotification(request) {
  return {
    id: `notification-${Date.now()}-${request.id}`,
    createdAt: new Date().toISOString(),
    title: 'Nova solicitação recebida',
    message: `${request.requesterName} do setor ${request.requesterSector} enviou uma nova solicitação para ${request.targetSector}: ${request.title}.`,
    targetSectorName: request.targetSector,
    targetUserName: request.responsibleName,
    taskId: null,
    read: false,
  };
}

export function buildRequestCompletedNotification(request) {
  return {
    id: `notification-${Date.now()}-${request.id}`,
    createdAt: new Date().toISOString(),
    title: 'Solicitação concluída',
    message: `${request.responsibleName || request.targetSector} concluiu a solicitação: ${request.title}.`,
    targetSectorName: request.requesterSector,
    targetUserName: request.requesterName,
    taskId: null,
    read: false,
  };
}
