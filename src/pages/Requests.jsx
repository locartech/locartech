import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import RequestFilters from '../components/requests/RequestFilters';
import RequestForm from '../components/requests/RequestForm';
import RequestModal from '../components/requests/RequestModal';
import RequestRejectModal from '../components/requests/RequestRejectModal';
import RequestStats from '../components/requests/RequestStats';
import RequestTable from '../components/requests/RequestTable';
import RequestTabs from '../components/requests/RequestTabs';
import { useAuth } from '../contexts/AuthContext';
import { KANBAN_STORAGE_KEY, initialKanbanTasks } from '../data/kanbanData';
import { initialRequests, REQUESTS_STORAGE_KEY, requestStatusIds } from '../data/requestsData';
import {
  approveRequest,
  buildRequestApprovedNotification,
  buildRequestCreatedNotification,
  buildRequestRejectedNotification,
  cancelRequest,
  createKanbanTaskFromRequest,
  createRequest,
  filterRequests,
  getPendingApprovalRequests,
  getReceivedRequests,
  getSentRequests,
  getTodayReceivedRequests,
  normalizeRequest,
  rejectRequest,
  updateRequest,
} from '../utils/requestUtils';

function loadRequests() {
  try {
    const savedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (savedRequests) return JSON.parse(savedRequests).map(normalizeRequest);
  } catch {
    localStorage.removeItem(REQUESTS_STORAGE_KEY);
  }

  return initialRequests.map(normalizeRequest);
}

function loadKanbanTasks() {
  try {
    const savedTasks = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (savedTasks) return JSON.parse(savedTasks);
  } catch {
    localStorage.removeItem(KANBAN_STORAGE_KEY);
  }

  return initialKanbanTasks;
}

function saveKanbanTasks(tasks) {
  localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(tasks));
}

function Requests({ onAddNotification }) {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState(loadRequests);
  const [activeTab, setActiveTab] = useState('received');
  const [filters, setFilters] = useState({
    status: 'all',
    requesterSector: 'all',
    targetSector: 'all',
    priority: 'all',
    date: '',
  });
  const [formRequest, setFormRequest] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);

  const persistRequests = (nextRequests) => {
    setRequests(nextRequests);
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(nextRequests));
  };

  const receivedRequests = useMemo(() => getReceivedRequests(requests, currentUser), [requests, currentUser]);
  const sentRequests = useMemo(() => getSentRequests(requests, currentUser), [requests, currentUser]);

  const tabRequests = useMemo(() => {
    if (activeTab === 'received') return receivedRequests;
    if (activeTab === 'sent') return sentRequests;
    return requests;
  }, [activeTab, receivedRequests, requests, sentRequests]);

  const visibleRequests = useMemo(() => filterRequests(tabRequests, filters), [filters, tabRequests]);

  const stats = useMemo(
    () => ({
      receivedToday: getTodayReceivedRequests(requests, currentUser).length,
      pendingApproval: getPendingApprovalRequests(requests, currentUser).length,
      approved: receivedRequests.filter((request) => request.requestStatus === requestStatusIds.approved).length,
      rejected: receivedRequests.filter((request) => request.requestStatus === requestStatusIds.rejected).length,
      sentByMe: sentRequests.length,
    }),
    [receivedRequests, requests, sentRequests, currentUser],
  );

  const counts = {
    received: receivedRequests.length,
    sent: sentRequests.length,
    all: requests.length,
  };

  const handleCreateRequest = (values) => {
    const nextRequest = createRequest(values, currentUser);
    persistRequests([nextRequest, ...requests]);
    onAddNotification?.(buildRequestCreatedNotification(nextRequest));
    setIsFormOpen(false);
  };

  const handleEditRequest = (values) => {
    persistRequests(updateRequest(requests, formRequest.id, values));
    setIsFormOpen(false);
    setFormRequest(null);
  };

  const handleApproveRequest = (request) => {
    if (request.generatedTaskId) return;

    const currentKanbanTasks = loadKanbanTasks();
    const existingTask = currentKanbanTasks.find((task) => task.sourceRequestId === request.id);
    const generatedTask = existingTask ?? createKanbanTaskFromRequest(request);
    const nextKanbanTasks = existingTask ? currentKanbanTasks : [...currentKanbanTasks, generatedTask];
    const updatedRequests = approveRequest(requests, request.id, generatedTask.id);
    const updatedRequest = updatedRequests.find((item) => item.id === request.id);

    saveKanbanTasks(nextKanbanTasks);
    persistRequests(updatedRequests);
    onAddNotification?.(buildRequestApprovedNotification(updatedRequest));
  };

  const handleRejectRequest = (request, reason) => {
    const updatedRequests = rejectRequest(requests, request.id, reason);
    const updatedRequest = updatedRequests.find((item) => item.id === request.id);
    persistRequests(updatedRequests);
    setRejectingRequest(null);
    onAddNotification?.(buildRequestRejectedNotification(updatedRequest));
  };

  const handleCancelRequest = (requestId) => {
    const canCancel = window.confirm('Deseja cancelar esta solicitacao?');
    if (!canCancel) return;
    persistRequests(cancelRequest(requests, requestId));
  };

  return (
    <div className="page-stack">
      <section className="page-heading requests-heading">
        <div>
          <p className="eyebrow">Solicitacoes</p>
          <h2>Gerencie demandas entre setores da empresa</h2>
          <span className="current-user-chip">
            Usuario atual: {currentUser.name} - {currentUser.sector}
          </span>
        </div>
        <button type="button" className="primary-button large" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} aria-hidden="true" />
          Nova solicitacao
        </button>
      </section>

      <RequestStats stats={stats} />

      <section className="requests-panel">
        <div className="requests-toolbar">
          <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
          <RequestFilters filters={filters} onChange={setFilters} />
        </div>

        <RequestTable
          requests={visibleRequests}
          currentUser={currentUser}
          activeTab={activeTab}
          onView={setDetailRequest}
          onEdit={(request) => {
            setFormRequest(request);
            setIsFormOpen(true);
          }}
          onApprove={handleApproveRequest}
          onReject={setRejectingRequest}
          onCancel={handleCancelRequest}
        />
      </section>

      {isFormOpen ? (
        <RequestForm
          currentUser={currentUser}
          request={formRequest}
          onClose={() => {
            setIsFormOpen(false);
            setFormRequest(null);
          }}
          onSubmit={formRequest ? handleEditRequest : handleCreateRequest}
        />
      ) : null}

      <RequestRejectModal
        request={rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleRejectRequest}
      />

      <RequestModal request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
}

export default Requests;
