import { supabase } from '../lib/supabase';

export function mapNotificationFromDb(notification) {
  return {
    id: notification.id,
    userId: notification.user_id,
    recipientSectorId: notification.recipient_sector_id,
    title: notification.title,
    message: notification.message,
    category: notification.category,
    type: notification.type,
    targetSectorName: notification.target_sector_name,
    targetUserName: notification.target_user_name,
    read: notification.read,
    createdAt: notification.created_at,
  };
}

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapNotificationFromDb);
}

export async function createNotification(values) {
  const payload = {
    user_id: values.userId ?? null,
    recipient_sector_id: values.recipientSectorId ?? null,
    title: values.title,
    message: values.message,
    category: values.category || 'Geral',
    type: values.type ?? null,
    target_sector_name: values.targetSectorName || null,
    target_user_name: values.targetUserName || null,
  };

  const { data, error } = await supabase.from('notifications').insert(payload).select('*').single();
  if (error) throw error;
  return mapNotificationFromDb(data);
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select('*')
    .single();

  if (error) throw error;
  return mapNotificationFromDb(data);
}

export async function clearNotifications(notificationIds) {
  if (!notificationIds.length) return;
  const { error } = await supabase.from('notifications').delete().in('id', notificationIds);
  if (error) throw error;
}

export function subscribeToNotifications(onChange) {
  return supabase
    .channel('notifications:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe();
}
