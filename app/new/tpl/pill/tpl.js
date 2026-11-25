// 템플릿 틀: 그라데이션 필 (디자인, 11-25 91차). 쓴 글의 낱말 몇 개가 두 색 그라데이션 필에 담겨요 (가끔 회색 알약).
// 색 · 방향 · 번지는 정도 모두 씨앗(셔플)으로 랜덤. 알약 색은 카드 색 조합(js/combo.js)의 강조 · 표시 색에서 골라요.
// 앞에서부터 차례로 정해서, 뒤에 글을 더 써도 앞 알약은 바뀌지 않아요. 알약(span.gp)은 저장하지 않아요 (rich.js clean이 벗겨요)
// 크기 · 여백 · 장 나누기는 하이라이트 노트과 같아요 (fit · margins를 같이 써요)
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { rangeAt } from '../../js/rich.js';
import { comboOf, paintCombo, contrast } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '아침 공기가 차가웠다. 따뜻한 라떼를 들고 공원을 한 바퀴 천천히 돌았다.', seed: 5, pal: 12 };
const POOL = ['a1', 'a2', 'h1', 'h2', 'h3', 'h4'];
const ANG = [90, 270, 120, 60, 100, 80];
const DK = '#1E1B18', WH = '#FFFFFF';

// 알약 자리: [시작, 끝, 종류(g 그라데이션 · n 회색), 색1, 색2, 각도, 번짐]. 낱말 끝 문장부호는 알약 밖에. 가끔 두 낱말을 한 알약에
export function pills(text, seed, done = true) {
  const r = rng((seed || 1) ^ 0x1b873593), ws = [...text.matchAll(/\S+/g)], out = [];
  let skip = -1, last = -3;
  ws.forEach((m, i) => {
    const x = [r(), r(), r(), r(), r(), r()];   // 낱말마다 늘 6번 (앞 알약이 뒤 글에 따라 바뀌지 않게)
    if (i <= skip) return;
    const a = m.index, w = m[0].replace(/[.,!?…·~"'”’)\]]+$/, '');
    if (!w || (!done && a + m[0].length >= text.length)) return;   // 쓰는 중인 낱말
    let k = x[0] < .2 ? 'g' : x[0] < .27 ? 'n' : null;
    if (!k && i - last > 5) k = 'g';   // 너무 오래 없으면 하나
    if (!k) return;
    let b = a + w.length;
    const nx = ws[i + 1];
    if (k === 'g' && x[4] < .28 && w === m[0] && nx) {   // 두 낱말을 한 알약에 (다음 낱말을 다 쓴 뒤에)
      const w2 = nx[0].replace(/[.,!?…·~"'”’)\]]+$/, '');
      if (w2 && (done || nx.index + nx[0].length < text.length)) { b = nx.index + w2.length; skip = i + 1; }
    }
    const c1 = Math.floor(x[1] * POOL.length); let c2 = Math.floor(x[2] * POOL.length); if (c2 === c1) c2 = (c1 + 1 + Math.floor(x[3] * 4)) % POOL.length;
    out.push([a, b, k, POOL[c1], POOL[c2], ANG[Math.floor(x[3] * ANG.length)], Math.round(55 + x[5] * 45)]);
    last = i;
  });
  return out;
}

const posOf = (root, s) => { const r = document.createRange(); r.selectNodeContents(root); r.setEndBefore(s); return r.toString().length; };
const sig = w => w.slice(2).join('|');
function place(root, seed) {
  const editing = !!root.closest('.edit') && root.classList.contains('body');
  const cd = root.closest('.cd'), col = n => (cd?.style.getPropertyValue('--' + n) || '').trim() || '#888888';
  const text = root.textContent, want = pills(text, seed, !editing || /\s$/.test(text)), have = [...root.querySelectorAll('span.gp')];
  if (want.length === have.length && have.every((s, i) => s.dataset.s === sig(want[i]) && posOf(root, s) === want[i][0] && s.textContent.length === want[i][1] - want[i][0])) return false;
  have.forEach(s => s.replaceWith(...s.childNodes)); root.normalize();
  for (let i = want.length - 1; i >= 0; i--) {
    const [a, b, k, n1, n2, ang, stop] = want[i], rg = rangeAt(root, a, b);
    if (rg.startContainer !== rg.endContainer || rg.startContainer.nodeType !== 3) continue;   // 굵게 · 이모티콘 경계를 넘으면 그냥 둬요
    const s = document.createElement('span');
    s.className = 'gp ' + k; s.dataset.s = sig(want[i]);
    if (k === 'g') {   // 글자색: 두 색 모두에서 잘 보이는 쪽 (style에 'background' 글자를 쓰지 않아요: clean이 형광펜으로 바꿔요)
      const c1 = col(n1), c2 = col(n2), t = Math.min(contrast(c1, DK), contrast(c2, DK)) >= Math.min(contrast(c1, WH), contrast(c2, WH)) ? DK : WH;
      s.style.cssText = `--g1:var(--${n1});--g2:var(--${n2});--ga:${ang}deg;--gs:${stop}%;--t:${t};animation-delay:${((i % 16) * .32).toFixed(2)}s`;
    }
    rg.surroundContents(s);
  }
  return true;
}

function pill(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd gpl' + (edit ? ' edit' : '');
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
  id: 'pill', name: '그라데이션 필', info: '모든 길이 · 사진 없음 · 셔플마다 새 알약', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = pill(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit: H.fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
