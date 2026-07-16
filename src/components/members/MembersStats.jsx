import StatCard from '../dashboard/StatCard';

function MembersStats({ stats }) {
  return (
    <section className="stats-grid">
      <StatCard label="Total de membros" value={stats.total} detail="Contas cadastradas no sistema" tone="blue" />
      <StatCard label="Membros ativos" value={stats.active} detail="Usuarios com acesso liberado" tone="green" />
      <StatCard label="Membros inativos" value={stats.inactive} detail="Contas desativadas administrativamente" tone="amber" />
      <StatCard label="Setores" value={stats.sectors} detail="Areas com membros cadastrados" />
    </section>
  );
}

export default MembersStats;
