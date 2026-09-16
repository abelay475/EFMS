// Shared icon set + small decorative line-art for the internal
// dashboard. The empty-state and header art reuse the same CSS token
// classes (doc-outline / doc-line / wall-shape / wall-line) as the
// public homepage's hero illustrations, so the visual language matches.

export function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3.5h9l5 5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3.5V8a1 1 0 0 0 1 1h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 13h9M7.5 16.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.5 6.5a3.1 3.1 0 0 1 0 6.1M18 19c0-2.4-1.6-4.4-3.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3.5" width="10" height="17" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7.5h1M11.5 7.5h1M8 11h1M11.5 11h1M8 14.5h1M11.5 14.5h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 10h3.5a1 1 0 0 1 1 1v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 20.5v-3h2v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="7.5" width="17" height="11.5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 12.5h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 12.5v1.6h3v-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Empty-table line-art — same visual language as the homepage's
// document illustrations (doc-outline / doc-line / wall-shape-alt).
export function EmptyTableArt() {
  return (
    <svg viewBox="0 0 120 96" width="96" height="80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="24" y="10" width="56" height="70" rx="8" className="doc-outline" />
      <line x1="36" y1="30" x2="68" y2="30" className="doc-line" />
      <line x1="36" y1="42" x2="68" y2="42" className="doc-line" />
      <line x1="36" y1="54" x2="54" y2="54" className="doc-line" />
      <circle cx="84" cy="66" r="18" className="wall-shape-alt" />
      <path d="M78 66h12M84 60v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Quiet decorative line-art for the dashboard page header — echoes the
// hero "wall art" on the public homepage, scaled down.
export function DashHeaderArt() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="dash-header-art">
      <rect x="10" y="30" width="70" height="50" rx="10" className="wall-shape" />
      <circle cx="118" cy="40" r="26" className="wall-shape-alt" />
      <line x1="26" y1="46" x2="64" y2="46" className="wall-line" />
      <line x1="26" y1="58" x2="52" y2="58" className="wall-line" />
      <line x1="90" y1="80" x2="150" y2="80" className="wall-line-thin" />
      <circle cx="140" cy="72" r="8" className="wall-shape" />
    </svg>
  );
}