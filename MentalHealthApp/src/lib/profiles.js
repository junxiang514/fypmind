import { supabase } from './supabase';

function normalizeDateOfBirth(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed;
}

export async function getAuthedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function fetchMyProfile() {
  const user = await getAuthedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, date_of_birth, gender, medical_history, avatar_url, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const fallback = {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    email: user.email ?? '',
    phone: '',
    date_of_birth: null,
    gender: '',
    medical_history: '',
    avatar_url: null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .upsert(fallback, { onConflict: 'id' })
    .select('id, full_name, email, phone, date_of_birth, gender, medical_history, avatar_url, updated_at')
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function updateMyProfile(patch) {
  const user = await getAuthedUser();
  if (!user) throw new Error('Not authenticated');

  const payload = {
    id: user.id,
    ...patch,
    date_of_birth: normalizeDateOfBirth(patch?.date_of_birth),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, full_name, email, phone, date_of_birth, gender, medical_history, avatar_url, updated_at')
    .single();

  if (error) throw error;
  return data;
}
