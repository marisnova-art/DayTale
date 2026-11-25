// 템플릿 틀: 타이프라이터 (디자인, 11-25 96차). 앤드류 레퍼런스(타자기 글씨 · 바랜 노란 풍경)의 느낌만: 타자기 글씨(고정폭) + 흑백 풀숲 무늬 위에 연한 색.
// 글꼴 = 영문 Courier Prime · 한글 나눔고딕코딩 (둘 다 OFL, fonts/type.css). 바탕 무늬는 코드로 그려 한 장 그림으로 구워요 (씨앗 · 색마다 한 번).
// 98차 (앤드류): 이미지 넣기 없앰. 바탕 = 코드로 그린 자연 장면(숲 · 바다 · 들판 · 산 능선 · 구름 하늘) → 굵은 점 디더링 + 가끔 가로 줄 어긋남(글리치) → 검정 없이 바램 → 연한 색.
// 색 = 색 조합 칩의 배경색을 흰색에 많이 섞은 연한 색 (직접 색도). 셔플 = 장면 종류 · 구도 · 어긋난 줄 (칩을 안 골랐으면 색도).
// 모션 (피드 가운데 카드만): 글자가 타자 치듯 한 자씩 찍히고, 커서는 막 찍힌 글자 바로 뒤에 붙어 같이 움직이다 다 찍히면 사라져요
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 샀다. 퇴근길 하늘이 분홍색이었다.', seed: 3, pal: 10 };
const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// 연한 색: 조합 배경색의 색상(hue)으로 밝고 맑은 파스텔 (무채색 조합 · 크림은 레퍼런스 느낌의 연노랑)
export const washOf = P => {
  const [r, g, b] = hx(P.bg).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2, sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
  if (sat < .25 || (l > .85)) { h = 58; }
  const S = 1, L = h > 40 && h < 75 ? .8 : .86, c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = L - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `rgb(${Math.round((R + m) * 255)},${Math.round((G + m) * 255)},${Math.round((B + m) * 255)})`;
};

// 값 잡음 (부드러운 무늬)
function noise(seed) {
  const r = rng(seed), g = Float32Array.from({ length: 4096 }, r);
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), at = (i, j) => g[((j & 63) << 6) | (i & 63)];
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
}
const cache = new Map();
const fbm = (n, x, y, o = 5) => { let v = 0, a = 1, s = 0; for (let k = 0; k < o; k++) { v += n(x + k * 17.3, y + k * 9.1) * a; s += a; a *= .5; x *= 2.03; y *= 2.03; } return v / s; };
const sm = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
// 장면 5가지 (98차). 셔플(씨앗)마다 종류 · 구도가 바뀌어요
export const KINDS = ['숲', '바다', '들판', '산 능선', '구름 하늘'];
export const kindOf = seed => Math.floor(rng(((seed || 1) ^ 0x51ed27) >>> 0)() * KINDS.length);
// 장면 → 밝기 (0 검정 ~ 1 흰색), 작은 격자 W × H
function scene(kind, seed, W, H) {
  const n = noise(seed >>> 0), n2 = noise((seed ^ 0x9e37) >>> 0), r = rng((seed ^ 0x51) >>> 0), L = new Float32Array(W * H);
  const hz = .32 + r() * .2, trunks = Array.from({ length: 5 + Math.floor(r() * 5) }, () => [r() * W, 2 + r() * 5, r()]);
  const ridges = [0, 1, 2].map(k => [hz - .1 + k * .1 + r() * .05, r() * 100]);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const y = j / H; let v;
    if (kind === 0) {   // 숲: 잎 덩어리 + 나무줄기 + 땅
      const fine = n2(i / 2.5, j / 2.5);
      v = .25 + .7 * sm(.36, .62, fbm(n, i / 26, j / 26)) + .2 * (fine - .5);
      for (const [tx, tw, td] of trunks) { const dx = Math.abs(i - tx - Math.sin(j / 40 + td * 6) * 4); if (dx < tw * (1 + y * .6) && y > .2 + td * .2) v = Math.min(v, .12 + .15 * fine); }
      if (y > .82) v = .45 + .3 * fbm(n2, i / 8, j / 3);
    } else if (kind === 1) {   // 바다: 하늘 · 수평선 · 물결 · 반짝임
      if (y < hz) v = .78 + .2 * (y / hz) + .06 * (fbm(n, i / 40, j / 14) - .5);
      else { const d = (y - hz) / (1 - hz), wv = Math.sin(j * (1.6 - d * .9) + fbm(n, i / 18, j / 4) * 7); v = .38 + .25 * d + .2 * wv * (1 - d * .4) + .12 * (n2(i / 2, j) - .5); if (wv > .93 && n2(i / 3, j / 2) > .6) v = 1; }
    } else if (kind === 2) {   // 들판: 먼 나무 줄 + 풀
      const tl = hz + .05 * (fbm(n, i / 30, 0) - .5);
      if (y < tl - .04) v = .86 + .1 * (fbm(n, i / 50, j / 20) - .5);
      else if (y < tl) v = .3 + .2 * fbm(n2, i / 4, j / 4);
      else { const g = Math.abs(Math.sin(i * 1.7 + n(i / 3, j / 18) * 9)); v = .5 + .35 * (y - tl) + .3 * (g - .5) - .15 * (n2(i / 1.5, j / 6) > .6 ? 1 : 0); }
    } else if (kind === 3) {   // 산 능선 3겹 (멀수록 밝게)
      v = .9 - .08 * y;
      ridges.forEach(([h, ph], k) => { const top = h + .12 * (fbm(n, i / (60 - k * 12) + ph, k * 5, 4) - .5) * (1.5 - k * .3); if (y > top) v = .78 - k * .22 + .08 * (n2(i / 3, j / 3) - .5) + .05 * (y - top); });
    } else {   // 구름 하늘
      v = .62 + .15 * y + .35 * sm(.45, .7, fbm(n, i / 34, j / 22)) + .05 * (n2(i / 3, j / 3) - .5);
    }
    L[j * W + i] = Math.min(1, Math.max(0, v));
  }
  return L;
}
// 바탕 그림: 격자 200 × 356 (9:16)을 3배 굵은 점으로 → 600 × 1068 PNG (4:5 카드는 가운데를 덮어요). 씨앗 · 색마다 한 번 굽기
// 디더링 = 4×4 순서 점, 3단계(검정 대신 옅은 회색) · 글리치 = 가로 줄 3~6군데를 ±9칸 어긋나게 · 마지막에 연한 색 곱하기
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16), LV = [.62, .8, 1];
function texture(seed, wash) {
  const k = `t|${seed}|${wash}`; if (cache.has(k)) return cache.get(k);
  const W = 200, Hh = 356, Z = 3, L = scene(kindOf(seed), seed, W, Hh), r = rng(((seed || 1) ^ 0x77) >>> 0), [wr, wg, wb] = wash.match(/\d+/g).map(Number);
  const sh = new Int16Array(Hh); for (let q = 0, m = 3 + Math.floor(r() * 4); q < m; q++) { const y0 = Math.floor(r() * Hh), h = 1 + Math.floor(r() * 4), d = Math.round((r() - .5) * 18); for (let j = y0; j < Math.min(Hh, y0 + h); j++) sh[j] = d; }
  const sc = document.createElement('canvas'); sc.width = W; sc.height = Hh;
  const sx = sc.getContext('2d'), im = sx.createImageData(W, Hh);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const v = L[j * W + Math.min(W - 1, Math.max(0, i + sh[j]))] * 2, f = Math.floor(v), g = LV[Math.min(2, f + (v - f > BAY[(j & 3) * 4 + (i & 3)] ? 1 : 0))], p = (j * W + i) * 4;
    im.data[p] = g * wr; im.data[p + 1] = g * wg; im.data[p + 2] = g * wb; im.data[p + 3] = 255;
  }
  sx.putImageData(im, 0, 0);
  const cv = document.createElement('canvas'); cv.width = W * Z; cv.height = Hh * Z; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(sc, 0, 0, W * Z, Hh * Z);
  const u = cv.toDataURL('image/png'); cache.set(k, u); return u;
}

