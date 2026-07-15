import { Archive, Pencil, Trash2 } from 'lucide-react';
import RequestPriorityBadge from '../requests/RequestPriorityBadge';
import StatusBadge from './StatusBadge';

function TaskRow({ task, onStatusChange, onDateChange, onEdit, onDelete, onArchive, canEdit, onBlockedAction }) {
  return (
    <div className="stage-row">
      <div className="stage-cell stage-title-cell">
        <span className="stage-title">{task.title}</span>
        {task.sourceRequestId ? (
          <span className="stage-source-chip">Solicitado por: {task.requesterSector}</span>
        ) : null}
      </div>
      <div className="stage-cell">
        <span className="stage-assignee">{task.assignee}</span>
      </div>
      <div className="stage-cell">
        <StatusBadge
          value={task.status}
          disabled={!canEdit}
          onBlockedAction={onBlockedAction}
          onChange={(status) => onStatusChange(task.id, status)}
        />
      </div>
      <div className="stage-cell">
        <RequestPriorityBadge value={task.priority ?? 'medium'} />
      </div>
      <div className="stage-cell">
        {canEdit ? (
          <input
            type="date"
            value={task.date || ''}
            min="2026-01-01"
            onChange={(event) => onDateChange(task.id, event.target.value)}
            aria-label={`Data da atividade ${task.title}`}
          />
        ) : (
          <button type="button" className="stage-readonly-date" onClick={(event) => onBlockedAction(event)}>
            {task.date ? new Date(`${task.date}T12:00:00`).toLocaleDateString('pt-BR') : 'Sem data'}
          </button>
        )}
      </div>
      <div className="stage-cell stage-actions-cell">
        <button type="button" className="table-icon-button archive" onClick={(event) => (canEdit ? onArchive(task) : onBlockedAction(event))} title="Arquivar atividade">
          <Archive size={16} aria-hidden="true" />
        </button>
        <button type="button" className="table-icon-button" onClick={(event) => (canEdit ? onEdit(task) : onBlockedAction(event))} title="Editar atividade">
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button type="button" className="table-icon-button danger" onClick={(event) => (canEdit ? onDelete(task.id) : onBlockedAction(event))} title="Excluir atividade">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default TaskRow;
