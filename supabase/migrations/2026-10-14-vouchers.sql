-- =====================================================================
-- 2026-10-14 이용권 코드 — 이미 schema.sql·admin.sql을 실행한 데이터베이스에 이것만 붙여 넣고 Run.
-- (schema.sql·admin.sql에도 같은 내용이 들어 있어요. 여러 번 실행해도 안전해요.)
-- =====================================================================
alter table public.profiles add column if not exists pass_until timestamptz;

-- 무료로 모든 기능을 쓰는 끝 = 체험(+초대 보너스)과 이용권 중 늦은 날
create or replace function public.free_until(p public.profiles) returns timestamptz
language sql immutable set search_path = public, pg_temp as $$
  select greatest(p.trial_ends_at + make_interval(days => coalesce(p.bonus_days, 0)), p.pass_until)
$$;

-- 쓰기 가능 = 구독 중이거나 체험·이용권 기간 안
create or replace function public.can_write(u uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_subscriber(u) or exists (
    select 1 from public.profiles p where p.id = u and public.free_until(p) > now())
$$;

-- 앱이 한 번에 읽는 내 상태
create or replace function public.my_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'trial_ends_at', public.free_until(p),
    'pass_until', case when p.pass_until > now() then p.pass_until end,
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

-- ---------- 이용권 코드 (관리자가 admin.sql 함수로 만들어요) ----------
-- 코드를 넣으면 지금 남은 무료 기간(체험·보너스·이전 이용권) 끝에 이어 붙어요.
-- 예: 체험 15일 남음 + 3개월 코드 = 오늘부터 3개월 15일 동안 모든 기능.
create table if not exists public.vouchers (
  code        text primary key check (code ~ '^[A-Z2-9]{12}$'),       -- 보여 줄 때는 XXXX-XXXX-XXXX
  duration    interval not null check (duration >= interval '1 day' and extract(epoch from duration) <= 366 * 86400), -- 최대 1년
  max_uses    int not null default 1 check (max_uses between 1 and 1000),
  used_count  int not null default 0 check (used_count >= 0),
  for_email   text check (for_email is null or char_length(for_email) <= 254),  -- 정해 두면 그 메일 계정만
  expires_at  timestamptz,                                              -- 이때까지 넣어야 해요 (비우면 기한 없음)
  note        text check (char_length(note) <= 200),                    -- 관리자 메모 (누구에게, 왜)
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);
alter table public.vouchers enable row level security;
revoke all on public.vouchers from anon, authenticated;
create table if not exists public.voucher_redemptions (
  code        text not null references public.vouchers(code) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  granted_from  timestamptz not null,
  granted_until timestamptz not null,
  primary key (code, user_id)
);
create index if not exists voucher_redemptions_user_idx on public.voucher_redemptions(user_id);
alter table public.voucher_redemptions enable row level security;
revoke all on public.voucher_redemptions from anon, authenticated;
-- 틀린 코드를 계속 넣어 맞히는 것을 막아요 (한 시간에 10번)
create table if not exists public.voucher_tries (user_id uuid not null references auth.users(id) on delete cascade, at timestamptz not null default now());
create index if not exists voucher_tries_idx on public.voucher_tries(user_id, at);
alter table public.voucher_tries enable row level security;
revoke all on public.voucher_tries from anon, authenticated;

create or replace function public.redeem_voucher(code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid(); c text := upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'));
  v public.vouchers; p public.profiles; mail text; base timestamptz; until timestamptz;
  bad constant jsonb := '{"ok": false, "error": "bad"}';
begin
  if me is null then return '{"ok": false, "error": "login"}'; end if;
  if (select count(*) from public.voucher_tries t where t.user_id = me and t.at > now() - interval '1 hour') >= 10 then
    return '{"ok": false, "error": "too_many"}';
  end if;
  select * into v from public.vouchers x where x.code = c for update;     -- 동시에 넣어도 횟수를 넘지 않게
  select email into mail from auth.users where id = me;
  if v.code is null or v.revoked_at is not null or (v.for_email is not null and lower(v.for_email) <> lower(coalesce(mail, ''))) then
    insert into public.voucher_tries(user_id) values (me);
    return bad;
  end if;
  if v.expires_at is not null and v.expires_at < now() then return '{"ok": false, "error": "expired"}'; end if;
  if exists (select 1 from public.voucher_redemptions r where r.code = v.code and r.user_id = me) then return '{"ok": false, "error": "already"}'; end if;
  if v.used_count >= v.max_uses then return '{"ok": false, "error": "used"}'; end if;
  -- 자동 결제가 이어지는 구독 중이면 겹쳐서 낭비되니 받지 않아요 (해지 예약을 하면 해지일 다음부터 이어 붙어요)
  if exists (select 1 from public.subscriptions s where s.user_id = me and s.status in ('active', 'trialing', 'past_due') and s.cancel_at is null) then
    return '{"ok": false, "error": "subscribed"}';
  end if;
  select * into p from public.profiles where id = me for update;
  if p.id is null then return bad; end if;
  base := greatest(now(), public.free_until(p),
    (select max(coalesce(s.cancel_at, s.current_period_end)) from public.subscriptions s where s.user_id = me and s.status in ('active', 'trialing', 'past_due')));
  until := base + v.duration;
  update public.profiles set pass_until = until, updated_at = now() where id = me;
  update public.vouchers set used_count = used_count + 1 where vouchers.code = v.code;
  insert into public.voucher_redemptions(code, user_id, granted_from, granted_until) values (v.code, me, base, until);
  return jsonb_build_object('ok', true, 'from', base, 'until', until);
end $$;

revoke execute on function public.free_until(public.profiles), public.redeem_voucher(text) from public, anon, authenticated;
grant execute on function public.redeem_voucher(text) to authenticated;

-- ---------- 관리자: 숫자·회원 화면이 이용권 기간을 함께 봐요 ----------
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
    'in_trial',       (select count(*) from public.profiles p where not public.is_subscriber(p.id) and public.free_until(p) > now()),
    'trial_ended',    (select count(*) from public.profiles p where not public.is_subscriber(p.id) and public.free_until(p) <= now()),
    'on_pass',        (select count(*) from public.profiles p where p.pass_until > now()),
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

-- ---------- 회원 목록 (검색 · 거르기 · 페이지) ----------
drop function if exists public.admin_users(text, text, int, int);
create or replace function public.admin_users(q text default '', filter text default 'all', lim int default 50, off int default 0)
returns table (id uuid, email text, created_at timestamptz, last_seen_at timestamptz, banned_until timestamptz, country text, lang text,
               entries bigint, trial_ends_at timestamptz, sub_status text, sub_plan text, admin_role text, total bigint)
language sql stable security definer set search_path = public, auth as $$
  with base as (
    select u.id, u.email::text, u.created_at, p.last_seen_at, u.banned_until, p.country, p.lang,
           (select count(*) from public.entries e where e.user_id = u.id and e.deleted_at is null) entries,
           public.free_until(p) trial_ends_at,
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
    select p.id, case when p.lang in ('ko','en','ja','es','fr') then p.lang else 'en' end lang, public.free_until(p) ends
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

-- 코드 만들기: 헷갈리는 글자(0 O 1 I)는 빼고 12자. 한 번에 최대 50개.
create or replace function public.admin_voucher_create(p_by uuid, p_duration interval, p_count int default 1, p_uses int default 1,
  p_expires timestamptz default null, p_note text default null, p_email text default null) returns text[]
language plpgsql security definer set search_path = public as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; out text[] := '{}'; c text; b bytea; i int;
begin
  if p_count is null or p_count < 1 or p_count > 50 then raise exception 'count must be 1-50'; end if;
  if p_email is not null and p_count > 1 then raise exception 'one code per email'; end if;
  while coalesce(array_length(out, 1), 0) < p_count loop
    b := uuid_send(gen_random_uuid()); c := '';
    foreach i in array array[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14] loop   -- 6·8번째 바이트는 uuid 버전 표시라 빼요
      c := c || substr(abc, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    insert into public.vouchers(code, duration, max_uses, for_email, expires_at, note, created_by)
    values (c, p_duration, coalesce(p_uses, 1), nullif(lower(trim(p_email)), ''), p_expires, nullif(trim(p_note), ''), p_by)
    on conflict (code) do nothing;
    if found then out := out || c; end if;
  end loop;
  return out;
end $$;

create or replace function public.admin_vouchers(st text default 'all', lim int default 50, off int default 0) returns jsonb
language sql stable security definer set search_path = public, auth as $$
  with f as (
    select v.*, case when v.revoked_at is not null then 'revoked' when v.used_count >= v.max_uses then 'used'
                     when v.expires_at < now() then 'expired' else 'open' end state
    from public.vouchers v
  )
  select jsonb_build_object(
    'total', (select count(*) from f where coalesce(st, 'all') in ('all', f.state)),
    'counts', (select jsonb_build_object('open', count(*) filter (where state = 'open'), 'used', count(*) filter (where state = 'used'),
                 'expired', count(*) filter (where state = 'expired'), 'revoked', count(*) filter (where state = 'revoked'),
                 'redeemed', (select count(*) from public.voucher_redemptions), 'on_pass', (select count(*) from public.profiles where pass_until > now())) from f),
    'rows', coalesce((select jsonb_agg(r order by r->>'created_at' desc) from (
      select jsonb_build_object('code', f.code, 'days', round(extract(epoch from f.duration) / 86400), 'duration', f.duration::text,
        'max_uses', f.max_uses, 'used_count', f.used_count, 'for_email', f.for_email, 'expires_at', f.expires_at, 'note', f.note,
        'created_at', f.created_at, 'created_by', (select email from auth.users where id = f.created_by), 'revoked_at', f.revoked_at, 'state', f.state,
        'users', coalesce((select jsonb_agg(jsonb_build_object('id', r.user_id, 'email', u.email, 'at', r.redeemed_at, 'until', r.granted_until) order by r.redeemed_at)
                           from public.voucher_redemptions r left join auth.users u on u.id = r.user_id where r.code = f.code), '[]')) r
      from f where coalesce(st, 'all') in ('all', f.state)
      order by f.created_at desc limit least(greatest(lim, 1), 200) offset greatest(off, 0)) x), '[]'))
$$;

revoke execute on function public.admin_voucher_create(uuid, interval, int, int, timestamptz, text, text), public.admin_vouchers(text, int, int) from public, anon, authenticated;
grant execute on function public.admin_voucher_create(uuid, interval, int, int, timestamptz, text, text), public.admin_vouchers(text, int, int) to service_role;

-- 위에서 다시 만든 관리자 함수도 service role 전용으로 (admin_users는 지웠다 다시 만들어서 권한이 풀려요)
revoke execute on function public.admin_stats(), public.admin_users(text, text, int, int), public.admin_user(uuid), public.ops_daily() from public, anon, authenticated;
grant execute on function public.admin_stats(), public.admin_users(text, text, int, int), public.admin_user(uuid), public.ops_daily() to service_role;
