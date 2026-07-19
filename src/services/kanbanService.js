import { supabase } from '../lib/supabase';
import { sectors } from '../data/sectorsData';
import { fetchSectorIdByName } from './sectorsService';

const TASK_SELECT = '*, requester_sector:sectors!requester_sector_id(name), requester_profile:profiles!requester_profile_id(name)';

function mapTaskFromDb(task) {
  return {
    id: task.id,
    sectorId: task.sector_id,
    sectorName: task.sector_name,
    title: task.title,
    description: task.description || '',
    assignee: task.responsible_name || '',
    responsibleId: task.responsible_id,
    status: task.status,
    priority: task.priority || 'medium',
    date: task.due_date,
    sourceRequestId: task.source_request_id,
    requesterName: task.requester_profile?.name,
    requesterSector: task.requester_sector?.name,
    archived: task.archived ?? false,
    archivedAt: task.archived_at,
    archivedBy: task.archived_by,
    archivedByName: task.archived_by_name,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

async function mapTaskToDb(sectorId, values, organizationId) {
  const sector = sectors.find((item) => item.id === sectorId);
  return {
    sector_id: sectorId,
    sector_name: sector?.name ?? sectorId,
    sector_ref_id: await fetchSectorIdByName(sector?.name ?? sectorId).catch(() => null),
    title: values.title?.trim(),
    description: values.description?.trim() || '',
    responsible_name: values.assignee?.trim() || null,
    status: values.status,
    priority: values.priority || 'medium',
    due_date: values.date || null,
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchKanbanTasks() {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select(TASK_SELECT)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(mapTaskFromDb);
}

export async function createRemoteKanbanTask(sectorId, values, organizationId) {
  const payload = await mapTaskToDb(sectorId, values, organizationId);
  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert(payload)
    .select(TASK_SELECT)
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export async function updateRemoteKanbanTask(taskId, sectorId, values, organizationId) {
  const payload = await mapTaskToDb(sectorId, values, organizationId);
  const { data, error } = await supabase
    .from('kanban_tasks')
    .update(payload)
    .eq('id', taskId)
    .select(TASK_SELECT)
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export async function deleteRemoteKanbanTask(taskId) {
  const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function deleteArchivedKanbanHistory(taskIds) {
  if (!taskIds.length) return;
  const { error } = await supabase.rpc('delete_archived_kanban_history', { p_task_ids: taskIds });
  if (error) throw error;
}

export async function archiveKanbanTask(taskId, userId, userName) {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
      archived_by: userId,
      archived_by_name: userName,
    })
    .eq('id', taskId)
    .select(TASK_SELECT)
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export async function restoreKanbanTask(taskId) {
  const { data, error } = await supabase
    .from('kanban_tasks')
    .update({
      archived: false,
      archived_at: null,
      archived_by: null,
      archived_by_name: null,
    })
    .eq('id', taskId)
    .select(TASK_SELECT)
    .single();

  if (error) throw error;
  return mapTaskFromDb(data);
}

export function subscribeToKanban(onChange) {
  return supabase
    .channel('kanban:tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks' }, onChange)
    .subscribe();
}
