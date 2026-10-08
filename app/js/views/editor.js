/* 기록 편집기: 제목 + 본문(서식), 아래 막대 하나(모바일은 키보드 위로 따라와요), 떠 있는 서식 막대, "/" 블록 메뉴, 마크다운 단축, 체크리스트, 템플릿, 자동 저장 */
import { CFG } from '../core/config.js';
import { S, displayTitle, isEmpty, newEntry, onChange, patchEntry, saveEntry, trashEntry } from '../data/store.js';
import { sticker } from '../core/stickers.js';
import { htmlToText, sanitizeHTML } from '../core/sanitize.js';
import { fmtDate, fmtRel, t } from '../core/i18n.js';
import { $, $$, debounce, esc, icon, todayKey } from '../core/utils.js';
import { confirmDlg, openSheet, promptDlg, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';
import { TYPE_STICKER, pickAction, pickFolder, pickType, typeLabel } from './pickers.js';
import { Photos } from '../features/photos.js';

const BLOCKS = [
  { k: 'check', ic: 'list-todo', kbd: '[ ]' }, { k: 'heading', ic: 'type', kbd: '#' }, { k: 'bullet', ic: 'list', kbd: '-' },
  { k: 'numbered', ic: 'list-ordered', kbd: '1.' }, { k: 'quote', ic: 'text-quote', kbd: '>' }, { k: 'divider', ic: 'minus', kbd: '---' }
];
const TEMPLATES = ['diary', 'meeting', 'shopping', 'reading'];
let cur = null;   // { e, isNew, saved, el, off }

function render(view, r) {
  leave();
  const isNew = r.path === '/new';
  const e = isNew ? newEntry({ type: r.query.type || S.prefs.defaultType || 'note', folder_id: r.query.folder || null, meta: r.query.date ? { date: r.query.date } : {} })
    : S.entries.get(r.params.id);
  if (!e) { view.innerHTML = `<div class="ed-page"><div class="ed"><div class="ed-top"><button class="icon-btn" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button></div><p class="note" style="padding:40px 4px">${esc(t('list.noResults'))}</p></div></div>`; view.querySelector('[data-act=back]').onclick = () => history.length > 1 ? history.back() : go('/home'); return; }
  const ro = !S.canWrite;
  view.innerHTML = `<div class="ed-page"><div class="ed">
    <div class="ed-top"><button class="icon-btn" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button>
      <span class="r"><button class="icon-btn" data-act="undo" aria-label="${esc(t('ed.undo'))}" style="color:#C9C5CF">${icon('undo-2', 19)}</button>
      <button class="icon-btn" data-act="more" aria-label="${esc(t('ed.more'))}" style="color:#C9C5CF">${icon('more-horizontal', 20)}</button>
      <button class="done" data-act="done">${esc(t('ed.done'))}</button></span></div>
    ${ro ? `<div class="ed-locked"><span>${esc(t('ed.locked'))}</span><button data-act="plans">${esc(t('trial.plans'))}</button></div>` : ''}
    <div class="ed-chips"></div><div class="ed-meta"></div><div class="ed-photos"></div>
    <textarea class="ed-title" rows="1" maxlength="300" placeholder="${esc(t('ed.title'))}" ${ro ? 'readonly' : ''}></textarea>
    <div class="ed-body" ${ro ? '' : 'contenteditable="true"'} spellcheck="true" data-ph="${esc(t('ed.body'))}" role="textbox" aria-multiline="true" aria-label="${esc(t('ed.body'))}"></div>
    <div class="ed-foot"></div>
  </div>
  ${ro ? '' : `<div class="ed-bar"><div class="cap" role="toolbar">
    <button class="tb mo" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button><span class="sep mo"></span>
    <button class="tb" data-act="fb" data-f="bold" aria-label="${esc(t('ed.bold'))}">${icon('bold', 20)}</button>
    <button class="tb" data-act="check" aria-label="${esc(t('ed.check'))}">${icon('list-todo', 20)}</button>
    <button class="tb" data-act="blocks" aria-label="${esc(t('ed.addBlock'))}">${icon('plus', 20)}</button>
    ${CFG.PHOTOS_URL ? `<button class="tb" data-act="photo" aria-label="${esc(t('ed.photo'))}">${icon('image', 20)}</button>` : ''}
    <button class="tb" data-act="template" aria-label="${esc(t('ed.template'))}">${icon('layout-template', 20)}</button>
    <button class="tb mo" data-act="more" aria-label="${esc(t('ed.more'))}">${icon('more-horizontal', 20)}</button>
    <span class="sp"></span><button class="saved mo" data-act="done">${icon('check', 18)}<span>${esc(t('ed.done'))}</span></button></div>
    <input type="file" accept="image/*" multiple hidden class="ed-file"></div>`}
  </div>`;
  const el = { root: view, title: $('.ed-title', view), body: $('.ed-body', view), chips: $('.ed-chips', view), meta: $('.ed-meta', view), photos: $('.ed-photos', view), foot: $('.ed-foot', view) };
  cur = { e, isNew, el, ro };
  el.title.value = e.title; el.body.innerHTML = e.content || (e.text ? e.text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join('') : '');
  paintChips(); paintPhotos(); paintFoot();
  const save = debounce(() => commit(), 600); cur.save = save;
  el.title.addEventListener('input', save);
  el.title.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); placeCaret(el.body, true); } });
  el.body.addEventListener('input', ev => { shortcuts(ev); slashWatch(); save(); });
  el.body.addEventListener('keydown', onKey);
  el.body.addEventListener('focus', () => document.execCommand('defaultParagraphSeparator', false, 'p'));
  el.body.addEventListener('click', onBodyClick);
  el.body.addEventListener('paste', onPaste);
  document.addEventListener('selectionchange', onSel);
  view.addEventListener('click', onAct);
  $('.ed-bar .cap', view)?.addEventListener('mousedown', ev => { if (ev.target.closest('[data-act=fb],[data-act=check],[data-act=blocks]')) ev.preventDefault(); });
  $('.ed-file', view)?.addEventListener('change', async ev => { const files = [...ev.target.files]; ev.target.value = ''; if (await Photos.addFiles(cur.e, files)) { cur.saved = false; paintPhotos(); await commit(); Photos.flush().then(() => cur && paintPhotos()); } });
  cur.off = onChange(w => { if (w?.type === 'external' && w.id === e.id && document.activeElement !== el.body && document.activeElement !== el.title) { const ne = S.entries.get(e.id); if (ne) { cur.e = ne; el.title.value = ne.title; el.body.innerHTML = ne.content; paintChips(); paintPhotos(); } } });
  if (isNew && !ro) setTimeout(() => (r.query.type === 'todo' || r.query.type === 'event' ? el.title : el.body).focus(), 60);
}

