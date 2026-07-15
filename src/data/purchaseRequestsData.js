export const PURCHASE_REQUESTS_STORAGE_KEY = 'locartech.purchase-requests.v1';
export const PURCHASE_STATUS_OVERRIDES_STORAGE_KEY = 'locartech.purchase-status-overrides.v1';

export const purchaseRequestSource = 'Gestao da obra';
export const purchaseRequestTargetSector = 'Compras';

export const purchaseStatuses = [
  { id: 'pending_approval', label: 'Nova' },
  { id: 'approved', label: 'Em andamento' },
  { id: 'completed', label: 'Concluida' },
  { id: 'rejected', label: 'Recusada' },
  { id: 'canceled', label: 'Cancelada' },
];

export const purchasePriorities = [
  { id: 'low', label: 'Baixa' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' },
  { id: 'urgent', label: 'Urgente' },
];

export const initialPurchaseRequests = [];
