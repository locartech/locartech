import { ExternalLink, X } from 'lucide-react';

const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );

function KnowledgeDetailsModal({ record, onClose }) {
  if (!record) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-detail-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">{record.sector}</p>
            <h2 id="knowledge-detail-title">{record.title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar detalhes">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="knowledge-detail-body">
          <span className="knowledge-type-badge">{record.type}</span>
          <p>{record.description}</p>
          <dl className="profile-detail-grid">
            <div>
              <dt>Setor</dt>
              <dd>{record.sector}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{record.responsible}</dd>
            </div>
            <div>
              <dt>Publicação</dt>
              <dd>{formatDate(record.publishedAt)}</dd>
            </div>
            <div>
              <dt>Criado em</dt>
              <dd>{formatDate(record.createdAt)}</dd>
            </div>
          </dl>
          <a className="primary-button" href={record.driveLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} aria-hidden="true" />
            Abrir no Drive
          </a>
        </div>
      </section>
    </div>
  );
}

export default KnowledgeDetailsModal;
