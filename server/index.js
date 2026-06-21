import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { query } from './db.js';


// Route imports
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import departmentRoutes from './routes/departments.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Delhi CM Grievance Dashboard API is running.',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Auto-Escalation Background Worker ─────────────────────────────────────
async function runAutoEscalation() {
  if (!process.env.DATABASE_URL) return;
  try {
    const res = await query('SELECT auto_escalate_old_complaints() AS escalated');
    const count = res[0]?.escalated || 0;
    if (count > 0) {
      console.log(`[Auto-Escalation] Successfully escalated ${count} overdue complaints.`);
    }
  } catch (err) {
    console.error('[Auto-Escalation Error] Failed to run auto-escalation:', err.message);
  }
}

// ─── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Delhi CM Dashboard API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   DB: ${process.env.DATABASE_URL ? '✅ NeonDB Connected' : '⚠️ DATABASE_URL not set'}\n`);
  
  // Run auto-escalation check on server startup and every 10 minutes
  runAutoEscalation();
  setInterval(runAutoEscalation, 10 * 60 * 1000);
});


export default app;
