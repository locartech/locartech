import { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { fetchKanbanTasks } from '../services/kanbanService';
import { fetchRemoteRequests } from '../services/requestsService';

function getDaysUntil(dateValue) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const targetDate = new Date(`${dateValue}T12:00:00`);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

function Dashboard() {
  const { currentUser } = useAuth();
  const [stageTasks, setStageTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchKanbanTasks(), fetchRemoteRequests()])
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

    return () => {
      mounted = false;
    };
  }, []);

  const totalTasks = stageTasks.length;
  const completedTasks = stageTasks.filter((task) => task.status === 'done').length;
  const todoTasks = stageTasks.filter((task) => task.status === 'todo').length;
  const doingTasks = stageTasks.filter((task) => task.status === 'doing').length;
  const dueSoonTasks = stageTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.date);
    return !['done', 'canceled'].includes(task.status) && daysUntil >= 0 && daysUntil <= 7;
  }).length;
  const overdueTasks = stageTasks.filter(
    (task) => !['done', 'canceled'].includes(task.status) && getDaysUntil(task.date) < 0,
  ).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentSector = currentUser?.sector ?? 'Compras';
  const receivedRequests = requests.filter((request) => request.targetSector === currentSector);
  const sentRequests = requests.filter(
    (request) =>
      request.requesterUserId === currentUser?.id ||
      request.requesterName === currentUser?.name ||
      request.requesterSector === currentSector,
  );
  const relevantRequests = requests.filter(
    (request) =>
      request.targetSector === currentSector ||
      request.requesterUserId === currentUser?.id ||
      request.requesterName === currentUser?.name ||
      request.requesterSector === currentSector,
  );
  const urgentRequests = relevantRequests.filter((request) => request.priority === 'urgent').length;
  const pendingRequests = relevantRequests.filter((request) => request.requestStatus === 'pending_approval').length;

  return (
    <div className="page-stack">
      <section className="dashboard-summary">
        <div>
          <p className="eyebrow">Indicadores executivos</p>
          <h2>Resumo operacional</h2>
          <p>Visao consolidada de tarefas, solicitacoes e pendencias da operacao.</p>
        </div>
        <div className="dashboard-score">
          <span>{completionRate}%</span>
          <small>conclusao das tarefas</small>
        </div>
      </section>

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando indicadores...</div> : null}

      <section className="dashboard-indicators-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Tarefas</p>
            <h2>Produtividade e prazos</h2>
          </div>
        </div>
        <div className="stats-grid dashboard-metrics-grid dashboard-task-grid">
          <StatCard label="Tarefas concluidas" value={completedTasks} detail="Etapas finalizadas" tone="green" />
          <StatCard label="A fazer" value={todoTasks} detail="Etapas ainda nao iniciadas" tone="blue" />
          <StatCard label="Em andamento" value={doingTasks} detail="Etapas sendo executadas" tone="amber" />
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
          <StatCard label="Recebidas" value={receivedRequests.length} detail="Demandas destinadas ao setor atual" tone="blue" />
          <StatCard label="Enviadas" value={sentRequests.length} detail="Solicitacoes abertas pelo setor atual" />
          <StatCard label="Urgentes" value={urgentRequests} detail="Prioridade maxima" tone="amber" />
          <StatCard label="Pendentes" value={pendingRequests} detail="Pendentes ou em andamento" tone="amber" />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
