// 템플릿 틀: 동그라미 목차 (디자인, 11-25 91차). 글은 한 문단으로 흐르고, 문장마다 첫 글자가 색 동그라미 안에 (헤드 글자).
// 그래서 동그라미가 줄 맨 앞에도, 줄 중간에도 나와요. 한글 문장은 한글, 영문 문장은 영문 글자 그대로.
// 줄바꿈 · 계단 들여쓰기는 가끔만 (씨앗 = 셔플마다 다르게). 동그라미 색은 카드 색 조합(js/combo.js)의 강조 · 표시 색에서.
// 동그라미(span.cdot) · 줄바꿈(span.hbk)은 저장하지 않아요 (rich.js clean이 벗겨요). 크기 · 여백 · 장 나누기는 하이라이트 문장과 같아요
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo, textOn } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '아침 공기가 차가웠다. 라떼를 들고 공원을 걸었다. 오후엔 긴 회의. 저녁은 친구랑 국수.', seed: 9, pal: 0 };
const POOL = ['a1', 'a2', 'h1', 'h2', 'h3', 'h4'];
const IND = [1.4, 2.8, .8, 2];

// 문장 첫 글자 자리: [자리, 색, 줄바꿈, 들여쓰기(em)]. 쓰는 중이면 첫 글자 뒤에 한 글자가 더 있어야 붙어요 (커서가 동그라미 안에 갇히지 않게)
// 새 문장 (92차, 앤드류 '2개만 생겨요'): 글 처음 · . ! ? 다음 · 줄바꿈(엔터) 다음 · '~다 · ~요'로 끝난 어절 다음. 그래도 7어절 넘게 없으면 하나 더.
// 어절마다 늘 같은 수의 씨앗을 써서, 뒤에 글을 더 써도 앞 동그라미는 그대로예요. brks = 줄바꿈 자리 (글자 위치)
const END = /[.!?…。？！]["'”’)]*$/, KEND = /[가-힣][다요죠]$/, NOT = /(마다|바다|보다|부터|까지)$/;
export function heads(text, seed, editing = false, brks = []) {
  const r = rng((seed || 1) ^ 0x68e31da4), out = [], ws = [];
  for (const m of text.matchAll(/\S+/g)) {   // 줄바꿈 자리에서 어절을 나눠요 (줄바꿈은 글에 띄어쓰기가 없어서)
    let a = m.index; const e = a + m[0].length;
    for (const k of brks) if (k > a && k < e) { ws.push([a, k, false]); a = k; }
    ws.push([a, e, false]);
  }
  ws.forEach(w => { w[2] = brks.includes(w[0]); });
  let prev = -1, run = 0, n = 0;
  ws.forEach(([a, e, afterBr], i) => {
    const x = [r(), r(), r(), r()];   // 어절마다 늘 4번
    const pw = i ? text.slice(ws[i - 1][0], ws[i - 1][1]) : '';
    const head = i === 0 || afterBr || END.test(pw) || (KEND.test(pw) && !NOT.test(pw)) || run >= 7;
    run++;
    if (!head || !/[\p{L}\p{N}]/u.test(text[a])) return;   // 이모티콘 · 기호로 시작하면 동그라미 없이
    if (editing && a + 1 >= text.length) return;
    run = 0;
    let ci = Math.floor(x[0] * POOL.length); if (ci === prev) ci = (ci + 1 + Math.floor(x[3] * 3)) % POOL.length; prev = ci;
    const brk = n > 0 && !afterBr && x[1] < .2, ind = brk && x[2] < .6 ? IND[Math.floor(x[3] * IND.length)] : 0;
    out.push([a, POOL[ci], brk, ind]); n++;
  });
  return out;
}
// 줄바꿈(<br> · 줄 상자) 자리를 글자 위치로
function breaks(root) {
  const out = [], walk = (node, pos) => {
    for (const ch of node.childNodes) {
      if (ch.nodeType === 3) { pos += ch.data.length; continue; }
      if (ch.nodeType !== 1 || ch.classList.contains('hbk')) continue;
      if (ch.tagName === 'BR') { out.push(pos); continue; }
      const blk = /^(DIV|P|LI|H2|H3)$/.test(ch.tagName);
      if (blk && pos) out.push(pos);
      pos = walk(ch, pos);
    }
    return pos;
  };
  walk(root, 0); return out;
}

// 글자 하나 자리 (줄바꿈 바로 뒤 글자도 다음 글 조각에서 잡아요: rangeAt은 앞 조각 끝을 잡아요)
function charAt(root, a) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), r = document.createRange(); let n, pos = 0;
  while ((n = w.nextNode())) { if (a < pos + n.data.length) { r.setStart(n, a - pos); r.setEnd(n, a - pos + 1); return r; } pos += n.data.length; }
  return r;
}
const posOf = (root, s) => { const r = document.createRange(); r.selectNodeContents(root); r.setEndBefore(s); return r.toString().length; };
const sig = w => w.slice(1).join('|');
function place(root, seed) {
  const editing = !!root.closest('.edit') && root.classList.contains('body');
  const cd = root.closest('.cd'), col = n => (cd?.style.getPropertyValue('--' + n) || '').trim() || '#888888';
  const text = root.textContent, want = heads(text, seed, editing, breaks(root)), have = [...root.querySelectorAll('span.cdot')];
  if (want.length === have.length && have.every((s, i) => s.dataset.s === sig(want[i]) && posOf(root, s) === want[i][0] && s.textContent.length === 1)) return false;
  root.querySelectorAll('span.hbk').forEach(b => b.remove());
  have.forEach(s => s.replaceWith(...s.childNodes)); root.normalize();
  for (let i = want.length - 1; i >= 0; i--) {
    const [a, n, brk, ind] = want[i], rg = charAt(root, a);
    if (rg.startContainer !== rg.endContainer || rg.startContainer.nodeType !== 3) continue;
    const s = document.createElement('span');
    s.className = 'cdot'; s.dataset.s = sig(want[i]);
    s.style.cssText = `--c:var(--${n});--t:${textOn(col(n))};${ind ? `margin-left:${ind}em;` : ''}animation-delay:${((i % 12) * .35).toFixed(2)}s`;
    rg.surroundContents(s);
    if (brk) { const b = document.createElement('span'); b.className = 'hbk'; b.contentEditable = 'false'; s.before(b); }
  }
  return true;
}

function dots(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd cdots' + (edit ? ' edit' : '');
  paintCombo(el, comboOf(c));
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.56 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh}`;
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

export default {
  id: 'dots', name: '동그라미 목차', info: '모든 길이 · 사진 없음 · 문장마다 첫 글자 동그라미', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = dots(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit: H.fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
