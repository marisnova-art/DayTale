// 언어별 화면 넘침 검사: node tools/e2e/i18n-layout.mjs <출력폴더> [ko,en,ja,es,fr] [390] [shot|noshot] [grid 등 배경]
// 넘침(OFFSCREEN) · 단추 줄바꿈(WRAP) · 가려짐(COVERED) · 잘림(CUT/CLIP/ELLIPSIS) · 가로 스크롤을 화면마다 적어요. 새 언어를 넣을 때마다 돌려요
import { setup } from './harness.mjs';
const OUT = process.argv[2]; const LANGS = (process.argv[3] || 'ko,en,ja,es,fr').split(','); const W = +(process.argv[4] || 390); const SHOTS = process.argv[5] !== 'noshot';
const { page, shot, finish } = await setup({ out: OUT });
const LOC = { ko: ['ko-KR', 'Asia/Seoul'], en: ['en-US', 'America/New_York'], ja: ['ja-JP', 'Asia/Tokyo'], es: ['es-ES', 'Europe/Madrid'], fr: ['fr-FR', 'Europe/Paris'] };
const detect = () => {
  const W = innerWidth, out = [];
  const d = el => (el.className && typeof el.className === 'string' ? el.tagName.toLowerCase() + '.' + el.className.split(' ')[0] : el.tagName.toLowerCase()) + ' "' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) + '"';
  const vis = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return r.bottom > 0 && r.top < innerHeight; };
  const fixedAnc = el => { for (let e = el; e; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return e; } return null; };
  const seen = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (!vis(el)) continue;
    if (el.closest('.story, .ed-body, .ed-title, textarea, .lit, .snote, p, .sub, small, .entry .body, .card .body, .ex, .prev')) {/* prose may wrap */} 
    const r = document.createRange(); r.selectNodeContents(n); const rects = [...r.getClientRects()].filter(x => x.width > 1);
    if (!rects.length) continue;
    // offscreen horizontally
    for (const x of rects) if (x.right > W + 1 || x.left < -1) { const k = 'off' + d(el); if (!seen.has(k)) { seen.add(k); out.push(['OFFSCREEN', d(el), Math.round(x.left) + '..' + Math.round(x.right)]); } break; }
    // wrap inside a control
    const ctl = el.closest('button, a.chip, .seg, .filters button, nav a, .tabs a, [role=tab], .menu a, .bar a, label.chip, .pill');
    const tops = new Set(rects.map(x => Math.round(x.top / 6)));
    if (ctl && tops.size > 1 && !ctl.closest('.srow, .row, .item, .entry, li')) { const k = 'wrap' + d(ctl); if (!seen.has(k)) { seen.add(k); out.push(['WRAP', d(ctl)]); } }
    // ellipsis truncation
    for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) { const k = 'ell' + d(e); if (!seen.has(k)) { seen.add(k); out.push(['ELLIPSIS', d(e)]); } break; } if (s.overflow !== 'visible' && e.scrollWidth > e.clientWidth + 2 && s.overflowX !== 'auto' && s.overflowX !== 'scroll') { const k = 'clip' + d(e); if (!seen.has(k)) { seen.add(k); out.push(['CLIP', d(e)]); } break; } }
    // covered by another element
    const fx = fixedAnc(el);
    for (const x of rects) { const cx = x.left + x.width / 2, cy = x.top + x.height / 2; if (cx < 0 || cx > W || cy < 0 || cy > innerHeight) continue; const hit = document.elementFromPoint(cx, cy); if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue; const hf = fixedAnc(hit); if (hf && hf !== fx && !fx) continue; if (hit.closest('.scrim, .backdrop')) continue; const k = 'cov' + d(el); if (!seen.has(k)) { seen.add(k); out.push(['COVERED', d(el), 'by ' + d(hit)]); } break; }
  }
  for (const b of document.querySelectorAll('button, a, .chip, label')) { if (!vis(b)) continue; const r = b.getBoundingClientRect(); for (let e = b.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.overflowX === 'hidden' || s.overflow === 'hidden' || s.overflow === 'clip') { const q = e.getBoundingClientRect(); if (r.right > q.right + 1 || r.left < q.left - 1 || r.top < q.top - 1 || r.bottom > q.bottom + 1) out.push(['CUT', d(b), 'in ' + d(e)]); break; } } }
  for (const h of document.querySelectorAll('label, h3, h4, .lbl, .sgh, .ttl, .head b, .sec-t, .ph')) { if (!vis(h)) continue; const r = h.getBoundingClientRect(); for (let e = h.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.overflowY !== 'visible') { const q = e.getBoundingClientRect(); if (r.top < q.top - 1 && e.scrollTop === 0) out.push(['TOPCUT', d(h)]); break; } } }
  if (document.documentElement.scrollWidth > W + 1) out.push(['HSCROLL', document.documentElement.scrollWidth]);
  return out;
};
const report = {};
for (const lang of LANGS) {
  const [locale, timezoneId] = LOC[lang];
  const p = await page({ width: W, height: 844 }, { locale, timezoneId });
  const check = async name => { await p.waitForTimeout(700); await p.evaluate(() => document.fonts.ready); const r = await p.evaluate(detect); report[`${lang} ${name}`] = r; if (SHOTS) await shot(p, `${lang}_${name}`); };
  const go = async (h, wait) => { await p.goto('http://app.test/#' + h); if (wait) await p.waitForSelector(wait, { timeout: 8000 }).catch(() => {}); };
  if (process.argv[6]) { await go('/settings/display', '[data-s=bg]'); await p.click(`[data-s=bg][data-v=${process.argv[6]}]`); await p.waitForTimeout(500); }
  await go('/home', '.story p'); await p.waitForTimeout(1500); await check('home');
  await go('/calendar', '.seg'); await check('cal_week');
  await p.click('.filters [data-f=todo]').catch(() => {}); await check('cal_week_todo');
  await p.click('.seg [data-v=month]').catch(() => {}); await check('cal_month');
  for (const r of ['/all', '/todo', '/favorites', '/trash', '/search', '/nofolder']) { await go(r); await check(r.slice(1)); }
  await go('/new', '.ed-body'); await p.waitForTimeout(500); await check('ed');
  await p.locator('[data-act=more]:visible').first().click().catch(e => console.log('nomore', e.message.slice(0,80))); await check('ed_options'); await p.locator('[data-act=more]:visible').first().click().catch(() => {});
  await p.locator('[data-act=aa]:visible').first().click().catch(() => {}); await check('ed_format'); await p.locator('[data-act=aa]:visible').first().click().catch(() => {});
  await go('/settings'); await check('settings');
  for (const g of ['account', 'display', 'record', 'notify', 'data', 'info']) { await go('/settings/' + g); await check('set_' + g); if (g === 'display') { await p.evaluate(() => scrollTo(0, 99999)); await check('set_display2'); } }
  for (const r of ['/plans', '/notices', '/backup']) { await go(r); await check(r.slice(1)); }
  await go('/home', '.story p'); await p.click('[data-act=menu]').catch(() => {}); await check('menu');
}
for (const [k, v] of Object.entries(report)) if (v.length) console.log(k + '\n  ' + v.map(x => x.join(' ')).join('\n  '));
await finish();
