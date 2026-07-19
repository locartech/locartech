import { useEffect, useMemo, useState } from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import NewContactModal from '../components/chat/NewContactModal';
import NewGroupModal from '../components/chat/NewGroupModal';
import UserProfileModal from '../components/chat/UserProfileModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  archiveConversationForUser,
  createGroupConversation,
  ensureDirectConversation,
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  restoreConversationForUser,
  sendChatMessage,
  subscribeToChat,
  updateGroupConversation,
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
  const [editingGroup, setEditingGroup] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sortedConversations = useMemo(() => sortConversationsByLastMessage(conversations), [conversations]);
  const activeConversation = useMemo(
    () => getConversationById(conversations, activeConversationId),
    [activeConversationId, conversations],
  );

  const loadChat = async (selectedConversationId = activeConversationId) => {
    if (!currentUser?.id) return;

    try {
      const profiles = await fetchProfiles();
      const activeProfiles = profiles.filter(
        (profile) => profile.status === 'Ativo' && profile.accountType !== 'operacao',
      );
      setUsers(activeProfiles);

      let remoteConversations = await fetchConversations(
        currentUser.id,
        activeProfiles,
        selectedConversationId,
      );
      if (selectedConversationId) {
        const selected = remoteConversations.find((conversation) => conversation.id === selectedConversationId);
        if (selected) {
          const messages = await fetchConversationMessages(selectedConversationId, activeProfiles);
          remoteConversations = remoteConversations.map((conversation) =>
            conversation.id === selectedConversationId ? { ...conversation, messages } : conversation,
          );
        }
      }
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
    // Also reload when the current user's own photo changes - opening the profile
    // modal from within Chat doesn't remount this page, so without this the sidebar
    // and window header keep showing the stale users[] snapshot fetched on mount.
    loadChat(activeConversationId);
  }, [currentUser?.id, currentUser?.photoUrl]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let timer;
    const channel = subscribeToChat(currentUser.id, () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => loadChat(activeConversationId), 120);
    });
    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, activeConversationId]);

  useEffect(() => {
    if (!activeConversation?.id || !currentUser?.id || !activeConversation.unreadCount) return;

    let canceled = false;
    markConversationRead(activeConversation.id)
      .then(() => {
        if (!canceled) loadChat(activeConversation.id);
      })
      .catch(() => {});

    return () => {
      canceled = true;
    };
  }, [activeConversation?.id, activeConversation?.unreadCount, currentUser?.id]);

  const handleSelectConversation = async (conversationId) => {
    try {
      setActiveConversationId(conversationId);
      await markConversationRead(conversationId);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel abrir a conversa.');
    }
  };

  const handleStartContact = async (contact) => {
    try {
      const conversationId = await ensureDirectConversation(currentUser, contact);
      setActiveConversationId(conversationId);
      setIsNewContactOpen(false);
      await markConversationRead(conversationId);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel iniciar a conversa.');
    }
  };

  const handleSendMessage = async (conversationId, messageText) => {
    try {
      await sendChatMessage(conversationId, currentUser.id, messageText);
      await markConversationRead(conversationId);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel enviar a mensagem.');
      throw err;
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const conversationId = await createGroupConversation(groupData);
      setActiveConversationId(conversationId);
      setIsNewGroupOpen(false);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel criar o grupo.');
    }
  };

  const handleUpdateGroup = async (groupData) => {
    if (!editingGroup) return;

    try {
      const conversationId = await updateGroupConversation(editingGroup.id, groupData);
      setActiveConversationId(conversationId);
      setEditingGroup(null);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel editar o grupo.');
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      await archiveConversationForUser(conversationId, currentUser.id);
      setActiveConversationId(null);
      await loadChat(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel arquivar a conversa.');
    }
  };

  const handleRestoreConversation = async (conversationId) => {
    try {
      await restoreConversationForUser(conversationId, currentUser.id);
      await loadChat(conversationId);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel restaurar a conversa.');
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
        onEditGroup={setEditingGroup}
        onArchiveConversation={handleArchiveConversation}
        onRestoreConversation={handleRestoreConversation}
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

      {editingGroup ? (
        <NewGroupModal
          users={users}
          currentUser={currentUser}
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onCreate={handleUpdateGroup}
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
