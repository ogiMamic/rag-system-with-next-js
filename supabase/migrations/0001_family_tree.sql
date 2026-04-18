-- Family Tree — schema, RLS, storage bucket
-- Run in Supabase SQL editor once the project is provisioned.

-- Enums
do $$ begin
  create type rel_type as enum ('parent', 'spouse');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('m', 'f', 'o');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.family_trees (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  is_public   boolean not null default false,
  share_slug  text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists family_trees_owner_idx on public.family_trees(owner_id);

create table if not exists public.persons (
  id           uuid primary key default gen_random_uuid(),
  tree_id      uuid not null references public.family_trees(id) on delete cascade,
  first_name   text not null,
  last_name    text,
  maiden_name  text,
  birth_date   date,
  death_date   date,
  gender       gender_type,
  photo_url    text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists persons_tree_idx on public.persons(tree_id);

create table if not exists public.relationships (
  id            uuid primary key default gen_random_uuid(),
  tree_id       uuid not null references public.family_trees(id) on delete cascade,
  person_a_id   uuid not null references public.persons(id) on delete cascade,
  person_b_id   uuid not null references public.persons(id) on delete cascade,
  type          rel_type not null,
  created_at    timestamptz not null default now(),
  unique (person_a_id, person_b_id, type),
  check (person_a_id <> person_b_id)
);

create index if not exists relationships_tree_idx on public.relationships(tree_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists family_trees_touch on public.family_trees;
create trigger family_trees_touch before update on public.family_trees
  for each row execute function public.touch_updated_at();

drop trigger if exists persons_touch on public.persons;
create trigger persons_touch before update on public.persons
  for each row execute function public.touch_updated_at();

-- Row level security
alter table public.family_trees enable row level security;
alter table public.persons enable row level security;
alter table public.relationships enable row level security;

-- family_trees policies
drop policy if exists family_trees_select on public.family_trees;
create policy family_trees_select on public.family_trees
  for select using (auth.uid() = owner_id or is_public);

drop policy if exists family_trees_insert on public.family_trees;
create policy family_trees_insert on public.family_trees
  for insert with check (auth.uid() = owner_id);

drop policy if exists family_trees_update on public.family_trees;
create policy family_trees_update on public.family_trees
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists family_trees_delete on public.family_trees;
create policy family_trees_delete on public.family_trees
  for delete using (auth.uid() = owner_id);

-- persons policies
drop policy if exists persons_select on public.persons;
create policy persons_select on public.persons
  for select using (
    exists (
      select 1 from public.family_trees t
      where t.id = persons.tree_id and (t.owner_id = auth.uid() or t.is_public)
    )
  );

drop policy if exists persons_write on public.persons;
create policy persons_write on public.persons
  for all using (
    exists (
      select 1 from public.family_trees t
      where t.id = persons.tree_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.family_trees t
      where t.id = persons.tree_id and t.owner_id = auth.uid()
    )
  );

-- relationships policies
drop policy if exists relationships_select on public.relationships;
create policy relationships_select on public.relationships
  for select using (
    exists (
      select 1 from public.family_trees t
      where t.id = relationships.tree_id and (t.owner_id = auth.uid() or t.is_public)
    )
  );

drop policy if exists relationships_write on public.relationships;
create policy relationships_write on public.relationships
  for all using (
    exists (
      select 1 from public.family_trees t
      where t.id = relationships.tree_id and t.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.family_trees t
      where t.id = relationships.tree_id and t.owner_id = auth.uid()
    )
  );

-- Storage bucket for photos (run separately in dashboard if needed)
insert into storage.buckets (id, name, public)
values ('tree-photos', 'tree-photos', true)
on conflict (id) do nothing;

-- Storage RLS: owners can upload/delete files in their own user folder
drop policy if exists tree_photos_upload on storage.objects;
create policy tree_photos_upload on storage.objects
  for insert with check (
    bucket_id = 'tree-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists tree_photos_update on storage.objects;
create policy tree_photos_update on storage.objects
  for update using (
    bucket_id = 'tree-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists tree_photos_delete on storage.objects;
create policy tree_photos_delete on storage.objects
  for delete using (
    bucket_id = 'tree-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists tree_photos_read on storage.objects;
create policy tree_photos_read on storage.objects
  for select using (bucket_id = 'tree-photos');
