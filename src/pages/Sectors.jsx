import SectorCard from '../components/sectors/SectorCard';
import { sectors } from '../data/mockData';

function Sectors({ tasks, onOpenKnowledge }) {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Estrutura organizacional</p>
          <h2>Setores da empresa</h2>
        </div>
        <p>
          Acesse cada area para consultar e manter documentos, manuais, links e processos internos.
        </p>
      </section>

      <section className="sectors-grid">
        {sectors.map((sector) => (
          <SectorCard key={sector.id} sector={sector} tasks={tasks} onOpen={onOpenKnowledge} />
        ))}
      </section>
    </div>
  );
}

export default Sectors;
