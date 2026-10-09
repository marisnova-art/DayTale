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
await p.screenshot({ path: `${out}/admin-usage.png`, fullPage: true });
await p.goto('http://admin.test/#/phrases'); await p.waitForSelector('#pf');
await p.fill('#pf textarea[name=text]', '추석 연휴예요. 맛있는 것 많이 먹어요.'); await p.fill('#pf input[name=from]', '2026-09-24'); await p.fill('#pf input[name=to]', '2026-09-27'); await p.selectOption('#pf select[name=tod]', 'morning');
await p.click('#pf .btn.primary'); await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr td').length > 1);
ok((await p.textContent('.tablebox')).includes('2026-09-24 ~ 2026-09-27') && (await p.textContent('.tablebox')).includes('시간대 아침'), '이야기 문장: 더하기 (날짜·시간대 조건)');
await p.fill('#pf textarea[name=text]', '메리 크리스마스, {name} 님.'); await p.selectOption('#pf select[name=slot]', 'greet'); await p.fill('#pf input[name=from]', '12-24'); await p.fill('#pf input[name=to]', '12-25'); await p.click('#pf .btn.primary');
await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr').length === 2);
await p.screenshot({ path: `${out}/admin-phrases.png`, fullPage: true });
await p.click('[data-act]'); await p.waitForSelector('tr.off'); ok(true, '이야기 문장: 끄기');
await p.click('tbody tr:first-child a.btn'); await p.waitForFunction(() => document.querySelector('#pf h2')?.textContent === '문장 고치기');
await p.fill('#pf textarea[name=text]', '메리 크리스마스!'); await p.click('#pf .btn.primary'); await p.waitForFunction(() => document.querySelector('.tablebox').textContent.includes('메리 크리스마스!'));
ok((await pg.query(`select count(*)::int n from phrase_packs where text = '메리 크리스마스!' and cond->'between'->>0 = '12-24'`)).rows[0].n === 1, '이야기 문장: 고치기 (조건 유지)');
await p.click('[data-pdel]'); await p.click('dialog button[value=ok]'); await p.waitForFunction(() => document.querySelectorAll('.tablebox tbody tr').length === 1); ok(true, '이야기 문장: 지우기');
await p.goto('http://admin.test/#/notices'); await p.waitForSelector('#nf');
await p.fill('#nf input[name=title]', '사진을 넣을 수 있어요'); await p.fill('#nf textarea', '기록마다 4장까지 넣을 수 있어요.'); await p.selectOption('#nf select', 'ko'); await p.click('#nf .btn.primary');
await p.waitForSelector('.audit li'); ok((await p.textContent('.audit')).includes('사진을 넣을 수 있어요'), '공지 올리기');
await p.screenshot({ path: `${out}/admin-notices.png` });
await p.goto(`http://admin.test/#/users/${BOB}`); await p.waitForSelector('#ext');
await p.click('#ext'); await p.fill('dialog input[name=days]', '14'); await p.click('dialog button[value=ok]'); await p.waitForTimeout(800);
ok((await pg.query(`select bonus_days from profiles where id = $1`, [BOB])).rows[0].bonus_days === 14, '회원 체험 14일 연장');
await p.goto('http://admin.test/#/audit'); await p.waitForSelector('.audit li'); await p.screenshot({ path: `${out}/admin-audit.png` }); ok((await p.textContent('.audit')).includes('테스트 정지'), 'audit shows ban reason');

const m = await page({ width: 390, height: 844 });
await m.goto('http://admin.test/'); await m.fill('input[name=email]', '24story@gmail.com'); await m.fill('input[name=pw]', 'pw'); await m.click('button.primary');
await m.waitForSelector('.cards'); await m.waitForTimeout(400); ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone: no horizontal page scroll');
await m.screenshot({ path: `${out}/admin-mobile.png`, fullPage: true });
ok(!errors.length, 'no page errors ' + errors.join(' | '));
await browser.close();
console.log(fails ? `\n${fails} failed` : '\nall passed'); process.exit(fails ? 1 : 0);
