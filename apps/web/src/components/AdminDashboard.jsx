import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  getAllSlots, createSlot, updateSlot, deleteSlot,
  getConflicts, resolveConflict,
  getCourses, createCourse, deleteCourse,
  getEnrollments, createEnrollment, deleteEnrollment,
  getUsers, getRooms, createRoom, deleteRoom,
  generateTimetable, applyTimetable,
  getCourseFaculty, getAllAssignments, assignFaculty, removeFaculty,
  createUser, deleteUser, downloadIcs,
} from '../services/api';
import TimetableCalendar from './TimetableCalendar';
import ConfirmModal from './ConfirmModal';
import ToastContainer, { useToast } from './Toast';
import AnalyticsTab from './AnalyticsTab';
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
  const [rooms, setRooms]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [formData, setFormData]     = useState(EMPTY_SLOT);
  const [editingId, setEditingId]   = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [viewMode, setViewMode]     = useState('calendar'); // 'calendar' | 'table'
  const [confirm, setConfirm]       = useState({ open: false, id: null });
  const printRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, coursesRes, facultyRes, roomsRes] = await Promise.all([
        getAllSlots(),
        getCourses(),
        getUsers('faculty'),
        getRooms(),
      ]);
      setSlots(slotsRes.data);
      setCourses(coursesRes.data);
      setFaculty(facultyRes.data);
      setRooms(roomsRes.data);
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

  const handleDelete = (id) => {
    setConfirm({ open: true, id });
  };

  const executeDelete = async () => {
    try {
      await deleteSlot(confirm.id);
      toast('Slot deleted', 'success');
      load();
    } catch {
      toast('Failed to delete slot', 'error');
    } finally {
      setConfirm({ open: false, id: null });
    }
  };

  if (loading) return <div className="loading" />;

  const stats = {
    total:   slots.length,
    courses: new Set(slots.map(s => s.course_id)).size,
    faculty: new Set(slots.map(s => s.faculty_id)).size,
    rooms:   new Set(slots.map(s => s.room)).size,
  };

  const handleSlotMove = async (slotId, data) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    try {
      await updateSlot(slotId, {
        course_id: slot.course_id,
        room: slot.room,
        faculty_id: slot.faculty_id,
        day: data.day,
        start_time: data.start_time,
        end_time: data.end_time,
      });
      toast('Slot rescheduled successfully', 'success');
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reschedule slot';
      toast(msg, 'error');
      if (err.response?.data?.conflicts?.length) {
        toast(`${err.response.data.conflicts.length} conflict(s) detected`, 'error');
      }
    }
  };

  return (
    <div className="admin-tab">
      {/* Controls (screen only) */}
      <div className="screen-only tab-controls">
        <div className="tab-controls-left">
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
          <div className="export-buttons">
            <button className="btn-export" onClick={() => downloadIcs().catch(() => {})} title="Download .ics calendar file">📅 ICS</button>
            <button className="btn-export" onClick={handlePrint} title="Print / Save as PDF">🖨️ PDF</button>
          </div>
        </div>
        <button className="btn-create" onClick={openCreate}>+ New Slot</button>
      </div>

      {/* Create/Edit Form (screen only) */}
      {showForm && (
        <div className="screen-only form-card">
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
              <select
                value={formData.room}
                onChange={e => setFormData({...formData, room: e.target.value})}
                className="form-input" required
              >
                <option value="">Select a room…</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.name}>{r.name} (capacity: {r.capacity})</option>
                ))}
              </select>
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

      {/* Print area: stats + timetable (full content for PDF) */}
      <div ref={printRef}>
        <h2 className="print-only dashboard-title">📅 Timetable</h2>
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
        {slots.length === 0 ? (
          <div className="empty-state">No timetable slots yet.</div>
        ) : (
          viewMode === 'calendar' ? (
            <TimetableCalendar slots={slots} onSlotMove={handleSlotMove} />
          ) : (
            <div className="table-container">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Course</th><th>Faculty</th>
                      <th>Day</th><th>Time</th><th>Room</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>

      <ConfirmModal
        open={confirm.open}
        title="Delete Slot"
        message="Are you sure you want to delete this timetable slot? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Conflicts Tab
// ═══════════════════════════════════════════════
function ConflictsTab({ toast }) {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState({ open: false, slotId: null, label: '' });

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
    setConfirm({ open: true, slotId, label });
  };

  const confirmResolve = async () => {
    try {
      await resolveConflict(confirm.slotId);
      toast('Conflict resolved — slot deleted', 'success');
      setConfirm({ open: false, slotId: null, label: '' });
      load();
    } catch {
      toast('Failed to resolve conflict', 'error');
      setConfirm({ open: false, slotId: null, label: '' });
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
                <span className={`conflict-type-badge ${
                  c.conflictType === 'ROOM' ? 'type-room' : 
                  c.conflictType === 'FACULTY' ? 'type-faculty' : 'type-availability'
                }`}>
                  {c.conflictType === 'ROOM' && '🏫 Room Conflict'}
                  {c.conflictType === 'FACULTY' && '👤 Faculty Conflict'}
                  {c.conflictType === 'AVAILABILITY' && '⏰ Availability Conflict'}
                </span>
                <span className="conflict-day">{c.day}</span>
              </div>
              <div className="conflict-slots">
                <div className="conflict-slot-a">
                  <strong>{c.courseA}</strong>
                  <span>{c.timeA} · {c.facultyName} ({c.room})</span>
                </div>
                {c.conflictType !== 'AVAILABILITY' ? (
                  <>
                    <div className="conflict-vs">↔</div>
                    <div className="conflict-slot-b">
                      <strong>{c.courseB}</strong>
                      <span>{c.timeB} · {c.conflictType === 'ROOM' ? c.room : c.facultyName}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="conflict-vs">🚫</div>
                    <div className="conflict-slot-b">
                      <strong>Unavailable Time</strong>
                      <span style={{ color: 'var(--accent-red)' }}>{c.timeB}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="conflict-actions">
                <button
                  className="btn-resolve"
                  onClick={() => handleResolve(c.slotAId, c.courseA)}
                >
                  Remove Slot ({c.courseA.split('—')[0].trim()})
                </button>
                {c.conflictType !== 'AVAILABILITY' && (
                  <button
                    className="btn-resolve btn-resolve-b"
                    onClick={() => handleResolve(c.slotBId, c.courseB)}
                  >
                    Remove Slot B ({c.courseB.split('—')[0].trim()})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title="Remove Slot"
        message={`Delete slot "${confirm.label}" to resolve this conflict? This action cannot be undone.`}
        confirmLabel="Delete Slot"
        cancelLabel="Cancel"
        onConfirm={confirmResolve}
        onCancel={() => setConfirm({ open: false, slotId: null, label: '' })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Courses Tab
// ═══════════════════════════════════════════════
function CoursesTab({ toast }) {
  const [courses, setCourses]       = useState([]);
  const [faculty, setFaculty]       = useState([]);
  const [assignments, setAssignments] = useState({}); // courseId -> [faculty]
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ name: '', code: '' });
  const [showForm, setShowForm]     = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [assignFacultyId, setAssignFacultyId] = useState('');
  const [confirm, setConfirm]         = useState({ open: false, type: '', data: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, facultyRes, assignRes] = await Promise.all([
        getCourses(),
        getUsers('faculty'),
        getAllAssignments(),
      ]);
      setCourses(coursesRes.data);
      setFaculty(facultyRes.data);

      const map = {};
      for (const a of assignRes.data) {
        if (!map[a.course_id]) map[a.course_id] = [];
        map[a.course_id].push({ id: a.faculty_id, name: a.faculty_name });
      }
      setAssignments(map);
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

  const handleDelete = (id, code) => {
    setConfirm({ open: true, type: 'deleteCourse', data: { id, code } });
  };

  const handleAssign = async (courseId) => {
    if (!assignFacultyId) return;
    try {
      await assignFaculty(courseId, parseInt(assignFacultyId));
      toast('Faculty assigned', 'success');
      setAssignFacultyId('');
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to assign faculty', 'error');
    }
  };

  const handleRemoveFaculty = (courseId, facultyId, name) => {
    setConfirm({ open: true, type: 'removeFaculty', data: { courseId, facultyId, name } });
  };

  const executeConfirm = async () => {
    const { type, data } = confirm;
    try {
      if (type === 'deleteCourse') {
        await deleteCourse(data.id);
        toast(`Course ${data.code} deleted`, 'success');
      } else if (type === 'removeFaculty') {
        await removeFaculty(data.courseId, data.facultyId);
        toast('Faculty removed', 'success');
      }
      load();
    } catch {
      toast('Failed to complete action', 'error');
    } finally {
      setConfirm({ open: false, type: '', data: null });
    }
  };

  if (loading) return <div className="loading" />;

  const unassignedFaculty = (courseId) =>
    faculty.filter(f => !(assignments[courseId] || []).some(a => a.id === f.id));

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
              <thead>
                <tr>
                  <th>Code</th><th>Name</th><th>Assigned Faculty</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td><span className="course-code-badge">{c.code}</span></td>
                    <td>{c.name}</td>
                    <td>
                      {(assignments[c.id] || []).map(f => (
                        <span key={f.id} className="faculty-chip">
                          {f.name}
                          <button className="chip-remove" onClick={() => handleRemoveFaculty(c.id, f.id, f.name)}>✕</button>
                        </span>
                      ))}
                      {(assignments[c.id] || []).length === 0 && <span className="text-muted">No faculty assigned</span>}
                    </td>
                    <td className="table-actions">
                      <button className="btn-edit-small" onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}>
                        👨‍🏫
                      </button>
                      <button className="btn-delete-small" onClick={() => handleDelete(c.id, c.code)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expandedCourse && (
              <div className="assign-panel">
                <div className="assign-panel-inner">
                  <strong className="assign-panel-title">Assign Faculty</strong>
                  <div className="assign-form">
                    <select
                      value={assignFacultyId}
                      onChange={e => setAssignFacultyId(e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select faculty…</option>
                      {unassignedFaculty(expandedCourse).map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                      ))}
                    </select>
                    <button className="btn-submit" onClick={() => handleAssign(expandedCourse)} disabled={!assignFacultyId}>
                      Assign
                    </button>
                    <button className="btn-ghost" onClick={() => { setExpandedCourse(null); setAssignFacultyId(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title={confirm.type === 'deleteCourse' ? 'Delete Course' : 'Remove Faculty'}
        message={
          confirm.type === 'deleteCourse'
            ? `Delete course ${confirm.data?.code}? This will affect existing slots!`
            : `Remove ${confirm.data?.name} from this course?`
        }
        confirmLabel={confirm.type === 'deleteCourse' ? 'Delete' : 'Remove'}
        cancelLabel="Cancel"
        onConfirm={executeConfirm}
        onCancel={() => setConfirm({ open: false, type: '', data: null })}
      />
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
  const [confirm, setConfirm]         = useState({ open: false, id: null });

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

  const handleDelete = (id) => {
    setConfirm({ open: true, id });
  };

  const executeDelete = async () => {
    try {
      await deleteEnrollment(confirm.id);
      toast('Enrollment removed', 'success');
      load();
    } catch {
      toast('Failed to remove enrollment', 'error');
    } finally {
      setConfirm({ open: false, id: null });
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

      <ConfirmModal
        open={confirm.open}
        title="Remove Enrollment"
        message="Are you sure you want to remove this student enrollment? This will remove them from the course."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Rooms Tab
// ═══════════════════════════════════════════════
function RoomsTab({ toast }) {
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ name: '', capacity: 30 });
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm]   = useState({ open: false, id: null, name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch {
      toast('Failed to load rooms', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createRoom(form);
      toast('Room created', 'success');
      setForm({ name: '', capacity: 30 });
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create room', 'error');
    }
  };

  const handleDelete = (id, name) => {
    setConfirm({ open: true, id, name });
  };

  const executeDelete = async () => {
    try {
      await deleteRoom(confirm.id);
      toast(`Room ${confirm.name} deleted`, 'success');
      load();
    } catch {
      toast('Failed to delete room', 'error');
    } finally {
      setConfirm({ open: false, id: null, name: '' });
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-tab">
      <div className="tab-controls">
        <h2 className="tab-title">🏛️ Rooms ({rooms.length})</h2>
        <button className="btn-create" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ New Room'}
        </button>
      </div>

      {showForm && (
        <div className="form-card form-card-compact">
          <form onSubmit={handleCreate} className="form-inline">
            <input
              type="text" placeholder="Room name (e.g. Hall-A)" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="form-input" required
            />
            <input
              type="number" placeholder="Capacity" value={form.capacity} min={1}
              onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 30})}
              className="form-input" required style={{ maxWidth: 120 }}
            />
            <button type="submit" className="btn-submit">Add</button>
          </form>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty-state">No rooms yet. Add one above.</div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Capacity</th><th>Action</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <button className="btn-delete-small" onClick={() => handleDelete(r.id, r.name)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title="Delete Room"
        message={`Are you sure you want to delete room "${confirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '' })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// Users Tab
// ═══════════════════════════════════════════════
function UsersTab({ toast }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'student' });
  const [showForm, setShowForm]   = useState(false);
  const [confirm, setConfirm]   = useState({ open: false, id: null, name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(roleFilter === 'all' ? undefined : roleFilter);
      setUsers(res.data);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast('User created', 'success');
      setForm({ name: '', email: '', password: '', role: 'student' });
      setShowForm(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  const handleDelete = (id, name) => {
    setConfirm({ open: true, id, name });
  };

  const executeDelete = async () => {
    try {
      await deleteUser(confirm.id);
      toast(`User ${confirm.name} deleted`, 'success');
      load();
    } catch {
      toast('Failed to delete user', 'error');
    } finally {
      setConfirm({ open: false, id: null, name: '' });
    }
  };

  if (loading) return <div className="loading" />;

  return (
    <div className="admin-tab">
      <div className="tab-controls">
        <h2 className="tab-title">👤 User Management ({users.length})</h2>
        <div className="tab-controls-right">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="form-input filter-select"
          >
            <option value="all">All Roles</option>
            <option value="faculty">Faculty</option>
            <option value="student">Students</option>
          </select>
          <button className="btn-create" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New User'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-card form-card-compact">
          <form onSubmit={handleCreate} className="form-inline">
            <input
              type="text" placeholder="Full Name" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              className="form-input" required
            />
            <input
              type="email" placeholder="Email" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="form-input" required
            />
            <input
              type="password" placeholder="Password" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="form-input" required minLength={8}
            />
            <select
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="form-input"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
            <button type="submit" className="btn-submit">Create</button>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>
                      <button className="btn-delete-small" onClick={() => handleDelete(u.id, u.name)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirm.open}
        title="Delete User"
        message={`Are you sure you want to delete user "${confirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={executeDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '' })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// AI Scheduler Tab
// ═══════════════════════════════════════════════
const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };

function SchedulerTab({ toast }) {
  const [step, setStep]             = useState('idle'); // idle | generating | preview | applying | done
  const [generated, setGenerated]   = useState(null);
  const [config, setConfig]         = useState({
    startTime: '08:00',
    endTime: '17:00',
    slotDuration: 90,
    slotsPerCourse: 1,
    excludedDays: [],
    clearExisting: true,
  });

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  const toggleExcludedDay = (day) => {
    setConfig(prev => ({
      ...prev,
      excludedDays: prev.excludedDays.includes(day)
        ? prev.excludedDays.filter(d => d !== day)
        : [...prev.excludedDays, day]
    }));
  };

  const handleGenerate = async () => {
    setStep('generating');
    try {
      const res = await generateTimetable({
        startTime: config.startTime,
        endTime: config.endTime,
        slotDuration: config.slotDuration,
        slotsPerCourse: config.slotsPerCourse,
        excludedDays: config.excludedDays,
      });
      setGenerated(res.data);
      setStep('preview');
      const placed = res.data.stats?.placed ?? res.data.slots?.length ?? 0;
      const total = res.data.stats?.total_courses ?? 0;
      toast(`Generated ${placed}/${total} slots`, placed === total ? 'success' : 'warning');
    } catch (err) {
      toast(err.response?.data?.message || 'Generation failed', 'error');
      setStep('idle');
    }
  };

  const handleApply = async () => {
    if (!generated?.slots?.length) return;
    setStep('applying');
    try {
      const res = await applyTimetable({
        slots: generated.slots,
        clearExisting: config.clearExisting,
      });
      toast(res.data.message || 'Timetable applied', 'success');
      setStep('done');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to apply', 'error');
      setStep('preview');
    }
  };

  const handleRegenerate = () => {
    setGenerated(null);
    handleGenerate();
  };

  const reset = () => {
    setGenerated(null);
    setStep('idle');
  };

  return (
    <div className="admin-tab scheduler-tab">
      {/* Idle state */}
      {step === 'idle' && (
        <div className="scheduler-idle">
          <div className="scheduler-hero">
            <div className="scheduler-hero-icon">🤖</div>
            <h2 className="scheduler-hero-title">AI Timetable Generator</h2>
            <p className="scheduler-hero-desc">
              Automatically generate a conflict-free timetable based on your courses,
              faculty availability, room capacity, and student enrollments.
            </p>
          </div>

          <div className="scheduler-config-card">
            <h3 className="scheduler-config-title">⚙️ Generation Parameters</h3>

            <div className="scheduler-param-row">
              <div className="scheduler-param-group">
                <label className="scheduler-param-label">Day Start</label>
                <input
                  type="time" value={config.startTime}
                  onChange={e => updateConfig('startTime', e.target.value)}
                  className="form-input scheduler-param-input"
                />
              </div>
              <div className="scheduler-param-group">
                <label className="scheduler-param-label">Day End</label>
                <input
                  type="time" value={config.endTime}
                  onChange={e => updateConfig('endTime', e.target.value)}
                  className="form-input scheduler-param-input"
                />
              </div>
              <div className="scheduler-param-group">
                <label className="scheduler-param-label">Slot Duration</label>
                <select
                  value={config.slotDuration}
                  onChange={e => updateConfig('slotDuration', parseInt(e.target.value))}
                  className="form-input scheduler-param-input"
                >
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>120 min</option>
                </select>
              </div>
              <div className="scheduler-param-group">
                <label className="scheduler-param-label">Slots / Course</label>
                <input
                  type="number" min={1} max={10}
                  value={config.slotsPerCourse}
                  onChange={e => updateConfig('slotsPerCourse', parseInt(e.target.value) || 1)}
                  className="form-input scheduler-param-input"
                />
              </div>
            </div>

            <div className="scheduler-param-section">
              <label className="scheduler-param-label">Excluded Days</label>
              <div className="scheduler-day-toggles">
                {ALL_DAYS.map(day => (
                  <button
                    key={day}
                    className={`scheduler-day-btn ${config.excludedDays.includes(day) ? 'excluded' : ''}`}
                    onClick={() => toggleExcludedDay(day)}
                    title={config.excludedDays.includes(day) ? `Include ${DAY_LABELS[day]}` : `Exclude ${DAY_LABELS[day]}`}
                  >
                    {day.slice(0, 3)}
                    {config.excludedDays.includes(day) && <span className="scheduler-day-x">✕</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="scheduler-param-divider" />

            <label className="scheduler-checkbox">
              <input
                type="checkbox"
                checked={config.clearExisting}
                onChange={e => updateConfig('clearExisting', e.target.checked)}
              />
              <span>Clear existing slots before applying</span>
            </label>
          </div>

          <button className="btn-generate" onClick={handleGenerate}>
            🚀 Generate Timetable
          </button>
        </div>
      )}

      {/* Generating state */}
      {step === 'generating' && (
        <div className="scheduler-generating">
          <div className="scheduler-spinner" />
          <p className="scheduler-status">🤖 AI is solving the timetable...</p>
          <p className="scheduler-status-sub">Finding optimal slot assignments</p>
        </div>
      )}

      {/* Preview state */}
      {step === 'preview' && generated && (
        <div className="scheduler-preview">
          <div className="scheduler-preview-header">
            <div className="scheduler-preview-stats">
              <div className="stat-card green">
                <div className="stat-value">{generated.stats?.placed ?? generated.slots?.length ?? 0}</div>
                <div className="stat-label">Slots Generated</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-value">{generated.stats?.total_courses ?? 0}</div>
                <div className="stat-label">Total Courses</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-value">{generated.stats?.attempts ?? 0}</div>
                <div className="stat-label">Solver Attempts</div>
              </div>
              {generated.unassigned?.length > 0 && (
                <div className="stat-card" style={{ '--stat-color': '#fb7185' }}>
                  <div className="stat-value">{generated.unassigned.length}</div>
                  <div className="stat-label">Unassigned</div>
                </div>
              )}
            </div>
            <div className="scheduler-preview-actions">
              <button className="btn-ghost" onClick={handleRegenerate}>🔀 Regenerate</button>
              <button
                className="btn-apply"
                onClick={handleApply}
                disabled={!generated.slots?.length}
              >
                💾 Apply to Database
              </button>
            </div>
          </div>

          {generated.slots?.length > 0 && (
            <div className="scheduler-calendar-wrapper">
              <div className="scheduler-draft-badge">DRAFT — Review before applying</div>
              <TimetableCalendar slots={generated.slots} />
            </div>
          )}

          {generated.unassigned?.length > 0 && (
            <div className="scheduler-unassigned">
              <h3>⚠️ Could not schedule ({generated.unassigned.length})</h3>
              <ul>
                {generated.unassigned.map((u, i) => (
                  <li key={i}>
                    <strong>{u.course_code}</strong> — {u.course_name}
                    <span className="scheduler-reason">{u.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {step === 'done' && (
        <div className="scheduler-done">
          <div className="scheduler-done-icon">✅</div>
          <h2>Timetable Applied Successfully!</h2>
          <p>{generated?.stats?.placed ?? generated?.slots?.length ?? 0} slots saved to database.</p>
          <div className="scheduler-done-actions">
            <button className="btn-ghost" onClick={reset}>Generate Another</button>
            <button className="btn-ghost" onClick={() => window.location.reload()}>
              View in Timetable Tab
            </button>
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
      case 'analytics':   return <AnalyticsTab     toast={addToast} />;
      case 'conflicts':   return <ConflictsTab    toast={addToast} />;
      case 'courses':     return <CoursesTab       toast={addToast} />;
      case 'enrollments': return <EnrollmentsTab   toast={addToast} />;
      case 'rooms':       return <RoomsTab         toast={addToast} />;
      case 'users':       return <UsersTab         toast={addToast} />;
      case 'scheduler':   return <SchedulerTab     toast={addToast} />;
      default:            return <TimetableTab     toast={addToast} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-inner">
        <div className="admin-page-header">
          <h1 className="admin-page-title">
            {activeTab === 'timetable'   && '📅 Timetable Management'}
            {activeTab === 'scheduler'   && '🤖 AI Timetable Generator'}
            {activeTab === 'conflicts'   && '⚠️ Conflict Resolution'}
            {activeTab === 'courses'     && '📚 Course Management'}
            {activeTab === 'rooms'       && '🏛️ Room Management'}
            {activeTab === 'users'       && '👤 User Management'}
            {activeTab === 'enrollments' && '👥 Enrollment Management'}
            {activeTab === 'analytics'   && '📊 Timetable Analytics'}
          </h1>
        </div>
        {renderTab()}
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
