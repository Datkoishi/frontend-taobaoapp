import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OrderNew from './pages/OrderNew.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Admin from './pages/Admin.jsx';
import StaffLayout from './pages/staff/StaffLayout.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffOrders from './pages/staff/StaffOrders.jsx';
import StaffShipping from './pages/staff/StaffShipping.jsx';
import StaffReports from './pages/staff/StaffReports.jsx';
import StaffPlaceholder from './pages/staff/StaffPlaceholder.jsx';

function Shell({ children }) {
  const { session, profile, supabase: client } = useAuth();

  async function signOut() {
    if (client) await client.auth.signOut();
  }

  if (!session) {
    return <div className="layout">{children}</div>;
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Đơn hàng Taobao · Nội bộ</div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Đơn hàng
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : undefined)}>
              Quản lý
            </NavLink>
          )}
          <button type="button" className="btn secondary" onClick={signOut}>
            Đăng xuất
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="layout muted">Đang tải…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="layout muted">Đang tải…</div>;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="layout muted">Đang tải…</div>;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/staff" replace />;
}

function StaffRouteGuard({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="layout muted">Đang tải…</div>;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile?.role !== 'admin') return children;
  return <Navigate to="/staff" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <Shell>
              <Login />
            </Shell>
          }
        />
        <Route
          path="/register"
          element={
            <Shell>
              <Register />
            </Shell>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <RoleRedirect />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffDashboard />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/orders"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffOrders />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/orders/new"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <OrderNew />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/orders/:id"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <OrderDetail />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/purchase"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffPlaceholder title="Purchase (demo)" />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/shipping"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffShipping />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/finance"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffDashboard />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/reports"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffReports />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/staff"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffPlaceholder title="Staff (demo)" />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/settings"
          element={
            <PrivateRoute>
              <StaffRouteGuard>
                <StaffLayout>
                  <StaffPlaceholder title="Settings (demo)" />
                </StaffLayout>
              </StaffRouteGuard>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders/new"
          element={
            <PrivateRoute>
              <StaffLayout>
                <OrderNew />
              </StaffLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <PrivateRoute>
              <StaffLayout>
                <OrderDetail />
              </StaffLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
