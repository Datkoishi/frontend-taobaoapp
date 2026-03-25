import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../lib/api.js';
import { createSocket } from '../lib/socket.js';

const STATUS_LABEL = {
  NEW: 'Mới',
  DEPOSITED: 'Đã cọc',
  ORDERED: 'Đã đặt',
  SHIPPING_CN: 'VC Trung Quốc',
  SHIPPING_VN: 'VC về VN',
  IN_STOCK: 'Đã về kho VN',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Giao lỗi',
};

export default function Orders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : '';
      const data = await api(`/api/orders${q}`, {}, session);
      setOrders(data);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [session, status]);

  useEffect(() => {
    const socket = createSocket();
    socket.on('order:updated', () => load());
    return () => socket.disconnect();
  }, [session, status]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Danh sách đơn</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.keys(STATUS_LABEL).map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
        <Link to="/orders/new" className="btn" style={{ textDecoration: 'none' }}>
          + Tạo đơn
        </Link>
      </div>
      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
      <div className="card" style={{ marginTop: '1rem', padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách</th>
              <th>Trạng thái</th>
              <th>Giá bán</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/orders/${o.id}`}>{o.code}</Link>
                </td>
                <td>
                  {o.customer_name}
                  <div className="muted">{o.customer_phone}</div>
                </td>
                <td>
                  <span className="badge">{STATUS_LABEL[o.status] || o.status}</span>
                </td>
                <td>{Number(o.sell_price_vnd).toLocaleString('vi-VN')} ₫</td>
                <td>
                  <Link to={`/orders/${o.id}`}>Chi tiết</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="muted" style={{ padding: '1rem' }}>Chưa có đơn.</p>}
      </div>
    </div>
  );
}
