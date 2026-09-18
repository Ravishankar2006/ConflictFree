import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

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
          <Menu size={20} />
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
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={16} />}
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
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
