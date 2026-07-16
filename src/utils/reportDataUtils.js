import { kanbanStatuses } from '../data/kanbanData';
import { purchasePriorities, purchaseStatuses } from '../data/purchaseRequestsData';
import { requestPriorities, requestStatuses } from '../data/requestsData';

const labelFor = (options, value) => options.find((option) => option.id === value)?.label ?? value ?? '';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

export const kanbanReportColumns = [
  { key: 'activity', label: 'Atividade', width: 32 },
  { key: 'sector', label: 'Setor', width: 22 },
  { key: 'responsible', label: 'Responsavel', width: 24 },
  { key: 'status', label: 'Status', width: 16 },
  { key: 'priority', label: 'Prioridade', width: 15 },
  { key: 'dueDate', label: 'Prazo', width: 14 },
  { key: 'requester', label: 'Solicitante', width: 24 },
  { key: 'requesterSector', label: 'Setor solicitante', width: 20 },
  { key: 'archivedBy', label: 'Arquivada por', width: 24 },
  { key: 'archivedAt', label: 'Arquivada em', width: 19 },
  { key: 'description', label: 'Descricao', width: 45 },
];

export const requestReportColumns = [
  { key: 'activity', label: 'Atividade', width: 32 },
  { key: 'description', label: 'Descricao', width: 45 },
  { key: 'requester', label: 'Solicitante', width: 24 },
  { key: 'requesterSector', label: 'Setor solicitante', width: 20 },
  { key: 'targetSector', label: 'Setor responsavel', width: 20 },
  { key: 'responsible', label: 'Responsavel', width: 24 },
  { key: 'status', label: 'Status', width: 22 },
  { key: 'priority', label: 'Prioridade', width: 15 },
  { key: 'dueDate', label: 'Prazo', width: 14 },
  { key: 'createdAt', label: 'Criada em', width: 14 },
  { key: 'archivedBy', label: 'Arquivada por', width: 24 },
  { key: 'archivedAt', label: 'Arquivada em', width: 19 },
];

export const purchaseReportColumns = [
  { key: 'description', label: 'Descricao da compra', width: 45 },
  { key: 'notes', label: 'Observacao', width: 35 },
  { key: 'requester', label: 'Solicitante', width: 24 },
  { key: 'workLocation', label: 'Obra/local', width: 25 },
  { key: 'priority', label: 'Prioridade', width: 15 },
  { key: 'dueDate', label: 'Prazo desejado', width: 16 },
  { key: 'status', label: 'Status', width: 18 },
  { key: 'createdAt', label: 'Criada em', width: 14 },
  { key: 'archivedBy', label: 'Arquivada por', width: 24 },
  { key: 'archivedAt', label: 'Arquivada em', width: 19 },
];

export const buildKanbanReportRows = (tasks) => tasks.map((task) => ({
  activity: task.title,
  sector: task.sectorName,
  responsible: task.assignee,
  status: labelFor(kanbanStatuses, task.status),
  priority: labelFor(requestPriorities, task.priority),
  dueDate: formatDate(task.date),
  requester: task.requesterName,
  requesterSector: task.requesterSector,
  archivedBy: task.archivedByName,
  archivedAt: formatDateTime(task.archivedAt),
  description: task.description,
}));

export const buildRequestReportRows = (requests) => requests.map((request) => ({
  activity: request.stepName || request.title,
  description: request.description,
  requester: request.requesterName,
  requesterSector: request.requesterSector,
  targetSector: request.targetSector,
  responsible: request.responsibleName,
  status: labelFor(requestStatuses, request.requestStatus),
  priority: labelFor(requestPriorities, request.priority),
  dueDate: formatDate(request.dueDate),
  createdAt: formatDate(request.createdAt),
  archivedBy: request.archivedByName,
  archivedAt: formatDateTime(request.archivedAt),
}));

export const buildPurchaseReportRows = (requests) => requests.map((request) => ({
  description: request.description,
  notes: request.notes,
  requester: request.requesterName,
  workLocation: request.workLocation,
  priority: labelFor(purchasePriorities, request.priority),
  dueDate: formatDate(request.dueDate),
  status: labelFor(purchaseStatuses, request.status),
  createdAt: formatDate(request.createdAt),
  archivedBy: request.archivedByName,
  archivedAt: formatDateTime(request.archivedAt),
}));

export const archivedDateAccessor = (item) => item.archivedAt;

export const makeReportFileName = (name) => {
  const slug = String(name || 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'relatorio'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
};
