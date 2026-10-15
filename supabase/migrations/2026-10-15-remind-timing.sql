-- 알림을 몇 분 전에 보낼지: 기록 값(meta.remind) → 설정 기본값 → 정해진 기본. 'off'면 null (보내지 않아요). 이상한 값은 기본으로
create or replace function public.push_mins(rec text, pref text, def int)
returns int language sql immutable set search_path = public as $$
  select case when rec = 'off' then null
              when rec ~ '^\d{1,4}$' and rec::int <= 10080 then rec::int
              when pref ~ '^\d{1,4}$' and pref::int <= 10080 then pref::int
              else def end;
$$;
revoke all on function public.push_mins(text, text, int) from public, anon, authenticated;

-- 지금 보낼 알림 (지난 20분 안에 울렸어야 하는데 아직 안 보낸 것). 서버 함수만 불러요.
create or replace function public.push_due(p_now timestamptz default now())
returns table (sub_id bigint, endpoint text, p256dh text, auth text, lang text, key text, kind text, title text, entry_id uuid, extra text)
language sql stable security definer set search_path = public as $$
  with s as (
    select ps.*, coalesce(us.prefs -> 'notify', '{}'::jsonb) as nt, (p_now at time zone ps.tz)::date as today
    from push_subs ps left join user_settings us on us.user_id = ps.user_id
  ), due as (
    -- 일정: 기본은 설정의 eventBefore(없으면 10분) 전. 기록마다 meta.remind(분, 'off' = 끄기)로 바꿀 수 있어요
    select s.id as sub_id, 'ev:' || e.id || ':' || (e.meta->>'date') || 'T' || (e.meta->>'time') as key, 'event' as kind, e.title, e.id as entry_id,
           (e.meta->>'time') || case when r.mins >= 1440 then '|d' else '' end as extra,
           push_ts(e.meta->>'date', e.meta->>'time', s.tz) - make_interval(mins => r.mins) as at
    from s join entries e on e.user_id = s.user_id
    cross join lateral (select push_mins(e.meta->>'remind', s.nt->>'eventBefore', 10) as mins) r
    where coalesce(s.nt->>'reminders', 'true') <> 'false' and e.type = 'event' and e.deleted_at is null and r.mins is not null
      and e.meta->>'date' between (s.today - 1)::text and (s.today + 2)::text
    union all
    -- 할 일: 시간을 넣었으면 그 시각, 없으면 마감일 todoAt(기본 오전 9시). 기본은 설정의 todoBefore(없으면 제시간) 전
    select s.id, 'todo:' || e.id || ':' || (e.meta->>'date') || coalesce('T' || nullif(e.meta->>'time', ''), ''), 'todo', e.title, e.id,
           coalesce(nullif(e.meta->>'time', ''), '') || case when r.mins >= 1440 then '|d' else '' end,
           push_ts(e.meta->>'date', coalesce(nullif(e.meta->>'time', ''), nullif(s.nt->>'todoAt', ''), '09:00'), s.tz) - make_interval(mins => r.mins)
    from s join entries e on e.user_id = s.user_id
    cross join lateral (select push_mins(e.meta->>'remind', s.nt->>'todoBefore', 0) as mins) r
    where coalesce(s.nt->>'reminders', 'true') <> 'false' and e.type = 'todo' and e.deleted_at is null and r.mins is not null
      and coalesce(e.meta->>'done', 'false') <> 'true'
      and e.meta->>'date' between (s.today - 1)::text and (s.today + 1)::text
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
