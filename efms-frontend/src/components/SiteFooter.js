// src/components/SiteFooter.js
import { Link } from 'react-router-dom';

function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <strong>Employee File Management System</strong>
          <p>Wollega University · Human Resources</p>
        </div>
        <div className="footer-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/contact-hr">Contact HR</Link>
        </div>
      </div>
      <p className="footer-copyright">© {year} Wollega University. All rights reserved.</p>
    </footer>
  );
}

export default SiteFooter;