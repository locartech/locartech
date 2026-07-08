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

  return (
    <main className="auth-page">
      <section className="auth-card">
        <ActiveView onNavigate={setView} />
      </section>
      <aside className="auth-logo-showcase" aria-hidden="true">
        <LocarTechLogo width={480} className="auth-showcase-logo" />
      </aside>
    </main>
  );
}

export default LoginPage;
