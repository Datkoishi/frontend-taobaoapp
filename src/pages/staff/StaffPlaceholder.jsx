export default function StaffPlaceholder({ title, subtitle }) {
  return (
    <div className="staff-card">
      <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{title}</div>
      <div style={{ color: 'var(--staff-muted)', fontWeight: 800, marginTop: 6 }}>
        {subtitle || 'Demo UI. Connect API later.'}
      </div>
    </div>
  );
}

