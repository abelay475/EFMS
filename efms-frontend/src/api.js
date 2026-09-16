const BASE_URL = 'http://localhost:5000';

const authHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  ...extra
});

// Builds a query string from an object, skipping any empty/undefined values.
const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

// Without params, returns the full (department-scoped) employee array,
// unchanged from before. Pass { page, limit, search } to instead get
// back { employees, total, page, limit } for paginated/searchable views.
export async function fetchEmployees(token, params) {
  const res = await fetch(`${BASE_URL}/employees${buildQuery(params)}`, { headers: authHeaders(token) });
  if (!res.ok) return params ? { employees: [], total: 0, page: 1, limit: 0 } : [];
  return res.json();
}

export async function fetchMyRecord(token) {
  const res = await fetch(`${BASE_URL}/my-employee-record`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('No linked employee record found for your account.');
  return res.json();
}

export async function fetchDepartments(token) {
  const res = await fetch(`${BASE_URL}/departments`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPositions(token) {
  const res = await fetch(`${BASE_URL}/positions`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function createEmployee(token, formValues, cvFile) {
  const payload = new FormData();
  Object.entries(formValues).forEach(([key, value]) => payload.append(key, value));
  payload.append('cv', cvFile);

  const res = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: authHeaders(token),
    body: payload
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create employee');
  return data;
}

export async function updateEmployeeStatus(token, employee, newStatus) {
  const res = await fetch(`${BASE_URL}/employees/${employee.id}`, {
    method: 'PUT',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      department_id: employee.department_id,
      position_id: employee.position_id,
      hire_date: employee.hire_date ? employee.hire_date.slice(0, 10) : null,
      status: newStatus
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update status');
  return data;
}

export async function deleteEmployee(token, id) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, { method: 'DELETE', headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete employee');
  return data;
}

export async function grantPortalAccess(token, employeeId, role) {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/grant-access`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to grant portal access');
  return data;
}

export async function fetchDocuments(token, employeeId) {
  const res = await fetch(`${BASE_URL}/documents/${employeeId}`, { headers: authHeaders(token) });
  return res.json();
}

export async function uploadDocument(token, employeeId, uploadData) {
  return fetch(`${BASE_URL}/documents/${employeeId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: uploadData
  });
}

export async function deleteDocument(token, id) {
  return fetch(`${BASE_URL}/documents/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export async function fetchLeaveRequests(token, employeeId) {
  const res = await fetch(`${BASE_URL}/leave-requests/${employeeId}`, { headers: authHeaders(token) });
  return res.json();
}

export async function createLeaveRequest(token, employeeId, leaveForm) {
  return fetch(`${BASE_URL}/leave-requests/${employeeId}`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(leaveForm)
  });
}

export async function deleteLeaveRequest(token, id) {
  return fetch(`${BASE_URL}/leave-requests/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

// ----- Exit / offboarding -----

export async function fetchExitRecords(token, employeeId) {
  const res = await fetch(`${BASE_URL}/exit-records/${employeeId}`, { headers: authHeaders(token) });
  return res.json();
}

// Used both for an employee requesting their own exit (Pending) and for
// HR/Admin recording one directly (Finalized) — the backend decides which
// based on the caller's role, so this is one function either way.
export async function submitExit(token, employeeId, exitForm) {
  return fetch(`${BASE_URL}/exit-records/${employeeId}`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(exitForm)
  });
}

export async function deleteExitRecord(token, id) {
  return fetch(`${BASE_URL}/exit-records/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export async function fetchDeptExitQueue(token) {
  const res = await fetch(`${BASE_URL}/exit-records/department/pending`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function acknowledgeExit(token, id) {
  return fetch(`${BASE_URL}/exit-records/${id}/acknowledge`, { method: 'PUT', headers: authHeaders(token) });
}

export async function fetchHRExitQueue(token) {
  const res = await fetch(`${BASE_URL}/exit-records/hr/queue`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function finalizeExit(token, id) {
  return fetch(`${BASE_URL}/exit-records/${id}/finalize`, { method: 'PUT', headers: authHeaders(token) });
}

export async function fetchPayments(token, employeeId) {
  const res = await fetch(`${BASE_URL}/payments/${employeeId}`, { headers: authHeaders(token) });
  return res.json();
}

export async function createPayment(token, employeeId, paymentForm) {
  return fetch(`${BASE_URL}/payments/${employeeId}`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(paymentForm)
  });
}

export async function deletePayment(token, id) {
  return fetch(`${BASE_URL}/payments/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export async function fetchPublicVacancies() {
  const res = await fetch(`${BASE_URL}/vacancies/public`);
  return res.json();
}

export async function fetchVacancies(token) {
  const res = await fetch(`${BASE_URL}/vacancies`, { headers: authHeaders(token) });
  return res.json();
}

export async function createVacancy(token, vacancyForm) {
  return fetch(`${BASE_URL}/vacancies`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(vacancyForm)
  });
}

export async function updateVacancy(token, id, vacancyForm) {
  return fetch(`${BASE_URL}/vacancies/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(vacancyForm)
  });
}

export async function approveVacancy(token, id) {
  return fetch(`${BASE_URL}/vacancies/${id}/approve`, {
    method: 'PUT',
    headers: authHeaders(token)
  });
}

export async function rejectVacancy(token, id, reason) {
  return fetch(`${BASE_URL}/vacancies/${id}/reject`, {
    method: 'PUT',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason })
  });
}

export async function deleteVacancy(token, id) {
  return fetch(`${BASE_URL}/vacancies/${id}`, { method: 'DELETE', headers: authHeaders(token) });
}

export async function submitApplication(formPayload) {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    body: formPayload
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit application');
  return data;
}

export async function checkApplicationStatus(reference_code, email) {
  const res = await fetch(`${BASE_URL}/applications/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference_code, email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No application found');
  return data;
}

export async function selfRegister(token, password) {
  const res = await fetch(`${BASE_URL}/self-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function fetchContacts(token) {
  const res = await fetch(`${BASE_URL}/messages/contacts`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchConversations(token) {
  const res = await fetch(`${BASE_URL}/messages/conversations`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchThread(token, userId) {
  const res = await fetch(`${BASE_URL}/messages/with/${userId}`, { headers: authHeaders(token) });
  if (!res.ok) return [];
  return res.json();
}

export async function markThreadRead(token, userId) {
  return fetch(`${BASE_URL}/messages/with/${userId}/read`, {
    method: 'PUT',
    headers: authHeaders(token)
  });
}

export async function sendMessage(token, { recipient_id, body, is_staffing_request }) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ recipient_id, body, is_staffing_request })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data;
}

// Without params, returns { logs, total, page, limit } using the
// backend's default of the most recent 20 entries. Pass
// { page, limit, search } to page through / filter the log.
export async function fetchAuditLog(token, params) {
  const res = await fetch(`${BASE_URL}/audit-log${buildQuery(params)}`, { headers: authHeaders(token) });
  if (!res.ok) return { logs: [], total: 0, page: 1, limit: (params && params.limit) || 20 };
  return res.json();
}

export { BASE_URL };