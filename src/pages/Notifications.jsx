import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import NotificationPanel from '../components/notifications/NotificationPanel';

function Notifications({ notifications, onMarkRead, onClearNotifications }) {
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearNotice, setClearNotice] = useState('');
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const clearableCount = notifications.length;

  const handleOpenClear = () => {
    setClearError('');

    if (clearableCount === 0) {
      setClearNotice('Você não possui notificações para limpar no momento.');
      return;
    }

    setClearNotice('');
    setClearOpen(true);
  };

  const handleConfirmClear = async () => {
    setClearing(true);
    setClearError('');

    try {
      await onClearNotifications();
      setClearOpen(false);
    } catch (err) {
      setClearError(err.message ?? 'Nao foi possivel limpar as notificacoes.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-heading notifications-heading">
        <div>
          <p className="eyebrow">Comunicação entre setores</p>
          <h2>Notificações</h2>
          <p>{unreadCount} aviso(s) pendente(s) de leitura.</p>
        </div>
        <button type="button" className="ghost-button" onClick={handleOpenClear}>
          <Trash2 size={16} aria-hidden="true" />
          Limpar notificações
        </button>
      </section>

      {clearNotice ? <div className="members-feedback">{clearNotice}</div> : null}

      <NotificationPanel notifications={notifications} onMarkRead={onMarkRead} />

      <ConfirmModal
        open={clearOpen}
        title="Limpar notificações"
        message="Tem certeza que deseja limpar todas as suas notificações? Elas serão removidas somente da sua conta."
        cancelLabel="Cancelar"
        confirmLabel="Sim, limpar"
        busy={clearing}
        error={clearError}
        onCancel={() => (clearing ? null : setClearOpen(false))}
        onConfirm={handleConfirmClear}
      />
    </div>
  );
}

export default Notifications;
