import { requestStatuses } from '../../data/requestsData';

function RequestStatusBadge({ value, editable = false, onChange }) {
  const label = requestStatuses.find((status) => status.id === value)?.label ?? value;

  if (!editable) {
    return <span className={`request-status request-status-${value}`}>{label}</span>;
  }

  return (
    <label className={`request-status-select request-status-${value}`}>
      <span className="sr-only">Status da solicitação</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {requestStatuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default RequestStatusBadge;
