import { supabase } from './supabase';

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data?.user?.id;
  if (!id) throw new Error('No authenticated user.');
  return id;
}

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(message);
}

export async function getClinicalToolsReminderPreference() {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('clinical_tools_hide_info_reminder')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (shouldFallback(error)) return false;
      throw error;
    }

    return data?.clinical_tools_hide_info_reminder === true;
  } catch (err) {
    console.warn('Failed to get clinical tools reminder preference', err);
    return false;
  }
}

export async function setClinicalToolsReminderPreference(hideReminder) {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('user_preferences')
      .update({ clinical_tools_hide_info_reminder: hideReminder })
      .eq('user_id', userId);

    if (error) {
      if (shouldFallback(error)) return;
      throw error;
    }
  } catch (err) {
    console.warn('Failed to set clinical tools reminder preference', err);
  }
}
