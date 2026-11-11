// 홈 · 템플릿 · 책장 · 프로필 · 검색 바탕 무드 (설정 › 바탕에서 그라데이션 · 솔리드 · 다크). 그라데이션은 빛 덩어리가 천천히 떠다녀요. 흐림 · 비는 채도를 낮춰요.
// MOOD = false 로 두면 예전 방식(가운데 카드 색만 은은하게 번짐, abc7e96)으로 돌아가요. 출시 전에 톤 다시 보기
import * as S from './store.js';
import { FREE } from './bg.js';
import { guessCity, cityLookup } from '../../js/data/cities.js';

export const MOOD = true;


// 날씨: 예전 앱이 같은 곳에 남긴 값(3시간 안)을 먼저 쓰고, 없으면 서버 날씨 함수(MET Norway)에 물어봐요. 위치 권한은 안 써요
const WX = 'daytale.wx';
function lastWx() { try { return JSON.parse(localStorage.getItem(WX) || 'null')?.kind || null; } catch { return null; } }   // 오래됐어도 마지막 날씨
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
// 11-05 앤드류: 바탕 목록 = 쓰기 컬러와 똑같이 (그라데이션 24 · 솔리드 11, 이름도 같게). 밝은 색은 밝기에 맞춰 눌러서 흰 글 · 버튼이 읽히게
// PAGE_G = [이름, 진한 색, 가운데 색, 밝은 색, 쓰기 칩 css], PAGE_S = [이름, 바탕 색, 쓰기 칩 색]
const lum = h => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; const [r, g, b] = [1, 3, 5].map(i => f(parseInt(h.slice(i, i + 2), 16))); return .2126 * r + .7152 * g + .0722 * b; };
const tame = (h, max) => { if (lum(h) <= max) return h; let lo = 0, hi = 1; for (let i = 0; i < 14; i++) { const f = (lo + hi) / 2; lum(mix(h, f)) > max ? hi = f : lo = f; } return mix(h, lo); };
const hexes = css => (css.match(/#[0-9a-f]{6}/gi) || []).map(x => x.toUpperCase());
// 11-05 58: 밝은 색(파스텔 그라데이션 · 크림 · 연두 · 하늘 · 겨자 · 장미)은 원래 색 그대로 두고, 그 위 글 · 버튼을 검정으로 (lite). 마지막 칸 = lite
const LITE = .3;
const mixc = (a, b) => '#' + [1, 3, 5].map(i => Math.round((parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2).toString(16).padStart(2, '0')).join('');
export const PAGE_G = FREE.filter(b => b.kind === 'g').map(b => { const raw = hexes(b.css), cs = raw.slice().sort((x, y) => lum(x) - lum(y)), d = cs[0], l = cs[cs.length - 1], md = cs[Math.floor(cs.length / 2)] === l && cs.length > 1 ? cs[cs.length - 2] : cs[Math.floor(cs.length / 2)];
  if (raw.every(h => lum(h) > LITE)) return [b.name, raw[0], mixc(raw[0], raw[raw.length - 1]), raw[raw.length - 1], b.css, true];   // 위 → 아래 원래 순서 그대로
  return [b.name, tame(d, .05), tame(md, .28), tame(l, .5), b.css, false]; });
export const PAGE_S = FREE.filter(b => b.kind === 's').map(b => lum(b.css) > LITE ? [b.name, b.css, b.css, true] : [b.name, tame(b.css, .1), b.css, false]);
export const isLite = () => { const { m, x } = pick(); return m !== 'd' && !!x[x.length - 1]; };
const DARK = '#141416';
const lift = (c, f) => '#' + [1, 3, 5].map(i => { const v = parseInt(c.slice(i, i + 2), 16); return Math.round(v + (255 - v) * f).toString(16).padStart(2, '0'); }).join('');
let chosen = null;
export function pick() {
  const m = mode(); if (chosen?.m === m) return chosen;
  const list = m === 'g' ? PAGE_G : m === 's' ? PAGE_S : [['다크', DARK]];
  const fix = (S.pref('bgPick', {}) || {})[m], hit = fix && list.find(x => x[0] === fix);   // 설정에서 하나를 골랐으면 늘 그것 (11-04)
  if (hit) return chosen = { m, x: hit };
  const recent = S.pref('moods', []), pool = list.filter(x => !recent.includes(x[0])), x = (pool.length ? pool : list)[Math.floor(Math.random() * (pool.length || list.length))];
  if (list.length > 1) S.setPref('moods', [x[0], ...recent].slice(0, 3));
  return chosen = { m, x };
}
export function paint(amb) {
  if (!MOOD) { amb.classList.add('old'); return () => {}; }
  const { m, x } = pick(), top = m === 'g' ? x[1] : x[1], lt = m !== 'd' && !!x[x.length - 1];
  amb.classList.toggle('flat', m !== 'g');
  document.documentElement.classList.toggle('lite', lt);
  if (m === 'g' && lt) {   // 밝은 그라데이션: 누르지 않고 원래 색으로, 빛 덩어리도 같은 집안의 밝은 색
    const [, a, mid, b] = x;
    amb.style.setProperty('--mo', `linear-gradient(170deg, ${a} 0%, ${mid} 55%, ${b} 100%)`);
    amb.style.setProperty('--b1', lift(a, .35)); amb.style.setProperty('--b2', lift(mid, .3)); amb.style.setProperty('--b3', lift(b, .35));
  } else if (m === 'g') {
    const [, deep, mid, light] = x;
    amb.style.setProperty('--mo', `linear-gradient(180deg, ${deep} 0%, ${deep} 16%, ${mix(mid, .72)} 58%, ${mix(light, .62)} 100%)`);
    amb.style.setProperty('--b1', mix(mid, .55)); amb.style.setProperty('--b2', deep); amb.style.setProperty('--b3', mix(light, .5));
  } else amb.style.setProperty('--mo', x[1]);
  document.documentElement.style.backgroundColor = top;   // 아이폰 시계 줄도 바탕 위쪽 색으로
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', top);   // 11-11: 아이폰 위 가장자리 색도 같은 색
  document.documentElement.style.setProperty('--navbg', navBg(m, x, lt));   // 하단 메뉴도 바탕 색을 따라가요
  { const base = m === 'g' ? x[2] : m === 's' ? x[1] : '#2a2a30', r = document.documentElement.style;   // 프로필 숫자 칸 · 그래프 박스 (11-04): 바탕 색 집안의 솔리드
    if (lt) { r.setProperty('--mtile', rgba(lift(base, .45), 1)); r.setProperty('--mbox', rgba(lift(base, .5), .6)); }
    else { r.setProperty('--mtile', rgba(mix(base, .5), 1)); r.setProperty('--mbox', rgba(mix(base, .38), .72)); } }
  const tone = k => { amb.dataset.wx = m !== 'g' || !k ? '' : wet(k) && k !== 'snow' || k === 'cloud' || k === 'fog' ? 'grey' : k === 'snow' ? 'snow' : ''; };
  // 마지막 날씨로 바로 시작 (전환 없이) → 새 날씨가 다를 때만 천천히 바뀌어요
  amb.classList.add('now'); tone(cachedWx() || lastWx()); requestAnimationFrame(() => requestAnimationFrame(() => amb.classList.remove('now')));
  weather().then(k => { if (k) tone(k); });
  return () => { document.documentElement.style.backgroundColor = ''; document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#141416'); document.documentElement.classList.remove('lite'); };
}
// 설정에서 바꾸면 다음 화면부터 새로 골라요
export function reset() { chosen = null; }

// 달력 · 책장 위 판: 지금 바탕과 같은 색으로 한 장
export function panelCss() {
  const { m, x } = pick(), lt = m !== 'd' && !!x[x.length - 1];
  if (lt) { const a = m === 'g' ? x[1] : x[1], b = m === 'g' ? x[3] : x[1]; return `linear-gradient(160deg, rgba(255,255,255,.42), rgba(255,255,255,.22)), linear-gradient(160deg, ${a}, ${b})`; }   // 밝은 바탕: 같은 색 한 단계 더 밝게
  if (m === 'g') { const [, deep, mid, light] = x; return `radial-gradient(120% 90% at 85% 0%, ${mix(mid, .7)} 0%, transparent 60%), radial-gradient(90% 80% at 10% 100%, ${mix(light, .45)} 0%, transparent 60%), linear-gradient(160deg, ${deep}, ${mix(mid, .6)})`; }
  if (m === 's') { const l = lift(x[1], .2); return `linear-gradient(160deg, rgba(255,255,255,.06), rgba(0,0,0,.08)), linear-gradient(${l}, ${l})`; }   // 솔리드 = 같은 색 한 단계 밝게 (흰색 20%)
  return 'linear-gradient(#2B2B2F, #2B2B2F)';   // 다크 = 바탕보다 밝은 회색
}

// 하단 메뉴 바탕 (11-04): 그라데이션은 화면 아래쪽 색들로 같은 그라데이션 (조금 어둡게 · 반투명), 솔리드는 그 색 하나, 다크는 지금처럼
const rgba = (h, a) => `rgba(${[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',')},${a})`;
function navBg(m, x, lt) {
  if (lt) return m === 'g' ? `linear-gradient(100deg, ${rgba(lift(x[2], .4), .7)}, ${rgba(lift(x[3], .4), .7)})` : rgba(lift(x[1], .4), .7);
  if (m === 'g') { const [, , mid, light] = x; return `linear-gradient(100deg, ${rgba(mix(mid, .5), .62)}, ${rgba(mix(light, .42), .62)})`; }
  if (m === 's') return rgba(mix(x[1], .6), .62);
  return 'rgba(18,18,20,.5)';
}
