import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { kanbanStatuses } from '../../data/kanbanData';

function EditTaskModal({ task, onClose, onSave }) {
  const [draft, setDraft] = useState(task);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  if (!task) return null;

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.assignee.trim() || !draft.date) return;
    onSave(task.id, {
      title: draft.title.trim(),
      assignee: draft.assignee.trim(),
      status: draft.status,
      date: draft.date,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-stage-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Editar etapa</p>
            <h2 id="edit-stage-title">{task.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form" onSubmit={handleSubmit}>
          <label>
            <span>Etapa</span>
            <input type="text" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
          </label>

          <label>
            <span>Responsável</span>
            <input type="text" value={draft.assignee} onChange={(event) => updateDraft('assignee', event.target.value)} />
          </label>

          <label>
            <span>Status</span>
            <select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}>
              {kanbanStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Data</span>
            <input type="date" value={draft.date} min="2026-01-01" onChange={(event) => updateDraft('date', event.target.value)} />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Salvar alterações
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditTaskModal;
