export const PURCHASE_REQUESTS_STORAGE_KEY = 'locartech.purchase-requests.v1';

export const purchaseRequestSource = 'Gestao da obra';
export const purchaseRequestTargetSector = 'Compras';

export const purchaseStatuses = [
  { id: 'nova', label: 'Nova' },
  { id: 'em_analise', label: 'Em analise' },
  { id: 'aprovada', label: 'Aprovada' },
  { id: 'em_compra', label: 'Em compra' },
  { id: 'comprada', label: 'Comprada' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'recusada', label: 'Recusada' },
  { id: 'cancelada', label: 'Cancelada' },
];

export const purchasePriorities = [
  { id: 'low', label: 'Baixa' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' },
  { id: 'urgent', label: 'Urgente' },
];

export const initialPurchaseRequests = [];
