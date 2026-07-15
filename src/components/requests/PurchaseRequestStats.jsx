import StatCard from '../dashboard/StatCard';

function PurchaseRequestStats({ stats }) {
  return (
    <section className="stats-grid purchase-stats-grid">
      <StatCard label="Novas" value={stats.novas} detail="Aguardando analise de Compras" tone="blue" />
      <StatCard label="Urgentes" value={stats.urgentes} detail="Prioridade maxima" tone="amber" />
      <StatCard label="Em andamento" value={stats.emAndamento} detail="Compra sendo processada" />
      <StatCard label="Concluidas" value={stats.concluidas} detail="Item recebido" tone="green" />
      <StatCard label="Recusadas" value={stats.recusadas} detail="Nao aprovadas" tone="red" />
    </section>
  );
}

export default PurchaseRequestStats;
