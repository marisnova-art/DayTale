// 템플릿 틀: 글 탑 (디자인, 11-25 93차). 앤드류 레퍼런스(파란 덩어리 날짜 탑)의 느낌: 쓴 글을 7글자 안쪽으로 끊어 둥근 덩어리에 담고 쌓아요.
// 덩어리끼리 겹쳐 붙어 굽이치는 한 덩어리 탑 · 좌우로 어긋나고 조금씩 기울어요 · 몇 덩어리엔 짧은 윗줄. 셔플 = 어긋남 · 기울기 · 윗줄.
// 색: 덩어리 = 조합 배경색, 덩어리 글자 = 조합 글자색, 바탕 = 흰 종이 (밝은 조합이면 검은 종이).
// 날짜는 기본 꺼짐 · 켜면 아래 날짜 줄 대신 탑 끝에 덩어리로, 휴대폰 언어로 (앤드류 11-25). 장소도 켜면 덩어리로.
// 쓰는 동안(글 상자에 커서)엔 반듯한 글, 키보드를 내리면 탑 (글 위에 탑을 한 겹 깔아요). 보기 카드 · 저장 그림은 글 상자 안을 탑으로 바꿔요.
// 모션 (피드 가운데 카드만): 레퍼런스 영상처럼 탑이 위로 천천히 흘러 끝없이 이어져요
import { rng, esc, px, soft, htmlOf, dateOn, placeOn, signOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo, lumOf } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '퇴근길 하늘이 분홍색이었다. 버스를 한 정거장 일찍 내려서 걸어왔다.', seed: 5, pal: 2 };
const ONES = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
const dayWord = d => d < 20 ? ONES[d] : (d < 30 ? 'TWENTY' : 'THIRTY') + ONES[d % 10];
const lang = () => { const l = (navigator.language || 'ko').slice(0, 2); return ['ko', 'en', 'ja', 'es', 'fr'].includes(l) ? l : 'en'; };
// 날짜 덩어리 (휴대폰 언어): 한국어 11월 · 25일 · 수요일 · 2026 / 영어 WEDNESDAY · TWENTYFIVE · NOVEMBER · 2026 / 일본어 11月 · 25日 · 水曜日 · 2026 …
export function dateBits(ds, L = lang()) {
  const [y, m, d] = String(ds).split('-').map(Number), dt = new Date(y, m - 1, d);
  const wd = new Intl.DateTimeFormat(L, { weekday: 'long' }).format(dt), mo = new Intl.DateTimeFormat(L, { month: 'long' }).format(dt);
  if (L === 'ko') return [mo, `${d}일`, wd, String(y)];
  if (L === 'ja') return [mo, `${d}日`, wd, String(y)];
  if (L === 'en') return [wd.toUpperCase(), dayWord(d), mo.toUpperCase(), String(y)];
  return [wd.toUpperCase(), String(d), mo.toUpperCase(), String(y)];
}
// 글 → 덩어리 (7글자 안쪽, 긴 글은 11). 줄바꿈은 띄어쓰기로
const plainOf = h => { const t = document.createElement('div'); t.innerHTML = (h || '').replace(/<br\s*\/?>|<\/(div|p|li|h2|h3)>/gi, ' '); return t.textContent; };
export function chunks(text) {
  const ws = text.split(/\s+/).filter(Boolean), lim = ws.length > 18 ? 11 : 7, out = []; let cur = [];
  ws.forEach(w => { if (cur.length && (cur.join('') + w).length > lim) { out.push(cur.join(' ')); cur = []; } cur.push(w); });
  if (cur.length) out.push(cur.join(' '));
  return out;
}
function towerHtml(text, seed, extra) {
  const r = rng(((seed || 1) ^ 0x7f4a7c15) >>> 0), list = [...chunks(text).map(t => [t, 0]), ...extra.map(t => [t, 1])];
  return `<div class="tw">${list.map(([t, d]) => { const x = r(), y = r(), z = r(), w = r();
    return `<div class="tk${d ? ' d' : ''}" style="translate:${((x - .5) * 3.6).toFixed(2)}em 0;rotate:${((y - .5) * 9).toFixed(1)}deg">${z < .5 ? `<i style="left:${Math.round(18 + w * 52)}%"></i>` : ''}${esc(t)}</div>`; }).join('')}</div>`;
}
const ovOf = root => root.parentElement?.querySelector(':scope > .ovl');
const extraOf = root => { try { return JSON.parse(root.closest('.cd')?.dataset.ex || '[]'); } catch { return []; } };
// 쓰는 글 상자 → 위에 깐 탑(.ovl)을 다시 만들어요. 보기 카드 → 글 상자 안을 탑으로. 늘 false (고치는 글은 그대로)
function place(root, seed) {
  const ex = extraOf(root);
  if (root.isContentEditable) {
    let ov = ovOf(root);
    if (!ov) { ov = document.createElement('div'); ov.className = 'rb ovl'; ov.setAttribute('aria-hidden', 'true'); root.after(ov); }
    ov.innerHTML = towerHtml(plainOf(root.innerHTML), seed, ex);
    if (ov.isConnected) fit(root.closest('.cd'));
    return false;
  }
  if (!root.querySelector('.tw')) root.innerHTML = towerHtml(plainOf(root.innerHTML), seed, ex);
  return false;
}

