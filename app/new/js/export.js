// 카드 → 4:5 장들. 저장할 땐 1080×1350 이미지로, 피드에선 같은 장을 화면 폭으로 그려서 옆으로 넘겨 봐요
// (쓰는 동안은 한 장의 긴 카드, 나누는 건 여기서만. 줄이 잘리지 않게 줄 단위로 나눠요)
import { renderCard, fitCard, cardText, RB_M } from './formats.js';
import { drawCode } from './bg.js';
import { ready } from './stickers.js';
import { fontOf } from './fonts.js';

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

// 글이 놓인 줄들(위 · 아래 위치). 글자 · 그림 · 날짜 줄을 모아 겹치는 것끼리 한 줄로
function lines(root) {
  const top = root.getBoundingClientRect().top, boxes = [];
  const add = r => { if (r.height > 1) boxes.push([r.top - top, r.bottom - top]); };
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { if (!n.data.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); [...r.getClientRects()].forEach(add); }
  root.querySelectorAll('.o svg, .dt').forEach(e => add(e.getBoundingClientRect()));
  boxes.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [t, b] of boxes) {
    const l = out[out.length - 1];
    if (l && t < l[1] - (b - t) * .5) l[1] = Math.max(l[1], b); else out.push([t, b]);
  }
  return out;
}
// 줄들을 한 장 높이(avail)에 맞게 나눈 시작 위치들
function starts(ls, avail) {
  const s = [0]; let base = 0;
  for (const [t, b] of ls) if (b - base > avail && t > base) { base = t; s.push(t); }
  return s;
}
// 내용을 off부터 h만큼만 보이게 감싸요
function clipTo(box, off, h) {
  const clip = document.createElement('div'); clip.className = 'clip'; clip.style.height = h + 'px';
  const inner = document.createElement('div'); inner.style.marginTop = -off + 'px';
  inner.append(...box.childNodes); clip.appendChild(inner); box.appendChild(clip);
}

async function rebusPages(c, W) {
  const H = Math.round(W * 1.25), s = W / 1080, h = host(W), el = renderCard(c); h.appendChild(el); fitCard(el, c);
  await document.fonts.ready; fitCard(el, c);
  if (el.offsetHeight <= H + 1) { el.style.height = H + 'px'; return { h, nodes: [el] }; }
  const [mt, mb] = RB_M[el.dataset.dp] || RB_M.bottom, p = el.querySelector('.rb'), avail = H - (mt + mb) * s;
  const st = starts(lines(p), avail);
  const nodes = st.map((off, i) => {
    const pg = renderCard(c); pg.classList.add('paged');
    h.appendChild(pg); fitCard(pg, c); pg.style.height = H + 'px';
    const rb = pg.querySelector('.rb'); rb.style.fontSize = p.style.fontSize;
    const box = document.createElement('div'); box.className = 'pgbox'; box.style.marginTop = mt * s + 'px'; rb.replaceWith(box); box.appendChild(rb); rb.style.margin = '0';
    clipTo(box, off, (st[i + 1] ? st[i + 1] - off : avail));
    return pg;
  });
  el.remove();
  return { h, nodes };
}

async function textPages(c, W, ratio) {
  const H = Math.round(W * 1.25), h = host(W), el = renderCard(c); h.appendChild(el); fitCard(el, c);
  await document.fonts.ready; fitCard(el, c);
  const out = [];
  [...el.querySelectorAll('.pg')].forEach(pg => {
    if (!pg.classList.contains('long')) { out.push(pg); return; }
    const tx = pg.querySelector('.tx'), pad = parseFloat(getComputedStyle(tx).paddingTop), avail = H - 2 * pad;
    const ls = lines(tx).map(([t, b]) => [t - pad, b - pad]), st = starts(ls, avail);
    st.forEach((off, i) => {
      const q = pg.cloneNode(true); q.classList.remove('long'); q.querySelectorAll('.brk').forEach(b => b.remove());
      const qtx = q.querySelector('.tx'); qtx.style.justifyContent = 'flex-start';
      clipTo(qtx, off, st[i + 1] ? st[i + 1] - off : avail);
      out.push(q);
    });
  });
  // 장마다 따로 된 카드 틀에 넣고, 배경은 장마다 보이는 부분을 위 → 아래로 옮겨요
  const nodes = out.map((pg, i) => {
    const wrap = document.createElement('div'); wrap.className = 'cd text one'; wrap.appendChild(pg); h.appendChild(wrap);
    const shift = out.length > 1 ? i / (out.length - 1) : .5;
    pg.querySelectorAll('.bgi').forEach(b => { if (b.style.backgroundImage) b.style.backgroundPosition = `50% ${Math.round(shift * 100)}%`; });
    pg.querySelectorAll('canvas.bgc').forEach(cv => { cv.width = Math.round(W * ratio); cv.height = Math.round(H * ratio); drawCode(cv, +cv.dataset.seed, shift); });
    return wrap;
  });
  el.remove();
  return { h, nodes };
}

// 카드를 4:5 장들로. 돌려받은 h(화면 밖 상자)는 다 쓰고 지워야 해요
export async function buildPages(c, W, ratio = 1) {
  if (c.fmt !== 'rebus') { const d = document.createElement('div'); d.innerHTML = (c.pages || []).join(''); await ready(d); }   // 이모티콘 그림을 먼저 받아 둬요
  return c.fmt === 'rebus' ? rebusPages(c, W) : textPages(c, W, ratio);
}

export async function cardImages(c) {
  const W = 1080, H = 1350;
  const { h, nodes } = await buildPages(c, W, 1);
  try {
    const fontEmbedCSS = await fontCss(cardText(c) + '0123456789.·/ 일월화수목금토요', c.fmt === 'text' ? c.font || 'serif' : 'sans');
    const files = [];
    for (const [i, n] of nodes.entries()) {
      const url = await window.htmlToImage.toPng(n, { width: W, height: H, pixelRatio: 1, fontEmbedCSS, cacheBust: false });
      const blob = await (await fetch(url)).blob();
      files.push(new File([blob], `dayzine-${c.date}-${i + 1}.png`, { type: 'image/png' }));
    }
    return files;
  } finally { h.remove(); }
}

export async function saveImages(files) {
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancel'; }
  }
  for (const f of files) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  return 'downloaded';
}
