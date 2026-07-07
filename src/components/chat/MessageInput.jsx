import { Send } from 'lucide-react';
import { useState } from 'react';

function MessageInput({ disabled, onSend }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={disabled ? 'Selecione uma conversa' : 'Digite uma mensagem'}
        disabled={disabled}
      />
      <button type="submit" className="primary-button" disabled={disabled || !message.trim()}>
        <Send size={16} aria-hidden="true" />
        Enviar
      </button>
    </form>
  );
}

export default MessageInput;
