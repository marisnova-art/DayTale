// 템플릿 틀: 라벨 콜라주 (디자인, 11-25 94차). 앤드류 레퍼런스(빨간 바탕 흰 라벨 포스터)의 느낌: 문장마다 끊어 흰 띠 라벨에 담고 자리를 흩어요.
// 라벨 = 2~4어절 조각 (95차, 셔플마다 다르게), 문장 끝(줄바꿈 · 문장부호 · '~다/~요')에선 늘 끊어요 → 짧은 글도 여러 조각. 라벨 안 줄은 짧게. 첫 라벨은 조금 크게. 굵고 좁게, 줄 간격 빽빽하게.
// 자리: 위에서부터 쌓되 왼쪽 · 들여쓰기 · 가운데 · 오른쪽으로 흩고 사이 간격도 랜덤. 셔플 = 자리 · 간격 · 줄 나눔.
// 색: 바탕 = 조합 배경색, 라벨 = 흰색 (밝은 바탕이면 조합 글자색), 라벨 글자 = 거의 검정 (밝은 바탕이면 바탕색). 날짜 · 장소를 켜면 작은 라벨 하나 (/// 사이).
// 쓰는 동안(글 상자에 커서)엔 반듯한 글, 키보드를 내리면 라벨 (글 위에 한 겹). 보기 카드 · 저장 그림은 라벨만 보여요. 늘 한 장에 들어가게 작아져요
// 모션 (피드 가운데 카드만): 라벨 띠가 위에서부터 차례로 테이프 붙이듯 왼쪽 → 오른쪽으로 펼쳐져요 (7초)
import { rng, esc, soft, htmlOf, dateChip, weekday, dateOn, placeOn, signOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo, lumOf } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '대부분의 사람은 딱 맞는 때를 기다리다 하루를 보낸다. 오늘은 그냥 해 보기로 했다. 퇴근길 버스 대신 한 정거장 걸었다.', seed: 7, pal: 14 };
const NOT = /(마다|바다|보다|부터|까지)$/;
// 글 → 문장들 (줄바꿈 · . ! ? · 한글 '~다/~요/~죠' 끝)
const plainOf = h => { const t = document.createElement('div'); t.innerHTML = (h || '').replace(/<br\s*\/?>|<\/(div|p|li|h2|h3)>/gi, '\n'); return t.textContent; };
export function sentences(text) {
  const out = [];
  text.split('\n').forEach(par => {
    let cur = [];
    par.split(/\s+/).filter(Boolean).forEach(w => { cur.push(w); if (/[.!?。！？…]["'”’)]*$/.test(w) || (/[가-힣](다|요|죠)$/.test(w) && !NOT.test(w))) { out.push(cur.join(' ')); cur = []; } });
    if (cur.length) out.push(cur.join(' '));
  });
  return out;
}
// 문장 → 라벨 안 줄들 (글자 수로 짧게 끊어요. 영문은 조금 길게)
function linesOf(s, lim) {
  const ws = s.split(' '), out = []; let cur = '';
  const L = /[가-힣ぁ-ゟ゠-ヿ一-鿿]/.test(s) ? lim : Math.round(lim * 1.7);
  ws.forEach(w => { if (cur && (cur + ' ' + w).length > L) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
  if (cur) out.push(cur);
  return out;
}
// 문장 → 2~4어절 조각 (남은 한 어절은 앞 조각에 붙여요)
function pieces(text, r) {
  const out = [];
  sentences(text).forEach(s => {
    const ws = s.split(' ');
    for (let i = 0; i < ws.length;) { let n = 2 + Math.floor(r() * 3); if (ws.length - (i + n) === 1) n++; out.push(ws.slice(i, i + n).join(' ')); i += n; }
  });
  return out;
}
function layerHtml(text, seed, extra) {
  const r = rng(((seed || 1) ^ 0x2545f491) >>> 0), lim = 7 + Math.floor(r() * 4), list = pieces(text, r).map((t, i) => [t, i === 0 ? 'big' : '']);
  if (extra) list.splice(Math.min(list.length, 1 + Math.floor(r() * 3)), 0, [extra, 'sm']);
  let n = 0;
  return list.map(([t, cls]) => `<div class="lk ${cls}">${(cls === 'sm' ? [t] : linesOf(t, lim)).map(l => `<div class="ln" style="animation-delay:${(n++ * .22).toFixed(2)}s">${esc(l)}</div>`).join('')}</div>`).join('');
}
const ovOf = root => root.parentElement?.querySelector(':scope > .lbl:not(.exm)');
const extraOf = el => el?.dataset.ex || '';
function place(root, seed) {
  const el = root.closest('.cd'); let ov = ovOf(root);
  if (!ov) { ov = document.createElement('div'); ov.className = 'lbl'; ov.setAttribute('aria-hidden', 'true'); root.after(ov); }
  ov.innerHTML = layerHtml(plainOf(root.innerHTML), seed, extraOf(el)); ov.dataset.seed = seed || 1;
  if (ov.isConnected && el) fit(el);
  return false;
}

function label(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd clab' + (edit ? ' edit' : '');
  const P = comboOf(c); paintCombo(el, P);
  const light = lumOf(P.bg) > .45;
  el.style.setProperty('--lab', light ? P.ink : '#FFFFFF'); el.style.setProperty('--lt', light ? P.bg : '#141414');
  const ex = [dateOn(c) ? `${dateChip(c.date).split(' ')[0]} /// ${weekday(c.date)}` : '', placeOn(c) ? c.place.trim() : ''].filter(Boolean).join(' /// ');
  el.dataset.ex = ex; el.dataset.dp = 'none'; el.dataset.seed = c.seed || 1;
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7, lh = (1.5 * (LH[c.lh] || 1)).toFixed(3);
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="rb body" style="line-height:${lh}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="lbl exm">${layerHtml(plainOf(SAMPLE.html), SAMPLE.seed, '')}</div>` : ''}${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 크기 · 자리: 라벨이 다 들어갈 만큼 크게 (가장 넓은 라벨이 폭 안, 라벨 높이 합이 쓸 수 있는 높이의 80% 안), 그 뒤 위에서부터 흩어 놓아요.
// 늘 한 장 (넘치면 더 작아져요). 서식 줄 크기(작게 ~ 크게)는 그 위에 곱해요. 쓰는 중 반듯한 글은 읽기 좋은 크기로
// 글자 크기 = 채우는 양 (95차): 꽉 차는 크기를 찾은 뒤 하이라이트와 같은 비율을 곱해요
function fit(el) {
  if (!el) return;
  const p = el.querySelector('.rb.body'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, Hh = W * (+el.dataset.ar || 1.25), [mt, mb] = H.margins(el), room = Hh - (mt + mb) * s;
  const ex = el.querySelector('.exm'), L = el.classList.contains('empty') && ex ? ex : ovOf(p); if (!L) return;
  el.style.height = Hh + 'px';
  L.style.top = mt * s + 'px'; L.style.height = room + 'px';
  const ks = [...L.querySelectorAll('.lk')], Lw = L.clientWidth, kf = H.FILL[el.dataset.size] || H.FILL.m, mul = 1;
  let f = 170 * s;
  // 줄(행): 라벨 하나, 또는 폭이 되면 두 라벨을 한 줄에 (왼쪽 · 오른쪽, 레퍼런스처럼 여러 조각이 엇갈려요). 짝 지을지는 씨앗으로
  const r = rng(((+(L.dataset.seed || el.dataset.seed) || 1) ^ 0x68e31da4) >>> 0), pair = ks.map(() => r() < .6);
  const rows = () => { const out = []; for (let i = 0; i < ks.length; i++) { const a = ks[i], b = ks[i + 1];
    if (pair[i] && b && !a.classList.contains('big') && a.offsetWidth + b.offsetWidth + Lw * .06 <= Lw) { out.push([a, b]); i++; } else out.push([a]); } return out; };
  const hOf = row => Math.max(...row.map(k => k.offsetHeight)) * (row.length > 1 ? 1.35 : 1);
  let R = [];
  const set = () => { L.style.fontSize = f + 'px'; R = rows(); return ks.some(k => k.offsetWidth > Lw) || R.reduce((a, row) => a + hOf(row), 0) > room * .85; };
  while (set() && f > 8) f *= .94;
  if (kf < 1) { f *= kf; set(); }
  const hs = R.map(hOf), free = Math.max(0, room - hs.reduce((a, b) => a + b, 0));
  const gaps = R.map(() => .25 + r()), gs = gaps.slice(0, -1).reduce((a, b) => a + b, 0) || 1, POS = [0, 0, .1, .22, .5, .8, 1];
  let y = 0, prev = -1;
  R.forEach((row, i) => {
    if (row.length === 1) {
      const k = row[0]; let pi = Math.floor(r() * POS.length); if (pi === prev) pi = (pi + 3) % POS.length; prev = pi;
      k.style.left = ((Lw - k.offsetWidth) * POS[pi]).toFixed(1) + 'px'; k.style.top = y.toFixed(1) + 'px';
    } else {
      const [a, b] = row, slack = Lw - a.offsetWidth - b.offsetWidth, up = r() < .5;
      a.style.left = (slack * r() * .3).toFixed(1) + 'px'; b.style.left = (Lw - b.offsetWidth - slack * r() * .25).toFixed(1) + 'px';
      a.style.top = (y + (up ? 0 : hs[i] - a.offsetHeight)).toFixed(1) + 'px'; b.style.top = (y + (up ? hs[i] - b.offsetHeight : 0)).toFixed(1) + 'px';
      prev = -1;
    }
    y += hs[i] + (i < R.length - 1 ? free * gaps[i] / gs : 0);
  });
  p.style.fontSize = (Math.min(f, 76 * mul * s)).toFixed(1) + 'px';
  p.style.marginTop = mt * s + 'px';
}

export default {
  id: 'label', name: '라벨 콜라주', info: '짧은 글 · 사진 없음 · 셔플마다 새 자리', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'bottom' }),
  render: (c, o) => { const el = label(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
