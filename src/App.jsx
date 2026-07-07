import { useEffect, useMemo, useState } from 'react';
import { CHAT_STORAGE_KEY, initialChatConversations } from './data/chatData';
import { initialNotifications, initialTasks } from './data/mockData';
import AppLayout from './components/layout/AppLayout';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import LoginPage from './pages/LoginPage';
import Notifications from './pages/Notifications';
import Requests from './pages/Requests';
import Members from './pages/Members';
import Sectors from './pages/Sectors';
import SectorKnowledge from './pages/SectorKnowledge';
import { getTotalUnreadCount } from './utils/chatUtils';
import { useAuth } from './contexts/AuthContext';
import { completeTask, updateTaskStatus } from './utils/workflow';

const STORAGE_KEY = 'locartech.workspace.v2';

const pages = {
  dashboard: Dashboard,
  kanban: Kanban,
  requests: Requests,
  chat: Chat,
  notifications: Notifications,
  sectors: Sectors,
  sectorKnowledge: SectorKnowledge,
  members: Members,
};

function loadChatUnreadCount() {
  try {
    const savedConversations = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedConversations) {
      return getTotalUnreadCount(JSON.parse(savedConversations));
    }
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return getTotalUnreadCount(initialChatConversations);
}

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    tasks: initialTasks,
    notifications: initialNotifications,
  };
}

function App() {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [knowledgeSectorId, setKnowledgeSectorId] = useState('compras');
  const [chatUnreadCount, setChatUnreadCount] = useState(loadChatUnreadCount);
  const [{ tasks, notifications }, setWorkspace] = useState(loadWorkspace);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, notifications }));
  }, [tasks, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleTaskStatus = (taskId, status) => {
    setWorkspace((current) => ({
      ...current,
      tasks: updateTaskStatus(current.tasks, taskId, status),
    }));
  };

  const handleCompleteTask = (taskId) => {
    setWorkspace((current) => completeTask(current.tasks, current.notifications, taskId));
  };

  const handleMarkRead = (notificationId) => {
    setWorkspace((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }));
  };

  const handleAddNotification = (notification) => {
    setWorkspace((current) => ({
      ...current,
      notifications: [notification, ...current.notifications],
    }));
  };

  const handleResetDemo = () => {
    const initialWorkspace = {
      tasks: initialTasks,
      notifications: initialNotifications,
    };

    setWorkspace(initialWorkspace);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWorkspace));
  };

  const ActivePage = pages[activePage] ?? Dashboard;

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      unreadCount={unreadCount}
      chatUnreadCount={chatUnreadCount}
      onResetDemo={handleResetDemo}
    >
      <ActivePage
        tasks={tasks}
        notifications={notifications}
        onCompleteTask={handleCompleteTask}
        onTaskStatus={handleTaskStatus}
        onMarkRead={handleMarkRead}
        onAddNotification={handleAddNotification}
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