/* ---------- 저장 ---------- */
async function commit() {
  if (!cur || cur.ro) return;
  const { e, el } = cur;
  const html = sanitizeHTML(el.body.innerHTML);
  const next = { title: el.title.value.trim(), content: html, text: htmlToText(html) };
  if (next.title === e.title && next.content === e.content && cur.saved !== false) return;
  Object.assign(e, next);
  if (cur.isNew && isEmpty(e)) return;           // 빈 새 기록은 저장하지 않아요
  paintSaved('saving');
  const ok = await saveEntry(e, { quiet: true }); cur.saved = ok;
  if (cur) paintSaved(ok ? 'saved' : '');
  if (ok && cur.isNew) { cur.isNew = false; history.replaceState(null, '', '#/e/' + e.id); }
  paintFoot();
}
/* 막대 오른쪽 끝: 완료 → 저장 중 → 저장됨 (누르면 언제나 완료) */
function paintSaved(st) { const b = cur?.el.root.querySelector('.ed-bar .saved span'); if (!b) return; b.textContent = t(st === 'saving' ? 'ed.saving' : st === 'saved' ? 'ed.saved' : 'ed.done'); b.parentElement.classList.toggle('ok', st === 'saved'); }
function leave() {
  if (!cur) return;
  cur.save?.flush(); hideFmt(); hideBlocks();
  document.removeEventListener('selectionchange', onSel);
  cur.off?.(); cur = null;
}

