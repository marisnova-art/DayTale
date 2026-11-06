// PC (마우스 · 키보드) 동작 (11-06 PC). 화면은 폰과 같고, 동작만 PC에 맞춰요.
// ① 가로 줄: 마우스 휠 · 끌기로 넘겨요 ② 단축키: Ctrl+Z/Y · Esc · ←/→ ③ (export.js) 저장은 바로 내려받기
const UA = navigator.userAgent;
// 아이패드(맥처럼 보여도 터치가 있어요) · 폰은 빼요
export const isPC = matchMedia('(hover: hover) and (pointer: fine)').matches && !/iPhone|iPad|iPod|Android/i.test(UA) && !(/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);

// 옆으로 넘어가는 줄 (가장 가까운 것)
function hRow(el) {
  for (; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) { const o = getComputedStyle(el).overflowX; if (o === 'auto' || o === 'scroll') return el; }
  }
  return null;
}
// 한 장씩 넘기는 판 (카드 여러 장 · 책 · 달력): 칸 하나가 줄 너비만 해요
const isPager = r => { const c = [...r.children].find(x => x.offsetWidth); return !!c && c.offsetWidth >= r.clientWidth * .9; };
// 판의 장 자리들 (장 사이 틈까지 맞게) · 지금 장 번호
const stops = r => { const l = [...r.children].filter(x => x.offsetWidth), o = l[0]?.offsetLeft || 0, max = r.scrollWidth - r.clientWidth; return l.map(x => Math.min(max, Math.max(0, x.offsetLeft - o))); };
const nearK = (xs, v) => xs.reduce((k, x, i) => Math.abs(x - v) < Math.abs(xs[k] - v) ? i : k, 0);
function pageTo(r, from, dir) {
  const xs = stops(r); if (!xs.length) return; const k = Math.max(0, Math.min(xs.length - 1, nearK(xs, from) + dir));
  r.classList.remove('nosnap'); r.style.scrollSnapType = 'none'; r.scrollTo({ left: xs[k], behavior: 'smooth' });
  clearTimeout(freeTimers.get(r)); freeTimers.set(r, setTimeout(() => { r.style.scrollSnapType = ''; }, 450));
}
const NOGRAB = 'input, textarea, select, [contenteditable="true"], [contenteditable=""], .stage, .hbar, .tlc, .grip';

// 넘기는 동안은 칸에 붙지 않게, 멈추면 가장 가까운 칸에 부드럽게 붙여요
function snapNear(r) {
  r.style.scrollSnapType = '';
  const cs = getComputedStyle(r); if (cs.scrollSnapType === 'none' || !cs.scrollSnapType) return;
  const pl = parseFloat(cs.scrollPaddingLeft) || 0, pr = parseFloat(cs.scrollPaddingRight) || 0, max = r.scrollWidth - r.clientWidth, rl = r.getBoundingClientRect().left - r.scrollLeft;
  let best = r.scrollLeft, bd = 1e9;
  [...r.children].forEach(el => {
    if (!el.offsetWidth) return; const a = getComputedStyle(el).scrollSnapAlign.split(' ').pop(); if (a === 'none') return;
    const b = el.getBoundingClientRect(), x0 = b.left - rl;
    const x = a === 'start' ? x0 - pl : a === 'end' ? x0 + b.width - r.clientWidth + pr : x0 + b.width / 2 - r.clientWidth / 2;
    const v = Math.max(0, Math.min(max, x)); if (Math.abs(v - r.scrollLeft) < bd) { bd = Math.abs(v - r.scrollLeft); best = v; }
  });
  if (bd > .5) { r.style.scrollSnapType = 'none'; r.scrollTo({ left: best, behavior: 'smooth' }); setTimeout(() => { r.style.scrollSnapType = ''; }, 450); }
}
const freeTimers = new WeakMap();
function freeSnap(r, ms) {
  r.style.scrollSnapType = 'none'; clearTimeout(freeTimers.get(r));
  freeTimers.set(r, setTimeout(() => snapNear(r), ms));
}

function wheel() {
  // 휠 한 번(이어지는 휠)은 처음 시작한 곳만 움직여요: 페이지를 내리다 줄 위를 지나가도 줄에 걸리지 않게
  let last = 0, row = null;
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented) return;
    const now = performance.now(), fresh = now - last > 300; last = now;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) { row = null; return; }   // 트랙패드 옆 밀기 · Shift+휠은 원래대로
    if (fresh) { const r = hRow(e.target); row = r && !isPager(r) && !r.closest('.stage') ? r : null; }
    if (!row || !row.isConnected) return;
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? row.clientWidth : 1), max = row.scrollWidth - row.clientWidth;
    if ((d < 0 && row.scrollLeft <= 0) || (d > 0 && row.scrollLeft >= max - 1)) { if (fresh) row = null; return; }   // 끝이면 화면이 내려가요
    e.preventDefault(); freeSnap(row, 160); row.scrollLeft += d;
  }, { passive: false });
}

