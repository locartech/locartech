import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react';
import { sectors, users } from '../../data/mockData';
import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';

const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );

function TaskCard({ task, onCompleteTask, onTaskStatus }) {
  const sector = sectors.find((item) => item.id === task.sectorId);
  const assignee = users.find((item) => item.id === task.assigneeId);
  const nextTask = task.nextTaskId ? task.nextTaskId : null;

  return (
    <article className="task-card">
      <div className="task-card-top">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>

      <h3>{task.title}</h3>
      <p>{task.description}</p>

      <dl className="task-meta">
        <div>
          <dt>Setor</dt>
          <dd>{sector?.name}</dd>
        </div>
        <div>
          <dt>Responsável</dt>
          <dd>{assignee?.name}</dd>
        </div>
        <div>
          <dt>Prazo</dt>
          <dd>{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt>Próxima etapa</dt>
          <dd>{nextTask ? 'Vinculada ao fluxo' : 'Não definida'}</dd>
        </div>
      </dl>

      {task.status !== 'done' ? (
        <div className="task-actions">
          {task.status === 'todo' ? (
            <button type="button" className="ghost-button" onClick={() => onTaskStatus(task.id, 'in_progress')}>
              <PlayCircle size={16} aria-hidden="true" />
              Iniciar
            </button>
          ) : null}
          {task.status === 'in_progress' ? (
            <button type="button" className="ghost-button" onClick={() => onTaskStatus(task.id, 'waiting')}>
              <Clock3 size={16} aria-hidden="true" />
              Aguardar
            </button>
          ) : null}
          <button type="button" className="primary-button" onClick={() => onCompleteTask(task.id)}>
            <CheckCircle2 size={16} aria-hidden="true" />
            Finalizar
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default TaskCard;
