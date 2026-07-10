import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { purchasePriorities } from '../../data/purchaseRequestsData';
import { validatePurchaseRequest } from '../../utils/purchaseRequestUtils';

const emptyForm = {
  item: '',
  description: '',
  requesterName: '',
  workLocation: '',
  priority: 'medium',
  dueDate: '',
};

function PurchaseRequestFormModal({ currentUser, onClose, onSubmit }) {
  const [draft, setDraft] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      requesterName: currentUser?.name ?? '',
    }));
  }, [currentUser?.name]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validatePurchaseRequest(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Compras solicitadas</p>
            <h2 id="purchase-form-title">Nova solicitacao de compra</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form purchase-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}

          <div className="form-grid-two">
            <label>
              <span>Item solicitado</span>
              <input value={draft.item} onChange={(event) => updateDraft('item', event.target.value)} />
            </label>

            <label>
              <span>Solicitante</span>
              <input value={draft.requesterName} onChange={(event) => updateDraft('requesterName', event.target.value)} />
            </label>
          </div>

          <label>
            <span>Descricao da compra</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Obra/local</span>
              <input
                value={draft.workLocation}
                onChange={(event) => updateDraft('workLocation', event.target.value)}
                placeholder="Opcional"
              />
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

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Criar solicitacao
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default PurchaseRequestFormModal;
