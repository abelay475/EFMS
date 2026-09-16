// src/components/HomePage.js
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function SearchDocIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 8h22l10 10v34a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M38 8v8a2 2 0 0 0 2 2h8" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 28h16M20 35h16M20 42h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="46" cy="46" r="8" fill="var(--color-surface-alt)" stroke="currentColor" strokeWidth="2.4" />
      <path d="M52 52l6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function CheckDocIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 8h22l10 10v34a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M38 8v8a2 2 0 0 0 2 2h8" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M20 30h12M20 37h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="45" cy="45" r="10" fill="var(--color-accent)" />
      <path d="M40.5 45l3 3 6-6.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldKeyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 6l18 7v15c0 14-9 22.5-18 27-9-4.5-18-13-18-27V13l18-7Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="27" r="6" stroke="currentColor" strokeWidth="2.4" />
      <path d="M32 33v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 38h5M32 43h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg
      className="hero-illustration"
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="30" y="20" width="120" height="150" rx="14" className="doc-outline" />
      <line x1="50" y1="55" x2="130" y2="55" className="doc-line" />
      <line x1="50" y1="75" x2="130" y2="75" className="doc-line" />
      <line x1="50" y1="95" x2="105" y2="95" className="doc-line" />
      <circle cx="150" cy="140" r="34" className="badge-circle" />
      <circle cx="150" cy="140" r="34" className="badge-pulse" />
      <path d="M134 140 L146 152 L168 126" className="badge-check" />
    </svg>
  );
}

/* Purely decorative "on the wall" line-art, gray-only, meant to sit
   behind the hero copy and bleed off the edge of the viewport. Not a
   real illustration of anything specific — just abstract folder /
   document / org-chart shapes to fill the empty flanks. */
function HeroWallArtLeft() {
  return (
    <svg
      className="hero-wall-art hero-wall-art-left"
      viewBox="0 0 260 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="30" y="40" width="150" height="190" rx="16" className="wall-shape" />
      <rect x="70" y="10" width="110" height="70" rx="12" className="wall-shape-alt" />
      <line x1="55" y1="90" x2="150" y2="90" className="wall-line" />
      <line x1="55" y1="112" x2="150" y2="112" className="wall-line" />
      <line x1="55" y1="134" x2="120" y2="134" className="wall-line" />
      <circle cx="80" cy="290" r="46" className="wall-shape-alt" />
      <circle cx="200" cy="330" r="22" className="wall-shape" />
      <line x1="80" y1="244" x2="80" y2="230" className="wall-line-thin" />
      <line x1="200" y1="308" x2="180" y2="270" className="wall-line-thin" />
      <line x1="30" y1="350" x2="130" y2="350" className="wall-line-thin" />
    </svg>
  );
}

function HeroWallArtRight() {
  return (
    <svg
      className="hero-wall-art hero-wall-art-right"
      viewBox="0 0 260 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="90" y="60" width="140" height="180" rx="16" className="wall-shape" />
      <circle cx="70" cy="90" r="40" className="wall-shape-alt" />
      <line x1="118" y1="110" x2="200" y2="110" className="wall-line" />
      <line x1="118" y1="132" x2="200" y2="132" className="wall-line" />
      <line x1="118" y1="154" x2="175" y2="154" className="wall-line" />
      <rect x="40" y="250" width="100" height="64" rx="12" className="wall-shape-alt" />
      <circle cx="200" cy="300" r="26" className="wall-shape" />
      <line x1="140" y1="282" x2="176" y2="290" className="wall-line-thin" />
      <line x1="90" y1="340" x2="190" y2="340" className="wall-line-thin" />
    </svg>
  );
}

function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className="home-page">
      <SiteHeader />

      <section className="hero" id="top">
        <HeroWallArtLeft />
        <HeroWallArtRight />

        <div className="hero-content">
          <p className="hero-kicker">Wollega University</p>
          <h1 className="hero-title">Employee File Management System</h1>
          <p className="hero-subtitle">
            One place to manage staff records, job applications, time off, and payments —
            built for HR, department heads, and every employee at the university.
          </p>
          <div className="hero-actions">
            <Link to="/apply" className="btn btn-primary">Explore Open Vacancies</Link>
            <Link to="/login" className="btn btn-secondary">Staff Login</Link>
          </div>
          <div className="hero-visual">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="photo-strip">
        <div className="photo-strip-item">
          <img
            src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=60"
            alt="Team reviewing documents"
            loading="lazy"
          />
        </div>
        <div className="photo-strip-item">
          <img
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=60"
            alt="HR staff filing paperwork"
            loading="lazy"
          />
        </div>
        <div className="photo-strip-item">
          <img
            src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=400&q=60"
            alt="Office team at desk with files"
            loading="lazy"
          />
        </div>
      </section>

      <section className="feature-row">
        <div className="feature-visual"><SearchDocIcon /></div>
        <div className="feature-copy">
          <h2>Find your next role</h2>
          <p>
            Browse every open position across departments, see application deadlines
            at a glance, and apply directly with your CV — no account required.
          </p>
          <Link to="/apply" className="feature-link">View open vacancies →</Link>
        </div>
      </section>

      <section className="feature-row reverse">
        <div className="feature-visual"><CheckDocIcon /></div>
        <div className="feature-copy">
          <h2>Track your application</h2>
          <p>
            Already applied? Check where your application stands — from review, to
            interview, to a final decision — using your reference code and email.
          </p>
          <Link to="/status" className="feature-link">Check application status →</Link>
        </div>
      </section>

      <section className="feature-row">
        <div className="feature-visual"><ShieldKeyIcon /></div>
        <div className="feature-copy">
          <h2>Staff &amp; HR portal</h2>
          <p>
            Admins, HR, and Department Heads sign in here to manage employee records,
            review applicants, process time off, and keep everything on file.
          </p>
          <Link to="/login" className="feature-link">Staff login →</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default HomePage;