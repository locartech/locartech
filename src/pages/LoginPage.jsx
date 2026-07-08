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
      <aside className="auth-logo-showcase" aria-hidden="true">
        <LocarTechLogo width={640} className="auth-showcase-logo" />
      </aside>
      <section className="auth-card">
        <p className="auth-badge">
          <span className="auth-badge-dot" />
          Ambiente seguro Locartech
        </p>
        <ActiveView onNavigate={setView} />
      </section>
    </main>
  );
}

export default LoginPage;
