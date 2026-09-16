// Shared formatting helpers used across the dashboard. Pulled out of
// Dashboard.js / EmployeeList.js / DashboardHeader.js, which each used
// to redeclare their own copies of these.

export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function statusSlug(status) {
  return (status || '').toLowerCase().replace(/\s+/g, '-');
}

export function roleLabel(role) {
  return role === 'DeptHead' ? 'Dept Head' : role;
}