// 템플릿 틀: 타자 메모 (디자인, 11-25 96차). 앤드류 레퍼런스(타자기 글씨 · 바랜 노란 풍경)의 느낌만: 타자기 글씨(고정폭) + 흑백 풀숲 무늬 위에 연한 색.
// 글꼴 = 영문 Courier Prime · 한글 나눔고딕코딩 (둘 다 OFL, fonts/type.css). 바탕 무늬는 코드로 그려 한 장 그림으로 구워요 (씨앗 · 색마다 한 번).
// 내 사진을 넣으면 그 사진을 흑백 + 밝게 바랜 뒤 색을 곱해 구워요 (CSS 필터 · 섞기 없이 그림으로: 아이폰 · 저장 그림 모두 같게).
// 색 = 색 조합 칩의 배경색을 흰색에 많이 섞은 연한 색 (직접 색도). 셔플 = 무늬 (칩을 안 골랐으면 색도).
// 모션 (피드 가운데 카드만): 글자가 타자 치듯 한 자씩 찍히고 끝에서 커서가 깜빡여요 (8초마다 다시)
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo } from '../../js/combo.js';
import { srcOf } from '../../js/filters.js';
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
const cache = new Map(), work = new Map();
// 무늬 그림: 400 × 712 (9:16), 4:5 카드는 가운데를 덮어요. 흑백 풀숲 → 밝게 → 색 곱하기
function texture(seed, wash) {
  const k = `t|${seed}|${wash}`; if (cache.has(k)) return cache.get(k);
  const W = 400, Hh = 712, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const x = cv.getContext('2d'), im = x.createImageData(W, Hh), n = noise(seed >>> 0), n2 = noise((seed ^ 0x9e37) >>> 0), [wr, wg, wb] = wash.match(/\d+/g).map(Number);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    let v = 0, a = 1, f = 1 / 52; for (let o = 0; o < 5; o++) { v += n(i * f + o * 17.3, j * f + o * 9.1) * a; a *= .5; f *= 2.03; } v /= 1.94;
    const lf = n2(i / 3.2, j / 3.2), big = v > .5 ? 1 : 0;   // 큰 덩어리(나무 그늘) + 잔 잎
    let L = .74 + .34 * (v - .5) * 1.3 + .2 * (lf - .5) * (.6 + .8 * big) - .06 * big;
    L = 1 - (1 - Math.min(1, Math.max(0, L))) * .42;   // 바랜 인쇄처럼 밝게
    const p = (i + j * W) * 4; im.data[p] = L * wr; im.data[p + 1] = L * wg; im.data[p + 2] = L * wb; im.data[p + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const u = cv.toDataURL('image/jpeg', .86); cache.set(k, u); return u;
}
// 내 사진 그림: 흑백 → 밝게 바램 → 색 곱하기 (긴 쪽 900px). 다 되면 화면의 같은 칸을 바꿔요
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
function photoKey(c, wash) { const src = c.bg?.id === 'photo' ? srcOf(c.bg) : ''; return src ? `p|${c.bg.ph || src}|${wash}` : ''; }
function makePhoto(c, wash) {
  const k = photoKey(c, wash), src = srcOf(c.bg); if (!k || cache.has(k)) return Promise.resolve(cache.get(k));
  if (!work.has(k)) work.set(k, loadImg(src).then(im => {
    const s = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), W = Math.round(im.naturalWidth * s), Hh = Math.round(im.naturalHeight * s);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d'); x.drawImage(im, 0, 0, W, Hh);
    const d = x.getImageData(0, 0, W, Hh), [wr, wg, wb] = wash.match(/\d+/g).map(Number);
    for (let p = 0; p < d.data.length; p += 4) { let L = (.299 * d.data[p] + .587 * d.data[p + 1] + .114 * d.data[p + 2]) / 255; L = .5 + L * .5; d.data[p] = L * wr; d.data[p + 1] = L * wg; d.data[p + 2] = L * wb; }
    x.putImageData(d, 0, 0);
    const u = cv.toDataURL('image/jpeg', .88); cache.set(k, u);
    document.querySelectorAll('.cd.ctyp .tbg').forEach(e => { if (e.dataset.k === k) e.style.backgroundImage = `url(${u})`; });
    return u;
  }).catch(e => { console.warn('typer photo', e); work.delete(k); }));
  return work.get(k);
}

// 보기 카드: 글자를 한 자씩 조각으로 (타자 모션). 정지 그림 · 저장엔 그냥 글이에요
function chars(root) {
  const texts = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) if (!t.parentElement.closest('.tk')) texts.push(t);
  const n = texts.reduce((a, t) => a + t.data.length, 0), per = Math.min(.05, 1 / Math.max(1, n)) * 40; let i = 0;   // 짧은 글은 천천히(한 자 2%), 긴 글은 80% 안에 다
  texts.forEach(tn => { const frag = document.createDocumentFragment();
    [...tn.data].forEach(ch => { const s = document.createElement('span'); s.className = 'tk b' + Math.min(40, 1 + Math.floor(i++ * per)); s.textContent = ch; frag.appendChild(s); });
    tn.replaceWith(frag); });
  root.insertAdjacentHTML('beforeend', '<span class="cur"></span>');
}
function place(root) { if (!root.isContentEditable && !root.querySelector('.tk')) chars(root); return false; }

function typer(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd ctyp' + (edit ? ' edit' : '');
  const P = comboOf(c), wash = washOf(P); paintCombo(el, P); el.classList.remove('dk');
  const pk = photoKey(c, wash), img = pk ? cache.get(pk) || '' : texture(c.seed || 1, wash);
  if (pk && !img) makePhoto(c, wash);
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.45 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh}`;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="tbg" data-k="${pk}" style="background-color:${wash};${img ? `background-image:url(${img})` : ''}"></div>
    <div class="rb body" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty && !edit) place(el.querySelector('.rb'));
  el.classList.toggle('empty', empty);
  return el;
}

export default {
  id: 'typer', name: '타자 메모', info: '모든 길이 · 내 사진 가능 · 셔플마다 새 무늬', paid: true, css: true,
  tools: { photo: true, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  fonts: [['type.css', 'DT Courier Prime'], ['type.css', 'DT Nanum Gothic Coding']],
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = typer(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit: H.fit, margins: H.margins, place,
  prep: c => makePhoto(c, washOf(comboOf(c))),   // 저장 전에 사진 그림을 먼저 구워 둬요
  tone: c => washOf(comboOf(c)),
};
