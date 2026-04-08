import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Timetable APIs
export const getMyTimetable = () => api.get('/timetable/me');
export const getAllSlots = () => api.get('/timetable/slots');
export const createSlot = (slotData) => api.post('/timetable/slots', slotData);
export const deleteSlot = (slotId) => api.delete(`/timetable/slots/${slotId}`);

export default api;
