// 카드 → 4:5 장들. 저장할 땐 1080×1350 이미지로, 피드에선 같은 장을 화면 폭으로 그려서 옆으로 넘겨 봐요
// (쓰는 동안은 한 장의 긴 카드, 나누는 건 여기서만. 줄이 잘리지 않게 줄 단위로 나눠요)
import { renderCard, fitCard, cardText, rbMargins, lines, starts, shape, arOf, signOf } from './formats.js';
import { drawCode } from './bg.js';
import { ready } from './stickers.js';
import { fontOf } from './fonts.js';
import { prep } from './filters.js';

const cache = new Map();
const toData = async url => {
  if (cache.has(url)) return cache.get(url);
  const b = await (await fetch(url)).blob();
  const d = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  cache.set(url, d); return d;
};

// 글꼴은 카드에 쓰인 글자가 든 조각만 넣어요 (명조 · 손글씨는 조각이 많아서)
const famRules = {};
async function rulesOf(file, family) {
  if (famRules[family]) return famRules[family];
  const base = new URL(`../fonts/${file}`, location.href), src = await (await fetch(base)).text();
  const re = new RegExp(`@font-face\\s*{[^}]*font-family:\\s*'${family}'[^}]*src:\\s*url\\(([^)]+)\\)[^}]*unicode-range:\\s*([^;]+);[^}]*}`, 'g');
  return (famRules[family] = [...src.matchAll(re)].map(m => ({ url: new URL(m[1], base).href, ranges: m[2].split(',').map(x => x.trim().replace('U+', '').split('-').map(h => parseInt(h, 16))) })));
}
async function fontCss(text, font) {
  let css = `@font-face{font-family:'Pretendard Variable';font-weight:45 920;src:url(${await toData(new URL('../fonts/PretendardVariable.woff2', location.href).href)}) format('woff2');}`;
  const fo = fontOf(font);
  if (!fo.file) return css;   // 프리텐다드는 위에서 넣었어요
  const fam = [fo.file, fo.fam];
  const cps = [...new Set([...text].map(ch => ch.codePointAt(0)))];
  const hit = (await rulesOf(...fam)).filter(r => r.ranges.some(([a, b = a]) => cps.some(c => c >= a && c <= b)));
  for (const r of hit) css += `@font-face{font-family:'${fam[1]}';src:url(${await toData(r.url)}) format('woff2');}`;
  return css;
}

