import { supabase } from '../lib/supabase';

const localSectors = [
  {
    id: 'local-projetos',
    organizationId: null,
    slug: 'projetos',
    name: 'Projetos',
    description: 'Projetos',
    initialManagerName: null,
  },
];

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

function mergeLocalSectors(sectors) {
  const knownSlugs = new Set(sectors.map((sector) => sector.slug));
  const knownNames = new Set(sectors.map((sector) => sector.name.toLowerCase()));
  const merged = [
    ...sectors,
    ...localSectors.filter(
      (sector) => !knownSlugs.has(sector.slug) && !knownNames.has(sector.name.toLowerCase()),
    ),
  ];

  return merged.sort((a, b) => {
    if (a.slug === 'projetos') return 1;
    if (b.slug === 'projetos') return -1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export async function fetchSectors() {
  const { data, error } = await supabase.from('sectors').select('*').order('name', { ascending: true });
  if (error) throw error;
  return mergeLocalSectors(data.map(mapSectorFromDb));
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
