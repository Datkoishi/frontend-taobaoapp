import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';

function Icon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M4 13h6V4H4v9Z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 20h6V11h-6v9Z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 4h6v5h-6V4Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'orders':
      return (
        <svg {...common}>
          <path
            d="M7 4h10l2 4v12H5V8l2-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'purchase':
      return (
        <svg {...common}>
          <path
            d="M7 7h10v14H7V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" />
          <path d="M10 12h4" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'shipping':
      return (
        <svg {...common}>
          <path
            d="M3 7h13v10H3V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M16 10h5l-2 4h-3v-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M7 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
          <path d="M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
        </svg>
      );
    case 'finance':
      return (
        <svg {...common}>
          <path d="M4 19V5" stroke="currentColor" strokeWidth="2" />
          <path d="M20 19V5" stroke="currentColor" strokeWidth="2" />
          <path d="M7 8h10" stroke="currentColor" strokeWidth="2" />
          <path d="M7 12h10" stroke="currentColor" strokeWidth="2" />
          <path d="M7 16h10" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...common}>
          <path
            d="M6 2h9l3 3v17H6V2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M15 2v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" />
          <path d="M8 16h6" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'staff':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
          <path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
          <path d="M17 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06-1.5 2.6-0.08-.03a1.8 1.8 0 0 0-2 .35 1.8 1.8 0 0 0-.55 1.93V23H9.3v-.1a1.8 1.8 0 0 0-.55-1.93 1.8 1.8 0 0 0-2-.35l-.08.03-1.5-2.6.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-1.87-.33l-.1.04V10.3l.1.04A1.7 1.7 0 0 0 5.6 10a1.7 1.7 0 0 0-.33-1.87l-.06-.06 1.5-2.6.08.03a1.8 1.8 0 0 0 2-.35 1.8 1.8 0 0 0 .55-1.93V1h5.4v.1a1.8 1.8 0 0 0 .55 1.93 1.8 1.8 0 0 0 2 .35l.08-.03 1.5 2.6-.06.06A1.7 1.7 0 0 0 19.4 10c.43.44.56 1.07.33 1.87l-.04.1h.1V14.7l-.1-.04c-.34-.13-.7-.17-1.07-.07Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.2"
          />
        </svg>
      );
    default:
      return null;
  }
}

function initialsFromName(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const a = parts[0][0] || 'U';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export default function AdminLayout({ children, activePath }) {
  const { profile } = useAuth();

  const userInitials = useMemo(() => initialsFromName(profile?.full_name), [profile]);

  const nav = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/orders', label: 'Orders', icon: 'orders' },
    { path: '/admin/purchase', label: 'Purchase', icon: 'purchase' },
    { path: '/admin/shipping', label: 'Shipping', icon: 'shipping' },
    { path: '/admin/finance', label: 'Finance', icon: 'finance' },
    { path: '/admin/reports', label: 'Reports', icon: 'reports' },
    { path: '/admin/staff', label: 'Staff', icon: 'staff' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="admin-theme">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <div className="admin-brand-title">ExecOrder</div>
            <div className="admin-brand-sub">OMS PORTAL</div>
          </div>

          <nav className="admin-nav" aria-label="Admin navigation">
            {nav.map((it) => (
              <NavLink
                key={it.path}
                to={it.path}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon name={it.icon} />
                {it.label}
              </NavLink>
            ))}
          </nav>

          <div className="admin-footer-user">
            <div className="admin-avatar">{userInitials}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontWeight: 900, color: 'var(--text)', fontSize: '0.9rem' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.78rem' }}>Admin User Profile</div>
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}

