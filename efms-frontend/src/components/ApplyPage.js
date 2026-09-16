// src/components/ApplyPage.js
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicVacancies, submitApplication } from '../api';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function ApplyPage() {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [cvFile, setCvFile] = useState(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadVacancies = useCallback(async () => {
    const data = await fetchPublicVacancies();
    setVacancies(data);

    // If the vacancy the user has open no longer appears in the fresh
    // list (closed or deleted while this tab was open), and they haven't
    // already submitted, kick them back to the list instead of leaving
    // them stuck on a dead application form.
    setSelectedVacancy((current) => {
      if (!current || referenceCode) return current;
      const stillOpen = data.some((v) => v.id === current.id);
      return stillOpen ? current : null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceCode]);

  useEffect(() => {
    loadVacancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silently refresh the vacancy list whenever this tab regains focus or
  // becomes visible again, so a vacancy closed/edited elsewhere is
  // reflected without needing a manual page reload.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadVacancies();
      }
    };

    window.addEventListener('focus', loadVacancies);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', loadVacancies);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadVacancies]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!cvFile) {
      setError('Please attach your CV.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('vacancy_id', selectedVacancy.id);
      payload.append('full_name', form.full_name);
      payload.append('email', form.email);
      payload.append('phone', form.phone);
      payload.append('cv', cvFile);

      const data = await submitApplication(payload);
      setReferenceCode(data.reference_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (referenceCode) {
    return (
      <div className="home-page">
        <SiteHeader />
        <div className="auth-card">
          <h1>Application Submitted</h1>
          <p className="auth-subtitle">
            Your application has been received. Save your reference code below.
            You'll need it to check your application status.
          </p>
          <p className="reference-code">{referenceCode}</p>
          <p style={{ fontSize: '13.5px', textAlign: 'center' }}>
            A confirmation was also sent to <strong>{form.email}</strong>.
          </p>
          <Link to="/" className="btn btn-primary btn-block" style={{ marginTop: '20px' }}>
            Back to Home
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (selectedVacancy) {
    return (
      <div className="home-page">
        <SiteHeader />
        <div className="auth-card">
          <h1>{selectedVacancy.title}</h1>
          <p className="auth-subtitle">{selectedVacancy.department}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label className="field-label" htmlFor="apply-name">Full Name</label>
              <input
                id="apply-name"
                name="full_name"
                placeholder="Your full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="apply-email">Email</label>
              <input
                id="apply-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="apply-phone">Phone</label>
              <input
                id="apply-phone"
                name="phone"
                placeholder="+251 ..."
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field-group">
              <span className="field-label">CV</span>
              <div className="file-field">
                <label htmlFor="apply-cv" className="file-field-btn">
                  {cvFile ? 'Change File' : 'Choose File'}
                </label>
                <input
                  id="apply-cv"
                  type="file"
                  onChange={(e) => setCvFile(e.target.files[0])}
                  required
                  style={{ display: 'none' }}
                />
                <span className="file-field-name">{cvFile ? cvFile.name : 'No file selected'}</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setSelectedVacancy(null)}
            >
              Back to vacancies
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="home-page">
      <SiteHeader />

      <div className="container">
        <h1>Open Vacancies · Wollega University</h1>

        <div className="vacancy-grid">
          {vacancies.map((v) => (
            <div className="vacancy-card" key={v.id}>
              <div className="vacancy-card-top">
                <h3 className="vacancy-card-title">{v.title}</h3>
              </div>
              <p className="vacancy-card-dept">{v.department}</p>
              {v.deadline && (
                <span className="vacancy-deadline-pill">Deadline {v.deadline.slice(0, 10)}</span>
              )}
              {v.description && <p className="vacancy-card-desc">{v.description}</p>}
              <button className="btn btn-primary btn-block" onClick={() => setSelectedVacancy(v)}>
                Apply Now
              </button>
            </div>
          ))}
          {vacancies.length === 0 && (
            <p className="empty-state">No open vacancies at the moment.</p>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

export default ApplyPage;