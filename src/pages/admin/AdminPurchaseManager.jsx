import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  if (type === 'help') {
    return (
      <svg {...common}>
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="currentColor" strokeWidth="2" />
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
  return null;
}

function importVnd(order) {
  const qty = Number(order.quantity) || 1;
  const cny = Number(order.buy_price_cny) || 0;
  const rate = Number(order.exchange_rate) || 0;
  return Math.round(cny * rate * qty);
}

export default function AdminPurchaseManager() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await api(`/api/orders${q}`, {}, session);
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
  }, [status, session]);

  const stats = useMemo(() => {
    const totalPurchases = orders.reduce((s, o) => s + importVnd(o), 0);
    const pending = orders.filter((o) => !['COMPLETED', 'FAILED'].includes(o.status));
    const pendingCount = pending.length;

    const today = new Date();
    const todayStr = today.toDateString();
    const paidToday = orders.reduce((s, o) => {
      const created = o.created_at ? new Date(o.created_at).toDateString() : '';
      if (created !== todayStr) return s;
      return s + (Number(o.deposit_vnd) || 0);
    }, 0);

    return { totalPurchases, pendingCount, paidToday };
  }, [orders]);

  const rows = orders.slice(0, 10);

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>Purchase Manager</h1>
          <p>Purchase management</p>
        </div>

        <div className="admin-top-search" style={{ justifyContent: 'flex-end' }}>
          <div className="admin-searchbar" style={{ marginRight: 12 }}>
            <span style={{ color: '#64748b' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input placeholder="Search across orders, sources, or tracking numbers..." disabled />
          </div>
          <button type="button" className="admin-icon-btn" aria-label="Notifications">
            <Icon type="bell" />
          </button>
          <button type="button" className="admin-icon-btn" aria-label="Help" style={{ marginLeft: 8 }}>
            <Icon type="help" />
          </button>
          <button
            type="button"
            className="admin-btn"
            style={{ marginLeft: 12 }}
            onClick={() => nav('/admin/create-order')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Icon type="plus" /> Add Purchase Details
            </span>
          </button>
        </div>
      </div>

      <div className="admin-grid-3">
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">TOTAL PURCHASES</div>
              <div className="admin-stat-value">¥{formatVnd(stats.totalPurchases)}</div>
              <div className="admin-pill">+12.5% from last month</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#2563eb' }}>💰</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">PENDING ORDERS</div>
              <div className="admin-stat-value">{stats.pendingCount}</div>
              <div className="muted" style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.85rem' }}>
                {stats.pendingCount > 0 ? `${Math.max(1, Math.round(stats.pendingCount * 0.2))} urgent actions required` : 'No urgent actions'}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#92400e' }}>⏳</span>
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-stat-card">
            <div className="admin-stat-left">
              <div className="admin-stat-label">PAID TODAY</div>
              <div className="admin-stat-value">¥{formatVnd(stats.paidToday)}</div>
              <div className="muted" style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.85rem' }}>
                {stats.paidToday > 0 ? `${Math.min(9, Math.max(1, Math.round(stats.paidToday / 1000000)))} successful transactions` : '0 transactions'}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, color: '#15803d' }}>✅</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-filters-row">
        <div className="admin-field" style={{ minWidth: 210 }}>
          <label>SOURCE PLATFORM</label>
          <select className="admin-select" defaultValue="all" disabled>
            <option value="all">All Sources</option>
          </select>
        </div>
        <div className="admin-field" style={{ minWidth: 260 }}>
          <label>DATE RANGE</label>
          <select className="admin-select" defaultValue="30d" disabled>
            <option value="oct">Oct 01, 2023 - Oct 24, 2023</option>
          </select>
        </div>
        <div className="admin-field" style={{ minWidth: 210 }}>
          <label>STATUS</label>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            {['NEW', 'DEPOSITED', 'ORDERED', 'SHIPPING_CN', 'SHIPPING_VN', 'IN_STOCK', 'DELIVERING', 'COMPLETED', 'FAILED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="admin-btn secondary" onClick={() => setStatus('')}>
          Clear Filters
        </button>
      </div>

      {err && <div style={{ color: 'var(--danger)', fontWeight: 800, marginBottom: 10 }}>{err}</div>}

      <div className="admin-table-wrap admin-card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>PRODUCT</th>
              <th>SOURCE</th>
              <th>PRICE (VND)</th>
              <th>PURCHASE DATE</th>
              <th>CN TRACKING</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: 18, color: 'var(--muted)', fontWeight: 800 }}>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 18, color: 'var(--muted)', fontWeight: 800 }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((o) => {
                const badge = orderStatusBadge(o.status);
                const title = o.product_snapshot?.title || '—';
                let source = o.purchase_source || '—';
                if (!source && o.taobao_link) {
                  try {
                    source = new URL(o.taobao_link).hostname;
                  } catch {
                    source = '—';
                  }
                }
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900, color: '#2563eb' }}>{o.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="admin-thumb">{initialsFromText(title)}</div>
                        <div className="admin-order-cell">
                          <div style={{ fontWeight: 900 }}>{title}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                            {o.product_snapshot?.note ? o.product_snapshot.note : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{source}</td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(o.sell_price_vnd)} ₫</td>
                    <td>{formatDateShort(o.created_at)}</td>
                    <td>
                      {o.tracking_cn ? (
                        <span style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', fontWeight: 900 }}>
                          {o.tracking_cn}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.9rem' }}>
            Showing 1-10 of {orders.length} orders
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" className="admin-icon-btn" aria-label="Prev">
              ‹
            </button>
            <button type="button" className="admin-btn secondary" style={{ padding: '8px 14px', borderRadius: 12, background: 'var(--accent)', color: '#fff', border: 'none' }}>
              1
            </button>
            <button type="button" className="admin-btn secondary" style={{ padding: '8px 14px', borderRadius: 12 }}>
              2
            </button>
            <button type="button" className="admin-btn secondary" style={{ padding: '8px 14px', borderRadius: 12 }}>
              3
            </button>
            <span style={{ color: 'var(--muted)', fontWeight: 900 }}>…</span>
            <button type="button" className="admin-icon-btn" aria-label="Next">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

