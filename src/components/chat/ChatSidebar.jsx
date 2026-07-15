import { MessageCirclePlus, Search, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { sortConversationsByLastMessage } from '../../utils/chatUtils';
import ConversationList from './ConversationList';

function ChatSidebar({
  conversations,
  users,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onNewContact,
  onNewGroup,
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('direct');

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
  const visibleConversations = activeTab === 'direct' ? directConversations : groupConversations;

  return (
    <aside className="chat-sidebar-panel">
      <div className="chat-sidebar-header">
        <div>
          <h2>Chat</h2>
          <p>Conversas iniciadas</p>
        </div>
      </div>

      <label className="chat-search">
        <Search size={16} aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar conversa" />
      </label>

      <div className="chat-action-row">
        <button type="button" className="new-contact-button" onClick={onNewContact}>
          <MessageCirclePlus size={16} aria-hidden="true" />
          Novo contato
        </button>

        <button type="button" className="new-group-button" onClick={onNewGroup}>
          <UsersRound size={16} aria-hidden="true" />
          Grupo
        </button>
      </div>

      <div className="chat-segmented-control" role="tablist" aria-label="Tipo de conversa">
        <button
          type="button"
          className={activeTab === 'direct' ? 'active' : ''}
          onClick={() => setActiveTab('direct')}
        >
          Contatos
          <span>{directConversations.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === 'group' ? 'active' : ''}
          onClick={() => setActiveTab('group')}
        >
          Grupos
          <span>{groupConversations.length}</span>
        </button>
      </div>

      <ConversationList
        title={activeTab === 'direct' ? 'Contatos' : 'Grupos'}
        conversations={visibleConversations}
        users={users}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelect={onSelectConversation}
      />
    </aside>
  );
}

export default ChatSidebar;
