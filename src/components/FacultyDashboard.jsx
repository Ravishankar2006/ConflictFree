import { useState, useEffect } from 'react';
import { getMyTimetable } from '../services/api';
import '../styles/FacultyDashboard.css';

export default function FacultyDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await getMyTimetable();
      setTimetable(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load timetable');
      setLoading(false);
    }
  };

  const groupByDay = () => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const grouped = {};
    days.forEach(day => {
      grouped[day] = timetable.filter(slot => slot.day === day);
    });
    return grouped;
  };

  if (loading) {
    return <div className="loading">Loading your schedule...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const groupedTimetable = groupByDay();

  return (
    <div className="faculty-dashboard">
      <h2 className="dashboard-title">🎓 My Teaching Schedule</h2>

      {timetable.length === 0 ? (
        <div className="empty-state">
          No classes assigned yet. Please contact admin.
        </div>
      ) : (
        <div className="timetable-grid">
          {Object.entries(groupedTimetable).map(([day, slots]) => (
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
                        <div className="slot-time">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </div>
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
