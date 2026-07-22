import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { accountTypes, memberSectors, memberStatuses } from '../../data/membersData';
import useEscapeKey from '../../hooks/useEscapeKey';

const emptyMember = {
  name: '',
  email: '',
  sector: 'Compras',
  role: '',
  accountType: 'member',
  status: 'Ativo',
};

function MemberFormModal({ member, protectAdminAccess = false, onClose, onSubmit }) {
  useEscapeKey(onClose);
  const [draft, setDraft] = useState(emptyMember);

  useEffect(() => {
    if (member) {
      setDraft({
        name: member.name,
        email: member.email,
        sector: member.sector,
        role: member.role,
        accountType: member.accountType,
        status: member.status,
      });
      return;
    }

    setDraft(emptyMember);
  }, [member]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.email.trim() || !draft.role.trim()) return;
    onSubmit(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal member-modal" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Editar membro</p>
            <h2 id="member-form-title">{member?.name ?? 'Membro'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form member-form" onSubmit={handleSubmit}>
          <div className="form-grid-two">
            <label>
              <span>Nome</span>
              <input type="text" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
            </label>
            <label>
              <span>E-mail</span>
              <input type="email" value={draft.email} onChange={(event) => updateDraft('email', event.target.value)} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Setor</span>
              <select value={draft.sector} onChange={(event) => updateDraft('sector', event.target.value)}>
                {memberSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Cargo</span>
              <input type="text" value={draft.role} onChange={(event) => updateDraft('role', event.target.value)} />
            </label>
          </div>

          <div className="form-grid-two">
            <label>
              <span>Tipo de conta</span>
              <select
                value={draft.accountType}
                disabled
                title="Use o menu de acoes do membro para alterar o acesso administrativo"
                onChange={(event) => updateDraft('accountType', event.target.value)}
              >
                {accountTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={draft.status}
                disabled={protectAdminAccess}
                title={protectAdminAccess ? 'O administrador principal deve permanecer ativo' : undefined}
                onChange={(event) => updateDraft('status', event.target.value)}
              >
                {memberStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Salvar alterações
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default MemberFormModal;
