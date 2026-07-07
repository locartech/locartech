import { supabase } from '../lib/supabase';
import { mapProfileFromDb, mapProfileToDb, getInitials } from '../utils/profileMapper';

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data.map(mapProfileFromDb);
}

export async function fetchProfileByAuthUser(authUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function fetchProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function createPendingProfile(values, authUserId = null) {
  const payload = {
    auth_user_id: authUserId,
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    sector: values.sector,
    role: values.role.trim(),
    account_type: values.accountType || 'member',
    status: values.status || 'Pendente',
    avatar_initials: getInitials(values.name),
  };

  const { data, error } = await supabase.from('profiles').insert(payload).select('*').single();
  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function updateProfile(memberId, values) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...mapProfileToDb(values), updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function updateProfileStatus(memberId, status) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function deleteProfile(memberId) {
  const { error } = await supabase.from('profiles').delete().eq('id', memberId);
  if (error) throw error;
}

export async function updateProfilePhoto(memberId, photoUrl) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
    .eq('id', memberId)
    .select('*')
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function touchLastAccess(memberId) {
  await supabase.from('profiles').update({ last_access: new Date().toISOString() }).eq('id', memberId);
}
