import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { kanbanStatuses } from '../../data/kanbanData';
import { requestPriorities, requestSectors } from '../../data/requestsData';

const emptyForm = {
  title: '',
  description: '',
  stepName: '',
  targetSector: 'Compras',
  responsibleName: '',
  kanbanStatus: 'todo',
  dueDate: '',
  priority: 'medium',
};

function RequestForm({ currentUser, request, onClose, onSubmit }) {
  const [draft, setDraft] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request) {
      setDraft({
        title: request.title,
        description: request.description,
        stepName: request.stepName,
        targetSector: request.targetSector,
        responsibleName: request.responsibleName ?? '',
        kanbanStatus: request.kanbanStatus ?? 'todo',
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
    setError('');

    if (!draft.title.trim()) return setError('Informe o titulo da solicitacao.');
    if (!draft.stepName.trim()) return setError('Informe a etapa que sera criada no Kanban.');
    if (!draft.targetSector) return setError('Escolha o setor responsavel.');
    if (!draft.dueDate) return setError('Informe a data de vencimento.');
    if (!draft.priority) return setError('Escolha a prioridade.');

    onSubmit(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal request-modal" role="dialog" aria-modal="true" aria-labelledby="request-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{request ? 'Editar solicitacao' : 'Nova solicitacao'}</p>
            <h2 id="request-form-title">{request ? request.title : 'Solicitar demanda para outro setor'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form request-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-alert error">{error}</div> : null}

          <div className="request-form-context">
            <span>Solicitante</span>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.sector}</span>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Titulo da solicitacao</span>
              <input type="text" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
            </label>

            <label>
              <span>Etapa no Kanban</span>
              <input type="text" value={draft.stepName} onChange={(event) => updateDraft('stepName', event.target.value)} />
            </label>
          </div>

          <label>
            <span>Descricao</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>

          <div className="form-grid-two">
            <label>
              <span>Setor responsavel/destino</span>
              <select value={draft.targetSector} onChange={(event) => updateDraft('targetSector', event.target.value)}>
                {requestSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Responsavel</span>
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
              <span>Status inicial no Kanban</span>
              <select value={draft.kanbanStatus} onChange={(event) => updateDraft('kanbanStatus', event.target.value)}>
                {kanbanStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Data de vencimento</span>
              <input type="date" value={draft.dueDate} onChange={(event) => updateDraft('dueDate', event.target.value)} />
            </label>
          </div>

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

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {request ? 'Salvar alteracoes' : 'Criar solicitacao'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RequestForm;
