import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../contexts/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setStatus({ type: 'error', message: 'Informe o e-mail cadastrado.' });
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus({ type: 'error', message: 'Informe um e-mail válido.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await requestPasswordReset(normalizedEmail);
      setStatus({ type: result.ok ? 'success' : 'error', message: result.message });
    } catch {
      setStatus({
        type: 'error',
        message: 'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell backToLogin>
      <form className="auth-form auth-recovery-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form-heading">
          <span className="auth-security-icon"><KeyRound size={22} aria-hidden="true" /></span>
          <p className="eyebrow">Recuperação de acesso</p>
          <h1>Recuperar senha</h1>
          <span>Informe seu e-mail para receber o link de recuperação.</span>
        </div>

        {status.message ? <div className={`auth-alert ${status.type}`}>{status.message}</div> : null}

        <label>
          <span>E-mail cadastrado</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@empresa.com.br"
            disabled={loading}
          />
        </label>

        <button type="submit" className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Enviando link...' : 'Enviar link de recuperação'}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPassword;
