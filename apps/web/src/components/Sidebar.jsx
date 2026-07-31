import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

/* ── SVG Icon Components ─────────────────────────── */
const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const BotIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const BookOpenIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9l9-6 9 6"/><line x1="9" y1="21" x2="9" y2="9"/><line x1="15" y1="21" x2="15" y2="9"/>
  </svg>
);

const DoorIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);

const GraduationCapIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

/* ── Nav Items ───────────────────────────────────── */
const NAV_ITEMS = {
  admin: [
    { key: 'timetable',   Icon: CalendarIcon,      label: 'Timetable' },
    { key: 'scheduler',   Icon: BotIcon,            label: 'AI Scheduler' },
    { key: 'analytics',   Icon: BarChartIcon,       label: 'Analytics' },
    { key: 'conflicts',   Icon: AlertTriangleIcon,  label: 'Conflicts' },
    { key: 'courses',     Icon: BookOpenIcon,       label: 'Courses' },
    { key: 'departments', Icon: BuildingIcon,       label: 'Departments' },
    { key: 'rooms',       Icon: DoorIcon,           label: 'Rooms' },
    { key: 'classes',     Icon: GraduationCapIcon,  label: 'Classes' },
    { key: 'users',       Icon: UserIcon,           label: 'Users' },
    { key: 'enrollments', Icon: UsersIcon,          label: 'Enrollments' },
  ],
  faculty: [
    { key: 'timetable', Icon: CalendarIcon, label: 'My Schedule' },
  ],
  student: [
    { key: 'timetable', Icon: CalendarIcon, label: 'My Timetable' },
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
          {items.map(({ key, Icon, label }) => (
            <button
              key={key}
              className={`sidebar-item ${activeTab === key ? 'sidebar-item-active' : ''}`}
              onClick={() => onTabChange(key)}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="sidebar-label">{label}</span>
              {activeTab === key && <span className="sidebar-indicator" aria-hidden="true" />}
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
