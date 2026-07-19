import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { knowledgeTypes } from '../../data/knowledgeData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { normalizeKnowledgeType, validateKnowledgeRecord } from '../../utils/knowledgeUtils';

const emptyRecord = {
  title: '',
  description: '',
  type: 'Manual do setor',
  responsible: '',
  publishedAt: '',
  driveLink: '',
};

function KnowledgeFormModal({ sectorName, record, onClose, onSubmit, simplified = false }) {
  useEscapeKey(onClose);
  const { currentUser } = useAuth();
  const [draft, setDraft] = useState(emptyRecord);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setDraft({
        title: record.title,
        description: record.description,
        type: normalizeKnowledgeType(record.type),
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

    const trimmedLink = draft.driveLink.trim();
    const normalizedLink = trimmedLink && !/^https?:\/\//i.test(trimmedLink) ? `https://${trimmedLink}` : trimmedLink;

    const submission = simplified
      ? {
          ...draft,
          driveLink: normalizedLink,
          type: draft.type || 'Outros',
          responsible: draft.responsible || currentUser?.name || sectorName,
          publishedAt: draft.publishedAt || new Date().toISOString().slice(0, 10),
        }
      : { ...draft, driveLink: normalizedLink };

    const validationError = validateKnowledgeRecord(submission);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(submission);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{sectorName}</p>
            <h2 id="knowledge-form-title">{record ? 'Editar documento' : 'Novo documento'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form knowledge-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}

          <label>
            <span>Nome do documento</span>
            <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
          </label>

          <label>
            <span>Descricao</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          {!simplified ? (
            <>
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
                  <span>Responsavel</span>
                  <input value={draft.responsible} onChange={(event) => updateDraft('responsible', event.target.value)} />
                </label>
              </div>

              <label>
                <span>Data de publicacao</span>
                <input type="date" value={draft.publishedAt} onChange={(event) => updateDraft('publishedAt', event.target.value)} />
              </label>
            </>
          ) : null}

          <label>
            <span>Link do Drive</span>
            <input value={draft.driveLink} onChange={(event) => updateDraft('driveLink', event.target.value)} placeholder="https://..." />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {record ? 'Salvar alteracoes' : 'Criar documento'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default KnowledgeFormModal;
