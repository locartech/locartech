import { X } from 'lucide-react';
import { useState } from 'react';

function RequestRejectModal({ request, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!request) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Informe o motivo da recusa.');
      return;
    }
    onConfirm(request, reason);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="reject-request-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Recusar solicitacao</p>
            <h2 id="reject-request-title">{request.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form request-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}
          <label>
            <span>Motivo da recusa</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button danger-action">
              Recusar solicitacao
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RequestRejectModal;
