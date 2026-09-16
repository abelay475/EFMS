// src/components/Dashboard.js
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Login from './Login';
import DashboardHeader from './DashboardHeader';
import EmployeeList from './EmployeeList';
import EmployeeModal from './EmployeeModal';
import DocumentsSection from './DocumentsSection';
import LeaveSection from './LeaveSection';
import PaymentsSection from './PaymentsSection';
import ExitSection from './ExitSection';
import VacancyManager from './VacancyManager';
import MessageCenter from './MessageCenter';
import AuditLogView from './AuditLogView';
import DeptHeadLeaveQueue from './DeptHeadLeaveQueue';
import HRLeaveQueue from './HRLeaveQueue';
import DeptHeadExitQueue from './DeptHeadExitQueue';
import HRExitQueue from './HRExitQueue';
import MyRecordView from './MyRecordView';
import ApplicantReview from './ApplicantReview';
import { DashHeaderArt } from './icons';
import { initials, statusSlug } from '../utils/format';
import {
  fetchEmployees,
  fetchMyRecord,
  fetchDocuments,
  fetchLeaveRequests,
  fetchPayments,
  fetchExitRecords
} from '../api';

function Dashboard() {
  const [token, setToken] = useState(sessionStorage.getItem('efms_token') || '');
  const [currentUser, setCurrentUser] = useState(
    sessionStorage.getItem('efms_user') ? JSON.parse(sessionStorage.getItem('efms_user')) : null
  );

  const role = currentUser?.role;
  const isEmployeeRole = role === 'Employee';

  const TABS = {
    Admin: ['Employees', 'Vacancies', 'Messages', 'Audit Log', 'My Record'],
    HR: ['Employees', 'Vacancies', 'Applicant Review', 'Messages', 'Time Off Requests', 'Exit Requests', 'My Record'],
    DeptHead: ['Employees', 'Applicant Review', 'Messages', 'Time Off Requests', 'Exit Requests', 'My Record'],
  };
  const availableTabs = TABS[role] || [];

  // The active tab lives in the URL (?tab=...), not just in memory, so a
  // hard refresh — or a bookmark, or sharing the link — lands back on the
  // same tab instead of silently resetting to the first one.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(
    availableTabs.includes(tabFromUrl) ? tabFromUrl : (availableTabs[0] || 'Employees')
  );

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const [employees, setEmployees] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [myRecordError, setMyRecordError] = useState('');

  const [activeEmployee, setActiveEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [exitRecords, setExitRecords] = useState([]);

  const handleLoginSuccess = (newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('efms_token');
    sessionStorage.removeItem('efms_user');
    setToken('');
    setCurrentUser(null);
    setMyRecord(null);
    setActiveEmployee(null);
  };

  const loadEmployees = async () => {
    const data = await fetchEmployees(token);
    setEmployees(data);
  };

  const loadMyRecord = async () => {
    setMyRecordError('');
    try {
      const data = await fetchMyRecord(token);
      setMyRecord(data);
      loadDocuments(data.id);
      loadLeaveRequests(data.id);
      loadPayments(data.id);
      loadExitRecords(data.id);
    } catch (err) {
      setMyRecordError(err.message);
    }
  };

  useEffect(() => {
    if (!token || !currentUser) return;
    if (isEmployeeRole) {
      loadMyRecord();
    } else {
      loadEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Re-pull the top-level data whenever this tab regains focus or becomes
  // visible again, so switching back from another tab shows up-to-date
  // data without needing a manual refresh.
  useEffect(() => {
    if (!token || !currentUser) return;

    const refreshTopLevelData = () => {
      if (isEmployeeRole) {
        loadMyRecord();
      } else {
        loadEmployees();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTopLevelData();
      }
    };

    window.addEventListener('focus', refreshTopLevelData);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshTopLevelData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser, isEmployeeRole]);

  const currentRecordId = () => (isEmployeeRole ? myRecord?.id : activeEmployee?.id);

  const loadDocuments = async (employeeId) => {
    const data = await fetchDocuments(token, employeeId);
    setDocuments(data);
  };

  const loadLeaveRequests = async (employeeId) => {
    const data = await fetchLeaveRequests(token, employeeId);
    setLeaveRequests(data);
  };

  const loadPayments = async (employeeId) => {
    const data = await fetchPayments(token, employeeId);
    setPayments(data);
  };

  const loadExitRecords = async (employeeId) => {
    const data = await fetchExitRecords(token, employeeId);
    setExitRecords(data);
  };

  const openManage = (emp) => {
    setActiveEmployee(emp);
    loadDocuments(emp.id);
    loadLeaveRequests(emp.id);
    loadPayments(emp.id);
    loadExitRecords(emp.id);
  };

  const closeManage = () => {
    setActiveEmployee(null);
    setDocuments([]);
    setLeaveRequests([]);
    setPayments([]);
    setExitRecords([]);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Employee role — self-service view only, no tabs needed
  if (isEmployeeRole) {
    const positionLabel = myRecord?.position_title || myRecord?.vacancy_title || 'No position';

    return (
      <div className="dash-shell">
        <DashboardHeader currentUser={currentUser} onLogout={handleLogout} />

        <div className="dash-content">
          <div className="dash-page-header">
            <div>
              <h1 className="dash-page-heading">My Record</h1>
              <p className="dash-page-subtitle">Your employment details, documents, time off, and payments.</p>
            </div>
            <DashHeaderArt />
          </div>

          {myRecordError && <p className="error-text">{myRecordError}</p>}

          {myRecord && (
            <>
              <div className="dash-panel dash-profile-card">
                <span className="dash-profile-avatar">{initials(myRecord.full_name)}</span>
                <div className="dash-profile-info">
                  <h2>{myRecord.full_name}</h2>
                  <p>{myRecord.department_name || 'No department'} · {positionLabel}</p>
                </div>
                <span className={`status-pill status-${statusSlug(myRecord.status)}`}>{myRecord.status}</span>
              </div>

              <div className="dash-panel">
                <DocumentsSection
                  token={token}
                  employeeId={myRecord.id}
                  documents={documents}
                  onRefresh={() => loadDocuments(myRecord.id)}
                />
              </div>

              <div className="dash-panel">
                <LeaveSection
                  token={token}
                  employeeId={myRecord.id}
                  leaveRequests={leaveRequests}
                  isEmployeeRole={isEmployeeRole}
                  onRefresh={() => loadLeaveRequests(myRecord.id)}
                />
              </div>

              <div className="dash-panel">
                <ExitSection
                  token={token}
                  employeeId={myRecord.id}
                  exitRecords={exitRecords}
                  onRefresh={() => loadExitRecords(myRecord.id)}
                  canRequest={true}
                  canRecord={false}
                />
              </div>

              <div className="dash-panel">
                <PaymentsSection
                  token={token}
                  employeeId={myRecord.id}
                  payments={payments}
                  onRefresh={() => loadPayments(myRecord.id)}
                  readOnly={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Admin / HR / DeptHead — tabbed management view
  return (
    <div className="dash-shell">
      <DashboardHeader currentUser={currentUser} onLogout={handleLogout} />

      <div className="dash-content">
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-heading">Dashboard</h1>
            <p className="dash-page-subtitle">Manage employee records, applications, and requests.</p>
          </div>
          <DashHeaderArt />
        </div>

        <div className="dash-tabs">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              className={`dash-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Employees' ? (
          <EmployeeList
            token={token}
            currentUser={currentUser}
            onRefresh={loadEmployees}
            onManage={openManage}
          />
        ) : (
          <div className="dash-panel">
            {activeTab === 'Vacancies' && <VacancyManager token={token} currentUser={currentUser} />}

            {activeTab === 'Applicant Review' && (role === 'HR' || role === 'DeptHead') && (
              <ApplicantReview
                token={token}
                currentUser={currentUser}
                employees={employees}
                onRefresh={loadEmployees}
              />
            )}

            {activeTab === 'Messages' && <MessageCenter token={token} currentUser={currentUser} />}

            {activeTab === 'Audit Log' && <AuditLogView token={token} />}

            {activeTab === 'Time Off Requests' && role === 'DeptHead' && <DeptHeadLeaveQueue token={token} />}

            {activeTab === 'Time Off Requests' && (role === 'HR' || role === 'Admin') && <HRLeaveQueue token={token} />}

            {activeTab === 'Exit Requests' && role === 'DeptHead' && <DeptHeadExitQueue token={token} />}

            {activeTab === 'Exit Requests' && (role === 'HR' || role === 'Admin') && <HRExitQueue token={token} />}

            {activeTab === 'My Record' && <MyRecordView token={token} currentUser={currentUser} />}
          </div>
        )}

        {activeEmployee && (
          <EmployeeModal
            token={token}
            currentUser={currentUser}
            employee={activeEmployee}
            documents={documents}
            leaveRequests={leaveRequests}
            payments={payments}
            exitRecords={exitRecords}
            isEmployeeRole={isEmployeeRole}
            onClose={closeManage}
            onRefreshDocuments={() => loadDocuments(currentRecordId())}
            onRefreshLeave={() => loadLeaveRequests(currentRecordId())}
            onRefreshPayments={() => loadPayments(currentRecordId())}
            onRefreshExit={() => loadExitRecords(currentRecordId())}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;