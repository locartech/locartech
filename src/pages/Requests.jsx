import { Archive, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
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
  archiveRequestRpc,
  cancelRemoteRequest,
  createRemoteRequest,
  fetchRemoteRequests,
  rejectRequestRpc,
  restoreRequestRpc,
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
  const [view, setView] = useState('active');
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
  const [archivingRequest, setArchivingRequest] = useState(null);
  const [restoringRequest, setRestoringRequest] = useState(null);

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

  const activeRequests = useMemo(() => requests.filter((request) => !request.archived), [requests]);
  const archivedRequests = useMemo(() => requests.filter((request) => request.archived), [requests]);

  const receivedRequests = useMemo(() => getReceivedRequests(activeRequests, currentUser), [activeRequests, currentUser]);
  const sentRequests = useMemo(() => getSentRequests(activeRequests, currentUser), [activeRequests, currentUser]);

  const tabRequests = useMemo(() => {
    if (view === 'archived') return archivedRequests;
    if (activeTab === 'received') return receivedRequests;
    if (activeTab === 'sent') return sentRequests;
    return activeRequests;
  }, [view, activeTab, receivedRequests, activeRequests, sentRequests, archivedRequests]);

  const visibleRequests = useMemo(() => filterRequests(tabRequests, filters), [filters, tabRequests]);

  const stats = useMemo(
    () => ({
      receivedToday: getTodayReceivedRequests(activeRequests, currentUser).length,
      pendingApproval: getPendingApprovalRequests(activeRequests, currentUser).length,
      approved: receivedRequests.filter((request) => request.requestStatus === requestStatusIds.approved).length,
      rejected: receivedRequests.filter((request) => request.requestStatus === requestStatusIds.rejected).length,
      sentByMe: sentRequests.length,
    }),
    [receivedRequests, activeRequests, sentRequests, currentUser],
  );

  const counts = {
    received: receivedRequests.length,
    sent: sentRequests.length,
    all: activeRequests.length,
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

  const handleConfirmArchive = async () => {
    if (!archivingRequest) return;
    try {
      const updated = await archiveRequestRpc(archivingRequest.id);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel arquivar a solicitacao.');
    } finally {
      setArchivingRequest(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoringRequest) return;
    try {
      const updated = await restoreRequestRpc(restoringRequest.id);
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel restaurar a solicitacao.');
    } finally {
      setRestoringRequest(null);
    }
  };

  return (
    <div className="page-stack">
      <div className="view-toolbar-row">
        <div className="kanban-view-tabs" role="tablist" aria-label="Visao das solicitacoes">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'active'}
            className={`kanban-view-tab ${view === 'active' ? 'active' : ''}`}
            onClick={() => setView('active')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            Solicitacoes ativas
            <span className="kanban-view-tab-count">{activeRequests.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'archived'}
            className={`kanban-view-tab ${view === 'archived' ? 'active' : ''}`}
            onClick={() => setView('archived')}
          >
            <Archive size={16} aria-hidden="true" />
            Solicitacoes arquivadas
            <span className="kanban-view-tab-count">{archivedRequests.length}</span>
          </button>
        </div>

        <button type="button" className="primary-button large" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} aria-hidden="true" />
          Nova solicitacao
        </button>
      </div>

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando solicitacoes...</div> : null}

      <section className="requests-panel">
        <div className="requests-toolbar">
          {view === 'active' ? <RequestTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} /> : null}
          <RequestFilters filters={filters} onChange={setFilters} />
        </div>

        {view === 'active' ? <RequestStats stats={stats} /> : null}
        <RequestTable
          requests={visibleRequests}
          currentUser={currentUser}
          activeTab={activeTab}
          view={view}
          onView={setDetailRequest}
          onEdit={(request) => {
            setFormRequest(request);
            setIsFormOpen(true);
          }}
          onApprove={handleApproveRequest}
          onReject={setRejectingRequest}
          onCancel={handleCancelRequest}
          onArchive={setArchivingRequest}
          onRestore={setRestoringRequest}
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

      <ConfirmModal
        open={Boolean(archivingRequest)}
        title="Arquivar solicitacao"
        message="Você realmente deseja arquivar essa solicitação?"
        cancelLabel="Não"
        confirmLabel="Sim, arquivar"
        onCancel={() => setArchivingRequest(null)}
        onConfirm={handleConfirmArchive}
      />

      <ConfirmModal
        open={Boolean(restoringRequest)}
        title="Restaurar solicitacao"
        message="Deseja restaurar esta solicitação para a lista de ativas?"
        cancelLabel="Cancelar"
        confirmLabel="Sim, restaurar"
        tone="primary"
        onCancel={() => setRestoringRequest(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}

export default Requests;