function tower(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd ctwr' + (edit ? ' edit' : '');
  const P = comboOf(c); paintCombo(el, P);
  const darkPaper = lumOf(P.bg) > .45, paper = darkPaper ? '#161616' : '#FAFAF7';
  el.style.setProperty('--paper', paper); el.style.setProperty('--pk', darkPaper ? '#F2F0EC' : '#1E1B18'); el.style.setProperty('--blob', P.bg); el.style.setProperty('--bt', P.ink); el.classList.toggle('dk', darkPaper);
  const ex = [...(dateOn(c) ? dateBits(c.date) : []), ...(placeOn(c) ? [c.place.trim()] : [])];
  el.dataset.ex = JSON.stringify(ex); el.dataset.seed = c.seed || 1;
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const sg = signOf(c), fz = { xs: 3.2, s: 3.5, m: 3.7, l: 4.2, xl: 4.6 }[c.size] || 3.7, lh = (1.5 * (LH[c.lh] || 1)).toFixed(3);
  el.dataset.dp = 'none';   // 날짜 · 장소는 탑 안에
  el.classList.toggle('hsg', !!sg);
  el.innerHTML = `<div class="rb body" style="line-height:${lh}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm">${towerHtml(plainOf(SAMPLE.html), SAMPLE.seed, [])}</div>` : ''}${sg ? `<div class="sgn" data-h="${sg}" style="font-size:${fz}cqw">${esc(c.signTxt)}</div>` : ''}`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 크기: 탑이 카드 높이(9:16은 안전 영역 안)에 들어가고 덩어리가 좌우로 넘치지 않을 만큼 크게. 가장 작아도 넘치면 카드가 길어지고 저장할 때 장으로.
// 서식 줄 크기(작게 ~ 크게)는 그 위에 곱해요. 위아래 가운데. 다 재고 나면 흐르는 모션용 탑 줄(.twl)을 만들어요
const MUL = { xs: .8, s: .9, m: 1, l: 1.1, xl: 1.2 };
function fit(el) {
  if (!el) return;
  const p = el.querySelector('.rb.body'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, Hh = W * (+el.dataset.ar || 1.25), [mt, mb] = H.margins(el), room = Hh - (mt + mb) * s;
  const ov = ovOf(p), ex = el.querySelector('.exm'), box = el.classList.contains('empty') && ex ? ex : ov || p, tw = box.querySelector('.tw');
  const mul = MUL[el.dataset.size] || 1, R = el.getBoundingClientRect();
  const over = () => tw && [...tw.children].some(k => { const q = k.getBoundingClientRect(); return q.left < R.left + W * .05 || q.right > R.right - W * .05; });
  let f = 150 * mul;
  const set = () => { [box, ov].forEach(x => { if (x) x.style.fontSize = px(f); }); return box.offsetHeight; };
  while ((set() > room || over()) && f > 50) f *= .95;
  if (ov || ex) p.style.fontSize = px(Math.min(f, 76 * mul));   // 쓰는 중 반듯한 글은 읽기 좋은 크기로
  const h = box.offsetHeight, need = h + (mt + mb) * s;
  let top = mt * s;
  if (need > Hh + 1) el.style.height = Math.ceil(need) + 'px';
  else { el.style.height = Hh + 'px'; top += (room - h) / 2; }
  [ov, ex].forEach(x => { if (x) x.style.marginTop = top + 'px'; });
  p.style.marginTop = (ov || ex ? mt * s : top) + 'px'; p.style.marginBottom = px(mb);
  loop(el, box, tw, top, h, Hh);
}
// 흐르는 모션: 탑을 위아래로 여러 벌 이어 붙인 줄. 한 벌 높이만큼 위로 올라가면 처음과 똑같아서 끝없이 이어져요 (정지 그림 · 저장엔 안 보여요)
function loop(el, box, tw, top, h, Hh) {
  el.querySelector(':scope > .twl')?.remove();
  if (!tw || el.classList.contains('edit') || el.classList.contains('paged') || h < 10 || h > Hh) return;
  const gap = h * .02, th = h + gap, above = Math.ceil(top / th), n = above + Math.ceil((Hh - top) / th) + 2;
  const L = document.createElement('div'); L.className = 'twl'; L.setAttribute('aria-hidden', 'true');
  L.style.cssText = `top:${(top - above * th).toFixed(1)}px;left:${box.offsetLeft}px;width:${box.clientWidth}px;height:${th.toFixed(1)}px;font-size:${box.style.fontSize};line-height:${box.style.lineHeight};animation-duration:${(th / el.clientWidth * 14).toFixed(1)}s`;
  for (let j = 0; j < n; j++) { const cp = tw.cloneNode(true); cp.style.top = (j * th).toFixed(1) + 'px'; L.appendChild(cp); }
  el.appendChild(L);
}

export default {
  id: 'tower', name: '글 탑', info: '짧은 글 · 사진 없음 · 셔플마다 새 탑', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  sample: SAMPLE,
  datePos: 'bottom',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'c', v: 'm' }, datePos: 'bottom' }),
  render: (c, o) => { const el = tower(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins: H.margins, place,
  tone: c => comboOf(c).bg,
};
