import { Ban, Check, Pencil, Trash2, XCircle } from 'lucide-react';
import MemberStatusBadge from './MemberStatusBadge';
import MemberTypeBadge from './MemberTypeBadge';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
      )
    : 'Sem registro';

function MembersTable({ members, companyAdminEmail, onEdit, onRemove, onDeactivate, onApprove, onReject }) {
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
          const isCompanyAdmin = member.email === companyAdminEmail;

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
                {member.status === 'Pendente' ? (
                  <>
                    <button type="button" className="table-icon-button success" onClick={() => onApprove(member.id)} title="Aprovar conta">
                      <Check size={15} aria-hidden="true" />
                    </button>
                    <button type="button" className="table-icon-button danger" onClick={() => onReject(member.id)} title="Rejeitar conta">
                      <XCircle size={15} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
                <button type="button" className="table-icon-button" onClick={() => onEdit(member)} title="Editar membro">
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="table-icon-button"
                  onClick={() => onDeactivate(member.id)}
                  disabled={isCompanyAdmin || member.status === 'Inativo'}
                  title="Desativar membro"
                >
                  <Ban size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="table-icon-button danger"
                  onClick={() => onRemove(member)}
                  disabled={isCompanyAdmin}
                  title="Remover membro"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MembersTable;
