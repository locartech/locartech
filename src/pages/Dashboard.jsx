import StatCard from '../components/dashboard/StatCard';
import { initialKanbanTasks, KANBAN_STORAGE_KEY } from '../data/kanbanData';
import { initialRequests, REQUESTS_STORAGE_KEY } from '../data/requestsData';

const today = new Date('2026-07-06T12:00:00');

function loadStoredItems(storageKey, fallback) {
  try {
    const savedItems = localStorage.getItem(storageKey);
    if (savedItems) {
      return JSON.parse(savedItems);
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  return fallback;
}

function getDaysUntil(dateValue) {
  const targetDate = new Date(`${dateValue}T12:00:00`);
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

function Dashboard({ notifications }) {
  const stageTasks = loadStoredItems(KANBAN_STORAGE_KEY, initialKanbanTasks);
  const requests = loadStoredItems(REQUESTS_STORAGE_KEY, initialRequests);

  const totalTasks = stageTasks.length;
  const completedTasks = stageTasks.filter((task) => task.status === 'done').length;
  const pendingTasks = stageTasks.filter((task) => task.status === 'todo').length;
  const doingTasks = stageTasks.filter((task) => task.status === 'doing').length;
  const canceledTasks = stageTasks.filter((task) => task.status === 'canceled').length;
  const openTasks = stageTasks.filter((task) => ['todo', 'doing'].includes(task.status)).length;
  const overdueTasks = stageTasks.filter((task) => task.status !== 'done' && getDaysUntil(task.date) < 0).length;
  const dueSoonTasks = stageTasks.filter((task) => {
    const daysUntil = getDaysUntil(task.date);
    return task.status !== 'done' && daysUntil >= 0 && daysUntil <= 7;
  }).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeSectors = new Set(stageTasks.map((task) => task.sectorId)).size;

  const receivedRequests = requests.filter((request) => request.targetSector === 'Compras');
  const sentRequests = requests.filter((request) => request.requesterSector === 'Compras');
  const pendingRequests = requests.filter((request) => ['pending', 'in_progress'].includes(request.status)).length;
  const completedRequests = requests.filter((request) => request.status === 'completed').length;
  const urgentRequests = requests.filter((request) => request.priority === 'urgent').length;
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="page-stack">
      <section className="dashboard-summary">
        <div>
          <p className="eyebrow">Indicadores executivos</p>
          <h2>Resumo operacional</h2>
          <p>Visão consolidada de tarefas, solicitações e pendências da operação.</p>
        </div>
        <div className="dashboard-score">
          <span>{completionRate}%</span>
          <small>conclusão das tarefas</small>
        </div>
      </section>

      <section className="dashboard-indicators-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Tarefas</p>
            <h2>Produtividade e prazos</h2>
          </div>
        </div>
        <div className="stats-grid dashboard-metrics-grid">
          <StatCard label="Tarefas concluídas" value={completedTasks} detail="Etapas finalizadas" tone="green" />
          <StatCard label="Faltam fazer" value={pendingTasks} detail="Etapas ainda não iniciadas" tone="blue" />
          <StatCard label="Em andamento" value={doingTasks} detail="Etapas sendo executadas" tone="amber" />
          <StatCard label="Tarefas abertas" value={openTasks} detail="A fazer ou em andamento" />
          <StatCard label="Vencem em 7 dias" value={dueSoonTasks} detail="Prazos próximos" tone="blue" />
          <StatCard label="Atrasadas" value={overdueTasks} detail="Pendências fora do prazo" tone="amber" />
          <StatCard label="Canceladas" value={canceledTasks} detail="Etapas interrompidas" />
          <StatCard label="Setores envolvidos" value={activeSectors} detail="Áreas com tarefas cadastradas" />
        </div>
      </section>

      <section className="dashboard-indicators-section">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Solicitações</p>
            <h2>Demandas entre setores</h2>
          </div>
        </div>
        <div className="stats-grid dashboard-metrics-grid">
          <StatCard label="Recebidas por Compras" value={receivedRequests.length} detail="Demandas destinadas ao setor atual" tone="blue" />
          <StatCard label="Enviadas por Compras" value={sentRequests.length} detail="Solicitações abertas pelo setor atual" />
          <StatCard label="Pendentes" value={pendingRequests} detail="Pendentes ou em andamento" tone="amber" />
          <StatCard label="Concluídas" value={completedRequests} detail="Solicitações finalizadas" tone="green" />
          <StatCard label="Urgentes" value={urgentRequests} detail="Prioridade máxima" tone="amber" />
          <StatCard label="Notificações pendentes" value={unreadNotifications} detail="Avisos ainda não lidos" tone="blue" />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
