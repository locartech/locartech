import { useEffect, useState } from 'react';
import SectorCard from '../components/sectors/SectorCard';
import { fetchKanbanTasks } from '../services/kanbanService';
import { fetchKnowledgeRecords } from '../services/knowledgeService';
import { fetchSectors } from '../services/sectorsService';

function Sectors({ onOpenKnowledge }) {
  const [sectors, setSectors] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [knowledgeCounts, setKnowledgeCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [sectorList, tasks, knowledgeRecords] = await Promise.all([
          fetchSectors(),
          fetchKanbanTasks(),
          fetchKnowledgeRecords(),
        ]);
        if (!mounted) return;

        setSectors(sectorList);

        const nextTaskCounts = {};
        tasks
          .filter((task) => task.status !== 'done' && task.status !== 'canceled')
          .forEach((task) => {
            nextTaskCounts[task.sectorId] = (nextTaskCounts[task.sectorId] ?? 0) + 1;
          });
        setTaskCounts(nextTaskCounts);

        const nextKnowledgeCounts = {};
        knowledgeRecords.forEach((record) => {
          const sector = sectorList.find((item) => item.name === record.sector);
          if (!sector) return;
          nextKnowledgeCounts[sector.slug] = (nextKnowledgeCounts[sector.slug] ?? 0) + 1;
        });
        setKnowledgeCounts(nextKnowledgeCounts);

        setError('');
      } catch (err) {
        if (mounted) setError(err.message ?? 'Nao foi possivel carregar os setores.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Estrutura organizacional</p>
          <h2>Setores da empresa</h2>
        </div>
        <p>
          Acesse rapidamente a base de conhecimento de cada area da empresa.
        </p>
      </section>

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando setores...</div> : null}

      <section className="sectors-grid">
        {sectors.map((sector) => (
          <SectorCard
            key={sector.id}
            sector={{ id: sector.slug, name: sector.name }}
            openTasksCount={taskCounts[sector.slug] ?? 0}
            knowledgeCount={knowledgeCounts[sector.slug] ?? 0}
            onOpen={onOpenKnowledge}
          />
        ))}
      </section>
    </div>
  );
}

export default Sectors;
