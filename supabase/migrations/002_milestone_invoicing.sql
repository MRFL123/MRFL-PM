-- Milestone invoicing: extend milestones + invoices table

-- ---------------------------------------------------------------------------
-- Extend project_milestones with billing fields
-- ---------------------------------------------------------------------------

alter table public.project_milestones
  add column if not exists description text not null default '',
  add column if not exists price numeric(12, 2) not null default 0,
  add column if not exists currency text not null default 'EGP';

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  invoice_date date not null default (current_date),
  client text not null default '',
  project_id uuid references public.projects (id) on delete set null,
  milestone_id uuid references public.project_milestones (id) on delete set null,
  description text not null default '',
  amount numeric(12, 2) not null default 0,
  currency text not null default 'EGP',
  status text not null default 'Draft',
  payment_number text not null default '',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_number_unique unique (number),
  constraint invoices_status_check check (
    status in ('Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled')
  ),
  constraint invoices_source_check check (
    source in ('automatic', 'manual')
  )
);

-- One automatic invoice per milestone
create unique index if not exists invoices_one_automatic_per_milestone_idx
  on public.invoices (milestone_id)
  where source = 'automatic' and milestone_id is not null;

create index if not exists invoices_project_idx on public.invoices (project_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_invoice_date_idx on public.invoices (invoice_date desc);
create index if not exists invoices_client_idx on public.invoices (client);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (same pattern: authenticated staff share the workspace)
-- ---------------------------------------------------------------------------

alter table public.invoices enable row level security;

drop policy if exists "invoices_select_authenticated" on public.invoices;
drop policy if exists "invoices_insert_authenticated" on public.invoices;
drop policy if exists "invoices_update_authenticated" on public.invoices;
drop policy if exists "invoices_delete_authenticated" on public.invoices;

create policy "invoices_select_authenticated" on public.invoices
  for select to authenticated using (true);
create policy "invoices_insert_authenticated" on public.invoices
  for insert to authenticated with check (true);
create policy "invoices_update_authenticated" on public.invoices
  for update to authenticated using (true) with check (true);
create policy "invoices_delete_authenticated" on public.invoices
  for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Realtime (optional)
-- ---------------------------------------------------------------------------

alter table public.invoices replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.invoices;
  exception when duplicate_object then null;
  end;
end $$;
