import { supabase } from './supabase';

const SAMPLE_CONTENT = [
  {
    id: 'sample-1',
    title: 'Understanding Stress',
    summary: 'What stress is, common triggers, and healthy coping strategies.',
    category: 'Wellbeing',
    video_url: null,
    body: 'Stress is a normal response to challenges. Helpful coping strategies include sleep, exercise, and social support.',
  },
  {
    id: 'sample-2',
    title: 'Basics of Anxiety',
    summary: 'Recognize symptoms and learn simple grounding techniques.',
    category: 'Anxiety',
    video_url: null,
    body: 'Anxiety can involve worry, restlessness, and physical sensations. Try box breathing and grounding (5-4-3-2-1).',
  },
];

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /does not exist/i.test(message);
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

export async function listEducationalContents({ query, limit = 50 } = {}) {
  let request = supabase
    .from('educational_contents')
    .select('id, title, summary, category, video_url, quiz_payload, activity_payload, body, created_at')
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
    .select('id, title, summary, category, video_url, quiz_payload, activity_payload, body, created_at')
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

export async function getMyEducationalProgress(contentId) {
  if (!contentId) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('educational_content_progress')
    .select('id, user_id, content_id, completed_steps, progress_percent, last_step, quiz_score, quiz_completed, updated_at')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data || null;
}

export async function getMyEducationalProgressMap(contentIds = []) {
  const ids = Array.isArray(contentIds)
    ? contentIds.map((x) => String(x || '').trim()).filter(Boolean)
    : [];

  if (!ids.length) return {};

  const userId = await getCurrentUserId();
  if (!userId) return {};

  const { data, error } = await supabase
    .from('educational_content_progress')
    .select('content_id, progress_percent, quiz_score, quiz_completed, updated_at')
    .eq('user_id', userId)
    .in('content_id', ids);

  if (error) {
    if (shouldFallback(error)) return {};
    throw error;
  }

  return (data || []).reduce((acc, row) => {
    acc[String(row.content_id)] = row;
    return acc;
  }, {});
}

export async function saveMyEducationalProgress({
  contentId,
  completedSteps = {},
  progressPercent = 0,
  lastStep = null,
  quizScore = null,
  quizCompleted = false,
} = {}) {
  if (!contentId) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const payload = {
    user_id: userId,
    content_id: contentId,
    completed_steps: completedSteps,
    progress_percent: progressPercent,
    last_step: lastStep,
    quiz_score: Number.isFinite(quizScore) ? quizScore : null,
    quiz_completed: Boolean(quizCompleted),
  };

  const { data, error } = await supabase
    .from('educational_content_progress')
    .upsert(payload, { onConflict: 'user_id,content_id' })
    .select('id, user_id, content_id, completed_steps, progress_percent, last_step, quiz_score, quiz_completed, updated_at')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data;
}

export async function saveMyEducationalFeedback({ contentId, rating = null, feedbackText = '' } = {}) {
  if (!contentId) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const payload = {
    user_id: userId,
    content_id: contentId,
    rating: Number.isFinite(rating) ? rating : null,
    feedback_text: String(feedbackText || '').trim() || null,
  };

  const { data, error } = await supabase
    .from('educational_content_feedback')
    .upsert(payload, { onConflict: 'user_id,content_id' })
    .select('id, user_id, content_id, rating, feedback_text, updated_at')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data;
}
