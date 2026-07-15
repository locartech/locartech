import { ArrowLeft } from 'lucide-react';
import LocarTechLogo from '../brand/LocarTechLogo';

function AuthShell({ children, backToLogin = false, onBackToLogin }) {
  const handleBackToLogin = async (event) => {
    if (!onBackToLogin) return;
    event.preventDefault();

    try {
      await onBackToLogin();
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-logo-showcase" aria-label="Locartech">
        <LocarTechLogo width={640} className="auth-showcase-logo" />
      </aside>

      <section className="auth-card">
        <div className="auth-card-topline">
          <p className="auth-badge">
            <span className="auth-badge-dot" />
            Ambiente seguro Locartech
          </p>

          {backToLogin ? (
            <a className="auth-back-link" href="/login" onClick={handleBackToLogin}>
              <ArrowLeft size={15} aria-hidden="true" />
              Voltar ao login
            </a>
          ) : null}
        </div>

        {children}
      </section>
    </main>
  );
}

export default AuthShell;
