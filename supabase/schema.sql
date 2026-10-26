-- =============================================================================
-- CineLog Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ttnaikuvcsotalpprcrt/sql/new
-- =============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  is_public boolean default true not null,
  created_at timestamptz default now() not null
);

-- Index for username lookups on public profile routes (/profile/[username])
create index if not exists idx_profiles_username on public.profiles(username);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles RLS Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (is_public = true);

create policy "Users can view own profile regardless of privacy"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);


-- 2. MEDIA ITEMS TABLE
create table if not exists public.media_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  media_type text not null check (media_type in ('movie', 'series')),
  status text not null check (status in ('currently_watching', 'watched', 'bucketlist')),
  poster_url text,
  runtime_minutes integer default 0 not null,
  total_episodes integer default 1 not null,
  watched_episodes integer default 0 not null,
  ott_platform_name text,
  ott_redirect_url text,
  rating numeric(3,1) check (rating is null or (rating >= 0 and rating <= 10)),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_media_items_user_id on public.media_items(user_id);
create index if not exists idx_media_items_user_status on public.media_items(user_id, status);
create index if not exists idx_media_items_updated_at on public.media_items(updated_at desc);

-- Enable RLS for media_items
alter table public.media_items enable row level security;

-- Media Items RLS Policies
create policy "Users can view own media items"
  on public.media_items
  for select
  using (auth.uid() = user_id);

create policy "Public can view watched items of public profiles"
  on public.media_items
  for select
  using (
    status = 'watched'
    and exists (
      select 1 from public.profiles
      where profiles.id = media_items.user_id
        and profiles.is_public = true
    )
  );

create policy "Users can insert own media items"
  on public.media_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own media items"
  on public.media_items
  for update
  using (auth.uid() = user_id);

create policy "Users can delete own media items"
  on public.media_items
  for delete
  using (auth.uid() = user_id);


-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_user text;
  clean_username text;
begin
  -- Derive default username if not provided in user metadata
  raw_user := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  clean_username := lower(regexp_replace(raw_user, '[^a-zA-Z0-9_]', '', 'g'));

  -- Append short unique suffix if empty or to avoid collision
  if clean_username = '' or clean_username is null then
    clean_username := 'cinephile_' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, username, display_name, avatar_url, is_public)
  values (
    new.id,
    clean_username,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger to execute after auth.users row is inserted
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists handle_media_items_updated_at on public.media_items;
create trigger handle_media_items_updated_at
  before update on public.media_items
  for each row execute procedure public.handle_updated_at();

