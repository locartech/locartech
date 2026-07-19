import { X } from 'lucide-react';
import { useState } from 'react';
import { purchasePriorities } from '../../data/purchaseRequestsData';
import useEscapeKey from '../../hooks/useEscapeKey';

function PurchaseRequestEditModal({ request, onClose, onSubmit }) {
  useEscapeKey(onClose);
  const [draft, setDraft] = useState({
    description: request.description,
    notes: request.notes,
    workLocation: request.workLocation,
    priority: request.priority,
    dueDate: request.dueDate,
    reason: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!draft.description.trim()) return setError('Informe a descricao da compra.');
    if (!draft.priority) return setError('Informe a prioridade.');
    if (!draft.dueDate) return setError('Informe o prazo desejado.');

    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-edit-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Compras solicitadas</p>
            <h2 id="purchase-edit-title">Pedir edicao da compra</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form purchase-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}
          <p className="muted-cell">
            Como essa compra ja foi enviada, as alteracoes precisam ser aprovadas pelo setor de Compras.
          </p>

          <label>
            <span>Descricao da compra</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          <label>
            <span>Observacao</span>
            <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Obra/local</span>
              <input value={draft.workLocation} onChange={(event) => updateDraft('workLocation', event.target.value)} />
            </label>

            <label>
              <span>Prioridade</span>
              <select value={draft.priority} onChange={(event) => updateDraft('priority', event.target.value)}>
                {purchasePriorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Prazo desejado</span>
            <input type="date" value={draft.dueDate} onChange={(event) => updateDraft('dueDate', event.target.value)} />
          </label>

          <label>
            <span>Motivo da alteracao (opcional)</span>
            <textarea value={draft.reason} onChange={(event) => updateDraft('reason', event.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar pedido de edicao'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default PurchaseRequestEditModal;
