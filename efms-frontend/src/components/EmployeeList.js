// src/components/EmployeeList.js
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createEmployee,
  deleteEmployee,
  grantPortalAccess,
  fetchDepartments,
  fetchPositions,
  fetchEmployees
} from '../api';
import { PeopleIcon, BuildingIcon, BriefcaseIcon, PlusIcon, EmptyTableArt } from './icons';
import { initials, statusSlug } from '../utils/format';

const PAGE_SIZE = 10;

function EmployeeList({ token, currentUser, onRefresh, onManage }) {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    status: 'Applicant',
    hire_date: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [formError, setFormError] = useState('');

  const [grantTarget, setGrantTarget] = useState(null);
  const [grantRole, setGrantRole] = useState('Employee');
  const [grantError, setGrantError] = useState('');
  const [grantSuccess, setGrantSuccess] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const isDeptHead = currentUser?.role === 'DeptHead';
  const isAdmin = currentUser?.role === 'Admin';

  // ----- Search + infinite-scroll state -----
  // The table only ever loads 10 employees at a time (most recent first,
  // same ordering as before). Typing in the search box re-queries the
  // backend instead of filtering a giant in-memory list, and scrolling
  // to the bottom loads the next 10 automatically.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);
  const [listError, setListError] = useState('');

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    fetchDepartments(token).then(setDepartments);
    fetchPositions(token).then(setPositions);
  }, [token]);

  // Debounce the search box so we don't hit the backend on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadPage = useCallback(async (pageToLoad, replace, currentSearch) => {
    setLoadingPage(true);
    setListError('');
    try {
      const data = await fetchEmployees(token, { page: pageToLoad, limit: PAGE_SIZE, search: currentSearch });
      const rows = data.employees || [];
      setTotal(data.total || 0);
      setEmployees((prev) => (replace ? rows : [...prev, ...rows]));
      setPage(pageToLoad);
    } catch (err) {
      setListError('Failed to load employees');
    } finally {
      setLoadingPage(false);
    }
  }, [token]);

  // Whenever the (debounced) search term changes, start over from page 1.
  useEffect(() => {
    setEmployees([]);
    setPage(1);
    loadPage(1, true, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, token]);

  const hasMore = employees.length < total;

  const resetAndReload = useCallback(() => {
    setEmployees([]);
    setPage(1);
    loadPage(1, true, searchRef.current);
  }, [loadPage]);

  // Infinite scroll: a sentinel row sits at the bottom of the visible
  // table; once it scrolls into view (inside the scrollable container)
  // we fetch the next page and append it.
  useEffect(() => {
    const node = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!node || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingPage) {
          loadPage(page + 1, false, searchRef.current);
        }
      },
      { root, rootMargin: '80px', threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadingPage, page, loadPage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!cvFile) {
      setFormError('A CV file is required to add an employee.');
      return;
    }
    try {
      await createEmployee(token, formData, cvFile);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        department_id: '',
        position_id: '',
        status: 'Applicant',
        hire_date: ''
      });
      setCvFile(null);
      setShowAddForm(false);
      resetAndReload();
      onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openDeleteConfirm = (emp) => {
    setDeleteTarget(emp);
    setDeleteError('');
  };

  const closeDeleteConfirm = () => {
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    setDeleteError('');
    try {
      await deleteEmployee(token, deleteTarget.id);
      setDeleteTarget(null);
      resetAndReload();
      onRefresh();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  const openGrantAccess = (emp) => {
    setGrantTarget(emp);
    setGrantRole('Employee');
    setGrantError('');
    setGrantSuccess('');
  };

  const closeGrantAccess = () => {
    setGrantTarget(null);
    setGrantError('');
    setGrantSuccess('');
  };

  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    setGrantError('');
    setGrantSuccess('');
    try {
      await grantPortalAccess(token, grantTarget.id, grantRole);
      setGrantSuccess(`Registration link sent to ${grantTarget.email}`);
      resetAndReload();
      onRefresh();
    } catch (err) {
      setGrantError(err.message);
    }
  };

  const canDelete = (emp) => {
    if (isAdmin) return true;
    if (emp.user_id === currentUser?.id) return false;
    if (['HR', 'DeptHead', 'Admin'].includes(emp.linked_role)) return false;
    return true;
  };

  // Applicant-track candidates (came in via /apply) can't be granted access
  // until the Department Head has marked them "Hired". Directly-added
  // employees (no vacancy_id) skip this pipeline entirely.
  const isPendingHireDecision = (emp) => !!emp.vacancy_id && emp.status !== 'Hired';

  // Admin-added employees have a real position from the positions table.
  // Self-applicants don't (there's no position link on a vacancy) — for
  // those, fall back to showing the vacancy title they applied for.
  const displayPosition = (emp) => emp.position_title || emp.vacancy_title || '—';

  const columnCount = 6 + (!isDeptHead ? 1 : 0) + (isAdmin ? 1 : 0) + (!isDeptHead ? 1 : 0);

  return (
    <>
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <span className="dash-stat-icon"><PeopleIcon /></span>
          <div>
            <p className="dash-stat-value">{total}</p>
            <p className="dash-stat-label">{isDeptHead ? 'In Your Department' : 'Total Employees'}</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-icon info"><BuildingIcon /></span>
          <div>
            <p className="dash-stat-value">{departments.length}</p>
            <p className="dash-stat-label">Departments</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-icon slate"><BriefcaseIcon /></span>
          <div>
            <p className="dash-stat-value">{positions.length}</p>
            <p className="dash-stat-label">Positions</p>
          </div>
        </div>
      </div>

      <div className="dash-section-header">
        <div>
          <h2 className="dash-section-title">Employees</h2>
          <p className="dash-section-subtitle">
            {search ? `Showing results for "${search}"` : `${total} record${total === 1 ? '' : 's'} on file`}
          </p>
        </div>
        {!isDeptHead && (
          <button
            type="button"
            className={`btn-add${showAddForm ? ' is-open' : ''}`}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Cancel' : (<><PlusIcon /> Add Employee</>)}
          </button>
        )}
      </div>

      {!isDeptHead && showAddForm && (
        <div className="dash-panel dash-form-card">
          <p className="dash-form-title">New Employee</p>
          <form onSubmit={handleSubmit}>
            <div className="dash-form-grid">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <label className="field-label">Email</label>
                <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <label className="field-label">Phone</label>
                <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="field-group">
                <label className="field-label">Department</label>
                <select name="department_id" value={formData.department_id} onChange={handleChange} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Position</label>
                <select name="position_id" value={formData.position_id} onChange={handleChange} required>
                  <option value="">Select Position</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Applicant">Applicant</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Hire Date</label>
                <input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} required />
              </div>
              <div className="field-group">
                <span className="field-label">CV</span>
                <div className="file-field">
                  <label htmlFor="employee-cv" className="file-field-btn">
                    {cvFile ? 'Change File' : 'Choose File'}
                  </label>
                  <input
                    id="employee-cv"
                    type="file"
                    onChange={(e) => setCvFile(e.target.files[0])}
                    required
                    style={{ display: 'none' }}
                  />
                  <span className="file-field-name">{cvFile ? cvFile.name : 'No file selected'}</span>
                </div>
              </div>
            </div>
            <div className="dash-form-actions">
              <button type="submit" className="btn btn-primary">Add Employee</button>
              <button type="button" className="link-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
          {formError && <p className="error-text">{formError}</p>}
        </div>
      )}

      <div className="dash-table-panel">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {listError && <p className="error-text" style={{ padding: '0 20px' }}>{listError}</p>}

        <div className="table-scroll" ref={scrollContainerRef}>
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Status</th>
                <th>Hire Date</th>
                {!isDeptHead && <th>Manage</th>}
                {isAdmin && <th>Access</th>}
                {!isDeptHead && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const isYou = emp.user_id === currentUser?.id;
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="employee-name-cell">
                        <span className="employee-avatar">{initials(emp.full_name)}</span>
                        <span>
                          {emp.full_name}
                          {isYou && <span className="chip chip-you">You</span>}
                        </span>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      {emp.department_name ? (
                        <span className="chip chip-info">{emp.department_name}</span>
                      ) : '—'}
                    </td>
                    <td>{displayPosition(emp)}</td>
                    <td>
                      <span className={`status-pill status-${statusSlug(emp.status)}`}>{emp.status}</span>
                    </td>
                    <td>{emp.hire_date ? emp.hire_date.slice(0, 10) : ''}</td>
                    {!isDeptHead && (
                      <td>
                        <button className="link-btn" onClick={() => onManage(emp)}>
                          {isAdmin ? 'View' : 'Manage'}
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td>
                        {emp.user_id ? (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12.5px' }}>Active</span>
                        ) : isPendingHireDecision(emp) ? (
                          <span
                            style={{ color: 'var(--color-text-muted)', fontSize: '12.5px' }}
                            title="Available once the Department Head marks this applicant as Hired"
                          >
                            Awaiting Hire Decision
                          </span>
                        ) : (
                          <button className="link-btn" onClick={() => openGrantAccess(emp)}>Grant Access</button>
                        )}
                      </td>
                    )}
                    {!isDeptHead && (
                      <td>
                        {canDelete(emp) ? (
                          <button className="delete-btn" onClick={() => openDeleteConfirm(emp)}>Delete</button>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12.5px' }}>Restricted</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {employees.length === 0 && !loadingPage && (
                <tr>
                  <td colSpan={columnCount}>
                    <div className="table-empty-state">
                      <EmptyTableArt />
                      <p className="table-empty-title">
                        {search ? 'No employees match your search' : 'No employees yet'}
                      </p>
                      <p className="table-empty-sub">
                        {search ? 'Try a different name or email.' : 'Employees you add will show up here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              <tr ref={sentinelRef}>
                <td colSpan={columnCount} className="scroll-status">
                  {loadingPage
                    ? 'Loading...'
                    : employees.length > 0 && !hasMore
                      ? `Showing all ${employees.length} of ${total}`
                      : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {grantTarget && (
        <div className="modal-overlay" onClick={closeGrantAccess}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Grant Portal Access</h2>
              <button className="close-btn" onClick={closeGrantAccess}>×</button>
            </div>
            <p>Grant access to <strong>{grantTarget.full_name}</strong> ({grantTarget.email})</p>
            {grantSuccess ? (
              <p style={{ color: 'var(--color-success)', fontSize: '14px' }}>{grantSuccess}</p>
            ) : (
              <form onSubmit={handleGrantSubmit} className="upload-form">
                <select value={grantRole} onChange={(e) => setGrantRole(e.target.value)}>
                  <option value="Employee">Employee</option>
                  <option value="HR">HR</option>
                  <option value="DeptHead">Department Head</option>
                  <option value="Admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary">Send Registration Link</button>
              </form>
            )}
            {grantError && <p className="error-text">{grantError}</p>}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Employee</h2>
              <button className="close-btn" onClick={closeDeleteConfirm}>×</button>
            </div>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.full_name}</strong>?
              This will remove them from active records.
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

export default EmployeeList;