/* 앱 틀 그리기: 메뉴(서랍/사이드바), 상단 캡슐, 하단 독, PC 오른쪽 위 알림 */
import { Account } from '../data/account.js';
import { S, TYPES, folderList, live, onChange } from '../data/store.js';
import { brand } from '../core/config.js';
import { getLang, t } from '../core/i18n.js';
import { $, $$, esc, icon } from '../core/utils.js';
import { go, now } from './router.js';

const TYPE_ICON = { note: 'file-text', todo: 'check-square', event: 'calendar', idea: 'lightbulb', item: 'map-pin', personal: 'feather', scrap: 'bookmark' };
let unread = 0;
const setUnread = n => { unread = n; paintBadges(); };

function frame() {
  $('#app').innerHTML = `
  <div class="layout">
    <div class="scrim" data-act="close-menu"></div>
    <aside class="drawer" aria-label="${esc(t('nav.menu'))}">
      <div class="head"><span class="logo"></span><span class="brand">${esc(brand(getLang()))}</span>
        <button class="icon-btn close" data-act="close-menu" aria-label="${esc(t('nav.closeMenu'))}" style="color:var(--muted)">${icon('x', 20)}</button></div>
      <button class="profile-card" data-go="/settings/account"></button>
      <label class="search">${icon('search', 18)}<input type="search" enterkeyhint="search" placeholder="${esc(t('nav.search'))}" aria-label="${esc(t('nav.search'))}"></label>
      <nav class="nav"></nav>
      <div class="foot"><button class="m" data-go="/trash">${icon('trash-2', 18)}${esc(t('nav.trash'))}</button><button class="m" data-go="/settings">${icon('settings', 18)}${esc(t('nav.settings'))}</button></div>
    </aside>
    <div class="main">
      <div class="topcap"><nav class="glass" aria-label="${esc(t('nav.menu'))}">
        <button class="icon-btn" data-act="menu" aria-label="${esc(t('nav.menu'))}">${icon('menu-alt', 20)}</button><span class="sep"></span>
        <button class="icon-btn" data-go="/settings/account" aria-label="${esc(t('nav.profile'))}"><span class="avatar"></span></button>
        <button class="icon-btn bell" data-go="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 19)}</button>
        <button class="icon-btn" data-go="/settings" aria-label="${esc(t('nav.settings'))}">${icon('settings', 19)}</button>
      </nav></div>
      <div class="pc-top"><button class="btn primary" data-act="new" style="height:44px;border-radius:22px;padding:0 18px;font-size:15px">${icon('plus', 18)}${esc(t('nav.new'))}</button><button class="icon-btn glass bell" data-go="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 19)}</button></div>
      <main id="view" class="view" tabindex="-1"></main>
    </div>
    <nav class="dock glass" aria-label="${esc(t('nav.menu'))}">
      <a class="tab" href="#/home" data-tab="/home">${esc(t('nav.home'))}</a><a class="tab" href="#/all" data-tab="/all">${esc(t('nav.allShort'))}</a>
      <a class="tab" href="#/todo" data-tab="/todo">${esc(t('nav.todo'))}</a><a class="tab" href="#/calendar" data-tab="/calendar">${esc(t('nav.calendar'))}</a>
      <button class="plus" data-act="new" aria-label="${esc(t('nav.new'))}">${icon('plus', 24)}</button>
    </nav>
  </div>`;
  const app = $('#app');
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-go],[data-act]'); if (!b) return;
    if (b.dataset.go) { closeMenu(); go(b.dataset.go); return; }
    const a = b.dataset.act;
    if (a === 'menu') openMenu(); else if (a === 'close-menu') closeMenu(); else if (a === 'new') { closeMenu(); go('/new'); }
    else if (a === 'new-folder') import('../views/folders.js').then(m => m.newFolderDialog());
  });
  $('.search input').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) { closeMenu(); go('/search?q=' + encodeURIComponent(e.target.value.trim())); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  onChange(w => { if (['entries', 'folders', 'account', 'prefs'].includes(w)) paint(); });
  paint();
}
function openMenu() { $('.drawer').classList.add('open'); $('.scrim').classList.add('open'); setTimeout(() => $('.drawer .search input')?.focus({ preventScroll: true }), 260); }
function closeMenu() { $('.drawer')?.classList.remove('open'); $('.scrim')?.classList.remove('open'); }

