/* 기록 편집기: 정보 한 줄 + 제목 + 본문. 도구는 한 곳에만 있어요
   모바일: 키보드 위 막대(뒤로 | Aa · 체크 · 사진 · ⋯ | 완료). Aa·⋯ 판은 키보드 자리에 열려서 글 위치가 움직이지 않아요
   PC: 글 위 한 줄에 서식 도구가 모두 보여요. ⋯ 는 그 아래로 작은 판 */
import { CFG } from '../core/config.js';
import { S, isEmpty, newEntry, onChange, patchEntry, saveEntry, trashEntry, TYPES, addFolder, folderList } from '../data/store.js';
import { htmlToText, sanitizeHTML } from '../core/sanitize.js';
import { fmtDate, fmtRel, t } from '../core/i18n.js';
import { $, $$, debounce, esc, icon, todayKey } from '../core/utils.js';
import { promptDlg, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';
import { TYPE_ICON } from '../ui/shell.js';
import { typeLabel } from './pickers.js';
import { Photos } from '../features/photos.js';

/* 서식 버튼: [키, 아이콘, 이름]. 한 번 누르면 켜지고, 다시 누르면 꺼져요 */
const STYLE = [['p', 'pilcrow', 'ed.text'], ['heading', 'type', 'ed.heading'], ['quote', 'text-quote', 'ed.quote']];
const INLINE = [['bold', 'bold', 'ed.bold'], ['italic', 'italic', 'ed.italic'], ['underline', 'underline', 'ed.underline'], ['mark', 'highlighter', 'ed.mark'], ['link', 'link', 'ed.link']];
const LISTS = [['bullet', 'list', 'ed.bullet'], ['numbered', 'list-ordered', 'ed.numbered'], ['check', 'list-todo', 'ed.check'], ['divider', 'minus', 'ed.divider'], ['undo', 'undo-2', 'ed.undo']];
let cur = null;   // { e, isNew, saved, el, off, pan }

const fbtn = ([k, ic, l], cls = 'tb') => `<button class="${cls}" data-f="${k}" aria-label="${esc(t(l))}" aria-pressed="false">${icon(ic, 20)}</button>`;
const isPC = () => matchMedia('(min-width: 900px)').matches;

function render(view, r) {
  leave();
  const isNew = r.path === '/new';
  const e = isNew ? newEntry({ type: r.query.type || S.prefs.defaultType || 'note', folder_id: r.query.folder || null, meta: r.query.date ? { date: r.query.date } : {} })
    : S.entries.get(r.params.id);
  if (!e) { view.innerHTML = `<div class="ed-page"><div class="ed"><button class="icon-btn" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button><p class="note" style="padding:40px 4px">${esc(t('list.noResults'))}</p></div></div>`; view.querySelector('[data-act=back]').onclick = () => history.length > 1 ? history.back() : go('/home'); return; }
  const ro = !S.canWrite;
  const photoBtn = `<button class="tb" data-act="photo" aria-label="${esc(t('ed.photo'))}">${icon('camera', 20)}</button>`;
  view.innerHTML = `<div class="ed-page"><div class="ed">
    <div class="ed-tools" role="toolbar">
      <button class="tb" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button>
      ${ro ? '<span class="sp"></span>' : `<span class="sep"></span>${STYLE.slice(1).map(f => fbtn(f)).join('')}<span class="sep"></span>${INLINE.map(f => fbtn(f)).join('')}<span class="sep"></span>${LISTS.slice(0, 4).map(f => fbtn(f)).join('')}<span class="sep"></span>${photoBtn}<span class="sp"></span>`}
      <button class="tb" data-act="more" aria-label="${esc(t('ed.more'))}" aria-expanded="false">${icon('more-horizontal', 20)}</button>
      <button class="ed-done" data-act="done">${icon('check', 18)}<span>${esc(t('ed.finish'))}</span></button></div>
    ${ro ? `<div class="ed-locked"><span>${esc(t('ed.locked'))}</span><button data-act="plans">${esc(t('trial.plans'))}</button></div>` : ''}
    <button class="ed-info" data-act="more"></button><div class="ed-meta"></div>
    <textarea class="ed-title" rows="1" maxlength="300" placeholder="${esc(t('ed.title'))}" ${ro ? 'readonly' : ''}></textarea>
    <div class="ed-body" ${ro ? '' : 'contenteditable="true"'} spellcheck="true" data-ph="${esc(t('ed.body'))}" role="textbox" aria-multiline="true" aria-label="${esc(t('ed.body'))}"></div>
    <div class="ed-photos"></div>
    <div class="ed-foot"></div>
  </div>
  <div class="ed-dock">
    <div class="ed-bar"><div class="cap" role="toolbar">
      <button class="tb" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button><span class="sep"></span>
      ${ro ? '' : `<button class="tb aa" data-act="aa" aria-label="${esc(t('ed.format'))}" aria-expanded="false">Aa</button>${photoBtn}`}
      <button class="tb" data-act="more" aria-label="${esc(t('ed.more'))}" aria-expanded="false">${icon('more-horizontal', 20)}</button>
      <span class="sp"></span><button class="tb kbd" data-act="kbd" aria-label="${esc(t('ed.keyboard'))}" hidden>${icon('keyboard', 20)}</button>
      <button class="ed-done" data-act="done">${icon('check', 18)}<span>${esc(t('ed.finish'))}</span></button></div></div>
    <div class="ed-pan" hidden></div>
  </div>
  <input type="file" accept="image/*" multiple hidden class="ed-file"></div>`;
  const el = { root: view, title: $('.ed-title', view), body: $('.ed-body', view), info: $('.ed-info', view), meta: $('.ed-meta', view), photos: $('.ed-photos', view), foot: $('.ed-foot', view), pan: $('.ed-pan', view) };
  cur = { e, isNew, wasNew: isNew, el, ro, pan: null };
  el.title.value = e.title; el.body.innerHTML = e.content || (e.text ? e.text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join('') : '');
  paintChips(); paintPhotos(); paintFoot();
  const save = debounce(() => commit(), 600); cur.save = save;
  const fit = () => { el.title.style.height = 'auto'; el.title.style.height = el.title.scrollHeight + 'px'; };   // 제목 칸은 글 길이만큼 (스크롤 없이)
  el.title.addEventListener('input', () => { fit(); save(); }); requestAnimationFrame(fit);
  el.title.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); placeCaret(el.body, true); } });
  el.title.addEventListener('focus', () => closePan());
  el.body.addEventListener('input', ev => { shortcuts(ev); save(); paintState(); });
  el.body.addEventListener('keydown', onKey);
  el.body.addEventListener('focus', () => document.execCommand('defaultParagraphSeparator', false, 'p'));
  el.body.addEventListener('pointerdown', () => { if (cur?.pan) closePan(true); });   // 글을 누르면 판을 닫고 키보드로 돌아가요
  el.body.addEventListener('click', onBodyClick);
  el.body.addEventListener('paste', onPaste);
  document.addEventListener('selectionchange', paintState);
  view.addEventListener('click', onAct);
  // 도구를 눌러도 글 쓰던 자리(커서)가 그대로 있게
  $$('.ed-tools, .ed-dock', view).forEach(n => n.addEventListener('mousedown', ev => { if (ev.target.closest('button') && !ev.target.closest('.ed-pan .kinds, .ed-pan .acts')) ev.preventDefault(); }));
  $('.ed-file', view)?.addEventListener('change', async ev => { const files = [...ev.target.files]; ev.target.value = ''; if (await Photos.addFiles(cur.e, files)) { cur.saved = false; paintPhotos(); await commit(); Photos.flush().then(() => cur && paintPhotos()); } });
  cur.off = onChange(w => { if (w?.type === 'external' && w.id === e.id && document.activeElement !== el.body && document.activeElement !== el.title) { const ne = S.entries.get(e.id); if (ne) { cur.e = ne; el.title.value = ne.title; el.body.innerHTML = ne.content; paintChips(); paintPhotos(); } } });
  if (isNew && !ro) setTimeout(() => (r.query.type === 'todo' || r.query.type === 'event' ? el.title : el.body).focus(), 60);
}

