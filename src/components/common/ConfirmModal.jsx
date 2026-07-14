import { X } from 'lucide-react';

function ConfirmModal({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="edit-modal-header">
          <h2 id="confirm-modal-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onCancel} title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className="primary-button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
