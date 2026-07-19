import { Archive, FileDown, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import ReportGenerationModal from '../components/common/ReportGenerationModal';
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
  deleteArchivedRequestHistory,
  fetchRemoteRequests,
  rejectRequestRpc,
  restoreRequestRpc,
  subscribeToRequests,
  updateRemoteRequest,
} from '../services/requestsService';
import { downloadExcelReport } from '../utils/excelReportUtils';
import {
  archivedDateAccessor,
  buildRequestReportRows,
  makeReportFileName,
  requestReportColumns,
} from '../utils/reportDataUtils';
import {
  filterRequests,
  getPendingApprovalRequests,
  getReceivedRequests,
  getSentRequests,
  getTodayReceivedRequests,
} from '../utils/requestUtils';

function Requests() {
  const { currentUser, isAdmin } = useAuth();
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
  const [reportOpen, setReportOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [cleanupIds, setCleanupIds] = useState([]);
  const [cleanupStep, setCleanupStep] = useState(0);
  const [feedback, setFeedback] = useState('');

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

  const handleGenerateReport = async (draft, selectedRequests) => {
    if (generatingReport) return;
    setGeneratingReport(true);
    setError('');
    try {
      await downloadExcelReport({
        fileName: makeReportFileName(draft.name),
        sheetName: 'Solicitacoes arquivadas',
        tableName: 'SolicitacoesArquivadas',
        title: draft.name,
        columns: requestReportColumns,
        rows: buildRequestReportRows(selectedRequests),
      });
      setReportOpen(false);
      setFeedback(`Relatorio gerado com ${selectedRequests.length} solicitacao(oes).`);
      if (isAdmin) {
        setCleanupIds(selectedRequests.map((request) => request.id));
        setCleanupStep(1);
      }
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel gerar o relatorio.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCleanupHistory = async () => {
    try {
      await deleteArchivedRequestHistory(cleanupIds);
      setRequests((current) => current.filter((request) => !cleanupIds.includes(request.id)));
      setFeedback(`${cleanupIds.length} registro(s) arquivado(s) excluido(s) do site.`);
      setCleanupIds([]);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel excluir o historico.');
    } finally {
      setCleanupStep(0);
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

        <div className="purchase-hero-actions">
          {view === 'archived' ? (
            <button type="button" className="ghost-button compact" onClick={() => setReportOpen(true)} disabled={generatingReport || archivedRequests.length === 0}>
              <FileDown size={16} aria-hidden="true" />
              Gerar relatorio
            </button>
          ) : null}
          <button type="button" className="primary-button large" onClick={() => setIsFormOpen(true)}>
            <Plus size={18} aria-hidden="true" />
            Nova solicitacao
          </button>
        </div>
      </div>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
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

      <ReportGenerationModal
        open={reportOpen}
        title="Gerar relatorio de solicitacoes arquivadas"
        defaultName="Relatorio de solicitacoes arquivadas"
        items={archivedRequests}
        dateAccessor={archivedDateAccessor}
        entityLabel="solicitacao(oes) arquivada(s)"
        onClose={() => setReportOpen(false)}
        onGenerate={handleGenerateReport}
      />
      <ConfirmModal
        open={cleanupStep === 1}
        title="Excluir dados do relatorio"
        message={`Deseja excluir do site os ${cleanupIds.length} registro(s) incluidos no relatorio que acabou de ser gerado?`}
        cancelLabel="Nao"
        confirmLabel="Sim"
        onCancel={() => setCleanupStep(0)}
        onConfirm={() => setCleanupStep(2)}
      />
      <ConfirmModal
        open={cleanupStep === 2}
        title="Confirmar exclusao permanente"
        message="Tem certeza que deseja excluir este historico do site? Esta acao nao pode ser desfeita."
        cancelLabel="Cancelar"
        confirmLabel="Sim, excluir historico"
        onCancel={() => setCleanupStep(0)}
        onConfirm={handleCleanupHistory}
      />
    </div>
  );
}

export default Requests;
