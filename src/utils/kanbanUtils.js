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
