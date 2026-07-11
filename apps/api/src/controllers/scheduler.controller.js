import pool from '../config/db.js';
import { generateTimetable } from '../services/scheduler.service.js';
import { detectConflicts, detectStudentConflicts } from '../utils/conflict-detector.js';

export async function generate(req, res) {
  try {
    const [courses] = await pool.query('SELECT id, name, code FROM courses');
    const [faculty] = await pool.query("SELECT id, name, email FROM users WHERE role = 'faculty'");
    const [rooms] = await pool.query('SELECT id, name, capacity FROM rooms');
    const [enrollments] = await pool.query('SELECT student_id, course_id FROM enrollments');
    const [availability] = await pool.query('SELECT * FROM faculty_availability');

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms defined. Add rooms before generating.' });
    }

    if (courses.length === 0) {
      return res.status(400).json({ message: 'No courses defined. Add courses before generating.' });
    }

    const result = generateTimetable({
      courses,
      faculty,
      rooms,
      enrollments,
      availability,
      params: req.body
    });

    res.json(result);
  } catch (error) {
    console.error('Error in generate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function apply(req, res) {
  try {
    const { slots, clearExisting } = req.body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: 'No slots provided' });
    }

    if (clearExisting) {
      await pool.query('DELETE FROM timetable_slots');
    }

    const errors = [];
    const inserted = [];

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];

      if (!s.course_id || !s.faculty_id || !s.room || !s.day || !s.start_time || !s.end_time) {
        errors.push({ index: i, message: 'Missing required fields', slot: s });
        continue;
      }

      if (s.start_time >= s.end_time) {
        errors.push({ index: i, message: 'end_time must be after start_time', slot: s });
        continue;
      }

      const roomConflicts = await detectConflicts(pool, {
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        faculty_id: s.faculty_id
      });

      if (roomConflicts.length > 0) {
        errors.push({
          index: i,
          message: `Conflicts with slot #${roomConflicts[0].id}`,
          slot: s
        });
        continue;
      }

      const studentConflicts = await detectStudentConflicts(pool, {
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        course_id: s.course_id
      });

      if (studentConflicts.length > 0) {
        errors.push({
          index: i,
          message: `Student conflict with ${studentConflicts[0].course_code}`,
          slot: s
        });
        continue;
      }

      await pool.query(
        'INSERT INTO timetable_slots (course_id, faculty_id, room, day, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
        [s.course_id, s.faculty_id, s.room, s.day, s.start_time, s.end_time]
      );

      inserted.push(s);
    }

    res.json({
      message: `Applied ${inserted.length} of ${slots.length} slots`,
      inserted: inserted.length,
      total: slots.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in apply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
