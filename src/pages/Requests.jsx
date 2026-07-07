import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import RequestFilters from '../components/requests/RequestFilters';
import RequestForm from '../components/requests/RequestForm';
import RequestModal from '../components/requests/RequestModal';
import RequestStats from '../components/requests/RequestStats';
import RequestTable from '../components/requests/RequestTable';
import RequestTabs from '../components/requests/RequestTabs';
import { useAuth } from '../contexts/AuthContext';
import { initialRequests, REQUESTS_STORAGE_KEY } from '../data/requestsData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  createRemoteRequest,
  fetchRemoteRequests,
  subscribeToRequests,
  updateRemoteRequest,
  updateRemoteRequestStatus,
} from '../services/requestsService';
import {
  buildRequestCompletedNotification,
  buildRequestCreatedNotification,
  cancelRequest,
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
    if (savedRequests) return JSON.parse(savedRequests);
  } catch {
    localStorage.removeItem(REQUESTS_STORAGE_KEY);
  }

  return initialRequests;
}

function Requests({ onAddNotification }) {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState(loadRequests);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [filters, setFilters] = useState({ status: 'all', sector: 'all', date: '' });
  const [formRequest, setFormRequest] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  const loadRemoteRequests = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteRequests = await fetchRemoteRequests();
      setRequests(remoteRequests);
      setUsingSupabase(true);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemoteRequests();
  }, []);

  useEffect(() => {
    if (!usingSupabase) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
      return undefined;
    }

    const channel = subscribeToRequests(loadRemoteRequests);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requests, usingSupabase]);

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
      pending: getPendingRequests(requests, currentUser).length,
      completed: receivedRequests.filter((request) => request.status === 'completed').length,
      sent: sentRequests.length,
    }),
    [receivedRequests, requests, sentRequests, currentUser],
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

  const handleCreateRequest = async (values) => {
    const nextRequest = usingSupabase
      ? await createRemoteRequest(values, currentUser)
      : createRequest(values, currentUser);

    setRequests((current) => [nextRequest, ...current]);
    if (!usingSupabase) persistRequests([nextRequest, ...requests]);
    onAddNotification?.(buildRequestCreatedNotification(nextRequest));
    setIsFormOpen(false);
  };

  const handleEditRequest = async (values) => {
    if (usingSupabase) {
      const updated = await updateRemoteRequest(formRequest.id, { ...formRequest, ...values }, currentUser);
      setRequests((current) => current.map((request) => (request.id === updated.id ? updated : request)));
    } else {
      persistRequests(updateRequest(requests, formRequest.id, {
        title: values.title.trim(),
        description: values.description.trim(),
        targetSector: values.targetSector,
        responsibleName: values.responsibleName.trim() || null,
        priority: values.priority,
        dueDate: values.dueDate,
      }));
    }

    setIsFormOpen(false);
    setFormRequest(null);
  };

  const handleStatusChange = async (requestId, status) => {
    const changedRequest = requests.find((request) => request.id === requestId);
    if (usingSupabase) {
      const updated = await updateRemoteRequestStatus(requestId, status);
      setRequests((current) => current.map((request) => (request.id === requestId ? updated : request)));
    } else {
      persistRequests(updateRequestStatus(requests, requestId, status));
    }

    if (status === 'completed' && changedRequest?.status !== 'completed') {
      onAddNotification?.(buildRequestCompletedNotification({ ...changedRequest, status }));
    }
  };

  const handleComplete = (requestId) => {
    handleStatusChange(requestId, 'completed');
  };

  const handleCancel = (requestId) => {
    const canCancel = window.confirm('Deseja cancelar esta solicitacao?');
    if (!canCancel) return;

    if (usingSupabase) {
      handleStatusChange(requestId, 'canceled');
      return;
    }
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

      {!usingSupabase ? (
        <div className="members-feedback">Usando solicitacoes locais ate a conexao Supabase estar disponivel.</div>
      ) : null}

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
          onEdit={(request) => {
            setFormRequest(request);
            setIsFormOpen(true);
          }}
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
