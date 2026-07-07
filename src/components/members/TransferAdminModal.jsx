import { X } from 'lucide-react';
import { useState } from 'react';

function TransferAdminModal({ members, currentAdminEmail, onClose, onTransfer }) {
  const activeMembers = members.filter((member) => member.status === 'Ativo' && member.email !== currentAdminEmail);
  const [selectedEmail, setSelectedEmail] = useState(activeMembers[0]?.email ?? '');
  const selectedMember = activeMembers.find((member) => member.email === selectedEmail);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedMember) return;
    const confirmed = window.confirm(`Transferir administração principal para ${selectedMember.name}?`);
    if (confirmed) {
      onTransfer(selectedMember.email);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal member-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-admin-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Transferir administração</p>
            <h2 id="transfer-admin-title">Escolha o novo administrador principal</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className="edit-modal-form" onSubmit={handleSubmit}>
          <p className="modal-helper-text">
            Apenas membros ativos podem receber a administração principal. Depois da transferência, o antigo
            administrador deixa de visualizar a área Membros.
          </p>
          <label>
            <span>Novo administrador</span>
            <select value={selectedEmail} onChange={(event) => setSelectedEmail(event.target.value)}>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.email}>
                  {member.name} · {member.sector}
                </option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={!selectedEmail}>
              Transferir administração
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TransferAdminModal;
