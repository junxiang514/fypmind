-- Monitoring module: Clinical tools + question bank
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.clinical_tools (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  duration_minutes integer,
  scale_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_tool_questions (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.clinical_tools(id) on delete cascade,
  question_order integer not null,
  question_text text not null,
  options jsonb not null,
  created_at timestamptz not null default now(),
  unique(tool_id, question_order)
);

create table if not exists public.clinical_tool_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id uuid not null references public.clinical_tools(id) on delete cascade,
  answers jsonb not null,
  score numeric,
  total_questions integer,
  created_at timestamptz not null default now()
);

create index if not exists clinical_tool_questions_tool_idx on public.clinical_tool_questions(tool_id, question_order);
create index if not exists clinical_tool_responses_user_idx on public.clinical_tool_responses(user_id, created_at desc);
create index if not exists clinical_tool_responses_tool_idx on public.clinical_tool_responses(tool_id);

alter table public.clinical_tools enable row level security;
alter table public.clinical_tool_questions enable row level security;
alter table public.clinical_tool_responses enable row level security;

do $$ begin
  create policy "public read clinical tools"
  on public.clinical_tools
  for select
  using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public read clinical tool questions"
  on public.clinical_tool_questions
  for select
  using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users insert own clinical responses"
  on public.clinical_tool_responses
  for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users read own clinical responses"
  on public.clinical_tool_responses
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Tool definitions
insert into public.clinical_tools (code, name, description, duration_minutes, scale_note)
values
  ('PHQ9', 'Patient Health Questionnaire (PHQ-9)', 'Depression screening questionnaire', 5, '0-3 scale per item'),
  ('GAD7', 'Generalized Anxiety Disorder (GAD-7)', 'Anxiety screening questionnaire', 4, '0-3 scale per item'),
  ('PHQ15', 'Patient Health Questionnaire (PHQ-15)', 'Somatic symptom severity questionnaire', 6, '0-2 scale per item'),
  ('DASS21', 'Depression, Anxiety & Stress Scale (DASS-21)', 'Measures depression, anxiety and stress symptoms', 8, '0-3 scale per item'),
  ('WHO5', 'WHO-5 Well-Being Index', 'Measures current psychological wellbeing', 3, '0-5 scale per item'),
  ('PSS10', 'Perceived Stress Scale (PSS-10)', 'Measures perceived stress over the last month', 5, '0-4 scale per item'),
  ('ISI', 'Insomnia Severity Index (ISI)', 'Assesses perceived insomnia severity', 4, '0-4 scale per item'),
  ('CBI', 'Copenhagen Burnout Inventory (CBI)', 'Measures personal, work and client-related burnout', 8, '0-100 style options'),
  ('WHODAS12', 'World Health Organization Disability Assessment Schedule (WHODAS 2.0 - 12)', 'Assesses functioning and disability across life domains', 6, '0-4 scale per item')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  scale_note = excluded.scale_note;

-- Optional reset/reseed questions
delete from public.clinical_tool_questions
where tool_id in (select id from public.clinical_tools where code in ('PHQ9','GAD7','PHQ15','DASS21','WHO5','PSS10','ISI','CBI','WHODAS12'));

