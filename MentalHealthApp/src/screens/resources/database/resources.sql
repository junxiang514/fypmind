-- Resources module database (MRM-03 + MRM-04)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- =========================
-- MRM-03: Educational Content
-- =========================
create table if not exists public.educational_contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  category text,
  video_url text,
  quiz_payload jsonb,
  activity_payload jsonb,
  body text,
  created_at timestamptz not null default now()
);

alter table public.educational_contents
  add column if not exists video_url text;

alter table public.educational_contents
  add column if not exists quiz_payload jsonb;

alter table public.educational_contents
  add column if not exists activity_payload jsonb;

alter table public.educational_contents enable row level security;

do $$ begin
  create policy "public read educational contents"
  on public.educational_contents
  for select
  using (true);
exception when duplicate_object then null; end $$;

create index if not exists educational_contents_title_idx on public.educational_contents (title);

-- Seed educational contents (only if empty)
insert into public.educational_contents (title, summary, category, video_url, quiz_payload, activity_payload, body)
select v.title, v.summary, v.category, v.video_url, v.quiz_payload, v.activity_payload, v.body
from (
  values
    (
      'Understanding Stress',
      'What stress is, common triggers, and healthy coping strategies.',
      'Wellbeing',
      'https://www.youtube.com/watch?v=1vx8iUvfyCY',
      '[{"question":"Stress can show up as:","options":["Only sadness","Body tension and racing thoughts","No physical signs","Only anger"],"answer":1},{"question":"A healthy first step for stress is:","options":["Skip meals","Avoid everyone","Take slow breaths","Overwork"],"answer":2}]'::jsonb,
      '[{"key":"breathe","label":"Do 2 minutes of slow breathing"},{"key":"water","label":"Drink one glass of water"},{"key":"plan","label":"Write one small task for today"}]'::jsonb,
      'Stress is a normal response to challenges. Helpful coping strategies include adequate sleep, regular exercise, hydration, and talking to someone you trust. If stress feels overwhelming, consider professional support.'
    ),
    (
      'Basics of Anxiety',
      'Recognize symptoms and learn simple grounding techniques.',
      'Anxiety',
      'https://www.youtube.com/watch?v=tybOi4hjZFQ',
      '[{"question":"A grounding technique is:","options":["5-4-3-2-1 senses","Skip sleep","Drink energy drinks","Avoid support"],"answer":0},{"question":"Box breathing usually follows:","options":["4-4-4-4","1-1-1-1","10-10-10-10","No rhythm"],"answer":0}]'::jsonb,
      '[{"key":"grounding","label":"Name 5 things you can see"},{"key":"touch","label":"Name 4 things you can feel"},{"key":"call","label":"Reach out to one trusted person"}]'::jsonb,
      'Anxiety can involve persistent worry and physical sensations. Try box breathing (inhale 4, hold 4, exhale 4, hold 4) and grounding (name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste).'
    ),
    (
      'Sleep Hygiene Tips',
      'Practical habits that improve sleep quality over time.',
      'Sleep',
      'https://www.youtube.com/watch?v=nm1TxQj9IsQ',
      '[{"question":"Better sleep is supported by:","options":["Late caffeine","Consistent bedtime","Bright screens in bed","Irregular wake time"],"answer":1}]'::jsonb,
      '[{"key":"lights","label":"Dim lights 1 hour before bed"},{"key":"screen","label":"Avoid phone in bed"}]'::jsonb,
      'Aim for a consistent sleep schedule, reduce caffeine late in the day, keep your room cool and dark, and limit screens before bed. If insomnia persists, consult a clinician.'
    ),
    (
      'Healthy Coping Skills',
      'A quick list of coping tools you can use today.',
      'Coping',
      'https://www.youtube.com/watch?v=hnpQrMqDoqE',
      '[{"question":"A healthy coping skill is:","options":["Journaling","Ignoring emotions","Isolating","Skipping meals"],"answer":0}]'::jsonb,
      '[{"key":"journal","label":"Write 3 lines in a journal"},{"key":"walk","label":"Take a 10-minute walk"}]'::jsonb,
      'Try: journaling, short walks, stretching, mindful breathing, calling a friend, listening to calming music, and breaking tasks into smaller steps. Not every skill fits everyone—experiment and keep what helps.'
    ),
    (
      'When to Seek Help',
      'Signs that you may benefit from professional support.',
      'Support',
      'https://www.youtube.com/watch?v=QHkXvPq2pQE',
      '[{"question":"Professional support is important when:","options":["Symptoms are persistent and affecting life","You feel fine","You are just busy","You slept well once"],"answer":0}]'::jsonb,
      '[{"key":"contact","label":"Save one trusted emergency contact"},{"key":"plan","label":"Write your support plan"}]'::jsonb,
      'If symptoms persist for weeks, interfere with daily life, or you have thoughts of self-harm, seek professional help. In an emergency, contact local emergency services or a crisis hotline immediately.'
    )
) as v(title, summary, category, video_url, quiz_payload, activity_payload, body)
where not exists (select 1 from public.educational_contents limit 1);

