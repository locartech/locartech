import { X } from 'lucide-react';
import { useState } from 'react';
import { purchasePriorities } from '../../data/purchaseRequestsData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { formatRequestDate } from '../../utils/requestUtils';

function priorityLabel(priorityId) {
  return purchasePriorities.find((priority) => priority.id === priorityId)?.label ?? priorityId;
}

function PurchaseRequestEditReviewModal({ request, edit, onClose, onReview }) {
  useEscapeKey(onClose);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReview = async (approve) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onReview(edit.id, approve, reviewNote);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-edit-review-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Compras solicitadas</p>
            <h2 id="purchase-edit-review-title">Pedido de edicao</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="request-detail-body">
          {edit.reason ? <p>Motivo: {edit.reason}</p> : null}

          <dl className="request-detail-grid">
            <div>
              <dt>Descricao atual</dt>
              <dd>{request.description}</dd>
            </div>
            <div>
              <dt>Descricao proposta</dt>
              <dd>{edit.proposedDescription}</dd>
            </div>
            <div>
              <dt>Observacao atual</dt>
              <dd>{request.notes || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Observacao proposta</dt>
              <dd>{edit.proposedNotes || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Obra/local atual</dt>
              <dd>{request.workLocation || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Obra/local proposto</dt>
              <dd>{edit.proposedWorkLocation || 'Nao informado'}</dd>
            </div>
            <div>
              <dt>Prioridade atual</dt>
              <dd>{priorityLabel(request.priority)}</dd>
            </div>
            <div>
              <dt>Prioridade proposta</dt>
              <dd>{priorityLabel(edit.proposedPriority)}</dd>
            </div>
            <div>
              <dt>Prazo atual</dt>
              <dd>{formatRequestDate(request.dueDate, 'Sem prazo')}</dd>
            </div>
            <div>
              <dt>Prazo proposto</dt>
              <dd>{formatRequestDate(edit.proposedDueDate, 'Sem prazo')}</dd>
            </div>
          </dl>

          <label>
            <span>Observacao da avaliacao (opcional)</span>
            <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button danger" disabled={submitting} onClick={() => handleReview(false)}>
              Recusar edicao
            </button>
            <button type="button" className="primary-button" disabled={submitting} onClick={() => handleReview(true)}>
              Aprovar edicao
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PurchaseRequestEditReviewModal;
