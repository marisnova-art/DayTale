// 4단계: 캘린더 · 날씨(진짜 함수 + 가짜 MET) · 사진(진짜 함수 + 가짜 R2) · 백업.
// 실행: node --experimental-strip-types phase4.mjs [스크린샷 폴더]
import { setup } from './harness.mjs';
import { handle as photosFn } from '../../supabase/functions/photos/index.ts';
import { handle as weatherFn } from '../../supabase/functions/weather/index.ts';
import { readFileSync } from 'node:fs';
const { db, as, page, ok, shot, finish, ANN } = await setup({ out: process.argv[2] || '.' });
const svc = async (sql, args = []) => db.transaction(async tx => { await tx.exec('set local role service_role'); return (await tx.query(sql, args)).rows; });

// ---- 기록 심기: 이번 달 일정·할 일·기록
const E = (type, title, meta, at) => as(`insert into entries(id, type, title, content, content_text, meta, created_at, client_updated_at) values (gen_random_uuid(), $1, $2, '', '', $3, $4, $4)`, [type, title, meta, at]);
await E('event', '치과 예약', { date: '2026-10-08', time: '14:00', place: '강남역 3번 출구' }, '2026-10-01T10:00:00+09:00');
await E('event', '엄마 생신 저녁', { date: '2026-10-10', time: '18:30' }, '2026-10-02T10:00:00+09:00');
await E('event', '팀 회고', { date: '2026-10-13', time: '10:00' }, '2026-10-02T10:00:00+09:00');
await E('event', '도서관 반납', { date: '2026-10-13' }, '2026-10-02T10:00:00+09:00');
await E('event', '친구 결혼식', { date: '2026-10-17', time: '12:00', place: '라움' }, '2026-10-02T10:00:00+09:00');
await E('event', '병원 정기검진', { date: '2026-10-22', time: '09:30' }, '2026-10-02T10:00:00+09:00');
await E('todo', '기획서 2장까지 쓰기', { date: '2026-10-08' }, '2026-10-07T09:00:00+09:00');
await E('todo', '세금 신고', { date: '2026-10-13' }, '2026-10-07T09:00:00+09:00');
await E('todo', '여권 사진 찍기', { date: '2026-10-13' }, '2026-10-07T09:00:00+09:00');
await E('todo', '우산 챙기기', { date: '2026-10-07', done: true, doneAt: '2026-10-07T08:00:00+09:00' }, '2026-10-06T09:00:00+09:00');
for (const [t, at] of [['아침 산책', '2026-10-08T07:40:00+09:00'], ['국숫집 점심', '2026-10-06T12:10:00+09:00'], ['비 오는 저녁', '2026-10-03T21:00:00+09:00'], ['가을 첫 카디건', '2026-10-01T08:00:00+09:00']])
  await as(`insert into entries(id, type, title, content, content_text, created_at, client_updated_at) values (gen_random_uuid(), 'note', $1, '<p>오늘 기록</p>', '오늘 기록', $2, $2)`, [t, at]);

