-- Newsletter subscriber management. Safe to run after the original newsletter table exists.
create extension if not exists pgcrypto;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists newsletter_subscribers_email_unique
  on public.newsletter_subscribers (lower(email));
create unique index if not exists newsletter_subscribers_unsubscribe_token_unique
  on public.newsletter_subscribers (unsubscribe_token);
create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;
-- Reads and writes are performed only by server-side code using SUPABASE_SECRET_KEY.
-- Do not add anon/authenticated read policies for this table.
