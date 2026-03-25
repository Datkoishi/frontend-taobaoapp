import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../lib/api.js';

export default function OrderNew() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    taobao_link: '',
    quantity: 1,
    sell_price_vnd: '',
    buy_price_cny: '',
    exchange_rate: 3500,
    product_title: '',
  });
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        taobao_link: form.taobao_link || null,
        quantity: Number(form.quantity) || 1,
        sell_price_vnd: Number(form.sell_price_vnd) || 0,
        buy_price_cny: Number(form.buy_price_cny) || 0,
        exchange_rate: Number(form.exchange_rate) || 3500,
        product_snapshot: {
          title: form.product_title,
          note: 'Crawl Taobao — tích hợp sau (placeholder)',
        },
      };
      const created = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) }, session);
      nav(`/orders/${created.id}`);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.35rem' }}>Tạo đơn mới</h1>
      <form className="card" onSubmit={submit}>
        <div className="grid2">
          <div>
            <span className="label">Tên khách</span>
            <input
              required
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className="label">SĐT</span>
            <input
              required
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <span className="label">Link Taobao / 1688</span>
          <input
            value={form.taobao_link}
            onChange={(e) => setForm({ ...form, taobao_link: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <span className="label">Tên SP (placeholder crawl)</span>
          <input
            value={form.product_title}
            onChange={(e) => setForm({ ...form, product_title: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>
        <div className="grid2" style={{ marginTop: '0.75rem' }}>
          <div>
            <span className="label">SL</span>
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className="label">Giá bán (VND)</span>
            <input
              type="number"
              min={0}
              value={form.sell_price_vnd}
              onChange={(e) => setForm({ ...form, sell_price_vnd: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="grid2" style={{ marginTop: '0.75rem' }}>
          <div>
            <span className="label">Giá mua (¥)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.buy_price_cny}
              onChange={(e) => setForm({ ...form, buy_price_cny: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <span className="label">Tỷ giá</span>
            <input
              type="number"
              min={0}
              value={form.exchange_rate}
              onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn">
            Lưu đơn
          </button>
          <button type="button" className="btn secondary" onClick={() => nav(-1)}>
            Huỷ
          </button>
        </div>
      </form>
    </div>
  );
}
