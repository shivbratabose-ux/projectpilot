-- ============================================================
-- ProjectPilot — PostgreSQL Schema
-- Hans Infomatic Pvt. Ltd.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS & AUTH ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin','manager','member','viewer')),
  avatar_initials VARCHAR(4),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PORTFOLIO / PROJECTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('gtm','marketing','software','jv','partnership','custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','on_hold','completed','cancelled')),
  priority VARCHAR(20) DEFAULT 'medium'
    CHECK (priority IN ('critical','high','medium','low')),
  health VARCHAR(20) DEFAULT 'green'
    CHECK (health IN ('green','amber','red')),
  owner_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  budget_total NUMERIC(15,2),
  budget_spent NUMERIC(15,2) DEFAULT 0,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ─── MILESTONES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending','triggered','paid','completed','overdue')),
  trigger_condition VARCHAR(255),
  responsible_party VARCHAR(255),
  amount NUMERIC(15,2),
  due_date DATE,
  completed_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TASKS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  priority VARCHAR(20) DEFAULT 'medium'
    CHECK (priority IN ('p1','p2','p3','p4')),
  assignee_id UUID REFERENCES users(id),
  reporter_id UUID REFERENCES users(id),
  due_date DATE,
  completed_date DATE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EPICS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS epics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('planned','active','completed','cancelled')),
  progress_pct INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PARTNERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50)
    CHECK (type IN ('reseller','technology','services','jv_candidate','client','supplier')),
  country VARCHAR(100),
  website VARCHAR(255),
  categories TEXT[],
  status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active','inactive','prospect','suspended')),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  secondary_contact_name VARCHAR(255),
  secondary_contact_email VARCHAR(255),
  secondary_contact_phone VARCHAR(50),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AGREEMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft','pending_signature','active','expired','terminated')),
  signed_date DATE,
  expiry_date DATE,
  document_url VARCHAR(500),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTION LOG ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  logged_by UUID REFERENCES users(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interaction_type VARCHAR(50)
    CHECK (interaction_type IN ('call','email','meeting','document','other')),
  notes TEXT,
  next_action TEXT,
  next_action_owner_id UUID REFERENCES users(id),
  next_action_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GTM PROJECTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gtm_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  market VARCHAR(255),
  product_line VARCHAR(255),
  phase VARCHAR(50) DEFAULT 'discovery'
    CHECK (phase IN ('discovery','planning','execution','launch','scale')),
  target_revenue NUMERIC(15,2),
  actual_revenue NUMERIC(15,2) DEFAULT 0,
  channel_strategy TEXT,
  partner_id UUID REFERENCES partners(id),
  launch_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MARKETING ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  gtm_project_id UUID REFERENCES gtm_projects(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft','active','on_hold','completed','cancelled')),
  owner_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  budget_allocated NUMERIC(15,2),
  budget_spent NUMERIC(15,2) DEFAULT 0,
  channel_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_type VARCHAR(50)
    CHECK (content_type IN ('blog_post','social','video','email','infographic','whitepaper','other')),
  status VARCHAR(50) DEFAULT 'brief'
    CHECK (status IN ('brief','draft','review','approved','published','archived')),
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  published_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── JOINT VENTURES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS joint_ventures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  jv_type VARCHAR(100),
  jurisdiction VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft'
    CHECK (status IN ('draft','negotiation','active','dissolved')),
  total_contract_value NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jv_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jv_id UUID REFERENCES joint_ventures(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  party_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('operator','non_operator','silent','lead')),
  equity_pct NUMERIC(5,2),
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ISSUES / SLA ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(10) NOT NULL DEFAULT 'p3'
    CHECK (severity IN ('p1','p2','p3','p4')),
  status VARCHAR(50) DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed','wont_fix')),
  assignee_id UUID REFERENCES users(id),
  reporter_id UUID REFERENCES users(id),
  sla_response_minutes INTEGER,
  sla_resolve_hours INTEGER,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  affected_object VARCHAR(255),
  ip_address INET,
  status VARCHAR(20) DEFAULT 'success'
    CHECK (status IN ('success','failed','warning')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  body TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agreements_partner ON agreements(partner_id);
CREATE INDEX IF NOT EXISTS idx_agreements_expiry ON agreements(expiry_date);
CREATE INDEX IF NOT EXISTS idx_action_logs_project ON action_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
