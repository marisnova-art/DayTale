// 템플릿 틀: 멤피스 문장 (디자인). 이 폴더만 이 템플릿의 그리는 코드 · 모양(tpl.css)이에요.
// 날짜 줄 · 서명 · 비율 · 장 나누기 · 저장 · 셔플 · 모션 규칙 · 도구 줄은 공용 틀(js/formats.js · main.js)이 해요.
// 볼 때만 불러와요 (formats.js ensure). 지우지 않아요: 이 틀로 쓴 카드가 남아 있어요 (템플릿은 숨김만)
import { rng, esc, px, soft, htmlOf as rebusHtmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { rangeAt } from '../../js/rich.js';

const SAMPLE = { html: '친구랑 통화를 <b>오래</b> 했다. 별일 없는 이야기에 <mark>웃음</mark>이 많은 밤.', seed: 7 };
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
function placeObjects(root, seed) {
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

function rebus(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd rebus' + (edit ? ' edit' : '');
  const html = soft(rebusHtmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');   // 10.22 목요일 · 장소 (글포맷처럼 날짜 먼저)
  const a = c.align || {}, ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${(1.34 * (LH[c.lh] || 1)).toFixed(3)}`, sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.889, l: 4.4, xl: 4.8 }[c.size] || 3.889;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg); el.style.setProperty('--dl', fz + 'cqw');
  el.innerHTML = `<div class="rb body" data-sz="${RB_SIZES[c.size] || RB_SIZES.m}" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  placeObjects(el.querySelector('.rb'), c.seed);
  el.querySelectorAll('.o').forEach(o => { o.dataset.m = MOTION[o.dataset.k] || 'tw'; });   // 예전에 저장된 그림도 움직임 종류를 붙여요
  if (edit) placeObjects(el.querySelector('.exm'), SAMPLE.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 그림 문장 글자 크기: 고른 크기 그대로(큰 140 · 중간 116 · 작은 96, 1080 기준). 저절로 줄이지 않아서 쓰는 동안 줄이 흔들리지 않아요.
// 넘치면 카드가 아래로 길어지고 저장할 때 장으로 나뉘어요. 한 장에 들어가면 위 · 가운데 · 아래 자리에 놓아요.
// 쓰는 중(키보드 올라옴)에는 늘 위에서부터: 줄이 늘어도 글이 밀리지 않게. 고른 자리는 키보드를 내리면 적용돼요.
// 빈 카드에서는 흐린 예시 글이 고른 크기 · 자리를 그대로 따라가요 (누르면 바로 보이게)
// 카드 높이는 글 높이를 직접 재서 정해요 (아이폰 브라우저는 4:5 상자가 글 따라 늘어나지 않아요)
const RB_SIZES = { xl: 164, l: 140, m: 116, s: 96, xs: 84 };
// 9:16 안전 영역 (1080 기준 위 · 아래로 더 비우는 만큼): 위 13% · 아래 22%에서 원래 여백을 뺀 값
const SAFE916 = [186, 358];
// 날짜 줄 · 서명 자리만큼 글 위 · 아래 여백 (1080 기준). 서명은 맨 아래, 날짜 줄이 아래면 서명 위로 한 줄
function rbMargins(el) {
  const dp = el.dataset.dp, sg = el.classList.contains('hsg');
  let mt = dp === 'top' ? 170 : 72, mb = (dp === 'bottom' ? 170 : 72) + (sg ? (dp === 'bottom' ? 80 : 98) : 0);
  if (el.classList.contains('r916')) { mt += SAFE916[0]; mb += SAFE916[1]; }   // 9:16: 스토리 · 릴스 위아래 가리는 자리를 비워요
  return [mt, mb];
}
function fitRebus(el) {
  const p = el.querySelector('.rb'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, H = W * (+el.dataset.ar || 1.25);
  const [mt, mb] = rbMargins(el);
  const ex = el.querySelector('.exm'), box = ex && el.classList.contains('empty') ? ex : p;
  p.style.fontSize = px(+p.dataset.sz || 116); if (ex) ex.style.fontSize = p.style.fontSize;
  p.style.marginBottom = px(mb);
  const need = box.offsetHeight + (mt + mb) * s;
  let top = mt * s;
  if (need > H + 1) el.style.height = Math.ceil(need) + 'px';
  else {
    el.style.height = H + 'px';
    const v = el.closest('.wr.typ') ? 't' : p.dataset.v || 't';
    if (v !== 't') top += (H - need) * ({ tm: .25, m: .5, bm: .75, b: 1 }[v] ?? .5);
  }
  p.style.marginTop = top + 'px'; if (ex) ex.style.marginTop = top + 'px';
}
export default {
  id: 'rebus', name: '멤피스 문장', info: '짧은 글 · 사진 없음 · 사계절', paid: true, css: true,
  // 쓰기 화면 도구: style = 서식 줄(글꼴·크기·좌우·위아래), bg = 배경 줄, dp = 날짜 위치. 디자인은 모양이 정해져 있어 대부분 꺼요
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: false, dp: true },
  sample: SAMPLE,
  datePos: 'bottom',   // 날짜 줄 기본 자리
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: rebus, fit: fitRebus,
  margins: rbMargins,        // 저장할 때 장을 나누는 위 · 아래 여백
  place: placeObjects,       // 쓰는 중 낱말 사이 그림 붙이기
  tone: () => V,             // 피드 바탕에 번지는 대표 색
};
