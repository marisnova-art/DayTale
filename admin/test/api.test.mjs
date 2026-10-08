// admin.sql 권한 + admin-api 동작 검사 (v1).  node --experimental-strip-types api.test.mjs
import { makeDb, serviceClient } from './fake-db.mjs';
import { handle } from '../../supabase/functions/admin-api/index.ts';

const pg = await makeDb(), db = serviceClient(pg);
const U = { ann: 'aaaaaaaa-0000-4000-8000-000000000001', bob: 'bbbbbbbb-0000-4000-8000-000000000002', cat: 'cccccccc-0000-4000-8000-000000000003', dan: 'dddddddd-0000-4000-8000-000000000004' };
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const asRole = async (role, sql) => pg.transaction(async tx => { await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [U.bob]); await tx.exec(`set local role ${role}`); return (await tx.query(sql)).rows; });
const denied = async (p, m) => { try { await p; ok(false, m); } catch (e) { ok(/permission denied/.test(e.message), m + ' → ' + e.message.slice(0, 50)); } };

// ann = 대표(owner, 24story 메일로 자동), cat = staff, bob = 연간 구독, dan = 체험 끝남 + 오래 안 들어옴
await pg.exec(`insert into auth.users(id, email, created_at) values ('${U.ann}', '24story@gmail.com', now() - interval '3 days'), ('${U.bob}', 'bob@x.com', now() - interval '10 days'),
    ('${U.cat}', 'cat@x.com', now() - interval '20 days'), ('${U.dan}', 'dan@x.com', now() - interval '400 days');
  insert into admins(user_id, role) values ('${U.cat}', 'staff');
  update profiles set country = 'KR', lang = 'ko' where id in ('${U.ann}', '${U.bob}'); update profiles set country = 'US', lang = 'en' where id = '${U.cat}';
  update profiles set trial_ends_at = now() - interval '360 days', last_seen_at = now() - interval '340 days' where id = '${U.dan}';
  update profiles set trial_ends_at = now() + interval '6 days 12 hours' where id = '${U.cat}';
  update auth.users set email_confirmed_at = now() where email in ('24story@gmail.com', 'bob@x.com');
  insert into subscriptions(subscription_id, user_id, status, plan, currency, amount, current_period_end) values ('sub_01bob', '${U.bob}', 'active', 'yearly', 'USD', 39.9, now() + interval '300 days');
  insert into subscriptions(subscription_id, user_id, status, plan) values ('sub_01old', '${U.dan}', 'canceled', 'monthly');`);
await pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [U.bob]);
await pg.exec(`set role authenticated; insert into entries(id, type, title, content) values ('11111111-0000-4000-8000-000000000001', 'note', '비밀 제목', '비밀 본문'), ('11111111-0000-4000-8000-000000000002', 'note', 'x', 'y'); reset role;`);
await pg.query(`select set_config('request.jwt.claim.sub', '', false)`);
ok((await pg.query(`select role from admins where user_id = $1`, [U.ann])).rows[0]?.role === 'owner', '대표 메일로 가입하면 자동으로 owner');

// --- SQL 권한 ---
for (const f of ['admin_stats()', 'admin_usage()', 'ops_daily()']) await denied(asRole('authenticated', `select public.${f}`), `로그인 사용자는 ${f} 못 부름`);
await denied(asRole('anon', `select * from public.admin_users()`), 'anon은 admin_users 못 부름');
await denied(asRole('authenticated', 'select * from public.admin_audit'), '관리 기록 못 읽음');
await denied(asRole('authenticated', 'select * from public.ops_limits'), '한도 표 못 읽음');

// --- API ---
const call = async (who, body, init = {}) => {
  const r = await handle(new Request('https://x/functions/v1/admin-api', { method: 'POST', headers: { origin: 'https://admin.daytale.app', ...(who ? { authorization: 'Bearer tok-' + U[who] } : {}), ...(init.headers || {}) }, body: JSON.stringify(body) }),
    { db, fetch: init.fetch ?? (async () => new Response('{}')), env: { ADMIN_ORIGIN: 'https://admin.daytale.app', PADDLE_API_KEY: init.key ?? '', PADDLE_ENV: 'sandbox', CRON_SECRET: 'cron' } });
  return { status: r.status, body: await r.json().catch(() => null), cors: r.headers.get('access-control-allow-origin') };
};
ok((await call(null, { action: 'stats' })).status === 401, '토큰 없으면 401');
ok((await call('bob', { action: 'stats' })).status === 403, '관리자 아니면 403');
const me = await call('cat', { action: 'me' }); ok(me.status === 200 && me.body.role === 'staff' && me.cors === 'https://admin.daytale.app', 'staff: me + CORS');
const st = (await call('ann', { action: 'stats' })).body;
ok(st.users === 4 && st.entries === 2 && st.paying.yearly === 1 && st.in_trial === 2 && st.trial_ended === 1, '대시보드 숫자 (체험 중 2 · 체험 끝 1)');
ok(st.countries.find(c => c.country === 'KR')?.users === 2 && st.countries.find(c => c.country === 'KR')?.paying === 1 && st.langs.en === 1, '나라별 회원·유료, 언어별');
ok(st.retention.notice_30d === 1, '1년 미접속 정리: 30일 전 안내 대상 1명');
const usage = (await call('cat', { action: 'usage' })).body;
ok(usage.length === 3 && usage.every(u => typeof u.pct === 'number' && 'warn' in u), '무료 한도 사용량 3가지 (DB · R2 · MAU)');
await pg.exec(`update ops_limits set limit_value = 1000 where k = 'db_bytes'`);
ok((await call('ann', { action: 'usage' })).body.find(u => u.k === 'db_bytes').warn === true, '70% 넘으면 경고');
const us = (await call('ann', { action: 'users', q: 'bo' })).body;
ok(us.total === 1 && us.rows[0].entries === 2 && us.rows[0].sub_status === 'active' && us.rows[0].country === 'KR', '회원 검색');
ok((await call('ann', { action: 'users', filter: 'trial' })).body.total === 2 && (await call('ann', { action: 'users', filter: 'ended' })).body.total === 1, '거르기: 체험 중 · 체험 끝');
ok((await call('ann', { action: 'users', filter: 'inactive' })).body.rows[0]?.email === 'dan@x.com', '거르기: 오래 안 들어온 회원');
ok((await call('ann', { action: 'users', q: '%' })).body.total === 0, '검색어 % 이스케이프');
const bob = (await call('cat', { action: 'user', id: U.bob })).body;
ok(bob.entries === 2 && bob.subscriptions.length === 1 && !('update_payment_url' in bob.subscriptions[0]) && bob.country === 'KR', '회원 상세: 개수 · 구독 · 나라');
ok(!JSON.stringify(bob).includes('비밀'), '회원 상세에 기록 내용은 절대 없음');

