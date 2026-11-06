-- 새 앱(dayzine) 동기화: 카드 · 책 · 휴지통 한 줄씩, 설정 한 줄. 지운 것은 표시만 남겨 다른 기기에서도 지워요
create table public.dz_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('card', 'book', 'trash')),
  id text not null check (char_length(id) between 1 and 64),
  data jsonb,
  deleted boolean not null default false,
  server_at timestamptz not null default clock_timestamp(),
  primary key (user_id, kind, id),
  constraint dz_items_size check (data is null or octet_length(data::text) < 400000)
);
create index dz_items_pull on public.dz_items (user_id, server_at);

create table public.dz_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  server_at timestamptz not null default clock_timestamp(),
  constraint dz_prefs_size check (octet_length(data::text) < 400000)
);

-- 탈퇴 7일: 그 안에 다시 로그인하면 그대로, 지나면 계정과 모든 기록을 지워요
create table public.dz_leaving (
  user_id uuid primary key references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);

create or replace function public.dz_stamp() returns trigger
language plpgsql set search_path = '' as $$
declare n int;
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    if tg_table_name = 'dz_items' then
      select count(*) into n from public.dz_items where user_id = auth.uid();
      if n >= 60000 then raise exception 'limit_items' using errcode = 'P0001'; end if;
    end if;
  else
    new.user_id := old.user_id;
  end if;
  if tg_table_name = 'dz_items' and new.deleted then new.data := null; end if;
  new.server_at := clock_timestamp();
  return new;
end $$;
create trigger dz_items_stamp before insert or update on public.dz_items for each row execute function public.dz_stamp();
create trigger dz_prefs_stamp before insert or update on public.dz_prefs for each row execute function public.dz_stamp();

alter table public.dz_items enable row level security;
alter table public.dz_prefs enable row level security;
alter table public.dz_leaving enable row level security;
create policy dz_items_own_select on public.dz_items for select to authenticated using (user_id = (select auth.uid()));
create policy dz_items_own_insert on public.dz_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy dz_items_own_update on public.dz_items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dz_prefs_own_select on public.dz_prefs for select to authenticated using (user_id = (select auth.uid()));
create policy dz_prefs_own_insert on public.dz_prefs for insert to authenticated with check (user_id = (select auth.uid()));
create policy dz_prefs_own_update on public.dz_prefs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.dz_items, public.dz_prefs, public.dz_leaving from anon, authenticated;
grant select, insert, update on public.dz_items, public.dz_prefs to authenticated;

create or replace function public.dz_leave() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.subscriptions where user_id = auth.uid()
       and status in ('active', 'trialing', 'past_due', 'paused') and cancel_at is null) then
    raise exception 'cancel_subscription_first' using errcode = 'P0001';
  end if;
  insert into public.dz_leaving(user_id) values (auth.uid()) on conflict (user_id) do update set at = now();
end $$;

create or replace function public.dz_stay() returns boolean
language plpgsql security definer set search_path = '' as $$
declare was boolean;
begin
  if auth.uid() is null then return false; end if;
  delete from public.dz_leaving where user_id = auth.uid() returning true into was;
  return coalesce(was, false);
end $$;

create or replace function public.dz_sweep_leaving() returns int
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into public.photo_trash(key) select p.key from public.photos p join public.dz_leaving l on l.user_id = p.user_id where l.at < now() - interval '7 days' on conflict do nothing;
  with gone as (delete from auth.users u using public.dz_leaving l where l.user_id = u.id and l.at < now() - interval '7 days' returning 1)
  select count(*) into n from gone;
  return n;
end $$;

revoke execute on function public.dz_stamp(), public.dz_leave(), public.dz_stay(), public.dz_sweep_leaving() from public, anon, authenticated;
grant execute on function public.dz_leave(), public.dz_stay() to authenticated;

select cron.schedule('dayzine-leaving-sweep', '23 4 * * *', $$select public.dz_sweep_leaving()$$);
