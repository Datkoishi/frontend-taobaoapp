import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatDateShort, formatVnd, initialsFromText, orderStatusBadge } from './adminUtils.js';

function Icon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
  if (type === 'bell') {
    return (
      <svg {...common}>
        <path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'user') {
    return (
      <svg {...common}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'expand') {
    return (
      <svg {...common}>
        <path d="M14 3h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 14 21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 14v7H3V3h7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" opacity="0.35" />
      </svg>
    );
  }
  if (type === 'plus') {
    return (
      <svg {...common}>
        <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'eye') {
    return (
      <svg {...common}>
        <path
          d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (type === 'edit') {
    return (
      <svg {...common}>
        <path
          d="M12 20h9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

function LineChart({ points }) {
  const width = 640;
  const height = 200;
  const pad = 16;

  const max = Math.max(1, ...points);
  const min = Math.min(...points);
  const span = Math.max(1, max - min);

  const xStep = (width - pad * 2) / Math.max(1, points.length - 1);
  const toY = (v) => {
    const t = (v - min) / span;
    return pad + (1 - t) * (height - pad * 2);
  };

  const d = points
    .map((v, i) => {
      const x = pad + i * xStep;
      const y = toY(v);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const area = `${d} L ${pad + (points.length - 1) * xStep} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="admin-line-chart" preserveAspectRatio="none">
      <path d={area} fill="rgba(37, 99, 235, 0.08)" />
      <path d={d} stroke="#2563eb" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M ${pad} ${height - pad} L ${width - pad} ${height - pad}`} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  );
}

function dateKey(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminExecutiveDashboard() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const data = await api('/api/orders', {}, session);
      setOrders(data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const todayCompleted = orders.filter((o) => o.status === 'COMPLETED' && (o.updated_at ? new Date(o.updated_at).toDateString() : '').toString() === todayStr);

    const todayOrders = orders.filter((o) => (o.created_at ? new Date(o.created_at).toDateString() : '') === todayStr).length;
    const todayRevenue = todayCompleted.reduce((s, o) => s + (Number(o.revenue_vnd) || 0), 0);
    const todayProfit = todayCompleted.reduce((s, o) => s + (Number(o.profit_vnd) || 0), 0);
    const pendingOrders = orders.filter((o) => !['COMPLETED', 'FAILED'].includes(o.status)).length;

    return { todayOrders, todayRevenue, todayProfit, pendingOrders };
  }, [orders]);

  const last30 = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 29 * 24 * 3600 * 1000);
    const keys = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(from.getTime() + i * 24 * 3600 * 1000);
      keys.push(dateKey(d));
    }

    const revenueByKey = new Map();
    for (const k of keys) revenueByKey.set(k, 0);

    for (const o of orders) {
      if (o.status !== 'COMPLETED') continue;
      const k = o.updated_at ? dateKey(o.updated_at) : o.created_at ? dateKey(o.created_at) : null;
      if (!k || !revenueByKey.has(k)) continue;
      revenueByKey.set(k, (revenueByKey.get(k) || 0) + (Number(o.revenue_vnd) || 0));
    }

    return keys.map((k) => revenueByKey.get(k) || 0);
  }, [orders]);

  const recent = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 4);
  }, [orders]);

  const anyRevenue = last30.some((v) => v > 0);

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>Executive Architect</h1>
          <p style={{ marginTop: 2 }}>Order Management</p>
        </div>
        <div className="admin-top-search" style={{ justifyContent: 'flex-end' }}>
          <div className="admin-searchbar" style={{ maxWidth: 460 }}>
            <span style={{ color: '#64748b' }}>🔎</span>
            <input placeholder="Search orders, links, or customers..." disabled />
          </div>
          <button type="button" className="admin-icon-btn" aria-label="Notifications" style={{ marginLeft: 10 }}>
            <Icon type="bell" />
          </button>
          <button type="button" className="admin-icon-btn" aria-label="Profile" style={{ marginLeft: 10 }}>
            <Icon type="user" />
          </button>
          <button type="button" className="admin-icon-btn" aria-label="Expand" style={{ marginLeft: 10 }}>
            <Icon type="expand" />
          </button>
        </div>
      </div>

      {err && <div style={{ color: 'var(--danger)', fontWeight: 900, marginBottom: 10 }}>{err}</div>}

      <div className="admin-grid-3" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">TODAY&apos;S ORDERS</div>
              <div className="admin-stat-value">{stats.todayOrders}</div>
              <div className="admin-pill">▲ +12%</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#1d4ed8' }}>📦</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">TODAY&apos;S REVENUE (VND)</div>
              <div className="admin-stat-value">{formatVnd(stats.todayRevenue)}</div>
              <div className="admin-pill" style={{ background: '#ecfdf5', color: '#16a34a', borderColor: '#bbf7d0' }}>
                ▲ +8.4%
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#15803d' }}>₫</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">TODAY&apos;S PROFIT (VND)</div>
              <div className="admin-stat-value">{formatVnd(stats.todayProfit)}</div>
              <div className="admin-pill" style={{ background: '#fff7ed', color: '#9a3412', borderColor: '#fed7aa' }}>
                ▲ +5.1%
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#b45309' }}>📈</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">PENDING ORDERS</div>
              <div className="admin-stat-value">{stats.pendingOrders}</div>
              <div className="admin-pill" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }}>
                ▼ -2
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#b91c1c' }}>⏰</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.95fr', gap: 14, marginTop: 16 }}>
        <div className="admin-chart-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: 'var(--text)' }}>30-day Revenue Trend</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="admin-pill" style={{ padding: '6px 12px', background: '#eef2ff' }}>
                Revenue
              </span>
              <span style={{ color: 'var(--muted)', fontWeight: 900 }}>orders</span>
            </div>
          </div>
          <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
            {anyRevenue ? 'Total revenue performance across last month' : 'No revenue data yet'}
          </div>
          <LineChart points={last30} />
        </div>

        <div className="admin-insights">
          <h3 style={{ fontSize: '1.05rem' }}>Architect Insights</h3>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 800, lineHeight: 1.4 }}>
            Global logistics are running at 94% efficiency today. Shipping delays in Hanoi cluster resolved.
          </div>
          <div className="btn-row">
            <button type="button" className="ins-btn" onClick={() => alert('Export demo (UI)')}>Export Monthly Report</button>
            <button type="button" className="ins-btn" onClick={() => nav('/admin/staff')}>Manage Staff Shifts</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }} className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>Recent Orders</div>
          <Link to="/admin/orders" style={{ color: '#2563eb', fontWeight: 900, textDecoration: 'none' }}>
            View All Orders
          </Link>
        </div>

        <table className="admin-table" style={{ borderRadius: 14 }}>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => {
              const badge = orderStatusBadge(o.status);
              return (
                <tr key={o.id}>
                  <td style={{ fontWeight: 900, color: '#2563eb' }}>{o.code}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="admin-thumb" style={{ width: 34, height: 34, borderRadius: 999 }}>
                        {initialsFromText(o.customer_name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontWeight: 900 }}>{o.customer_name}</div>
                        <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.82rem' }}>{o.customer_phone}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 900 }}>{o.product_snapshot?.title || '—'}</td>
                  <td>
                    <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link className="admin-act-icon" to={`/orders/${o.id}`} aria-label="View">
                        <Icon type="eye" />
                      </Link>
                      <button type="button" className="admin-act-icon" aria-label="Edit" onClick={() => nav(`/orders/${o.id}`)}>
                        <Icon type="edit" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 18, color: 'var(--muted)', fontWeight: 800 }}>
                  Chưa có đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="admin-float-add"
        aria-label="Create new order"
        onClick={() => nav('/admin/create-order')}
      >
        <Icon type="plus" />
      </button>
    </div>
  );
}

