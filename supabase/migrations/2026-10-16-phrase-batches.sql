-- 구절·문장 주간 묶음 (2026-10-16)
--  country  : 비우면 세계 공통, 'JP' 처럼 적으면 그 나라 사람에게만
--  starts_on: 이 날부터 앱에 나와요 (주간 묶음을 하루 5개씩 나눠 열 때)
--  batch    : 함께 올린 묶음 이름 (예: 2026-W44 ko 공통) — 관리자에서 묶음째 끄기·지우기
--  slot 'word' = 홈 "힘이 되는 한 마디" 명언 (cond: a 작가 · o 원문 · by 이름 · src 출처 · say 들려주기)
alter table public.phrase_packs add column if not exists country text check (country is null or country ~ '^[A-Z]{2}$');
alter table public.phrase_packs add column if not exists starts_on date;
alter table public.phrase_packs add column if not exists batch text;
create index if not exists phrase_packs_batch_idx on public.phrase_packs(batch);

-- 앱이 하루 한 번 묻는 "바뀐 게 있나요?" 도장. 같으면 받아 둔 묶음을 그대로 써요 (전송량 절약)
create or replace function public.phrase_stamp(p_lang text, p_country text, p_today date)
returns text language sql stable set search_path = public as $$
  select count(*)::text || '.' || coalesce(floor(extract(epoch from max(updated_at)))::bigint::text, '0')
  from phrase_packs
  where active and lang = p_lang and (country is null or country = p_country) and (starts_on is null or starts_on <= p_today)
$$;

-- 앱이 받는 줄: 그 언어 + (공통 또는 내 나라) + 오늘까지 열린 것. 1000줄씩 나눠 받아요
create or replace function public.phrase_rows(p_lang text, p_country text, p_today date)
returns table (id bigint, lang text, slot text, cond jsonb, text text, weight int)
language sql stable set search_path = public as $$
  select id, lang, slot, cond, text, weight from phrase_packs
  where active and lang = p_lang and (country is null or country = p_country) and (starts_on is null or starts_on <= p_today)
  order by id
$$;

revoke all on function public.phrase_stamp(text, text, date) from public, anon;
revoke all on function public.phrase_rows(text, text, date) from public, anon;
grant execute on function public.phrase_stamp(text, text, date) to authenticated;
grant execute on function public.phrase_rows(text, text, date) to authenticated;
