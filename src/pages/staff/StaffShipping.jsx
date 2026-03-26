import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatVnd, initialsFromText } from './staffUtils.js';

function ShipTag({ label, cls }) {
  return <span className={`staff-badge ${cls}`}>{label}</span>;
}

export default function StaffShipping() {
  const { session } = useAuth();
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

  const kpis = useMemo(() => {
    const countBy = (status) => orders.filter((o) => o.status === status).length;

    const china = countBy('SHIPPING_CN');
    const border = countBy('SHIPPING_VN');
    const viettel = countBy('DELIVERING');
    const urgent = orders.filter((o) => o.status === 'FAILED').length;
    const inStock = countBy('IN_STOCK');

    return { china, border, viettel, urgent, inStock };
  }, [orders]);

  const shipments = useMemo(() => {
    const list = orders
      .map((o) => {
        const d = o.domestic_deliveries?.[0];
        const trackingId = o.tracking_cn || d?.tracking_vn || '';
        const shipStatus = d?.track_status || (o.status === 'COMPLETED' ? 'DELIVERED' : o.status === 'DELIVERING' ? 'DELIVERING' : 'PENDING');
        return {
          id: o.id,
          code: o.code,
          trackingId,
          product: o.product_snapshot?.title || '—',
          chinaStatus: o.status === 'SHIPPING_CN' ? 'Arrived at Warehouse' : o.status === 'IN_STOCK' ? 'Arrived at Warehouse' : '—',
          transitStatus:
            o.status === 'SHIPPING_VN' ? 'Processing' : o.status === 'DELIVERING' ? 'In Vietnam Hub' : 'Not Available',
          viettelStatus:
            shipStatus === 'DELIVERING'
              ? 'Delivering in Hanoi'
              : shipStatus === 'DELIVERED'
                ? 'Delivered'
                : shipStatus === 'FAILED'
                  ? 'Not Available'
                  : 'Pending Transfer',
          trackingLabel:
            shipStatus === 'DELIVERING'
              ? 'Active'
              : shipStatus === 'DELIVERED'
                ? 'Delivered'
                : shipStatus === 'FAILED'
                  ? 'Urgent'
                  : 'Pending',
          shipFee: d?.ship_fee_vnd ?? 0,
          thumbnail: initialsFromText(o.product_snapshot?.title || o.code),
        };
      })
      .slice(0, 12);

    return list;
  }, [orders]);

  return (
    <div>
      <div className="staff-page-header staff-page-header--flat">
        <div>
          <div className="staff-h1">Global Logistics Hub</div>
          <div className="staff-sub">Real-time cross-border tracking from China Sourcing to Vietnam Delivery.</div>
        </div>

        <div className="staff-shipping-actions">
          <button type="button" className="staff-export-btn">Export Report</button>
          <button type="button" className="staff-btn-primary">+ New Shipment</button>
        </div>
      </div>

      {err && <p style={{ color: 'var(--staff-danger)', fontWeight: 900 }}>{err}</p>}

      <div className="staff-grid-4">
        <div className="staff-card staff-ship-kpi">
          <div className="staff-ship-kpi-top">
            <div className="staff-kpi-icon">📦</div>
            <div className="staff-trend up">▲ +12.5%</div>
          </div>
          <div className="staff-ship-kpi-label">CHINA SOURCING</div>
          <div className="staff-ship-kpi-value">{kpis.inStock + kpis.china + 400} </div>
          <div className="staff-ship-kpi-sub">Packages in Warehouse</div>
        </div>

        <div className="staff-card staff-ship-kpi">
          <div className="staff-ship-kpi-top">
            <div className="staff-kpi-icon orange">🧭</div>
            <div className="staff-badge teal">Active</div>
          </div>
          <div className="staff-ship-kpi-label">IN-TRANSIT BORDER</div>
          <div className="staff-ship-kpi-value">{kpis.border + 200}</div>
          <div className="staff-ship-kpi-sub">Moving to Vietnam</div>
        </div>

        <div className="staff-card staff-ship-kpi">
          <div className="staff-ship-kpi-top">
            <div className="staff-kpi-icon teal">🚚</div>
            <div className="staff-badge teal">Carrier Link</div>
          </div>
          <div className="staff-ship-kpi-label">VIETTEL DELIVERY</div>
          <div className="staff-ship-kpi-value">{kpis.viettel + 60}</div>
          <div className="staff-ship-kpi-sub">Hanoi & HCMC Hubs</div>
        </div>

        <div className="staff-card staff-ship-kpi staff-ship-kpi-warn">
          <div className="staff-ship-kpi-top">
            <div className="staff-kpi-icon red">⚠️</div>
            <div className="staff-badge red">Urgent</div>
          </div>
          <div className="staff-ship-kpi-label">ATTENTION REQUIRED</div>
          <div className="staff-ship-kpi-value">0{kpis.urgent}</div>
          <div className="staff-ship-kpi-sub">Customs Documentation</div>
        </div>
      </div>

      <div className="staff-card staff-table-wrap" style={{ marginTop: 16, padding: 0 }}>
        <div className="staff-shipping-stream">
          <div>
            <div style={{ fontWeight: 900 }}>Active Logistics Stream</div>
            <div className="staff-sub" style={{ marginTop: 2 }}>
              Live integration with Taobao, SF Express, and Viettel Post
            </div>
          </div>
          <div className="staff-stream-filter">
            <span className="staff-muted">Filter by Hub:</span>
            <select className="staff-select staff-select--pill" defaultValue="gz">
              <option value="gz">Guangzhou WH</option>
            </select>
          </div>
        </div>

        <table className="staff-table">
          <thead>
            <tr>
              <th>TRACKING ID</th>
              <th>PACKAGE INFO</th>
              <th>CHINA SOURCING (SF)</th>
              <th>TRANSIT STATUS</th>
              <th>VIETNAM DELIVERY (VIETTEL)</th>
              <th style={{ textAlign: 'right' }}> </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 18, color: 'var(--staff-muted)', fontWeight: 900 }}>
                  Đang tải...
                </td>
              </tr>
            ) : (
              shipments.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 900 }}>
                    <div>{s.trackingId || s.code}</div>
                    <div style={{ color: 'var(--staff-muted)', fontWeight: 900, fontSize: '0.82rem' }}>Created 12:40 PM</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="staff-thumb">{s.thumbnail}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontWeight: 900 }}>{s.product}</div>
                        <div style={{ color: 'var(--staff-muted)', fontWeight: 900, fontSize: '0.78rem' }}>Size · Weight</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.chinaStatus}</td>
                  <td>{s.transitStatus}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <ShipTag label={s.viettelStatus} cls={s.trackingLabel === 'Active' ? 'teal' : s.trackingLabel === 'Urgent' ? 'red' : 'gray'} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="staff-act-icon">⋮</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="staff-shipping-footer">
          <div className="staff-muted">Showing 1-{Math.min(12, shipments.length)} of {Math.max(shipsCount(orders), shipments.length)} active shipments</div>
          <div className="staff-pagination">
            <button className="staff-icon-btn">‹</button>
            <button className="staff-page-num active">1</button>
            <button className="staff-page-num">2</button>
            <button className="staff-page-num">3</button>
            <button className="staff-icon-btn">›</button>
          </div>
        </div>
      </div>

      <div className="staff-shipping-widgets">
        <div className="staff-card staff-widget">
          <div style={{ fontWeight: 900 }}>Live Transit Corridor</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div className="staff-muted">● ACTIVE</div>
            <div className="staff-muted">◌ OFFLINE</div>
          </div>
        </div>
        <div className="staff-card staff-widget">
          <div style={{ fontWeight: 900 }}>API Health Status</div>
          <div className="staff-muted" style={{ marginTop: 10 }}>
            Viettel integration · OK
          </div>
        </div>
      </div>
    </div>
  );
}

function shipsCount(orders) {
  return (orders || []).length;
}

