export async function detectConflicts(pool, { day, start_time, end_time, room, faculty_id, excludeId }) {
  let query = `
    SELECT * FROM timetable_slots
    WHERE day = ?
      AND (? < end_time AND ? > start_time)
      AND (room = ? OR faculty_id = ?)
  `;
  const params = [day, start_time, end_time, room, faculty_id];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

export async function detectStudentConflicts(pool, { day, start_time, end_time, course_id, excludeSlotId }) {
  const [enrolled] = await pool.query(
    'SELECT student_id FROM enrollments WHERE course_id = ?',
    [course_id]
  );

  if (enrolled.length === 0) return [];

  const studentIds = enrolled.map(e => e.student_id);

  let query = `
    SELECT DISTINCT ts.*, c.name AS course_name, c.code AS course_code
    FROM timetable_slots ts
    JOIN enrollments e ON e.course_id = ts.course_id
    JOIN courses c ON c.id = ts.course_id
    WHERE e.student_id IN (?)
      AND ts.day = ?
      AND (? < ts.end_time AND ? > ts.start_time)
  `;
  const params = [studentIds, day, start_time, end_time];

  if (excludeSlotId) {
    query += ' AND ts.id != ?';
    params.push(excludeSlotId);
  }

  const [rows] = await pool.query(query, params);
  return rows;
}
