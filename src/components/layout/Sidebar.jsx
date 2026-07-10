import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Columns3,
  MessageCircle,
  ShoppingCart,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LocarTechLogo from '../brand/LocarTechLogo';
import UserProfileModal from '../profile/UserProfileModal';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  {
    id: 'requests',
    label: 'Solicitações',
    icon: ClipboardList,
    children: [{ id: 'purchaseRequests', label: 'Solicitações de compras', icon: ShoppingCart }],
  },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'sectors', label: 'Setores', icon: Building2 },
  { id: 'members', label: 'Membros', icon: UsersRound, adminOnly: true },
];

function Sidebar({ activePage, onNavigate, unreadCount, chatUnreadCount, collapsed, onToggleCollapsed }) {
  const { currentUser, isAdmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState(() => ({
    requests: activePage === 'requests' || activePage === 'purchaseRequests',
  }));
  const visibleNavigation = navigation.filter((item) => !item.adminOnly || isAdmin);

  const handleNavigationClick = (item) => {
    if (item.children?.length) {
      setOpenSubmenus((current) => ({ ...current, [item.id]: !current[item.id] }));
    }

    onNavigate(item.id);
  };

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
          const childIsActive = item.children?.some((child) => child.id === activePage);
          const isActive =
            activePage === item.id ||
            childIsActive ||
            (activePage === 'sectorKnowledge' && item.id === 'sectors');
          const count = item.id === 'notifications' ? unreadCount : item.id === 'chat' ? chatUnreadCount : 0;
          const isOpen = Boolean(openSubmenus[item.id]) || childIsActive;

          return (
            <div key={item.id} className="nav-group">
              <button
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigationClick(item)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
                {count > 0 ? <span className="nav-count">{count}</span> : null}
                {item.children?.length ? (
                  <ChevronDown className={`nav-chevron ${isOpen ? 'open' : ''}`} size={15} aria-hidden="true" />
                ) : null}
              </button>

              {item.children?.length && isOpen ? (
                <div className="nav-submenu">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        className={`nav-subitem ${activePage === child.id ? 'active' : ''}`}
                        onClick={() => onNavigate(child.id)}
                        title={collapsed ? child.label : undefined}
                      >
                        <ChildIcon size={16} aria-hidden="true" />
                        <span className="nav-label">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <button type="button" className="sidebar-profile" onClick={() => setProfileOpen(true)} title="Ver perfil">
        {currentUser.photoUrl ? <img src={currentUser.photoUrl} alt="" /> : <span>{currentUser.avatarInitials}</span>}
        <div className="sidebar-profile-copy">
          <strong>{currentUser.name}</strong>
          <small>
            {currentUser.sector}
            {isAdmin ? ' - Admin' : ''}
          </small>
        </div>
      </button>

      {profileOpen ? <UserProfileModal onClose={() => setProfileOpen(false)} /> : null}
    </aside>
  );
}

export default Sidebar;
