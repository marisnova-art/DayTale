/* 쓰기 글꼴: 기본 · 명조 · 손글씨. 명조·손글씨는 그 글꼴을 고른 기록을 열 때만 불러와요 (글자 조각도 필요한 것만) */
const FONTS = ['base', 'serif', 'hand'];
const loaded = new Set();
const fontOf = e => FONTS.includes(e?.meta?.font) ? e.meta.font : 'base';
function useFont(k) {
  if (k === 'base' || !FONTS.includes(k) || loaded.has(k)) return;
  loaded.add(k);
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `./fonts/${k}.css`; document.head.append(l);
}
export { FONTS, fontOf, useFont };
