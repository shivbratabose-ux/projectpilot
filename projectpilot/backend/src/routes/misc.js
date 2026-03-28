const express = require('express');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

// ─── Issues Router ───────────────────────────────────────────────────────────
const issuesRouter = express.Router();
issuesRouter.use(auth);

issuesRouter.get('/', async (req, res) => {
  try {
    const { project_id, severity, status } = req.query;
    let q = `SELECT i.*, u.name as assignee_name, p.name as project_name
             FROM issues i LEFT JOIN users u ON i.assignee_id=u.id LEFT JOIN projects p ON i.project_id=p.id WHERE 1=1`;
    const params = [];
    if (project_id) { params.push(project_id); q += ` AND i.project_id=$${params.length}`; }
    if (severity)   { params.push(severity);   q += ` AND i.severity=$${params.length}`; }
    if (status)     { params.push(status);     q += ` AND i.status=$${params.length}`; }
    q += ' ORDER BY CASE i.severity WHEN \'p1\' THEN 1 WHEN \'p2\' THEN 2 WHEN \'p3\' THEN 3 ELSE 4 END, i.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ issues: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SLA stats — must be before /:id to avoid param capture
issuesRouter.get('/stats/sla', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('closed','resolved')) as open_count,
        COUNT(*) FILTER (WHERE severity='p1' AND status NOT IN ('closed','resolved')) as p1_open,
        COUNT(*) FILTER (WHERE severity='p2' AND status NOT IN ('closed','resolved')) as p2_open,
        COUNT(*) FILTER (WHERE status IN ('resolved','closed')) as resolved_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) FILTER (WHERE resolved_at IS NOT NULL), 1) as avg_resolve_hours
      FROM issues
    `);
    res.json({ stats: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

issuesRouter.post('/', async (req, res) => {
  const { project_id, title, description, severity='p3', assignee_id, sla_response_minutes, sla_resolve_hours } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO issues (project_id,title,description,severity,assignee_id,reporter_id,sla_response_minutes,sla_resolve_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [project_id, title, description, severity, assignee_id, req.user.id, sla_response_minutes, sla_resolve_hours]
    );
    res.status(201).json({ issue: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

issuesRouter.patch('/:id', async (req, res) => {
  const allowed = ['status','severity','assignee_id','resolution_notes','resolved_at'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map((k, i) => `${k}=$${i + 2}`).join(', ');
  const vals = [req.params.id, ...updates.map(k => req.body[k])];
  try {
    const { rows } = await pool.query(`UPDATE issues SET ${sets}, updated_at=NOW() WHERE id=$1 RETURNING *`, vals);
    res.json({ issue: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GTM Router ──────────────────────────────────────────────────────────────
const gtmRouter = express.Router();
gtmRouter.use(auth);

gtmRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, p.name as project_name, p.status as project_status, p.health, p.progress_pct,
              pt.name as partner_name
       FROM gtm_projects g
       JOIN projects p ON g.project_id=p.id
       LEFT JOIN partners pt ON g.partner_id=pt.id
       ORDER BY p.created_at DESC`
    );
    res.json({ gtm_projects: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

gtmRouter.post('/', async (req, res) => {
  const { project_id, market, product_line, phase, target_revenue, partner_id, launch_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO gtm_projects (project_id,market,product_line,phase,target_revenue,partner_id,launch_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [project_id, market, product_line, phase, target_revenue, partner_id, launch_date]
    );
    res.status(201).json({ gtm_project: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── JV Router ───────────────────────────────────────────────────────────────
const jvRouter = express.Router();
jvRouter.use(auth);

jvRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT jv.*, p.name as project_name FROM joint_ventures jv JOIN projects p ON jv.project_id=p.id ORDER BY jv.created_at DESC`
    );
    for (const jv of rows) {
      const parties = await pool.query('SELECT * FROM jv_parties WHERE jv_id=$1', [jv.id]);
      jv.parties = parties.rows;
    }
    res.json({ joint_ventures: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

jvRouter.post('/', async (req, res) => {
  const { project_id, name, jv_type, jurisdiction, total_contract_value, parties } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO joint_ventures (project_id,name,jv_type,jurisdiction,total_contract_value)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [project_id, name, jv_type, jurisdiction, total_contract_value]
    );
    const jv = rows[0];
    if (parties && parties.length) {
      for (const p of parties) {
        await client.query(
          `INSERT INTO jv_parties (jv_id,partner_id,party_name,role,equity_pct,is_internal) VALUES ($1,$2,$3,$4,$5,$6)`,
          [jv.id, p.partner_id, p.party_name, p.role, p.equity_pct, p.is_internal || false]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ jv });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// ─── Campaigns Router ────────────────────────────────────────────────────────
const campaignsRouter = express.Router();
campaignsRouter.use(auth);

campaignsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.name as project_name, u.name as owner_name FROM campaigns c
       JOIN projects p ON c.project_id=p.id LEFT JOIN users u ON c.owner_id=u.id
       ORDER BY c.created_at DESC`
    );
    res.json({ campaigns: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

campaignsRouter.post('/', async (req, res) => {
  const { project_id, gtm_project_id, name, type, start_date, end_date, budget_allocated, channel_tags } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO campaigns (project_id,gtm_project_id,name,type,owner_id,start_date,end_date,budget_allocated,channel_tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [project_id, gtm_project_id, name, type, req.user.id, start_date, end_date, budget_allocated, channel_tags]
    );
    res.status(201).json({ campaign: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Dashboard Router ────────────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.use(auth);

dashboardRouter.get('/', async (req, res) => {
  try {
    const [projStats, issueStats, myTasks, recentActivity] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status='active') as active,
          COUNT(*) FILTER (WHERE health='red') as at_risk,
          COUNT(*) FILTER (WHERE health='amber') as amber,
          COUNT(*) FILTER (WHERE status='completed') as completed
        FROM projects
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ('closed','resolved')) as open_issues,
          COUNT(*) FILTER (WHERE severity='p1' AND status NOT IN ('closed','resolved')) as p1_open
        FROM issues
      `),
      pool.query(`
        SELECT t.*, p.name as project_name FROM tasks t
        JOIN projects p ON t.project_id=p.id
        WHERE t.assignee_id=$1 AND t.status NOT IN ('done','cancelled')
        ORDER BY t.due_date ASC NULLS LAST LIMIT 10
      `, [req.user.id]),
      pool.query(`
        SELECT al.id, al.created_at, al.action_type, al.affected_object, u.name as user_name
        FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id
        ORDER BY al.created_at DESC LIMIT 20
      `)
    ]);

    res.json({
      project_stats: projStats.rows[0],
      issue_stats: issueStats.rows[0],
      my_tasks: myTasks.rows,
      recent_activity: recentActivity.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Users Router ────────────────────────────────────────────────────────────
const usersRouter = express.Router();
usersRouter.use(auth);

usersRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, department, avatar_initials, is_active FROM users ORDER BY name'
    );
    res.json({ users: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Audit Logs Router ───────────────────────────────────────────────────────
const auditRouter = express.Router();
auditRouter.use(auth);

auditRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id
       ORDER BY al.created_at DESC LIMIT 100`
    );
    res.json({ logs: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

auditRouter.post('/', async (req, res) => {
  const { action_type, affected_object, status='success', metadata } = req.body;
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id,action_type,affected_object,ip_address,status,metadata)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [req.user.id, action_type, affected_object, req.ip, status, metadata]
    );
    res.status(201).json({ message: 'Logged' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { issuesRouter, gtmRouter, jvRouter, campaignsRouter, dashboardRouter, usersRouter, auditRouter };