-- =========================
-- MRM-03A: Educational Progress (per user)
-- =========================
create table if not exists public.educational_content_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.educational_contents(id) on delete cascade,
  completed_steps jsonb not null default '{}'::jsonb,
  progress_percent numeric(5,2) not null default 0,
  last_step text,
  quiz_score integer,
  quiz_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, content_id)
);

create table if not exists public.educational_content_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id uuid not null references public.educational_contents(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  feedback_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, content_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_edu_progress_updated_at on public.educational_content_progress;
create trigger trg_edu_progress_updated_at
before update on public.educational_content_progress
for each row execute function public.set_updated_at();

drop trigger if exists trg_edu_feedback_updated_at on public.educational_content_feedback;
create trigger trg_edu_feedback_updated_at
before update on public.educational_content_feedback
for each row execute function public.set_updated_at();

create index if not exists educational_content_progress_user_idx on public.educational_content_progress (user_id);
create index if not exists educational_content_progress_content_idx on public.educational_content_progress (content_id);
create index if not exists educational_content_feedback_user_idx on public.educational_content_feedback (user_id);
create index if not exists educational_content_feedback_content_idx on public.educational_content_feedback (content_id);

alter table public.educational_content_progress enable row level security;
alter table public.educational_content_feedback enable row level security;

do $$ begin
  create policy "users can read own progress"
  on public.educational_content_progress
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can insert own progress"
  on public.educational_content_progress
  for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can update own progress"
  on public.educational_content_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can read own feedback"
  on public.educational_content_feedback
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can insert own feedback"
  on public.educational_content_feedback
  for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can update own feedback"
  on public.educational_content_feedback
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- =========================
-- MRM-04: Events & Activities
-- =========================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  detailed_description text,
  objective text,
  agenda text,
  category text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  address text,
  fee text,
  location_link text,
  image_urls jsonb,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists detailed_description text;
alter table public.events add column if not exists objective text;
alter table public.events add column if not exists agenda text;
alter table public.events add column if not exists fee text;
alter table public.events add column if not exists location_link text;
alter table public.events add column if not exists image_urls jsonb;

alter table public.events enable row level security;

do $$ begin
  create policy "public read events"
  on public.events
  for select
  using (true);
exception when duplicate_object then null; end $$;

create index if not exists events_title_idx on public.events (title);
create index if not exists events_start_at_idx on public.events (start_at);

-- Seed events (only if empty)
insert into public.events (title, description, detailed_description, objective, agenda, category, start_at, end_at, location, address, fee, location_link, image_urls, latitude, longitude)
select v.title, v.description, v.detailed_description, v.objective, v.agenda, v.category, v.start_at, v.end_at, v.location, v.address, v.fee, v.location_link, v.image_urls, v.latitude, v.longitude
from (
  values
    (
      'Mindfulness Walk',
      'A guided mindfulness walk to practice breathing and awareness.',
      'Join us for a guided mindfulness walk to learn grounding techniques and gentle breathing in a calm outdoor environment.',
      'Help participants reduce stress with practical grounding exercises.',
      '08:30 Check-in\n08:45 Guided walk\n09:20 Breathing practice\n09:40 Reflection circle',
      'Activity',
      now() + interval '3 days',
      now() + interval '3 days' + interval '1 hour',
      'Community Park',
      'Community Park, Jalan Taman, 43000 Kajang',
      'Free',
      'https://maps.google.com/?q=Community+Park+Kajang',
      '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200"]'::jsonb,
      null::double precision,
      null::double precision
    ),
    (
      'Mental Health Talk: Coping Skills',
      'A short educational talk and Q&A session.',
      'A practical session covering coping strategies, stress triggers, and when to seek support. Includes Q&A.',
      'Equip attendees with practical coping tools for daily stress.',
      '10:00 Keynote talk\n10:45 Practical examples\n11:20 Q&A',
      'Event',
      now() + interval '7 days',
      now() + interval '7 days' + interval '2 hours',
      'Community Hall',
      'Community Hall, Persiaran Damai, 43000 Kajang',
      'RM10',
      'https://maps.google.com/?q=Community+Hall+Kajang',
      '["https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200"]'::jsonb,
      null::double precision,
      null::double precision
    ),
    (
      'Breathing Workshop',
      'Learn simple breathing exercises for stress relief.',
      'Guided breathing workshop with practice blocks, posture correction, and quick routines for daily stress relief.',
      'Teach participants safe breathing protocols they can apply daily.',
      '14:00 Intro\n14:15 Technique demo\n14:45 Practice set\n15:15 Debrief',
      'Workshop',
      now() + interval '10 days',
      now() + interval '10 days' + interval '90 minutes',
      'Wellness Center',
      'Wellness Center, Jalan Sejahtera, 43000 Kajang',
      'RM15',
      'https://maps.google.com/?q=Wellness+Center+Kajang',
      '["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200"]'::jsonb,
      null::double precision,
      null::double precision
    ),
    (
      'Group Support Session',
      'A peer support session facilitated by a trained moderator.',
      'Safe and structured peer support session focused on sharing coping experiences and mutual encouragement.',
      'Create a supportive and confidential space for peer sharing.',
      '16:00 Welcome\n16:10 Group check-in\n16:40 Guided sharing\n17:00 Close',
      'Support',
      now() + interval '14 days',
      now() + interval '14 days' + interval '1 hour',
      'Clinic Meeting Room',
      'Clinic Meeting Room, Pusat Kesihatan, 43000 Kajang',
      'Free',
      'https://maps.google.com/?q=Clinic+Meeting+Room+Kajang',
      '["https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200"]'::jsonb,
      null::double precision,
      null::double precision
    ),
    (
      'Yoga for Relaxation',
      'Light yoga session focusing on relaxation and recovery.',
      'Beginner-friendly yoga session focused on breathing, mobility, and relaxation for emotional balance.',
      'Improve emotional regulation with movement and mindful breathing.',
      '09:00 Warm-up\n09:15 Flow set\n09:45 Stretch and breathing\n10:00 End',
      'Activity',
      now() + interval '21 days',
      now() + interval '21 days' + interval '1 hour',
      'Fitness Studio',
      'Fitness Studio, Bandar Baru Bangi, 43650 Selangor',
      'RM20',
      'https://maps.google.com/?q=Fitness+Studio+Bangi',
      '["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200"]'::jsonb,
      null::double precision,
      null::double precision
    )
) as v(title, description, detailed_description, objective, agenda, category, start_at, end_at, location, address, fee, location_link, image_urls, latitude, longitude)
where not exists (select 1 from public.events limit 1);

-- Per-user event saves and reminder preferences
create table if not exists public.user_saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  is_saved boolean not null default true,
  reminder_enabled boolean not null default false,
  reminder_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, event_id)
);

