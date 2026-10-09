-- =====================================================================
-- 웹 푸시: 앱을 닫아도 오는 알림 (일정 10분 전 · 할 일 마감일 9시 · 아침 인사 · 저녁 돌아보기)
-- 흐름: 앱이 알림을 허용하면 push_subscribe() 로 이 기기의 푸시 주소를 저장
--       → pg_cron 이 1분마다 push 서버 함수를 부름 → push_due() 가 지금 보낼 것을 골라 줌
--       → 함수가 VAPID 서명·암호화해서 각 브라우저 푸시 서비스로 보냄 → push_sent 에 기록 (두 번 안 보냄)
-- 비밀 열쇠(VAPID 개인 키, cron 토큰)는 push_config 에만 있고, 이 표는 서버만 읽어요 (RLS 켜고 정책 없음).
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.push_config (
  id          int primary key default 1 check (id = 1),
  vapid       jsonb,                                   -- {publicKey: JWK, privateKey: JWK} — 서버 함수가 처음 부를 때 만들어요
  public_key  text,                                    -- 앱에 주는 공개 키 (base64url)
  cron_token  text not null default encode(extensions.gen_random_bytes(32), 'hex')
);
insert into public.push_config (id) values (1) on conflict do nothing;
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;

create table if not exists public.push_subs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique check (char_length(endpoint) <= 1000),
  p256dh      text not null check (char_length(p256dh) <= 200),
  auth        text not null check (char_length(auth) <= 100),
  tz          text not null default 'UTC',
  lang        text not null default 'en' check (lang in ('ko', 'en', 'ja', 'es', 'fr')),
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);
create index if not exists push_subs_user_idx on public.push_subs(user_id);
alter table public.push_subs enable row level security;
revoke all on public.push_subs from anon, authenticated;

create table if not exists public.push_sent (
  sub_id   bigint not null references public.push_subs(id) on delete cascade,
  key      text not null,
  sent_at  timestamptz not null default now(),
  primary key (sub_id, key)
);
alter table public.push_sent enable row level security;
revoke all on public.push_sent from anon, authenticated;

-- 앱이 부르는 것: 내 기기 등록 / 해제. 푸시 서비스 주소만 받아요 (다른 서버로 요청을 보내게 만들 수 없게).
create or replace function public.push_tz_ok(p_tz text)
returns text language sql stable set search_path = public as $$
  select case when exists (select 1 from pg_timezone_names where name = p_tz) then p_tz else 'UTC' end;
$$;
create or replace function public.push_host_ok(p_endpoint text)
returns boolean language sql immutable set search_path = public as $$
  select left(p_endpoint, 8) = 'https:' || '//'
     and split_part(split_part(substr(p_endpoint, 9), '/', 1), ':', 1) ~ '(^|[.])(fcm[.]googleapis[.]com|android[.]googleapis[.]com|push[.]apple[.]com|push[.]services[.]mozilla[.]com|notify[.]windows[.]com)$';
$$;
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_tz text, p_lang text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not push_host_ok(p_endpoint) then return false; end if;
  insert into push_subs (user_id, endpoint, p256dh, auth, tz, lang)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, push_tz_ok(p_tz), case when p_lang in ('ko', 'en', 'ja', 'es', 'fr') then p_lang else 'en' end)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, tz = excluded.tz, lang = excluded.lang;
  return true;
end $$;
create or replace function public.push_unsubscribe(p_endpoint text)
returns boolean language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint and user_id = auth.uid() returning true;
$$;
revoke all on function public.push_subscribe(text, text, text, text, text) from public, anon;
revoke all on function public.push_unsubscribe(text) from public, anon;
revoke all on function public.push_tz_ok(text) from public, anon, authenticated;
revoke all on function public.push_host_ok(text) from public, anon, authenticated;
grant execute on function public.push_subscribe(text, text, text, text, text) to authenticated;
grant execute on function public.push_unsubscribe(text) to authenticated;

