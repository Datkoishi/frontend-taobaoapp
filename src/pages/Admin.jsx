import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout.jsx';
import AdminExecutiveDashboard from './admin/AdminExecutiveDashboard.jsx';
import AdminPurchaseManager from './admin/AdminPurchaseManager.jsx';
import AdminCreateOrderWizard from './admin/AdminCreateOrderWizard.jsx';
import AdminOrders from './admin/AdminOrders.jsx';
import AdminReportsAnalytics from './admin/AdminReportsAnalytics.jsx';

function Placeholder({ title }) {
  return (
    <div className="admin-card">
      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{title}</div>
      <div style={{ marginTop: 8, color: 'var(--muted)', fontWeight: 800 }}>
        Demo UI. Bạn có thể nối API tương ứng sau.
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminExecutiveDashboard />} />
        <Route path="purchase" element={<AdminPurchaseManager />} />
        <Route path="create-order" element={<AdminCreateOrderWizard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reports" element={<AdminReportsAnalytics />} />
        <Route path="shipping" element={<Placeholder title="Shipping (demo)" />} />
        <Route path="finance" element={<Placeholder title="Finance (demo)" />} />
        <Route path="staff" element={<Placeholder title="Staff (demo)" />} />
        <Route path="settings" element={<Placeholder title="Settings (demo)" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}
