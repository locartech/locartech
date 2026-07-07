import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { knowledgeTypes } from '../../data/knowledgeData';
import { validateKnowledgeRecord } from '../../utils/knowledgeUtils';

const emptyRecord = {
  title: '',
  description: '',
  type: 'Documento',
  responsible: '',
  publishedAt: '',
  driveLink: '',
};

function KnowledgeFormModal({ sectorName, record, onClose, onSubmit }) {
  const [draft, setDraft] = useState(emptyRecord);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setDraft({
        title: record.title,
        description: record.description,
        type: record.type,
        responsible: record.responsible,
        publishedAt: record.publishedAt,
        driveLink: record.driveLink,
      });
      return;
    }

    setDraft(emptyRecord);
  }, [record]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validateKnowledgeRecord(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{sectorName}</p>
            <h2 id="knowledge-form-title">{record ? 'Editar registro' : 'Novo registro'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form knowledge-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}

          <label>
            <span>Nome do arquivo/material</span>
            <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
          </label>

          <label>
            <span>Descrição</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Tipo</span>
              <select value={draft.type} onChange={(event) => updateDraft('type', event.target.value)}>
                {knowledgeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Responsável</span>
              <input value={draft.responsible} onChange={(event) => updateDraft('responsible', event.target.value)} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Data de publicação</span>
              <input type="date" value={draft.publishedAt} onChange={(event) => updateDraft('publishedAt', event.target.value)} />
            </label>
            <label>
              <span>Link do Drive</span>
              <input value={draft.driveLink} onChange={(event) => updateDraft('driveLink', event.target.value)} placeholder="https://..." />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {record ? 'Salvar alterações' : 'Criar registro'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default KnowledgeFormModal;
