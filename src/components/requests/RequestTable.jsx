import { Eye, Pencil } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import RequestApprovalActions from './RequestApprovalActions';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';

const formatDate = (value) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );

function RequestTable({
  requests,
  currentUser,
  activeTab,
  onView,
  onEdit,
  onApprove,
  onReject,
  onCancel,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Nenhuma solicitacao encontrada"
        description="Ajuste os filtros ou crie uma nova solicitacao para iniciar o fluxo."
      />
    );
  }

  return (
    <div className="request-table-shell">
      <div className="request-table">
        <div className="request-row request-table-head">
          <div>Titulo</div>
          <div>Atividade</div>
          <div>Solicitante</div>
          <div>Destino</div>
          <div>Status</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Kanban</div>
          <div>Acoes</div>
        </div>

        {requests.map((request) => {
          const canEdit =
            request.requestStatus === 'pending_approval' &&
            (request.requesterUserId === currentUser.id ||
              request.requesterName === currentUser.name ||
              request.requesterSector === currentUser.sector);

          return (
            <div className="request-row" key={request.id}>
              <div className="request-title-cell">
                <strong>{request.title}</strong>
                <span>{request.description || 'Sem descricao'}</span>
              </div>
              <div>{request.stepName}</div>
              <div>
                <strong>{request.requesterName}</strong>
                <span className="muted-cell">{request.requesterSector}</span>
              </div>
              <div>
                <strong>{request.targetSector}</strong>
                {request.responsibleName ? <span className="muted-cell">{request.responsibleName}</span> : null}
              </div>
              <div>
                <RequestStatusBadge value={request.requestStatus} />
              </div>
              <div>
                <RequestPriorityBadge value={request.priority} />
              </div>
              <div>{formatDate(request.dueDate)}</div>
              <div>
                {request.generatedTaskId ? <span className="kanban-linked-badge">Gerada</span> : <span className="muted-cell">Nao gerada</span>}
              </div>
              <div className="request-actions">
                <button type="button" className="table-icon-button" onClick={() => onView(request)} title="Ver detalhes">
                  <Eye size={16} aria-hidden="true" />
                </button>
                {canEdit ? (
                  <button type="button" className="table-icon-button" onClick={() => onEdit(request)} title="Editar solicitacao">
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                ) : null}
                <RequestApprovalActions
                  request={request}
                  currentUser={currentUser}
                  activeTab={activeTab}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCancel={onCancel}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RequestTable;
