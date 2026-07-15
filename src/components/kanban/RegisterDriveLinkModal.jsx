import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '-';

function RegisterDriveLinkModal({ report, onClose, onSubmit }) {
  useEscapeKey(onClose, Boolean(report));
  const [draft, setDraft] = useState({ name: '', periodStart: '', periodEnd: '', driveLink: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (report) {
      setDraft({
        name: report.name ?? '',
        periodStart: report.periodStart ?? '',
        periodEnd: report.periodEnd ?? '',
        driveLink: report.driveLink ?? '',
        notes: report.notes ?? '',
      });
      setError('');
    }
  }, [report]);

  if (!report) return null;

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!draft.name.trim()) return setError('Informe o nome do relatório.');
    if (!draft.driveLink.trim()) return setError('Informe o link do Drive.');
    if (!/^https?:\/\//i.test(draft.driveLink.trim())) {
      return setError('O link do Drive deve começar com http:// ou https://.');
    }
    if (!report.totalExported) return setError('Quantidade de atividades exportadas invalida.');

    onSubmit(report.id, draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="drive-link-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Registrar link do Drive</p>
            <h2 id="drive-link-title">{report.name || 'Relatório de atividades arquivadas'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form request-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}

          <label>
            <span>Nome do relatório</span>
            <input type="text" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Período inicial</span>
              <input type="date" value={draft.periodStart ?? ''} onChange={(event) => updateDraft('periodStart', event.target.value)} />
            </label>
            <label>
              <span>Período final</span>
              <input type="date" value={draft.periodEnd ?? ''} onChange={(event) => updateDraft('periodEnd', event.target.value)} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Quantidade de atividades exportadas</span>
              <input type="text" value={report.totalExported} disabled />
            </label>
            <label>
              <span>Responsável pela geração</span>
              <input type="text" value={report.generatedByName ?? ''} disabled />
            </label>
          </div>

          <label>
            <span>Data de geração</span>
            <input type="text" value={formatDateTime(report.generatedAt)} disabled />
          </label>

          <label>
            <span>Link do Drive</span>
            <input
              type="text"
              value={draft.driveLink}
              onChange={(event) => updateDraft('driveLink', event.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </label>

          <label>
            <span>Observações (opcional)</span>
            <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Salvar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RegisterDriveLinkModal;
