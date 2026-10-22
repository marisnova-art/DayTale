// 갖고 싶은 하루 · 모바일 1차: 피드 → 포맷 고르기 → 쓰기 → 완료·저장
import { ic } from './icons.js';
import * as S from './store.js';
import { FORMATS, ORDER, blank, sampleCard, renderCard, fitCard, cardText, newSeed, placeObjects, dateChip, weekday, toneOf } from './formats.js';
import { FREE, KIND, find as findBg, drawCode } from './bg.js';
import { cardImages, saveImages, buildPages } from './export.js';
import { clean, offsetsOf, rangeAt } from './rich.js';
import { FONTS, fontCssOf } from './fonts.js';
import { NAMES as STK, hydrate, preloadAll } from './stickers.js';

const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
}
const soon = () => toast('다음 단계에서 열려요');

function sheet(items) {
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet"><div class="grab"></div>${items.map((it, i) => `<button class="it ${it.red ? 'red' : ''}" data-i="${i}">${ic(it.icon)}${it.label}</button>`).join('')}</div>`;
  bg.addEventListener('click', e => { const b = e.target.closest('.it'); bg.remove(); if (b) items[+b.dataset.i].run(); });
  document.body.appendChild(bg);
}

// 카드를 넣고 나서 크기에 맞춰 다시 재요 (글꼴이 늦게 와도 한 번 더)
function mount(host, c, opt) {
  const el = renderCard(c, opt); host.appendChild(el);
  requestAnimationFrame(() => fitCard(el, c));
  document.fonts?.ready.then(() => fitCard(el, c));
  return el;
}

/* ── 라우터 ─────────────────────────────────────────── */
let cleanup = null;
function route() {
  cleanup?.(); cleanup = null;
  const [r, a] = location.hash.replace(/^#\/?/, '').split('/');
  window.scrollTo(0, 0);
  if (r === 'pick') return viewPick();
  if (r === 'write') return viewWrite({ fmt: a });
  if (r === 'edit') return viewWrite({ id: a });
  if (r === 'feed' || r === 'done') return viewFeed(a);
  if (r === 'at') return viewFeed(a, true);
  return viewFeed();
}
window.addEventListener('hashchange', route);
const go = h => { location.hash = h; };

/* ── 피드 ───────────────────────────────────────────── */
function nav(on) {
  return `<nav class="nav">
    <button class="nb ${on === 'home' ? 'on' : ''}" data-n="home" aria-label="홈">${ic('home')}</button>
    <button class="nb" data-n="search" aria-label="검색">${ic('search')}</button>
    <button class="nb nw" data-n="write" aria-label="쓰기">${ic('pen')}</button>
    <button class="nb" data-n="shelf" aria-label="책장">${ic('shelf')}</button>
    <button class="nb" data-n="me" aria-label="프로필"><span class="av"></span></button></nav>`;
}
function bindNav() {
  $$('.nb').forEach(b => b.onclick = () => ({ home: () => window.scrollTo({ top: 0, behavior: 'smooth' }), write: () => go('#/pick') }[b.dataset.n] || soon)());
}

// 피드: 위 줄은 흐림 없이 같이 스크롤돼요. 화면 가운데 카드만 움직이고, 그 카드 색이 바탕에 은은하게 번져요
function viewFeed(fresh, quiet) {
  const mine = S.cards();
  app.innerHTML = `<div class="amb"></div><header class="ftop"><div class="logo">dayzine</div><button class="cb" data-a="bell" aria-label="알림">${ic('bell')}</button></header>
    <main class="feed"></main>${nav('home')}`;
  bindNav(); $('[data-a=bell]').onclick = soon;
  const feed = $('.feed');
  // 카드마다 위에 작은 날짜 줄. 내 카드가 적으면 우리 카드(포맷 예시)를 아래에 2~3장
  mine.forEach(c => feed.appendChild(feedItem(c)));
  if (mine.length < 6) ORDER.forEach(f => feed.appendChild(feedItem(sampleCard(f, S.today()))));

  // 가운데 카드 찾기: 그 카드만 재생 + 바탕 색
  const amb = $('.amb');
  let raf = 0, cur = null;
  const pickMid = () => {
    raf = 0;
    const mid = innerHeight * .45; let best = null, bd = 1e9;
    $$('.feed .fi').forEach(it => { const r = it.querySelector('.fx').getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid); if (d < bd) { bd = d; best = it; } });
    if (best === cur) return;
    cur?.classList.remove('play'); cur = best;
    if (!cur) return;
    cur.classList.add('play'); amb.style.backgroundColor = cur.dataset.tone;
    if (!cur.dataset.seen) { cur.dataset.seen = 1; cur.classList.add('intro'); setTimeout(() => cur?.classList.remove('intro'), 1800); }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(pickMid); };
  addEventListener('scroll', onScroll, { passive: true });
  const onVis = () => document.body.classList.toggle('paused', document.hidden);
  document.addEventListener('visibilitychange', onVis);
  cleanup = () => { removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); closeFocus(true); };
  setTimeout(pickMid, 80);

  // 방금 쓰거나 고친 카드: 그 자리로 가서 살짝 커지며 나와요. 고치다 뒤로 오면 그 자리로만 (주소는 홈으로 되돌려 둬요)
  if (fresh) {
    history.replaceState(null, '', '#/');
    const it = $(`.feed .fi[data-id="${fresh}"]`);
    if (it) {
      const put = () => { if (it !== $('.feed .fi')) it.scrollIntoView({ block: 'center' }); };
      put(); setTimeout(put, 400);   // 긴 카드가 장으로 나뉜 뒤 한 번 더
      if (!quiet) { it.classList.add('fresh'); setTimeout(() => it.classList.remove('fresh'), 1200); }
    }
  }
}
// 쓴 때 (인스타처럼): 방금 · N분 전 · N시간 전 · 어제 · N일 전 · M월 D일 · YYYY년 M월 D일. 고쳐도 처음 쓴 때 그대로
function ago(c) {
  const t = new Date(c.created || c.date + 'T12:00:00'), now = new Date(), min = (now - t) / 6e4;
  if (min < 1) return '방금';
  if (min < 60) return `${Math.floor(min)}분 전`;
  if (min < 1440) return `${Math.floor(min / 60)}시간 전`;
  const day = x => Math.floor((x.getTime() - x.getTimezoneOffset() * 6e4) / 864e5), n = day(now) - day(t);
  if (n <= 1) return '어제';
  if (n < 7) return `${n}일 전`;
  return (t.getFullYear() !== now.getFullYear() ? `${t.getFullYear()}년 ` : '') + `${t.getMonth() + 1}월 ${t.getDate()}일`;
}