-- 날짜·시각 글자 → 그 사람 시간대의 순간. 잘못된 값이면 null (한 사람의 이상한 값이 전체를 멈추지 않게)
create or replace function public.push_ts(d text, t text, tz text)
returns timestamptz language plpgsql immutable set search_path = public as $$
begin
  if d !~ '^\d{4}-\d{2}-\d{2}$' or t !~ '^([01]\d|2[0-3]):[0-5]\d$' then return null; end if;
  return (d || ' ' || t)::timestamp at time zone tz;
exception when others then return null;
end $$;

-- 지금 보낼 알림 (지난 20분 안에 울렸어야 하는데 아직 안 보낸 것). 서버 함수만 불러요.
create or replace function public.push_due(p_now timestamptz default now())
returns table (sub_id bigint, endpoint text, p256dh text, auth text, lang text, key text, kind text, title text, entry_id uuid, extra text)
language sql stable security definer set search_path = public as $$
  with s as (
    select ps.*, coalesce(us.prefs -> 'notify', '{}'::jsonb) as nt, (p_now at time zone ps.tz)::date as today
    from push_subs ps left join user_settings us on us.user_id = ps.user_id
  ), due as (
    -- 일정: 시작 10분 전
    select s.id as sub_id, 'ev:' || e.id || ':' || (e.meta->>'date') || 'T' || (e.meta->>'time') as key, 'event' as kind, e.title, e.id as entry_id, e.meta->>'time' as extra,
           push_ts(e.meta->>'date', e.meta->>'time', s.tz) - interval '10 minutes' as at
    from s join entries e on e.user_id = s.user_id
    where coalesce(s.nt->>'reminders', 'true') <> 'false' and e.type = 'event' and e.deleted_at is null
      and e.meta->>'date' between (s.today - 1)::text and (s.today + 1)::text
    union all
    -- 할 일: 마감일 아침 9시
    select s.id, 'todo:' || e.id || ':' || (e.meta->>'date'), 'todo', e.title, e.id, null,
           push_ts(e.meta->>'date', '09:00', s.tz)
    from s join entries e on e.user_id = s.user_id
    where coalesce(s.nt->>'reminders', 'true') <> 'false' and e.type = 'todo' and e.deleted_at is null
      and coalesce(e.meta->>'done', 'false') <> 'true'
      and e.meta->>'date' between (s.today - 1)::text and s.today::text
    union all
    -- 아침 인사: 오늘 일정 개수와 함께
    select s.id, 'morning:' || s.today, 'morning', null, null,
           (select count(*)::text from entries e where e.user_id = s.user_id and e.type = 'event' and e.deleted_at is null and e.meta->>'date' = s.today::text),
           push_ts(s.today::text, coalesce(s.nt->>'morningAt', '08:00'), s.tz)
    from s where s.nt->>'morning' = 'true'
    union all
    -- 저녁 돌아보기: 오늘 아직 쓴 게 없을 때만
    select s.id, 'evening:' || s.today, 'evening', null, null, null,
           push_ts(s.today::text, coalesce(s.nt->>'eveningAt', '21:00'), s.tz)
    from s where s.nt->>'evening' = 'true'
      and not exists (select 1 from entries e where e.user_id = s.user_id and e.deleted_at is null and (e.created_at at time zone s.tz)::date = s.today)
  )
  select d.sub_id, ps.endpoint, ps.p256dh, ps.auth, ps.lang, d.key, d.kind, d.title, d.entry_id, d.extra
  from due d join push_subs ps on ps.id = d.sub_id
  where d.at is not null and d.at <= p_now and d.at > p_now - interval '20 minutes'
    and not exists (select 1 from push_sent x where x.sub_id = d.sub_id and x.key = d.key)
  limit 2000;
$$;
revoke all on function public.push_due(timestamptz) from public, anon, authenticated;
revoke all on function public.push_ts(text, text, text) from public, anon, authenticated;

-- 1분마다 서버 함수 부르기 (토큰은 push_config 에서 읽어요). 오래된 push_sent 정리는 서버 함수가 한 시간에 한 번 해요.
select cron.schedule('daytale-push', '* * * * *', $cron$
  select net.http_post(
    url := 'https://qovcfpvitifbbmizdqop.supabase.co/functions/v1/push',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-token', (select cron_token from public.push_config where id = 1)),
    body := '{}'::jsonb, timeout_milliseconds := 25000);
$cron$);
