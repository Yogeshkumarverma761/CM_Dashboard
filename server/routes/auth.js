import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'delhi-cm-dashboard-secret-key';

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const rows = await query(
      `SELECT u.*, d.name as department_name, d.code as department_code, o.id as officer_id
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN officers o ON o.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        district: user.district,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        officer_id: user.officer_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        district: user.district,
        phone: user.phone,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        officer_id: user.officer_id
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role, phone, district, departmentCode } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    // Check if email is already taken
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Resolve department ID
    let departmentId = null;
    if (departmentCode) {
      const dept = await query(
        'SELECT id FROM departments WHERE code = $1',
        [departmentCode]
      );
      departmentId = dept[0]?.id || null;
    }

    const userRole = role || 'citizen';
    const userId = crypto.randomUUID();

    // Insert user
    await query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone, district, department_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, email.toLowerCase(), passwordHash, userRole, fullName, phone || null, district || null, departmentId]
    );

    // If officer, create officer record
    if (userRole === 'officer' && departmentId) {
      await query(
        `INSERT INTO officers (id, user_id, department_id, workload_count, max_workload, is_active, avg_rating)
         VALUES ($1, $2, $3, 0, 15, true, 5.00)`,
        [crypto.randomUUID(), userId, departmentId]
      );
    }

    // Return JWT token immediately (no email confirmation needed)
    const token = jwt.sign(
      { id: userId, email, role: userRole, full_name: fullName, district, department_id: departmentId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: userId, email, role: userRole, full_name: fullName, district, phone }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user profile
    const rows = await query(
      `SELECT u.*, d.name as department_name, d.code as department_code, o.id as officer_id
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN officers o ON o.user_id = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      district: user.district,
      phone: user.phone,
      department_id: user.department_id,
      department_name: user.department_name,
      department_code: user.department_code,
      officer_id: user.officer_id
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    console.error('Auth/me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
