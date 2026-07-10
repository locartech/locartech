import {
  purchaseRequestSource,
  purchaseRequestTargetSector,
} from '../data/purchaseRequestsData';
import { supabase } from '../lib/supabase';
import {
  encodePurchaseDescription,
  getPurchaseRequestTitle,
  normalizePurchaseRequest,
} from '../utils/purchaseRequestUtils';
import { fetchSectorIdByName } from './sectorsService';

async function mapPurchaseRequestToDb(values, currentUser) {
  const targetSectorId = await fetchSectorIdByName(purchaseRequestTargetSector).catch(() => null);
  const title = getPurchaseRequestTitle(values);

  return {
    title,
    description: encodePurchaseDescription(values),
    step_name: title,
    from_sector: purchaseRequestSource,
    to_sector: purchaseRequestTargetSector,
    requester_sector_id: currentUser.sectorId ?? null,
    target_sector_id: targetSectorId,
    requester_id: currentUser.id,
    requester_name: values.requesterName.trim(),
    responsible_name: null,
    status: 'nova',
    kanban_status: 'todo',
    priority: values.priority,
    due_date: values.dueDate,
    organization_id: currentUser.organizationId ?? null,
    updated_at: new Date().toISOString(),
  };
}

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

export async function createRemotePurchaseRequest(values, currentUser) {
  const payload = await mapPurchaseRequestToDb(values, currentUser);
  const { data, error } = await supabase
    .from('requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return normalizePurchaseRequest(data);
}

export async function updateRemotePurchaseRequestStatus(requestId, status) {
  const { data, error } = await supabase
    .from('requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select('*')
    .single();

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
