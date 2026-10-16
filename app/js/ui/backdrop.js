/* 배경 그라데이션 24종 (시간대마다 6종, 무작위, 최근 7번은 피함) + 필름 입자.
   설정 > 화면 > 배경에서 단색도 고를 수 있어요. 글자색은 배경마다 짝을 맞춰요. */
import { ls, slotOf } from '../core/utils.js';
import { S } from '../data/store.js';
import { useFont } from '../core/fonts.js';

// 이름, 어두운 모서리, 뜨거운 빛, 따뜻한 빛, 중간, 깊은 색
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
const dk = (c, f) => '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
const lighten = (c, f) => '#' + [1, 3, 5].map(i => { const v = parseInt(c.slice(i, i + 2), 16); return Math.round(v + (255 - v) * f).toString(16).padStart(2, '0'); }).join('');
function css(p, ang = 160) {
  const [, d, hot, warm, mid, deep] = p;
  return `radial-gradient(60% 30% at 0% 0%, ${d}99 0%, ${d}00 100%), linear-gradient(${ang}deg, ${d} 0%, ${dk(hot, .62)} 16%, ${dk(warm, .55)} 36%, ${dk(mid, .85)} 62%, ${deep} 86%, #16181C 100%)`;
}
/* PC처럼 가로로 넓은 화면: 기울이면 줄처럼 보여서 위→아래로, 위쪽 양 모서리에 빛 번짐 */
function cssWide(p) {
  const [, d, hot, warm, mid, deep] = p; const h = dk(hot, .62), w = dk(warm, .55);
  return `radial-gradient(90% 110% at 0% 0%, ${h}cc 0%, ${h}00 60%), radial-gradient(80% 95% at 100% 10%, ${w}b3 0%, ${w}00 60%), linear-gradient(180deg, ${h} 0%, ${w} 30%, ${dk(mid, .85)} 62%, ${deep} 86%, #16181C 100%)`;
}
/* 비·눈 오는 날은 차분한 팔레트 쪽으로 */
const CALM = new Set(['morning-mist', 'sea-morning', 'clear-sky', 'mint', 'lavender', 'deep-sea', 'moonlight', 'midnight-teal']);
function pick(slot = slotOf(), weather = null) {
  const list = PAL[slot];
  const recent = ls.get('daytale.bg', []);
  let pool = list.filter(p => !recent.includes(p[0]));
  if (!pool.length) pool = list;
  if (weather === 'rain' || weather === 'snow') { const calm = pool.filter(p => CALM.has(p[0])); if (calm.length) pool = calm; }
  return pool[Math.floor(Math.random() * pool.length)];
}
/* 단색: 이름 → [배경, 글자, 본문 진하기, 포인트, 밝은 배경]. 본문 대비 4.5:1 이상, 포인트 3:1 이상 (큰 글씨) */
const SOLID = {
  /* 밝음 */
  cream: ['#F3EADB', '#2A2018', .66, '#A8461F', 1], sage: ['#CFE2C4', '#1E2A20', .68, '#2E663C', 1], sky: ['#C9DDF4', '#13243A', .68, '#24559E', 1],
  /* 중간 톤: 배경이 진해서 본문을 조금 더 진하게 둬요 (강약은 굵기로) */
  mustard: ['#D9A441', '#2A1E08', .78, '#6A2408', 1], terracotta: ['#9A4530', '#FFF4EC', .82, '#FFE08A'], rose: ['#DE939C', '#2A1218', .76, '#5A1424', 1], teal: ['#256662', '#F0FFFC', .76, '#FFE08A'],
  /* 어두움 */
  forest: ['#173832', '#E8F3EE', .62, '#8FE0B8'], navy: ['#131B32', '#E6ECFF', .62, '#9DB8FF'], plum: ['#3A2240', '#F7E9F3', .62, '#FFAFCB'], charcoal: ['#1C1C1E', '#F2F0EC', .62, '#FFB37A'],
  /* 패턴: 그라데이션·단색과 섞지 않는 따로 된 배경. 여섯째 값 = 무늬 이름 (글꼴·글줄 선은 base.css :root[data-pat]) */
  pad: ['#FBEFA4', '#26303F', .7, '#C2412E', 1, 'pad'], padw: ['#FBFAF5', '#26303F', .7, '#C2412E', 1, 'padw'],
  grid: ['#F6F7F4', '#1C2533', .66, '#2C62B4', 1, 'grid'], gridd: ['#1D2228', '#ECEFF2', .62, '#F2C76A', 0, 'gridd']
};
/* 노란 줄노트: 스케치북 같은 종이결 (선은 글줄에 맞춰 이야기 글에 그어요) */
const paper = (r, g, b, a) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' seed='3' stitchTiles='stitch'/%3E%3CfeDiffuseLighting lighting-color='%23fff' surfaceScale='1.1'%3E%3CfeDistantLight azimuth='45' elevation='58'/%3E%3C/feDiffuseLighting%3E%3CfeColorMatrix values='0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  -1 0 0 0 ${a}'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)'/%3E%3C/svg%3E")`;
/* 줄노트 = 손글씨 + 글줄에 맞춘 선 (LINED). 모눈 = 픽셀 글꼴, 칸은 글자에 맞추지 않고 그냥 무늬예요 */
const GRID = (c, a, b) => `repeating-linear-gradient(0deg, rgba(${c},${b}) 0 1px, transparent 1px 120px), repeating-linear-gradient(90deg, rgba(${c},${b}) 0 1px, transparent 1px 120px), repeating-linear-gradient(0deg, rgba(${c},${a}) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(${c},${a}) 0 1px, transparent 1px 24px)`;
const PATTERN = { pad: `${paper(.38, .30, .10, .8)}, #FBEFA4`, padw: `${paper(.35, .33, .28, .45)}, #FBFAF5`,
  grid: `${GRID('60,110,190', .10, .22)}, #F6F7F4`, gridd: `${GRID('255,255,255', .05, .11)}, #1D2228` };
