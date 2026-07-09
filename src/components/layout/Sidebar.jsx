import { BarChart3, Bell, Building2, ChevronLeft, ChevronRight, ClipboardList, Columns3, MessageCircle, UsersRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileModal from '../profile/UserProfileModal';
import { useState } from 'react';
import LocarTechLogo from '../brand/LocarTechLogo';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'requests', label: 'Solicitações', icon: ClipboardList },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'sectors', label: 'Setores', icon: Building2 },
  { id: 'members', label: 'Membros', icon: UsersRound, adminOnly: true },
];

function Sidebar({ activePage, onNavigate, unreadCount, chatUnreadCount, collapsed, onToggleCollapsed }) {
  const { currentUser, isAdmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-block">
        <div className="brand-copy">
          <LocarTechLogo width={136} />
        </div>
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          <span className="sr-only">{collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}</span>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id || (activePage === 'sectorKnowledge' && item.id === 'sectors');
          const count = item.id === 'notifications' ? unreadCount : item.id === 'chat' ? chatUnreadCount : 0;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
              {count > 0 ? <span className="nav-count">{count}</span> : null}
            </button>
          );
        })}
      </nav>

      <button type="button" className="sidebar-profile" onClick={() => setProfileOpen(true)} title="Ver perfil">
        {currentUser.photoUrl ? <img src={currentUser.photoUrl} alt="" /> : <span>{currentUser.avatarInitials}</span>}
        <div className="sidebar-profile-copy">
          <strong>{currentUser.name}</strong>
          <small>{currentUser.sector}{isAdmin ? ' · Admin' : ''}</small>
        </div>
      </button>

      {profileOpen ? <UserProfileModal onClose={() => setProfileOpen(false)} /> : null}
    </aside>
  );
}

export default Sidebar;
