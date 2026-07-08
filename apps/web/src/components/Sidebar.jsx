import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = {
  admin: [
    { key: 'timetable',   icon: '📅', label: 'Timetable' },
    { key: 'conflicts',   icon: '⚠️', label: 'Conflicts' },
    { key: 'courses',     icon: '📚', label: 'Courses' },
    { key: 'enrollments', icon: '👥', label: 'Enrollments' },
  ],
  faculty: [
    { key: 'timetable', icon: '📅', label: 'My Schedule' },
  ],
  student: [
    { key: 'timetable', icon: '📅', label: 'My Timetable' },
  ],
};

export default function Sidebar({ open, activeTab, onTabChange }) {
  const { user } = useAuth();
  const items = NAV_ITEMS[user?.role] ?? [];

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && <div className="sidebar-backdrop" onClick={() => onTabChange(activeTab)} />}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <nav className="sidebar-nav">
          {items.map(item => (
            <button
              key={item.key}
              className={`sidebar-item ${activeTab === item.key ? 'sidebar-item-active' : ''}`}
              onClick={() => onTabChange(item.key)}
              aria-current={activeTab === item.key ? 'page' : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {activeTab === item.key && <span className="sidebar-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-version">Smart Timetable v1.0</span>
        </div>
      </aside>
    </>
  );
}
