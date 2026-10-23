// 포맷 = 데이터 + 그리기. 카드는 가로 1080 기준으로 디자인하고 cqw 단위로 그려서, 화면 크기와 저장 이미지가 같은 모양이에요
import { find as findBg, dimCss, drawCode } from './bg.js';
import { bgUrl, keyOf, GRAPHIC } from './filters.js';
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

// 그림마다 제 모양대로 움직여요 (피드 가운데 카드만): sway 물결 · 선이 옆으로 살랑, dash 점선이 흘러감, tw 조각이 하나씩 반짝,
// spin 제자리에서 천천히 돎, pulse 숨 쉬듯, rise 막대 · 계단이 차례로 차오름. 그림 자리는 그대로
const MOTION = ['sway', 'tw', 'sway', 'tw', 'sway', 'dash', 'tw', 'tw', 'sway', 'pulse', 'tw', 'tw', 'sway', 'tw', 'tw',
  'rise', 'sway', 'dash', 'spin', 'tw', 'sway', 'tw', 'tw', 'tw', 'spin', 'sway', 'spin', 'sway', 'rise'];

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
    s.className = 'o'; s.contentEditable = 'false'; s.dataset.k = k; s.dataset.m = MOTION[k] || 'tw'; s.innerHTML = OBJ[k];
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
  const foot = [`${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}`, (c.place || '').trim()].filter(Boolean).map(esc).join(' · ');   // 10.22 목요일 · 장소 (글포맷처럼 날짜 먼저)
  const a = c.align || {}, ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']}`;
  el.dataset.dp = c.datePos || 'bottom';
  el.innerHTML = `<div class="rb body" data-sz="${RB_SIZES[c.size] || RB_SIZES.m}" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${FORMATS.rebus.sample.html}</div>` : ''}
    <div class="foot" style="font-size:${{ s: 3.5, m: 3.889, l: 4.4 }[c.size] || 3.889}cqw"><span>${foot}</span><span class="sig"></span></div>`;
  placeObjects(el.querySelector('.rb'), c.seed);
  el.querySelectorAll('.o').forEach(o => { o.dataset.m = MOTION[o.dataset.k] || 'tw'; });   // 예전에 저장된 그림도 움직임 종류를 붙여요
  if (edit) placeObjects(el.querySelector('.exm'), FORMATS.rebus.sample.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 그림 문장 글자 크기: 고른 크기 그대로(큰 140 · 중간 116 · 작은 96, 1080 기준). 저절로 줄이지 않아서 쓰는 동안 줄이 흔들리지 않아요.
// 넘치면 카드가 아래로 길어지고 저장할 때 장으로 나뉘어요. 한 장에 들어가면 위 · 가운데 · 아래 자리에 놓아요.
// 쓰는 중(키보드 올라옴)에는 늘 위에서부터: 줄이 늘어도 글이 밀리지 않게. 고른 자리는 키보드를 내리면 적용돼요.
// 빈 카드에서는 흐린 예시 글이 고른 크기 · 자리를 그대로 따라가요 (누르면 바로 보이게)
// 카드 높이는 글 높이를 직접 재서 정해요 (아이폰 브라우저는 4:5 상자가 글 따라 늘어나지 않아요)
const RB_SIZES = { l: 140, m: 116, s: 96 };
export const RB_M = { bottom: [72, 170], top: [170, 72], none: [72, 72] };   // 날짜 줄 자리만큼 글 위 · 아래 여백 (1080 기준)
function fitRebus(el) {
  const p = el.querySelector('.rb'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, H = W * 1.25, [mt, mb] = RB_M[el.dataset.dp] || RB_M.bottom;
  const ex = el.querySelector('.exm'), box = ex && el.classList.contains('empty') ? ex : p;
  p.style.fontSize = px(+p.dataset.sz || 116); if (ex) ex.style.fontSize = p.style.fontSize;
  p.style.marginBottom = px(mb);
  const need = box.offsetHeight + (mt + mb) * s;
  let top = mt * s;
  if (need > H + 1) el.style.height = Math.ceil(need) + 'px';
  else {
    el.style.height = H + 'px';
    const v = el.closest('.wr.typ') ? 't' : p.dataset.v || 't';
    if (v !== 't') top += (H - need) * (v === 'b' ? 1 : .5);
  }
  p.style.marginTop = top + 'px'; if (ex) ex.style.marginTop = top + 'px';
}

// ── 글포맷 ────────────────────────────────────────────────
// 장마다 배경 · 글 위치를 따로 둘 수 있어요 (c.pst[i]). 없으면 카드 값 (글꼴 · 크기 · 날짜는 늘 카드 전체)
export const pageBg = (c, i) => c.pst?.[i]?.bg || c.bg;
export const pageAlign = (c, i) => c.pst?.[i]?.align || c.align || {};
const PH_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="15" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m18 15-4-4-8 8"/><path d="M21 3v6M18 6h6"/></svg>';
function bgLayer(c, page, pages) {
  const cb = pageBg(c, page), b = findBg(cb?.id);
  const { layer, ink } = dimCss(b, cb?.dim || 'dark');
  let dim = layer;   // 그라데이션도 배경마다 정해 둔 딤을 깔아 글이 잘 읽혀요
  if (c.fmt === 'photo' && cb?.dim !== 'light') {   // 포토 포맷: 사진이 주인공이라 글이 놓인 쪽만 어둡게
    const v = pageAlign(c, page).v || 'b';
    dim = v === 'm' ? 'rgba(0,0,0,.28)' : `linear-gradient(${v === 't' ? '180deg' : '0deg'}, rgba(0,0,0,.52), rgba(0,0,0,.1) 62%)`;
  }
  const shift = pages > 1 ? page / (pages - 1) : .5;
  let base = '';
  if (b.photo) {   // 내 사진: 고른 위치 그대로 (장으로 나뉘어도). 포토 포맷은 카드 필터 · 노이즈를 건 사진으로
    const fid = c.fmt === 'photo' ? c.filter : null, u = bgUrl(cb, fid);
    base = u ? `<div class="bgi ph" data-fk="${keyOf(cb, fid)}" style="background-image:url(${u});background-position:${cb.x ?? 50}% ${cb.y ?? 50}%"></div>`
      : `<div class="bgi ph none"></div>${c.fmt === 'photo' ? `<button class="phadd" type="button" aria-label="사진 고르기">${PH_ICON}</button>` : ''}`;   // 아직 사진이 없는 장
  }
  else if (b.img) base = `<div class="bgi" style="background-image:url(${b.img});background-position:50% ${Math.round(shift * 100)}%"></div>`;
  else if (b.code) base = `<canvas class="bgc" data-seed="${cb.seed || 1}" data-shift="${shift}"${cb.grain === false ? ' data-gr="0"' : ''}></canvas>`;
  else base = `<div class="bgi" style="background:${b.css}"></div>`;
  const gfx = c.fmt === 'photo' && GRAPHIC.has(c.filter) && cb?.dim !== 'light' ? '<div class="dimL" style="background:rgba(0,0,0,.18)"></div>' : '';   // 그래픽 필터는 점이 굵어 글 뒤를 조금 더
  return { html: base + `<div class="dimL" style="background:${dim}"></div>` + gfx, ink: (b.img || b.code || b.photo || cb?.dim === 'light') ? ink : b.ink };
}

function text(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd text' + (c.fmt === 'art' ? ' art' : '') + (edit ? ' edit' : '');
  const fo = fontOf(c.font);
  const pages = (c.pages?.length ? c.pages : ['']).map(h => soft(h, edit));
  const dp = c.datePos || 'top';   // 예전 카드는 위. 새 글카드는 없음에서 시작해요(blank)
  const info = esc([dateLine(c.date), (c.place || '').trim()].filter(Boolean).join(' · '));
  const ex = (FORMATS[c.fmt] || FORMATS.text).sample.pages[0].replace(/<[^>]+>/g, '');
  el.innerHTML = pages.map((h, i) => {
    const { html, ink } = bgLayer(c, i, pages.length);
    const date = `<div class="dt" style="font-size:${(({ s: 2.8, m: 3.4, l: 4.2 }[c.size] || 3.4) * fo.k).toFixed(3)}cqw;font-family:${fontCssOf(fo).replace(/"/g, '&quot;')}${fo.id === 'sans' ? '' : ';letter-spacing:.04em'}">${info}</div>`;   // 날짜 줄도 카드 글꼴 · 글자 크기를 따라가요 (글꼴마다 크기 보정)
    return `<section class="pg" data-i="${i}" style="color:${ink}">${html}
      <div class="tx" data-k="${fo.k}" data-sz="${SIZES[c.size] || SIZES.m}" style="font-family:${fontCssOf(fo).replace(/"/g, '&quot;')};line-height:${fo.lh};letter-spacing:${fo.ls || 'normal'};justify-content:${{ t: 'flex-start', m: 'center', b: 'flex-end' }[pageAlign(c, i).v || 'm']};text-align:${{ l: 'left', c: 'center', r: 'right' }[pageAlign(c, i).h || 'l']}">
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
// 글이 놓인 줄들(위 · 아래 위치). 글자 · 그림 · 날짜 줄을 모아 겹치는 것끼리 한 줄로
export function lines(root) {
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
export function starts(ls, avail) {
  const s = [0]; let base = 0;
  for (const [t, b] of ls) if (b - base > avail && t > base) { base = t; s.push(t); }
  return s;
}
// 내 사진은 늘 4:5 한 장 크기로 깔아요. 긴 장은 저장할 때 나뉘는 자리마다 같은 사진을 한 장씩 (쓰는 화면 = 저장 결과)
function photoTiles(pg, tx) {
  pg.querySelectorAll('.bgi.ph.more').forEach(b => b.remove());
  const ph = pg.querySelector('.bgi.ph'); if (!ph) return;
  const W = pg.offsetWidth, H = W * 1.25;
  ph.style.height = pg.classList.contains('long') ? H + 'px' : '';
  if (!pg.classList.contains('long')) return;
  const pad = parseFloat(getComputedStyle(tx).paddingTop);
  starts(lines(tx).map(([t, b]) => [t - pad, b - pad]), H - 2 * pad).slice(1).forEach(off => {
    const m = ph.cloneNode(); m.classList.add('more'); m.style.top = (pad + off) + 'px'; ph.after(m);
  });
}
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
    photoTiles(pg, tx);
    // 쓰는 화면: 저장할 때 나뉠 자리(줄 사이)에 점선. 저장과 같은 방법으로 재서 장 수가 같아요
    if (pg.classList.contains('long') && el.classList.contains('edit')) {
      const pad = parseFloat(getComputedStyle(tx).paddingTop), st = starts(lines(tx).map(([t, b]) => [t - pad, b - pad]), pg.offsetWidth * 1.25 - 2 * pad);
      st.slice(1).forEach((off, k) => pg.insertAdjacentHTML('beforeend', `<div class="brk" style="top:${(pad + off - 4).toFixed(1)}px"><span>${k + 2}</span></div>`));
    }
  });
  el.querySelectorAll('canvas.bgc').forEach(cv => {
    const w = cv.clientWidth; if (!w) return;
    const k = Math.min(3, window.devicePixelRatio || 1), W = Math.round(w * k), H = Math.min(Math.round(cv.clientHeight * k) || Math.round(W * 1.25), Math.round(W * 16 / 9));
    const key = [cv.dataset.seed, cv.dataset.shift, H, cv.dataset.gr].join();
    if (cv.width === W && cv.dataset.done === key) return;
    cv.width = W; cv.height = H; drawCode(cv, +cv.dataset.seed, +cv.dataset.shift); cv.dataset.done = key;
  });
}

export const FORMATS = {
  rebus: {
    id: 'rebus', name: '그림 문장', info: '짧은 글 · 사진 없음 · 사계절', paid: true,
    // 쓰기 화면 도구: style = 서식 줄(글꼴·크기·좌우·위아래), bg = 배경 줄, dp = 날짜 위치. 디자인 포맷은 모양이 정해져 있어 대부분 꺼요
    tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: false, dp: true },
    sample: { html: '친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.', seed: 7 },
    render: rebus, fit: fitRebus,
  },
  text: {
    id: 'text', name: '글', info: '모든 길이 · 배경 고르기 · 무료', paid: false,
    tools: { photo: false, emo: true, page: true, shuf: 'code', style: true, font: true, bg: true, dp: true },
    sample: { pages: ['출근길에 버스를 한 대 놓쳤는데 덕분에 하늘을 오래 봤다. 오늘은 그걸로 됐다.'], bg: { id: 'g1', dim: 'dark' } },
    render: text, fit: fitText, rich: true,
  },
  // 아트 포맷 #1: 앤드류 작품(세로 오로라 빛줄기)을 코드로. 그림이 작품이라 배경은 정해 두고 셔플로 새 그림, 글꼴은 고를 수 있어요
  art: {
    id: 'art', name: '번지는 빛', info: '아트 · 셔플할 때마다 새 그림 · 흐르는 빛', paid: true, rich: true,
    tools: { photo: false, emo: false, page: true, shuf: true, style: true, font: true, bg: 'art', dp: true },
    sample: { pages: ['창밖 불빛이 번져 보이는 밤. 오늘 하루도 천천히 흘러갔다.'], bg: { id: 'bands', dim: 'dark', seed: 11 } },
    render: text, fit: fitText,
  },
  // 포토 포맷 #1: 내 사진이 카드를 가득 채우고 글은 그 위에. 틀 없이 필터가 핵심 (영상은 다음 단계)
  photo: {
    id: 'photo', name: '포토', info: '내 사진 · 필터 20개 · 장마다 다른 사진', paid: true, rich: true,
    tools: { photo: true, emo: true, page: true, shuf: false, filter: true, style: true, font: true, bg: 'photo', dp: true },
    sample: { pages: ['바다 앞에 앉아 해가 지는 걸 끝까지 봤다. 오늘은 이걸로 됐다.'], bg: { id: 'photo', src: 'bg/photo-sample.webp', w: 1080, h: 1350, dim: 'dark', tone: '#3a3550' }, filter: 'film', align: { h: 'l', v: 'b' } },
    render: text, fit: fitText,
  },
};
export const ORDER = ['rebus', 'art', 'photo', 'text'];

export function blank(fmt, date) {
  if (fmt === 'photo') return { fmt, date, place: '', pages: [''], bg: { id: 'photo', dim: 'dark' }, filter: 'none', align: { h: 'l', v: 'b' }, datePos: 'none', font: 'serif', size: 'm' };
  if (fmt === 'art') return { fmt, date, place: '', pages: [''], bg: { id: 'bands', dim: 'dark', seed: newSeed() }, align: { h: 'l', v: 'm' }, datePos: 'none', font: 'sans', size: 'm' };
  return fmt === 'rebus'
    ? { fmt, date, place: '', html: '', seed: newSeed(), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }
    : { fmt, date, place: '', pages: [''], bg: { id: 'g1', dim: 'dark', seed: newSeed() }, align: { h: 'l', v: 'm' }, datePos: 'none', font: 'serif', size: 'm' };
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
  if (b.photo) return c.bg.tone || b.tone;
  return b.tone || (b.css.match(/#[0-9a-fA-F]{6}/g) || ['#444444'])[b.css.startsWith('#') ? 0 : 1] || '#444444';
}
