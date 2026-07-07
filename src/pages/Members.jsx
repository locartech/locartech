import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AccessDenied from '../components/auth/AccessDenied';
import MemberFormModal from '../components/members/MemberFormModal';
import MembersStats from '../components/members/MembersStats';
import MembersTable from '../components/members/MembersTable';
import TransferAdminModal from '../components/members/TransferAdminModal';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  deleteProfile,
  fetchProfiles,
  updateProfile,
  updateProfileStatus,
} from '../services/profilesService';
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
  const [usingSupabase, setUsingSupabase] = useState(false);

  const stats = useMemo(() => getMemberStats(members), [members]);

  const loadRemoteMembers = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteMembers = await fetchProfiles();
      setMembers(remoteMembers);
      setUsingSupabase(true);

      const refreshedCurrentUser = remoteMembers.find((member) => member.id === currentUser.id);
      if (refreshedCurrentUser) setCurrentUser(refreshedCurrentUser);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemoteMembers();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !usingSupabase) return undefined;

    const channel = supabase
      .channel('profiles:members-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadRemoteMembers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usingSupabase]);

  const persistMembers = (nextMembers) => {
    setMembers(nextMembers);
    saveMembers(nextMembers);

    const refreshedCurrentUser = nextMembers.find((member) => member.id === currentUser.id);
    if (refreshedCurrentUser) setCurrentUser(refreshedCurrentUser);
  };

  if (!isAdmin) {
    return (
      <div className="page-stack">
        <AccessDenied />
      </div>
    );
  }

  const handleEditMember = async (values) => {
    if (usingSupabase) {
      const updated = await updateProfile(editingMember.id, values);
      setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
      if (updated.id === currentUser.id) setCurrentUser(updated);
    } else {
      persistMembers(updateMember(members, editingMember.id, values));
    }

    setIsModalOpen(false);
    setEditingMember(null);
    setFeedback('Membro atualizado com sucesso.');
  };

  const handleRemoveMember = async (member) => {
    if (member.email === companyAdminEmail) {
      setFeedback('O administrador principal nao pode ser removido.');
      return;
    }

    const canRemove = window.confirm(`Deseja remover ${member.name}?`);
    if (!canRemove) return;

    if (usingSupabase) {
      await deleteProfile(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
    } else {
      persistMembers(removeMember(members, member.id));
    }
    setFeedback('Membro removido com sucesso.');
  };

  const handleDeactivateMember = async (memberId) => {
    const member = members.find((candidate) => candidate.id === memberId);
    if (member?.email === companyAdminEmail) {
      setFeedback('O administrador principal nao pode ser desativado antes de transferir a administracao.');
      return;
    }

    if (usingSupabase) {
      const updated = await updateProfileStatus(memberId, 'Inativo');
      setMembers((current) => current.map((item) => (item.id === memberId ? updated : item)));
    } else {
      persistMembers(deactivateMember(members, memberId));
    }
    setFeedback('Membro desativado com sucesso.');
  };

  const handleStatusChange = async (memberId, status, message) => {
    if (usingSupabase) {
      const updated = await updateProfileStatus(memberId, status);
      setMembers((current) => current.map((item) => (item.id === memberId ? updated : item)));
    } else {
      persistMembers(status === 'Ativo' ? approveMember(members, memberId) : rejectMember(members, memberId));
    }
    setFeedback(message);
  };

  const handleTransferAdmin = (email) => {
    transferAdmin(email);
    setIsTransferOpen(false);
    setFeedback('Administracao principal transferida com sucesso.');
  };

  return (
    <div className="page-stack">
      <section className="page-heading members-heading">
        <div>
          <p className="eyebrow">Contas e permissoes</p>
          <h2>Gerenciamento de membros</h2>
          <p>
            Controle contas, setores, cargos, status e tipo de acesso dos membros da Locartech.
          </p>
        </div>
        <button type="button" className="primary-button large" onClick={() => setIsTransferOpen(true)}>
          <ShieldCheck size={16} aria-hidden="true" />
          Transferir administracao
        </button>
      </section>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {!usingSupabase ? (
        <div className="members-feedback">
          Usando dados locais ate as tabelas do Supabase serem aplicadas.
        </div>
      ) : null}

      <MembersStats stats={stats} />

      <section className="members-panel">
        <MembersTable
          members={members}
          companyAdminEmail={companyAdminEmail}
          onEdit={(member) => {
            setEditingMember(member);
            setIsModalOpen(true);
          }}
          onRemove={handleRemoveMember}
          onDeactivate={handleDeactivateMember}
          onApprove={(memberId) => handleStatusChange(memberId, 'Ativo', 'Conta aprovada com sucesso.')}
          onReject={(memberId) => handleStatusChange(memberId, 'Rejeitado', 'Conta rejeitada.')}
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
