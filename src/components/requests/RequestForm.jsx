import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { requestPriorities, requestSectors } from '../../data/requestsData';

const emptyForm = {
  title: '',
  description: '',
  targetSector: 'Financeiro',
  responsibleName: '',
  priority: 'medium',
  dueDate: '',
};

function RequestForm({ currentUser, request, onClose, onSubmit }) {
  const [draft, setDraft] = useState(emptyForm);

  useEffect(() => {
    if (request) {
      setDraft({
        title: request.title,
        description: request.description,
        targetSector: request.targetSector,
        responsibleName: request.responsibleName ?? '',
        priority: request.priority,
        dueDate: request.dueDate,
      });
      return;
    }

    const firstExternalSector = requestSectors.find((sector) => sector !== currentUser.sector) ?? requestSectors[0];
    setDraft({ ...emptyForm, targetSector: firstExternalSector });
  }, [currentUser.sector, request]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.description.trim() || !draft.targetSector || !draft.dueDate) return;
    onSubmit(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="request-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{request ? 'Editar solicitação' : 'Nova solicitação'}</p>
            <h2 id="request-form-title">{request ? request.title : 'Solicitar demanda para outro setor'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form request-form" onSubmit={handleSubmit}>
          <div className="request-form-context">
            <span>Solicitante</span>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.sector}</span>
          </div>

          <label>
            <span>Título da solicitação</span>
            <input type="text" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
          </label>

          <label>
            <span>Descrição</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Setor responsável</span>
              <select value={draft.targetSector} onChange={(event) => updateDraft('targetSector', event.target.value)}>
                {requestSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Responsável</span>
              <input
                type="text"
                value={draft.responsibleName}
                onChange={(event) => updateDraft('responsibleName', event.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Prioridade</span>
              <select value={draft.priority} onChange={(event) => updateDraft('priority', event.target.value)}>
                {requestPriorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Prazo</span>
              <input type="date" value={draft.dueDate} onChange={(event) => updateDraft('dueDate', event.target.value)} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {request ? 'Salvar alterações' : 'Criar solicitação'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RequestForm;
