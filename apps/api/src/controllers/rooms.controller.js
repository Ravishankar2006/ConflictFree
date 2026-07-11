import pool from '../config/db.js';

export async function listRooms(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Error in listRooms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createRoom(req, res) {
  try {
    const { name, capacity } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO rooms (name, capacity) VALUES (?, ?)',
      [name.trim(), capacity || 30]
    );

    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Room already exists' });
    }
    console.error('Error in createRoom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT id FROM rooms WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
