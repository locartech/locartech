import { Bell } from 'lucide-react';

const pageDetails = {
  dashboard: {
    eyebrow: 'Visão executiva',
    title: 'Central de gestão Locartech',
    subtitle: 'Acompanhe fluxos, alertas e indicadores operacionais.',
  },
  kanban: {
    eyebrow: 'Gestão de etapas',
    title: 'Kanban operacional',
    subtitle: 'Organize etapas por setor com status, prazos e responsáveis.',
  },
  requests: {
    eyebrow: 'Demandas internas',
    title: 'Solicitações',
    subtitle: 'Gerencie pedidos entre áreas da empresa.',
  },
  chat: {
    eyebrow: 'Comunicação interna',
    title: 'Chat corporativo',
    subtitle: 'Converse com pessoas e grupos por setor.',
  },
  notifications: {
    eyebrow: 'Central de avisos',
    title: 'Notificações',
    subtitle: 'Veja atualizações de fluxos, solicitações e atividades.',
  },
  sectors: {
    eyebrow: 'Estrutura organizacional',
    title: 'Setores',
    subtitle: 'Consulte áreas, responsáveis e atividades em aberto.',
  },
  sectorKnowledge: {
    eyebrow: 'Base de conhecimento',
    title: 'Materiais por setor',
    subtitle: 'Consulte documentos, manuais, links e processos internos.',
  },
  members: {
    eyebrow: 'Administração',
    title: 'Gerenciamento de membros',
    subtitle: 'Controle contas, setores e permissões dos membros.',
  },
};

function Header({ activePage, unreadCount }) {
  const details = pageDetails[activePage] ?? pageDetails.dashboard;

  return (
    <header className="top-header">
      <div className="header-title-block">
        <p className="eyebrow">{details.eyebrow}</p>
        <h1>{details.title}</h1>
        <span>{details.subtitle}</span>
      </div>

      <div className="header-actions">
        <button className="notification-button" type="button" title="Notificações pendentes">
          <Bell size={18} aria-hidden="true" />
          {unreadCount > 0 ? <span>{unreadCount}</span> : null}
        </button>
      </div>
    </header>
  );
}

export default Header;
