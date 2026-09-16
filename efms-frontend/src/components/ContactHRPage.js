// src/components/ContactHRPage.js
import { Link } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

function ContactHRPage() {
  return (
    <div className="home-page">
      <SiteHeader />

      <div className="container legal-container">
        <h1>Contact HR</h1>
        <p>
          Reach out to the Human Resources office at Wollega University for anything related to
          applications, employment records, or account access.
        </p>

        <div className="contact-grid">
          <div className="contact-card">
            <p className="contact-card-label">Email</p>
            <p className="contact-card-value">
              <a href="mailto:hr@wollegauniversity.edu.et">hr@wollegauniversity.edu.et</a>
            </p>
          </div>
          <div className="contact-card">
            <p className="contact-card-label">Phone</p>
            <p className="contact-card-value">
              <a href="tel:+251570660000">+251 57 066 0000</a>
            </p>
          </div>
          <div className="contact-card">
            <p className="contact-card-label">Office</p>
            <p className="contact-card-value">HR Building, Main Campus</p>
          </div>
          <div className="contact-card">
            <p className="contact-card-label">Hours</p>
            <p className="contact-card-value">Mon–Fri, 8:30 AM–5:00 PM</p>
          </div>
        </div>

        <div className="legal-content" style={{ marginTop: '24px' }}>
          <h2>Account access issues</h2>
          <p>
            If you're a staff member locked out of your account or waiting on a registration link,
            contact HR directly using the details above rather than creating a new account request.
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

export default ContactHRPage;