// 글 서식 도구: 카드 위 글(contenteditable)을 키보드 없이도 고칠 수 있게, 고른 글자를 '본문 처음부터 몇 번째 글자'로 다뤄요
const ALLOWED = new Set(['B', 'STRONG', 'MARK', 'H2', 'H3', 'UL', 'LI', 'BR', 'DIV', 'P']);
export function clean(html) {
  const t = document.createElement('div'); t.innerHTML = (html || '').replace(/\u200B/g, '');   // 이모티콘 뒤 커서 자리 표시는 저장하지 않아요
  const walk = n => [...n.childNodes].forEach(ch => {
    if (ch.nodeType === 1) {
      if (ch.classList.contains('o') || ch.classList.contains('exm')) { ch.remove(); return; }   // 그림 문장 그림은 저장하지 않아요(씨앗으로 다시 그려요)
      if (ch.tagName === 'SPAN' && ch.classList.contains('stk') && ch.dataset.st) {   // 이모티콘: 이름만 저장해요
        const s = document.createElement('span'); s.className = 'stk'; s.dataset.st = ch.dataset.st; if (ch.dataset.v === 'l') s.dataset.v = 'l'; ch.replaceWith(s); return;
      }
      walk(ch);
      if (ch.tagName === 'SPAN' && /background/.test(ch.getAttribute('style') || '')) { const m = document.createElement('mark'); m.append(...ch.childNodes); ch.replaceWith(m); return; }
      if (ch.tagName === 'SPAN' && /font-weight:\s*(bold|[6-9]00)/.test(ch.getAttribute('style') || '')) { const b = document.createElement('b'); b.append(...ch.childNodes); ch.replaceWith(b); return; }
      if (!ALLOWED.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return; }
      [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
    } else if (ch.nodeType !== 3) ch.remove();
  });
  walk(t);
  return t.innerHTML.replace(/^(<br>)+$/, '').replace(/​/g, '');
}

// 서식은 키보드를 내린 채로 바꿔요. 고른 글자는 '본문 처음부터 몇 번째 글자'로 기억해 두고, 바꾼 뒤 다시 찾아요
export function offsetsOf(root, r) {
  const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(r.startContainer, r.startOffset);
  const a = pre.toString().length; return [a, a + r.toString().length];
}
export function rangeAt(root, a, b) {
  const r = document.createRange(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n, pos = 0, started = false;
  while ((n = w.nextNode())) {
    if (!started && a <= pos + n.length) { r.setStart(n, a - pos); started = true; }
    if (started && b <= pos + n.length) { r.setEnd(n, b - pos); return r; }
    pos += n.length;
  }
  r.selectNodeContents(root); if (!started) r.collapse(false);
  return r;
}
export function textBits(root, r) {
  const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!r.intersectsNode(n)) continue;
    const s = n === r.startContainer ? r.startOffset : 0, e = n === r.endContainer ? r.endOffset : n.length;
    if (e > s) out.push([n, s, e]);
  }
  return out;
}
export const inside = (root, n, tag) => { const t = n.parentElement?.closest(tag); return t && root.contains(t) ? t : null; };
export const isOn = (root, r, tag) => { const bits = textBits(root, r); return bits.length > 0 && bits.every(([n]) => inside(root, n, tag)); };
// 강조 · 형광펜: 고른 글자를 글자 칸마다 감싸요 (줄을 넘어 골라도 줄이 깨지지 않게)
export function toggleInline(root, r, tag) {
  const bits = textBits(root, r); if (!bits.length) return false;
  if (bits.every(([n]) => inside(root, n, tag))) new Set(bits.map(([n]) => inside(root, n, tag))).forEach(t => t.replaceWith(...t.childNodes));
  else for (const [n, s, e] of bits) {
    if (inside(root, n, tag)) continue;
    let t = n; if (s) t = t.splitText(s); if (e - s < t.length) t.splitText(e - s);
    const w = document.createElement(tag); t.replaceWith(w); w.appendChild(t);
  }
  root.normalize(); return true;
}
// 제목 · 목록은 줄 단위. 먼저 본문 맨 위 칸을 모두 줄(div · h2 · ul)로 맞춰요
export const retag = (el, tag) => { const n = document.createElement(tag); n.append(...el.childNodes); el.replaceWith(n); return n; };
export function toLines(root) {
  let run = null;
  [...root.childNodes].forEach(n => {
    if (n.nodeType === 1 && /^(DIV|P|H2|H3|UL)$/.test(n.tagName)) { run = null; if (n.tagName === 'P') retag(n, 'div'); return; }
    if (n.nodeType === 1 && n.tagName === 'BR') { if (run) n.remove(); else { const d = document.createElement('div'); n.replaceWith(d); d.appendChild(n); } run = null; return; }
    if (!run) { run = document.createElement('div'); n.before(run); }
    run.appendChild(n);
  });
}
// 줄로 나눈 뒤에도 같은 자리를 가리키도록 (맨 첫 줄 글자가 div로 옮겨지면 원래 범위가 풀려요)
function linesAfterSplit(root, r) {
  const [a, b] = offsetsOf(root, r); toLines(root);
  return linesIn(root, rangeAt(root, a, b) || r);
}
export function linesIn(root, r) {
  const out = [];
  [...root.children].forEach(b => {
    if (b.tagName === 'UL') [...b.children].forEach(li => { if (r.intersectsNode(li)) out.push(li); });
    else if (r.intersectsNode(b)) out.push(b);
  });
  return out;
}
export function unlist(li) {
  const ul = li.parentNode, after = [...ul.children].slice([...ul.children].indexOf(li) + 1);
  const d = retag(li, 'div'); ul.after(d);
  if (after.length) { const u2 = document.createElement('ul'); u2.append(...after); d.after(u2); }
  if (!ul.children.length) ul.remove();
  return d;
}
export function toggleHead(root, r) {
  let ls = linesAfterSplit(root, r); if (!ls.length) return false;
  const all = ls.every(l => l.tagName === 'H2');
  ls.map(l => l.tagName === 'LI' ? unlist(l) : l).forEach(l => retag(l, all ? 'div' : 'h2'));
  return true;
}
// 글자 크기: 고른 줄(커서가 있는 줄)을 큰(h2) · 중간(div) · 작은(h3) 글자로. 목록 줄은 그대로 둬요
export function setSize(root, r, tag) {
  const ls = linesAfterSplit(root, r).filter(l => l.tagName !== 'LI'); if (!ls.length) return false;
  ls.forEach(l => { if (l.tagName !== tag.toUpperCase()) retag(l, tag); });
  return true;
}
export function toggleList(root, r) {
  let ls = linesAfterSplit(root, r); if (!ls.length) return false;
  if (ls.every(l => l.tagName === 'LI')) { ls.forEach(unlist); return true; }
  ls = ls.map(l => l.tagName === 'LI' ? unlist(l) : l);
  const ul = document.createElement('ul'); ls[0].before(ul);
  ls.forEach(l => ul.appendChild(retag(l, 'li')));
  return true;
}

