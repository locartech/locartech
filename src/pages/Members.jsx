import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AccessDenied from '../components/auth/AccessDenied';
import MemberFormModal from '../components/members/MemberFormModal';
import MembersStats from '../components/members/MembersStats';
import MembersTable from '../components/members/MembersTable';
import TransferAdminModal from '../components/members/TransferAdminModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  approveMemberRpc,
  deactivateMemberRpc,
  deleteProfile,
  fetchProfiles,
  rejectMemberRpc,
  updateProfile,
} from '../services/profilesService';
import { getMemberStats } from '../utils/membersUtils';

function Members() {
  const { profile: currentUser, isAdmin, setCurrentUser, organization, transferAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => getMemberStats(members), [members]);
  const primaryAdminId = organization?.adminProfileId;

  const loadRemoteMembers = async () => {
    try {
      const remoteMembers = await fetchProfiles();
      setMembers(remoteMembers);
      setError('');

      const refreshedCurrentUser = remoteMembers.find((member) => member.id === currentUser?.id);
      if (refreshedCurrentUser) setCurrentUser(refreshedCurrentUser);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel carregar os membros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRemoteMembers();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('profiles:members-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, loadRemoteMembers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="page-stack">
        <AccessDenied />
      </div>
    );
  }

  const handleEditMember = async (values) => {
    try {
      const updated = await updateProfile(editingMember.id, values);
      setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
      if (updated.id === currentUser.id) setCurrentUser(updated);
      setFeedback('Membro atualizado com sucesso.');
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel atualizar o membro.');
    }

    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleRemoveMember = async (member) => {
    if (member.id === primaryAdminId) {
      setFeedback('O administrador principal nao pode ser removido.');
      return;
    }

    const canRemove = window.confirm(`Deseja remover ${member.name}?`);
    if (!canRemove) return;

    try {
      await deleteProfile(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      setFeedback('Membro removido com sucesso.');
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel remover o membro.');
    }
  };

  const handleDeactivateMember = async (memberId) => {
    if (memberId === primaryAdminId) {
      setFeedback('O administrador principal nao pode ser desativado antes de transferir a administracao.');
      return;
    }

    try {
      const updated = await deactivateMemberRpc(memberId);
      setMembers((current) => current.map((item) => (item.id === memberId ? updated : item)));
      setFeedback('Membro desativado com sucesso.');
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel desativar o membro.');
    }
  };

  const handleApprove = async (memberId) => {
    try {
      const updated = await approveMemberRpc(memberId);
      setMembers((current) => current.map((item) => (item.id === memberId ? updated : item)));
      setFeedback('Conta aprovada com sucesso.');
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel aprovar a conta.');
    }
  };

  const handleReject = async (memberId) => {
    try {
      const updated = await rejectMemberRpc(memberId);
      setMembers((current) => current.map((item) => (item.id === memberId ? updated : item)));
      setFeedback('Conta rejeitada.');
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel rejeitar a conta.');
    }
  };

  const handleTransferAdmin = async (newAdminProfileId) => {
    try {
      await transferAdmin(newAdminProfileId);
      setIsTransferOpen(false);
      setFeedback('Administracao principal transferida com sucesso.');
      loadRemoteMembers();
    } catch (err) {
      setFeedback(err.message ?? 'Nao foi possivel transferir a administracao.');
    }
  };

  return (
    <div className="page-stack">
      <section className="page-heading members-heading">
        <div>
          <p className="eyebrow">Contas e permissoes</p>
          <h2>Gerenciamento de membros</h2>
        </div>
        <button type="button" className="primary-button large" onClick={() => setIsTransferOpen(true)}>
          <ShieldCheck size={16} aria-hidden="true" />
          Transferir administracao
        </button>
      </section>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando membros...</div> : null}

      <MembersStats stats={stats} />

      <section className="members-panel">
        <MembersTable
          members={members}
          primaryAdminId={primaryAdminId}
          onEdit={(member) => {
            setEditingMember(member);
            setIsModalOpen(true);
          }}
          onRemove={handleRemoveMember}
          onDeactivate={handleDeactivateMember}
          onApprove={handleApprove}
          onReject={handleReject}
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
          primaryAdminId={primaryAdminId}
          onClose={() => setIsTransferOpen(false)}
          onTransfer={handleTransferAdmin}
        />
      ) : null}
    </div>
  );
}

export default Members;
