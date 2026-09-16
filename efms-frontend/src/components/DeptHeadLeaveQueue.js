import { useState, useEffect } from 'react';
import { BASE_URL } from '../api';

function DeptHeadLeaveQueue({ token }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const authHeaders = (extra = {}) => ({
    Authorization: `Bearer ${token}`,
    ...extra
  });

  const loadQueue = async () => {
    setError('');
    const res = await fetch(`${BASE_URL}/leave-requests/department/pending`, { headers: authHeaders() });
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

  const handleDecision = async (id, decision) => {
    setError('');
    const res = await fetch(`${BASE_URL}/leave-requests/${id}/depthead-decision`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ decision })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to update request');
      return;
    }
    loadQueue();
  };

  return (
    <>
      <h3>Time Off Requests — Your Department</h3>
      {error && <p className="error-text">{error}</p>}
      <ul className="document-list">
        {requests.map((r) => (
          <li key={r.id}>
            <span>
              {r.employee_name} — {r.leave_type} — {r.start_date.slice(0, 10)} to {r.end_date.slice(0, 10)}
              {r.reason ? ` — ${r.reason}` : ''}
            </span>
            <span>
              <button className="link-btn" onClick={() => handleDecision(r.id, 'Approved')}>Approve</button>{' '}
              <button className="delete-btn" onClick={() => handleDecision(r.id, 'Rejected')}>Reject</button>
            </span>
          </li>
        ))}
        {requests.length === 0 && <li className="empty">No pending time off requests in your department.</li>}
      </ul>
    </>
  );
}

export default DeptHeadLeaveQueue;