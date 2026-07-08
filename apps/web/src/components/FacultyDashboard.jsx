import { useState, useEffect } from 'react';
import { getMyTimetable } from '../services/api';
import TimetableCalendar from './TimetableCalendar';
import '../styles/FacultyDashboard.css';

export default function FacultyDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [viewMode, setViewMode]   = useState('calendar');

  useEffect(() => {
    getMyTimetable()
      .then(r => setTimetable(r.data))
      .catch(() => setError('Failed to load schedule'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading" />;
  if (error)   return <div className="error">{error}</div>;

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const grouped = days.reduce((acc, d) => { acc[d] = timetable.filter(s => s.day === d); return acc; }, {});

  return (
    <div className="faculty-dashboard">
      <div className="dash-header">
        <h2 className="dashboard-title">🎓 My Teaching Schedule</h2>
        <div className="view-toggle">
          <button className={viewMode === 'calendar' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setViewMode('calendar')}>📅 Calendar</button>
          <button className={viewMode === 'list' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setViewMode('list')}>☰ List</button>
        </div>
      </div>

      {timetable.length === 0 ? (
        <div className="empty-state">No classes assigned yet. Contact admin.</div>
      ) : viewMode === 'calendar' ? (
        <TimetableCalendar slots={timetable} />
      ) : (
        <div className="timetable-grid">
          {Object.entries(grouped).map(([day, slots]) => (
            <div key={day} className="day-card faculty">
              <h3 className="day-header faculty">{day}</h3>
              {slots.length === 0 ? (
                <p className="no-classes">No classes</p>
              ) : (
                <div className="slot-list">
                  {slots.map(slot => (
                    <div key={slot.id} className="slot-item faculty">
                      <div className="slot-course-code">{slot.course_code}</div>
                      <div className="slot-course-name">{slot.course_name}</div>
                      <div className="slot-details">
                        <div className="slot-time">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</div>
                        <div className="slot-room">{slot.room}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
