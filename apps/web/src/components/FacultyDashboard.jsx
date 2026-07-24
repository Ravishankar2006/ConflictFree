import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { getMyTimetable, getMyAvailability, updateMyAvailability, downloadIcs } from '../services/api';
import TimetableCalendar from './TimetableCalendar';
import '../styles/FacultyDashboard.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

function scheduleToDays(slots) {
  return DAYS.reduce((acc, d) => { acc[d] = slots.filter(s => s.day === d); return acc; }, {});
}

function ScheduleView({ timetable, viewMode, setViewMode }) {
  if (timetable.length === 0) {
    return <div className="empty-state">No classes assigned yet. Contact admin.</div>;
  }
  const grouped = scheduleToDays(timetable);
  return viewMode === 'calendar' ? (
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
                    <div className="slot-time">{slot.start_time?.slice(0,5)} – {slot.end_time?.slice(0,5)}</div>
                    <div className="slot-room">{slot.room}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AvailabilityPlanner({ toast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [schedule, setSchedule] = useState(() => {
    const s = {};
    DAYS.forEach(d => { s[d] = { enabled: true, start: '08:00', end: '17:00' }; });
    return s;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAvailability();
      const s = {};
      DAYS.forEach(d => { s[d] = { enabled: false, start: '08:00', end: '17:00' }; });
      for (const row of res.data) {
        s[row.day] = {
          enabled: true,
          start: row.start_time?.slice(0, 5) || '08:00',
          end: row.end_time?.slice(0, 5) || '17:00',
        };
      }
      setSchedule(s);
    } catch {
      toast?.('Failed to load availability', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const updateDay = (day, field, value) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const availability = DAYS
        .filter(d => schedule[d].enabled)
        .map(d => ({ day: d, start_time: schedule[d].start, end_time: schedule[d].end }));
      await updateMyAvailability({ availability });
      toast?.('Availability saved', 'success');
    } catch (err) {
      toast?.(err.response?.data?.message || 'Failed to save availability', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="availability-planner">
      <div className="planner-header">
        <h2 className="dashboard-title">⏰ Weekly Availability</h2>
        <p className="planner-subtitle">
          Set the hours you are available for teaching each day. The AI scheduler uses this to avoid scheduling outside your availability.
        </p>
      </div>

      <div className="planner-grid">
        {DAYS.map(day => (
          <div key={day} className={`planner-day-card ${schedule[day].enabled ? 'enabled' : ''}`}>
            <div className="planner-day-header">
              <label className="planner-toggle">
                <input
                  type="checkbox"
                  checked={schedule[day].enabled}
                  onChange={e => updateDay(day, 'enabled', e.target.checked)}
                />
                <span className="planner-day-label">{DAY_LABELS[day]}</span>
              </label>
            </div>
            {schedule[day].enabled && (
              <div className="planner-time-inputs">
                <div className="planner-time-group">
                  <label className="planner-time-label">From</label>
                  <input
                    type="time"
                    value={schedule[day].start}
                    onChange={e => updateDay(day, 'start', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="planner-time-group">
                  <label className="planner-time-label">To</label>
                  <input
                    type="time"
                    value={schedule[day].end}
                    onChange={e => updateDay(day, 'end', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="planner-actions">
        <button className="btn-submit" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Availability'}
        </button>
      </div>
    </div>
  );
}

export default function FacultyDashboard() {
  const [tab, setTab]             = useState('schedule');
  const [timetable, setTimetable] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [viewMode, setViewMode]   = useState('calendar');
  const [message, setMessage]     = useState(null);
  const printRef = useRef();

  const handlePrint = useReactToPrint({ contentRef: printRef });

  const toast = (msg, type) => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    Promise.all([
      getMyTimetable(),
      getMyAvailability(),
    ])
      .then(([timetableRes, availRes]) => {
        setTimetable(timetableRes.data);
        setAvailability(availRes.data);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const violations = useMemo(() => {
    if (!timetable.length || !availability.length) return [];
    const byDay = {};
    for (const a of availability) {
      byDay[a.day] = { start: a.start_time, end: a.end_time };
    }
    return timetable.filter(slot => {
      const avail = byDay[slot.day];
      if (!avail) return true;
      return slot.start_time < avail.start || slot.end_time > avail.end;
    });
  }, [timetable, availability]);

  if (loading) return <div className="loading" />;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="faculty-dashboard">
      {message && (
        <div className={`toast-message toast-${message.type}`}>
          {message.msg}
        </div>
      )}

      {violations.length > 0 && (
        <div className="violation-banner">
          <div className="violation-banner-header">
            <span className="violation-icon">🚫</span>
            <span className="violation-title">Availability Conflict Detected</span>
          </div>
          <p className="violation-text">
            The following scheduled classes are outside your current availability hours.
            This has been reported to the admin and is awaiting confirmation.
          </p>
          <ul className="violation-list">
            {violations.map((v, i) => (
              <li key={i}>
                <strong>{v.course_code}</strong> — {v.day} {v.start_time?.slice(0,5)}–{v.end_time?.slice(0,5)}
                <br />
                <span className="violation-hint">Update your availability or contact admin to resolve.</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="faculty-tabs">
        <button
          className={`faculty-tab ${tab === 'schedule' ? 'active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          📅 My Schedule
        </button>
        <button
          className={`faculty-tab ${tab === 'availability' ? 'active' : ''}`}
          onClick={() => setTab('availability')}
        >
          ⏰ My Availability
        </button>
      </div>

      {tab === 'schedule' && (
        <>
          <div ref={printRef}>
            <div className="dash-header">
              <h2 className="dashboard-title">🎓 My Teaching Schedule</h2>
              <div className="screen-only dash-header-right">
                <div className="view-toggle">
                  <button className={viewMode === 'calendar' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setViewMode('calendar')}>📅 Calendar</button>
                  <button className={viewMode === 'list' ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setViewMode('list')}>☰ List</button>
                </div>
                <div className="export-buttons">
                  <button className="btn-export" onClick={() => downloadIcs().catch(() => {})} title="Download .ics calendar file">📅 ICS</button>
                  <button className="btn-export" onClick={handlePrint} title="Print / Save as PDF">🖨️ PDF</button>
                </div>
              </div>
            </div>
            <ScheduleView timetable={timetable} viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </>
      )}

      {tab === 'availability' && (
        <AvailabilityPlanner toast={toast} />
      )}
    </div>
  );
}
