import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatVnd, initialsFromText, orderStatusBadge } from './adminUtils.js';

function LineChart({ points }) {
  const width = 640;
  const height = 220;
  const pad = 22;

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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="admin-line-chart" preserveAspectRatio="none">
      <path d={`${d} L ${pad + (points.length - 1) * xStep} ${height - pad} L ${pad} ${height - pad} Z`} fill="rgba(37, 99, 235, 0.07)" />
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

function categorize(title) {
  const t = String(title || '').toLowerCase();
  if (/(phone|camera|computer|electronics|sensor|tablet|laptop)/.test(t)) return 'ELECTRONICS';
  if (/(hoodie|shirt|watch|clothes|fashion|pant|jean|dress)/.test(t)) return 'FASHION';
  if (/(home|kitchen|living|sofa|bed|lamp)/.test(t)) return 'HOME & LIVING';
  if (/(beauty|cosmetic|perfume|makeup|skin)/.test(t)) return 'BEAUTY';
  return 'OTHER';
}

export default function AdminReportsAnalytics() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState('revenue'); // revenue | orders | staff

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

  const last30Revenue = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 29 * 24 * 3600 * 1000);
    const keys = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(from.getTime() + i * 24 * 3600 * 1000);
      keys.push(dateKey(d));
    }

    const revenueByKey = new Map();
    keys.forEach((k) => revenueByKey.set(k, 0));

    for (const o of orders) {
      if (o.status !== 'COMPLETED') continue;
      const k = o.updated_at ? dateKey(o.updated_at) : o.created_at ? dateKey(o.created_at) : null;
      if (!k || !revenueByKey.has(k)) continue;
      revenueByKey.set(k, (revenueByKey.get(k) || 0) + (Number(o.revenue_vnd) || 0));
    }

    return keys.map((k) => revenueByKey.get(k) || 0);
  }, [orders]);

  const totalRevenue = useMemo(() => last30Revenue.reduce((s, v) => s + v, 0), [last30Revenue]);

  const categoryDistribution = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const counts = {};
    let total = 0;
    for (const o of completed) {
      const title = o.product_snapshot?.title || '';
      const cat = categorize(title);
      counts[cat] = (counts[cat] || 0) + 1;
      total += 1;
    }
    const cats = ['ELECTRONICS', 'FASHION', 'HOME & LIVING', 'BEAUTY', 'OTHER'];
    return cats.map((c) => ({
      cat: c,
      pct: total > 0 ? ((counts[c] || 0) / total) * 100 : 0,
    }));
  }, [orders]);

  const staffLeaderboard = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const failed = orders.filter((o) => o.status === 'FAILED');

    const map = new Map();

    for (const o of completed) {
      const id = o.created_by || 'unknown';
      if (!map.has(id)) map.set(id, { id, orders: 0, profit: 0, revenue: 0, completed: 0, failed: 0 });
      const s = map.get(id);
      s.completed += 1;
      s.orders += 1;
      s.profit += Number(o.profit_vnd) || 0;
      s.revenue += Number(o.revenue_vnd) || 0;
    }
    for (const o of failed) {
      const id = o.created_by || 'unknown';
      if (!map.has(id)) map.set(id, { id, orders: 0, profit: 0, revenue: 0, completed: 0, failed: 0 });
      const s = map.get(id);
      s.failed += 1;
    }

    const list = [...map.values()].map((s) => {
      const total = s.completed + s.failed;
      const efficiency = total > 0 ? s.completed / total : 0;
      return { ...s, efficiency };
    });

    list.sort((a, b) => b.profit - a.profit);
    return list.slice(0, 8);
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const map = {};
    for (const o of orders) map[o.status] = (map[o.status] || 0) + 1;
    return Object.entries(map).map(([s, c]) => ({ s, c })).sort((a, b) => b.c - a.c);
  }, [orders]);

  return (
    <div>
      <div className="admin-page-header" style={{ marginBottom: 12 }}>
        <div className="admin-page-title" style={{ gap: 4 }}>
          <h1>Reports &amp; Analytics</h1>
          <p>Monitoring operational efficiency and revenue growth.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="admin-searchbar" style={{ maxWidth: 360 }}>
            <span style={{ color: '#64748b' }}>🔎</span>
            <input placeholder="Search analytics, orders, or staff..." disabled />
          </div>
          <button type="button" className="admin-icon-btn" aria-label="Help">?</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 10 }}>
        <div className="admin-tabs">
          <div className={`admin-tab ${tab === 'revenue' ? 'active' : ''}`} onClick={() => setTab('revenue')}>
            Revenue
          </div>
          <div className={`admin-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            Orders
          </div>
          <div className={`admin-tab ${tab === 'staff' ? 'active' : ''}`} onClick={() => setTab('staff')}>
            Staff Performance
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="admin-select" defaultValue="last_30">
            <option value="last_30">Oct 01 - Oct 31, 2023</option>
          </select>
          <button type="button" className="admin-btn secondary" onClick={() => alert('Export demo (UI)')}>
            Export
          </button>
        </div>
      </div>

      {err && <div style={{ color: 'var(--danger)', fontWeight: 900, marginBottom: 10 }}>{err}</div>}
      {loading && <div style={{ color: 'var(--muted)', fontWeight: 900, marginBottom: 10 }}>Đang tải...</div>}

      {tab === 'revenue' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
            <div className="admin-chart-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 900 }}>30-day Revenue Trend</div>
                <span className="admin-pill" style={{ background: '#eef2ff' }}>Revenue</span>
              </div>
              <div style={{ color: 'var(--muted)', fontWeight: 800, marginBottom: 6 }}>
                {`Total revenue: ${formatVnd(totalRevenue)} VND`}
              </div>
              <LineChart points={last30Revenue} />
            </div>
            <div className="admin-chart-wrap" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Category Distribution</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryDistribution.map((c) => (
                  <div key={c.cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--muted)' }}>
                      <span>{c.cat}</span>
                      <span>{c.pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(3, c.pct)}%`, background: '#2563eb' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="admin-btn secondary" onClick={() => setTab('orders')} style={{ width: '100%' }}>
                    View Detailed Breakdown →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 900 }}>Staff Performance Leaderboard</div>
              <div style={{ color: 'var(--muted)', fontWeight: 900 }}>≡</div>
            </div>
            <table className="admin-table" style={{ background: 'transparent' }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>RANK</th>
                  <th>TEAM MEMBER</th>
                  <th>ORDERS PROCESSED</th>
                  <th>REVENUE GENERATED</th>
                  <th>EFFICIENCY</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staffLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 18, color: 'var(--muted)', fontWeight: 900 }}>
                      Chưa có dữ liệu staff.
                    </td>
                  </tr>
                )}
                {staffLeaderboard.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 900 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 999, background: '#eef2ff', color: '#2563eb' }}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="admin-thumb" style={{ width: 34, height: 34, borderRadius: 999 }}>
                          {initialsFromText(s.id)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 900 }}>Staff {s.id.slice(0, 6)}</div>
                          <div style={{ color: 'var(--muted)', fontWeight: 800, fontSize: '0.82rem' }}>Logistics Specialist</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 900 }}>{s.completed + s.failed}</td>
                    <td style={{ fontWeight: 900, color: '#2563eb' }}>${formatVnd(s.profit)}</td>
                    <td style={{ fontWeight: 900 }}>
                      {(s.efficiency * 100).toFixed(0)}%
                      <div style={{ height: 6, borderRadius: 999, background: '#e5e7eb', marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(2, s.efficiency * 100)}%`, height: '100%', background: '#22c55e' }} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="admin-act-icon" aria-label="View">
                        ○
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ color: 'var(--muted)', fontWeight: 900, textAlign: 'center', marginTop: 12 }}>
              VIEW FULL STAFF ANALYTICS
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div style={{ marginTop: 12 }}>
          <div className="admin-card">
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Orders Summary</div>
            <table className="admin-table" style={{ background: 'transparent' }}>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>COUNT</th>
                </tr>
              </thead>
              <tbody>
                {ordersByStatus.map((r) => {
                  const badge = orderStatusBadge(r.s);
                  return (
                    <tr key={r.s}>
                      <td>
                        <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td style={{ fontWeight: 900 }}>{r.c}</td>
                    </tr>
                  );
                })}
                {ordersByStatus.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: 18, color: 'var(--muted)', fontWeight: 900 }}>
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div style={{ marginTop: 12 }}>
          <div className="admin-card">
            <div style={{ fontWeight: 900, marginBottom: 12 }}>Staff Performance</div>
            <table className="admin-table" style={{ background: 'transparent' }}>
              <thead>
                <tr>
                  <th>TEAM MEMBER</th>
                  <th>ORDERS</th>
                  <th>REVENUE GENERATED</th>
                  <th>EFFICIENCY</th>
                </tr>
              </thead>
              <tbody>
                {staffLeaderboard.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 900 }}>
                      {s.id.slice(0, 8)}
                    </td>
                    <td style={{ fontWeight: 900 }}>{s.completed + s.failed}</td>
                    <td style={{ fontWeight: 900, color: '#2563eb' }}>${formatVnd(s.profit)}</td>
                    <td style={{ fontWeight: 900 }}>
                      {(s.efficiency * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
                {staffLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 18, color: 'var(--muted)', fontWeight: 900 }}>
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

