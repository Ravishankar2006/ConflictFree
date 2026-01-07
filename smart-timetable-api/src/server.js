import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';  // ← note: auth.js (not auth.routes.js)
import { testConnection } from './config/db.js';
import timetableRoutes from './routes/timetable.routes.js';
import process from 'process';

dotenv.config();

const app = express();

// Middleware (CRITICAL ORDER: before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use('/api/timetable', timetableRoutes);
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

// Auth routes (ONLY ONCE)
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
  try {
    await testConnection();
  } catch (err) {
    console.error('❌ DB test on startup failed:', err.message);
  }
});
