/* 정리형 목록: 모든 기록, 종류별, 폴더, 폴더 없음, 할 일, 휴지통, 찾기 */
import { S, TYPES, displayTitle, live, patchEntry, purgeEntries, restoreEntry, trash, trashEntry } from '../data/store.js';
import { TYPE_ICON } from '../ui/shell.js';
import { fmtDate, fmtHM, fmtNum, fmtTime, t } from '../core/i18n.js';
import { addDays, dayKey, debounce, esc, icon, nowISO, todayKey } from '../core/utils.js';
import { confirmDlg, toast } from '../ui/feedback.js';
import { go } from '../ui/router.js';
import { removeFolder, renameFolder } from './folders.js';
import { pickAction, typeLabel } from './pickers.js';
import { Photos } from '../features/photos.js';

let filter = 'all';
const preview = e => (e.text || '').split('\n').map(s => s.trim()).filter(Boolean).filter(s => s !== e.title.trim()).join(' ').slice(0, 140);
function dayLabel(k) {
  const today = todayKey();
  if (k === today) return t('list.today');
  if (k === dayKey(addDays(new Date(), -1))) return t('list.yesterday');
  const d = new Date(k + 'T00:00');
  return fmtDate(d, { month: 'long', day: 'numeric', weekday: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}
function hl(text, terms) {
  let out = esc(text);
  terms.forEach(w => { const re = new RegExp(esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); out = out.replace(re, m => `<mark>${m}</mark>`); });
  return out;
}
function row(e, { terms = [], mode = '' } = {}) {
  const today = todayKey(), m = e.meta || {};
  let sub = preview(e);
  if (e.type === 'event' && m.date) sub = [m.date === today ? t('list.today') : fmtDate(m.date + 'T00:00', { month: 'short', day: 'numeric' }), m.time && fmtHM(m.time), m.place].filter(Boolean).join(' · ');
  if (e.type === 'todo' && m.date && !m.done) sub = `<span class="due">${esc(m.date <= today ? t('todo.due') : fmtDate(m.date + 'T00:00', { month: 'short', day: 'numeric' }))}</span>` + (sub ? ' · ' + esc(sub) : '');
  else if (e.type === 'item' && m.place) sub = m.place;
  else if (e.type === 'scrap' && m.url) { let host = ''; try { host = new URL(m.url).hostname.replace(/^www\./, ''); } catch {} sub = [host, sub].filter(Boolean).join(' · '); }
  const subHtml = sub.startsWith('<span') ? sub : hl(sub, terms);
  const f = e.folder_id && S.folders.get(e.folder_id);
  const time = mode === 'trash' ? '' : dayKey(new Date(e.created_at)) === today ? fmtTime(new Date(e.created_at)) : fmtDate(e.created_at, { month: 'numeric', day: 'numeric' });
  const lead = e.type === 'todo' && mode !== 'trash' ? `<button class="chk${m.done ? ' on' : ''}" data-done="${e.id}" aria-label="${esc(t('common.done'))}" aria-pressed="${!!m.done}">${m.done ? icon('check', 14) : ''}</button>`
    : `<span class="kc">${icon(TYPE_ICON[e.type] || 'file-text', 20)}</span>`;
  const side = mode === 'trash' ? `<span class="side"><button data-restore="${e.id}">${esc(t('list.restore'))}</button><button class="bad" data-purge="${e.id}" aria-label="${esc(t('list.purge'))}">${icon('trash-2', 15)}</button></span>` : `<span class="tm">${e.favorite ? icon('star', 13) + ' ' : ''}${e.pinned ? icon('pin', 13) + ' ' : ''}${esc(time)}</span>`;
  const ps = e.photos || [];
  const th = ps.length && mode !== 'trash' ? `<span class="th">${Photos.imgTag(ps[0])}${ps.length > 1 ? `<b>${esc(t('photo.more', { n: ps.length - 1 }))}</b>` : ''}</span>` : '';
  const a = `<a class="r" href="#/e/${e.id}">${lead}<span class="tx"><div class="t${m.done ? ' done' : ''}">${hl(displayTitle(e, t('common.untitled')), terms)}</div>${subHtml || f ? `<div class="p">${subHtml}${f && mode !== 'folder' ? (subHtml ? ' · ' : '') + esc(f.name) : ''}</div>` : ''}</span>${th}${mode === 'trash' ? '' : `<button class="del" data-del="${e.id}" aria-label="${esc(t('list.del'))}">${icon('trash-2', 17)}</button>`}${side}</a>`;
  // 왼쪽으로 밀면 삭제 버튼이 나와요 (끝까지 밀면 바로 휴지통). PC는 줄에 마우스를 올리면 휴지통 버튼
  return mode === 'trash' ? a : `<div class="swp" data-id="${e.id}"><button class="swp-del" data-del="${e.id}" tabindex="-1">${icon('trash-2', 20)}<span>${esc(t('list.del'))}</span></button>${a}</div>`;
}
function groups(list, opts, key = e => dayKey(new Date(e.created_at))) {
  const out = []; let g = null;
  for (const e of list) { const k = key(e); if (!g || g.k !== k) { g = { k, items: [] }; out.push(g); } g.items.push(e); }
  return out.map(g => `<div class="grp"><span>${esc(dayLabel(g.k))}</span><span>${g.items.length}</span></div><div class="card">${g.items.map(e => row(e, opts)).join('')}</div>`).join('');
}

function render(view, r) {
  const p = r.path;
  const mode = p === '/todo' ? 'todo' : p === '/trash' ? 'trash' : p === '/search' ? 'search' : p.startsWith('/folder/') ? 'folder' : p === '/nofolder' ? 'nofolder' : p.startsWith('/type/') ? 'type' : p === '/favorites' ? 'fav' : 'all';
  if (mode !== 'all') filter = 'all';
  const folder = mode === 'folder' ? S.folders.get(r.params.id) : null;
  if (mode === 'folder' && !folder) { go('/all', { replace: true }); return; }
  const title = mode === 'todo' ? t('nav.todo') : mode === 'trash' ? t('nav.trash') : mode === 'search' ? t('nav.search') : mode === 'folder' ? folder.name : mode === 'nofolder' ? t('nav.noFolder') : mode === 'type' ? typeLabel(r.params.type) : mode === 'fav' ? t('nav.fav') : t('nav.all');
  view.innerHTML = `<section class="lst"><div class="lst-head"><h1>${esc(title)}</h1><span class="c"></span><span class="act"></span></div><div class="filters"></div>
    ${mode === 'search' ? `<label class="field searchbar">${icon('search', 18)}<input type="search" enterkeyhint="search" placeholder="${esc(t('list.search'))}" aria-label="${esc(t('nav.search'))}"></label>` : ''}
    <div class="body"></div><div style="height:120px"></div></section>`;
  const act = view.querySelector('.act');
  if (mode === 'folder') act.innerHTML = `<button class="icon-btn" data-folder-more aria-label="${esc(t('ed.more'))}">${icon('more-horizontal', 20)}</button>`;
  if (mode === 'trash') act.innerHTML = `<button class="chip" data-empty-trash>${esc(t('list.emptyTrash'))}</button>`;
  if (mode !== 'search' && mode !== 'trash') act.insertAdjacentHTML('beforeend', `<a class="icon-btn" href="#/search" aria-label="${esc(t('nav.search'))}">${icon('search', 20)}</a>`);
  const q = r.query.q || '';
  const sInput = view.querySelector('.searchbar input'); if (sInput) { sInput.value = q; setTimeout(() => sInput.focus(), 50); sInput.addEventListener('input', debounce(() => { history.replaceState(null, '', '#/search?q=' + encodeURIComponent(sInput.value)); paint(); }, 200)); }
  const paint = () => { paintBody(view, { mode, r, folder, q: sInput ? sInput.value : q }); Photos.hydrate(view); };
  view.paintList = paint; paint(); swipe(view);
  // 방금 쓴 기록은 잠깐 반짝여요
  let hid = null; try { hid = sessionStorage.getItem('daytale.hl'); sessionStorage.removeItem('daytale.hl'); } catch {}
  const hr = hid && view.querySelector(`.swp[data-id="${hid}"] .r`);
  if (hr) { hr.classList.add('hl'); hr.scrollIntoView({ block: 'center' }); setTimeout(() => hr.classList.remove('hl'), 1800); }
  view.addEventListener('click', async ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.del) { ev.preventDefault(); const id = b.dataset.del; await trashEntry(id); toast(t('ed.trashed'), { action: t('common.undo'), onAction: () => restoreEntry(id) }); }
    else if (b.dataset.done) { ev.preventDefault(); const e = S.entries.get(b.dataset.done); const d = !e.meta.done; await patchEntry(e.id, { meta: { ...e.meta, done: d, doneAt: d ? nowISO() : null } }); }
    else if (b.dataset.restore) { ev.preventDefault(); await restoreEntry(b.dataset.restore); toast(t('list.restored')); }
    else if (b.dataset.purge) { ev.preventDefault(); if (await confirmDlg(t('list.purgeQ'), t('list.purgeBody'), t('list.purge'), { danger: true })) await purgeEntries([b.dataset.purge]); }
    else if ('emptyTrash' in b.dataset) { const ids = trash().map(e => e.id); if (ids.length && await confirmDlg(t('list.emptyTrashQ'), t('list.emptyTrashBody', { n: ids.length }), t('list.emptyTrash'), { danger: true })) await purgeEntries(ids); }
    else if ('folderMore' in b.dataset) { const v = await pickAction(folder.name, [{ v: 'rename', label: t('folder.rename'), icon: 'pencil' }, { v: 'delete', label: t('folder.delete'), icon: 'trash-2', danger: true }]); if (v === 'rename') renameFolder(folder.id); else if (v === 'delete') removeFolder(folder.id); }
    else if (b.dataset.f) { filter = b.dataset.f; paint(); }
    else if ('new' in b.dataset) go('/new' + (mode === 'type' ? '?type=' + r.params.type : mode === 'folder' ? '?folder=' + folder.id : mode === 'todo' ? '?type=todo' : ''));
    else return;
    paint();
  });
}
function paintBody(view, { mode, r, folder, q }) {
  const body = view.querySelector('.body'), count = view.querySelector('.lst-head .c'), fl = view.querySelector('.filters');
  fl.addEventListener('scroll', e => edges(e.target), { passive: true, capture: true });
  let list = mode === 'trash' ? trash() : live();
  if (mode === 'type') list = list.filter(e => e.type === r.params.type);
  if (mode === 'folder') list = list.filter(e => e.folder_id === folder.id);
  if (mode === 'nofolder') list = list.filter(e => !e.folder_id);
  if (mode === 'fav') list = list.filter(e => e.favorite);
  // 종류 칩 (모든 기록·폴더에서)
  if (mode === 'all' || mode === 'folder' || mode === 'nofolder' || mode === 'fav') {
    const kinds = TYPES.filter(ty => list.some(e => e.type === ty));
    const x = fl.firstElementChild?.scrollLeft || 0;
    fl.innerHTML = kinds.length > 1 ? '<div class="fs">' + [`<button class="${filter === 'all' ? 'on' : ''}" data-f="all">${esc(t('list.all'))}</button>`, ...kinds.map(ty => `<button class="${filter === ty ? 'on' : ''}" data-f="${ty}">${esc(typeLabel(ty))}</button>`)].join('') + '</div>' : '';
    if (fl.firstElementChild) { fl.firstElementChild.scrollLeft = x; capsule(fl.firstElementChild); }
    if (filter !== 'all') list = list.filter(e => e.type === filter);
  } else fl.innerHTML = '';
  const byNew = (a, b) => b.created_at.localeCompare(a.created_at);
  if (mode === 'todo') {
    const all = list.filter(e => e.type === 'todo');
    const open = all.filter(e => !e.meta.done).sort((a, b) => (a.meta.date || '9999').localeCompare(b.meta.date || '9999') || byNew(a, b));
    const done = all.filter(e => e.meta.done).sort((a, b) => (b.meta.doneAt || '').localeCompare(a.meta.doneAt || '')).slice(0, 30);
    count.textContent = open.length ? fmtNum(open.length) : '';
    body.innerHTML = (open.length ? `<div class="grp"><span>${esc(t('list.openTodos'))}</span><span>${open.length}</span></div><div class="card">${open.map(e => row(e)).join('')}</div>` : '') +
      (done.length ? `<div class="grp"><span>${esc(t('list.doneTodos'))}</span><span>${done.length}</span></div><div class="card">${done.map(e => row(e)).join('')}</div>` : '') +
      (!all.length ? `<div class="empty">${esc(t('list.empty'))}</div>` : '');
    return;
  }
  if (mode === 'trash') {
    count.textContent = list.length ? fmtNum(list.length) : '';
    body.innerHTML = list.length ? `<p class="hint">${esc(t('list.trashNote'))}</p>` + groups(list, { mode }, e => dayKey(new Date(e.deleted_at))) : `<div class="empty">${esc(t('list.trashEmpty'))}</div>`;
    return;
  }
  if (mode === 'search') {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { body.innerHTML = ''; count.textContent = ''; return; }
    const hay = e => [e.title, e.text, (e.tags || []).join(' '), e.meta?.place || '', typeLabel(e.type), S.folders.get(e.folder_id)?.name || ''].join(' ').toLowerCase();
    const found = list.filter(e => { const h = hay(e); return terms.every(w => h.includes(w)); })
      .sort((a, b) => (b.title.toLowerCase().includes(terms[0]) ? 1 : 0) - (a.title.toLowerCase().includes(terms[0]) ? 1 : 0) || b.updated_at.localeCompare(a.updated_at)).slice(0, 300);
    count.textContent = '';
    body.innerHTML = found.length ? `<p class="hint">${esc(t('list.found', { n: fmtNum(found.length) }))}</p><div class="card" style="margin-top:12px">${found.map(e => row(e, { terms })).join('')}</div>` : `<div class="empty">${esc(t('list.noResults'))}</div>`;
    return;
  }
  if (mode === 'type' && r.params.type === 'event') {   // 일정: 다가오는 일정(가까운 순) · 지난 일정(최근 순)
    const today = todayKey(), up = list.filter(e => (e.meta.date || '') >= today).sort((a, b) => (a.meta.date + (a.meta.time || '')).localeCompare(b.meta.date + (b.meta.time || '')));
    const past = list.filter(e => (e.meta.date || '') < today).sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || '')).slice(0, 200);
    count.textContent = up.length ? fmtNum(up.length) : '';
    body.innerHTML = (up.length ? `<div class="grp"><span>${esc(t('list.upcoming'))}</span><span>${up.length}</span></div><div class="card">${up.map(e => row(e, { mode })).join('')}</div>` : '') +
      (past.length ? `<div class="grp"><span>${esc(t('list.past'))}</span><span>${past.length}</span></div><div class="card">${past.map(e => row(e, { mode })).join('')}</div>` : '') +
      (!list.length ? `<div class="empty">${esc(t('list.empty'))}</div>` : '');
    return;
  }
  count.textContent = list.length ? fmtNum(list.length) : '';
  const pinned = list.filter(e => e.pinned).sort(byNew), rest = list.filter(e => !e.pinned).sort(byNew);
  body.innerHTML = (pinned.length ? `<div class="grp"><span>${esc(t('list.pinned'))}</span><span>${pinned.length}</span></div><div class="card">${pinned.map(e => row(e, { mode })).join('')}</div>` : '') +
    (rest.length ? groups(rest.slice(0, 600), { mode }) : pinned.length ? '' : `<div class="empty">${esc(t(mode === 'fav' ? 'list.emptyFav' : 'list.empty'))}</div>`);
}
const refresh = view => view.paintList?.();