function host(W) {
  const h = document.createElement('div');
  h.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;pointer-events:none;`;
  document.body.appendChild(h); return h;
}

// 내용을 off부터 h만큼만 보이게 감싸요
function clipTo(box, off, h) {
  const clip = document.createElement('div'); clip.className = 'clip'; clip.style.height = h + 'px';
  const inner = document.createElement('div'); inner.style.marginTop = -off + 'px';
  inner.append(...box.childNodes); clip.appendChild(inner); box.appendChild(clip);
}

// ar = 세로 ÷ 가로 (4:5 = 1.25, 9:16 = 16/9, 1:1 = 1). 카드 자체를 그 비율로 다시 그려요
async function rebusPages(c, W, ar) {
  const H = Math.round(W * ar), s = W / 1080, h = host(W), el = shape(renderCard(c), ar); h.appendChild(el); fitCard(el, c);
  await document.fonts.ready; fitCard(el, c);
  if (el.offsetHeight <= H + 1) { el.style.height = H + 'px'; return { h, nodes: [el] }; }
  const [mt, mb] = rbMargins(el);
  const p = el.querySelector('.rb'), avail = H - (mt + mb) * s;
  const st = starts(lines(p), avail);
  const nodes = st.map((off, i) => {
    const pg = shape(renderCard(c), ar); pg.classList.add('paged');
    h.appendChild(pg); fitCard(pg, c); pg.style.height = H + 'px';
    const rb = pg.querySelector('.rb'); rb.style.fontSize = p.style.fontSize;
    const box = document.createElement('div'); box.className = 'pgbox'; box.style.marginTop = mt * s + 'px'; rb.replaceWith(box); box.appendChild(rb); rb.style.margin = '0';
    clipTo(box, off, (st[i + 1] ? st[i + 1] - off : avail));
    return pg;
  });
  el.remove();
  return { h, nodes };
}

async function textPages(c, W, ratio, ar) {
  const H = Math.round(W * ar), h = host(W), el = shape(renderCard(c), ar);
  el.style.alignItems = 'flex-start';   // 장마다 제 길이로 재요 (가장 긴 장 높이로 늘어나면 덜 긴 장이 안 넘친다고 잘못 재요)
  h.appendChild(el); fitCard(el, c);
  await document.fonts.ready; fitCard(el, c);
  const out = [];
  [...el.querySelectorAll('.pg')].forEach(pg => {
    if (!pg.classList.contains('long')) { out.push(pg); return; }
    const tx = pg.querySelector('.tx'), cs = getComputedStyle(tx), pad = parseFloat(cs.paddingTop), avail = H - pad - parseFloat(cs.paddingBottom);
    const ls = lines(tx).map(([t, b]) => [t - pad, b - pad]), st = starts(ls, avail);
    st.forEach((off, i) => {
      const q = pg.cloneNode(true); q.classList.remove('long'); q.querySelectorAll('.brk, .bgi.ph.more').forEach(b => b.remove());   // 나뉜 장마다 사진은 맨 위 한 장(4:5)
      const qtx = q.querySelector('.tx'); qtx.dataset.v = 't';
      clipTo(qtx, off, st[i + 1] ? st[i + 1] - off : avail);
      out.push(q);
    });
  });
  // 장마다 따로 된 카드 틀에 넣고, 배경은 장마다 보이는 부분을 위 → 아래로 옮겨요
  const nodes = out.map((pg, i) => {
    const wrap = shape(document.createElement('div'), ar); wrap.classList.add('cd', 'text', 'one'); wrap.appendChild(pg); h.appendChild(wrap);
    const shift = out.length > 1 ? i / (out.length - 1) : .5;
    pg.querySelectorAll('.bgi:not(.ph)').forEach(b => { if (b.style.backgroundImage) b.style.backgroundPosition = `50% ${Math.round(shift * 100)}%`; });
    pg.querySelectorAll('canvas.bgc').forEach(cv => { cv.width = Math.round(W * ratio); cv.height = Math.round(H * ratio); cv.dataset.shift = shift; drawCode(cv, +cv.dataset.seed, shift); });
    return wrap;
  });
  el.remove();
  return { h, nodes };
}

// 카드를 장들로 (카드의 비율). 돌려받은 h(화면 밖 상자)는 다 쓰고 지워야 해요
export async function buildPages(c, W, ratio = 1, ar = arOf(c)) {
  if (c.fmt !== 'rebus') { const d = document.createElement('div'); d.innerHTML = (c.pages || []).join(''); await ready(d); }   // 이모티콘 그림을 먼저 받아 둬요
  await prep(c);   // 포토 포맷: 필터를 건 사진을 먼저 만들어 둬요 (그래야 저장 이미지에도 필터가)
  return c.fmt === 'rebus' ? rebusPages(c, W, ar) : textPages(c, W, ratio, ar);
}

// 아이폰(WebKit)은 처음 그릴 때 배경 사진을 빼먹곤 해서: 사진을 먼저 풀어 두고, 한 번 미리 그린 뒤, 나온 그림을 확인해요
const WK = /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android|Edg/.test(navigator.userAgent);
const urlsOf = n => [...n.querySelectorAll('.bgi')].map(b => (b.style.backgroundImage.match(/url\(["']?([^"')]+)/) || [])[1]).filter(Boolean);
const decode = u => new Promise(r => { const i = new Image(); i.onload = i.onerror = () => r(); i.src = u; i.decode?.().then(r, r); });
// 빈 그림(투명) · 배경이 빠진 그림(사진 장인데 거의 한 색)이면 false
function looksOk(cv, photo) {
  const x = cv.getContext('2d', { willReadFrequently: true }), { width: w, height: h } = cv, L = [];
  let clear = 0;
  for (let i = 0; i < 12; i++) for (let j = 0; j < 15; j++) {
    const [r, g, b, a] = x.getImageData(Math.floor((i + .5) * w / 12), Math.floor((j + .5) * h / 15), 1, 1).data;
    if (a < 250) clear++; L.push(.299 * r + .587 * g + .114 * b);
  }
  if (clear > L.length * .1) return false;
  if (!photo) return true;
  const m = [...L].sort((a, b) => a - b)[L.length >> 1];
  return L.filter(v => Math.abs(v - m) <= 4).length <= L.length * .92;
}

// 한 번에 한 가지만 만들어요 (겹치면 아이폰에서 빈 그림이 나와요)
let line = Promise.resolve();
const one = f => { const r = line.then(f, f); line = r.catch(() => {}); return r; };

// o = { pages: [보낼 장 번호] (없으면 모두), onStep(지금, 모두) } → { files, failed: [장 번호] }
export const cardImages = (c, o = {}) => one(async () => {
  const W = 1080, ar = arOf(c), H = Math.round(W * ar), tag = { 1.25: '', 1: '-11' }[ar] ?? '-916';
  const { h, nodes: all } = await buildPages(c, W, 1, ar);
  all.forEach(n => n.querySelectorAll('canvas.bgv').forEach(x => x.remove()));   // 영상인 장은 커버 사진으로 (영상 MP4 저장은 다음 단계)
  await document.fonts.ready;
  const pick = o.pages ? o.pages.filter(i => all[i]) : all.map((_, i) => i);
  try {
    const fontEmbedCSS = await fontCss(cardText(c) + (c.place || '') + (signOf(c) ? c.signTxt : '') + '0123456789.·/ 일월화수목금토요', c.fmt !== 'rebus' ? c.font || 'serif' : 'sans');
    const opt = { width: W, height: H, pixelRatio: 1, fontEmbedCSS, cacheBust: false };
    const files = [], failed = [];
    for (const [k, i] of pick.entries()) {
      o.onStep?.(k + 1, pick.length);
      const n = all[i], urls = urlsOf(n);
      await Promise.all(urls.map(decode));
      let cv = null;
      for (let t = 0; t < 3; t++) {
        if (WK && (t > 0 || k === 0 || urls.length)) await window.htmlToImage.toCanvas(n, opt).catch(() => {});   // 미리 한 번
        cv = await window.htmlToImage.toCanvas(n, opt).catch(() => null);
        if (cv && looksOk(cv, urls.length > 0)) break;
        cv = null; await new Promise(r => setTimeout(r, 150));
      }
      if (!cv) { failed.push(i); continue; }
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      files.push(new File([blob], `dayzine-${c.date}-${i + 1}${tag}.png`, { type: 'image/png' }));
    }
    return { files, failed };
  } finally { h.remove(); }
});
export async function saveImages(files) {
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; if (e.name === 'NotAllowedError') return 'again'; }   // 아이폰: 이미지를 만드는 사이 누른 효과가 끝나면 한 번 더 눌러야 해요
  }
  for (const f of files) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  return 'downloaded';
}
