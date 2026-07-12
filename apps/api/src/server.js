import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import conflictRoutes from './routes/conflict.routes.js';
import courseFacultyRoutes from './routes/course-faculty.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import { testConnection } from './config/db.js';
import timetableRoutes from './routes/timetable.routes.js';
import process from 'process';

dotenv.config();

const app = express();

// CORS — allow only configured origin (defaults to all in dev if not set)
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));

// Body parsing (CRITICAL ORDER: before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/timetable/generate', schedulerRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/course-faculty', courseFacultyRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong from API' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    await testConnection();
    res.json({ message: 'DB connection OK' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'DB connection failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  try {
    await testConnection();
  } catch (err) {
    console.error('❌ DB test on startup failed:', err.message);
  }
});
