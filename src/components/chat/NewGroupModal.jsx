import { ChevronDown, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { chatSectors } from '../../data/chatData';

function NewGroupModal({ users, currentUser, group, onClose, onCreate }) {
  const isEditing = Boolean(group);
  const [draft, setDraft] = useState({
    name: group?.title ?? '',
    description: group?.description ?? '',
    sector: group?.sector ?? 'Compras',
    participantIds: group?.participantIds?.filter((participantId) => participantId !== currentUser.id) ?? [],
  });
  const [membersOpen, setMembersOpen] = useState(false);

  const availableUsers = users.filter((user) => user.id !== currentUser.id);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const toggleParticipant = (userId) => {
    setDraft((current) => {
      const alreadySelected = current.participantIds.includes(userId);
      return {
        ...current,
        participantIds: alreadySelected
          ? current.participantIds.filter((participantId) => participantId !== userId)
          : [...current.participantIds, userId],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    if (!isEditing && draft.participantIds.length === 0) return;
    onCreate(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal chat-group-modal" role="dialog" aria-modal="true" aria-labelledby="new-group-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{isEditing ? 'Editar grupo' : 'Novo grupo'}</p>
            <h2 id="new-group-title">{isEditing ? 'Editar conversa em grupo' : 'Criar grupo de conversa'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form chat-group-form" onSubmit={handleSubmit}>
          <label>
            <span>Nome do grupo</span>
            <input type="text" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
          </label>
          <label>
            <span>Descricao</span>
            <textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} />
          </label>
          <label>
            <span>Setor principal</span>
            <select value={draft.sector} onChange={(event) => updateDraft('sector', event.target.value)}>
              {chatSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </label>

          {!isEditing ? (
            <div className={`participant-picker ${membersOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="participant-picker-toggle"
                onClick={() => setMembersOpen((current) => !current)}
                aria-expanded={membersOpen}
              >
                <span>
                  <UsersRound size={18} aria-hidden="true" />
                  Membros
                </span>
                <strong>{draft.participantIds.length} selecionado(s)</strong>
                <ChevronDown size={18} aria-hidden="true" />
              </button>

              {membersOpen ? (
                <div className="participant-options">
                  {availableUsers.map((user) => (
                    <label key={user.id} className="participant-option">
                      <input
                        type="checkbox"
                        checked={draft.participantIds.includes(user.id)}
                        onChange={() => toggleParticipant(user.id)}
                      />
                      <span className="user-avatar">{user.avatarInitials}</span>
                      <strong>{user.name}</strong>
                      <small>{user.sector}</small>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? 'Salvar grupo' : 'Criar grupo'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default NewGroupModal;
