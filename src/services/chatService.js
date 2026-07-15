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
    archivedAt: currentParticipant?.archived_at ?? null,
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
      .map((conversation) => mapConversationFromDb(conversation, profiles, currentUserId))
      .filter((conversation) => {
        if (conversation.type !== 'direct') return true;
        return conversation.messages.length > 0 || conversation.description === 'Conversa iniciada';
      });
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

    if (existing) {
      await supabase
        .from('conversations')
        .update({ description: 'Conversa iniciada', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      await restoreConversationForUser(existing.id, currentUser.id);
      return existing.id;
    }
  } catch {
    // If RLS prevents lookup, create a conversation on demand.
  }

  const title = `${currentUser.name} / ${otherUser.name}`;
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      title,
      description: 'Conversa iniciada',
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

export async function updateGroupConversation(conversationId, groupData) {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      title: groupData.name.trim(),
      description: groupData.description.trim(),
      sector: groupData.sector,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('type', 'group')
    .select('*')
    .single();

  if (error) throw error;
  return data.id;
}

export async function addGroupParticipant(conversationId, profileId) {
  const { error } = await supabase
    .from('conversation_participants')
    .insert({ conversation_id: conversationId, profile_id: profileId });

  if (error) throw error;
}

export async function removeGroupParticipant(conversationId, profileId) {
  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId);

  if (error) throw error;
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

export async function archiveConversationForUser(conversationId, profileId) {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ archived_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId);

  if (error) throw error;
}

export async function restoreConversationForUser(conversationId, profileId) {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ archived_at: null })
    .eq('conversation_id', conversationId)
    .eq('profile_id', profileId);

  if (error) throw error;
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
  const [{ data: conversation }, { data: sender }, { data: participants }] = await Promise.all([
    supabase.from('conversations').select('id, title, type').eq('id', conversationId).maybeSingle(),
    supabase.from('profiles').select('id, name, auth_user_id').eq('id', senderId).maybeSingle(),
    supabase
      .from('conversation_participants')
      .select('profile_id, profiles(id, name, auth_user_id)')
      .eq('conversation_id', conversationId),
  ]);

  if (!participants?.length) return;
  const recentThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const notifications = [];
  for (const participant of participants) {
    const recipientProfile = participant.profiles;
    if (!recipientProfile) continue;
    if (participant.profile_id === senderId) continue;
    if (sender?.auth_user_id && recipientProfile.auth_user_id === sender.auth_user_id) continue;

    const { data: recentNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', participant.profile_id)
      .eq('category', 'Chat')
      .eq('type', 'chat_message')
      .eq('target_user_name', sender?.name ?? '')
      .gte('created_at', recentThreshold)
      .limit(1)
      .maybeSingle();

    if (recentNotification) continue;

    notifications.push({
      user_id: participant.profile_id,
      title: conversation?.type === 'group' ? `Nova mensagem em ${conversation.title}` : 'Nova mensagem no chat',
      message: `${sender?.name ?? 'Um membro'}: ${messageText.slice(0, 120)}`,
      category: 'Chat',
      type: 'chat_message',
      target_user_name: sender?.name ?? null,
    });
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}
