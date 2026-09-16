// src/components/EmployeeModal.js
import DocumentsSection from './DocumentsSection';
import LeaveSection from './LeaveSection';
import PaymentsSection from './PaymentsSection';
import ExitSection from './ExitSection';
import { initials, statusSlug } from '../utils/format';

function EmployeeModal({
  token,
  currentUser,
  employee,
  documents,
  leaveRequests,
  payments,
  exitRecords,
  isEmployeeRole,
  onClose,
  onRefreshDocuments,
  onRefreshLeave,
  onRefreshPayments,
  onRefreshExit
}) {
  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-employee-identity">
            <span className="employee-avatar">{initials(employee.full_name)}</span>
            <div>
              <h2>{employee.full_name}</h2>
              <span className={`status-pill status-${statusSlug(employee.status)}`}>{employee.status}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <DocumentsSection
          token={token}
          employeeId={employee.id}
          documents={documents}
          onRefresh={onRefreshDocuments}
          readOnly={isAdmin}
        />
        <LeaveSection
          token={token}
          employeeId={employee.id}
          leaveRequests={leaveRequests}
          isEmployeeRole={false}
          onRefresh={onRefreshLeave}
        />
        <ExitSection
          token={token}
          employeeId={employee.id}
          exitRecords={exitRecords}
          onRefresh={onRefreshExit}
          canRequest={false}
          canRecord={!isAdmin}
        />
        <PaymentsSection
          token={token}
          employeeId={employee.id}
          payments={payments}
          onRefresh={onRefreshPayments}
          readOnly={isAdmin}
        />
      </div>
    </div>
  );
}

export default EmployeeModal;