import SectorCard from '../components/sectors/SectorCard';
import { sectors } from '../data/mockData';

function Sectors({ onOpenKnowledge }) {
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

      <section className="sectors-grid">
        {sectors.map((sector) => (
          <SectorCard key={sector.id} sector={sector} onOpen={onOpenKnowledge} />
        ))}
      </section>
    </div>
  );
}

export default Sectors;
