import { ChevronDown, UserPlus, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { chatSectors } from '../../data/chatData';
import useEscapeKey from '../../hooks/useEscapeKey';
import { addGroupParticipant, removeGroupParticipant } from '../../services/chatService';

function NewGroupModal({ users, currentUser, group, onClose, onCreate }) {
  useEscapeKey(onClose);
  const isEditing = Boolean(group);
  const [draft, setDraft] = useState({
    name: group?.title ?? '',
    description: group?.description ?? '',
    sector: group?.sector ?? 'Compras',
    participantIds: group?.participantIds?.filter((participantId) => participantId !== currentUser.id) ?? [],
  });
  const [membersListOpen, setMembersListOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [busyMemberId, setBusyMemberId] = useState(null);

  const availableUsers = users.filter((user) => user.id !== currentUser.id);
  const currentMembers = availableUsers.filter((user) => draft.participantIds.includes(user.id));
  const addableUsers = availableUsers.filter((user) => !draft.participantIds.includes(user.id));

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

  const handleAddMember = async (userId) => {
    if (!isEditing) {
      toggleParticipant(userId);
      return;
    }

    setMemberError('');
    setBusyMemberId(userId);
    try {
      await addGroupParticipant(group.id, userId);
      updateDraft('participantIds', [...draft.participantIds, userId]);
    } catch (err) {
      setMemberError(err.message ?? 'Nao foi possivel adicionar o membro.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isEditing) {
      toggleParticipant(userId);
      return;
    }

    setMemberError('');
    setBusyMemberId(userId);
    try {
      await removeGroupParticipant(group.id, userId);
      updateDraft('participantIds', draft.participantIds.filter((participantId) => participantId !== userId));
    } catch (err) {
      setMemberError(err.message ?? 'Nao foi possivel remover o membro.');
    } finally {
      setBusyMemberId(null);
    }
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

          {memberError ? <div className="auth-alert error">{memberError}</div> : null}

          {isEditing ? (
            <div className={`participant-picker ${membersListOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="participant-picker-toggle"
                onClick={() => setMembersListOpen((current) => !current)}
                aria-expanded={membersListOpen}
              >
                <span>
                  <UsersRound size={18} aria-hidden="true" />
                  Membros do grupo
                </span>
                <strong>{currentMembers.length}</strong>
                <ChevronDown size={18} className="participant-picker-chevron" aria-hidden="true" />
              </button>

              {membersListOpen ? (
                <div className="group-members-list">
                  {currentMembers.length === 0 ? (
                    <p className="group-members-empty">Nenhum outro membro no grupo.</p>
                  ) : (
                    currentMembers.map((user) => (
                      <div key={user.id} className="group-member-row">
                        <span className="user-avatar">{user.avatarInitials}</span>
                        <div className="group-member-identity">
                          <strong>{user.name}</strong>
                          <small>{user.sector}</small>
                        </div>
                        <button
                          type="button"
                          className="group-member-remove"
                          onClick={() => handleRemoveMember(user.id)}
                          disabled={busyMemberId === user.id}
                        >
                          Remover
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className={`participant-picker ${addOpen ? 'open' : ''}`}>
            <button
              type="button"
              className="participant-picker-toggle"
              onClick={() => setAddOpen((current) => !current)}
              aria-expanded={addOpen}
            >
              <span>
                {isEditing ? <UserPlus size={18} aria-hidden="true" /> : <UsersRound size={18} aria-hidden="true" />}
                {isEditing ? 'Adicionar membro' : 'Membros'}
              </span>
              {isEditing ? null : <strong>{draft.participantIds.length} selecionado(s)</strong>}
              <ChevronDown size={18} className="participant-picker-chevron" aria-hidden="true" />
            </button>

            {addOpen ? (
              <div className="group-members-list">
                {addableUsers.length === 0 ? (
                  <p className="group-members-empty">Todos os membros disponiveis ja estao no grupo.</p>
                ) : isEditing ? (
                  addableUsers.map((user) => (
                    <div key={user.id} className="group-member-row">
                      <span className="user-avatar">{user.avatarInitials}</span>
                      <div className="group-member-identity">
                        <strong>{user.name}</strong>
                        <small>{user.sector}</small>
                      </div>
                      <button
                        type="button"
                        className="group-member-add"
                        onClick={() => handleAddMember(user.id)}
                        disabled={busyMemberId === user.id}
                      >
                        Adicionar
                      </button>
                    </div>
                  ))
                ) : (
                  addableUsers.map((user) => (
                    <label key={user.id} className="group-member-row group-member-row-checkbox">
                      <input
                        type="checkbox"
                        checked={draft.participantIds.includes(user.id)}
                        onChange={() => toggleParticipant(user.id)}
                      />
                      <span className="user-avatar">{user.avatarInitials}</span>
                      <div className="group-member-identity">
                        <strong>{user.name}</strong>
                        <small>{user.sector}</small>
                      </div>
                    </label>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              {isEditing ? 'Fechar' : 'Cancelar'}
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
