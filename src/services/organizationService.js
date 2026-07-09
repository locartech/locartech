import { supabase } from '../lib/supabase';

function mapOrganizationFromDb(org) {
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    adminProfileId: org.admin_profile_id,
  };
}

export async function fetchOrganization() {
  const { data, error } = await supabase.from('organizations').select('*').maybeSingle();
  if (error) throw error;
  return mapOrganizationFromDb(data);
}

export async function transferAdmin(newAdminProfileId) {
  const { data, error } = await supabase.rpc('transfer_admin', { p_new_admin_profile_id: newAdminProfileId });
  if (error) throw error;
  return mapOrganizationFromDb(data);
}
