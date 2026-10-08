/* HTML 허용 목록 정리기, HTML → 텍스트 / 마크다운 */
import { LIMITS } from './config.js';
import { ICONS } from './icons.js';
import { $$ } from './utils.js';

/* ---------- HTML sanitizer (allowlist) — all rich text passes through here ---------- */
const SAFE = {
  tags: new Set(['P','DIV','BR','B','STRONG','I','EM','U','S','STRIKE','DEL','SPAN','MARK','UL','OL','LI','BLOCKQUOTE','H2','H3','A','HR']),
  drop: new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','TEMPLATE','SVG','MATH','IMG','VIDEO','AUDIO','CANVAS','FORM','INPUT','BUTTON','SELECT','TEXTAREA','NOSCRIPT','TITLE','HEAD','PICTURE','SOURCE','FRAME','FRAMESET','APPLET','BASE']),
  cls: /^(todo|done|c-(gray|red|orange|amber|green|teal|blue|violet|pink)|hl-(yellow|orange|green|blue|pink|violet)|bg-(yellow|orange|green|blue|pink|violet)|fs-(s|l|xl)|ico)$/
};
function sanitizeHTML(html) {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) return;
      if (ch.nodeType !== 1) { ch.remove(); return; }
      const tag = ch.tagName;
      if (SAFE.drop.has(tag)) { ch.remove(); return; }
      if (tag === 'H1' || tag === 'H4' || tag === 'H5' || tag === 'H6') { const h = doc.createElement(tag === 'H1' ? 'h2' : 'h3'); while (ch.firstChild) h.appendChild(ch.firstChild); ch.replaceWith(h); walk(h); return; }
      if (!SAFE.tags.has(tag)) { walk(ch); ch.replaceWith(...ch.childNodes); return; }
      const ico = ch.getAttribute('data-ico');
      const classes = (ch.getAttribute('class') || '').split(/\s+/).filter(c => SAFE.cls.test(c));
      const href = tag === 'A' ? (ch.getAttribute('href') || '').trim() : '';
      [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
      if (tag === 'A') {
        if (!/^https?:\/\//i.test(href)) { walk(ch); ch.replaceWith(...ch.childNodes); return; }
        ch.setAttribute('href', href); ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener noreferrer nofollow');
      }
      if (tag === 'SPAN' && classes.includes('ico')) {
        if (ico && ICONS[ico]) { ch.textContent = ''; ch.setAttribute('class', 'ico'); ch.setAttribute('data-ico', ico); } else ch.remove();
        return;
      }
      if (classes.length) ch.setAttribute('class', classes.join(' '));
      walk(ch);
      if (tag === 'SPAN' && !ch.attributes.length) ch.replaceWith(...ch.childNodes);
    });
  };
  walk(doc.body);
  return doc.body.innerHTML.slice(0, LIMITS.entryChars);
}
function hydrateIcons(root) {
  $$('span.ico[data-ico]', root).forEach(s => { s.setAttribute('contenteditable', 'false'); s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.dataset.ico] || ''}</svg>`; });
  return root;
}
function htmlToText(html) {
  const d = document.createElement('div'); d.innerHTML = html || '';
  let out = '';
  const block = /^(P|DIV|LI|BLOCKQUOTE|H2|H3|UL|OL)$/;
  const rec = n => {
    n.childNodes.forEach(c => {
      if (c.nodeType === 3) out += c.nodeValue;
      else if (c.nodeType === 1) {
        if (c.tagName === 'BR') { out += '\n'; return; }
        if (block.test(c.tagName) && out && !out.endsWith('\n')) out += '\n';
        if (c.tagName === 'LI') out += (c.parentNode.tagName === 'OL' ? ([...c.parentNode.children].indexOf(c) + 1) + '. ' : c.parentNode.classList.contains('todo') ? (c.classList.contains('done') ? '☑ ' : '☐ ') : '• ');
        rec(c);
        if (block.test(c.tagName) && !out.endsWith('\n')) out += '\n';
      }
    });
  };
  rec(d);
  return out.replace(/​/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
function htmlToMarkdown(html) {
  const d = document.createElement('div'); d.innerHTML = html || '';
  const inl = n => [...n.childNodes].map(c => {
    if (c.nodeType === 3) return c.nodeValue.replace(/([*_~`])/g, '\\$1');
    if (c.nodeType !== 1) return '';
    const s = inl(c);
    switch (c.tagName) {
      case 'B': case 'STRONG': return s.trim() ? `**${s}**` : s;
      case 'I': case 'EM': return s.trim() ? `*${s}*` : s;
      case 'S': case 'STRIKE': case 'DEL': return s.trim() ? `~~${s}~~` : s;
      case 'MARK': return s.trim() ? `==${s}==` : s;
      case 'A': return `[${s}](${c.getAttribute('href')})`;
      case 'BR': return '  \n';
      case 'SPAN': return c.classList.contains('ico') ? `:${c.dataset.ico}:` : s;
      default: return s;
    }
  }).join('');
  const blk = n => [...n.childNodes].map(c => {
    if (c.nodeType === 3) return c.nodeValue.trim() ? c.nodeValue + '\n\n' : '';
    if (c.nodeType !== 1) return '';
    switch (c.tagName) {
      case 'UL': return [...c.children].map(li => (c.classList.contains('todo') ? `- [${li.classList.contains('done') ? 'x' : ' '}] ` : '- ') + inl(li)).join('\n') + '\n\n';
      case 'OL': return [...c.children].map((li, i) => `${i + 1}. ${inl(li)}`).join('\n') + '\n\n';
      case 'BLOCKQUOTE': return inl(c).split('\n').map(l => '> ' + l).join('\n') + '\n\n';
      case 'H2': return '## ' + inl(c) + '\n\n';
      case 'H3': return '### ' + inl(c) + '\n\n';
      case 'HR': return '---\n\n';
      case 'P': case 'DIV': return inl(c) + '\n\n';
      default: return inl(c);
    }
  }).join('');
  return blk(d).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export { SAFE, htmlToMarkdown, htmlToText, hydrateIcons, sanitizeHTML };
