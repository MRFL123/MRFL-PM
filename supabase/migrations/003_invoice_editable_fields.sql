-- Invoice editable snapshot fields (independent of projects/milestones)
-- Additive only. Safe to re-run. Paste into Supabase SQL editor if columns are missing.

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS project_name text NOT NULL DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS milestone_name text NOT NULL DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_logo_url text;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_tax_id text NOT NULL DEFAULT '233421';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_website text NOT NULL DEFAULT 'www.themirrorful.com';
