// 갖고 싶은 하루 · 모바일 1차: 피드 → 포맷 고르기 → 쓰기 → 완료·저장
import { ic } from './icons.js';
import * as S from './store.js';
import { FORMATS, ORDER, blank, sampleCard, renderCard, fitCard, cardText, newSeed, placeObjects, dateChip, weekday, toneOf } from './formats.js';
import { FREE, PAID, find as findBg, drawCode } from './bg.js';
import { cardImages, saveImages, buildPages } from './export.js';
import { clean, offsetsOf, rangeAt, isOn, toggleInline, linesIn, toggleHead, toggleList } from './rich.js';

const app = document.getElementById('app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));

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
  if (r === 'done') return viewDone(a);
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
function viewFeed() {
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
}
function dayLabel(d) {
  const t = S.today(), y = new Date(Date.now() - 864e5), ys = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  const base = dateChip(d) + (d.slice(0, 4) !== t.slice(0, 4) ? ` · ${d.slice(0, 4)}` : '');
  return d === t ? `오늘 · ${base}` : d === ys ? `어제 · ${base}` : base;
}

// 카드 한 장. 긴 카드는 4:5 장들을 옆으로 밀어 봐요. 누르면 그 카드만 화면 가득(다시 누르면 피드로).
// 아래 줄: 책갈피 · 저장 · 쓰기 · 삭제 · 장 수(여러 장일 때)
function feedItem(c) {
  const it = document.createElement('article'); it.className = 'fi'; it.dataset.tone = toneOf(c);
  const f = FORMATS[c.fmt];
  it.innerHTML = `<div class="cdate">${c.sample ? '예시' : dayLabel(c.date)}</div><div class="fx"><div class="view"></div></div>
    <div class="row">${c.sample
      ? `<div class="ours">${f.name}<i>NEW</i></div><button class="cb" data-a="use" aria-label="이 포맷으로 쓰기">${ic('pen')}</button>`
      : `<div class="l"><button class="cb ${c.mark ? 'on' : ''}" data-a="mark" aria-label="책갈피">${ic('bookmark')}</button><button class="cb" data-a="save" aria-label="사진에 저장">${ic('save')}</button><button class="cb" data-a="edit" aria-label="고치기">${ic('pen')}</button><button class="cb" data-a="del" aria-label="삭제">${ic('trash')}</button><span class="pc" hidden></span></div>`}</div>
    <p class="ex"></p>`;
  const fx = $('.fx', it), view = $('.view', it), pc = $('.pc', it);
  $('.ex', it).textContent = cardText(c).replace(/\s+/g, ' ').trim();   // 글 첫머리 한 줄 (길면 …)
  mount(view, c);
  // 저장할 때와 같은 방식으로 장을 나눠서, 여러 장이면 옆으로 넘겨 보는 모양으로 (늘 첫 장부터)
  requestAnimationFrame(() => setTimeout(async () => {
    const W = view.clientWidth; if (!W) return;
    const { h, nodes } = await buildPages(c, W, Math.min(2, devicePixelRatio || 1));
    if (nodes.length > 1) {
      // 손으로 넘기기 전에는 옆 넘김을 붙이지 않아요 (아이폰이 마지막 장으로 붙여 버리지 않게)
      const pages = document.createElement('div'); pages.className = 'pgs nosnap'; pages.append(...nodes);
      const snapOn = () => pages.classList.remove('nosnap');
      pages.addEventListener('touchstart', snapOn, { once: true, passive: true }); pages.addEventListener('pointerdown', snapOn, { once: true });
      const paint = () => { if (pc) pc.textContent = `${Math.round(pages.scrollLeft / pages.clientWidth) + 1}/${nodes.length}`; };
      pages.addEventListener('scroll', paint, { passive: true });
      view.innerHTML = ''; view.appendChild(pages); it.classList.add('multi');
      const first = () => { if (pages.classList.contains('nosnap')) { pages.scrollLeft = 0; paint(); } };
      first(); requestAnimationFrame(first); [150, 500, 1200].forEach(ms => setTimeout(first, ms));
      if (pc) { pc.hidden = false; paint(); }
    }
    h.remove();
  }, 40));
  fx.addEventListener('click', () => openFocus(it));
  const on = (k, fn) => { const b = $(`[data-a=${k}]`, it); if (b) b.onclick = fn; };
  on('use', () => go(`#/write/${c.fmt}`));
  on('edit', () => go(`#/edit/${c.id}`));
  on('save', () => exportCard(c));
  on('mark', e => { c.mark = !c.mark; S.saveCard(c); e.currentTarget.classList.toggle('on', c.mark); toast(c.mark ? '책갈피에 넣었어요' : '책갈피에서 뺐어요'); });
  on('del', () => {   // 바로 지우고, 잠깐 '되돌리기'를 보여 줘요
    S.removeCard(c.id); it.remove();
    undoToast('삭제했어요', () => { S.saveCard(c); route(); });
  });
  return it;
}
function undoToast(msg, undo) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast ud'; t.innerHTML = `<span>${msg}</span><button>되돌리기</button>`;
  $('button', t).onclick = () => { t.remove(); undo(); };
  document.body.appendChild(t); setTimeout(() => t.remove(), 4000);
}

