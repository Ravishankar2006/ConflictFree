import pool from '../config/db.js';

export async function listAvailability(req, res) {
  try {
    const { facultyId } = req.params;

    let rows;
    if (facultyId) {
      [rows] = await pool.query(
        'SELECT * FROM faculty_availability WHERE faculty_id = ? ORDER BY FIELD(day, \'MON\', \'TUE\', \'WED\', \'THU\', \'FRI\', \'SAT\')',
        [facultyId]
      );
    } else {
      [rows] = await pool.query(
        'SELECT fa.*, u.name AS faculty_name FROM faculty_availability fa JOIN users u ON u.id = fa.faculty_id ORDER BY fa.faculty_id, FIELD(fa.day, \'MON\', \'TUE\', \'WED\', \'THU\', \'FRI\', \'SAT\')'
      );
    }

    res.json(rows);
  } catch (error) {
    console.error('Error in listAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function setAvailability(req, res) {
  try {
    const { faculty_id, day, start_time, end_time } = req.body;

    if (!faculty_id || !day || !start_time || !end_time) {
      return res.status(400).json({ message: 'faculty_id, day, start_time, and end_time are required' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: 'end_time must be after start_time' });
    }

    await pool.query(
      `INSERT INTO faculty_availability (faculty_id, day, start_time, end_time)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)`,
      [faculty_id, day, start_time, end_time]
    );

    res.json({ message: 'Availability set successfully' });
  } catch (error) {
    console.error('Error in setAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// GET /api/availability/me — faculty views their own availability
export async function myAvailability(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM faculty_availability WHERE faculty_id = ? ORDER BY FIELD(day, \'MON\', \'TUE\', \'WED\', \'THU\', \'FRI\', \'SAT\')',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error in myAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// PUT /api/availability/me — faculty bulk-updates their own weekly availability
export async function updateMyAvailability(req, res) {
  try {
    const { availability } = req.body; // [{ day, start_time, end_time }, ...]
    const facultyId = req.user.id;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'availability must be an array of { day, start_time, end_time }' });
    }

    // Delete all existing records for this faculty, then insert new ones
    await pool.query('DELETE FROM faculty_availability WHERE faculty_id = ?', [facultyId]);

    if (availability.length === 0) {
      return res.json({ message: 'All availability cleared' });
    }

    const VALUES = availability.map(({ day, start_time, end_time }) => {
      if (!day || !start_time || !end_time) throw new Error('Each entry needs day, start_time, end_time');
      if (start_time >= end_time) throw new Error(`end_time must be after start_time for ${day}`);
      return { facultyId, day, start_time, end_time };
    });

    const placeholders = VALUES.map(() => '(?, ?, ?, ?)').join(', ');
    const flatParams = VALUES.flatMap(v => [v.facultyId, v.day, v.start_time, v.end_time]);

    await pool.query(
      `INSERT INTO faculty_availability (faculty_id, day, start_time, end_time) VALUES ${placeholders}`,
      flatParams
    );

    res.json({ message: 'Availability updated successfully', count: VALUES.length });
  } catch (error) {
    console.error('Error in updateMyAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteAvailability(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT id FROM faculty_availability WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Availability record not found' });
    }

    await pool.query('DELETE FROM faculty_availability WHERE id = ?', [id]);
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
