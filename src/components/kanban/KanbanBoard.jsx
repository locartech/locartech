import { statuses } from '../../data/mockData';
import KanbanColumn from './KanbanColumn';

function KanbanBoard({ tasks, onCompleteTask, onTaskStatus }) {
  return (
    <div className="kanban-board">
      {statuses.map((status) => (
        <KanbanColumn
          key={status.id}
          status={status}
          tasks={tasks.filter((task) => task.status === status.id)}
          onCompleteTask={onCompleteTask}
          onTaskStatus={onTaskStatus}
        />
      ))}
    </div>
  );
}

export default KanbanBoard;
