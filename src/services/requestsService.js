import { supabase } from '../lib/supabase';
import { purchaseRequestSource, purchaseRequestTargetSector } from '../data/purchaseRequestsData';
import { fetchSectorIdByName } from './sectorsService';

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
    priority: request.priority,
    dueDate: request.due_date,
    createdAt: request.created_at?.slice(0, 10),
    approvedAt: request.approved_at?.slice(0, 10) ?? null,
    rejectedAt: request.rejected_at?.slice(0, 10) ?? null,
    cancelledAt: request.cancelled_at?.slice(0, 10) ?? null,
    rejectionReason: request.rejection_reason ?? null,
    generatedTaskId: request.generated_task_id ?? null,
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
  const [requesterSectorId, targetSectorId] = await Promise.all([
    currentUser.sectorId ? Promise.resolve(currentUser.sectorId) : fetchSectorIdByName(currentUser.sector),
    fetchSectorIdByName(values.targetSector),
  ]);

  const payload = {
    title: values.stepName.trim(),
    description: (values.description ?? '').trim(),
    step_name: values.stepName.trim(),
    from_sector: currentUser.sector,
    to_sector: values.targetSector,
    requester_sector_id: requesterSectorId,
    target_sector_id: targetSectorId,
    requester_id: currentUser.id,
    requester_name: currentUser.name,
    responsible_name: values.responsibleName?.trim() || null,
    status: 'pending_approval',
    kanban_status: values.kanbanStatus || 'todo',
    priority: values.priority,
    due_date: values.dueDate || null,
    organization_id: currentUser.organizationId,
  };

  const { data, error } = await supabase.from('requests').insert(payload).select('*').single();
  if (error) throw error;

  await supabase.from('notifications').insert({
    organization_id: currentUser.organizationId,
    recipient_sector_id: targetSectorId,
    actor_profile_id: currentUser.id,
    title: 'Nova solicitacao recebida',
    message: `Nova solicitacao recebida de ${currentUser.sector}: ${data.title}.`,
    category: 'Solicitacoes',
    type: 'request_created',
    target_sector_name: values.targetSector,
    target_user_name: values.responsibleName || null,
  });

  return mapRequestFromDb(data);
}

export async function updateRemoteRequest(requestId, values) {
  const targetSectorId = values.targetSector ? await fetchSectorIdByName(values.targetSector) : undefined;

  const payload = {
    title: values.stepName.trim(),
    description: (values.description ?? '').trim(),
    step_name: values.stepName.trim(),
    to_sector: values.targetSector,
    target_sector_id: targetSectorId,
    responsible_name: values.responsibleName?.trim() || null,
    kanban_status: values.kanbanStatus,
    priority: values.priority,
    due_date: values.dueDate || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('requests').update(payload).eq('id', requestId).select('*').single();
  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function cancelRemoteRequest(requestId) {
  const { data, error } = await supabase
    .from('requests')
    .update({ status: 'canceled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*')
    .single();

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

export function subscribeToRequests(onChange) {
  return supabase
    .channel('requests:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, onChange)
    .subscribe();
}