/* 밀어서 삭제 (손가락). 조금 밀면 삭제 버튼이 열리고, 반 넘게 밀면 바로 휴지통으로 */
function swipe(view) {
  let s = null;
  const close = except => view.querySelectorAll('.swp.open').forEach(w => { if (w !== except) { w.classList.remove('open'); w.querySelector('.r, .ev').style.transform = ''; w.style.setProperty('--rev', '0px'); } });
  view.addEventListener('touchstart', ev => {
    const w = ev.target.closest('.swp'); if (!w || ev.target.closest('.swp-del')) return;
    close(w); const r = w.querySelector('.r, .ev');
    s = { w, r, x: ev.touches[0].clientX, y: ev.touches[0].clientY, base: w.classList.contains('open') ? -88 : 0, cur: 0, dir: null };
  }, { passive: true });
  view.addEventListener('touchmove', ev => {
    if (!s) return;
    const dx = ev.touches[0].clientX - s.x, dy = ev.touches[0].clientY - s.y;
    if (!s.dir) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { s.dir = 'h'; s.w.classList.add('moving'); } else if (Math.abs(dy) > 10) { s = null; return; } else return; }
    ev.preventDefault();
    s.cur = Math.min(0, s.base + dx); s.r.style.transform = `translateX(${s.cur}px)`; s.w.style.setProperty('--rev', -s.cur + 'px');
  }, { passive: false });
  view.addEventListener('touchend', async () => {
    if (!s) return; const { w, r, cur, dir } = s; s = null;
    if (!dir) return;
    w.classList.remove('moving'); w.dataset.swiped = '1'; setTimeout(() => delete w.dataset.swiped, 350);
    if (cur < -r.offsetWidth * .5) { w.classList.add('gone'); r.style.transform = 'translateX(-110%)'; const id = w.dataset.id; setTimeout(async () => { await trashEntry(id); toast(t('ed.trashed'), { action: t('common.undo'), onAction: () => restoreEntry(id) }); }, 180); }
    else if (cur < -44) { w.classList.add('open'); r.style.transform = 'translateX(-88px)'; w.style.setProperty('--rev', '88px'); }
    else { w.classList.remove('open'); r.style.transform = ''; w.style.setProperty('--rev', '0px'); }
  });
  // 밀던 중이거나 열려 있으면 눌러도 글로 들어가지 않고 닫혀요
  view.addEventListener('click', ev => {
    const w = ev.target.closest('.swp'); if (!w || ev.target.closest('.swp-del, .del, .chk')) { if (!w) close(); return; }
    if (w.dataset.swiped || w.classList.contains('open')) { ev.preventDefault(); ev.stopPropagation(); close(); }
    else close();
  }, true);
}

export { refresh, render, row, swipe };

// 종류가 많아 캡슐이 넘치면 옆으로 밀어요: 고른 칸이 보이게 두고, 더 있는 쪽 끝을 흐리게
function edges(fl) {
  const max = fl.scrollWidth - fl.clientWidth;
  fl.classList.toggle('more-l', max > 2 && fl.scrollLeft > 2);
  fl.classList.toggle('more-r', max > 2 && fl.scrollLeft < max - 2);
}
function capsule(fl) {
  const on = fl.querySelector('.on');
  if (on && fl.scrollWidth > fl.clientWidth) {
    const b = on.getBoundingClientRect(), f = fl.getBoundingClientRect();
    if (b.left < f.left + 24) fl.scrollLeft -= f.left + 24 - b.left; else if (b.right > f.right - 24) fl.scrollLeft += b.right - f.right + 24;
  }
  edges(fl);
}
