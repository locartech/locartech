import { Ban, Check, Pencil, Trash2, XCircle } from 'lucide-react';
import RowActionsMenu from '../common/RowActionsMenu';
import MemberStatusBadge from './MemberStatusBadge';
import MemberTypeBadge from './MemberTypeBadge';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
      )
    : 'Sem registro';

function MembersTable({ members, primaryAdminId, onEdit, onRemove, onDeactivate, onApprove, onReject }) {
  return (
    <div className="members-table-shell">
      <div className="members-table">
        <div className="members-row members-table-head">
          <div>Membro</div>
          <div>E-mail</div>
          <div>Setor</div>
          <div>Cargo</div>
          <div>Tipo</div>
          <div>Status</div>
          <div>Ações</div>
        </div>

        {members.map((member) => {
          const isCompanyAdmin = member.id === primaryAdminId;

          return (
            <div className={`members-row ${member.status === 'Inativo' ? 'inactive' : ''}`} key={member.id}>
              <div className="member-profile-cell">
                <span className="user-avatar">{member.avatarInitials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>Entrada em {formatDate(member.joinedAt)}</small>
                </div>
              </div>
              <div>{member.email}</div>
              <div>{member.sector}</div>
              <div>{member.role}</div>
              <div>
                <MemberTypeBadge accountType={member.accountType} principal={isCompanyAdmin} />
              </div>
              <div>
                <MemberStatusBadge status={member.status} />
              </div>
              <div className="member-actions">
                <RowActionsMenu
                  items={[
                    member.status === 'Pendente' && {
                      label: 'Aprovar conta',
                      icon: <Check size={16} aria-hidden="true" />,
                      tone: 'success',
                      onClick: () => onApprove(member.id),
                    },
                    member.status === 'Pendente' && {
                      label: 'Rejeitar conta',
                      icon: <XCircle size={16} aria-hidden="true" />,
                      tone: 'danger',
                      onClick: () => onReject(member.id),
                    },
                    {
                      label: 'Editar membro',
                      icon: <Pencil size={16} aria-hidden="true" />,
                      onClick: () => onEdit(member),
                    },
                    {
                      label: 'Desativar membro',
                      icon: <Ban size={16} aria-hidden="true" />,
                      disabled: isCompanyAdmin || member.status === 'Inativo',
                      onClick: () => onDeactivate(member.id),
                    },
                    {
                      label: 'Excluir conta',
                      icon: <Trash2 size={16} aria-hidden="true" />,
                      tone: 'danger',
                      disabled: isCompanyAdmin,
                      onClick: () => onRemove(member),
                    },
                  ]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MembersTable;
