import { useMemo, useState } from 'react';
import { kanbanSectors } from '../../data/kanbanData';
import { getSortedSectors, groupTasksBySector } from '../../utils/kanbanUtils';
import ConfirmModal from '../common/ConfirmModal';
import EditTaskModal from './EditTaskModal';
import KanbanTaskDetailsModal from './KanbanTaskDetailsModal';
import SectorGroup from './SectorGroup';

function KanbanTable({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onArchiveTask,
  canManageSector,
  onBlockedAction,
}) {
  const [collapsedSectors, setCollapsedSectors] = useState(() =>
    Object.fromEntries(kanbanSectors.map((sector) => [sector.id, true])),
  );
  const [addingSectorId, setAddingSectorId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [archivingTask, setArchivingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);

  const sortedSectors = useMemo(() => getSortedSectors(kanbanSectors), []);
  const tasksBySector = useMemo(() => groupTasksBySector(tasks), [tasks]);

  const handleToggleSector = (sectorId) => {
    setCollapsedSectors((current) => ({
      ...current,
      [sectorId]: !current[sectorId],
    }));
  };

  const handleAddTask = async (sectorId, values) => {
    await onAddTask(sectorId, values);
    setAddingSectorId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask || deleteBusy) return;

    setDeleteBusy(true);
    try {
      const succeeded = deletingTask.sourceRequestId
        ? await onArchiveTask(deletingTask.id)
        : await onDeleteTask(deletingTask.id);
      if (succeeded !== false) setDeletingTask(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleEditSave = async (taskId, values) => {
    await onUpdateTask(taskId, values);
    setEditingTask(null);
  };

  const handleConfirmArchive = () => {
    if (archivingTask) onArchiveTask(archivingTask.id);
    setArchivingTask(null);
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
            onView={setViewingTask}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onArchive={setArchivingTask}
            canEdit={canManageSector(sector)}
            onBlockedAction={onBlockedAction}
          />
        ))}
      </div>

      <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleEditSave} />
      <KanbanTaskDetailsModal task={viewingTask} onClose={() => setViewingTask(null)} />

      <ConfirmModal
        open={Boolean(archivingTask)}
        title="Arquivar atividade"
        message="Você realmente deseja arquivar essa atividade?"
        cancelLabel="Não"
        confirmLabel="Sim, arquivar"
        onCancel={() => setArchivingTask(null)}
        onConfirm={handleConfirmArchive}
      />

      <ConfirmModal
        open={Boolean(deletingTask)}
        title={deletingTask?.sourceRequestId ? 'Remover atividade do quadro' : 'Excluir atividade'}
        message={
          deletingTask?.sourceRequestId
            ? 'Esta atividade foi criada por uma solicitacao. Para preservar o historico, ela sera removida do quadro ativo e enviada para Atividades arquivadas.'
            : 'Deseja excluir esta atividade permanentemente? Esta acao nao pode ser desfeita.'
        }
        cancelLabel="Cancelar"
        confirmLabel={deletingTask?.sourceRequestId ? 'Sim, arquivar atividade' : 'Sim, excluir atividade'}
        busy={deleteBusy}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export default KanbanTable;
