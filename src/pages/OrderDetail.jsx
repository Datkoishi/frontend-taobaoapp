import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../lib/api.js';
import { createSocket } from '../lib/socket.js';

const STATUSES = [
  'NEW',
  'DEPOSITED',
  'ORDERED',
  'SHIPPING_CN',
  'SHIPPING_VN',
  'IN_STOCK',
  'DELIVERING',
  'COMPLETED',
  'FAILED',
];

const STATUS_LABEL = {
  NEW: 'Mới',
  DEPOSITED: 'Đã cọc',
  ORDERED: 'Đã đặt',
  SHIPPING_CN: 'VC Trung Quốc',
  SHIPPING_VN: 'VC về VN',
  IN_STOCK: 'Đã về kho VN',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Giao lỗi / lỗi',
};

const TRACK_LABEL = {
  PENDING: 'Chờ lấy hàng',
  DELIVERING: 'Đang giao hàng',
  DELIVERED: 'Đã giao thành công',
  FAILED: 'Giao thất bại',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { session, profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    recipient_name: '',
    recipient_phone: '',
    address: '',
    carrier: 'Viettel Post',
    tracking_vn: '',
    ship_fee_vnd: '',
    is_cod: false,
    cod_amount_vnd: '',
  });

  async function load() {
    try {
      const data = await api(`/api/orders/${id}`, {}, session);
      setOrder(data);
      const d = data.domestic_deliveries?.[0];
      if (d) {
        setDeliveryForm({
          recipient_name: d.recipient_name || '',
          recipient_phone: d.recipient_phone || '',
          address: d.address || '',
          carrier: d.carrier || 'Viettel Post',
          tracking_vn: d.tracking_vn || '',
          ship_fee_vnd: d.ship_fee_vnd ?? '',
          is_cod: d.is_cod,
          cod_amount_vnd: d.cod_amount_vnd ?? '',
        });
      }
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [id, session]);

  useEffect(() => {
    const socket = createSocket();
    socket.emit('join:order', id);
    const refresh = () => load();
    socket.on('order:updated', (o) => {
      if (o?.id === id) refresh();
    });
    socket.on('delivery:updated', refresh);
    return () => {
      socket.emit('leave:order', id);
      socket.disconnect();
    };
  }, [id, session]);

  async function saveStatus(next) {
    try {
      const updated = await api(
        `/api/orders/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status: next }) },
        session
      );
      setOrder(updated);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function saveDomestic(e) {
    e.preventDefault();
    try {
      const body = {
        recipient_name: deliveryForm.recipient_name,
        recipient_phone: deliveryForm.recipient_phone,
        address: deliveryForm.address,
        carrier: deliveryForm.carrier,
        tracking_vn: deliveryForm.tracking_vn,
        ship_fee_vnd: Number(deliveryForm.ship_fee_vnd) || 0,
        is_cod: deliveryForm.is_cod,
        cod_amount_vnd: Number(deliveryForm.cod_amount_vnd) || 0,
      };
      const data = await api(`/api/orders/${id}/domestic`, { method: 'POST', body: JSON.stringify(body) }, session);
      setOrder(data);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function syncTrack() {
    try {
      const data = await api(`/api/orders/${id}/domestic/sync`, { method: 'POST' }, session);
      setOrder(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function confirmCod() {
    try {
      await api(`/api/orders/${id}/cod/confirm`, { method: 'POST' }, session);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!order) {
    return <p className="muted layout">{err || 'Đang tải…'}</p>;
  }

  const d = order.domestic_deliveries?.[0];
  const importVnd = Math.round(
    (Number(order.buy_price_cny) || 0) * (Number(order.exchange_rate) || 0) * (Number(order.quantity) || 1)
  );

  return (
    <div>
      <p>
        <Link to={profile?.role === 'admin' ? '/admin/orders' : '/staff/orders'}>← Danh sách</Link>
      </p>
      <h1 style={{ fontSize: '1.35rem' }}>
        {order.code}{' '}
        <span className="badge">{STATUS_LABEL[order.status]}</span>
      </h1>
      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}

      <div className="card">
        <h2>Thông tin đơn</h2>
        <div className="grid2">
          <div>
            <span className="label">Khách</span>
            <div>
              {order.customer_name} · {order.customer_phone}
            </div>
          </div>
          <div>
            <span className="label">Link</span>
            <div>
              {order.taobao_link ? (
                <a href={order.taobao_link} target="_blank" rel="noreferrer">
                  Mở Taobao
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }} className="muted">
          Sản phẩm: {order.product_snapshot?.title || '—'}
        </div>
        <div className="grid2" style={{ marginTop: '0.75rem' }}>
          <div>
            <span className="label">Giá bán</span>
            <div>{Number(order.sell_price_vnd).toLocaleString('vi-VN')} ₫</div>
          </div>
          <div>
            <span className="label">Giá nhập ước tính (VND)</span>
            <div>{importVnd.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
        <div className="grid2" style={{ marginTop: '0.75rem' }}>
          <div>
            <span className="label">Doanh thu (khi hoàn thành)</span>
            <div>{Number(order.revenue_vnd).toLocaleString('vi-VN')} ₫</div>
          </div>
          <div>
            <span className="label">Lợi nhuận</span>
            <div>{Number(order.profit_vnd).toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Trạng thái đơn (nhân viên)</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={order.status}
            onChange={(e) => saveStatus(e.target.value)}
            style={{ minWidth: 200 }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <span className="muted">Khi hàng về kho VN → chọn IN_STOCK, sau đó tạo giao hàng bên dưới.</span>
        </div>
      </div>

      <div className="card">
        <p className="section-title">Giao hàng</p>
        <div className="delivery-box">
          <form onSubmit={saveDomestic}>
            <div className="grid2">
              <div>
                <span className="label">Tên người nhận</span>
                <input
                  required
                  value={deliveryForm.recipient_name}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_name: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <span className="label">SĐT</span>
                <input
                  required
                  value={deliveryForm.recipient_phone}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_phone: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="label">Địa chỉ giao</span>
              <textarea
                required
                rows={2}
                value={deliveryForm.address}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
            <div className="grid2" style={{ marginTop: '0.5rem' }}>
              <div>
                <span className="label">Đơn vị vận chuyển</span>
                <select
                  value={deliveryForm.carrier}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, carrier: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option>Viettel Post</option>
                  <option>GHN</option>
                  <option>J&T</option>
                </select>
              </div>
              <div>
                <span className="label">Mã vận đơn VN</span>
                <input
                  value={deliveryForm.tracking_vn}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, tracking_vn: e.target.value })}
                  placeholder="VD: VT123456789"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="grid2" style={{ marginTop: '0.5rem' }}>
              <div>
                <span className="label">Phí ship (VND)</span>
                <input
                  type="number"
                  min={0}
                  value={deliveryForm.ship_fee_vnd}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, ship_fee_vnd: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="checkbox"
                    checked={deliveryForm.is_cod}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, is_cod: e.target.checked })}
                  />
                  COD
                </label>
                {deliveryForm.is_cod && (
                  <input
                    type="number"
                    min={0}
                    placeholder="Số tiền thu hộ"
                    value={deliveryForm.cod_amount_vnd}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, cod_amount_vnd: e.target.value })}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn">
                Lưu đơn giao hàng
              </button>
              <button type="button" className="btn secondary" onClick={syncTrack}>
                Đồng bộ tracking (Viettel mock)
              </button>
            </div>
          </form>

          {d && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div className="grid2">
                <div>
                  <span className="label">Đơn vị</span>
                  <div>{d.carrier}</div>
                </div>
                <div>
                  <span className="label">Mã vận đơn</span>
                  <div>{d.tracking_vn || '—'}</div>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="label">Trạng thái giao</span>
                <div>{TRACK_LABEL[d.track_status] || d.track_status}</div>
              </div>
              {d.is_cod && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="label">COD</span>
                  <div>
                    {Number(d.cod_amount_vnd).toLocaleString('vi-VN')} ₫ — Đã thu:{' '}
                    {d.cod_collected ? '✔' : 'Chưa'}
                  </div>
                  {d.is_cod && !d.cod_collected && order.status === 'COMPLETED' && (
                    <button type="button" className="btn" style={{ marginTop: '0.5rem' }} onClick={confirmCod}>
                      Xác nhận đã thu COD
                    </button>
                  )}
                </div>
              )}
              <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                Auto sync mỗi ~2 phút (cấu hình backend). Mã kết thúc <code>FAIL</code> → giao thất bại (demo).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
