// 홈 바탕 무드: 예전 앱 배경 24가지(아침 · 낮 · 저녁 · 밤 × 6)를 화면 전체에 깔고, 빛 덩어리가 천천히 떠다녀요.
// 시간대마다 6가지 중 하나 (최근 7번은 피해요). 비 · 눈 오는 날은 차분한 쪽에서 고르고, 흐림 · 비는 채도를 낮춰요.
// MOOD = false 로 두면 예전 방식(가운데 카드 색만 은은하게 번짐, abc7e96)으로 돌아가요. 출시 전에 톤 다시 보기
import * as S from './store.js';
import { guessCity, cityLookup } from '../../js/data/cities.js';

export const MOOD = true;

// 이름, 어두운 모서리, 뜨거운 빛, 따뜻한 빛, 중간, 깊은 색 (app/js/ui/backdrop.js 와 같은 값)
const PAL = {
  morning: [['dawn-peach', '#3A1A2A', '#F06A5A', '#FFB27A', '#3E6A7A', '#1D3442'], ['morning-mist', '#1E2A3A', '#7FA6E0', '#F3D3A8', '#4E7A8A', '#1F3540'],
    ['lemon', '#2A2414', '#EAA83A', '#FFE08A', '#4F8268', '#1C3A30'], ['pink-dawn', '#2E1630', '#E86AA0', '#FFB59A', '#55559A', '#1F2445'],
    ['sea-morning', '#10283A', '#3FA0D8', '#A8E6D8', '#2E6A70', '#133236'], ['apricot', '#33180F', '#EE7A4A', '#FFC48A', '#5E6A60', '#232A2A']],
  day: [['teal-afternoon', '#2A1418', '#E0402A', '#F08A3E', '#2F5E5A', '#173638'], ['clear-sky', '#142438', '#4A8EF0', '#A6D6FF', '#2F5C88', '#18283E'],
    ['green-leaf', '#142818', '#5DBE6A', '#D8E87A', '#2E6A50', '#15302A'], ['mint', '#0F2A2A', '#3ED0B0', '#C2F2D8', '#2A6670', '#142E36'],
    ['sand', '#2E2214', '#D9A050', '#F5D8A0', '#5E5A50', '#2A2620'], ['coral-blue', '#2A1620', '#F05A6A', '#FFA080', '#3A5A9A', '#1A2445']],
  evening: [['sunset', '#2E1210', '#E8452A', '#FF9A3A', '#6A2E5A', '#24163A'], ['plum', '#2A1028', '#C83A7A', '#F08AA0', '#4A2E7A', '#1C1838'],
    ['pumpkin', '#2E1A0A', '#E86A1A', '#FFB040', '#7A3A2A', '#2A1A1E'], ['lavender', '#1E1630', '#9A6AF0', '#F0A0C8', '#3E3A8A', '#1A1A3A'],
    ['rose-gold', '#2E1418', '#D8506A', '#F0C090', '#5A3A50', '#221A24'], ['red-sea', '#2A1010', '#F0503A', '#F09060', '#1E5A6A', '#12303A']],
  night: [['deep-sea', '#0A1428', '#2A5AD0', '#5AA0F0', '#1A3A6A', '#0E1A30'], ['aurora', '#0A1E20', '#2AD08A', '#7AE0F0', '#3A2A7A', '#141432'],
    ['violet-night', '#160E2A', '#6A3AE0', '#B07AF0', '#2A2A6A', '#12122A'], ['midnight-teal', '#0A1A1E', '#1A8A8A', '#5AC0B0', '#1A3A50', '#0E1A24'],
    ['moonlight', '#12141E', '#6A7AB0', '#C8D0E8', '#3A4460', '#161A26'], ['ember', '#1A0E0A', '#C0401A', '#E8803A', '#3A2A3A', '#14121A']]
};
const CALM = new Set(['morning-mist', 'sea-morning', 'clear-sky', 'mint', 'lavender', 'deep-sea', 'moonlight', 'midnight-teal']);
const slotOf = h => h >= 5 && h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
const dk = (c, f) => '#' + [1, 3, 5].map(i => Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * f)).toString(16).padStart(2, '0')).join('');

