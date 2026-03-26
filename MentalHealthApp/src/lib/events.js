import { supabase } from './supabase';

const SAMPLE_EVENTS = [
  {
    id: 'sample-event-1',
    title: 'Mindfulness Walk',
    description: 'A guided mindfulness walk to practice breathing and awareness.',
    detailed_description: 'A guided mindfulness walk to practice breathing and awareness in nature.',
    objective: 'Help participants reduce stress with practical grounding techniques.',
    agenda: 'Welcome (10m)\nGuided walk (35m)\nBreathing practice (10m)\nReflection (5m)',
    category: 'Activity',
    start_at: null,
    end_at: null,
    location: 'Community Park',
    address: '',
    fee: 'Free',
    location_link: '',
    image_urls: [],
  },
  {
    id: 'sample-event-2',
    title: 'Mental Health Talk: Coping Skills',
    description: 'A short educational talk and Q&A session.',
    detailed_description: 'A short educational talk and Q&A session led by a mental health professional.',
    objective: 'Teach evidence-based coping skills for daily stress and anxiety.',
    agenda: 'Talk (45m)\nCase examples (20m)\nQ&A (25m)',
    category: 'Event',
    start_at: null,
    end_at: null,
    location: 'Community Hall',
    address: '',
    fee: 'Free',
    location_link: '',
    image_urls: [],
  },
];

const EVENT_SELECT_WITH_DETAILS =
  'id, title, description, detailed_description, objective, agenda, category, start_at, end_at, location, address, fee, location_link, image_urls, created_at';

const EVENT_SELECT_BASE =
  'id, title, description, detailed_description, category, start_at, end_at, location, address, fee, location_link, image_urls, created_at';

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(message);
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

async function queryEvents({ query, limit, withDetails = true } = {}) {
  let request = supabase
    .from('events')
    .select(withDetails ? EVENT_SELECT_WITH_DETAILS : EVENT_SELECT_BASE)
    .order('start_at', { ascending: true, nullsFirst: false });

  if (Number.isFinite(limit)) {
    request = request.limit(limit);
  }

  const trimmedQuery = String(query || '').trim();
  if (trimmedQuery) {
    request = request.ilike('title', `%${trimmedQuery}%`);
  }

  return request;
}

async function queryEventById(id, withDetails = true) {
  return supabase
    .from('events')
    .select(withDetails ? EVENT_SELECT_WITH_DETAILS : EVENT_SELECT_BASE)
    .eq('id', id)
    .single();
}

export async function listEvents({ query, limit = 50 } = {}) {
  let { data, error } = await queryEvents({ query, limit, withDetails: true });

  // Backward compatibility if objective/agenda columns are not migrated yet.
  if (error?.code === '42703') {
    ({ data, error } = await queryEvents({ query, limit, withDetails: false }));
  }

  if (error) {
    if (shouldFallback(error)) return SAMPLE_EVENTS;
    throw error;
  }

  return data ?? [];
}

export async function getEventById(id) {
  if (!id) throw new Error('Missing event id');

  let { data, error } = await queryEventById(id, true);

  // Backward compatibility if objective/agenda columns are not migrated yet.
  if (error?.code === '42703') {
    ({ data, error } = await queryEventById(id, false));
  }

  if (error) {
    if (shouldFallback(error)) {
      const fallback = SAMPLE_EVENTS.find((x) => String(x.id) === String(id));
      if (!fallback) throw new Error('Event not found.');
      return fallback;
    }
    throw error;
  }

  return data;
}

export async function getMyEventPreference(eventId) {
  if (!eventId) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_saved_events')
    .select('id, user_id, event_id, is_saved, updated_at')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data || null;
}

export async function saveMyEventPreference({
  eventId,
  isSaved = true,
} = {}) {
  if (!eventId) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const payload = {
    user_id: userId,
    event_id: eventId,
    is_saved: Boolean(isSaved),
  };

  const { data, error } = await supabase
    .from('user_saved_events')
    .upsert(payload, { onConflict: 'user_id,event_id' })
    .select('id, user_id, event_id, is_saved, updated_at')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data;
}

export async function listMySavedEventIds() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_saved_events')
    .select('event_id')
    .eq('user_id', userId)
    .eq('is_saved', true);

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return (data || []).map((row) => String(row.event_id)).filter(Boolean);
}
