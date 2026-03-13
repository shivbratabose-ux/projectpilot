import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
      { to: '/portfolio', icon: '🗂', label: 'Portfolio' },
    ]
  },
  {
    label: 'Execution',
    items: [
      { to: '/gtm', icon: '🚀', label: 'GTM Projects' },
      { to: '/marketing', icon: '📣', label: 'Marketing' },
      { to: '/issues', icon: '🔴', label: 'Issues & SLA' },
    ]
  },
  {
    label: 'Relationships',
    items: [
      { to: '/partners', icon: '🤝', label: 'Partners' },
      { to: '/jv', icon: '⚖', label: 'Joint Ventures' },
    ]
  },
  {
    label: 'Admin',
    items: [
      { to: '/audit', icon: '🔒', label: 'Audit Log' },
      { to: '/settings', icon: '⚙', label: 'Settings' },
    ]
  }
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <div>
            <div className="text-sm font-bold text-navy leading-tight">ProjectPilot</div>
            <div className="text-[10px] text-gray-400">Hans Infomatic</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-teal/10 text-teal font-medium'
                        : 'text-gray-600 hover:bg-brand-gray hover:text-navy'
                    }`
                  }
                >
                  <span className="text-base w-4 text-center">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* SLA Health Anchor — always visible at bottom */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase">SLA Health</p>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-brand-green" />
          <span className="text-xs text-gray-600">All systems nominal</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div className="bg-brand-green h-1 rounded-full" style={{ width: '92%' }} />
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">92% SLA compliance</p>
      </div>

      {/* User / Logout */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-semibold">
            {user?.avatarInitials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-navy truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-orange text-sm">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
