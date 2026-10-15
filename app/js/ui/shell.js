/* 앱 틀 그리기: 모바일은 아래 막대 하나(메뉴 | 홈 · 캘린더 · 모든 기록 · 알림 | 쓰기, 메뉴는 막대가 위로 늘어나며 열려요), PC는 왼쪽 사이드바 + 오른쪽 위 알림 */
import { Account } from '../data/account.js';
import { S, TYPES, folderList, live, onChange } from '../data/store.js';
import { brand } from '../core/config.js';
import { getLang, t } from '../core/i18n.js';
import { $, $$, dayKey, esc, icon, todayKey } from '../core/utils.js';
import { go, now } from './router.js';

const TYPE_ICON = { note: 'file-text', todo: 'check-square', event: 'calendar', idea: 'lightbulb', item: 'map-pin', personal: 'feather', scrap: 'bookmark' };
let unread = 0;
const setUnread = n => { unread = n; paintBadges(); };

function frame() {
  $('#app').innerHTML = `
  <div class="layout">
    <div class="scrim" data-act="close-menu"></div>
    <aside class="drawer" aria-label="${esc(t('nav.menu'))}">
      <div class="head"><button class="icon-btn close" data-act="close-menu" aria-label="${esc(t('nav.closeMenu'))}">${icon('x', 22)}</button>
        <span class="mark"><span class="logo"></span><span class="brand">${esc(brand(getLang()))}</span></span></div>
      <button class="profile-card" data-go="/settings/account"></button>
      <label class="search">${icon('search', 18)}<input type="search" enterkeyhint="search" placeholder="${esc(t('nav.search'))}" aria-label="${esc(t('nav.search'))}"></label>
      <nav class="nav"></nav>
      <div class="foot"><button class="m" data-go="/trash">${icon('trash-2', 18)}${esc(t('nav.trash'))}</button><button class="m" data-go="/settings">${icon('settings', 18)}${esc(t('nav.settings'))}</button></div>
    </aside>
    <div class="main">
      <div class="pc-top"><button class="btn primary" data-act="new" style="height:44px;border-radius:22px;padding:0 18px">${icon('pencil', 18)}${esc(t('nav.write'))}</button><button class="icon-btn glass bell" data-go="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 19)}</button></div>
      <main id="view" class="view" tabindex="-1"></main>
    </div>
    <nav class="mbar glass" aria-label="${esc(t('nav.menu'))}">
      <button class="icon-btn menu-btn" data-act="menu" aria-label="${esc(t('nav.menu'))}" aria-expanded="false">${icon('menu-alt', 22)}</button><span class="sep"></span>
      <a class="icon-btn tab" href="#/home" data-tab="/home" aria-label="${esc(t('nav.home'))}">${icon('home', 22)}</a>
      <a class="icon-btn tab" href="#/calendar" data-tab="/calendar" aria-label="${esc(t('nav.calendar'))}">${icon('calendar', 22)}</a>
      <a class="icon-btn tab" href="#/all" data-tab="/all" aria-label="${esc(t('nav.all'))}">${icon('layers', 22)}</a>
      <a class="icon-btn tab bell" href="#/notices" data-tab="/notices" aria-label="${esc(t('nav.notices'))}">${icon('bell', 22)}</a>
      <button class="write" data-act="new">${icon('pencil', 20)}<span>${esc(t('nav.write'))}</span></button>
    </nav>
  </div>`;
  const app = $('#app');
  app.addEventListener('click', e => {
    if (e.target.closest('.drawer a[href]')) { closeMenu(); return; }   // 메뉴에서 고르면 바로 닫혀요
    const b = e.target.closest('[data-go],[data-act]'); if (!b) return;
    if (b.dataset.go) { closeMenu(); go(b.dataset.go); return; }
    const a = b.dataset.act;
    if (a === 'menu') openMenu(); else if (a === 'close-menu') closeMenu(); else if (a === 'new') { closeMenu(); const sp = document.querySelector('#view .split'); if (sp) sp.closest('#view').dispatchEvent(new CustomEvent('split-new', { detail: newPath() })); else go(newPath()); }
    else if (a === 'grp') toggleGrp(b);
    else if (a === 'new-folder') import('../views/folders.js').then(m => m.newFolderDialog());
  });
  $('.search input').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) { closeMenu(); go('/search?q=' + encodeURIComponent(e.target.value.trim())); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  onChange(w => { if (w === 'quiet') paintSoon(); else if (['entries', 'folders', 'account', 'prefs'].includes(w)) paint(); });
  trackKeyboard();
  const nav = $('.drawer .nav'); nav.addEventListener('scroll', () => fades(nav), { passive: true }); addEventListener('resize', () => fades(nav));
  // 메뉴가 열려 있을 때 끌어도 뒤 화면(배경)은 움직이지 않아요. 메뉴 목록이 길 때만 목록 안에서 스크롤돼요
  let ty = 0;
  const lock = e => {
    if (!document.documentElement.classList.contains('menu-open')) return;
    const n = e.target.closest?.('.drawer .nav');
    if (n && n.scrollHeight > n.clientHeight + 1) {
      const dy = e.touches[0].clientY - ty;
      if (!((dy > 0 && n.scrollTop <= 0) || (dy < 0 && n.scrollTop + n.clientHeight >= n.scrollHeight - 1))) return;   // 목록 끝에서 더 끌면 뒤로 넘어가지 않게
    }
    if (e.cancelable) e.preventDefault();
  };
  addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', lock, { passive: false });
  paint();
}
/* 쓰기: 지금 보는 목록에 맞춰 시작해요 (할 일 → 할 일, 일정·캘린더 → 일정, 폴더 → 그 폴더) */
function newPath() {
  const p = now()?.path || '', q = now()?.query || {};
  if (p === '/todo') return '/new?type=todo';
  if (p.startsWith('/type/')) return '/new?type=' + p.slice(6);
  if (p === '/calendar') return '/new?type=event' + (q.d ? '&date=' + q.d : '');
  if (p.startsWith('/folder/')) return '/new?folder=' + p.slice(8);
  return '/new';
}
/* 화면 키보드 높이(--kb): 편집기 막대가 키보드 바로 위에 붙고, 홈의 아래 막대는 쓰는 동안 숨어요 */
function trackKeyboard() {
  const vv = window.visualViewport; if (!vv) return;
  const root = document.documentElement;
  // --vvh · --vvt: 지금 눈에 보이는 화면(키보드 위)의 높이와 위치. 편집기는 이 상자 안에서만 스크롤해서, 서식 막대가 글 위를 덮거나 흔들리지 않아요
  let raf = 0;
  const upd = () => { raf = 0; const h = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); root.style.setProperty('--kb', h + 'px'); root.classList.toggle('kb-open', h > 80);
    root.style.setProperty('--vvh', Math.round(vv.height) + 'px'); root.style.setProperty('--vvt', Math.round(vv.offsetTop) + 'px');
    // 아이폰은 키보드가 내려간 뒤 화면을 위로 밀어 둔 채로 둘 때가 있어요 (아래 검은 띠 · 위 버튼이 상태 표시줄 밑으로). 쓰기 화면은 늘 제자리로 돌려 놓아요
    if (h <= 80 && root.classList.contains('ed-mode') && (scrollY || vv.offsetTop)) scrollTo(0, 0); };
  const soon = () => { if (!raf) raf = requestAnimationFrame(upd); };
  vv.addEventListener('resize', soon); vv.addEventListener('scroll', soon); upd();
  // 아이폰은 키보드가 내려간 뒤 마지막 크기 알림을 빠뜨릴 때가 있어서, 입력이 끝나면 조금 뒤 한 번 더 재요
  addEventListener('focusout', () => [250, 600, 1200].forEach(ms => setTimeout(upd, ms)));
}
let pt = 0; const paintSoon = () => { clearTimeout(pt); pt = setTimeout(paint, 600); };
const isPC = () => matchMedia('(min-width: 900px) and (min-height: 501px), (min-width: 900px) and (pointer: fine)').matches;
function openMenu() {
  paint(); document.documentElement.classList.add('menu-open');
  $('.drawer').classList.add('open'); $('.scrim').classList.add('open'); $('.mbar')?.classList.add('away'); $('.menu-btn')?.setAttribute('aria-expanded', 'true');
  if (isPC()) setTimeout(() => $('.drawer .search input')?.focus({ preventScroll: true }), 260);   // 모바일은 키보드가 메뉴를 가리지 않게 자동으로 열지 않아요
}
function closeMenu() { document.documentElement.classList.remove('menu-open'); $('.drawer')?.classList.remove('open'); $('.scrim')?.classList.remove('open'); $('.mbar')?.classList.remove('away'); $('.menu-btn')?.setAttribute('aria-expanded', 'false'); }

