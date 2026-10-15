-- 홈 배너: 모두에게 보내는 공지는 기간(starts_at~ends_at) 동안 홈에도 띄울 수 있어요.
--   banner = null(알림함만) | 'strip'(홈 위 띠, 글자만) | 'popup'(이미지와 함께 모바일은 아래에서 올라오는 시트, PC는 가운데 창)
--   audience = all | trial | subscriber | ended. image_url = 공개 저장소(notice-images) 주소. cta_* = 버튼 글자·이동할 곳(앱 안 #/… 또는 https)
alter table public.notices add column if not exists banner text check (banner in ('strip', 'popup')),
  add column if not exists audience text not null default 'all' check (audience in ('all', 'trial', 'subscriber', 'ended')),
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists image_url text,
  add column if not exists cta_label text,
  add column if not exists cta_url text,
  add column if not exists detail text;   -- 공지 상세 화면의 긴 글 (body 는 팝업·띠·알림함에 보이는 짧은 소개)
-- 예약한 공지는 시작 전엔 안 보여요
drop policy if exists "notices: read own" on public.notices;
create policy "notices: read own" on public.notices for select using (user_id = auth.uid() or (user_id is null and (starts_at is null or starts_at <= now())));
-- 팝업 이미지: 누구나 읽을 수 있는 공개 저장소. 올리기는 서버 함수(admin-api, service_role)만
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notice-images', 'notice-images', true, 524288, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
