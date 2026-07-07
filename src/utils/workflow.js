import { sectors, users } from '../data/mockData';

const findSector = (sectorId) => sectors.find((sector) => sector.id === sectorId);
const findUser = (userId) => users.find((user) => user.id === userId);

export function getNextWorkflowStep(tasks, task) {
  if (!task?.nextTaskId) return null;
  return tasks.find((candidate) => candidate.id === task.nextTaskId) ?? null;
}

export function generateNextNotification(task, nextTask) {
  const originSector = findSector(task.sectorId);
  const targetSector = nextTask ? findSector(nextTask.sectorId) : findSector('gestao');
  const assignee = findUser(task.assigneeId);
  const targetUser = nextTask ? findUser(nextTask.assigneeId) : null;

  const message = nextTask
    ? `${assignee?.name ?? 'Responsável'} do setor ${originSector?.name ?? 'Origem'} finalizou a tarefa ${task.title}. O setor ${targetSector?.name ?? 'Destino'} já pode iniciar a próxima etapa: ${nextTask.title}.`
    : `${assignee?.name ?? 'Responsável'} do setor ${originSector?.name ?? 'Origem'} finalizou a tarefa ${task.title}. O fluxo não possui próximas etapas pendentes.`;

  return {
    id: `notification-${Date.now()}-${task.id}`,
    createdAt: new Date().toISOString(),
    title: nextTask ? 'Próxima etapa liberada' : 'Fluxo concluído',
    message,
    targetSectorId: targetSector?.id ?? null,
    targetUserId: targetUser?.id ?? null,
    taskId: nextTask?.id ?? task.id,
    read: false,
  };
}

export function updateTaskStatus(tasks, taskId, status) {
  return tasks.map((task) => (task.id === taskId ? { ...task, status } : task));
}

export function completeTask(tasks, notifications, taskId) {
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) {
    return { tasks, notifications };
  }

  const nextTask = getNextWorkflowStep(tasks, task);
  const updatedTasks = tasks.map((candidate) => {
    if (candidate.id === taskId) {
      return { ...candidate, status: 'done', completedAt: new Date().toISOString() };
    }

    if (nextTask && candidate.id === nextTask.id && candidate.status === 'waiting') {
      return { ...candidate, status: 'todo' };
    }

    return candidate;
  });

  const nextNotification = generateNextNotification(task, nextTask);

  return {
    tasks: updatedTasks,
    notifications: [nextNotification, ...notifications],
  };
}
