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
ok(au.slice(0, 7).join() === 'cancel_subscription,delete_user,unban,ban,notice_delete,notice_create,extend_trial', '관리 기록: ' + au.join());

// 알림 상태 · 이용 현황 (숫자만)
await pg.exec(`insert into push_subs(user_id, endpoint, lang, last_ok_at) values ('${U.ann}', 'https://fcm.googleapis.com/x', 'ko', now())`);
const pu = await call('cat', { action: 'push' });
ok(pu.status === 200 && pu.body.devices === 1 && pu.body.ok_7d === 1, '알림 상태: 기기 수');
await pg.exec(`select public.push_count(3, 1, 0); select public.push_count(2, 0, 1)`);
ok((await call('cat', { action: 'push' })).body.today.sent === 5, '알림 하루 집계가 더해짐');
await denied(asRole('authenticated', 'select public.push_count(1, 0, 0)'), '앱 사용자는 집계를 못 바꿈');
const fe = await call('cat', { action: 'features' });
ok(fe.status === 200 && fe.body.types.note === 2 && fe.body.modes.story >= 1, '이용 현황: 종류·모드 개수');
ok(!JSON.stringify(fe.body).includes('비밀'), '이용 현황에 기록 내용 없음');

// 이야기 문장 관리
ok((await call('cat', { action: 'phrase_save', lang: 'ko', slot: 'air', text: '가을비가 와요.' })).status === 403, 'staff는 문장 못 바꿈');
ok((await call('ann', { action: 'phrase_save', lang: 'ko', slot: 'air', text: '가을비', cond: { wx: 'lava' } })).body.error === 'bad condition', '모르는 조건은 거절');
ok((await call('ann', { action: 'phrase_save', lang: 'xx', slot: 'air', text: 'a' })).body.error === 'bad phrase', '모르는 언어 거절');
ok((await call('ann', { action: 'phrase_save', lang: 'ko', slot: 'air', text: ' 추석 연휴예요. ', weight: 3, cond: { between: ['2026-09-24', '2026-09-27'], tod: '' } })).status === 200, '문장 추가');
const ph = (await call('cat', { action: 'phrases', lang: 'ko' })).body.rows;
ok(ph.length === 1 && ph[0].text === '추석 연휴예요.' && ph[0].cond.between[1] === '2026-09-27' && !('tod' in ph[0].cond), '문장 목록 (빈 조건은 빠짐)');
ok((await asRole('authenticated', `select text from phrase_packs where active`)).length === 1, '앱이 켜진 문장을 읽음');
ok((await call('ann', { action: 'phrase_active', id: ph[0].id, active: false })).status === 200 && (await asRole('authenticated', `select text from phrase_packs where active`)).length === 0, '문장 끄기');
ok((await call('ann', { action: 'phrase_save', id: ph[0].id, lang: 'ko', slot: 'close', text: '연휴 잘 보내요.' })).status === 200 && (await call('cat', { action: 'phrases' })).body.rows[0].slot === 'close', '문장 고치기');
ok((await call('ann', { action: 'phrase_delete', id: ph[0].id })).status === 200 && (await call('cat', { action: 'phrases' })).body.rows.length === 0, '문장 지우기');
await denied(asRole('authenticated', `insert into phrase_packs(lang, slot, text) values ('ko', 'air', 'x')`), '앱 사용자는 문장을 못 넣음');

