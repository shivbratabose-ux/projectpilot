import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Badge, StatusBadge, SeverityBadge, ProgressBar, HealthDot, Spinner, PageHeader, Avatar } from '../components/ui';

const tabs = ['Overview', 'Tasks', 'Milestones', 'Team'];

export default function ProjectDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [newTask, setNewTask] = useState({ title: '', priority: 'p3', due_date: '' });
  const [showTask, setShowTask] = useState(false);

  useEffect(() => {
    api.get(`/api/projects/${id}`).then(r => { setData(r.data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  if (!data) return <div className="p-6 text-red-500">Project not found.</div>;

  const { project: p, members, milestones, tasks } = data;

  const addTask = async () => {
    await api.post(`/api/projects/${id}/tasks`, newTask);
    const r = await api.get(`/api/projects/${id}`);
    setData(r.data);
    setShowTask(false);
    setNewTask({ title: '', priority: 'p3', due_date: '' });
  };

  const milestoneIcon = { completed: '✅', pending: '⭕', triggered: '⚡', overdue: '🔴', paid: '💰' };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-2">
        <Link to="/portfolio" className="text-xs text-teal hover:underline">← Portfolio</Link>
      </div>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-gray-400">{p.code}</span>
              <StatusBadge status={p.status} />
              <Badge variant={p.priority === 'critical' ? 'red' : p.priority === 'high' ? 'orange' : 'gray'}>{p.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-navy">{p.name}</h1>
            {p.description && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{p.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <HealthDot health={p.health} />
            <span className="text-sm text-gray-600 capitalize">{p.health} health</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Progress</p>
            <p className="text-xl font-bold text-navy">{p.progress_pct}%</p>
            <ProgressBar value={p.progress_pct} />
          </div>
          <div>
            <p className="text-xs text-gray-400">Budget</p>
            <p className="text-xl font-bold text-navy">
              {p.budget_total ? `₹${(p.budget_total/1000).toFixed(0)}K` : '—'}
            </p>
            {p.budget_spent > 0 && <p className="text-xs text-gray-400">₹{(p.budget_spent/1000).toFixed(0)}K spent</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400">Start Date</p>
            <p className="text-sm font-semibold text-navy">{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Target Date</p>
            <p className="text-sm font-semibold text-navy">{p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN') : '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'text-teal border-b-2 border-teal' : 'text-gray-500 hover:text-navy'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(p.tags || []).map(tag => <Badge key={tag} variant="teal">{tag}</Badge>)}
              {(!p.tags || !p.tags.length) && <span className="text-sm text-gray-400">No tags</span>}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Open tasks</span><span className="font-medium">{tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Completed tasks</span><span className="font-medium">{tasks.filter(t => t.status === 'done').length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Milestones</span><span className="font-medium">{milestones.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Team members</span><span className="font-medium">{members.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tab === 'Tasks' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowTask(true)} className="btn-primary">+ Add Task</button>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No tasks yet.</p>}
            {tasks.map(t => (
              <div key={t.id} className="card p-4 flex items-center gap-3">
                <span className="text-lg">{t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⭕'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{t.title}</p>
                  {t.assignee_name && <p className="text-xs text-gray-400">Assigned to {t.assignee_name}</p>}
                </div>
                <SeverityBadge severity={t.priority} />
                <StatusBadge status={t.status} />
                {t.due_date && <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(t.due_date).toLocaleDateString('en-IN')}</span>}
              </div>
            ))}
          </div>
          {showTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTask(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold text-navy mb-4">Add Task</h2>
                <div className="space-y-3">
                  <div><label className="label">Title *</label><input className="input" placeholder="Task title" value={newTask.title} onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))} /></div>
                  <div><label className="label">Priority</label>
                    <select className="input" value={newTask.priority} onChange={e => setNewTask(f => ({ ...f, priority: e.target.value }))}>
                      {['p1','p2','p3','p4'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Due Date</label><input type="date" className="input" value={newTask.due_date} onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))} /></div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowTask(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={addTask} disabled={!newTask.title} className="btn-primary flex-1 disabled:opacity-50">Add Task</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Milestones */}
      {tab === 'Milestones' && (
        <div className="space-y-3">
          {milestones.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No milestones defined.</p>}
          {milestones.map((m, i) => (
            <div key={m.id} className="card p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">{i + 1}</div>
              <div className="flex-1">
                <p className="font-medium text-navy">{m.name}</p>
                {m.due_date && <p className="text-xs text-gray-400">Due: {new Date(m.due_date).toLocaleDateString('en-IN')}</p>}
              </div>
              <span className="text-xl">{milestoneIcon[m.status] || '⭕'}</span>
              <StatusBadge status={m.status} />
              {m.amount && <span className="text-sm font-medium text-navy">₹{(m.amount/1000).toFixed(0)}K</span>}
            </div>
          ))}
        </div>
      )}

      {/* Team */}
      {tab === 'Team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map(m => (
            <div key={m.id} className="card p-4 flex items-center gap-3">
              <Avatar initials={m.avatar_initials || m.name?.slice(0, 2).toUpperCase()} />
              <div>
                <p className="font-medium text-navy text-sm">{m.name}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>
              <Badge variant="teal" className="ml-auto">{m.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
