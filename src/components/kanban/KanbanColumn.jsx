import EmptyState from '../common/EmptyState';
import TaskCard from './TaskCard';

function KanbanColumn({ status, tasks, onCompleteTask, onTaskStatus }) {
  return (
    <section className="kanban-column" aria-labelledby={`column-${status.id}`}>
      <div className="column-header">
        <h2 id={`column-${status.id}`}>{status.label}</h2>
        <span>{tasks.length}</span>
      </div>

      <div className="column-stack">
        {tasks.length === 0 ? (
          <EmptyState title="Sem tarefas" description="Nenhuma atividade nesta etapa agora." />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onCompleteTask={onCompleteTask}
              onTaskStatus={onTaskStatus}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default KanbanColumn;
