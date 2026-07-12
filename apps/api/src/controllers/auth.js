import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import process from 'process';
import pool from '../config/db.js';

// POST /api/auth/users — admin creates a user with any role
export async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields (name, email, password, role) are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const allowedRoles = ['student', 'faculty', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields (name, email, password, role) are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const allowedRoles = ['student', 'faculty', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: result.insertId 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/users?role=faculty|student|admin
export async function listUsers(req, res) {
  try {
    const { role } = req.query;
    const allowedRoles = ['student', 'faculty', 'admin'];

    let query = 'SELECT id, name, email, role FROM users';
    const params = [];

    if (role) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role filter. Use one of: ${allowedRoles.join(', ')}` });
      }
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error in listUsers:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/auth/users/:id — admin deletes a user
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
