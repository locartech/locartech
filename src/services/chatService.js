import { supabase } from '../lib/supabase';

function mapMessage(message, profilesById) {
  const sender = profilesById.get(message.sender_id);
  return {
    id: message.id,
    senderId: message.sender_id,
    senderName: sender?.name ?? 'Usuario',
    text: message.text,
    createdAt: message.created_at,
    readBy: message.readBy ?? [],
  };
}

function getLastMessage(messages) {
  return messages[messages.length - 1] ?? null;
}

export function mapConversationFromDb(conversation, profiles, currentUserId) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const participants = conversation.conversation_participants ?? [];
  const messages = (conversation.messages ?? [])
    .slice()
    .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))
    .map((message) => {
      const readBy = participants
        .filter((participant) => {
          if (participant.profile_id === message.sender_id || !participant.last_read_at) return false;
          return new Date(participant.last_read_at) >= new Date(message.created_at);
        })
        .map((participant) => participant.profile_id);

      return mapMessage({ ...message, readBy }, profilesById);
    });
  const participantIds = participants.map((participant) => participant.profile_id);
  const currentParticipant = participants.find((participant) => participant.profile_id === currentUserId);
  const lastReadAt = currentParticipant?.last_read_at ? new Date(currentParticipant.last_read_at) : null;
  const unreadCount = messages.filter(
    (message) => message.senderId !== currentUserId && (!lastReadAt || new Date(message.createdAt) > lastReadAt),
  ).length;
  const otherUser = profiles.find((profile) => participantIds.includes(profile.id) && profile.id !== currentUserId);
  const lastMessage = getLastMessage(messages);

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.type === 'direct' ? otherUser?.name ?? conversation.title : conversation.title,
    description: conversation.description || '',
    sector: conversation.sector,
    participantIds,
    unreadCount,
    lastMessageAt: lastMessage?.createdAt ?? conversation.updated_at ?? conversation.created_at,
    messages,
  };
}

export async function fetchConversations(currentUserId, profiles) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants(*),
        messages(*)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data
      .filter((conversation) =>
        conversation.conversation_participants?.some((participant) => participant.profile_id === currentUserId),
      )
      .map((conversation) => mapConversationFromDb(conversation, profiles, currentUserId));
  } catch (error) {
    return [];
  }
}

export async function ensureDirectConversation(currentUser, otherUser) {
  try {
    const existingConversations = await fetchConversations(currentUser.id, [currentUser, otherUser]);
    const existing = existingConversations.find(
      (conversation) =>
        conversation.type === 'direct' &&
        !conversation.pendingConversation &&
        conversation.participantIds.includes(otherUser.id),
    );

    if (existing) return existing.id;
  } catch {
    // If RLS prevents lookup, create a conversation on demand.
  }

  const title = `${currentUser.name} / ${otherUser.name}`;
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      title,
      description: 'Conversa individual',
      sector: otherUser.sector,
      created_by: currentUser.id,
    })
    .select('*')
    .single();

  if (conversationError) throw conversationError;

  const { error: participantsError } = await supabase.from('conversation_participants').insert([
    { conversation_id: conversation.id, profile_id: currentUser.id },
    { conversation_id: conversation.id, profile_id: otherUser.id },
  ]);

  if (participantsError) throw participantsError;
  return conversation.id;
}

export async function createGroupConversation(groupData, currentUser) {
  const participantIds = Array.from(new Set([currentUser.id, ...groupData.participantIds]));
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      title: groupData.name.trim(),
      description: groupData.description.trim(),
      sector: groupData.sector,
      created_by: currentUser.id,
    })
    .select('*')
    .single();

  if (error) throw error;

  const { error: participantsError } = await supabase.from('conversation_participants').insert(
    participantIds.map((profileId) => ({
      conversation_id: conversation.id,
      profile_id: profileId,
    })),
  );

  if (participantsError) throw participantsError;

  if (groupData.description.trim()) {
    await sendChatMessage(conversation.id, currentUser.id, `Grupo criado: ${groupData.description.trim()}`);
  }

  return conversation.id;
}

export async function sendChatMessage(conversationId, senderId, text) {
  const messageText = text.trim();
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    text: messageText,
  });

  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  await notifyMessageRecipients(conversationId, senderId, messageText);
}

export async function markConversationRead(conversationId, profileId) {
  if (String(conversationId).startsWith('direct:')) return;

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId);
}

export function subscribeToChat(profileId, onChange) {
  return supabase
    .channel(`chat:${profileId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe();
}

async function notifyMessageRecipients(conversationId, senderId, messageText) {
  const [{ data: conversation }, { data: sender }] = await Promise.all([
    supabase.from('conversations').select('id, title, type').eq('id', conversationId).maybeSingle(),
    supabase.from('profiles').select('id, name').eq('id', senderId).maybeSingle(),
  ]);

  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select('profile_id')
    .eq('conversation_id', conversationId);

  if (error || !participants?.length) return;

  const notifications = participants
    .filter((participant) => participant.profile_id !== senderId)
    .map((participant) => ({
      user_id: participant.profile_id,
      title: conversation?.type === 'group' ? `Nova mensagem em ${conversation.title}` : 'Nova mensagem no chat',
      message: `${sender?.name ?? 'Um membro'}: ${messageText.slice(0, 120)}`,
      category: 'Chat',
      type: 'chat_message',
      target_user_name: sender?.name ?? null,
    }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}