function paint() {
  if (!$('.drawer')) return;
  const all = live(), cnt = {}; let nofolder = 0;
  all.forEach(e => { cnt[e.type] = (cnt[e.type] || 0) + 1; if (!e.folder_id) nofolder++; });
  const openTodos = all.filter(e => e.type === 'todo' && !e.meta.done).length;
  const today = todayKey(), upEvents = all.filter(e => e.type === 'event' && (e.meta.date || '') >= today).length;   // 오늘부터 남은 일정
  const fc = {}; all.forEach(e => { if (e.folder_id) fc[e.folder_id] = (fc[e.folder_id] || 0) + 1; });
  const c = n => n ? `<span class="c">${n}</span>` : '';
  const item = (path, ic, label, n, cls = '') => `<a class="m${cls}" href="#${path}" data-path="${path}">${icon(ic, 18)}${esc(label)}${c(n)}</a>`;
  const types = TYPES.filter(x => x !== 'todo' && x !== 'event');
  const md = today.slice(5), y = +today.slice(0, 4);
  const pastN = all.filter(e => { const d = new Date(e.created_at); return d.getFullYear() < y && dayKey(d).slice(5) === md; }).length;   // 지난해들의 오늘
  // 접히는 묶음: 머리글을 누르면 접고 펴요 (기기마다 기억). 지금 화면이 들어 있는 묶음은 접혀 있어도 펴서 보여요
  const p = now()?.path || '/home';
  const grp = (k, label, body, extra = '') => { const shut = navShut().includes(k) && !body.includes(`data-path="${p}"`);
    return `<div class="h g${shut ? ' shut' : ''}"><button data-act="grp" data-g="${k}" aria-expanded="${!shut}">${esc(label)}${icon('chevron-down', 15)}</button>${extra}</div><div class="gb${shut ? ' shut' : ''}">${body}</div>`; };
  $('.drawer .nav').innerHTML =
    item('/home', 'home', t('nav.home')) + item('/all', 'layers', t('nav.all'), all.length) + item('/calendar', 'calendar-days', t('nav.calendar')) +
    grp('look', t('nav.lookBack'), item('/past', 'history', t('nav.past'), pastN) + item('/favorites', 'star', t('nav.fav'), all.filter(e => e.favorite).length)) +
    grp('type', t('nav.byType'), item('/todo', 'check-square', t('nav.todo'), openTodos) + item('/type/event', 'calendar', t('type.event'), upEvents) +
      types.map(x => item('/type/' + x, TYPE_ICON[x], t('type.' + x), cnt[x])).join('')) +
    grp('folder', t('nav.folders'),
      folderList().map(f => `<a class="m" href="#/folder/${f.id}" data-path="/folder/${f.id}"><svg class="i" width="18" height="18" viewBox="0 0 24 24" style="color:${esc(f.color || '#A9A5AF')}">${'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'}</svg>${esc(f.name)}${c(fc[f.id])}</a>`).join('') +
      item('/nofolder', 'folder-x', t('nav.noFolder'), nofolder, ' dim'),
      `<button class="add" data-act="new-folder" aria-label="${esc(t('nav.newFolder'))}">${icon('plus', 16)}</button>`);
  // 프로필 카드 + 체험 막대
  const d = Account.trialDays(), sub = S.status?.subscriber;
  // 프로필은 한 줄: 작은 사진 + 이름. 체험·이용권은 7일 이하로 남았을 때만 작은 칩, 구독 중이면 아무것도 없어요. 오른쪽 끝은 대표 배지 자리
  const chip = sub || d == null || d > 7 ? '' : `<span class="pchip" data-go="/plans">${esc(d > 0 ? t(Account.onPass() ? 'pass.chip' : 'trial.chip', { n: d }) : t('trial.chipEnd'))}</span>`;
  $('.profile-card').innerHTML = `<span class="who">${Account.avatarHTML('s')}<span class="nm">${esc(Account.name())}</span>${chip}<span class="pbadge"></span></span>`;
  paintBadges(); mark(); requestAnimationFrame(() => fades($('.drawer .nav')));
}
/* 메뉴 묶음 접기: 접힌 묶음 이름만 기억해요 */
const navShut = () => { try { return JSON.parse(localStorage.getItem('dt.navShut') || '[]'); } catch { return []; } };
function toggleGrp(b) {
  const h = b.parentElement, shut = !h.classList.contains('shut'), k = b.dataset.g;
  h.classList.toggle('shut', shut); h.nextElementSibling.classList.toggle('shut', shut); b.setAttribute('aria-expanded', String(!shut));
  try { const s = navShut().filter(x => x !== k); if (shut) s.push(k); localStorage.setItem('dt.navShut', JSON.stringify(s)); } catch {}
  fades($('.drawer .nav'));
}
function fades(n) { if (!n) return; n.classList.toggle('more-t', n.scrollTop > 4); n.classList.toggle('more-b', n.scrollTop + n.clientHeight < n.scrollHeight - 4); }
function paintBadges() { $$('.bell').forEach(b => { b.querySelector('.badge-dot')?.remove(); if (unread) b.insertAdjacentHTML('beforeend', '<span class="badge-dot"></span>'); }); }
/* 지금 화면 표시 */
function mark() {
  const p = now()?.path || '/home';
  $$('.drawer .m[data-path]').forEach(a => a.classList.toggle('on', a.dataset.path === p));
  $$('.mbar .tab').forEach(a => a.classList.toggle('on', a.dataset.tab === p));
  // 글을 쓸 때는 같은 자리에 편집기의 서식 막대가 와요
  const ed = /^\/(e|new)(\/|$)/.test(p); $('.mbar')?.toggleAttribute('hidden', ed); if (!ed) document.documentElement.classList.remove('ed-mode'); $('.pc-top')?.toggleAttribute('hidden', ed);
}

export { TYPE_ICON, closeMenu, frame, mark, openMenu, paint, setUnread };
