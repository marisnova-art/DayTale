-- =====================================================================
-- Daytale v1.0 — 관리자 (schema.sql 다음에 실행). 여러 번 실행해도 안전합니다.
--  · 아래 표와 함수는 브라우저(anon / 로그인 사용자)에서 부를 수 없습니다.
--    서버 함수 admin-api만 service role로 부르고, 그 함수가 관리자 명단을 먼저 확인합니다.
--  · 관리자도 회원의 기록 내용(제목·본문·사진)은 보지 않습니다. 개수와 날짜만 봅니다.
-- =====================================================================

-- ---------- 관리 기록 (누가 언제 무엇을 했는지) ----------
create table if not exists public.admin_audit (
  id           bigint generated always as identity primary key,
  admin_id     uuid references auth.users(id) on delete set null,
  admin_email  text,
  action       text not null,
  target_user  uuid,
  target_email text,
  detail       jsonb not null default '{}',
  at           timestamptz not null default now()
);
create index if not exists admin_audit_at_idx on public.admin_audit(at desc);
alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon, authenticated;

-- ---------- 무료 한도 (사용량 게이지·70% 경고용, 요금제를 바꾸면 여기만 고치기) ----------
create table if not exists public.ops_limits (
  k      text primary key,
  label  text not null,
  limit_value numeric not null,
  unit   text not null
);
alter table public.ops_limits enable row level security;
revoke all on public.ops_limits from anon, authenticated;
insert into public.ops_limits values
  ('db_bytes', 'Supabase 데이터베이스 (Free 500MB)', 500 * 1024 ^ 2, 'bytes'),
  ('photo_bytes', 'Cloudflare R2 사진 (무료 10GB)', 10 * 1024 ^ 3, 'bytes'),
  ('mau', 'Supabase 월간 활성 사용자 (Free 50,000)', 50000, 'users')
on conflict (k) do nothing;

-- ---------- 대시보드 숫자 ----------
create or replace function public.admin_stats() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select jsonb_build_object(
    'users',          (select count(*) from auth.users),
    'new_7d',         (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'new_30d',        (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_7d',      (select count(*) from public.profiles where last_seen_at > now() - interval '7 days'),
    'active_30d',     (select count(*) from public.profiles where last_seen_at > now() - interval '30 days'),
    'banned',         (select count(*) from auth.users where banned_until > now()),
    'in_trial',       (select count(*) from public.profiles p where not public.is_subscriber(p.id) and p.trial_ends_at + make_interval(days => p.bonus_days) > now()),
    'trial_ended',    (select count(*) from public.profiles p where not public.is_subscriber(p.id) and p.trial_ends_at + make_interval(days => p.bonus_days) <= now()),
    'entries',        (select count(*) from public.entries where deleted_at is null),
    'entries_7d',     (select count(*) from public.entries where created_at > now() - interval '7 days'),
    'photos',         (select count(*) from public.photos),
    'subs_by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.subscriptions group by status) s), '{}'),
    'paying',         coalesce((select jsonb_object_agg(plan, n) from (select plan, count(*) n from public.subscriptions where status in ('active', 'past_due') group by plan) p), '{}'),
    'canceling',      (select count(*) from public.subscriptions where cancel_at is not null and status <> 'canceled'),
    'signups_30d',    coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
                        select date_trunc('day', created_at)::date d, count(*) n from auth.users where created_at > now() - interval '30 days' group by 1) g), '[]'),
    'entries_series', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
                        select date_trunc('day', created_at)::date d, count(*) n from public.entries where created_at > now() - interval '30 days' group by 1) g), '[]'),
    'subs_series',    coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
                        select date_trunc('day', created_at)::date d, count(*) n from public.subscriptions where created_at > now() - interval '30 days' group by 1) g), '[]'),
    -- 나라별 (언어는 기기, 나라는 시간대·언어 지역에서 짐작)
    'countries',      coalesce((select jsonb_agg(c order by (c->>'users')::int desc) from (
                        select jsonb_build_object('country', coalesce(p.country, '—'), 'users', count(*),
                          'paying', count(*) filter (where public.is_subscriber(p.id)),
                          'active_7d', count(*) filter (where p.last_seen_at > now() - interval '7 days')) c
                        from public.profiles p group by coalesce(p.country, '—') limit 30) x), '[]'),
    'langs',          coalesce((select jsonb_object_agg(l, n) from (select coalesce(lang, '—') l, count(*) n from public.profiles group by 1) x), '{}'),
    -- 1년 미접속 정리 (구독자는 제외). 안내 메일 30일 전·7일 전
    'retention',      jsonb_build_object(
                        'notice_30d', (select count(*) from public.profiles p where not public.is_subscriber(p.id) and p.last_seen_at < now() - interval '335 days' and p.last_seen_at >= now() - interval '358 days'),
                        'notice_7d',  (select count(*) from public.profiles p where not public.is_subscriber(p.id) and p.last_seen_at < now() - interval '358 days' and p.last_seen_at >= now() - interval '365 days'),
                        'due',        (select count(*) from public.profiles p where not public.is_subscriber(p.id) and p.last_seen_at < now() - interval '365 days'))
  )
