-- 태그 목록 (11-06 관리자 '템플릿' 메뉴). 관리자 태그 화면과 템플릿 체크박스, 앱 칩이 모두 이 표를 써요.
-- cond = 이때 앞으로 와요: {"time":[...]} · {"wx":[...]} · {"season":[...]} 중 하나 (없으면 {}). 쓰기는 관리자(admin-api)만
create table if not exists public.dz_tags (
  id   text primary key check (length(id) between 1 and 20),
  cond jsonb not null default '{}',
  sort int not null default 0
);
alter table public.dz_tags enable row level security;
drop policy if exists dz_tags_read on public.dz_tags;
create policy dz_tags_read on public.dz_tags for select to anon, authenticated using (true);
revoke all on public.dz_tags from anon, authenticated;
grant select on public.dz_tags to anon, authenticated;
insert into public.dz_tags (id, cond, sort) values
 ('밤', '{"time":["evening","night"]}', 1), ('비', '{"wx":["rain","thunder"]}', 2), ('눈', '{"wx":["snow"]}', 3),
 ('아침', '{"time":["morning"]}', 4), ('겨울', '{"season":["winter"]}', 5), ('봄', '{"season":["spring"]}', 6),
 ('여름', '{"season":["summer"]}', 7), ('가을', '{"season":["autumn"]}', 8), ('짧은글', '{}', 9), ('감성', '{}', 10)
on conflict (id) do nothing;
