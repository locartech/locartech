import { supabase } from '../lib/supabase';
import { fetchSectorIdByName } from './sectorsService';

function mapRecordFromDb(record) {
  return {
    id: record.id,
    sector: record.sector,
    title: record.title,
    description: record.description,
    type: record.type,
    responsible: record.responsible,
    publishedAt: record.published_at,
    driveLink: record.drive_link,
    createdAt: record.created_at?.slice(0, 10),
    updatedAt: record.updated_at?.slice(0, 10),
  };
}

async function mapRecordToDb(sector, values, organizationId) {
  return {
    sector,
    sector_ref_id: await fetchSectorIdByName(sector).catch(() => null),
    title: values.title.trim(),
    description: (values.description ?? '').trim(),
    type: values.type,
    responsible: (values.responsible ?? '').trim(),
    published_at: values.publishedAt,
    drive_link: (values.driveLink ?? '').trim(),
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchKnowledgeRecords() {
  const { data, error } = await supabase
    .from('knowledge_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapRecordFromDb);
}

export async function createRemoteKnowledgeRecord(sector, values, organizationId) {
  const payload = await mapRecordToDb(sector, values, organizationId);
  const { data, error } = await supabase
    .from('knowledge_records')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return mapRecordFromDb(data);
}

export async function updateRemoteKnowledgeRecord(recordId, sector, values, organizationId) {
  const payload = await mapRecordToDb(sector, values, organizationId);
  const { data, error } = await supabase
    .from('knowledge_records')
    .update(payload)
    .eq('id', recordId)
    .select('*')
    .single();

  if (error) throw error;
  return mapRecordFromDb(data);
}

export async function deleteRemoteKnowledgeRecord(recordId) {
  const { error } = await supabase.from('knowledge_records').delete().eq('id', recordId);
  if (error) throw error;
}

export function subscribeToKnowledge(onChange) {
  return supabase
    .channel('knowledge:records')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_records' }, onChange)
    .subscribe();
}
