import { useEffect, useState } from 'react';
import { Archive, LayoutGrid } from 'lucide-react';
import ArchivedActivitiesPanel from '../components/kanban/ArchivedActivitiesPanel';
import KanbanTable from '../components/kanban/KanbanTable';
import PermissionNotice from '../components/common/PermissionNotice';
import { useAuth } from '../contexts/AuthContext';
import usePermissionNotice from '../hooks/usePermissionNotice';
import { supabase } from '../lib/supabase';
import {
  archiveKanbanTask,
  createRemoteKanbanTask,
  deleteKanbanTasksByIds,
  deleteRemoteKanbanTask,
  fetchKanbanTasks,
  restoreKanbanTask,
  subscribeToKanban,
  updateRemoteKanbanTask,
} from '../services/kanbanService';
import { canManageSector } from '../utils/permissions';

function Kanban() {
  const { currentUser } = useAuth();
  const [stageTasks, setStageTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('open');
  const { permissionNotice, showPermissionNotice } = usePermissionNotice();

  const canManageTaskSector = (sector) => canManageSector(currentUser, sector);

  const loadTasks = async () => {
    try {
      const tasks = await fetchKanbanTasks();
      setStageTasks(tasks);
      setError('');
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel carregar as atividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const channel = subscribeToKanban(loadTasks);
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTask = async (sectorId, values) => {
    if (!canManageTaskSector(sectorId)) return showPermissionNotice();
    try {
      const created = await createRemoteKanbanTask(sectorId, values);
      setStageTasks((current) => [...current, created]);
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel criar a atividade.');
    }
  };

  const handleUpdateTask = async (taskId, values) => {
    const current = stageTasks.find((task) => task.id === taskId);
    if (!current) return;
    if (!canManageTaskSector(current.sectorId)) return showPermissionNotice();

    try {
      const updated = await updateRemoteKanbanTask(taskId, current.sectorId, { ...current, ...values });
      setStageTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel atualizar a atividade.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const current = stageTasks.find((task) => task.id === taskId);
    if (!current || !canManageTaskSector(current.sectorId)) return showPermissionNotice();
    try {
      await deleteRemoteKanbanTask(taskId);
      setStageTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel excluir a atividade.');
    }
  };

  const handleArchiveTask = async (taskId) => {
    const current = stageTasks.find((task) => task.id === taskId);
    if (!current || !canManageTaskSector(current.sectorId)) return showPermissionNotice();
    try {
      const updated = await archiveKanbanTask(taskId, currentUser?.id, currentUser?.name);
      setStageTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel arquivar a atividade.');
    }
  };

  const handleRestoreTask = async (taskId) => {
    const current = stageTasks.find((task) => task.id === taskId);
    if (!current || !canManageTaskSector(current.sectorId)) return showPermissionNotice();
    try {
      const updated = await restoreKanbanTask(taskId);
      setStageTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel restaurar a atividade.');
    }
  };

  const handleCleanupTasks = async (taskIds) => {
    await deleteKanbanTasksByIds(taskIds);
    setStageTasks((current) => current.filter((task) => !taskIds.includes(task.id)));
  };

  const activeTasks = stageTasks.filter((task) => !task.archived);
  const archivedTasks = stageTasks.filter((task) => task.archived);

  return (
    <div className="page-stack kanban-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Gestao de atividades</p>
          <h2>Kanban em tabela por setor</h2>
        </div>
        <p>
          Organize atividades por area, edite status e datas diretamente na linha e mantenha o
          acompanhamento em uma visao gerencial agrupada.
        </p>
      </section>

      <div className="kanban-view-tabs" role="tablist" aria-label="Visao do Kanban">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'open'}
          className={`kanban-view-tab ${view === 'open' ? 'active' : ''}`}
          onClick={() => setView('open')}
        >
          <LayoutGrid size={16} aria-hidden="true" />
          Atividades em aberto
          <span className="kanban-view-tab-count">{activeTasks.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'archived'}
          className={`kanban-view-tab ${view === 'archived' ? 'active' : ''}`}
          onClick={() => setView('archived')}
        >
          <Archive size={16} aria-hidden="true" />
          Atividades arquivadas
          <span className="kanban-view-tab-count">{archivedTasks.length}</span>
        </button>
      </div>

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando atividades...</div> : null}
      <PermissionNotice notice={permissionNotice} />

      {view === 'open' ? (
        <KanbanTable
          tasks={activeTasks}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onArchiveTask={handleArchiveTask}
          canManageSector={canManageTaskSector}
          onBlockedAction={showPermissionNotice}
        />
      ) : (
        <ArchivedActivitiesPanel
          tasks={archivedTasks}
          onRestoreTask={handleRestoreTask}
          onCleanupTasks={handleCleanupTasks}
          canManageTask={canManageTaskSector}
          onBlockedAction={showPermissionNotice}
        />
      )}
    </div>
  );
}

export default Kanban;
