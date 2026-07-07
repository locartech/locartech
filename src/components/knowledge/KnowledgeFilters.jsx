import { Search } from 'lucide-react';
import { knowledgeTypes } from '../../data/knowledgeData';

function KnowledgeFilters({ filters, onChange }) {
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
          placeholder="Buscar por título, responsável, descrição ou tipo"
        />
      </label>
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
    </div>
  );
}

export default KnowledgeFilters;
