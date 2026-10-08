/* 앱 틀 그리기: 모바일은 아래 막대 하나(메뉴는 막대가 위로 늘어나며 열려요), PC는 왼쪽 사이드바 + 오른쪽 위 알림 */
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
        <button class="icon-btn close" data-act="close-menu" aria-label="${esc(t('nav.closeMenu'))}">${icon('x', 22)}</button>
        <button class="icon-btn bell mo" data-go="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 21)}</button>
        <button class="icon-btn mo" data-go="/settings" aria-label="${esc(t('nav.settings'))}">${icon('settings', 21)}</button></div>
      <button class="profile-card" data-go="/settings/account"></button>
      <label class="search">${icon('search', 18)}<input type="search" enterkeyhint="search" placeholder="${esc(t('nav.search'))}" aria-label="${esc(t('nav.search'))}"></label>
      <nav class="nav"></nav>
      <div class="foot"><button class="m" data-go="/trash">${icon('trash-2', 18)}${esc(t('nav.trash'))}</button><button class="m" data-go="/settings">${icon('settings', 18)}${esc(t('nav.settings'))}</button></div>
    </aside>
    <div class="main">
      <div class="pc-top"><button class="btn primary" data-act="new" style="height:44px;border-radius:22px;padding:0 18px">${icon('pencil', 18)}${esc(t('nav.new'))}</button><button class="icon-btn glass bell" data-go="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 19)}</button></div>
      <main id="view" class="view" tabindex="-1"></main>
    </div>
    <nav class="mbar glass" aria-label="${esc(t('nav.menu'))}">
      <button class="icon-btn menu-btn" data-act="menu" aria-label="${esc(t('nav.menu'))}" aria-expanded="false">${icon('menu-alt', 22)}</button><span class="sep"></span>
      <a class="icon-btn tab" href="#/home" data-tab="/home" aria-label="${esc(t('nav.home'))}">${icon('home', 22)}</a>
      <a class="icon-btn tab" href="#/calendar" data-tab="/calendar" aria-label="${esc(t('nav.calendar'))}">${icon('calendar', 22)}</a>
      <a class="icon-btn tab" href="#/all" data-tab="/all" aria-label="${esc(t('nav.all'))}">${icon('layers', 22)}</a>
      <button class="write" data-act="new">${icon('pencil', 20)}<span>${esc(t('nav.write'))}</span></button>
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
  trackKeyboard();
  paint();
}
/* 화면 키보드 높이(--kb): 편집기 막대가 키보드 바로 위에 붙고, 홈의 아래 막대는 쓰는 동안 숨어요 */
function trackKeyboard() {
  const vv = window.visualViewport; if (!vv) return;
  const root = document.documentElement;
  const upd = () => { const h = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); root.style.setProperty('--kb', h + 'px'); root.classList.toggle('kb-open', h > 80); };
  vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd); upd();
}
const isPC = () => matchMedia('(min-width: 900px)').matches;
function openMenu() {
  $('.drawer').classList.add('open'); $('.scrim').classList.add('open'); $('.mbar')?.classList.add('away'); $('.menu-btn')?.setAttribute('aria-expanded', 'true');
  if (isPC()) setTimeout(() => $('.drawer .search input')?.focus({ preventScroll: true }), 260);   // 모바일은 키보드가 메뉴를 가리지 않게 자동으로 열지 않아요
}
function closeMenu() { $('.drawer')?.classList.remove('open'); $('.scrim')?.classList.remove('open'); $('.mbar')?.classList.remove('away'); $('.menu-btn')?.setAttribute('aria-expanded', 'false'); }

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
  $('.profile-card').innerHTML = `<span class="who">${Account.avatarHTML('l')}<span style="flex:1;min-width:0"><span class="nm">${esc(Account.name())}</span><span class="em">${esc(S.user?.email || '')}</span></span>${icon('chevron-right', 18)}</span>` +
    (sub ? `<span class="trialbar"><span class="tx"><span>${esc(t('sub.active'))}</span></span></span>` : d == null ? '' :
      `<span class="trialbar"><span class="tx"><span>${d > 0 ? t('trial.left', { n: `<em>${d}</em>` }) : esc(t('trial.ended'))}</span><span>${esc(t('trial.plans'))}</span></span><span class="bar"><i style="width:${Math.round(Account.trialRatio() * 100)}%"></i></span></span>`);
  paintBadges(); mark();
}
function paintBadges() { $$('.bell, .menu-btn').forEach(b => { b.querySelector('.badge-dot')?.remove(); if (unread) b.insertAdjacentHTML('beforeend', '<span class="badge-dot"></span>'); }); }
/* 지금 화면 표시 */
function mark() {
  const p = now()?.path || '/home';
  $$('.drawer .m[data-path]').forEach(a => a.classList.toggle('on', a.dataset.path === p));
  $$('.mbar .tab').forEach(a => a.classList.toggle('on', a.dataset.tab === p));
  // 글을 쓸 때는 같은 자리에 편집기의 서식 막대가 와요
  const ed = /^\/(e|new)(\/|$)/.test(p); $('.mbar')?.toggleAttribute('hidden', ed); $('.pc-top')?.toggleAttribute('hidden', ed);
}

export { TYPE_ICON, closeMenu, frame, mark, openMenu, paint, setUnread };
