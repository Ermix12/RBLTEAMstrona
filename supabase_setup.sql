-- RBL / REBEL TEAM — Supabase schema
-- Wklej cały skrypt w Supabase → SQL Editor → New query → Run.
-- W Authentication → Providers → Email wyłącz "Confirm email",
-- ponieważ nick jest mapowany w aplikacji na techniczny alias e-mail.
-- Nie publikuj klucza service_role w plikach strony.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  roblox_nick text not null default '',
  main_bike text not null default '',
  discord_tag text not null default '',
  rank text not null default 'Rider',
  role text not null default 'member' check (role in ('member','admin')),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.decals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  author text not null,
  asset_id text not null unique check (asset_id ~ '^[0-9]{5,20}$'),
  image_url text,
  tags text[] not null default '{}',
  number text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranking (
  user_id uuid primary key references public.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.create_rbl_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_name text;
begin
  desired_name := coalesce(new.raw_user_meta_data->>'username',
                           split_part(new.email, '@', 1));
  insert into public.users (id, username)
  values (new.id, desired_name)
  on conflict (id) do nothing;
  insert into public.ranking (user_id, points)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rbl on auth.users;
create trigger on_auth_user_created_rbl
after insert on auth.users
for each row execute procedure public.create_rbl_profile();

create or replace function public.is_rbl_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.increment_my_points()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowany.';
  end if;

  insert into public.ranking(user_id, points, updated_at)
  values (auth.uid(), 1, now())
  on conflict (user_id)
  do update set points = public.ranking.points + 1, updated_at = now();

  update public.users
  set points = points + 1
  where id = auth.uid();
end;
$$;

alter table public.users enable row level security;
alter table public.decals enable row level security;
alter table public.ranking enable row level security;

drop policy if exists "Public profiles are readable" on public.users;
create policy "Public profiles are readable"
on public.users for select to anon, authenticated
using (true);

drop policy if exists "Members update own garage only" on public.users;
create policy "Members update own garage only"
on public.users for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Everyone reads approved decals and owners read own queue" on public.decals;
create policy "Everyone reads approved decals and owners read own queue"
on public.decals for select to anon, authenticated
using (status = 'approved' or submitted_by = auth.uid() or public.is_rbl_admin());

drop policy if exists "Members submit pending decals and admins may add" on public.decals;
create policy "Members submit pending decals and admins may add"
on public.decals for insert to authenticated
with check (
  public.is_rbl_admin()
  or (submitted_by = auth.uid() and status = 'pending')
);

drop policy if exists "Only admins update decals" on public.decals;
create policy "Only admins update decals"
on public.decals for update to authenticated
using (public.is_rbl_admin())
with check (public.is_rbl_admin());

drop policy if exists "Only admins delete decals" on public.decals;
create policy "Only admins delete decals"
on public.decals for delete to authenticated
using (public.is_rbl_admin());

drop policy if exists "Ranking is public" on public.ranking;
create policy "Ranking is public"
on public.ranking for select to anon, authenticated
using (true);

-- Column-level grants: gracz może zmieniać garaż, ale nie rangę, rolę ani punkty.
revoke all on public.users from anon, authenticated;
grant select on public.users to anon, authenticated;
grant update (roblox_nick, main_bike, discord_tag) on public.users to authenticated;

revoke all on public.decals from anon, authenticated;
grant select on public.decals to anon, authenticated;
grant insert, update, delete on public.decals to authenticated;

revoke all on public.ranking from anon, authenticated;
grant select on public.ranking to anon, authenticated;

grant execute on function public.is_rbl_admin() to anon, authenticated;
grant execute on function public.increment_my_points() to authenticated;

-- Zdjęcia oklein w publicznym bucketcie. Upload tylko do własnego folderu UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rbl-decals', 'rbl-decals', true, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 12582912;

drop policy if exists "Public can view RBL decal images" on storage.objects;
create policy "Public can view RBL decal images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'rbl-decals');

drop policy if exists "Members upload to own RBL folder" on storage.objects;
create policy "Members upload to own RBL folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'rbl-decals'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins update RBL images" on storage.objects;
create policy "Admins update RBL images"
on storage.objects for update to authenticated
using (bucket_id = 'rbl-decals' and public.is_rbl_admin())
with check (bucket_id = 'rbl-decals' and public.is_rbl_admin());

drop policy if exists "Admins delete RBL images" on storage.objects;
create policy "Admins delete RBL images"
on storage.objects for delete to authenticated
using (bucket_id = 'rbl-decals' and public.is_rbl_admin());

-- Początkowe okleiny z dołączonego data.js. Można wykonać ponownie bez duplikatów.
insert into public.decals (name, brand, author, asset_id, tags, number, status)
values
 ('VIOLET RIOT','KTM','RBL STUDIO','18462073101',array['PURPLE','RACE'],'07','approved'),
 ('SILVERLINE','YAMAHA','MŁODY','18462073102',array['SILVER','CLEAN'],'21','approved'),
 ('NIGHT SHIFT','HUSQVARNA','KACPER','18462073103',array['DARK','RACE'],'13','approved'),
 ('REBEL CORE','SURRON','RBL STUDIO','18462073104',array['RBL','CORE'],'99','approved'),
 ('GRAPHITE X','KAYO','NIKO','18462073105',array['GRAPHITE','MINIMAL'],'44','approved'),
 ('AFTERHOURS','GASGAS','ERMIX','18462073106',array['PURPLE','NIGHT'],'77','approved'),
 ('STATIC FLOW','KAWASAKI','RBL STUDIO','18462073107',array['FLOW','RACE'],'18','approved'),
 ('BAR PAD / RBL','BAR PADY','REBEL TEAM','18462073108',array['BAR PAD','RBL'],'R','approved'),
 ('GRIP PACK 01','GRIPS','REBEL TEAM','18462073109',array['GRIPS','SET'],'01','approved')
on conflict (asset_id) do nothing;

-- Realtime: publikacja zmian dla katalogu, profili i rankingu.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='decals') then
    alter publication supabase_realtime add table public.decals;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='users') then
    alter publication supabase_realtime add table public.users;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='ranking') then
    alter publication supabase_realtime add table public.ranking;
  end if;
end $$;

-- Po utworzeniu konta administratora wykonaj osobno:
-- update public.users set role='admin', rank='Administrator' where username='TWOJ_NICK';
