import { useState, useEffect } from 'react';
import { createLeaveRequest, deleteLeaveRequest } from '../api';

// Matches the backend's SELF_CANCEL_WINDOW_MS in leaveRequests.js.
const CANCEL_WINDOW_MS = 5 * 60 * 1000;

function LeaveSection({ token, employeeId, leaveRequests, isEmployeeRole, onRefresh }) {
  const [leaveForm, setLeaveForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [error, setError] = useState('');

  // Ticks every few seconds so the "cancel" window countdown/expiry
  // updates live instead of only on the next refresh.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const hasCancellable = isEmployeeRole && leaveRequests.some((lr) => lr.status === 'Pending');
    if (!hasCancellable) return;
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [isEmployeeRole, leaveRequests]);

  const handleChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await createLeaveRequest(token, employeeId, leaveForm);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to submit request');
      return;
    }
    setLeaveForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
    onRefresh();
  };

  const handleDelete = async (id) => {
    setError('');
    const res = await deleteLeaveRequest(token, id);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to cancel request');
      return;
    }
    onRefresh();
  };

  const cancelSecondsLeft = (lr) => {
    const requestedAt = new Date(lr.requested_at).getTime();
    const msLeft = CANCEL_WINDOW_MS - (now - requestedAt);
    return Math.max(0, Math.ceil(msLeft / 1000));
  };

  return (
    <>
      <h3>Time Off Requests</h3>
      <p style={{ margin: '-6px 0 16px', fontSize: '13px' }}>
        Time away from work — vacation, sick leave, or any other temporary absence.
      </p>
      {isEmployeeRole && (
        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            name="leave_type"
            placeholder="Type of time off (e.g. Annual, Sick)"
            value={leaveForm.leave_type}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="start_date"
            value={leaveForm.start_date}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="end_date"
            value={leaveForm.end_date}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="reason"
            placeholder="Reason"
            value={leaveForm.reason}
            onChange={handleChange}
          />
          <button type="submit">Request Time Off</button>
        </form>
      )}
      {error && <p className="error-text">{error}</p>}

      <ul className="document-list">
        {leaveRequests.map((lr) => {
          const secondsLeft = isEmployeeRole && lr.status === 'Pending' ? cancelSecondsLeft(lr) : 0;
          const canCancel = secondsLeft > 0;

          return (
            <li key={lr.id}>
              <span>
                {lr.leave_type} — {lr.start_date.slice(0, 10)} to {lr.end_date.slice(0, 10)} — <strong>{lr.status}</strong>
                {isEmployeeRole && lr.status === 'Pending' && (
                  <>
                    <br />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {canCancel
                        ? `You can cancel this for ${secondsLeft}s in case you change your mind.`
                        : 'Cancellation window has passed — this is now with your Department Head.'}
                    </span>
                  </>
                )}
              </span>
              {canCancel && (
                <button className="delete-btn" onClick={() => handleDelete(lr.id)}>Cancel</button>
              )}
            </li>
          );
        })}
        {leaveRequests.length === 0 && <li className="empty">No time off requests yet.</li>}
      </ul>
    </>
  );
}

export default LeaveSection;