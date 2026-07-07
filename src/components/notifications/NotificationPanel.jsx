import EmptyState from '../common/EmptyState';
import NotificationItem from './NotificationItem';

function NotificationPanel({ notifications, onMarkRead, limit }) {
  const visibleNotifications = limit ? notifications.slice(0, limit) : notifications;

  if (visibleNotifications.length === 0) {
    return (
      <EmptyState
        title="Nenhuma notificação"
        description="As próximas liberações entre setores aparecerão nesta área."
      />
    );
  }

  return (
    <div className="notification-list">
      {visibleNotifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

export default NotificationPanel;
