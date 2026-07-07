import { useEffect, useMemo, useState } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import NewGroupModal from '../components/chat/NewGroupModal';
import UserProfileModal from '../components/chat/UserProfileModal';
import { CHAT_STORAGE_KEY, chatCurrentUser, chatUsers, initialChatConversations } from '../data/chatData';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  createGroupConversation,
  ensureDirectConversation,
  fetchConversations,
  markConversationRead,
  sendChatMessage,
  subscribeToChat,
} from '../services/chatService';
import { fetchProfiles } from '../services/profilesService';
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
    if (savedConversations) return JSON.parse(savedConversations);
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return initialChatConversations;
}

function Chat({ onChatUnreadChange }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState(loadChatConversations);
  const [users, setUsers] = useState(chatUsers);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);

  const currentChatUser = usingSupabase ? currentUser : chatCurrentUser;
  const sortedConversations = useMemo(() => sortConversationsByLastMessage(conversations), [conversations]);
  const activeConversation = useMemo(
    () => getConversationById(conversations, activeConversationId),
    [activeConversationId, conversations],
  );

  const loadRemoteChat = async () => {
    if (!isSupabaseConfigured || !currentUser?.id) return;

    try {
      const profiles = await fetchProfiles();
      const activeProfiles = profiles.filter((profile) => profile.status === 'Ativo');
      setUsers(activeProfiles);

      await Promise.all(
        activeProfiles
          .filter((profile) => profile.id !== currentUser.id)
          .map((profile) => ensureDirectConversation(currentUser, profile)),
      );

      const remoteConversations = await fetchConversations(currentUser.id, activeProfiles);
      setConversations(remoteConversations);
      setUsingSupabase(true);
      onChatUnreadChange?.(getTotalUnreadCount(remoteConversations));
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemoteChat();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !usingSupabase || !currentUser?.id) return undefined;

    const channel = subscribeToChat(currentUser.id, loadRemoteChat);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, usingSupabase]);

  useEffect(() => {
    if (usingSupabase) {
      onChatUnreadChange?.(getTotalUnreadCount(conversations));
      return;
    }

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
    onChatUnreadChange?.(getTotalUnreadCount(conversations));
  }, [conversations, onChatUnreadChange, usingSupabase]);

  const persistLocalConversations = (nextConversations) => {
    setConversations(nextConversations);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextConversations));
    onChatUnreadChange?.(getTotalUnreadCount(nextConversations));
  };

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    if (usingSupabase) {
      await markConversationRead(conversationId, currentUser.id);
      await loadRemoteChat();
      return;
    }

    persistLocalConversations(markConversationAsRead(conversations, conversationId, currentChatUser));
  };

  const handleSendMessage = async (conversationId, messageText) => {
    if (usingSupabase) {
      await sendChatMessage(conversationId, currentUser.id, messageText);
      await loadRemoteChat();
      return;
    }

    persistLocalConversations(sendMessage(conversations, conversationId, messageText, currentChatUser));
  };

  const handleCreateGroup = async (groupData) => {
    if (usingSupabase) {
      const conversationId = await createGroupConversation(groupData, currentUser);
      setActiveConversationId(conversationId);
      setIsNewGroupOpen(false);
      await loadRemoteChat();
      return;
    }

    const newGroup = createGroup(groupData, currentChatUser);
    persistLocalConversations([newGroup, ...conversations]);
    setActiveConversationId(newGroup.id);
    setIsNewGroupOpen(false);
  };

  return (
    <div className="page-stack">
      <section className="page-heading chat-page-heading">
        <div>
          <p className="eyebrow">Chat</p>
          <h2>Comunicacao interna entre pessoas e setores</h2>
          <span className="current-user-chip">
            Usuario atual: {currentChatUser.name} - {currentChatUser.sector}
          </span>
        </div>
      </section>

      {!usingSupabase ? (
        <div className="members-feedback">
          Usando chat local ate as tabelas do Supabase serem aplicadas.
        </div>
      ) : null}

      <ChatLayout
        conversations={sortedConversations}
        users={users}
        currentUser={currentChatUser}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onNewGroup={() => setIsNewGroupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {isNewGroupOpen ? (
        <NewGroupModal
          users={users}
          currentUser={currentChatUser}
          onClose={() => setIsNewGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      ) : null}

      {isProfileOpen ? (
        <UserProfileModal
          conversation={activeConversation}
          users={users}
          currentUser={currentChatUser}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default Chat;
