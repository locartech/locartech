import { useEffect, useState } from 'react';
import KanbanTable from '../components/kanban/KanbanTable';
import { initialKanbanTasks, KANBAN_STORAGE_KEY } from '../data/kanbanData';
import { createKanbanTask, deleteKanbanTask, updateKanbanTask } from '../utils/kanbanUtils';

function loadKanbanTasks() {
  try {
    const savedTasks = localStorage.getItem(KANBAN_STORAGE_KEY);
    if (savedTasks) {
      return JSON.parse(savedTasks);
    }
  } catch {
    localStorage.removeItem(KANBAN_STORAGE_KEY);
  }

  return initialKanbanTasks;
}

function Kanban() {
  const [stageTasks, setStageTasks] = useState(loadKanbanTasks);

  useEffect(() => {
    localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(stageTasks));
  }, [stageTasks]);

  const handleAddTask = (sectorId, values) => {
    setStageTasks((current) => [...current, createKanbanTask(sectorId, values)]);
  };

  const handleUpdateTask = (taskId, values) => {
    setStageTasks((current) => updateKanbanTask(current, taskId, values));
  };

  const handleDeleteTask = (taskId) => {
    setStageTasks((current) => deleteKanbanTask(current, taskId));
  };

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Gestão de etapas</p>
          <h2>Kanban em tabela por setor</h2>
        </div>
        <p>
          Organize etapas por área, edite status e datas diretamente na linha e mantenha o
          acompanhamento em uma visão gerencial agrupada.
        </p>
      </section>

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
