import pool from '../config/db.js';

export async function getCourseFaculty(req, res) {
  try {
    const { courseId } = req.params;

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM course_faculty cf
       JOIN users u ON u.id = cf.faculty_id
       WHERE cf.course_id = ?
       ORDER BY u.name`,
      [courseId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error in getCourseFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getAllAssignments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT cf.course_id, cf.faculty_id, c.code AS course_code, c.name AS course_name, u.name AS faculty_name
       FROM course_faculty cf
       JOIN courses c ON c.id = cf.course_id
       JOIN users u ON u.id = cf.faculty_id
       ORDER BY c.code, u.name`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function assignFaculty(req, res) {
  try {
    const { courseId } = req.params;
    const { faculty_id } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ message: 'faculty_id is required' });
    }

    const [faculty] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'faculty'", [faculty_id]);
    if (faculty.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const [course] = await pool.query('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await pool.query(
      'INSERT IGNORE INTO course_faculty (course_id, faculty_id) VALUES (?, ?)',
      [courseId, faculty_id]
    );

    res.json({ message: 'Faculty assigned to course successfully' });
  } catch (error) {
    console.error('Error in assignFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function removeFaculty(req, res) {
  try {
    const { courseId, facultyId } = req.params;

    await pool.query(
      'DELETE FROM course_faculty WHERE course_id = ? AND faculty_id = ?',
      [courseId, facultyId]
    );

    res.json({ message: 'Faculty removed from course' });
  } catch (error) {
    console.error('Error in removeFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
