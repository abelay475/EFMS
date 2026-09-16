// src/components/StatusCheckPage.js
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkApplicationStatus } from '../api';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function statusSlug(status) {
  return (status || '').toLowerCase().replace(/\s+/g, '-');
}

function StatusCheckPage() {
  const [form, setForm] = useState({ reference_code: '', email: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const data = await checkApplicationStatus(form.reference_code, form.email);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="home-page">
      <SiteHeader />

      <div className="auth-card">
        <h1>Check Application Status</h1>
        <p className="auth-subtitle">
          Enter the reference code from your confirmation email along with the email you applied with.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="status-ref">Reference Code</label>
            <input
              id="status-ref"
              name="reference_code"
              placeholder="APP-2026-1234"
              value={form.reference_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="status-email">Email</label>
            <input
              id="status-email"
              type="email"
              name="email"
              placeholder="Email used to apply"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Checking…' : 'Check Status'}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        {result && (
          <div className="status-result">
            <p className="status-result-label">Position</p>
            <p className="status-result-value">{result.vacancy_title || 'N/A'}</p>
            <p className="status-result-label" style={{ marginTop: '14px' }}>Status</p>
            <span className={`status-pill status-${statusSlug(result.status)}`}>{result.status}</span>
          </div>
        )}

        <p className="auth-footer-note">
          <Link to="/apply">Looking for open positions instead?</Link>
        </p>
      </div>

      <SiteFooter />
    </div>
  );
}

export default StatusCheckPage;