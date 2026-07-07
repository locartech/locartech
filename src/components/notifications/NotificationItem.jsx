import { Check, Circle } from 'lucide-react';
import { sectors, users } from '../../data/mockData';

const formatNotificationDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

function NotificationItem({ notification, onMarkRead }) {
  const sector = sectors.find((item) => item.id === notification.targetSectorId);
  const user = users.find((item) => item.id === notification.targetUserId);
  const sectorLabel = sector?.name ?? notification.targetSectorName ?? 'Geral';
  const userLabel = user?.name ?? notification.targetUserName;

  return (
    <article className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
      <div className="notification-indicator">
        {notification.read ? <Check size={16} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
      </div>
      <div>
        <div className="notification-heading">
          <h3>{notification.title}</h3>
          <time>{formatNotificationDate(notification.createdAt)}</time>
        </div>
        <p>{notification.message}</p>
        <div className="notification-target">
          <span>{sectorLabel}</span>
          {userLabel ? <span>{userLabel}</span> : null}
        </div>
      </div>
      {!notification.read ? (
        <button type="button" className="text-button" onClick={() => onMarkRead(notification.id)}>
          Marcar como lida
        </button>
      ) : null}
    </article>
  );
}

export default NotificationItem;
