// 포맷 = 데이터 + 그리기. 카드는 가로 1080 기준으로 디자인하고 cqw 단위로 그려서, 화면 크기와 저장 이미지가 같은 모양이에요
import { find as findBg, dimCss, drawCode } from './bg.js';
import { bgUrl, keyOf, fidOf, grainLv, GRAPHIC } from './filters.js';
import { rangeAt } from './rich.js';
import { hydrate } from './stickers.js';
import { fontOf, fontCssOf, SIZES } from './fonts.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const px = n => `${(n / 10.8).toFixed(3)}cqw`; // 1080 디자인 px → cqw

export function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const newSeed = () => Math.floor(Math.random() * 1e9);
// 예전 카드(*강조* 글)는 서식 글로 바꿔서 읽어요. 한 덩어리 글(html)로 쓰는 템플릿이 같이 써요
const toHtml = t => esc(t || '').replace(/\*(.+?)\*/g, '<b>$1</b>');
export const htmlOf = c => c.html ?? toHtml(c.text);
const rebusHtmlOf = htmlOf;
// 쓰는 중 브라우저가 넣는 붙은 칸(&nbsp;)은 보여 줄 때 보통 칸으로 (줄이 자연스럽게 바뀌게)
export const soft = (h, edit) => edit ? h : h.replace(/&nbsp;/g, ' ');

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const WDL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const parse = d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd); };
// 카드 날짜 줄: 설정 '날짜 표시'에서 고른 모양 (dot 2026. 10. 29 · 목 / ko 2026년 10월 29일 목요일 / md 10월 29일 목)
export const DATE_FMT = ['dot', 'ko', 'md'];
export const dateFmt = () => { try { return JSON.parse(localStorage.getItem('dz.pref.v1') || '{}').dateFmt || 'dot'; } catch { return 'dot'; } };
export const dateLine = (d, f = dateFmt()) => { const x = parse(d), y = x.getFullYear(), m = x.getMonth() + 1, dd = x.getDate(), w = x.getDay();
  return f === 'ko' ? `${y}년 ${m}월 ${dd}일 ${WDL[w]}` : f === 'md' ? `${m}월 ${dd}일 ${WD[w]}` : `${y}. ${m}. ${dd} · ${WD[w]}`; };
export const weekday = d => WDL[parse(d).getDay()];
export const dateChip = d => { const x = parse(d); return `${x.getMonth() + 1}.${String(x.getDate()).padStart(2, '0')} ${WD[x.getDay()]}`; };

// 비율: 4:5(기본) · 9:16 · 1:1. 쓰기에서 고르고, 피드 · 저장 이미지가 그 비율 그대로예요
export const AR = { 45: 1.25, 916: 16 / 9, 11: 1, 32: 2 / 3, 169: 9 / 16 };   // 세로 ÷ 가로. 가로형 3:2 · 16:9 (11-04)
export const RATIOS = [['45', '4:5'], ['916', '9:16'], ['11', '1:1'], ['32', '3:2'], ['169', '16:9']];
export const arOf = c => AR[c?.ratio] || 1.25;
export const shape = (el, ar) => { el.dataset.ar = ar; el.classList.toggle('r916', ar > 1.5); el.classList.toggle('r11', ar < 1.1 && ar > .95); el.classList.toggle('r32', ar <= .95 && ar > .6); el.classList.toggle('r169', ar <= .6); el.classList.toggle('rw', ar <= .95); return el; };
// 정보 줄 = 날짜 · 장소 (각각 켜고 끄기), 자리는 위 · 아래. 서명은 늘 맨 아래 왼쪽 · 가운데 · 오른쪽 (모든 장)
export const dateOn = c => c.showDate ?? (!!c.datePos && c.datePos !== 'none');
export const placeOn = c => dateOn(c) && !!(c.place || '').trim() && !c.placeOff;   // 장소는 날짜 줄에 같이 (줄을 끄면 같이 숨어요)
export const dhOf = c => ({ l: 'left', c: 'center', r: 'right' }[c.dh] || 'left');   // 날짜 줄 좌 · 중 · 우
export const infoPos = c => c.datePos === 'top' || c.datePos === 'bottom' ? c.datePos : FORMATS[c.fmt]?.datePos || 'top';
export const signOf = c => c.sg && (c.signTxt || '').trim() ? c.sg : '';
// 글자 크기 5단계 · 줄 간격 3단계 · 위아래 5자리
export const SIZE5 = ['xs', 's', 'm', 'l', 'xl'];
export const LH = { s: .86, m: 1, l: 1.16 };
export const V5 = ['t', 'tm', 'm', 'bm', 'b'];
const DL = { xs: 2.5, s: 2.8, m: 3.4, l: 4.2, xl: 4.8 };   // 날짜 줄 · 서명 크기 (cqw)


