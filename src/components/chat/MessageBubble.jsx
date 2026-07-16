import { Check, CheckCheck } from 'lucide-react';

const formatTime = (value) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function MessageBubble({ message, own, readLabel }) {
  if (message.type === 'system') {
    return (
      <div className="message-system-event">
        <span>{message.text}</span>
        <time>{formatTime(message.createdAt)}</time>
      </div>
    );
  }

  const hasBeenRead = readLabel && readLabel !== 'Enviada' && !readLabel.startsWith('0/');
  const ReadIcon = hasBeenRead ? CheckCheck : Check;
  const readTitle = hasBeenRead ? 'Visualizada' : 'Entregue';

  return (
    <article className={`message-bubble ${own ? 'own' : 'received'}`}>
      {!own ? <strong>{message.senderName}</strong> : null}
      <p>{message.text}</p>
      <footer>
        <time>{formatTime(message.createdAt)}</time>
        {own && readLabel ? (
          <span className={`message-read-icon ${hasBeenRead ? 'read' : ''}`} title={readTitle} aria-label={readTitle}>
            <ReadIcon size={16} aria-hidden="true" />
          </span>
        ) : null}
      </footer>
    </article>
  );
}

export default MessageBubble;
