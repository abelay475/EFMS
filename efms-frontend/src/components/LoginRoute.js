import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';

function LoginRoute() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Force a clean login screen whenever this route is entered directly
    // (e.g. from the "Staff Login" link on the home page).
    sessionStorage.removeItem('efms_token');
    sessionStorage.removeItem('efms_user');
    setReady(true);
  }, []);

  const handleLoginSuccess = () => {
    // Login already wrote the session to sessionStorage.
    // Navigate away from /login so a later page refresh doesn't
    // remount this route and wipe the session again.
    navigate('/dashboard');
  };

  if (!ready) return null;

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default LoginRoute;