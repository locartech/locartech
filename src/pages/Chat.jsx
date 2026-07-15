import { useEffect, useMemo, useState } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import NewContactModal from '../components/chat/NewContactModal';
import NewGroupModal from '../components/chat/NewGroupModal';
import UserProfileModal from '../components/chat/UserProfileModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  createGroupConversation,
  ensureDirectConversation,
  fetchConversations,
  markConversationRead,
  sendChatMessage,
  subscribeToChat,
} from '../services/chatService';
import { fetchProfiles } from '../services/profilesService';
import { getConversationById, getTotalUnreadCount, sortConversationsByLastMessage } from '../utils/chatUtils';

function Chat({ onChatUnreadChange }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sortedConversations = useMemo(() => sortConversationsByLastMessage(conversations), [conversations]);
  const activeConversation = useMemo(
    () => getConversationById(conversations, activeConversationId),
    [activeConversationId, conversations],
  );

  const loadChat = async () => {
    if (!currentUser?.id) return;

    try {
      const profiles = await fetchProfiles();
      const activeProfiles = profiles.filter((profile) => profile.status === 'Ativo');
      setUsers(activeProfiles);

      const remoteConversations = await fetchConversations(currentUser.id, activeProfiles);
      setConversations(remoteConversations);
      onChatUnreadChange?.(getTotalUnreadCount(remoteConversations));
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel carregar o chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const channel = subscribeToChat(currentUser.id, loadChat);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!activeConversation?.id || !currentUser?.id || !activeConversation.unreadCount) return;

    let canceled = false;
    markConversationRead(activeConversation.id, currentUser.id)
      .then(() => {
        if (!canceled) loadChat();
      })
      .catch(() => {});

    return () => {
      canceled = true;
    };
  }, [activeConversation?.id, activeConversation?.unreadCount, currentUser?.id]);

  const handleSelectConversation = async (conversationId) => {
    try {
      setActiveConversationId(conversationId);
      await markConversationRead(conversationId, currentUser.id);
      await loadChat();
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel abrir a conversa.');
    }
  };

  const handleStartContact = async (contact) => {
    try {
      const conversationId = await ensureDirectConversation(currentUser, contact);
      setActiveConversationId(conversationId);
      setIsNewContactOpen(false);
      await markConversationRead(conversationId, currentUser.id);
      await loadChat();
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel iniciar a conversa.');
    }
  };

  const handleSendMessage = async (conversationId, messageText) => {
    try {
      await sendChatMessage(conversationId, currentUser.id, messageText);
      await loadChat();
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel enviar a mensagem.');
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const conversationId = await createGroupConversation(groupData, currentUser);
      setActiveConversationId(conversationId);
      setIsNewGroupOpen(false);
      await loadChat();
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel criar o grupo.');
    }
  };

  return (
    <div className="page-stack chat-page">
      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando conversas...</div> : null}

      <ChatLayout
        conversations={sortedConversations}
        users={users}
        currentUser={currentUser}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onNewContact={() => setIsNewContactOpen(true)}
        onNewGroup={() => setIsNewGroupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {isNewContactOpen ? (
        <NewContactModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsNewContactOpen(false)}
          onSelect={handleStartContact}
        />
      ) : null}

      {isNewGroupOpen ? (
        <NewGroupModal
          users={users}
          currentUser={currentUser}
          onClose={() => setIsNewGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      ) : null}

      {isProfileOpen ? (
        <UserProfileModal
          conversation={activeConversation}
          users={users}
          currentUser={currentUser}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default Chat;
