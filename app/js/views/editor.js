/* 기록 편집기: 정보 한 줄 + 제목 + 본문. 도구는 한 곳에만 있어요
   모바일: 키보드 위 막대(뒤로 | Aa · 체크 · 사진 · ⋯ | 완료). Aa·⋯ 판은 키보드 자리에 열려서 글 위치가 움직이지 않아요
   PC: 글 위 한 줄에 서식 도구가 모두 보여요. ⋯ 는 그 아래로 작은 판 */
import { CFG } from '../core/config.js';
import { fit as fitRow } from '../ui/fit.js';
import { S, isEmpty, newEntry, onChange, patchEntry, purgeEntries, saveEntry, trashEntry, TYPES, addFolder, folderList } from '../data/store.js';
import { htmlToText, sanitizeHTML } from '../core/sanitize.js';
import { fmtDate, fmtHM, fmtRel, t } from '../core/i18n.js';
import { $, $$, debounce, esc, icon, todayKey } from '../core/utils.js';
import { confirmDlg, promptDlg, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';
import { TYPE_ICON } from '../ui/shell.js';
import { typeLabel } from './pickers.js';
import { Photos } from '../features/photos.js';
import { FONTS, fontOf, useFont } from '../core/fonts.js';
import { History, setBlock } from '../features/blocks.js';

/* 서식 버튼: [키, 아이콘, 이름]. 한 번 누르면 켜지고, 다시 누르면 꺼져요 */
const STYLE = [['p', 'pilcrow', 'ed.text'], ['heading', 'type', 'ed.heading'], ['quote', 'text-quote', 'ed.quote']];
const INLINE = [['bold', 'bold', 'ed.bold'], ['italic', 'italic', 'ed.italic'], ['underline', 'underline', 'ed.underline'], ['mark', 'highlighter', 'ed.mark'], ['link', 'link', 'ed.link']];
const LISTS = [['bullet', 'list', 'ed.bullet'], ['numbered', 'list-ordered', 'ed.numbered'], ['check', 'list-todo', 'ed.check'], ['divider', 'minus', 'ed.divider'], ['undo', 'undo-2', 'ed.undo']];
let cur = null;   // { e, isNew, saved, el, off, pan }

const fbtn = ([k, ic, l], cls = 'tb') => `<button class="${cls}" data-f="${k}" aria-label="${esc(t(l))}" title="${esc(t(l))}" aria-pressed="false">${icon(ic, 20)}</button>`;
const isPC = () => matchMedia('(min-width: 900px) and (min-height: 501px), (min-width: 900px) and (pointer: fine)').matches;

function render(view, r, opts = {}) {   // opts.pane: PC 나란히 보기의 오른쪽 칸 (onSaved · onDone · onGone)
  leave();
  const isNew = r.path === '/new';
  const e = isNew ? newEntry({ type: r.query.type || S.prefs.defaultType || 'note', folder_id: r.query.folder || null, meta: r.query.date ? { date: r.query.date } : {} })
    : S.entries.get(r.params.id);
  let carried = false;
  if (isNew) { try { const c = JSON.parse(sessionStorage.getItem('daytale.carry') || 'null'); sessionStorage.removeItem('daytale.carry'); carried = !!c; if (c?.text) { e.content = c.text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join(''); e.text = c.text; if (c.prompt) e.meta = { ...e.meta, prompt: c.prompt }; }
    if (c?.url) { e.type = 'scrap'; e.meta = { ...e.meta, url: safeUrl(c.url) || undefined }; e.title = (c.title || '').slice(0, 300); if (!e.title) { try { e.title = new URL(c.url).hostname.replace(/^www\./, ''); } catch {} } } } catch {} }
  if (!e) { view.innerHTML = `<div class="ed-page"><div class="ed"><button class="icon-btn" data-act="back" aria-label="${esc(t('ed.back'))}">${icon('chevron-left', 22)}</button><p class="note" style="padding:40px 4px">${esc(t('list.noResults'))}</p></div></div>`; view.querySelector('[data-act=back]').onclick = () => history.length > 1 ? history.back() : go('/home'); return; }
  const ro = !S.canWrite;
  const photoBtn = `<button class="tb" data-act="photo" aria-label="${esc(t('ed.photo'))}" title="${esc(t('ed.photo'))}">${icon('camera', 20)}</button>`;
  const fontBtn = `<button class="tb lbl ffb" data-act="font" aria-label="${esc(t('ed.font'))}" title="${esc(t('ed.font'))}">${icon('a-large-small', 18)}<span></span></button>`;
  const cancel = `<button class="ed-cancel" data-act="cancel">${esc(t('common.cancel'))}</button>`;
  const done = `<button class="ed-done" data-act="done">${icon('check', 18)}<span>${esc(t('ed.finish'))}</span></button>`;
  view.innerHTML = `<div class="ed-page"><div class="ed-top">${cancel}<span class="sp"></span>${done}</div><div class="ed">
    <div class="ed-tools" role="toolbar">
      ${cancel}
      ${ro ? '<span class="sp"></span>' : `<span class="sep"></span>${fontBtn}<span class="sep"></span><span class="tb-scroll">${STYLE.slice(1).map(f => fbtn(f)).join('')}<span class="sep"></span>${INLINE.map(f => fbtn(f)).join('')}<span class="sep"></span>${LISTS.slice(0, 4).map(f => fbtn(f)).join('')}<span class="sep"></span>${fbtn(LISTS[4])}${photoBtn}</span><span class="sp"></span>`}
      ${done}</div>
    ${ro ? `<div class="ed-locked"><span>${esc(t('ed.locked'))}</span><button data-act="plans">${esc(t('trial.plans'))}</button></div>` : ''}
    <button class="ed-info" data-act="more" aria-expanded="false"></button><div class="ed-pan" hidden></div><div class="ed-meta"></div>
    <div class="ed-body" ${ro ? '' : 'contenteditable="true"'} spellcheck="true" data-ph="${esc(t('ed.body'))}" role="textbox" aria-multiline="true" aria-label="${esc(t('ed.body'))}"></div>
    <div class="ed-photos"></div>
    <div class="ed-foot"></div>
  </div>
  <div class="ed-dock">
    <div class="ed-bar"${ro ? " hidden" : ""}><div class="cap" role="toolbar">${ro ? "" : `
      <span class="base"><button class="tb" data-act="aa" aria-label="${esc(t('ed.format'))}" title="${esc(t('ed.format'))}" aria-expanded="false">${icon('a-large-small', 22)}</button>${fbtn(LISTS[2])}${photoBtn}<span class="sp"></span>${fbtn(LISTS[4])}</span>
      <span class="fmt"><button class="tb x" data-act="aa" aria-label="${esc(t('common.close'))}">${icon('x', 19)}</button><span class="sep"></span>${fontBtn}<span class="sep"></span>${STYLE.slice(1).map(f => fbtn(f)).join('')}<span class="sep"></span>${INLINE.map(f => fbtn(f)).join('')}<span class="sep"></span>${[LISTS[0], LISTS[1], LISTS[3]].map(f => fbtn(f)).join('')}</span>`}</div></div>
  </div>
  <input type="file" accept="image/*" multiple hidden class="ed-file"></div>`;
  const el = { root: view, body: $('.ed-body', view), info: $('.ed-info', view), meta: $('.ed-meta', view), photos: $('.ed-photos', view), foot: $('.ed-foot', view), pan: $('.ed-pan', view), cap: $('.ed-bar .cap', view) };
  cur = { e, isNew, wasNew: isNew, el, ro, pan: null, saved: carried ? false : undefined, pane: opts.pane ? opts : null };
  if (!opts.pane) { document.documentElement.classList.add('ed-mode'); scrollTo(0, 0); }   // 휴대폰: 편집기 상자 안에서만 스크롤 (editor.css)
  if (!opts.pane && window.visualViewport) { const vv = window.visualViewport, k = () => requestAnimationFrame(keepCaret); vv.addEventListener('resize', k); cur.offVV = () => vv.removeEventListener('resize', k); }
  el.body.innerHTML = bodyOf(e);
  if (!ro && !el.body.firstElementChild) el.body.innerHTML = '<p><br></p>';   // 첫 줄부터 문단으로 (줄 모양 바꾸기가 고르게 돼요)
  // 열었을 때 모습: 아무것도 고치지 않았으면 저장하지 않고, 취소하면 이 모습으로 돌아가요
  cur.base = el.body.innerHTML; cur.orig = { title: e.title, content: e.content, text: e.text, type: e.type, folder_id: e.folder_id, meta: { ...(e.meta || {}) } };
  paintChips(); paintPhotos(); paintFoot(); paintFont();
  const save = debounce(() => commit(), 600); cur.save = save;
  cur.hist = new History(el.body);
  const sc = $('.tb-scroll', view);   // 서식 단추 줄이 넘치면 오른쪽 끝을 흐리게, 마우스 휠로도 옆으로
  if (sc) { const upd = () => sc.classList.toggle('more-r', sc.scrollLeft < sc.scrollWidth - sc.clientWidth - 2);
    sc.addEventListener('scroll', upd, { passive: true }); new ResizeObserver(upd).observe(sc);
    sc.addEventListener('wheel', ev => { if (sc.scrollWidth > sc.clientWidth && Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { ev.preventDefault(); sc.scrollLeft += ev.deltaY; } }, { passive: false }); }
  el.body.addEventListener('input', ev => { cur.touched = true; shortcuts(ev); cur.hist.soon(); save(); paintState(); keepCaret(); });
  el.body.addEventListener('keydown', onKey);
  el.body.addEventListener('focus', () => { document.execCommand('defaultParagraphSeparator', false, 'p'); closePan(); });
  el.body.addEventListener('click', onBodyClick);
  el.body.addEventListener('paste', onPaste);
  document.addEventListener('selectionchange', paintState);
  view.addEventListener('click', onAct);
  // 옵션 판은 바깥을 누르면 접혀요
  const outside = ev => { if (cur?.pan && !ev.target.closest('.ed-pan, .ed-info, dialog, .sheet')) closePan(); };
  document.addEventListener('pointerdown', outside, true); cur.offOut = () => document.removeEventListener('pointerdown', outside, true);
  // 도구를 눌러도 글 쓰던 자리(커서)가 그대로 있게 (키보드도 내려가지 않아요)
  $$('.ed-tools, .ed-dock', view).forEach(n => n.addEventListener('mousedown', ev => { if (ev.target.closest('button')) ev.preventDefault(); }));
  $('.ed-file', view)?.addEventListener('change', async ev => { const files = [...ev.target.files]; ev.target.value = ''; if (await Photos.addFiles(cur.e, files)) { cur.saved = false; paintPhotos(); await commit(); Photos.flush().then(() => cur && paintPhotos()); } });
  cur.off = onChange(w => { if (w?.type === 'external' && w.id === e.id && document.activeElement !== el.body) { const ne = S.entries.get(e.id); if (ne) { cur.e = ne; el.body.innerHTML = bodyOf(ne); cur.base = el.body.innerHTML; cur.hist = new History(el.body); paintChips(); paintPhotos(); } } });
  if (isNew && !ro) setTimeout(() => { el.body.focus(); placeCaret(el.body, true); }, 60);
}
/* 제목 칸이 없어요: 본문 첫 줄이 제목이에요. 예전 기록의 제목은 본문 첫 줄로 보여 줘요 (이미 첫 줄과 같으면 그대로) */
function bodyOf(e) {
  const html = e.content || (e.text ? e.text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join('') : '');
  const tt = (e.title || '').trim(); if (!tt) return html;
  const first = (e.text || htmlToText(html)).split('\n').map(l => l.trim()).find(Boolean);
  return first === tt ? html : `<p>${esc(tt)}</p>${html}`;
}
const firstLine = text => (text.split('\n').map(l => l.trim()).find(Boolean) || '').slice(0, 300);

/* ---------- 저장: 조용히 저장하고, 실패했을 때만 알려요 ---------- */
async function commit() {
  if (!cur || cur.ro) return;
  const { e, el } = cur;
  let html = sanitizeHTML(el.body.innerHTML.replace(/\u200B/g, '').replace(/<mark><\/mark>/g, ''));
  if (!htmlToText(html).trim() && !/<(hr|li)\b/.test(html)) html = '';   // 빈 줄만 있으면 빈 글
  if (!cur.touched && cur.saved !== false) return;   // 열어 보기만 했으면 저장하지 않아요
  const text = htmlToText(html);
  let title = firstLine(text);
  if (!title && e.type === 'scrap' && e.meta?.url) { try { title = new URL(e.meta.url).hostname.replace(/^www\./, ''); } catch {} }   // 스크랩은 글이 없으면 사이트 이름으로
  const next = { title, content: html, text };
  if (next.title === e.title && next.content === e.content && cur.saved !== false) return;
  Object.assign(e, next);
  if (cur.isNew && isEmpty(e)) return;           // 빈 새 기록은 저장하지 않아요
  const ok = await saveEntry(e, { quiet: true });
  if (!cur) return;
  if (!ok && cur.saved !== 'failed') toast(t('ed.saveFail'));
  cur.saved = ok || 'failed';
  if (ok && cur.isNew) { cur.isNew = false; if (!cur.pane) history.replaceState(null, '', '#/e/' + e.id); }
  if (ok) cur.pane?.onSaved?.(e);
  paintFoot();
}
function leave() {
  if (!cur) return;
  cur.save?.flush(); closePan(); cur.offOut?.();
  document.removeEventListener('selectionchange', paintState);
  if (!cur.pane) document.documentElement.classList.remove('ed-mode');
  cur.offVV?.();
  cur.off?.(); cur = null;
}

/* ---------- 정보 한 줄: 종류 · 폴더 · 날짜 (누르면 ⋯ 판) / 일정·할 일 날짜 칸 ---------- */
function paintChips() {
  const { e, el } = cur, m = e.meta || {};
  const f = e.folder_id && S.folders.get(e.folder_id);
  const when = d => [fmtDate(d + 'T00:00', { month: 'long', day: 'numeric' }), m.time && fmtHM(m.time)].filter(Boolean).join(' ');
  const parts = e.type === 'todo' ? [m.date ? when(m.date) : t('ed.noDue')] : e.type === 'event' ? [m.date ? when(m.date) : t('ed.noDate')]
    : [f ? f.name : t('folder.none'), cur.isNew ? '' : fmtDate(e.created_at, { month: 'long', day: 'numeric' })];
  if ((e.type === 'todo' || e.type === 'event') && f) parts.push(f.name);
  el.info.innerHTML = `${icon(TYPE_ICON[e.type] || 'file-text', 17)}<span>${esc(typeLabel(e.type))}</span>${parts.filter(Boolean).map(p => `<i>·</i><span>${esc(p)}</span>`).join('')}${e.favorite ? `<i>·</i>${icon('star', 15)}` : ''}${e.pinned ? `<i>·</i>${icon('pin', 15)}` : ''}${icon('chevron-down', 16, 'dn')}`;
  el.meta.innerHTML = metaHTML(e, false);
  el.meta.hidden = !el.meta.innerHTML;
  if (e.type === 'event' && !m.date) m.date = todayKey();
  wireMeta(el.meta);
  if (cur.pan) paintPan();
}
/* 날짜 · 시간 · 장소 칸. 일정 · 할 일은 옵션 판 안에, 스크랩 링크 · 물건 둔 곳은 글 위에 그대로 */
function metaHTML(e, inPan) {
  const m = e.meta || {}, ro = cur.ro ? 'disabled' : '';
  const timed = e.type === 'event' || e.type === 'todo';
  if (timed !== inPan) return '';
  if (e.type === 'event') return `<div class="lab">${esc(t('ed.date'))}</div><div class="ed-meta"><label>${icon('calendar', 16)}<input type="date" data-m="date" value="${esc(m.date || todayKey())}" ${ro}></label><label>${icon('clock', 16)}<input type="time" data-m="time" value="${esc(m.time || '')}" ${ro}></label><label class="wide">${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" placeholder="${esc(t('ed.place'))}" value="${esc(m.place || '')}" ${ro}></label></div>`;
  if (e.type === 'todo') return `<div class="lab">${esc(t('ed.due'))}</div><div class="ed-meta"><label>${icon('calendar', 16)}<input type="date" data-m="date" value="${esc(m.date || '')}" ${ro}></label><label>${icon('clock', 16)}<input type="time" data-m="time" value="${esc(m.time || '')}" ${ro}></label></div>`;
  if (e.type === 'scrap') return `<label class="url" style="flex:1">${icon('link', 16)}<input type="url" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" data-m="url" maxlength="2000" style="width:100%" placeholder="${esc(t('ed.urlPh'))}" value="${esc(m.url || '')}" ${ro}></label>${m.url ? `<button class="urlbtn open" data-act="open-url">${icon('external-link', 16)}${esc(t('ed.open'))}</button>` : ro ? '' : `<button class="urlbtn" data-act="paste-url">${icon('copy', 16)}${esc(t('ed.paste'))}</button>`}`;
  if (e.type === 'item') return `<label style="flex:1">${icon('map-pin', 16)}<input type="text" data-m="place" maxlength="120" style="width:100%" placeholder="${esc(t('ed.where'))}" value="${esc(m.place || '')}" ${ro}></label>`;
  return '';
}
const wireMeta = box => $$('[data-m]', box).forEach(i => i.addEventListener('change', () => setMeta(i.dataset.m, i.value)));
function setMeta(k, v) {
  if (k === 'url') v = safeUrl(v);
  cur.e.meta = { ...cur.e.meta, [k]: v || undefined }; cur.saved = false;
  // 할 일에 시간만 넣으면 날짜는 오늘로 (시간 알림은 날짜가 있어야 울려요)
  if (k === 'time' && v && cur.e.type === 'todo' && !cur.e.meta.date) cur.e.meta.date = todayKey();
  commit();
  if (k !== 'place') paintChips();   // 칩에 날짜 · 시간이 보여요
}
/* 글꼴: 기록 하나 전체(제목+본문)에 적용 */
function paintFont() { const f = fontOf(cur.e); useFont(f); cur.el.root.querySelector('.ed').dataset.font = f;
  $$('.ffb', cur.el.root).forEach(b => { b.dataset.ff = f; b.querySelector('span').textContent = t('ed.font.' + f); }); }
/* ---------- 사진: 글 아래, 원래 비율 그대로 (잘리지 않게) ---------- */
function paintPhotos() {
  const { e, el } = cur; const ps = e.photos || [];
  if (!ps.length) { el.photos.innerHTML = ''; el.photos.hidden = true; return; }
  el.photos.hidden = false; el.photos.classList.toggle('one', ps.length === 1);
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

/* ---------- 서식 줄 (모바일: 키보드 위 막대가 서식 아이콘 줄로 바뀌어요. 키보드는 그대로) ---------- */
function toggleFmt(on = !cur.el.cap?.classList.contains('on-fmt')) {
  const c = cur.el.cap; if (!c) return;
  c.classList.toggle('on-fmt', on);
  $$('.base [data-act=aa]', c).forEach(x => x.setAttribute('aria-expanded', String(on)));
  if (on) { const f = $('.fmt', c); if (f) f.scrollLeft = 0; paintState(); }
}
/* 글꼴: 누를 때마다 기본 → 명조 → 손글씨 */
function nextFont() {
  const f = FONTS[(FONTS.indexOf(fontOf(cur.e)) + 1) % FONTS.length];
  cur.e.meta = { ...cur.e.meta, font: f === 'base' ? undefined : f }; cur.saved = false; paintFont(); commit();
}

/* ---------- 옵션 판: 정보 칩 바로 아래로 펼쳐져요 (모바일 · PC 같아요). 바깥 · ⌃ · 칩을 다시 누르면 접혀요 ---------- */
function openPan() {
  if (!cur) return;
  if (cur.pan) { closePan(); return; }
  cur.pan = 'more';
  if (!isPC() && document.activeElement === cur.el.body) { cur.el.body.blur(); [0, 300, 700].forEach(ms => setTimeout(() => { if (!document.documentElement.classList.contains('kb-open') && scrollY) scrollTo(0, 0); }, ms)); }   // 옵션은 글이 아니라 설정이라 키보드는 내려요 (밀린 화면은 제자리로)
  cur.el.pan.hidden = false; paintPan();
}
function closePan() {
  if (!cur?.pan) return;
  cur.pan = null; cur.exp = null; cur.el.pan.hidden = true; cur.el.pan.innerHTML = '';
  cur.el.info.setAttribute('aria-expanded', 'false'); cur.el.info.classList.remove('on');
}
function paintPan() {
  const { e, el } = cur, m = e.meta || {}, exp = cur.exp, dis = cur.ro ? 'disabled' : '';
  el.info.setAttribute('aria-expanded', 'true'); el.info.classList.add('on');
  const f = e.folder_id && S.folders.get(e.folder_id);
  const fIcon = c => `<svg class="i" width="20" height="20" viewBox="0 0 24 24" style="color:${esc(c || '#A9A5AF')}"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`;
  const row = (attrs, ic, label, val, more = true, on = false) => `<button class="it${on ? ' open' : ''}" ${attrs} ${dis}><span class="ic">${ic}</span><span class="lb">${esc(label)}</span><em>${val}${more ? icon('chevron-right', 16, 'chev') : ''}</em></button>`;
  const field = (k, type, ic, label, val, ph = '') => `<label class="it"><span class="ic">${icon(ic, 20)}</span><span class="lb">${esc(label)}</span><input type="${type}" data-m="${k}" value="${esc(val || '')}" ${ph ? `placeholder="${esc(ph)}" maxlength="120"` : ''} ${dis}></label>`;
  const check = icon('check', 18, 'ck');
  let h = row('data-exp="type"', icon('layers', 20), t('ed.kind'), `${icon(TYPE_ICON[e.type], 16)}${esc(typeLabel(e.type))}`, true, exp === 'type');
  if (exp === 'type') h += `<div class="sub">${TYPES.map(ty => `<button class="it${ty === e.type ? ' on' : ''}" data-type="${ty}" aria-pressed="${ty === e.type}" ${dis}><span class="ic">${icon(TYPE_ICON[ty], 20)}</span><span class="lb">${esc(typeLabel(ty))}</span>${ty === e.type ? check : ''}</button>`).join('')}</div>`;
  if (e.type === 'todo' || e.type === 'event') {
    h += field('date', 'date', 'calendar', t(e.type === 'todo' ? 'ed.due' : 'ed.date'), m.date || (e.type === 'event' ? todayKey() : ''));
    h += field('time', 'time', 'clock', t('ed.time'), m.time);
    if (e.type === 'event') h += field('place', 'text', 'map-pin', t('ed.place'), m.place, t('ed.place'));
  }
  h += row('data-exp="folder"', icon('folder', 20), t('ed.folder'), esc(f ? f.name : t('folder.none')), true, exp === 'folder');
  if (exp === 'folder') h += `<div class="sub"><button class="it${!e.folder_id ? ' on' : ''}" data-folder="" ${dis}><span class="ic">${icon('folder-x', 20)}</span><span class="lb">${esc(t('folder.none'))}</span>${!e.folder_id ? check : ''}</button>${folderList().map(x => `<button class="it${x.id === e.folder_id ? ' on' : ''}" data-folder="${x.id}" ${dis}><span class="ic">${fIcon(x.color)}</span><span class="lb">${esc(x.name)}</span>${x.id === e.folder_id ? check : ''}</button>`).join('')}${cur.ro ? '' : `<button class="it" data-folder="+"><span class="ic">${icon('plus', 20)}</span><span class="lb">${esc(t('folder.new'))}</span></button>`}</div>`;
  if (!isPC()) h += row('data-act="card"', icon('image', 20), t('card.title'), '');
  el.pan.innerHTML = `<div class="rows">${h}</div>
    <div class="acts"><button data-x="fav" class="${e.favorite ? 'on' : ''}">${icon('star', 18)}${esc(t(e.favorite ? 'ed.unfavorite' : 'ed.favorite'))}</button><button data-x="pin" class="${e.pinned ? 'on' : ''}">${icon('pin', 18)}${esc(t(e.pinned ? 'ed.unpin' : 'ed.pin'))}</button><button data-x="trash" class="bad">${icon('trash-2', 18)}${esc(t('ed.trash'))}</button></div>
    <button class="up" data-act="more" aria-label="${esc(t('common.close'))}">${icon('chevron-up', 20)}</button>`;
  wireMeta(el.pan);
  fitRow($('.acts', el.pan), 2);
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
  if (document.activeElement !== body) { const r = saveRange(); body.focus({ preventScroll: true }); restoreRange(r); }
  if (['bold', 'italic', 'underline'].includes(f)) { cur.hist.snap(); document.execCommand(f); }
  else if (f === 'undo') { if (!cur.hist.back()) return; }
  else if (f === 'mark' || f === 'link') { cur.hist.snap(); await fmtAction(f); cur.hist?.snap(); return; }
  else applyBlock(f);
  cur.saved = false; cur.save(); paintState();
}

/* ---------- 버튼 ---------- */
async function onAct(ev) {
  if (!cur) return;
  const fb = ev.target.closest('[data-f]');
  if (fb && !cur.ro) { fmt(fb.dataset.f); return; }
  const xp = ev.target.closest('[data-exp]');
  if (xp && !cur.ro) { cur.exp = cur.exp === xp.dataset.exp ? null : xp.dataset.exp; paintPan(); return; }
  const ty = ev.target.closest('[data-type]'), fo = ev.target.closest('[data-folder]'), x = ev.target.closest('[data-x]');
  const e = cur.e;
  if (ty && !cur.ro) { cur.exp = null; if (ty.dataset.type !== e.type) { e.type = ty.dataset.type; cur.saved = false; paintChips(); commit(); } else paintPan(); return; }
  if (fo && !cur.ro) {
    let id = fo.dataset.folder;
    if (id === '+') { const name = await promptDlg(t('folder.new'), { placeholder: t('folder.name'), maxlength: 40 }); if (!name || !cur) return; const f = await addFolder(name); if (!f) return; id = f.id; }
    cur.exp = null;
    if ((id || null) !== e.folder_id) { e.folder_id = id || null; cur.saved = false; paintChips(); commit(); } else if (cur.pan) paintPan();
    return;
  }
  if (x) { more(x.dataset.x); return; }
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'back') { await commit(); const back = history.length > 1; leave(); back ? history.back() : go('/home'); }
  else if (a === 'cancel') cancel();
  else if (a === 'done') finish(b);
  else if (a === 'plans') go('/plans');
  else if (a === 'aa') toggleFmt();
  else if (a === 'font') { if (!cur.ro) nextFont(); }
  else if (a === 'more') openPan();
  else if (a === 'photo') { if (!CFG.PHOTOS_URL) toast(t('photo.soon')); else if ((e.photos || []).length >= 4) toast(t('photo.perEntry')); else cur.el.root.querySelector('.ed-file').click(); }
  else if (a === 'ph') photoMenu(b.dataset.id);
  else if (a === 'open-url') openUrl(e.meta.url);
  else if (a === 'paste-url') { try { const v = (await navigator.clipboard.readText()).trim(); if (v) setMeta('url', v); else cur.el.meta.querySelector('[data-m=url]')?.focus(); } catch { cur.el.meta.querySelector('[data-m=url]')?.focus(); } }
  else if (a === 'card') { await commit(); if (!cur) return; closePan(); const { openCard } = await import('../features/card.js'); openCard(cur.e); }
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
  if (cur?.pane) { const p = cur.pane; leave(); p.onDone?.(wrote ? e : null); return; }
  leave();
  if (wrote && wasNew) go('/all', { replace: true }); else history.length > 1 ? history.back() : go('/home');
}
/* 취소: 고친 게 없으면 그냥 나가요. 고쳤으면 물어보고, 새 글은 지우고 · 고친 글은 열었을 때 모습으로 되돌려요 */
async function cancel() {
  const c = cur, e = c.e, o = c.orig;
  const changed = c.touched || e.type !== o.type || e.folder_id !== o.folder_id || JSON.stringify(e.meta || {}) !== JSON.stringify(o.meta);
  const out = () => { const p = c.pane; leave(); if (p) (c.wasNew ? p.onGone?.() : p.onDone?.(null)); else history.length > 1 ? history.back() : go('/home'); };
  if (!changed || c.ro) { if (!c.ro) await commit(); out(); return; }
  c.save.cancel();
  if (!await confirmDlg(t('ed.discardQ'), t(c.wasNew ? 'ed.discardNew' : 'ed.discardEdit'), t('ed.discard'), { danger: true, cancel: t('ed.keepWriting') })) return;
  if (cur !== c) return;
  if (c.wasNew) { if (S.entries.has(e.id)) await purgeEntries([e.id]); }
  else { Object.assign(e, { title: o.title, content: o.content, text: o.text, type: o.type, folder_id: o.folder_id, meta: o.meta }); await saveEntry(e, { quiet: true }); }
  c.touched = false; c.saved = undefined; c.isNew = false;   // 나가면서 다시 저장하지 않게
  c.el.body.innerHTML = c.base;
  out();
}
async function more(v) {
  const e = cur.e;
  if (v === 'fav' || v === 'pin') {
    const k = v === 'fav' ? 'favorite' : 'pinned';
    if (cur.isNew) e[k] = !e[k]; else await patchEntry(e.id, { [k]: !e[k] });
    if (cur) paintChips();
  } else if (v === 'trash') {
    const p = cur.pane;
    if (cur.isNew) { leave(); p ? p.onGone?.() : history.back(); return; }
    await commit(); const id = e.id; leave(); await trashEntry(id);
    toast(t('ed.trashed'), { action: t('common.undo'), onAction: () => import('../data/store.js').then(m => m.restoreEntry(id)) });
    if (p) p.onGone?.(); else history.length > 1 ? history.back() : go('/home');
  }
}

/* ---------- 본문 편집 도우미 ---------- */
/* 쓰는 자리(커서)가 막대·판·키보드에 가리면 글 상자만 살짝 올려요 (휴대폰). 화면 전체는 움직이지 않아요 */
function keepCaret() {
  if (!cur || isPC() || cur.pane) return;
  const s = getSelection(); if (!s.rangeCount || !cur.el.body.contains(s.anchorNode)) return;
  const sc = cur.el.body.closest('.ed'); if (!sc || sc.scrollHeight <= sc.clientHeight) return;
  const r = s.getRangeAt(0); let rect = r.getClientRects()[0] || r.getBoundingClientRect();
  if (!rect || (!rect.height && !rect.top)) { const n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement; rect = n?.getBoundingClientRect(); }
  if (!rect) return;
  const box = sc.getBoundingClientRect(), gap = 28;
  if (rect.bottom > box.bottom - gap) sc.scrollTop += rect.bottom - (box.bottom - gap);
  else if (rect.top < box.top + 8) sc.scrollTop -= (box.top + 8) - rect.top;
}
function placeCaret(node, atEnd = true) {
  node.focus?.(); const r = document.createRange(); const s = getSelection();
  if (node === cur?.el.body && !node.childNodes.length) node.innerHTML = '<p><br></p>';
  r.selectNodeContents(node.nodeType === 1 && node.matches('.ed-body') ? (atEnd ? node.lastChild || node : node.firstChild || node) : node); r.collapse(!atEnd);
  s.removeAllRanges(); s.addRange(r);
}
const blockOf = n => { while (n && n !== cur.el.body) { if (n.nodeType === 1 && /^(P|DIV|H2|H3|LI|BLOCKQUOTE)$/.test(n.tagName)) return n; n = n.parentNode; } return null; };
function applyBlock(k) {
  cur.hist?.snap();
  if (k === 'divider') { document.execCommand('insertHTML', false, '<hr><p><br></p>'); liftLists(); }
  else setBlock(cur.el.body, k);
  cur.hist?.snap(); cur.saved = false; cur.save();
}
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
  if (mod && ['b', 'i', 'u'].includes(ev.key.toLowerCase())) { ev.preventDefault(); cur.hist.snap(); document.execCommand({ b: 'bold', i: 'italic', u: 'underline' }[ev.key.toLowerCase()]); cur.save(); paintState(); }
  if (mod && ev.key.toLowerCase() === 'k') { ev.preventDefault(); fmt('link'); }
  if (mod && (ev.key.toLowerCase() === 'z' || ev.key.toLowerCase() === 'y')) { ev.preventDefault(); const redo = ev.key.toLowerCase() === 'y' || ev.shiftKey; if (redo ? cur.hist.fwd() : cur.hist.back()) { cur.saved = false; cur.save(); paintState(); } }
  // 체크리스트 줄에서 Enter: 새 줄은 체크 안 된 상태로
  if (ev.key === 'Enter' && !ev.shiftKey) setTimeout(() => { const li = blockOf(getSelection().anchorNode); if (li?.tagName === 'LI') li.classList.remove('done'); }, 0);
}
function onBodyClick(ev) {
  const a = ev.target.closest('a[href]');
  if (a) { if (ev.metaKey || ev.ctrlKey || cur.ro) { ev.preventDefault(); openUrl(a.getAttribute('href')); } else linkPop(a); return; }
  const li = ev.target.closest('ul.todo > li'); if (!li || cur.ro) return;
  const x = ev.clientX - li.getBoundingClientRect().left; if (x > 28) return;
  li.classList.toggle('done'); cur.saved = false; cur.save();
}
function onPaste(ev) {
  const html = ev.clipboardData.getData('text/html'); const text = ev.clipboardData.getData('text/plain');
  ev.preventDefault();
  const u = text.trim();
  if (/^https?:\/\/\S+$/i.test(u) && !/\s/.test(u)) document.execCommand('insertHTML', false, `<a href="${esc(u)}">${esc(u)}</a>&nbsp;`);   // 주소만 붙여 넣으면 바로 링크로
  else if (html) document.execCommand('insertHTML', false, sanitizeHTML(html));
  else document.execCommand('insertText', false, text);
}
/* 링크: 글 안의 링크를 누르면 바로 아래 '링크 열기' 단추가 떠요 (쓰는 중엔 커서가 들어가야 하니까 바로 열지는 않아요) */
const safeUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return /^(https?|mailto|tel):/i.test(u) ? u : ''; };
function openUrl(u) { u = safeUrl(u); if (u) window.open(u, '_blank', 'noopener'); }
function linkPop(a) {
  document.querySelector('.lk-pop')?.remove();
  const u = safeUrl(a.getAttribute('href')); if (!u) return;
  const r = a.getBoundingClientRect(), p = document.createElement('button');
  p.className = 'lk-pop'; p.innerHTML = `${icon('external-link', 16)}<span>${esc(t('ed.openLink'))}</span><small>${esc(u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32))}</small>`;
  p.style.left = Math.max(12, Math.min(r.left, innerWidth - 260)) + 'px'; p.style.top = (r.bottom + 8) + 'px';
  p.onmousedown = e => e.preventDefault();
  p.onclick = () => { p.remove(); openUrl(u); };
  document.body.append(p);
  const off = e => { if (e.target.closest?.('.lk-pop')) return; p.remove(); removeEventListener('pointerdown', off, true); removeEventListener('scroll', off2, true); };
  const off2 = () => { p.remove(); removeEventListener('pointerdown', off, true); removeEventListener('scroll', off2, true); };
  setTimeout(() => { addEventListener('pointerdown', off, true); addEventListener('scroll', off2, true); }, 0);
}

