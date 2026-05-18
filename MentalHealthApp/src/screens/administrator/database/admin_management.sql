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

-- 3a) Function used to restrict approvals to head roles
create or replace function public.is_head_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and lower(coalesce(p.role, '')) in (
        lower('Head of Mental Health Consultant'),
        lower('Head of Application Manager')
      )
  );
$$;

create or replace function public.is_head_application_manager(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and lower(coalesce(p.role, '')) = lower('Head of Application Manager')
  );
$$;

create or replace function public.is_head_mental_health_consultant(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and lower(coalesce(p.role, '')) = lower('Head of Mental Health Consultant')
  );
$$;

alter table public.events enable row level security;
alter table public.educational_contents enable row level security;
alter table public.profiles enable row level security;
alter table public.educational_content_progress enable row level security;
alter table public.clinical_tool_responses enable row level security;
alter table public.clinical_tools enable row level security;
alter table public.wellbeing_questions enable row level security;

-- 2a) Audit columns for check-in questions
alter table public.wellbeing_questions
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

-- 3a) Create approval_queue table
create table if not exists public.approval_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_type text not null check (operation_type in ('add', 'delete', 'update')),
  table_name text not null,
  record_id uuid,
  record_data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp not null default now(),
  approved_at timestamp,
  approved_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  created_by_name text,
  updated_at timestamp not null default now()
);

create index if not exists approval_queue_status_idx on public.approval_queue(status);
create index if not exists approval_queue_user_idx on public.approval_queue(user_id);
create index if not exists approval_queue_table_idx on public.approval_queue(table_name);

alter table public.approval_queue enable row level security;

create policy "approval queue admin read"
on public.approval_queue
for select
using (
  public.is_admin(auth.uid())
  and (
    user_id = auth.uid()
    or (
      public.is_head_application_manager(auth.uid())
      and table_name in ('events', 'educational_contents', 'profiles')
    )
    or (
      public.is_head_mental_health_consultant(auth.uid())
      and table_name in ('wellbeing_questions', 'clinical_tools', 'clinical_tool_questions')
    )
  )
);

drop policy if exists "approval queue admin write" on public.approval_queue;
drop policy if exists "approval queue admin insert" on public.approval_queue;
drop policy if exists "approval queue head update" on public.approval_queue;

-- Any admin can create a pending request.
-- Head admins can also insert auto-approved requests for their own operations.
create policy "approval queue admin insert"
on public.approval_queue
for insert
with check (
  public.is_admin(auth.uid())
  and (
    (status = 'pending' and approved_at is null and approved_by is null)
    or (
      public.is_head_application_manager(auth.uid())
      and table_name in ('events', 'educational_contents', 'profiles')
      and status = 'approved'
      and approved_by = auth.uid()
    )
    or (
      public.is_head_mental_health_consultant(auth.uid())
      and table_name in ('wellbeing_questions', 'clinical_tools', 'clinical_tool_questions')
      and status = 'approved'
      and approved_by = auth.uid()
    )
  )
);

-- Only head roles can approve/reject (update status).
create policy "approval queue head update"
on public.approval_queue
for update
using (
  public.is_head_application_manager(auth.uid())
  and table_name in ('events', 'educational_contents', 'profiles')
  or (
    public.is_head_mental_health_consultant(auth.uid())
    and table_name in ('wellbeing_questions', 'clinical_tools', 'clinical_tool_questions')
  )
)
with check (
  public.is_head_application_manager(auth.uid())
  and table_name in ('events', 'educational_contents', 'profiles')
  or (
    public.is_head_mental_health_consultant(auth.uid())
    and table_name in ('wellbeing_questions', 'clinical_tools', 'clinical_tool_questions')
  )
);

drop policy if exists "events public read" on public.events;
drop policy if exists "educational public read" on public.educational_contents;
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;
drop policy if exists "educational progress admin read all" on public.educational_content_progress;
drop policy if exists "clinical responses admin read all" on public.clinical_tool_responses;
drop policy if exists "events admin write" on public.events;
drop policy if exists "educational admin write" on public.educational_contents;
drop policy if exists "profiles admin write" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;

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

create policy "educational progress admin read all"
on public.educational_content_progress
for select
using (public.is_admin(auth.uid()));

create policy "clinical responses admin read all"
on public.clinical_tool_responses
for select
using (public.is_admin(auth.uid()));

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

create policy "profiles own update"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 9) Make your current account admin manually (replace USER_ID)
-- update public.profiles set role = 'admin', is_admin = true where id = 'YOUR_USER_ID_HERE';

-- 10) OPTIONAL: backfill missing profile rows for existing auth users
-- Run this once if the admin page only shows one user because older accounts
-- do not yet have a row in public.profiles.
-- insert into public.profiles (id, email, full_name, role, is_admin, is_active, updated_at)
-- select
--   u.id,
--   u.email,
--   coalesce(u.raw_user_meta_data->>'full_name', u.email, 'User'),
--   case when lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'admin' then 'admin' else 'user' end,
--   case when lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'admin' then true else false end,
--   true,
--   now()
-- from auth.users u
-- left join public.profiles p on p.id = u.id
-- where p.id is null;
