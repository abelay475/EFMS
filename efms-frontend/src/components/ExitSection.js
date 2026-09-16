import { useState } from 'react';
import { submitExit } from '../api';

const EXIT_TYPES_SELF = ['Resignation', 'Retirement'];
const EXIT_TYPES_STAFF = ['Resignation', 'Retirement', 'Termination', 'Contract End'];

function statusNote(status) {
  if (status === 'Pending') return "Awaiting your Department Head's acknowledgement.";
  if (status === 'Acknowledged') return 'Acknowledged by your Department Head — awaiting HR to finalize.';
  return '';
}

// canRequest: an Employee requesting their own exit (creates Pending)
// canRecord: HR recording an exit directly for someone else (creates Finalized)
// Only one of these is ever true for a given caller — never both.
function ExitSection({ token, employeeId, exitRecords, onRefresh, canRequest, canRecord }) {
  const [form, setForm] = useState({ exit_type: '', exit_date: '', reason: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasOpenRequest = exitRecords.some((r) => r.status === 'Pending' || r.status === 'Acknowledged');
  const exitTypes = canRecord ? EXIT_TYPES_STAFF : EXIT_TYPES_SELF;
  const showForm = (canRequest && !hasOpenRequest) || canRecord;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await submitExit(token, employeeId, form);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit exit');
        return;
      }
      setForm({ exit_type: '', exit_date: '', reason: '' });
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3>Exit / Offboarding</h3>

      {showForm && (
        <form onSubmit={handleSubmit} className="upload-form">
          <select name="exit_type" value={form.exit_type} onChange={handleChange} required>
            <option value="">{canRecord ? 'Select type' : 'Select reason'}</option>
            {exitTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input type="date" name="exit_date" value={form.exit_date} onChange={handleChange} required />
          <input
            type="text"
            name="reason"
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={handleChange}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? (canRecord ? 'Recording…' : 'Submitting…') : (canRecord ? 'Record Exit' : 'Request Exit')}
          </button>
        </form>
      )}

      {canRequest && hasOpenRequest && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Your exit request is already in progress — see status below.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <ul className="document-list">
        {exitRecords.map((r) => (
          <li key={r.id}>
            <span>
              {r.exit_type} — {r.exit_date.slice(0, 10)} — <strong>{r.status}</strong>
              {r.reason ? ` — ${r.reason}` : ''}
              {canRequest && statusNote(r.status) && (
                <>
                  <br />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {statusNote(r.status)}
                  </span>
                </>
              )}
            </span>
          </li>
        ))}
        {exitRecords.length === 0 && <li className="empty">No exit records.</li>}
      </ul>
    </>
  );
}

export default ExitSection;