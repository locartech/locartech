import { Hash, UserRound } from 'lucide-react';
import { getConversationOtherUser, getConversationSubtitle } from '../../utils/chatUtils';
import UnreadBadge from './UnreadBadge';

function ConversationItem({ conversation, users, currentUser, active, onSelect }) {
  const subtitle = getConversationSubtitle(conversation, users, currentUser);
  const otherUser = getConversationOtherUser(conversation, users, currentUser);
  const Icon = conversation.type === 'group' ? Hash : UserRound;

  return (
    <button
      type="button"
      className={`conversation-item ${active ? 'active' : ''} ${conversation.unreadCount ? 'unread' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className={`conversation-avatar ${conversation.type === 'group' ? 'group' : ''}`}>
        {otherUser?.photoUrl ? <img src={otherUser.photoUrl} alt="" /> : <Icon size={18} aria-hidden="true" />}
      </div>
      <div className="conversation-info">
        <strong>{conversation.title}</strong>
        <span className="conversation-subtitle">{subtitle}</span>
      </div>
      <UnreadBadge count={conversation.unreadCount} />
    </button>
  );
}

export default ConversationItem;