// 카드만 화면 가득: 그 자리에서 커지며 나오고(바탕은 어두워지며 위 줄 · 메뉴 · 다른 카드가 가려져요), 누르면 제자리로
let focus = null;
function openFocus(it) {
  if (focus) return;
  const fx = $('.fx', it), view = $('.view', it), r = view.getBoundingClientRect();
  const k = Math.min(innerWidth, 480, innerHeight * .8 / (r.height / r.width)) / r.width;
  const tx = (innerWidth - r.width * k) / 2 - r.left, ty = (innerHeight - r.height * k) / 2 - r.top;
  const ov = document.createElement('div'); ov.className = 'fv';
  const box = document.createElement('div'); box.className = 'fi play fvb';
  box.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;`;
  fx.style.height = r.height + 'px'; moveKeep(view, () => { box.appendChild(view); ov.appendChild(box); document.body.appendChild(ov); });
  // 뒤 피드는 그대로 두고(보던 자리 유지), 가득 화면에서 위아래로 끌어도 뒤가 움직이지 않게
  ov.addEventListener('touchmove', e => { if (!e.target.closest('.pgs')) e.preventDefault(); }, { passive: false });
  ov.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  requestAnimationFrame(() => requestAnimationFrame(() => { ov.classList.add('in'); box.style.transform = `translate(${tx}px,${ty}px) scale(${k})`; }));
  ov.addEventListener('click', () => closeFocus());
  focus = { ov, box, fx, view, y: scrollY };
}
// 옮겨도 보던 장 그대로 (옮기면 브라우저가 첫 장으로 되돌려요), 장 수도 다시 맞춰요
function moveKeep(view, move) {
  const pg = $('.pgs', view), x = pg?.scrollLeft || 0;
  move();
  if (pg) { pg.scrollLeft = x; pg.dispatchEvent(new Event('scroll')); }
}
function closeFocus(now) {
  if (!focus || focus.closing) return;
  const f = focus; f.closing = true;
  const done = () => { moveKeep(f.view, () => f.fx.appendChild(f.view)); f.fx.style.height = ''; f.ov.remove(); if (scrollY !== f.y) scrollTo(0, f.y); focus = null; };
  if (now) return done();
  f.ov.classList.remove('in'); f.box.style.transform = '';
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
  const st = { panel: null, hist: [clone(card)], hi: 0, timer: 0, pg: 0, sel: null, composing: false };
  const root = document.documentElement;

  root.classList.add('wmode');
  app.innerHTML = `<div class="wr ${rich ? 'rich' : 'plain'}">
    <header class="top"><button class="cb" data-a="back" aria-label="뒤로">${ic('back')}</button><div class="nm">${f.name}</div><button class="cb w" data-a="ok" aria-label="완료">${ic('check')}</button></header>
    <div class="meta">
      <label class="chip dt">${ic('date')}<span></span><input type="date" aria-label="날짜"></label>
      <label class="chip pl">${ic('pin')}<input class="pi" maxlength="20" placeholder="장소" aria-label="장소"></label>
    </div>
    <section class="stage"></section>
    <div class="tb">${['fmt', 'photo', 'emo', 'bg', 'page', 'shuf'].map(k => `<button class="t" data-t="${k}">${ic(k)}</button>`).join('')}<span class="sep"></span><button class="t" data-t="undo">${ic('undo')}</button><button class="t" data-t="redo">${ic('redo')}</button></div>
    <div class="panel"></div></div>`;
  const wr = $('.wr'), stage = $('.stage'), panel = $('.panel');

  /* 키보드: shell.js trackKeyboard와 같은 계산. 키보드 높이는 기억해 두고 패널도 같은 높이로 열어요 */
  const vv = window.visualViewport;
  let raf = 0, kbh = S.pref('kbh', 0), measured = !!kbh;
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
    if (!open && (scrollY || vv.offsetTop)) scrollTo(0, 0);   // 아이폰이 키보드를 내린 뒤 화면을 밀어 둔 채로 두지 않게
    applySize(); keepCaret();
  };
  const soonKb = () => { if (!raf) raf = requestAnimationFrame(kb); };
  const remeasure = () => [250, 600, 1200].forEach(ms => setTimeout(kb, ms));
  vv?.addEventListener('resize', soonKb); vv?.addEventListener('scroll', soonKb);
  addEventListener('focusout', remeasure);
  let lastW = innerWidth;
  const onResize = () => { if (innerWidth !== lastW) { lastW = innerWidth; sizeCard(); } soonKb(); };   // 돌렸을 때만 다시 재요
  addEventListener('resize', onResize);
  cleanup = () => {
    vv?.removeEventListener('resize', soonKb); vv?.removeEventListener('scroll', soonKb);
    removeEventListener('focusout', remeasure); removeEventListener('resize', onResize);
    clearTimeout(st.timer); clearTimeout(st.waitT); CSS.highlights?.delete('dz-sel');
    root.classList.remove('wmode', 'kb-open', 'pan');
  };

  /* 카드 크기는 두 가지뿐: 쓰는 중(키보드나 패널이 있을 때)엔 그 위 공간에, 보는 중엔 화면에 통째로 들어가게.
     키보드 ↔ 패널을 오갈 때는 같은 크기라 움직이지 않아요 */
  const sizes = { w: 0, v: 0 };
  function sizeCard() {
    const W = wr.clientWidth, fixed = $('.top').offsetHeight + $('.meta').offsetHeight + $('.tb').offsetHeight + 20;
    const fit = H => Math.floor(Math.max(160, Math.min(W - 32, H * .8)));
    sizes.w = fit(innerHeight - fixed - kbh); sizes.v = fit(innerHeight - fixed);
    applySize(true);
  }
  function applySize(force) {
    const writing = root.classList.contains('kb-open') || root.classList.contains('pan');
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
  const hasText = () => cardText(card).trim().length > 0;
  const count = () => { const n = `${cardText(card).replace(/\s/g, '').length}자`; $$('.wc', stage).forEach(x => x.textContent = n); };

  /* 정보 줄: 날짜(누르면 달력) · 장소. 모든 포맷 같아요 */
  const di = $('.meta .dt input'), pi = $('.meta .pi');
  function paintMeta() {
    $('.meta .dt span').textContent = dateChip(card.date);
    di.value = card.date; pi.value = card.place || '';
  }
  di.addEventListener('change', () => { if (!di.value) return; flush(); card.date = di.value; paintMeta(); push(); draw(); });
  pi.addEventListener('input', () => { card.place = pi.value; draw(); pushLater(); });
  $$('.meta input').forEach(x => x.addEventListener('focus', () => { if (st.panel) closePanel(false); }));

  /* 카드 그리기. 글만 바뀌면 그 자리에서 바꾸고(키보드가 내려가지 않게), 장 수·배경·날짜 같은 틀이 바뀔 때만 새로 그려요 */
  let el = null, shape = '';
  const shapeOf = () => JSON.stringify(rich ? [card.pages.length, card.bg, card.align, card.datePos, card.date, card.place] : [card.date, card.place]);
  const bodies = () => $$('.body', el);
  const pageOf = b => b.closest('.pg') ? +b.closest('.pg').dataset.i : 0;
  const caretIn = b => { const s = getSelection(); return s.rangeCount && b.contains(s.anchorNode) ? offsetsOf(b, s.getRangeAt(0)) : null; };
  const setCaret = (b, ab) => { const s = getSelection(); s.removeAllRanges(); s.addRange(rangeAt(b, ...ab)); };
  function draw() {
    const s = shapeOf();
    if (el && s === shape) {
      bodies().forEach((b, i) => {
        const want = rich ? card.pages[i] : card.html, at = caretIn(b);
        if (clean(b.innerHTML) !== want) b.innerHTML = want;
        if (!rich) placeObjects(b, card.seed);
        if (at && document.activeElement === b) setCaret(b, at);
      });
    } else {
      const nel = renderCard(card, { edit: true }); el ? el.replaceWith(nel) : stage.appendChild(nel); el = nel; shape = s;
      (rich ? $$('.pg', el) : [el]).forEach(x => x.insertAdjacentHTML('beforeend', '<span class="wc"></span>'));
      if (rich) el.addEventListener('scroll', () => { const i = pageAtScroll(); if (i !== st.pg) st.pg = i; }, { passive: true });
    }
    el.classList.toggle('empty', !hasText());
    fitCard(el, card); count(); tools();
    if (rich) scrollToPage(st.pg, false);
  }
  const step = () => el.querySelector('.pg') ? el.querySelector('.pg').offsetWidth + 12 : 1;
  const pageAtScroll = () => Math.max(0, Math.min(card.pages.length - 1, Math.round(el.scrollLeft / step())));
  function scrollToPage(i, smooth = true) { if (rich && el) el.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'instant' }); }

  // 커서가 늘 보이게: 긴 글로 카드가 길어지면 칸 안에서만 스크롤 (editor.js keepCaret과 같은 방식)
  function keepCaret() {
    const s = getSelection(); if (!s.rangeCount || !el) return;
    const n = s.anchorNode; if (!n || !el.contains(n)) return;
    const box = stage.getBoundingClientRect(), gap = 24, rect = caretRect(s.getRangeAt(0));
    if (!rect) return;
    let want = rect.bottom;
    // 그림 문장: 마지막 줄을 쓰는 중이면 카드 아래(요일 · 날짜)까지 보이게
    const body = (n.nodeType === 1 ? n : n.parentElement)?.closest('.body');
    if (!rich && body && body.getBoundingClientRect().bottom - rect.bottom < rect.height * 1.5) want = Math.max(want, el.getBoundingClientRect().bottom - 8);
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
  function showRange(r) {   // 패널이 열린 동안 고른 글자를 보이게 칠해 둬요
    if (!window.Highlight || !CSS.highlights) return;
    if (!r || r.collapsed) return CSS.highlights.delete('dz-sel');
    CSS.highlights.set('dz-sel', new Highlight(r));
  }

  /* 입력: 모든 포맷이 카드 위 글(.body)에 바로 써요. 한글 조합 중에는 손대지 않아요 */
  function typed(b) {
    const i = pageOf(b); st.pg = i;
    if (!b.textContent.trim() && b.innerHTML && !b.querySelector('li,h2')) b.innerHTML = '';   // 비우면 예시 글이 다시 보여요
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
  });
  stage.addEventListener('paste', e => { if (!e.target.closest?.('.body')) return; e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
  // 빈 장에서 지우기를 누르면 그 장을 없애고 앞 장 끝으로
  stage.addEventListener('keydown', e => {
    const b = e.target.closest?.('.body'); if (!b || e.key !== 'Backspace' || !rich) return;
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

  /* 도구 줄: 모든 포맷 같은 줄. 포맷이 안 쓰는 도구는 어둡게, 누르면 살짝 흔들림 */
  const enabled = k => { const v = f.tools[k]; return k === 'shuf' && v === 'code' ? !!findBg(card.bg?.id).code : !!v; };
  function tools() {
    $$('.tb .t').forEach(b => {
      const k = b.dataset.t;
      if (k === 'undo') return b.classList.toggle('off', st.hi <= 0 && !st.timer);
      if (k === 'redo') return b.classList.toggle('off', st.hi >= st.hist.length - 1);
      b.classList.toggle('off', !enabled(k)); b.classList.toggle('on', st.panel === k);
    });
    $('[data-a=ok]').disabled = !hasText();
  }
  const shake = b => { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); };
  const typingNow = () => !!document.activeElement?.closest?.('.wr .body');

  $$('.tb .t').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());   // 눌러도 키보드 · 고른 글자가 그대로
    b.onclick = () => {
      const k = b.dataset.t;
      if (b.classList.contains('off')) return shake(b);
      flush();
      if (k === 'undo' || k === 'redo') {
        if (k === 'undo' ? st.hi <= 0 : st.hi >= st.hist.length - 1) return;
        st.hi += k === 'undo' ? -1 : 1;
        card = clone(st.hist[st.hi]); persist();
        if (rich) st.pg = Math.min(st.pg, card.pages.length - 1);
        const was = typingNow(); paintMeta(); draw(); if (was && !typingNow()) caretEnd(st.pg);
        if (st.panel) paintPanel(); return;
      }
      if (k === 'shuf') { if (rich) card.bg.seed = newSeed(); else card.seed = newSeed(); push(); draw(); if (st.panel) paintPanel(); return; }
      if (k === 'page') {
        card.pages.splice(st.pg + 1, 0, ''); st.pg += 1; push(); draw(); scrollToPage(st.pg);
        if (st.panel) closePanel(false); caretEnd(st.pg); return;
      }
      if (k === 'fmt' || k === 'bg') return st.panel === k ? closePanel(true) : openPanel(k);
      soon();
    };
  });

  /* 패널: 키보드 자리에 같은 높이로 열려요. 도구 줄은 제자리 */
  function openPanel(k) {
    const s = getSelection(), b = s.rangeCount && s.anchorNode?.parentElement?.closest?.('.wr .body');
    if (b) st.sel = { i: pageOf(b), ab: offsetsOf(b, s.getRangeAt(0)) };
    st.panel = k; clearTimeout(st.waitT); st.waitKb = false;
    root.classList.add('pan'); applySize();
    document.activeElement?.blur?.();
    paintPanel(); tools();
  }
  function closePanel(toKeyboard) {
    st.panel = null; panel.innerHTML = ''; CSS.highlights?.delete('dz-sel'); tools();
    // 키보드가 다 올라올 때까지 빈 자리를 남겨 둬요 (도구 줄이 내려갔다 올라오지 않게)
    if (toKeyboard) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); caretAtSel(); }
    else if (document.activeElement?.matches?.('.wr .body, .wr .meta input')) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); }
    else endWait();
  }
  function endWait() { clearTimeout(st.waitT); st.waitKb = false; if (!st.panel) root.classList.remove('pan'); applySize(); }
  function caretAtSel() {
    const b = st.sel && bodies()[st.sel.i]; if (!b) return caretEnd(st.pg);
    b.focus({ preventScroll: true }); setCaret(b, st.sel.ab);
  }
  const paintPanel = () => st.panel === 'fmt' ? panelFmt() : panelBg();

  // 서식: 모든 포맷 같은 6칸. 포맷이 안 쓰는 것은 어둡게(그림 문장은 강조 · 형광펜만)
  function panelFmt() {
    const ft = f.fmtTools, a = card.align || {}, dp = card.datePos || 'top';
    const b = st.sel ? bodies()[st.sel.i] : null, r = b ? rangeAt(b, ...st.sel.ab) : null;
    if (r) showRange(r);
    const ls = r ? linesIn(b, r) : [];
    const on = {
      bold: r && !r.collapsed && isOn(b, r, 'b,strong'), mark: r && !r.collapsed && isOn(b, r, 'mark'),
      head: ls.length && ls.every(l => l.tagName === 'H2'), list: ls.length && ls.every(l => l.tagName === 'LI'),
      date: dp !== 'none',
    };
    const btn = (k, isOn, off) => `<button class="pb ${isOn ? 'on' : ''} ${off ? 'off' : ''}" data-f="${k}">${ic(k)}</button>`;
    panel.innerHTML = `<div class="pgrid">${['bold', 'mark', 'head', 'list', 'date'].map(k => btn(k, ft[k] && on[k], !ft[k])).join('')}</div>
      <div class="pgrid">${['al', 'ac', 'ar'].map(k => btn(k, ft.align && a.h === k[1], !ft.align)).join('')}${['vt', 'vm', 'vb'].map(k => btn(k, ft.align && a.v === k[1], !ft.align)).join('')}</div>`;
    if (ft.date) $('[data-f=date]', panel).insertAdjacentHTML('beforeend', `<span class="tag">${{ top: '위', bottom: '아래', none: '끔' }[dp]}</span>`);
    $$('.pb', panel).forEach(x => {
      x.addEventListener('pointerdown', e => e.preventDefault());
      x.onclick = () => {
        const k = x.dataset.f;
        if (x.classList.contains('off')) return shake(x);
        flush();
        if (['al', 'ac', 'ar'].includes(k)) { card.align.h = k[1]; push(); draw(); return panelFmt(); }
        if (['vt', 'vm', 'vb'].includes(k)) { card.align.v = k[1]; push(); draw(); return panelFmt(); }
        if (k === 'date') { card.datePos = { top: 'bottom', bottom: 'none', none: 'top' }[dp]; push(); draw(); return panelFmt(); }
        if (!b) return toast('쓸 곳을 먼저 눌러 주세요');
        if ((k === 'bold' || k === 'mark') && r.collapsed) return toast('바꿀 글자를 먼저 골라 주세요');
        const ok = k === 'bold' ? toggleInline(b, r, 'b') : k === 'mark' ? toggleInline(b, r, 'mark') : k === 'head' ? toggleHead(b, r) : toggleList(b, r);
        if (!ok) return;
        if (rich) card.pages[st.sel.i] = clean(b.innerHTML); else { card.html = clean(b.innerHTML); placeObjects(b, card.seed); }
        fitCard(el, card); count(); push();
        panelFmt();
      };
    });
  }

  function panelBg() {
    const tab = isPaidId(card.bg.id) ? 'paid' : 'free', dim = card.bg.dim || 'dark', list = tab === 'paid' ? PAID : FREE;
    panel.innerHTML = `<div class="pgrid">
        <button class="pb ${tab === 'free' ? 'on' : ''}" data-tab="free">${ic('grad')}</button>
        <button class="pb ${tab === 'paid' ? 'on' : ''}" data-tab="paid">${ic('spark')}</button>
        <button class="pb" data-tab="photo">${ic('scene')}</button><span></span>
        <button class="pb ${dim === 'light' ? 'on' : ''}" data-dim="light">${ic('sun')}</button>
        <button class="pb ${dim === 'dark' ? 'on' : ''}" data-dim="dark">${ic('moon')}</button></div>
      <div class="bgs">${list.map(b => `<button class="bt ${b.id === card.bg.id ? 'on' : ''}" data-b="${b.id}" style="${b.css ? `background:${b.css}` : b.img ? `background-image:url(${b.img})` : ''}">${b.code ? '<canvas width="80" height="100"></canvas>' : ''}${tab === 'paid' ? ic('lock') : ''}</button>`).join('')}</div>`;
    $$('.bgs canvas', panel).forEach(cv => drawCode(cv, card.bg.seed || 1, .5));
    $$('[data-tab]', panel).forEach(t => t.onclick = () => {
      if (t.dataset.tab === 'photo') return toast('내 사진 배경은 사진 연결 후 열려요');
      const L = t.dataset.tab === 'paid' ? PAID : FREE;
      if ((t.dataset.tab === 'paid') !== isPaidId(card.bg.id)) { flush(); card.bg.id = L[0].id; push(); draw(); }
      panelBg();
    });
    $$('[data-dim]', panel).forEach(t => t.onclick = () => { flush(); card.bg.dim = t.dataset.dim; push(); draw(); panelBg(); });
    $$('[data-b]', panel).forEach(t => t.onclick = () => { flush(); card.bg.id = t.dataset.b; if (!card.bg.seed) card.bg.seed = newSeed(); push(); draw(); panelBg(); });
  }
  const isPaidId = x => PAID.some(b => b.id === x);

  $('[data-a=back]').onclick = () => {
    clearTimeout(st.timer);
    if (isNew) { if (hasText()) S.saveDraft({ card }); else S.clearDraft(); }
    else if (hasText()) S.saveCard(card);
    go('#/');
  };
  $('[data-a=ok]').onclick = () => {
    if (!hasText()) return;
    if (isNew) { card.id = S.uid(); card.created = new Date().toISOString(); S.clearDraft(); }
    delete card.sample; S.saveCard(card);
    go(`#/done/${card.id}`);
  };

  paintMeta(); sizeCard(); draw(); kb();
  document.fonts?.ready.then(() => el && fitCard(el, card));
}

