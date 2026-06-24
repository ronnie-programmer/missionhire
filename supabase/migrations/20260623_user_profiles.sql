-- User profiles for AI job matching
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text default '',
  target_roles text[] default '{}',
  skills text[] default '{}',
  experience_level text default 'Mid',
  location text default '',
  remote_preference text default 'open',
  resume_text text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users manage own profile" on user_profiles
  for all using (auth.uid() = user_id);

-- Also add salary_range column to job_applications if not already present
alter table job_applications
  add column if not exists salary_range text,
  add column if not exists job_url text,
  add column if not exists applied_date date;
