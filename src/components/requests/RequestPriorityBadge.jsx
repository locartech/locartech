import { requestPriorities } from '../../data/requestsData';

function RequestPriorityBadge({ value }) {
  const label = requestPriorities.find((priority) => priority.id === value)?.label ?? value;
  return <span className={`request-priority request-priority-${value}`}>{label}</span>;
}

export default RequestPriorityBadge;
