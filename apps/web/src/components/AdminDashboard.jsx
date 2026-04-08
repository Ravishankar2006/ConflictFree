import { useState, useEffect } from 'react';
import { getAllSlots, createSlot, deleteSlot } from '../services/api';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    room: '',
    faculty_id: '',
    day: 'MON',
    start_time: '',
    end_time: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAllSlots();
  }, []);

  const fetchAllSlots = async () => {
    try {
      const response = await getAllSlots();
      setTimetable(response.data);
      setLoading(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load timetable' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await createSlot(formData);
      
      if (response.status === 201) {
        setMessage({ type: 'success', text: '✅ Slot created successfully!' });
        fetchAllSlots();
        setShowCreateForm(false);
        setFormData({
          course_id: '',
          room: '',
          faculty_id: '',
          day: 'MON',
          start_time: '',
          end_time: ''
        });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const conflicts = err.response.data.conflicts;
        setMessage({ 
          type: 'warning', 
          text: `⚠️ Conflict detected! Overlaps with: ${conflicts.map(c => `${c.room} at ${c.time}`).join(', ')}` 
        });
      } else {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create slot' });
      }
    }
  };

  const handleDelete = async (slotId) => {
    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      await deleteSlot(slotId);
      setMessage({ type: 'success', text: '✅ Slot deleted successfully!' });
      fetchAllSlots();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete slot' });
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

  const getStats = () => {
    return {
      totalSlots: timetable.length,
      rooms: new Set(timetable.map(s => s.room)).size,
      faculty: new Set(timetable.map(s => s.faculty_id)).size,
      courses: new Set(timetable.map(s => s.course_id)).size
    };
  };

  if (loading) {
    return <div className="loading">Loading all timetable data...</div>;
  }

  const groupedTimetable = groupByDay();
  const stats = getStats();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">👑 Admin Dashboard</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={showCreateForm ? 'btn-create btn-cancel' : 'btn-create'}
        >
          {showCreateForm ? '✕ Cancel' : '+ Create New Slot'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <div className="create-form-container">
          <h3 className="form-title">Create New Timetable Slot</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label className="form-label">Course ID</label>
              <input
                type="number"
                value={formData.course_id}
                onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                className="form-input"
                placeholder="Enter course ID"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Faculty ID</label>
              <input
                type="number"
                value={formData.faculty_id}
                onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
                className="form-input"
                placeholder="Enter faculty user ID"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                className="form-input"
                placeholder="e.g., Lab-101"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Day</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({...formData, day: e.target.value})}
                className="form-input"
              >
                <option value="MON">Monday</option>
                <option value="TUE">Tuesday</option>
                <option value="WED">Wednesday</option>
                <option value="THU">Thursday</option>
                <option value="FRI">Friday</option>
                <option value="SAT">Saturday</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">
                Create Slot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-value">{stats.totalSlots}</div>
          <div className="stat-label">Total Slots</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats.courses}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{stats.faculty}</div>
          <div className="stat-label">Faculty</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats.rooms}</div>
          <div className="stat-label">Rooms</div>
        </div>
      </div>

      {/* Timetable Grid */}
      {timetable.length === 0 ? (
        <div className="empty-state">
          No timetable slots created yet.
        </div>
      ) : (
        <>
          <div className="timetable-grid">
            {Object.entries(groupedTimetable).map(([day, slots]) => (
              <div key={day} className="day-card">
                <h3 className="day-header admin">{day}</h3>
                {slots.length === 0 ? (
                  <p className="no-classes">No classes</p>
                ) : (
                  <div className="slot-list">
                    {slots.map(slot => (
                      <div key={slot.id} className="slot-item admin">
                        <div className="slot-course-code">{slot.course_code}</div>
                        <div className="slot-course-name">{slot.course_name}</div>
                        <div className="slot-details">
                          <div className="slot-time">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                          <div className="slot-room">{slot.room}</div>
                          <div className="slot-faculty-name">{slot.faculty_name}</div>
                        </div>
                        <button 
                          onClick={() => handleDelete(slot.id)}
                          className="btn-delete-slot"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* All Slots Table */}
          <div className="table-container">
            <h3 className="table-header">📋 All Slots (Table View)</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course</th>
                    <th>Faculty</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map(slot => (
                    <tr key={slot.id}>
                      <td>{slot.id}</td>
                      <td>{slot.course_code} - {slot.course_name}</td>
                      <td>{slot.faculty_name}</td>
                      <td>{slot.day}</td>
                      <td>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </td>
                      <td>{slot.room}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(slot.id)}
                          className="btn-delete-small"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
