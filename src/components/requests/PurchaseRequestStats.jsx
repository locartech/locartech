import StatCard from '../dashboard/StatCard';

function PurchaseRequestStats({ stats }) {
  return (
    <section className="stats-grid purchase-stats-grid">
      <StatCard label="Novas" value={stats.novas} detail="Aguardando analise de Compras" tone="blue" />
      <StatCard label="Urgentes" value={stats.urgentes} detail="Prioridade maxima" tone="amber" />
      <StatCard label="Aprovadas" value={stats.aprovadas} detail="Liberadas por Compras" tone="green" />
      <StatCard label="Recusadas" value={stats.recusadas} detail="Nao aprovadas" tone="red" />
      <StatCard label="Canceladas" value={stats.canceladas} detail="Solicitacoes interrompidas" />
    </section>
  );
}

export default PurchaseRequestStats;
