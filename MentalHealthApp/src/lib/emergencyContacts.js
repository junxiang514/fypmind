import { supabase } from './supabase';

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data?.user?.id;
  if (!id) throw new Error('No authenticated user.');
  return id;
}

export async function listEmergencyContacts() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('id, user_id, name, relationship, phone, notes, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(3);

  if (error) throw error;
  return data ?? [];
}

// Backwards-compatible helper that returns the most recent contact (or null)
export async function fetchEmergencyContact() {
  const contacts = await listEmergencyContacts();
  return contacts[0] ?? null;
}

export async function saveEmergencyContact(payload) {
  const userId = await getCurrentUserId();

  const body = {
    user_id: userId,
    name: payload?.name?.trim() || null,
    relationship: payload?.relationship?.trim() || null,
    phone: payload?.phone?.trim() || null,
    notes: payload?.notes?.trim() || null,
  };

  // Only include id when updating an existing contact
  if (payload?.id) {
    body.id = payload.id;
  }

  if (!body.name || !body.phone) {
    throw new Error('Name and phone are required.');
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .upsert(body, { onConflict: 'id' })
    .select('id, user_id, name, relationship, phone, notes, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmergencyContact(id) {
  if (!id) return;

  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
