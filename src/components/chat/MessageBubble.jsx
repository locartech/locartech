const formatTime = (value) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function MessageBubble({ message, own, readLabel }) {
  return (
    <article className={`message-bubble ${own ? 'own' : 'received'}`}>
      {!own ? <strong>{message.senderName}</strong> : null}
      <p>{message.text}</p>
      <footer>
        <time>{formatTime(message.createdAt)}</time>
        {own && readLabel ? <span className={readLabel === 'Visualizada' ? 'read' : ''}>{readLabel}</span> : null}
      </footer>
    </article>
  );
}

export default MessageBubble;
