-- Resale Outlets — Supabase schema
-- Run this whole file in your Supabase project: SQL Editor > New query > paste > Run.
-- RLS is enabled on every table with permissive starter policies so the
-- browser client (anon key) can read/write. Tighten policies before scaling:
-- restrict writes to the owning user (auth.uid()) per table.

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  display_name text not null default '',
  account_type text not null default 'both' check (account_type in ('buyer','seller','both')),
  is_owner boolean not null default false,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  seller_name text not null default '',
  title text not null,
  brand text not null default '',
  category text not null default '',
  price numeric not null default 0,
  size text not null default '',
  condition text not null default '',
  description text not null default '',
  image_url text not null default '',
  verified boolean not null default false,
  status text not null default 'active' check (status in ('active','sold','removed')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  listing_title text not null default '',
  buyer_id uuid not null,
  seller_id uuid not null,
  amount numeric not null default 0,
  platform_fee numeric not null default 0,
  status text not null default 'paid — held in escrow',
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  listing_title text not null default '',
  buyer_id uuid not null,
  buyer_name text not null default '',
  seller_id uuid not null,
  amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  listing_title text not null default '',
  buyer_id uuid not null,
  buyer_name text not null default '',
  seller_id uuid not null,
  seller_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null,
  sender_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid,
  listing_title text not null default '',
  seller_id uuid not null,
  seller_name text not null default '',
  photos jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

-- Enable RLS + permissive starter policies (anon + authenticated full access).
-- These are intentionally open for launch; replace with per-user policies
-- (using auth.uid()) as the marketplace grows.
do $$
declare t text;
begin
  foreach t in array array['profiles','listings','orders','offers','threads','messages','verification_requests','wishlist']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "starter open access" on public.%I', t);
    execute format('create policy "starter open access" on public.%I for all using (true) with check (true)', t);
  end loop;
end $$;
