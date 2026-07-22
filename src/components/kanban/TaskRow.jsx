import { Archive, Eye, Pencil, Trash2 } from 'lucide-react';
import RowActionsMenu from '../common/RowActionsMenu';
import RequestPriorityBadge from '../requests/RequestPriorityBadge';
import StatusBadge from './StatusBadge';
import { formatDatePtBr, MAX_OPERATIONAL_DATE, MIN_OPERATIONAL_DATE } from '../../utils/dateUtils';

function TaskRow({ task, onStatusChange, onDateChange, onView, onEdit, onDelete, onArchive, canEdit, onBlockedAction }) {
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
            min={MIN_OPERATIONAL_DATE}
            max={MAX_OPERATIONAL_DATE}
            onChange={(event) => onDateChange(task.id, event.target.value)}
            aria-label={`Data da atividade ${task.title}`}
          />
        ) : (
          <button type="button" className="stage-readonly-date" onClick={(event) => onBlockedAction(event)}>
            {formatDatePtBr(task.date)}
          </button>
        )}
      </div>
      <div className="stage-cell stage-actions-cell">
        <RowActionsMenu
          items={[
            {
              label: 'Ver detalhes',
              icon: <Eye size={16} aria-hidden="true" />,
              onClick: () => onView(task),
            },
            {
              label: 'Arquivar atividade',
              icon: <Archive size={16} aria-hidden="true" />,
              onClick: (event) => (canEdit ? onArchive(task) : onBlockedAction(event)),
            },
            {
              label: 'Editar atividade',
              icon: <Pencil size={16} aria-hidden="true" />,
              onClick: (event) => (canEdit ? onEdit(task) : onBlockedAction(event)),
            },
            {
              label: 'Excluir atividade',
              icon: <Trash2 size={16} aria-hidden="true" />,
              tone: 'danger',
              onClick: (event) => (canEdit ? onDelete(task.id) : onBlockedAction(event)),
            },
          ]}
        />
      </div>
    </div>
  );
}

export default TaskRow;
