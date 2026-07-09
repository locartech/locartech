import { Clock3, LockKeyhole, UserX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_CONTENT = {
  Pendente: {
    icon: Clock3,
    eyebrow: 'Aguardando aprovação',
    title: 'Sua conta ainda não foi aprovada.',
    description: 'Um administrador da Locartech precisa liberar seu acesso. Você recebe uma notificação assim que sua conta for aprovada.',
  },
  Rejeitado: {
    icon: LockKeyhole,
    eyebrow: 'Acesso recusado',
    title: 'Sua solicitação de acesso foi recusada.',
    description: 'Entre em contato com o administrador da Locartech se acredita que isso é um engano.',
  },
  Inativo: {
    icon: UserX,
    eyebrow: 'Conta inativa',
    title: 'Sua conta está inativa no momento.',
    description: 'Entre em contato com o administrador da Locartech para reativar seu acesso.',
  },
};

function AccountStatusScreen({ status }) {
  const { logout, profile } = useAuth();
  const content = STATUS_CONTENT[status] ?? STATUS_CONTENT.Pendente;
  const Icon = content.icon;

  return (
    <main className="auth-page">
      <section className="account-status-card">
        <div className="account-status-icon">
          <Icon size={22} aria-hidden="true" />
        </div>
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        {profile?.email ? <p className="account-status-email">{profile.email}</p> : null}
        <button type="button" className="ghost-button" onClick={logout}>
          Sair
        </button>
      </section>
    </main>
  );
}

export default AccountStatusScreen;
