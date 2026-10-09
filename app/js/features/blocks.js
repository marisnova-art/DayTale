/* 글쓰기 줄 모양 (제목 · 인용 · 본문 · 목록 · 체크리스트) 과 되돌리기.
   브라우저 기본 명령(execCommand)은 목록을 풀 때 줄이 깨지고 글자에 style 이 붙어서, 줄을 직접 옮겨요.
   글자 노드는 그대로 옮기기만 하니 커서·고른 범위가 제자리에 남아요. */
const BLOCK = /^(P|DIV|H2|H3|BLOCKQUOTE|LI)$/;
const INLINE_OK = n => n.nodeType === 3 || (n.nodeType === 1 && !/^(P|DIV|H2|H3|BLOCKQUOTE|UL|OL|LI|HR)$/.test(n.tagName));
const kindOf = list => !list ? null : list.tagName === 'OL' ? 'numbered' : list.classList.contains('todo') ? 'check' : 'bullet';

// 맨 바깥에 떠 있는 글자를 <p> 로 묶어요 (줄 단위로 다루기 위해)
function wrapLoose(body) {
  let run = [];
  const flush = before => { if (!run.length) return; if (run.some(n => n.textContent.trim() || n.nodeName === 'BR' || n.nodeType === 1)) { const p = document.createElement('p'); body.insertBefore(p, before); p.append(...run); } run = []; };
  [...body.childNodes].forEach(n => { if (INLINE_OK(n)) run.push(n); else flush(n); });
  flush(null);
}
const fill = el => { if (!el.textContent.replace(/​/g, '') && !el.querySelector('br')) el.append(document.createElement('br')); return el; };
function retag(el, tag) {
  if (el.tagName === tag.toUpperCase()) return el;
  const n = document.createElement(tag); n.append(...el.childNodes); el.replaceWith(n); return fill(n);
}
// 목록에서 한 줄을 꺼내 <p> 로 (목록은 위아래로 나뉘어요)
function liftOut(li) {
  const list = li.parentNode, after = [...list.children].slice([...list.children].indexOf(li) + 1);
  const p = document.createElement('p'); p.append(...li.childNodes); fill(p);
  list.after(p);
  if (after.length) { const rest = list.cloneNode(false); rest.append(...after); p.after(rest); }
  li.remove(); if (!list.children.length) list.remove();
  return p;
}
function toItem(el, kind) {
  const prev = el.previousElementSibling;
  const li = document.createElement('li'); li.append(...el.childNodes); fill(li);
  if (prev && kindOf(prev) === kind && /^(UL|OL)$/.test(prev.tagName)) { prev.append(li); el.remove(); }
  else { const list = document.createElement(kind === 'numbered' ? 'ol' : 'ul'); if (kind === 'check') list.className = 'todo'; el.replaceWith(list); list.append(li); }
  return li;
}
function mergeLists(body) {
  body.querySelectorAll(':scope > ul + ul, :scope > ol + ol').forEach(l => { const p = l.previousElementSibling; if (p && kindOf(p) === kindOf(l)) { p.append(...l.children); l.remove(); } });
}

// 지금 고른 줄들 (커서만 있으면 그 줄 하나)
function selected(body) {
  const s = getSelection(); if (!s.rangeCount || !body.contains(s.anchorNode)) return [];
  const r = s.getRangeAt(0), out = [];
  for (const top of body.children) {
    if (!r.intersectsNode(top) && !top.contains(r.startContainer)) continue;
    if (top.tagName === 'UL' || top.tagName === 'OL') { for (const li of top.children) if (r.intersectsNode(li) || li.contains(r.startContainer)) out.push(li); }
    else if (BLOCK.test(top.tagName)) out.push(top);
  }
  return out;
}
// 커서·범위를 기억했다가 줄을 바꾼 뒤 되돌려요 (바뀐 줄 요소는 새 요소로 이어 줘요)
function keep(body, fn) {
  const s = getSelection(), r = s.rangeCount && body.contains(s.anchorNode) ? s.getRangeAt(0) : null;
  const mark = r && { sc: r.startContainer, so: r.startOffset, ec: r.endContainer, eo: r.endOffset };
  const map = new Map();
  fn(map);
  if (!mark) return;
  const fix = n => { while (map.has(n)) n = map.get(n); return n; };
  const sc = fix(mark.sc), ec = fix(mark.ec);
  if (!body.contains(sc) || !body.contains(ec)) return;
  try { const nr = document.createRange(); nr.setStart(sc, Math.min(mark.so, len(sc))); nr.setEnd(ec, Math.min(mark.eo, len(ec))); s.removeAllRanges(); s.addRange(nr); } catch { /* 커서를 못 옮기면 그대로 */ }
}
const len = n => n.nodeType === 3 ? n.length : n.childNodes.length;

