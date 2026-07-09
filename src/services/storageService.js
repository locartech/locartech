import { supabase } from '../lib/supabase';

const AVATAR_BUCKET = 'avatars';

function extensionFromFile(file) {
  const fromName = file.name?.split('.').pop();
  if (fromName) return fromName.toLowerCase();
  return (file.type?.split('/').pop() || 'png').toLowerCase();
}

export async function uploadAvatar(authUserId, file) {
  const path = `${authUserId}/avatar-${Date.now()}.${extensionFromFile(file)}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeAvatar(authUserId) {
  const { data: files, error: listError } = await supabase.storage.from(AVATAR_BUCKET).list(authUserId);
  if (listError) throw listError;

  if (files?.length) {
    const paths = files.map((file) => `${authUserId}/${file.name}`);
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) throw removeError;
  }
}