/* ---------- 칩: 종류 · 폴더 · 날짜 / 종류별 추가 칸 ---------- */
function paintChips() {
  const { e, el } = cur;
  const f = e.folder_id && S.folders.get(e.folder_id);
  el.chips.innerHTML = `<button class="chip" data-act="type">${sticker(TYPE_STICKER[e.type] || 'note')}${esc(typeLabel(e.type))}</button>
    <button class="chip" data-act="folder">${icon('folder', 16)}${esc(f ? f.name : t('folder.none'))}</button>
    ${e.favorite ? `<span class="chip">${icon('star', 16)}</span>` : ''}${e.pinned ? `<span class="chip">${icon('pin', 16)}</span>` : ''}`;
  const m = e.meta || {}, ro = cur.ro ? 'disabled' : '';
  el.meta.innerHTML = e.type === 'event' ? `<label>${icon('calendar', 16)}<input type="date" data-m="date" value="${esc(m.date || todayKey())}" ${ro}></label><label>${icon('clock', 16)}<input type="time" data-m="time" value="${esc(m.time || '')}" ${ro}></label><label>${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" placeholder="${esc(t('ed.place'))}" value="${esc(m.place || '')}" ${ro}></label>`
    : e.type === 'todo' ? `<label>${icon('calendar', 16)}${esc(t('ed.due'))}<input type="date" data-m="date" value="${esc(m.date || '')}" ${ro}></label>`
    : e.type === 'item' ? `<label style="flex:1">${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" style="width:100%" placeholder="${esc(t('ed.where'))}" value="${esc(m.place || '')}" ${ro}></label>` : '';
  if (e.type === 'event' && !m.date) m.date = todayKey();
  $$('[data-m]', el.meta).forEach(i => i.addEventListener('change', () => { cur.e.meta = { ...cur.e.meta, [i.dataset.m]: i.value || undefined }; cur.saved = false; commit(); }));
}
/* ---------- 사진: 큰 커버 1장 + 작은 3장 ---------- */
function paintPhotos() {
  const { e, el } = cur; const ps = e.photos || [];
  if (!ps.length) { el.photos.innerHTML = ''; el.photos.hidden = true; return; }
  el.photos.hidden = false;
  const [c, ...rest] = ps;
  el.photos.innerHTML = `<button class="ph cover${c.pending ? ' wait' : ''}" data-act="ph" data-id="${c.id}" aria-label="${esc(t('photo.open'))}">${Photos.imgTag(c, { full: true })}</button>`
    + (rest.length ? `<div class="ph-row">${rest.map(p => `<button class="ph${p.pending ? ' wait' : ''}" data-act="ph" data-id="${p.id}" aria-label="${esc(t('photo.open'))}">${Photos.imgTag(p)}</button>`).join('')}</div>` : '');
  Photos.hydrate(el.photos);
}
async function photoMenu(id) {
  const e = cur.e; const idx = (e.photos || []).findIndex(p => p.id === id); if (idx < 0) return;
  const items = [{ v: 'view', label: t('photo.view'), icon: 'maximize-2' },
    ...(cur.ro ? [] : [...(idx > 0 ? [{ v: 'cover', label: t('photo.cover'), icon: 'image' }] : []), { v: 'remove', label: t('photo.remove'), icon: 'trash-2', danger: true }])];
  const v = await pickAction('', items); if (!v) return;
  if (v === 'view') viewPhoto(e.photos[idx]);
  else if (v === 'cover') { Photos.makeCover(e, id); cur.saved = false; paintPhotos(); commit(); }
  else if (v === 'remove') { await Photos.remove(e, id); cur.saved = false; paintPhotos(); commit(); }
}
function viewPhoto(p) {
  const d = document.createElement('div'); d.className = 'ph-view'; d.setAttribute('role', 'dialog');
  d.innerHTML = `${Photos.imgTag(p, { full: true })}<button class="icon-btn x" aria-label="${esc(t('common.close'))}">${icon('x', 22)}</button>`;
  d.addEventListener('click', () => d.remove()); document.body.append(d); Photos.hydrate(d);
}
function paintFoot() {
  const e = cur.e; if (cur.isNew) { cur.el.foot.textContent = ''; return; }
  cur.el.foot.textContent = t('ed.created', { date: fmtDate(e.created_at, { year: 'numeric', month: 'long', day: 'numeric' }) }) + ' · ' + t('ed.edited', { date: fmtRel(e.updated_at) });
}

