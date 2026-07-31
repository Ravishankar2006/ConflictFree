import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ROLE_CONFIG = {
  admin:   { color: 'var(--accent-purple)', label: 'Admin' },
  faculty: { color: 'var(--accent-primary)', label: 'Faculty' },
  student: { color: 'var(--accent-teal)',   label: 'Student' },
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rc = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.student;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="nav-icon-btn nav-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <div className="navbar-brand">
          <div className="brand-logo-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M3 10h18"/>
              <path d="M10 16l2 2 4-4"/>
            </svg>
          </div>
          <span className="brand-name">ConflictFree</span>
        </div>
      </div>

      <div className="navbar-right">
        {user?.role === 'admin' && <NotificationBell />}

        <button
          className="nav-icon-btn theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="nav-divider" />

        <div className="nav-user-chip">
          <div
            className="nav-avatar"
            style={{ background: rc.color }}
            title={`${user?.name} — ${rc.label}`}
          >
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="nav-user-info">
            <span className="nav-user-name">{user?.name}</span>
            <span className="nav-user-role" style={{ color: rc.color }}>
              {rc.label}
            </span>
          </div>
        </div>

        <button className="nav-logout-btn" onClick={handleLogout} title="Sign out">
          <LogOutIcon />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