// 보기 카드: 글자를 한 자씩 조각으로 (타자 모션). 정지 그림 · 저장엔 그냥 글이에요
function chars(root) {
  const texts = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) if (!t.parentElement.closest('.tk')) texts.push(t);
  // 97차 (앤드류 '조금 천천히'): 한 자 0.18초, 다 찍고 3초 쉬고 다시. 한 바퀴는 6~20초 (아주 긴 글만 그 안에 들게 빨라져요).
  // 나타나는 때는 80칸(b1~b80, 칸마다 1.1%)으로 나눠 키프레임 · 한 바퀴 길이는 글자마다 animation-duration으로
  const n = texts.reduce((a, t) => a + t.data.length, 0), T = Math.max(6, Math.min(20, n * .18 + 3)), dt = Math.min(.18, (T - 3) / Math.max(1, n)); let i = 0;
  texts.forEach(tn => { const frag = document.createDocumentFragment();
    [...tn.data].forEach(ch => { const s = document.createElement('span'), b = Math.max(1, Math.min(80, Math.round((i++ * dt + .3) / T * 100 / 1.1))); s.className = 'tk b' + b; s.style.animationDuration = T.toFixed(1) + 's'; s.textContent = ch; frag.appendChild(s); });
    tn.replaceWith(frag); });
  // 98차 커서: 칸마다 마지막 글자(.tcu) 뒤에 붙어 그 칸 동안만 보여요 → 찍히는 글자를 따라 움직이며 깜빡, 다 찍히면 사라짐 (늘 깜빡이는 커서 없음)
  const all = [...root.querySelectorAll('.tk')];
  all.forEach((s, k) => { const nx = all[k + 1]; if (!/^\s$/.test(s.textContent) && (!nx || nx.className !== s.className)) s.classList.add('tcu'); });
}
function place(root) { if (!root.isContentEditable && !root.querySelector('.tk')) chars(root); return false; }

function typer(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd ctyp' + (edit ? ' edit' : '');
  const P = comboOf(c), wash = washOf(P); paintCombo(el, P); el.classList.remove('dk');
  const img = texture(c.seed || 1, wash);
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.45 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh}`;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="tbg" style="background-color:${wash};background-image:url(${img})"></div>
    <div class="rb body" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty && !edit) place(el.querySelector('.rb'));
  el.classList.toggle('empty', empty);
  return el;
}

export default {
  id: 'typer', name: '타이프라이터', info: '모든 길이 · 셔플마다 새 풍경', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },   // 98차: 이미지 넣기 없음
  fonts: [['type.css', 'DT Courier Prime'], ['type.css', 'DT Nanum Gothic Coding']],
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = typer(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit: H.fit, margins: H.margins, place,
  tone: c => washOf(comboOf(c)),
};
