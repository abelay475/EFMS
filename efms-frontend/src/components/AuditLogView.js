import { useState, useEffect } from 'react';
import { fetchAuditLog } from '../api';

const PAGE_SIZE = 20;

function AuditLogView({ token }) {
  // Always shows only the most recent 20 entries. Typing in the search box
  // re-queries the backend (action / entity / user / details) instead of
  // filtering an in-memory list — older entries are reached via search,
  // never by loading more.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce the search box so we don't hit the backend on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAuditLog(token, { page: 1, limit: PAGE_SIZE, search });
        if (cancelled) return;
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } catch (err) {
        if (!cancelled) setError('Failed to load audit log');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search, token]);

  return (
    <>
      <h3>Audit Log</h3>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by action, entity, user, or details..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="scroll-panel">
        <ul className="document-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span>
                <strong>{log.action}</strong> on {log.entity_type}
                {log.entity_id ? ` #${log.entity_id}` : ''} — by {log.full_name || 'Unknown'} ({log.role || 'N/A'})
                {log.details ? ` — ${log.details}` : ''}
                <br />
                <span style={{ color: '#888', fontSize: '12px' }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </span>
            </li>
          ))}

          {logs.length === 0 && !loading && (
            <li className="empty">
              {search ? 'No activity matches your search.' : 'No activity recorded yet.'}
            </li>
          )}

          <li className="scroll-status" style={{ display: 'block', border: 'none', padding: '10px 0' }}>
            {loading
              ? 'Loading...'
              : logs.length > 0
                ? `Showing latest ${logs.length} of ${total}${search ? ' matching' : ''}`
                : ''}
          </li>
        </ul>
      </div>
    </>
  );
}

export default AuditLogView;