/* ---------- 형광펜 · 링크 ---------- */
// 형광펜은 굵게처럼 켜고 꺼요: 글을 고르면 그 부분에, 고르지 않으면 이어서 쓰는 글자부터 칠하거나 멈춰요
const ZW = '\u200B';
function mark(s, range) {
  if (!range) return;
  const body = cur.el.body, markOf = n => (n?.nodeType === 1 ? n : n?.parentElement)?.closest('mark');
  const place = (node, off) => { const r = document.createRange(); r.setStart(node, off); r.collapse(true); s.removeAllRanges(); s.addRange(r); };
  if (!range.collapsed) {
    const hit = [...body.querySelectorAll('mark')].filter(m => range.intersectsNode(m));
    const m0 = markOf(range.startContainer);
    if (m0 && m0 === markOf(range.endContainer)) {          // 칠한 곳 안에서 고르면: 고른 부분만 지워요
      const before = document.createRange(); before.setStart(m0, 0); before.setEnd(range.startContainer, range.startOffset);
      const after = document.createRange(); after.setStart(range.endContainer, range.endOffset); after.setEnd(m0, m0.childNodes.length);
      const wrap = r => { if (!r.toString()) return []; const x = document.createElement('mark'); x.append(r.cloneContents()); return [x]; };
      const a = document.createTextNode(''), z = document.createTextNode('');
      m0.replaceWith(...wrap(before), a, range.cloneContents(), z, ...wrap(after));
      const r = document.createRange(); r.setStartAfter(a); r.setEndBefore(z); s.removeAllRanges(); s.addRange(r);
      return;
    }
    // 고른 글자가 모두 칠해져 있으면 지우고, 아니면 고른 곳 전체를 칠해요
    const texts = [], w = document.createTreeWalker(range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) if (range.intersectsNode(w.currentNode) && w.currentNode.textContent.replace(/[\s\u200B]/g, '')) texts.push(w.currentNode);
    if (texts.length && texts.every(n => markOf(n))) { hit.forEach(x => x.replaceWith(...x.childNodes)); return; }
    // 글자 조각마다 칠해요 (여러 줄에 걸쳐도 줄 모양이 그대로예요)
    const { startContainer: sc, startOffset: so, endContainer: ec, endOffset: eo } = range;
    let first = null, last = null;
    texts.forEach(n => {
      let t0 = n;
      if (n === ec && eo < n.length) n.splitText(eo);
      if (n === sc && so > 0) t0 = n.splitText(so);
      if (!markOf(t0)) { const m = document.createElement('mark'); t0.replaceWith(m); m.append(t0); }
      first = first || t0; last = t0;
    });
    body.querySelectorAll('mark + mark').forEach(m => { const p = m.previousSibling; if (p?.nodeName === 'MARK') { p.append(...m.childNodes); m.remove(); } });
    if (first) { const r = document.createRange(); r.setStart(first, 0); r.setEnd(last, last.length); s.removeAllRanges(); s.addRange(r); }
    return;
  }
  const inMark = markOf(range.startContainer);
  if (inMark) {   // 칠하는 중이면 여기서 멈춰요: 커서 뒤는 칠한 채로 두고, 이어서 쓰는 글자는 칠하지 않아요
    const tail = document.createRange(); tail.setStart(range.startContainer, range.startOffset); tail.setEnd(inMark, inMark.childNodes.length);
    const rest = tail.extractContents(), txt = document.createTextNode(ZW);
    inMark.after(txt);
    if (rest.textContent.replace(new RegExp(ZW, 'g'), '')) { const m2 = document.createElement('mark'); m2.append(rest); txt.after(m2); }
    if (!inMark.textContent.replace(new RegExp(ZW, 'g'), '')) inMark.remove();
    place(txt, 1);
  } else {        // 지금부터 쓰는 글자를 칠해요
    const m = document.createElement('mark'), txt = document.createTextNode(ZW); m.append(txt);
    range.insertNode(m); place(txt, 1);
  }
}

async function fmtAction(f) {
  const s = getSelection(); const range = s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
  const at = range && (range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement);
  if (f === 'mark') mark(s, range);
  else if (f === 'link') {
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
