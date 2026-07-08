import StatCard from '../dashboard/StatCard';

function RequestStats({ stats }) {
  return (
    <section className="stats-grid request-stats-grid">
      <StatCard label="Recebidas hoje" value={stats.receivedToday} detail="Criadas hoje para o setor atual" tone="blue" />
      <StatCard label="Pendentes de aprovacao" value={stats.pendingApproval} detail="Aguardando decisao do setor" tone="amber" />
      <StatCard label="Aprovadas" value={stats.approved} detail="Ja adicionadas ao fluxo do Kanban" tone="green" />
      <StatCard label="Recusadas" value={stats.rejected} detail="Nao entraram no Kanban" />
      <StatCard label="Enviadas por mim" value={stats.sentByMe} detail="Criadas pelo usuario ou setor atual" tone="blue" />
    </section>
  );
}

export default RequestStats;
