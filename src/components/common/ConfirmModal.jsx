import { AlertTriangle, HelpCircle, X } from 'lucide-react';

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'warning',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const Icon = tone === 'primary' ? HelpCircle : AlertTriangle;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className={`edit-modal confirm-modal confirm-modal-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button type="button" className="icon-button confirm-modal-close" onClick={onCancel} title="Fechar">
          <X size={18} aria-hidden="true" />
        </button>

        <div className="confirm-modal-body">
          <span className={`confirm-modal-icon confirm-modal-icon-${tone}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
          <h2 id="confirm-modal-title">{title}</h2>
          <p>{message}</p>

          {error ? <div className="auth-alert error confirm-modal-alert">{error}</div> : null}

          <div className="modal-actions confirm-modal-actions">
            <button type="button" className="ghost-button" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`primary-button${tone === 'warning' ? ' confirm-modal-warning-button' : ''}`}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Aguarde...' : confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
