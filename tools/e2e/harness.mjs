// 공통 준비: PGlite DB + 사용자 ann + 앱을 띄우는 브라우저 페이지
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { addUser, handler, makeDb } from './bridge.mjs';

export const ANN = 'aaaaaaaa-0000-4000-8000-000000000001';
const MIME = { js: 'text/javascript', css: 'text/css', html: 'text/html', webp: 'image/webp', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', woff2: 'font/woff2', webmanifest: 'application/manifest+json' };
export async function setup({ out = '.', time = '2026-10-08T08:20:00+09:00', trialEndsIn = 23 } = {}) {
  const APP = new URL('../../app/', import.meta.url);
  const db = await makeDb(); const logs = []; const run = handler(db, m => logs.push(m));
  await addUser(db, { id: ANN, email: 'ann@example.com', name: '바다별', daysAgo: 400, trialEndsIn });
  const as = async (sql, args = []) => db.transaction(async tx => { await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [ANN]); await tx.exec('set local role authenticated'); return (await tx.query(sql, args)).rows; });
  const errors = []; const browser = await chromium.launch();
  async function page(viewport, { signedIn = true, net = null, config = '', locale = 'ko-KR', timezoneId = 'Asia/Seoul' } = {}) {
    const ctx = await browser.newContext({ viewport, locale, timezoneId, colorScheme: 'dark', deviceScaleFactor: 2, hasTouch: viewport.width < 600 });
    await ctx.exposeFunction('__pg', (user, r) => run(user, r));
    await ctx.exposeFunction('__login', async (email, pw) => email === 'ann@example.com' && pw === 'password1' ? { id: ANN, email } : null);
    if (signedIn) await ctx.addInitScript(u => { if (!sessionStorage.getItem('fake.out')) localStorage.setItem('fake.user', JSON.stringify(u)); }, { id: ANN, email: 'ann@example.com' });
    await ctx.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.hostname !== 'app.test') { if (net && await net(route, u)) return; return route.abort(); }
      const f = u.pathname === '/' ? 'index.html' : u.pathname.slice(1);
      if (f === 'config.js' && config) return route.fulfill({ body: readFileSync(new URL(f, APP), 'utf8') + '\n' + config, contentType: MIME.js });
      if (f === 'vendor/supabase.js') return route.fulfill({ body: readFileSync(new URL('./fake-client.js', import.meta.url)), contentType: MIME.js });
      try { return route.fulfill({ body: readFileSync(new URL(f, APP)), contentType: MIME[f.split('.').pop()] || 'application/octet-stream' }); }
      catch { return route.fulfill({ status: 404, body: '' }); }
    });
    const p = await ctx.newPage();
    if (time) await p.clock.install({ time: new Date(time) });
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
    return p;
  }
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  const shot = (p, n) => p.screenshot({ path: `${out}/${n}.png` });
  const finish = async () => {
    await browser.close();
    if (logs.length) console.log(logs.join('\n'));
    if (errors.length) { console.log('브라우저 오류:\n' + errors.join('\n')); fails++; }
    console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
  };
  return { db, as, page, ok, shot, finish, ANN };
}
