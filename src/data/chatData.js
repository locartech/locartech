export const CHAT_STORAGE_KEY = 'locartech.chat.v2';

export const chatSectors = [
  'Compras',
  'Contabilidade',
  'Financeiro',
  'Frotas',
  'Planejamento',
  'Recursos Humanos',
];

export const chatCurrentUser = {
  id: 'u1',
  name: 'Marina Costa',
  sector: 'Compras',
  role: 'Analista de Compras',
  avatarInitials: 'MC',
  status: 'online',
};

export const chatUsers = [
  chatCurrentUser,
  { id: 'u2', name: 'Helena Prado', sector: 'Compras', role: 'Coordenadora de Compras', avatarInitials: 'HP', status: 'offline' },
  { id: 'u3', name: 'Renato Silva', sector: 'Contabilidade', role: 'Analista Contabil', avatarInitials: 'RS', status: 'online' },
  { id: 'u4', name: 'Beatriz Duarte', sector: 'Contabilidade', role: 'Assistente Contabil', avatarInitials: 'BD', status: 'offline' },
  { id: 'u5', name: 'Lucas Almeida', sector: 'Financeiro', role: 'Analista Financeiro', avatarInitials: 'LA', status: 'online' },
  { id: 'u6', name: 'Eduardo Martins', sector: 'Financeiro', role: 'Coordenador Financeiro', avatarInitials: 'EM', status: 'online' },
  { id: 'u7', name: 'Bruno Teixeira', sector: 'Frotas', role: 'Supervisor de Frotas', avatarInitials: 'BT', status: 'online' },
  { id: 'u8', name: 'Amanda Castro', sector: 'Frotas', role: 'Analista de Frotas', avatarInitials: 'AC', status: 'offline' },
  { id: 'u9', name: 'Clara Ribeiro', sector: 'Planejamento', role: 'Analista de Planejamento', avatarInitials: 'CR', status: 'online' },
  { id: 'u10', name: 'Mateus Rocha', sector: 'Planejamento', role: 'Coordenador de Planejamento', avatarInitials: 'MR', status: 'offline' },
  { id: 'u11', name: 'Juliana Freitas', sector: 'Recursos Humanos', role: 'Analista de RH', avatarInitials: 'JF', status: 'online' },
  { id: 'u12', name: 'Marcelo Nunes', sector: 'Recursos Humanos', role: 'Business Partner', avatarInitials: 'MN', status: 'offline' },
];

export const initialChatConversations = [];
