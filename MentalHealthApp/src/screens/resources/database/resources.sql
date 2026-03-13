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
  body text,
  created_at timestamptz not null default now()
);

alter table public.educational_contents enable row level security;

do $$ begin
  create policy "public read educational contents"
  on public.educational_contents
  for select
  using (true);
exception when duplicate_object then null; end $$;

create index if not exists educational_contents_title_idx on public.educational_contents (title);

-- Seed educational contents (only if empty)
insert into public.educational_contents (title, summary, category, body)
select v.title, v.summary, v.category, v.body
from (
  values
    (
      'Understanding Stress',
      'What stress is, common triggers, and healthy coping strategies.',
      'Wellbeing',
      'Stress is a normal response to challenges. Helpful coping strategies include adequate sleep, regular exercise, hydration, and talking to someone you trust. If stress feels overwhelming, consider professional support.'
    ),
    (
      'Basics of Anxiety',
      'Recognize symptoms and learn simple grounding techniques.',
      'Anxiety',
      'Anxiety can involve persistent worry and physical sensations. Try box breathing (inhale 4, hold 4, exhale 4, hold 4) and grounding (name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste).'
    ),
    (
      'Sleep Hygiene Tips',
      'Practical habits that improve sleep quality over time.',
      'Sleep',
      'Aim for a consistent sleep schedule, reduce caffeine late in the day, keep your room cool and dark, and limit screens before bed. If insomnia persists, consult a clinician.'
    ),
    (
      'Healthy Coping Skills',
      'A quick list of coping tools you can use today.',
      'Coping',
      'Try: journaling, short walks, stretching, mindful breathing, calling a friend, listening to calming music, and breaking tasks into smaller steps. Not every skill fits everyone—experiment and keep what helps.'
    ),
    (
      'When to Seek Help',
      'Signs that you may benefit from professional support.',
      'Support',
      'If symptoms persist for weeks, interfere with daily life, or you have thoughts of self-harm, seek professional help. In an emergency, contact local emergency services or a crisis hotline immediately.'
    )
) as v(title, summary, category, body)
where not exists (select 1 from public.educational_contents limit 1);

-- =========================
-- MRM-04: Events & Activities
-- =========================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

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
insert into public.events (title, description, category, start_at, end_at, location, address, latitude, longitude)
select v.title, v.description, v.category, v.start_at, v.end_at, v.location, v.address, v.latitude, v.longitude
from (
  values
    (
      'Mindfulness Walk',
      'A guided mindfulness walk to practice breathing and awareness.',
      'Activity',
      now() + interval '3 days',
      now() + interval '3 days' + interval '1 hour',
      'Community Park',
      'Community Park',
      null::double precision,
      null::double precision
    ),
    (
      'Mental Health Talk: Coping Skills',
      'A short educational talk and Q&A session.',
      'Event',
      now() + interval '7 days',
      now() + interval '7 days' + interval '2 hours',
      'Community Hall',
      'Community Hall',
      null::double precision,
      null::double precision
    ),
    (
      'Breathing Workshop',
      'Learn simple breathing exercises for stress relief.',
      'Workshop',
      now() + interval '10 days',
      now() + interval '10 days' + interval '90 minutes',
      'Wellness Center',
      'Wellness Center',
      null::double precision,
      null::double precision
    ),
    (
      'Group Support Session',
      'A peer support session facilitated by a trained moderator.',
      'Support',
      now() + interval '14 days',
      now() + interval '14 days' + interval '1 hour',
      'Clinic Meeting Room',
      'Clinic Meeting Room',
      null::double precision,
      null::double precision
    ),
    (
      'Yoga for Relaxation',
      'Light yoga session focusing on relaxation and recovery.',
      'Activity',
      now() + interval '21 days',
      now() + interval '21 days' + interval '1 hour',
      'Fitness Studio',
      'Fitness Studio',
      null::double precision,
      null::double precision
    )
) as v(title, description, category, start_at, end_at, location, address, latitude, longitude)
where not exists (select 1 from public.events limit 1);
