import { useState, useEffect } from 'react';
import DocumentsSection from './DocumentsSection';
import LeaveSection from './LeaveSection';
import PaymentsSection from './PaymentsSection';
import ExitSection from './ExitSection';
import {
  fetchMyRecord,
  fetchDocuments,
  fetchLeaveRequests,
  fetchPayments,
  fetchExitRecords
} from '../api';

function MyRecordView({ token, currentUser }) {
  const [myRecord, setMyRecord] = useState(null);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [exitRecords, setExitRecords] = useState([]);

  const isSuperAdmin = !!currentUser?.is_super_admin;

  const loadAll = async () => {
    setError('');
    try {
      const data = await fetchMyRecord(token);
      setMyRecord(data);
      const paymentsData = await fetchPayments(token, data.id);
      setPayments(paymentsData);
      if (!isSuperAdmin) {
        const docsData = await fetchDocuments(token, data.id);
        setDocuments(docsData);
        const leaveData = await fetchLeaveRequests(token, data.id);
        setLeaveRequests(leaveData);
        const exitData = await fetchExitRecords(token, data.id);
        setExitRecords(exitData);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!myRecord) return null;

  const positionLabel = myRecord.position_title || myRecord.vacancy_title || 'No position';

  return (
    <>
      <h2>{myRecord.full_name}</h2>
      <p>
        {myRecord.department_name || 'No department'} — {positionLabel} — <strong>{myRecord.status}</strong>
      </p>

      {!isSuperAdmin && (
        <>
          <DocumentsSection
            token={token}
            employeeId={myRecord.id}
            documents={documents}
            onRefresh={() => fetchDocuments(token, myRecord.id).then(setDocuments)}
            readOnly={true}
          />
          <LeaveSection
            token={token}
            employeeId={myRecord.id}
            leaveRequests={leaveRequests}
            isEmployeeRole={true}
            onRefresh={() => fetchLeaveRequests(token, myRecord.id).then(setLeaveRequests)}
          />
          <ExitSection
            token={token}
            employeeId={myRecord.id}
            exitRecords={exitRecords}
            onRefresh={() => fetchExitRecords(token, myRecord.id).then(setExitRecords)}
            canRequest={true}
            canRecord={false}
          />
        </>
      )}

      <PaymentsSection
        token={token}
        employeeId={myRecord.id}
        payments={payments}
        onRefresh={() => fetchPayments(token, myRecord.id).then(setPayments)}
        readOnly={true}
      />
    </>
  );
}

export default MyRecordView;