import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { session, supabase } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!supabase) {
      setError('Thiếu cấu hình Supabase (.env)');
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Đăng nhập</h2>
      <form onSubmit={onSubmit}>
        <label className="label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '0.75rem' }}
        />
        <label className="label">Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        {error && (
          <p className="muted" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn">
          Đăng nhập
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Tạo user trong Supabase Auth, chạy SQL schema, cập nhật role admin trong bảng{' '}
        <code>profiles</code> nếu cần.
      </p>
    </div>
  );
}
