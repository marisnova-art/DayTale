// 디자인 템플릿 색 조합 (11-25 91차, 앤드류 시안 v2): 멤피스 · 하이라이트 · 그라데이션 필 · 서클 인덱스가 같이 써요.
// 조합 = [이름, 배경, 글자, 강조1, 강조2, 표시 4색(형광펜 · 동그라미 · 알약), 박스]. 조합마다 서로 잘 보이게 맞춰 뒀어요.
// 카드의 pal: 없으면 셔플(seed)마다 조합이 바뀌어요 · 숫자 = 고른 칩(색은 그대로, 셔플은 표시만) · '#hex' = 직접 색(배경은 그 색, 나머지는 가장 가까운 조합)
import { rng } from './formats.js';

export const COMBOS = [
  ['크림', '#F4EFE4', '#1E1B18', '#6C4BD8', '#F2622E', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#8CD2FF'], '#1E1B18'],
  ['연하늘', '#E3EDF7', '#13243A', '#2B59E0', '#E2463C', ['#FFE34F', '#FFBFA3', '#C6A6FF', '#7CE3C2'], '#13243A'],
  ['코발트', '#2340C8', '#FFFFFF', '#FFE34F', '#FF9CC2', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#FFAE5E'], '#FFFFFF'],
  ['버건디', '#6A1E2C', '#F8DCE2', '#FFB4A0', '#FFD36A', ['#FFD36A', '#FF9CC2', '#FFB4A0', '#C6A6FF'], '#F8DCE2'],
  ['올리브', '#545A26', '#F4ECCF', '#FFD36A', '#FF9C7A', ['#FFE34F', '#FFBFA3', '#C3EF62', '#F4ECCF'], '#F4ECCF'],
  ['먹색', '#161616', '#F2F0EC', '#C6A6FF', '#7CE3C2', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#8CD2FF'], '#F2F0EC'],
  ['라벤더', '#CDBDF2', '#22164A', '#E2463C', '#2B59E0', ['#FFE34F', '#FFFFFF', '#FF9CC2', '#7CE3C2'], '#22164A'],
  ['귤빛', '#F26A2E', '#1A0E08', '#FFFFFF', '#2B1A6E', ['#FFE34F', '#FFFFFF', '#FFC6A8', '#8CD2FF'], '#1A0E08'],
  ['숲', '#1E4934', '#E9F3E0', '#FFD36A', '#FF9CC2', ['#FFE34F', '#C3EF62', '#FFBFA3', '#8CD2FF'], '#E9F3E0'],
  ['분홍', '#F6B8CA', '#3A0F1E', '#2B59E0', '#E2463C', ['#FFE34F', '#FFFFFF', '#7CE3C2', '#C6A6FF'], '#3A0F1E'],
  ['머스터드', '#E2B23C', '#22180A', '#6A1E2C', '#2340C8', ['#FFFFFF', '#FF9CC2', '#7CE3C2', '#F26A2E'], '#22180A'],
  ['남색', '#14204A', '#E6ECFF', '#FFE34F', '#7CE3C2', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#FFAE5E'], '#E6ECFF'],
  ['연회색', '#E6E6E3', '#1E1B18', '#6C4BD8', '#F2622E', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#8CD2FF'], '#1E1B18'],
  ['진회색', '#48484B', '#FFFFFF', '#FFE34F', '#7CE3C2', ['#FFE34F', '#FF9CC2', '#7CE3C2', '#FFAE5E'], '#FFFFFF'],
  ['빨강', '#F2120C', '#FFFFFF', '#FFE34F', '#111111', ['#FFE34F', '#FFFFFF', '#FFC6A8', '#8CD2FF'], '#FFFFFF'],   // 94차 (라벨 콜라주 레퍼런스)
];
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const lumOf = h => { const [r, g, b] = hx(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
export const contrast = (a, b) => { const [x, y] = [lumOf(a), lumOf(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
export const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
// 직접 색과 가장 가까운 조합 (사람 눈에 맞게 초록 · 파랑 쪽을 더 무겁게)
export function nearest(hex) {
  const a = hx(hex); let bi = 0, bd = Infinity;
  COMBOS.forEach((c, i) => { const b = hx(c[1]), d = (a[0] - b[0]) ** 2 * 2 + (a[1] - b[1]) ** 2 * 4 + (a[2] - b[2]) ** 2 * 3; if (d < bd) { bd = d; bi = i; } });
  return bi;
}
const DK = '#1E1B18', WH = '#FFFFFF';
const best = (bg, list) => list.reduce((p, c) => contrast(bg, c) > contrast(bg, p) ? c : p);
// 카드 → 색 묶음 { i, name, bg, ink, a1, a2, hl[4], box, dark, auto }
export function comboOf(c) {
  const p = c?.pal;
  if (Number.isInteger(p) && COMBOS[p]) return make(p, COMBOS[p][1]);
  if (isHex(p)) return make(nearest(p), p.toUpperCase());
  const i = Math.floor(rng(((c?.seed || 1) ^ 0x7a3c19) >>> 0)() * COMBOS.length);
  return { ...make(i, COMBOS[i][1]), auto: true };
}
function make(i, bg) {
  const [name, b0, ink0, a1, a2, hl, box0] = COMBOS[i];
  let ink = ink0;
  if (bg !== b0 && contrast(bg, ink) < 4.5) ink = contrast(bg, WH) >= contrast(bg, DK) ? WH : DK;   // 직접 색인데 글이 잘 안 보이면 글자만 흰색 · 검정
  const fix = x => contrast(bg, x) >= 1.9 ? x : ink;   // 강조색(글자 · 선)이 배경에 묻히면 글자색으로. 표시 4색은 칠하는 색이라 그대로
  return { i, name, bg, ink, a1: fix(a1), a2: fix(a2), hl: hl.slice(), box: box0 === ink0 ? ink : box0, dark: lumOf(bg) < .3 };
}
// 카드 요소에 색을 입혀요 (틀마다 CSS가 이 값들을 써요)
export function paintCombo(el, P) {
  const s = el.style;
  s.setProperty('--paper', P.bg); s.setProperty('--ink', P.ink); s.setProperty('--a1', P.a1); s.setProperty('--a2', P.a2);
  P.hl.forEach((h, j) => s.setProperty('--h' + (j + 1), h));
  s.setProperty('--box', P.box); s.setProperty('--boxt', P.bg);
  el.classList.toggle('dk', P.dark);
}
// 표시 위 글자색: 밝은 색 위엔 짙게, 어두운 색 위엔 희게
export const textOn = bg => contrast(bg, DK) >= contrast(bg, WH) ? DK : WH;
// 색 하나를 배경에서 잘 보이는 색으로 (멤피스 그림처럼 정해진 색을 쓸 때): 잘 보이면 그대로, 아니면 조합에서 잘 보이는 색
export function visibleOn(P, x, k = 0) {
  if (contrast(P.bg, x) >= 1.6) return x;
  const pool = [P.a1, P.a2, ...P.hl].filter(c => contrast(P.bg, c) >= 2);
  return pool.length ? pool[k % pool.length] : best(P.bg, [P.ink, P.a1, P.a2]);
}
