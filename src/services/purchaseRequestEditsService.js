import { supabase } from '../lib/supabase';

function mapEditFromDb(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    requesterId: row.requester_id,
    status: row.status,
    proposedDescription: row.proposed_description,
    proposedNotes: row.proposed_notes,
    proposedWorkLocation: row.proposed_work_location,
    proposedPriority: row.proposed_priority,
    proposedDueDate: row.proposed_due_date,
    reason: row.reason ?? '',
    reviewNote: row.review_note ?? '',
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPurchaseRequestEdits() {
  const { data, error } = await supabase
    .from('purchase_request_edit_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapEditFromDb);
}

export async function createPurchaseRequestEdit(requestId, values) {
  const { data, error } = await supabase.rpc('create_purchase_request_edit', {
    p_request_id: requestId,
    p_description: values.description.trim(),
    p_notes: (values.notes ?? '').trim(),
    p_work_location: (values.workLocation ?? '').trim(),
    p_priority: values.priority,
    p_due_date: values.dueDate,
    p_reason: (values.reason ?? '').trim(),
  });

  if (error) throw error;
  return mapEditFromDb(data);
}

export async function reviewPurchaseRequestEdit(editId, approve, reviewNote) {
  const { data, error } = await supabase.rpc('review_purchase_request_edit', {
    p_edit_id: editId,
    p_approve: approve,
    p_review_note: (reviewNote ?? '').trim() || null,
  });

  if (error) throw error;
  return mapEditFromDb(data);
}

export function subscribeToPurchaseRequestEdits(onChange) {
  return supabase
    .channel('purchase-request-edits')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_request_edit_requests' }, onChange)
    .subscribe();
}
