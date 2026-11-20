// 템플릿 틀: 하이라이트 문장 (디자인, 11-20). 공부하며 책 · 공책에 표시하듯 낱말 위에 형광펜 · 박스 · 밑줄 · 물결 · 점선 · 펜 색 · 동그라미.
// 사용자는 글만 써요. 표시는 씨앗(셔플)으로 정해요: 숫자가 든 낱말은 늘 형광펜, 나머지는 1~3어절마다 하나, 검은 박스는 둘째 표시에서 꼭 한 번.
// 표시는 앞에서부터 차례로 정해서, 뒤에 글을 더 써도 앞 표시는 바뀌지 않아요 (쓰는 동안 글이 흔들리지 않게).
// 표시(span.hm)는 저장하지 않아요 (rich.js clean이 벗겨요). 볼 때마다 글 + 씨앗으로 다시 그려요.
// 날짜 줄 · 서명 · 비율 · 장 나누기 · 저장 · 셔플 · 도구 줄은 공용 틀(js/formats.js · main.js)이 해요
import { rng, esc, px, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { rangeAt } from '../../js/rich.js';

const SAMPLE = { html: '오늘 7시에 일어나서 강변까지 천천히 걸었다. 바람은 차가웠지만 머리가 맑아지는 아침이었다.', seed: 11 };
// 형광펜 8색 중 4색 · 펜 6색 중 3색을 씨앗마다 골라요. 박스는 검정 (가끔 파랑 · 초록 · 보라)
const HL = ['#FFE34F', '#FF9CC2', '#7CE3C2', '#8CD2FF', '#C6A6FF', '#FFAE5E', '#C3EF62', '#FFBFA3'];
const INK = ['#22201D', '#2B59E0', '#E2463C', '#16996A', '#7640DE', '#EC7614'];
const BOX = ['#2B59E0', '#16996A', '#7640DE'];
const K = '#22201D';
const PAPER = [['#FBF9F4', 'rgba(60,70,110,.075)'], ['#F7F5EE', 'rgba(60,70,110,.08)'], ['#FFFFFF', 'rgba(60,70,110,.07)']];
const KINDS = ['hl', 'hh', 'box', 'ul', 'wv', 'dt', 'ink', 'cir', 'box', 'ul'];

function shuffle(r, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
// 씨앗 하나로 정해지는 카드 색 (종이 · 형광펜 4 · 펜 3)
export function palette(seed) {
  const r = rng((seed || 1) ^ 0x5f3759df);
  const hls = shuffle(r, HL).slice(0, 4), inks = shuffle(r, INK).slice(0, 3), paper = PAPER[Math.floor(r() * PAPER.length)];
  if (!inks.includes(K)) inks[0] = K;
  return { hls, inks, paper };
}

// 표시할 자리: [시작, 끝, 종류, 색, 기울기]. 낱말 끝 문장부호(. , ! ? …)는 표시 밖에 둬요.
// done = 쓰는 중이면 아직 띄어 쓰지 않은 마지막 낱말은 빼요
export function marks(text, seed, done = true) {
  const r = rng(seed || 1), P = palette(seed), out = [];
  let gap = 1 + Math.floor(r() * 2), run = 0, n = 0, boxed = false;
  for (const m of text.matchAll(/\S+/g)) {
    const a = m.index, w = m[0].replace(/[.,!?…·~"'”’)\]]+$/, ''), b = a + w.length;
    const x = [r(), r(), r(), r(), r()];   // 낱말마다 늘 5번 (앞 낱말 표시가 뒤 글에 따라 바뀌지 않게)
    run++;
    if (!w || /^[(\["'“‘]/.test(w) && w.length < 2) continue;
    let k = null;
    if (/\d/.test(w)) k = 'hl';
    else if (run > gap) k = KINDS[Math.floor(x[0] * KINDS.length)];
    if (!k) continue;
    n++; run = 0; gap = 1 + Math.floor(x[1] * 3);
    if (!boxed && n === 2 && !/\d/.test(w)) k = 'box';
    if (k === 'box') boxed = true;
    const c = k === 'hl' || k === 'hh' ? P.hls[Math.floor(x[2] * 4)] : k === 'box' ? (x[2] < .7 ? K : BOX[Math.floor(x[3] * BOX.length)]) : P.inks[Math.floor(x[2] * 3)];
    if (!done && a + m[0].length >= text.length) break;   // 쓰는 중인 낱말
    out.push([a, b, k, c, (x[4] * 3 - 1.8).toFixed(2)]);
  }
  return out;
}

const posOf = (root, s) => { const r = document.createRange(); r.selectNodeContents(root); r.setEndBefore(s); return r.toString().length; };
// 글 위에 표시를 입혀요. 바뀐 게 없으면 손대지 않아요(커서 그대로). 바꿨으면 true
function place(root, seed) {
  const editing = !!root.closest('.edit') && root.classList.contains('body');
  const text = root.textContent, want = marks(text, seed, !editing || /\s$/.test(text)), have = [...root.querySelectorAll('span.hm')];
  if (want.length === have.length && have.every((s, i) => s.dataset.k === want[i][2] && s.dataset.c === want[i][3] && posOf(root, s) === want[i][0] && s.textContent.length === want[i][1] - want[i][0])) return false;
  have.forEach(s => s.replaceWith(...s.childNodes)); root.normalize();
  for (let i = want.length - 1; i >= 0; i--) {
    const [a, b, k, c, rot] = want[i], rg = rangeAt(root, a, b);
    if (rg.startContainer !== rg.endContainer || rg.startContainer.nodeType !== 3) continue;   // 굵게 · 이모티콘 경계를 넘는 낱말은 그냥 둬요
    const s = document.createElement('span');
    s.className = 'hm'; s.dataset.k = k; s.dataset.c = c; s.style.cssText = `--c:${c};--r:${rot}deg;--i:${i % 16}`;   // --i = 모션에서 그어지는 차례
    rg.surroundContents(s);
  }
  return true;
}

function hilite(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd hilite' + (edit ? ' edit' : '');
  const P = palette(c.seed);
  el.style.setProperty('--paper', P.paper[0]); el.style.setProperty('--rule', P.paper[1]);
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.62 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh};background-size:100% ${lh}em`;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="rb body" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  if (edit) place(el.querySelector('.exm'), SAMPLE.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 글자 크기: 글 길이에 따라 저절로 (짧으면 크게, 길면 작게 빽빽하게). 글자 수 구간으로만 바뀌어서 쓰는 동안 자주 흔들리지 않아요.
// 서식 줄의 크기(작게 ~ 크게)는 그 위에 곱해요. 한 장을 넘으면 카드가 길어지고 저장할 때 장으로 나뉘어요 (멤피스 문장과 같아요)
const STEP = [[24, 124], [48, 108], [90, 92], [150, 78], [240, 66], [Infinity, 58]];
const MUL = { xs: .8, s: .9, m: 1, l: 1.12, xl: 1.24 };
const SAFE916 = [186, 358];   // 9:16 스토리 안전 영역 (위 13% · 아래 22%)
function margins(el) {
  const dp = el.dataset.dp, sg = el.classList.contains('hsg');
  let mt = dp === 'top' ? 170 : 86, mb = (dp === 'bottom' ? 170 : 86) + (sg ? (dp === 'bottom' ? 80 : 98) : 0);
  if (el.classList.contains('r916')) { mt += SAFE916[0]; mb += SAFE916[1]; }
  return [mt, mb];
}
function fit(el) {
  const p = el.querySelector('.rb'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, H = W * (+el.dataset.ar || 1.25);
  const [mt, mb] = margins(el);
  const ex = el.querySelector('.exm'), box = ex && el.classList.contains('empty') ? ex : p;
  const n = box.textContent.replace(/\s+/g, '').length, sz = el.closest('[data-size]')?.dataset.size;
  const mul = MUL[el.dataset.size || sz] || 1;
  let f = STEP.find(([max]) => n <= max)[1] * mul;
  p.style.marginBottom = px(mb);
  const set = () => { p.style.fontSize = px(f); if (ex) ex.style.fontSize = p.style.fontSize; return box.offsetHeight + (mt + mb) * s; };
  let need = set();
  while (need > H + 1 && f > 50 * mul) { f = Math.max(50 * mul, f * .94); need = set(); }   // 한 장에 안 들어가면 조금씩 작게 (가장 작은 크기에서도 넘치면 장으로)
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
  id: 'hilite', name: '하이라이트 문장', info: '모든 길이 · 사진 없음 · 셔플마다 새 표시', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: false, dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = hilite(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins, place,
  tone: c => palette(c.seed).hls[0],
};