// 카드를 저장할 때와 같은 4:5 장들로 나눠서, 여러 장이면 옆으로 넘겨 보는 모양으로 (늘 첫 장부터). onCount(지금 장, 모두)
function pageInto(view, c, onCount) {
  requestAnimationFrame(() => setTimeout(async () => {
    const W = view.clientWidth; if (!W) return;
    const { h, nodes } = await buildPages(c, W, Math.min(2, devicePixelRatio || 1));
    if (nodes.length > 1) {
      // 손으로 넘기기 전에는 옆 넘김을 붙이지 않아요 (아이폰이 마지막 장으로 붙여 버리지 않게)
      const pages = document.createElement('div'); pages.className = 'pgs nosnap'; pages.append(...nodes);
      const snapOn = () => pages.classList.remove('nosnap');
      pages.addEventListener('touchstart', snapOn, { once: true, passive: true }); pages.addEventListener('pointerdown', snapOn, { once: true });
      const paint = () => onCount(Math.round(pages.scrollLeft / pages.clientWidth) + 1, nodes.length);
      pages.addEventListener('scroll', paint, { passive: true });
      view.innerHTML = ''; view.appendChild(pages);
      const first = () => { if (pages.classList.contains('nosnap')) { pages.scrollLeft = 0; paint(); } };
      first(); requestAnimationFrame(first); [150, 500, 1200].forEach(ms => setTimeout(first, ms));
    }
    h.remove();
  }, 40));
}

// 카드 한 장. 긴 카드는 4:5 장들을 옆으로 밀어 봐요. 누르면 그 카드 전체를 화면 가득(다시 누르면 피드로).
// 아래: 책갈피 · 저장 · 쓰기 · 삭제 · 장 수(여러 장일 때) / 글 첫머리 한 줄 / 언제 썼는지
function feedItem(c) {
  const it = document.createElement('article'); it.className = 'fi'; it.dataset.tone = toneOf(c); if (c.id) it.dataset.id = c.id;
  const f = FORMATS[c.fmt];
  it.innerHTML = `${c.sample ? '' : `<p class="when">${ago(c)}</p>`}<div class="fx"><div class="view"></div></div>
    <div class="row">${c.sample
      ? `<div class="ours">${f.name}<i>NEW</i></div><button class="cb" data-a="use" aria-label="이 포맷으로 쓰기">${ic('pen')}</button>`
      : `<div class="l"><button class="cb ${c.mark ? 'on' : ''}" data-a="mark" aria-label="책갈피">${ic('bookmark')}</button><button class="cb" data-a="save" aria-label="사진에 저장">${ic('save')}</button><button class="cb" data-a="edit" aria-label="고치기">${ic('pen')}</button><button class="cb" data-a="del" aria-label="삭제">${ic('trash')}</button><span class="pc" hidden></span></div>`}</div>
    <p class="ex"></p>`;
  const fx = $('.fx', it), view = $('.view', it), pc = $('.pc', it);
  $('.ex', it).textContent = cardText(c).replace(/\s+/g, ' ').trim();   // 글 첫머리 한 줄 (길면 …)
  mount(view, c);
  pageInto(view, c, (i, n) => { if (pc) { pc.hidden = false; pc.textContent = `${i}/${n}`; } });
  fx.addEventListener('click', () => openFocus(it, c));
  const on = (k, fn) => { const b = $(`[data-a=${k}]`, it); if (b) b.onclick = fn; };
  on('use', () => go(`#/write/${c.fmt}`));
  on('edit', () => go(`#/edit/${c.id}`));
  on('save', () => exportCard(c));
  on('mark', e => { c.mark = !c.mark; S.saveCard(c); e.currentTarget.classList.toggle('on', c.mark); toast(c.mark ? '책갈피에 넣었어요' : '책갈피에서 뺐어요'); });
  on('del', async () => {   // 한 번 물어보고 지워요. 지운 카드는 휴지통에 30일
    if (!(await ask('이 카드를 지울까요?', '삭제'))) return;
    S.removeCard(c.id); it.remove();
  });
  return it;
}
// 확인 창: 취소 · 빨간 버튼. 바깥을 누르면 취소
function ask(msg, yes) {
  return new Promise(done => {
    const bg = document.createElement('div'); bg.className = 'ask-bg';
    bg.innerHTML = `<div class="ask" role="alertdialog"><p>${msg}</p><div><button data-r="0">취소</button><button class="red" data-r="1">${yes}</button></div></div>`;
    bg.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === bg) { bg.classList.add('out'); setTimeout(() => bg.remove(), 160); done(b?.dataset.r === '1'); } });
    document.body.appendChild(bg);
  });
}

