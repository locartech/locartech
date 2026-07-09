import {
  ArrowRight,
  Calculator,
  ClipboardCheck,
  CreditCard,
  Route,
  ShoppingCart,
  UsersRound,
} from 'lucide-react';

const sectorIcons = {
  compras: ShoppingCart,
  contabilidade: Calculator,
  financeiro: CreditCard,
  frotas: Route,
  planejamento: ClipboardCheck,
  'recursos-humanos': UsersRound,
};

function SectorCard({ sector, openTasksCount = 0, knowledgeCount = 0, onOpen }) {
  const Icon = sectorIcons[sector.id] ?? ClipboardCheck;

  return (
    <button
      type="button"
      className={`sector-card sector-card-button sector-card-${sector.id}`}
      title={`${openTasksCount} tarefa(s) aberta(s) - ${knowledgeCount} registro(s) de conhecimento`}
      onClick={() => onOpen?.(sector.id)}
    >
      <span className="sector-card-accent" aria-hidden="true" />
      <div className="sector-icon">
        <Icon size={24} aria-hidden="true" />
      </div>

      <h3>{sector.name}</h3>

      <div className="sector-knowledge-link">
        Acessar base de conhecimento
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </button>
  );
}

export default SectorCard;
