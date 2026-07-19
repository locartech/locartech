import { supabase } from '../lib/supabase';
import { purchaseRequestSource, purchaseRequestTargetSector } from '../data/purchaseRequestsData';

function mapRequestFromDb(request) {
  return {
    id: request.id,
    title: request.title,
    description: request.description ?? '',
    stepName: request.step_name || request.title,
    requesterUserId: request.requester_id,
    requesterName: request.requester_name,
    requesterSector: request.from_sector,
    targetSector: request.to_sector,
    responsibleName: request.responsible_name ?? '',
    requestStatus: request.status,
    kanbanStatus: request.kanban_status || 'todo',
    driveLink: request.drive_link ?? '',
    priority: request.priority,
    dueDate: request.due_date,
    createdAt: request.created_at?.slice(0, 10),
    approvedAt: request.approved_at?.slice(0, 10) ?? null,
    rejectedAt: request.rejected_at?.slice(0, 10) ?? null,
    cancelledAt: request.cancelled_at?.slice(0, 10) ?? null,
    rejectionReason: request.rejection_reason ?? null,
    generatedTaskId: request.generated_task_id ?? null,
    archived: request.archived ?? false,
    archivedAt: request.archived_at ?? null,
    archivedByName: request.archived_by_name ?? null,
  };
}

export async function fetchRemoteRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .or(`from_sector.neq.${purchaseRequestSource},to_sector.neq.${purchaseRequestTargetSector}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapRequestFromDb);
}

export async function createRemoteRequest(values, currentUser) {
  const { data, error } = await supabase.rpc('create_general_request', {
    p_target_sector_name: values.targetSector,
    p_step_name: values.stepName.trim(),
    p_description: (values.description ?? '').trim(),
    p_responsible_name: values.responsibleName?.trim() || null,
    p_kanban_status: values.kanbanStatus || 'todo',
    p_priority: values.priority,
    p_due_date: values.dueDate,
    p_drive_link: values.driveLink?.trim() || null,
  });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function updateRemoteRequest(requestId, values) {
  const { data, error } = await supabase.rpc('update_pending_request', {
    p_request_id: requestId,
    p_target_sector_name: values.targetSector,
    p_step_name: values.stepName.trim(),
    p_description: (values.description ?? '').trim(),
    p_responsible_name: values.responsibleName?.trim() || null,
    p_kanban_status: values.kanbanStatus,
    p_priority: values.priority,
    p_due_date: values.dueDate,
    p_drive_link: values.driveLink?.trim() || null,
  });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function cancelRemoteRequest(requestId) {
  const { data, error } = await supabase.rpc('cancel_request', { p_request_id: requestId });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function approveRequestRpc(requestId) {
  const { data, error } = await supabase.rpc('approve_request', { p_request_id: requestId });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function rejectRequestRpc(requestId, reason) {
  const { data, error } = await supabase.rpc('reject_request', { p_request_id: requestId, p_reason: reason });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function archiveRequestRpc(requestId) {
  const { data, error } = await supabase.rpc('archive_request', { p_request_id: requestId });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function restoreRequestRpc(requestId) {
  const { data, error } = await supabase.rpc('restore_request', { p_request_id: requestId });
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function deleteArchivedRequestHistory(requestIds) {
  if (!requestIds.length) return;
  const { error } = await supabase.rpc('delete_archived_request_history', { p_request_ids: requestIds });
  if (error) throw error;
}

export function subscribeToRequests(onChange) {
  return supabase
    .channel('requests:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, onChange)
    .subscribe();
}
