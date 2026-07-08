import { requestStatuses } from '../../data/requestsData';

function RequestStatusBadge({ value }) {
  const label = requestStatuses.find((status) => status.id === value)?.label ?? value;
  return <span className={`request-status request-status-${value}`}>{label}</span>;
}

export default RequestStatusBadge;
