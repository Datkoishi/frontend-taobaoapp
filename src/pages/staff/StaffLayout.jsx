import { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.jsx';
import { initialsFromText } from './staffUtils.js';

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

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
          <path d="M7 4h10l2 4v12H5V8l2-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'purchase':
      return (
        <svg {...common}>
          <path d="M7 7h10v14H7V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 12h4" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'shipping':
      return (
        <svg {...common}>
          <path d="M3 7h13v10H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
          <path d="M6 2h9l3 3v17H6V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
            d="M19.4 15a1.7 1.7 0 0 0 .33 1.87l.06.06-1.5 2.6-.08-.03a1.8 1.8 0 0 0-2 .35 1.8 1.8 0 0 0-.55 1.93V23H9.3v-.1a1.8 1.8 0 0 0-.55-1.93 1.8 1.8 0 0 0-2-.35l-.08.03-1.5-2.6.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-1.87-.33l-.1.04V10.3l.1.04A1.7 1.7 0 0 0 5.6 10a1.7 1.7 0 0 0-.33-1.87l-.06-.06 1.5-2.6.08.03a1.8 1.8 0 0 0 2-.35 1.8 1.8 0 0 0 .55-1.93V1h5.4v.1a1.8 1.8 0 0 0 .55 1.93 1.8 1.8 0 0 0 2 .35l.08-.03 1.5 2.6-.06.06A1.7 1.7 0 0 0 19.4 10c.43.44.56 1.07.33 1.87l-.04.1h.1V14.7l-.1-.04c-.34-.13-.7-.17-1.07-.07Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity="0.35"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function StaffLayout({ children }) {
  const { profile, supabase } = useAuth();
  const location = useLocation();
  const nav = useNavigate();

  const menu = useMemo(
    () => [
      { to: '/staff', label: 'Dashboard', icon: 'dashboard' },
      { to: '/staff/orders', label: 'Orders', icon: 'orders' },
      { to: '/staff/purchase', label: 'Purchase', icon: 'purchase' },
      { to: '/staff/shipping', label: 'Shipping', icon: 'shipping' },
      { to: '/staff/finance', label: 'Finance', icon: 'finance' },
      { to: '/staff/reports', label: 'Reports', icon: 'reports' },
      { to: '/staff/staff', label: 'Staff', icon: 'staff' },
      { to: '/staff/settings', label: 'Settings', icon: 'settings' },
    ],
    []
  );

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    nav('/login');
  }

  const initials = initialsFromText(profile?.full_name || profile?.id || 'U');

  return (
    <div className="staff-theme">
      <div className="staff-shell">
        <aside className="staff-sidebar">
          <div className="staff-brand">
            <div className="staff-brand-title">LogisticsOS</div>
            <div className="staff-brand-sub">Enterprise Global</div>
          </div>

          <nav className="staff-nav">
            {menu.map((it) => {
              const isActive = location.pathname === it.to || location.pathname.startsWith(`${it.to}/`);
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={`staff-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon name={it.icon} />
                  <span>{it.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="staff-logout" style={{ marginTop: 'auto' }}>
            <button type="button" className="staff-logout-btn" onClick={signOut}>
              <span style={{ fontWeight: 900 }}>↩</span> Logout
            </button>
          </div>
        </aside>

        <div className="staff-main">
          <header className="staff-topbar">
            <div className="staff-page-title" />
            <div className="staff-top-search">
              <input placeholder="Search tracking ID or origin..." disabled />
            </div>
            <div className="staff-top-icons">
              <button type="button" className="staff-icon-btn" aria-label="Notifications">
                🔔
              </button>
              <button type="button" className="staff-icon-btn" aria-label="Help">
                ?
              </button>
              <div className="staff-user">
                <div className="staff-user-avatar">{initials}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>{profile?.full_name || 'User'}</div>
                  <div style={{ color: 'var(--staff-muted)', fontWeight: 800, fontSize: '0.72rem' }}>
                    {profile?.role || 'staff'}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="staff-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

