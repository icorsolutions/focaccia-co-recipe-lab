-- Focaccia Co Recipe Lab schema
-- Run this in Supabase SQL Editor once, after creating the project.

-- Recipes (sandwiches + sauces) with their chef feedback history
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('sandwich', 'sauce')),
  name text not null,
  ingredients text default '',
  method text default '',
  notes text default '',
  feedback_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_type_idx on recipes(type);
create index if not exists recipes_updated_at_idx on recipes(updated_at desc);

-- Consultations: general Q&A threads with Chef Matteo
-- (spread combinations, oil pairings, technique questions, etc.)
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consultations_updated_at_idx on consultations(updated_at desc);

-- Auto-bump updated_at on every update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_updated_at on recipes;
create trigger recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

drop trigger if exists consultations_updated_at on consultations;
create trigger consultations_updated_at
  before update on consultations
  for each row execute function set_updated_at();

-- RLS is OFF intentionally. All access is through the Vercel Functions using
-- the service_role key, gated by APP_PASSWORD. When staff access is added,
-- enable RLS and migrate to real auth.
alter table recipes disable row level security;
alter table consultations disable row level security;
