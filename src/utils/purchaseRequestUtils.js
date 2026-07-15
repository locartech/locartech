import {
  initialPurchaseRequests,
  purchasePriorities,
  purchaseRequestSource,
  purchaseRequestTargetSector,
  purchaseStatuses,
  PURCHASE_REQUESTS_STORAGE_KEY,
  PURCHASE_STATUS_OVERRIDES_STORAGE_KEY,
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

export function encodePurchaseDescription({ description, notes = '', workLocation }) {
  return JSON.stringify({
    kind: 'purchase_request',
    description: description.trim(),
    notes: notes.trim(),
    workLocation: workLocation.trim(),
  });
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

export function loadPurchaseStatusOverrides() {
  if (!canUseLocalStorage()) return {};

  try {
    return JSON.parse(localStorage.getItem(PURCHASE_STATUS_OVERRIDES_STORAGE_KEY) || '{}');
  } catch {
    localStorage.removeItem(PURCHASE_STATUS_OVERRIDES_STORAGE_KEY);
    return {};
  }
}

export function savePurchaseStatusOverride(requestId, status) {
  if (!canUseLocalStorage() || !requestId) return;

  const overrides = loadPurchaseStatusOverrides();
  overrides[requestId] = status;
  localStorage.setItem(PURCHASE_STATUS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

export function removePurchaseStatusOverride(requestId) {
  if (!canUseLocalStorage() || !requestId) return;

  const overrides = loadPurchaseStatusOverrides();
  delete overrides[requestId];
  localStorage.setItem(PURCHASE_STATUS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
}

export function decodePurchaseDescription(value = '') {
  try {
    const parsed = JSON.parse(value);
    if (parsed?.kind === 'purchase_request') {
      return {
        description: parsed.description ?? '',
        notes: parsed.notes ?? '',
        workLocation: parsed.workLocation ?? '',
      };
    }
  } catch {
    // Existing plain-text records stay readable.
  }

  return {
    description: value,
    notes: '',
    workLocation: '',
  };
}

export function getPurchaseRequestTitle(values) {
  const description = values.description?.trim?.() ?? '';
  if (!description) return 'Solicitacao de compra';

  return description.length > 72 ? `${description.slice(0, 69).trim()}...` : description;
}

export function normalizePurchaseRequest(request) {
  const decoded = decodePurchaseDescription(request.description);
  const id = request.id ?? `purchase-${crypto.randomUUID()}`;
  const statusOverride = loadPurchaseStatusOverrides()[id];

  return {
    id,
    item: request.item ?? request.title ?? '',
    title: request.title ?? request.item ?? '',
    description: decoded.description,
    notes: request.notes ?? decoded.notes,
    workLocation: request.workLocation ?? decoded.workLocation,
    requesterId: request.requesterId ?? request.requester_id ?? null,
    requesterName: request.requesterName ?? request.requester_name ?? '',
    sourceSector: request.sourceSector ?? request.from_sector ?? purchaseRequestSource,
    targetSector: request.targetSector ?? request.to_sector ?? purchaseRequestTargetSector,
    status: statusOverride ?? (request.status === 'nova' ? 'pending_approval' : request.status ?? 'pending_approval'),
    priority: normalizePriority(request.priority),
    dueDate: request.dueDate ?? request.due_date ?? '',
    createdAt: request.createdAt ?? request.created_at?.slice?.(0, 10) ?? today,
    updatedAt: request.updatedAt ?? request.updated_at?.slice?.(0, 10) ?? null,
    archived: request.archived ?? false,
    archivedAt: request.archivedAt ?? request.archived_at ?? null,
    archivedByName: request.archivedByName ?? request.archived_by_name ?? null,
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
    item: getPurchaseRequestTitle(values),
    title: getPurchaseRequestTitle(values),
    description: values.description.trim(),
    notes: values.notes.trim(),
    workLocation: values.workLocation.trim(),
    requesterId: currentUser.id,
    requesterName: values.requesterName.trim(),
    sourceSector: purchaseRequestSource,
    targetSector: purchaseRequestTargetSector,
    status: 'pending_approval',
    priority: values.priority,
    dueDate: values.dueDate,
    createdAt: today,
    updatedAt: null,
  };
}

export function archiveLocalPurchaseRequest(requests, requestId, currentUser) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          archived: true,
          archivedAt: new Date().toISOString(),
          archivedByName: currentUser?.name ?? null,
        }
      : request,
  );
}

export function restoreLocalPurchaseRequest(requests, requestId) {
  return requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          archived: false,
          archivedAt: null,
          archivedByName: null,
        }
      : request,
  );
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
    novas: requests.filter((request) => request.status === 'pending_approval' || request.status === 'nova').length,
    urgentes: requests.filter((request) => request.priority === 'urgent').length,
    emAndamento: requests.filter((request) => request.status === 'approved').length,
    concluidas: requests.filter((request) => request.status === 'completed').length,
    recusadas: requests.filter((request) => request.status === 'rejected').length,
  };
}

export function filterPurchaseRequests(requests, filters) {
  const query = filters.query.trim().toLowerCase();

  return requests.filter((request) => {
    const statusMatches = filters.status === 'all' || request.status === filters.status;
    const priorityMatches = filters.priority === 'all' || request.priority === filters.priority;
    const queryMatches =
      !query ||
      `${request.item} ${request.description} ${request.notes} ${request.requesterName} ${request.workLocation}`
        .toLowerCase()
        .includes(query);

    return statusMatches && priorityMatches && queryMatches;
  });
}

export function validatePurchaseRequest(values) {
  if (!values.description.trim()) return 'Informe a descricao da compra.';
  if (!values.requesterName.trim()) return 'Informe quem esta solicitando.';
  if (!values.priority) return 'Informe a prioridade.';
  if (!values.dueDate) return 'Informe o prazo desejado.';
  return '';
}

function statusLabel(statusId) {
  return purchaseStatuses.find((status) => status.id === statusId)?.label ?? statusId ?? '';
}

function priorityLabel(priorityId) {
  return purchasePriorities.find((priority) => priority.id === priorityId)?.label ?? priorityId ?? '';
}

function escapePurchaseCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildPurchaseRequestsCsv(requests) {
  const headers = [
    'ID',
    'Descricao',
    'Observacao',
    'Solicitante',
    'Obra/local',
    'Prioridade',
    'Prazo',
    'Status',
    'Criada em',
  ];

  const rows = requests.map((request) => [
    request.id,
    request.description,
    request.notes || '',
    request.requesterName,
    request.workLocation || '',
    priorityLabel(request.priority),
    request.dueDate || '',
    statusLabel(request.status),
    request.createdAt || '',
  ]);

  return [headers, ...rows].map((row) => row.map(escapePurchaseCsvValue).join(';')).join('\r\n');
}

export function buildPurchaseRequestsReportFileName(date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10);
  return `relatorio-compras-solicitadas-${isoDate}.csv`;
}
