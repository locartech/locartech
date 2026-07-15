export function getTotalUnreadCount(conversations) {
  return conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0);
}

export function sortConversationsByLastMessage(conversations) {
  return [...conversations].sort((first, second) => new Date(second.lastMessageAt) - new Date(first.lastMessageAt));
}

export function getConversationById(conversations, conversationId) {
  return conversations.find((conversation) => conversation.id === conversationId) ?? null;
}

export function getLastMessage(conversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

export function getConversationOtherUser(conversation, users, currentUser) {
  if (conversation.type === 'group') return null;
  return users.find((user) => conversation.participantIds.includes(user.id) && user.id !== currentUser.id) ?? null;
}

export function getConversationSubtitle(conversation, users, currentUser) {
  if (conversation.type === 'group') {
    return `${conversation.participantIds.length} participantes`;
  }

  const otherUser = getConversationOtherUser(conversation, users, currentUser);
  return otherUser ? `${otherUser.sector} · ${otherUser.role}` : conversation.description;
}
