import { supabase } from '../lib/supabase';

function normalizeStatus(status) {
  return status || 'pending';
}

function mapRequestFromDb(request) {
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    requesterName: request.requester_name,
    requesterSector: request.from_sector,
    targetSector: request.to_sector,
    responsibleName: request.responsible_name,
    status: normalizeStatus(request.status),
    priority: request.priority?.toLowerCase?.() ?? request.priority,
    createdAt: request.created_at?.slice(0, 10),
    dueDate: request.due_date,
    completedAt: request.status === 'completed' ? request.updated_at?.slice(0, 10) : null,
  };
}

function mapRequestToDb(values, currentUser) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    from_sector: currentUser.sector,
    to_sector: values.targetSector,
    requester_id: currentUser.id,
    requester_name: currentUser.name,
    responsible_name: values.responsibleName?.trim() || null,
    status: values.status || 'pending',
    priority: values.priority,
    due_date: values.dueDate || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchRemoteRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapRequestFromDb);
}

export async function createRemoteRequest(values, currentUser) {
  const { data, error } = await supabase
    .from('requests')
    .insert(mapRequestToDb(values, currentUser))
    .select('*')
    .single();

  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function updateRemoteRequest(requestId, values, currentUser) {
  const { data, error } = await supabase
    .from('requests')
    .update(mapRequestToDb(values, currentUser))
    .eq('id', requestId)
    .select('*')
    .single();

  if (error) throw error;
  return mapRequestFromDb(data);
}

export async function updateRemoteRequestStatus(requestId, status) {
  const { data, error } = await supabase
    .from('requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*')
    .single();

  if (error) throw error;
  return mapRequestFromDb(data);
}

export function subscribeToRequests(onChange) {
  return supabase
    .channel('requests:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, onChange)
    .subscribe();
}
