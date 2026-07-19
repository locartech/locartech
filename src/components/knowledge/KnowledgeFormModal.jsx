import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { knowledgeTypes } from '../../data/knowledgeData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { normalizeKnowledgeType, validateKnowledgeRecord } from '../../utils/knowledgeUtils';

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyRecord = {
  title: '',
  description: '',
  type: 'Manual do setor',
  responsible: '',
  publishedAt: todayIso(),
  driveLink: '',
};

function formatPublishedAt(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

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

    setDraft({ ...emptyRecord, publishedAt: todayIso() });
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
            <span>Descricao (opcional)</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          {!simplified ? (
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
                <span>Responsavel (opcional)</span>
                <input value={draft.responsible} onChange={(event) => updateDraft('responsible', event.target.value)} />
              </label>
            </div>
          ) : null}

          <div className="form-grid-two">
            <label>
              <span>Link do Drive (opcional)</span>
              <input value={draft.driveLink} onChange={(event) => updateDraft('driveLink', event.target.value)} placeholder="https://..." />
            </label>
            <label>
              <span>Data de publicacao</span>
              <input type="text" value={formatPublishedAt(draft.publishedAt)} readOnly disabled />
            </label>
          </div>

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
