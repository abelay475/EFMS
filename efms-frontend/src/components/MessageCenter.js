import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchContacts, fetchConversations, fetchThread, markThreadRead, sendMessage } from '../api';

function MessageCenter({ token, currentUser }) {
  const isDeptHead = currentUser?.role === 'DeptHead';

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null); // { id, full_name, role }
  const [thread, setThread] = useState([]);
  const [showContacts, setShowContacts] = useState(false);

  const [newBody, setNewBody] = useState('');
  const [staffingChecked, setStaffingChecked] = useState(false);

  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');

  const activeContactRef = useRef(activeContact);
  activeContactRef.current = activeContact;

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations(token);
      setConversations(data);
    } catch (err) {
      setError('Failed to load conversations');
    }
  }, [token]);

  const loadContacts = useCallback(async () => {
    try {
      const data = await fetchContacts(token);
      setContacts(data);
    } catch (err) {
      setError('Failed to load contacts');
    }
  }, [token]);

  const loadThread = useCallback(async (userId) => {
    try {
      const data = await fetchThread(token, userId);
      setThread(data);
    } catch (err) {
      setError('Failed to load conversation');
    }
  }, [token]);

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, [loadConversations, loadContacts]);

  // Refresh the conversation list whenever this tab regains focus/visibility.
  useEffect(() => {
    const refresh = () => loadConversations();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadConversations]);

  // Poll the open thread every few seconds so replies show up without
  // needing to switch away and back.
  useEffect(() => {
    if (!activeContact) return;
    const timer = setInterval(() => {
      loadThread(activeContact.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeContact, loadThread]);

  const openConversation = async (contact) => {
    setError('');
    setSendError('');
    setShowContacts(false);
    setActiveContact(contact);
    await loadThread(contact.id);
    try {
      await markThreadRead(token, contact.id);
      setConversations((prev) =>
        prev.map((c) => (c.user_id === contact.id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      // non-critical — badge will clear on next refresh anyway
    }
  };

  const openNewMessage = () => {
    setShowContacts((prev) => !prev);
  };

  const canFlagStaffingRequest =
    isDeptHead && activeContact && ['HR', 'Admin'].includes(activeContact.role);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendError('');
    if (!newBody.trim() || !activeContact) return;
    try {
      await sendMessage(token, {
        recipient_id: activeContact.id,
        body: newBody.trim(),
        is_staffing_request: canFlagStaffingRequest && staffingChecked
      });
      setNewBody('');
      setStaffingChecked(false);
      await loadThread(activeContact.id);
      await loadConversations();
    } catch (err) {
      setSendError(err.message);
    }
  };

  const roleLabel = (role) => (role === 'DeptHead' ? 'Dept Head' : role);

  const contactLabel = (c) =>
    `${c.full_name} (${roleLabel(c.role)}${c.department_name ? ` — ${c.department_name}` : ''})`;

  return (
    <>
      <h3>Messages</h3>
      {error && <p className="error-text">{error}</p>}

      <div className="message-center-layout">
        <div className={`conversation-list-panel${activeContact ? ' hide-on-mobile' : ''}`}>
          <button
            type="button"
            className="link-btn"
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={openNewMessage}
          >
            {showContacts ? 'Cancel' : '+ New Message'}
          </button>

          {showContacts && (
            <ul className="document-list">
              {contacts.map((c) => (
                <li key={c.id} style={{ cursor: 'pointer' }} onClick={() => openConversation(c)}>
                  <span>{contactLabel(c)}</span>
                </li>
              ))}
              {contacts.length === 0 && <li className="empty">No other staff accounts found.</li>}
            </ul>
          )}

          {!showContacts && (
            <ul className="document-list">
              {conversations.map((c) => (
                <li
                  key={c.user_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openConversation({ id: c.user_id, full_name: c.full_name, role: c.role })}
                >
                  <span>
                    <strong>{c.full_name}</strong> ({roleLabel(c.role)})
                    {c.unread_count > 0 && (
                      <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}> · {c.unread_count} new</span>
                    )}
                    <br />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {c.last_is_staffing_request ? '[Staffing Request] ' : ''}
                      {c.last_body && c.last_body.length > 60 ? `${c.last_body.slice(0, 60)}...` : c.last_body}
                    </span>
                  </span>
                </li>
              ))}
              {conversations.length === 0 && <li className="empty">No conversations yet — start one above.</li>}
            </ul>
          )}
        </div>

        <div className="thread-panel">
          {!activeContact && (
            <p style={{ marginTop: 0 }}>Select a conversation, or start a new message.</p>
          )}

          {activeContact && (
            <>
              <button
                type="button"
                className="link-btn hide-on-desktop"
                style={{ marginBottom: '10px' }}
                onClick={() => setActiveContact(null)}
              >
                ← Back
              </button>
              <h3 style={{ marginTop: 0 }}>
                {activeContact.full_name} ({roleLabel(activeContact.role)})
              </h3>

              <div className="chat-thread">
                {thread.map((m) => {
                  const mine = m.sender_id === currentUser.id;
                  return (
                    <div key={m.id} className={`chat-bubble${mine ? ' mine' : ''}`}>
                      {!!m.is_staffing_request && (
                        <span className="chat-bubble-tag">Staffing Request</span>
                      )}
                      <div>{m.body}</div>
                      <span className="chat-bubble-time">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  );
                })}
                {thread.length === 0 && (
                  <p className="empty" style={{ padding: '12px 0' }}>No messages yet — say hello.</p>
                )}
              </div>

              <form onSubmit={handleSend} className="upload-form" style={{ marginTop: '14px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  style={{ flex: '1 1 100%' }}
                  required
                />
                {canFlagStaffingRequest && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={staffingChecked}
                      onChange={(e) => setStaffingChecked(e.target.checked)}
                    />
                    Mark as Staffing Request
                  </label>
                )}
                <button type="submit">Send</button>
              </form>
              {sendError && <p className="error-text">{sendError}</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default MessageCenter;