import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

type AdminNavItem = {
  to: string;
  label: string;
  icon: 'dashboard' | 'rooms' | 'reservations' | 'notifications' | 'users' | 'payments' | 'settings';
  soon?: boolean;
};

const navItems: AdminNavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/habitaciones', label: 'Habitaciones', icon: 'rooms' },
  { to: '/admin/reservas', label: 'Reservas', icon: 'reservations' },
  { to: '/admin/notificaciones', label: 'Notificaciones', icon: 'notifications' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
  { to: '/admin/pagos', label: 'Pagos', icon: 'payments', soon: true },
  { to: '/admin/configuracion', label: 'Configuración', icon: 'settings', soon: true },
];

const ADMIN_SIDEBAR_STORAGE_KEY = 'hotelnova_admin_sidebar_collapsed';

const AdminIcon: React.FC<{ name: AdminNavItem['icon'] }> = ({ name }) => {
  switch (name) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.5V6.75A1.75 1.75 0 0 1 5.75 5h5.5A1.75 1.75 0 0 1 13 6.75v4.75A1.75 1.75 0 0 1 11.25 13h-5.5A1.75 1.75 0 0 1 4 11.5Z" />
          <path d="M11 19.25v-4.5A1.75 1.75 0 0 1 12.75 13h5.5A1.75 1.75 0 0 1 20 14.75v4.5A1.75 1.75 0 0 1 18.25 21h-5.5A1.75 1.75 0 0 1 11 19.25Z" />
          <path d="M4 19.25v-1.5A1.75 1.75 0 0 1 5.75 16h5.5A1.75 1.75 0 0 1 13 17.75v1.5A1.75 1.75 0 0 1 11.25 21h-5.5A1.75 1.75 0 0 1 4 19.25Z" />
          <path d="M11 7.25V5.75A1.75 1.75 0 0 1 12.75 4h5.5A1.75 1.75 0 0 1 20 5.75v1.5A1.75 1.75 0 0 1 18.25 9h-5.5A1.75 1.75 0 0 1 11 7.25Z" />
        </svg>
      );
    case 'rooms':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 20V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V20" />
          <path d="M4 20h16" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      );
    case 'reservations':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4v4" />
          <path d="M17 4v4" />
          <path d="M4.5 9h15" />
          <path d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z" />
          <path d="m9 13 2 2 4-4" />
        </svg>
      );
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 17H5.5a.5.5 0 0 1-.46-.69l.96-2.33a5.6 5.6 0 0 0 .44-2.2V10a5.5 5.5 0 1 1 11 0v1.78a5.6 5.6 0 0 0 .44 2.2l.96 2.33a.5.5 0 0 1-.46.69H15" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 20v-1.25A3.75 3.75 0 0 0 12.25 15H8.75A3.75 3.75 0 0 0 5 18.75V20" />
          <path d="M11.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M18.5 20v-1a4.5 4.5 0 0 0-2.5-4.03" />
          <path d="M16.5 5.6a3.2 3.2 0 0 1 0 6.4" />
        </svg>
      );
    case 'payments':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 7.5h15A1.5 1.5 0 0 1 21 9v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V9a1.5 1.5 0 0 1 1.5-1.5Z" />
          <path d="M6 12h4" />
          <path d="M15.5 12h1" />
          <path d="M18 4.5 19.25 6 18 7.5" />
        </svg>
      );
    case 'settings':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.25 4.5h3.5l.55 2.15a6.8 6.8 0 0 1 1.35.78l2.18-.78 1.75 3.03-1.63 1.67c.08.44.12.9.12 1.35s-.04.91-.12 1.35l1.63 1.67-1.75 3.03-2.18-.78c-.42.31-.88.58-1.35.78l-.55 2.15h-3.5l-.55-2.15a6.8 6.8 0 0 1-1.35-.78l-2.18.78-1.75-3.03 1.63-1.67A6.9 6.9 0 0 1 6 12c0-.45.04-.91.12-1.35L4.49 8.98l1.75-3.03 2.18.78c.42-.31.88-.58 1.35-.78l.55-2.15Z" />
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        </svg>
      );
  }
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const shortName = user?.nombre?.trim().split(' ')[0] || 'Admin';
  const initials = shortName.slice(0, 2).toUpperCase();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) {
      return;
    }

    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, 'true');
  }, [location.pathname, isCollapsed]);

  const shellClassName = useMemo(
    () => `admin-shell ${isCollapsed ? 'is-collapsed' : ''}`,
    [isCollapsed]
  );

  const handleExpandSidebar = () => {
    setIsCollapsed(false);
  };

  const handleCollapseContent = () => {
    setIsCollapsed(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={shellClassName}>
      <aside className="admin-sidebar" onClick={handleExpandSidebar}>
        <div className="admin-sidebar-brand">
          <Link to="/admin/dashboard" className="admin-brand-link">
            <span className="admin-brand-mark">HN</span>
            <span className="admin-brand-text">Hotel Nova</span>
          </Link>
        </div>

        <div className="admin-sidebar-user">
          <span className="admin-sidebar-avatar">{initials}</span>
          <div>
            <strong>{shortName}</strong>
            <span>Administrador</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Navegación de administración">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleExpandSidebar}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'is-active' : ''}`}
            >
              <span className="admin-sidebar-icon">
                <AdminIcon name={item.icon} />
              </span>
              <span className="admin-sidebar-label">{item.label}</span>
              {item.soon && <span className="admin-sidebar-tag">Próx.</span>}
            </NavLink>
          ))}
        </nav>

        <button className="admin-sidebar-logout" onClick={handleLogout}>
          <span className="admin-sidebar-logout-icon" aria-hidden="true">
            ⎋
          </span>
          <span className="admin-sidebar-logout-text">Cerrar sesión</span>
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-main-inner">
          <header className="admin-topbar">
            <div>
              <p className="admin-topbar-kicker">Hotel Nova / Administración</p>
              <h1 className="admin-topbar-title">Panel premium</h1>
              <p className="admin-topbar-copy">Control central de habitaciones, reservas, usuarios y notificaciones.</p>
            </div>
            <div className="admin-topbar-chip">Vista exclusiva del administrador</div>
          </header>

          <section className="admin-content" onClick={handleCollapseContent}>
            {children}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;