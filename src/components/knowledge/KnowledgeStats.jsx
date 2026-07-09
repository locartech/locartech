import StatCard from '../dashboard/StatCard';

function KnowledgeStats({ stats }) {
  return (
    <section className="stats-grid knowledge-stats">
      <StatCard label="Manuais do setor" value={stats.sectorManual} detail="Guias internos da area" tone="blue" />
      <StatCard label="POPs" value={stats.pops} detail="Procedimentos operacionais" />
      <StatCard label="Documentos" value={stats.documents} detail="Arquivos e formularios" />
      <StatCard label="Outros" value={stats.others} detail="Materiais complementares" tone="green" />
    </section>
  );
}

export default KnowledgeStats;
