require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Users ────────────────────────────────────────────────────────
    const pwHash = await bcrypt.hash('Admin@123', 10);
    const users = await client.query(`
      INSERT INTO users (name, email, password_hash, role, avatar_initials, department) VALUES
        ('Shivbrata Bose',   'shivbrata@hansinfomatic.com', $1, 'admin',   'SB', 'Business Development'),
        ('Tanbir Ansari',    'tanbir@hansinfomatic.com',    $1, 'admin',   'TA', 'Technology'),
        ('Parvinder Singh',  'parvinder@hansinfomatic.com', $1, 'admin',   'PS', 'Management'),
        ('Padma Handa',      'padma@hansinfomatic.com',     $1, 'manager', 'PH', 'Management'),
        ('Charles Isabirye', 'charles@mpcmarketing.co.za',  $1, 'member',  'CI', 'MPC Project Lead'),
        ('Demo User',        'demo@hansinfomatic.com',      $1, 'member',  'DU', 'Operations')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `, [pwHash]);

    const userMap = {};
    users.rows.forEach(u => { userMap[u.email] = u.id; });

    const adminId   = userMap['shivbrata@hansinfomatic.com'];
    const techId    = userMap['tanbir@hansinfomatic.com'];
    const charlesId = userMap['charles@mpcmarketing.co.za'];

    // ── Partners ─────────────────────────────────────────────────────
    const partners = await client.query(`
      INSERT INTO partners (name, type, country, categories, status, primary_contact_name, primary_contact_email, created_by) VALUES
        ('MPC Marketing (Pty) Ltd.', 'reseller',    'South Africa', ARRAY['Aviation Ground Handling','Airport Technology'], 'active', 'Thabo Ivan Motale', 'ivan@motale.co.za',           $1),
        ('Colossal Avia',            'client',      'South Africa', ARRAY['Aviation Ground Handling','Airport Technology'], 'active', 'Nonku',             'nonku@colossalavia.co.za',     $1),
        ('AIASL',                    'client',      'India',        ARRAY['Aviation Ground Handling'],                      'active', 'Operations Head',   'ops@aiasl.in',                 $1),
        ('Delhi Airport (DIAL)',     'client',      'India',        ARRAY['Aviation Ground Handling','Airport Technology'], 'active', 'Technology Head',   'tech@delhi-airport.in',        $1),
        ('Royal Air Maroc (RAM)',    'prospect',    'Morocco',      ARRAY['Aviation Ground Handling'],                      'active', 'Ground Ops Manager','groundops@royalairmaroc.com',  $1)
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `, [adminId]);

    const partnerMap = {};
    partners.rows.forEach(p => { partnerMap[p.name] = p.id; });

    const mpcId      = partnerMap['MPC Marketing (Pty) Ltd.'];
    const colossalId = partnerMap['Colossal Avia'];

    // ── Projects ─────────────────────────────────────────────────────
    const projects = await client.query(`
      INSERT INTO projects (code, name, type, status, priority, health, owner_id, start_date, end_date, budget_total, budget_spent, progress_pct, tags) VALUES
        ('PP-001', 'WiseHandling → Colossal Avia Deployment',    'gtm',         'active',    'critical', 'amber', $1, '2026-02-23', '2026-12-31', 500000,  85000,  35, ARRAY['WiseHandling','Colossal','South Africa']),
        ('PP-002', 'ACSA Valet Parking App',                     'software',    'active',    'high',     'green', $1, '2026-03-01', '2026-06-30', 120000,  12000,  15, ARRAY['ACSA','Valet','Mobile']),
        ('PP-003', 'Counter Services Case Management',           'software',    'active',    'medium',   'green', $1, '2026-03-15', '2026-09-30', 200000,   5000,   8, ARRAY['Colossal','CaseManagement']),
        ('PP-004', 'DRC HMIS Digital Health Reporting Platform', 'jv',          'active',    'high',     'amber', $2, '2026-01-01', '2031-12-31', 9000000, 150000,  5, ARRAY['DRC','HMIS','DHIS2','Health']),
        ('PP-005', 'WiseTrax Air Cargo Messaging Hub',           'software',    'active',    'high',     'green', $2, '2026-03-07', '2026-12-31', 350000,  18000,  12, ARRAY['WiseTrax','Cargo','TypeB']),
        ('PP-006', 'iCAFFE e-Sanchit Marketing Campaign',        'marketing',   'active',    'medium',   'green', $1, '2026-03-01', '2026-06-30', 80000,   22000,  40, ARRAY['iCAFFE','Marketing','eSanchit']),
        ('PP-007', 'Hans-MPC Africa Partnership GTM',            'gtm',         'active',    'critical', 'green', $1, '2026-02-23', '2027-02-22', 250000,  42000,  20, ARRAY['MPC','Africa','GTM'])
      ON CONFLICT (code) DO NOTHING
      RETURNING id, code
    `, [adminId, techId]);

    const projMap = {};
    projects.rows.forEach(p => { projMap[p.code] = p.id; });

    // ── Project Members ───────────────────────────────────────────────
    if (projMap['PP-001'] && adminId && techId && charlesId) {
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role) VALUES
          ($1, $2, 'lead'), ($1, $3, 'member'), ($1, $4, 'partner')
        ON CONFLICT DO NOTHING
      `, [projMap['PP-001'], adminId, techId, charlesId]);
    }

    // ── Agreements ───────────────────────────────────────────────────
    if (mpcId && projMap['PP-007']) {
      await client.query(`
        INSERT INTO agreements (partner_id, project_id, type, status, signed_date, expiry_date, created_by) VALUES
          ($1, $2, 'Reseller Partnership Agreement', 'active', '2026-02-23', '2027-02-22', $3)
        ON CONFLICT DO NOTHING
      `, [mpcId, projMap['PP-007'], adminId]);
    }

    // ── Issues ───────────────────────────────────────────────────────
    if (projMap['PP-001']) {
      await client.query(`
        INSERT INTO issues (project_id, title, severity, status, reporter_id, assignee_id, sla_response_minutes, sla_resolve_hours) VALUES
          ($1, 'Data sovereignty review required for SA hosting', 'p2', 'in_progress', $2, $3, 60, 24),
          ($1, 'WiseHandling demo environment setup pending',      'p3', 'open',        $2, $3, 240, 72)
        ON CONFLICT DO NOTHING
      `, [projMap['PP-001'], adminId, techId]);
    }

    // ── Milestones ───────────────────────────────────────────────────
    if (projMap['PP-001']) {
      await client.query(`
        INSERT INTO milestones (project_id, name, status, due_date, sort_order) VALUES
          ($1, 'Hans-MPC Agreement Signed',       'completed', '2026-02-23', 1),
          ($1, 'GTM Presentation to Colossal',    'pending',   '2026-03-31', 2),
          ($1, 'Pilot Deployment Approved',        'pending',   '2026-06-30', 3),
          ($1, 'Go-Live: WiseHandling @ Colossal', 'pending',   '2026-12-31', 4)
        ON CONFLICT DO NOTHING
      `, [projMap['PP-001']]);
    }

    // ── GTM Project ──────────────────────────────────────────────────
    if (projMap['PP-007'] && mpcId) {
      await client.query(`
        INSERT INTO gtm_projects (project_id, market, product_line, phase, target_revenue, partner_id, launch_date) VALUES
          ($1, 'Sub-Saharan Africa', 'WiseHandling', 'execution', 2000000, $2, '2026-12-31')
        ON CONFLICT DO NOTHING
      `, [projMap['PP-007'], mpcId]);
    }

    // ── Joint Venture ────────────────────────────────────────────────
    if (projMap['PP-004']) {
      const jvRes = await client.query(`
        INSERT INTO joint_ventures (project_id, name, jv_type, jurisdiction, status, total_contract_value) VALUES
          ($1, 'Hans-MPC DRC HMIS JV', 'Services Joint Venture', 'DRC', 'negotiation', 9000000)
        ON CONFLICT DO NOTHING RETURNING id
      `, [projMap['PP-004']]);

      if (jvRes.rows.length && mpcId) {
        const jvId = jvRes.rows[0].id;
        await client.query(`
          INSERT INTO jv_parties (jv_id, party_name, role, equity_pct, is_internal) VALUES
            ($1, 'Hans Infomatic Pvt. Ltd.', 'operator',     60, true),
            ($1, 'MPC Marketing (Pty) Ltd.', 'non_operator', 40, false)
          ON CONFLICT DO NOTHING
        `, [jvId]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete — Hans Infomatic context loaded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
