import { Hash, UserRound } from 'lucide-react';
import { getConversationSubtitle, getLastMessage } from '../../utils/chatUtils';
import UnreadBadge from './UnreadBadge';

const formatTime = (value) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function ConversationItem({ conversation, users, currentUser, active, onSelect }) {
  const lastMessage = getLastMessage(conversation);
  const subtitle = getConversationSubtitle(conversation, users, currentUser);
  const Icon = conversation.type === 'group' ? Hash : UserRound;

  return (
    <button
      type="button"
      className={`conversation-item ${active ? 'active' : ''} ${conversation.unreadCount ? 'unread' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="conversation-avatar">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="conversation-info">
        <div className="conversation-line">
          <strong>{conversation.title}</strong>
          <time>{formatTime(conversation.lastMessageAt)}</time>
        </div>
        <span className="conversation-subtitle">{subtitle}</span>
        <p>{lastMessage?.text ?? 'Sem mensagens ainda'}</p>
      </div>
      <UnreadBadge count={conversation.unreadCount} />
    </button>
  );
}

export default ConversationItem;
