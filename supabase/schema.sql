-- =====================================================================
-- Daytale v1.0 — 데이터베이스 전체 (새 Supabase 프로젝트용)
-- Supabase → SQL Editor에 전체를 붙여 넣고 실행하세요. 여러 번 실행해도 안전합니다.
-- 순서: schema.sql → admin.sql
--
-- 원칙
--  · 내 기록은 나만 봅니다(공유 없음). 모든 표에 RLS를 겁니다.
--  · 체험(가입 후 30일) 또는 구독 중일 때만 새로 쓰고 고칠 수 있습니다.
--    체험이 끝나도 읽기, 검색, 백업, 휴지통으로 보내기, 삭제는 언제나 됩니다.
--  · 체험 기간, 구독, 관리자 여부는 사용자가 직접 바꿀 수 없습니다.
-- =====================================================================

-- ---------- 회원 정보 ----------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  display_name       text check (char_length(display_name) <= 40),
  lang               text check (lang ~ '^[a-z]{2}(-[A-Z]{2})?$'),          -- 앱 언어 (기기 언어에서 고름)
  country            text check (country ~ '^[A-Z]{2}$'),                  -- 가격·날씨 도시·명절·통계용
  timezone           text check (char_length(timezone) <= 64),
  trial_ends_at      timestamptz not null default (now() + interval '30 days'),
  bonus_days         int not null default 0 check (bonus_days between 0 and 365), -- 친구 초대 보너스
  referral_code      text unique default substr(md5(gen_random_uuid()::text), 1, 8),
  referred_by        uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  deletion_notice_at timestamptz,                                          -- 1년 미접속 안내 메일을 보낸 때
  updated_at         timestamptz not null default now()
);
-- 프로필 사진: 256px로 줄인 사진(data URL, 약 10KB) 또는 Google 사진 주소. 사진 저장소(R2) 없이 계정 정보에 둬요.
alter table public.profiles add column if not exists avatar text;
alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check check (avatar is null or (char_length(avatar) <= 60000 and avatar ~ '^(data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+|https://[^[:space:]"<>]+)$'));
create index if not exists profiles_seen_idx on public.profiles(last_seen_at);
create index if not exists profiles_country_idx on public.profiles(country);
alter table public.profiles enable row level security;
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- 사용자가 바꿀 수 있는 칸만 허용 (체험 기간·보너스·초대 정보는 서버만)
grant update (display_name, lang, country, timezone, avatar) on public.profiles to authenticated;