// ---- 가짜 바깥 세상: MET, R2, 서버 REST
const NOW = Date.parse('2026-10-07T23:20:00Z');
const met = { properties: { timeseries: [0, 1, 2, 3].map(h => ({ time: new Date(NOW - 600e3 + h * 3600e3).toISOString(), data: { instant: { details: { air_temperature: 15.6 + h } }, next_1_hours: { summary: { symbol_code: 'lightrain' } } } })) } };
const wxCache = new Map(); let wxCalls = 0;
const wxDeps = { now: () => NOW, env: k => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', WEATHER_CONTACT: 'ops@example.com' })[k], fetch: async (url, o = {}) => {
  if (url.includes('api.met.no')) { wxCalls++; return new Response(JSON.stringify(met), { headers: { expires: new Date(NOW + 1800e3).toUTCString() } }); }
  if (url.includes('weather_cache?cell=')) { const v = wxCache.get(decodeURIComponent(url.split('cell=eq.')[1].split('&')[0])); return new Response(JSON.stringify(v ? [v] : [])); }
  if (o.method === 'POST') { const b = JSON.parse(o.body); wxCache.set(b.cell, b); return new Response(null, { status: 201 }); }
  return new Response('[]');
} };
const R2 = new Map();
const phDeps = { env: k => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', R2_ACCOUNT_ID: 'acc', R2_ACCESS_KEY_ID: 'AK', R2_SECRET_ACCESS_KEY: 'SK', R2_BUCKET: 'b', CRON_SECRET: 'cron' })[k], fetch: async (url, o = {}) => {
  if (url.endsWith('/auth/v1/user')) return o.headers.authorization === 'Bearer fake' ? new Response(JSON.stringify({ id: ANN })) : new Response('{}', { status: 401 });
  if (url.includes('rpc/photo_allowance')) { const [r] = await svc(`select photo_allowance($1) a`, [JSON.parse(o.body).uid]); return new Response(JSON.stringify(r.a)); }
  if (url.includes('rpc/sweep_orphan_photos')) { const [r] = await svc(`select sweep_orphan_photos() n`); return new Response(JSON.stringify(r.n)); }
  if (url.includes('r2.cloudflarestorage.com')) { const key = url.split('/b/')[1]; if (o.method === 'PUT') R2.set(key, Buffer.from(o.body)); else R2.delete(key); return new Response(''); }
  if (url.includes('/rest/v1/photos?on_conflict=id')) { const b = JSON.parse(o.body); const rows = await svc(`insert into photos(id, user_id, entry_id, key, bytes, thumb_bytes, width, height) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing returning id`, [b.id, b.user_id, b.entry_id, b.key, b.bytes, b.thumb_bytes, b.width, b.height]); return new Response(JSON.stringify(rows), { status: 201 }); }
  if (url.includes('/rest/v1/photos?select=user_id,key&id=eq.')) return new Response(JSON.stringify(await svc(`select user_id, key from photos where id = $1`, [url.split('id=eq.')[1]])));
  if (url.includes('photo_trash?select')) return new Response(JSON.stringify(await svc(`select key from photo_trash`)));
  if (url.includes('photo_trash?key=eq.')) { await svc(`delete from photo_trash where key = $1`, [decodeURIComponent(url.split('key=eq.')[1])]); return new Response(null, { status: 204 }); }
  return new Response('[]');
} };
const toReq = route => { const r = route.request(); return new Request(r.url(), { method: r.method(), headers: r.headers(), body: ['GET', 'HEAD'].includes(r.method()) ? undefined : r.postDataBuffer() }); };
const reply = async (route, res) => route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: Buffer.from(await res.arrayBuffer()) });
const net = async (route, u) => {
  if (u.pathname === '/functions/v1/weather') { await reply(route, await weatherFn(toReq(route), wxDeps)); return true; }
  if (u.pathname === '/functions/v1/photos') { await reply(route, await photosFn(toReq(route), phDeps)); return true; }
  if (u.hostname === 'photos.test') { const b = R2.get(u.pathname.slice(1)); await route.fulfill(b ? { body: b, contentType: u.pathname.endsWith('.jpg') ? 'image/jpeg' : 'image/webp' } : { status: 404, body: '' }); return true; }
  return false;
};
const config = `window.APP_CONFIG.PHOTOS_URL = 'https://photos.test';`;
const settle = p => p.waitForTimeout(1500).then(() => p.waitForFunction(() => window.__daytale.S.sync === 'synced' && ![...window.__daytale.S.entries.values()].some(e => e._dirty), null, { timeout: 8000 })).catch(() => {});

// ================= 날씨 + 캘린더 (휴대폰)
let p = await page({ width: 390, height: 844 }, { net, config });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p');
await p.waitForFunction(() => !!localStorage.getItem('daytale.wx'), null, { timeout: 8000 }).catch(() => {});
const wx = await p.evaluate(() => JSON.parse(localStorage.getItem('daytale.wx') || 'null'));
ok(wx?.kind === 'rain' && wx.temp === 16, '날씨 함수 → 서울 비 16°');
ok(wxCalls === 1, 'MET는 한 번만 부름 (그 뒤는 캐시)');
await p.waitForSelector('.wxcredit', { timeout: 5000 }).catch(() => {});
ok(!!(await p.$('.wxcredit')), '홈에 MET Norway 출처 표시');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); await shot(p, 'v1_20_home_weather');

await p.goto('http://app.test/#/calendar'); await p.waitForSelector('.weekstrip');
ok((await p.$$('.weekstrip .day')).length === 7, '주 보기: 7일 줄');
ok((await p.$$('.weekstrip .day.on .dots i')).length === 3, '오늘 점 3개 (일정·할 일·기록)');
ok(await p.$eval('.agenda', el => el.textContent.includes('치과 예약') && el.textContent.includes('오후 2시')), '오늘 일정 · 시간');
await p.waitForTimeout(300); await shot(p, 'v1_21_cal_week');
await p.click('[data-v=month]'); await p.waitForSelector('.mgrid');
ok((await p.$$('.mgrid .mc')).length === 35, '월 보기: 5주');
await p.click('.mc[data-day="2026-10-13"]');
ok(await p.$eval('.cal-main .agenda', el => el.textContent.includes('팀 회고') && el.textContent.includes('세금 신고')), '날짜 누르면 그날 목록');
ok((await p.$$('.mc[data-day="2026-10-13"] i u')).length === 2, '13일 점 2개 (일정·할 일)');
await p.waitForTimeout(300); await shot(p, 'v1_22_cal_month');
await p.click('[data-f=event]'); ok(!(await p.$eval('.cal-main .agenda', el => el.textContent.includes('세금 신고'))), '일정만 거르기');
await p.click('[data-f=all]');
await p.click('.cal-main .agenda [data-add]'); await p.waitForSelector('.ed-body');
ok(await p.evaluate(() => location.hash.includes('type=event') && document.querySelector('[data-m=date]')?.value === '2026-10-13'), '휴대폰 "이 날에 추가" → 그 날짜 일정 쓰기');

