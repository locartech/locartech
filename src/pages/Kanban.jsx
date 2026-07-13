import { useEffect, useState } from 'react';
import KanbanTable from '../components/kanban/KanbanTable';
import {
  createRemoteKanbanTask,
  deleteRemoteKanbanTask,
  fetchKanbanTasks,
  subscribeToKanban,
  updateRemoteKanbanTask,
} from '../services/kanbanService';
import { supabase } from '../lib/supabase';

function Kanban() {
  const [stageTasks, setStageTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    try {
      const updated = await updateRemoteKanbanTask(taskId, current.sectorId, { ...current, ...values });
      setStageTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel atualizar a atividade.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteRemoteKanbanTask(taskId);
      setStageTasks((current) => current.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel excluir a atividade.');
    }
  };

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

      {error ? <div className="members-feedback error">{error}</div> : null}
      {loading ? <div className="members-feedback">Carregando atividades...</div> : null}

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
