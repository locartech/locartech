import { useEffect, useState } from 'react';
import KanbanTable from '../components/kanban/KanbanTable';
import { initialKanbanTasks, KANBAN_STORAGE_KEY } from '../data/kanbanData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  createRemoteKanbanTask,
  deleteRemoteKanbanTask,
  fetchKanbanTasks,
  subscribeToKanban,
  updateRemoteKanbanTask,
} from '../services/kanbanService';
import { createKanbanTask, deleteKanbanTask, updateKanbanTask } from '../utils/kanbanUtils';

function loadKanbanTasks() {
  try {
    const savedTasks = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (savedTasks) return JSON.parse(savedTasks);
  } catch {
    localStorage.removeItem(KANBAN_STORAGE_KEY);
  }

  return initialKanbanTasks;
}

function Kanban() {
  const [stageTasks, setStageTasks] = useState(loadKanbanTasks);
  const [usingSupabase, setUsingSupabase] = useState(false);

  const loadRemoteTasks = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const remoteTasks = await fetchKanbanTasks();
      setStageTasks(remoteTasks);
      setUsingSupabase(true);
    } catch {
      setUsingSupabase(false);
    }
  };

  useEffect(() => {
    loadRemoteTasks();
  }, []);

  useEffect(() => {
    if (!usingSupabase) {
      localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(stageTasks));
      return undefined;
    }

    const channel = subscribeToKanban(loadRemoteTasks);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [stageTasks, usingSupabase]);

  const handleAddTask = async (sectorId, values) => {
    if (usingSupabase) {
      const created = await createRemoteKanbanTask(sectorId, values);
      setStageTasks((current) => [...current, created]);
      return;
    }
    setStageTasks((current) => [...current, createKanbanTask(sectorId, values)]);
  };

  const handleUpdateTask = async (taskId, values) => {
    if (usingSupabase) {
      const currentTask = stageTasks.find((task) => task.id === taskId);
      const updated = await updateRemoteKanbanTask(taskId, currentTask.sectorId, { ...currentTask, ...values });
      setStageTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
      return;
    }
    setStageTasks((current) => updateKanbanTask(current, taskId, values));
  };

  const handleDeleteTask = async (taskId) => {
    if (usingSupabase) {
      await deleteRemoteKanbanTask(taskId);
      setStageTasks((current) => current.filter((task) => task.id !== taskId));
      return;
    }
    setStageTasks((current) => deleteKanbanTask(current, taskId));
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Gestao de etapas</p>
          <h2>Kanban em tabela por setor</h2>
        </div>
        <p>
          Organize etapas por area, edite status e datas diretamente na linha e mantenha o
          acompanhamento em uma visao gerencial agrupada.
        </p>
      </section>

      {!usingSupabase ? (
        <div className="members-feedback">Usando Kanban local ate a conexao Supabase estar disponivel.</div>
      ) : null}

      <KanbanTable
        tasks={stageTasks}
        onAddTask={handleAddTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}

export default Kanban;
