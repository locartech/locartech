import { supabase } from '../lib/supabase';
import { sectors } from '../data/mockData';

function mapTaskFromDb(task) {
  return {
    id: task.id,
    sectorId: task.sector_id,
    title: task.title,
    assignee: task.responsible_name || '',
    status: task.status,
    date: task.due_date,
  };
}

function mapTaskToDb(sectorId, values) {
  const sector = sectors.find((item) => item.id === sectorId);
  return {
    sector_id: sectorId,
    sector_name: sector?.name ?? sectorId,
    title: values.title?.trim(),
    responsible_name: values.assignee?.trim() || null,
    status: values.status,
    due_date: values.date || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchKanbanTasks() {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(mapTaskFromDb);
}

export async function createRemoteKanbanTask(sectorId, values) {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert(mapTaskToDb(sectorId, values))
    .select('*')
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export async function updateRemoteKanbanTask(taskId, sectorId, values) {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .update(mapTaskToDb(sectorId, values))
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export async function deleteRemoteKanbanTask(taskId) {
  const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export function subscribeToKanban(onChange) {
  return supabase
    .channel('kanban:tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks' }, onChange)
    .subscribe();
}