// 체험 안내: 일본어
await pg.exec(`insert into auth.users(id, email) values ('eeeeeeee-0000-4000-8000-000000000005', 'eve@x.com'); update profiles set lang = 'ja', trial_ends_at = now() + interval '2 days' where id = 'eeeeeeee-0000-4000-8000-000000000005'`);
ok((await call(null, {}, { headers: { 'x-cron-secret': 'cron' } })).body.trial_3d === 1 && (await pg.query(`select title from notices where kind = 'trial_3d'`)).rows[0]?.title === '無料体験はあと3日です', '체험 안내: 일본어');
// 이용권 코드
const V = { fay: 'ffffffff-0000-4000-8000-000000000006', gus: '99999999-0000-4000-8000-000000000007', hal: '88888888-0000-4000-8000-000000000008' };
await pg.exec(`insert into auth.users(id, email) values ('${V.fay}', 'fay@x.com'), ('${V.gus}', 'gus@x.com'), ('${V.hal}', 'hal@x.com'); update profiles set trial_ends_at = now() + interval '15 days' where id = '${V.fay}'; update profiles set trial_ends_at = now() - interval '40 days' where id = '${V.hal}'`);
const asU = async (id, sql, params = []) => pg.transaction(async tx => { await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [id]); await tx.exec('set local role authenticated'); return (await tx.query(sql, params)).rows; });
const redeem = async (id, code) => (await asU(id, `select public.redeem_voucher($1) r`, [code]))[0].r;
ok((await call('cat', { action: 'voucher_create', amount: 3, unit: 'months' })).status === 403, 'staff는 이용권 못 만듦');
ok((await call('ann', { action: 'voucher_create', amount: 13, unit: 'months' })).status === 400 && (await call('ann', { action: 'voucher_create', amount: 367, unit: 'days' })).status === 400, '이용권은 최대 1년');
ok((await call('ann', { action: 'voucher_create', amount: 30, unit: 'days', count: 2, email: 'x@x.com' })).status === 400, '메일 지정 코드는 한 개씩');
const c3 = (await call('ann', { action: 'voucher_create', amount: 3, unit: 'months', note: '테스트' })).body.codes;
ok(c3.length === 1 && /^[A-HJ-NP-Z2-9]{12}$/.test(c3[0]), '3개월 코드 1개 (헷갈리는 글자 없음)');
const many = (await call('ann', { action: 'voucher_create', amount: 1, unit: 'months', count: 5 })).body.codes;
ok(many.length === 5 && new Set(many).size === 5, '여러 개 한 번에');
const pretty = c3[0].match(/.{4}/g).join('-').toLowerCase();
const r1 = await redeem(V.fay, ' ' + pretty + ' ');
const fp = (await pg.query(`select pass_until = trial_ends_at + interval '3 months' x from profiles where id = $1`, [V.fay])).rows[0];
ok(r1.ok === true && fp.x, '체험 15일 남음 + 3개월 → 체험 끝에 3개월 이어 붙음 (소문자·대시 넣어도 됨)');
const fst = (await asU(V.fay, `select public.my_status() s`))[0].s;
ok(fst.can_write && fst.pass_until && new Date(fst.trial_ends_at) - new Date(fst.pass_until) === 0, '내 상태: 이용권 끝 = 무료 이용 끝');
ok((await redeem(V.fay, c3[0])).error === 'already', '같은 코드 두 번 못 넣음');
ok((await redeem(V.gus, c3[0])).error === 'used', '한 번 쓴 코드는 다른 사람도 못 씀');
ok((await redeem(V.hal, many[0])).ok && (await asU(V.hal, `select public.can_write() w`))[0].w === true, '체험 끝난 회원: 오늘부터 1개월 쓰기 열림');
ok((await redeem(V.hal, many[1])).ok && (await pg.query(`select pass_until > now() + interval '59 days' x from profiles where id = $1`, [V.hal])).rows[0].x, '이용권 두 개면 이어 붙음');
ok((await redeem(U.bob, many[2])).error === 'subscribed', '자동 결제 구독 중이면 안 받음');
await pg.exec(`update subscriptions set cancel_at = current_period_end where subscription_id = 'sub_01bob'`);
const rb = await redeem(U.bob, many[2]);
ok(rb.ok && Math.abs(new Date(rb.from) - Date.now() - 300 * 864e5) < 864e5, '해지 예약한 구독자: 구독 끝난 다음부터 이어 붙음');
const ce = (await call('ann', { action: 'voucher_create', amount: 7, unit: 'days', email: 'Fay@X.com', expires: '2099-01-01' })).body.codes[0];
ok((await redeem(V.gus, ce)).error === 'bad' && (await redeem(V.fay, ce)).ok, '메일 지정 코드는 그 사람만');
ok((await call('ann', { action: 'voucher_revoke', code: many[3] })).status === 200 && (await redeem(V.gus, many[3])).error === 'bad', '취소한 코드는 못 씀');
ok((await call('ann', { action: 'voucher_create', amount: 7, unit: 'days', expires: '2020-01-01' })).status === 400, '지난 날짜 기한은 거절');
await pg.exec(`insert into vouchers(code, duration, expires_at) values ('ZZZZZZZZZZZZ', '7 days', now() - interval '1 day')`);
ok((await redeem(V.gus, 'ZZZZZZZZZZZZ')).error === 'expired', '기한 지난 코드');
await denied(asU(V.gus, 'select * from vouchers'), '앱 사용자는 코드 목록 못 봄');
await denied(asU(V.gus, `update profiles set pass_until = now() + interval '9 years' where id = '${V.gus}'`), '앱 사용자는 이용권 기간을 직접 못 바꿈');
await denied(asU(V.gus, `select public.admin_voucher_create('${V.gus}', '1 year')`), '앱 사용자는 코드를 못 만듦');
for (let i = 0; i < 9; i++) await redeem(V.gus, 'AAAAAAAAAAA' + i);
ok((await redeem(V.gus, many[4])).error === 'too_many', '틀린 코드 10번이면 한 시간 쉬기');
const vl = (await call('cat', { action: 'vouchers' })).body;
ok(vl.total === 8 && vl.counts.used >= 1 && vl.counts.revoked === 1 && vl.rows.find(r => r.code === c3[0]).users[0].email === 'fay@x.com' && vl.rows.find(r => r.code === c3[0]).note === '테스트', '이용권 목록: 상태·쓴 사람');
ok((await call('cat', { action: 'vouchers', status: 'open' })).body.rows.every(r => r.state === 'open'), '이용권 거르기');
const fu = (await call('ann', { action: 'user', id: V.fay })).body;
ok(fu.pass_until && fu.vouchers.length === 2, '회원 상세: 이용권');
ok((await call('ann', { action: 'stats' })).body.on_pass === 3, '대시보드: 이용권 쓰는 회원 수');
// 회원 구성 (나라·언어·기기·처음 온 곳) — 회원은 자기 줄의 정해진 칸만, 처음 온 곳은 한 번만
await asU(V.fay, `update profiles set platform = 'ios', device_kind = 'phone', browser = 'safari', installed = true, device_at = now(), first_source = 'instagram', first_medium = 'social', first_campaign = 'fall-26', first_landing = '/ja' where id = '${V.fay}'`);
await asU(V.fay, `update profiles set first_source = 'google', first_landing = 'app', installed = false where id = '${V.fay}'`);
const fr = (await pg.query(`select first_source, first_landing, installed from profiles where id = $1`, [V.fay])).rows[0];
ok(fr.first_source === 'instagram' && fr.first_landing === '/ja' && fr.installed === false, '처음 온 곳은 바뀌지 않고, 설치 여부는 갱신됨');
await asU(V.gus, `update profiles set platform = 'android', device_kind = 'phone', browser = 'chrome', first_source = 'google', first_landing = 'app' where id = '${V.gus}'`);
await asU(V.hal, `update profiles set platform = 'windows', device_kind = 'desktop', browser = 'edge', first_source = 'direct', first_landing = '/en' where id = '${V.hal}'`);
for (const [sql, m] of [[`platform = 'commodore'`, '모르는 기기'], [`browser = 'netscape'`, '모르는 브라우저'], [`first_landing = '/../x'`, '이상한 첫 페이지'], [`first_source = '${'a'.repeat(41)}'`, '너무 긴 유입 경로'], [`first_campaign = 'Hello World'`, '대문자·빈칸 캠페인']])
  await asU(U.bob, `update profiles set ${sql} where id = '${U.bob}'`).then(() => ok(false, m + ' 거절'), e => ok(/check constraint/.test(e.message), m + ' 거절'));
