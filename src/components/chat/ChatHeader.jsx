import { Hash, Info, Pencil, UserRound } from 'lucide-react';

function ChatHeader({ conversation, participants, onEditGroup, onOpenProfile }) {
  if (!conversation) return null;

  const participantSummary =
    conversation.type === 'group'
      ? `${participants.length} participantes - ${conversation.sector}`
      : `${participants[0]?.sector ?? ''} - ${participants[0]?.role ?? ''}`;

  const Icon = conversation.type === 'group' ? Hash : UserRound;
  const avatarPhoto = conversation.type === 'group' ? null : participants[0]?.photoUrl;

  return (
    <header className="chat-window-header">
      <div className="chat-window-header-identity">
        <div className={`conversation-avatar header-avatar ${conversation.type === 'group' ? 'group' : ''}`}>
          {avatarPhoto ? <img src={avatarPhoto} alt="" /> : <Icon size={20} aria-hidden="true" />}
        </div>
        <div>
          <h2>{conversation.title}</h2>
          <p>{participantSummary}</p>
        </div>
      </div>
      <div className="chat-header-actions">
        {conversation.type === 'group' ? (
          <button type="button" className="icon-button" onClick={() => onEditGroup?.(conversation)} title="Editar grupo">
            <Pencil size={18} aria-hidden="true" />
          </button>
        ) : null}
        <button type="button" className="icon-button" onClick={onOpenProfile} title="Ver detalhes">
          <Info size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;
