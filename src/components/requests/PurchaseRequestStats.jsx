import StatCard from '../dashboard/StatCard';

function PurchaseRequestStats({ stats }) {
  return (
    <section className="stats-grid purchase-stats-grid">
      <StatCard label="Novas" value={stats.novas} detail="Aguardando analise de Compras" tone="blue" />
      <StatCard label="Urgentes" value={stats.urgentes} detail="Prioridade maxima" tone="amber" />
      <StatCard label="Em compra" value={stats.emCompra} detail="Processos em andamento" />
      <StatCard label="Compradas" value={stats.compradas} detail="Itens ja comprados" tone="green" />
      <StatCard label="Entregues" value={stats.entregues} detail="Solicitacoes finalizadas" tone="green" />
    </section>
  );
}

export default PurchaseRequestStats;