// ── 글포맷 ────────────────────────────────────────────────
// 장마다 배경 · 글 위치를 따로 둘 수 있어요 (c.pst[i]). 없으면 카드 값 (글꼴 · 크기 · 날짜는 늘 카드 전체)
export const pageBg = (c, i) => c.pst?.[i]?.bg || c.bg;
export const pageAlign = (c, i) => c.pst?.[i]?.align || c.align || {};
const PH_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="15" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m18 15-4-4-8 8"/><path d="M21 3v6M18 6h6"/></svg>';
// 직접 고른 색(hex): 밝은 색이면 글이 어둡게
const lum = h => { if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + [...h.slice(1)].map(x => x + x).join('');   // #fff 같은 짧은 색도
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return .2126 * r + .7152 * g + .0722 * b; };
export const inkOn = hex => lum(hex) > .62 ? '#1E1D1B' : '#fff';
export const hexBg = hex => ({ id: 'hex', name: '직접 색', css: hex, tone: hex, ink: inkOn(hex), dim: ['all', '0,0,0', 0] });
// 딤: 약(배경마다 정해 둔 딤) · 중 · 강. 중 · 강은 검게 한 겹 더 덮어요
export const dimLv = d => d === 'd3' ? 3 : d === 'd2' ? 2 : 1;
const EXTRA = { 1: 0, 2: .2, 3: .4 };
// 사진 키우기 (b.z 1~2배, 줄이기는 없어요): 꽉 채운 크기에서 그만큼 크게. 칸(가로:세로 = 1:ar)보다 옆으로 긴 사진은 높이 기준
export const zoomOf = b => Math.max(1, Math.min(2, +b?.z || 1));
export const zoomCss = (b, ar) => { const z = zoomOf(b); if (z === 1 || !b.w || !b.h) return ''; const p = (z * 100).toFixed(1) + '%'; return `;background-size:${b.w / b.h > 1 / ar ? 'auto ' + p : p + ' auto'}`; };
// 색 배경 노이즈: 한 번 만든 고운 점 그림을 깔아요 (약 · 중 · 강 = 진하기). 저장 이미지에도 그대로 들어가요
let grainPng = '';
const grainUrl = () => {
  if (grainPng || typeof document === 'undefined') return grainPng;
  const n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const x = cv.getContext('2d'), im = x.createImageData(n, n), r = rng(20261030);
  for (let i = 0; i < n * n; i++) { const v = r() < .5 ? 0 : 255; im.data.set([v, v, v, Math.round(r() * 46)], i * 4); }
  x.putImageData(im, 0, 0); return (grainPng = cv.toDataURL('image/png'));
};
const GR_OP = [0, .35, .5, .7];   // 11-04: 2단계가 강해서 전체를 낮췄어요 (새 중간 ≈ 예전 약)
const grainLayer = cb => { const lv = grainLv(cb); return lv ? `<div class="bgi grn" style="background-image:url(${grainUrl()});background-size:24cqw;opacity:${GR_OP[lv]}"></div>` : ''; };
function bgLayer(c, page, pages) {
  const cb = pageBg(c, page), b = cb?.id === 'hex' && cb.hex ? hexBg(cb.hex) : findBg(cb?.id);
  const { layer, ink } = dimCss(b, cb?.dim === 'light' ? 'light' : 'dark');
  let dim = layer;   // 그라데이션도 배경마다 정해 둔 딤을 깔아 글이 잘 읽혀요
  if (b.photo && cb?.dim !== 'light') {   // 내 사진 · 영상인 장: 사진이 주인공이라 글이 놓인 쪽만 어둡게
    const v = { tm: 't', bm: 'b' }[pageAlign(c, page).v] || pageAlign(c, page).v || 'b';
    dim = v === 'm' ? 'rgba(0,0,0,.28)' : `linear-gradient(${v === 't' ? '180deg' : '0deg'}, rgba(0,0,0,.52), rgba(0,0,0,.1) 62%)`;
  }
  const shift = pages > 1 ? page / (pages - 1) : .5;
  let base = '';
  if (b.photo) {   // 내 사진: 고른 위치 그대로 (장으로 나뉘어도). 카드 필터 · 노이즈를 건 사진으로
    const fid = fidOf(c), u = bgUrl(cb, fid);
    base = u ? `<div class="bgi ph" data-fk="${keyOf(cb, fid)}" style="background-image:url(${u});background-position:${cb.x ?? 50}% ${cb.y ?? 50}%${zoomCss(cb, arOf(c))}"></div>`
      : `<div class="bgi ph none"></div><button class="phadd" type="button" aria-label="사진 고르기">${PH_ICON}</button>`;   // 아직 사진이 없는 장
    if (u && cb.vd) base += '<canvas class="bgv"></canvas>';   // 영상: 커버 위에서 재생 (재생 중인 카드만 그려요)
  }
  else if (b.img) base = `<div class="bgi" style="background-image:url(${b.img});background-position:50% ${Math.round(shift * 100)}%"></div>`;
  else if (b.code) base = `<canvas class="bgc" data-seed="${cb.seed || 1}" data-shift="${shift}"${cb.grain === false ? ' data-gr="0"' : ''}></canvas>`;
  else base = `<div class="bgi" style="background:${b.css}"></div>${grainLayer(cb)}`;   // 색 배경도 노이즈 (사진은 사진에 구워 넣어요)
  const gfx = b.photo && GRAPHIC.has(c.filter) && cb?.dim !== 'light' ? '<div class="dimL" style="background:rgba(0,0,0,.18)"></div>' : '';   // 그래픽 필터는 점이 굵어 글 뒤를 조금 더
  const ex = EXTRA[dimLv(cb?.dim)];
  let tink = (b.img || b.code || b.photo || cb?.dim === 'light') ? ink : b.ink;
  if (ex >= .4 && tink !== '#fff') tink = '#fff';   // 파스텔 · 밝은 색도 딤 강이면 흰 글
  const more = ex ? `<div class="dimL" style="background:rgba(0,0,0,${ex})"></div>` : '';   // 딤은 늘 어둡게 덮어요 (앤드류 10-28)
  return { html: base + `<div class="dimL" style="background:${dim}"></div>` + gfx + more, ink: tink };
}