/* ---------- 저장: 조용히 저장하고, 실패했을 때만 알려요 ---------- */
async function commit() {
  if (!cur || cur.ro) return;
  const { e, el } = cur;
  const html = sanitizeHTML(el.body.innerHTML);
  const next = { title: el.title.value.trim(), content: html, text: htmlToText(html) };
  if (next.title === e.title && next.content === e.content && cur.saved !== false) return;
  Object.assign(e, next);
  if (cur.isNew && isEmpty(e)) return;           // 빈 새 기록은 저장하지 않아요
  const ok = await saveEntry(e, { quiet: true });
  if (!cur) return;
  if (!ok && cur.saved !== 'failed') toast(t('ed.saveFail'));
  cur.saved = ok || 'failed';
  if (ok && cur.isNew) { cur.isNew = false; history.replaceState(null, '', '#/e/' + e.id); }
  paintFoot();
}
function leave() {
  if (!cur) return;
  cur.save?.flush(); closePan();
  document.removeEventListener('selectionchange', paintState);
  document.documentElement.classList.remove('ed-pan-open');
  cur.off?.(); cur = null;
}

/* ---------- 정보 한 줄: 종류 · 폴더 · 날짜 (누르면 ⋯ 판) / 일정·할 일 날짜 칸 ---------- */
function paintChips() {
  const { e, el } = cur;
  const f = e.folder_id && S.folders.get(e.folder_id);
  const when = cur.isNew ? '' : fmtDate(e.created_at, { month: 'long', day: 'numeric' });
  el.info.innerHTML = `${icon(TYPE_ICON[e.type] || 'file-text', 17)}<span>${esc(typeLabel(e.type))}</span><i>·</i>${icon('folder', 16)}<span>${esc(f ? f.name : t('folder.none'))}</span>${when ? `<i>·</i><span>${esc(when)}</span>` : ''}${e.favorite ? `<i>·</i>${icon('star', 15)}` : ''}${e.pinned ? `<i>·</i>${icon('pin', 15)}` : ''}`;
  const m = e.meta || {}, ro = cur.ro ? 'disabled' : '';
  el.meta.innerHTML = e.type === 'event' ? `<label>${icon('calendar', 16)}<input type="date" data-m="date" value="${esc(m.date || todayKey())}" ${ro}></label><label>${icon('clock', 16)}<input type="time" data-m="time" value="${esc(m.time || '')}" ${ro}></label><label>${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" placeholder="${esc(t('ed.place'))}" value="${esc(m.place || '')}" ${ro}></label>`
    : e.type === 'todo' ? `<label>${icon('calendar', 16)}${esc(t('ed.due'))}<input type="date" data-m="date" value="${esc(m.date || '')}" ${ro}></label>`
    : e.type === 'item' ? `<label style="flex:1">${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" style="width:100%" placeholder="${esc(t('ed.where'))}" value="${esc(m.place || '')}" ${ro}></label>` : '';
  el.meta.hidden = !el.meta.innerHTML;
  if (e.type === 'event' && !m.date) m.date = todayKey();
  $$('[data-m]', el.meta).forEach(i => i.addEventListener('change', () => { cur.e.meta = { ...cur.e.meta, [i.dataset.m]: i.value || undefined }; cur.saved = false; commit(); }));
  if (cur.pan === 'more') paintPan();
}
/* ---------- 사진: 글 아래, 원래 비율 그대로 (잘리지 않게) ---------- */
function paintPhotos() {
  const { e, el } = cur; const ps = e.photos || [];
  if (!ps.length) { el.photos.innerHTML = ''; el.photos.hidden = true; return; }
  el.photos.hidden = false;
  el.photos.innerHTML = ps.map(p => `<button class="ph${p.pending ? ' wait' : ''}" data-act="ph" data-id="${p.id}" aria-label="${esc(t('photo.open'))}">${Photos.imgTag(p, { full: true })}</button>`).join('');
  Photos.hydrate(el.photos);
}
async function photoMenu(id) {
  const { pickAction } = await import('./pickers.js');
  const e = cur.e; const idx = (e.photos || []).findIndex(p => p.id === id); if (idx < 0) return;
  const items = [{ v: 'view', label: t('photo.view'), icon: 'maximize-2' },
    ...(cur.ro ? [] : [...(idx > 0 ? [{ v: 'cover', label: t('photo.cover'), icon: 'image' }] : []), { v: 'remove', label: t('photo.remove'), icon: 'trash-2', danger: true }])];
  const v = await pickAction('', items); if (!v || !cur) return;
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

/* ---------- 판(Aa 서식 · ⋯ 정보): 모바일은 키보드 자리, PC는 도구 줄 아래 ---------- */
let kbH = 300;   // 마지막으로 본 키보드 높이
function openPan(kind) {
  if (!cur) return;
  if (cur.pan === kind) { closePan(true); return; }    // 같은 버튼을 다시 누르면 닫혀요
  const kb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb')) || 0;
  if (kb > 120) kbH = kb;
  cur.pan = kind;
  const b = cur.el.body;
  if (!isPC() && document.activeElement === b) b.inputMode = 'none';   // 커서는 두고 키보드만 내려요
  document.documentElement.style.setProperty('--pan', Math.min(Math.max(kbH, 260), 360) + 'px');
  document.documentElement.classList.add('ed-pan-open');
  cur.el.pan.hidden = false; paintPan();
}
function closePan(toKeyboard = false) {
  if (!cur) return;
  const had = cur.pan; cur.pan = null;
  cur.el.pan.hidden = true; cur.el.pan.innerHTML = '';
  document.documentElement.classList.remove('ed-pan-open');
  $$('[data-act=aa],[data-act=more]', cur.el.root).forEach(x => { x.classList.remove('on'); x.setAttribute('aria-expanded', 'false'); });
  $('.ed-bar .kbd', cur.el.root)?.toggleAttribute('hidden', true);
  const b = cur.el.body;
  if (b.inputMode === 'none') { b.inputMode = ''; if (toKeyboard && had) { const r = saveRange(); b.blur(); b.focus(); restoreRange(r); } }
}
function paintPan() {
  const { e, el } = cur, k = cur.pan;
  $$('[data-act=aa]', el.root).forEach(x => { x.classList.toggle('on', k === 'aa'); x.setAttribute('aria-expanded', String(k === 'aa')); });
  $$('[data-act=more]', el.root).forEach(x => { x.classList.toggle('on', k === 'more'); x.setAttribute('aria-expanded', String(k === 'more')); });
  $('.ed-bar .kbd', el.root)?.toggleAttribute('hidden', !k || isPC());
  if (k === 'aa') {
    el.pan.innerHTML = `<div class="segs" role="group">${STYLE.map(([f, , l]) => `<button data-f="${f}" aria-pressed="false">${esc(t(l))}</button>`).join('')}</div>
      <div class="row">${INLINE.map(f => fbtn(f, 'pb')).join('')}</div><div class="row">${LISTS.map(f => fbtn(f, 'pb')).join('')}</div>`;
    paintState();
  } else if (k === 'more') {
    const fav = e.favorite, pin = e.pinned;
    el.pan.innerHTML = `<div class="lab">${esc(t('ed.kind'))}</div><div class="kinds">${TYPES.map(ty => `<button class="kc${ty === e.type ? ' on' : ''}" data-type="${ty}" aria-pressed="${ty === e.type}" ${cur.ro ? 'disabled' : ''}>${icon(TYPE_ICON[ty], 18)}${esc(typeLabel(ty))}</button>`).join('')}</div>
      <div class="lab">${esc(t('ed.folder'))}</div><div class="kinds"><button class="kc${!e.folder_id ? ' on' : ''}" data-folder="" ${cur.ro ? 'disabled' : ''}>${icon('folder-x', 18)}${esc(t('folder.none'))}</button>${folderList().map(f => `<button class="kc${f.id === e.folder_id ? ' on' : ''}" data-folder="${f.id}" ${cur.ro ? 'disabled' : ''}><svg class="i" width="18" height="18" viewBox="0 0 24 24" style="color:${esc(f.color || '#A9A5AF')}"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>${esc(f.name)}</button>`).join('')}${cur.ro ? '' : `<button class="kc" data-folder="+">${icon('plus', 18)}${esc(t('folder.new'))}</button>`}</div>
      <div class="acts"><button data-x="fav" class="${fav ? 'on' : ''}">${icon('star', 19)}${esc(t(fav ? 'ed.unfavorite' : 'ed.favorite'))}</button><button data-x="pin" class="${pin ? 'on' : ''}">${icon('pin', 19)}${esc(t(pin ? 'ed.unpin' : 'ed.pin'))}</button><button data-x="trash" class="bad">${icon('trash-2', 19)}${esc(t('ed.trash'))}</button></div>`;
  }
}
/* 지금 커서 자리의 서식을 버튼에 표시해요 (켜짐/꺼짐) */
function paintState() {
  if (!cur || cur.ro) return;
  const s = getSelection(); const inBody = s.rangeCount && cur.el.body.contains(s.anchorNode);
  const blk = inBody ? blockOf(s.anchorNode) : null, list = blk?.closest?.('ul,ol');
  const on = {
    bold: inBody && document.queryCommandState('bold'), italic: inBody && document.queryCommandState('italic'), underline: inBody && document.queryCommandState('underline'),
    mark: !!(inBody && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement)?.closest('mark')),
    link: !!(inBody && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement)?.closest('a')),
    heading: blk?.tagName === 'H2', quote: !!blk?.closest?.('blockquote'),
    bullet: list?.tagName === 'UL' && !list.classList.contains('todo'), numbered: list?.tagName === 'OL', check: !!list?.classList.contains('todo')
  };
  on.p = inBody && !on.heading && !on.quote;
  $$('[data-f]', cur.el.root).forEach(b => { const v = !!on[b.dataset.f]; b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); });
}
const saveRange = () => { const s = getSelection(); return s.rangeCount && cur.el.body.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null; };
const restoreRange = r => { if (!r) return; const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
async function fmt(f) {
  const body = cur.el.body;
  if (!body.contains(getSelection().anchorNode)) { if (document.activeElement !== body) placeCaret(body, true); }
  else if (document.activeElement !== body) { const r = saveRange(); body.focus({ preventScroll: true }); restoreRange(r); }
  if (['bold', 'italic', 'underline'].includes(f)) document.execCommand(f);
  else if (f === 'undo') document.execCommand('undo');
  else if (f === 'p') { const blk = blockOf(getSelection().anchorNode); if (blk?.closest('blockquote') || blk?.tagName === 'H2') document.execCommand('formatBlock', false, 'p'); }
  else if (f === 'mark' || f === 'link') { await fmtAction(f); return; }
  else applyBlock(f);
  cur.saved = false; cur.save(); paintState();
}

/* ---------- 버튼 ---------- */
async function onAct(ev) {
  if (!cur) return;
  const fb = ev.target.closest('[data-f]');
  if (fb && !cur.ro) { fmt(fb.dataset.f); return; }
  const ty = ev.target.closest('[data-type]'), fo = ev.target.closest('[data-folder]'), x = ev.target.closest('[data-x]');
  const e = cur.e;
  if (ty && !cur.ro) { if (ty.dataset.type !== e.type) { e.type = ty.dataset.type; cur.saved = false; paintChips(); commit(); } return; }
  if (fo && !cur.ro) {
    let id = fo.dataset.folder;
    if (id === '+') { const name = await promptDlg(t('folder.new'), { placeholder: t('folder.name'), maxlength: 40 }); if (!name || !cur) return; const f = await addFolder(name); if (!f) return; id = f.id; }
    if ((id || null) !== e.folder_id) { e.folder_id = id || null; cur.saved = false; paintChips(); commit(); }
    return;
  }
  if (x) { more(x.dataset.x); return; }
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'back') { await commit(); const back = history.length > 1; leave(); back ? history.back() : go('/home'); }
  else if (a === 'done') finish(b);
  else if (a === 'plans') go('/plans');
  else if (a === 'aa') openPan('aa');
  else if (a === 'more') openPan('more');
  else if (a === 'kbd') closePan(true);
  else if (a === 'photo') { if (!CFG.PHOTOS_URL) toast(t('photo.soon')); else if ((e.photos || []).length >= 4) toast(t('photo.perEntry')); else cur.el.root.querySelector('.ed-file').click(); }
  else if (a === 'ph') photoMenu(b.dataset.id);
}
/* 작성 완료: 짧게 축하하고, 새 기록은 모든 기록(맨 위에 반짝), 고친 기록은 원래 있던 화면으로 */
async function finish(b) {
  await commit(); if (!cur) return;
  const e = cur.e, wrote = !cur.ro && !isEmpty(e), wasNew = cur.wasNew;
  if (wrote) {
    try { sessionStorage.setItem('daytale.hl', e.id); } catch {}
    b.classList.add('fin'); navigator.vibrate?.(12);
    await new Promise(r => setTimeout(r, 520));
  }
  leave();
  if (wrote && wasNew) go('/all', { replace: true }); else history.length > 1 ? history.back() : go('/home');
}
async function more(v) {
  const e = cur.e;
  if (v === 'fav' || v === 'pin') {
    const k = v === 'fav' ? 'favorite' : 'pinned';
    if (cur.isNew) e[k] = !e[k]; else await patchEntry(e.id, { [k]: !e[k] });
    if (cur) paintChips();
  } else if (v === 'trash') {
    if (cur.isNew) { leave(); history.back(); return; }
    await commit(); const id = e.id; leave(); await trashEntry(id);
    toast(t('ed.trashed'), { action: t('common.undo'), onAction: () => import('../data/store.js').then(m => m.restoreEntry(id)) });
    history.length > 1 ? history.back() : go('/home');
  }
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
  if (ev.key === 'Escape' && cur?.pan) { closePan(true); return; }
  const mod = ev.metaKey || ev.ctrlKey;
  if (mod && ['b', 'i', 'u'].includes(ev.key.toLowerCase())) { ev.preventDefault(); document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[ev.key.toLowerCase()]); cur.save(); paintState(); }
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

/* ---------- 형광펜 · 링크 ---------- */
async function fmtAction(f) {
  const s = getSelection(); const range = s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
  const at = range && (range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement);
  if (f === 'mark') {
    const inMark = at?.closest('mark');
    if (inMark) inMark.replaceWith(...inMark.childNodes);          // 다시 누르면 형광펜이 빠져요
    else if (range && !range.collapsed) { const m = document.createElement('mark'); m.append(range.extractContents()); range.insertNode(m); }
  } else if (f === 'link') {
    if (at?.closest('a')) { const a = at.closest('a'); a.replaceWith(...a.childNodes); }   // 다시 누르면 링크가 빠져요
    else {
      const url = await promptDlg(t('ed.link'), { placeholder: t('ed.linkAsk'), type: 'url', maxlength: 2000 });
      if (url && /^https?:\/\//i.test(url) && range && cur) {
        cur.el.body.focus({ preventScroll: true }); s.removeAllRanges(); s.addRange(range);
        if (range.collapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>&nbsp;`); else document.execCommand('createLink', false, url);
      }
    }
  }
  if (!cur) return;
  cur.saved = false; cur.save(); paintState();
}

export { leave, render };
