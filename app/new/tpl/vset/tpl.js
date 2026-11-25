// 템플릿 틀: 비디오 세팅 (디자인, 11-25 96차). 옛 비디오 메뉴 화면의 느낌만: 픽셀 글씨(갈무리)로 '내 하루 설정 화면'.
// 맨 위 메뉴 띠(날짜) + 탭 · 가운데 내 글 (낱말 몇 개 반전 상자) · 아래 설정 줄 DAY(쓴 시각까지 칸) · TEXT(글 길이) · DATE ON/OFF · 맨 아래 ▶ PLAY · 녹화 점 · 시각.
// 색 = 색 조합 칩 (밝은 색이면 글씨가 짙게). 셔플 = 반전 낱말 · 켜진 탭 · 막대 모양.
// 쓰는 동안(글 상자에 커서)엔 반듯한 글, 키보드를 내리면 반전 낱말 (글 위에 한 겹). 보기 카드 · 저장 그림은 글 상자 안에 바로.
// 모션 (피드 가운데 카드만): ▶ · 녹화 점 깜빡 · 초가 흐름 · DAY 칸이 한 칸씩 차오름 · 주사선이 내려감 · 가끔 화면이 살짝 지직
import { rng, esc, px, soft, htmlOf, dateOn, placeOn, signOf, LH, shape, arOf } from '../../js/formats.js';
import { comboOf, paintCombo, lumOf } from '../../js/combo.js';
import H from '../hilite/tpl.js';

const SAMPLE = { html: '아침에 창문을 열었더니 공기가 차가웠다. 출근길에 따뜻한 라떼를 샀다. 퇴근길 하늘이 분홍색이었다.', seed: 4, pal: 2 };
const TABS = ['TODAY', 'NOTE', 'MOOD', 'SAVE'];
const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const two = n => String(n).padStart(2, '0');

