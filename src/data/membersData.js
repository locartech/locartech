export const MEMBERS_STORAGE_KEY = 'locartech.members.v1';

export const memberSectors = [
  'Compras',
  'Contabilidade',
  'Financeiro',
  'Frotas',
  'Planejamento',
  'Recursos Humanos',
];

export const accountTypes = [
  { id: 'admin', label: 'Administrador principal' },
  { id: 'member', label: 'Membro' },
];

export const memberStatuses = ['Ativo', 'Inativo', 'Pendente', 'Rejeitado'];

export const initialMembers = [
  {
    id: 'u1',
    name: 'Marina Costa',
    email: 'admin@locartech.com.br',
    sector: 'Compras',
    role: 'Administrador principal',
    accountType: 'admin',
    status: 'Ativo',
    joinedAt: '2026-07-01',
    lastAccess: '2026-07-06',
    avatarInitials: 'MC',
  },
  {
    id: 'u2',
    name: 'Lucas Almeida',
    email: 'lucas@locartech.com.br',
    sector: 'Financeiro',
    role: 'Analista Financeiro',
    accountType: 'member',
    status: 'Ativo',
    joinedAt: '2026-07-01',
    lastAccess: '2026-07-06',
    avatarInitials: 'LA',
  },
  {
    id: 'u3',
    name: 'Helena Prado',
    email: 'helena@locartech.com.br',
    sector: 'Compras',
    role: 'Analista de Compras',
    accountType: 'member',
    status: 'Ativo',
    joinedAt: '2026-07-02',
    lastAccess: '2026-07-05',
    avatarInitials: 'HP',
  },
  {
    id: 'u4',
    name: 'Patrícia Gomes',
    email: 'patricia@locartech.com.br',
    sector: 'Contabilidade',
    role: 'Analista Contábil',
    accountType: 'member',
    status: 'Ativo',
    joinedAt: '2026-07-02',
    lastAccess: '2026-07-04',
    avatarInitials: 'PG',
  },
];