with
phq as (
  select id as tool_id from public.clinical_tools where code = 'PHQ9'
),
gad as (
  select id as tool_id from public.clinical_tools where code = 'GAD7'
),
phq15 as (
  select id as tool_id from public.clinical_tools where code = 'PHQ15'
),
dass as (
  select id as tool_id from public.clinical_tools where code = 'DASS21'
),
who5 as (
  select id as tool_id from public.clinical_tools where code = 'WHO5'
),
pss as (
  select id as tool_id from public.clinical_tools where code = 'PSS10'
),
isi as (
  select id as tool_id from public.clinical_tools where code = 'ISI'
),
cbi as (
  select id as tool_id from public.clinical_tools where code = 'CBI'
),
whodas as (
  select id as tool_id from public.clinical_tools where code = 'WHODAS12'
)
insert into public.clinical_tool_questions (tool_id, question_order, question_text, options)
select tool_id, question_order, question_text, options
from (
  -- PHQ-9 (9)
  select (select tool_id from phq) as tool_id, 1 as question_order, 'Little interest or pleasure in doing things' as question_text,
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb as options
  union all select (select tool_id from phq), 2, 'Feeling down, depressed, or hopeless',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 3, 'Trouble falling or staying asleep, or sleeping too much',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 4, 'Feeling tired or having little energy',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 5, 'Poor appetite or overeating',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 6, 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 7, 'Trouble concentrating on things, such as reading the newspaper or watching television',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 8, 'Moving or speaking so slowly that other people could have noticed; or the opposite — being fidgety/restless',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from phq), 9, 'Thoughts that you would be better off dead, or of hurting yourself',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb

  -- GAD-7 (7)
  union all select (select tool_id from gad), 1, 'Feeling nervous, anxious, or on edge',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 2, 'Not being able to stop or control worrying',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 3, 'Worrying too much about different things',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 4, 'Trouble relaxing',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 5, 'Being so restless that it is hard to sit still',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 6, 'Becoming easily annoyed or irritable',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb
  union all select (select tool_id from gad), 7, 'Feeling afraid as if something awful might happen',
    '[{"label":"Not at all","value":0},{"label":"Several days","value":1},{"label":"More than half the days","value":2},{"label":"Nearly every day","value":3}]'::jsonb

  -- PHQ-15 (15)
  union all select (select tool_id from phq15), 1, 'Stomach pain',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 2, 'Back pain',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 3, 'Pain in your arms, legs, or joints',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 4, 'Menstrual cramps or other problems with your period',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 5, 'Headaches',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 6, 'Chest pain',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 7, 'Dizziness',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 8, 'Fainting spells',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 9, 'Feeling your heart pound or race',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 10, 'Shortness of breath',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 11, 'Pain or problems during sexual intercourse',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 12, 'Constipation, loose bowels, or diarrhea',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 13, 'Nausea, gas, or indigestion',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 14, 'Feeling tired or having low energy',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb
  union all select (select tool_id from phq15), 15, 'Trouble sleeping',
    '[{"label":"Not bothered at all","value":0},{"label":"Bothered a little","value":1},{"label":"Bothered a lot","value":2}]'::jsonb

  -- DASS-21 (21)
  union all select (select tool_id from dass), 1, 'I found it hard to wind down',
    '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 2, 'I was aware of dryness of my mouth', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 3, 'I could not seem to experience any positive feeling at all', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 4, 'I experienced breathing difficulty', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 5, 'I found it difficult to work up the initiative to do things', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 6, 'I tended to over-react to situations', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 7, 'I experienced trembling', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 8, 'I felt that I was using a lot of nervous energy', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 9, 'I was worried about situations in which I might panic and make a fool of myself', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 10, 'I felt that I had nothing to look forward to', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 11, 'I found myself getting agitated', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 12, 'I found it difficult to relax', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 13, 'I felt down-hearted and blue', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 14, 'I was intolerant of anything that kept me from getting on with what I was doing', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 15, 'I felt I was close to panic', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 16, 'I was unable to become enthusiastic about anything', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 17, 'I felt I was not worth much as a person', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 18, 'I felt that I was rather touchy', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 19, 'I was aware of the action of my heart in the absence of physical exertion', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 20, 'I felt scared without any good reason', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb
  union all select (select tool_id from dass), 21, 'I felt that life was meaningless', '[{"label":"Did not apply to me at all","value":0},{"label":"Applied to me to some degree","value":1},{"label":"Applied to me to a considerable degree","value":2},{"label":"Applied to me very much","value":3}]'::jsonb

  -- WHO-5 (5)
  union all select (select tool_id from who5), 1, 'I have felt cheerful and in good spirits',
    '[{"label":"At no time","value":0},{"label":"Some of the time","value":1},{"label":"Less than half the time","value":2},{"label":"More than half the time","value":3},{"label":"Most of the time","value":4},{"label":"All of the time","value":5}]'::jsonb
  union all select (select tool_id from who5), 2, 'I have felt calm and relaxed',
    '[{"label":"At no time","value":0},{"label":"Some of the time","value":1},{"label":"Less than half the time","value":2},{"label":"More than half the time","value":3},{"label":"Most of the time","value":4},{"label":"All of the time","value":5}]'::jsonb
  union all select (select tool_id from who5), 3, 'I have felt active and vigorous',
    '[{"label":"At no time","value":0},{"label":"Some of the time","value":1},{"label":"Less than half the time","value":2},{"label":"More than half the time","value":3},{"label":"Most of the time","value":4},{"label":"All of the time","value":5}]'::jsonb
  union all select (select tool_id from who5), 4, 'I woke up feeling fresh and rested',
    '[{"label":"At no time","value":0},{"label":"Some of the time","value":1},{"label":"Less than half the time","value":2},{"label":"More than half the time","value":3},{"label":"Most of the time","value":4},{"label":"All of the time","value":5}]'::jsonb
  union all select (select tool_id from who5), 5, 'My daily life has been filled with things that interest me',
    '[{"label":"At no time","value":0},{"label":"Some of the time","value":1},{"label":"Less than half the time","value":2},{"label":"More than half the time","value":3},{"label":"Most of the time","value":4},{"label":"All of the time","value":5}]'::jsonb

  -- PSS-10 (10)
  union all select (select tool_id from pss), 1, 'In the last month, how often have you been upset because of something that happened unexpectedly?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb
  union all select (select tool_id from pss), 2, 'In the last month, how often have you felt unable to control the important things in your life?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb
  union all select (select tool_id from pss), 3, 'In the last month, how often have you felt nervous and stressed?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb
  union all select (select tool_id from pss), 4, 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
    '[{"label":"Never","value":4},{"label":"Almost never","value":3},{"label":"Sometimes","value":2},{"label":"Fairly often","value":1},{"label":"Very often","value":0}]'::jsonb
  union all select (select tool_id from pss), 5, 'In the last month, how often have you felt that things were going your way?',
    '[{"label":"Never","value":4},{"label":"Almost never","value":3},{"label":"Sometimes","value":2},{"label":"Fairly often","value":1},{"label":"Very often","value":0}]'::jsonb
  union all select (select tool_id from pss), 6, 'In the last month, how often have you found that you could not cope with all the things that you had to do?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb
  union all select (select tool_id from pss), 7, 'In the last month, how often have you been able to control irritations in your life?',
    '[{"label":"Never","value":4},{"label":"Almost never","value":3},{"label":"Sometimes","value":2},{"label":"Fairly often","value":1},{"label":"Very often","value":0}]'::jsonb
  union all select (select tool_id from pss), 8, 'In the last month, how often have you felt that you were on top of things?',
    '[{"label":"Never","value":4},{"label":"Almost never","value":3},{"label":"Sometimes","value":2},{"label":"Fairly often","value":1},{"label":"Very often","value":0}]'::jsonb
  union all select (select tool_id from pss), 9, 'In the last month, how often have you been angered because of things that happened that were outside of your control?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb
  union all select (select tool_id from pss), 10, 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
    '[{"label":"Never","value":0},{"label":"Almost never","value":1},{"label":"Sometimes","value":2},{"label":"Fairly often","value":3},{"label":"Very often","value":4}]'::jsonb

  -- ISI (7)
  union all select (select tool_id from isi), 1, 'Difficulty falling asleep',
    '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Very severe","value":4}]'::jsonb
  union all select (select tool_id from isi), 2, 'Difficulty staying asleep',
    '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Very severe","value":4}]'::jsonb
  union all select (select tool_id from isi), 3, 'Problems waking up too early',
    '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Very severe","value":4}]'::jsonb
  union all select (select tool_id from isi), 4, 'How satisfied/dissatisfied are you with your current sleep pattern?',
    '[{"label":"Very satisfied","value":0},{"label":"Satisfied","value":1},{"label":"Neutral","value":2},{"label":"Dissatisfied","value":3},{"label":"Very dissatisfied","value":4}]'::jsonb
  union all select (select tool_id from isi), 5, 'How noticeable to others do you think your sleep problem is in terms of impairing quality of life?',
    '[{"label":"Not at all noticeable","value":0},{"label":"A little","value":1},{"label":"Somewhat","value":2},{"label":"Much","value":3},{"label":"Very much noticeable","value":4}]'::jsonb
  union all select (select tool_id from isi), 6, 'How worried/distressed are you about your current sleep problem?',
    '[{"label":"Not at all","value":0},{"label":"A little","value":1},{"label":"Somewhat","value":2},{"label":"Much","value":3},{"label":"Very much","value":4}]'::jsonb
  union all select (select tool_id from isi), 7, 'To what extent do you consider your sleep problem to interfere with your daily functioning?',
    '[{"label":"Not at all interfering","value":0},{"label":"A little","value":1},{"label":"Somewhat","value":2},{"label":"Much","value":3},{"label":"Very much interfering","value":4}]'::jsonb

  -- CBI (19)
  union all select (select tool_id from cbi), 1, 'How often do you feel tired?',
    '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 2, 'How often are you physically exhausted?', '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 3, 'How often are you emotionally exhausted?', '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 4, 'How often do you think: "I can''t take it anymore"?', '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 5, 'How often do you feel worn out?', '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 6, 'How often do you feel weak and susceptible to illness?', '[{"label":"Always","value":100},{"label":"Often","value":75},{"label":"Sometimes","value":50},{"label":"Seldom","value":25},{"label":"Never/almost never","value":0}]'::jsonb
  union all select (select tool_id from cbi), 7, 'Is your work emotionally exhausting?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 8, 'Do you feel burnt out because of your work?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 9, 'Does your work frustrate you?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 10, 'Do you feel worn out at the end of the working day?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 11, 'Are you exhausted in the morning at the thought of another day at work?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 12, 'Do you feel that every working hour is tiring for you?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 13, 'Do you have enough energy for family and friends during leisure time?', '[{"label":"Always","value":0},{"label":"Often","value":25},{"label":"Sometimes","value":50},{"label":"Seldom","value":75},{"label":"Never/almost never","value":100}]'::jsonb
  union all select (select tool_id from cbi), 14, 'Do you find it hard to work with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 15, 'Does it drain your energy to work with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 16, 'Do you find it frustrating to work with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 17, 'Do you feel that you give more than you get back when you work with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 18, 'Are you tired of working with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb
  union all select (select tool_id from cbi), 19, 'Do you ever wonder how long you will be able to continue working with clients/patients/students?', '[{"label":"To a very high degree","value":100},{"label":"To a high degree","value":75},{"label":"Somewhat","value":50},{"label":"To a low degree","value":25},{"label":"To a very low degree","value":0}]'::jsonb

  -- WHODAS 12 (12)
  union all select (select tool_id from whodas), 1, 'Standing for long periods such as 30 minutes?',
    '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 2, 'Taking care of your household responsibilities?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 3, 'Learning a new task, for example learning how to get to a new place?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 4, 'Joining in community activities in the same way as anyone else can?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 5, 'How much have you been emotionally affected by your health problems?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 6, 'Concentrating on doing something for ten minutes?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 7, 'Walking a long distance such as a kilometer?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 8, 'Washing your whole body?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 9, 'Getting dressed?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 10, 'Dealing with people you do not know?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 11, 'Maintaining a friendship?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
  union all select (select tool_id from whodas), 12, 'Your day-to-day work/school?', '[{"label":"None","value":0},{"label":"Mild","value":1},{"label":"Moderate","value":2},{"label":"Severe","value":3},{"label":"Extreme or cannot do","value":4}]'::jsonb
) q;