/* ---------- 버튼 ---------- */
async function onAct(ev) {
  const b = ev.target.closest('[data-act]'); if (!b || !cur) return;
  const a = b.dataset.act, e = cur.e;
  if (a === 'back' || a === 'done') { await commit(); const back = history.length > 1; leave(); back ? history.back() : go('/home'); }
  else if (a === 'undo') { if (document.activeElement === cur.el.title) document.execCommand('undo'); else { cur.el.body.focus(); document.execCommand('undo'); } cur.save(); }
  else if (a === 'plans') go('/plans');
  else if (a === 'type' && !cur.ro) { const v = await pickType(e.type); if (v && v !== e.type) { e.type = v; cur.saved = false; paintChips(); commit(); } }
  else if (a === 'folder' && !cur.ro) { const v = await pickFolder(e.folder_id); if (v !== null && (v || null) !== e.folder_id) { e.folder_id = v || null; cur.saved = false; paintChips(); commit(); } }
  else if (a === 'more') more();
  else if (a === 'blocks') { cur.el.body.focus(); if (!cur.el.body.textContent && !cur.el.body.querySelector('ul,ol,hr')) placeCaret(cur.el.body, true); showBlocks(''); }
  else if (a === 'check') { cur.el.body.focus(); applyBlock('check'); }
  else if (a === 'template') template();
  else if (a === 'photo' && CFG.PHOTOS_URL) { if ((e.photos || []).length >= 4) toast(t('photo.perEntry')); else cur.el.root.querySelector('.ed-file').click(); }
  else if (a === 'ph') photoMenu(b.dataset.id);
  else if (a === 'fb') { if (document.activeElement !== cur.el.body) cur.el.body.focus(); document.execCommand(b.dataset.f); b.classList.toggle('on', document.queryCommandState(b.dataset.f)); cur.saved = false; cur.save(); }
}
async function more() {
  const e = cur.e;
  const items = [
    { v: 'fav', label: t(e.favorite ? 'ed.unfavorite' : 'ed.favorite'), icon: 'star' },
    { v: 'pin', label: t(e.pinned ? 'ed.unpin' : 'ed.pin'), icon: 'pin' },
    ...(cur.ro ? [] : [{ v: 'move', label: t('ed.move'), icon: 'folder' }]),
    { v: 'trash', label: t('ed.trash'), icon: 'trash-2', danger: true }
  ];
  const v = await pickAction('', items); if (!v) return;
  if (v === 'fav' || v === 'pin') {
    const k = v === 'fav' ? 'favorite' : 'pinned';
    if (cur.isNew) { e[k] = !e[k]; paintChips(); return; }
    await patchEntry(e.id, { [k]: !e[k] }); paintChips();
  } else if (v === 'move') onAct({ target: { closest: () => ({ dataset: { act: 'folder' } }) } });
  else if (v === 'trash') {
    if (cur.isNew) { leave(); history.back(); return; }
    await commit(); const id = e.id; leave(); await trashEntry(id);
    toast(t('ed.trashed'), { action: t('common.undo'), onAction: () => import('../data/store.js').then(m => m.restoreEntry(id)) });
    history.length > 1 ? history.back() : go('/home');
  }
}
async function template() {
  const v = await pickAction(t('ed.template'), TEMPLATES.map(k => ({ v: k, label: t('tpl.' + k), icon: 'layout-template' }))); if (!v) return;
  const body = cur.el.body;
  if (!cur.el.title.value.trim()) cur.el.title.value = t('tpl.' + v) + (v === 'diary' ? ' · ' + fmtDate(new Date(), { month: 'long', day: 'numeric' }) : '');
  if (!body.textContent.trim()) body.innerHTML = t('tpl.' + v + '.body'); else { body.focus(); document.execCommand('insertHTML', false, t('tpl.' + v + '.body')); }
  if (v === 'shopping' && cur.e.type === 'note') { cur.e.type = 'todo'; paintChips(); }
  cur.saved = false; cur.save(); placeCaret(body.querySelector('h2 + p, li, p') || body, false);
}

