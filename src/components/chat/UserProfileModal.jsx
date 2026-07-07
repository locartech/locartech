import { X } from 'lucide-react';

function UserProfileModal({ conversation, users, currentUser, onClose }) {
  if (!conversation) return null;

  const participants = users.filter((user) => conversation.participantIds.includes(user.id));
  const directUser = participants.find((user) => user.id !== currentUser.id);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal chat-profile-modal" role="dialog" aria-modal="true" aria-labelledby="chat-profile-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{conversation.type === 'group' ? 'Detalhes do grupo' : 'Perfil do usuário'}</p>
            <h2 id="chat-profile-title">{conversation.type === 'group' ? conversation.title : directUser?.name}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar detalhes">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="chat-profile-body">
          {conversation.type === 'group' ? (
            <>
              <p>{conversation.description}</p>
              <span className="current-user-chip">Setor principal: {conversation.sector}</span>
              <div className="chat-participants-list">
                {participants.map((participant) => (
                  <div key={participant.id} className="chat-participant-row">
                    <span className="user-avatar">{participant.avatarInitials}</span>
                    <div>
                      <strong>{participant.name}</strong>
                      <p>{participant.sector} · {participant.role}</p>
                    </div>
                    <span className={`presence-dot ${participant.status}`}>{participant.status}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="direct-profile-card">
              <span className="user-avatar large">{directUser?.avatarInitials}</span>
              <h3>{directUser?.name}</h3>
              <p>{directUser?.role}</p>
              <span>{directUser?.sector}</span>
              <span className={`presence-dot ${directUser?.status}`}>{directUser?.status}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default UserProfileModal;
