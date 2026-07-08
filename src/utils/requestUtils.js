import { kanbanSectors } from '../data/kanbanData';
import { requestStatusIds } from '../data/requestsData';

const today = '2026-07-08';

export function getCurrentDate() {
  return today;
}

export function normalizeRequest(request) {
  const requestStatus = request.requestStatus ?? {
    pending: requestStatusIds.pendingApproval,
    in_progress: requestStatusIds.pendingApproval,
    completed: requestStatusIds.approved,
    canceled: requestStatusIds.canceled,
  }[request.status] ?? requestStatusIds.pendingApproval;

  return {
    id: request.id?.startsWith('req-') ? request.id : request.id?.replace('sol-', 'req-') ?? `req-${crypto.randomUUID()}`,
    title: request.title ?? '',
    description: request.description ?? '',
    stepName: request.stepName ?? request.title ?? '',
    requesterUserId: request.requesterUserId ?? request.requesterId ?? null,
    requesterName: request.requesterName ?? '',
    requesterSector: request.requesterSector ?? '',
    targetSector: request.targetSector ?? '',
    responsibleName: request.responsibleName ?? '',
    requestStatus,
    kanbanStatus: request.kanbanStatus ?? 'todo',
    priority: request.priority ?? 'medium',
    dueDate: request.dueDate ?? '',
    createdAt: request.createdAt ?? today,
    approvedAt: request.approvedAt ?? null,
    rejectedAt: request.rejectedAt ?? null,
    rejectionReason: request.rejectionReason ?? null,
    generatedTaskId: request.generatedTaskId ?? null,
  };
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
  return getReceivedRequests(requests, user).filter((request) => request.createdAt === today);
}

export function getPendingApprovalRequests(requests, user) {
  return getReceivedRequests(requests, user).filter(
    (request) => request.requestStatus === requestStatusIds.pendingApproval,
  );
}

export function createRequest(requestData, user) {
  return {
    id: `req-${crypto.randomUUID()}`,
    title: requestData.title.trim(),
    description: requestData.description.trim(),
    stepName: requestData.stepName.trim(),
    requesterUserId: user.id,
    requesterName: user.name,
    requesterSector: user.sector,
    targetSector: requestData.targetSector,
    responsibleName: requestData.responsibleName.trim() || '',
    requestStatus: requestStatusIds.pendingApproval,
    kanbanStatus: requestData.kanbanStatus || 'todo',
    priority: requestData.priority,
    dueDate: requestData.dueDate,
    createdAt: today,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    generatedTaskId: null,
  };
}

export function updateRequest(requests, requestId, values) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          title: values.title.trim(),
          description: values.description.trim(),
          stepName: values.stepName.trim(),
          targetSector: values.targetSector,
          responsibleName: values.responsibleName.trim() || '',
          kanbanStatus: values.kanbanStatus,
          priority: values.priority,
          dueDate: values.dueDate,
        }
      : request,
  );
}

export function approveRequest(requests, requestId, generatedTaskId) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          requestStatus: requestStatusIds.approved,
          approvedAt: today,
          generatedTaskId: request.generatedTaskId ?? generatedTaskId,
        }
      : request,
  );
}

export function rejectRequest(requests, requestId, rejectionReason) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          requestStatus: requestStatusIds.rejected,
          rejectedAt: today,
          rejectionReason: rejectionReason.trim(),
        }
      : request,
  );
}

export function cancelRequest(requests, requestId) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          requestStatus: requestStatusIds.canceled,
        }
      : request,
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

export function createKanbanTaskFromRequest(request) {
  const sector = kanbanSectors.find((item) => item.name === request.targetSector);
  return {
    id: `task-${crypto.randomUUID()}`,
    sectorId: sector?.id ?? request.targetSector.toLowerCase().replace(/\s+/g, '-'),
    sector: request.targetSector,
    title: request.stepName,
    description: request.description,
    assignee: request.responsibleName || '',
    responsible: request.responsibleName || '',
    status: request.kanbanStatus || 'todo',
    date: request.dueDate,
    dueDate: request.dueDate,
    priority: request.priority,
    sourceRequestId: request.id,
    requesterName: request.requesterName,
    requesterSector: request.requesterSector,
    createdAt: today,
  };
}

export function buildRequestCreatedNotification(request) {
  return {
    id: `notification-${Date.now()}-${request.id}`,
    createdAt: new Date().toISOString(),
    title: 'Nova solicitacao recebida',
    message: `Nova solicitacao recebida de ${request.requesterSector}: ${request.title}.`,
    targetSectorName: request.targetSector,
    targetUserName: request.responsibleName,
    taskId: null,
    read: false,
  };
}

export function buildRequestApprovedNotification(request) {
  return {
    id: `notification-${Date.now()}-${request.id}`,
    createdAt: new Date().toISOString(),
    title: 'Solicitacao aprovada',
    message: `Sua solicitacao ${request.title} foi aprovada e adicionada ao Kanban de ${request.targetSector}.`,
    targetSectorName: request.requesterSector,
    targetUserName: request.requesterName,
    taskId: request.generatedTaskId,
    read: false,
  };
}

export function buildRequestRejectedNotification(request) {
  return {
    id: `notification-${Date.now()}-${request.id}`,
    createdAt: new Date().toISOString(),
    title: 'Solicitacao recusada',
    message: `Sua solicitacao ${request.title} foi recusada. Motivo: ${request.rejectionReason}.`,
    targetSectorName: request.requesterSector,
    targetUserName: request.requesterName,
    taskId: null,
    read: false,
  };
}
