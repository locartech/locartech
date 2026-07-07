import { ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import AccessDenied from '../components/auth/AccessDenied';
import MemberFormModal from '../components/members/MemberFormModal';
import MembersStats from '../components/members/MembersStats';
import MembersTable from '../components/members/MembersTable';
import TransferAdminModal from '../components/members/TransferAdminModal';
import { useAuth } from '../contexts/AuthContext';
import {
  approveMember,
  deactivateMember,
  getMemberStats,
  loadMembers,
  rejectMember,
  removeMember,
  saveMembers,
  updateMember,
} from '../utils/membersUtils';

function Members() {
  const { currentUser, isAdmin, setCurrentUser, companyAdminEmail, transferAdmin } = useAuth();
  const [members, setMembers] = useState(loadMembers);
  const [editingMember, setEditingMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const stats = useMemo(() => getMemberStats(members), [members]);

  const persistMembers = (nextMembers) => {
    setMembers(nextMembers);
    saveMembers(nextMembers);

    const refreshedCurrentUser = nextMembers.find((member) => member.id === currentUser.id);
    if (refreshedCurrentUser) {
      setCurrentUser(refreshedCurrentUser);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-stack">
        <AccessDenied />
      </div>
    );
  }

  const handleEditMember = (values) => {
    const nextMembers = updateMember(members, editingMember.id, values);
    persistMembers(nextMembers);
    setIsModalOpen(false);
    setEditingMember(null);
    setFeedback('Membro atualizado com sucesso.');
  };

  const handleRemoveMember = (member) => {
    if (member.email === companyAdminEmail) {
      setFeedback('O administrador principal não pode ser removido.');
      return;
    }

    const canRemove = window.confirm(`Deseja remover ${member.name}?`);
    if (canRemove) {
      persistMembers(removeMember(members, member.id));
      setFeedback('Membro removido com sucesso.');
    }
  };

  const handleDeactivateMember = (memberId) => {
    const member = members.find((candidate) => candidate.id === memberId);
    if (member?.email === companyAdminEmail) {
      setFeedback('O administrador principal não pode ser desativado antes de transferir a administração.');
      return;
    }

    persistMembers(deactivateMember(members, memberId));
    setFeedback('Membro desativado com sucesso.');
  };

  const handleTransferAdmin = (email) => {
    transferAdmin(email);
    setIsTransferOpen(false);
    setFeedback('Administração principal transferida com sucesso.');
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  return (
    <div className="page-stack">
      <section className="page-heading members-heading">
        <div>
          <p className="eyebrow">Contas e permissões</p>
          <h2>Gerenciamento de membros</h2>
          <p>
            Controle contas mockadas, setores, cargos, status e tipo de acesso dos membros da Locartech.
          </p>
        </div>
        <button
          type="button"
          className="primary-button large"
          onClick={() => setIsTransferOpen(true)}
        >
          <ShieldCheck size={16} aria-hidden="true" />
          Transferir administração
        </button>
      </section>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}

      <MembersStats stats={stats} />

      <section className="members-panel">
        <MembersTable
          members={members}
          companyAdminEmail={companyAdminEmail}
          onEdit={handleOpenEdit}
          onRemove={handleRemoveMember}
          onDeactivate={handleDeactivateMember}
          onApprove={(memberId) => {
            persistMembers(approveMember(members, memberId));
            setFeedback('Conta aprovada com sucesso.');
          }}
          onReject={(memberId) => {
            persistMembers(rejectMember(members, memberId));
            setFeedback('Conta rejeitada.');
          }}
        />
      </section>

      {isModalOpen ? (
        <MemberFormModal
          member={editingMember}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMember(null);
          }}
          onSubmit={handleEditMember}
        />
      ) : null}

      {isTransferOpen ? (
        <TransferAdminModal
          members={members}
          currentAdminEmail={companyAdminEmail}
          onClose={() => setIsTransferOpen(false)}
          onTransfer={handleTransferAdmin}
        />
      ) : null}
    </div>
  );
}

export default Members;
