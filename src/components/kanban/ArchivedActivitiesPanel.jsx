import { useMemo, useState } from 'react';
import ConfirmModal from '../common/ConfirmModal';
import ArchivedActivitiesFilters, { emptyArchivedFilters } from './ArchivedActivitiesFilters';
import ArchivedActivitiesTable from './ArchivedActivitiesTable';

function ArchivedActivitiesPanel({ tasks, onRestoreTask }) {
  const [filters, setFilters] = useState(emptyArchivedFilters);
  const [restoringTask, setRestoringTask] = useState(null);

  const responsibleOptions = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return tasks.filter((task) => {
      const sectorMatches = filters.sector === 'all' || task.sectorId === filters.sector;
      const responsibleMatches = filters.responsible === 'all' || task.assignee === filters.responsible;
      const statusMatches = filters.status === 'all' || task.status === filters.status;
      const priorityMatches = filters.priority === 'all' || task.priority === filters.priority;

      const archivedDate = task.archivedAt ? task.archivedAt.slice(0, 10) : '';
      const fromMatches = !filters.from || (archivedDate && archivedDate >= filters.from);
      const toMatches = !filters.to || (archivedDate && archivedDate <= filters.to);

      const queryMatches =
        !normalizedQuery ||
        [task.title, task.assignee, task.sectorName, task.requesterName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return sectorMatches && responsibleMatches && statusMatches && priorityMatches && fromMatches && toMatches && queryMatches;
    });
  }, [tasks, filters]);

  const handleConfirmRestore = () => {
    if (restoringTask) onRestoreTask(restoringTask.id);
    setRestoringTask(null);
  };

  return (
    <div className="page-stack">
      <ArchivedActivitiesFilters filters={filters} onChange={setFilters} responsibleOptions={responsibleOptions} />

      <ArchivedActivitiesTable tasks={filteredTasks} onRestore={setRestoringTask} />

      <ConfirmModal
        open={Boolean(restoringTask)}
        title="Restaurar atividade"
        message="Deseja restaurar esta atividade para o Kanban?"
        cancelLabel="Cancelar"
        confirmLabel="Sim, restaurar"
        onCancel={() => setRestoringTask(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}

export default ArchivedActivitiesPanel;
