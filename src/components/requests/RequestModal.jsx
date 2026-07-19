import { X } from 'lucide-react';
import { kanbanStatuses } from '../../data/kanbanData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatDateTime, formatRequestDate } from '../../utils/requestUtils';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';

function RequestModal({ request, onClose }) {
  useEscapeKey(onClose, Boolean(request));
  if (!request) return null;

  const kanbanStatusLabel = kanbanStatuses.find((status) => status.id === request.kanbanStatus)?.label ?? request.kanbanStatus;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-detail-modal" role="dialog" aria-modal="true" aria-labelledby="request-detail-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Detalhes da solicitacao</p>
            <h2 id="request-detail-title">{request.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="request-detail-body">
          <p>{request.description || 'Sem descricao.'}</p>
          <div className="request-detail-badges">
            <RequestStatusBadge value={request.requestStatus} />
            <RequestPriorityBadge value={request.priority} />
          </div>

          <dl className="request-detail-grid">
            <div>
              <dt>Atividade</dt>
              <dd>{request.stepName}</dd>
            </div>
            <div>
              <dt>Status no Kanban</dt>
              <dd>{kanbanStatusLabel}</dd>
            </div>
            <div>
              <dt>Solicitante</dt>
              <dd>{request.requesterName}</dd>
            </div>
            <div>
              <dt>Setor solicitante</dt>
              <dd>{request.requesterSector}</dd>
            </div>
            <div>
              <dt>Setor responsavel</dt>
              <dd>{request.targetSector}</dd>
            </div>
            <div>
              <dt>Responsavel</dt>
              <dd>{request.responsibleName || 'Nao definido'}</dd>
            </div>
            <div>
              <dt>Criada em</dt>
              <dd>{formatDateTime(request.createdAtFull, 'Nao informado')}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{formatRequestDate(request.dueDate, 'Nao informado')}</dd>
            </div>
            <div>
              <dt>Aprovacao</dt>
              <dd>{formatRequestDate(request.approvedAt, 'Nao informado')}</dd>
            </div>
            <div>
              <dt>Recusa</dt>
              <dd>{formatRequestDate(request.rejectedAt, 'Nao informado')}</dd>
            </div>
            <div>
              <dt>Tarefa Kanban</dt>
              <dd>{request.generatedTaskId ? 'Gerada' : 'Nao gerada'}</dd>
            </div>
            <div>
              <dt>Motivo da recusa</dt>
              <dd>{request.rejectionReason || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Link do Drive</dt>
              <dd>
                {request.driveLink ? (
                  <a href={request.driveLink} target="_blank" rel="noreferrer">
                    Abrir link
                  </a>
                ) : (
                  'Nao informado'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default RequestModal;
