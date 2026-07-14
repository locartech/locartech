import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import AddTaskRow from './AddTaskRow';
import TaskRow from './TaskRow';

function SectorGroup({
  sector,
  tasks,
  collapsed,
  adding,
  onToggle,
  onAddStart,
  onAddCancel,
  onAddTask,
  onStatusChange,
  onDateChange,
  onEdit,
  onDelete,
  onArchive,
}) {
  const finishedCount = tasks.filter((task) => task.status === 'done').length;
  const activeCount = tasks.filter((task) => task.status !== 'done' && task.status !== 'canceled').length;
  const ToggleIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <section className={`sector-stage-group sector-stage-${sector.id}`}>
      <button type="button" className="sector-stage-header" onClick={() => onToggle(sector.id)} aria-expanded={!collapsed}>
        <span className="sector-stage-title">
          <ToggleIcon size={16} aria-hidden="true" />
          <span className="sector-dot" aria-hidden="true" />
          {sector.name}
        </span>
        <span className="sector-stage-summary">
          <span>{tasks.length} atividades</span>
          <span className="sector-stage-summary-open">{activeCount} abertas</span>
          <span className="sector-stage-summary-done">{finishedCount} feitas</span>
        </span>
      </button>

      {!collapsed ? (
        <div className="stage-table" role="table" aria-label={`Atividades do setor ${sector.name}`}>
          <div className="stage-row stage-table-head" role="row">
            <div className="stage-cell" role="columnheader">Atividade</div>
            <div className="stage-cell" role="columnheader">Responsável</div>
            <div className="stage-cell" role="columnheader">Status</div>
            <div className="stage-cell" role="columnheader">Prioridade</div>
            <div className="stage-cell" role="columnheader">Data</div>
            <div className="stage-cell" role="columnheader">Ações</div>
          </div>

          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onDateChange={onDateChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
            />
          ))}

          {adding ? (
            <AddTaskRow onAdd={(values) => onAddTask(sector.id, values)} onCancel={onAddCancel} />
          ) : (
            <button type="button" className="add-stage-button" onClick={() => onAddStart(sector.id)}>
              <Plus size={16} aria-hidden="true" />
              Adicionar atividade
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default SectorGroup;
