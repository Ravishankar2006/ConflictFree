import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import './Navbar.css';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin:   'var(--accent-purple)',
    faculty: 'var(--accent-blue)',
    student: 'var(--accent-green)',
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="nav-menu-btn" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <span /><span /><span />
        </button>
        <div className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Smart Timetable</span>
        </div>
      </div>

      <div className="navbar-right">
        {user?.role === 'admin' && <NotificationBell />}

        <div className="nav-user-pill">
          <div
            className="nav-avatar"
            style={{ background: roleColors[user?.role] ?? 'var(--accent-blue)' }}
          >
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="nav-user-info">
            <span className="nav-user-name">{user?.name}</span>
            <span className="nav-user-role" style={{ color: roleColors[user?.role] }}>
              {user?.role}
            </span>
          </div>
        </div>

        <button className="nav-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
