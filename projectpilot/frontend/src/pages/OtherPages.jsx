import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Badge, StatusBadge, SeverityBadge, Spinner, PageHeader, EmptyState, StatCard } from '../components/ui';

// ─── Issues Page ─────────────────────────────────────────────────────────────
export function Issues() {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', severity: 'p3', description: '' });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/issues' + (filter ? `?severity=${filter}` : '')),
      api.get('/api/issues/stats/sla'),
      api.get('/api/projects')
    ]).then(([i, s, p]) => {
      setIssues(i.data.issues);
      setStats(s.data.stats);
      setProjects(p.data.projects);
      setLoading(false);
    });
  }, [filter]);

  const create = async () => {
    await api.post('/api/issues', form);
    setShowNew(false);
    setForm({ title: '', severity: 'p3', description: '' });
    const r = await api.get('/api/issues');
    setIssues(r.data.issues);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Issues & SLA" subtitle="Track and resolve operational issues"
        actions={<button onClick={() => setShowNew(true)} className="btn-primary">+ Log Issue</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Issues" value={stats.open_count || 0} icon="🔴" color="red" />
        <StatCard label="P1 Critical" value={stats.p1_open || 0} icon="⚡" color="red" />
        <StatCard label="P2 High" value={stats.p2_open || 0} icon="⚠" color="amber" />
        <StatCard label="Avg. Resolve Time" value={`${stats.avg_resolve_hours || '—'}h`} icon="⏱" color="teal" />
      </div>

      {/* SLA Health Bar */}
      <div className="card p-4 mb-5 flex items-center gap-4">
        <span className="text-sm font-medium text-navy">SLA Health</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className="bg-brand-green h-2 rounded-full" style={{ width: '92%' }} />
        </div>
        <span className="text-sm font-semibold text-brand-green">92%</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {['', 'p1', 'p2', 'p3', 'p4'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${filter === s ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-navy'}`}>
            {s ? s.toUpperCase() : 'All'}
          </button>
        ))}
      </div>

      {issues.length === 0 ? (
        <EmptyState icon="✅" title="No issues" description="All clear — no issues match this filter." />
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <div key={issue.id} className="card p-4 flex items-start gap-3">
              <SeverityBadge severity={issue.severity} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-navy">{issue.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  {issue.project_name && <span>📁 {issue.project_name}</span>}
                  {issue.assignee_name && <span>👤 {issue.assignee_name}</span>}
                  <span>{new Date(issue.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <StatusBadge status={issue.status} />
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-navy">Log New Issue</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Issue summary" /></div>
              <div><label className="label">Severity</label>
                <select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                  {['p1','p2','p3','p4'].map(s => <option key={s} value={s}>{s.toUpperCase()} — {s==='p1'?'Critical':s==='p2'?'High':s==='p3'?'Medium':'Low'}</option>)}
                </select>
              </div>
              <div><label className="label">Project</label>
                <select className="input" value={form.project_id || ''} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                  <option value="">— Select project —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details..." /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={create} disabled={!form.title} className="btn-primary flex-1 disabled:opacity-50">Log Issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GTM Page ─────────────────────────────────────────────────────────────────
export function GTM() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/gtm').then(r => { setItems(r.data.gtm_projects); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  const phaseColors = { discovery: 'gray', planning: 'navy', execution: 'amber', launch: 'teal', scale: 'green' };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="GTM Projects" subtitle="Go-to-market execution tracker" />
      {items.length === 0 ? (
        <EmptyState icon="🚀" title="No GTM projects" description="GTM projects will appear here once linked from Portfolio." />
      ) : (
        <div className="grid gap-4">
          {items.map(g => (
            <div key={g.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-navy">{g.project_name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {g.market && <Badge variant="gray">📍 {g.market}</Badge>}
                    {g.product_line && <Badge variant="teal">{g.product_line}</Badge>}
                    {g.partner_name && <Badge variant="navy">🤝 {g.partner_name}</Badge>}
                    <Badge variant={phaseColors[g.phase] || 'gray'}>{g.phase}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  {g.target_revenue && <p className="text-lg font-bold text-navy">₹{(g.target_revenue/100000).toFixed(1)}L target</p>}
                  {g.actual_revenue > 0 && <p className="text-xs text-gray-400">₹{(g.actual_revenue/100000).toFixed(1)}L actual</p>}
                </div>
              </div>
              {g.launch_date && (
                <p className="text-xs text-gray-400 mt-2">Launch: {new Date(g.launch_date).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── JV Page ──────────────────────────────────────────────────────────────────
export function JV() {
  const [jvs, setJvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/jv').then(r => { setJvs(r.data.joint_ventures); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Joint Ventures" subtitle="JV structure, equity, and milestones" />
      {jvs.length === 0 ? (
        <EmptyState icon="⚖" title="No joint ventures" description="JV records will appear here." />
      ) : (
        <div className="grid gap-4">
          {jvs.map(j => (
            <div key={j.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-navy text-lg">{j.name}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {j.jv_type && <Badge variant="navy">{j.jv_type}</Badge>}
                    {j.jurisdiction && <Badge variant="gray">📍 {j.jurisdiction}</Badge>}
                    <StatusBadge status={j.status} />
                  </div>
                </div>
                {j.total_contract_value && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Contract Value</p>
                    <p className="text-xl font-bold text-navy">${(j.total_contract_value/1000000).toFixed(1)}M</p>
                  </div>
                )}
              </div>
              {j.parties && j.parties.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Equity Structure</p>
                  <div className="flex gap-3 flex-wrap">
                    {j.parties.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-brand-gray rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium text-navy">{p.party_name}</span>
                        <span className="text-sm font-bold text-teal">{p.equity_pct}%</span>
                        <Badge variant="gray">{p.role}</Badge>
                      </div>
                    ))}
                  </div>
                  {/* Equity bar */}
                  <div className="mt-3 h-2 rounded-full overflow-hidden flex">
                    {j.parties.map((p, i) => {
                      const colors = ['bg-navy', 'bg-teal', 'bg-orange', 'bg-brand-amber'];
                      return <div key={p.id} className={`${colors[i % colors.length]} h-full`} style={{ width: `${p.equity_pct}%` }} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Marketing Page ───────────────────────────────────────────────────────────
export function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/campaigns').then(r => { setCampaigns(r.data.campaigns); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Marketing" subtitle="Campaigns, content pipeline, and budgets" />
      {campaigns.length === 0 ? (
        <EmptyState icon="📣" title="No campaigns" description="Marketing campaigns will appear here." />
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-navy">{c.name}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <StatusBadge status={c.status} />
                    {c.type && <Badge variant="teal">{c.type}</Badge>}
                    {c.owner_name && <span className="text-xs text-gray-400">👤 {c.owner_name}</span>}
                  </div>
                </div>
                {c.budget_allocated && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="text-lg font-bold text-navy">₹{(c.budget_allocated/1000).toFixed(0)}K</p>
                    {c.budget_spent > 0 && <p className="text-xs text-gray-400">₹{(c.budget_spent/1000).toFixed(0)}K spent</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Audit Log Page ───────────────────────────────────────────────────────────
export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/audit').then(r => { setLogs(r.data.logs); setLoading(false); });
  }, []);

  const actionColors = {
    SECURITY_ALERT: 'red', DELETE: 'orange', UPDATE: 'amber',
    LOGIN: 'gray', LOGOUT: 'gray', BACKUP: 'navy', CREATE: 'green'
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Audit Log" subtitle="System activity and security events" />
      <div className="card">
        <div className="px-4 py-2 bg-navy/5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs font-semibold text-navy uppercase tracking-wider">INTERNAL USE ONLY</span>
          <span className="text-xs bg-navy text-white px-2 py-0.5 rounded">🔒 Admin</span>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No audit events recorded yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(l => (
              <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                <Badge variant={actionColors[l.action_type] || 'gray'}>{l.action_type}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy">{l.affected_object || '—'}</p>
                  {l.user_name && <p className="text-xs text-gray-400">by {l.user_name}</p>}
                </div>
                <Badge variant={l.status === 'success' ? 'green' : l.status === 'failed' ? 'red' : 'amber'}>{l.status}</Badge>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function Settings() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Platform configuration and preferences" />
      <div className="space-y-4">
        {[
          { icon: '👤', title: 'User Management', desc: 'Manage team members, roles, and permissions' },
          { icon: '🎨', title: 'Branding & Themes', desc: 'Customise colours, logos, and display preferences' },
          { icon: '🔔', title: 'Notifications', desc: 'Configure alert rules and escalation thresholds' },
          { icon: '🔗', title: 'Integrations', desc: 'ERP, email, and third-party system connections' },
          { icon: '📦', title: 'Project Templates', desc: 'Manage reusable project and task templates' },
          { icon: '🗄', title: 'Data & Retention', desc: 'Audit log retention, backup schedule, and export' },
        ].map(s => (
          <div key={s.title} className="card p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-semibold text-navy">{s.title}</p>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
            <span className="ml-auto text-gray-300">→</span>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 bg-brand-gray rounded-xl text-sm text-gray-500">
        <p className="font-medium text-navy mb-1">ProjectPilot v1.0.0</p>
        <p>© {new Date().getFullYear()} Hans Infomatic Pvt. Ltd. · Built with care.</p>
      </div>
    </div>
  );
}
