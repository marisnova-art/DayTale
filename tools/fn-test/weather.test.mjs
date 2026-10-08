// 날씨 함수 검사 (가짜 MET 응답, 가짜 캐시).  node --experimental-strip-types weather.test.mjs
import { handle, kindOf } from '../../supabase/functions/weather/index.ts';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const NOW = Date.parse('2026-10-08T00:10:00Z');
const met = { properties: { timeseries: [0, 1, 2, 3].map(h => ({ time: new Date(NOW - 600e3 + h * 3600e3).toISOString(), data: { instant: { details: { air_temperature: 17.6 + h } }, next_1_hours: { summary: { symbol_code: h === 0 ? 'partlycloudy_day' : 'rain' } } } })) } };
const cache = new Map(); const calls = [];
const fetchFake = async (url, opt = {}) => {
  calls.push(url);
  if (url.includes('api.met.no')) { ok(/Daytale\/1\.0 me@x\.com/.test(opt.headers['user-agent']), 'MET 규칙: 연락처 User-Agent'); return new Response(JSON.stringify(met), { headers: { expires: new Date(NOW + 1800e3).toUTCString() } }); }
  if (url.includes('weather_cache?cell=')) { const cell = decodeURIComponent(url.split('cell=eq.')[1].split('&')[0]); const v = cache.get(cell); return new Response(JSON.stringify(v ? [v] : [])); }
  if (opt.method === 'POST') { const b = JSON.parse(opt.body); cache.set(b.cell, b); return new Response('', { status: 201 }); }
  return new Response('[]');
};
const deps = { fetch: fetchFake, env: k => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', WEATHER_CONTACT: 'me@x.com' })[k], now: () => NOW };
let r = await handle(new Request('https://f/weather?lat=37.5665&lon=126.978'), deps); let j = await r.json();
ok(r.status === 200 && j.kind === 'suncloud' && j.temp === 18 && j.max === 21, '첫 요청: MET에서 받아 정리');
await new Promise(s => setTimeout(s, 10));
ok(cache.has('37.6,127.0'), '0.1도 칸으로 캐시');
const n = calls.filter(c => c.includes('api.met.no')).length;
r = await handle(new Request('https://f/weather?lat=37.58&lon=126.99'), deps); j = await r.json();
ok(calls.filter(c => c.includes('api.met.no')).length === n && j.kind === 'suncloud', '같은 칸 두 번째 요청은 캐시에서');
r = await handle(new Request('https://f/weather?lat=999&lon=1'), deps); ok(r.status === 400, '잘못된 위치 거절');
ok(kindOf('heavyrainandthunder') === 'thunder' && kindOf('lightsnowshowers_night') === 'snow' && kindOf('fog') === 'fog' && kindOf('clearsky_night') === 'sun' && kindOf('cloudy') === 'cloud', '날씨 기호 → 종류');
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
