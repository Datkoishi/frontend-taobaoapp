import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatVnd, formatDateShort, getStatusBadge, importVnd, initialsFromText } from './staffUtils.js';
import { Link } from 'react-router-dom';

function StaffBadge({ cls, label }) {
  return <span className={`staff-badge ${cls}`}>{label}</span>;
}

export default function StaffDashboard() {
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

  const metrics = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'COMPLETED');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const inThisMonth = completed.filter((o) => {
      const dt = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
      return dt >= thisMonthStart && dt < nextMonthStart;
    });
    const inLastMonth = completed.filter((o) => {
      const dt = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
      return dt >= lastMonthStart && dt < thisMonthStart;
    });

    const sumRevenue = (arr) => arr.reduce((s, o) => s + (Number(o.sell_price_vnd) || 0), 0);
    const sumProfit = (arr) => arr.reduce((s, o) => s + (Number(o.profit_vnd) || 0), 0);
    const sumCost = (arr) =>
      arr.reduce((s, o) => {
        const shipFee = o.domestic_deliveries?.[0]?.ship_fee_vnd ?? 0;
        return s + importVnd(o) + Number(shipFee) || s;
      }, 0);

    const revenueNow = sumRevenue(inThisMonth);
    const revenueLast = sumRevenue(inLastMonth);
    const profitNow = sumProfit(inThisMonth);
    const profitLast = sumProfit(inLastMonth);
    const costNow = sumCost(inThisMonth);
    const costLast = sumCost(inLastMonth);

    const pct = (nowV, lastV) => {
      if (!lastV) return nowV ? 100 : 0;
      return (nowV - lastV) / lastV;
    };

    return {
      revenueNow,
      revenuePct: pct(revenueNow, revenueLast),
      costNow,
      costPct: pct(costNow, costLast),
      profitNow,
      profitPct: pct(profitNow, profitLast),
    };
  }, [orders]);

  const rows = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10);
  }, [orders]);

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <div className="staff-h1">Finance Overview</div>
          <div className="staff-sub">Real-time profitability analysis across global operations.</div>
        </div>

        <div className="staff-finance-actions">
          <div className="staff-seg">
            <button type="button" className="staff-seg-btn active">Daily</button>
            <button type="button" className="staff-seg-btn">Weekly</button>
            <button type="button" className="staff-seg-btn">Monthly</button>
          </div>
          <button type="button" className="staff-export-btn">Export Report</button>
        </div>
      </div>

      {err && <p style={{ color: 'var(--staff-danger)', fontWeight: 900 }}>{err}</p>}

      <div className="staff-grid-3">
        <div className="staff-card staff-kpi">
          <div className="staff-kpi-top">
            <div className="staff-kpi-icon">💵</div>
            <div className={`staff-trend ${metrics.revenuePct >= 0 ? 'up' : 'down'}`}>
              {metrics.revenuePct >= 0 ? '▲' : '▼'} {Math.abs(metrics.revenuePct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="staff-kpi-label">TOTAL REVENUE</div>
          <div className="staff-kpi-value"> {formatVnd(metrics.revenueNow)}<span className="staff-kpi-unit"> VND</span></div>
        </div>

        <div className="staff-card staff-kpi">
          <div className="staff-kpi-top">
            <div className="staff-kpi-icon orange">📄</div>
            <div className={`staff-trend ${metrics.costPct >= 0 ? 'down' : 'up'}`}>
              {metrics.costPct >= 0 ? '▼' : '▲'} {Math.abs(metrics.costPct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="staff-kpi-label">TOTAL COST</div>
          <div className="staff-kpi-value"> {formatVnd(metrics.costNow)}<span className="staff-kpi-unit"> VND</span></div>
        </div>

        <div className="staff-card staff-kpi staff-kpi-profit">
          <div className="staff-kpi-top">
            <div className="staff-kpi-icon teal">💹</div>
            <div className={`staff-trend ${metrics.profitPct >= 0 ? 'up' : 'down'}`}>
              {metrics.profitPct >= 0 ? '▲' : '▼'} {Math.abs(metrics.profitPct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="staff-kpi-label">NET PROFIT</div>
          <div className="staff-kpi-value"> {formatVnd(metrics.profitNow)}<span className="staff-kpi-unit"> VND</span></div>
          <div className="staff-kpi-hint">TARGET HIT · +150M vs last month</div>
        </div>
      </div>

      <div className="staff-filter-row">
        <select className="staff-select" defaultValue="30d" disabled>
          <option value="30d">Last 30 Days</option>
        </select>
        <select className="staff-select" defaultValue="all" disabled>
          <option value="all">All Staff Members</option>
        </select>
        <button type="button" className="staff-filter-clear">Clear Filters</button>
      </div>

      <div className="staff-card staff-table-wrap">
        <table className="staff-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>STAFF MEMBER</th>
              <th>SALE PRICE (VND)</th>
              <th>PURCHASE PRICE (VND)</th>
              <th>NET PROFIT</th>
              <th>STATUS</th>
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
              rows.map((o) => {
                const purchase = importVnd(o);
                const status = o.status === 'COMPLETED' ? { cls: 'blue', label: 'SETTLED' } : { cls: 'orange', label: 'PENDING' };
                return (
                  <tr key={o.id}>
                    <td style={{ color: '#2563eb', fontWeight: 900 }}>{o.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="staff-avatar">{initialsFromText(o.created_by)}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontWeight: 900 }}>{o.created_by?.slice(0, 2) || '—'}</div>
                          <div style={{ color: 'var(--staff-muted)', fontWeight: 800, fontSize: '0.78rem' }}>
                            Staff
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(o.sell_price_vnd)}</td>
                    <td style={{ fontWeight: 900 }}>{formatVnd(purchase)}</td>
                    <td style={{ fontWeight: 900, color: Number(o.profit_vnd) >= 0 ? 'var(--staff-success)' : 'var(--staff-danger)' }}>
                      {Number(o.profit_vnd) >= 0 ? ' + ' : ' - '}
                      {formatVnd(Math.abs(Number(o.profit_vnd)))}
                    </td>
                    <td>
                      <StaffBadge cls={status.cls} label={status.label} />
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 18, color: 'var(--staff-muted)', fontWeight: 900 }}>
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="staff-grid-2" style={{ marginTop: 16 }}>
        <div className="staff-card staff-insight">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="staff-insight-icon">🧠</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900 }}>AI Profit Projection</div>
              <div style={{ color: 'var(--staff-muted)', fontWeight: 800, marginTop: 4 }}>
                Based on current trajectory, we expect a 12% increase in net margins by next quarter date.
              </div>
            </div>
          </div>
          <button type="button" className="staff-insight-link" onClick={() => alert('Demo')}>View Forecast Details →</button>
        </div>

        <div className="staff-card staff-insight staff-insight-warn">
          <div style={{ fontWeight: 900 }}>Optimization Alert</div>
          <div style={{ color: '#5b6b8a', fontWeight: 800, marginTop: 6 }}>
            Shipping costs for region &quot;SE-Asia&quot; are 15% above benchmark. Consolidating orders from #ORD-828300 could save VND 12.4M.
          </div>
          <button type="button" className="staff-opt-btn" onClick={() => alert('Apply Optimization (demo)')}>
            Apply Optimization
          </button>
        </div>
      </div>
    </div>
  );
}

