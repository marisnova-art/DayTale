-- =====================================================================
-- 2026-10-14 회원 구성 (나라·언어·기기·유입 경로) — 이미 schema.sql·admin.sql을 실행한 데이터베이스에 이것만 붙여 넣고 Run.
-- (schema.sql·admin.sql에도 같은 내용이 들어 있어요. 여러 번 실행해도 안전해요. 지우거나 바꾸는 데이터 없음)
--  · 기기 종류(운영체제·폰/태블릿/컴퓨터·브라우저 계열·홈 화면 설치 여부)와 처음 어디서 왔는지(utm·참조 사이트 도메인)만,
--    짧은 정해진 값으로 저장해요. 기록 내용·IP·기기 고유값은 저장하지 않아요. 관리자 화면은 합계만 봐요.
-- =====================================================================

-- ---------- schema.sql 부분 ----------
alter table public.profiles add column if not exists platform       text;   -- ios · android · mac · windows · linux · chromeos · other
alter table public.profiles add column if not exists device_kind    text;   -- phone · tablet · desktop
alter table public.profiles add column if not exists browser        text;   -- safari · chrome · edge · firefox · samsung · opera · inapp · other
alter table public.profiles add column if not exists installed      boolean; -- 홈 화면에 설치한 앱으로 열었나 (하루 한 번 갱신)
alter table public.profiles add column if not exists device_at      timestamptz;
alter table public.profiles add column if not exists first_source   text;   -- 처음 온 곳: utm_source 또는 참조 사이트 (google, instagram, direct …)
alter table public.profiles add column if not exists first_medium   text;   -- utm_medium (cpc, social, referral …)
alter table public.profiles add column if not exists first_campaign text;   -- utm_campaign
alter table public.profiles add column if not exists first_landing  text;   -- 처음 연 페이지: app 또는 /en /ko /ja /es /fr
alter table public.profiles drop constraint if exists profiles_platform_check;
alter table public.profiles add constraint profiles_platform_check check (platform in ('ios', 'android', 'mac', 'windows', 'linux', 'chromeos', 'other'));
alter table public.profiles drop constraint if exists profiles_device_kind_check;
alter table public.profiles add constraint profiles_device_kind_check check (device_kind in ('phone', 'tablet', 'desktop'));
alter table public.profiles drop constraint if exists profiles_browser_check;
alter table public.profiles add constraint profiles_browser_check check (browser in ('safari', 'chrome', 'edge', 'firefox', 'samsung', 'opera', 'inapp', 'other'));
alter table public.profiles drop constraint if exists profiles_first_source_check;
alter table public.profiles add constraint profiles_first_source_check check (first_source ~ '^[a-z0-9][a-z0-9._-]{0,39}$');
alter table public.profiles drop constraint if exists profiles_first_medium_check;
alter table public.profiles add constraint profiles_first_medium_check check (first_medium ~ '^[a-z0-9][a-z0-9._-]{0,39}$');
alter table public.profiles drop constraint if exists profiles_first_campaign_check;
alter table public.profiles add constraint profiles_first_campaign_check check (first_campaign ~ '^[a-z0-9][a-z0-9._-]{0,59}$');
alter table public.profiles drop constraint if exists profiles_first_landing_check;
alter table public.profiles add constraint profiles_first_landing_check check (first_landing ~ '^(app|/[a-z]{2})$');
-- 사용자는 자기 줄의 이 칸들만 더 바꿀 수 있어요 (체험·구독·관리자 칸은 여전히 서버만)
grant update (platform, device_kind, browser, installed, device_at, first_source, first_medium, first_campaign, first_landing) on public.profiles to authenticated;

-- 처음 온 곳은 한 번 적히면 바뀌지 않아요 (first-touch)
create or replace function public.keep_first_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.first_source is not null then
    new.first_source := old.first_source; new.first_medium := old.first_medium;
    new.first_campaign := old.first_campaign; new.first_landing := old.first_landing;
  end if;
  return new;
end $$;
create or replace trigger profiles_keep_first_touch before update of first_source, first_medium, first_campaign, first_landing on public.profiles
  for each row execute function public.keep_first_touch();
revoke execute on function public.keep_first_touch() from public, anon, authenticated;

-- ---------- admin.sql 부분 ----------

