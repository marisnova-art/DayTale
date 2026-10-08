// 앱을 실제 브라우저로 띄워 확인해요 (Supabase는 PGlite로 흉내).  node app.mjs [스크린샷 폴더]
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { addUser, handler, makeDb } from './bridge.mjs';

const out = process.argv[2] || '.';
const APP = new URL('../../app/', import.meta.url);
const db = await makeDb(); const logs = []; const run = handler(db, m => logs.push(m));
const ANN = 'aaaaaaaa-0000-4000-8000-000000000001';
const T0 = '2026-10-08T08:20:00+09:00';   // 브라우저 시각: 서울 아침
await addUser(db, { id: ANN, email: 'ann@example.com', name: '바다별', daysAgo: 400, trialEndsIn: 23 });
const as = async (sql, args = []) => db.transaction(async tx => { await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [ANN]); await tx.exec('set local role authenticated'); return (await tx.query(sql, args)).rows; });
const seed = [
  ['event', '치과 예약', { date: '2026-10-08', time: '14:00' }, '2026-10-01T10:00:00+09:00'],
  ['todo', '택배 반품 접수하기', { date: '2026-10-08' }, '2026-10-07T09:00:00+09:00'],
  ['todo', '기획서 2장까지 쓰기', {}, '2026-10-06T09:00:00+09:00'],
  ['todo', '엄마한테 전화', { done: true, doneAt: '2026-10-08T07:50:00+09:00' }, '2026-10-07T21:00:00+09:00'],
  ['note', '가을 첫 산책', {}, '2025-10-08T18:30:00+09:00'],
  ['note', '새 노트 구상', {}, '2026-10-07T20:00:00+09:00'],
  ['idea', '주말 캠핑 준비물', {}, '2026-10-06T19:00:00+09:00'],
  ['item', '여권은 책상 두 번째 서랍', {}, '2026-09-20T12:00:00+09:00']
];
for (const [type, title, meta, at] of seed) await as(`insert into entries(id, type, title, content, content_text, meta, created_at, client_updated_at) values (gen_random_uuid(), $1, $2, '', '', $3, $4, $4)`, [type, title, meta, at]);
await as(`insert into folders(id, name, color) values (gen_random_uuid(), '회사', '#7FB2FF'), (gen_random_uuid(), '집', '#9BD68A')`);

const MIME = { js: 'text/javascript', css: 'text/css', html: 'text/html', webp: 'image/webp', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', webmanifest: 'application/manifest+json' };
const errors = [];
const browser = await chromium.launch();
async function page(viewport, { signedIn = true } = {}) {
  const ctx = await browser.newContext({ viewport, locale: 'ko-KR', timezoneId: 'Asia/Seoul', colorScheme: 'dark', deviceScaleFactor: 2 });
  await ctx.exposeFunction('__pg', (user, r) => run(user, r));
  await ctx.exposeFunction('__login', async (email, pw) => email === 'ann@example.com' && pw === 'password1' ? { id: ANN, email } : null);
  if (signedIn) await ctx.addInitScript(u => localStorage.setItem('fake.user', JSON.stringify(u)), { id: ANN, email: 'ann@example.com' });
  await ctx.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (u.hostname !== 'app.test') return route.abort();
    let f = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
    if (f === 'vendor/supabase.js') return route.fulfill({ body: readFileSync(new URL('./fake-client.js', import.meta.url)), contentType: MIME.js });
    try { return route.fulfill({ body: readFileSync(new URL(f, APP)), contentType: MIME[f.split('.').pop()] || 'application/octet-stream' }); }
    catch { return route.fulfill({ status: 404, body: '' }); }
  });
  const p = await ctx.newPage();
  await p.clock.install({ time: new Date(T0) });
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  return p;
}
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const shot = (p, n) => p.screenshot({ path: `${out}/${n}.png` });

// 1. 로그인 화면 → 로그인
let p = await page({ width: 390, height: 844 }, { signedIn: false });
await p.goto('http://app.test/'); await p.waitForSelector('.auth form');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); await shot(p, 'v1_01_login');
await p.fill('input[name=email]', 'ann@example.com'); await p.fill('input[name=pw]', 'wrong'); await p.click('button[type=submit]');
await p.waitForSelector('.msg.bad'); ok((await p.textContent('.msg')).includes('맞지 않아요'), '틀린 비밀번호 안내');
await p.fill('input[name=pw]', 'password1'); await p.click('button[type=submit]');
await p.waitForSelector('.story p'); ok(true, '로그인 후 홈');
await p.context().close();

// 2. 모바일 홈
p = await page({ width: 390, height: 844 });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.waitForTimeout(800);
await p.evaluate(() => document.fonts.ready);
const story = await p.textContent('.story');
console.log('  이야기:', story.replace(/\s+/g, ' ').trim());
ok(/좋은 아침|잘 잤어요|아침이 밝았어요/.test(story), '아침 인사'); ok(story.includes('바다별'), '이름'); ok(story.includes('치과 예약'), '오늘 일정');
ok(story.includes('가을 첫 산책'), '1년 전 회상'); ok((await p.textContent('.askq .q')).length > 5, '질문');
ok((await p.textContent('.peek')).includes('3'), '남은 일 개수');
await shot(p, 'v1_02_home');
await p.click('.peek', { position: { x: 195, y: 24 } }); await p.waitForSelector('.sheet.open'); await p.waitForTimeout(350); await shot(p, 'v1_03_today_sheet');
await p.click('.sheet [data-done]:not(.on)'); await p.waitForTimeout(200);
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.fill('.ask textarea', '아침에 커피 대신 보리차를 마셨다'); await p.click('.ask .go'); await p.waitForSelector('.toast');
await p.waitForTimeout(2500);
const rows = await as(`select type, content_text from entries where content_text like '%보리차%'`);
ok(rows.length === 1 && rows[0].type === 'note', '질문 입력창 → 메모 저장 → 서버 동기화');
await p.click('[data-act=menu]'); await p.waitForTimeout(400); await shot(p, 'v1_04_menu');
ok((await p.textContent('.drawer')).includes('회사'), '메뉴에 폴더');
ok(/2[34]일/.test(await p.textContent('.profile-card')), '체험 남은 날');
await p.context().close();

// 3. PC 홈
p = await page({ width: 1440, height: 900 });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.waitForTimeout(800); await shot(p, 'v1_05_desktop');
await p.context().close();

// 4. 체험 끝: 쓰기 막힘
await db.query(`update profiles set trial_ends_at = now() - interval '40 days' where id = $1`, [ANN]);
p = await page({ width: 390, height: 844 });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.waitForTimeout(1500);
await p.fill('.ask textarea', '잠긴 뒤 쓰기'); await p.click('.ask .go'); await p.waitForTimeout(400);
ok((await p.textContent('.toasts')).includes('체험이 끝나서'), '체험 끝 → 쓰기 잠금 안내');
await p.context().close();

await browser.close();
if (logs.length) console.log(logs.join('\n'));
if (errors.length) { console.log('브라우저 오류:\n' + errors.join('\n')); fails++; }
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
