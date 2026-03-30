-- Provider finder preferences are now stored in public.user_preferences
-- (column: auto_use_location)
--
-- Keep this file as a compatibility migration script in case it is run directly.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  question_count integer not null default 6,
  preferred_categories text[] null,
  auto_use_location boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences
  add column if not exists auto_use_location boolean not null default false;

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
