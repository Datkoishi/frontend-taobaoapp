import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { session, supabase } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (session) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supabase) {
      setError('Thiếu cấu hình Supabase (.env)');
      return;
    }

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || undefined,
        },
      },
    });

    if (err) {
      setError(err.message);
      return;
    }

    setSuccess('Đăng ký thành công. Kiểm tra email để xác nhận (nếu project bật xác thực).');
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
      <h2 style={{ marginTop: 0 }}>Đăng ký</h2>
      <form onSubmit={onSubmit}>
        <label className="label">Họ tên (tuỳ chọn)</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ width: '100%', marginBottom: '0.75rem' }}
        />

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
        {success && (
          <p className="muted" style={{ color: 'var(--success)' }}>
            {success}
          </p>
        )}

        <button type="submit" className="btn">
          Tạo tài khoản
        </button>
      </form>

      <p className="muted" style={{ marginTop: '1rem' }}>
        Đã có tài khoản?{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

