export const REQUESTS_STORAGE_KEY = 'locartech.requests.v2';

export const currentUser = {
  id: 'u1',
  name: 'Marina Costa',
  sector: 'Compras',
};

export const requestSectors = [
  'Compras',
  'Contabilidade',
  'Financeiro',
  'Frotas',
  'Planejamento',
  'Recursos Humanos',
];

export const requestStatuses = [
  { id: 'pending', label: 'Pendente' },
  { id: 'in_progress', label: 'Em andamento' },
  { id: 'completed', label: 'Concluida' },
  { id: 'canceled', label: 'Cancelada' },
];

export const requestPriorities = [
  { id: 'low', label: 'Baixa' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' },
  { id: 'urgent', label: 'Urgente' },
];

export const initialRequests = [];
