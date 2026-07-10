import PurchaseRequestsPanel from '../components/requests/PurchaseRequestsPanel';
import { useAuth } from '../contexts/AuthContext';

function PurchaseRequests() {
  const { currentUser } = useAuth();

  return (
    <div className="page-stack">
      <PurchaseRequestsPanel currentUser={currentUser} />
    </div>
  );
}

export default PurchaseRequests;
