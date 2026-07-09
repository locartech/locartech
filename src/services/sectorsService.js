import { supabase } from '../lib/supabase';

function mapSectorFromDb(sector) {
  if (!sector) return null;
  return {
    id: sector.id,
    organizationId: sector.organization_id,
    slug: sector.slug,
    name: sector.name,
    description: sector.description,
    initialManagerName: sector.initial_manager_name,
  };
}

export async function fetchSectors() {
  const { data, error } = await supabase.from('sectors').select('*').order('name', { ascending: true });
  if (error) throw error;
  return data.map(mapSectorFromDb);
}

export async function fetchSectorIdByName(name) {
  if (!name) return null;
  const { data, error } = await supabase
    .from('sectors')
    .select('id')
    .ilike('name', name.trim())
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}
