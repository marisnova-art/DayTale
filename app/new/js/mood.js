// 홈 · 템플릿 · 책장 · 프로필 · 검색 바탕 무드 (설정 › 바탕에서 그라데이션 · 솔리드 · 다크). 그라데이션은 빛 덩어리가 천천히 떠다녀요. 흐림 · 비는 채도를 낮춰요.
// MOOD = false 로 두면 예전 방식(가운데 카드 색만 은은하게 번짐, abc7e96)으로 돌아가요. 출시 전에 톤 다시 보기
import * as S from './store.js';
import { guessCity, cityLookup } from '../../js/data/cities.js';

export const MOOD = true;


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

// 10-31 바탕 고르기 (설정 › 바탕): 그라데이션(기본) · 솔리드 · 다크. 앱을 열 때마다 8개 중 하나 (최근 3번은 피해요)
// 그라데이션 = 쓰기 화면 컬러칩에서 흰 글씨가 잘 읽히는 8개를 뒤집어 (위 진하게 → 아래 밝게, 밝은 끝은 눌러서)
// 솔리드 = 쓰기 화면 단색 칩 중 밝은 3색(크림 · 연두 · 하늘)을 뺀 8색 (겨자 · 장미는 바탕에선 눌러서)
export const MODES = [['g', '그라데이션'], ['s', '솔리드'], ['d', '다크']];
export const mode = () => S.pref('bgMode', 'g');
const mix = (c, f) => '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
// [이름, 진한 색, 가운데 색, 밝은 색]
export const PAGE_G = [['노을 하늘', '#5A1424', '#E5484D', '#FFB3A7'], ['귤빛 저녁', '#5C2410', '#F27A2E', '#FFD39B'], ['풀빛 아침', '#1F4A1C', '#7DBB42', '#E9F5A8'],
  ['호수', '#0B3B3C', '#1FA39A', '#B5F0E4'], ['깊은 바다', '#0E1F55', '#2F6BE0', '#A9D2FF'], ['보랏빛 밤', '#26124F', '#7B4BD6', '#D9C2FF'],
  ['장미 빛', '#3B0E2A', '#F0607A', '#FFC9A8'], ['새벽 빛', '#0B1236', '#4D7CF0', '#FFD6E8']];
export const PAGE_S = [['겨자', mix('#D9A441', .5)], ['벽돌', '#9A4530'], ['장미', mix('#DE939C', .5)], ['청록', '#256662'], ['숲', '#173832'], ['밤하늘', '#131B32'], ['자두', '#3A2240'], ['먹색', '#1C1C1E']];
const DARK = '#141416';
let chosen = null;
export function pick() {
  const m = mode(); if (chosen?.m === m) return chosen;
  const list = m === 'g' ? PAGE_G : m === 's' ? PAGE_S : [['다크', DARK]];
  const recent = S.pref('moods', []), pool = list.filter(x => !recent.includes(x[0])), x = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))];
  if (list.length > 1) S.setPref('moods', [x[0], ...recent].slice(0, 3));
  return chosen = { m, x };
}
export function paint(amb) {
  if (!MOOD) { amb.classList.add('old'); return () => {}; }
  const { m, x } = pick(), top = m === 'g' ? x[1] : x[1];
  amb.classList.toggle('flat', m !== 'g');
  if (m === 'g') {
    const [, deep, mid, light] = x;
    amb.style.setProperty('--mo', `linear-gradient(180deg, ${deep} 0%, ${deep} 16%, ${mix(mid, .72)} 58%, ${mix(light, .62)} 100%)`);
    amb.style.setProperty('--b1', mix(mid, .55)); amb.style.setProperty('--b2', deep); amb.style.setProperty('--b3', mix(light, .5));
  } else amb.style.setProperty('--mo', x[1]);
  document.documentElement.style.backgroundColor = top;   // 아이폰 시계 줄도 바탕 위쪽 색으로
  const tone = k => { amb.dataset.wx = m !== 'g' || !k ? '' : wet(k) && k !== 'snow' || k === 'cloud' || k === 'fog' ? 'grey' : k === 'snow' ? 'snow' : ''; };
  tone(cachedWx()); weather().then(tone);
  return () => { document.documentElement.style.backgroundColor = ''; };
}
// 설정에서 바꾸면 다음 화면부터 새로 골라요
export function reset() { chosen = null; }

// 달력 · 책장 위 판: 지금 바탕과 같은 색으로 한 장
export function panelCss() {
  const { m, x } = pick();
  if (m === 'g') { const [, deep, mid, light] = x; return `radial-gradient(120% 90% at 85% 0%, ${mix(mid, .7)} 0%, transparent 60%), radial-gradient(90% 80% at 10% 100%, ${mix(light, .45)} 0%, transparent 60%), linear-gradient(160deg, ${deep}, ${mix(mid, .6)})`; }
  if (m === 's') return `linear-gradient(160deg, rgba(255,255,255,.08), rgba(0,0,0,.12)), linear-gradient(${x[1]}, ${x[1]})`;
  return 'linear-gradient(#1E1E21, #1E1E21)';
}
