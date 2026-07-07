export function getSortedSectors(sectors) {
  return [...sectors].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
}

export function groupTasksBySector(tasks) {
  return tasks.reduce((groups, task) => {
    const currentTasks = groups[task.sectorId] ?? [];
    return {
      ...groups,
      [task.sectorId]: [...currentTasks, task],
    };
  }, {});
}

export function createKanbanTask(sectorId, values) {
  return {
    id: `stage-${crypto.randomUUID()}`,
    sectorId,
    title: values.title.trim(),
    assignee: values.assignee.trim(),
    status: values.status,
    date: values.date,
  };
}

export function updateKanbanTask(tasks, taskId, values) {
  return tasks.map((task) => (task.id === taskId ? { ...task, ...values } : task));
}

export function deleteKanbanTask(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId);
}
