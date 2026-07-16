import { supabase } from '../lib/supabase';

export function mapNotificationFromDb(notification, readIds = new Set()) {
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
    read: readIds.has(notification.id),
    createdAt: notification.created_at,
  };
}

export async function fetchNotifications() {
  const [notificationsResult, dismissalsResult, readsResult] = await Promise.all([
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('notification_dismissals').select('notification_id'),
    supabase.from('notification_reads').select('notification_id'),
  ]);

  if (notificationsResult.error) throw notificationsResult.error;
  if (dismissalsResult.error) throw dismissalsResult.error;
  if (readsResult.error) throw readsResult.error;

  const dismissedIds = new Set((dismissalsResult.data ?? []).map((row) => row.notification_id));
  const readIds = new Set((readsResult.data ?? []).map((row) => row.notification_id));
  return (notificationsResult.data ?? [])
    .filter((notification) => !dismissedIds.has(notification.id))
    .map((notification) => mapNotificationFromDb(notification, readIds));
}

export async function markNotificationRead(notificationId, userId) {
  if (!userId) throw new Error('Usuario nao identificado.');

  const { error } = await supabase.from('notification_reads').upsert({
    notification_id: notificationId,
    user_id: userId,
    read_at: new Date().toISOString(),
  });

  if (error) throw error;
  const { data, error: notificationError } = await supabase.from('notifications').select('*').eq('id', notificationId).single();
  if (notificationError) throw notificationError;
  return { ...mapNotificationFromDb(data), read: true };
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notification_reads' }, onChange)
    .subscribe();
}
