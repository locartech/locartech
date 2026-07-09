export const sectors = [
  {
    id: 'compras',
    name: 'Compras',
    description: 'Centraliza compras, fornecedores e aquisicoes internas.',
    manager: 'Marina Costa',
  },
  {
    id: 'contabilidade',
    name: 'Contabilidade',
    description: 'Organiza documentos contabeis, conferencias e fechamentos.',
    manager: 'Patricia Gomes',
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Acompanha pagamentos, recebimentos e controles financeiros.',
    manager: 'Lucas Almeida',
  },
  {
    id: 'frotas',
    name: 'Frotas',
    description: 'Gerencia veiculos, manutencoes e disponibilidade operacional.',
    manager: 'Bruno Teixeira',
  },
  {
    id: 'planejamento',
    name: 'Planejamento',
    description: 'Acompanha capacidade, prioridades e previsoes de demanda.',
    manager: 'Clara Ribeiro',
  },
  {
    id: 'recursos-humanos',
    name: 'Recursos Humanos',
    description: 'Cuida de pessoas, documentacao interna e desenvolvimento.',
    manager: 'Juliana Freitas',
  },
];

export const users = [
  { id: 'user-1', name: 'Marina Costa', role: 'Analista de Compras', sectorId: 'compras' },
  { id: 'user-2', name: 'Lucas Almeida', role: 'Analista Financeiro', sectorId: 'financeiro' },
  { id: 'user-3', name: 'Helena Prado', role: 'Analista de Compras', sectorId: 'compras' },
  { id: 'user-4', name: 'Patricia Gomes', role: 'Analista Contabil', sectorId: 'contabilidade' },
];
