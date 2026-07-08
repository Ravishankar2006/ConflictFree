import pool from '../config/db.js';

// GET /api/courses — list all courses
export async function listCourses(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, name, code FROM courses ORDER BY code');
    res.json(rows);
  } catch (error) {
    console.error('Error in listCourses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// POST /api/courses — create a new course (admin only)
export async function createCourse(req, res) {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Course name and code are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO courses (name, code) VALUES (?, ?)',
      [name.trim(), code.trim().toUpperCase()]
    );

    res.status(201).json({
      message: 'Course created successfully',
      courseId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// DELETE /api/courses/:id — remove a course (admin only)
export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT id FROM courses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
