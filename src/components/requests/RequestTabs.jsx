const tabs = [
  { id: 'received', label: 'Recebidas' },
  { id: 'sent', label: 'Enviadas' },
  { id: 'all', label: 'Todas' },
];

function RequestTabs({ activeTab, onTabChange, counts }) {
  return (
    <div className="request-tabs" role="tablist" aria-label="Filtros de solicitações">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
          <span>{counts[tab.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

export default RequestTabs;
