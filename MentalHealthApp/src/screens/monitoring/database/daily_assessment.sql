-- Daily assessment question bank + response storage
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.wellbeing_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  prompt text not null,
  answer_type text not null default 'likert_5',
  options jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category, prompt)
);

create table if not exists public.daily_assessment_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_score integer not null check (mood_score between 1 and 5),
  notes text,
  total_questions integer not null default 0,
  average_score numeric,
  responses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wellbeing_questions_category_idx on public.wellbeing_questions(category, is_active);
create index if not exists daily_assessment_entries_user_idx on public.daily_assessment_entries(user_id, created_at desc);

alter table public.wellbeing_questions enable row level security;
alter table public.daily_assessment_entries enable row level security;

do $$ begin
  create policy "public read wellbeing questions"
  on public.wellbeing_questions
  for select
  using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "admin manage wellbeing questions"
  on public.wellbeing_questions
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (coalesce(p.is_admin, false) = true or lower(coalesce(p.role, '')) = 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (coalesce(p.is_admin, false) = true or lower(coalesce(p.role, '')) = 'admin')
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users insert own daily assessments"
  on public.daily_assessment_entries
  for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users read own daily assessments"
  on public.daily_assessment_entries
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

insert into public.wellbeing_questions (category, prompt, answer_type, options, is_active)
values
  ('Mood', 'How calm did you feel today?', 'likert_5', null, true),
  ('Mood', 'How hopeful did you feel about tomorrow?', 'likert_5', null, true),
  ('Mood', 'How emotionally balanced did you feel today?', 'likert_5', null, true),
  ('Mood', 'How often did you feel overwhelmed today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Mood', 'How easy was it to enjoy small moments today?', 'likert_5', null, true),

  ('Sleep', 'How would you rate your sleep quality last night?', 'likert_5', null, true),
  ('Sleep', 'How rested did you feel after waking up?', 'likert_5', null, true),
  ('Sleep', 'How quickly did you fall asleep?', 'likert_5', '[{"label":"Very quickly","value":5},{"label":"Quickly","value":4},{"label":"Moderate","value":3},{"label":"Slowly","value":2},{"label":"Very slowly","value":1}]'::jsonb, true),
  ('Sleep', 'How often did you wake up during the night?', 'likert_5', '[{"label":"Never","value":5},{"label":"Rarely","value":4},{"label":"Sometimes","value":3},{"label":"Often","value":2},{"label":"Very often","value":1}]'::jsonb, true),
  ('Sleep', 'How sleepy did you feel during daytime?', 'likert_5', '[{"label":"Not sleepy","value":5},{"label":"Slightly sleepy","value":4},{"label":"Moderately sleepy","value":3},{"label":"Very sleepy","value":2},{"label":"Extremely sleepy","value":1}]'::jsonb, true),

  ('Stress', 'How stressed did you feel today?', 'likert_5', '[{"label":"Not stressed","value":1},{"label":"Slightly stressed","value":2},{"label":"Moderately stressed","value":3},{"label":"Very stressed","value":4},{"label":"Extremely stressed","value":5}]'::jsonb, true),
  ('Stress', 'How well could you manage pressure today?', 'likert_5', null, true),
  ('Stress', 'How often did worries affect your focus today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Stress', 'How physically tense did your body feel today?', 'likert_5', null, true),
  ('Stress', 'How confident were you in coping with challenges today?', 'likert_5', null, true),

  ('Anxiety', 'How anxious did you feel in social situations today?', 'likert_5', null, true),
  ('Anxiety', 'How often did your mind race with worries?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Anxiety', 'How hard was it to relax your thoughts?', 'likert_5', null, true),
  ('Anxiety', 'How often did you feel something bad might happen?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Anxiety', 'How in-control did you feel over your emotions?', 'likert_5', null, true),

  ('Energy', 'How much energy did you have today?', 'likert_5', null, true),
  ('Energy', 'How motivated were you to start tasks?', 'likert_5', null, true),
  ('Energy', 'How quickly did fatigue appear during your day?', 'likert_5', '[{"label":"Very slowly","value":5},{"label":"Slowly","value":4},{"label":"Moderate","value":3},{"label":"Quickly","value":2},{"label":"Very quickly","value":1}]'::jsonb, true),
  ('Energy', 'How active did you feel physically?', 'likert_5', null, true),
  ('Energy', 'How mentally sharp did you feel?', 'likert_5', null, true),

  ('Productivity', 'How satisfied were you with your daily progress?', 'likert_5', null, true),
  ('Productivity', 'How focused were you while studying or working?', 'likert_5', null, true),
  ('Productivity', 'How often did distractions interrupt your tasks?', 'likert_5', '[{"label":"Never","value":5},{"label":"Rarely","value":4},{"label":"Sometimes","value":3},{"label":"Often","value":2},{"label":"Very often","value":1}]'::jsonb, true),
  ('Productivity', 'How confident were you in finishing what you planned?', 'likert_5', null, true),
  ('Productivity', 'How well did you manage your time today?', 'likert_5', null, true),

  ('Social', 'How connected did you feel with people around you?', 'likert_5', null, true),
  ('Social', 'How supported did you feel by friends or family?', 'likert_5', null, true),
  ('Social', 'How comfortable were you expressing your feelings today?', 'likert_5', null, true),
  ('Social', 'How lonely did you feel today?', 'likert_5', '[{"label":"Not lonely","value":1},{"label":"Slightly lonely","value":2},{"label":"Moderately lonely","value":3},{"label":"Very lonely","value":4},{"label":"Extremely lonely","value":5}]'::jsonb, true),
  ('Social', 'How meaningful were your interactions today?', 'likert_5', null, true),

  ('Self-care', 'How well did you take care of your basic needs today?', 'likert_5', null, true),
  ('Self-care', 'How mindful were you about taking breaks?', 'likert_5', null, true),
  ('Self-care', 'How healthy were your eating habits today?', 'likert_5', null, true),
  ('Self-care', 'How often did you pause for deep breathing or relaxation?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true),
  ('Self-care', 'How kind were you to yourself today?', 'likert_5', null, true),

  ('Mindfulness', 'How present were you in the moment today?', 'likert_5', null, true),
  ('Mindfulness', 'How often did you notice and let go of negative thoughts?', 'likert_5', null, true),
  ('Mindfulness', 'How much mental clarity did you have today?', 'likert_5', null, true),
  ('Mindfulness', 'How grounded did you feel during difficult moments?', 'likert_5', null, true),
  ('Mindfulness', 'How often did you practice gratitude today?', 'likert_5', '[{"label":"Never","value":1},{"label":"Rarely","value":2},{"label":"Sometimes","value":3},{"label":"Often","value":4},{"label":"Very often","value":5}]'::jsonb, true)
on conflict (category, prompt) do update
set
  answer_type = excluded.answer_type,
  options = excluded.options,
  is_active = excluded.is_active,
  updated_at = now();