// 반전 낱말: 앞에서부터 낱말마다 씨앗 한 번 (뒤에 글을 더 써도 앞은 그대로). 6어절에 하나쯤, 너무 오래 없으면 하나
function invert(root, seed) {
  root.querySelectorAll('.iv').forEach(s => s.replaceWith(...s.childNodes)); root.normalize();
  const r = rng(((seed || 1) ^ 0x61c88647) >>> 0), texts = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) texts.push(t);
  let last = -2, k = 0; const hits = [];
  texts.forEach(tn => { for (const m of tn.data.matchAll(/\S+/g)) { const x = r(); if ((x < .16 || k - last > 7) && k - last > 1) { hits.push([tn, m.index, m.index + m[0].replace(/[.,!?…"'”’)]+$/, '').length]); last = k; } k++; } });
  for (let i = hits.length - 1; i >= 0; i--) { const [tn, a, b] = hits[i]; if (b <= a) continue; const rg = document.createRange(); rg.setStart(tn, a); rg.setEnd(tn, b); const s = document.createElement('span'); s.className = 'iv'; rg.surroundContents(s); }
}
const ovOf = root => root.parentElement?.querySelector(':scope > .ovl');
function place(root, seed) {
  if (root.isContentEditable) {
    let ov = ovOf(root);
    if (!ov) { ov = document.createElement('div'); ov.className = 'rb ovl'; ov.setAttribute('aria-hidden', 'true'); root.after(ov); }
    ov.setAttribute('style', root.getAttribute('style') || ''); ov.innerHTML = root.innerHTML; invert(ov, seed);
    return false;
  }
  if (!root.querySelector('.iv')) invert(root, seed);
  return false;
}

function vset(c, { edit = false } = {}) {
  const el = document.createElement('div');
  el.className = 'cd cvst' + (edit ? ' edit' : '');
  const P = comboOf(c), light = lumOf(P.bg) > .45; paintCombo(el, P);
  el.style.setProperty('--vt', light ? P.ink : '#FFFFFF'); el.style.setProperty('--vb', P.bg); el.classList.toggle('dk', !light);
  const r = rng(((c.seed || 1) ^ 0x3243f6a8) >>> 0), tab = Math.floor(r() * TABS.length), dash = r() < .5;
  const [y, m, d] = String(c.date || '').split('-').map(Number), dt = new Date(y || 2026, (m || 1) - 1, d || 1), wd = WD[dt.getDay()];
  const at = c.created ? new Date(c.created) : new Date(), hh = at.getHours(), mm = at.getMinutes(), fill = Math.max(1, Math.round((hh + mm / 60) / 24 * 12));
  const html = soft(htmlOf(c), edit), empty = !html.replace(/<[^>]+>/g, '').trim();
  const len = Math.min(16, Math.max(1, Math.round(html.replace(/<[^>]+>/g, '').length / 8))), on = dateOn(c);
  const a = c.align || {}, lh = (1.6 * (LH[c.lh] || 1)).toFixed(3), sg = signOf(c);
  const ta = `text-align:${{ l: 'left', c: 'center', r: 'right' }[a.h || 'l']};line-height:${lh}`;
  el.dataset.dp = 'none'; el.dataset.seed = c.seed || 1;
  el.classList.toggle('hsg', !!sg);
  const place0 = placeOn(c) ? esc(c.place.trim()).toUpperCase() : '';
  el.innerHTML = `<div class="vtop"><div class="vbar"><span>◀ DAY SETTING</span><span>${on ? `${two(m)}.${two(d)} ${wd}` : '-- --'} ▶</span></div>
      <div class="vtab">${TABS.map((x, i) => `<span class="${i === tab ? 'on' : ''}">${x}</span>`).join('')}</div></div>
    <div class="rb body" data-v="${a.v || 't'}" style="${ta}" ${edit ? 'contenteditable="true" spellcheck="false" autocapitalize="off"' : ''}>${empty && !edit ? '<span class="ph">오늘 있었던 일을 써 보세요.</span>' : html}</div>
    ${edit ? `<div class="rb exm" style="${ta}">${SAMPLE.html}</div>` : ''}
    <div class="vbot">
      <div class="vrow"><span>DAY</span><div class="vseg">${Array.from({ length: 12 }, (_, i) => `<b class="${i < fill ? 'f' : ''}" style="animation-delay:${(i * .25).toFixed(2)}s"></b>`).join('')}</div><span>${two(hh)}:${two(mm)}</span></div>
      <div class="vrow"><span>TEXT</span><div class="vdash${dash ? ' d2' : ''}">${Array.from({ length: 16 }, (_, i) => `<b class="${i < len ? '' : 'o'}"></b>`).join('')}</div><span>${len * 8}</span></div>
      <div class="vrow"><span>${place0 ? 'PLACE' : 'DATE'}</span><div class="vtg">${place0 ? `<span class="on">${place0}</span>` : `<span class="${on ? 'on' : ''}">ON</span><span class="${on ? '' : 'on'}">OFF</span>`}</div><span></span></div>
      <div class="vft"><span class="vpl">▶ PLAY</span><span><i class="vrec"></i>${two(hh)}:${two(mm)}:<em class="vsec"><em class="vsc">${Array.from({ length: 60 }, (_, i) => `<i>${two((at.getSeconds() + i) % 60)}</i>`).join('')}</em></em></span></div>
    </div>${sg ? `<div class="sgn" data-h="${sg}">${esc(c.signTxt)}</div>` : ''}<div class="vscan"></div>`;
  shape(el, arOf(c));
  if (!empty || edit) place(el.querySelector('.rb'), c.seed);
  if (edit) invert(el.querySelector('.exm'), SAMPLE.seed);
  el.classList.toggle('empty', empty);
  return el;
}

// 크기: 위(메뉴) · 아래(설정 줄) 사이 칸에 글이 들어가게 (하이라이트와 같은 '채우는 양' 단계). 넘치면 카드가 길어지고 저장할 때 장으로
function margins(el) {
  const W = el.clientWidth || 1, s = W / 1080, t = el.querySelector('.vtop'), b = el.querySelector('.vbot');
  const r916 = el.classList.contains('r916');
  return [((t ? t.offsetTop + t.offsetHeight : 200) / s) + 40, ((b ? el.clientHeight - b.offsetTop : 420) / s) + 40 + (r916 ? 0 : 0)];
}
function fit(el) {
  const p = el.querySelector('.rb.body'); if (!p) return;
  const W = el.clientWidth; if (!W) return;
  const s = W / 1080, Hh = W * (+el.dataset.ar || 1.25); el.style.height = Hh + 'px';
  const [mt, mb] = margins(el), room = Hh - (mt + mb) * s;
  const ov = ovOf(p), ex = el.querySelector('.exm'), box = el.classList.contains('empty') && ex ? ex : ov || p;
  const k = H.FILL[el.dataset.size] || H.FILL.m;
  let f = 96;
  const set = () => { [p, ov, ex].forEach(x => { if (x) x.style.fontSize = px(f); }); return box.offsetHeight; };
  while (set() > room && f > 34) f *= .94;
  if (k < 1) { f = Math.max(30, f * k); set(); }
  let top = mt * s; const h = box.offsetHeight;
  if (h > room + 1) el.style.height = Math.ceil(h + (mt + mb) * s) + 'px';
  else { const v = el.closest('.wr.typ') ? 't' : p.dataset.v || 't'; if (v !== 't') top += (room - h) * ({ tm: .25, m: .5, bm: .75, b: 1 }[v] ?? .5); }
  [p, ov, ex].forEach(x => { if (x) x.style.marginTop = top + 'px'; });
}

export default {
  id: 'vset', name: '비디오 세팅', info: '짧은 글 · 사진 없음 · 셔플마다 새 화면', paid: true, css: true,
  tools: { photo: false, emo: false, page: false, shuf: true, style: true, font: false, bg: 'combo', dp: true },
  fonts: [['grid.css', 'DT Galmuri']],
  sample: SAMPLE,
  datePos: 'top',
  blank: () => ({ html: '', seed: Math.floor(Math.random() * 1e9), size: 'm', align: { h: 'l', v: 't' }, datePos: 'top' }),
  render: (c, o) => { const el = vset(c, o); el.dataset.size = c.size || 'm'; return el; },
  fit, margins, place,
  tone: c => comboOf(c).bg,
};
