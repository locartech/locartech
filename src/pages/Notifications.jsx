import NotificationPanel from '../components/notifications/NotificationPanel';

function Notifications({ notifications, onMarkRead }) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Comunicação entre setores</p>
          <h2>Notificações</h2>
        </div>
        <p>{unreadCount} aviso(s) pendente(s) de leitura.</p>
      </section>

      <NotificationPanel notifications={notifications} onMarkRead={onMarkRead} />
    </div>
  );
}

export default Notifications;