/* 줄 모양 바꾸기: k = heading | quote | p | bullet | numbered | check. 같은 걸 다시 누르면 본문으로 */
export function setBlock(body, k) {
  keep(body, map => {
    wrapLoose(body);
    let blocks = selected(body);
    if (!blocks.length) return;
    const isList = k === 'bullet' || k === 'numbered' || k === 'check';
    const has = b => isList ? b.tagName === 'LI' && kindOf(b.parentNode) === k : b.tagName === (k === 'heading' ? 'H2' : k === 'quote' ? 'BLOCKQUOTE' : 'P');
    const off = k !== 'p' && blocks.every(has);
    // 목록 줄은 먼저 꺼내요 (같은 목록으로 바꾸는 줄은 그대로)
    blocks = blocks.map(b => { if (b.tagName === 'LI' && !(isList && !off && has(b))) { const p = liftOut(b); map.set(b, p); return p; } return b; });
    blocks.forEach(b => {
      let n = b;
      if (isList) { if (!off && b.tagName !== 'LI') { if (b.tagName !== 'P') { n = retag(b, 'p'); map.set(b, n); } const li = toItem(n, k); map.set(n, li); } }
      else { const tag = off || k === 'p' ? 'p' : k === 'heading' ? 'h2' : 'blockquote'; n = retag(b, tag); if (n !== b) map.set(b, n); }
    });
    mergeLists(body);
  });
}
export const blockState = (body, node) => {
  let n = node; while (n && n !== body) { if (n.nodeType === 1 && BLOCK.test(n.tagName)) break; n = n.parentNode; }
  return n && n !== body ? n : null;
};

/* 되돌리기 / 다시 하기: 글 쓰는 중에는 잠깐 멈출 때마다, 서식을 바꾸기 직전에는 바로 찍어 둬요 */
export class History {
  constructor(body) { this.body = body; this.undo = []; this.redo = []; this.t = 0; this.last = null; this.snap(); }
  state() { return { html: this.body.innerHTML, at: caretAt(this.body) }; }
  snap() { clearTimeout(this.t); const s = this.state(); if (this.last && this.last.html === s.html) { this.last.at = s.at; return; } if (this.last) this.undo.push(this.last); if (this.undo.length > 100) this.undo.shift(); this.last = s; this.redo = []; }
  soon() { clearTimeout(this.t); this.t = setTimeout(() => this.snap(), 600); }
  back() { this.snap(); const s = this.undo.pop(); if (!s) return false; this.redo.push(this.last); this.apply(s); return true; }
  fwd() { const s = this.redo.pop(); if (!s) return false; this.undo.push(this.last); this.apply(s); return true; }
  apply(s) { this.last = s; this.body.innerHTML = s.html; caretTo(this.body, s.at); }
  get canUndo() { return this.undo.length > 0 || (this.last && this.last.html !== this.body.innerHTML); }
}
function caretAt(body) {
  const s = getSelection(); if (!s.rangeCount || !body.contains(s.anchorNode)) return null;
  const r = document.createRange(); r.selectNodeContents(body); r.setEnd(s.anchorNode, s.anchorOffset); return r.toString().length;
}
function caretTo(body, at) {
  if (at == null) return;
  const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); let n, left = at, last = null;
  while ((n = w.nextNode())) { last = n; if (left <= n.length) break; left -= n.length; }
  const s = getSelection(), r = document.createRange();
  if (n) r.setStart(n, left); else if (last) r.setStart(last, last.length); else r.setStart(body, 0);
  r.collapse(true); s.removeAllRanges(); s.addRange(r);
}