// ================= 사진
const pics = await p.evaluate(async () => {
  const out = [];
  for (const [a, b] of [['#F5A55B', '#3B5E8C'], ['#7FB27A', '#F2E3B3'], ['#C76B98', '#29233A']]) {
    const c = document.createElement('canvas'); c.width = 2400; c.height = 1800; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 2400, 1800); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, 2400, 1800);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; g.beginPath(); g.arc(Math.random() * 2400, Math.random() * 1800, Math.random() * 40, 0, 7); g.fill(); }
    out.push(c.toDataURL('image/jpeg', 0.92).split(',')[1]);
  }
  return out;
});
await p.goto('http://app.test/#/new'); await p.waitForSelector('.ed-body');
await p.click('.ed-title'); await p.keyboard.type('공원 산책'); await p.click('.ed-body'); await p.keyboard.type('단풍이 조금씩 들기 시작했어요.');
await p.setInputFiles('.ed-file', pics.map((b, i) => ({ name: `p${i}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from(b, 'base64') })));
await p.waitForSelector('.ed-photos .ph.cover img[src]');
await p.waitForFunction(() => { const e = [...window.__daytale.S.entries.values()].find(x => x.title === '공원 산책'); return e && e.photos.length === 3 && e.photos.every(x => x.key); }, null, { timeout: 15000 }).catch(() => {});
await settle(p);
const rows = await as(`select key, bytes, thumb_bytes, width from photos order by created_at`);
ok(rows.length === 3, '사진 3장 → 서버 목록');
ok(rows.every(r => r.bytes <= 220000 && r.thumb_bytes <= 32000 && r.width <= 1600), '본문 ≤220KB · 미리보기 ≤32KB · 긴 변 1600');
ok(R2.size === 6 && [...R2.keys()].every(k => k.startsWith(ANN + '/')), 'R2에 원본+미리보기 6개, 내 폴더에만');
console.log('     크기:', rows.map(r => Math.round(r.bytes / 1024) + 'KB/' + Math.round(r.thumb_bytes / 1024) + 'KB').join(', '));
const [pe] = await as(`select photos from entries where title = '공원 산책'`);
ok(pe?.photos.length === 3 && pe.photos.every(x => x.key && !x.pending), '기록에 사진 주소 저장');
await p.waitForTimeout(400); await shot(p, 'v1_23_editor_photos');
// 커버 바꾸기 · 빼기
const second = pe.photos[1].id;
await p.click(`.ed-photos [data-id="${second}"]`); await p.waitForSelector('.sheet.open'); await p.click('.sheet .pick button:has-text("커버로")'); await p.waitForTimeout(900);
await p.click(`.ed-photos [data-id="${pe.photos[2].id}"]`); await p.waitForSelector('.sheet.open'); await p.click('.sheet .pick button:has-text("사진 빼기")'); await p.waitForTimeout(900);
await p.click('[data-act=done]'); await settle(p);
const [pe2] = await as(`select photos from entries where title = '공원 산책'`);
ok(pe2?.photos.length === 2 && pe2.photos[0].id === second, '커버 바꾸기 · 사진 빼기');
// 하루 지난 뒤 정리 → 뺀 사진은 R2에서도 지워짐
await svc(`update photos set created_at = now() - interval '2 days'`);
const sw = await photosFn(new Request('https://f/photos?action=sweep', { method: 'POST', headers: { 'x-cron-secret': 'cron' } }), phDeps);
ok((await sw.json()).removed === 2 && R2.size === 4, '뺀 사진: 정리 작업이 R2에서 지움');
// 목록 미리보기
await p.goto('http://app.test/#/all'); await p.waitForSelector('.r .th img[src]');
ok(await p.$eval('.r .th', el => el.querySelector('b')?.textContent === '+1'), '목록: 미리보기 + 장수');
await p.waitForTimeout(300); await shot(p, 'v1_24_list_photo');

// ================= 백업
await p.goto('http://app.test/#/backup'); await p.waitForSelector('.bk-it');
let dl = p.waitForEvent('download'); await p.click('[data-x=json]'); let f = await dl;
const json = JSON.parse(readFileSync(await f.path(), 'utf8'));
ok(json.app === 'daytale' && json.entries.length === 15 && json.folders && json.prefs, 'JSON 백업: 기록 15개 · 폴더 · 설정');
ok(json.entries.find(e => e.title === '공원 산책')?.photo_urls.length === 2 && !('_dirty' in json.entries[0]), 'JSON: 사진 주소 포함, 내부 값 제외');
ok(/^daytale-2026-10-08\.json$/.test(f.suggestedFilename()), '파일 이름에 날짜');
dl = p.waitForEvent('download'); await p.click('[data-x=md]'); f = await dl;
const md = readFileSync(await f.path(), 'utf8');
ok(md.includes('## 공원 산책') && md.includes('단풍이 조금씩') && md.includes('![1](https://photos.test/'), '마크다운: 제목 · 본문 · 사진');
await p.click('[data-x=pdf]'); await p.waitForSelector('iframe.print-frame', { state: 'attached' });
ok(await p.$eval('iframe.print-frame', fr => fr.contentDocument.body.textContent.includes('공원 산책') && fr.contentDocument.querySelectorAll('article').length === 15), 'PDF: 인쇄용 문서 15개 기록');
await shot(p, 'v1_25_backup');
// 가져오기: 다른 곳에서 고친 기록(더 최근) + 새 기록
const ed = json.entries.find(e => e.title === '아침 산책'); ed.title = '아침 산책 (고침)'; ed.updated_at = '2026-10-08T09:00:00.000Z';
json.entries.push({ ...ed, id: '99999999-0000-4000-8000-000000000001', title: '가져온 기록', photos: [{ id: '99999999-0000-4000-8000-000000000002', key: 'someone-else/x.webp' }] });
const old = json.entries.find(e => e.title === '국숫집 점심'); old.title = '옛날 제목'; old.updated_at = '2020-01-01T00:00:00.000Z';
await p.setInputFiles('.bk-file', { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(json)) });
await p.waitForTimeout(500); await settle(p);
const titles = (await as(`select title, photos from entries`));
ok(titles.some(r => r.title === '아침 산책 (고침)') && titles.some(r => r.title === '가져온 기록'), '가져오기: 더 최근 것 · 새 것 반영');
ok(titles.some(r => r.title === '국숫집 점심') && !titles.some(r => r.title === '옛날 제목'), '가져오기: 오래된 것은 덮지 않음');
ok(titles.find(r => r.title === '가져온 기록')?.photos.length === 0, '가져오기: 남의 사진 주소는 버림');
await p.setInputFiles('.bk-file', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
await p.waitForSelector('.toast:has-text("읽을 수 없어요")', { timeout: 3000 }).then(() => ok(true, '이상한 파일 거절')).catch(() => ok(false, '이상한 파일 거절'));
await p.context().close();

// ================= PC 캘린더
p = await page({ width: 1440, height: 900 }, { net, config });
await p.goto('http://app.test/#/calendar'); await p.waitForSelector('.pcm .g .c'); await p.waitForSelector('.pcm .c[data-day="2026-10-13"] .more', { timeout: 5000 }).catch(() => {});
ok(await p.$eval('.pcm .c[data-day="2026-10-13"]', el => el.querySelectorAll('.chipx').length === 3 && !!el.querySelector('.more')), 'PC 월: 하루 3개까지 + "더"');
ok(await p.$eval('.pcm .c[data-day="2026-10-08"]', el => /기록 3/.test(el.textContent)), 'PC 월: 기록 수 (아침 산책 · 공원 산책 · 가져온 기록)');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400); await shot(p, 'v1_26_pc_cal_month');
await p.click('.pcm .c[data-day="2026-10-20"]'); await p.click('.pcm .c[data-day="2026-10-20"]');
await p.waitForSelector('.dlg input, dialog input', { timeout: 3000 }).catch(() => {});
await p.keyboard.type('가을 소풍'); await p.keyboard.press('Enter'); await p.waitForTimeout(600); await settle(p);
ok((await as(`select meta->>'date' d from entries where title = '가을 소풍' and type = 'event'`))[0]?.d === '2026-10-20', 'PC: 날짜 두 번 눌러 바로 일정 추가');
await p.click('[data-v=week]'); await p.waitForSelector('.pcw .col');
ok((await p.$$('.pcw .col')).length === 7, 'PC 주: 7칸');
await p.waitForTimeout(300); await shot(p, 'v1_27_pc_cal_week');
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
await shot(p, 'v1_28_pc_home_weather');
await finish();
