import { supabase } from './supabase';

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(message);
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

export async function getProviderFinderPreferences() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_preferences')
    .select('auto_use_location')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return {
    autoUseLocation: Boolean(data?.auto_use_location),
  };
}

export async function saveProviderFinderPreferences({ autoUseLocation }) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const payload = {
    user_id: userId,
    auto_use_location: Boolean(autoUseLocation),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('auto_use_location')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return {
    autoUseLocation: Boolean(data?.auto_use_location),
  };
}
