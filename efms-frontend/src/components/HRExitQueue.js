import { useState, useEffect } from 'react';
import { fetchHRExitQueue, finalizeExit } from '../api';

function HRExitQueue({ token }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    setError('');
    setRequests(await fetchHRExitQueue(token));
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinalize = async (id) => {
    setError('');
    const res = await finalizeExit(token, id);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to finalize exit');
      return;
    }
    loadQueue();
  };

  return (
    <>
      <h3>Exit Requests — Awaiting Finalization</h3>
      {error && <p className="error-text">{error}</p>}
      <ul className="document-list">
        {requests.map((r) => (
          <li key={r.id}>
            <span>
              {r.employee_name} — {r.department_name || 'No department'} — {r.exit_type} — {r.exit_date.slice(0, 10)}
            </span>
            <button className="link-btn" onClick={() => handleFinalize(r.id)}>Finalize</button>
          </li>
        ))}
        {requests.length === 0 && <li className="empty">No exit requests awaiting finalization.</li>}
      </ul>
    </>
  );
}

export default HRExitQueue;