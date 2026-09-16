// src/components/SelfRegisterPage.js
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { selfRegister } from '../api';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function SelfRegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This registration link is missing a token. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await selfRegister(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="home-page">
        <SiteHeader />
        <div className="auth-card">
          <h1>Account Created</h1>
          <p className="auth-subtitle">
            Your account has been set up successfully. You can now log in using your email and the
            password you just chose.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            Go to Login
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="home-page">
      <SiteHeader />
      <div className="auth-card">
        <h1>Set Up Your Account</h1>
        <p className="auth-subtitle">Choose a password to activate your EFMS account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="register-password">New Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Setting up…' : 'Set Password'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>
      <SiteFooter />
    </div>
  );
}

export default SelfRegisterPage;