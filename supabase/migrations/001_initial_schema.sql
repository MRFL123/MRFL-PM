-- Mirrorful PM — initial schema
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enumerations as check constraints (database-safe, matches the UI)
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text not null default '',
  owner text not null default '',
  owner_user_id uuid references auth.users (id) on delete set null,
  type text not null,
  logo_url text,
  description text not null default '',
  status text not null default 'None',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_type_check check (
    type in ('Website', 'Mobapp', 'Webapp', 'UXUI Design', 'Branding')
  ),
  constraint projects_status_check check (
    status in ('None', 'On Hold', 'In Progress', 'Delivered', 'Delay')
  )
);

create table if not exists public.project_dashboard (
  project_id uuid primary key references public.projects (id) on delete cascade,
  weekly_title text not null default 'Weekly Updates',
  weekly_content text not null default '',
  prerequisites_title text not null default 'Prerequisite (client)',
  cover_title text not null default '',
  cover_subtitle text not null default 'WEEKLY REPORT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_prerequisites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  text text not null default '',
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  status text not null default 'None',
  start_date date,
  end_date date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_milestones_status_check check (
    status in ('None', 'On Hold', 'In Progress', 'Delivered', 'Delay')
  )
);

create table if not exists public.project_delivered_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_updated_at_idx on public.projects (updated_at desc);
create index if not exists project_prerequisites_project_idx
  on public.project_prerequisites (project_id, sort_order);
create index if not exists project_milestones_project_idx
  on public.project_milestones (project_id, sort_order);
create index if not exists project_delivered_items_project_idx
  on public.project_delivered_items (project_id, sort_order);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function set_updated_at();

drop trigger if exists project_dashboard_set_updated_at on public.project_dashboard;
create trigger project_dashboard_set_updated_at
  before update on public.project_dashboard
  for each row execute function set_updated_at();

drop trigger if exists project_prerequisites_set_updated_at on public.project_prerequisites;
create trigger project_prerequisites_set_updated_at
  before update on public.project_prerequisites
  for each row execute function set_updated_at();

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at
  before update on public.project_milestones
  for each row execute function set_updated_at();

drop trigger if exists project_delivered_items_set_updated_at on public.project_delivered_items;
create trigger project_delivered_items_set_updated_at
  before update on public.project_delivered_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: authenticated staff share the workspace; anon sees nothing
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_dashboard enable row level security;
alter table public.project_prerequisites enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_delivered_items enable row level security;

drop policy if exists "projects_select_authenticated" on public.projects;
drop policy if exists "projects_insert_authenticated" on public.projects;
drop policy if exists "projects_update_authenticated" on public.projects;
drop policy if exists "projects_delete_authenticated" on public.projects;

create policy "projects_select_authenticated" on public.projects
  for select to authenticated using (true);
create policy "projects_insert_authenticated" on public.projects
  for insert to authenticated with check (true);
create policy "projects_update_authenticated" on public.projects
  for update to authenticated using (true) with check (true);
create policy "projects_delete_authenticated" on public.projects
  for delete to authenticated using (true);

drop policy if exists "dashboard_select_authenticated" on public.project_dashboard;
drop policy if exists "dashboard_insert_authenticated" on public.project_dashboard;
drop policy if exists "dashboard_update_authenticated" on public.project_dashboard;
drop policy if exists "dashboard_delete_authenticated" on public.project_dashboard;

create policy "dashboard_select_authenticated" on public.project_dashboard
  for select to authenticated using (true);
create policy "dashboard_insert_authenticated" on public.project_dashboard
  for insert to authenticated with check (true);
create policy "dashboard_update_authenticated" on public.project_dashboard
  for update to authenticated using (true) with check (true);
create policy "dashboard_delete_authenticated" on public.project_dashboard
  for delete to authenticated using (true);

drop policy if exists "prerequisites_select_authenticated" on public.project_prerequisites;
drop policy if exists "prerequisites_insert_authenticated" on public.project_prerequisites;
drop policy if exists "prerequisites_update_authenticated" on public.project_prerequisites;
drop policy if exists "prerequisites_delete_authenticated" on public.project_prerequisites;

create policy "prerequisites_select_authenticated" on public.project_prerequisites
  for select to authenticated using (true);
create policy "prerequisites_insert_authenticated" on public.project_prerequisites
  for insert to authenticated with check (true);
create policy "prerequisites_update_authenticated" on public.project_prerequisites
  for update to authenticated using (true) with check (true);
create policy "prerequisites_delete_authenticated" on public.project_prerequisites
  for delete to authenticated using (true);

drop policy if exists "milestones_select_authenticated" on public.project_milestones;
drop policy if exists "milestones_insert_authenticated" on public.project_milestones;
drop policy if exists "milestones_update_authenticated" on public.project_milestones;
drop policy if exists "milestones_delete_authenticated" on public.project_milestones;

create policy "milestones_select_authenticated" on public.project_milestones
  for select to authenticated using (true);
create policy "milestones_insert_authenticated" on public.project_milestones
  for insert to authenticated with check (true);
create policy "milestones_update_authenticated" on public.project_milestones
  for update to authenticated using (true) with check (true);
create policy "milestones_delete_authenticated" on public.project_milestones
  for delete to authenticated using (true);

drop policy if exists "delivered_select_authenticated" on public.project_delivered_items;
drop policy if exists "delivered_insert_authenticated" on public.project_delivered_items;
drop policy if exists "delivered_update_authenticated" on public.project_delivered_items;
drop policy if exists "delivered_delete_authenticated" on public.project_delivered_items;

create policy "delivered_select_authenticated" on public.project_delivered_items
  for select to authenticated using (true);
create policy "delivered_insert_authenticated" on public.project_delivered_items
  for insert to authenticated with check (true);
create policy "delivered_update_authenticated" on public.project_delivered_items
  for update to authenticated using (true) with check (true);
create policy "delivered_delete_authenticated" on public.project_delivered_items
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "project_assets_select_public" on storage.objects;
drop policy if exists "project_assets_insert_authenticated" on storage.objects;
drop policy if exists "project_assets_update_authenticated" on storage.objects;
drop policy if exists "project_assets_delete_authenticated" on storage.objects;

create policy "project_assets_select_public"
  on storage.objects for select
  using (bucket_id = 'project-assets');

create policy "project_assets_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-assets');

create policy "project_assets_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-assets')
  with check (bucket_id = 'project-assets');

create policy "project_assets_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-assets');

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.projects replica identity full;
alter table public.project_dashboard replica identity full;
alter table public.project_prerequisites replica identity full;
alter table public.project_milestones replica identity full;
alter table public.project_delivered_items replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.projects;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_dashboard;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_prerequisites;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_milestones;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.project_delivered_items;
  exception when duplicate_object then null;
  end;
end $$;
