export function formatVnd(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('vi-VN');
}

export function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function orderStatusBadge(status) {
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