function paint() {
  if (!$('.drawer')) return;
  const all = live(), cnt = {}; let nofolder = 0;
  all.forEach(e => { cnt[e.type] = (cnt[e.type] || 0) + 1; if (!e.folder_id) nofolder++; });
  const openTodos = all.filter(e => e.type === 'todo' && !e.meta.done).length;
  const fc = {}; all.forEach(e => { if (e.folder_id) fc[e.folder_id] = (fc[e.folder_id] || 0) + 1; });
  const c = n => n ? `<span class="c">${n}</span>` : '';
  const item = (path, ic, label, n, cls = '') => `<a class="m${cls}" href="#${path}" data-path="${path}">${icon(ic, 18)}${esc(label)}${c(n)}</a>`;
  const types = TYPES.filter(x => x !== 'todo' && x !== 'event');
  $('.drawer .nav').innerHTML =
    item('/home', 'home', t('nav.home')) + item('/all', 'layers', t('nav.all'), all.length) +
    `<div class="h">${esc(t('nav.byType'))}</div>` + item('/todo', 'check-square', t('nav.todo'), openTodos) + item('/calendar', 'calendar-days', t('nav.calendar')) +
    types.map(x => item('/type/' + x, TYPE_ICON[x], t('type.' + x), cnt[x])).join('') +
    `<div class="h">${esc(t('nav.folders'))}<button data-act="new-folder" aria-label="${esc(t('nav.newFolder'))}">${icon('plus', 16)}</button></div>` +
    folderList().map(f => `<a class="m" href="#/folder/${f.id}" data-path="/folder/${f.id}"><svg class="i" width="18" height="18" viewBox="0 0 24 24" style="color:${esc(f.color || '#A9A5AF')}">${'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'}</svg>${esc(f.name)}${c(fc[f.id])}</a>`).join('') +
    item('/nofolder', 'folder-x', t('nav.noFolder'), nofolder, ' dim');
  // 프로필 카드 + 체험 막대
  const d = Account.trialDays(), sub = S.status?.subscriber;
  $('.profile-card').innerHTML = `<span class="who"><span class="avatar l">${esc(Account.initial())}</span><span style="flex:1;min-width:0"><span class="nm">${esc(Account.name())}</span><span class="em">${esc(S.user?.email || '')}</span></span>${icon('chevron-right', 18)}</span>` +
    (sub ? `<span class="trialbar"><span class="tx"><span>${esc(t('sub.active'))}</span></span></span>` : d == null ? '' :
      `<span class="trialbar"><span class="tx"><span>${d > 0 ? t('trial.left', { n: `<em>${d}</em>` }) : esc(t('trial.ended'))}</span><span>${esc(t('trial.plans'))}</span></span><span class="bar"><i style="width:${Math.round(Account.trialRatio() * 100)}%"></i></span></span>`);
  $$('.avatar:not(.l)').forEach(a => { a.textContent = Account.initial(); });
  paintBadges(); mark();
}
function paintBadges() { $$('.bell').forEach(b => { b.querySelector('.badge-dot')?.remove(); if (unread) b.insertAdjacentHTML('beforeend', '<span class="badge-dot"></span>'); }); }
/* 지금 화면 표시 */
function mark() {
  const p = now()?.path || '/home';
  $$('.drawer .m[data-path]').forEach(a => a.classList.toggle('on', a.dataset.path === p));
  $$('.dock .tab').forEach(a => a.classList.toggle('on', a.dataset.tab === p));
  const hideDock = /^\/(e|new|settings|search|notices|plans|backup)/.test(p);
  $('.dock')?.toggleAttribute('hidden', hideDock);
  const ed = /^\/(e|new)(\/|$)/.test(p); $('.topcap')?.toggleAttribute('hidden', ed); $('.pc-top')?.toggleAttribute('hidden', ed);
}

export { TYPE_ICON, closeMenu, frame, mark, openMenu, paint, setUnread };
