import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../lib/api.js';

export default function Admin() {
  const { session } = useAuth();
  const [summary, setSummary] = useState(null);
  const [active, setActive] = useState([]);
  const [failed, setFailed] = useState([]);
  const [cod, setCod] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try {
      const [s, a, f, c] = await Promise.all([
        api('/api/admin/reports/summary', {}, session),
        api('/api/admin/deliveries/active', {}, session),
        api('/api/admin/deliveries/failed', {}, session),
        api('/api/admin/cod/pending', {}, session),
      ]);
      setSummary(s);
      setActive(a);
      setFailed(f);
      setCod(c);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [session]);

  return (
    <div>
      <h1 style={{ fontSize: '1.35rem' }}>Quản lý · Báo cáo</h1>
      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}

      {summary && (
        <div className="card">
          <h2>Tổng quan</h2>
          <div className="grid2">
            <div>
              <span className="label">Tổng đơn</span>
              <div style={{ fontSize: '1.25rem' }}>{summary.total_orders}</div>
            </div>
            <div>
              <span className="label">Hoàn thành</span>
              <div style={{ fontSize: '1.25rem' }}>{summary.completed}</div>
            </div>
            <div>
              <span className="label">Giao lỗi</span>
              <div style={{ fontSize: '1.25rem' }}>{summary.failed_deliveries}</div>
            </div>
            <div>
              <span className="label">Tỷ lệ giao thành công (ước)</span>
              <div style={{ fontSize: '1.25rem' }}>{(summary.success_rate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="label">Tổng lợi nhuận (đơn đã hoàn thành)</span>
              <div style={{ fontSize: '1.25rem' }}>
                {Number(summary.total_profit_vnd).toLocaleString('vi-VN')} ₫
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Đơn đang giao</h2>
        <ul className="muted" style={{ paddingLeft: '1.2rem' }}>
          {active.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`}>{o.code}</Link> — {o.customer_name}
            </li>
          ))}
          {active.length === 0 && <li>Không có</li>}
        </ul>
      </div>

      <div className="card">
        <h2>Đơn giao thất bại</h2>
        <ul className="muted" style={{ paddingLeft: '1.2rem' }}>
          {failed.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`}>{o.code}</Link> — {o.customer_name}
            </li>
          ))}
          {failed.length === 0 && <li>Không có</li>}
        </ul>
      </div>

      <div className="card">
        <h2>COD chưa đối soát</h2>
        <ul className="muted" style={{ paddingLeft: '1.2rem' }}>
          {cod.map((row) => (
            <li key={row.id}>
              <Link to={`/orders/${row.order_id}`}>{row.orders?.code || row.order_id}</Link> —{' '}
              {Number(row.cod_amount_vnd).toLocaleString('vi-VN')} ₫
            </li>
          ))}
          {cod.length === 0 && <li>Không có</li>}
        </ul>
      </div>
    </div>
  );
}
