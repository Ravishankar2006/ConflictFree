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

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login    = (credentials) => api.post('/api/auth/login', credentials);
export const register = (userData)    => api.post('/api/auth/register', userData);
export const getUsers = (role)        => api.get('/api/users', { params: role ? { role } : {} });

// ─── Timetable ───────────────────────────────────────────────────────────────
export const getMyTimetable = ()           => api.get('/api/timetable/me');
export const getAllSlots     = (params)     => api.get('/api/timetable/slots', { params });
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
export const createUser = (data)  => api.post('/api/users', data);
export const deleteUser = (id)    => api.delete(`/api/users/${id}`);

// ─── Departments ────────────────────────────────────────────────────────────
export const getDepartments    = ()      => api.get('/api/departments');
export const createDepartment  = (data)  => api.post('/api/departments', data);
export const updateDepartment  = (id, d) => api.patch(`/api/departments/${id}`, d);
export const deleteDepartment  = (id)    => api.delete(`/api/departments/${id}`);

// ─── Classes (Sections/Cohorts) ────────────────────────────────────────────
export const getClasses     = (params) => api.get('/api/classes', { params });
export const createClass    = (data)   => api.post('/api/classes', data);
export const deleteClass    = (id)     => api.delete(`/api/classes/${id}`);

// ─── Semesters ─────────────────────────────────────────────────────────────
export const getSemesters    = ()      => api.get('/api/semesters');
export const createSemester  = (data)  => api.post('/api/semesters', data);
export const updateSemester  = (id, d) => api.patch(`/api/semesters/${id}`, d);
export const deleteSemester  = (id)    => api.delete(`/api/semesters/${id}`);

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalyticsOverview = () => api.get('/api/analytics/overview');
export const getFacultyWorkload   = () => api.get('/api/analytics/faculty-workload');
export const getRoomUtilization   = () => api.get('/api/analytics/room-utilization');
export const getDailyDistribution = () => api.get('/api/analytics/daily-distribution');
export const getTimeDistribution  = () => api.get('/api/analytics/time-distribution');

export default api;
