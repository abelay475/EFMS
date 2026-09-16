import { useState, useEffect } from 'react';
import { fetchVacancies, createVacancy, updateVacancy, approveVacancy, rejectVacancy, deleteVacancy, fetchDepartments } from '../api';

function VacancyManager({ token, currentUser }) {
  const isAdmin = currentUser?.role === 'Admin';
  const isHR = currentUser?.role === 'HR';

  const [vacancies, setVacancies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ title: '', department_id: '', description: '', deadline: '' });
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadVacancies = async () => {
    const data = await fetchVacancies(token);
    setVacancies(data);
  };

  useEffect(() => {
    loadVacancies();
    fetchDepartments(token).then(setDepartments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await createVacancy(token, form);
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create vacancy');
        return;
      }
      setForm({ title: '', department_id: '', description: '', deadline: '' });
      loadVacancies();
    } catch (err) {
      setFormError('Failed to create vacancy');
    }
  };

  const handleToggleStatus = async (vacancy) => {
    const newStatus = vacancy.status === 'Open' ? 'Closed' : 'Open';
    await updateVacancy(token, vacancy.id, { ...vacancy, status: newStatus });
    loadVacancies();
  };

  const handleApprove = async (id, title) => {
    if (!window.confirm(`Approve and publish vacancy "${title}"?`)) return;
    await approveVacancy(token, id);
    loadVacancies();
  };

  const handleReject = async (id, title) => {
    const reason = window.prompt(`Reason for rejecting "${title}" (optional):`) || '';
    await rejectVacancy(token, id, reason);
    loadVacancies();
  };

  const openDeleteConfirm = (vacancy) => {
    setDeleteTarget(vacancy);
    setDeleteError('');
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    setDeleteError('');
    try {
      await deleteVacancy(token, deleteTarget.id);
      setDeleteTarget(null);
      loadVacancies();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete vacancy');
    }
  };

  return (
    <>
      <h3>Vacancies</h3>

      {isHR && (
        <form onSubmit={handleSubmit} className="upload-form">
          <input
            name="title"
            placeholder="Job Title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <select name="department_id" value={form.department_id} onChange={handleChange} required>
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
          />
          <button type="submit">Submit for Approval</button>
        </form>
      )}
      {formError && <p className="error-text">{formError}</p>}

      <ul className="document-list">
        {vacancies.map((v) => (
          <li key={v.id}>
            <span>
              <strong>{v.title}</strong> — {v.department} — <strong>{v.status}</strong>
            </span>
            <span>
              {isAdmin && v.status === 'Pending Approval' && (
                <>
                  <button className="link-btn" onClick={() => handleApprove(v.id, v.title)}>Approve</button>{' '}
                  <button className="delete-btn" onClick={() => handleReject(v.id, v.title)}>Reject</button>{' '}
                </>
              )}
              {(v.status === 'Open' || v.status === 'Closed') && isHR && (
                <button className="link-btn" onClick={() => handleToggleStatus(v)}>
                  {v.status === 'Open' ? 'Close' : 'Reopen'}
                </button>
              )}{' '}
              {(isAdmin || isHR) && (
                <button className="delete-btn" onClick={() => openDeleteConfirm(v)}>Delete</button>
              )}
            </span>
          </li>
        ))}
        {vacancies.length === 0 && <li className="empty">No vacancies posted yet.</li>}
      </ul>

      {deleteTarget && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Vacancy</h2>
              <button className="close-btn" onClick={closeDeleteConfirm}>×</button>
            </div>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
              This cannot be undone.
            </p>
            <div className="upload-form" style={{ border: 'none', paddingBottom: 0, marginBottom: 0 }}>
              <button className="delete-btn" onClick={confirmDelete}>Confirm Delete</button>
              <button className="link-btn" onClick={closeDeleteConfirm}>Cancel</button>
            </div>
            {deleteError && <p className="error-text">{deleteError}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default VacancyManager;