// 관리자 화면을 실제 브라우저로 띄워 확인 (Supabase 로그인과 admin-api는 PGlite로 흉내).  node ui.mjs [스크린샷 폴더]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { makeDb, serviceClient } from './fake-db.mjs';
import { handle } from '../../supabase/functions/admin-api/index.ts';

const out = process.argv[2] || '.';
const pg = await makeDb(), db = serviceClient(pg);
const ANN = 'aaaaaaaa-0000-4000-8000-000000000001', BOB = 'bbbbbbbb-0000-4000-8000-000000000002';
const C = ['US', 'US', 'US', 'KR', 'KR', 'JP', 'JP', 'GB', 'DE', 'ES', 'FR', 'CA', 'US', 'KR', 'BR', 'AU'];
await pg.exec(`insert into auth.users(id, email, created_at) values ('${ANN}', '24story@gmail.com', now() - interval '40 days'), ('${BOB}', 'bob@x.com', now() - interval '25 days');
  insert into auth.users(id, email, created_at) select gen_random_uuid(), 'user' || i || '@example.com', now() - (i || ' days')::interval * 0.4 from generate_series(1, 66) i;
  update profiles p set country = (array['${C.join("','")}'])[1 + (abs(hashtext(p.email)) % ${C.length})], lang = case when (abs(hashtext(p.email)) % 3) = 0 then 'ko' else 'en' end,
    last_seen_at = now() - (abs(hashtext(p.email)) % 300 || ' hours')::interval;
  update profiles set country = 'KR', lang = 'ko', display_name = '바다별' where id in ('${ANN}', '${BOB}');
  update profiles set last_seen_at = now() - interval '340 days', trial_ends_at = now() - interval '300 days' where email in ('user61@example.com', 'user62@example.com');
  update auth.users set email_confirmed_at = now() where id in ('${ANN}', '${BOB}');
  update profiles p set platform = (array['ios','android','windows','mac','ios'])[1 + abs(hashtext(p.email || 'p')) % 5], installed = abs(hashtext(p.email || 'i')) % 3 = 0, device_at = now(),
    browser = (array['safari','chrome','edge','inapp'])[1 + abs(hashtext(p.email || 'b')) % 4], first_landing = (array['app','/en','/ko','/ja'])[1 + abs(hashtext(p.email || 'l')) % 4],
    first_source = (array['google','instagram','direct','naver','invite','google'])[1 + abs(hashtext(p.email || 's')) % 6], first_campaign = case when abs(hashtext(p.email)) % 4 = 0 then 'fall-launch' end;
  update profiles set device_kind = case when platform in ('ios', 'android') then 'phone' else 'desktop' end, first_medium = case first_source when 'google' then 'organic' when 'naver' then 'organic' when 'instagram' then 'social' when 'invite' then 'referral' end;
  update profiles set platform = null, device_kind = null, browser = null, installed = null, first_source = null, first_medium = null, first_campaign = null, first_landing = null where email in ('user1@example.com', 'user2@example.com');
  insert into subscriptions(subscription_id, user_id, customer_id, status, plan, currency, amount, current_period_end) values
    ('sub_01bob', '${BOB}', 'ctm_01bob', 'active', 'yearly', 'USD', 39.9, now() + interval '300 days');
  insert into subscriptions(subscription_id, user_id, status, plan, currency, amount, current_period_end, cancel_at, created_at)
    select 'sub_0' || i, id, case when i % 7 = 0 then 'past_due' when i % 5 = 0 then 'canceled' else 'active' end, case when i % 3 = 0 then 'yearly' else 'monthly' end, 'USD',
      case when i % 3 = 0 then 39.9 else 3.99 end, now() + interval '20 days', case when i % 4 = 0 then now() + interval '20 days' end, now() - (i || ' days')::interval
    from (select id, row_number() over (order by email) i from auth.users where email like 'user%') u where i <= 18;`);
await pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [BOB]);
await pg.exec(`set role authenticated; insert into entries(id, type, title) select gen_random_uuid(), 'note', 't' from generate_series(1, 37); reset role;`);
await pg.exec(`insert into photos(id, user_id, entry_id, key, bytes, thumb_bytes) select gen_random_uuid(), '${BOB}', null, 'k' || i, 180000, 25000 from generate_series(1, 12) i`);
await pg.query(`select set_config('request.jwt.claim.sub', '', false)`);
await pg.exec(`insert into push_subs(user_id, endpoint, lang, last_ok_at) values ('${BOB}', 'https://fcm.googleapis.com/a', 'ko', now()), ('${ANN}', 'https://web.push.apple.com/b', 'ko', null);
  insert into push_daily(day, sent, failed, gone) select current_date - i, 3 + i % 4, case when i = 2 then 1 else 0 end, 0 from generate_series(1, 9) i; select public.push_count(4, 0, 1);`);

const FAKE_SB = `window.supabase = { createClient: () => { let s = JSON.parse(localStorage.getItem('fake.sess') || 'null'); return { auth: {
  getSession: async () => ({ data: { session: s } }),
  signInWithPassword: async ({ email, password }) => email === '24story@gmail.com' && password === 'pw' ? (s = { access_token: 'tok-${ANN}' }, localStorage.setItem('fake.sess', JSON.stringify(s)), { data: {}, error: null }) :
    email === 'bob@x.com' ? (s = { access_token: 'tok-${BOB}' }, localStorage.setItem('fake.sess', JSON.stringify(s)), { data: {}, error: null }) : { error: { message: 'bad' } },
  signOut: async () => { s = null; localStorage.removeItem('fake.sess'); } } } } };`;
const site = new URL('../site/', import.meta.url);
const errors = [];
const browser = await chromium.launch();
async function page(viewport) {
  const ctx = await browser.newContext({ viewport, locale: 'ko-KR', colorScheme: 'dark' });
  await ctx.route('**/*', async route => {
    const u = new URL(route.request().url());
    // 글꼴은 실제로 받아 와야 화면 비교가 의미 있음 (curl은 프록시 설정을 따름)
    if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
      try { const body = execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 Chrome/120', u.href], { maxBuffer: 1 << 26 }); return route.fulfill({ body, contentType: u.hostname === 'fonts.gstatic.com' ? 'font/woff2' : 'text/css', headers: { 'access-control-allow-origin': '*' } }); }
      catch { return route.abort(); }
    }
    if (u.pathname === '/functions/v1/admin-api') {
      const req = route.request();
      const r = await handle(new Request(u, { method: req.method(), headers: req.headers(), body: req.method() === 'POST' ? req.postData() : undefined }),
        { db, fetch: async () => new Response('{}'), env: { ADMIN_ORIGIN: 'http://admin.test', PADDLE_API_KEY: 'k', PADDLE_ENV: 'sandbox' } });
      return route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers), body: await r.text() });
    }
    if (u.hostname === 'admin.test') {
      const f = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
      if (f === 'vendor/supabase.js') return route.fulfill({ body: FAKE_SB, contentType: 'text/javascript' });
      let body = readFileSync(new URL(f, site), 'utf8');
      if (f === 'config.js') body = body.replace(/SUPABASE_URL: "[^"]*"/, 'SUPABASE_URL: "https://fake.supabase.co"');
      return route.fulfill({ body, contentType: f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' });
    }
    // 템플릿 정지 그림 = 앱 주소 (app/new/…)
    if (u.hostname.endsWith('todaytale.pages.dev') && u.pathname.startsWith('/new/')) {
      try { return route.fulfill({ body: readFileSync(new URL('../../app' + u.pathname, import.meta.url)), contentType: 'image/webp' }); } catch { return route.fulfill({ status: 404, body: '' }); }
    }
    return route.abort();
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errors.push(m.text()));
  return p;
}
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

