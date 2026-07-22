import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Login({ onNavigate }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form);
      if (!result.ok) setError(result.message);
    } catch {
      setError('Nao foi possivel entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
      <div>
        <p className="eyebrow">Acesso ao sistema</p>
        <h1>Entrar na Locartech</h1>
        <span>Use sua conta corporativa para acessar o ambiente interno.</span>
      </div>

      {error ? <div className="auth-alert error">{error}</div> : null}

      <label>
        <span>E-mail</span>
        <input
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="nome@locartech.com.br"
        />
      </label>

      <label>
        <span>Senha</span>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Digite sua senha"
          />
          <button type="button" onClick={() => setShowPassword((current) => !current)} title="Mostrar ou ocultar senha">
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </label>

      <button type="submit" className="primary-button auth-submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <div className="auth-links">
        <a href="/esqueci-senha">Esqueci minha senha</a>
        <button type="button" onClick={() => onNavigate('register')}>Criar conta</button>
      </div>
    </form>
  );
}

export default Login;
