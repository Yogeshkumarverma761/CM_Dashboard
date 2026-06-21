import express from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const CATEGORY_TO_DEPT = {
  'Roads / Potholes': 'PWD',
  'Water Leakage / Shortage': 'DJB',
  'Garbage / Waste Pile': 'MCD',
  'Streetlight / Power Outage': 'DISCOM',
  'Public Nuisance / Safety': 'POLICE'
};

// ─── GET /api/complaints ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { district, status, severity, department, search, officer_id } = req.query;

    let sql = `
      SELECT c.*, d.name as department_name, d.code as department_code,
             u.full_name as citizen_name, 
             ou.full_name as assigned_officer_name
      FROM complaints c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN users u ON c.citizen_id = u.id
      LEFT JOIN officers o ON c.assigned_officer_id = o.id
      LEFT JOIN users ou ON o.user_id = ou.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (district && district !== 'All') {
      sql += ` AND c.district = $${idx++}`;
      params.push(district);
    }
    if (status && status !== 'All') {
      sql += ` AND c.status = $${idx++}`;
      params.push(status);
    }
    if (severity && severity !== 'All') {
      sql += ` AND c.severity = $${idx++}`;
      params.push(severity);
    }
    if (department && department !== 'All') {
      sql += ` AND d.code = $${idx++}`;
      params.push(department);
    }
    if (officer_id) {
      sql += ` AND c.assigned_officer_id = $${idx++}`;
      params.push(officer_id);
    }
    if (search) {
      sql += ` AND (LOWER(c.title) LIKE $${idx} OR LOWER(c.tracking_no) LIKE $${idx} OR LOWER(c.description) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    sql += ' ORDER BY c.created_at DESC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Get complaints error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// ─── GET /api/complaints/track/:trackingNo ─────────────────────────────────
router.get('/track/:trackingNo', async (req, res) => {
  try {
    const { trackingNo } = req.params;
    const rows = await query(
      `SELECT c.*, d.name as department_name, d.code as department_code,
              u.full_name as citizen_name,
              ou.full_name as assigned_officer_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       LEFT JOIN users ou ON o.user_id = ou.id
       WHERE UPPER(c.tracking_no) = UPPER($1)`,
      [trackingNo]
    );

    if (!rows.length) return res.json(null);

    const complaint = rows[0];
    const timeline = await query(
      `SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY created_at ASC`,
      [complaint.id]
    );

    res.json({ ...complaint, timeline });
  } catch (err) {
    console.error('Track complaint error:', err);
    res.status(500).json({ error: 'Failed to track complaint.' });
  }
});

// ─── GET /api/complaints/:id ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.*, d.name as department_name, d.code as department_code,
              u.full_name as citizen_name,
              ou.full_name as assigned_officer_name
       FROM complaints c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       LEFT JOIN users ou ON o.user_id = ou.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Complaint not found.' });

    const timeline = await query(
      `SELECT * FROM complaint_timeline WHERE complaint_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json({ ...rows[0], timeline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
});

// ─── POST /api/complaints ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { title, description, category, district, severity, latitude, longitude, photo_before, citizen_id } = req.body;

    // Get department by category
    const deptCode = CATEGORY_TO_DEPT[category] || 'PWD';
    const deptRows = await query('SELECT id FROM departments WHERE code = $1', [deptCode]);
    const departmentId = deptRows[0]?.id;

    if (!departmentId) {
      return res.status(400).json({ error: 'Invalid category / department mapping.' });
    }

    // Auto-route: find officer with lowest workload in this department
    const officerRows = await query(
      `SELECT id FROM officers 
       WHERE department_id = $1 AND is_active = true 
       ORDER BY workload_count ASC, created_at ASC 
       LIMIT 1`,
      [departmentId]
    );
    const assignedOfficerId = officerRows[0]?.id || null;
    const status = assignedOfficerId ? 'assigned' : 'pending';

    const trackingNo = 'DL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const complaintId = crypto.randomUUID();

    await query(
      `INSERT INTO complaints (id, tracking_no, title, description, category, department_id, status, severity, district, latitude, longitude, photo_before, citizen_id, assigned_officer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [complaintId, trackingNo, title, description, category, departmentId, status, severity || 'medium', district, parseFloat(latitude) || 28.6139, parseFloat(longitude) || 77.2090, photo_before || null, citizen_id || null, assignedOfficerId]
    );

    // If assigned, increment officer workload
    if (assignedOfficerId) {
      await query(
        'UPDATE officers SET workload_count = workload_count + 1 WHERE id = $1',
        [assignedOfficerId]
      );
    }

    // Log timeline - submission event
    await query(
      `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [crypto.randomUUID(), complaintId, 'pending', `Grievance submitted in district: ${district}`, 'Citizen Portal']
    );

    // Log timeline - assignment event
    if (assignedOfficerId) {
      const officerNameRows = await query(
        `SELECT u.full_name FROM officers o JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
        [assignedOfficerId]
      );
      const officerName = officerNameRows[0]?.full_name || 'Department Officer';
      await query(
        `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [crypto.randomUUID(), complaintId, 'assigned', `Auto-assigned to ${officerName} (lowest active workload).`, 'System Auto-Router']
      );
    }

    const result = await query(
      `SELECT c.*, d.name as department_name, d.code as department_code
       FROM complaints c LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.id = $1`,
      [complaintId]
    );

    res.status(201).json(result[0]);
  } catch (err) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'Failed to create complaint.' });
  }
});

// ─── PATCH /api/complaints/:id ─────────────────────────────────────────────
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes, photo_after, assigned_officer_id } = req.body;
    const activeUser = req.user;

    const existing = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Complaint not found.' });

    const old = existing[0];
    const updates = { updated_at: 'NOW()' };
    const params = [];
    let idx = 1;
    let setParts = [];

    if (status) {
      setParts.push(`status = $${idx++}`);
      params.push(status);
    }
    if (resolution_notes) {
      setParts.push(`resolution_notes = $${idx++}`);
      params.push(resolution_notes);
    }
    if (photo_after) {
      setParts.push(`photo_after = $${idx++}`);
      params.push(photo_after);
    }
    if (assigned_officer_id) {
      setParts.push(`assigned_officer_id = $${idx++}`);
      params.push(assigned_officer_id);
    }
    if (status === 'resolved') {
      setParts.push(`resolved_at = NOW()`);
    }
    setParts.push(`updated_at = NOW()`);

    params.push(id);
    await query(
      `UPDATE complaints SET ${setParts.join(', ')} WHERE id = $${idx}`,
      params
    );

    // Adjust officer workload on resolution
    if (old.assigned_officer_id) {
      if (['assigned', 'in_progress'].includes(old.status) && status === 'resolved') {
        await query(
          'UPDATE officers SET workload_count = GREATEST(0, workload_count - 1) WHERE id = $1',
          [old.assigned_officer_id]
        );
        // Random 10% re-inspection
        if (Math.random() < 0.10) {
          await query(
            `INSERT INTO re_inspections (id, complaint_id, status, created_at) VALUES ($1, $2, 'pending', NOW())`,
            [crypto.randomUUID(), id]
          );
          await query(
            `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [crypto.randomUUID(), id, status, 'Selected for random 10% quality audit re-inspection.', 'System Audit']
          );
        }
      } else if (old.status === 'resolved' && status === 'reopened') {
        await query(
          'UPDATE officers SET workload_count = workload_count + 1 WHERE id = $1',
          [old.assigned_officer_id]
        );
      }
    }

    // Timeline log
    let desc = `Complaint updated by ${activeUser?.full_name || 'Officer'}.`;
    if (status === 'resolved') desc = `Complaint resolved. Notes: ${resolution_notes || ''}`;
    else if (status === 'in_progress') desc = 'Investigation started. Ground personnel dispatched.';

    await query(
      `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [crypto.randomUUID(), id, status || old.status, desc, activeUser?.full_name || 'System']
    );

    const updated = await query(
      `SELECT c.*, d.name as department_name, d.code as department_code
       FROM complaints c LEFT JOIN departments d ON c.department_id = d.id
       WHERE c.id = $1`,
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Update complaint error:', err);
    res.status(500).json({ error: 'Failed to update complaint.' });
  }
});

// ─── POST /api/complaints/:id/feedback ─────────────────────────────────────
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    const existing = await query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Complaint not found.' });

    await query(
      `INSERT INTO feedback (id, complaint_id, rating, comments, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [crypto.randomUUID(), id, rating, comments || null]
    );

    // Auto-reopen if rating < 3
    if (rating < 3) {
      await query(
        `UPDATE complaints SET status = 'reopened', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      // Increment officer workload for reopened
      const comp = existing[0];
      if (comp.assigned_officer_id) {
        await query(
          'UPDATE officers SET workload_count = workload_count + 1 WHERE id = $1',
          [comp.assigned_officer_id]
        );
      }
      await query(
        `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at)
         VALUES ($1, $2, 'reopened', $3, 'Citizen Feedback Loop', NOW())`,
        [crypto.randomUUID(), id, `Auto-reopened due to poor rating: ${rating}/5. Comment: "${comments || ''}"`]
      );
    } else {
      await query(
        `INSERT INTO complaint_timeline (id, complaint_id, status, description, action_by_name, created_at)
         VALUES ($1, $2, $3, $4, 'Citizen Feedback Loop', NOW())`,
        [crypto.randomUUID(), id, existing[0].status, `Positive feedback: ${rating}/5. "${comments || ''}"`]
      );
    }

    // Recalculate officer avg rating
    const comp = existing[0];
    if (comp.assigned_officer_id) {
      await query(
        `UPDATE officers SET avg_rating = (
           SELECT ROUND(AVG(f.rating)::numeric, 2) FROM feedback f
           JOIN complaints c ON c.id = f.complaint_id
           WHERE c.assigned_officer_id = $1
         ) WHERE id = $1`,
        [comp.assigned_officer_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

export default router;
