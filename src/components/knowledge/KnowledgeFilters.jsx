import { Search } from 'lucide-react';
import { knowledgeTypes } from '../../data/knowledgeData';

function KnowledgeFilters({ filters, onChange, simplified = false }) {
  const updateFilter = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="knowledge-filters">
      <label className="knowledge-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={filters.query}
          onChange={(event) => updateFilter('query', event.target.value)}
          placeholder={simplified ? 'Buscar por nome ou descricao' : 'Buscar por titulo, descricao ou tipo'}
        />
      </label>
      {!simplified ? (
        <label>
          <span>Tipo</span>
          <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            <option value="Todos">Todos</option>
            {knowledgeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="knowledge-filter-period">
        <label>
          <span>Publicado de</span>
          <input
            type="date"
            value={filters.publishedFrom || ''}
            onChange={(event) => updateFilter('publishedFrom', event.target.value)}
          />
        </label>
        <label>
          <span>Ate</span>
          <input
            type="date"
            value={filters.publishedTo || ''}
            onChange={(event) => updateFilter('publishedTo', event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default KnowledgeFilters;
