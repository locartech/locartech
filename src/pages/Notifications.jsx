import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import NotificationPanel from '../components/notifications/NotificationPanel';
import { useAuth } from '../contexts/AuthContext';

function Notifications({ notifications, onMarkRead, onClearNotifications }) {
  const { currentUser } = useAuth();
  const [clearOpen, setClearOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const clearableCount = notifications.filter((notification) => notification.userId === currentUser?.id).length;

  const handleConfirmClear = () => {
    setClearOpen(false);
    onClearNotifications();
  };

  return (
    <div className="page-stack">
      <section className="page-heading notifications-heading">
        <div>
          <p className="eyebrow">Comunicação entre setores</p>
          <h2>Notificações</h2>
          <p>{unreadCount} aviso(s) pendente(s) de leitura.</p>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setClearOpen(true)}
          disabled={clearableCount === 0}
        >
          <Trash2 size={16} aria-hidden="true" />
          Limpar notificações
        </button>
      </section>

      <NotificationPanel notifications={notifications} onMarkRead={onMarkRead} />

      <ConfirmModal
        open={clearOpen}
        title="Limpar notificações"
        message="Tem certeza que deseja limpar suas notificações pessoais? Avisos gerais do seu setor não serão removidos."
        cancelLabel="Cancelar"
        confirmLabel="Sim, limpar"
        onCancel={() => setClearOpen(false)}
        onConfirm={handleConfirmClear}
      />
    </div>
  );
}

export default Notifications;
