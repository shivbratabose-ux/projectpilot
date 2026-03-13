// Shared reusable components for ProjectPilot

export function Avatar({ initials, size = 'sm', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-teal text-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

export function Badge({ children, variant = 'gray' }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    navy: 'bg-blue-100 text-blue-800',
    teal: 'bg-teal/10 text-teal',
    orange: 'bg-orange/10 text-orange',
    p1: 'bg-red-100 text-red-700',
    p2: 'bg-orange-100 text-orange-700',
    p3: 'bg-amber-100 text-amber-700',
    p4: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.gray}`}>
      {children}
    </span>
  );
}

export function HealthDot({ health }) {
  const colors = { green: 'bg-brand-green', amber: 'bg-brand-amber', red: 'bg-orange' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[health] || 'bg-gray-300'}`} />;
}

export function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  let barColor = color;
  if (!barColor) {
    if (pct < 40) barColor = 'bg-orange';
    else if (pct < 75) barColor = 'bg-brand-amber';
    else barColor = 'bg-brand-green';
  }
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-teal w-6 h-6 ${className}`} />
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon || '📭'}</div>
      <h3 className="text-lg font-semibold text-navy mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} mx-4 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color = 'navy' }) {
  const colors = { navy: 'text-navy', teal: 'text-teal', green: 'text-brand-green', amber: 'text-brand-amber', red: 'text-orange' };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

export function SeverityBadge({ severity }) {
  const map = { p1: ['P1 Critical', 'p1'], p2: ['P2 High', 'p2'], p3: ['P3 Medium', 'p3'], p4: ['P4 Low', 'p4'] };
  const [label, variant] = map[severity] || ['Unknown', 'gray'];
  return <Badge variant={variant}>{label}</Badge>;
}

export function StatusBadge({ status }) {
  const map = {
    active: ['Active', 'green'], draft: ['Draft', 'gray'], completed: ['Completed', 'blue'],
    on_hold: ['On Hold', 'amber'], cancelled: ['Cancelled', 'red'],
    open: ['Open', 'red'], in_progress: ['In Progress', 'amber'], resolved: ['Resolved', 'green'],
    todo: ['Todo', 'gray'], review: ['Review', 'amber'], done: ['Done', 'green'],
    pending: ['Pending', 'gray'], triggered: ['Triggered', 'amber'], paid: ['Paid', 'green'],
  };
  const [label, variant] = map[status] || [status, 'gray'];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
