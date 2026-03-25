import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import OrderNew from './pages/OrderNew.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Admin from './pages/Admin.jsx';

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
          path="/"
          element={
            <PrivateRoute>
              <Shell>
                <Orders />
              </Shell>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders/new"
          element={
            <PrivateRoute>
              <Shell>
                <OrderNew />
              </Shell>
            </PrivateRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <PrivateRoute>
              <Shell>
                <OrderDetail />
              </Shell>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <Shell>
                  <Admin />
                </Shell>
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
