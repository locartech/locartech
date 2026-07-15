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
import {
  createPurchaseReport,
  fetchPurchaseReports,
  registerPurchaseReportDriveLink,
  subscribeToPurchaseReports,
} from '../../services/purchaseReportsService';
import { fetchProfiles } from '../../services/profilesService';
import {
  archiveLocalPurchaseRequest,
  buildPurchaseRequestsCsv,
  buildPurchaseRequestsReportFileName,
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
import { downloadCsvFile } from '../../utils/archivedReportUtils';
import { purchaseStatuses } from '../../data/purchaseRequestsData';
import { canManageSector } from '../../utils/permissions';
import ConfirmModal from '../common/ConfirmModal';
import RegisterDriveLinkModal from '../kanban/RegisterDriveLinkModal';
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
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [archivingRequest, setArchivingRequest] = useState(null);
  const [restoringRequest, setRestoringRequest] = useState(null);
  const [reports, setReports] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [registeringReport, setRegisteringReport] = useState(null);
  const [permissionNotice, setPermissionNotice] = useState('');
  const permissionNoticeTimeout = useRef(null);

  const notifyNoPermission = () => {
    setPermissionNotice('Você não tem permissão para isso.');
    window.clearTimeout(permissionNoticeTimeout.current);
    permissionNoticeTimeout.current = window.setTimeout(() => setPermissionNotice(''), 2500);
  };

  const loadReports = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const remoteReports = await fetchPurchaseReports();
      setReports(remoteReports);
    } catch {
      // Reports stay at their last known value if the fetch fails.
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const channel = subscribeToPurchaseReports(loadReports);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingReport = useMemo(() => reports.find((report) => report.status === 'Pendente de Drive'), [reports]);

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

  const visibleRequests = useMemo(() => filterPurchaseRequests(baseRequests, filters), [baseRequests, filters]);
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

  const handleGenerateReport = async () => {
    if (!canManage) return notifyNoPermission();
    if (generatingReport) return;

    // A pending report already covers the last export - reopen it instead of creating
    // an orphaned duplicate that would never get its Drive link registered.
    if (pendingReport) {
      setRegisteringReport(pendingReport);
      return;
    }

    if (visibleRequests.length === 0) return;

    if (!usingSupabase) {
      const csv = buildPurchaseRequestsCsv(visibleRequests);
      downloadCsvFile(csv, buildPurchaseRequestsReportFileName());
      setFeedback('Relatorio gerado e baixado com sucesso.');
      return;
    }

    setGeneratingReport(true);
    setFeedback('');
    setError('');

    try {
      const csv = buildPurchaseRequestsCsv(visibleRequests);
      downloadCsvFile(csv, buildPurchaseRequestsReportFileName());

      const todayLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
      const today = new Date().toISOString().slice(0, 10);

      const created = await createPurchaseReport(
        {
          name: `Relatório de compras solicitadas - ${todayLabel}`,
          periodStart: today,
          periodEnd: today,
          totalExported: visibleRequests.length,
          exportedRequestIds: visibleRequests.map((request) => request.id),
        },
        currentUser,
      );

      setReports((current) => [created, ...current]);
      setRegisteringReport(created);
      setFeedback('Relatório gerado e baixado. Salve o arquivo no Drive da empresa e registre o link para concluir.');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel gerar o relatorio.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSubmitDriveLink = async (reportId, values) => {
    if (!canManage) return notifyNoPermission();
    try {
      const updated = await registerPurchaseReportDriveLink(reportId, values);
      setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));
      setRegisteringReport(null);
      setFeedback('Link do Drive registrado com sucesso.');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel registrar o link do Drive.');
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
          <button
            type="button"
            className="ghost-button compact"
            onClick={handleGenerateReport}
            disabled={canManage && (generatingReport || (visibleRequests.length === 0 && !pendingReport))}
          >
            <FileDown size={14} aria-hidden="true" />
            {generatingReport ? 'Gerando...' : 'Gerar relatorio'}
          </button>
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

      <RegisterDriveLinkModal
        report={registeringReport}
        onClose={() => setRegisteringReport(null)}
        onSubmit={handleSubmitDriveLink}
      />
    </div>
  );
}

export default PurchaseRequestsPanel;
