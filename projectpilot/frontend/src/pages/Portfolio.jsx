import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { HealthDot, ProgressBar, Badge, StatusBadge, Spinner, PageHeader, EmptyState } from '../components/ui';

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '', priority: '' });
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'software', priority: 'medium', description: '' });

  const load = () => {
    const params = new URLSearchParams(filters);
    api.get(`/api/projects?${params}`).then(r => { setProjects(r.data.projects); setLoading(false); });
  };
  useEffect(load, [filters]);

  const typeIcon = { gtm: '🚀', marketing: '📣', software: '💻', jv: '⚖', partnership: '🤝', custom: '⬡' };

  const createProject = async () => {
    await api.post('/api/projects', form);
    setShowNew(false);
    setForm({ code: '', name: '', type: 'software', priority: 'medium', description: '' });
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Project Portfolio"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => setShowNew(true)} className="btn-primary">+ New Project</button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { key: 'status', options: ['', 'active', 'draft', 'on_hold', 'completed'], label: 'Status' },
          { key: 'type', options: ['', 'gtm', 'marketing', 'software', 'jv', 'partnership'], label: 'Type' },
          { key: 'priority', options: ['', 'critical', 'high', 'medium', 'low'], label: 'Priority' },
        ].map(f => (
          <select
            key={f.key}
            value={filters[f.key]}
            onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
            className="input w-auto text-sm"
          >
            <option value="">All {f.label}</option>
            {f.options.filter(Boolean).map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon="🗂" title="No projects found" description="Create your first project to get started." action={<button onClick={() => setShowNew(true)} className="btn-primary">Create Project</button>} />
      ) : (
        <div className="grid gap-4">
          {projects.map(p => (
            <Link key={p.id} to={`/portfolio/${p.id}`} className="card p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-0.5">{typeIcon[p.type] || '⬡'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-gray-400">{p.code}</span>
                    <h3 className="font-semibold text-navy">{p.name}</h3>
                    <StatusBadge status={p.status} />
                    <Badge variant={p.priority === 'critical' ? 'red' : p.priority === 'high' ? 'orange' : 'gray'}>
                      {p.priority}
                    </Badge>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 truncate mb-2">{p.description}</p>}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <HealthDot health={p.health} />
                      <span className="text-xs text-gray-500 capitalize">{p.health}</span>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs text-gray-500">{p.progress_pct}%</span>
                      </div>
                      <ProgressBar value={p.progress_pct} />
                    </div>
                    {p.owner_name && (
                      <span className="text-xs text-gray-400">Owner: {p.owner_name}</span>
                    )}
                    {p.end_date && (
                      <span className="text-xs text-gray-400">
                        Due: {new Date(p.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-navy">Create New Project</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Project Code *</label>
                  <input className="input" placeholder="PP-008" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Type *</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['gtm', 'marketing', 'software', 'jv', 'partnership', 'custom'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Project Name *</label>
                <input className="input" placeholder="Enter project name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createProject} disabled={!form.code || !form.name} className="btn-primary flex-1 disabled:opacity-50">Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
