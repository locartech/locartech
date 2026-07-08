import { requestPriorities, requestSectors, requestStatuses } from '../../data/requestsData';

function RequestFilters({ filters, onChange }) {
  const updateFilter = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="request-filters">
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="all">Todos</option>
          {requestStatuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Setor solicitante</span>
        <select value={filters.requesterSector} onChange={(event) => updateFilter('requesterSector', event.target.value)}>
          <option value="all">Todos</option>
          {requestSectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Setor destino</span>
        <select value={filters.targetSector} onChange={(event) => updateFilter('targetSector', event.target.value)}>
          <option value="all">Todos</option>
          {requestSectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Prioridade</span>
        <select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}>
          <option value="all">Todas</option>
          {requestPriorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Data</span>
        <input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
      </label>
      <button
        type="button"
        className="ghost-button"
        onClick={() => onChange({ status: 'all', requesterSector: 'all', targetSector: 'all', priority: 'all', date: '' })}
      >
        Limpar filtros
      </button>
    </div>
  );
}

export default RequestFilters;