$$;

-- ---------- 운영 사용량 (무료 한도 대비, 70%가 넘으면 경고) ----------
create or replace function public.admin_usage() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  with v as (
    select 'db_bytes' k, pg_database_size(current_database())::numeric used
    union all select 'photo_bytes', coalesce((select sum(bytes + thumb_bytes) from public.photos), 0)
    union all select 'mau', (select count(*) from public.profiles where last_seen_at > now() - interval '30 days')
  )
  select coalesce(jsonb_agg(jsonb_build_object('k', l.k, 'label', l.label, 'used', v.used, 'limit', l.limit_value, 'unit', l.unit,
    'pct', round(v.used / nullif(l.limit_value, 0) * 100, 1), 'warn', v.used >= l.limit_value * 0.7) order by l.k), '[]')
  from public.ops_limits l join v on v.k = l.k
$$;

-- ---------- 회원 목록 (검색 · 거르기 · 페이지) ----------
drop function if exists public.admin_users(text, text, int, int);
create or replace function public.admin_users(q text default '', filter text default 'all', lim int default 50, off int default 0)
returns table (id uuid, email text, created_at timestamptz, last_seen_at timestamptz, banned_until timestamptz, country text, lang text,
               entries bigint, trial_ends_at timestamptz, sub_status text, sub_plan text, admin_role text, total bigint)
language sql stable security definer set search_path = public, auth as $$
  with base as (
    select u.id, u.email::text, u.created_at, p.last_seen_at, u.banned_until, p.country, p.lang,
           (select count(*) from public.entries e where e.user_id = u.id and e.deleted_at is null) entries,
           p.trial_ends_at + make_interval(days => coalesce(p.bonus_days, 0)) trial_ends_at,
           s.status sub_status, s.plan sub_plan, a.role admin_role
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join lateral (select status, plan from public.subscriptions x where x.user_id = u.id order by x.updated_at desc limit 1) s on true
    left join public.admins a on a.user_id = u.id
    where (coalesce(q, '') = '' or u.email ilike '%' || replace(replace(q, '%', '\%'), '_', '\_') || '%' or u.id::text = q)
  ), f as (
    select * from base where case filter
      when 'paying'   then sub_status in ('active', 'past_due', 'trialing')
      when 'trial'    then coalesce(sub_status, '') not in ('active', 'past_due', 'trialing') and trial_ends_at > now()
      when 'ended'    then coalesce(sub_status, '') not in ('active', 'past_due', 'trialing') and trial_ends_at <= now()
      when 'past_due' then sub_status = 'past_due'
      when 'banned'   then banned_until > now()
      when 'admins'   then admin_role is not null
      when 'inactive' then coalesce(sub_status, '') not in ('active', 'past_due', 'trialing') and last_seen_at < now() - interval '335 days'
      else true end
  )
  select f.*, count(*) over () total from f
  order by f.created_at desc
  limit least(greatest(lim, 1), 200) offset greatest(off, 0)
$$;

