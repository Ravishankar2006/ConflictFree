import { useState, useEffect, useCallback } from 'react';
import {
  getAllSlots, createSlot, updateSlot, deleteSlot,
  getConflicts, resolveConflict,
  getCourses, createCourse, deleteCourse,
  getEnrollments, createEnrollment, deleteEnrollment,
  getUsers,
} from '../services/api';
import TimetableCalendar from './TimetableCalendar';
import ToastContainer, { useToast } from './Toast';
import '../styles/AdminDashboard.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const EMPTY_SLOT = { course_id: '', room: '', faculty_id: '', day: 'MON', start_time: '', end_time: '' };

// ═══════════════════════════════════════════════
// Timetable Tab
// ═══════════════════════════════════════════════
function TimetableTab({ toast }) {
  const [slots, setSlots]           = useState([]);
  const [courses, setCourses]       = useState([]);
  const [faculty, setFaculty]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [formData, setFormData]     = useState(EMPTY_SLOT);
  const [editingId, setEditingId]   = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [viewMode, setViewMode]     = useState('calendar'); // 'calendar' | 'table'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, coursesRes, facultyRes] = await Promise.all([
        getAllSlots(),
        getCourses(),
        getUsers('faculty'),
      ]);
      setSlots(slotsRes.data);
      setCourses(coursesRes.data);
      setFaculty(facultyRes.data);
    } catch {
      toast('Failed to load timetable data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setFormData(EMPTY_SLOT); setEditingId(null); setShowForm(true); };
  const openEdit   = (slot) => {
    setFormData({
      course_id:  slot.course_id,
      room:       slot.room,
      faculty_id: slot.faculty_id,
      day:        slot.day,
      start_time: slot.start_time.slice(0, 5),
      end_time:   slot.end_time.slice(0, 5),
    });
    setEditingId(slot.id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(EMPTY_SLOT); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSlot(editingId, formData);
        toast('Slot updated successfully', 'success');
      } else {
        await createSlot(formData);
        toast('Slot created successfully', 'success');
      }
      closeForm();
      load();
    } catch (err) {
      if (err.response?.status === 409) {
        const cs = err.response.data.conflicts;
        toast(`Conflict: overlaps with ${cs.map(c => `${c.room} at ${c.time}`).join(', ')}`, 'warning');
      } else {
        toast(err.response?.data?.message || 'Failed to save slot', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await deleteSlot(id);
      toast('Slot deleted', 'success');
      load();
    } catch {
      toast('Failed to delete slot', 'error');
    }
  };

  if (loading) return <div className="loading" />;

  const stats = {
    total:   slots.length,
    courses: new Set(slots.map(s => s.course_id)).size,
    faculty: new Set(slots.map(s => s.faculty_id)).size,
    rooms:   new Set(slots.map(s => s.room)).size,
  };

  return (
    <div className="admin-tab">
      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Slots', value: stats.total,   color: 'blue'   },
          { label: 'Courses',     value: stats.courses, color: 'green'  },
          { label: 'Faculty',     value: stats.faculty, color: 'purple' },
          { label: 'Rooms',       value: stats.rooms,   color: 'orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="tab-controls">
        <div className="view-toggle">
          <button
            className={viewMode === 'calendar' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setViewMode('calendar')}
          >📅 Calendar</button>
          <button
            className={viewMode === 'table' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setViewMode('table')}
          >📋 Table</button>
        </div>
        <button className="btn-create" onClick={openCreate}>+ New Slot</button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-card-header">
            <h3>{editingId ? '✏️ Edit Slot' : '+ Create New Slot'}</h3>
            <button className="btn-icon-close" onClick={closeForm}>✕</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label className="form-label">Course</label>
              <select
                value={formData.course_id}
                onChange={e => setFormData({...formData, course_id: e.target.value})}
                className="form-input" required
              >
                <option value="">Select a course…</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Faculty</label>
              <select
                value={formData.faculty_id}
                onChange={e => setFormData({...formData, faculty_id: e.target.value})}
                className="form-input" required
              >
                <option value="">Select a faculty member…</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Room</label>
              <input
                type="text"
                value={formData.room}
                onChange={e => setFormData({...formData, room: e.target.value})}
                className="form-input" placeholder="e.g. Lab-101" required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Day</label>
              <select
                value={formData.day}
                onChange={e => setFormData({...formData, day: e.target.value})}
                className="form-input"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="time" value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
                className="form-input" required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time" value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
                className="form-input" required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? 'Save Changes' : 'Create Slot'}
              </button>
              <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* View */}
      {slots.length === 0 ? (
        <div className="empty-state">No timetable slots yet. Create one above.</div>
      ) : viewMode === 'calendar' ? (
        <TimetableCalendar slots={slots} />
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Course</th><th>Faculty</th>
                  <th>Day</th><th>Time</th><th>Room</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id}>
                    <td>{slot.id}</td>
                    <td>{slot.course_code} — {slot.course_name}</td>
                    <td>{slot.faculty_name}</td>
                    <td>{slot.day}</td>
                    <td>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</td>
                    <td>{slot.room}</td>
                    <td className="table-actions">
                      <button className="btn-edit-small" onClick={() => openEdit(slot)}>✏️</button>
                      <button className="btn-delete-small" onClick={() => handleDelete(slot.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Conflicts Tab
// ═══════════════════════════════════════════════
function ConflictsTab({ toast }) {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConflicts();
      setConflicts(res.data.conflicts || []);
    } catch {
      toast('Failed to load conflicts', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (slotId, label) => {
    if (!window.confirm(`Delete slot "${label}" to resolve this conflict?`)) return;
    try {
      await resolveConflict(slotId);
      toast('Conflict resolved — slot deleted', 'success');
      load();
    } catch {
      toast('Failed to resolve conflict', 'error');
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-tab">
      <div className="tab-header">
        <h2 className="tab-title">⚠️ Active Conflicts</h2>
        <button className="btn-ghost" onClick={load}>↻ Refresh</button>
      </div>

      {conflicts.length === 0 ? (
        <div className="empty-state conflict-clear">
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
          No conflicts detected! All timetable slots are clear.
        </div>
      ) : (
        <div className="conflict-list">
          {conflicts.map((c, i) => (
            <div key={i} className="conflict-card">
              <div className="conflict-meta">
                <span className={`conflict-type-badge ${c.conflictType === 'ROOM' ? 'type-room' : 'type-faculty'}`}>
                  {c.conflictType === 'ROOM' ? '🏫 Room' : '👤 Faculty'} Conflict
                </span>
                <span className="conflict-day">{c.day}</span>
              </div>
              <div className="conflict-slots">
                <div className="conflict-slot-a">
                  <strong>{c.courseA}</strong>
                  <span>{c.timeA} · {c.conflictType === 'ROOM' ? c.room : c.facultyName}</span>
                </div>
                <div className="conflict-vs">↔</div>
                <div className="conflict-slot-b">
                  <strong>{c.courseB}</strong>
                  <span>{c.timeB} · {c.conflictType === 'ROOM' ? c.room : c.facultyName}</span>
                </div>
              </div>
              <div className="conflict-actions">
                <button
                  className="btn-resolve"
                  onClick={() => handleResolve(c.slotAId, c.courseA)}
                >
                  Remove Slot A ({c.courseA.split('—')[0].trim()})
                </button>
                <button
                  className="btn-resolve btn-resolve-b"
                  onClick={() => handleResolve(c.slotBId, c.courseB)}
                >
                  Remove Slot B ({c.courseB.split('—')[0].trim()})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Courses Tab
// ═══════════════════════════════════════════════
function CoursesTab({ toast }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ name: '', code: '' });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourses();
      setCourses(res.data);
    } catch {
      toast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCourse(form);
      toast('Course created', 'success');
      setForm({ name: '', code: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create course', 'error');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete course ${code}? This will affect existing slots!`)) return;
    try {
      await deleteCourse(id);
      toast(`Course ${code} deleted`, 'success');
      load();
    } catch {
      toast('Failed to delete course', 'error');
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-tab">
      <div className="tab-controls">
        <h2 className="tab-title">📚 Courses ({courses.length})</h2>
        <button className="btn-create" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ New Course'}
        </button>
      </div>

      {showForm && (
        <div className="form-card form-card-compact">
          <form onSubmit={handleCreate} className="form-inline">
            <input
              type="text" placeholder="Course Code (e.g. CS101)" value={form.code}
              onChange={e => setForm({...form, code: e.target.value})}
              className="form-input" required
            />
            <input
              type="text" placeholder="Course Name" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="form-input" required style={{ flex: 2 }}
            />
            <button type="submit" className="btn-submit">Add</button>
          </form>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="empty-state">No courses yet. Add one above.</div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Code</th><th>Name</th><th>Action</th></tr></thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><span className="course-code-badge">{c.code}</span></td>
                    <td>{c.name}</td>
                    <td>
                      <button className="btn-delete-small" onClick={() => handleDelete(c.id, c.code)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Enrollments Tab
// ═══════════════════════════════════════════════
function EnrollmentsTab({ toast }) {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ student_id: '', course_id: '' });
  const [showForm, setShowForm]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes, cRes] = await Promise.all([
        getEnrollments(), getUsers('student'), getCourses()
      ]);
      setEnrollments(eRes.data);
      setStudents(sRes.data);
      setCourses(cRes.data);
    } catch {
      toast('Failed to load enrollments', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEnrollment(form);
      toast('Student enrolled successfully', 'success');
      setForm({ student_id: '', course_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to enroll student', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this enrollment?')) return;
    try {
      await deleteEnrollment(id);
      toast('Enrollment removed', 'success');
      load();
    } catch {
      toast('Failed to remove enrollment', 'error');
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-tab">
      <div className="tab-controls">
        <h2 className="tab-title">👥 Enrollments ({enrollments.length})</h2>
        <button className="btn-create" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Enroll Student'}
        </button>
      </div>

      {showForm && (
        <div className="form-card form-card-compact">
          <form onSubmit={handleCreate} className="form-inline">
            <select
              value={form.student_id}
              onChange={e => setForm({...form, student_id: e.target.value})}
              className="form-input" required
            >
              <option value="">Select student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
            <select
              value={form.course_id}
              onChange={e => setForm({...form, course_id: e.target.value})}
              className="form-input" required
            >
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
            <button type="submit" className="btn-submit">Enroll</button>
          </form>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="empty-state">No enrollments yet. Enroll a student above.</div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Student</th><th>Email</th><th>Course</th><th>Action</th></tr>
              </thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.id}>
                    <td>{e.student_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.student_email}</td>
                    <td><span className="course-code-badge">{e.course_code}</span> {e.course_name}</td>
                    <td>
                      <button className="btn-delete-small" onClick={() => handleDelete(e.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Admin Dashboard Root
// ═══════════════════════════════════════════════
export default function AdminDashboard({ activeTab = 'timetable', onTabChange }) {
  const { toasts, addToast, dismiss } = useToast();

  const renderTab = () => {
    switch (activeTab) {
      case 'conflicts':   return <ConflictsTab   toast={addToast} />;
      case 'courses':     return <CoursesTab      toast={addToast} />;
      case 'enrollments': return <EnrollmentsTab  toast={addToast} />;
      default:            return <TimetableTab    toast={addToast} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-inner">
        <div className="admin-page-header">
          <h1 className="admin-page-title">
            {activeTab === 'timetable'   && '📅 Timetable Management'}
            {activeTab === 'conflicts'   && '⚠️ Conflict Resolution'}
            {activeTab === 'courses'     && '📚 Course Management'}
            {activeTab === 'enrollments' && '👥 Enrollment Management'}
          </h1>
        </div>
        {renderTab()}
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
