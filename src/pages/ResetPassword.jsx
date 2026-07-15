import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function PasswordInput({ label, value, onChange, visible, onToggle, disabled }) {
  return (
    <label>
      <span>{label}</span>
      <div className="password-field">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          minLength={6}
          placeholder="Mínimo de 6 caracteres"
          disabled={disabled}
        />
        <button type="button" onClick={onToggle} title="Mostrar ou ocultar senha" disabled={disabled}>
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
    </label>
  );
}

function ResetPassword() {
  const { isPasswordRecovery, updatePassword, logout } = useAuth();
  const [recoveryState, setRecoveryState] = useState('checking');
  const [form, setForm] = useState({ password: '', confirmation: '' });
  const [visible, setVisible] = useState({ password: false, confirmation: false });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const completedRef = useRef(false);
  const recoveryDetectedRef = useRef(isPasswordRecovery);

  useEffect(() => {
    if (!isPasswordRecovery) return;
    recoveryDetectedRef.current = true;
    setRecoveryState('ready');
  }, [isPasswordRecovery]);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setRecoveryState('invalid');
      return undefined;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted || completedRef.current) return;
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recoveryDetectedRef.current = true;
        setRecoveryState('ready');
      }
      if (event === 'SIGNED_OUT') setRecoveryState('invalid');
    });

    const establishRecoverySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const authorizationCode = searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (authorizationCode) {
        await supabase.auth.exchangeCodeForSession(authorizationCode);
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted || completedRef.current) return;

      if (!error && data.session) {
        recoveryDetectedRef.current = true;
        setRecoveryState('ready');
        return;
      }

      setRecoveryState('invalid');
    };

    establishRecoverySession().catch(() => {
      if (mounted && !completedRef.current) setRecoveryState('invalid');
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleBackToLogin = async () => {
    completedRef.current = true;
    await logout();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (form.password.length < 6) {
      setStatus({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (form.password !== form.confirmation) {
      setStatus({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setLoading(true);
    let result;

    try {
      result = await updatePassword(form.password);
    } catch {
      result = {
        ok: false,
        message: 'Não foi possível atualizar sua senha. Solicite um novo link de recuperação.',
      };
    }

    if (!result.ok) {
      setStatus({ type: 'error', message: result.message });
      setLoading(false);
      return;
    }

    completedRef.current = true;
    setStatus({
      type: 'success',
      message: 'Sua senha foi atualizada com sucesso. Você já pode acessar sua conta.',
    });
    await logout();
    setLoading(false);
    window.setTimeout(() => window.location.replace('/login'), 2200);
  };

  if (recoveryState === 'checking') {
    return (
      <AuthShell backToLogin onBackToLogin={handleBackToLogin}>
        <div className="auth-recovery-state" role="status">
          <LoaderCircle className="auth-spinner" size={28} aria-hidden="true" />
          <h1>Validando link</h1>
          <p>Estamos verificando sua sessão de recuperação.</p>
        </div>
      </AuthShell>
    );
  }

  if (recoveryState === 'invalid') {
    return (
      <AuthShell backToLogin onBackToLogin={handleBackToLogin}>
        <div className="auth-recovery-state">
          <span className="auth-security-icon"><KeyRound size={22} aria-hidden="true" /></span>
          <h1>Link inválido ou expirado</h1>
          <p>Este link de recuperação é inválido ou expirou. Solicite um novo link.</p>
          <a className="primary-button auth-action-link" href="/esqueci-senha">Solicitar novo link</a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell backToLogin onBackToLogin={handleBackToLogin}>
      <form className="auth-form auth-recovery-form" onSubmit={handleSubmit}>
        <div className="auth-form-heading">
          <span className="auth-security-icon"><KeyRound size={22} aria-hidden="true" /></span>
          <p className="eyebrow">Proteção da conta</p>
          <h1>Redefinir senha</h1>
          <span>Crie uma nova senha para acessar sua conta.</span>
        </div>

        {status.message ? <div className={`auth-alert ${status.type}`}>{status.message}</div> : null}

        <PasswordInput
          label="Nova senha"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          visible={visible.password}
          onToggle={() => setVisible((current) => ({ ...current, password: !current.password }))}
          disabled={loading || status.type === 'success'}
        />

        <PasswordInput
          label="Confirmar nova senha"
          value={form.confirmation}
          onChange={(event) => setForm((current) => ({ ...current, confirmation: event.target.value }))}
          visible={visible.confirmation}
          onToggle={() => setVisible((current) => ({ ...current, confirmation: !current.confirmation }))}
          disabled={loading || status.type === 'success'}
        />

        <button type="submit" className="primary-button auth-submit" disabled={loading || status.type === 'success'}>
          {loading ? 'Salvando senha...' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthShell>
  );
}

export default ResetPassword;
