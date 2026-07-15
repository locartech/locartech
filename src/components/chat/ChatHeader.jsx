import { Info, Pencil } from 'lucide-react';

function ChatHeader({ conversation, participants, onEditGroup, onOpenProfile }) {
  if (!conversation) return null;

  const participantSummary =
    conversation.type === 'group'
      ? `${participants.length} participantes - ${conversation.sector}`
      : `${participants[0]?.sector ?? ''} - ${participants[0]?.role ?? ''}`;

  return (
    <header className="chat-window-header">
      <div>
        <h2>{conversation.title}</h2>
        <p>{participantSummary}</p>
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
