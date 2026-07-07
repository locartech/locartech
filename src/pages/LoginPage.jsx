import { useState } from 'react';
import ForgotPassword from '../components/auth/ForgotPassword';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import LocarTechLogo from '../components/brand/LocarTechLogo';

const views = {
  login: Login,
  register: Register,
  forgot: ForgotPassword,
};

function LoginPage() {
  const [view, setView] = useState('login');
  const ActiveView = views[view] ?? Login;
  const logoWidth = view === 'login' ? 260 : 220;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-login-logo">
          <LocarTechLogo width={logoWidth} />
        </div>
        <ActiveView onNavigate={setView} />
      </section>
    </main>
  );
}

export default LoginPage;
