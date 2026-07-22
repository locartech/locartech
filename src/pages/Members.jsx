import { useEffect, useMemo, useState } from 'react';
import AccessDenied from '../components/auth/AccessDenied';
import ConfirmModal from '../components/common/ConfirmModal';
import MemberFormModal from '../components/members/MemberFormModal';
import MembersStats from '../components/members/MembersStats';
import MembersTable from '../components/members/MembersTable';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  approveMemberRpc,
  deactivateMemberRpc,
  deleteMemberAccountRpc,
  fetchProfiles,
  rejectMemberRpc,
  setMemberAdminStatusRpc,
  updateProfile,
} from '../services/profilesService';
import { getMemberStats } from '../utils/membersUtils';

function Members() {
  const { profile: currentUser, isAdmin, setCurrentUser, organization, refreshOrganization } = useAuth();
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminChange, setAdminChange] = useState(null);
  const [changingAdmin, setChangingAdmin] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingMember, setRemovingMember] = useState(null);
  const [removing, setRemoving] = useState(false);

  const stats = useMemo(() => getMemberStats(members), [members]);
  const primaryAdminId = organization?.adminProfileId;
  const activeAdminCount = useMemo(
    () => members.filter((member) => member.accountType === 'admin' && member.status === 'Ativo').length,
    [members],
  );

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
      const protectedValues = {
        ...values,
        accountType: editingMember.accountType,
        ...(editingMember.id === primaryAdminId ? { status: 'Ativo' } : {}),
      };
      const updated = await updateProfile(editingMember.id, protectedValues);
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
    if (member.id === currentUser?.id) {
      setFeedback('Voce nao pode excluir a propria conta. Outro administrador deve realizar essa acao.');
      return;
    }
    if (member.id === primaryAdminId) {
      setFeedback('O administrador principal nao pode ser removido.');
      return;
    }

    setError('');
    setRemovingMember(member);
  };

  const handleConfirmRemoveMember = async () => {
    if (!removingMember) return;
    setRemoving(true);
    try {
      await deleteMemberAccountRpc(removingMember.id);
      setMembers((current) => current.filter((item) => item.id !== removingMember.id));
      setFeedback('Conta e dados pessoais do membro excluidos com sucesso.');
      setRemovingMember(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel excluir a conta do membro.');
    } finally {
      setRemoving(false);
    }
  };

  const handleDeactivateMember = async (memberId) => {
    if (memberId === currentUser?.id) {
      setFeedback('Voce nao pode desativar a propria conta.');
      return;
    }
    if (memberId === primaryAdminId) {
      setFeedback('Remova o acesso administrativo deste membro antes de desativar a conta.');
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

  const handleConfirmAdminChange = async () => {
    if (!adminChange) return;
    setChangingAdmin(true);
    try {
      const updated = await setMemberAdminStatusRpc(adminChange.member.id, adminChange.makeAdmin);
      setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)));
      if (updated.id === currentUser?.id) setCurrentUser(updated);
      await refreshOrganization();
      setFeedback(adminChange.makeAdmin ? 'Membro definido como administrador.' : 'Acesso de administrador removido.');
      setAdminChange(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel alterar o acesso administrativo.');
    } finally {
      setChangingAdmin(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-heading members-heading">
        <div>
          <p className="eyebrow">Contas e permissoes</p>
          <h2>Gerenciamento de membros</h2>
        </div>
      </section>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando membros...</div> : null}

      <MembersStats stats={stats} />

      <section className="members-panel">
        <MembersTable
          members={members}
          currentUserId={currentUser?.id}
          primaryAdminId={primaryAdminId}
          activeAdminCount={activeAdminCount}
          onEdit={(member) => {
            setEditingMember(member);
            setIsModalOpen(true);
          }}
          onRemove={handleRemoveMember}
          onAdminChange={(member, makeAdmin) => {
            setError('');
            setAdminChange({ member, makeAdmin });
          }}
          onDeactivate={handleDeactivateMember}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </section>

      {isModalOpen ? (
        <MemberFormModal
          member={editingMember}
          protectAdminAccess={editingMember?.id === primaryAdminId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMember(null);
          }}
          onSubmit={handleEditMember}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(adminChange)}
        title={adminChange?.makeAdmin ? 'Tornar administrador' : 'Remover administrador'}
        message={adminChange?.makeAdmin
          ? `Deseja conceder acesso administrativo para ${adminChange?.member.name ?? 'este membro'}?`
          : `Deseja remover o acesso administrativo de ${adminChange?.member.name ?? 'este membro'}?`}
        cancelLabel="Cancelar"
        confirmLabel={adminChange?.makeAdmin ? 'Sim, tornar administrador' : 'Sim, remover acesso'}
        busy={changingAdmin}
        onCancel={() => {
          if (!changingAdmin) setAdminChange(null);
        }}
        onConfirm={handleConfirmAdminChange}
      />

      <ConfirmModal
        open={Boolean(removingMember)}
        title="Excluir conta do membro"
        message={`Tem certeza que deseja excluir a conta de ${removingMember?.name ?? 'este membro'}? O acesso, as conversas pessoais e as notificacoes dessa conta serao removidos permanentemente. Os dados operacionais dos setores serao preservados.`}
        cancelLabel="Cancelar"
        confirmLabel="Sim, excluir conta"
        busy={removing}
        error={error}
        onCancel={() => {
          if (!removing) setRemovingMember(null);
        }}
        onConfirm={handleConfirmRemoveMember}
      />
    </div>
  );
}

export default Members;
