import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import {
  formatDateShort,
  formatVnd,
  getStatusBadge,
  importVnd,
  initialsFromText,
} from './staffUtils.js';

function TabButton({ active, label, onClick }) {
  return (
    <button type="button" className={`staff-tab ${active ? 'active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default function StaffOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const tabToStatus = useMemo(
    () => ({
      ALL: '',
      NEW: 'NEW',
      DEPOSITED: 'DEPOSITED',
      ORDERED: 'ORDERED',
      SHIPPING: 'DELIVERING',
      COMPLETED: 'COMPLETED',
    }),
    []
  );

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const status = tabToStatus[tab] || '';
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
  }, [tab, session]);

  const monthMetrics = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const inMonth = completed.filter((o) => {
      const dt = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
      return dt >= start && dt < next;
    });

    const revenue = inMonth.reduce((s, o) => s + (Number(o.sell_price_vnd) || 0), 0);
    const profit = inMonth.reduce((s, o) => s + (Number(o.profit_vnd) || 0), 0);

    const target = Math.max(1, Math.round(revenue * 1.4)); // just for UI
    const progress = Math.min(1, revenue / target);

    return { revenue, profit, progress };
  }, [orders]);

  const newOrders = useMemo(() => {
    const now = Date.now();
    const from = now - 7 * 24 * 3600 * 1000;
    return orders.filter((o) => (o.created_at ? new Date(o.created_at).getTime() : 0) >= from).length;
  }, [orders]);

  const rows = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);
  }, [orders]);

  return (
    <div className="staff-page">
      <div className="staff-page-header staff-page-header--flat">
        <div>
          <div className="staff-h1">Quản lý đơn hàng</div>
          <div className="staff-sub">Theo dõi và vận hành quy trình bán hàng hiệu quả.</div>
        </div>

        <div className="staff-orders-actions">
          <button type="button" className="staff-btn-light">Export</button>
          <button type="button" className="staff-btn-primary" onClick={() => (window.location.href = '/staff/orders/new')}>
            + Tạo đơn
          </button>
        </div>
      </div>

      <div className="staff-orders-filters">
        <div className="staff-filter-item">
          <label>TRẠNG THÁI</label>
          <select className="staff-select staff-select--pill" defaultValue="ALL" disabled>
            <option>Tất cả trạng thái</option>
          </select>
        </div>
        <div className="staff-filter-item">
          <label>NGÀY TẠO</label>
          <select className="staff-select staff-select--pill" defaultValue="30d" disabled>
            <option>Toàn thời gian</option>
          </select>
        </div>
        <div className="staff-filter-item">
          <label>NHÂN VIÊN</label>
          <select className="staff-select staff-select--pill" defaultValue="all" disabled>
            <option>Tất cả nhân viên</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" className="staff-clear-icon">⟲</button>
        </div>
      </div>

      <div className="staff-tabs">
        <TabButton active={tab === 'ALL'} label="Tất cả" onClick={() => setTab('ALL')} />
        <TabButton active={tab === 'NEW'} label="Mới" onClick={() => setTab('NEW')} />
        <TabButton active={tab === 'DEPOSITED'} label="Đã cọc" onClick={() => setTab('DEPOSITED')} />
        <TabButton active={tab === 'ORDERED'} label="Đã đặt" onClick={() => setTab('ORDERED')} />
        <TabButton active={tab === 'SHIPPING'} label="Đang ship" onClick={() => setTab('SHIPPING')} />
        <TabButton active={tab === 'COMPLETED'} label="Hoàn thành" onClick={() => setTab('COMPLETED')} />
      </div>

      {err && <div style={{ color: 'var(--staff-danger)', fontWeight: 900, marginBottom: 10 }}>{err}</div>}

      <div className="staff-card staff-table-wrap" style={{ padding: 0 }}>
        <table className="staff-table staff-table--no-hover">
          <thead>
            <tr>
              <th>MÃ ĐƠN</th>
              <th>KHÁCH</th>
              <th>SẢN PHẨM</th>
              <th>SL</th>
              <th>GIÁ BÁN</th>
              <th>GIÁ NHẬP</th>
              <th>LỢI NHUẬN</th>
              <th>TRẠNG THÁI</th>
              <th>TRACKING</th>
              <th style={{ textAlign: 'right' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: 18, color: 'var(--staff-muted)', fontWeight: 900 }}>
                  Đang tải...
                </td>
              </tr>
            ) : (
              rows.map((o) => {
                const badge = getStatusBadge(o.status);
                const title = o.product_snapshot?.title || '—';
                const importPrice = importVnd(o);
                const profit = Number(o.profit_vnd) || 0;
                const tracking = o.domestic_deliveries?.[0]?.tracking_vn || o.tracking_vn || '';
                const trackingOrDash = tracking || '—';
                const actionReady = o.status === 'DELIVERING' || o.status === 'COMPLETED';

                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900 }}>
                      <div>{o.code}</div>
                      <div style={{ color: 'var(--staff-muted)', fontWeight: 900, fontSize: '0.82rem' }}>
                        {formatDateShort(o.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="staff-avatar">{initialsFromText(o.customer_name)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 900 }}>{o.customer_name}</div>
                          <div style={{ color: 'var(--staff-muted)', fontWeight: 900, fontSize: '0.78rem' }}>
                            {o.customer_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 900 }}>{title}</td>
                    <td style={{ fontWeight: 900 }}>{o.quantity}</td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(o.sell_price_vnd)}</td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(importPrice)}</td>
                    <td style={{ fontWeight: 900, color: profit >= 0 ? 'var(--staff-success)' : 'var(--staff-danger)' }}>
                      {profit >= 0 ? '+' : '-'}
                      {formatVnd(Math.abs(profit))}
                    </td>
                    <td>
                      <span className={`staff-badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td style={{ fontWeight: 900 }}>
                      <div>{trackingOrDash}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Link className="staff-act-icon" to={`/staff/orders/${o.id}`} aria-label="View">
                          👁
                        </Link>
                        <button type="button" className={`staff-mini-btn ${actionReady ? '' : 'disabled'}`} disabled={!actionReady}>
                          Hoàn thành
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 18, color: 'var(--staff-muted)', fontWeight: 900 }}>
                  Không có đơn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="staff-orders-foot">
        <div style={{ color: 'var(--staff-muted)', fontWeight: 900 }}>
          Hiển thị 1-{rows.length} trong {orders.length} đơn
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="staff-mini-btn">Đặt hàng</button>
          <button type="button" className="staff-mini-btn">Nhập tracking</button>
          <button type="button" className="staff-mini-btn staff-mini-btn-primary">Hoàn thành</button>
        </div>
      </div>

      <div className="staff-orders-bottom">
        <div className="staff-card staff-big-progress">
          <div style={{ fontWeight: 900, color: 'var(--staff-muted)' }}>Doanh thu tháng này</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, marginTop: 6, letterSpacing: '-0.02em' }}>
            {formatVnd(monthMetrics.revenue)} <span style={{ fontSize: '0.85rem', color: 'var(--staff-muted)' }}>VND</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ color: 'var(--staff-muted)', fontWeight: 900 }}>72% Mục tiêu</div>
            <div style={{ width: '48%', height: 6, borderRadius: 999, background: '#e6e8f0', overflow: 'hidden' }}>
              <div style={{ width: `${monthMetrics.progress * 100}%`, height: '100%', background: '#2563eb' }} />
            </div>
          </div>
        </div>

        <div className="staff-card staff-stat-small">
          <div style={{ color: 'var(--staff-muted)', fontWeight: 900 }}>ĐƠN HÀNG MỚI</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: 6 }}>{newOrders}</div>
          <div style={{ color: '#16a34a', fontWeight: 900, marginTop: 8 }}>+12% </div>
        </div>

        <div className="staff-card staff-stat-small">
          <div style={{ color: 'var(--staff-muted)', fontWeight: 900 }}>LỢI NHUẬN RÒNG</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: 6 }}>{formatVnd(monthMetrics.profit)} </div>
          <div style={{ color: 'var(--staff-danger)', fontWeight: 900, marginTop: 8 }}>28.4%</div>
        </div>
      </div>
    </div>
  );
}

