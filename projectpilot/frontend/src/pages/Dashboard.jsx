import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { StatCard, HealthDot, ProgressBar, StatusBadge, SeverityBadge, Spinner } from '../components/ui';
import useAuthStore from '../stores/authStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>;

  const ps = data?.project_stats || {};
  const is = data?.issue_stats || {};
  const myTasks = data?.my_tasks || [];
  const activity = data?.recent_activity || [];

  const chartData = [
    { name: 'Active',    value: +ps.active || 0, fill: '#0E7F8C' },
    { name: 'At Risk',   value: +ps.at_risk || 0, fill: '#E8523A' },
    { name: 'Amber',     value: +ps.amber || 0, fill: '#F79009' },
    { name: 'Completed', value: +ps.completed || 0, fill: '#12B76A' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Projects" value={ps.total || 0} icon="🗂" />
        <StatCard label="Active Projects" value={ps.active || 0} icon="🚀" color="teal" />
        <StatCard label="Open Issues" value={is.open_issues || 0} icon="🔴" color="red" sub={`${is.p1_open || 0} P1 critical`} />
        <StatCard label="At Risk" value={ps.at_risk || 0} icon="⚠" color="amber" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Project health chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Project Portfolio Health</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Projects']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My Tasks */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy">My Open Tasks</h3>
            <Link to="/portfolio" className="text-xs text-teal hover:underline">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No open tasks assigned to you.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-brand-gray">
                  <span className="text-base">{t.status === 'in_progress' ? '🔄' : '⭕'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.project_name}</p>
                  </div>
                  <SeverityBadge severity={t.priority} />
                  {t.due_date && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(t.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy">Recent Activity</h3>
            <Link to="/audit" className="text-xs text-teal hover:underline">Full audit log →</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.slice(0, 8).map(a => (
                <div key={a.id} className="py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-xs font-semibold text-navy">
                    {(a.user_name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy">
                      <span className="font-medium">{a.user_name || 'System'}</span>
                      {' · '}
                      <span className="text-gray-600">{a.action_type}</span>
                      {a.affected_object && <span className="text-gray-400"> on {a.affected_object}</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
