// 포맷 = 데이터 + 그리기. 카드는 가로 1080 기준으로 디자인하고 cqw 단위로 그려서, 화면 크기와 저장 이미지가 같은 모양이에요
import { find as findBg, dimCss, drawCode } from './bg.js';
import { rangeAt } from './rich.js';
import { hydrate } from './stickers.js';
import { fontOf, fontCssOf, SIZES } from './fonts.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const px = n => `${(n / 10.8).toFixed(3)}cqw`; // 1080 디자인 px → cqw

export function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const newSeed = () => Math.floor(Math.random() * 1e9);

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const WDL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const parse = d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); };
export const dateLine = d => { const x = parse(d); return `${x.getFullYear()}. ${x.getMonth() + 1}. ${x.getDate()} · ${WD[x.getDay()]}`; };
export const weekday = d => WDL[parse(d).getDay()];
export const dateChip = d => { const x = parse(d); return `${x.getMonth() + 1}.${String(x.getDate()).padStart(2, '0')} ${WD[x.getDay()]}`; };

// ── 그림 문장 ──────────────────────────────────────────────
const V = '#6C4BD8', O = '#F2622E', T = '#12A08F', Y = '#FFC21A', R = '#FF9EB5', K = '#2E2D2B', BG = '#F3F1EC';
const sv = (w, b) => `<svg class="i" viewBox="0 0 ${w} 64">${b}</svg>`;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const OBJ = [
  sv(160, `<rect x="4" y="10" width="152" height="44" fill="${Y}"/><path d="M4 32l12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12 12-12 12 12" fill="none" stroke="${O}" stroke-width="5"/>`),
  sv(180, `<line x1="4" y1="32" x2="176" y2="32" stroke="${K}" stroke-width="5"/>${rep(4, i => `<circle cx="${32 + i * 40}" cy="32" r="16" fill="${[T, R, T, R][i]}"/><circle cx="${32 + i * 40}" cy="32" r="5" fill="${BG}"/>`)}`),
  sv(170, `<g fill="none" stroke-width="6">${rep(3, i => `<path d="M4 ${16 + i * 18}q10-10 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke="${[T, V, T][i]}"/>`)}</g>`),
  sv(140, `<g fill="${V}">${rep(4, i => rep(2, j => `<rect x="${6 + i * 34 + (j ? 17 : 0)}" y="${10 + j * 22}" width="17" height="22"/>`))}</g><rect x="4" y="8" width="134" height="48" fill="none" stroke="${V}" stroke-width="4"/>`),
  sv(150, `<rect x="4" y="14" width="142" height="36" rx="18" fill="${R}"/><g stroke="${BG}" stroke-width="6">${rep(6, i => `<line x1="${30 + i * 18}" y1="14" x2="${18 + i * 18}" y2="50"/>`)}</g>`),
  sv(170, `<line x1="4" y1="32" x2="166" y2="32" stroke="${K}" stroke-width="5" stroke-dasharray="10 8"/><path d="M85 10l20 22-20 22-20-22z" fill="${O}"/>`),
  sv(170, rep(6, i => `<path d="M${6 + i * 27} 54l13-38 13 38z" fill="${i % 2 ? Y : T}"/>`)),
  sv(130, `<circle cx="34" cy="32" r="26" fill="${O}"/><path d="M72 6a26 26 0 0 1 0 52z" fill="${V}"/><path d="M100 6a26 26 0 0 1 0 52z" fill="${Y}"/>`),
  sv(150, `<path d="M6 32c14-30 28 30 42 0s28 30 42 0 28 30 42 0" fill="none" stroke="${O}" stroke-width="7" stroke-linecap="round"/><circle cx="142" cy="32" r="6" fill="${V}"/>`),
  sv(80, `${rep(3, i => `<circle cx="40" cy="32" r="${28 - i * 9}" fill="${[T, BG, O][i]}"/>`)}`),
  sv(160, `<path d="M4 56h30V40h30V24h30V8h30" fill="none" stroke="${T}" stroke-width="6"/><rect x="128" y="2" width="28" height="28" fill="${R}"/>`),
  sv(150, `<g stroke="${O}" stroke-width="6" stroke-linecap="round">${rep(6, i => `<path d="M${10 + i * 23} 20l14 24M${24 + i * 23} 20l-14 24"/>`)}</g>`),
  sv(170, `<path d="M4 44${rep(7, () => 'a12 12 0 0 1 23 0')}" fill="none" stroke="${V}" stroke-width="6"/><line x1="4" y1="56" x2="166" y2="56" stroke="${Y}" stroke-width="6"/>`),
  sv(130, `<rect x="6" y="10" width="44" height="44" fill="${Y}"/><circle cx="74" cy="32" r="22" fill="${T}"/><path d="M100 54l14-44 14 44z" fill="${O}"/>`),
  sv(170, rep(6, i => rep(3, j => `<circle cx="${14 + i * 28}" cy="${12 + j * 20}" r="5" fill="${(i + j) % 2 ? V : T}"/>`))),
  sv(170, `<line x1="4" y1="50" x2="166" y2="50" stroke="${K}" stroke-width="5"/>${rep(5, i => `<path d="M${8 + i * 32} 50a14 14 0 0 1 28 0z" fill="${[O, Y, O, Y, O][i]}"/>`)}`),
  sv(170, `<path d="M4 46l18-28 18 28 18-28 18 28 18-28 18 28 18-28 18 28 18-28" fill="none" stroke="${T}" stroke-width="7" stroke-linejoin="round"/>`),
  sv(160, `<line x1="4" y1="24" x2="156" y2="24" stroke="${V}" stroke-width="7" stroke-dasharray="22 10"/><line x1="20" y1="42" x2="156" y2="42" stroke="${R}" stroke-width="7" stroke-dasharray="22 10"/>`),
  sv(70, `<path d="M35 32m0 0a4 4 0 0 1 8 0a8 8 0 0 1-16 0a12 12 0 0 1 24 0a16 16 0 0 1-32 0a20 20 0 0 1 40 0a24 24 0 0 1-48 0" fill="none" stroke="${O}" stroke-width="5"/>`),
  sv(170, rep(5, i => `<path d="M${20 + i * 32} 16v32M${4 + i * 32} 32h32" stroke="${i % 2 ? Y : V}" stroke-width="8" stroke-linecap="round"/>`)),
  sv(140, `<rect x="4" y="10" width="132" height="44" fill="none" stroke="${T}" stroke-width="5"/><g stroke="${T}" stroke-width="4">${rep(9, i => `<line x1="${4 + i * 16}" y1="54" x2="${20 + i * 16}" y2="10"/>`)}</g>`),
  sv(160, rep(6, i => `<circle cx="${18 + i * 30 - i * i * 1.2}" cy="32" r="${16 - i * 2.2}" fill="${i % 2 ? R : V}"/>`)),
  sv(170, rep(5, i => `<path d="M${18 + i * 33} 14l16 18-16 18-16-18z" fill="${i % 2 ? 'none' : O}" stroke="${O}" stroke-width="4"/>`)),
  sv(180, rep(4, i => `<rect x="${4 + i * 44}" y="20" width="38" height="24" rx="12" fill="${[T, Y, V, R][i]}"/>`)),
  sv(70, rep(4, i => `<rect x="${6 + i * 8}" y="${4 + i * 8}" width="${58 - i * 16}" height="${56 - i * 16}" fill="none" stroke="${i % 2 ? Y : V}" stroke-width="5"/>`)),
  sv(170, `<path d="M4 26q20-18 40 0t40 0 40 0 40 0v14q-20 18-40 0t-40 0-40 0-40 0z" fill="${T}"/>`),
  sv(72, `<path d="M4 4h30a30 30 0 0 1-30 30z" fill="${O}"/><path d="M68 4v30a30 30 0 0 1-30-30z" fill="${V}"/><path d="M4 64V34a30 30 0 0 1 30 30z" fill="${Y}"/><path d="M68 64H38a30 30 0 0 1 30-30z" fill="${T}"/>`),
  sv(150, rep(5, i => `<rect x="${4 + i * 28}" y="${58 - (14 + i * 10)}" width="${18 + i * 2}" height="${14 + i * 10}" fill="${i % 2 ? O : K}"/>`)),
  sv(170, `<path d="M4 40c10 0 14-24 26-24s8 24 0 24 2-24 14-24 8 24 0 24 2-24 14-24 8 24 0 24 2-24 14-24 8 24 0 24 2-24 14-24 8 24 0 24 12 0 22 0" fill="none" stroke="${V}" stroke-width="5" stroke-linecap="round"/>`),
];

// 예전 카드(*강조* 글)는 서식 글로 바꿔서 읽어요
const toHtml = t => esc(t || '').replace(/\*(.+?)\*/g, '<b>$1</b>');
const rebusHtmlOf = c => c.html ?? toHtml(c.text);

// 그림 자리: 씨앗으로 섞은 순서대로(같은 것이 가까이 붙지 않음), 1~3어절마다 한 번.
// 단어를 다 쓰고 띄어 쓴 뒤에만 붙고, 앞쪽 그림은 뒤에 글을 더 써도 바뀌지 않아요 (쓰는 동안 글이 흔들리지 않게)
function objectSpots(text, seed) {
  const r = rng(seed || 1), order = OBJ.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const nextGap = () => 1 + Math.floor(r() * 3);
  let gap = Math.max(2, nextGap()), run = 0, k = 0;
  const out = [];
  for (const m of text.matchAll(/\S+/g)) {
    run++;
    const end = m.index + m[0].length;
    if (run >= gap && end < text.length) { out.push([end, order[k++ % order.length]]); run = 0; gap = nextGap(); }
  }
  return out;
}
const objPos = (root, o) => { const r = document.createRange(); r.selectNodeContents(root); r.setEndBefore(o); return r.toString().length; };
// 글 사이에 그림을 넣거나 맞춰요. 바뀐 게 없으면 손대지 않아요(커서가 그대로). 바꿨으면 true
export function placeObjects(root, seed) {
  const want = objectSpots(root.textContent, seed), have = [...root.querySelectorAll('.o')];
  if (want.length === have.length && have.every((o, i) => +o.dataset.k === want[i][1] && objPos(root, o) === want[i][0])) return false;
  have.forEach(o => o.remove()); root.normalize();
  for (let i = want.length - 1; i >= 0; i--) {
    const [pos, k] = want[i], s = document.createElement('span');
    s.className = 'o'; s.contentEditable = 'false'; s.dataset.k = k; s.innerHTML = OBJ[k];
    const r = rangeAt(root, pos, pos); r.collapse(true); r.insertNode(s);
  }
  return true;
}

// 쓰는 중 브라우저가 넣는 붙은 칸(&nbsp;)은 보여 줄 때 보통 칸으로 (줄이 자연스럽게 바뀌게)
const soft = (h, edit) => edit ? h : h.replace(/&nbsp;/g, ' ');
function rebus(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd rebus' + (edit ? ' edit' : '');
  const html = soft(rebusHtmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [weekday(c.date), dateChip(c.date).split(' ')[0], (c.place || '').trim()].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {};
  el.innerHTML = `<div class="rb body" data-sz="${RB_SIZES[c.size] || RB_SIZES.m}" data-v="${a.v || 't'}" style="text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm">${FORMATS.rebus.sample.html}</div>` : ''}
    <div class="foot" style="font-size:${{ s: 3.5, m: 3.889, l: 4.4 }[c.size] || 3.889}cqw"><span>${foot}</span><span class="sig"></span></div>`;
  placeObjects(el.querySelector('.rb'), c.seed);
  if (edit) placeObjects(el.querySelector('.exm'), FORMATS.rebus.sample.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 그림 문장 글자 크기: 고른 크기 그대로(큰 140 · 중간 116 · 작은 96, 1080 기준). 저절로 줄이지 않아서 쓰는 동안 줄이 흔들리지 않아요.
// 넘치면 카드가 아래로 길어지고 저장할 때 장으로 나뉘어요. 한 장에 들어가면 위 · 가운데 · 아래 자리에 놓아요.
// 카드 높이는 글 높이를 직접 재서 정해요 (아이폰 브라우저는 4:5 상자가 글 따라 늘어나지 않아요)
const RB_SIZES = { l: 140, m: 116, s: 96 };
function fitRebus(el) {
  const p = el.querySelector('.rb'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const ex = el.querySelector('.exm'); if (ex) ex.style.fontSize = px(116);
  const H = W * 1.25;
  p.style.marginTop = ''; p.style.fontSize = px(+p.dataset.sz || 116);
  el.style.height = H + 'px';
  const cs = getComputedStyle(p), top = parseFloat(cs.marginTop), need = p.offsetHeight + top + parseFloat(cs.marginBottom);
  if (need > H + 1) { el.style.height = Math.ceil(need) + 'px'; return; }
  const v = p.dataset.v || 't';
  if (v !== 't') p.style.marginTop = (top + (H - need) * (v === 'b' ? 1 : .5)) + 'px';
}

// ── 글포맷 ────────────────────────────────────────────────
function bgLayer(c, page, pages) {
  const b = findBg(c.bg?.id);
  const { layer, ink } = dimCss(b, c.bg?.dim || 'dark');
  const dim = layer;   // 그라데이션도 배경마다 정해 둔 딤을 깔아 글이 잘 읽혀요
  const shift = pages > 1 ? page / (pages - 1) : .5;
  let base = '';
  if (b.img) base = `<div class="bgi" style="background-image:url(${b.img});background-position:50% ${Math.round(shift * 100)}%"></div>`;
  else if (b.code) base = `<canvas class="bgc" data-seed="${c.bg.seed || 1}" data-shift="${shift}"></canvas>`;
  else base = `<div class="bgi" style="background:${b.css}"></div>`;
  return { html: base + `<div class="dimL" style="background:${dim}"></div>`, ink: (b.img || b.code || c.bg?.dim === 'light') ? ink : b.ink };
}

function text(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd text' + (edit ? ' edit' : '');
  const fo = fontOf(c.font), serif = fo.gen === 'serif';
  const pages = (c.pages?.length ? c.pages : ['']).map(h => soft(h, edit));
  const dp = c.datePos || 'top';
  const info = esc([dateLine(c.date), (c.place || '').trim()].filter(Boolean).join(' · '));
  const ex = FORMATS.text.sample.pages[0].replace(/<[^>]+>/g, '');
  el.innerHTML = pages.map((h, i) => {
    const { html, ink } = bgLayer(c, i, pages.length);
    const date = `<div class="dt" style="font-size:${{ s: 2.8, m: 3.4, l: 4.2 }[c.size] || 3.4}cqw;font-family:${serif ? fontCssOf(fo) : "'Pretendard Variable', sans-serif"}">${info}</div>`;   // 날짜 줄도 글자 크기를 따라가요 (작은 = 예전 크기)
    return `<section class="pg" data-i="${i}" style="color:${ink}">${html}
      <div class="tx" data-k="${fo.k}" data-sz="${SIZES[c.size] || SIZES.m}" style="font-family:${fontCssOf(fo).replace(/"/g, '&quot;')};line-height:${fo.lh};letter-spacing:${fo.ls || 'normal'};justify-content:${{ t: 'flex-start', m: 'center', b: 'flex-end' }[c.align?.v || 'm']};text-align:${{ l: 'left', c: 'center', r: 'right' }[c.align?.h || 'l']}">
        ${dp === 'top' && i === 0 ? date : ''}
        <div class="body" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''} data-ph="${i === 0 ? esc(ex) : '이어서 써 보세요'}">${h}</div>
        ${dp === 'bottom' && i === pages.length - 1 ? date : ''}
      </div></section>`;
  }).join('');
  el.classList.toggle('empty', !pages.join('').replace(/<[^>]+>/g, '').trim() && !pages.join('').includes('class="stk"'));
  hydrate(el);
  return el;
}

// 글이 넘치면 그 장이 아래로 길어지고(쓰는 동안 한 장),
// 저장할 때 줄 단위로 여러 장으로 나눠요. 쓰는 화면에서는 나뉠 자리에 점선을 그어 둬요
function fitText(el) {
  el.querySelectorAll('.pg').forEach(pg => {
    const tx = pg.querySelector('.tx'); if (!tx) return;
    pg.classList.remove('long', 'over'); pg.querySelectorAll('.brk').forEach(b => b.remove());
    // 가운데 정렬은 위로 넘친 부분이 재지지 않아서, 잴 때만 위에서부터 놓아요
    const jc = tx.style.justifyContent; tx.style.justifyContent = 'flex-start';
    const over = () => tx.scrollHeight > tx.clientHeight + 1;
    // 글자 크기는 고른 그대로(중간 = 카드 폭의 6%). 저절로 줄이지 않고, 넘치면 장이 길어져 저장할 때 나뉘어요
    tx.style.fontSize = px((+tx.dataset.sz || 65) * (+tx.dataset.k || 1));
    if (over()) pg.classList.add('long');
    tx.style.justifyContent = jc;
    if (pg.classList.contains('long') && el.classList.contains('edit')) {
      const h = pg.offsetWidth * 1.25, n = Math.ceil(pg.offsetHeight / h - .02);
      for (let k = 1; k < n; k++) pg.insertAdjacentHTML('beforeend', `<div class="brk" style="top:${(k * 100 / n).toFixed(2)}%"><span>${k + 1}</span></div>`);
    }
  });
  el.querySelectorAll('canvas.bgc').forEach(cv => {
    const w = cv.clientWidth; if (!w) return;
    const k = Math.min(2, window.devicePixelRatio || 1), W = Math.round(w * k), H = Math.min(Math.round(cv.clientHeight * k) || Math.round(W * 1.25), Math.round(W * 16 / 9));
    const key = [cv.dataset.seed, cv.dataset.shift, H].join();
    if (cv.width === W && cv.dataset.done === key) return;
    cv.width = W; cv.height = H; drawCode(cv, +cv.dataset.seed, +cv.dataset.shift); cv.dataset.done = key;
  });
}

export const FORMATS = {
  rebus: {
    id: 'rebus', name: '그림 문장', info: '짧은 글 · 사진 없음 · 사계절', paid: true,
    // 쓰기 화면 도구: style = 서식 줄(글꼴·크기·좌우·위아래), bg = 배경 줄, dp = 날짜 위치. 디자인 포맷은 모양이 정해져 있어 대부분 꺼요
    tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: false, dp: false },
    sample: { html: '친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.', seed: 7 },
    render: rebus, fit: fitRebus,
  },
  text: {
    id: 'text', name: '글', info: '모든 길이 · 배경 고르기 · 무료', paid: false,
    tools: { photo: false, emo: true, page: true, shuf: 'code', style: true, font: true, bg: true, dp: true },
    sample: { pages: ['출근길에 버스를 한 대 놓쳤는데 덕분에 하늘을 오래 봤다. 오늘은 그걸로 됐다.'], bg: { id: 'g1', dim: 'dark' } },
    render: text, fit: fitText,
  },
};
export const ORDER = ['rebus', 'text'];

export function blank(fmt, date) {
  return fmt === 'rebus'
    ? { fmt, date, place: '', html: '', seed: newSeed(), size: 'm', align: { h: 'l', v: 't' } }
    : { fmt, date, place: '', pages: [''], bg: { id: 'g1', dim: 'dark', seed: newSeed() }, align: { h: 'l', v: 'm' }, datePos: 'top', font: 'serif', size: 'm' };
}
export const sampleCard = (fmt, date) => ({ ...blank(fmt, date), ...structuredClone(FORMATS[fmt].sample), sample: true });

export function renderCard(c, opt) { return FORMATS[c.fmt].render(c, opt || {}); }
export function fitCard(el, c) { FORMATS[c.fmt].fit(el); }
// 줄(div·h2·h3·li)과 <br>은 줄바꿈으로: 요약 글에서 줄끼리 붙지 않게
const plain = h => { const d = document.createElement('div'); d.innerHTML = (h || '').replace(/<br\s*\/?>|<\/(div|h2|h3|li|p)>/gi, m => m + '\n'); return d.textContent; };
export const cardText = c => c.fmt === 'rebus' ? plain(rebusHtmlOf(c)) : (c.pages || []).map(plain).join('\n');
// 피드 바탕에 은은하게 번지는 색: 카드의 대표 색
export function toneOf(c) {
  if (c.fmt === 'rebus') return V;
  const b = findBg(c.bg?.id);
  return b.tone || (b.css.match(/#[0-9a-fA-F]{6}/g) || ['#444444'])[b.css.startsWith('#') ? 0 : 1] || '#444444';
}
