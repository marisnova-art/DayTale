-- 홈 배너: 모두에게 보내는 공지 중 banner 인 것은 기간(starts_at~ends_at) 동안 홈 위에 조용히 떠요. audience = all | trial | subscriber | ended
alter table public.notices add column if not exists banner boolean not null default false,
  add column if not exists audience text not null default 'all',
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;
-- 예약한 공지는 시작 전엔 안 보여요
drop policy if exists "notices: read own" on public.notices;
create policy "notices: read own" on public.notices for select using (user_id = auth.uid() or (user_id is null and (starts_at is null or starts_at <= now())));
