import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
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

function PurchaseStatusMenu({ request, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const currentStatus = purchaseStatuses.find((status) => status.id === request.status) ?? purchaseStatuses[0];

  const handleStatusSelect = (statusId) => {
    setOpen(false);
    if (statusId !== request.status) {
      onStatusChange(request, statusId);
    }
  };

  return (
    <div className="purchase-status-menu">
      <button
        type="button"
        className={`purchase-status-trigger purchase-status-${request.status}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{currentStatus.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div className="purchase-status-options">
          {purchaseStatuses.map((status) => (
            <button
              key={status.id}
              type="button"
              className={`purchase-status-option purchase-status-${status.id}`}
              onClick={() => handleStatusSelect(status.id)}
            >
              {status.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
          <div>Descricao</div>
          <div>Observacao</div>
          <div>Solicitante</div>
          <div>Obra/local</div>
          <div>Prioridade</div>
          <div>Prazo</div>
          <div>Status</div>
        </div>

        {requests.map((request) => (
          <div className="purchase-row" key={request.id}>
            <div className="purchase-text-cell purchase-description-cell">{request.description}</div>
            <div className="purchase-text-cell">{request.notes || '-'}</div>
            <div>{request.requesterName}</div>
            <div>{request.workLocation || '-'}</div>
            <div>
              <RequestPriorityBadge value={request.priority} />
            </div>
            <div>{formatDate(request.dueDate)}</div>
            <div>
              {canManage ? (
                <PurchaseStatusMenu request={request} onStatusChange={onStatusChange} />
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
