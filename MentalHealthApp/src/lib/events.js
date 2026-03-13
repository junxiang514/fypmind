import { supabase } from './supabase';

const SAMPLE_EVENTS = [
  {
    id: 'sample-event-1',
    title: 'Mindfulness Walk',
    description: 'A guided mindfulness walk to practice breathing and awareness.',
    category: 'Activity',
    start_at: null,
    end_at: null,
    location: 'Community Park',
    address: '',
    latitude: null,
    longitude: null,
  },
  {
    id: 'sample-event-2',
    title: 'Mental Health Talk: Coping Skills',
    description: 'A short educational talk and Q&A session.',
    category: 'Event',
    start_at: null,
    end_at: null,
    location: 'Community Hall',
    address: '',
    latitude: null,
    longitude: null,
  },
];

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /does not exist/i.test(message);
}

export async function listEvents({ query, limit = 50 } = {}) {
  let request = supabase
    .from('events')
    .select('id, title, description, category, start_at, end_at, location, address, latitude, longitude, created_at')
    .order('start_at', { ascending: true, nullsFirst: false })
    .limit(limit);

  const trimmedQuery = (query ?? '').trim();
  if (trimmedQuery) {
    request = request.ilike('title', `%${trimmedQuery}%`);
  }

  const { data, error } = await request;
  if (error) {
    if (shouldFallback(error)) return SAMPLE_EVENTS;
    throw error;
  }

  return data ?? [];
}

export async function getEventById(id) {
  if (!id) throw new Error('Missing event id');

  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, category, start_at, end_at, location, address, latitude, longitude, created_at')
    .eq('id', id)
    .single();

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
