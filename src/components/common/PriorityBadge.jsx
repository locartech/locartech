import { priorityLabels } from '../../data/mockData';

function PriorityBadge({ priority }) {
  return <span className={`priority-badge priority-${priority}`}>{priorityLabels[priority] ?? priority}</span>;
}

export default PriorityBadge;
