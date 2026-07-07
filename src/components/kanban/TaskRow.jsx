import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';

function TaskRow({ task, onStatusChange, onDateChange, onEdit, onDelete, onComplete }) {
  return (
    <div className="stage-row">
      <div className="stage-cell stage-title-cell">
        <span className="stage-title">{task.title}</span>
      </div>
      <div className="stage-cell">
        <span className="stage-assignee">{task.assignee}</span>
      </div>
      <div className="stage-cell">
        <StatusBadge value={task.status} onChange={(status) => onStatusChange(task.id, status)} />
      </div>
      <div className="stage-cell">
        <input
          type="date"
          value={task.date}
          min="2026-01-01"
          onChange={(event) => onDateChange(task.id, event.target.value)}
          aria-label={`Data da etapa ${task.title}`}
        />
      </div>
      <div className="stage-cell stage-actions-cell">
        {task.status !== 'done' ? (
          <button type="button" className="table-icon-button success" onClick={() => onComplete(task.id)} title="Marcar como concluída">
            <CheckCircle2 size={16} aria-hidden="true" />
          </button>
        ) : null}
        <button type="button" className="table-icon-button" onClick={() => onEdit(task)} title="Editar etapa">
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className="table-icon-button danger" onClick={() => onDelete(task.id)} title="Excluir etapa">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default TaskRow;
