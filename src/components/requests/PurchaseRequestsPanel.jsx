import { Archive, FileDown, LayoutGrid, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { createNotification } from '../../services/notificationsService';
import {
  archiveRemotePurchaseRequest,
  createRemotePurchaseRequest,
  fetchRemotePurchaseRequests,
  restoreRemotePurchaseRequest,
  subscribeToPurchaseRequests,
  updateRemotePurchaseRequestStatus,
} from '../../services/purchaseRequestsService';
import { fetchProfiles } from '../../services/profilesService';
import { deleteArchivedRequestHistory } from '../../services/requestsService';
import {
  archiveLocalPurchaseRequest,
  createLocalPurchaseRequest,
  filterPurchaseRequests,
  getPurchaseStats,
  loadPurchaseRequests,
  removePurchaseStatusOverride,
  restoreLocalPurchaseRequest,
  savePurchaseRequests,
  savePurchaseStatusOverride,
  updateLocalPurchaseStatus,
} from '../../utils/purchaseRequestUtils';
import { downloadExcelReport } from '../../utils/excelReportUtils';
import {
  archivedDateAccessor,
  buildPurchaseReportRows,
  makeReportFileName,
  purchaseReportColumns,
} from '../../utils/reportDataUtils';
import { purchaseStatuses } from '../../data/purchaseRequestsData';
import { canManageSector } from '../../utils/permissions';
import ConfirmModal from '../common/ConfirmModal';
import ReportGenerationModal from '../common/ReportGenerationModal';
import PurchaseRequestFilters from './PurchaseRequestFilters';
import PurchaseRequestFormModal from './PurchaseRequestFormModal';
import PurchaseRequestStats from './PurchaseRequestStats';
import PurchaseRequestTable from './PurchaseRequestTable';

function getStatusLabel(statusId) {
  return purchaseStatuses.find((status) => status.id === statusId)?.label ?? statusId;
}

async function notifyComprasTeam(request) {
  try {
    const profiles = await fetchProfiles();
    const purchaseMembers = profiles.filter(
      (profile) => profile.status === 'Ativo' && profile.sector === 'Compras',
    );

    await Promise.all(
      purchaseMembers.map((member) =>
        createNotification({
          userId: member.id,
          title: 'Nova compra solicitada',
          message: `${request.requesterName} solicitou a compra de ${request.item}.`,
          category: 'Compras solicitadas',
          targetSectorName: 'Compras',
          targetUserName: member.name,
        }),
      ),
    );
  } catch {
    // A compra nao deve falhar se apenas a notificacao estiver indisponivel.
  }
}

async function notifyRequester(request, status) {
  if (!request.requesterId) return;

  try {
    await createNotification({
      userId: request.requesterId,
      title: 'Compra solicitada atualizada',
      message: `A solicitacao de compra ${request.item} mudou para ${getStatusLabel(status)}.`,
      category: 'Compras solicitadas',
      targetSectorName: 'Compras',
      targetUserName: request.requesterName,
    });
  } catch {
    // A atualizacao de status nao deve falhar se apenas a notificacao estiver indisponivel.
  }
}

function PurchaseRequestsPanel({ currentUser, onCountChange, onAddNotification }) {
  const [requests, setRequests] = useState(loadPurchaseRequests);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState('active');
  const [filters, setFilters] = useState({ query: '', status: 'all', priority: 'all' });
  const [dueDateSort, setDueDateSort] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [archivingRequest, setArchivingRequest] = useState(null);
  const [restoringRequest, setRestoringRequest] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cleanupIds, setCleanupIds] = useState([]);
  const [cleanupStep, setCleanupStep] = useState(0);
  const [permissionNotice, setPermissionNotice] = useState('');
  const permissionNoticeTimeout = useRef(null);

  const notifyNoPermission = () => {
    setPermissionNotice('Você não tem permissão para isso.');
    window.clearTimeout(permissionNoticeTimeout.current);
    permissionNoticeTimeout.current = window.setTimeout(() => setPermissionNotice(''), 2500);
  };

  const loadRemote = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const remoteRequests = await fetchRemotePurchaseRequests();
      setRequests(remoteRequests);
      setUsingSupabase(true);
      onCountChange?.(remoteRequests.filter((request) => !request.archived).length);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemote();
  }, []);

  useEffect(() => {
    onCountChange?.(requests.filter((request) => !request.archived).length);

    if (!usingSupabase) {
      savePurchaseRequests(requests);
      return undefined;
    }

    const channel = subscribeToPurchaseRequests(loadRemote);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requests, usingSupabase]);

  const activeRequests = useMemo(() => requests.filter((request) => !request.archived), [requests]);
  const archivedRequests = useMemo(() => requests.filter((request) => request.archived), [requests]);
  const baseRequests = view === 'archived' ? archivedRequests : activeRequests;

  const filteredRequests = useMemo(() => filterPurchaseRequests(baseRequests, filters), [baseRequests, filters]);

  const visibleRequests = useMemo(() => {
    if (!dueDateSort) return filteredRequests;

    return [...filteredRequests].sort((first, second) => {
      const firstTime = first.dueDate ? new Date(first.dueDate).getTime() : null;
      const secondTime = second.dueDate ? new Date(second.dueDate).getTime() : null;

      if (firstTime === null && secondTime === null) return 0;
      if (firstTime === null) return 1;
      if (secondTime === null) return -1;

      return dueDateSort === 'asc' ? firstTime - secondTime : secondTime - firstTime;
    });
  }, [filteredRequests, dueDateSort]);

  const handleToggleDueDateSort = () => {
    setDueDateSort((current) => {
      if (current === 'asc') return 'desc';
      if (current === 'desc') return null;
      return 'asc';
    });
  };
  const stats = useMemo(() => getPurchaseStats(activeRequests), [activeRequests]);
  const canManage = canManageSector(currentUser, 'Compras');

  const handleCreate = async (values) => {
    setFeedback('');
    setError('');

    try {
      if (usingSupabase) {
        const created = await createRemotePurchaseRequest(values, currentUser);
        setRequests((current) => [created, ...current]);
        setFormOpen(false);
        setFeedback('Solicitacao de compra criada com sucesso.');
        await notifyComprasTeam(created);
        return;
      }

      const created = createLocalPurchaseRequest(values, currentUser);
      setRequests((current) => [created, ...current]);
      onAddNotification?.({
        id: `notification-${Date.now()}-${created.id}`,
        createdAt: new Date().toISOString(),
        title: 'Nova compra solicitada',
        message: `${created.requesterName} solicitou a compra de ${created.item}.`,
        category: 'Compras solicitadas',
        targetSectorName: 'Compras',
        read: false,
      });

      setFormOpen(false);
      setFeedback('Solicitacao de compra criada com sucesso.');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel criar a solicitacao de compra.');
    }
  };

  const handleStatusChange = async (request, status) => {
    if (!canManage) return notifyNoPermission();
    setFeedback('');
    setError('');
    savePurchaseStatusOverride(request.id, status);
    setRequests((current) =>
      current.map((item) => (item.id === request.id ? { ...item, status } : item)),
    );

    try {
      if (usingSupabase) {
        const updated = await updateRemotePurchaseRequestStatus(request.id, status);
        const updatedRequest = updated ?? { ...request, status };
        setRequests((current) => current.map((item) => (item.id === request.id ? updatedRequest : item)));
        setFeedback('Status atualizado com sucesso.');
        await notifyRequester(updatedRequest, status);
        return;
      }

      const nextRequests = updateLocalPurchaseStatus(requests, request.id, status);
      const updated = nextRequests.find((item) => item.id === request.id);
      setRequests(nextRequests);
      onAddNotification?.({
        id: `notification-${Date.now()}-${request.id}`,
        createdAt: new Date().toISOString(),
        title: 'Compra solicitada atualizada',
        message: `A solicitacao de compra ${request.item} mudou para ${getStatusLabel(status)}.`,
        category: 'Compras solicitadas',
        targetSectorName: 'Compras',
        targetUserName: updated?.requesterName,
        read: false,
      });

      setFeedback('Status atualizado com sucesso.');
    } catch (err) {
      removePurchaseStatusOverride(request.id);
      setRequests((current) =>
        current.map((item) => (item.id === request.id ? { ...item, status: request.status } : item)),
      );
      setError(err.message ?? 'Nao foi possivel atualizar o status.');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingRequest) return;
    if (!canManage) {
      setArchivingRequest(null);
      return notifyNoPermission();
    }
    setFeedback('');
    setError('');

    try {
      if (usingSupabase) {
        const updated = await archiveRemotePurchaseRequest(archivingRequest.id);
        setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        setRequests((current) => archiveLocalPurchaseRequest(current, archivingRequest.id, currentUser));
      }
      setFeedback('Solicitacao arquivada com sucesso.');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel arquivar a solicitacao.');
    } finally {
      setArchivingRequest(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoringRequest) return;
    if (!canManage) {
      setRestoringRequest(null);
      return notifyNoPermission();
    }
    setFeedback('');
    setError('');

    try {
      if (usingSupabase) {
        const updated = await restoreRemotePurchaseRequest(restoringRequest.id);
        setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        setRequests((current) => restoreLocalPurchaseRequest(current, restoringRequest.id));
      }
      setFeedback('Solicitacao restaurada com sucesso.');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel restaurar a solicitacao.');
    } finally {
      setRestoringRequest(null);
    }
  };

  const handleGenerateReport = async (draft, selectedRequests) => {
    if (!canManage) return notifyNoPermission();
    if (generatingReport) return;
    setGeneratingReport(true);
    setFeedback('');
    setError('');

    try {
      await downloadExcelReport({
        fileName: makeReportFileName(draft.name),
        sheetName: 'Compras arquivadas',
        tableName: 'ComprasArquivadas',
        title: draft.name,
        columns: purchaseReportColumns,
        rows: buildPurchaseReportRows(selectedRequests),
      });
      setReportOpen(false);
      setFeedback(`Relatorio gerado com ${selectedRequests.length} solicitacao(oes) de compra.`);
      if (currentUser?.accountType === 'admin') {
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
      if (usingSupabase) await deleteArchivedRequestHistory(cleanupIds);
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
    <div className="purchase-panel-stack">
      <div className="purchase-toolbar-row">
        <div className="kanban-view-tabs" role="tablist" aria-label="Visao das compras solicitadas">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'active'}
            className={`kanban-view-tab ${view === 'active' ? 'active' : ''}`}
            onClick={() => setView('active')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
            Ativas
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
            Arquivadas
            <span className="kanban-view-tab-count">{archivedRequests.length}</span>
          </button>
        </div>

        <div className="purchase-hero-actions">
          {view === 'archived' ? (
            <button
              type="button"
              className="ghost-button compact"
              onClick={() => (canManage ? setReportOpen(true) : notifyNoPermission())}
              disabled={generatingReport || archivedRequests.length === 0}
            >
              <FileDown size={14} aria-hidden="true" />
              {generatingReport ? 'Gerando...' : 'Gerar relatorio'}
            </button>
          ) : null}
          <button
            type="button"
            className="primary-button large"
            onClick={() => {
              setError('');
              setFormOpen(true);
            }}
          >
            <Plus size={18} aria-hidden="true" />
            Nova compra solicitada
          </button>
        </div>
      </div>

      {permissionNotice ? <p className="tiny-permission-notice">{permissionNotice}</p> : null}

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {error ? <div className="members-feedback error">{error}</div> : null}
      {!usingSupabase ? (
        <div className="members-feedback">Usando dados locais ate a conexao Supabase estar disponivel.</div>
      ) : null}

      {view === 'active' ? <PurchaseRequestStats stats={stats} /> : null}

      <section className="requests-panel">
        <div className="requests-toolbar">
          <PurchaseRequestFilters filters={filters} onChange={setFilters} />
        </div>
        <PurchaseRequestTable
          requests={visibleRequests}
          canManage={canManage}
          view={view}
          restricted={!canManage}
          onBlockedAction={notifyNoPermission}
          onStatusChange={handleStatusChange}
          onArchive={setArchivingRequest}
          onRestore={setRestoringRequest}
          dueDateSort={dueDateSort}
          onToggleDueDateSort={handleToggleDueDateSort}
        />
      </section>

      {formOpen ? (
        <PurchaseRequestFormModal
          currentUser={currentUser}
          submitError={error}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}

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
        title="Gerar relatorio de compras arquivadas"
        defaultName="Relatorio de compras solicitadas arquivadas"
        items={archivedRequests}
        dateAccessor={archivedDateAccessor}
        entityLabel="solicitacao(oes) de compra arquivada(s)"
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

export default PurchaseRequestsPanel;
