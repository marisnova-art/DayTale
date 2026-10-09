/* 배경 그라데이션 24종 (시간대마다 6종, 무작위, 최근 7번은 피함) + 필름 입자 */
import { ls, slotOf } from '../core/utils.js';

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
let current = null;
/* 하루 한 시간대 동안은 같은 배경을 유지해요 */
function apply(el = document.body, { weather = null } = {}) {
  const slot = slotOf(), key = new Date().toDateString() + slot;
  const saved = ls.get('daytale.bgNow', null);
  let p = saved?.key === key ? Object.values(PAL).flat().find(x => x[0] === saved.name) : null;
  if (!p) { p = pick(slot, weather); ls.set('daytale.bgNow', { key, name: p[0] }); ls.set('daytale.bg', [p[0], ...ls.get('daytale.bg', [])].slice(0, 7)); }
  current = { name: p[0], slot, accent: lighten(p[2], .6) };
  el.style.setProperty('--bg-grad', css(p));
  el.style.setProperty('--bg-grad-wide', cssWide(p));
  el.style.setProperty('--accent', current.accent);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', p[1]);
  return current;
}
const now = () => current;
/* 지금 배경의 색 단계 (이미지 카드 배경용) */
function stops() {
  const p = Object.values(PAL).flat().find(x => x[0] === current?.name) || PAL.evening[0];
  const [, d, hot, warm, mid, deep] = p; return [d, dk(hot, .62), dk(warm, .55), dk(mid, .85), deep];
}

export { PAL, apply, css, cssWide, now, stops };
