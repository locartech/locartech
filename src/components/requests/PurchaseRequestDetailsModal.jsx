import { X } from 'lucide-react';
import { purchasePriorities, purchaseStatuses } from '../../data/purchaseRequestsData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatDateTime, formatRequestDate } from '../../utils/requestUtils';

function PurchaseRequestDetailsModal({ request, onClose }) {
  useEscapeKey(onClose, Boolean(request));
  if (!request) return null;

  const statusLabel = purchaseStatuses.find((status) => status.id === request.status)?.label ?? request.status;
  const priorityLabel = purchasePriorities.find((priority) => priority.id === request.priority)?.label ?? request.priority;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-detail-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-detail-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Detalhes da compra solicitada</p>
            <h2 id="purchase-detail-title">{request.description}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="request-detail-body">
          <p>{request.notes || 'Sem observacao.'}</p>

          <dl className="request-detail-grid">
            <div>
              <dt>Status</dt>
              <dd>{statusLabel}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{priorityLabel}</dd>
            </div>
            <div>
              <dt>Solicitante</dt>
              <dd>{request.requesterName}</dd>
            </div>
            <div>
              <dt>Obra/local</dt>
              <dd>{request.workLocation || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{formatRequestDate(request.dueDate, 'Sem prazo')}</dd>
            </div>
            <div>
              <dt>Solicitada em</dt>
              <dd>{formatDateTime(request.createdAtFull, 'Nao informado')}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default PurchaseRequestDetailsModal;
