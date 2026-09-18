import {
  AlertTriangle,
  BarChart3,
  Bot,
  BookOpen,
  Building2,
  Calendar,
  DoorOpen,
  GraduationCap,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

/* ── Nav Items ───────────────────────────────────── */
const NAV_ITEMS = {
  admin: [
    { key: 'timetable',   Icon: Calendar,       label: 'Timetable' },
    { key: 'scheduler',   Icon: Bot,            label: 'AI Scheduler' },
    { key: 'analytics',   Icon: BarChart3,      label: 'Analytics' },
    { key: 'conflicts',   Icon: AlertTriangle,  label: 'Conflicts' },
    { key: 'courses',     Icon: BookOpen,       label: 'Courses' },
    { key: 'departments', Icon: Building2,      label: 'Departments' },
    { key: 'rooms',       Icon: DoorOpen,       label: 'Rooms' },
    { key: 'classes',     Icon: GraduationCap,  label: 'Classes' },
    { key: 'users',       Icon: User,           label: 'Users' },
    { key: 'enrollments', Icon: Users,          label: 'Enrollments' },
  ],
  faculty: [
    { key: 'timetable', Icon: Calendar, label: 'My Schedule' },
  ],
  student: [
    { key: 'timetable', Icon: Calendar, label: 'My Timetable' },
  ],
};

export default function Sidebar({ open, activeTab, onTabChange }) {
  const { user } = useAuth();
  const items = NAV_ITEMS[user?.role] ?? [];

  return (
    <>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => onTabChange(activeTab)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Navigation">
        <nav className="sidebar-nav">
          {items.map(item => (
            <button
              key={item.key}
              className={`sidebar-item ${activeTab === item.key ? 'sidebar-item-active' : ''}`}
              onClick={() => onTabChange(item.key)}
              aria-current={activeTab === item.key ? 'page' : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">
                <item.Icon size={17} />
              </span>
              <span className="sidebar-label">{item.label}</span>
              {activeTab === item.key && <span className="sidebar-indicator" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-version">ConflictFree v1.0</span>
        </div>
      </aside>
    </>
  );
}
