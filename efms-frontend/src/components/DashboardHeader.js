// src/components/DashboardHeader.js
import { useTheme } from '../hooks/useTheme';
import { LogoMark, SunIcon, MoonIcon } from './icons';
import { initials, roleLabel } from '../utils/format';

function DashboardHeader({ currentUser, onLogout }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="dash-header">
      <div className="dash-header-inner">
        <div className="dash-brand">
          <span className="brand-mark" aria-hidden="true"><LogoMark /></span>
          <span className="brand-wordmark">efms</span>
        </div>

        <div className="dash-user-cluster">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="dash-user-chip">
            <span className="dash-user-avatar">{initials(currentUser?.full_name)}</span>
            <span className="dash-user-info">
              <span className="dash-user-name">{currentUser?.full_name}</span>
              <span className="dash-user-role">{roleLabel(currentUser?.role)}</span>
            </span>
          </div>

          <button type="button" className="btn-outline-danger" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;