-- ---------- 회원 한 명 (내용 없이 숫자만) ----------
create or replace function public.admin_user(uid uuid) returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select jsonb_build_object(
    'id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at, 'banned_until', u.banned_until,
    'display_name', p.display_name, 'country', p.country, 'lang', p.lang, 'timezone', p.timezone, 'last_seen_at', p.last_seen_at,
    'trial_ends_at', p.trial_ends_at + make_interval(days => coalesce(p.bonus_days, 0)), 'bonus_days', p.bonus_days,
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

-- ---------- 구독 목록 ----------
drop function if exists public.admin_subscriptions(text, int, int);
create or replace function public.admin_subscriptions(st text default 'all', lim int default 50, off int default 0)
returns table (subscription_id text, user_id uuid, email text, status text, plan text, currency text, amount numeric, country text,
               current_period_end timestamptz, cancel_at timestamptz, customer_id text, created_at timestamptz, updated_at timestamptz, total bigint)
language sql stable security definer set search_path = public, auth as $$
  select s.subscription_id, s.user_id, u.email::text, s.status, s.plan, s.currency, s.amount, coalesce(s.country, p.country),
         s.current_period_end, s.cancel_at, s.customer_id, s.created_at, s.updated_at, count(*) over () total
  from public.subscriptions s left join auth.users u on u.id = s.user_id left join public.profiles p on p.id = s.user_id
  where coalesce(st, 'all') = 'all' or s.status = st or (st = 'canceling' and s.cancel_at is not null and s.status <> 'canceled')
  order by s.updated_at desc
  limit least(greatest(lim, 1), 200) offset greatest(off, 0)
$$;

-- ---------- 매일 운영 (예약 작업이 부름): 체험 안내 알림 ----------
-- 체험이 7일·3일 남은 비구독 회원에게 앱 알림을 한 번씩 넣어요. (메일 발송은 메일 서비스 연결 후)
create or replace function public.ops_daily() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare n7 int; n3 int;
begin
  -- 앱이 쓰는 5개 언어 문구 (없는 언어는 영어)
  with txt(kind, lang, title, body) as (values
    ('trial_7d', 'ko', '무료 체험이 7일 남았어요', '구독하면 계속 쓸 수 있어요. 구독하지 않아도 기록은 그대로 남고, 읽기·내보내기는 언제나 돼요.'),
    ('trial_7d', 'en', 'Your free trial ends in 7 days', 'Subscribe to keep writing. Your records stay either way, and you can always read and export them.'),
    ('trial_7d', 'ja', '無料体験はあと7日です', '購読すると続けて書けます。購読しなくても記録はそのまま残り、閲覧・書き出しはいつでもできます。'),
    ('trial_7d', 'es', 'Su prueba gratuita termina en 7 días', 'Suscríbase para seguir escribiendo. Sus registros se conservan de todos modos y siempre podrá leerlos y exportarlos.'),
    ('trial_7d', 'fr', 'Votre essai gratuit se termine dans 7 jours', 'Abonnez-vous pour continuer à écrire. Vos notes restent dans tous les cas, et vous pouvez toujours les lire et les exporter.'),
    ('trial_3d', 'ko', '무료 체험이 3일 남았어요', '체험이 끝나면 새로 쓰기와 고치기가 멈춰요. 연간 구독이 가장 알뜰해요.'),
    ('trial_3d', 'en', 'Your free trial ends in 3 days', 'When the trial ends, writing and editing pause. The yearly plan is the best value.'),
    ('trial_3d', 'ja', '無料体験はあと3日です', '体験が終わると、新しく書くことと編集が止まります。年間プランがいちばんお得です。'),
    ('trial_3d', 'es', 'Su prueba gratuita termina en 3 días', 'Cuando termine la prueba, se pausarán la escritura y la edición. El plan anual es el más conveniente.'),
    ('trial_3d', 'fr', 'Votre essai gratuit se termine dans 3 jours', 'À la fin de l’essai, l’écriture et la modification seront suspendues. L’offre annuelle est la plus avantageuse.')
  ), t as (
    select p.id, case when p.lang in ('ko','en','ja','es','fr') then p.lang else 'en' end lang, p.trial_ends_at + make_interval(days => p.bonus_days) ends
    from public.profiles p where not public.is_subscriber(p.id)
  ), ins as (
    insert into public.notices(user_id, kind, lang, title, body)
    select t.id, x.kind, t.lang, x.title, x.body from t join txt x on x.lang = t.lang
    where ((x.kind = 'trial_7d' and t.ends between now() + interval '6 days' and now() + interval '7 days')
        or (x.kind = 'trial_3d' and t.ends between now() and now() + interval '3 days'))
      and not exists (select 1 from public.notices n where n.user_id = t.id and n.kind = x.kind)
    returning kind
  ) select count(*) filter (where kind = 'trial_7d'), count(*) filter (where kind = 'trial_3d') into n7, n3 from ins;
  return jsonb_build_object('trial_7d', n7, 'trial_3d', n3);
end $$;

-- 모두 service role 전용
revoke execute on function public.admin_stats(), public.admin_usage(), public.admin_users(text, text, int, int), public.admin_user(uuid),
  public.admin_subscriptions(text, int, int), public.ops_daily() from public, anon, authenticated;
grant execute on function public.admin_stats(), public.admin_usage(), public.admin_users(text, text, int, int), public.admin_user(uuid),
  public.admin_subscriptions(text, int, int), public.ops_daily() to service_role;

-- 매시간 체험 안내를 만들어요 (이미 받은 사람은 건너뛰어서 여러 번 돌아도 안전)
select cron.schedule('daytale-ops-daily', '7 * * * *', 'select public.ops_daily()')
  where exists (select 1 from pg_extension where extname = 'pg_cron');

-- 대표 계정(24story@gmail.com)은 schema.sql의 owner_emails로 가입하는 순간 owner가 됩니다.
-- 운영자를 더 두려면: insert into public.admins (user_id, role) select id, 'staff' from auth.users where email = '…';
