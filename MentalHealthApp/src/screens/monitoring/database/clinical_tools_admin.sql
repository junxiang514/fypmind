-- Clinical tools admin controls
-- Run in Supabase SQL Editor after clinical_tools.sql

alter table if exists public.clinical_tools
  add column if not exists is_active boolean not null default true;

update public.clinical_tools
set is_active = true
where is_active is null;

create index if not exists clinical_tools_active_idx
  on public.clinical_tools(is_active, code);

-- Allow admins to create/update clinical tool sets
-- Admin condition follows the same pattern used in daily_assessment.sql

do $$ begin
  create policy "admin manage clinical tools"
  on public.clinical_tools
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

-- Allow admins to read all response rows for analytics (submission counts)
do $$ begin
  create policy "admin read clinical responses"
  on public.clinical_tool_responses
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (coalesce(p.is_admin, false) = true or lower(coalesce(p.role, '')) = 'admin')
    )
  );
exception when duplicate_object then null; end $$;
