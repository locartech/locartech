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
  const [notificationsResult, dismissalsResult] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('notification_dismissals').select('notification_id'),
  ]);

  if (notificationsResult.error) throw notificationsResult.error;
  if (dismissalsResult.error) throw dismissalsResult.error;

  const dismissedIds = new Set((dismissalsResult.data ?? []).map((row) => row.notification_id));
  return (notificationsResult.data ?? [])
    .filter((notification) => !dismissedIds.has(notification.id))
    .map(mapNotificationFromDb);
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

export async function clearNotifications(notificationIds, userId) {
  if (!notificationIds.length) return [];
  if (!userId) throw new Error('Usuario nao identificado. Entre novamente e tente limpar as notificacoes.');

  const dismissals = notificationIds.map((notificationId) => ({
    notification_id: notificationId,
    user_id: userId,
  }));

  const { error } = await supabase
    .from('notification_dismissals')
    .upsert(dismissals, { onConflict: 'notification_id,user_id', ignoreDuplicates: true });

  if (error) throw error;
  return notificationIds;
}

export function subscribeToNotifications(onChange) {
  return supabase
    .channel('notifications:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_dismissals' }, onChange)
    .subscribe();
}
