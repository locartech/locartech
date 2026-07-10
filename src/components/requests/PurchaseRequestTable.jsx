import EmptyState from '../common/EmptyState';
import RequestPriorityBadge from './RequestPriorityBadge';
import { purchaseStatuses } from '../../data/purchaseRequestsData';
import PurchaseRequestStatusBadge from './PurchaseRequestStatusBadge';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        new Date(`${value}T12:00:00`),
      )
    : 'Sem prazo';

function PurchaseRequestTable({ requests, canManage, onStatusChange }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Nenhuma compra solicitada"
        description="As solicitacoes de compra feitas pela obra aparecerao nesta lista."
      />
    );
  }

  return (
    <div className="purchase-table-shell">
      <div className="purchase-table">
        <div className="purchase-row purchase-table-head">
          <div>Item</div>
          <div>Descricao</div>
          <div>Solicitante</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Status</div>
        </div>

        {requests.map((request) => (
          <div className="purchase-row" key={request.id}>
            <div className="purchase-item-cell">
              <strong>{request.item}</strong>
              {request.workLocation ? <span>{request.workLocation}</span> : null}
            </div>
            <div>{request.description}</div>
            <div>{request.requesterName}</div>
            <div>
              <RequestPriorityBadge value={request.priority} />
            </div>
            <div>{formatDate(request.dueDate)}</div>
            <div>
              {canManage ? (
                <label className={`purchase-status-select purchase-status-${request.status}`}>
                  <span className="sr-only">Status da compra solicitada</span>
                  <select value={request.status} onChange={(event) => onStatusChange(request, event.target.value)}>
                    {purchaseStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <PurchaseRequestStatusBadge value={request.status} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PurchaseRequestTable;
