import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import RequestFilters from '../components/requests/RequestFilters';
import RequestForm from '../components/requests/RequestForm';
import RequestModal from '../components/requests/RequestModal';
import RequestRejectModal from '../components/requests/RequestRejectModal';
import RequestStats from '../components/requests/RequestStats';
import RequestTable from '../components/requests/RequestTable';
import RequestTabs from '../components/requests/RequestTabs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { requestStatusIds } from '../data/requestsData';
import {
  approveRequestRpc,
  cancelRemoteRequest,
  createRemoteRequest,
  fetchRemoteRequests,
  rejectRequestRpc,
  subscribeToRequests,
  updateRemoteRequest,
} from '../services/requestsService';
import {
  filterRequests,
  getPendingApprovalRequests,
  getReceivedRequests,
  getSentRequests,
  getTodayReceivedRequests,
} from '../utils/requestUtils';

function Requests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const loadRequests = async () => {
    try {
      const remoteRequests = await fetchRemoteRequests();
      setRequests(remoteRequests);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel carregar as solicitacoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    const channel = subscribeToRequests(loadRequests);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleCreateRequest = async (values) => {
    try {
      const created = await createRemoteRequest(values, currentUser);
      setRequests((current) => [created, ...current]);
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel criar a solicitacao.');
    }
  };

  const handleEditRequest = async (values) => {
    try {
      const updated = await updateRemoteRequest(formRequest.id, values);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setIsFormOpen(false);
      setFormRequest(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel salvar a solicitacao.');
    }
  };

  const handleApproveRequest = async (request) => {
    if (request.generatedTaskId) return;

    try {
      const updated = await approveRequestRpc(request.id);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel aprovar a solicitacao.');
    }
  };

  const handleRejectRequest = async (request, reason) => {
    try {
      const updated = await rejectRequestRpc(request.id, reason);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setRejectingRequest(null);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel recusar a solicitacao.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    const canCancel = window.confirm('Deseja cancelar esta solicitacao?');
    if (!canCancel) return;

    try {
      const updated = await cancelRemoteRequest(requestId);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel cancelar a solicitacao.');
    }
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

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando solicitacoes...</div> : null}

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
