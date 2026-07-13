import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { createNotification } from '../../services/notificationsService';
import {
  createRemotePurchaseRequest,
  fetchRemotePurchaseRequests,
  subscribeToPurchaseRequests,
  updateRemotePurchaseRequestStatus,
} from '../../services/purchaseRequestsService';
import { fetchProfiles } from '../../services/profilesService';
import {
  createLocalPurchaseRequest,
  filterPurchaseRequests,
  getPurchaseStats,
  loadPurchaseRequests,
  removePurchaseStatusOverride,
  savePurchaseRequests,
  savePurchaseStatusOverride,
  updateLocalPurchaseStatus,
} from '../../utils/purchaseRequestUtils';
import { purchaseStatuses } from '../../data/purchaseRequestsData';
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
  const [filters, setFilters] = useState({ query: '', status: 'all', priority: 'all' });
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const loadRemote = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const remoteRequests = await fetchRemotePurchaseRequests();
      setRequests(remoteRequests);
      setUsingSupabase(true);
      onCountChange?.(remoteRequests.length);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemote();
  }, []);

  useEffect(() => {
    onCountChange?.(requests.length);

    if (!usingSupabase) {
      savePurchaseRequests(requests);
      return undefined;
    }

    const channel = subscribeToPurchaseRequests(loadRemote);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [requests, usingSupabase]);

  const visibleRequests = useMemo(() => filterPurchaseRequests(requests, filters), [requests, filters]);
  const stats = useMemo(() => getPurchaseStats(requests), [requests]);
  const canManage = currentUser?.sector === 'Compras' || currentUser?.accountType === 'admin';

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

  return (
    <div className="purchase-panel-stack">
      <section className="purchase-hero">
        <div>
          <p className="eyebrow">Compras solicitadas</p>
          <h2>Pedidos da obra para Compras</h2>
          <p>Centralize itens solicitados pela operacao e acompanhe prioridade, prazo e status de compra.</p>
        </div>
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
      </section>

      {feedback ? <div className="members-feedback">{feedback}</div> : null}
      {error ? <div className="members-feedback error">{error}</div> : null}
      {!usingSupabase ? (
        <div className="members-feedback">Usando dados locais ate a conexao Supabase estar disponivel.</div>
      ) : null}

      <PurchaseRequestStats stats={stats} />

      <section className="requests-panel">
        <div className="requests-toolbar">
          <PurchaseRequestFilters filters={filters} onChange={setFilters} />
        </div>
        <PurchaseRequestTable
          requests={visibleRequests}
          canManage={canManage}
          onStatusChange={handleStatusChange}
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
    </div>
  );
}

export default PurchaseRequestsPanel;
