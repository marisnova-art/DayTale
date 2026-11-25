// 템플릿 틀: 웨이브 타이포 (디자인, 11-25 93차). 앤드류 레퍼런스(물결 타이포 포스터)의 느낌: 줄마다 글자가 곡선을 따라 놓여요.
// 줄마다 언덕 · 물결 · 처짐 · 기울기 중 하나 (첫 줄은 언덕), 글자는 곡선 방향으로 살짝 돌아가요. 몇 낱말은 기울인 글씨 · 끊긴 밑줄, 가끔 한 글자가 톡 올라가요.
// 쓰는 동안(글 상자에 커서)엔 반듯한 글, 키보드를 내리면 물결 (글 위에 같은 글을 한 겹 더 깔아 휘어요: 고치는 글은 그대로라 커서가 안전해요).
// 보기 카드 · 저장 그림에선 글 상자 안 글자를 바로 휘어요. 글자 조각(span)은 저장하지 않아요 (rich.js clean이 벗겨요)
// 크기 · 여백 · 장 나누기는 하이라이트 노트 틀(fit · margins)을 같이 써요. 색은 색 조합(js/combo.js)
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 따뜻한 라떼를 마시며 창밖을 오래 봤다.', seed: 11, pal: 0 };

// 글자를 낱말(span.wvw) · 글자(span.wvc) 조각으로. 낱말마다 씨앗 한 번 = 기울임(wvi) · 밑줄(wvu)
function wrap(node, seed) {
  const r = rng(((seed || 1) ^ 0x3c6ef372) >>> 0), texts = [];
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) if (!t.parentElement.closest('.wvw')) texts.push(t);
  texts.forEach(tn => {
    const parts = tn.data.split(/(\s+)/); if (parts.length === 1 && !parts[0]) return;
    const frag = document.createDocumentFragment();
    parts.forEach(s => {
      if (!s) return;
      if (/^\s+$/.test(s)) { frag.appendChild(document.createTextNode(s)); return; }
      const x = r(), ws = document.createElement('span');
      ws.className = 'wvw' + (x < .14 ? ' wvi' : '') + (x > .8 ? ' wvu' : '');
      [...s].forEach(ch => { const c = document.createElement('span'); c.className = 'wvc'; c.textContent = ch; ws.appendChild(c); });
      frag.appendChild(ws);
    });
    tn.replaceWith(frag);
  });
}
// 글자 자리를 재서 줄마다 곡선에 올려요 (자리는 휘기 전 자리: offsetLeft/Top은 돌리기 · 옮기기와 상관없어요)
function layout(box, seed) {
  const cs = [...box.querySelectorAll('.wvc')]; if (!cs.length) return;
  const fs = parseFloat(getComputedStyle(box).fontSize) || 16, Wd = box.clientWidth || 1, lines = [];
  cs.forEach(c => { const t = c.offsetTop; let L = lines.find(l => Math.abs(l.t - t) < fs * .5); if (!L) lines.push(L = { t, cs: [] }); L.cs.push(c); });
  const span = Wd / fs;
  lines.forEach((L, li) => {
    const q = rng(((seed || 1) * 31 + li * 7919) >>> 0), K = ['arch', 'wave', 'wave', 'sag', 'tilt'], k = li === 0 ? 'arch' : K[Math.floor(q() * K.length)];
    const amp = .2 + q() * .28, f = .8 + q() * .9, ph = q();
    const Y = u => k === 'arch' ? -amp * 4 * u * (1 - u) : k === 'sag' ? amp * 4 * u * (1 - u) : k === 'tilt' ? amp * (u - .5) * 1.6 + .08 * Math.sin(6.283 * (2 * u + ph)) : amp * Math.sin(6.283 * (f * u + ph));
    L.cs.forEach(c => {
      const u = Math.max(0, Math.min(1, (c.offsetLeft + c.offsetWidth / 2) / Wd));
      const d = (Y(Math.min(1, u + .01)) - Y(Math.max(0, u - .01))) / .02, jump = q() < .05 ? -.26 : 0;
      c.style.translate = `0 ${(Y(u) + jump).toFixed(3)}em`; c.style.rotate = `${(Math.atan2(d, span) * 57.3).toFixed(1)}deg`;
      c.style.animationDelay = `${(-u * 2.6).toFixed(2)}s`;   // 모션: 물결이 옆으로 지나가요 (아이폰도 읽게 숫자로)
    });
  });
}
const ovOf = root => root.parentElement?.querySelector(':scope > .ovl');
// 쓰는 글 상자(고칠 수 있음) → 위에 깐 한 겹(.ovl)을 다시 만들어요. 보기 카드 → 글 상자 안을 바로 휘어요. 늘 false (고치는 글은 그대로라 커서를 옮길 일 없어요)
function place(root, seed) {
  if (root.isContentEditable) {
    let ov = ovOf(root);
    if (!ov) { ov = document.createElement('div'); ov.className = 'rb ovl'; ov.setAttribute('aria-hidden', 'true'); root.after(ov); }
    ov.setAttribute('style', root.getAttribute('style') || ''); ov.innerHTML = root.innerHTML; wrap(ov, seed);
    if (ov.isConnected) layout(ov, seed);
    return false;
  }
  if (!root.querySelector('.wvw')) wrap(root, seed);
  if (root.isConnected) layout(root, seed);
  return false;
}

function wave(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd cwave' + (edit ? ' edit' : '');
  paintCombo(el, comboOf(c)); el.dataset.seed = c.seed || 1;
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.72 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'c']};line-height:${lh}`;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="rb body" data-v="${a.v || 'm'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  if (edit) wrap(el.querySelector('.exm'), SAMPLE.seed);
  el.classList.toggle('empty', empty);
  return el;
}
// 크기 · 자리는 하이라이트와 같게 잰 뒤, 위에 깐 한 겹을 같은 자리 · 크기로 맞추고 곡선을 다시 그려요 (글자 크기가 바뀌면 줄이 바뀌어서)
function fit(el) {
  H.fit(el);
  const p = el.querySelector('.rb.body'); if (!p) return;
  const seed = +el.dataset.seed || 1, ov = ovOf(p), ex = el.querySelector('.exm');
  if (ov) { ov.setAttribute('style', p.getAttribute('style') || ''); layout(ov, seed); }
  else layout(p, seed);
  if (ex && el.classList.contains('empty')) layout(ex, SAMPLE.seed);
}

export default {
  id: 'wave', name: '웨이브 타이포', info: '모든 길이 · 사진 없음 · 셔플마다 새 물결', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'c', v: 'm' }, datePos: 'bottom' }),
  render: (c, o) => { const el = wave(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
