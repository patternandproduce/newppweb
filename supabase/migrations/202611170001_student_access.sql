-- Student account approval and protected tutorial access.
-- Apply this migration in the Supabase SQL Editor before deploying the frontend.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','staff','student'));
alter table public.profiles add column if not exists approval_status text not null default 'approved';
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles add constraint profiles_approval_status_check check (approval_status in ('pending','approved','denied','revoked'));

-- Existing administrators and staff remain approved. Existing non-admin profiles are not silently granted student access.
update public.profiles set approval_status = 'approved' where role in ('admin','staff');

-- New public sign-ups become inactive student accounts until an administrator approves them.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,username,name,role,active,approval_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'name',''),
    'student',
    false,
    'pending'
  )
  on conflict (id) do update set email=excluded.email;
  return new;
end; $$;

create table if not exists public.student_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','denied','revoked')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create index if not exists student_applications_status_created_idx on public.student_applications(status, created_at desc);
alter table public.student_applications enable row level security;
-- No anon/authenticated policies: all application reads and status changes go through the server-side admin API.

-- Do not expose tutorial video records to anonymous visitors. The public workforce page uses a server-filtered preview.
drop policy if exists "published videos public read" on public.videos;
drop policy if exists "approved users read videos" on public.videos;
create policy "approved users read videos" on public.videos
for select to authenticated
using (
  public.current_user_role() in ('admin','staff')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'student'
      and p.active = true
      and p.approval_status = 'approved'
  )
);

-- Keep phase descriptions public; they do not contain video playback URLs.
