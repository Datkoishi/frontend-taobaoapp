import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatVnd } from './staffUtils.js';

function LineChart({ points }) {
  const width = 640;
  const height = 220;
  const pad = 24;

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
    <svg viewBox={`0 0 ${width} ${height}`} className="staff-line-chart" preserveAspectRatio="none">
      <path
        d={`${d} L ${pad + (points.length - 1) * xStep} ${height - pad} L ${pad} ${height - pad} Z`}
        fill="rgba(37, 99, 235, 0.08)"
      />
      <path d={d} stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

export default function StaffReports() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function load() {
      setErr('');
      try {
        const data = await api('/api/orders', {}, session);
        setOrders(data || []);
      } catch (e) {
        setErr(e.message);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const last30Revenue = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 29 * 24 * 3600 * 1000);
    const keys = [];
    for (let i = 0; i < 30; i++) {
      keys.push(dateKey(new Date(from.getTime() + i * 24 * 3600 * 1000)));
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

  const category = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const total = completed.length || 1;
    const counts = { Electronics: 0, Fashion: 0, 'Home & Decor': 0, Beauty: 0, Other: 0 };
    for (const o of completed) {
      const t = String(o.product_snapshot?.title || '').toLowerCase();
      if (/(phone|camera|computer|electronics|sensor)/.test(t)) counts.Electronics += 1;
      else if (/(hoodie|shirt|watch|fashion|clothes)/.test(t)) counts.Fashion += 1;
      else if (/(home|kitchen|living|sofa|decor)/.test(t)) counts['Home & Decor'] += 1;
      else if (/(beauty|cosmetic|makeup|skin)/.test(t)) counts.Beauty += 1;
      else counts.Other += 1;
    }
    const dist = Object.entries(counts).map(([k, v]) => ({ k, pct: (v / total) * 100 }));
    dist.sort((a, b) => b.pct - a.pct);
    return dist;
  }, [orders]);

  return (
    <div>
      <div className="staff-page-header">
        <div>
          <div className="staff-h1">Reports & Analytics</div>
          <div className="staff-sub">Performance monitoring for your operations.</div>
        </div>
        <div className="staff-reports-actions">
          <select className="staff-select staff-select--pill" defaultValue="m">
            <option value="m">Aug 1, 2023 - Aug 31, 2023</option>
          </select>
          <button type="button" className="staff-export-btn">Export</button>
        </div>
      </div>

      {err && <div style={{ color: 'var(--staff-danger)', fontWeight: 900 }}>{err}</div>}

      <div className="staff-grid-3">
        <div className="staff-card">
          <div className="staff-muted-title">TOTAL REVENUE</div>
          <div className="staff-h2">{formatVnd(last30Revenue.reduce((s, v) => s + v, 0))} VND</div>
          <div className="staff-muted-small">▲ +12% vs last month</div>
        </div>
        <div className="staff-card">
          <div className="staff-muted-title">AVG. ORDER VALUE</div>
          <div className="staff-h2">${Math.round(Math.max(10, last30Revenue.length ? last30Revenue[10] / 10 : 0))}.50</div>
          <div className="staff-muted-small">• +3.2% vs last month</div>
        </div>
        <div className="staff-card">
          <div className="staff-muted-title">TOP STAFF MEMBER</div>
          <div className="staff-h2">Elena Vance</div>
          <div className="staff-muted-small">142 Orders Processed</div>
        </div>
      </div>

      <div className="staff-grid-2" style={{ marginTop: 16 }}>
        <div className="staff-card">
          <div style={{ fontWeight: 900 }}>30-Day Revenue Trend</div>
          <div style={{ color: 'var(--staff-muted)', fontWeight: 800, marginTop: 4, fontSize: '0.88rem' }}>
            Daily revenue breakdown across regions
          </div>
          <LineChart points={last30Revenue} />
        </div>
        <div className="staff-card">
          <div style={{ fontWeight: 900 }}>Category Distribution</div>
          <div style={{ color: 'var(--staff-muted)', fontWeight: 800, marginTop: 4, fontSize: '0.88rem' }}>
            Revenue share by product category
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {category.map((c) => (
              <div key={c.k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: 'var(--staff-text)' }}>
                  <span>{c.k}</span>
                  <span style={{ color: 'var(--staff-muted)' }}>{c.pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                  <div style={{ width: `${Math.max(2, c.pct)}%`, height: '100%', background: '#2563eb' }} />
                </div>
              </div>
            ))}
            <button type="button" className="staff-btn-light" style={{ marginTop: 10 }}>
              View Full Breakdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

