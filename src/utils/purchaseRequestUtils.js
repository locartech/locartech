import {
  initialPurchaseRequests,
  purchaseRequestSource,
  purchaseRequestTargetSector,
  PURCHASE_REQUESTS_STORAGE_KEY,
} from '../data/purchaseRequestsData';

const today = '2026-07-10';

function normalizePriority(value) {
  const cleanValue = String(value ?? 'medium').trim().toLowerCase();
  const normalizedValue = cleanValue.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const priorities = {
    baixa: 'low',
    low: 'low',
    media: 'medium',
    medium: 'medium',
    alta: 'high',
    high: 'high',
    urgente: 'urgent',
    urgent: 'urgent',
  };

  return priorities[normalizedValue] ?? 'medium';
}

export function encodePurchaseDescription({ description, workLocation }) {
  return JSON.stringify({
    kind: 'purchase_request',
    description: description.trim(),
    workLocation: workLocation.trim(),
  });
}

export function decodePurchaseDescription(value = '') {
  try {
    const parsed = JSON.parse(value);
    if (parsed?.kind === 'purchase_request') {
      return {
        description: parsed.description ?? '',
        workLocation: parsed.workLocation ?? '',
      };
    }
  } catch {
    // Existing plain-text records stay readable.
  }

  return {
    description: value,
    workLocation: '',
  };
}

export function normalizePurchaseRequest(request) {
  const decoded = decodePurchaseDescription(request.description);

  return {
    id: request.id ?? `purchase-${crypto.randomUUID()}`,
    item: request.item ?? request.title ?? '',
    title: request.title ?? request.item ?? '',
    description: decoded.description,
    workLocation: request.workLocation ?? decoded.workLocation,
    requesterId: request.requesterId ?? request.requester_id ?? null,
    requesterName: request.requesterName ?? request.requester_name ?? '',
    sourceSector: request.sourceSector ?? request.from_sector ?? purchaseRequestSource,
    targetSector: request.targetSector ?? request.to_sector ?? purchaseRequestTargetSector,
    status: request.status ?? 'nova',
    priority: normalizePriority(request.priority),
    dueDate: request.dueDate ?? request.due_date ?? '',
    createdAt: request.createdAt ?? request.created_at?.slice?.(0, 10) ?? today,
    updatedAt: request.updatedAt ?? request.updated_at?.slice?.(0, 10) ?? null,
  };
}

export function loadPurchaseRequests() {
  try {
    const saved = localStorage.getItem(PURCHASE_REQUESTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved).map(normalizePurchaseRequest);
  } catch {
    localStorage.removeItem(PURCHASE_REQUESTS_STORAGE_KEY);
  }

  return initialPurchaseRequests;
}

export function savePurchaseRequests(requests) {
  localStorage.setItem(PURCHASE_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
}

export function createLocalPurchaseRequest(values, currentUser) {
  return {
    id: `purchase-${crypto.randomUUID()}`,
    item: values.item.trim(),
    title: values.item.trim(),
    description: values.description.trim(),
    workLocation: values.workLocation.trim(),
    requesterId: currentUser.id,
    requesterName: values.requesterName.trim(),
    sourceSector: purchaseRequestSource,
    targetSector: purchaseRequestTargetSector,
    status: 'nova',
    priority: values.priority,
    dueDate: values.dueDate,
    createdAt: today,
    updatedAt: null,
  };
}

export function updateLocalPurchaseStatus(requests, requestId, status) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status,
          updatedAt: today,
        }
      : request,
  );
}

export function getPurchaseStats(requests) {
  return {
    novas: requests.filter((request) => request.status === 'nova').length,
    urgentes: requests.filter((request) => request.priority === 'urgent').length,
    emCompra: requests.filter((request) => request.status === 'em_compra').length,
    compradas: requests.filter((request) => request.status === 'comprada').length,
    entregues: requests.filter((request) => request.status === 'entregue').length,
  };
}

export function filterPurchaseRequests(requests, filters) {
  const query = filters.query.trim().toLowerCase();

  return requests.filter((request) => {
    const statusMatches = filters.status === 'all' || request.status === filters.status;
    const priorityMatches = filters.priority === 'all' || request.priority === filters.priority;
    const queryMatches =
      !query ||
      `${request.item} ${request.description} ${request.requesterName} ${request.workLocation}`
        .toLowerCase()
        .includes(query);

    return statusMatches && priorityMatches && queryMatches;
  });
}

export function validatePurchaseRequest(values) {
  if (!values.item.trim()) return 'Informe o item que precisa ser comprado.';
  if (!values.description.trim()) return 'Informe a descricao da compra.';
  if (!values.requesterName.trim()) return 'Informe quem esta solicitando.';
  if (!values.priority) return 'Informe a prioridade.';
  if (!values.dueDate) return 'Informe o prazo desejado.';
  return '';
}
