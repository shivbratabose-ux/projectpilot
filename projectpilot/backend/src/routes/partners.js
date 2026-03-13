const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/partners
router.get('/', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let q = 'SELECT * FROM partners WHERE 1=1';
    const params = [];
    if (type)   { params.push(type);   q += ` AND type=$${params.length}`; }
    if (status) { params.push(status); q += ` AND status=$${params.length}`; }
    if (search) { params.push(`%${search}%`); q += ` AND name ILIKE $${params.length}`; }
    q += ' ORDER BY name';
    const { rows } = await pool.query(q, params);
    res.json({ partners: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/partners/:id
router.get('/:id', async (req, res) => {
  try {
    const [partner, agreements, actions] = await Promise.all([
      pool.query('SELECT * FROM partners WHERE id=$1', [req.params.id]),
      pool.query('SELECT * FROM agreements WHERE partner_id=$1 ORDER BY created_at DESC', [req.params.id]),
      pool.query(`SELECT al.*, u.name as logged_by_name FROM action_logs al
                  LEFT JOIN users u ON al.logged_by=u.id WHERE al.partner_id=$1 ORDER BY al.log_date DESC LIMIT 20`, [req.params.id])
    ]);
    if (!partner.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ partner: partner.rows[0], agreements: agreements.rows, actions: actions.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/partners
router.post('/', [body('name').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, type, country, website, categories, primary_contact_name, primary_contact_email, primary_contact_phone, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO partners (name,type,country,website,categories,primary_contact_name,primary_contact_email,primary_contact_phone,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, type, country, website, categories, primary_contact_name, primary_contact_email, primary_contact_phone, notes, req.user.id]
    );
    res.status(201).json({ partner: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/partners/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','type','country','website','categories','status','primary_contact_name','primary_contact_email','primary_contact_phone','notes'];
  const updates = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
  const sets = updates.map((k, i) => `${k}=$${i + 2}`).join(', ');
  const vals = [req.params.id, ...updates.map(k => req.body[k])];
  try {
    const { rows } = await pool.query(`UPDATE partners SET ${sets}, updated_at=NOW() WHERE id=$1 RETURNING *`, vals);
    res.json({ partner: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/partners/:id/agreements
router.post('/:id/agreements', async (req, res) => {
  const { project_id, type, signed_date, expiry_date, document_url, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO agreements (partner_id,project_id,type,status,signed_date,expiry_date,document_url,notes,created_by)
       VALUES ($1,$2,$3,'active',$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, project_id, type, signed_date, expiry_date, document_url, notes, req.user.id]
    );
    res.status(201).json({ agreement: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/partners/:id/actions
router.post('/:id/actions', async (req, res) => {
  const { project_id, log_date, interaction_type, notes, next_action, next_action_owner_id, next_action_due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO action_logs (project_id,partner_id,logged_by,log_date,interaction_type,notes,next_action,next_action_owner_id,next_action_due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [project_id, req.params.id, req.user.id, log_date || new Date(), interaction_type, notes, next_action, next_action_owner_id, next_action_due_date]
    );
    res.status(201).json({ action: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
