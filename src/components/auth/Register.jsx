import { useState } from 'react';
import { memberSectors } from '../../data/membersData';
import { useAuth } from '../../contexts/AuthContext';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  sector: '',
  role: '',
};

function Register({ onNavigate }) {
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.sector || !form.role.trim()) {
      setError('Preencha todos os campos obrigatorios.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(form);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message);
      setForm(initialForm);
    } catch {
      setError('Nao foi possivel concluir o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
      <div>
        <p className="eyebrow">Nova conta</p>
        <h1>Criar conta</h1>
        <span>O acesso ficara pendente ate aprovacao do administrador principal.</span>
      </div>

      {error ? <div className="auth-alert error">{error}</div> : null}
      {message ? <div className="auth-alert success">{message}</div> : null}

      <label>
        <span>Nome completo</span>
        <input autoComplete="off" value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
      </label>
      <label>
        <span>E-mail</span>
        <input type="email" autoComplete="off" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
      </label>
      <div className="form-grid-two">
        <label>
          <span>Senha</span>
          <input type="password" autoComplete="new-password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} />
        </label>
        <label>
          <span>Confirmar senha</span>
          <input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} />
        </label>
      </div>
      <div className="form-grid-two">
        <label>
          <span>Setor</span>
          <select value={form.sector} onChange={(event) => updateForm('sector', event.target.value)}>
            <option value="" disabled>Selecione um setor</option>
            {memberSectors.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Cargo</span>
          <input autoComplete="off" value={form.role} onChange={(event) => updateForm('role', event.target.value)} />
        </label>
      </div>

      <button type="submit" className="primary-button auth-submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar conta'}
      </button>
      <div className="auth-links">
        <button type="button" onClick={() => onNavigate('login')}>Voltar para login</button>
      </div>
    </form>
  );
}

export default Register;
