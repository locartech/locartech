import { statuses } from '../../data/mockData';

function StatusBadge({ status }) {
  const label = statuses.find((item) => item.id === status)?.label ?? status;
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

export default StatusBadge;
