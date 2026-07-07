import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { sortConversationsByLastMessage } from '../../utils/chatUtils';
import ConversationList from './ConversationList';

function ChatSidebar({ conversations, users, currentUser, activeConversationId, onSelectConversation, onNewGroup }) {
  const [query, setQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = sortConversationsByLastMessage(conversations);

    if (!normalizedQuery) return sorted;

    return sorted.filter((conversation) => {
      const participantNames = conversation.participantIds
        .map((participantId) => users.find((user) => user.id === participantId)?.name)
        .filter(Boolean)
        .join(' ');

      return `${conversation.title} ${conversation.description} ${participantNames}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [conversations, query, users]);

  const directConversations = filteredConversations.filter((conversation) => conversation.type === 'direct');
  const groupConversations = filteredConversations.filter((conversation) => conversation.type === 'group');

  return (
    <aside className="chat-sidebar-panel">
      <div className="chat-sidebar-header">
        <div>
          <p className="eyebrow">Comunicação interna</p>
          <h2>Chat</h2>
        </div>
        <button type="button" className="table-icon-button primary" onClick={onNewGroup} title="Novo grupo">
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>

      <label className="chat-search">
        <Search size={16} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa" />
      </label>

      <button type="button" className="new-group-button" onClick={onNewGroup}>
        <Plus size={16} aria-hidden="true" />
        Novo grupo
      </button>

      <ConversationList
        title="Conversas individuais"
        conversations={directConversations}
        users={users}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
      />

      <ConversationList
        title="Grupos"
        conversations={groupConversations}
        users={users}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
      />
    </aside>
  );
}

export default ChatSidebar;