/* ---------- 본문 편집 도우미 ---------- */
function placeCaret(node, atEnd = true) {
  node.focus?.(); const r = document.createRange(); const s = getSelection();
  if (node === cur?.el.body && !node.childNodes.length) node.innerHTML = '<p><br></p>';
  r.selectNodeContents(node.nodeType === 1 && node.matches('.ed-body') ? (atEnd ? node.lastChild || node : node.firstChild || node) : node); r.collapse(!atEnd);
  s.removeAllRanges(); s.addRange(r);
}
const blockOf = n => { while (n && n !== cur.el.body) { if (n.nodeType === 1 && /^(P|DIV|H2|H3|LI|BLOCKQUOTE)$/.test(n.tagName)) return n; n = n.parentNode; } return null; };
function applyBlock(k) {
  const ex = cmd => document.execCommand(cmd, false, null);
  if (k === 'heading') document.execCommand('formatBlock', false, blockOf(getSelection().anchorNode)?.tagName === 'H2' ? 'p' : 'h2');
  else if (k === 'quote') document.execCommand('formatBlock', false, blockOf(getSelection().anchorNode)?.tagName === 'BLOCKQUOTE' ? 'p' : 'blockquote');
  else if (k === 'bullet') ex('insertUnorderedList');
  else if (k === 'numbered') ex('insertOrderedList');
  else if (k === 'divider') document.execCommand('insertHTML', false, '<hr><p><br></p>');
  else if (k === 'check') {
    const li = getSelection().anchorNode && blockOf(getSelection().anchorNode);
    if (li?.tagName === 'LI' && li.parentNode.classList.contains('todo')) { ex('insertUnorderedList'); }
    else { if (li?.tagName !== 'LI' || li.parentNode.tagName !== 'UL') ex('insertUnorderedList'); const ul = blockOf(getSelection().anchorNode)?.closest('ul'); ul?.classList.add('todo'); }
  }
  liftLists(); cur.saved = false; cur.save();
}
/* 크롬이 <p> 안에 목록을 넣는 경우가 있어 밖으로 꺼내요 (캐럿 유지) */
function liftLists() {
  $$('p > ul, p > ol, div > ul, div > ol, h2 > ul, h2 > ol', cur.el.body).forEach(list => {
    const par = list.parentNode; if (par === cur.el.body) return;
    const sel = getSelection(); const r = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const before = [...par.childNodes].slice(0, [...par.childNodes].indexOf(list)).filter(n => n.textContent.trim() || n.nodeName === 'IMG');
    par.parentNode.insertBefore(list, before.length ? par.nextSibling : par);
    if (!par.textContent.trim() && !par.querySelector('ul,ol')) par.remove();
    if (r) { sel.removeAllRanges(); sel.addRange(r); }
  });
}
/* 마크다운 단축: 줄 처음에 "# " "- " "1. " "> " "[] " "---" */
function shortcuts(ev) {
  if (ev.inputType !== 'insertText' || ev.data !== ' ' && ev.data !== '-') return;
  const sel = getSelection(); const blk = blockOf(sel.anchorNode); if (!blk || blk.tagName === 'LI') return;
  const txt = blk.textContent.replace(/ /g, ' ');
  const map = { '# ': 'heading', '- ': 'bullet', '* ': 'bullet', '1. ': 'numbered', '> ': 'quote', '[] ': 'check', '[ ] ': 'check', '---': 'divider' };
  const k = map[txt]; if (!k) return;
  blk.textContent = ''; blk.innerHTML = '<br>'; placeCaret(blk, false);
  applyBlock(k);
}
function onKey(ev) {
  if (blocksEl) {
    const items = $$('.it', blocksEl); let i = items.findIndex(x => x.classList.contains('on'));
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); items[i]?.classList.remove('on'); i = (i + (ev.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length; items[i]?.classList.add('on'); return; }
    if (ev.key === 'Enter' && items[i]) { ev.preventDefault(); items[i].click(); return; }
    if (ev.key === 'Escape') { hideBlocks(); return; }
  }
  const mod = ev.metaKey || ev.ctrlKey;
  if (mod && ['b', 'i', 'u'].includes(ev.key.toLowerCase())) { ev.preventDefault(); document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[ev.key.toLowerCase()]); cur.save(); }
  if (mod && ev.key.toLowerCase() === 'k') { ev.preventDefault(); fmtAction('link'); }
  // 체크리스트 줄에서 Enter: 새 줄은 체크 안 된 상태로
  if (ev.key === 'Enter' && !ev.shiftKey) setTimeout(() => { const li = blockOf(getSelection().anchorNode); if (li?.tagName === 'LI') li.classList.remove('done'); }, 0);
}
function onBodyClick(ev) {
  const li = ev.target.closest('ul.todo > li'); if (!li || cur.ro) return;
  const x = ev.clientX - li.getBoundingClientRect().left; if (x > 28) return;
  li.classList.toggle('done'); cur.saved = false; cur.save();
}
function onPaste(ev) {
  const html = ev.clipboardData.getData('text/html'); const text = ev.clipboardData.getData('text/plain');
  ev.preventDefault();
  if (html) document.execCommand('insertHTML', false, sanitizeHTML(html));
  else document.execCommand('insertText', false, text);
}

