import pool from '../config/db.js';

// Create a new timetable slot with conflict detection
export async function createSlot(req, res) {
  try {
    const { course_id, room, faculty_id, day, start_time, end_time } = req.body;

    // Validate inputs
    if (!course_id || !room || !faculty_id || !day || !start_time || !end_time) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate time range
    if (start_time >= end_time) {
      return res.status(400).json({ message: 'end_time must be after start_time' });
    }

    // Check for conflicts (same day + overlapping time + same room OR faculty)
    const [conflicts] = await pool.query(
      `
      SELECT * FROM timetable_slots
      WHERE day = ?
        AND (? < end_time AND ? > start_time)
        AND (room = ? OR faculty_id = ?)
      `,
      [day, start_time, end_time, room, faculty_id]
    );

    if (conflicts.length > 0) {
      // BLOCK the slot creation and return conflict details
      return res.status(409).json({
        message: 'Cannot create slot: Conflict detected',
        conflicts: conflicts.map(c => ({
          id: c.id,
          room: c.room,
          day: c.day,
          time: `${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}`,
          course_id: c.course_id
        }))
      });
    }

    // No conflicts: safe insert
    const [result] = await pool.query(
      'INSERT INTO timetable_slots (course_id, room, faculty_id, day, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [course_id, room, faculty_id, day, start_time, end_time]
    );

    res.status(201).json({
      message: 'Slot created successfully',
      slotId: result.insertId
    });
  } catch (error) {
    console.error('Error in createSlot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get timetable based on user role
export async function getMyTimetable(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'student') {
      // Get timetable for enrolled courses
      const [rows] = await pool.query(
        `
        SELECT ts.*, c.name as course_name, c.code as course_code, u.name as faculty_name
        FROM timetable_slots ts
        JOIN enrollments e ON e.course_id = ts.course_id
        JOIN courses c ON c.id = ts.course_id
        JOIN users u ON u.id = ts.faculty_id
        WHERE e.student_id = ?
        ORDER BY FIELD(ts.day, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'), ts.start_time
        `,
        [userId]
      );
      return res.json(rows);
    }

    if (role === 'faculty') {
      // Get timetable for faculty's classes
      const [rows] = await pool.query(
        `
        SELECT ts.*, c.name as course_name, c.code as course_code
        FROM timetable_slots ts
        JOIN courses c ON c.id = ts.course_id
        WHERE ts.faculty_id = ?
        ORDER BY FIELD(ts.day, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'), ts.start_time
        `,
        [userId]
      );
      return res.json(rows);
    }

    // Admin sees everything
    const [rows] = await pool.query(
      `
      SELECT ts.*, c.name as course_name, c.code as course_code, u.name as faculty_name
      FROM timetable_slots ts
      JOIN courses c ON c.id = ts.course_id
      JOIN users u ON u.id = ts.faculty_id
      ORDER BY FIELD(ts.day, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'), ts.start_time
      `
    );
    return res.json(rows);
  } catch (error) {
    console.error('Error in getMyTimetable:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get all slots (admin only)
export async function getAllSlots(req, res) {
  try {
    const [rows] = await pool.query(
      `
      SELECT ts.*, c.name as course_name, c.code as course_code, u.name as faculty_name
      FROM timetable_slots ts
      JOIN courses c ON c.id = ts.course_id
      JOIN users u ON u.id = ts.faculty_id
      ORDER BY FIELD(ts.day, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'), ts.start_time
      `
    );
    res.json(rows);
  } catch (error) {
    console.error('Error in getAllSlots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete a timetable slot
export async function deleteSlot(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if slot exists
    const [slots] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    
    if (slots.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    const slot = slots[0];

    // Authorization: faculty can only delete their own slots, admin can delete any
    if (userRole === 'faculty' && slot.faculty_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own slots' });
    }

    // Delete the slot
    await pool.query('DELETE FROM timetable_slots WHERE id = ?', [id]);

    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSlot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update (reschedule) a timetable slot — admin only
export async function updateSlot(req, res) {
  try {
    const { id } = req.params;
    const { course_id, room, faculty_id, day, start_time, end_time } = req.body;

    if (!course_id || !room || !faculty_id || !day || !start_time || !end_time) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (start_time >= end_time) {
      return res.status(400).json({ message: 'end_time must be after start_time' });
    }

    const [existing] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Check conflicts, excluding the slot being updated
    const [conflicts] = await pool.query(
      `
      SELECT * FROM timetable_slots
      WHERE id != ?
        AND day = ?
        AND (? < end_time AND ? > start_time)
        AND (room = ? OR faculty_id = ?)
      `,
      [id, day, start_time, end_time, room, faculty_id]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot update slot: Conflict detected',
        conflicts: conflicts.map(c => ({
          id: c.id,
          room: c.room,
          day: c.day,
          time: `${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}`,
          course_id: c.course_id
        }))
      });
    }

    await pool.query(
      'UPDATE timetable_slots SET course_id=?, room=?, faculty_id=?, day=?, start_time=?, end_time=? WHERE id=?',
      [course_id, room, faculty_id, day, start_time, end_time, id]
    );

    res.json({ message: 'Slot updated successfully' });
  } catch (error) {
    console.error('Error in updateSlot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
