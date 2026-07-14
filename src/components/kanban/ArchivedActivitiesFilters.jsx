import { kanbanSectors, kanbanStatuses } from '../../data/kanbanData';
import { requestPriorities } from '../../data/requestsData';

export const emptyArchivedFilters = {
  query: '',
  sector: 'all',
  responsible: 'all',
  status: 'all',
  priority: 'all',
  from: '',
  to: '',
};

function ArchivedActivitiesFilters({ filters, onChange, responsibleOptions }) {
  const updateFilter = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <div className="request-filters archived-filters">
      <label>
        <span>Buscar</span>
        <input
          type="text"
          value={filters.query}
          onChange={(event) => updateFilter('query', event.target.value)}
          placeholder="Atividade, responsável, setor ou solicitante"
        />
      </label>
      <label>
        <span>Setor</span>
        <select value={filters.sector} onChange={(event) => updateFilter('sector', event.target.value)}>
          <option value="all">Todos</option>
          {kanbanSectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Responsável</span>
        <select value={filters.responsible} onChange={(event) => updateFilter('responsible', event.target.value)}>
          <option value="all">Todos</option>
          {responsibleOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Status final</span>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="all">Todos</option>
          {kanbanStatuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
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
        <span>Arquivado de</span>
        <input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} />
      </label>
      <label>
        <span>Arquivado até</span>
        <input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} />
      </label>
      <button type="button" className="ghost-button" onClick={() => onChange(emptyArchivedFilters)}>
        Limpar filtros
      </button>
    </div>
  );
}

export default ArchivedActivitiesFilters;
