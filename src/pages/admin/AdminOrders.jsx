import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatDateShort, formatVnd, initialsFromText, orderStatusBadge } from './adminUtils.js';

function Icon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
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
  if (type === 'check') {
    return (
      <svg {...common}>
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'trash') {
    return (
      <svg {...common}>
        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}

export default function AdminOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState(''); // UI filter
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

  const filtered = orders; // backend already filters by status

  const bottomStats = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const inRange = filtered.filter((o) => {
      if (!o.created_at) return false;
      const dt = new Date(o.created_at);
      return dt >= from && dt <= now;
    });

    const monthlyVolume = inRange.reduce((s, o) => s + (Number(o.sell_price_vnd) || 0), 0);
    const activeShipments = inRange.filter((o) => o.status === 'DELIVERING').length;

    const completed = inRange.filter((o) => o.status === 'COMPLETED').length;
    const failed = inRange.filter((o) => o.status === 'FAILED').length;
    const fulfillmentRate = completed + failed > 0 ? completed / (completed + failed) : 0;

    return { monthlyVolume, activeShipments, fulfillmentRate, completed, failed };
  }, [filtered]);

  const rows = filtered.slice(0, 6);

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>Order Management</h1>
          <p>Track and manage global logistics fulfillment and order status.</p>
        </div>
        <div className="admin-top-search" style={{ justifyContent: 'flex-end' }}>
          <div className="admin-searchbar" style={{ maxWidth: 420 }}>
            <span style={{ color: '#64748b' }}>🔎</span>
            <input placeholder="Search orders, customers..." disabled />
          </div>
        </div>
      </div>

      <div className="admin-filters-row" style={{ justifyContent: 'space-between' }}>
        <div className="admin-field" style={{ minWidth: 220 }}>
          <label>STATUS</label>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['NEW', 'DEPOSITED', 'ORDERED', 'SHIPPING_CN', 'SHIPPING_VN', 'IN_STOCK', 'DELIVERING', 'COMPLETED', 'FAILED'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field" style={{ minWidth: 260 }}>
          <label>DATE RANGE</label>
          <select className="admin-select" defaultValue="30d" disabled>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="admin-field" style={{ minWidth: 220 }}>
          <label>STAFF DROPDOWN</label>
          <select className="admin-select" defaultValue="all" disabled>
            <option>All Staff</option>
          </select>
        </div>
        <button type="button" className="admin-btn secondary" onClick={() => setStatus('')}>
          Reset Filters
        </button>
      </div>

      {err && <div style={{ color: 'var(--danger)', fontWeight: 900, marginBottom: 10 }}>{err}</div>}

      <div className="admin-table-wrap admin-card" style={{ padding: 0 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>QTY</th>
              <th>PRICE (VND)</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
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
            {!loading &&
              rows.map((o) => {
                const badge = orderStatusBadge(o.status);
                const title = o.product_snapshot?.title || '—';
                const customerName = o.customer_name || '—';
                const initials = initialsFromText(customerName);

                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900 }}>
                      <div>{o.code}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>{formatDateShort(o.created_at)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="admin-thumb" style={{ width: 36, height: 36, borderRadius: 999 }}>
                          {initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 900 }}>{customerName}</div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.82rem', fontWeight: 800 }}>{o.customer_phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 900 }}>{title}</td>
                    <td style={{ fontWeight: 900 }}>{o.quantity}</td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(o.sell_price_vnd)} ₫</td>
                    <td>
                      <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link className="admin-act-icon" to={`/orders/${o.id}`} aria-label="View">
                          <Icon type="eye" />
                        </Link>
                        <button type="button" className="admin-act-icon" aria-label="Confirm">
                          <Icon type="check" />
                        </button>
                        <button type="button" className="admin-act-icon danger" aria-label="Delete">
                          <Icon type="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 18, color: 'var(--muted)', fontWeight: 800 }}>
                  Không có đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.9rem' }}>
            Showing 1-{Math.min(6, filtered.length)} of {filtered.length} results
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

      <div className="admin-bottom-cards">
        <div className="admin-card">
          <div className="admin-small-muted">MONTHLY VOLUME</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, marginTop: 10, color: 'var(--accent)' }}>
            {formatVnd(bottomStats.monthlyVolume)} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>VND</span>
          </div>
          <div style={{ marginTop: 6, color: 'var(--success)', fontWeight: 900, fontSize: '0.9rem' }}>▲ +14.2% from last month</div>
        </div>
        <div className="admin-card">
          <div className="admin-small-muted">ACTIVE SHIPMENTS</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, marginTop: 10 }}>
            {bottomStats.activeShipments} <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Units</span>
          </div>
          <div style={{ marginTop: 6, color: 'var(--muted)', fontWeight: 900, fontSize: '0.9rem' }}>
            ● Average 2.4 days delay
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-small-muted">FULFILLMENT RATE</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, marginTop: 10 }}>
            {(bottomStats.fulfillmentRate * 100).toFixed(1)}%{' '}
          </div>
          <div style={{ marginTop: 6, color: '#0f766e', fontWeight: 900, fontSize: '0.9rem' }}>▲ Exceeding annual target</div>
        </div>
      </div>
    </div>
  );
}

