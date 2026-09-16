// src/components/Login.js
import { useState } from 'react';
import { login } from '../api';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function Login({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);
    try {
      const data = await login(loginForm.email, loginForm.password);
      sessionStorage.setItem('efms_token', data.token);
      sessionStorage.setItem('efms_user', JSON.stringify(data.user));
      onLoginSuccess(data.token, data.user);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      <SiteHeader />

      <div className="auth-card">
        <h1>Staff Login</h1>
        <p className="auth-subtitle">Sign in to manage employee records, applications, and time off.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@wollegauniversity.edu.et"
              value={loginForm.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        {loginError && <p className="error-text">{loginError}</p>}

        <p className="auth-footer-note">
          Don't have access yet? Contact your HR office to request an account.
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}

export default Login;