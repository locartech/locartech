import { ArrowRight, Building2, UsersRound } from 'lucide-react';
import { users } from '../../data/mockData';

function SectorCard({ sector, tasks, onOpen }) {
  const sectorUsers = users.filter((user) => user.sectorId === sector.id);
  const sectorTasks = tasks.filter((task) => task.sectorId === sector.id);
  const openTasks = sectorTasks.filter((task) => task.status !== 'done').length;

  return (
    <button type="button" className="sector-card sector-card-button" onClick={() => onOpen?.(sector.id)}>
      <div className="sector-icon">
        <Building2 size={20} aria-hidden="true" />
      </div>
      <div>
        <h3>{sector.name}</h3>
        <p>{sector.description}</p>
      </div>
      <div className="sector-footer">
        <span>
          <UsersRound size={15} aria-hidden="true" />
          {sectorUsers.length} responsavel
        </span>
        <span>{openTasks} tarefas abertas</span>
      </div>
      <div className="sector-manager">
        <span>Gestor inicial</span>
        <strong>{sector.manager}</strong>
      </div>
      <div className="sector-knowledge-link">
        Acessar base de conhecimento
        <ArrowRight size={15} aria-hidden="true" />
      </div>
    </button>
  );
}

export default SectorCard;
