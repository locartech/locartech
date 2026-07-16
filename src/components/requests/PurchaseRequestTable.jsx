import { Archive, ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import EmptyState from '../common/EmptyState';
import RequestPriorityBadge from './RequestPriorityBadge';
import { purchaseStatuses } from '../../data/purchaseRequestsData';
import { formatRequestDate } from '../../utils/requestUtils';
import PurchaseRequestStatusBadge from './PurchaseRequestStatusBadge';

// Rendered through a portal into document.body, positioned from the trigger's
// actual screen coordinates - the table's horizontal-scroll wrapper otherwise
// clips this dropdown vertically (overflow-x: auto forces overflow-y non-
// visible in some browsers regardless of an explicit overflow-y: visible).
function PurchaseStatusMenu({ request, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const currentStatus = purchaseStatuses.find((status) => status.id === request.status) ?? purchaseStatuses[0];

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
        minWidth: rect.width,
      });
    }
    setOpen((current) => !current);
  };

  const handleStatusSelect = (statusId) => {
    setOpen(false);
    if (statusId !== request.status) {
      onStatusChange(request, statusId);
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleClose = () => setOpen(false);

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [open]);

  return (
    <div className="purchase-status-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`purchase-status-trigger purchase-status-${request.status}`}
        onClick={handleToggle}
      >
        <span>{currentStatus.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open && menuStyle
        ? createPortal(
            <div ref={menuRef} className="purchase-status-options" style={menuStyle}>
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PurchaseRequestTable({
  requests,
  canManage,
  view = 'active',
  restricted = false,
  onBlockedAction,
  onStatusChange,
  onArchive,
  onRestore,
  dueDateSort = null,
  onToggleDueDateSort,
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title={view === 'archived' ? 'Nenhuma compra arquivada' : 'Nenhuma solicitacao de compra encontrada.'}
        description={
          view === 'archived'
            ? 'As solicitacoes de compra arquivadas aparecerao nesta lista.'
            : 'As solicitacoes de compra feitas pela obra aparecerao nesta lista.'
        }
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
          <button type="button" className="purchase-sort-header" onClick={onToggleDueDateSort}>
            Prazo
            {dueDateSort === 'asc' ? (
              <ArrowUp size={13} aria-hidden="true" />
            ) : dueDateSort === 'desc' ? (
              <ArrowDown size={13} aria-hidden="true" />
            ) : (
              <ArrowUpDown size={13} aria-hidden="true" />
            )}
          </button>
          <div>Status</div>
          <div>Acoes</div>
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
            <div>{formatRequestDate(request.dueDate, 'Sem prazo')}</div>
            <div>
              {canManage && view === 'active' ? (
                <PurchaseStatusMenu request={request} onStatusChange={onStatusChange} />
              ) : (
                <PurchaseRequestStatusBadge value={request.status} />
              )}
            </div>
            <div className="purchase-actions-cell">
              {view === 'archived' ? (
                <button
                  type="button"
                  className="table-icon-button success"
                  onClick={() => (restricted ? onBlockedAction?.() : onRestore(request))}
                  title="Restaurar solicitacao"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="table-icon-button archive"
                  onClick={() => (restricted ? onBlockedAction?.() : onArchive(request))}
                  title="Arquivar solicitacao"
                >
                  <Archive size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PurchaseRequestTable;
