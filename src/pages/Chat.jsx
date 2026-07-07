import { useEffect, useMemo, useState } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import NewGroupModal from '../components/chat/NewGroupModal';
import UserProfileModal from '../components/chat/UserProfileModal';
import { CHAT_STORAGE_KEY, chatCurrentUser, chatUsers, initialChatConversations } from '../data/chatData';
import {
  createGroup,
  getConversationById,
  getTotalUnreadCount,
  markConversationAsRead,
  sendMessage,
  sortConversationsByLastMessage,
} from '../utils/chatUtils';

function loadChatConversations() {
  try {
    const savedConversations = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedConversations) {
      return JSON.parse(savedConversations);
    }
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return initialChatConversations;
}

function Chat({ onChatUnreadChange }) {
  const [conversations, setConversations] = useState(loadChatConversations);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const sortedConversations = useMemo(() => sortConversationsByLastMessage(conversations), [conversations]);
  const activeConversation = useMemo(
    () => getConversationById(conversations, activeConversationId),
    [activeConversationId, conversations],
  );

  const persistConversations = (nextConversations) => {
    setConversations(nextConversations);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextConversations));
    onChatUnreadChange?.(getTotalUnreadCount(nextConversations));
  };

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
    onChatUnreadChange?.(getTotalUnreadCount(conversations));
  }, [conversations, onChatUnreadChange]);

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    persistConversations(markConversationAsRead(conversations, conversationId, chatCurrentUser));
  };

  const handleSendMessage = (conversationId, messageText) => {
    persistConversations(sendMessage(conversations, conversationId, messageText, chatCurrentUser));
  };

  const handleCreateGroup = (groupData) => {
    const newGroup = createGroup(groupData, chatCurrentUser);
    persistConversations([newGroup, ...conversations]);
    setActiveConversationId(newGroup.id);
    setIsNewGroupOpen(false);
  };

  return (
    <div className="page-stack">
      <section className="page-heading chat-page-heading">
        <div>
          <p className="eyebrow">Chat</p>
          <h2>Comunicação interna entre pessoas e setores</h2>
          <span className="current-user-chip">
            Usuário atual: {chatCurrentUser.name} · {chatCurrentUser.sector}
          </span>
        </div>
      </section>

      <ChatLayout
        conversations={sortedConversations}
        users={chatUsers}
        currentUser={chatCurrentUser}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onNewGroup={() => setIsNewGroupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {isNewGroupOpen ? (
        <NewGroupModal
          users={chatUsers}
          currentUser={chatCurrentUser}
          onClose={() => setIsNewGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      ) : null}

      {isProfileOpen ? (
        <UserProfileModal
          conversation={activeConversation}
          users={chatUsers}
          currentUser={chatCurrentUser}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default Chat;
