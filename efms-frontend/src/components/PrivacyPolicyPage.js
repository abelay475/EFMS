// src/components/PrivacyPolicyPage.js
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function PrivacyPolicyPage() {
  return (
    <div className="home-page">
      <SiteHeader />

      <div className="container legal-container">
        <p className="legal-updated">Last updated September 2026</p>
        <h1>Privacy Policy</h1>

        <div className="legal-content">
          <h2>1. Information we collect</h2>
          <p>
            EFMS collects the information you provide directly, such as your name, email, phone
            number, department, position, hire date, CV, and other documents you upload. Job
            applicants provide similar information when applying to a vacancy.
          </p>

          <h2>2. How we use your information</h2>
          <ul>
            <li>To manage employee records, documents, time off requests, and payments.</li>
            <li>To process job applications and communicate application status.</li>
            <li>To grant and manage access to staff accounts.</li>
            <li>To maintain an audit trail of actions taken within the system.</li>
          </ul>

          <h2>3. Who can access your information</h2>
          <p>
            Access is role based. Department Heads see records in their own department only, HR and
            Admin accounts have broader access needed for their duties, and employees can view their
            own record. Every meaningful action in the system is written to an audit log visible to
            Admin accounts.
          </p>

          <h2>4. Data storage and security</h2>
          <p>
            Passwords are stored using one way hashing and are never visible to staff, including
            administrators. Uploaded documents are stored securely and served only to authenticated
            users. Access tokens expire automatically after a limited period.
          </p>

          <h2>5. Data retention</h2>
          <p>
            Employee records are retained for as long as needed for university HR and legal
            purposes. Records for staff who leave the university, and applications from candidates
            who are not hired, may be retained for a reasonable period afterward and then archived
            or removed in line with university policy.
          </p>

          <h2>6. Your rights</h2>
          <p>
            You can request a copy of the personal information held about you, or ask HR to correct
            inaccurate details, by contacting the HR office directly. Employee accounts can also view
            most of their own record directly within the system under My Record.
          </p>

          <h2>7. Session storage</h2>
          <p>
            EFMS keeps your login session in your browser's session storage so you stay signed in
            while the tab is open. This information is cleared automatically when you log out or
            close the browser tab, and is never shared with third parties.
          </p>

          <h2>8. Changes to this policy</h2>
          <p>
            This policy may be updated periodically to reflect changes in the system. Significant
            changes will be communicated to staff through the system or by email where appropriate.
          </p>

          <h2>9. Contact</h2>
          <p>
            For any privacy related questions or requests, please reach out to the HR office. See
            the Contact HR page for details.
          </p>
        </div>

        <div className="legal-back-row">
          <Link to="/" className="home-link-btn secondary" style={{ display: 'inline-block' }}>
            Back to Home
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

export default PrivacyPolicyPage;