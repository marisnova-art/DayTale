-- 테스트 전용: Supabase의 auth 스키마와 역할을 흉내 냅니다. 배포 파일이 아닙니다.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz, banned_until timestamptz, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema public, auth to authenticated, anon, service_role;
grant execute on all functions in schema auth to authenticated, anon, service_role;
-- Supabase 기본값처럼 새 표·함수를 모두에게 열어 둠 (schema.sql이 닫는지 확인하기 위해)
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