await denied(asU(V.gus, `update profiles set trial_ends_at = now() + interval '9 years' where id = '${V.gus}'`), '새 칸이 생겨도 체험 기간은 못 바꿈');
ok((await asU(V.gus, `update profiles set platform = 'mac' where id = '${V.fay}' returning id`)).length === 0, '다른 회원의 기기 칸은 못 바꿈');
await denied(asRole('authenticated', 'select public.admin_audience()'), '로그인 사용자는 admin_audience 못 부름');
ok((await call('bob', { action: 'audience' })).status === 403, '회원 구성: 관리자만');
const ad = (await call('cat', { action: 'audience' })).body, G = ad.groups;
const gk = (dim, k) => (G[dim] || []).find(r => r.k === k) || {};
ok(ad.days === null && ad.total.users >= 7 && ad.total.known_source === 3 && ad.total.known_device === 3, '회원 구성: 전체 합계');
ok(gk('source', 'instagram').users === 1 && gk('landing', '/ja').users === 1 && gk('platform', 'ios').users === 1 && gk('device_kind', 'phone').users === 2 && gk('browser', 'edge').users === 1 && gk('installed', 'no').users === 1, '회원 구성: 기기·유입 경로별');
ok(gk('country', 'KR').users === 2 && gk('country', 'KR').paying === 1 && gk('country', 'KR').conv === 50 && gk('lang', 'en').users >= 1, '회원 구성: 나라별 유료·전환율, 언어별');
ok(Array.isArray(ad.weekly) && ad.weekly.some(w => w.source === 'instagram' && w.n === 1) && Array.isArray(ad.cross) && ad.cross.some(c => c.platform === 'ios'), '회원 구성: 주별 가입 × 유입 경로, 나라 × 기기');
await pg.exec(`update auth.users set created_at = now() - interval '60 days' where id = '${V.hal}'`);
const a30 = (await call('cat', { action: 'audience', days: 30 })).body, a90 = (await call('cat', { action: 'audience', days: 90 })).body;
ok(a30.days === 30 && !(a30.groups.source || []).some(r => r.k === 'direct') && (a90.groups.source || []).some(r => r.k === 'direct'), '회원 구성: 기간 거르기 (30일 · 90일)');
ok((await call('cat', { action: 'audience', days: 'x; drop' })).body.days === null, '회원 구성: 이상한 기간은 전체');
const fu2 = (await call('ann', { action: 'user', id: V.fay })).body, ul = (await call('ann', { action: 'users', q: 'fay@' })).body.rows[0];
ok(fu2.platform === 'ios' && fu2.first_source === 'instagram' && fu2.first_landing === '/ja' && ul.platform === 'ios' && ul.first_source === 'instagram', '회원 목록·상세: 기기·처음 온 곳');
ok(!JSON.stringify(ad).includes('@'), '회원 구성에 메일 주소 없음');
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
