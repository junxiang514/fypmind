create extension if not exists pgcrypto;

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.emergency_contacts enable row level security;

do $$ begin
  create policy "user can read own emergency contacts"
  on public.emergency_contacts
  for select
  using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user can manage own emergency contacts"
  on public.emergency_contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts (user_id);
