import { useState } from 'react';
import AuthShell from '../components/auth/AuthShell';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

const views = {
  login: Login,
  register: Register,
};

function LoginPage() {
  const [view, setView] = useState('login');
  const ActiveView = views[view] ?? Login;

  return (
    <AuthShell>
      <ActiveView onNavigate={setView} />
    </AuthShell>
  );
}

export default LoginPage;