// 날씨: 예전 앱이 같은 곳에 남긴 값(3시간 안)을 먼저 쓰고, 없으면 서버 날씨 함수(MET Norway)에 물어봐요. 위치 권한은 안 써요
const WX = 'daytale.wx';
function cachedWx() {
  try { const w = JSON.parse(localStorage.getItem(WX) || 'null'); return w && Date.now() - w.at < 3 * 3600e3 ? w.kind : null; } catch { return null; }
}
let asking = null;
export function weather() {
  const k = cachedWx(); if (k) return Promise.resolve(k);
  const cfg = window.APP_CONFIG; if (!cfg?.SUPABASE_URL || !navigator.onLine) return Promise.resolve(null);
  return asking ||= (async () => {
    try {
      const c = cityLookup(guessCity()); if (!c) return null;
      const r = await fetch(`${cfg.SUPABASE_URL}/functions/v1/weather?lat=${c.lat}&lon=${c.lon}`, { headers: { apikey: cfg.SUPABASE_ANON_KEY, authorization: 'Bearer ' + cfg.SUPABASE_ANON_KEY } });
      if (!r.ok) return null;
      const j = await r.json();
      try { localStorage.setItem(WX, JSON.stringify({ kind: j.kind, icon: j.night && j.kind === 'sun' ? 'moon' : j.kind, temp: j.temp, wind: j.wind ?? null, max: j.max, min: j.min, cityId: c.id, at: Date.now() })); } catch {}
      return j.kind;
    } catch { return null; }
  })();
}
const wet = k => k === 'rain' || k === 'snow' || k === 'thunder';

// 오늘 이 시간대의 무드: 한 번 고르면 시간대가 바뀔 때까지 그대로
export function pick(now = new Date(), wx = cachedWx()) {
  const slot = slotOf(now.getHours()), key = S.today() + ':' + slot, keep = S.pref('mood');
  if (keep?.key === key) { const p = PAL[slot].find(x => x[0] === keep.name); if (p) return p; }
  const recent = S.pref('moods', []);
  let pool = PAL[slot].filter(p => !recent.includes(p[0])); if (!pool.length) pool = PAL[slot];
  if (wet(wx)) { const calm = pool.filter(p => CALM.has(p[0])); if (calm.length) pool = calm; }
  const p = pool[Math.floor(Math.random() * pool.length)];
  S.setPref('mood', { key, name: p[0] }); S.setPref('moods', [p[0], ...recent].slice(0, 7));
  return p;
}

// 바탕 + 빛 덩어리 셋 + 날씨 톤. 가운데 카드 번짐(.amb i)은 main.js 가 그대로 맡아요
export function paint(amb) {
  if (!MOOD) { amb.classList.add('old'); return () => {}; }
  const draw = () => {
    const [, d, hot, warm, mid, deep] = pick();
    amb.style.setProperty('--mo', `linear-gradient(165deg, ${d} 0%, ${dk(hot, .78)} 18%, ${dk(warm, .68)} 40%, ${dk(mid, .9)} 66%, ${deep} 88%, #16181C 100%)`);
    document.documentElement.style.backgroundColor = d;   // 아이폰 시계 줄도 바탕 위쪽 색으로
    amb.style.setProperty('--b1', dk(warm, .8)); amb.style.setProperty('--b2', dk(hot, .7)); amb.style.setProperty('--b3', mid);
  };
  const tone = k => { amb.dataset.wx = !k ? '' : wet(k) && k !== 'snow' || k === 'cloud' || k === 'fog' ? 'grey' : k === 'snow' ? 'snow' : ''; };
  draw(); tone(cachedWx());
  weather().then(tone);   // 날씨가 늦게 와도 톤만 천천히 바뀌어요 (색은 그대로)
  const t = setInterval(draw, 60e3);   // 시간대가 바뀌면 새 무드로
  return () => { clearInterval(t); document.documentElement.style.backgroundColor = ''; };
}