-- 가입하면 회원 정보가 자동으로 생깁니다
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, lang, display_name)
  values (new.id, new.email,
          case when coalesce(new.raw_user_meta_data->>'lang', '') ~ '^[a-z]{2}$' then new.raw_user_meta_data->>'lang' end,
          nullif(left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 40), ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- 구독 (Paddle 웹훅만 씁니다) ----------
create table if not exists public.subscriptions (
  subscription_id     text primary key,                       -- Paddle sub_…
  user_id             uuid references auth.users(id) on delete cascade,
  customer_id         text,
  status              text not null,                          -- active · trialing · past_due · paused · canceled
  plan                text check (plan in ('monthly', 'yearly')),
  price_id            text,
  currency            text,
  amount              numeric,                                -- 한 번 결제 금액(통화 단위)
  country             text,                                   -- Paddle 청구 국가
  current_period_end  timestamptz,
  cancel_at           timestamptz,
  update_payment_url  text,
  cancel_url          text,
  event_at            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id, updated_at desc);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own" on public.subscriptions for select using (user_id = auth.uid());
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create or replace function public.is_subscriber(u uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.subscriptions where user_id = u and status in ('active', 'trialing', 'past_due'))
$$;

-- 쓰기 가능 = 구독 중이거나 체험 기간 안
create or replace function public.can_write(u uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_subscriber(u) or exists (
    select 1 from public.profiles p where p.id = u and p.trial_ends_at + make_interval(days => p.bonus_days) > now())
$$;

-- ---------- 관리자 명단 (admin.sql에서 함수 추가) ----------
create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 대표 계정은 가입하는 순간 owner 관리자가 됩니다 (비밀번호는 저장하지 않음)
create table if not exists public.owner_emails (email text primary key);
alter table public.owner_emails enable row level security;
revoke all on public.owner_emails from anon, authenticated;
insert into public.owner_emails values ('24story@gmail.com') on conflict do nothing;
create or replace function public.grant_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.owner_emails o where lower(o.email) = lower(new.email)) then
    insert into public.admins (user_id, role, note) values (new.id, 'owner', 'owner email') on conflict (user_id) do update set role = 'owner';
  end if;
  return new;
end $$;
drop trigger if exists profiles_grant_owner on public.profiles;
-- 이메일 확인이 끝난 계정만 owner가 돼요 (Google 로그인은 처음부터 확인된 상태)
create or replace function public.grant_owner_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and exists (select 1 from public.owner_emails o where lower(o.email) = lower(new.email)) then
    insert into public.admins (user_id, role, note) values (new.id, 'owner', 'owner email') on conflict (user_id) do update set role = 'owner';
  end if;
  return new;
end $$;
drop trigger if exists auth_grant_owner on auth.users;
create trigger auth_grant_owner after insert or update of email_confirmed_at on auth.users for each row execute function public.grant_owner_confirmed();
-- 이미 가입한 대표 계정도 반영
insert into public.admins (user_id, role, note)
  select u.id, 'owner', 'owner email' from auth.users u join public.owner_emails o on lower(o.email) = lower(u.email)
   where u.email_confirmed_at is not null
  on conflict (user_id) do update set role = 'owner';

-- ---------- 폴더 ----------
create table if not exists public.folders (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 40),
  color              text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort               int not null default 0,
  created_at         timestamptz not null default now(),
  client_updated_at  timestamptz,
  version            int not null default 1,
  updated_at         timestamptz not null default now()
);
create index if not exists folders_user_idx on public.folders(user_id, updated_at);

-- ---------- 기록 ----------
create table if not exists public.entries (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type               text not null default 'note' check (char_length(type) <= 24),  -- note · todo · event · idea · item · personal · scrap · 사용자 종류
  title              text not null default '' check (char_length(title) <= 300),
  content            text not null default '' check (char_length(content) <= 200000),
  content_text       text not null default '' check (char_length(content_text) <= 100000),
  folder_id          uuid references public.folders(id) on delete set null,
  tags               text[] not null default '{}' check (cardinality(tags) <= 20),
  favorite           boolean not null default false,
  pinned             boolean not null default false,
  meta               jsonb not null default '{}' check (pg_column_size(meta) <= 8000),  -- 일정 날짜, 할 일 완료, 장소 등
  photos             jsonb not null default '[]' check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 4),
  created_at         timestamptz not null default now(),
  client_updated_at  timestamptz,
  deleted_at         timestamptz,
  version            int not null default 1,
  updated_at         timestamptz not null default now()
);
create index if not exists entries_user_upd_idx on public.entries(user_id, updated_at);
create index if not exists entries_user_created_idx on public.entries(user_id, created_at);

-- ---------- 사진 (원본·미리보기는 Cloudflare R2, 여기는 목록과 용량만) ----------
create table if not exists public.photos (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  entry_id     uuid,
  key          text not null,                -- R2 경로: <user_id>/<id>.webp|.jpg (미리보기는 <id>.t.webp|.t.jpg)
  bytes        int not null check (bytes between 1 and 3000000),
  thumb_bytes  int not null default 0 check (thumb_bytes between 0 and 300000),
  width        int, height int,
  created_at   timestamptz not null default now()
);
create index if not exists photos_user_idx on public.photos(user_id);
-- 지운 사진의 R2 파일은 정리 함수가 이 목록을 보고 지웁니다
create table if not exists public.photo_trash (key text primary key, deleted_at timestamptz not null default now());

-- ---------- 삭제 표시 (다른 기기에서 지운 것을 알기 위해) ----------
create table if not exists public.deleted_records (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  record_id   uuid not null,
  table_name  text not null,
  deleted_at  timestamptz not null default now()
);
create index if not exists deleted_records_user_idx on public.deleted_records(user_id, deleted_at);

-- ---------- 설정 ----------
create table if not exists public.user_settings (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  prefs       jsonb not null default '{}' check (pg_column_size(prefs) <= 16000),
  updated_at  timestamptz not null default now()
);

