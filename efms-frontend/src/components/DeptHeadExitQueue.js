import { useState, useEffect } from 'react';
import { fetchDeptExitQueue, acknowledgeExit } from '../api';

function DeptHeadExitQueue({ token }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setError('');
    setRequests(await fetchDeptExitQueue(token));
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcknowledge = async (id) => {
    setError('');
    const res = await acknowledgeExit(token, id);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to acknowledge request');
      return;
    }
    loadQueue();
  };

  return (
    <>
      <h3>Exit Requests — Your Department</h3>
      {error && <p className="error-text">{error}</p>}
      <ul className="document-list">
        {requests.map((r) => (
          <li key={r.id}>
            <span>
              {r.employee_name} — {r.exit_type} — {r.exit_date.slice(0, 10)}
              {r.reason ? ` — ${r.reason}` : ''}
            </span>
            <button className="link-btn" onClick={() => handleAcknowledge(r.id)}>Acknowledge</button>
          </li>
        ))}
        {requests.length === 0 && <li className="empty">No pending exit requests in your department.</li>}
      </ul>
    </>
  );
}

export default DeptHeadExitQueue;