import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login    = (credentials) => api.post('/api/auth/login', credentials);
export const register = (userData)    => api.post('/api/auth/register', userData);
export const getUsers = (role)        => api.get('/api/auth/users', { params: role ? { role } : {} });

// ─── Timetable ───────────────────────────────────────────────────────────────
export const getMyTimetable = ()           => api.get('/api/timetable/me');
export const getAllSlots     = ()           => api.get('/api/timetable/slots');
export const createSlot     = (data)       => api.post('/api/timetable/slots', data);
export const updateSlot     = (id, data)   => api.patch(`/api/timetable/slots/${id}`, data);
export const deleteSlot     = (id)         => api.delete(`/api/timetable/slots/${id}`);
export const exportIcal     = ()           => api.get('/api/timetable/export/ical', { responseType: 'blob' });

export function downloadIcs() {
  return api.get('/api/timetable/export/ical', { responseType: 'blob' }).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  });
}

// ─── Conflicts ───────────────────────────────────────────────────────────────
export const getConflicts    = ()   => api.get('/api/conflicts');
export const resolveConflict = (id) => api.patch(`/api/conflicts/${id}/resolve`);

// ─── Courses ─────────────────────────────────────────────────────────────────
export const getCourses    = ()      => api.get('/api/courses');
export const createCourse  = (data)  => api.post('/api/courses', data);
export const deleteCourse  = (id)    => api.delete(`/api/courses/${id}`);

// ─── Enrollments ─────────────────────────────────────────────────────────────
export const getEnrollments    = ()      => api.get('/api/enrollments');
export const createEnrollment  = (data)  => api.post('/api/enrollments', data);
export const deleteEnrollment  = (id)    => api.delete(`/api/enrollments/${id}`);

// ─── Rooms ───────────────────────────────────────────────────────────────────
export const getRooms     = ()       => api.get('/api/rooms');
export const createRoom   = (data)   => api.post('/api/rooms', data);
export const deleteRoom   = (id)     => api.delete(`/api/rooms/${id}`);

// ─── Faculty Availability ────────────────────────────────────────────────────
export const getAvailability       = (fId)    => api.get(`/api/availability/${fId}`);
export const setAvailability       = (data)   => api.post('/api/availability', data);
export const deleteAvailability    = (id)     => api.delete(`/api/availability/${id}`);
export const getMyAvailability     = ()       => api.get('/api/availability/me');
export const updateMyAvailability  = (data)   => api.put('/api/availability/me', data);

// ─── AI Scheduler ────────────────────────────────────────────────────────────
export const generateTimetable  = (data)   => api.post('/api/timetable/generate', data);
export const applyTimetable     = (data)   => api.post('/api/timetable/generate/apply', data);

// ─── Course-Faculty Assignment ──────────────────────────────────────────────
export const getCourseFaculty    = (cid)   => api.get(`/api/course-faculty/${cid}`);
export const getAllAssignments   = ()      => api.get('/api/course-faculty');
export const assignFaculty       = (cid, fid) => api.post(`/api/course-faculty/${cid}`, { faculty_id: fid });
export const removeFaculty       = (cid, fid) => api.delete(`/api/course-faculty/${cid}/${fid}`);

// ─── Admin User Management ───────────────────────────────────────────────────
export const createUser = (data)  => api.post('/api/auth/users', data);
export const deleteUser = (id)    => api.delete(`/api/auth/users/${id}`);

export default api;
