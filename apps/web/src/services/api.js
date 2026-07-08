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

export default api;
