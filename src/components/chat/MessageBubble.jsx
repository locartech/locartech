const formatTime = (value) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function MessageBubble({ message, own }) {
  return (
    <article className={`message-bubble ${own ? 'own' : 'received'}`}>
      {!own ? <strong>{message.senderName}</strong> : null}
      <p>{message.text}</p>
      <time>{formatTime(message.createdAt)}</time>
    </article>
  );
}

export default MessageBubble;
