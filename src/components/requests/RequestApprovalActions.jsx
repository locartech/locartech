import { CheckCircle2, XCircle } from 'lucide-react';
import { canManageIncomingRequest } from '../../utils/permissions';

function RequestApprovalActions({ request, currentUser, onApprove, onReject }) {
  const isPending = request.requestStatus === 'pending_approval';
  const canManage = canManageIncomingRequest(currentUser, request);

  return (
    <>
      {canManage && isPending ? (
        <>
          <button type="button" className="table-icon-button success" onClick={() => onApprove(request)} title="Aprovar solicitacao">
            <CheckCircle2 size={16} aria-hidden="true" />
          </button>
          <button type="button" className="table-icon-button danger" onClick={() => onReject(request)} title="Recusar solicitacao">
            <XCircle size={16} aria-hidden="true" />
          </button>
        </>
      ) : null}
    </>
  );
}

export default RequestApprovalActions;
