-- Admin setup for web admin portal
-- Run this in Supabase SQL Editor

-- 1) Add role/admin flags to profiles if missing
alter table public.profiles
  add column if not exists role text default 'user',
  add column if not exists is_admin boolean default false,
  add column if not exists is_active boolean default true;

-- 2) Helpful index
create index if not exists profiles_role_idx on public.profiles(role);

-- 3) Function used in policies
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and (coalesce(p.is_admin, false) = true or lower(coalesce(p.role, '')) = 'admin')
  );
$$;

-- 4) Enable RLS (safe if already enabled)
alter table public.events enable row level security;
alter table public.educational_contents enable row level security;
alter table public.profiles enable row level security;

-- 5) Remove old permissive policies if needed (optional)
-- drop policy if exists "public read events" on public.events;
-- drop policy if exists "public read educational contents" on public.educational_contents;

-- 6) Read policies
create policy "events public read"
on public.events
for select
using (true);

create policy "educational public read"
on public.educational_contents
for select
using (true);

create policy "profiles own read"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles admin read all"
on public.profiles
for select
using (public.is_admin(auth.uid()));

-- 7) Admin write policies
create policy "events admin write"
on public.events
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "educational admin write"
on public.educational_contents
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "profiles admin write"
on public.profiles
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- 8) User self-update policy (keep personal profile editable)
create policy "profiles own update"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 9) Make your current account admin manually (replace USER_ID)
-- update public.profiles set role = 'admin', is_admin = true where id = 'YOUR_USER_ID_HERE';
