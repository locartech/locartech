import { FileSpreadsheet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { filterItemsByPeriod } from '../../utils/excelReportUtils';

function ReportGenerationModal({ open, title, defaultName, items, dateAccessor, entityLabel, onClose, onGenerate }) {
  useEscapeKey(onClose, open);
  const [draft, setDraft] = useState({ name: defaultName, periodStart: '', periodEnd: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const dates = items.map((item) => dateAccessor(item)?.slice(0, 10)).filter(Boolean).sort();
    setDraft({ name: defaultName, periodStart: dates[0] || '', periodEnd: dates.at(-1) || '' });
    setError('');
  }, [open, defaultName, items, dateAccessor]);

  const selectedItems = useMemo(
    () => filterItemsByPeriod(items, draft.periodStart, draft.periodEnd, dateAccessor),
    [items, draft.periodStart, draft.periodEnd, dateAccessor],
  );

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return setError('Informe o nome do relatorio.');
    if (draft.periodStart && draft.periodEnd && draft.periodStart > draft.periodEnd) {
      return setError('O periodo inicial deve ser anterior ao periodo final.');
    }
    if (selectedItems.length === 0) return setError('Nao existem registros arquivados nesse periodo.');
    setError('');
    await onGenerate(draft, selectedItems);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal report-generation-modal" role="dialog" aria-modal="true" aria-labelledby="report-generation-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Relatorio de historico</p>
            <h2 id="report-generation-title">{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form request-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}
          <label>
            <span>Nome do relatorio</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <div className="form-grid-two">
            <label>
              <span>Periodo inicial</span>
              <input type="date" value={draft.periodStart} onChange={(event) => setDraft((current) => ({ ...current, periodStart: event.target.value }))} />
            </label>
            <label>
              <span>Periodo final</span>
              <input type="date" value={draft.periodEnd} onChange={(event) => setDraft((current) => ({ ...current, periodEnd: event.target.value }))} />
            </label>
          </div>
          <div className="report-selection-summary">
            <FileSpreadsheet size={17} aria-hidden="true" />
            <span>{selectedItems.length} {entityLabel} no periodo selecionado</span>
          </div>
          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="primary-button">
              <FileSpreadsheet size={16} aria-hidden="true" />
              Gerar relatorio
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ReportGenerationModal;
