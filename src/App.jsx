import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import AccountStatusScreen from './components/auth/AccountStatusScreen';
import AppLayout from './components/layout/AppLayout';
import ForgotPassword from './pages/ForgotPassword';
import LoginPage from './pages/LoginPage';
import ResetPassword from './pages/ResetPassword';
import { supabase } from './lib/supabase';
import { clearNotifications, fetchNotifications, markNotificationRead, subscribeToNotifications } from './services/notificationsService';
import { useAuth } from './contexts/AuthContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Kanban = lazy(() => import('./pages/Kanban'));
const Requests = lazy(() => import('./pages/Requests'));
const PurchaseRequests = lazy(() => import('./pages/PurchaseRequests'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Sectors = lazy(() => import('./pages/Sectors'));
const SectorKnowledge = lazy(() => import('./pages/SectorKnowledge'));
const Members = lazy(() => import('./pages/Members'));

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
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

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
    const updated = await markNotificationRead(notificationId, profile?.id);
    setNotifications((current) =>
      current.map((notification) => (notification.id === notificationId ? updated : notification)),
    );
  };

  const handleClearNotifications = async () => {
    const notificationIds = notifications.map((notification) => notification.id);

    if (!notificationIds.length) return;

    await clearNotifications(notificationIds, profile?.id);
    setNotifications([]);
  };

  const ActivePage = pages[activePage] ?? Dashboard;

  if (pathname === '/esqueci-senha' || pathname === '/forgot-password') return <ForgotPassword />;
  if (pathname === '/redefinir-senha' || pathname === '/reset-password') return <ResetPassword />;

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
      <Suspense fallback={<div className="members-feedback">Carregando pagina...</div>}>
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
      </Suspense>
    </AppLayout>
  );
}

export default App;
