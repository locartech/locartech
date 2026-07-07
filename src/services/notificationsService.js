import { supabase } from '../lib/supabase';

export function mapNotificationFromDb(notification) {
  return {
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.message,
    category: notification.category,
    targetSectorName: notification.target_sector_name,
    targetUserName: notification.target_user_name,
    read: notification.read,
    createdAt: notification.created_at,
  };
}

export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapNotificationFromDb);
}

export async function createNotification(values) {
  const payload = {
    user_id: values.userId ?? null,
    title: values.title,
    message: values.message,
    category: values.category || 'Geral',
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

export function subscribeToNotifications(userId, onChange) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      (payload) => {
        const next = payload.new || payload.old;
        if (!next?.user_id || next.user_id === userId) onChange();
      },
    )
    .subscribe();
}
