import { Check, X } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from './StatusBadge';

const blankTask = {
  title: '',
  assignee: '',
  status: 'todo',
  date: '',
};

function AddTaskRow({ onAdd, onCancel }) {
  const [draft, setDraft] = useState(blankTask);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.assignee.trim() || !draft.date) return;
    onAdd(draft);
    setDraft(blankTask);
  };

  return (
    <form className="stage-row add-stage-row" onSubmit={handleSubmit}>
      <div className="stage-cell stage-title-cell">
        <input
          type="text"
          value={draft.title}
          onChange={(event) => updateDraft('title', event.target.value)}
          placeholder="Nome da etapa"
          aria-label="Nome da etapa"
        />
      </div>
      <div className="stage-cell">
        <input
          type="text"
          value={draft.assignee}
          onChange={(event) => updateDraft('assignee', event.target.value)}
          placeholder="Responsável"
          aria-label="Responsável"
        />
      </div>
      <div className="stage-cell">
        <StatusBadge value={draft.status} onChange={(value) => updateDraft('status', value)} />
      </div>
      <div className="stage-cell">
        <input
          type="date"
          value={draft.date}
          min="2026-01-01"
          onChange={(event) => updateDraft('date', event.target.value)}
          aria-label="Data da etapa"
        />
      </div>
      <div className="stage-cell stage-actions-cell">
        <button type="submit" className="table-icon-button primary" title="Salvar etapa">
          <Check size={16} aria-hidden="true" />
        </button>
        <button type="button" className="table-icon-button" onClick={onCancel} title="Cancelar inclusão">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

export default AddTaskRow;