/* ---------- 떠 있는 서식 막대 ---------- */
let fmtEl = null;
const FMT = [['bold', 'bold', 'ed.bold'], ['italic', 'italic', 'ed.italic'], ['underline', 'underline', 'ed.underline'], ['mark', 'highlighter', 'ed.mark'], 0, ['heading', 'type', 'ed.heading'], ['quote', 'text-quote', 'ed.quote'], ['link', 'link', 'ed.link']];
function onSel() {
  if (!cur || cur.ro) return;
  const s = getSelection();
  if (!s.rangeCount || s.isCollapsed || !cur.el.body.contains(s.anchorNode)) { hideFmt(); return; }
  const rect = s.getRangeAt(0).getBoundingClientRect(); if (!rect.width) return;
  if (!fmtEl) {
    fmtEl = document.createElement('div'); fmtEl.className = 'fmt'; fmtEl.setAttribute('role', 'toolbar');
    fmtEl.innerHTML = FMT.map(f => f ? `<button class="tb" data-f="${f[0]}" aria-label="${esc(t(f[2]))}">${icon(f[1], 18)}</button>` : '<span class="sep"></span>').join('');
    fmtEl.addEventListener('mousedown', e => e.preventDefault());
    fmtEl.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) fmtAction(b.dataset.f); });
    document.body.append(fmtEl);
  }
  ['bold', 'italic', 'underline'].forEach(c => fmtEl.querySelector(`[data-f=${c}]`).classList.toggle('on', document.queryCommandState(c)));
  const w = fmtEl.offsetWidth || 330;
  fmtEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, rect.left + rect.width / 2 - w / 2)) + 'px';
  fmtEl.style.top = Math.max(8, rect.top - 58) + 'px';
}
function hideFmt() { fmtEl?.remove(); fmtEl = null; }
async function fmtAction(f) {
  const s = getSelection(); const range = s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
  if (['bold', 'italic', 'underline'].includes(f)) document.execCommand(f);
  else if (f === 'mark') {
    const inMark = range && (range.commonAncestorContainer.parentElement?.closest('mark'));
    if (inMark) inMark.replaceWith(...inMark.childNodes); else if (range) { const m = document.createElement('mark'); m.append(range.extractContents()); range.insertNode(m); }
  } else if (f === 'heading' || f === 'quote') applyBlock(f);
  else if (f === 'link') {
    const url = await promptDlg(t('ed.link'), { placeholder: t('ed.linkAsk'), type: 'url', maxlength: 2000 });
    if (url && /^https?:\/\//i.test(url) && range) { s.removeAllRanges(); s.addRange(range); document.execCommand('createLink', false, url); }
  }
  cur.saved = false; cur.save(); onSel();
}

/* ---------- "/" 블록 메뉴 ---------- */
let blocksEl = null, slashAt = null;
function slashWatch() {
  const s = getSelection(); if (!s.rangeCount) return;
  const node = s.anchorNode, off = s.anchorOffset;
  if (node.nodeType !== 3) { if (blocksEl) hideBlocks(); return; }
  const before = node.textContent.slice(0, off);
  const m = before.match(/(?:^|\s)\/([^\s/]{0,12})$/);
  if (!m) { if (blocksEl) hideBlocks(); return; }
  slashAt = { node, start: off - m[1].length - 1, end: off };
  showBlocks(m[1]);
}
function showBlocks(q) {
  const ql = q.toLowerCase();
  const list = BLOCKS.filter(b => !ql || t('ed.' + b.k).toLowerCase().includes(ql) || b.k.startsWith(ql));
  if (!list.length) { hideBlocks(); return; }
  if (!blocksEl) { blocksEl = document.createElement('div'); blocksEl.className = 'blocks'; blocksEl.setAttribute('role', 'listbox'); blocksEl.addEventListener('mousedown', e => e.preventDefault()); document.body.append(blocksEl);
    blocksEl.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; if (slashAt) { const r = document.createRange(); r.setStart(slashAt.node, slashAt.start); r.setEnd(slashAt.node, Math.min(slashAt.node.length, getSelection().anchorOffset)); r.deleteContents(); r.collapse(true); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); const blk = blockOf(r.startContainer); if (blk && !blk.textContent) { blk.innerHTML = '<br>'; placeCaret(blk, false); } } const k = b.dataset.k; hideBlocks(); applyBlock(k); }); }
  blocksEl.innerHTML = `<div class="hd">${esc(t('ed.blocks'))}</div>` + list.map((b, i) => `<button class="it${i === 0 ? ' on' : ''}" data-k="${b.k}" role="option"><span class="ic">${icon(b.ic, 17)}</span><span class="l">${esc(t('ed.' + b.k))}</span><kbd>${esc(b.kbd)}</kbd></button>`).join('');
  const s = getSelection(); const rect = s.rangeCount ? s.getRangeAt(0).getBoundingClientRect() : null;
  const top = rect && rect.bottom ? rect.bottom + 8 : innerHeight / 3;
  blocksEl.style.left = Math.max(12, Math.min(innerWidth - 302, (rect?.left || 20) - 10)) + 'px';
  blocksEl.style.top = Math.min(top, innerHeight - blocksEl.offsetHeight - 90) + 'px';
}
function hideBlocks() { blocksEl?.remove(); blocksEl = null; slashAt = null; }

export { leave, render };