const p = await page({ width: 1440, height: 960 });
const lp = await page({ width: 1280, height: 800 }); await lp.goto('http://admin.test/'); await lp.waitForSelector('#lf'); await lp.waitForTimeout(400); await lp.screenshot({ path: `${out}/admin-login.png` });
await p.goto('http://admin.test/');
// 관리자가 아닌 계정
await p.fill('input[name=email]', 'bob@x.com'); await p.fill('input[name=pw]', 'x'); await p.click('button.primary');
await p.waitForSelector('#lerr:not(:empty)'); ok((await p.textContent('#lerr')).includes('관리자 명단에 없습니다'), 'non-admin is turned away');
await p.fill('input[name=email]', '24story@gmail.com'); await p.fill('input[name=pw]', 'pw'); await p.click('button.primary');
await p.waitForSelector('.cards'); await p.waitForTimeout(400); ok((await p.textContent('.hero')).includes('68'), '대시보드: 회원 68명');
ok(await p.locator('.tablebox tbody tr').count() >= 5, '대시보드: 나라별 표');
await p.screenshot({ path: `${out}/admin-dashboard.png`, fullPage: true });
await p.hover('#chart', { position: { x: 300, y: 80 } }); await p.screenshot({ path: `${out}/admin-dashboard-hover.png` });
ok(await p.isVisible('#chart .tip'), 'chart tooltip on hover');
await p.click('.ranges button[data-n="7"]'); ok((await p.textContent('#ctot')).includes('7일'), 'range pill switches to 7 days');
await p.goto('http://admin.test/#/users'); await p.waitForSelector('tbody tr');
ok(await p.locator('tbody tr').count() === 50, 'users page 1 has 50 rows'); ok((await p.textContent('.pager')).includes('1 / 2'), 'pager shows 2 pages');
await p.screenshot({ path: `${out}/admin-users.png`, fullPage: false });
await p.fill('input[name=q]', 'bob'); await p.press('input[name=q]', 'Enter');
await p.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1); await p.click('tbody tr');
await p.waitForSelector('#ban'); ok((await p.textContent('dl')).includes('처음 온 곳'), '회원 상세: 기기 · 처음 온 곳');
await p.waitForSelector('#ban'); ok((await p.textContent('.card.violet .cnum')).trim() === '37', 'bob detail shows 37 records');
await p.screenshot({ path: `${out}/admin-user.png`, fullPage: true });
await p.click('#ban'); await p.fill('dialog input[name=reason]', '테스트 정지');
await p.screenshot({ path: `${out}/admin-ban-dialog.png` });
await p.click('dialog button[value=ok]'); await p.waitForSelector('#unban'); ok(true, 'ban → unban button appears');
await p.click('#del'); await p.fill('dialog input[name=confirm_email]', 'bob@x.com'); await p.click('dialog button[value=ok]');
await p.waitForSelector('.toast.bad'); ok((await p.textContent('.toast.bad')).includes('먼저 구독을 해지'), 'delete blocked by live subscription');
await p.goto('http://admin.test/#/subs?status=past_due'); await p.waitForSelector('tbody tr');
ok((await p.locator('tbody .badge.past_due').count()) >= 1, 'subscriptions filter past_due');
await p.goto('http://admin.test/#/subs'); await p.waitForSelector('tbody tr'); await p.screenshot({ path: `${out}/admin-subs.png` });
await p.goto('http://admin.test/#/ops'); await p.waitForSelector('.gauge');
ok(await p.locator('.gauge').count() === 3, '운영: 무료 한도 게이지 3개');
ok((await p.textContent('.grid2')).includes('2명'), '운영: 1년 미접속 안내 대상');
await p.screenshot({ path: `${out}/admin-ops.png`, fullPage: true });
ok((await p.textContent('#main')).includes('알림을 켠 기기') && await p.locator('.bars span').count() === 14, '운영: 알림 상태 + 14일 막대');
await p.goto('http://admin.test/#/usage'); await p.waitForSelector('.blist');
ok((await p.textContent('#main')).includes('감성형') && (await p.textContent('#main')).includes('메모'), '이용 현황: 홈 화면 · 기록 종류');
await p.waitForSelector('#aud');
const aud = await p.textContent('#aud');
ok(aud.includes('나라별') && aud.includes('🇰🇷') && aud.includes('Instagram'.toLowerCase()) && aud.includes('iPhone·iPad') && aud.includes('휴대폰') && aud.includes('홈 화면 앱으로') && aud.includes('소개 · 日本語') && aud.includes('fall-launch'), '이용 현황: 나라·언어·기기·유입 경로');
ok(await p.locator('#aud table.cross tbody tr').count() >= 5 && aud.includes('주 (월요일 시작)'), '이용 현황: 나라 × 운영체제 · 주별 가입');
ok((await p.textContent('#aud .ranges .on')).includes('전체'), '이용 현황: 기간 기본은 전체');
await p.screenshot({ path: `${out}/admin-usage.png`, fullPage: true });
await p.click('#aud .ranges a[href*="days=30"]'); await p.waitForFunction(() => document.querySelector('#aud .ranges .on')?.textContent.includes('30일'));
ok((await p.textContent('#aud .card.violet small')).includes('최근 30일'), '이용 현황: 30일 거르기');
await p.goto('http://admin.test/#/phrases'); await p.waitForSelector('#pf');
await p.fill('#pf textarea[name=text]', '추석 연휴예요. 맛있는 것 많이 먹어요.'); await p.fill('#pf input[name=from]', '2026-09-24'); await p.fill('#pf input[name=to]', '2026-09-27'); await p.selectOption('#pf select[name=tod]', 'morning');
await p.click('#pf .btn.primary'); await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr td').length > 1);
ok((await p.textContent('.tablebox')).includes('2026-09-24 ~ 2026-09-27') && (await p.textContent('.tablebox')).includes('시간대 아침'), '이야기 문장: 더하기 (날짜·시간대 조건)');
await p.fill('#pf textarea[name=text]', '메리 크리스마스, {name} 님.'); await p.selectOption('#pf select[name=slot]', 'greet'); await p.fill('#pf input[name=from]', '12-24'); await p.fill('#pf input[name=to]', '12-25'); await p.click('#pf .btn.primary');
await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr').length === 2);
await p.screenshot({ path: `${out}/admin-phrases.png`, fullPage: true });
// 주간 묶음: 붙여 넣기 → 미리 보기 → 올리기 (하루 2개씩, 일본만)
await p.fill('#bf input[name=batch]', '2026-W45 ko JP'); await p.fill('#bf input[name=country]', 'jp'); await p.fill('#bf input[name=start]', '2026-11-02'); await p.fill('#bf input[name=per]', '2');
await p.fill('#bf textarea[name=json]', JSON.stringify([{ slot: 'word', text: '내일은 아직 실수가 없는 새날이에요.', cond: { by: '루시 모드 몽고메리', src: '『빨강 머리 앤』' } }, { slot: 'air', text: '하나' }, { slot: 'air', text: '둘' }]));
await p.click('#bcheck'); await p.waitForFunction(() => /3줄/.test(document.getElementById('bprev').textContent));
ok((await p.textContent('#bprev')).includes('2026-11-02 ~ 2026-11-03') && (await p.textContent('#bprev')).includes('JP만'), '주간 묶음: 미리 보기 (하루 2개씩 · 일본만)');
await p.screenshot({ path: `${out}/admin-batch.png`, fullPage: true });
await p.click('#bsend'); await p.waitForFunction(() => document.body.textContent.includes('2026-W45 ko JP'));
{ const r = (await pg.query(`select slot, country, starts_on::text d, batch from phrase_packs where batch = '2026-W45 ko JP' order by id`)).rows; ok(r.length === 3 && r.every(x => x.country === 'JP') && r.map(x => x.d).join() === '2026-11-02,2026-11-02,2026-11-03', '주간 묶음: 올리기 (나라·여는 날 저장)'); }
await p.fill('#bf textarea[name=json]', JSON.stringify([{ slot: 'lit', text: '굵은 표시 없음' }])); await p.click('#bcheck');
await p.waitForFunction(() => /\*\*/.test(document.getElementById('bprev').textContent)); ok(await p.isDisabled('#bsend'), '주간 묶음: 틀린 줄이 있으면 올리기 막힘');
await p.click('[data-bdel]'); await p.click('dialog button[value=ok]'); await p.waitForFunction(() => document.body.textContent.includes('아직 올린 묶음이 없어요')); ok((await pg.query(`select count(*)::int n from phrase_packs where batch is not null`)).rows[0].n === 0, '주간 묶음: 묶음째 지우기');
await p.click('[data-act]'); await p.waitForSelector('tr.off'); ok(true, '이야기 문장: 끄기');
await p.click('tbody tr:first-child a.btn'); await p.waitForFunction(() => document.querySelector('#pf h2')?.textContent === '문장 고치기');
await p.fill('#pf textarea[name=text]', '메리 크리스마스!'); await p.click('#pf .btn.primary'); await p.waitForFunction(() => document.querySelector('.tablebox')?.textContent.includes('메리 크리스마스!'));
ok((await pg.query(`select count(*)::int n from phrase_packs where text = '메리 크리스마스!' and cond->'between'->>0 = '12-24'`)).rows[0].n === 1, '이야기 문장: 고치기 (조건 유지)');
await p.click('[data-pdel]'); await p.click('dialog button[value=ok]'); await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr').length === 1); ok(true, '이야기 문장: 지우기');
await p.goto('http://admin.test/#/notices'); await p.waitForSelector('#nf');
await p.fill('#nf input[name=title]', '사진을 넣을 수 있어요'); await p.fill('#nf textarea[name=body]', '기록마다 4장까지 넣을 수 있어요.'); await p.selectOption('#nf select[name=lang]', 'ko'); await p.selectOption('#nf select[name=audience]', 'trial'); await p.selectOption('#nf select[name=banner]', 'popup'); await p.setInputFiles('#nf input[name=img]', process.env.DEMO_IMG || new URL('../../app/stickers/fluent/photo.webp', import.meta.url).pathname); await p.waitForSelector('#nf .nprev:not([hidden])'); await p.fill('#nf textarea[name=detail]', '가을은 기록하기 좋은 계절이에요.\n\n이제 기록마다 사진을 4장까지 넣을 수 있어요.'); await p.fill('#nf input[name=starts]', '2027-01-15'); await p.fill('#nf input[name=ends]', '2027-01-31');
await p.screenshot({ path: `${out}/admin-notice-form.png`, fullPage: true }); await p.selectOption('#nf select[name=banner]', 'strip'); await p.check('#nf input[name=push]'); await p.click('#nf .btn.primary');
await p.waitForSelector('.audit li'); ok((await p.textContent('.audit')).includes('사진을 넣을 수 있어요'), '공지 올리기');
{ const r = (await pg.query(`select banner, audience, starts_at, ends_at, push, kind from notices where title = '사진을 넣을 수 있어요'`)).rows[0]; ok(r.push === true && r.kind === 'announce', '공지: 휴대폰 알림 켜기 저장'); ok(r.banner === 'strip' && r.audience === 'trial' && r.ends_at - r.starts_at === 17 * 864e5, '공지: 홈 배너·대상·기간 저장'); ok((await p.textContent('.audit')).includes('2027-01-15 ~ 2027-01-31'), '공지: 기간 표시'); }
await p.screenshot({ path: `${out}/admin-notices.png` });
await p.goto(`http://admin.test/#/users/${BOB}`); await p.waitForSelector('#ext');
await p.click('#ext'); await p.fill('dialog input[name=days]', '14'); await p.click('dialog button[value=ok]'); await p.waitForTimeout(800);
ok((await pg.query(`select bonus_days from profiles where id = $1`, [BOB])).rows[0].bonus_days === 14, '회원 체험 14일 연장');
await p.click('a.btn[href^="#/vouchers"]'); await p.waitForSelector('#vf');
ok(await p.inputValue('#vf input[name=email]') === 'bob@x.com', '이용권: 회원 상세에서 오면 메일이 채워짐');
await p.fill('#vf input[name=note]', '오류 보상'); await p.click('#vf .btn.primary'); await p.waitForSelector('.vcodes pre');
ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test((await p.textContent('.vcodes pre')).trim()) && await p.locator('.tablebox tbody tr').count() === 1, '이용권: 3개월 코드 만들기');
await p.fill('#vf input[name=email]', ''); await p.selectOption('#vf select[name=len]', '12m'); await p.fill('#vf input[name=count]', '3'); await p.fill('#vf input[name=note]', '베타 테스터 감사'); await p.click('#vf .btn.primary');
await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr').length === 4);
const vcode = (await pg.query(`select code from vouchers where note = '베타 테스터 감사' limit 1`)).rows[0].code;
await pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [ANN]);
await pg.exec('set role authenticated'); await pg.query('select public.redeem_voucher($1)', [vcode]); await pg.exec('reset role'); await pg.query(`select set_config('request.jwt.claim.sub', '', false)`);
await p.goto('http://admin.test/#/vouchers'); await p.waitForSelector('.tablebox tbody tr');
ok((await p.textContent('.tablebox')).includes('24story@gmail.com'), '이용권: 쓴 사람 보임');
await p.screenshot({ path: `${out}/admin-vouchers.png`, fullPage: true });
await p.click('[data-revoke]'); await p.click('dialog button[value=ok]'); await p.waitForFunction(() => document.querySelectorAll('.tablebox tr.off').length === 2); ok(true, '이용권: 취소');
// 템플릿 (11-06)
await pg.exec(`insert into dz_templates (id, fmt, kind, name, tags, words, ex, descr, assets, paid, motion, state, added, sort) values
  ('snow-night', 'art', '아트', '눈 내리는 밤', '{겨울,밤}', '{눈,첫눈,겨울밤,하얀,고요,크리스마스,12월,눈송이,포근}', '[["첫눈이 왔다. 창밖이 조용했다.", 3, "45"], ["퇴근길 가로등 아래 눈송이.", 9, "916"]]',
   '["천천히 내리는 눈 사이로|가로등 불빛이 번져요.", "셔플할 때마다 눈송이가 새로 내려요.", "12월 밤,|짧은 한 줄과 잘 어울려요."]', '{"thumb":"tpl/art/thumbs/art.webp"}', true, true, 'hidden', '2026-11-06', 3),
  ('stamp-line', 'rebus', '디자인', '도장 문장', '{짧은글}', '{}', '[]', '[]', '{}', true, false, 'hidden', '2026-11-05', 4)`);
