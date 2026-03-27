-- Additional wellbeing question dataset (no-duplicate safe)
-- Run after daily_assessment.sql

insert into public.wellbeing_questions (category, prompt, answer_type, options, is_active)
values
  -- Mood (extra)
  ('Mood', 'How emotionally steady did you feel this morning?', 'likert_5', null, true),
  ('Mood', 'How quickly did you recover after feeling upset today?', 'likert_5', null, true),
  ('Mood', 'How optimistic were your thoughts today?', 'likert_5', null, true),
  ('Mood', 'How often did your mood shift suddenly today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Mood', 'How satisfied were you with your emotional state today?', 'likert_5', null, true),

  -- Sleep (extra)
  ('Sleep', 'How consistent was your sleep schedule this week?', 'likert_5', null, true),
  ('Sleep', 'How refreshed did you feel 1 hour after waking up?', 'likert_5', null, true),
  ('Sleep', 'How often did stress affect your sleep recently?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Sleep', 'How easy was it to return to sleep after waking at night?', 'likert_5', null, true),
  ('Sleep', 'How restful were your dreams lately?', 'likert_5', null, true),

  -- Stress (extra)
  ('Stress', 'How manageable did your workload feel today?', 'likert_5', null, true),
  ('Stress', 'How often did small problems feel overwhelming today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Stress', 'How calm did your body feel under pressure?', 'likert_5', null, true),
  ('Stress', 'How quickly did you calm down after stress?', 'likert_5', null, true),
  ('Stress', 'How confident were you in handling unexpected issues?', 'likert_5', null, true),

  -- Anxiety (extra)
  ('Anxiety', 'How often did you overthink possible negative outcomes today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Anxiety', 'How safe did you feel in your environment today?', 'likert_5', null, true),
  ('Anxiety', 'How difficult was it to stop anxious thoughts today?', 'likert_5', null, true),
  ('Anxiety', 'How tense did your breathing feel when worried?', 'likert_5', null, true),
  ('Anxiety', 'How much did anxiety affect your decisions today?', 'likert_5', null, true),

  -- Energy (extra)
  ('Energy', 'How stable was your energy level across the day?', 'likert_5', null, true),
  ('Energy', 'How energized did you feel after meals today?', 'likert_5', null, true),
  ('Energy', 'How often did you feel mentally drained today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Energy', 'How ready did you feel to begin your day?', 'likert_5', null, true),
  ('Energy', 'How sustainable did your energy feel this evening?', 'likert_5', null, true),

  -- Productivity (extra)
  ('Productivity', 'How clearly were your priorities defined today?', 'likert_5', null, true),
  ('Productivity', 'How often did you procrastinate today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Productivity', 'How satisfied were you with your concentration span?', 'likert_5', null, true),
  ('Productivity', 'How effectively did you complete your key task today?', 'likert_5', null, true),
  ('Productivity', 'How confident were you in your performance today?', 'likert_5', null, true),

  -- Social (extra)
  ('Social', 'How comfortable were you initiating conversations today?', 'likert_5', null, true),
  ('Social', 'How understood did you feel by people close to you today?', 'likert_5', null, true),
  ('Social', 'How often did you avoid social interaction due to mood?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Social', 'How positive were your conversations today?', 'likert_5', null, true),
  ('Social', 'How supported did you feel when facing challenges today?', 'likert_5', null, true),

  -- Self-care (extra)
  ('Self-care', 'How well did you maintain hydration today?', 'likert_5', null, true),
  ('Self-care', 'How regularly did you take mindful pauses today?', 'likert_5', null, true),
  ('Self-care', 'How balanced were your meals today?', 'likert_5', null, true),
  ('Self-care', 'How much personal recovery time did you allow today?', 'likert_5', null, true),
  ('Self-care', 'How gently did you respond to your own mistakes today?', 'likert_5', null, true),

  -- Mindfulness (extra)
  ('Mindfulness', 'How often did you notice your breathing today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Mindfulness', 'How quickly could you refocus when distracted?', 'likert_5', null, true),
  ('Mindfulness', 'How aware were you of your emotions as they changed?', 'likert_5', null, true),
  ('Mindfulness', 'How non-judgmental were you toward your thoughts today?', 'likert_5', null, true),
  ('Mindfulness', 'How grounded did you feel during stressful moments?', 'likert_5', null, true),

  -- Resilience (new category)
  ('Resilience', 'How quickly did you bounce back from setbacks today?', 'likert_5', null, true),
  ('Resilience', 'How confident were you in solving difficult problems today?', 'likert_5', null, true),
  ('Resilience', 'How much did challenges feel like opportunities to grow?', 'likert_5', null, true),
  ('Resilience', 'How persistent were you when tasks became difficult?', 'likert_5', null, true),
  ('Resilience', 'How hopeful did you stay during uncertainty today?', 'likert_5', null, true),

  -- Cognitive (new category)
  ('Cognitive', 'How clear was your thinking today?', 'likert_5', null, true),
  ('Cognitive', 'How often did you lose track of conversations today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Cognitive', 'How easy was it to remember important tasks today?', 'likert_5', null, true),
  ('Cognitive', 'How mentally organized did you feel today?', 'likert_5', null, true),
  ('Cognitive', 'How often did intrusive thoughts interrupt your focus?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),

  -- Physical (new category)
  ('Physical', 'How physically relaxed did your body feel today?', 'likert_5', null, true),
  ('Physical', 'How often did you feel headaches or tension today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Physical', 'How active were you physically today?', 'likert_5', null, true),
  ('Physical', 'How comfortable did your breathing feel today?', 'likert_5', null, true),
  ('Physical', 'How connected did you feel between body and mind today?', 'likert_5', null, true)
on conflict (category, prompt) do update
set
  answer_type = excluded.answer_type,
  options = excluded.options,
  is_active = excluded.is_active,
  updated_at = now();
