-- Pattern & Produce backend. Apply in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text unique,
  name text not null default '',
  role text not null default 'staff' check (role in ('admin','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,username,name,role,active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), coalesce(new.raw_user_meta_data->>'name',''), 'staff', true)
  on conflict (id) do update set email=excluded.email;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.phases (
  id text primary key, name text not null, description text default '', color text not null default '#777777', icon text not null default 'layers', sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.videos (
  id text primary key,
  provider text not null default 'youtube' check (provider in ('youtube','cloudinary')),
  youtube_id text,
  cloudinary_public_id text,
  video_url text,
  thumbnail_url text,
  title text not null,
  description text default '',
  phase_id text references public.phases(id) on delete set null,
  duration text default '',
  sort_order integer not null default 0,
  published boolean not null default false,
  featured boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint video_source_present check ((provider='youtube' and video_url is null) or (provider='cloudinary' and video_url is not null))
);
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('registrations','consultations','quotes','contacts')),
  data jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','contacted')),
  exported boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists leads_kind_created_idx on public.leads(kind, created_at desc);
create table if not exists public.visits (
  id bigint generated always as identity primary key,
  session_id text not null,
  path text not null,
  device text not null default 'Unknown',
  referrer text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists visits_created_idx on public.visits(created_at desc);
create index if not exists visits_session_idx on public.visits(session_id);

alter table public.profiles enable row level security;
alter table public.phases enable row level security;
alter table public.videos enable row level security;
alter table public.leads enable row level security;
alter table public.visits enable row level security;

create or replace function public.current_user_role() returns text
language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() and active=true $$;

-- Remove existing policies before recreating them.
DROP POLICY IF EXISTS "profile read self or admin" ON public.profiles;
DROP POLICY IF EXISTS "admin update profiles" ON public.profiles;

DROP POLICY IF EXISTS "published phases public read" ON public.phases;
DROP POLICY IF EXISTS "staff manage phases" ON public.phases;

DROP POLICY IF EXISTS "published videos public read" ON public.videos;
DROP POLICY IF EXISTS "staff manage videos" ON public.videos;

DROP POLICY IF EXISTS "staff read leads" ON public.leads;
DROP POLICY IF EXISTS "staff update leads" ON public.leads;
DROP POLICY IF EXISTS "public submit leads" ON public.leads;

DROP POLICY IF EXISTS "staff read visits" ON public.visits;
DROP POLICY IF EXISTS "public record visits" ON public.visits;

-- Recreate all policies.
CREATE POLICY "profile read self or admin"
ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "admin update profiles"
ON public.profiles
FOR UPDATE TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "published phases public read"
ON public.phases
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "staff manage phases"
ON public.phases
FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin','staff'))
WITH CHECK (public.current_user_role() IN ('admin','staff'));

CREATE POLICY "published videos public read"
ON public.videos
FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "staff manage videos"
ON public.videos
FOR ALL TO authenticated
USING (public.current_user_role() IN ('admin','staff'))
WITH CHECK (public.current_user_role() IN ('admin','staff'));

CREATE POLICY "staff read leads"
ON public.leads
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin','staff'));

CREATE POLICY "staff update leads"
ON public.leads
FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('admin','staff'))
WITH CHECK (public.current_user_role() IN ('admin','staff'));

CREATE POLICY "public submit leads"
ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (kind IN ('registrations','consultations','quotes','contacts'));

CREATE POLICY "staff read visits"
ON public.visits
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('admin','staff'));

CREATE POLICY "public record visits"
ON public.visits
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 100
  AND length(path) BETWEEN 1 AND 300
  AND path NOT LIKE '/admin%'
);


-- Seed the current tutorial phases and videos. Existing public/data/videos.json remains a local fallback.

insert into public.phases (id,name,description,color,icon,sort_order) values ('phase-1','Phase 1','Start here: the basics of fashion and garment making.','#d4a24c','book',1) on conflict (id) do nothing;
insert into public.phases (id,name,description,color,icon,sort_order) values ('phase-2','Phase 2','Pattern making and garment construction.','#4fb3a9','scissors',2) on conflict (id) do nothing;
insert into public.phases (id,name,description,color,icon,sort_order) values ('phase-3','Phase 3','Technology: tech packs and digital design.','#7c8cf5','layers',3) on conflict (id) do nothing;
insert into public.phases (id,name,description,color,icon,sort_order) values ('phase-4','Phase 4','Fabrics, production and running a fashion business.','#e0768a','star',4) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v1','youtube',null,'Introduction to Fashion Design','','phase-1','15:30',1,true,true) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v2','youtube',null,'Fashion Terms Every Beginner Should Know','','phase-1','12:05',2,true,true) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v3','youtube',null,'Pattern Making Basics','','phase-2','22:15',3,true,true) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v4','youtube',null,'Sewing a Camp-Collar Shirt','','phase-2','31:40',4,true,true) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v5','youtube',null,'Digital Pattern Making','','phase-3','18:20',5,true,false) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v6','youtube',null,'How to Read a Tech Pack','','phase-3','14:10',6,true,false) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v7','youtube',null,'Fabric Selection Guide','','phase-4','20:10',7,true,false) on conflict (id) do nothing;
insert into public.videos (id,provider,youtube_id,title,description,phase_id,duration,sort_order,published,featured) values ('v8','youtube',null,'Starting Your Fashion Business','','phase-4','25:00',8,true,false) on conflict (id) do nothing;
