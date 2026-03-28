const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let q = `SELECT p.*, u.name as owner_name, u.avatar_initials as owner_initials
             FROM projects p LEFT JOIN users u ON p.owner_id=u.id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); q += ` AND p.status=$${params.length}`; }
    if (type)   { params.push(type);   q += ` AND p.type=$${params.length}`; }
    if (priority){ params.push(priority); q += ` AND p.priority=$${params.length}`; }
    q += ' ORDER BY p.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json({ projects: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id=u.id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const [members, milestones, tasks] = await Promise.all([
      pool.query(`SELECT pm.*, u.name, u.email, u.avatar_initials FROM project_members pm JOIN users u ON pm.user_id=u.id WHERE pm.project_id=$1`, [req.params.id]),
      pool.query(`SELECT * FROM milestones WHERE project_id=$1 ORDER BY sort_order`, [req.params.id]),
      pool.query(`SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id=u.id WHERE t.project_id=$1 ORDER BY t.created_at DESC`, [req.params.id])
    ]);

    res.json({ project: rows[0], members: members.rows, milestones: milestones.rows, tasks: tasks.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects
router.post('/', [
  body('name').notEmpty(),
  body('type').isIn(['gtm','marketing','software','jv','partnership','custom']),
  body('code').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { code, name, description, type, priority='medium', start_date, end_date, budget_total, tags } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects (code,name,description,type,priority,owner_id,start_date,end_date,budget_total,tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, name, description, type, priority, req.user.id, start_date, end_date, budget_total, tags]
    );
    await pool.query('INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3)', [rows[0].id, req.user.id, 'lead']);
    res.status(201).json({ project: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Project code already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','description','status','priority','health','end_date','budget_total','budget_spent','progress_pct','tags'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  const sets = updates.map((k, i) => `${k}=$${i + 2}`).join(', ');
  const vals = [req.params.id, ...updates.map(k => req.body[k])];
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET ${sets}, updated_at=NOW() WHERE id=$1 RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ project: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE projects SET status=$1 WHERE id=$2', ['cancelled', req.params.id]);
    res.json({ message: 'Project cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/projects/:id/tasks
router.get('/:id/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.name as assignee_name, u.avatar_initials FROM tasks t
       LEFT JOIN users u ON t.assignee_id=u.id WHERE t.project_id=$1 ORDER BY t.created_at DESC`,
      [req.params.id]
    );
    res.json({ tasks: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/tasks
router.post('/:id/tasks', [body('title').notEmpty()], async (req, res) => {
  const { title, description, priority='p3', assignee_id, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id,title,description,priority,assignee_id,reporter_id,due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, title, description, priority, assignee_id, req.user.id, due_date]
    );
    res.status(201).json({ task: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/projects/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', async (req, res) => {
  const allowed = ['title','description','status','priority','assignee_id','due_date','completed_date'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
  const sets = updates.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const vals = [req.params.id, req.params.taskId, ...updates.map(k => req.body[k])];
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET ${sets}, updated_at=NOW() WHERE project_id=$1 AND id=$2 RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM tasks WHERE project_id=$1 AND id=$2', [req.params.id, req.params.taskId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/projects/:id/milestones
router.get('/:id/milestones', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM milestones WHERE project_id=$1 ORDER BY sort_order', [req.params.id]
    );
    res.json({ milestones: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/milestones
router.post('/:id/milestones', [body('name').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, due_date, amount, trigger_condition, responsible_party, sort_order } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO milestones (project_id,name,description,due_date,amount,trigger_condition,responsible_party,sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, name, description, due_date, amount, trigger_condition, responsible_party, sort_order || 0]
    );
    res.status(201).json({ milestone: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/projects/:id/milestones/:milestoneId
router.patch('/:id/milestones/:milestoneId', async (req, res) => {
  const allowed = ['name','description','status','due_date','completed_date','amount','trigger_condition','responsible_party','sort_order'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
  const sets = updates.map((k, i) => `${k}=$${i + 3}`).join(', ');
  const vals = [req.params.id, req.params.milestoneId, ...updates.map(k => req.body[k])];
  try {
    const { rows } = await pool.query(
      `UPDATE milestones SET ${sets}, updated_at=NOW() WHERE project_id=$1 AND id=$2 RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Milestone not found' });
    res.json({ milestone: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
