import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuth } from '../../AuthContext.jsx';
import { formatVnd, initialsFromText } from './adminUtils.js';

function Thumb({ title }) {
  return (
    <div className="admin-thumb" style={{ width: 84, height: 84, borderRadius: 20 }}>
      {initialsFromText(title)}
    </div>
  );
}

export default function AdminCreateOrderWizard() {
  const { session } = useAuth();
  const nav = useNavigate();

  const steps = useMemo(
    () => [
      { title: 'Import Data', subtitle: 'Step 1' },
      { title: 'Preview', subtitle: 'Step 2' },
      { title: 'Manual Entry', subtitle: 'Step 3' },
      { title: 'Finalize', subtitle: 'Step 4' },
    ],
    []
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [sourceLink, setSourceLink] = useState('');
  const [preview, setPreview] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sourceChannel, setSourceChannel] = useState('Taobao');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sellPriceVnd, setSellPriceVnd] = useState(350000);
  const [buyPriceCny, setBuyPriceCny] = useState(59);
  const [exchangeRate, setExchangeRate] = useState(3500);

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function fetchData() {
    setErr('');
    setBusy(true);
    try {
      // Demo: không crawl Taobao thật. Chỉ mô phỏng preview.
      const safe = sourceLink.trim();
      const titleFromLink = safe ? `Product from link (${safe.slice(0, 24)}...)` : 'Áo hoodie (demo)';
      const p = {
        title: titleFromLink,
        priceCny: Number(buyPriceCny) || 59,
        sourceLabel: sourceChannel,
      };
      setPreview(p);
      setStepIndex(1);
    } finally {
      setBusy(false);
    }
  }

  async function createOrder() {
    setErr('');
    setBusy(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        taobao_link: sourceLink || null,
        quantity: Number(quantity) || 1,
        sell_price_vnd: Number(sellPriceVnd) || 0,
        buy_price_cny: Number(buyPriceCny) || 0,
        exchange_rate: Number(exchangeRate) || 3500,
        product_snapshot: {
          title: preview?.title || 'Product (demo)',
          source_channel: sourceChannel,
          size,
          color,
          note: 'Wizard demo — crawl Taobao sẽ tích hợp sau.',
        },
      };

      const created = await api('/api/orders', { method: 'POST', body: JSON.stringify(payload) }, session);
      nav(`/admin/orders`);
      return created;
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <h1>Create New Order</h1>
          <p>Follow the architectural steps below to process a new logistics request.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="admin-searchbar" style={{ maxWidth: 420 }}>
            <span style={{ color: '#64748b' }}>🔎</span>
            <input placeholder="Search orders, links, or customers..." disabled />
          </div>
        </div>
      </div>

      <div className="admin-wizard">
        <div className="admin-steps">
          <div className="admin-step" style={{ marginTop: 2 }}>
            <div className="admin-step-dot">{1}</div>
            <div className="admin-step-title">{steps[0].title}</div>
          </div>
          <div className="admin-step">
            <div className="admin-step-dot">{2}</div>
            <div className="admin-step-title">{steps[1].title}</div>
          </div>
          <div className="admin-step">
            <div className="admin-step-dot">{3}</div>
            <div className="admin-step-title">{steps[2].title}</div>
          </div>
          <div className="admin-step">
            <div className="admin-step-dot">{4}</div>
            <div className="admin-step-title">{steps[3].title}</div>
          </div>
          <div className="admin-step-dotline" />
        </div>

        <div className="admin-wizard-card">
          {err && <div style={{ color: 'var(--danger)', fontWeight: 900, marginBottom: 12 }}>{err}</div>}

          {stepIndex === 0 && (
            <>
              <div style={{ marginBottom: 14, color: 'var(--muted)', fontWeight: 800 }}>
                Step 1: Paste Source Link
              </div>
              <div className="admin-field" style={{ marginBottom: 10 }}>
                <label>TAOBAO, TMALL, OR WECHAT LINK</label>
                <input
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  placeholder="https://item.taobao.com/...."
                  className="admin-select"
                />
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" className="admin-btn secondary" onClick={() => nav('/admin/orders')}>
                  Back
                </button>
                <button type="button" className="admin-btn" onClick={fetchData} disabled={busy}>
                  {busy ? 'Fetching...' : 'Fetch Data'}
                </button>
              </div>
              <div className="muted" style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 800 }}>
                Support for automatic data extraction from major Chinese marketplaces.
              </div>
            </>
          )}

          {stepIndex === 1 && (
            <>
              <div style={{ marginBottom: 14, color: 'var(--muted)', fontWeight: 800 }}>
                Step 2: Product Preview
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, border: '1px solid var(--border)', borderRadius: 16, background: '#f8fafc' }}>
                <Thumb title={preview?.title || 'Product'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    PRODUCT NAME
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', marginTop: 6 }}>{preview?.title || '—'}</div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase' }}>SOURCE PRICE</div>
                      <div style={{ fontWeight: 900, color: '#2563eb' }}>${Number(preview?.priceCny) || 0}¥</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase' }}>STATUS</div>
                      <span className="admin-badge orange">DATA FETCHED</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-wizard-actions" style={{ marginTop: 18 }}>
                <button type="button" className="admin-btn secondary" onClick={() => setStepIndex(0)}>
                  Back
                </button>
                <button type="button" className="admin-btn" onClick={() => setStepIndex(2)}>
                  Continue
                </button>
              </div>
            </>
          )}

          {stepIndex === 2 && (
            <>
              <div style={{ marginBottom: 14, color: 'var(--muted)', fontWeight: 800 }}>Step 3: Manual Entry Section</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="admin-field">
                  <label>CUSTOMER NAME</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="admin-select" placeholder="e.g. Nguyen Van A" />
                </div>
                <div className="admin-field">
                  <label>CUSTOMER PHONE</label>
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="admin-select" placeholder="e.g. 09xxxxxxx" />
                </div>
                <div className="admin-field">
                  <label>SOURCE CHANNEL</label>
                  <select value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)} className="admin-select">
                    <option>Taobao</option>
                    <option>WeChat</option>
                    <option>1688</option>
                    <option>Facebook</option>
                    <option>Zalo</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>COLOR</label>
                  <input value={color} onChange={(e) => setColor(e.target.value)} className="admin-select" placeholder="e.g. Black, Navy, Sand" />
                </div>

                <div className="admin-field" style={{ gridColumn: '1 / span 2' }}>
                  <label>SIZE</label>
                  <div className="admin-pills">
                    {['S', 'M', 'L', 'XL'].map((x) => (
                      <button key={x} type="button" className={`admin-size-pill ${size === x ? 'active' : ''}`} onClick={() => setSize(x)}>
                        {x}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-field">
                  <label>QUANTITY</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="admin-select" />
                </div>
                <div className="admin-field">
                  <label>SALE PRICE [VND]</label>
                  <input type="number" min={0} value={sellPriceVnd} onChange={(e) => setSellPriceVnd(e.target.value)} className="admin-select" />
                </div>
                <div className="admin-field">
                  <label>BUY PRICE [CNY]</label>
                  <input type="number" min={0} step="0.01" value={buyPriceCny} onChange={(e) => setBuyPriceCny(e.target.value)} className="admin-select" />
                </div>
                <div className="admin-field">
                  <label>EXCHANGE RATE</label>
                  <input type="number" min={0} step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="admin-select" />
                </div>
              </div>

              <div className="admin-wizard-actions">
                <button type="button" className="admin-btn secondary" onClick={() => setStepIndex(1)}>
                  Back
                </button>
                <button type="button" className="admin-btn" onClick={() => setStepIndex(3)}>
                  Review & Finalize
                </button>
              </div>
            </>
          )}

          {stepIndex === 3 && (
            <>
              <div style={{ marginBottom: 14, color: 'var(--muted)', fontWeight: 800 }}>Step 4: Finalize</div>
              <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 16, background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Thumb title={preview?.title || 'Product'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{preview?.title || 'Product'}</div>
                    <div style={{ marginTop: 6, color: 'var(--muted)', fontWeight: 800 }}>
                      {sourceChannel} · Size {size} · {color || '—'} · Qty {quantity}
                    </div>
                  </div>
                </div>
                <div className="admin-divider" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="admin-field" style={{ margin: 0 }}>
                    <label>SALE PRICE</label>
                    <div style={{ fontWeight: 900 }}>{formatVnd(sellPriceVnd)} ₫</div>
                  </div>
                  <div className="admin-field" style={{ margin: 0 }}>
                    <label>BUY PRICE</label>
                    <div style={{ fontWeight: 900 }}>
                      {buyPriceCny} ¥ · rate {exchangeRate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-wizard-actions">
                <button type="button" className="admin-btn secondary" disabled>
                  Save as Draft
                </button>
                <button type="button" className="admin-btn" onClick={createOrder} disabled={busy}>
                  {busy ? 'Creating...' : 'Create Order'}
                </button>
              </div>
              <div className="muted" style={{ marginTop: 12, color: 'var(--muted)', fontWeight: 800 }}>
                Tạo đơn demo. Crawl Taobao thật sẽ thay vào phần “Fetch Data”.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