// 체험 연장 (owner)
ok((await call('cat', { action: 'extend_trial', id: U.dan, days: 7 })).status === 403, 'staff는 체험 연장 못 함');
ok((await call('ann', { action: 'extend_trial', id: U.dan, days: 999 })).status === 400, '연장은 1~90일');
ok((await call('ann', { action: 'extend_trial', id: U.dan, days: 14, reason: '문의 보상' })).body.bonus_days === 14, '체험 14일 연장');

// 공지
ok((await call('cat', { action: 'notice_create', title: 'x' })).status === 403, 'staff는 공지 못 씀');
ok((await call('ann', { action: 'notice_create', title: '사진 기능이 생겼어요', body: '기록마다 4장', lang: 'ko' })).status === 200, '공지 쓰기');
const ns = (await call('cat', { action: 'notices' })).body.rows; ok(ns.length === 1 && ns[0].title === '사진 기능이 생겼어요', '공지 목록');
ok((await asRole('authenticated', `select title from notices`)).some(r => r.title === '사진 기능이 생겼어요'), '앱 사용자도 공지를 읽음');
ok((await call('ann', { action: 'notice_delete', id: ns[0].id })).status === 200 && (await call('ann', { action: 'notices' })).body.rows.length === 0, '공지 지우기');

// 매일 운영: 체험 7일 전 안내 (예약 작업 비밀 헤더)
ok((await call(null, { action: 'ops_daily' }, { headers: { 'x-cron-secret': 'wrong' } })).status === 403, '예약 작업: 비밀이 틀리면 거절');
const od = (await call(null, {}, { headers: { 'x-cron-secret': 'cron' } })).body;
ok(od.trial_7d === 1, '체험 7일 전 알림 1건 (cat)');
ok((await call(null, {}, { headers: { 'x-cron-secret': 'cron' } })).body.trial_7d === 0, '같은 알림은 한 번만');
ok((await pg.query(`select lang, title from notices where user_id = $1`, [U.cat])).rows[0]?.title === 'Your free trial ends in 7 days', '회원 언어로 (영어)');

// 정지 · 삭제 · 해지
ok((await call('cat', { action: 'ban', id: U.ann })).status === 400, '관리자는 정지 못 함');
ok((await call('cat', { action: 'ban', id: U.dan, reason: '스팸' })).status === 200, 'staff 정지');
ok((await call('ann', { action: 'unban', id: U.dan })).status === 200, '정지 해제');
ok((await call('cat', { action: 'delete_user', id: U.dan, confirm_email: 'dan@x.com' })).status === 403, 'staff는 삭제 못 함');
ok((await call('ann', { action: 'delete_user', id: U.bob, confirm_email: 'bob@x.com' })).body.error === 'cancel the subscription first', '구독 중이면 삭제 막힘');
ok((await call('ann', { action: 'delete_user', id: U.dan, confirm_email: 'DAN@x.com ', reason: '본인 요청' })).status === 200, 'owner 삭제');
ok((await call('ann', { action: 'cancel_subscription', subscription_id: 'sub_01bob' })).body.error === 'PADDLE_API_KEY not set', '해지에는 Paddle 키 필요');
let sent;
const r = await call('ann', { action: 'cancel_subscription', subscription_id: 'sub_01bob', reason: '요청' }, { key: 'pdl_test', fetch: async (url, init) => { sent = { url, init }; return new Response('{}'); } });
ok(r.status === 200 && sent.url === 'https://sandbox-api.paddle.com/subscriptions/sub_01bob/cancel', 'Paddle 샌드박스로 해지 요청');
const au = (await call('cat', { action: 'audit' })).body.rows.map(a => a.action);
ok(au.join() === 'cancel_subscription,delete_user,unban,ban,notice_delete,notice_create,extend_trial', '관리 기록: ' + au.join());
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