function text(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd text' + (FORMATS[c.fmt]?.cls ? ' ' + FORMATS[c.fmt].cls : '') + (edit ? ' edit' : '');
  const fo = fontOf(c.font);
  const pages = (c.pages?.length ? c.pages : ['']).map(h => soft(h, edit));
  const dp = infoPos(c), sg = signOf(c), dl = ((DL[c.size] || DL.m) * fo.k).toFixed(3);
  const info = esc([dateOn(c) ? dateLine(c.date) : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).join(' · '));
  const ff = fontCssOf(fo).replace(/"/g, '&quot;'), ls = fo.id === 'sans' ? '' : ';letter-spacing:.04em';
  shape(el, arOf(c));
  const ex = c.ex?.t || (FORMATS[c.fmt] || FORMATS.text).sample.pages[0].replace(/<[^>]+>/g, '');   // 새 카드마다 고른 질문 · 문장 (prompts.js)
  el.innerHTML = pages.map((h, i) => {
    const { html, ink } = bgLayer(c, i, pages.length);
    const date = info ? `<div class="dt ${dp === 'top' ? 'dup' : 'ddn'}" style="text-align:${dhOf(c)};font-size:${dl}cqw;font-family:${ff}${ls}">${info}</div>` : '';   // 날짜 줄도 카드 글꼴 · 글자 크기를 따라가요 (글꼴마다 크기 보정)
    const sig = sg ? `<div class="sgn" data-h="${sg}" style="font-size:${dl}cqw;font-family:${ff}${ls}">${esc(c.signTxt)}</div>` : '';   // 서명: 모든 장 맨 아래
    return `<section class="pg${sg ? ' hsg' : ''}" data-i="${i}" style="color:${c.ink || ink};--dl:${dl}cqw">${html}
      <div class="tx" data-k="${fo.k}" data-sz="${SIZES[c.size] || SIZES.m}" data-v="${pageAlign(c, i).v || 'm'}" style="${pageAlign(c, i).x != null ? `--dx:${+pageAlign(c, i).x || 0};--dy:${+pageAlign(c, i).y || 0};` : ''}font-family:${ff};line-height:${(fo.lh * (LH[c.lh] || 1)).toFixed(3)};letter-spacing:${fo.ls || 'normal'};text-align:${{ l: 'left', c: 'center', r: 'right' }[pageAlign(c, i).h || 'l']}${c.bold ? ';font-weight:700' : ''}">
        ${dp === 'top' && i === 0 ? date : ''}
        <div class="body" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''} data-ph="${i === 0 ? esc(ex) : '이어서 써 보세요'}">${h}</div>
        ${dp === 'bottom' && i === pages.length - 1 ? date : ''}
      </div>${sig}</section>`;
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
  const W = pg.offsetWidth, H = W * (+pg.closest('.cd')?.dataset.ar || 1.25);
  ph.style.height = pg.classList.contains('long') ? H + 'px' : '';
  if (!pg.classList.contains('long')) return;
  const cs = getComputedStyle(tx), pad = parseFloat(cs.paddingTop);
  starts(lines(tx).map(([t, b]) => [t - pad, b - pad]), H - pad - parseFloat(cs.paddingBottom)).slice(1).forEach(off => {
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
      const cs = getComputedStyle(tx), pad = parseFloat(cs.paddingTop), st = starts(lines(tx).map(([t, b]) => [t - pad, b - pad]), pg.offsetWidth * (+el.dataset.ar || 1.25) - pad - parseFloat(cs.paddingBottom));
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

// 그리는 틀. 기본(글 + 포토)만 앱 안에 있고, 템플릿 틀은 저마다 폴더(app/new/tpl/<틀>/tpl.js)에 있어서 볼 때만 불러와요
export const FORMATS = {
  // 기본: 글 + 포토 (10-30 합침). 색 배경은 무료, 내 사진 · 영상은 저장 양에 따라 유료(결제 붙일 때). 필터는 사진 · 영상인 장에서만
  text: {
    id: 'text', name: '기본', info: '모든 길이 · 색 · 내 사진 · 영상', paid: false,
    tools: { photo: false, emo: true, page: true, shuf: 'code', filter: 'photo', style: true, font: true, bg: true, dp: true },
    sample: { pages: ['출근길에 버스를 한 대 놓쳤는데 덕분에 하늘을 오래 봤다. 오늘은 그걸로 됐다.'], bg: { id: 'g1', dim: 'dark' } },
    render: text, fit: fitText, rich: true,
  },
};
// 템플릿 틀이 같이 쓰는 공용 그리기 (장으로 쓰는 글 카드)
export { text as renderText, fitText };
// 틀 불러오기: 한 번만, 실패하면 이번에는 다시 안 해요 (빈 자리로 보여요)
const LOAD = {}, BAD = new Set(), FAILS = [];
export const onFail = f => FAILS.push(f);   // 틀 폴더가 없을 때 (템플릿 목록에서 빼요)
const css = href => new Promise(ok => { if (document.querySelector(`link[href="${href}"]`)) return ok(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = () => ok(); document.head.appendChild(l); });
export const failed = f => BAD.has(f);
export function ensure(f) {
  if (FORMATS[f]) return Promise.resolve(true);
  if (!/^[a-z0-9-]{2,40}$/.test(f || '') || BAD.has(f)) return Promise.resolve(false);
  return LOAD[f] ||= import(`../tpl/${f}/tpl.js`).then(async m => {
    const d = m.default; if (!d || typeof d.render !== 'function') throw new Error('bad template ' + f);
    if (d.css) await css(new URL(`../tpl/${f}/tpl.css`, import.meta.url).href);
    FORMATS[f] = { fit() {}, ...d, id: f }; return true;
  }).catch(e => { console.warn(e); BAD.add(f); delete LOAD[f]; FAILS.forEach(cb => cb(f)); return false; });
}
// 화면에 필요한 틀이 다 있는지 (없는 것 목록, 실패한 건 빼고)
export const missing = fmts => [...new Set(fmts)].filter(f => f && !FORMATS[f] && !BAD.has(f));
export const ORDER = ['rebus', 'art', 'text'];
// 피드 · 쓰기 위에 보이는 '종류 · 템플릿'
export const LABEL = { text: '기본', rebus: '디자인 · 멤피스 문장', art: '아트 · 오로라 커튼' };

export function blank(fmt, date) {
  const d = FORMATS[fmt];
  if (d?.blank) return { fmt, date, place: '', ...d.blank() };
  return { fmt, date, place: '', pages: [''], bg: { id: 'g1', dim: 'dark', seed: newSeed() }, align: { h: 'l', v: 'm' }, datePos: 'none', font: 'serif', size: 'm' };
}
export const sampleCard = (fmt, date) => ({ ...blank(fmt, date), ...structuredClone(FORMATS[fmt]?.sample || {}), sample: true });

// 틀이 아직 없으면(불러오는 중 · 실패) 같은 비율의 빈 자리. 다 불러오면 그 자리에서 카드로 바뀌어요
function waitCard(c, opt) {
  const el = shape(document.createElement('div'), arOf(c)); el.className += ' cd wait'; el.style.aspectRatio = `1 / ${arOf(c)}`;
  ensure(c.fmt).then(ok => { if (!ok || !el.isConnected) return; const n = renderCard(c, opt); el.replaceWith(n); requestAnimationFrame(() => fitCard(n, c)); });
  return el;
}
// 한 덩어리 글로 쓰는 틀: 쓰는 중 낱말 사이 그림 붙이기 · 저장할 때 위아래 여백
export const placeObjects = (root, seed, fmt) => FORMATS[fmt]?.place?.(root, seed) || false;
export const rbMargins = (el, fmt) => FORMATS[fmt]?.margins?.(el) || [72, 72];
export function renderCard(c, opt) { return FORMATS[c.fmt] ? FORMATS[c.fmt].render(c, opt || {}) : waitCard(c, opt); }
export function fitCard(el, c) { if (!el.classList.contains('wait')) FORMATS[c.fmt]?.fit(el); }
// 줄(div·h2·h3·li)과 <br>은 줄바꿈으로: 요약 글에서 줄끼리 붙지 않게
const plain = h => { const d = document.createElement('div'); d.innerHTML = (h || '').replace(/<br\s*\/?>|<\/(div|h2|h3|li|p)>/gi, m => m + '\n'); return d.textContent; };
export const cardText = c => c.pages ? c.pages.map(plain).join('\n') : plain(rebusHtmlOf(c));
// 피드 바탕에 은은하게 번지는 색: 카드의 대표 색
export function toneOf(c) {
  const own = FORMATS[c.fmt]?.tone?.(c); if (own) return own;
  if (c.bg?.id === 'hex' && c.bg.hex) return c.bg.hex;
  const b = findBg(c.bg?.id);
  if (b.photo) return c.bg.tone || b.tone;
  return b.tone || (b.css.match(/#[0-9a-fA-F]{6}/g) || ['#444444'])[b.css.startsWith('#') ? 0 : 1] || '#444444';
}
