import { useMemo, useState } from 'react';
import { kanbanSectors } from '../../data/kanbanData';
import { getSortedSectors, groupTasksBySector } from '../../utils/kanbanUtils';
import EditTaskModal from './EditTaskModal';
import SectorGroup from './SectorGroup';

function KanbanTable({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) {
  const [collapsedSectors, setCollapsedSectors] = useState({});
  const [addingSectorId, setAddingSectorId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const sortedSectors = useMemo(() => getSortedSectors(kanbanSectors), []);
  const tasksBySector = useMemo(() => groupTasksBySector(tasks), [tasks]);

  const handleToggleSector = (sectorId) => {
    setCollapsedSectors((current) => ({
      ...current,
      [sectorId]: !current[sectorId],
    }));
  };

  const handleAddTask = (sectorId, values) => {
    onAddTask(sectorId, values);
    setAddingSectorId(null);
  };

  const handleDeleteTask = (taskId) => {
    const canDelete = window.confirm('Deseja excluir esta etapa? Essa ação remove a linha da gestão.');
    if (canDelete) {
      onDeleteTask(taskId);
    }
  };

  const handleEditSave = (taskId, values) => {
    onUpdateTask(taskId, values);
    setEditingTask(null);
  };

  return (
    <>
      <div className="kanban-table-shell">
        {sortedSectors.map((sector) => (
          <SectorGroup
            key={sector.id}
            sector={sector}
            tasks={tasksBySector[sector.id] ?? []}
            collapsed={Boolean(collapsedSectors[sector.id])}
            adding={addingSectorId === sector.id}
            onToggle={handleToggleSector}
            onAddStart={setAddingSectorId}
            onAddCancel={() => setAddingSectorId(null)}
            onAddTask={handleAddTask}
            onStatusChange={(taskId, status) => onUpdateTask(taskId, { status })}
            onDateChange={(taskId, date) => onUpdateTask(taskId, { date })}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onComplete={(taskId) => onUpdateTask(taskId, { status: 'done' })}
          />
        ))}
      </div>

      <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleEditSave} />
    </>
  );
}

export default KanbanTable;
