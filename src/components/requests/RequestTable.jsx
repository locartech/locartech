import { Archive, Eye, Pencil, RotateCcw } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import RequestApprovalActions from './RequestApprovalActions';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';
import { kanbanStatuses } from '../../data/kanbanData';
import { canArchiveRequest, canEditPendingRequest } from '../../utils/permissions';
import { formatRequestDate } from '../../utils/requestUtils';

function RequestTable({
  requests,
  currentUser,
  activeTab,
  view = 'active',
  onView,
  onEdit,
  onApprove,
  onReject,
  onArchive,
  onRestore,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title={view === 'archived' ? 'Nenhuma solicitacao arquivada' : 'Nenhuma solicitacao encontrada'}
        description={
          view === 'archived'
            ? 'As solicitacoes arquivadas aparecerao nesta lista.'
            : 'Ajuste os filtros ou crie uma nova solicitacao para iniciar o fluxo.'
        }
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
          const canEdit = view === 'active' && canEditPendingRequest(currentUser, request);
          const canArchive = canArchiveRequest(currentUser, request);

          return (
            <div className="request-row" key={request.id}>
              <div className="request-title-cell">
                <strong>{request.title}</strong>
                <span>{request.description || 'Sem descricao'}</span>
              </div>
              <div>{request.stepName}</div>
              <div>
                <strong>{request.requesterName}</strong>
                <span className="muted-cell">({request.requesterSector})</span>
              </div>
              <div>
                <strong>{request.targetSector}</strong>
                {request.responsibleName ? <span className="muted-cell">({request.responsibleName})</span> : null}
              </div>
              <div>
                <RequestStatusBadge value={request.requestStatus} />
              </div>
              <div>
                <RequestPriorityBadge value={request.priority} />
              </div>
              <div>{formatRequestDate(request.dueDate)}</div>
              <div>
                {request.generatedTaskId ? (
                  <span className={`kanban-linked-badge kanban-linked-badge-${request.kanbanStatus}`}>
                    {kanbanStatuses.find((status) => status.id === request.kanbanStatus)?.label ?? request.kanbanStatus}
                  </span>
                ) : (
                  <span className="muted-cell">Nao gerada</span>
                )}
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
                {view === 'archived' && canArchive ? (
                  <button type="button" className="table-icon-button success" onClick={() => onRestore(request)} title="Restaurar solicitacao">
                    <RotateCcw size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <>
                    <RequestApprovalActions
                      request={request}
                      currentUser={currentUser}
                      activeTab={activeTab}
                      onApprove={onApprove}
                      onReject={onReject}
                    />
                    {canArchive ? (
                      <button type="button" className="table-icon-button archive" onClick={() => onArchive(request)} title="Arquivar solicitacao">
                        <Archive size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RequestTable;
