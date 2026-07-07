import { CheckCircle2, Eye, Pencil, XCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';

const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );

function RequestTable({
  requests,
  currentUser,
  onStatusChange,
  onView,
  onEdit,
  onComplete,
  onCancel,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Nenhuma solicitação encontrada"
        description="Ajuste os filtros ou crie uma nova solicitação para iniciar o fluxo."
      />
    );
  }

  return (
    <div className="request-table-shell">
      <div className="request-table">
        <div className="request-row request-table-head">
          <div>Título</div>
          <div>Setor solicitante</div>
          <div>Setor responsável</div>
          <div>Solicitante</div>
          <div>Status</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Ações</div>
        </div>

        {requests.map((request) => {
          const canManage = request.targetSector === currentUser.sector;
          const canEdit = request.requesterName === currentUser.name || request.requesterSector === currentUser.sector;

          return (
            <div className="request-row" key={request.id}>
              <div className="request-title-cell">
                <strong>{request.title}</strong>
                <span>{request.description}</span>
              </div>
              <div>{request.requesterSector}</div>
              <div>{request.targetSector}</div>
              <div>{request.requesterName}</div>
              <div>
                <RequestStatusBadge
                  value={request.status}
                  editable={canManage}
                  onChange={(status) => onStatusChange(request.id, status)}
                />
              </div>
              <div>
                <RequestPriorityBadge value={request.priority} />
              </div>
              <div>{formatDate(request.dueDate)}</div>
              <div className="request-actions">
                <button type="button" className="table-icon-button" onClick={() => onView(request)} title="Ver detalhes">
                  <Eye size={16} aria-hidden="true" />
                </button>
                {canEdit ? (
                  <button type="button" className="table-icon-button" onClick={() => onEdit(request)} title="Editar solicitação">
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                ) : null}
                {canManage && request.status !== 'completed' ? (
                  <button type="button" className="table-icon-button success" onClick={() => onComplete(request.id)} title="Marcar como concluída">
                    <CheckCircle2 size={16} aria-hidden="true" />
                  </button>
                ) : null}
                {(canEdit || canManage) && request.status !== 'canceled' && request.status !== 'completed' ? (
                  <button type="button" className="table-icon-button danger" onClick={() => onCancel(request.id)} title="Cancelar solicitação">
                    <XCircle size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RequestTable;
