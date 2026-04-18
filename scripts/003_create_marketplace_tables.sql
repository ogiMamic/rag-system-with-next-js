-- Omarska Marketplace — Phase 1 schema
-- Creates: profiles, listings, listing_images, conversations, messages
-- Plus: profile auto-creation trigger, RLS policies, storage bucket for images

-- ============================================================
-- PROFILES (1:1 with auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  full_name text,
  village text,
  phone_e164 text,
  viber_id text unique,
  preferred_lang text not null default 'bs' check (preferred_lang in ('bs','de','en')),
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile row on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('tourism','product')),
  category text not null,
  title text not null,
  description text not null,
  price_minor int not null check (price_minor >= 0),
  currency char(3) not null default 'BAM',
  unit text,
  stock int,
  location_village text,
  status text not null default 'draft' check (status in ('draft','active','paused','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_type_status_idx on listings (type, status);
create index if not exists listings_category_idx on listings (category);
create index if not exists listings_seller_idx on listings (seller_id);
create index if not exists listings_created_idx on listings (created_at desc);
create index if not exists listings_search_idx
  on listings using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

-- ============================================================
-- LISTING IMAGES
-- ============================================================
create table if not exists listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_idx on listing_images (listing_id, position);

-- ============================================================
-- CONVERSATIONS + MESSAGES
-- ============================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index if not exists conversations_buyer_idx on conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_idx on conversations (seller_id, last_message_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- Bump conversation last_message_at on new message
create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on messages;
create trigger on_message_insert
  after insert on messages
  for each row execute function public.bump_conversation_last_message();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_images enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: anyone can read; users update their own; admins can update any
drop policy if exists profiles_select_all on profiles;
create policy profiles_select_all on profiles for select using (true);

drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- listings: public read of active; sellers read all of their own; sellers insert/update/delete own; admin all
drop policy if exists listings_select_public on listings;
create policy listings_select_public on listings for select
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());

drop policy if exists listings_insert_own on listings;
create policy listings_insert_own on listings for insert
  with check (seller_id = auth.uid());

drop policy if exists listings_update_own on listings;
create policy listings_update_own on listings for update
  using (seller_id = auth.uid() or public.is_admin())
  with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists listings_delete_own on listings;
create policy listings_delete_own on listings for delete
  using (seller_id = auth.uid() or public.is_admin());

-- listing_images: read if parent listing readable; write if parent listing owned
drop policy if exists listing_images_select on listing_images;
create policy listing_images_select on listing_images for select using (
  exists (
    select 1 from listings l where l.id = listing_id
      and (l.status = 'active' or l.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists listing_images_write on listing_images;
create policy listing_images_write on listing_images for all
  using (exists (select 1 from listings l where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from listings l where l.id = listing_id and (l.seller_id = auth.uid() or public.is_admin())));

-- conversations: participants only
drop policy if exists conversations_select on conversations;
create policy conversations_select on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists conversations_insert on conversations;
create policy conversations_insert on conversations for insert
  with check (auth.uid() = buyer_id);

drop policy if exists conversations_update on conversations;
create policy conversations_update on conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

-- messages: participants only
drop policy if exists messages_select on messages;
create policy messages_select on messages for select using (
  exists (
    select 1 from conversations c where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from conversations c where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

-- ============================================================
-- STORAGE BUCKET for listing images
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

drop policy if exists listing_images_storage_select on storage.objects;
create policy listing_images_storage_select on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists listing_images_storage_insert on storage.objects;
create policy listing_images_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists listing_images_storage_delete on storage.objects;
create policy listing_images_storage_delete on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ============================================================
-- REALTIME (enable for messages so chat updates live)
-- ============================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
