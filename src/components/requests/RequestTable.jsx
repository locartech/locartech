import { Archive, CheckCircle2, Eye, Pencil, RotateCcw, XCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import RowActionsMenu from '../common/RowActionsMenu';
import RequestPriorityBadge from './RequestPriorityBadge';
import RequestStatusBadge from './RequestStatusBadge';
import { kanbanStatuses } from '../../data/kanbanData';
import { canArchiveRequest, canEditPendingRequest, canManageIncomingRequest } from '../../utils/permissions';
import { formatRequestDate } from '../../utils/requestUtils';

function RequestTable({
  requests,
  currentUser,
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
          const isPending = request.requestStatus === 'pending_approval';
          const canManage = canManageIncomingRequest(currentUser, request);

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
                <RowActionsMenu
                  items={[
                    { label: 'Ver detalhes', icon: <Eye size={16} aria-hidden="true" />, onClick: () => onView(request) },
                    canEdit
                      ? { label: 'Editar solicitacao', icon: <Pencil size={16} aria-hidden="true" />, onClick: () => onEdit(request) }
                      : null,
                    view === 'archived' && canArchive
                      ? {
                          label: 'Restaurar solicitacao',
                          icon: <RotateCcw size={16} aria-hidden="true" />,
                          tone: 'success',
                          onClick: () => onRestore(request),
                        }
                      : null,
                    view !== 'archived' && canManage && isPending
                      ? {
                          label: 'Aprovar solicitacao',
                          icon: <CheckCircle2 size={16} aria-hidden="true" />,
                          tone: 'success',
                          onClick: () => onApprove(request),
                        }
                      : null,
                    view !== 'archived' && canManage && isPending
                      ? {
                          label: 'Recusar solicitacao',
                          icon: <XCircle size={16} aria-hidden="true" />,
                          tone: 'danger',
                          onClick: () => onReject(request),
                        }
                      : null,
                    view !== 'archived' && canArchive
                      ? {
                          label: 'Arquivar solicitacao',
                          icon: <Archive size={16} aria-hidden="true" />,
                          onClick: () => onArchive(request),
                        }
                      : null,
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

export default RequestTable;
