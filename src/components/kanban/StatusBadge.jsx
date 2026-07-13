import { kanbanStatuses } from '../../data/kanbanData';

function StatusBadge({ value, onChange, disabled = false }) {
  const label = kanbanStatuses.find((status) => status.id === value)?.label ?? value;

  if (disabled) {
    return <span className={`stage-status stage-status-${value}`}>{label}</span>;
  }

  return (
    <label className={`stage-status-select stage-status-${value}`}>
      <span className="sr-only">Status da atividade</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {kanbanStatuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default StatusBadge;