// 크게 보기: 카드 전체를 나누지 않은 긴 한 장으로. 피드 카드 자리에서 커지며 나오고, 길면 위아래로 밀어 읽어요.
// 짧으면 화면 가운데. 누르면 제자리로 줄어들며 피드로
let focus = null;
function openFocus(it, c) {
  if (focus) return;
  const view = $('.view', it), r = view.getBoundingClientRect();
  const ov = document.createElement('div'); ov.className = 'fv';
  ov.innerHTML = '<div class="fvs"><div class="fi play fvb"></div></div>';
  const sc = $('.fvs', ov), box = $('.fvb', ov);
  document.body.appendChild(ov);
  const el = renderCard(c); box.appendChild(el); fitCard(el, c);
  const T = box.clientWidth, H = box.offsetHeight;
  // 짧으면 가운데, 길면 시계 줄 아래부터
  const top = Math.max((innerHeight - H) / 2, (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-t')) || 0) + 16);
  box.style.marginTop = top + 'px';
  const from = () => { const b = box.getBoundingClientRect(), k = r.width / T; return `translate(${r.left - b.left}px,${r.top - b.top}px) scale(${k})`; };
  box.style.transition = 'none'; box.style.transform = from(); view.style.visibility = 'hidden';
  // 뒤 피드는 그대로(보던 자리 유지)
  ov.addEventListener('wheel', e => { if (sc.scrollHeight <= sc.clientHeight) e.preventDefault(); }, { passive: false });
  requestAnimationFrame(() => requestAnimationFrame(() => { box.style.transition = ''; ov.classList.add('in'); box.style.transform = ''; }));
  ov.addEventListener('click', () => closeFocus());
  focus = { ov, box, view, from, y: scrollY };
}
function closeFocus(now) {
  if (!focus || focus.closing) return;
  const f = focus; f.closing = true;
  const done = () => { f.view.style.visibility = ''; f.ov.remove(); if (scrollY !== f.y) scrollTo(0, f.y); focus = null; };
  if (now) return done();
  f.ov.classList.remove('in'); f.box.style.transform = f.from();
  setTimeout(done, 380);
}

/* ── 포맷 고르기 ─────────────────────────────────────── */
function viewPick() {
  const d = S.draft();
  const items = [...(d ? [{ key: 'draft', card: d.card, label: '이어 쓰기' }] : []), ...ORDER.map(f => ({ key: f, card: sampleCard(f, S.today()), label: FORMATS[f].name }))];
  let sel = items[0].key;
  app.innerHTML = `<header class="top"><button class="cb" data-a="x" aria-label="닫기">${ic('close')}</button><button class="cb" data-a="find" aria-label="포맷 검색">${ic('search')}</button></header>
    <main class="pick"><div class="big"></div><div><div class="nm"></div><div class="inf"></div></div>
    <div class="strip">${items.map(i => `<button class="th" data-k="${i.key}"><div class="tc"></div><div class="lab">${i.label}</div></button>`).join('')}</div>
    <button class="go">${ic('pen')}<span></span></button></main>`;
  $('[data-a=x]').onclick = () => go('#/');
  $('[data-a=find]').onclick = soon;
  items.forEach(i => mount($(`.th[data-k="${i.key}"] .tc`), i.card));
  const show = () => {
    const i = items.find(x => x.key === sel), f = FORMATS[i.card.fmt];
    $('.big').innerHTML = ''; mount($('.big'), i.card);
    $('.pick .nm').innerHTML = `${i.key === 'draft' ? '이어 쓰기 · ' : ''}${f.name}${i.key !== 'draft' ? '<i>NEW</i>' : ''}`;
    $('.pick .inf').textContent = f.info;
    $('.go span').textContent = i.key === 'draft' ? '이어 쓰기' : '이 포맷으로 쓰기';
    $$('.strip .th').forEach(t => t.classList.toggle('on', t.dataset.k === sel));
  };
  $$('.strip .th').forEach(t => t.onclick = () => { sel = t.dataset.k; show(); });
  $('.go').onclick = () => go(sel === 'draft' ? '#/write/draft' : `#/write/${sel}`);
  show();
}

/* ── 쓰기 ───────────────────────────────────────────── */
// 시안(write2) 그대로: 위 줄 · 날짜·제목·장소 · 카드(모든 포맷 카드 위에 바로 써요) · 도구 줄 · 키보드 자리(키보드 또는 패널)
// 키보드 처리는 지금 앱(shell.js trackKeyboard · editor.css)에서 아이폰으로 검증한 방식을 그대로 써요:
// 키보드가 있을 때만 보이는 화면(--vvt · --vvh)에 맞춰 고정. 카드는 키보드 위 공간에 통째로 들어가는 크기로 한 번 정하고 바꾸지 않아요
function viewWrite({ fmt, id }) {
  const isNew = !id;
  let card;
  if (id) card = S.card(id);
  else if (fmt === 'draft') card = S.draft()?.card;
  else card = blank(fmt, S.today());
  if (!card || !FORMATS[card.fmt]) return go('#/');
  const f = FORMATS[card.fmt], rich = card.fmt === 'text';
  if (!rich && card.html == null) { card.html = renderCard(card).querySelector('.rb').innerHTML; card.html = clean(card.html); delete card.text; }
  const st = { panel: null, tab: 'fmt', hist: [clone(card)], hi: 0, timer: 0, pg: 0, sel: null, composing: false };
  const root = document.documentElement;

  root.classList.add('wmode');
  // 키보드를 내린 스타일 보기(큰 카드 + 3줄)와 키보드를 올린 쓰기 보기(1줄). 모든 줄은 같은 6칸(44px)이라 세로로 맞아요
  // 1줄 스타일: 키보드 · 서식 · 배경 · 셔플 · 되돌리기 · 다시하기 / 쓰기: 키보드 · 이모티콘 · 새 장 · 사진 · 되돌리기 · 다시하기
  const T1 = [['kb', ''], ['fmt', 's'], ['bg', 's'], ['shuf', 's'], ['emo', 'w'], ['page', 'w'], ['photo', 'w'], ['undo', ''], ['redo', '']];
  app.innerHTML = `<div class="wr ${rich ? 'rich' : 'plain'}">
    <header class="top"><button class="cb" data-a="back" aria-label="뒤로">${ic('back')}</button><div class="nm stt"></div><button class="cb w" data-a="ok" aria-label="완료">${ic('check')}</button></header>
    <div class="area"><section class="stage"></section></div>
    <div class="tb g6">${T1.map(([k, m]) => `<button class="k t ${m}" data-t="${k}" aria-label="${k}">${ic(k)}</button>`).join('')}</div>
    <div class="st2 g6"></div>
    <div class="st3 g6">
      <button class="wide w2 dt" aria-label="날짜">${ic('date')}<span></span></button>
      <label class="wide w3 pl">${ic('pin')}<input class="pi" maxlength="20" placeholder="장소" aria-label="장소" enterkeyhint="done"></label>
      <button class="k tl dp" aria-label="날짜 위치"></button><button class="k on pok" aria-label="장소 확인">${ic('check')}</button>
    </div>
    <div class="recent"></div>
    <div class="panel"></div></div>`;
  const wr = $('.wr'), stage = $('.stage'), panel = $('.panel');

  /* 키보드: shell.js trackKeyboard와 같은 계산. 키보드 높이는 기억해 두고 패널도 같은 높이로 열어요 */
  const vv = window.visualViewport;
  let raf = 0, kbh = S.pref('kbh', 0), measured = !!kbh, wasOpen = false;
  if (!kbh) kbh = Math.round(innerHeight * .42);
  root.style.setProperty('--kbh', kbh + 'px');
  const kb = () => {
    raf = 0; if (!vv) return;
    const h = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)), open = h > 80;
    root.style.setProperty('--vvh', Math.round(vv.height) + 'px'); root.style.setProperty('--vvt', Math.round(vv.offsetTop) + 'px');
    root.classList.toggle('kb-open', open);
    if (open && h > 160 && Math.abs(h - kbh) > 4) {
      kbh = h; S.setPref('kbh', h); root.style.setProperty('--kbh', h + 'px');
      if (!measured) sizeCard();   // 이 휴대폰에서 처음 잰 키보드: 카드 크기를 한 번만 다시 맞춰요
      measured = true;
    }
    if (open && st.waitKb) endWait();
    // 아이폰 키보드의 내림 단추로 내려도 스타일 보기로 (글 칸에 커서만 남아 있지 않게)
    if (wasOpen && !open && !st.panel && !st.waitKb && document.activeElement?.matches?.('.wr .body')) document.activeElement.blur();
    wasOpen = open;
    if (!open && (scrollY || vv.offsetTop)) scrollTo(0, 0);   // 아이폰이 키보드를 내린 뒤 화면을 밀어 둔 채로 두지 않게
    applySize(); keepCaret();
  };
  const soonKb = () => { if (!raf) raf = requestAnimationFrame(kb); };
  let gone = false;   // 쓰기 화면을 떠난 뒤에는 늦게 온 키보드 재기가 피드 스크롤을 맨 위로 돌리지 않게
  const remeasure = () => [250, 600, 1200].forEach(ms => setTimeout(() => gone || kb(), ms));
  vv?.addEventListener('resize', soonKb); vv?.addEventListener('scroll', soonKb);
  addEventListener('focusout', remeasure);
  let lastW = innerWidth;
  const onResize = () => { if (innerWidth !== lastW) { lastW = innerWidth; sizeCard(); } soonKb(); };   // 돌렸을 때만 다시 재요
  addEventListener('resize', onResize);
  cleanup = () => {
    gone = true; cancelAnimationFrame(raf);
    vv?.removeEventListener('resize', soonKb); vv?.removeEventListener('scroll', soonKb);
    removeEventListener('focusout', remeasure); removeEventListener('resize', onResize);
    clearTimeout(st.timer); clearTimeout(st.waitT); clearTimeout(st.popT);
    root.classList.remove('wmode', 'kb-open', 'pan');
  };

  /* 카드 크기는 하나: 쓰는 동안에도 화면 폭(양옆 16)을 그대로 써요. 키보드에 가려지는 아래쪽은 커서를 따라 화면이 움직여요 */
  const sizes = { w: 0, v: 0 };
  function sizeCard() {
    // 쓰기 보기 = 화면 폭(양옆 16). 스타일 보기 = 카드 한 장(4:5)이 다 보이는 크기 (작은 폰에서는 조금 좁아져요)
    const area = $('.area'), styleView = !wr.classList.contains('typ') && !wr.classList.contains('plc') && !root.classList.contains('kb-open');
    sizes.w = Math.floor(Math.max(160, wr.clientWidth - 32));
    if (styleView && area.clientHeight) sizes.v = Math.min(sizes.w, Math.floor((area.clientHeight - 20) / 1.25));
    else if (!sizes.v) sizes.v = sizes.w;
    applySize(true);
  }
  function applySize(force) {
    const writing = wr.classList.contains('typ') || wr.classList.contains('plc') || root.classList.contains('kb-open') || root.classList.contains('pan');
    const cw = writing ? sizes.w : sizes.v;
    if (!force && wr.style.getPropertyValue('--cw') === cw + 'px') return;
    wr.style.setProperty('--cw', cw + 'px');
    if (el) { fitCard(el, card); scrollToPage(st.pg, false); requestAnimationFrame(keepCaret); }
  }

  // 기록: 셔플·배경·정렬은 바로, 글은 잠깐 멈췄을 때 한 칸씩
  const persist = () => { if (isNew) S.saveDraft({ card }); };
  const push = () => { clearTimeout(st.timer); st.timer = 0; st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(clone(card)); if (st.hist.length > 80) st.hist.shift(); st.hi = st.hist.length - 1; tools(); persist(); };
  const flush = () => { if (st.timer) push(); };   // 쓰던 글을 먼저 기록해 두고 바꿔요 (되돌리면 바로 앞 모습으로)
  const pushLater = () => { clearTimeout(st.timer); st.timer = setTimeout(push, 700); persist(); tools(); };
  const hasText = () => cardText(card).trim().length > 0 || (rich && card.pages.some(h => h.includes('class="stk"')));   // 이모티콘만 있어도 쓴 거예요
  // 위 가운데: 지금 장 / 저장될 장 수 · 글자 수. 긴 장은 점선마다 한 장으로 세요(저장할 때 그렇게 나뉘어요)
  function count() {
    const n = `${cardText(card).replace(/\s/g, '').length}자`, nm = $('.wr .stt');
    if (st.popT || !nm) return;   // 알림이 떠 있는 동안은 그대로
    if (!hasText()) return (nm.textContent = '');
    if (!rich || !el) return (nm.textContent = n);
    const box = stage.getBoundingClientRect(), mid = box.top + Math.min(box.height, el.getBoundingClientRect().height) / 2;
    let total = 0, at = 0;
    $$('.pg', el).forEach((pg, i) => {
      const parts = pg.querySelectorAll('.brk').length + 1;
      if (i === st.pg) { const r = pg.getBoundingClientRect(); at = total + Math.max(0, Math.min(parts - 1, Math.floor((mid - r.top) / (r.height / parts)))); }
      total += parts;
    });
    nm.textContent = total > 1 ? `${at + 1} / ${total}장 · ${n}` : n;
  }
  stage.addEventListener('scroll', () => count(), { passive: true });

  /* 3줄: 날짜(누르면 달력) · 장소 · 날짜 위치(누를 때마다 위 → 아래 → 없음) */
  const dtb = $('.st3 .dt'), pi = $('.st3 .pi'), dpb = $('.st3 .dp');
  const DP = { top: ['dtop', '날짜 위'], bottom: ['dbot', '날짜 아래'], none: ['doff', '날짜 없음'] }, dpDef = rich ? 'top' : 'bottom';
  function paintMeta() {
    $('.st3 .dt span').textContent = dateChip(card.date);
    dpb.innerHTML = ic(DP[card.datePos || dpDef][0]); dpb.classList.toggle('off', !f.tools.dp);
    pi.value = card.place || '';
  }
  // 날짜: 아이폰 달력 대신 키보드 자리에 우리 달력 판 (어느 폰에서나 같은 모양)
  dtb.addEventListener('pointerdown', e => e.preventDefault());
  dtb.onclick = () => { flush(); if (st.panel === 'date') return closePanel(false); st.calM = card.date.slice(0, 7); openPanel('date'); };
  pi.addEventListener('input', () => { card.place = pi.value; draw(); pushLater(); });
  pi.addEventListener('keydown', e => { if (e.key === 'Enter') pi.blur(); });
  // 장소를 쓰는 동안: 다른 줄은 숨고 키보드 바로 위에 장소 줄 + 최근 장소 (아래 줄은 키보드에 가려지니까)
  const recent = $('.recent');
  function paintRecent() {
    const q = pi.value.trim(), all = S.pref('places', []);
    const list = all.filter(x => x !== q && (!q || x.includes(q))).slice(0, 10);
    recent.innerHTML = list.map(x => `<button class="chip2">${esc(x)}</button>`).join('');
    recent.classList.toggle('none', !list.length);
    $$('button', recent).forEach((b, i) => {
      b.addEventListener('pointerdown', e => e.preventDefault());
      b.onclick = () => { pi.value = list[i]; card.place = list[i]; draw(); push(); pi.blur(); };
    });
  }
  // 아이폰은 키보드가 덮을 자리(맨 아래)에 있는 칸을 누르면 키보드를 다르게 알려 줘요. 그래서 장소 줄을 먼저 키보드 위 자리로 올리고 커서를 넣어요.
  // 줄 높이는 글 쓸 때 잰 이 폰의 키보드 높이(--kbh)를 써요
  const plOpen = () => { if (st.panel) closePanel(false); wr.classList.add('plc'); paintRecent(); applySize(true); };
  $('.st3 .pl').addEventListener('pointerdown', e => { if (!wr.classList.contains('plc')) { e.preventDefault(); plOpen(); pi.focus({ preventScroll: true }); } });
  pi.addEventListener('focus', () => { if (!wr.classList.contains('plc')) plOpen(); });
  pi.addEventListener('input', paintRecent);
  pi.addEventListener('blur', () => { wr.classList.remove('plc'); applySize(true); flush(); setTimeout(() => { if (!document.activeElement?.matches?.('input, .body')) { scrollTo(0, 0); kb(); } }, 300); });
  $('.st3 .pok').addEventListener('pointerdown', e => e.preventDefault());
  $('.st3 .pok').onclick = () => pi.blur();
  dpb.addEventListener('pointerdown', e => e.preventDefault());
  dpb.addEventListener('click', () => {
    if (!f.tools.dp) return shake(dpb);
    flush(); card.datePos = rich ? { top: 'bottom', bottom: 'none', none: 'top' }[card.datePos || dpDef] : { bottom: 'top', top: 'none', none: 'bottom' }[card.datePos || dpDef]; paintMeta(); push(); draw(); pop(DP[card.datePos][1]);   // 그림 문장은 아래 → 위 → 없음
  });

  // 알림은 모두 위 가운데 상태 자리에 1초쯤 (글꼴 이름은 그 글꼴로). 어두운 위 줄이라 어떤 배경에서도 보여요
  function pop(text, font, kind) {   // kind가 있으면 두 줄: 작은 회색 종류 + 이름
    const nm = $('.wr .stt'); clearTimeout(st.popT);
    if (kind) nm.innerHTML = `<small>${esc(kind)}</small>${esc(text)}`; else nm.textContent = text;
    nm.classList.toggle('two', !!kind); nm.classList.add('ntc'); nm.style.fontFamily = font ? fontCssOf(font) : '';
    if (font) document.fonts?.load(`20px '${font.fam}'`, text);
    nm.classList.remove('flash'); void nm.offsetWidth; nm.classList.add('flash');
    st.popT = setTimeout(() => { st.popT = 0; nm.classList.remove('ntc', 'flash', 'two'); nm.style.fontFamily = ''; count(); }, 1200);
  }

  /* 카드 그리기. 글만 바뀌면 그 자리에서 바꾸고(키보드가 내려가지 않게), 장 수·배경·날짜 같은 틀이 바뀔 때만 새로 그려요 */
  let el = null, shape = '';
  const shapeOf = () => JSON.stringify(rich ? [card.pages.length, card.bg, card.align, card.datePos, card.date, card.place, card.font, card.size] : [card.date, card.place, card.size, card.align, card.datePos]);
  const bodies = () => $$('.body', el);
  const pageOf = b => b.closest('.pg') ? +b.closest('.pg').dataset.i : 0;
  const caretIn = b => { const s = getSelection(); return s.rangeCount && b.contains(s.anchorNode) ? offsetsOf(b, s.getRangeAt(0)) : null; };
  const setCaret = (b, ab) => { const s = getSelection(); s.removeAllRanges(); s.addRange(rangeAt(b, ...ab)); };
  function draw() {
    const s = shapeOf();
    if (el && s === shape) {
      bodies().forEach((b, i) => {
        const want = rich ? card.pages[i] : card.html, at = caretIn(b);
        if (clean(b.innerHTML) !== want) { b.innerHTML = want; hydrate(b); }
        if (!rich) placeObjects(b, card.seed);
        if (at && document.activeElement === b) setCaret(b, at);
      });
    } else {
      const nel = renderCard(card, { edit: true }); el ? el.replaceWith(nel) : stage.appendChild(nel); el = nel; shape = s;
      if (rich) el.addEventListener('scroll', () => { const i = pageAtScroll(); if (i !== st.pg) { st.pg = i; count(); } }, { passive: true });
    }
    el.classList.toggle('empty', !hasText());
    fitCard(el, card); tools();
    if (rich) scrollToPage(st.pg, false);
    count();
  }
  const step = () => el.querySelector('.pg') ? el.querySelector('.pg').offsetWidth + 12 : 1;
  const pageAtScroll = () => Math.max(0, Math.min(card.pages.length - 1, Math.round(el.scrollLeft / step())));
  function scrollToPage(i, smooth = true) { if (rich && el) el.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'instant' }); }

  // 커서가 늘 보이게: 긴 글로 카드가 길어지면 칸 안에서만 스크롤 (editor.js keepCaret과 같은 방식)
  function keepCaret() {
    if (!typingNow() && !st.panel) return;   // 스타일 보기에서는 보던 자리 그대로 (남은 커서 자리로 끌려가지 않게)
    const s = getSelection(); if (!s.rangeCount || !el) return;
    const n = s.anchorNode; if (!n || !el.contains(n)) return;
    const box = stage.getBoundingClientRect(), gap = 24, rect = caretRect(s.getRangeAt(0));
    if (!rect) return;
    const want = rect.bottom;
    if (want > box.bottom - gap) stage.scrollTop += want - (box.bottom - gap);
    else if (rect.top < box.top + 8) stage.scrollTop -= (box.top + 8) - rect.top;
  }
  // 커서 위치. 그림 바로 뒤나 빈 줄처럼 위치가 안 나오는 곳은 옆 글자나 앞 그림으로 재요 (글은 건드리지 않아요)
  function caretRect(r) {
    const ok = x => x && (x.height || x.top) ? x : null;
    let rc = ok(r.getClientRects()[0]); if (rc) return rc;
    const c = r.startContainer, o = r.startOffset, q = document.createRange();
    if (c.nodeType === 3 && o > 0) { q.setStart(c, o - 1); q.setEnd(c, o); const l = q.getClientRects(); if ((rc = ok(l[l.length - 1]))) return rc; }
    if (c.nodeType === 3 && o < c.length) { q.setStart(c, o); q.setEnd(c, o + 1); if ((rc = ok(q.getClientRects()[0]))) return rc; }
    const node = c.nodeType === 1 ? c.childNodes[o - 1] || c.childNodes[o] || c : c.parentElement;
    return ok((node.nodeType === 1 ? node : node.parentElement).getBoundingClientRect());
  }

  /* 입력: 모든 포맷이 카드 위 글(.body)에 바로 써요. 한글 조합 중에는 손대지 않아요 */
  function typed(b) {
    const i = pageOf(b); st.pg = i;
    if (!b.textContent.trim() && b.innerHTML && !b.querySelector('li,h2,h3,.stk')) b.innerHTML = '';   // 비우면 예시 글이 다시 보여요
    if (rich) card.pages[i] = clean(b.innerHTML);
    else {
      card.html = clean(b.innerHTML);
      const at = caretIn(b);
      if (placeObjects(b, card.seed) && at) setCaret(b, at);   // 단어를 다 쓰고 띄어 쓰면 그림이 붙어요
    }
    el.classList.toggle('empty', !hasText());
    fitCard(el, card); count(); tools(); pushLater(); requestAnimationFrame(keepCaret);
  }
  stage.addEventListener('compositionstart', () => { st.composing = true; });
  stage.addEventListener('compositionend', e => { st.composing = false; const b = e.target.closest?.('.body'); if (b) typed(b); });
  stage.addEventListener('input', e => {
    const b = e.target.closest?.('.body'); if (!b) return;
    if (e.isComposing || st.composing) { el.classList.remove('empty'); fitCard(el, card); requestAnimationFrame(keepCaret); return; }
    typed(b);
  });
  stage.addEventListener('focusin', e => {
    const b = e.target.closest?.('.body'); if (!b) return;
    st.pg = pageOf(b);
    if (st.panel) closePanel(false);
    mode();
  });
  stage.addEventListener('focusout', () => setTimeout(mode, 0));
  stage.addEventListener('paste', e => { if (!e.target.closest?.('.body')) return; e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
  // 빈 장에서 지우기를 누르면 그 장을 없애고 앞 장 끝으로
  stage.addEventListener('keydown', e => {
    const b = e.target.closest?.('.body'); if (!b || e.key !== 'Backspace' || !rich) return;
    const sel = getSelection(), n = sel.anchorNode, o = sel.anchorOffset;   // 이모티콘 뒤 보이지 않는 칸은 같이 지워서 한 번에 이모티콘이 지워지게
    if (sel.isCollapsed && n?.nodeType === 3 && o > 0 && n.data[o - 1] === '\u200B') { n.deleteData(o - 1, 1); sel.collapse(n, o - 1); }
    const i = pageOf(b);
    if (i > 0 && !b.textContent) { e.preventDefault(); card.pages.splice(i, 1); st.pg = i - 1; push(); draw(); caretEnd(st.pg); }
  });
  // 카드의 빈 곳을 눌러도 쓰기로 (글 끝에 커서). 다른 장을 누르면 그 장으로
  stage.addEventListener('click', e => {
    if (e.target.closest('.body')) return;
    const pg = e.target.closest('.pg');
    if (!rich) return e.target.closest('.cd') && caretEnd(0);
    if (!pg) return;
    const i = +pg.dataset.i; if (i !== st.pg) { st.pg = i; scrollToPage(i); }
    caretEnd(i);
  });
  function caretEnd(i) {
    const b = bodies()[i]; if (!b) return;
    b.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* 쓰기 보기 = 글 칸에 커서가 있거나 이모티콘 판이 열렸을 때. 아니면 스타일 보기 */
  const typingNow = () => !!document.activeElement?.closest?.('.wr .body');
  function mode() {
    const w = typingNow() || st.panel === 'emo' || !!st.waitKb;
    if (wr.classList.contains('typ') !== w) { wr.classList.toggle('typ', w); applySize(); if (el && !rich) fitCard(el, card); requestAnimationFrame(() => { count(); keepCaret(); }); }
    tools();
  }

  /* 도구 줄. 포맷이 안 쓰는 도구는 어둡게, 누르면 살짝 흔들림 */
  const enabled = k => {
    if (k === 'kb' || k === 'undo' || k === 'redo') return true;
    if (k === 'fmt') return !!f.tools.style;
    const v = f.tools[k]; return k === 'shuf' && v === 'code' ? !!findBg(card.bg?.id).code : !!v;
  };
  function tools() {
    const typ = wr.classList.contains('typ');
    $$('.tb .t').forEach(b => {
      const k = b.dataset.t;
      if (k === 'undo') return b.classList.toggle('off', st.hi <= 0 && !st.timer);
      if (k === 'redo') return b.classList.toggle('off', st.hi >= st.hist.length - 1);
      b.classList.toggle('off', !enabled(k));
      b.classList.toggle('on', k === 'kb' ? typ && !st.panel : k === 'fmt' || k === 'bg' ? st.tab === k && enabled(k) : st.panel === k);
    });
    $('[data-a=ok]').disabled = !hasText();
  }
  const shake = b => { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); };

  $$('.tb .t').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());   // 눌러도 키보드 · 커서가 그대로
    b.onclick = () => {
      const k = b.dataset.t;
      if (b.classList.contains('off')) return shake(b);
      flush();
      if (k === 'kb') {   // 스타일 보기 → 글 끝에서 쓰기(키보드 올림) / 쓰기 → 키보드 내림 / 이모티콘 판 → 다시 키보드
        if (st.panel) return closePanel(true);
        if (typingNow()) { document.activeElement.blur(); return mode(); }
        caretEnd(st.pg); return mode();
      }
      if (k === 'undo' || k === 'redo') {
        if (k === 'undo' ? st.hi <= 0 : st.hi >= st.hist.length - 1) return;
        st.hi += k === 'undo' ? -1 : 1;
        card = clone(st.hist[st.hi]); persist();
        if (rich) st.pg = Math.min(st.pg, card.pages.length - 1);
        const was = typingNow(); paintMeta(); draw(); if (was && !typingNow()) caretEnd(st.pg);
        paintRow2(); return;
      }
      if (k === 'shuf') { if (rich) card.bg.seed = newSeed(); else card.seed = newSeed(); push(); draw(); paintRow2(); return; }
      if (k === 'page') {
        card.pages.splice(st.pg + 1, 0, ''); st.pg += 1; push(); draw(); scrollToPage(st.pg);
        if (st.panel) closePanel(false); caretEnd(st.pg); return;
      }
      if (k === 'fmt' || k === 'bg') { if (k === 'fmt' && st.tab === 'fmt') st.fontRow = false; st.tab = k; paintRow2(); return tools(); }
      if (k === 'emo') return st.panel === k ? closePanel(true) : openPanel(k);
      pop('다음 단계에서 열려요');
    };
  });

  /* 2줄 (스타일 보기). 서식: 글꼴 · 크기 · 좌우 · 위아래, 누를 때마다 다음 값으로(카드 전체). 배경: 내 사진 · 밝게/어둡게 + 색 칸(옆으로 밀어요) */
  const row2 = $('.st2');
  const SZ = { m: ['s', '작은 글자'], s: ['l', '큰 글자'], l: ['m', '중간'] };
  const AH = { l: ['c', '가운데'], c: ['r', '오른쪽'], r: ['l', '왼쪽'] }, AV = { m: ['b', '아래'], b: ['t', '위'], t: ['m', '가운데'] };
  function paintRow2() {
    if (st.tab === 'bg' && f.tools.bg) return paintBgRow();
    if (st.fontRow && f.tools.font) return paintFontRow();
    const on = !!f.tools.style, a = card.align || { h: 'l', v: rich ? 'm' : 't' }, off = on ? '' : 'off', fOff = on && f.tools.font ? '' : 'off';
    row2.className = 'st2 g6';
    row2.innerHTML = `<button class="k ${fOff}" data-s="font" aria-label="글꼴">${ic('font')}</button><button class="k ${off}" data-s="size" aria-label="크기">${ic('size')}</button>
      <button class="k ${off}" data-s="h" aria-label="좌우">${ic('a' + (a.h || 'l'))}</button><button class="k ${off}" data-s="v" aria-label="위아래">${ic('v' + (a.v || 'm'))}</button><span></span><span></span>`;
    $$('.k', row2).forEach(x => {
      x.addEventListener('pointerdown', e => e.preventDefault());
      x.onclick = () => {
        if (x.classList.contains('off')) return shake(x);
        flush();
        const k = x.dataset.s;
        if (k === 'font') { st.fontRow = true; return paintRow2(); }
        if (k === 'size') { const [n, t] = SZ[card.size || 'm']; card.size = n; push(); draw(); pop(t); }
        if (k === 'h') { const [n, t] = AH[a.h || 'l']; card.align = { ...a, h: n }; push(); draw(); pop(t); }
        if (k === 'v') { const [n, t] = AV[a.v || (rich ? 'm' : 't')]; card.align = { ...a, v: n }; push(); draw(); pop(t); }
        paintRow2();
      };
    });
  }
  // 글꼴 줄: 앞 칸(흰 글꼴 칸)을 누르면 서식 줄로. 나머지 5칸 자리에서 10개 글꼴이 옆으로 밀려요 (칸마다 그 글꼴로 쓴 "가")
  function paintFontRow() {
    const keep = $('.fst', row2)?.scrollLeft, cur = card.font || 'serif';
    row2.className = 'st2 g6 fnr';
    row2.innerHTML = `<button class="k on" data-x="back" aria-label="글꼴 닫기">${ic('font')}</button>
      <div class="fst">${FONTS.map(o => `<button class="k fk ${o.id === cur ? 'sel' : ''}" data-f="${o.id}" aria-label="${o.name}" style="font-family:${fontCssOf(o).replace(/"/g, '&quot;')};font-size:${Math.round(22 * o.k)}px">가</button>`).join('')}<span class="end"></span></div>`;
    const fs = $('.fst', row2), sel = $('.sel', fs);
    if (keep != null) fs.scrollLeft = keep; else if (sel) fs.scrollLeft = Math.max(0, sel.offsetLeft - fs.offsetLeft - (sel.offsetWidth + 8) * 2);
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $('[data-x=back]', row2).onclick = () => { st.fontRow = false; paintRow2(); };
    $$('[data-f]', row2).forEach(x => x.onclick = () => { flush(); const o = FONTS.find(q => q.id === x.dataset.f); card.font = o.id; push(); draw(); paintFontRow(); pop(o.name, o); });
  }
  function paintBgRow() {
    const dim = card.bg.dim || 'dark', keep = $('.swp', row2)?.scrollLeft;
    row2.className = 'st2 g6 bgr';
    row2.innerHTML = `<button class="k tl" data-x="photo" aria-label="내 사진">${ic('scene')}</button><button class="k tl" data-x="dim" aria-label="밝게 어둡게">${ic(dim === 'light' ? 'sun' : 'moon')}</button>
      <div class="swp">${FREE.map(b => `<button class="k sw ${b.id === card.bg.id ? 'sel' : ''}" data-b="${b.id}" style="${b.css ? `background:${b.css}` : ''}">${b.code ? '<canvas width="88" height="88"></canvas>' : ''}</button>`).join('')}<span class="end"></span></div>`;
    $$('canvas', row2).forEach(cv => drawCode(cv, card.bg.seed || 1, .5));
    const sw = $('.swp', row2), sel = $('.sel', sw);
    if (keep != null) sw.scrollLeft = keep; else if (sel) sw.scrollLeft = Math.max(0, sel.offsetLeft - sw.offsetLeft);
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $('[data-x=photo]', row2).onclick = () => pop('내 사진 배경은 사진 연결 후');
    $('[data-x=dim]', row2).onclick = () => { flush(); card.bg.dim = dim === 'light' ? 'dark' : 'light'; push(); draw(); paintBgRow(); pop(card.bg.dim === 'light' ? '밝게' : '어둡게'); };
    $$('[data-b]', row2).forEach(t => t.onclick = () => { flush(); card.bg.id = t.dataset.b; if (!card.bg.seed) card.bg.seed = newSeed(); push(); draw(); paintBgRow(); const b = findBg(card.bg.id); pop(b.name, null, KIND[b.kind]); });
  }

  /* 이모티콘 판: 키보드 자리에 같은 높이로 열려요. 도구 줄은 제자리 */
  function openPanel(k) {
    const s = getSelection(), b = s.rangeCount && s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement)?.closest?.('.wr .body');
    if (b) st.sel = { i: pageOf(b), ab: offsetsOf(b, s.getRangeAt(0)) };
    st.panel = k; st.insR = null; clearTimeout(st.waitT); st.waitKb = false;
    root.classList.add('pan'); wr.classList.toggle('dsel', k === 'date'); applySize();
    document.activeElement?.blur?.();
    paintPanel(); mode();
  }
  function closePanel(toKeyboard) {
    st.panel = null; panel.innerHTML = ''; wr.classList.remove('dsel');
    // 키보드가 다 올라올 때까지 빈 자리를 남겨 둬요 (도구 줄이 내려갔다 올라오지 않게)
    if (toKeyboard) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); caretAtSel(); }
    else if (document.activeElement?.matches?.('.wr .body, .wr input')) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); }
    else endWait();
    mode();
  }
  function endWait() { clearTimeout(st.waitT); st.waitKb = false; if (!st.panel) root.classList.remove('pan'); applySize(); mode(); }
  function caretAtSel() {
    const b = st.sel && bodies()[st.sel.i]; if (!b) return caretEnd(st.pg);
    if (st.insR && b.contains(st.insR.startContainer)) { b.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(st.insR); return; }   // 넣은 이모티콘 바로 뒤
    b.focus({ preventScroll: true }); setCaret(b, st.sel.ab);
  }
  const paintPanel = () => st.panel === 'date' ? panelDate() : panelEmo();

  // 날짜 판: 한 달 달력. 고른 날 = 흰 둥근 네모, 오늘 = 테두리, 앞으로 올 날은 흐리게(못 골라요)
  function panelDate() {
    const [y, m] = st.calM.split('-').map(Number), first = new Date(y, m - 1, 1), n = new Date(y, m, 0).getDate(), today = S.today();
    const iso = d => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push('<span></span>');
    for (let d = 1; d <= n; d++) { const v = iso(d); cells.push(`<button class="d ${v === card.date ? 'sel' : ''} ${v === today ? 'today' : ''}" data-d="${v}" ${v > today ? 'disabled' : ''}>${d}</button>`); }
    const canNext = iso(1) < today.slice(0, 7) + '-01';
    panel.innerHTML = `<div class="cal"><div class="hd"><button class="mv" data-m="-1" aria-label="이전 달">${ic('back')}</button><b>${y}년 ${m}월</b><button class="mv nx" data-m="1" aria-label="다음 달" ${canNext ? '' : 'disabled'}>${ic('back')}</button></div>
      <div class="g7">${'일월화수목금토'.split('').map(x => `<i>${x}</i>`).join('')}${cells.join('')}</div></div>`;
    $$('button', panel).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $$('[data-m]', panel).forEach(x => x.onclick = () => { const t = new Date(y, m - 1 + +x.dataset.m, 1); st.calM = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; panelDate(); });
    $$('[data-d]', panel).forEach(x => x.onclick = () => { flush(); card.date = x.dataset.d; paintMeta(); push(); draw(); closePanel(false); });
  }

  // 이모티콘: 우리 이모티콘 81개. 굵은(색) · 선(글자색). 고르면 커서 자리에 들어가고, 이어서 고르면 그 뒤에 차례로
  let emoV = S.pref('emoV', 'b');
  function panelEmo() {
    preloadAll(emoV === 'l' ? 'l' : undefined);
    const url = n => `../stickers/${emoV === 'l' ? 'line' : 'kept'}/${n}.svg`;
    panel.innerHTML = `<div class="pgrid"><button class="pb ${emoV === 'b' ? 'on' : ''}" data-v="b"><img class="ei" src="../stickers/kept/smile.svg" alt=""></button>
        <button class="pb ${emoV === 'l' ? 'on' : ''}" data-v="l"><span class="ei ln" style="-webkit-mask-image:url(../stickers/line/smile.svg);mask-image:url(../stickers/line/smile.svg)"></span></button></div>
      <div class="pgrid emo">${STK.map(n => `<button class="pb" data-st="${n}">${emoV === 'l' ? `<span class="ei ln" style="-webkit-mask-image:url(${url(n)});mask-image:url(${url(n)})"></span>` : `<img class="ei" src="${url(n)}" alt="" loading="lazy">`}</button>`).join('')}</div>`;
    $$('[data-v]', panel).forEach(x => { x.addEventListener('pointerdown', e => e.preventDefault()); x.onclick = () => { emoV = x.dataset.v; S.setPref('emoV', emoV); panelEmo(); }; });
    $$('[data-st]', panel).forEach(x => { x.addEventListener('pointerdown', e => e.preventDefault()); x.onclick = () => insertSticker(x.dataset.st); });
  }
  function insertSticker(name) {
    const i = st.sel ? st.sel.i : st.pg, b = bodies()[i]; if (!b) return;
    flush();
    let r = st.insR && b.contains(st.insR.startContainer) ? st.insR : st.sel ? rangeAt(b, ...st.sel.ab) : null;
    if (!r) { r = document.createRange(); r.selectNodeContents(b); }
    r.collapse(false);
    const s = document.createElement('span'); s.className = 'stk'; s.dataset.st = name; if (emoV === 'l') s.dataset.v = 'l';
    r.insertNode(s); hydrate(b);
    // 커서는 이모티콘 뒤 글자 칸 안에 둬요. 그림 바로 옆(글자 칸 밖)에서 한글을 조합하면 글자가 두 번 찍혀요
    let t = s.nextSibling;
    if (!t || t.nodeType !== 3 || !t.length) { t = document.createTextNode('\u200B'); s.after(t); }
    const after = document.createRange(); after.setStart(t, t.data[0] === '\u200B' ? 1 : 0); after.collapse(true); st.insR = after;
    if (!st.sel) st.sel = { i, ab: [0, 0] };
    card.pages[i] = clean(b.innerHTML);
    el.classList.toggle('empty', !hasText()); fitCard(el, card); count(); push();
    requestAnimationFrame(() => { const rc = s.getBoundingClientRect(), box = stage.getBoundingClientRect(); if (rc.bottom > box.bottom - 16) stage.scrollTop += rc.bottom - box.bottom + 24; else if (rc.top < box.top) stage.scrollTop -= box.top - rc.top + 16; });
  }


  $('[data-a=back]').onclick = () => {
    clearTimeout(st.timer);
    if (isNew) { if (hasText()) S.saveDraft({ card }); else S.clearDraft(); }
    else if (hasText()) S.saveCard(card);
    go(isNew ? '#/pick' : `#/at/${card.id}`);   // 바로 앞 화면으로: 새로 쓰기는 포맷 고르기, 고치기는 피드의 그 카드
  };
  $('[data-a=ok]').onclick = () => {
    if (!hasText()) return;
    if (isNew) { card.id = S.uid(); card.created = new Date().toISOString(); S.clearDraft(); }
    delete card.sample; S.saveCard(card);
    const pl = (card.place || '').trim();   // 최근 장소 (장소 칸에서 다시 고를 수 있게)
    if (pl) S.setPref('places', [pl, ...S.pref('places', []).filter(x => x !== pl)].slice(0, 20));
    // 다 됐다는 표시: 가운데 큰 체크가 잠깐 떴다가 피드로
    const ok = $('[data-a=ok]'); ok.disabled = true; document.activeElement?.blur?.();
    const mk = document.createElement('div'); mk.className = 'okmark'; mk.innerHTML = `<span>${ic('check')}</span>`; document.body.appendChild(mk);
    setTimeout(() => { mk.remove(); go(`#/feed/${card.id}`); }, 900);
  };

  paintMeta(); paintRow2(); mode(); sizeCard(); draw(); kb();
  document.fonts?.ready.then(() => el && fitCard(el, card));
}

async function exportCard(c) {
  const busy = document.createElement('div'); busy.className = 'busy'; busy.textContent = '이미지를 만드는 중…';
  document.body.appendChild(busy);
  try {
    const files = await cardImages(c);
    busy.remove();
    const r = await saveImages(files);
    if (r === 'downloaded') toast(`사진 ${files.length}장을 저장했어요`);
  } catch (e) { busy.remove(); console.error(e); toast('저장하지 못했어요. 다시 해 주세요'); }
}

route();
