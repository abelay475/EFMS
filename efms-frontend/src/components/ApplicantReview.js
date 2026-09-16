import { useState } from 'react';
import { fetchDocuments, updateEmployeeStatus, BASE_URL } from '../api';

function ApplicantReview({ token, currentUser, employees, onRefresh }) {
  const role = currentUser?.role;
  const isHR = role === 'HR' || role === 'Admin';
  const isDeptHead = role === 'DeptHead';

  const [cvState, setCvState] = useState({}); // employeeId -> { loading, doc }
  const [actionError, setActionError] = useState('');

  const applicants = employees.filter((e) => e.vacancy_id);

  const visibleApplicants = isDeptHead
    ? applicants.filter((e) => e.vacancy_department_id === currentUser.department_id)
    : applicants;

  const handleLoadCV = async (empId) => {
    setCvState((prev) => ({ ...prev, [empId]: { loading: true } }));
    try {
      const docs = await fetchDocuments(token, empId);
      const cv = docs.find((d) => d.document_type === 'CV') || null;
      setCvState((prev) => ({ ...prev, [empId]: { loading: false, doc: cv } }));
    } catch (err) {
      setCvState((prev) => ({ ...prev, [empId]: { loading: false, doc: null } }));
    }
  };

  const handleStatusChange = async (emp, newStatus) => {
    setActionError('');
    try {
      await updateEmployeeStatus(token, emp, newStatus);
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const renderActions = (emp) => {
    if (isHR && emp.status === 'Applicant') {
      return (
        <>
          <button className="link-btn" onClick={() => handleStatusChange(emp, 'Under Review')}>
            Move to Under Review
          </button>{' '}
          <button className="delete-btn" onClick={() => handleStatusChange(emp, 'Rejected')}>
            Reject
          </button>
        </>
      );
    }
    if (isDeptHead && emp.status === 'Under Review') {
      return (
        <button className="link-btn" onClick={() => handleStatusChange(emp, 'Interview')}>
          Schedule Interview
        </button>
      );
    }
    if (isDeptHead && emp.status === 'Interview') {
      return (
        <>
          <button className="link-btn" onClick={() => handleStatusChange(emp, 'Hired')}>Hire</button>{' '}
          <button className="delete-btn" onClick={() => handleStatusChange(emp, 'Rejected')}>Reject</button>
        </>
      );
    }
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '12.5px' }}>No action available</span>;
  };

  return (
    <>
      <h3>Applicant Review</h3>
      {actionError && <p className="error-text">{actionError}</p>}
      <ul className="document-list">
        {visibleApplicants.map((emp) => {
          const cv = cvState[emp.id];
          return (
            <li key={emp.id}>
              <span>
                <strong>{emp.full_name}</strong> — {emp.email} — <strong>{emp.status}</strong>
                <br />
                {!cv && (
                  <button className="link-btn" onClick={() => handleLoadCV(emp.id)}>Load CV</button>
                )}
                {cv?.loading && (
                  <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>Loading CV...</span>
                )}
                {cv && !cv.loading && cv.doc && (
                  <a href={`${BASE_URL}/${cv.doc.file_path}`} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                )}
                {cv && !cv.loading && !cv.doc && (
                  <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>No CV on file</span>
                )}
              </span>
              <span>{renderActions(emp)}</span>
            </li>
          );
        })}
        {visibleApplicants.length === 0 && <li className="empty">No applicants to review.</li>}
      </ul>
    </>
  );
}

export default ApplicantReview;