import { Search } from 'lucide-react';
import { purchasePriorities, purchaseStatuses } from '../../data/purchaseRequestsData';

function PurchaseRequestFilters({ filters, onChange }) {
  const updateFilter = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="purchase-filters">
      <label className="purchase-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={filters.query}
          onChange={(event) => updateFilter('query', event.target.value)}
          placeholder="Buscar por item, descricao, solicitante ou obra"
        />
      </label>
      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="all">Todos</option>
          {purchaseStatuses.map((status) => (
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
          {purchasePriorities.map((priority) => (
            <option key={priority.id} value={priority.id}>
              {priority.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default PurchaseRequestFilters;
