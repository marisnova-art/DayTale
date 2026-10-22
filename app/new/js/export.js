// 카드 → 4:5 이미지(1080×1350). 휴대폰에서 만들어 바로 사진에 저장해요(서버로 보내지 않음)
import { renderCard, fitCard, cardText } from './formats.js';

const W = 1080, H = 1350;
const cache = new Map();
const toData = async url => {
  if (cache.has(url)) return cache.get(url);
  const b = await (await fetch(url)).blob();
  const d = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  cache.set(url, d); return d;
};

// 글꼴은 카드에 쓰인 글자가 든 조각만 넣어요 (고운바탕은 조각이 190개라서)
let serifRules = null;
async function fontCss(text) {
  let css = `@font-face{font-family:'Pretendard Variable';font-weight:45 920;src:url(${await toData(new URL('../fonts/PretendardVariable.woff2', location.href).href)}) format('woff2');}`;
  if (!serifRules) {
    const src = await (await fetch(new URL('../fonts/serif.css', location.href))).text();
    serifRules = [...src.matchAll(/@font-face\s*{[^}]*font-family:\s*'DT Gowun Batang'[^}]*src:\s*url\(([^)]+)\)[^}]*unicode-range:\s*([^;]+);[^}]*}/g)]
      .map(m => ({ url: new URL(m[1], new URL('../fonts/serif.css', location.href)).href, ranges: m[2].split(',').map(s => s.trim().replace('U+', '').split('-').map(h => parseInt(h, 16))) }));
  }
  const cps = new Set([...text].map(ch => ch.codePointAt(0)));
  const hit = serifRules.filter(r => r.ranges.some(([a, b = a]) => [...cps].some(c => c >= a && c <= b)));
  for (const r of hit) css += `@font-face{font-family:'DT Gowun Batang';src:url(${await toData(r.url)}) format('woff2');}`;
  return css;
}

function host() {
  const h = document.createElement('div');
  h.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;pointer-events:none;`;
  document.body.appendChild(h); return h;
}

// 그림 문장: 긴 글은 줄 단위로 나눠 여러 장으로 (줄이 잘리지 않게)
async function rebusPages(c, opt) {
  const h = host(), el = renderCard(c); h.appendChild(el); fitCard(el, c);
  await document.fonts.ready;
  const out = [];
  if (el.offsetHeight <= H + 1) { el.style.height = H + 'px'; out.push(el); return { h, nodes: out }; }
  const p = el.querySelector('.rb'), top = 72, avail = H - top - 170;
  const pr = p.getBoundingClientRect();
  const lines = [...new Set([...p.querySelectorAll('.w, svg.i')].map(n => { const r = n.getBoundingClientRect(); return Math.round(r.top - pr.top) + '|' + Math.round(r.bottom - pr.top); }))]
    .map(s => s.split('|').map(Number)).sort((a, b) => a[0] - b[0]);
  const starts = [0]; let base = 0;
  for (const [t, b] of lines) if (b - base > avail) { base = t; starts.push(t); }
  starts.forEach((off, i) => {
    const pg = renderCard(c); pg.classList.add('paged'); pg.style.height = H + 'px';
    h.appendChild(pg); fitCard(pg, c);
    const rb = pg.querySelector('.rb'); rb.style.fontSize = p.style.fontSize;
    const clip = document.createElement('div'); clip.className = 'clip'; clip.style.height = (starts[i + 1] ? starts[i + 1] - off : avail) + 'px';
    rb.replaceWith(clip); clip.appendChild(rb); rb.style.marginTop = -off + 'px';
    pg.insertAdjacentHTML('beforeend', `<div class="pn">${i + 1}/${starts.length}</div>`);
    out.push(pg);
  });
  el.remove();
  return { h, nodes: out };
}

async function textPages(c) {
  const h = host(), el = renderCard(c); h.appendChild(el); fitCard(el, c);
  await document.fonts.ready; fitCard(el, c);
  return { h, nodes: [...el.querySelectorAll('.pg')] };
}

export async function cardImages(c, opt = {}) {
  const { h, nodes } = c.fmt === 'rebus' ? await rebusPages(c, opt) : await textPages(c);
  try {
    const fontEmbedCSS = await fontCss(cardText(c) + '0123456789.·/ 일월화수목금토요');
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
