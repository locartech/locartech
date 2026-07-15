import { Bell } from 'lucide-react';

const pageDetails = {
  dashboard: {
    eyebrow: 'Visao executiva',
    title: 'Central de gestao Locartech',
    subtitle: 'Acompanhe fluxos, alertas e indicadores operacionais.',
  },
  kanban: {
    eyebrow: 'Gestao de atividades',
    title: 'Kanban operacional',
    subtitle: 'Organize atividades por setor com status, prazos e responsaveis.',
  },
  requests: {
    eyebrow: 'Demandas internas',
    title: 'Solicitacoes',
    subtitle: 'Gerencie pedidos entre areas da empresa.',
  },
  purchaseRequests: {
    eyebrow: 'Compras solicitadas',
    title: 'Solicitacoes de compras',
    subtitle: 'Acompanhe pedidos de compra enviados pela obra para o setor de Compras.',
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
    eyebrow: '',
    title: 'Registros do setor',
    subtitle: 'Consulte manuais do setor, POPs, documentos e outros arquivos internos.',
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
        {details.eyebrow ? <p className="eyebrow">{details.eyebrow}</p> : null}
        <h1>{details.title}</h1>
        <span>{details.subtitle}</span>
      </div>

      <div className="header-actions">
        {onOpenNotifications ? (
          <button
            className="notification-button"
            type="button"
            title="Notificacoes pendentes"
            onClick={onOpenNotifications}
          >
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 ? <span>{unreadCount}</span> : null}
          </button>
        ) : null}
      </div>
    </header>
  );
}

export default Header;