create index if not exists user_saved_events_user_idx on public.user_saved_events (user_id);
create index if not exists user_saved_events_event_idx on public.user_saved_events (event_id);

alter table public.user_saved_events enable row level security;

drop trigger if exists trg_user_saved_events_updated_at on public.user_saved_events;
create trigger trg_user_saved_events_updated_at
before update on public.user_saved_events
for each row execute function public.set_updated_at();

do $$ begin
  create policy "users can read own saved events"
  on public.user_saved_events
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can insert own saved events"
  on public.user_saved_events
  for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "users can update own saved events"
  on public.user_saved_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- =========================
-- Example batch (3 records) for educational content media + interactive payload
-- Run anytime to update existing rows
-- =========================
update public.educational_contents
set
  video_url = v.video_url,
  quiz_payload = v.quiz_payload::jsonb,
  activity_payload = v.activity_payload::jsonb
from (
  values
    (
      'Sleep Hygiene Tips',
      'https://www.youtube.com/watch?v=nm1TxQj9IsQ',
      '[{"question":"Which helps sleep quality?","options":["Late caffeine","Consistent bedtime","Bright screen in bed","Irregular wake time"],"answer":1}]',
      '[{"key":"lights","label":"Dim lights one hour before bed"},{"key":"phone","label":"Keep phone away from bed"},{"key":"routine","label":"Follow a fixed sleep routine"}]'
    ),
    (
      'Healthy Coping Skills',
      'https://www.youtube.com/watch?v=hnpQrMqDoqE',
      '[{"question":"A healthy coping step is:","options":["Journaling","Ignoring stress","Skipping meals","Staying isolated"],"answer":0}]',
      '[{"key":"journal","label":"Write 3 lines in your journal"},{"key":"walk","label":"Take a 10-minute mindful walk"},{"key":"support","label":"Talk to one trusted person"}]'
    ),
    (
      'When to Seek Help',
      'https://www.youtube.com/watch?v=QHkXvPq2pQE',
      '[{"question":"Seek professional help when:","options":["Symptoms persist and affect daily function","You had one stressful day","You are only busy","You feel okay"],"answer":0}]',
      '[{"key":"contact","label":"Save one emergency hotline"},{"key":"trusted","label":"Save one trusted contact"},{"key":"plan","label":"Prepare a simple support plan"}]'
    )
) as v(title, video_url, quiz_payload, activity_payload)
where public.educational_contents.title = v.title;
