import StatCard from '../dashboard/StatCard';

function KnowledgeStats({ stats }) {
  return (
    <section className="stats-grid knowledge-stats">
      <StatCard label="Total de registros" value={stats.total} detail="Materiais cadastrados no setor" tone="blue" />
      <StatCard label="Documentos" value={stats.documents} detail="Arquivos documentais" />
      <StatCard label="Manuais" value={stats.manuals} detail="Guias e instruções internas" />
      <StatCard label="Treinamentos" value={stats.trainings} detail="Materiais de capacitação" tone="green" />
      <StatCard label="Responsáveis" value={stats.responsibles} detail="Pessoas vinculadas aos registros" />
    </section>
  );
}

export default KnowledgeStats;
