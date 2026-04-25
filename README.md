# Deadwax — Version Control for Producers

GitHub for beats. Commit versions, branch ideas, collaborate, and own every contribution on record.

## Stack

- **React + Vite** — frontend
- **Supabase** — auth (magic link), database (Postgres), storage (stems)
- **WaveSurfer.js** — in-browser waveform rendering
- **Tailwind CSS v4** — utility classes (minimal use)

## Local Setup

```bash
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase Setup

### 1. Auth

In the Supabase dashboard → **Authentication → Settings**:
- Enable **Email (magic link)** — disable "Confirm email" if you want instant sign-in
- Set **Site URL** to `http://localhost:5173` (dev) or your production domain
- Add `http://localhost:5173/**` to **Redirect URLs**

### 2. Database — run this SQL in the Supabase SQL editor

```sql
-- Projects (beat repositories)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bpm integer,
  key text,
  genre text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_name text not null default 'main',
  parent_project_id uuid references projects(id) on delete set null,
  invite_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Commits (snapshots)
create table if not exists commits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default now()
);

-- Stems (audio files per commit)
create table if not exists stems (
  id uuid primary key default gen_random_uuid(),
  commit_id uuid not null references commits(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_size_bytes bigint not null default 0,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

-- Collaborators
create table if not exists collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'contributor',
  joined_at timestamptz not null default now(),
  unique(project_id, user_id)
);

-- Timestamped comments (pinned to waveform positions)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  stem_id uuid not null references stems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  time_seconds numeric not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_commits_project on commits(project_id);
create index if not exists idx_stems_commit on stems(commit_id);
create index if not exists idx_stems_project on stems(project_id);
create index if not exists idx_collaborators_user on collaborators(user_id);
create index if not exists idx_comments_stem on comments(stem_id);
```

### 3. Row-Level Security — run this SQL after creating tables

```sql
-- Enable RLS on all tables
alter table projects enable row level security;
alter table commits enable row level security;
alter table stems enable row level security;
alter table collaborators enable row level security;
alter table comments enable row level security;

-- Helper: check if user is owner or collaborator on a project
create or replace function is_project_member(p_project_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from projects where id = p_project_id and owner_id = auth.uid()
    union
    select 1 from collaborators where project_id = p_project_id and user_id = auth.uid()
  )
$$;

-- Projects: owners see all their projects; collaborators see shared ones
create policy "projects_select" on projects for select using (
  owner_id = auth.uid() or
  exists (select 1 from collaborators where project_id = projects.id and user_id = auth.uid())
);
create policy "projects_insert" on projects for insert with check (owner_id = auth.uid());
create policy "projects_update" on projects for update using (owner_id = auth.uid());
create policy "projects_delete" on projects for delete using (owner_id = auth.uid());

-- Invite lookup (public — anyone with token can look up project name)
create policy "projects_invite_lookup" on projects for select using (true);

-- Commits: members can read; members can insert
create policy "commits_select" on commits for select using (is_project_member(project_id));
create policy "commits_insert" on commits for insert with check (
  user_id = auth.uid() and is_project_member(project_id)
);

-- Stems: members can read; members can insert
create policy "stems_select" on stems for select using (is_project_member(project_id));
create policy "stems_insert" on stems for insert with check (
  uploaded_by = auth.uid() and is_project_member(project_id)
);

-- Collaborators: anyone can read (for invite flow); anyone can join
create policy "collaborators_select" on collaborators for select using (true);
create policy "collaborators_insert" on collaborators for insert with check (user_id = auth.uid());

-- Comments: members can read; members can insert
create policy "comments_select" on comments for select using (
  exists (
    select 1 from stems s
    join projects p on p.id = s.project_id
    where s.id = comments.stem_id and is_project_member(p.id)
  )
);
create policy "comments_insert" on comments for insert with check (user_id = auth.uid());
```

### 4. Storage bucket

In the Supabase dashboard → **Storage**:

1. Create a bucket named `stems`
2. Set it to **private**
3. Add these storage policies in the SQL editor:

```sql
-- Members can upload stems
create policy "stems_upload" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'stems' and auth.uid()::text = (storage.foldername(name))[1]);

-- Members can read stems (signed URLs handle auth)
create policy "stems_read" on storage.objects for select
  to authenticated
  using (bucket_id = 'stems');
```

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

## User Flow

1. Land on homepage → sign in with magic link
2. Create a project (name, BPM, key, genre) → `/new`
3. Hit **+ Commit** → drag in stems → write message → submit
4. Back on project page: click a commit in the timeline → stems load with waveforms
5. Click the waveform → type a comment → hit **Pin** → blue marker appears
6. Hit **⑂ Branch** → name it → new forked project is created
7. Hit **⬡ Invite** → copy link → send to collaborator → they join and commit stems
8. Hit **Log** → see every action ever taken, timestamped, with event numbers
