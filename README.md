# MissionHire

A job application tracker built with React and Supabase. Organize your job search with a drag-and-drop Kanban board across five stages: Saved, Applied, Interviewing, Offer, and Rejected.

## Features

- **Authentication** — Register, login, logout, and email confirmation via Supabase Auth
- **Kanban Board** — Drag and drop applications between status columns
- **Full CRUD** — Add, edit, and delete job applications
- **Search** — Filter applications by company, role, or notes
- **Stats Bar** — Live summary of applications by status
- **Error Handling** — Form validation, toast notifications, and API error recovery

## Tech Stack

- **Front-End:** Vite + React, React Router DOM, Tailwind CSS, Axios
- **Back-End:** Supabase (Auth + PostgreSQL)
- **Deployment:** Vercel

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ronnie-programmer/missionhire.git
cd missionhire
npm install
```

### 2. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run this in the SQL Editor:

```sql
create table job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null,
  role_title text not null,
  status text not null default 'saved',
  url text,
  notes text,
  applied_at date,
  source text,
  contact_name text,
  contact_email text,
  follow_up_date date,
  created_at timestamptz default now()
);

alter table job_applications enable row level security;

create policy "Users see own jobs" on job_applications
  for all using (auth.uid() = user_id);
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 4. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Deployment

This project includes a `vercel.json` for SPA routing. To deploy:

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy
