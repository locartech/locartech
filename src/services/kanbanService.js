import { supabase } from '../lib/supabase';
import { sectors } from '../data/mockData';

function mapTaskFromDb(task) {
  return {
    id: task.id,
    sectorId: task.sector_id,
    title: task.title,
    description: task.description || '',
    assignee: task.responsible_name || '',
    responsibleId: task.responsible_id,
    status: task.status,
    priority: task.priority || 'medium',
    date: task.due_date,
    sourceRequestId: task.source_request_id,
    requesterSector: task.requester_sector?.name,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

function mapTaskToDb(sectorId, values) {
  const sector = sectors.find((item) => item.id === sectorId);
  return {
    sector_id: sectorId,
    sector_name: sector?.name ?? sectorId,
    title: values.title?.trim(),
    description: values.description?.trim() || '',
    responsible_name: values.assignee?.trim() || null,
    status: values.status,
    priority: values.priority || 'medium',
    due_date: values.date || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchKanbanTasks() {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select('*, requester_sector:sectors!requester_sector_id(name)')
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
