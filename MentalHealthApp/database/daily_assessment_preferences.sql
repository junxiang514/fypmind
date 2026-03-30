-- Unified user preferences table
-- Combines:
--   1) Daily assessment preferences
--      - question_count
--      - preferred_categories
--   2) Provider finder preferences
--      - auto_use_location

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  question_count integer not null default 6,
  preferred_categories text[] null,
  auto_use_location boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_question_count_check
    check (question_count between 3 and 12)
);

-- Ensure required columns exist if table already existed from a partial migration
alter table public.user_preferences
  add column if not exists question_count integer not null default 6;

alter table public.user_preferences
  add column if not exists preferred_categories text[] null;

alter table public.user_preferences
  add column if not exists auto_use_location boolean not null default false;

alter table public.user_preferences
  add column if not exists created_at timestamptz not null default now();

alter table public.user_preferences
  add column if not exists updated_at timestamptz not null default now();

-- Ensure check constraint exists
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_preferences_question_count_check'
  ) then
    alter table public.user_preferences
      add constraint user_preferences_question_count_check
      check (question_count between 3 and 12);
  end if;
end $$;

-- Optional data migration from old daily_assessment_preferences table
do $$
begin
  if to_regclass('public.daily_assessment_preferences') is not null then
    insert into public.user_preferences (user_id, question_count, preferred_categories)
    select user_id, question_count, preferred_categories
    from public.daily_assessment_preferences
    on conflict (user_id) do update
      set question_count = excluded.question_count,
          preferred_categories = excluded.preferred_categories,
          updated_at = now();
  end if;
end $$;

-- Optional data migration from old provider_finder_preferences table
do $$
begin
  if to_regclass('public.provider_finder_preferences') is not null then
    insert into public.user_preferences (user_id, auto_use_location)
    select user_id, auto_use_location
    from public.provider_finder_preferences
    on conflict (user_id) do update
      set auto_use_location = excluded.auto_use_location,
          updated_at = now();
  end if;
end $$;

alter table public.user_preferences enable row level security;

-- Users can read only their own preferences
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

-- Users can insert only their own preferences
drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update only their own preferences
drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
