import { supabase } from './supabase';

const DEFAULT_OPTIONS = [
  { label: 'Very poor', value: 1 },
  { label: 'Poor', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'Good', value: 4 },
  { label: 'Excellent', value: 5 },
];

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(message);
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

export async function listActiveWellbeingQuestions() {
  const { data, error } = await supabase
    .from('wellbeing_questions')
    .select('id, category, prompt, answer_type, options, is_active')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return data || [];
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function buildRandomQuestionSet(allQuestions, count = 6) {
  if (!Array.isArray(allQuestions) || !allQuestions.length) return [];

  const byCategory = allQuestions.reduce((acc, q) => {
    const key = String(q?.category || 'General').trim() || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  const picked = [];

  // First pass: one per category
  Object.values(byCategory).forEach((group) => {
    const choices = shuffle(group);
    if (choices[0]) picked.push(choices[0]);
  });

  // Fill remaining from all questions
  if (picked.length < count) {
    const usedIds = new Set(picked.map((x) => x.id));
    const remaining = shuffle(allQuestions).filter((x) => !usedIds.has(x.id));
    while (picked.length < count && remaining.length) {
      picked.push(remaining.shift());
    }
  }

  return shuffle(picked).slice(0, count).map((q) => ({
    ...q,
    options: Array.isArray(q?.options) && q.options.length ? q.options : DEFAULT_OPTIONS,
  }));
}

export async function saveDailyAssessmentEntry({ moodScore, notes, questionSet, answersByQuestionId }) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const answers = (questionSet || [])
    .map((q) => {
      const selected = answersByQuestionId?.[q.id];
      return {
        question_id: q.id,
        category: q.category,
        prompt: q.prompt,
        value: selected?.value ?? null,
        label: selected?.label ?? null,
      };
    })
    .filter((row) => row.question_id);

  const numericAnswers = answers
    .map((x) => Number(x.value))
    .filter((x) => Number.isFinite(x));

  const averageScore = numericAnswers.length
    ? Number((numericAnswers.reduce((sum, x) => sum + x, 0) / numericAnswers.length).toFixed(2))
    : null;

  const payload = {
    user_id: userId,
    mood_score: moodScore,
    notes: notes?.trim() || null,
    total_questions: answers.length,
    average_score: averageScore,
    responses: answers,
  };

  const { data, error } = await supabase
    .from('daily_assessment_entries')
    .insert(payload)
    .select('id, created_at')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data;
}

export async function listDailyAssessmentTrend(days = 14) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const start = new Date();
  start.setDate(start.getDate() - Math.max(1, days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('daily_assessment_entries')
    .select('created_at, mood_score, average_score')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  const map = new Map();
  (data || []).forEach((row) => {
    const d = new Date(row.created_at);
    const key = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    if (!key) return;
    const prev = map.get(key) || { count: 0, moodSum: 0, wellbeingSum: 0, wellbeingCount: 0 };
    const mood = Number(row.mood_score);
    const wellbeing = Number(row.average_score);

    if (Number.isFinite(mood)) prev.moodSum += mood;
    if (Number.isFinite(wellbeing)) {
      prev.wellbeingSum += wellbeing;
      prev.wellbeingCount += 1;
    }

    prev.count += 1;
    map.set(key, prev);
  });

  return Array.from(map.entries()).map(([date, stat]) => ({
    date,
    mood: stat.count ? Number((stat.moodSum / stat.count).toFixed(2)) : null,
    wellbeing: stat.wellbeingCount ? Number((stat.wellbeingSum / stat.wellbeingCount).toFixed(2)) : null,
  }));
}

export async function listDailyAssessmentCalendar(monthDate = new Date()) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data, error } = await supabase
    .from('daily_assessment_entries')
    .select('created_at, mood_score, average_score')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  const map = new Map();
  (data || []).forEach((row) => {
    const d = new Date(row.created_at);
    const key = Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    if (!key) return;

    const prev = map.get(key) || {
      date: key,
      checkins: 0,
      moodSum: 0,
      wellbeingSum: 0,
      wellbeingCount: 0,
    };

    const mood = Number(row.mood_score);
    const wellbeing = Number(row.average_score);

    if (Number.isFinite(mood)) prev.moodSum += mood;
    if (Number.isFinite(wellbeing)) {
      prev.wellbeingSum += wellbeing;
      prev.wellbeingCount += 1;
    }

    prev.checkins += 1;
    map.set(key, prev);
  });

  return Array.from(map.values()).map((row) => ({
    date: row.date,
    checkins: row.checkins,
    mood: row.checkins ? Number((row.moodSum / row.checkins).toFixed(2)) : null,
    wellbeing: row.wellbeingCount ? Number((row.wellbeingSum / row.wellbeingCount).toFixed(2)) : null,
  }));
}

export async function listDailyAssessmentDetailsByDate(dateIso) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  if (!dateIso) return [];

  const start = new Date(`${dateIso}T00:00:00.000Z`);
  const end = new Date(`${dateIso}T23:59:59.999Z`);

  const { data, error } = await supabase
    .from('daily_assessment_entries')
    .select('id, created_at, mood_score, average_score, responses')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return (data || []).map((entry) => ({
    ...entry,
    responses: Array.isArray(entry.responses) ? entry.responses : [],
  }));
}

export async function listRecentDailyAssessmentEntries(days = 14, limit = 12) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const start = new Date();
  start.setDate(start.getDate() - Math.max(1, days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('daily_assessment_entries')
    .select('id, created_at, mood_score, average_score, responses')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: false })
    .limit(Math.max(1, limit));

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return (data || []).map((entry) => ({
    ...entry,
    responses: Array.isArray(entry.responses) ? entry.responses : [],
  }));
}