const LINED = new Set(['pad', 'padw']), PIXEL = new Set(['grid', 'gridd']);   /* 모눈 = 레트로 픽셀 글꼴(갈무리) */
const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)).join(',');
/* 그라데이션 글자: 배경의 따뜻한 빛 색을 아주 옅게 섞은 흰색 */
const inkOf = p => lighten(p[3], .86);
function paint(el, { bg, wide, ink, body, accent, theme, scrim, light = false }) {
  document.documentElement.classList.toggle('bg-light', light);
  el.style.setProperty('--bg-grad', bg);
  el.style.setProperty('--bg-grad-wide', wide || bg);
  // 문서 바탕(html)도 같은 배경을 알아야 화면 끝(아이폰 홈 막대 자리)이 다른 색으로 비치지 않아요
  if (el === document.body) ['--bg-grad', '--scrim'].forEach((k, i) => document.documentElement.style.setProperty(k, i ? scrim : bg));
  // 배경의 맨 아래 색: 쓰기 화면에서 아이폰 홈 막대 자리가 이 색으로 이어져요 (그라데이션을 다시 그리면 띠처럼 끊겨 보여서)
  const end = (String(bg).match(/#[0-9a-fA-F]{6}/g) || ['#16181C']).pop();
  document.documentElement.style.setProperty('--bg-end', end);
  if (el === document.body || el === document.documentElement) ls.set('daytale.paint', { bg, scrim, end });   // 다음에 열 때 로딩 화면부터 같은 배경으로 (js/early.js)
  el.style.setProperty('--accent', accent);
  el.style.setProperty('--ink', ink); el.style.setProperty('--ink-rgb', rgb(ink)); el.style.setProperty('--ink-body', body);
  el.style.setProperty('--scrim', scrim);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme);
}
let current = null;
function pattern(pat) {
  const r = document.documentElement;
  if (pat) r.dataset.pat = pat; else delete r.dataset.pat;
  if (LINED.has(pat)) { r.dataset.lined = ''; useFont('pad'); } else delete r.dataset.lined;
  if (PIXEL.has(pat)) { r.dataset.pixel = ''; useFont('grid'); } else delete r.dataset.pixel;
}
/* 하루 한 시간대 동안은 같은 배경을 유지해요 */
function apply(el = document.body, { weather = null } = {}) {
  const slot = slotOf(), sol = SOLID[S.prefs.bg];
  if (sol) {
    const [bg, ink, a, acc, light, pat] = sol; current = { name: S.prefs.bg, slot, accent: acc, solid: bg, light: !!light };
    pattern(pat);
    paint(el, { bg: pat ? PATTERN[pat] : bg, ink, body: a, accent: acc, theme: bg, scrim: 0, light: !!light });
    return current;
  }
  pattern(null);
  const key = new Date().toDateString() + slot;
  const saved = ls.get('daytale.bgNow', null);
  let p = saved?.key === key ? Object.values(PAL).flat().find(x => x[0] === saved.name) : null;
  if (!p) { p = pick(slot, weather); ls.set('daytale.bgNow', { key, name: p[0] }); ls.set('daytale.bg', [p[0], ...ls.get('daytale.bg', [])].slice(0, 7)); }
  current = { name: p[0], slot, accent: lighten(p[2], .6) };
  paint(el, { bg: css(p), wide: cssWide(p), ink: inkOf(p), body: .62, accent: current.accent, theme: p[1], scrim: .25 });
  return current;
}
const now = () => current;
/* 지금 배경의 색 단계 (이미지 카드 배경용) */
function stops() {
  if (current?.solid) { const c = current.solid; return [dk(c, .8), c, c, dk(c, .9), dk(c, .75)]; }
  const p = Object.values(PAL).flat().find(x => x[0] === current?.name) || PAL.evening[0];
  const [, d, hot, warm, mid, deep] = p; return [d, dk(hot, .62), dk(warm, .55), dk(mid, .85), deep];
}

export { PAL, SOLID, PATTERN, apply, css, cssWide, now, stops };
