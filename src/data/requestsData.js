export const REQUESTS_STORAGE_KEY = 'locartech.requests.v3';

export const requestSectors = [
  'Compras',
  'Contabilidade',
  'Financeiro',
  'Frotas',
  'Planejamento',
  'Recursos Humanos',
];

export const requestStatusIds = {
  pendingApproval: 'pending_approval',
  approved: 'approved',
  rejected: 'rejected',
  canceled: 'canceled',
};

export const requestStatuses = [
  { id: requestStatusIds.pendingApproval, label: 'Pendente de aprovacao' },
  { id: requestStatusIds.approved, label: 'Aprovada' },
  { id: requestStatusIds.rejected, label: 'Recusada' },
  { id: requestStatusIds.canceled, label: 'Cancelada' },
];

export const requestPriorities = [
  { id: 'low', label: 'Baixa' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' },
  { id: 'urgent', label: 'Urgente' },
];

export const initialRequests = [];