-- ---------- 이야기 문장 묶음 (앱 배포 없이 계절·명절 문장 추가) ----------
create table if not exists public.phrase_packs (
  id          bigint generated always as identity primary key,
  lang        text not null,
  slot        text not null,     -- greet · air · plan · stack · recall · close · ask
  cond        jsonb not null default '{}',   -- {"tod":"morning","season":"autumn","weather":"rain","dow":1,"holiday":"chuseok"}
  text        text not null check (char_length(text) <= 300),
  weight      int not null default 1,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
create index if not exists phrase_packs_lang_idx on public.phrase_packs(lang, updated_at);

-- ---------- 날씨 저장 (MET Norway, 서버 함수만 씀) ----------
create table if not exists public.weather_cache (
  cell        text primary key,    -- 위도·경도 0.1도 칸 "37.5,127.0"
  data        jsonb not null,
  fetched_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
alter table public.weather_cache enable row level security;
revoke all on public.weather_cache from anon, authenticated;

-- ---------- 앱 안 알림 ----------
create table if not exists public.notices (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade,   -- 비어 있으면 모두에게
  kind        text not null,      -- trial_7d · trial_3d · announce · ...
  lang        text,
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists notices_user_idx on public.notices(user_id, created_at desc);

-- =====================================================================
-- 트리거: 주인·버전·시간 고정, 삭제 표시, 쓰기 잠금
-- =====================================================================
create or replace function public.stamp_row() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.version := 1; new.updated_at := clock_timestamp();
    if new.created_at is null or new.created_at > now() + interval '1 day' then new.created_at := now(); end if;
  else
    new.user_id := old.user_id; new.id := old.id; new.created_at := old.created_at;
    new.version := old.version + 1; new.updated_at := clock_timestamp();
  end if;
  -- 내 폴더가 아닌 폴더 id는 비움
  if tg_table_name = 'entries' then
    if new.folder_id is not null
       and not exists (select 1 from public.folders f where f.id = new.folder_id and f.user_id = new.user_id) then
      new.folder_id := null;
    end if;
  end if;
  return new;
end $$;

-- 체험이 끝난 뒤에는 휴지통 보내기·되살리기·즐겨찾기만 허용 (글 내용은 못 바꿈)
create or replace function public.write_gate() returns trigger
language plpgsql as $$
begin
  if public.can_write(auth.uid()) then return new; end if;
  if tg_op = 'INSERT' then raise exception 'write_locked' using errcode = 'P0001'; end if;
  if tg_table_name = 'entries' and (new.type, new.title, new.content, new.content_text, new.folder_id, new.tags, new.meta, new.photos)
       is not distinct from (old.type, old.title, old.content, old.content_text, old.folder_id, old.tags, old.meta, old.photos) then
    return new;
  end if;
  raise exception 'write_locked' using errcode = 'P0001';
end $$;

create or replace function public.tombstone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.deleted_records(user_id, record_id, table_name) values (old.user_id, old.id, tg_table_name);
  return old;
end $$;

create or replace function public.limit_rows() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'folders' then
    select count(*) into n from public.folders where user_id = auth.uid();
    if n >= 50 then raise exception 'limit_folders' using errcode = 'P0001'; end if;
  elsif tg_table_name = 'entries' then
    select count(*) into n from public.entries where user_id = auth.uid();
    if n >= 50000 then raise exception 'limit_entries' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;

create or replace function public.photo_gone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.photo_trash(key) values (old.key) on conflict do nothing;
  insert into public.photo_trash(key) values (regexp_replace(old.key, '\.(webp|jpg)$', '.t.\1')) on conflict do nothing;
  return old;
end $$;

do $$ declare t text; begin
  foreach t in array array['folders', 'entries'] loop
    execute format('drop trigger if exists %1$s_stamp on public.%1$s', t);
    execute format('create trigger %1$s_stamp before insert or update on public.%1$s for each row execute function public.stamp_row()', t);
    execute format('drop trigger if exists %1$s_gate on public.%1$s', t);
    execute format('create trigger %1$s_gate before insert or update on public.%1$s for each row execute function public.write_gate()', t);
    execute format('drop trigger if exists %1$s_limit on public.%1$s', t);
    execute format('create trigger %1$s_limit before insert on public.%1$s for each row execute function public.limit_rows()', t);
    execute format('drop trigger if exists %1$s_tomb on public.%1$s', t);
    execute format('create trigger %1$s_tomb after delete on public.%1$s for each row execute function public.tombstone()', t);
  end loop;
end $$;
-- 글 용량 한도: 한 사람이 무료 DB(500MB)를 다 채우지 못하게 100MB까지 (글만 100MB면 수십만 쪽이에요)
alter table public.profiles add column if not exists content_bytes bigint not null default 0;
create or replace function public.entry_size(e public.entries) returns bigint language sql immutable as $$
  select (octet_length(e.title) + octet_length(e.content) + octet_length(e.content_text) + pg_column_size(e.meta))::bigint $$;
create or replace function public.count_bytes() returns trigger
language plpgsql security definer set search_path = public as $$
declare d bigint; total bigint;
begin
  if tg_op = 'DELETE' then
    update public.profiles set content_bytes = greatest(content_bytes - public.entry_size(old), 0) where id = old.user_id;
    return old;
  end if;
  d := public.entry_size(new) - case when tg_op = 'UPDATE' then public.entry_size(old) else 0 end;
  if d <> 0 then
    update public.profiles set content_bytes = greatest(content_bytes + d, 0) where id = new.user_id returning content_bytes into total;
    if d > 0 and total > 100 * 1024 * 1024 then raise exception 'limit_bytes' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
drop trigger if exists entries_bytes on public.entries;
create trigger entries_bytes before insert or update on public.entries for each row execute function public.count_bytes();
drop trigger if exists entries_bytes_del on public.entries;
create trigger entries_bytes_del after delete on public.entries for each row execute function public.count_bytes();
update public.profiles p set content_bytes = coalesce((select sum(public.entry_size(e)) from public.entries e where e.user_id = p.id), 0);

drop trigger if exists photos_gone on public.photos;
create trigger photos_gone after delete on public.photos for each row execute function public.photo_gone();

-- =====================================================================
-- 권한 (RLS)
-- =====================================================================
alter table public.folders enable row level security;
alter table public.entries enable row level security;
alter table public.photos enable row level security;
alter table public.photo_trash enable row level security;
alter table public.deleted_records enable row level security;
alter table public.user_settings enable row level security;
alter table public.phrase_packs enable row level security;
alter table public.notices enable row level security;

do $$ declare t text; begin
  foreach t in array array['folders', 'entries'] loop
    execute format('drop policy if exists "%1$s: own" on public.%1$s', t);
    execute format('create policy "%1$s: own" on public.%1$s for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
drop policy if exists "photos: read own" on public.photos;
create policy "photos: read own" on public.photos for select using (user_id = auth.uid());
drop policy if exists "photos: delete own" on public.photos;
create policy "photos: delete own" on public.photos for delete using (user_id = auth.uid());
drop policy if exists "tomb: read own" on public.deleted_records;
create policy "tomb: read own" on public.deleted_records for select using (user_id = auth.uid());
drop policy if exists "settings: own" on public.user_settings;
create policy "settings: own" on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "phrases: read" on public.phrase_packs;
create policy "phrases: read" on public.phrase_packs for select to authenticated using (active);
drop policy if exists "notices: read own" on public.notices;
create policy "notices: read own" on public.notices for select using (user_id = auth.uid() or user_id is null);
drop policy if exists "notices: mark read" on public.notices;
create policy "notices: mark read" on public.notices for update using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.folders, public.entries, public.photos, public.photo_trash, public.deleted_records,
  public.user_settings, public.phrase_packs, public.notices from anon, authenticated;
grant select, insert, update, delete on public.folders, public.entries to authenticated;
grant select, delete on public.photos to authenticated;          -- 추가는 서버 함수(용량 확인)만
grant select on public.deleted_records, public.phrase_packs, public.notices to authenticated;
grant update (read_at) on public.notices to authenticated;
grant select, insert, update on public.user_settings to authenticated;

-- =====================================================================
-- 앱이 부르는 함수
-- =====================================================================
-- 앱이 한 번에 읽는 내 상태
create or replace function public.my_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'trial_ends_at', p.trial_ends_at + make_interval(days => p.bonus_days),
    'subscriber', public.is_subscriber(p.id),
    'can_write', public.can_write(p.id),
    'referral_code', p.referral_code,
    'photo_count', (select count(*) from public.photos where user_id = p.id),
    'photo_bytes', (select coalesce(sum(bytes + thumb_bytes), 0) from public.photos where user_id = p.id),
    'plan', (select plan from public.subscriptions s where s.user_id = p.id order by updated_at desc limit 1),
    'cancel_at', (select cancel_at from public.subscriptions s where s.user_id = p.id order by updated_at desc limit 1),
    'is_admin', exists (select 1 from public.admins a where a.user_id = p.id)
  ) from public.profiles p where p.id = auth.uid()
$$;

-- 접속 표시 (1년 미접속 정리 기준). 하루에 한 번 정도 앱이 부릅니다.
create or replace function public.touch_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now(), deletion_notice_at = null where id = auth.uid()
$$;

-- 친구 초대 코드 사용: 가입 후 30일 안에 한 번, 두 사람 모두 30일 추가
create or replace function public.redeem_referral(code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare me public.profiles; them public.profiles;
begin
  select * into me from public.profiles where id = auth.uid() for update;   -- 동시에 여러 번 불러도 한 번만
  if me.id is null or me.referred_by is not null or me.created_at < now() - interval '30 days' then return false; end if;
  select * into them from public.profiles where referral_code = lower(trim(code));
  if them.id is null or them.id = me.id then return false; end if;
  update public.profiles set referred_by = them.id, bonus_days = least(bonus_days + 30, 365) where id = me.id and referred_by is null;
  if not found then return false; end if;
  update public.profiles set bonus_days = least(bonus_days + 30, 365) where id = them.id;
  return true;
end $$;

-- ---------- 계정 삭제 (설정 > 데이터) ----------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if public.is_subscriber(auth.uid()) and exists (select 1 from public.subscriptions where user_id = auth.uid()
       and status in ('active', 'trialing', 'past_due', 'paused') and cancel_at is null) then
    raise exception 'cancel_subscription_first' using errcode = 'P0001';
  end if;
  insert into public.photo_trash(key) select key from public.photos where user_id = auth.uid() on conflict do nothing;
  insert into public.photo_trash(key) select regexp_replace(key, '\.(webp|jpg)$', '.t.\1') from public.photos where user_id = auth.uid() on conflict do nothing;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- 사진 서버 함수용 (service_role 전용) ----------
create or replace function public.photo_allowance(uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'subscriber', public.is_subscriber(uid),
    'can_write', public.can_write(uid),
    'count', (select count(*) from public.photos where user_id = uid),
    'bytes', (select coalesce(sum(bytes + thumb_bytes), 0) from public.photos where user_id = uid),
    -- 지웠지만 아직 R2에서 정리되지 않은 사진도 셈해요 (올리고 지우기를 반복해 한도를 넘지 못하게)
    'pending', (select count(*) from public.photo_trash t where t.key like uid::text || '/%' and t.key !~ '\.t\.(webp|jpg)$'))
$$;
-- 하루가 지나도 어느 기록에도 붙어 있지 않은 사진(기록에서 뺐거나 기록을 완전히 지운 경우) → 삭제(트리거가 photo_trash로)
create or replace function public.sweep_orphan_photos() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.photos p
   where p.created_at < now() - interval '1 day'
     and not exists (select 1 from public.entries e where e.user_id = p.user_id   -- 충돌 사본처럼 다른 기록으로 옮겨 가도 지키기
                       and e.photos @> jsonb_build_array(jsonb_build_object('id', p.id::text)));
  get diagnostics n = row_count;
  return n;
end $$;

-- Supabase는 새 함수를 모두에게 열어 두므로, 전부 닫고 앱이 쓰는 것만 엽니다
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_subscriber(uuid), public.can_write(uuid), public.my_status(), public.touch_seen(),
  public.redeem_referral(text), public.delete_my_account() to authenticated;
grant execute on function public.photo_allowance(uuid), public.sweep_orphan_photos() to service_role;
