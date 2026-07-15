import { Search, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';

function NewContactModal({ users, currentUser, onClose, onSelect }) {
  const [query, setQuery] = useState('');

  const contacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((user) => user.id !== currentUser.id)
      .filter((user) => {
        if (!normalizedQuery) return true;
        return `${user.name} ${user.sector} ${user.role}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
  }, [currentUser.id, query, users]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal chat-contact-modal" role="dialog" aria-modal="true" aria-labelledby="new-contact-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Novo contato</p>
            <h2 id="new-contact-title">Iniciar conversa</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="chat-contact-body">
          <label className="chat-search contact-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, setor ou cargo"
              autoFocus
            />
          </label>

          <div className="contact-picker-list">
            {contacts.map((contact) => (
              <button key={contact.id} type="button" className="contact-picker-item" onClick={() => onSelect(contact)}>
                <span className="user-avatar">
                  {contact.avatarInitials || <UserRound size={18} aria-hidden="true" />}
                </span>
                <span>
                  <strong>{contact.name}</strong>
                  <small>{contact.sector} - {contact.role}</small>
                </span>
              </button>
            ))}
            {contacts.length === 0 ? (
              <div className="contact-picker-empty">Nenhum membro encontrado.</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default NewContactModal;
