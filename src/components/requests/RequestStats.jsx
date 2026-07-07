import StatCard from '../dashboard/StatCard';

function RequestStats({ stats }) {
  return (
    <section className="stats-grid">
      <StatCard
        label="Solicitações recebidas hoje"
        value={stats.receivedToday}
        detail="Criadas hoje para o setor atual"
        tone="blue"
      />
      <StatCard
        label="Pendentes"
        value={stats.pending}
        detail="Pendentes ou em andamento"
        tone="amber"
      />
      <StatCard
        label="Concluídas"
        value={stats.completed}
        detail="Finalizadas pelo setor responsável"
        tone="green"
      />
      <StatCard
        label="Solicitações enviadas"
        value={stats.sent}
        detail="Criadas pelo usuário ou setor atual"
      />
    </section>
  );
}

export default RequestStats;
