export const ORDER_STATUS_LABEL = {
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

export const TRACK_LABEL = {
  PENDING: 'Chờ lấy hàng',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao thành công',
  FAILED: 'Giao thất bại',
};

export function safeToNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function importVnd(order) {
  const qty = safeToNumber(order?.quantity) || 1;
  const cny = safeToNumber(order?.buy_price_cny);
  const rate = safeToNumber(order?.exchange_rate);
  return Math.round(cny * rate * qty);
}

export function getStatusBadge(status) {
  switch (status) {
    case 'NEW':
      return { cls: 'gray', label: 'NEW' };
    case 'DEPOSITED':
      return { cls: 'purple', label: 'PAID' };
    case 'ORDERED':
      return { cls: 'blue', label: 'ORDERED' };
    case 'SHIPPING_CN':
      return { cls: 'orange', label: 'SHIPPING CN' };
    case 'SHIPPING_VN':
      return { cls: 'orange', label: 'SHIPPING VN' };
    case 'IN_STOCK':
      return { cls: 'teal', label: 'IN STOCK' };
    case 'DELIVERING':
      return { cls: 'teal', label: 'DELIVERING' };
    case 'COMPLETED':
      return { cls: 'green', label: 'DELIVERED' };
    case 'FAILED':
      return { cls: 'red', label: 'FAILED' };
    default:
      return { cls: 'gray', label: status || '—' };
  }
}

export function initialsFromText(s) {
  if (!s) return 'U';
  const x = String(s).trim();
  if (!x) return 'U';
  return x.slice(0, 2).toUpperCase();
}

export function formatVnd(value) {
  const n = safeToNumber(value);
  return n.toLocaleString('vi-VN');
}

export function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { month: 'short', day: '2-digit' });
}

export function monthKey(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