await p.goto('http://admin.test/#/templates'); await p.waitForSelector('tbody tr[data-id]'); await p.waitForTimeout(500);
ok((await p.$$eval('tbody tr[data-id]', r => r.map(x => x.dataset.id))).join() === 'snow-night,stamp-line,art,rebus', '템플릿: 검토 대기가 먼저');
ok(await p.$eval('[data-st="snow-night"]', b => b.disabled) && !(await p.$eval('[data-st="art"]', b => b.disabled)), '템플릿: 빈칸 있으면 공개 스위치 잠김');
ok(await p.$eval('tr[data-id="art"] img.th', i => i.naturalWidth > 0), '템플릿: 정지 그림 보임');
await p.screenshot({ path: `${out}/admin-templates.png`, fullPage: true });
await p.fill('#tq input', '첫눈'); await p.press('#tq input', 'Enter'); await p.waitForFunction(() => document.querySelectorAll('tbody tr[data-id]').length === 1); ok(true, '템플릿: 검색어로 찾기');
await p.goto('http://admin.test/#/templates?kind=디자인'); await p.waitForFunction(() => document.querySelectorAll('tbody tr[data-id]').length === 2); ok(true, '템플릿: 종류 거르기');
await p.goto('http://admin.test/#/templates/snow-night'); await p.waitForSelector('#tf'); await p.waitForTimeout(400);
ok(await p.$eval('#pub', b => b.disabled) && (await p.textContent('.chk')).includes('예시 3개'), '상세: 빈칸 있으면 공개하기 잠김');
await p.screenshot({ path: `${out}/admin-template.png`, fullPage: true });
await p.click('.ck:has(input[value="감성"])'); await p.click('.ck:has(input[value="눈"])');
ok(await p.$$eval('.ck input:checked', c => c.length) === 3, '상세: 태그 3개까지만');
await p.fill('.chipin', '함박눈, 겨울'); await p.press('.chipin', 'Enter'); ok((await p.textContent('#wc')) === '11', '상세: 검색어 칩 넣기');
await p.fill('textarea[name=e2]', '고요한 밤, 따뜻한 차.'); await p.fill('input[name=name]', '눈 오는 밤');
await p.click('#tf button[value=save]'); await p.waitForFunction(() => !document.querySelector('#pub')?.disabled && document.querySelector('h1').textContent === '눈 오는 밤'); ok(true, '상세: 저장하면 빈칸 없어지고 공개하기 켜짐');
const sv = (await pg.query(`select ex, tags, words from dz_templates where id = 'snow-night'`)).rows[0];
ok(sv.ex.length === 3 && Array.isArray(sv.ex[2]) && sv.ex[2][0] === '고요한 밤, 따뜻한 차.' && sv.ex[0][1] === 3 && sv.tags.length === 3 && sv.words.includes('함박눈'), '상세: 예시 모양(글 · 셔플 · 비율) 그대로 저장');
await p.click('#pub'); await p.click('dialog button[value=ok]'); await p.waitForSelector('#hide'); ok((await pg.query(`select state from dz_templates where id = 'snow-night'`)).rows[0].state === 'public', '상세: 공개');
await p.click('#hide'); await p.click('dialog button[value=ok]'); await p.waitForSelector('#pub'); ok(true, '상세: 숨기기');
await p.goto('http://admin.test/#/templates/tax'); await p.waitForSelector('#ot li'); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/admin-tax.png`, fullPage: true });
await p.fill('#at input[name=name]', '레트로'); await p.selectOption('#at select', 'season:winter'); await p.click('#at button'); await p.waitForSelector('#ot li[data-name="레트로"]');
ok((await pg.query(`select cond from dz_tags where id = '레트로'`)).rows[0].cond.season[0] === 'winter', '종류·태그: 태그 넣기 + 이때 앞으로');
await p.selectOption('[data-cond="레트로"]', ''); await p.waitForFunction(() => document.querySelector('[data-cond="레트로"]')?.value === ''); ok(Object.keys((await pg.query(`select cond from dz_tags where id = '레트로'`)).rows[0].cond).length === 0, '종류·태그: 이때 앞으로 없음으로');
await p.fill('#ak input', '포토'); await p.click('#ak button'); await p.waitForSelector('#ok li[data-name="포토"]'); ok(true, '종류·태그: 종류 넣기');
await p.dragAndDrop('#ok li[data-name="포토"]', '#ok li[data-name="디자인"]', { targetPosition: { x: 40, y: 5 } }); await p.waitForTimeout(600);
ok((await pg.query(`select name from dz_kinds order by sort`)).rows[0].name === '포토', '종류·태그: 끌어서 순서 바꾸기');
await p.click('#ok li[data-name="포토"] [data-rm]'); await p.click('dialog button[value=ok]'); await p.waitForFunction(() => !document.querySelector('#ok li[data-name="포토"]')); ok(true, '종류·태그: 안 쓰는 종류 빼기');
ok(!(await p.$('#ok li[data-name="아트"] [data-rm]')), '종류·태그: 쓰는 종류는 빼기 버튼 없음');
await p.goto('http://admin.test/#/audit'); await p.waitForSelector('.audit li'); await p.screenshot({ path: `${out}/admin-audit.png` }); ok((await p.textContent('.audit')).includes('테스트 정지'), 'audit shows ban reason');

const m = await page({ width: 390, height: 844 });
await m.goto('http://admin.test/'); await m.fill('input[name=email]', '24story@gmail.com'); await m.fill('input[name=pw]', 'pw'); await m.click('button.primary');
await m.waitForSelector('.cards'); await m.waitForTimeout(400); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: no horizontal page scroll');
await m.screenshot({ path: `${out}/admin-mobile.png`, fullPage: true });
await m.goto('http://admin.test/#/usage'); await m.waitForSelector('#aud'); await m.waitForTimeout(300);
ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: 이용 현황도 옆으로 밀리지 않음');
await m.screenshot({ path: `${out}/admin-mobile-usage.png`, fullPage: true });
await m.goto('http://admin.test/#/templates/snow-night'); await m.waitForSelector('#tf'); await m.waitForTimeout(300);
ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: 템플릿 상세도 옆으로 밀리지 않음');
await m.screenshot({ path: `${out}/admin-mobile-template.png`, fullPage: true });
ok(!errors.length, 'no page errors ' + errors.join(' | '));
await browser.close();
console.log(fails ? `\n${fails} failed` : '\nall passed'); process.exit(fails ? 1 : 0);