-- 회원 한 명: 기기·처음 온 곳 칸 추가 (회원 목록의 기기 칸은 admin-api가 profiles에서 따로 붙여요)
create or replace function public.admin_user(uid uuid) returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select jsonb_build_object(
    'id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at, 'banned_until', u.banned_until,
    'display_name', p.display_name, 'country', p.country, 'lang', p.lang, 'timezone', p.timezone, 'last_seen_at', p.last_seen_at,
    'platform', p.platform, 'device_kind', p.device_kind, 'browser', p.browser, 'installed', p.installed, 'device_at', p.device_at,
    'first_source', p.first_source, 'first_medium', p.first_medium, 'first_campaign', p.first_campaign, 'first_landing', p.first_landing,
    'trial_ends_at', p.trial_ends_at + make_interval(days => coalesce(p.bonus_days, 0)), 'bonus_days', p.bonus_days,
    'pass_until', p.pass_until,
    'vouchers', coalesce((select jsonb_agg(jsonb_build_object('code', r.code, 'at', r.redeemed_at, 'from', r.granted_from, 'until', r.granted_until) order by r.redeemed_at desc)
                          from public.voucher_redemptions r where r.user_id = u.id), '[]'),
    'referred', p.referred_by is not null, 'invited', (select count(*) from public.profiles r where r.referred_by = u.id),
    'admin_role', (select role from public.admins where user_id = u.id),
    'entries', (select count(*) from public.entries where user_id = u.id and deleted_at is null),
    'entries_trash', (select count(*) from public.entries where user_id = u.id and deleted_at is not null),
    'folders', (select count(*) from public.folders where user_id = u.id),
    'photos', (select count(*) from public.photos where user_id = u.id),
    'photo_bytes', (select coalesce(sum(bytes + thumb_bytes), 0) from public.photos where user_id = u.id),
    'first_entry_at', (select min(created_at) from public.entries where user_id = u.id),
    'last_entry_at', (select max(updated_at) from public.entries where user_id = u.id),
    'subscriptions', coalesce((select jsonb_agg(to_jsonb(s) - 'update_payment_url' - 'cancel_url' order by s.updated_at desc)
                               from public.subscriptions s where s.user_id = u.id), '[]'),
    'audit', coalesce((select jsonb_agg(jsonb_build_object('at', at, 'action', action, 'by', admin_email, 'detail', detail) order by at desc)
                       from (select * from public.admin_audit where target_user = u.id order by at desc limit 20) a), '[]')
  )
  from auth.users u left join public.profiles p on p.id = u.id where u.id = uid
$$;

-- 회원 구성 (합계만): p_days = 최근 n일 가입자만 (null이면 전체)
--  groups.<dim> = [{k, users, paying, trial, active_7d, conv}]  dim: country · lang · platform · device_kind · browser · installed · source · medium · campaign · landing
--  weekly = 주별 가입 × 처음 온 곳,  cross = 나라 × 운영체제
create or replace function public.admin_audience(p_days int default null) returns jsonb
language sql stable security definer set search_path = public, auth as $$
  with b as (
    select coalesce(p.country, '—') country, coalesce(p.lang, '—') lang, coalesce(p.platform, '—') platform,
           coalesce(p.device_kind, '—') device_kind, coalesce(p.browser, '—') browser,
           case when p.installed then 'yes' when p.installed is false then 'no' else '—' end installed,
           coalesce(p.first_source, '—') source, coalesce(p.first_medium, '—') medium,
           coalesce(p.first_campaign, '—') campaign, coalesce(p.first_landing, '—') landing,
           u.created_at, public.is_subscriber(p.id) paying,
           (not public.is_subscriber(p.id) and public.free_until(p) > now()) trial,
           p.last_seen_at > now() - interval '7 days' active
    from public.profiles p join auth.users u on u.id = p.id
    where p_days is null or u.created_at > now() - make_interval(days => least(greatest(p_days, 1), 3650))
  ), g as (
    select x.dim, x.k, count(*) users, count(*) filter (where b.paying) paying, count(*) filter (where b.trial) trial,
           count(*) filter (where b.active) active_7d,
           row_number() over (partition by x.dim order by count(*) desc, x.k) rn
    from b cross join lateral (values ('country', b.country), ('lang', b.lang), ('platform', b.platform), ('device_kind', b.device_kind),
      ('browser', b.browser), ('installed', b.installed), ('source', b.source), ('medium', b.medium), ('campaign', b.campaign), ('landing', b.landing)) x(dim, k)
    group by x.dim, x.k
  )
  select jsonb_build_object(
    'days', p_days,
    'total', (select jsonb_build_object('users', count(*), 'paying', count(*) filter (where paying), 'trial', count(*) filter (where trial),
                'active_7d', count(*) filter (where active), 'known_source', count(*) filter (where source <> '—'),
                'known_device', count(*) filter (where platform <> '—')) from b),
    'groups', coalesce((select jsonb_object_agg(dim, rows) from (
                select dim, jsonb_agg(jsonb_build_object('k', k, 'users', users, 'paying', paying, 'trial', trial, 'active_7d', active_7d,
                  'conv', round(paying * 100.0 / users, 1)) order by rn) rows
                from g where rn <= 40 group by dim) z), '{}'),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('week', w, 'source', source, 'n', n) order by w, n desc) from (
                select date_trunc('week', created_at)::date w, source, count(*) n from b
                where created_at > now() - interval '26 weeks' group by 1, 2) q), '[]'),
    'cross', coalesce((select jsonb_agg(jsonb_build_object('country', country, 'platform', platform, 'n', n) order by country, n desc) from (
                select country, platform, count(*) n from b
                where country in (select k from g where dim = 'country' and rn <= 12) group by 1, 2) q), '[]')
  )
$$;

revoke execute on function public.admin_user(uuid), public.admin_audience(int) from public, anon, authenticated;
grant execute on function public.admin_user(uuid), public.admin_audience(int) to service_role;
