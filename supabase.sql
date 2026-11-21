-- FirstByte shared database — run once in Supabase Dashboard > SQL Editor.
-- Creates the 4 tables + open policies for this short-lived contest.
-- Anyone with the anon key can read/write these tables (that is the point:
-- every participant's browser talks to Supabase directly). Passwords are
-- stored only as SHA-256 hashes, never in plain text. When the contest is
-- over, delete the tables or the whole project.

-- Users (email + password login)
create table if not exists public.firstbyte_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  reg_no text,
  cert_url text,
  pass_hash text not null,
  created_at timestamptz not null default now()
);

-- If the tables already exist (created before v8), run this once instead:
alter table public.firstbyte_users add column if not exists reg_no text;
-- If the tables already exist (created before v15), run this once too:
alter table public.firstbyte_users add column if not exists cert_url text;
-- If the tables already exist (created before v9), run these once too:
alter table public.firstbyte_config add column if not exists base jsonb not null default '{"Easy":100,"Medium":150,"Hard":200}'::jsonb;
alter table public.firstbyte_config add column if not exists wrong_penalty int not null default 10;
alter table public.firstbyte_config add column if not exists minute_penalty int not null default 1;
-- If the tables already exist (created before v10), run this once too:
alter table public.firstbyte_config add column if not exists cleared_at timestamptz;
-- If the tables already exist (created before v14), run these once too:
alter table public.firstbyte_config add column if not exists cert_open boolean not null default false;
alter table public.firstbyte_config add column if not exists cert_image text;

-- Submissions (one row per submit; resubmits add a row)
create table if not exists public.firstbyte_submissions (
  id uuid primary key default gen_random_uuid(),
  cert_id text not null,
  name text not null,
  email text not null,
  question_id text not null,
  question_title text not null,
  language text not null,
  code text not null,
  verify text not null default 'skipped',
  auto boolean not null default false,
  submitted_at timestamptz not null default now(),
  contest_title text not null default 'FirstByte'
);

-- Progress / score per participant per question
create table if not exists public.firstbyte_progress (
  email text not null,
  question_id text not null,
  first_opened_at timestamptz,
  attempts int not null default 0,
  wrong int not null default 0,
  solved_at timestamptz,
  solve_seconds int,
  primary key (email, question_id)
);

-- Contest config (single row, id = 1). questions is the full questions array as JSON.
create table if not exists public.firstbyte_config (
  id int primary key check (id = 1),
  title text not null,
  description text not null,
  rules jsonb not null default '[]'::jsonb,
  duration_min int not null default 60,
  base jsonb not null default '{"Easy":100,"Medium":150,"Hard":200}'::jsonb,
  wrong_penalty int not null default 10,
  minute_penalty int not null default 1,
  cleared_at timestamptz,
  cert_open boolean not null default false,
  cert_image text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  questions jsonb not null default '[]'::jsonb
);

-- Open access for the anon key (short-lived contest only)
alter table public.firstbyte_users enable row level security;
alter table public.firstbyte_submissions enable row level security;
alter table public.firstbyte_progress enable row level security;
alter table public.firstbyte_config enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'firstbyte_users' and policyname = 'firstbyte open') then
    create policy "firstbyte open" on public.firstbyte_users for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'firstbyte_submissions' and policyname = 'firstbyte open') then
    create policy "firstbyte open" on public.firstbyte_submissions for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'firstbyte_progress' and policyname = 'firstbyte open') then
    create policy "firstbyte open" on public.firstbyte_progress for all to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'firstbyte_config' and policyname = 'firstbyte open') then
    create policy "firstbyte open" on public.firstbyte_config for all to anon using (true) with check (true);
  end if;
end $$;
