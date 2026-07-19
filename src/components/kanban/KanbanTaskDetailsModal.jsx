import { X } from 'lucide-react';
import { kanbanStatuses } from '../../data/kanbanData';
import { requestPriorities } from '../../data/requestsData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatDateTime, formatRequestDate } from '../../utils/requestUtils';

function KanbanTaskDetailsModal({ task, onClose }) {
  useEscapeKey(onClose, Boolean(task));
  if (!task) return null;

  const statusLabel = kanbanStatuses.find((status) => status.id === task.status)?.label ?? task.status;
  const priorityLabel = requestPriorities.find((priority) => priority.id === task.priority)?.label ?? task.priority;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-detail-modal" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Detalhes da atividade</p>
            <h2 id="task-detail-title">{task.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="request-detail-body">
          <p>{task.description || 'Sem descricao.'}</p>

          <dl className="request-detail-grid">
            <div>
              <dt>Setor</dt>
              <dd>{task.sectorName}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{statusLabel}</dd>
            </div>
            <div>
              <dt>Responsavel</dt>
              <dd>{task.assignee || 'Nao definido'}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{priorityLabel}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{formatRequestDate(task.date, 'Sem prazo')}</dd>
            </div>
            <div>
              <dt>Criada em</dt>
              <dd>{formatDateTime(task.createdAt, 'Nao informado')}</dd>
            </div>
            {task.sourceRequestId ? (
              <div>
                <dt>Solicitado por</dt>
                <dd>{task.requesterName} ({task.requesterSector})</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    </div>
  );
}

export default KanbanTaskDetailsModal;
