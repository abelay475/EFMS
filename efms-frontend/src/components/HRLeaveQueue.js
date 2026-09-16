import { useState, useEffect } from 'react';
import { BASE_URL } from '../api';

function HRLeaveQueue({ token }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${token}`,
    ...extra
  });

  const loadQueue = async () => {
    setError('');
    const res = await fetch(`${BASE_URL}/leave-requests/hr/queue`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load queue');
      return;
    }
    setRequests(data);
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinalize = async (id) => {
    setError('');
    const res = await fetch(`${BASE_URL}/leave-requests/${id}/finalize`, {
      method: 'PUT',
      headers: authHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to finalize request');
      return;
    }
    loadQueue();
  };

  return (
    <>
      <h3>Time Off Requests — Awaiting Finalization</h3>
      {error && <p className="error-text">{error}</p>}
      <ul className="document-list">
        {requests.map((r) => (
          <li key={r.id}>
            <span>
              {r.employee_name} — {r.department_name || 'No department'} — {r.leave_type} — {r.start_date.slice(0, 10)} to {r.end_date.slice(0, 10)}
            </span>
            <button className="link-btn" onClick={() => handleFinalize(r.id)}>Finalize</button>
          </li>
        ))}
        {requests.length === 0 && <li className="empty">No requests awaiting finalization.</li>}
      </ul>
    </>
  );
}

export default HRLeaveQueue;