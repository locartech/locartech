import {
  purchaseRequestSource,
  purchaseRequestTargetSector,
} from '../data/purchaseRequestsData';
import { supabase } from '../lib/supabase';
import {
  encodePurchaseDescription,
  normalizePurchaseRequest,
} from '../utils/purchaseRequestUtils';

export async function fetchRemotePurchaseRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('from_sector', purchaseRequestSource)
    .eq('to_sector', purchaseRequestTargetSector)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(normalizePurchaseRequest);
}

export async function createRemotePurchaseRequest(values) {
  const { data, error } = await supabase.rpc('create_purchase_request', {
    p_description: encodePurchaseDescription(values),
    p_requester_name: values.requesterName.trim(),
    p_priority: values.priority,
    p_due_date: values.dueDate,
  });

  if (error) throw error;
  return normalizePurchaseRequest(data);
}

export async function updateRemotePurchaseRequestStatus(requestId, status) {
  const { data, error } = await supabase.rpc('update_purchase_request_status', {
    p_request_id: requestId,
    p_status: status,
  });

  if (error) throw error;
  return data ? normalizePurchaseRequest(data) : null;
}

export async function archiveRemotePurchaseRequest(requestId) {
  const { data, error } = await supabase.rpc('archive_request', { p_request_id: requestId });
  if (error) throw error;
  return normalizePurchaseRequest(data);
}

export async function restoreRemotePurchaseRequest(requestId) {
  const { data, error } = await supabase.rpc('restore_request', { p_request_id: requestId });
  if (error) throw error;
  return normalizePurchaseRequest(data);
}

export function subscribeToPurchaseRequests(onChange) {
  return supabase
    .channel('purchase-requests:compras')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests' },
      (payload) => {
        const next = payload.new || payload.old;
        if (
          next?.from_sector === purchaseRequestSource &&
          next?.to_sector === purchaseRequestTargetSector
        ) {
          onChange();
        }
      },
    )
    .subscribe();
}
