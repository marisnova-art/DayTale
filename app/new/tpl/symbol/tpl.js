// 템플릿 틀: 기호 문장 (디자인, 11-25 94차). 앤드류 레퍼런스(실험 타이포 포스터)의 느낌: 가늘고 큰 글씨 사이사이에 선 기호가 끼어들어요.
// 2~4어절마다 기호 하나 (16가지, 글자처럼 가는 선 · 글자색) · 글 끝에도 하나. 노란 포인트는 웃는 얼굴 하나뿐 (카드에 한 번만). 영문은 대문자로.
// 앞에서부터 낱말마다 씨앗을 같은 만큼 써서, 뒤에 글을 더 써도 앞 기호는 그대로예요. 셔플 = 기호 종류 · 자리.
// 쓰는 동안(글 상자에 커서)엔 반듯한 글, 키보드를 내리면 기호 든 글 (글 위에 한 겹 깔아요). 보기 카드 · 저장 그림은 글 상자 안에 바로 넣어요.
// 모션 (피드 가운데 카드만): 글자는 가만히, 기호만 (웃는 얼굴 깜빡 · 마름모 돎 · 화살 콕콕 · 점선 점이 차례로 …)
import { rng, esc, px, soft, htmlOf, dateChip, weekday, dateOn, placeOn, infoPos, signOf, dhOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '오늘은 아침부터 비가 와서 우산을 쓰고 천천히 걸었다. 강변 카페에서 따뜻한 라떼를 마시며 창밖을 오래 봤다.', seed: 11, pal: 0 };
const C = 'currentColor', SW = 'stroke-width="2.6"';
const line = d => `<path d="${d}" fill="none" stroke="${C}" ${SW} stroke-linecap="round" stroke-linejoin="round"/>`;
const dots = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
// 기호 16가지: [이름, viewBox 너비, 그림]. 높이는 모두 40
export const SYM = {
  smile: [40, `<circle cx="20" cy="20" r="18.5" fill="#FFD21F" stroke="${C}" stroke-width="1.4"/><g class="ey"><circle cx="14" cy="15.5" r="2.6" fill="#141414"/><circle cx="26" cy="15.5" r="2.6" fill="#141414"/></g><path d="M11.5 23q8.5 9 17 0" fill="none" stroke="#141414" stroke-width="2.6" stroke-linecap="round"/>`],
  sad: [40, `<circle cx="20" cy="20" r="18" fill="none" stroke="${C}" ${SW}/><g class="ey"><circle cx="14" cy="15" r="2.4" fill="${C}"/><circle cx="26" cy="15" r="2.4" fill="${C}"/></g>${line('M12.5 29q7.5-7.5 15 0')}`],
  dia: [40, line('M20 2.5 37.5 20 20 37.5 2.5 20z')],
  arrow: [40, line('M5 3h30L20 15z M5 14h30L20 26z M5 25h30L20 37z')],
  hatch: [84, `<g stroke="${C}" stroke-width="2.4">${dots(8, i => `<path d="M${i * 5} 38 L${18 + i * 5} 2"/><path d="M${44 + i * 5} 2 L${62 + i * 5} 38"/>`)}</g>`],
  check: [52, line('M3 19l8 16 12-32 M25 19l8 16 12-32')],
  dl: [150, `<g fill="${C}">${dots(18, i => `<circle class="dd" style="animation-delay:${(i * .09).toFixed(2)}s" cx="${4 + i * 8.2}" cy="13" r="2.5"/><circle class="dd" style="animation-delay:${(i * .09).toFixed(2)}s" cx="${4 + i * 8.2}" cy="27" r="2.5"/>`)}</g>`],
  spark: [40, line('M20 2Q22 18 38 20Q22 22 20 38Q18 22 2 20Q18 18 20 2z')],
  ast: [40, line('M20 3v34 M5.3 11.5l29.4 17 M5.3 28.5l29.4-17')],
  ring: [40, `<circle cx="20" cy="20" r="18" fill="none" stroke="${C}" ${SW}/><circle cx="20" cy="20" r="10" fill="none" stroke="${C}" ${SW}/><circle cx="20" cy="20" r="3" fill="${C}"/>`],
  moon: [40, `<circle cx="20" cy="20" r="18" fill="none" stroke="${C}" ${SW}/><path d="M20 2a18 18 0 0 1 0 36z" fill="${C}"/>`],
  wavy: [76, line('M3 14q6-9 12 0t12 0 12 0 12 0 12 0 12 0 M3 28q6-9 12 0t12 0 12 0 12 0 12 0 12 0')],
  spiral: [40, line('M20 20m0-2a2 2 0 1 1-2 2a5 5 0 0 1 5-5a8 8 0 0 1 8 8a11 11 0 0 1-11 11a14 14 0 0 1-14-14a17 17 0 0 1 17-17')],
  bolt: [32, line('M20 2 5 23h10l-3 15 15-22H17z')],
  tri: [40, line('M20 3 38 36H2z M20 15 29 31H11z')],
  sun: [40, `<circle cx="20" cy="20" r="8" fill="none" stroke="${C}" ${SW}/><g stroke="${C}" ${SW} stroke-linecap="round">${dots(8, i => { const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a); return `<path d="M${(20 + c * 13).toFixed(1)} ${(20 + s * 13).toFixed(1)}L${(20 + c * 18.5).toFixed(1)} ${(20 + s * 18.5).toFixed(1)}"/>`; })}</g>`],
};
const KEYS = Object.keys(SYM), MID = KEYS.filter(k => k !== 'smile');
export const symHtml = (k, i) => { const [w, g] = SYM[k]; return `<span class="sy s-${k}" style="animation-delay:${(-(i * .7) % 5).toFixed(2)}s"><svg viewBox="0 0 ${w} 40" style="width:${(w / 40 * .74).toFixed(3)}em" aria-hidden="true">${g}</svg></span>`; };

