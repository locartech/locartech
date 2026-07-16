import { supabase } from '../lib/supabase';

function mapMessage(message, profilesById) {
  const sender = profilesById.get(message.sender_id);
  return {
    id: message.id,
    senderId: message.sender_id,
    senderName: sender?.name ?? 'Usuario',
    text: message.text,
    type: message.message_type ?? 'user',
    metadata: message.metadata ?? {},
    createdAt: message.created_at,
    readBy: message.readBy ?? [],
  };
}

function mapConversationSummary(row, profiles, currentUserId) {
  const participantIds = row.participant_ids ?? [];
  const otherUser = profiles.find((profile) => participantIds.includes(profile.id) && profile.id !== currentUserId);
  const lastMessage = row.last_message_id
    ? {
        id: row.last_message_id,
        senderId: row.last_message_sender_id,
        senderName: profiles.find((profile) => profile.id === row.last_message_sender_id)?.name ?? 'Usuario',
        text: row.last_message_text,
        type: row.last_message_type ?? 'user',
        createdAt: row.last_message_created_at,
        readBy: [],
      }
    : null;

  return {
    id: row.id,
    type: row.conversation_type,
    title: row.conversation_type === 'direct' ? otherUser?.name ?? row.title : row.title,
    description: row.description || '',
    sector: row.sector,
    participantIds,
    unreadCount: Number(row.unread_count ?? 0),
    archivedAt: row.archived_at ?? null,
    lastMessageAt: row.last_message_created_at ?? row.updated_at ?? row.created_at,
    messages: lastMessage ? [lastMessage] : [],
  };
}

export async function fetchConversations(currentUserId, profiles) {
  const { data, error } = await supabase.rpc('list_my_conversations');
  if (error) throw error;

  return (data ?? [])
    .map((row) => mapConversationSummary(row, profiles, currentUserId))
    .filter((conversation) => conversation.type !== 'direct' || conversation.messages.length > 0 || conversation.description === 'Conversa iniciada');
}

export async function fetchConversationMessages(conversationId, profiles) {
  const { data: participantRows, error: participantsError } = await supabase
    .from('conversation_participants')
    .select('profile_id, last_read_at')
    .eq('conversation_id', conversationId);
  if (participantsError) throw participantsError;

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, text, message_type, metadata, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  return (data ?? []).map((message) => {
    const readBy = (participantRows ?? [])
      .filter((participant) =>
        participant.profile_id !== message.sender_id &&
        participant.last_read_at &&
        new Date(participant.last_read_at) >= new Date(message.created_at),
      )
      .map((participant) => participant.profile_id);
    return mapMessage({ ...message, readBy }, profilesById);
  });
}

export async function ensureDirectConversation(_currentUser, otherUser) {
  const { data, error } = await supabase.rpc('ensure_direct_conversation', {
    p_other_profile_id: otherUser.id,
  });
  if (error) throw error;
  return data;
}

export async function createGroupConversation(groupData) {
  const { data, error } = await supabase.rpc('create_group_conversation', {
    p_title: groupData.name.trim(),
    p_description: groupData.description.trim(),
    p_sector: groupData.sector,
    p_participant_ids: groupData.participantIds,
  });
  if (error) throw error;
  return data;
}

export async function updateGroupConversation(conversationId, groupData) {
  const { data, error } = await supabase.rpc('update_group_conversation', {
    p_conversation_id: conversationId,
    p_title: groupData.name.trim(),
    p_description: groupData.description.trim(),
    p_sector: groupData.sector,
  });
  if (error) throw error;
  return data;
}

export async function addGroupParticipant(conversationId, profileId) {
  const { error } = await supabase.rpc('add_group_participant_rpc', {
    p_conversation_id: conversationId,
    p_profile_id: profileId,
  });
  if (error) throw error;
}

export async function removeGroupParticipant(conversationId, profileId) {
  const { error } = await supabase.rpc('remove_group_participant_rpc', {
    p_conversation_id: conversationId,
    p_profile_id: profileId,
  });
  if (error) throw error;
}

export async function sendChatMessage(conversationId, _senderId, text) {
  const { error } = await supabase.rpc('send_chat_message', {
    p_conversation_id: conversationId,
    p_text: text.trim(),
  });
  if (error) throw error;
}

export async function markConversationRead(conversationId) {
  if (String(conversationId).startsWith('direct:')) return;
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) throw error;
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
    .subscribe();
}
