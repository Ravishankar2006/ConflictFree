import pool from '../config/db.js';

// GET /api/enrollments — list all enrollments with student/course details (admin)
export async function listEnrollments(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.id,
        e.student_id,
        e.course_id,
        u.name  AS student_name,
        u.email AS student_email,
        c.code  AS course_code,
        c.name  AS course_name
      FROM enrollments e
      JOIN users   u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      ORDER BY u.name, c.code
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error in listEnrollments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// POST /api/enrollments — enroll a student in a course (admin only)
export async function createEnrollment(req, res) {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ message: 'student_id and course_id are required' });
    }

    // Verify student exists and has student role
    const [students] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify course exists
    const [courses] = await pool.query('SELECT id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [student_id, course_id]
    );

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollmentId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }
    console.error('Error in createEnrollment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// DELETE /api/enrollments/:id — remove an enrollment (admin only)
export async function deleteEnrollment(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT id FROM enrollments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await pool.query('DELETE FROM enrollments WHERE id = ?', [id]);
    res.json({ message: 'Enrollment removed successfully' });
  } catch (error) {
    console.error('Error in deleteEnrollment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
