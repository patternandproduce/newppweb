-- Pattern & Produce: separate form submissions into dedicated tables and
-- keep public.profiles exclusively for staff and administrators.
-- Safe/additive for existing records: old rows in public.leads are retained.

create extension if not exists pgcrypto;

-- Shared columns make each form independently visible/manageable in Table Editor.
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted')),
  exported boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_requests (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted')),
  exported boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_idx on public.contact_submissions(created_at desc);
create index if not exists checklist_requests_created_idx on public.checklist_requests(created_at desc);

alter table public.contact_submissions enable row level security;
alter table public.checklist_requests enable row level security;
-- These tables are written/read through the server API using SUPABASE_SECRET_KEY.
-- No anon/authenticated policies are intentionally created.

-- Migrate legacy student profile identity into student_applications where a
-- corresponding Auth user exists, then remove student rows from profiles.
insert into public.student_applications (user_id, email, full_name, data, status, created_at)
select
  p.id,
  coalesce(p.email, u.email, ''),
  coalesce(p.name, ''),
  jsonb_build_object('legacy_profile_migrated', true, 'name', coalesce(p.name, ''), 'email', coalesce(p.email, u.email, '')),
  case when p.active = true and p.approval_status = 'approved' then 'approved'
       when p.approval_status in ('denied','revoked') then p.approval_status
       else 'pending' end,
  coalesce(p.created_at, now())
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'student'
on conflict (user_id) do nothing;

delete from public.profiles where role = 'student';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','staff'));

-- New Auth signups are students, but student identity/approval is stored only
-- in student_applications. Staff profiles are explicitly created by staff.save.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  return new;
end;
$$;

-- RLS policies on protected tutorial videos can now resolve approved students
-- from student_applications without requiring a profiles row.
create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.active = true and p.role = 'admin'
    ) then 'admin'
    when exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.active = true and p.role = 'staff'
    ) then 'staff'
    when exists (
      select 1 from public.student_applications a
      where a.user_id = auth.uid() and a.status = 'approved'
    ) then 'student'
    else null
  end;
$$;

-- Recreate the protected video policy using the new role resolver.
drop policy if exists "approved users read videos" on public.videos;
create policy "approved users read videos"
on public.videos
for select to authenticated
using (public.current_user_role() in ('admin','staff','student'));

comment on table public.contact_submissions is 'Dedicated general contact form submissions.';
comment on table public.checklist_requests is 'Email requests for the FashionTech tech pack checklist.';
comment on table public.student_applications is 'Student applications, identity link and access approval status. Student profiles are not stored in public.profiles.';
comment on table public.profiles is 'Staff and administrator profiles only.';