// 기호 자리: 낱말 순서마다 [낱말 번호, 기호]. 낱말마다 씨앗 3번 (앞 기호가 뒤 글에 따라 바뀌지 않게). 마지막 낱말 뒤엔 늘 하나
export function marks(n, seed) {
  const r = rng(((seed || 1) ^ 0x5bd1e995) >>> 0), out = [], recent = []; let gap = 2, run = 0, smile = false;
  const pick = x => { let j = Math.floor(x * MID.length); while (recent.includes(MID[j])) j = (j + 5) % MID.length; return MID[j]; };   // 바로 앞 세 기호와 겹치지 않게
  for (let i = 0; i < n; i++) {
    const x = [r(), r(), r()]; run++;
    if (i === n - 1) { out.push([i, !smile && x[0] < .5 ? 'smile' : pick(x[1])]); break; }
    if (run < gap) continue;
    let k = !smile && x[0] < .3 ? 'smile' : pick(x[1]);
    recent.push(k); if (recent.length > 3) recent.shift();
    if (k === 'smile') smile = true;
    out.push([i, k]); run = 0; gap = 2 + Math.floor(x[2] * 3);
  }
  return out;
}
// 글 상자 안 글자 사이에 기호를 넣어요 (낱말 끝마다 자리를 재 두고 뒤에서부터)
function insert(root, seed) {
  root.querySelectorAll('.sy').forEach(s => s.remove()); root.normalize();
  const ends = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) for (const m of t.data.matchAll(/\S+/g)) ends.push([t, m.index + m[0].length]);
  const ms = marks(ends.length, seed);
  for (let j = ms.length - 1; j >= 0; j--) {
    const [i, k] = ms[j], [node, at] = ends[i], tail = node.splitText(at), tmp = document.createElement('span');
    tmp.innerHTML = symHtml(k, j); tail.before(document.createTextNode(' '), tmp.firstChild);
  }
}
const ovOf = root => root.parentElement?.querySelector(':scope > .ovl');
function place(root, seed) {
  if (root.isContentEditable) {
    let ov = ovOf(root);
    if (!ov) { ov = document.createElement('div'); ov.className = 'rb ovl'; ov.setAttribute('aria-hidden', 'true'); root.after(ov); }
    ov.setAttribute('style', root.getAttribute('style') || ''); ov.innerHTML = root.innerHTML; insert(ov, seed);
    return false;
  }
  if (!root.querySelector('.sy')) insert(root, seed);
  return false;
}

function symbol(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd csym' + (edit ? ' edit' : '');
  paintCombo(el, comboOf(c)); el.dataset.seed = c.seed || 1;
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const foot = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).map(esc).join(' · ');
  const a = c.align || {}, lh = (1.16 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7;
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh}`;
  el.dataset.dp = foot ? infoPos(c) : 'none';
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="rb body" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="foot" style="font-size:${fz}cqw;justify-content:${{ left: 'flex-start', center: 'center', right: 'flex-end' }[dhOf(c)]}"><span>${foot}</span></div>${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  if (edit) insert(el.querySelector('.exm'), SAMPLE.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 크기: 레퍼런스처럼 카드를 꽉 채우게 (크게 시작해 들어갈 때까지 줄여요, 아주 짧은 글도 너무 커지지 않게 위 한계). 기호까지 든 글(쓰는 중엔 위에 깐 한 겹)로 재요
const MUL = { xs: .8, s: .9, m: 1, l: 1.12, xl: 1.24 };
function fit(el) {
  const p = el.querySelector('.rb.body'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, Hh = W * (+el.dataset.ar || 1.25), [mt, mb] = H.margins(el);
  const ov = ovOf(p), ex = el.querySelector('.exm'), empty = el.classList.contains('empty'), box = empty && ex ? ex : ov || p;
  const mul = MUL[el.dataset.size] || 1;
  let f = 190 * mul;
  p.style.marginBottom = px(mb);
  const set = () => { [p, ov, ex].forEach(x => { if (x) x.style.fontSize = px(f); }); return box.offsetHeight + (mt + mb) * s; };
  let need = set();
  while (need > Hh + 1 && f > 50 * mul) { f = Math.max(50 * mul, f * .95); need = set(); }
  let top = mt * s;
  if (need > Hh + 1) el.style.height = Math.ceil(need) + 'px';
  else {
    el.style.height = Hh + 'px';
    const v = el.closest('.wr.typ') ? 't' : p.dataset.v || 't';
    if (v !== 't') top += (Hh - need) * ({ tm: .25, m: .5, bm: .75, b: 1 }[v] ?? .5);
  }
  [p, ov, ex].forEach(x => { if (x) x.style.marginTop = top + 'px'; });
}

export default {
  id: 'symbol', name: '기호 문장', info: '모든 길이 · 사진 없음 · 셔플마다 새 기호', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = symbol(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
