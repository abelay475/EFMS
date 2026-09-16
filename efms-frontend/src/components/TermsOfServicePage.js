 // src/components/TermsOfServicePage.js
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function TermsOfServicePage() {
  return (
    <div className="home-page">
      <SiteHeader />

      <div className="container legal-container">
        <p className="legal-updated">Last updated September 2026</p>
        <h1>Terms of Service</h1>

        <div className="legal-content">
          <h2>1. Acceptance of these terms</h2>
          <p>
            By accessing or using the Employee File Management System (EFMS), whether as a staff
            member, department head, HR administrator, or job applicant, you agree to be bound by
            these terms. If you do not agree with any part of them, please do not use the system.
          </p>

          <h2>2. Who this applies to</h2>
          <p>
            EFMS is operated by Wollega University for internal staff record management and for
            public job applications submitted through the vacancy portal. Public applicants using
            the apply and status check pages are bound by the sections of these terms that relate
            to applications, alongside the privacy policy.
          </p>

          <h2>3. Account responsibilities</h2>
          <ul>
            <li>Keep your login credentials confidential and never share your password.</li>
            <li>Notify HR immediately if you suspect unauthorized access to your account.</li>
            <li>Information you submit or update in the system must be accurate to the best of your knowledge.</li>
          </ul>

          <h2>4. Acceptable use</h2>
          <p>
            The system is provided for legitimate HR and employment purposes only. You may not
            attempt to access records outside your role's permissions, interfere with the system's
            normal operation, or use it to submit false or misleading information.
          </p>

          <h2>5. Documents and uploads</h2>
          <p>
            Any document you upload, including CVs, contracts, and certificates, must be your own or
            one you are authorized to submit. Wollega University may remove content that violates
            these terms or applicable law.
          </p>

          <h2>6. System availability</h2>
          <p>
            We aim to keep EFMS available and reliable, but scheduled maintenance, technical issues,
            or events outside our control may occasionally interrupt access. We are not liable for
            losses resulting from such interruptions.
          </p>

          <h2>7. Termination of access</h2>
          <p>
            Access may be suspended or revoked for staff who leave the university, misuse the
            system, or violate these terms. Applicants may have their submitted data retained in
            line with the retention periods described in our privacy policy.
          </p>

          <h2>8. Changes to these terms</h2>
          <p>
            These terms may be updated from time to time to reflect changes in the system or in
            university policy. Continued use of EFMS after an update means you accept the revised
            terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these terms can be directed to the HR office. See the Contact HR page
            for details.
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

export default TermsOfServicePage;