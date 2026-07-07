import { ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react';

const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );

function KnowledgeCard({ record, onView, onEdit, onDelete }) {
  return (
    <article className="knowledge-card">
      <div className="knowledge-card-icon">
        <FileText size={18} aria-hidden="true" />
      </div>
      <div className="knowledge-card-content">
        <div className="knowledge-card-heading">
          <span className="knowledge-type-badge">{record.type}</span>
          <time>{formatDate(record.publishedAt)}</time>
        </div>
        <h3>{record.title}</h3>
        <p>{record.description}</p>
        <div className="knowledge-meta">
          <span>Responsável: {record.responsible}</span>
          {record.updatedAt ? <span>Atualizado em {formatDate(record.updatedAt)}</span> : null}
        </div>
        <div className="knowledge-actions">
          <button type="button" className="ghost-button" onClick={() => onView(record)}>
            Abrir detalhes
          </button>
          <a className="table-icon-button" href={record.driveLink} target="_blank" rel="noopener noreferrer" title="Abrir no Drive">
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <button type="button" className="table-icon-button" onClick={() => onEdit(record)} title="Editar registro">
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button type="button" className="table-icon-button danger" onClick={() => onDelete(record)} title="Excluir registro">
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default KnowledgeCard;
