-- Invoice editable snapshot fields (independent of projects/milestones)

alter table public.invoices
  add column if not exists project_name text not null default '',
  add column if not exists milestone_name text not null default '',
  add column if not exists client_logo_url text,
  add column if not exists company_tax_id text not null default '233421',
  add column if not exists company_website text not null default 'www.themirrorful.com';
