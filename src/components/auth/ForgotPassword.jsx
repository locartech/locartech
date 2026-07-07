import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function ForgotPassword({ onNavigate }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const result = requestPasswordReset(email);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setMessage(result.message);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Recuperação de acesso</p>
        <h1>Esqueci minha senha</h1>
        <span>Fluxo simulado para preparar integração futura com backend.</span>
      </div>

      {error ? <div className="auth-alert error">{error}</div> : null}
      {message ? <div className="auth-alert success">{message}</div> : null}

      <label>
        <span>E-mail</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>

      <button type="submit" className="primary-button auth-submit">Enviar instruções</button>
      <div className="auth-links">
        <button type="button" onClick={() => onNavigate('login')}>Voltar para login</button>
      </div>
    </form>
  );
}

export default ForgotPassword;
