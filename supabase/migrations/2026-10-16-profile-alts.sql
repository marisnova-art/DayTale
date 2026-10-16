-- 프로필 '다른 모습' 2개 (사진 + 이름), 하루마다 돌아가며 보여요 (dev.143)
create or replace function public.profile_alts_ok(v jsonb) returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(v) = 'array' and jsonb_array_length(v) <= 2 and not exists (
    select 1 from jsonb_array_elements(v) e
    where jsonb_typeof(e) <> 'object'
       or char_length(coalesce(e->>'n', '')) > 40
       or char_length(coalesce(e->>'a', '')) > 60000
       or (coalesce(e->>'a', '') <> '' and (e->>'a') !~ '^data:image/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$'))
$$;
grant execute on function public.profile_alts_ok(jsonb) to authenticated;   -- 제약 검사에 필요해요
alter table public.profiles add column if not exists alts jsonb not null default '[]';
alter table public.profiles drop constraint if exists profiles_alts_check;
alter table public.profiles add constraint profiles_alts_check check (public.profile_alts_ok(alts));
grant update (display_name, lang, country, timezone, avatar, alts) on public.profiles to authenticated;
