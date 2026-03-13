import { supabase } from './supabase';

const SAMPLE_CONTENT = [
  {
    id: 'sample-1',
    title: 'Understanding Stress',
    summary: 'What stress is, common triggers, and healthy coping strategies.',
    category: 'Wellbeing',
    body: 'Stress is a normal response to challenges. Helpful coping strategies include sleep, exercise, and social support.',
  },
  {
    id: 'sample-2',
    title: 'Basics of Anxiety',
    summary: 'Recognize symptoms and learn simple grounding techniques.',
    category: 'Anxiety',
    body: 'Anxiety can involve worry, restlessness, and physical sensations. Try box breathing and grounding (5-4-3-2-1).',
  },
];

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /does not exist/i.test(message);
}

export async function listEducationalContents({ query, limit = 50 } = {}) {
  let request = supabase
    .from('educational_contents')
    .select('id, title, summary, category, body, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  const trimmedQuery = (query ?? '').trim();
  if (trimmedQuery) {
    request = request.ilike('title', `%${trimmedQuery}%`);
  }

  const { data, error } = await request;
  if (error) {
    if (shouldFallback(error)) return SAMPLE_CONTENT;
    throw error;
  }

  return data ?? [];
}

export async function getEducationalContentById(id) {
  if (!id) throw new Error('Missing content id');

  const { data, error } = await supabase
    .from('educational_contents')
    .select('id, title, summary, category, body, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (shouldFallback(error)) {
      const fallback = SAMPLE_CONTENT.find((x) => String(x.id) === String(id));
      if (!fallback) throw new Error('Content not found.');
      return fallback;
    }
    throw error;
  }

  return data;
}
