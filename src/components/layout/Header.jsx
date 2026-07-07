import { Bell } from 'lucide-react';

const pageDetails = {
  dashboard: {
    eyebrow: 'Visao executiva',
    title: 'Central de gestao Locartech',
    subtitle: 'Acompanhe fluxos, alertas e indicadores operacionais.',
  },
  kanban: {
    eyebrow: 'Gestao de etapas',
    title: 'Kanban operacional',
    subtitle: 'Organize etapas por setor com status, prazos e responsaveis.',
  },
  requests: {
    eyebrow: 'Demandas internas',
    title: 'Solicitacoes',
    subtitle: 'Gerencie pedidos entre areas da empresa.',
  },
  chat: {
    eyebrow: 'Comunicacao interna',
    title: 'Chat corporativo',
    subtitle: 'Converse com pessoas e grupos por setor.',
  },
  notifications: {
    eyebrow: 'Central de avisos',
    title: 'Notificacoes',
    subtitle: 'Veja atualizacoes de fluxos, solicitacoes e atividades.',
  },
  sectors: {
    eyebrow: 'Estrutura organizacional',
    title: 'Setores',
    subtitle: 'Consulte areas, responsaveis e atividades em aberto.',
  },
  sectorKnowledge: {
    eyebrow: 'Base de conhecimento',
    title: 'Materiais por setor',
    subtitle: 'Consulte documentos, manuais, links e processos internos.',
  },
  members: {
    eyebrow: 'Administracao',
    title: 'Gerenciamento de membros',
    subtitle: 'Controle contas, setores e permissoes dos membros.',
  },
};

function Header({ activePage, unreadCount, onOpenNotifications }) {
  const details = pageDetails[activePage] ?? pageDetails.dashboard;

  return (
    <header className="top-header">
      <div className="header-title-block">
        <p className="eyebrow">{details.eyebrow}</p>
        <h1>{details.title}</h1>
        <span>{details.subtitle}</span>
      </div>

      <div className="header-actions">
        <button
          className="notification-button"
          type="button"
          title="Notificacoes pendentes"
          onClick={onOpenNotifications}
        >
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 ? <span>{unreadCount}</span> : null}
        </button>
      </div>
    </header>
  );
}

export default Header;
