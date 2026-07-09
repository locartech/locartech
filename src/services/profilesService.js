import { supabase } from '../lib/supabase';
import { mapProfileFromDb, mapProfileToDb } from '../utils/profileMapper';
import { fetchSectorIdByName } from './sectorsService';

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
  const sectorId = await fetchSectorIdByName(values.sector);

  const { data, error } = await supabase.rpc('create_pending_profile', {
    p_auth_user_id: authUserId,
    p_name: values.name.trim(),
    p_email: values.email.trim().toLowerCase(),
    p_sector_id: sectorId,
    p_role: values.role.trim(),
  });

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function updateProfile(memberId, values) {
  const sectorId = values.sectorId ?? (values.sector ? await fetchSectorIdByName(values.sector) : undefined);

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...mapProfileToDb({ ...values, sectorId }), updated_at: new Date().toISOString() })
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

export async function approveMemberRpc(profileId) {
  const { data, error } = await supabase.rpc('approve_member', { p_profile_id: profileId });
  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function rejectMemberRpc(profileId) {
  const { data, error } = await supabase.rpc('reject_member', { p_profile_id: profileId });
  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function deactivateMemberRpc(profileId) {
  const { data, error } = await supabase.rpc('deactivate_member', { p_profile_id: profileId });
  if (error) throw error;
  return mapProfileFromDb(data);
}
