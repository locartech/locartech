import { Send } from 'lucide-react';
import { useState } from 'react';

function MessageInput({ disabled, onSend }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await onSend(message);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={disabled ? 'Selecione uma conversa' : 'Digite uma mensagem'}
        disabled={disabled || sending}
      />
      <button type="submit" className="primary-button" disabled={disabled || sending || !message.trim()}>
        <Send size={16} aria-hidden="true" />
        {sending ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}

export default MessageInput;
