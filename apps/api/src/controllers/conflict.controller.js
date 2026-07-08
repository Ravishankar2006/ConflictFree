import pool from '../config/db.js';

/**
 * List all current conflicts by finding pairs of timetable slots that
 * overlap on the same day and share either the same room or the same faculty.
 */
export async function listConflicts(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id          AS slot_a_id,
        b.id          AS slot_b_id,
        a.day,
        a.room,
        a.faculty_id  AS faculty_id,
        c1.name       AS course_a_name,
        c1.code       AS course_a_code,
        c2.name       AS course_b_name,
        c2.code       AS course_b_code,
        u.name        AS faculty_name,
        a.start_time  AS slot_a_start,
        a.end_time    AS slot_a_end,
        b.start_time  AS slot_b_start,
        b.end_time    AS slot_b_end,
        CASE
          WHEN a.room = b.room THEN 'ROOM'
          ELSE 'FACULTY'
        END AS conflict_type
      FROM timetable_slots a
      JOIN timetable_slots b
        ON  a.id < b.id
        AND a.day = b.day
        AND (a.start_time < b.end_time AND a.end_time > b.start_time)
        AND (a.room = b.room OR a.faculty_id = b.faculty_id)
      JOIN courses c1 ON c1.id = a.course_id
      JOIN courses c2 ON c2.id = b.course_id
      JOIN users u    ON u.id  = a.faculty_id
      ORDER BY a.day, a.start_time
    `);

    const conflicts = rows.map(r => ({
      slotAId:       r.slot_a_id,
      slotBId:       r.slot_b_id,
      day:           r.day,
      conflictType:  r.conflict_type,
      room:          r.room,
      facultyName:   r.faculty_name,
      courseA:       `${r.course_a_code} — ${r.course_a_name}`,
      courseB:       `${r.course_b_code} — ${r.course_b_name}`,
      timeA:         `${r.slot_a_start.slice(0, 5)} – ${r.slot_a_end.slice(0, 5)}`,
      timeB:         `${r.slot_b_start.slice(0, 5)} – ${r.slot_b_end.slice(0, 5)}`,
    }));

    res.json({ count: conflicts.length, conflicts });
  } catch (error) {
    console.error('Error in listConflicts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

/**
 * Resolve a conflict by deleting the specified timetable slot (by ID).
 * Admins choose which slot to remove to clear the conflict.
 */
export async function resolveConflict(req, res) {
  try {
    const { id } = req.params;

    const [slots] = await pool.query('SELECT * FROM timetable_slots WHERE id = ?', [id]);
    if (slots.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await pool.query('DELETE FROM timetable_slots WHERE id = ?', [id]);

    res.json({ message: `Conflict resolved — slot #${id} deleted successfully` });
  } catch (error) {
    console.error('Error in resolveConflict:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
