import { useEffect, useMemo, useState } from 'react';
import AccountStatusScreen from './components/auth/AccountStatusScreen';
import AppLayout from './components/layout/AppLayout';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import LoginPage from './pages/LoginPage';
import Notifications from './pages/Notifications';
import Requests from './pages/Requests';
import PurchaseRequests from './pages/PurchaseRequests';
import Members from './pages/Members';
import Sectors from './pages/Sectors';
import SectorKnowledge from './pages/SectorKnowledge';
import { supabase } from './lib/supabase';
import { clearNotifications, fetchNotifications, markNotificationRead, subscribeToNotifications } from './services/notificationsService';
import { useAuth } from './contexts/AuthContext';

const pages = {
  dashboard: Dashboard,
  kanban: Kanban,
  requests: Requests,
  purchaseRequests: PurchaseRequests,
  chat: Chat,
  notifications: Notifications,
  sectors: Sectors,
  sectorKnowledge: SectorKnowledge,
  members: Members,
};

function App() {
  const { session, profile, loading, isActive, isOperacao } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [knowledgeSectorId, setKnowledgeSectorId] = useState('compras');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Operacao accounts only ever get Solicitacoes de compras - no other page is reachable.
  useEffect(() => {
    if (isOperacao && activePage !== 'purchaseRequests') setActivePage('purchaseRequests');
  }, [isOperacao, activePage]);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    try {
      const remoteNotifications = await fetchNotifications();
      setNotifications(remoteNotifications);
    } catch {
      // Notifications stay at their last known value if the fetch fails.
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return undefined;

    const channel = subscribeToNotifications(loadNotifications);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleMarkRead = async (notificationId) => {
    const updated = await markNotificationRead(notificationId);
    setNotifications((current) =>
      current.map((notification) => (notification.id === notificationId ? updated : notification)),
    );
  };

  const handleClearNotifications = async () => {
    const ownNotificationIds = notifications
      .filter((notification) => notification.userId === profile?.id)
      .map((notification) => notification.id);

    if (!ownNotificationIds.length) return;

    const deletedIds = await clearNotifications(ownNotificationIds);
    setNotifications((current) => current.filter((notification) => !deletedIds.includes(notification.id)));
  };

  const ActivePage = pages[activePage] ?? Dashboard;

  if (loading) return null;
  if (!session) return <LoginPage />;
  if (!profile) return <LoginPage />;
  if (!isActive) return <AccountStatusScreen status={profile.status} />;

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={isOperacao ? () => {} : setActivePage}
      unreadCount={isOperacao ? 0 : unreadCount}
      chatUnreadCount={chatUnreadCount}
      onOpenNotifications={isOperacao ? undefined : () => setActivePage('notifications')}
    >
      <ActivePage
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onClearNotifications={handleClearNotifications}
        onChatUnreadChange={setChatUnreadCount}
        onNavigate={setActivePage}
        knowledgeSectorId={knowledgeSectorId}
        onOpenKnowledge={(sectorId) => {
          setKnowledgeSectorId(sectorId);
          setActivePage('sectorKnowledge');
        }}
        onBackToSectors={() => setActivePage('sectors')}
      />
    </AppLayout>
  );
}

export default App;
