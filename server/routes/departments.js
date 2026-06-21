import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// ─── GET /api/departments ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM departments ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

// ─── GET /api/officers ─────────────────────────────────────────────────────
router.get('/officers', async (req, res) => {
  try {
    const rows = await query(
      `SELECT o.id, o.workload_count, o.max_workload, o.avg_rating, o.is_active,
              u.full_name as name, u.email,
              d.name as department_name, d.code as department_code
       FROM officers o
       JOIN users u ON o.user_id = u.id
       JOIN departments d ON o.department_id = d.id
       ORDER BY d.name ASC, u.full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get officers error:', err);
    res.status(500).json({ error: 'Failed to fetch officers.' });
  }
});

// ─── GET /api/departments/visit-logs ──────────────────────────────────────
router.get('/visit-logs', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM visit_logs ORDER BY visit_date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get visit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch visit logs.' });
  }
});

// ─── POST /api/departments/visit-logs ─────────────────────────────────────
router.post('/visit-logs', async (req, res) => {
  try {
    const { district, visit_date, purpose, notes } = req.body;
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO visit_logs (id, district, visit_date, purpose, notes, complaint_count_at_visit, created_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW())`,
      [id, district, visit_date, purpose, notes || null]
    );
    const rows = await query('SELECT * FROM visit_logs WHERE id = $1', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create visit log error:', err);
    res.status(500).json({ error: 'Failed to create visit log.' });
  }
});

export default router;
