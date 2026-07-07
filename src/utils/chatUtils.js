export function getTotalUnreadCount(conversations) {
  return conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0);
}

export function getConversationUnreadCount(conversations, conversationId) {
  return conversations.find((conversation) => conversation.id === conversationId)?.unreadCount ?? 0;
}

export function sortConversationsByLastMessage(conversations) {
  return [...conversations].sort((first, second) => new Date(second.lastMessageAt) - new Date(first.lastMessageAt));
}

export function getConversationById(conversations, conversationId) {
  return conversations.find((conversation) => conversation.id === conversationId) ?? null;
}

export function markConversationAsRead(conversations, conversationId, currentUser) {
  return conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    return {
      ...conversation,
      unreadCount: 0,
      messages: conversation.messages.map((message) => ({
        ...message,
        readBy: message.readBy.includes(currentUser.id) ? message.readBy : [...message.readBy, currentUser.id],
      })),
    };
  });
}

export function sendMessage(conversations, conversationId, messageText, currentUser) {
  const createdAt = new Date().toISOString();
  const newMessage = {
    id: `msg-${crypto.randomUUID()}`,
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: messageText.trim(),
    createdAt,
    readBy: [currentUser.id],
  };

  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          lastMessageAt: createdAt,
          unreadCount: 0,
          messages: [...conversation.messages, newMessage],
        }
      : conversation,
  );
}

export function createGroup(groupData, currentUser) {
  const createdAt = new Date().toISOString();
  const participantIds = Array.from(new Set([currentUser.id, ...groupData.participantIds]));
  const welcomeMessage = {
    id: `msg-${crypto.randomUUID()}`,
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: `Grupo criado para organizar: ${groupData.description.trim() || groupData.name.trim()}.`,
    createdAt,
    readBy: [currentUser.id],
  };

  return {
    id: `grp-${crypto.randomUUID()}`,
    type: 'group',
    title: groupData.name.trim(),
    description: groupData.description.trim(),
    sector: groupData.sector,
    participantIds,
    unreadCount: 0,
    lastMessageAt: createdAt,
    messages: [welcomeMessage],
  };
}

export function getLastMessage(conversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

export function getConversationSubtitle(conversation, users, currentUser) {
  if (conversation.type === 'group') {
    return `${conversation.participantIds.length} participantes`;
  }

  const otherUser = users.find((user) => conversation.participantIds.includes(user.id) && user.id !== currentUser.id);
  return otherUser ? `${otherUser.sector} · ${otherUser.role}` : conversation.description;
}
