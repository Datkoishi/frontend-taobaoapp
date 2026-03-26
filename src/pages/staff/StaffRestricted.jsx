import { Link } from 'react-router-dom';

export default function StaffRestricted() {
  return (
    <div className="staff-card" style={{ maxWidth: 520 }}>
      <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>Không có quyền truy cập</div>
      <div style={{ color: 'var(--staff-muted)', fontWeight: 800, marginTop: 8 }}>
        Chỉ quản trị viên mới xem được mục này.
      </div>
      <Link to="/staff" style={{ display: 'inline-block', marginTop: 16, fontWeight: 900, color: '#2563eb' }}>
        ← Về tổng quan
      </Link>
    </div>
  );
}