/* ── 완료 ───────────────────────────────────────────── */
function viewDone(id) {
  const c = S.card(id); if (!c) return go('#/');
  app.innerHTML = `<header class="top"><button class="cb" data-a="x" aria-label="닫기">${ic('close')}</button><button class="cb" data-a="edit" aria-label="고치기">${ic('pen')}</button></header>
    <main class="done"><div class="cv"></div>
    <div class="row"><button class="cb ${c.mark ? 'on' : ''}" data-a="mark" aria-label="책갈피">${ic('bookmark')}</button><button class="cb" data-a="book" aria-label="책에 넣기">${ic('shelf')}</button><span class="sp"></span></div>
    <button class="go" data-a="save">${ic('save')}<span>사진에 저장</span></button><div class="ifo"></div></main>`;
  mount($('.cv'), c);
  const n = c.fmt === 'text' ? c.pages.length : null;
  $('.ifo').textContent = n ? `사진 ${n}장 · 4:5` : '4:5 · 길면 여러 장으로 나눠 저장해요';
  $('[data-a=x]').onclick = () => go('#/');
  $('[data-a=edit]').onclick = () => go(`#/edit/${c.id}`);
  $('[data-a=book]').onclick = soon;
  $('[data-a=mark]').onclick = e => { c.mark = !c.mark; S.saveCard(c); e.currentTarget.classList.toggle('on', c.mark); e.currentTarget.style.background = c.mark ? '#fff' : ''; e.currentTarget.style.color = c.mark ? '#141416' : ''; };
  $('[data-a=save]').onclick = () => exportCard(c);
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
