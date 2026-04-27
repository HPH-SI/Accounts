-- Run in Supabase SQL Editor (or via CLI) once.
-- Documents are stored as JSON; the app uses the public anon key with RLS below.

create table if not exists public.documents (
  id bigint primary key,
  doc_json jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists documents_updated_at_idx on public.documents (updated_at desc);

alter table public.documents enable row level security;

-- Public anon access: suitable only for a trusted / internal app.
-- Tighten later with auth and user-scoped policies.
create policy "documents allow all for anon"
  on public.documents
  for all
  to anon, authenticated
  using (true)
  with check (true);
