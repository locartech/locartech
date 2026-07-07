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
  onComplete,
}) {
  const finishedCount = tasks.filter((task) => task.status === 'done').length;
  const activeCount = tasks.filter((task) => task.status !== 'done' && task.status !== 'canceled').length;
  const ToggleIcon = collapsed ? ChevronRight : ChevronDown;

  return (
    <section className="sector-stage-group">
      <button type="button" className="sector-stage-header" onClick={() => onToggle(sector.id)} aria-expanded={!collapsed}>
        <span className="sector-stage-title">
          <ToggleIcon size={18} aria-hidden="true" />
          {sector.name}
        </span>
        <span className="sector-stage-summary">
          {tasks.length} etapas
          <span>{activeCount} abertas</span>
          <span>{finishedCount} feitas</span>
        </span>
      </button>

      {!collapsed ? (
        <div className="stage-table" role="table" aria-label={`Etapas do setor ${sector.name}`}>
          <div className="stage-row stage-table-head" role="row">
            <div className="stage-cell" role="columnheader">Etapa</div>
            <div className="stage-cell" role="columnheader">Responsável</div>
            <div className="stage-cell" role="columnheader">Status</div>
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
              onComplete={onComplete}
            />
          ))}

          {adding ? (
            <AddTaskRow onAdd={(values) => onAddTask(sector.id, values)} onCancel={onAddCancel} />
          ) : (
            <button type="button" className="add-stage-button" onClick={() => onAddStart(sector.id)}>
              <Plus size={16} aria-hidden="true" />
              Adicionar etapa
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default SectorGroup;
