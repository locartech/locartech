import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchKanbanTasks, subscribeToKanban } from '../services/kanbanService';
import { fetchRemoteRequests, subscribeToRequests } from '../services/requestsService';

function getDaysUntil(dateValue) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const targetDate = new Date(`${dateValue}T12:00:00`);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

function Dashboard() {
  const { currentUser, isAdmin } = useAuth();
  const [stageTasks, setStageTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadIndicators = () => Promise.all([fetchKanbanTasks(), fetchRemoteRequests()])
      .then(([tasks, requestList]) => {
        if (!mounted) return;
        setStageTasks(tasks);
        setRequests(requestList);
        setError('');
      })
      .catch((err) => {
        if (mounted) setError(err.message ?? 'Nao foi possivel carregar os indicadores.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    loadIndicators();

    const kanbanChannel = subscribeToKanban(loadIndicators);
    const requestsChannel = subscribeToRequests(loadIndicators);

    return () => {
      mounted = false;
      supabase.removeChannel(kanbanChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [currentUser?.id]);

  const normalizedUserName = currentUser?.name?.trim().toLocaleLowerCase('pt-BR');
  const activeTasks = stageTasks.filter((task) => !task.archived && task.status !== 'canceled');
  const scopedTasks = isAdmin
    ? activeTasks
    : activeTasks.filter(
        (task) =>
          task.responsibleId === currentUser?.id ||
          task.assignee?.trim().toLocaleLowerCase('pt-BR') === normalizedUserName,
      );
  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter((task) => task.status === 'done').length;
  const todoTasks = scopedTasks.filter((task) => task.status === 'todo').length;
  const doingTasks = scopedTasks.filter((task) => task.status === 'doing').length;
  const dueSoonTasks = scopedTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.date);
    return !['done', 'canceled'].includes(task.status) && daysUntil >= 0 && daysUntil <= 7;
  }).length;
  const overdueTasks = scopedTasks.filter(
    (task) => !['done', 'canceled'].includes(task.status) && getDaysUntil(task.date) < 0,
  ).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentSector = currentUser?.sector ?? 'Compras';
  const activeRequests = requests.filter((request) => !request.archived);
  const receivedRequests = activeRequests.filter((request) => isAdmin || request.targetSector === currentSector);
  const sentRequests = requests.filter(
    (request) =>
      !request.archived &&
      (isAdmin || request.requesterUserId === currentUser?.id || request.requesterName === currentUser?.name),
  );
  const relevantRequests = activeRequests.filter(
    (request) =>
      isAdmin ||
      request.targetSector === currentSector ||
      request.requesterUserId === currentUser?.id ||
      request.requesterName === currentUser?.name,
  );
  const urgentRequests = relevantRequests.filter((request) => request.priority === 'urgent').length;
  const pendingRequests = relevantRequests.filter((request) => request.requestStatus === 'pending_approval').length;

  return (
    <div className="page-stack">
      <section className="dashboard-summary">
        <div>
          <p className="eyebrow">Indicadores executivos</p>
          <h2>Resumo operacional</h2>
        </div>
        <div className="dashboard-score">
          <span>{completionRate}%</span>
          <small>{isAdmin ? 'conclusao geral' : 'conclusao das suas tarefas'}</small>
        </div>
      </section>

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando indicadores...</div> : null}

      <section className="dashboard-indicators-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Tarefas</p>
            <h2>{isAdmin ? 'Produtividade e prazos da empresa' : 'Sua produtividade e prazos'}</h2>
          </div>
        </div>
        <div className="stats-grid dashboard-metrics-grid dashboard-task-grid">
          <StatCard label="Tarefas concluidas" value={completedTasks} detail="Atividades finalizadas" tone="green" />
          <StatCard label="A fazer" value={todoTasks} detail="Atividades ainda nao iniciadas" tone="blue" />
          <StatCard label="Em andamento" value={doingTasks} detail="Atividades sendo executadas" tone="amber" />
          <StatCard label="Vencem em 7 dias" value={dueSoonTasks} detail="Prazos proximos" tone="blue" />
          <StatCard label="Atrasadas" value={overdueTasks} detail="Pendencias fora do prazo" tone="amber" />
        </div>
      </section>

      <section className="dashboard-indicators-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Solicitacoes</p>
            <h2>Demandas entre setores</h2>
          </div>
        </div>
        <div className="stats-grid dashboard-metrics-grid dashboard-request-grid">
          <StatCard label="Recebidas" value={receivedRequests.length} detail={isAdmin ? 'Demandas recebidas pela empresa' : 'Demandas destinadas ao seu setor'} tone="blue" />
          <StatCard label="Enviadas" value={sentRequests.length} detail={isAdmin ? 'Solicitacoes emitidas pela empresa' : 'Solicitacoes abertas por voce'} />
          <StatCard label="Urgentes" value={urgentRequests} detail="Prioridade maxima" tone="amber" />
          <StatCard label="Pendentes" value={pendingRequests} detail="Pendentes ou em andamento" tone="amber" />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
