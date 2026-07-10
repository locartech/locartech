import { purchaseStatuses } from '../../data/purchaseRequestsData';

function PurchaseRequestStatusBadge({ value }) {
  const label = purchaseStatuses.find((status) => status.id === value)?.label ?? value;
  return <span className={`purchase-status purchase-status-${value}`}>{label}</span>;
}

export default PurchaseRequestStatusBadge;
