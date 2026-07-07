import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function AppLayout({ activePage, onNavigate, unreadCount, chatUnreadCount, onResetDemo, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('locartech.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('locartech.sidebar.collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        unreadCount={unreadCount}
        chatUnreadCount={chatUnreadCount}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />
      <div className="main-shell">
        <Header activePage={activePage} onResetDemo={onResetDemo} unreadCount={unreadCount} />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
