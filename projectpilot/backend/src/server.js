require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const partnerRoutes = require('./routes/partners');
const { issuesRouter, gtmRouter, jvRouter, campaignsRouter, dashboardRouter, usersRouter, auditRouter } = require('./routes/misc');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'ProjectPilot API', version: '1.0.0', ts: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/partners',  partnerRoutes);
app.use('/api/issues',    issuesRouter);
app.use('/api/gtm',       gtmRouter);
app.use('/api/jv',        jvRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/users',     usersRouter);
app.use('/api/audit',     auditRouter);

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ ProjectPilot API running on port ${PORT}`));
