import { supabase } from './supabase';

const FALLBACK_TOOLS = [
  { id: 'phq-9', code: 'PHQ9', name: 'Patient Health Questionnaire (PHQ-9)', description: 'Depression screening tool', duration_minutes: 5, target_condition: 'Depression', item_count: 9, administration_note: 'Past 2 weeks, self-report.', interpretation_guide: '0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe.' },
  { id: 'gad-7', code: 'GAD7', name: 'Generalized Anxiety Disorder (GAD-7)', description: 'Anxiety screening tool', duration_minutes: 4, target_condition: 'Anxiety', item_count: 7, administration_note: 'Past 2 weeks, self-report.', interpretation_guide: '0-4 minimal, 5-9 mild, 10-14 moderate, 15-21 severe.' },
  { id: 'phq-15', code: 'PHQ15', name: 'Patient Health Questionnaire (PHQ-15)', description: 'Somatic symptom severity screener', duration_minutes: 6, target_condition: 'Somatic symptoms', item_count: 15, administration_note: 'Past 4 weeks, self-report.', interpretation_guide: '0-4 minimal, 5-9 low, 10-14 medium, 15-30 high.' },
  { id: 'dass-21', code: 'DASS21', name: 'Depression, Anxiety & Stress Scale (DASS-21)', description: 'Depression, anxiety and stress', duration_minutes: 8, target_condition: 'Depression, Anxiety, Stress', item_count: 21, administration_note: 'Past week, self-report.', interpretation_guide: 'Subscale scores are commonly multiplied by 2 for DASS-42 equivalence.' },
  { id: 'who-5', code: 'WHO5', name: 'WHO-5 Well-Being Index', description: 'Psychological wellbeing screening', duration_minutes: 3, target_condition: 'Well-being', item_count: 5, administration_note: 'Past 2 weeks, positive wellbeing items.', interpretation_guide: 'Raw 0-25, often transformed to 0-100; lower scores indicate poorer well-being.' },
  { id: 'pss-10', code: 'PSS10', name: 'Perceived Stress Scale (PSS-10)', description: 'Perceived stress screening', duration_minutes: 5, target_condition: 'Perceived stress', item_count: 10, administration_note: 'Past month; includes reverse-scored items.', interpretation_guide: '0-13 low, 14-26 moderate, 27-40 high stress.' },
  { id: 'isi', code: 'ISI', name: 'Insomnia Severity Index (ISI)', description: 'Sleep disturbance severity screening', duration_minutes: 4, target_condition: 'Insomnia', item_count: 7, administration_note: 'Past 2 weeks, self-report.', interpretation_guide: '0-7 none, 8-14 subthreshold, 15-21 moderate, 22-28 severe.' },
  { id: 'cbi', code: 'CBI', name: 'Copenhagen Burnout Inventory (CBI)', description: 'Burnout screening', duration_minutes: 8, target_condition: 'Burnout', item_count: 19, administration_note: 'Personal/work/client-related burnout domains.', interpretation_guide: 'Higher average score indicates higher burnout burden.' },
  { id: 'whodas12', code: 'WHODAS12', name: 'WHO Disability Assessment Schedule (WHODAS 2.0 - 12)', description: 'Functioning and disability assessment', duration_minutes: 6, target_condition: 'Disability and functioning', item_count: 12, administration_note: 'Past 30 days, self-report.', interpretation_guide: 'Higher score indicates greater functional impairment.' },
];

function shouldFallback(error) {
  const message = String(error?.message || '');
  return error?.code === '42P01' || /relation .* does not exist/i.test(message);
}

function hasMissingColumn(error) {
  const message = String(error?.message || '');
  return error?.code === '42703' || /column .* does not exist/i.test(message);
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id || null;
}

export async function listClinicalTools() {
  const fullQuery = await supabase
    .from('clinical_tools')
    .select('id, code, name, description, duration_minutes, scale_note, target_condition, item_count, administration_note, interpretation_guide, is_active')
    .eq('is_active', true)
    .order('code', { ascending: true });

  if (fullQuery.error) {
    if (hasMissingColumn(fullQuery.error)) {
      const baseQuery = await supabase
        .from('clinical_tools')
        .select('id, code, name, description, duration_minutes, scale_note')
        .order('code', { ascending: true });

      if (baseQuery.error) {
        if (shouldFallback(baseQuery.error)) return FALLBACK_TOOLS;
        throw baseQuery.error;
      }

      return (baseQuery.data || []).map((item) => ({
        ...item,
        target_condition: null,
        item_count: null,
        administration_note: null,
        interpretation_guide: null,
      }));
    }

    if (shouldFallback(fullQuery.error)) return FALLBACK_TOOLS;
    throw fullQuery.error;
  }

  return fullQuery.data || [];
}

export async function getClinicalToolQuestions(toolId) {
  if (!toolId) throw new Error('Missing tool id');

  const { data, error } = await supabase
    .from('clinical_tool_questions')
    .select('id, tool_id, question_order, question_text, options')
    .eq('tool_id', toolId)
    .order('question_order', { ascending: true });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return data || [];
}

export async function saveClinicalToolResponse({ toolId, answers, score, totalQuestions }) {
  if (!toolId) throw new Error('Missing tool id');

  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const payload = {
    user_id: userId,
    tool_id: toolId,
    answers,
    score,
    total_questions: totalQuestions,
  };

  const { data, error } = await supabase
    .from('clinical_tool_responses')
    .insert(payload)
    .select('id, created_at')
    .single();

  if (error) {
    if (shouldFallback(error)) return null;
    throw error;
  }

  return data;
}

export async function listMyClinicalToolResponses() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('clinical_tool_responses')
    .select('id, tool_id, score, total_questions, created_at, clinical_tools(name, code)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (shouldFallback(error)) return [];
    throw error;
  }

  return data || [];
}
