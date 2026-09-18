import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Bell } from 'lucide-react';
import { getConflicts } from '../services/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchConflicts = async () => {
    try {
      const res = await getConflicts();
      setConflicts(res.data.conflicts || []);
      setCount(res.data.count || 0);
    } catch {
      // Non-admin users won't have access — silently ignore
    }
  };

  return (
    <div className="bell-wrapper" ref={ref}>
      <button
        className={`bell-btn ${count > 0 ? 'bell-active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={`${count} conflict${count !== 1 ? 's' : ''} detected`}
      >
        <Bell size={16} aria-hidden="true" />
        {count > 0 && (
          <span className="bell-badge">{count > 9 ? '9+' : count}</span>
        )}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-header">
            <strong>Conflict Alerts</strong>
            {count > 0 && <span className="bell-count-tag">{count} active</span>}
          </div>
          {conflicts.length === 0 ? (
            <div className="bell-empty">No conflicts detected</div>
          ) : (
            <ul className="bell-list">
              {conflicts.slice(0, 5).map((c, i) => (
                <li key={i} className="bell-item">
                  <span className={`bell-type ${c.conflictType === 'ROOM' ? 'type-room' : 'type-faculty'}`}>
                    {c.conflictType}
                  </span>
                  <div className="bell-details">
                    <span>{c.day} · {c.timeA} vs {c.timeB}</span>
                    <span className="bell-courses">{c.courseA}<ArrowLeftRight size={11} aria-hidden="true" />{c.courseB}</span>
                  </div>
                </li>
              ))}
              {conflicts.length > 5 && (
                <li className="bell-more">+ {conflicts.length - 5} more conflicts…</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
