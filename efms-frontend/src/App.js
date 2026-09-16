// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import LoginRoute from './components/LoginRoute';
import ApplyPage from './components/ApplyPage';
import StatusCheckPage from './components/StatusCheckPage';
import SelfRegisterPage from './components/SelfRegisterPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import ContactHRPage from './components/ContactHRPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/status" element={<StatusCheckPage />} />
        <Route path="/self-register" element={<SelfRegisterPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/contact-hr" element={<ContactHRPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;