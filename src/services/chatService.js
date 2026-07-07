import { supabase } from '../lib/supabase';

function mapMessage(message, profilesById) {
  const sender = profilesById.get(message.sender_id);
  return {
    id: message.id,
    senderId: message.sender_id,
    senderName: sender?.name ?? 'Usuario',
    text: message.text,
    createdAt: message.created_at,
    readBy: [],
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
    .map((message) => mapMessage(message, profilesById));
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
}

export async function ensureDirectConversation(currentUser, otherUser) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, conversation_participants(*)')
    .eq('type', 'direct');

  if (error) throw error;

  const existing = data.find((conversation) => {
    const participantIds = conversation.conversation_participants.map((participant) => participant.profile_id);
    return participantIds.includes(currentUser.id) && participantIds.includes(otherUser.id) && participantIds.length === 2;
  });

  if (existing) return existing.id;

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
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    text: text.trim(),
  });

  if (error) throw error;

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

export async function markConversationRead(conversationId, profileId) {
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
    .subscribe();
}
