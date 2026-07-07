import { X } from 'lucide-react';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
      )
    : 'Não informado';

function RequestModal({ request, onClose }) {
  if (!request) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-detail-modal" role="dialog" aria-modal="true" aria-labelledby="request-detail-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Detalhes da solicitação</p>
            <h2 id="request-detail-title">{request.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="request-detail-body">
          <p>{request.description}</p>
          <div className="request-detail-badges">
            <RequestStatusBadge value={request.status} />
            <RequestPriorityBadge value={request.priority} />
          </div>

          <dl className="request-detail-grid">
            <div>
              <dt>Solicitante</dt>
              <dd>{request.requesterName}</dd>
            </div>
            <div>
              <dt>Setor solicitante</dt>
              <dd>{request.requesterSector}</dd>
            </div>
            <div>
              <dt>Setor responsável</dt>
              <dd>{request.targetSector}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{request.responsibleName || 'Não definido'}</dd>
            </div>
            <div>
              <dt>Criação</dt>
              <dd>{formatDate(request.createdAt)}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{formatDate(request.dueDate)}</dd>
            </div>
            <div>
              <dt>Conclusão</dt>
              <dd>{formatDate(request.completedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default RequestModal;
