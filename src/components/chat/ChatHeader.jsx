import { Info } from 'lucide-react';

function ChatHeader({ conversation, participants, onOpenProfile }) {
  if (!conversation) return null;

  const participantSummary =
    conversation.type === 'group'
      ? `${participants.length} participantes · ${conversation.sector}`
      : `${participants[0]?.sector ?? ''} · ${participants[0]?.role ?? ''}`;

  return (
    <header className="chat-window-header">
      <div>
        <h2>{conversation.title}</h2>
        <p>{participantSummary}</p>
      </div>
      <button type="button" className="icon-button" onClick={onOpenProfile} title="Ver detalhes">
        <Info size={18} aria-hidden="true" />
      </button>
    </header>
  );
}

export default ChatHeader;