function drag() {
  let d = null;
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest?.(NOGRAB)) return;
    const r = hRow(e.target); if (!r) return;
    d = { r, x0: e.clientX, y0: e.clientY, l0: r.scrollLeft, on: false, pager: isPager(r), id: e.pointerId };
  }, true);
  addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { d = null; return; }
      if (Math.abs(dx) < 6) return;
      d.on = true; d.r.style.scrollSnapType = 'none'; clearTimeout(freeTimers.get(d.r)); document.documentElement.classList.add('dragx');
      getSelection()?.removeAllRanges();
    }
    d.r.scrollLeft = d.l0 - dx;
  }, true);
  const up = e => {
    if (!d || e.pointerId !== d.id) return; const g = d; d = null; if (!g.on) return;
    document.documentElement.classList.remove('dragx');
    if (g.pager) {   // 판: 조금만 끌어도 옆 장으로
      const dx = e.clientX - g.x0; pageTo(g.r, g.l0, dx < -40 ? 1 : dx > 40 ? -1 : 0);
    } else snapNear(g.r);
    // 끈 다음에 오는 누르기는 버려요 (끝에 놓인 카드가 열리지 않게)
    const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };
    addEventListener('click', eat, { capture: true, once: true }); setTimeout(() => removeEventListener('click', eat, true), 0);
  };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  addEventListener('dragstart', e => { if (hRow(e.target)) e.preventDefault(); }, true);   // 그림을 끌어 가지 않게
}

const shown = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
const lastShown = sel => [...document.querySelectorAll(sel)].filter(shown).pop();

// ←/→ : 크게 보기(책 순서) → 책 쪽 → 화면 가운데의 판(카드 여러 장 · 새 장 · 달력)
function stepH(dir) {
  const fv = lastShown('.fv');
  if (fv) { fv._step?.(dir); return true; }
  const bt = lastShown(`.brd [data-a=${dir > 0 ? 'next' : 'prev'}]`);
  if (bt) { bt.click(); return true; }
  const H = innerHeight; let best = null, bd = 1e9;
  document.querySelectorAll('.pgs, .cd.text, .wks, .mos, .ths, .tip, .whs, .rtr').forEach(r => {
    if (!shown(r) || r.scrollWidth <= r.clientWidth + 1 || !isPager(r)) return;
    const b = r.getBoundingClientRect(); if (b.bottom < 0 || b.top > H) return;
    const v = Math.abs((b.top + b.bottom) / 2 - H / 2); if (v < bd) { bd = v; best = r; }
  });
  if (!best) return false;
  pageTo(best, best.scrollLeft, dir); return true;
}

function keys() {
  addEventListener('keydown', e => {
    if (e.isComposing || e.keyCode === 229) return;   // 한글 조합 중
    const t = e.target, field = t.closest?.('input, textarea, select'), edit = t.closest?.('[contenteditable="true"], [contenteditable=""]');
    const mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
    // 쓰기 화면: 되돌리기 · 다시 (앱의 ↶ ↷ 와 같아요). 메모 · 장소 같은 칸 안에서는 그 칸 것
    if (mod && !e.altKey && (k === 'z' || k === 'y') && !field) {
      const b = document.querySelector(`.wr .tb .t[data-t=${k === 'y' || e.shiftKey ? 'redo' : 'undo'}]`); if (!b) return;
      e.preventDefault(); if (!b.classList.contains('off')) b.click(); return;
    }
    if (e.key === 'Escape') {
      const ask = lastShown('.ask-bg:not(.out)'); if (ask) { e.preventDefault(); (ask.querySelector('[data-r="0"]') || ask).click(); return; }
      const sh = lastShown('.sheet-bg:not(.out)'); if (sh) { e.preventDefault(); sh.click(); return; }
      if (field || edit) { e.preventDefault(); t.blur?.(); document.activeElement?.blur?.(); return; }   // 쓰는 중이면 쓰기만 멈춰요
      // 쓰기 화면의 작은 줄(색 막대 등) → 크게 보기 → 템플릿 소개 닫기 → 화면 뒤로
      const bk = lastShown('.wr [data-x=back]') || lastShown('.fvx') || lastShown('.tcl[data-a=x]') || lastShown('[aria-label="뒤로"]');
      if (bk) { e.preventDefault(); bk.click(); }
      return;
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !mod && !e.altKey && !e.shiftKey && !field && !edit) {
      if (lastShown('.ask-bg, .sheet-bg')) return;
      if (stepH(e.key === 'ArrowRight' ? 1 : -1)) e.preventDefault();
    }
  });
}

export function start() {
  if (!isPC) return;
  document.documentElement.classList.add('pc');
  wheel(); drag(); keys();
}
