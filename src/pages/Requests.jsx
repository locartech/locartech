import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import RequestFilters from '../components/requests/RequestFilters';
import RequestForm from '../components/requests/RequestForm';
import RequestModal from '../components/requests/RequestModal';
import RequestStats from '../components/requests/RequestStats';
import RequestTable from '../components/requests/RequestTable';
import RequestTabs from '../components/requests/RequestTabs';
import { currentUser, initialRequests, REQUESTS_STORAGE_KEY } from '../data/requestsData';
import {
  buildRequestCompletedNotification,
  buildRequestCreatedNotification,
  cancelRequest,
  completeRequest,
  createRequest,
  filterRequests,
  getPendingRequests,
  getReceivedRequests,
  getSentRequests,
  getTodayReceivedRequests,
  updateRequest,
  updateRequestStatus,
} from '../utils/requestUtils';

function loadRequests() {
  try {
    const savedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (savedRequests) {
      return JSON.parse(savedRequests);
    }
  } catch {
    localStorage.removeItem(REQUESTS_STORAGE_KEY);
  }

  return initialRequests;
}

function Requests({ onAddNotification }) {
  const [requests, setRequests] = useState(loadRequests);
  const [activeTab, setActiveTab] = useState('received');
  const [filters, setFilters] = useState({ status: 'all', sector: 'all', date: '' });
  const [formRequest, setFormRequest] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const receivedRequests = useMemo(() => getReceivedRequests(requests, currentUser), [requests]);
  const sentRequests = useMemo(() => getSentRequests(requests, currentUser), [requests]);

  const tabRequests = useMemo(() => {
    if (activeTab === 'received') return receivedRequests;
    if (activeTab === 'sent') return sentRequests;
    return requests;
  }, [activeTab, receivedRequests, requests, sentRequests]);

  const visibleRequests = useMemo(() => filterRequests(tabRequests, filters), [filters, tabRequests]);

  const stats = useMemo(
    () => ({
      receivedToday: getTodayReceivedRequests(requests, currentUser).length,
      pending: getPendingRequests(requests, currentUser).length,
      completed: receivedRequests.filter((request) => request.status === 'completed').length,
      sent: sentRequests.length,
    }),
    [receivedRequests, requests, sentRequests],
  );

  const counts = {
    received: receivedRequests.length,
    sent: sentRequests.length,
    all: requests.length,
  };

  const persistRequests = (nextRequests) => {
    setRequests(nextRequests);
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(nextRequests));
  };

  const handleCreateRequest = (values) => {
    const nextRequest = createRequest(values, currentUser);
    persistRequests([nextRequest, ...requests]);
    onAddNotification?.(buildRequestCreatedNotification(nextRequest));
    setIsFormOpen(false);
  };

  const handleEditRequest = (values) => {
    const updatedRequests = updateRequest(requests, formRequest.id, {
      title: values.title.trim(),
      description: values.description.trim(),
      targetSector: values.targetSector,
      responsibleName: values.responsibleName.trim() || null,
      priority: values.priority,
      dueDate: values.dueDate,
    });

    persistRequests(updatedRequests);
    setIsFormOpen(false);
    setFormRequest(null);
  };

  const handleStatusChange = (requestId, status) => {
    const changedRequest = requests.find((request) => request.id === requestId);
    persistRequests(updateRequestStatus(requests, requestId, status));

    if (status === 'completed' && changedRequest?.status !== 'completed') {
      onAddNotification?.(buildRequestCompletedNotification({ ...changedRequest, status }));
    }
  };

  const handleComplete = (requestId) => {
    const changedRequest = requests.find((request) => request.id === requestId);
    persistRequests(completeRequest(requests, requestId));

    if (changedRequest?.status !== 'completed') {
      onAddNotification?.(buildRequestCompletedNotification({ ...changedRequest, status: 'completed' }));
    }
  };

  const handleCancel = (requestId) => {
    const canCancel = window.confirm('Deseja cancelar esta solicitação?');
    if (canCancel) {
      persistRequests(cancelRequest(requests, requestId));
    }
  };

  const handleOpenEdit = (request) => {
    setFormRequest(request);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setFormRequest(null);
    setIsFormOpen(true);
  };

  return (
    <div className="page-stack">
      <section className="page-heading requests-heading">
        <div>
          <p className="eyebrow">Solicitações</p>
          <h2>Gerencie demandas entre setores da empresa</h2>
          <span className="current-user-chip">
            Usuário atual: {currentUser.name} · {currentUser.sector}
          </span>
        </div>
        <button type="button" className="primary-button large" onClick={handleOpenCreate}>
          <Plus size={18} aria-hidden="true" />
          Nova solicitação
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
          onStatusChange={handleStatusChange}
          onView={setDetailRequest}
          onEdit={handleOpenEdit}
          onComplete={handleComplete}
          onCancel={handleCancel}
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

      <RequestModal request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
}

export default Requests;
