-- 템플릿 목록 (11-06 템플릿 틀). 앱은 공개(public)만 읽고, 쓰기는 나중에 관리자 '템플릿' 메뉴(서버 쪽)에서만 해요.
-- 템플릿 하나 = 한 줄: 이름 · 종류 · 설명(3줄) · 태그 · 관련 검색어 · 유료 · 날짜 · 예시 3개 · 도구 · 모션 · 그림 파일 · 숨김/공개
create table if not exists public.dz_templates (
  id         text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  fmt        text not null,                         -- 그리는 틀 = 폴더 app/new/tpl/<fmt>/ (볼 때만 불러와요, 폴더가 없으면 안 보여요)
  kind       text not null,                         -- 종류 (dz_kinds 이름: 디자인 · 아트 …)
  name       text not null,
  descr      jsonb not null default '[]',           -- 설명 3줄 (| = 줄이 넘칠 때 내려갈 자리)
  tags       text[] not null default '{}',          -- 태그 (칩 · 테마 줄, 2~3개)
  words      text[] not null default '{}',          -- 관련 검색어 (안 보여요, 10~20개)
  ex         jsonb not null default '[]',           -- 예시 3개 (상세 1·2·3 · 목록 그림을 앱이 이걸로 그려요)
  tools      jsonb not null default '{}',           -- 쓰기 화면 도구 (틀 기본값에서 바꿀 것만)
  assets     jsonb not null default '{}',           -- 그림 파일 (아트 이미지 등) · thumb = 목록용 정지 그림 (tools/tpl-thumbs.cjs)
  paid       boolean not null default false,
  motion     boolean not null default false,        -- 모션 있음: 목록에선 가운데 카드만 움직여요
  pop        int,                                   -- 인기 순서 (서버 사용 수가 쌓이기 전까지)
  sort       int not null default 0,
  added      date not null default current_date,    -- 새로 나온 (30일)
  state      text not null default 'hidden' check (state in ('hidden', 'public')),   -- 공개는 앤드류만
  author     text not null default '피터',
  updated_at timestamptz not null default now()
);
alter table public.dz_templates enable row level security;
drop policy if exists dz_templates_read on public.dz_templates;
create policy dz_templates_read on public.dz_templates for select to anon, authenticated using (state = 'public');
grant select on public.dz_templates to anon, authenticated;

-- 종류 목록 (11-06): 새 종류는 여기 한 줄. 앱의 칩 · 홈 줄 · 프로필 그래프가 이 순서로 따라와요
create table if not exists public.dz_kinds (
  name text primary key check (length(name) between 1 and 20),
  sort int not null default 0
);
alter table public.dz_kinds enable row level security;
drop policy if exists dz_kinds_read on public.dz_kinds;
create policy dz_kinds_read on public.dz_kinds for select to anon, authenticated using (true);
grant select on public.dz_kinds to anon, authenticated;
insert into public.dz_kinds (name, sort) values ('디자인', 1), ('아트', 2) on conflict (name) do nothing;

-- 지금 있는 두 개 (앱 안 기본값과 같아요)
insert into public.dz_templates (id, fmt, kind, name, descr, tags, words, ex, assets, paid, motion, pop, sort, added, state) values
('rebus', 'rebus', '디자인', '멤피스 문장',
 '["80년대 이탈리아 멤피스 디자인처럼|물결선, 반원, 마름모가 낱말 옆에 붙어요.", "셔플할 때마다|도형 모양과 색이 새로 바뀌어요.", "짧은 하루 한 줄을|포스터처럼 남기고 싶을 때 좋아요."]',
 '{짧은글,감성}', '{멤피스,리버스,그림 문장,그림,문장,아이콘,귀여운,도형,낱말,알록달록,포스터,80년대}',
 '["친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.", "아침에 <b>창문</b>을 열었더니 공기가 <mark>차가웠다</mark>. 겨울이 오나 보다.", "<b>비</b> 오는 날엔 <mark>따뜻한</mark> 차 한 잔."]',
 '{"thumb": "tpl/rebus/thumbs/rebus.webp"}',
 false, true, 2, 2, '2026-10-21', 'public'),
('art', 'art', '아트', '오로라 커튼',
 '["오로라 그라데이션으로 그린 세로 빛줄기가|커튼처럼 천천히 흘러요.", "셔플할 때마다 새 빛이 번져요.", "늦은 밤|짧은 글과 잘 어울려요."]',
 '{밤,감성}', '{오로라,커튼,그라데이션,번지는 빛,빛,무지개,몽환,새벽,네온,번짐,흐르는,디지털 아트}',
 '[["창밖 불빛이 번지는 밤.", 11, "916"], ["퇴근길 하늘이 보라색이었다.", 42, "45"], ["오늘은 아무것도 하지 않아도 괜찮았다.", 77, "11"]]',
 '{"thumb": "tpl/art/thumbs/art.webp"}',
 true, true, 1, 1, '2026-10-23', 'public')
on conflict (id) do nothing;
