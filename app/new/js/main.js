// 갖고 싶은 하루 · 모바일 1차: 피드 → 포맷 고르기 → 쓰기 → 완료·저장
import { ic } from './icons.js';
import * as S from './store.js';
import { exampleText } from './prompts.js';
import { FORMATS, ORDER, LABEL, blank, sampleCard, renderCard, fitCard, cardText, newSeed, placeObjects, dateChip, weekday, toneOf, pageBg, AR, RATIOS, arOf, dateOn, placeOn, infoPos, signOf, SIZE5, V5, dimLv, inkOn } from './formats.js';
import { FREE, KIND, find as findBg, drawCode } from './bg.js';
import { buildPages } from './export.js';
import { saveCard, pill } from './save.js';
import { clean, offsetsOf, rangeAt } from './rich.js';
import { FONTS, fontOf, fontCssOf } from './fonts.js';
import { NAMES as STK, hydrate, preloadAll } from './stickers.js';
import * as P from './photos.js';
import { FILTERS, filterOf, thumb as fthumb } from './filters.js';
import * as V from './video.js';
import { paint as paintMood } from './mood.js';

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

// 목록 시트 (10-23 UI 키트): 위에 흐린 제목, 묶음마다 둥근 카드, 지우기는 빨간색으로 따로. 바깥을 누르면 닫혀요
function sheet(head, groups) {
  const bg = document.createElement('div'); bg.className = 'sheet-bg';
  const all = groups.flat();
  bg.innerHTML = `<div class="sheet"><div class="grab"></div>${head ? `<p class="sh">${esc(head)}</p>` : ''}${groups.map(g => `<div class="grp">${g.map(it => `<button class="it ${it.red ? 'red' : ''}" data-i="${all.indexOf(it)}">${ic(it.icon)}${it.label}</button>`).join('')}</div>`).join('')}</div>`;
  const close = () => { bg.classList.add('out'); setTimeout(() => bg.remove(), 300); };
  bg.addEventListener('click', e => { const b = e.target.closest('.it'); if (!b && e.target.closest('.sheet')) return; close(); if (b) all[+b.dataset.i].run(); });
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
  if (r !== 'write') pickEx = null;   // 포맷 고르기에서 보여 준 예시 글은 바로 이어지는 쓰기에서만
  if (r === 'pick') return viewPick();
  if (r === 'write') return viewWrite({ fmt: a });
  if (r === 'edit') return viewWrite({ id: a });
  if (r === 'like') return viewWrite({ like: a });
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
// 예전에 검게 떠진 영상 커버(커버를 따로 안 고른 카드): 피드에서 처음 제대로 재생될 때 그 장면으로 바꿔 저장해요
function fixCover(c, i, b, cov) {
  if (!c.id) return;
  Object.assign(b, { ph: cov.ph, tone: cov.tone });
  if (c.pst?.[i]?.bg && c.pst[i].bg !== b) Object.assign(c.pst[i].bg, { ph: cov.ph, tone: cov.tone });
  if (i === 0 && c.bg?.vd === b.vd) Object.assign(c.bg, { ph: cov.ph, tone: cov.tone });
  S.saveCard(c);
}
// 1열(카드 크게 · 아이콘 줄 · 글 한 줄)과 2열(핀터레스트처럼 카드마다 제 비율, 아래는 쓴 때 · ⋯만). 로고 줄 알림 왼쪽 버튼으로 바꾸고, 고른 걸 기억해요 (처음은 2열)
function viewFeed(fresh, quiet) {
  const mine = S.cards(), two = S.pref('cols', 2) === 2;
  app.innerHTML = `<div class="amb"><div class="mo"></div><b></b><b></b><b></b><i></i><i></i><s></s></div><header class="ftop"><div class="logo">dayzine</div><div class="rt"><button class="cb" data-a="cols" aria-label="${two ? '1열로 보기' : '2열로 보기'}">${ic(two ? 'one' : 'grid')}</button><button class="cb" data-a="bell" aria-label="알림">${ic('bell')}</button></div></header><div class="bn${two ? ' two' : ''}" hidden></div>
    <main class="feed${two ? ' two' : ''}">${two ? '<div class="mc"></div><div class="mc"></div>' : ''}</main>${nav('home')}`;
  bindNav(); $('[data-a=bell]').onclick = soon;
  const feed = $('.feed');
  // 내 카드가 적으면 우리 카드(포맷 예시)를 아래에. N년 전 오늘 카드는 위에서 두 번째, NEW 포맷 카드는 8장마다 하나
  const list = mine.map(c => ({ c }));
  const rec = recallOf(mine);
  if (rec) list.splice(Math.min(1, list.length), 0, { c: rec.c, x: { recall: rec.n } });
  if (mine.length >= 8) promoFormats(mine).forEach((f, i) => { const at = (i + 1) * 9 - 1; if (at <= list.length) list.splice(at, 0, { c: sampleCard(f, S.today()), x: { promo: true } }); });
  if (mine.length < 6) list.push(...ORDER.map(f => ({ c: sampleCard(f, S.today()) })));
  if (two) {   // 더 짧은 열에 차례로 (높이 = 비율 + 아래 줄)
    const cols = $$('.mc', feed), h = [0, 0];
    list.forEach(({ c, x }) => { const i = h[1] < h[0] ? 1 : 0; cols[i].appendChild(feedItem(c, true, x)); h[i] += arOf(c) + .16; });
  } else list.forEach(({ c, x }) => feed.appendChild(feedItem(c, false, x)));
  banner(rec);
  // 1열 ↔ 2열: 보던 카드가 바뀐 화면에서도 가운데에 오게
  $('[data-a=cols]').onclick = () => {
    const k = scrollY > 40 ? cur?.dataset.k : null; S.setPref('cols', two ? 1 : 2);   // 맨 위에서 바꾸면 맨 위 그대로
    cleanup?.(); cleanup = null; viewFeed(null); scrollTo(0, 0);
    const it = k && $(`.feed .fi[data-k="${k}"]`);   // 첫 카드면 맨 위 그대로
    if (it && it !== $('.feed .fi')) { const put = () => it.scrollIntoView({ block: 'center' }); put(); setTimeout(put, 400); }
  };

  // 화면에 보이는 카드는 모두 움직이고(아트 · 그림 문장 · 영상), 밖으로 나가면 멈춰요. 바탕 색은 가운데 카드
  // 오로라: 화면 가운데에 고정된 둥근 번짐. 두 겹을 번갈아 켜서 색이 천천히 바뀌어요 (아이폰도 모서리 없이)
  const amb = $('.amb'), gl = $$('i', amb); let gi = 0, gc = '';
  const stopMood = paintMood(amb);
  const glow = t => { if (!t || t === gc) return; gc = t; gi ^= 1; gl[gi].style.background = `radial-gradient(closest-side, ${t}, transparent)`; gl[gi].classList.add('on'); gl[gi ^ 1].classList.remove('on'); };
  let raf = 0, cur = null;
  const pickMid = () => {
    raf = 0;
    const mid = innerHeight * .45; let best = null, bd = 1e9;
    $$('.feed .fi').forEach(it => {
      const r = it.querySelector('.fx').getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - mid), on = r.bottom > 0 && r.top < innerHeight;
      if (d < bd) { bd = d; best = it; }
      if (on === it.classList.contains('play')) return;
      it.classList.toggle('play', on);
      if (on && !it.dataset.seen) { it.dataset.seen = 1; it.classList.add('intro'); setTimeout(() => it.classList.remove('intro'), 1800); if (it.dataset.promo) promoSeen(it._card.fmt); }
    });
    if (best === cur) return;
    cur = best; if (cur) glow(cur.dataset.tone);
  };
  // 로고 줄: 내리면 숨고, 올리면 바로 다시 (맨 위에선 늘 보여요)
  const head = $('.ftop'); let lastY = scrollY;
  const onHead = () => {
    const y = scrollY, dy = y - lastY; lastY = y;
    if (focus) return;
    head.classList.toggle('stuck', y > 8);
    if (y <= 8) head.classList.remove('up'); else if (dy > 6) head.classList.add('up'); else if (dy < -2) head.classList.remove('up');
  };
  const onScroll = () => { onHead(); if (!raf) raf = requestAnimationFrame(pickMid); };
  addEventListener('scroll', onScroll, { passive: true });
  const onVis = () => document.body.classList.toggle('paused', document.hidden);
  document.addEventListener('visibilitychange', onVis);
  // 아트 배경은 가운데 카드만 그림 자체가 흘러요: 빛줄기가 천천히 일렁이고 색이 줄기를 따라 흘러요 (그래픽 칩으로 화면 속도대로)
  let anim = 0, feedTimer = 0; const t0 = performance.now(), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let nt = 0;
  const tick = now => {
    anim = requestAnimationFrame(tick);
    if (document.hidden) return;
    if (++nt % 20 === 0) pickMid();   // 스크롤 없이 카드가 화면에 들어와도 (장 나누기 · 사진이 늦게 오면)
    $$('.fi.play .view canvas.bgc').forEach(cv => cv.width && drawCode(cv, +cv.dataset.seed, +cv.dataset.shift || 0, (now - t0) / 1000 + .01));
    feedVideo();
  };
  // 영상도 화면에 보이는 카드들 (여러 장이면 보이는 장, 가운데에 가까운 순서로 최대 4개). 크게 보기 중에는 그 카드만. 나머지는 커버 장면
  const one = (cv, c) => { const pg = cv.closest('.pg'), i = +(pg?.dataset.i || 0), b = pageBg(c, i); return b?.vd ? { cv, b, fid: c.filter, onCover: cov => fixCover(c, i, b, cov) } : null; };
  const feedVideo = () => {
    if (document.hidden) return V.sync([]);
    if (focus) { const cv = $('canvas.bgv', focus.box); return V.sync(cv ? [one(cv, focus.c)].filter(Boolean) : []); }
    const mid = innerHeight * .45, out = [];
    $$('.feed .fi.play').forEach(it => {
      const cv = $$('.view canvas.bgv', it).find(x => { const r = x.getBoundingClientRect(), w = x.closest('.view').getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight && r.left > w.left - r.width / 2 && r.left < w.left + r.width / 2; });
      const o = cv && one(cv, it._card); if (o) { const r = cv.getBoundingClientRect(); o.d = Math.abs((r.top + r.bottom) / 2 - mid); out.push(o); }
    });
    V.sync(out.sort((a, b) => a.d - b.d));
  };
  if (!still) anim = requestAnimationFrame(tick); else feedTimer = setInterval(() => { pickMid(); feedVideo(); }, 300);
  cleanup = () => { stopMood(); cancelAnimationFrame(anim); clearInterval(feedTimer); V.stop(); removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); closeFocus(true); };
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
// 1열 아래: 책갈피 · 저장 · 고치기 · 이 포맷으로 쓰기 · 글만보기 · 지우기 · 장 수(여러 장일 때) / 글 첫머리 한 줄 / 언제 썼는지
// tile = 2열 칸: 카드 + [쓴 때 · ⋯] (여러 장이면 카드 위 오른쪽에 1/N). 우리 카드는 [NEW 이름 · ✎]
// x.recall = N년 전 오늘로 위에 한 번 더 나온 카드, x.promo = 피드 중간의 NEW 포맷 카드
function feedItem(c, tile, x = {}) {
  const it = document.createElement('article'); it.className = 'fi' + (tile ? ' tile' : ''); it.dataset.tone = toneOf(c); if (c.id && !x.recall) it.dataset.id = c.id; it.dataset.k = x.recall ? 'r:' + c.id : x.promo ? 'p:' + c.fmt : c.id || 's:' + c.fmt; it._card = c;
  if (x.promo) it.dataset.promo = 1;
  const f = FORMATS[c.fmt], when = x.recall ? `<i class="rc">${x.recall}년 전 오늘</i>` : ago(c);
  it.innerHTML = tile
    ? `<div class="fx"><div class="view"></div><span class="pc bd" hidden></span></div>
      <p class="mt">${c.sample ? `<span><i class="nw">NEW</i>${f.name}</span><button class="cb" data-a="use" aria-label="이 포맷으로 쓰기">${ic('pen')}</button>`
        : `<span>${when}</span><button class="cb" data-a="more" aria-label="더 보기">${ic('more')}</button>`}</p>`
    : `${c.sample ? '' : `<p class="when"><span>${when}</span><i>${LABEL[c.fmt] || ''}</i></p>`}<div class="fx"><div class="view"></div></div>
    <div class="row">${c.sample
      ? `<div class="ours">${f.name}<i>NEW</i></div><button class="cb" data-a="use" aria-label="이 포맷으로 쓰기">${ic('pen')}</button>`
      : `<div class="l"><button class="cb ${c.mark ? 'on' : ''}" data-a="mark" aria-label="책갈피">${ic('bookmark')}</button><button class="cb" data-a="save" aria-label="사진에 저장">${ic('save')}</button><button class="cb" data-a="edit" aria-label="고치기">${ic('pen')}</button><button class="cb" data-a="like" aria-label="이 포맷으로 쓰기">${ic('grid')}</button><button class="cb" data-a="read" aria-label="글만보기">${ic('read')}</button><button class="cb" data-a="del" aria-label="지우기">${ic('trash')}</button><span class="pc" hidden></span></div>`}</div>
    <p class="ex"></p>`;
  const fx = $('.fx', it), view = $('.view', it), pc = $('.pc', it);
  // 9:16은 자르지 않고 4:5 높이에 맞춰 가운데로. 양옆은 같은 카드 배경을 흐리고 조금 어둡게 깔아요 (글 · 날짜 · 서명은 빼고, 1열 피드에서만)
  if (!tile && arOf(c) > 1.5) {
    fx.classList.add('tall');
    const blr = document.createElement('div'); blr.className = 'blr'; blr.setAttribute('aria-hidden', 'true'); fx.prepend(blr);
    mount(blr, { ...c, pages: c.pages ? [''] : c.pages, pst: c.pst ? [c.pst[0]].filter(Boolean) : c.pst, html: c.html != null ? '&nbsp;' : c.html, place: '', showDate: false, datePos: 'none', sg: '', signTxt: '' });
  }
  const ex = $('.ex', it), line = () => cardText(c).replace(/\s+/g, ' ').trim();
  if (!tile) ex.textContent = line();   // 글 첫머리 한 줄 (길면 …)
  mount(view, c);
  pageInto(view, c, (i, n) => { if (pc) { pc.hidden = false; pc.textContent = `${i}/${n}`; } });
  fx.addEventListener('click', () => openFocus(it, c));
  const on = (k, fn) => { const b = $(`[data-a=${k}]`, it); if (b) b.onclick = fn; };
  on('use', () => go(`#/write/${c.fmt}`));
  on('edit', () => go(`#/edit/${c.id}`));
  on('save', () => saveCard(c));
  const mark = () => { c.mark = !c.mark; S.saveCard(c); $('[data-a=mark]', it)?.classList.toggle('on', c.mark); toast(c.mark ? '책갈피에 넣었어요' : '책갈피에서 뺐어요'); };
  const del = async () => {   // 한 번 물어보고 지워요. 지운 카드는 휴지통에 30일
    if (!(await ask('이 카드를 지울까요?', '삭제'))) return;
    S.removeCard(c.id); $$(`.feed .fi[data-k="${c.id}"], .feed .fi[data-k="r:${c.id}"]`).forEach(x => x.remove());
  };
  // 글만보기 (1열): 요약 한 줄 ↔ 글 전체. 다시 누르면 접혀요
  on('read', () => {
    const open = !ex.classList.contains('open');
    ex.classList.toggle('open', open); ex.textContent = open ? cardText(c).replace(/\n{3,}/g, '\n\n').trim() : line();
    $('[data-a=read]', it).classList.toggle('on', open);
  });
  on('mark', mark); on('del', del); on('like', () => go(`#/like/${c.id}`));
  // ⋯: 책갈피 · 이미지 저장 · 고치기 · 이 포맷으로 쓰기 | 지우기. 위에 날짜 · 종류
  on('more', () => sheet(`${+c.date.slice(5, 7)}월 ${+c.date.slice(8, 10)}일 · ${LABEL[c.fmt] || ''}`, [[
    { icon: 'bookmark', label: c.mark ? '책갈피 빼기' : '책갈피', run: mark },
    { icon: 'save', label: '이미지 저장', run: () => saveCard(c) },
    { icon: 'pen', label: '고치기', run: () => go(`#/edit/${c.id}`) },
    { icon: 'grid', label: '이 포맷으로 쓰기', run: () => go(`#/like/${c.id}`) },
    { icon: 'read', label: '글만보기', run: () => openRead(c) },
  ], [{ icon: 'trash', label: '지우기', red: true, run: del }]]));
  return it;
}
// N년 전 오늘: 오늘과 같은 월 · 일에 예전 해에 쓴 카드 (가장 최근 해 하나)
function recallOf(mine) {
  const t = S.today(), md = t.slice(5), y = +t.slice(0, 4);
  const c = mine.find(m => m.date?.slice(5) === md && +m.date.slice(0, 4) < y);
  if (c) return { c, n: y - +c.date.slice(0, 4) };
  // 테스트 동안만: 맞는 카드가 없으면 가장 오래된 내 카드를 1년 전 오늘로 (출시 전에 TEST_RECALL = false)
  const old = TEST_RECALL && mine.filter(m => m.date && m.date < t).at(-1);
  return old ? { c: old, n: 1 } : null;
}
const TEST_RECALL = true;
// NEW 포맷 카드: 아직 안 써 본 포맷만, 하루에 한 번씩 세서 3번 보면 더는 안 나와요
function promoFormats(mine) {
  const seen = S.pref('promo', {});
  return ORDER.filter(f => !mine.some(m => m.fmt === f) && (seen[f]?.n || 0) < 3);
}
function promoSeen(f) {
  const seen = S.pref('promo', {}), d = S.today(), o = seen[f] || { n: 0 };
  if (o.d === d) return;
  seen[f] = { n: o.n + 1, d }; S.setPref('promo', seen);
}

// 위 배너: 지금은 N년 전 오늘 (맞는 카드가 있을 때만). 공지가 생기면 같은 자리 · 같은 모양으로 공지가 먼저 (한 번에 하나).
// 하루 한 번: 누르거나 옆으로 밀거나 ✕ 하면 그날은 끝. 누르면 그 카드가 크게 열려요
function banner(rec) {
  const el = $('.bn'), day = S.today();
  if (!el || !rec || S.pref('bnDay') === day) return;
  const c = rec.c;
  el.hidden = false;
  el.innerHTML = `<div class="th"></div><div class="tx">${rec.n}년 전 오늘<small>${esc(cardText(c).replace(/\s+/g, ' ').trim() || LABEL[c.fmt] || '')}</small></div><button class="cb" data-a="x" aria-label="닫기">${ic('close')}</button>`;
  mount($('.th', el), c);
  const done = () => { S.setPref('bnDay', day); el.classList.add('gone'); setTimeout(() => { el.hidden = true; el.classList.remove('gone'); el.style.transform = ''; }, 260); };
  $('[data-a=x]', el).onclick = e => { e.stopPropagation(); done(); };
  let x0 = null, dx = 0;
  el.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; });
  el.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; if (Math.abs(dx) > 6) { el.style.transition = 'none'; el.style.transform = `translateX(${dx}px)`; } });
  const up = () => {
    if (x0 == null) return; x0 = null; el.style.transition = '';
    if (Math.abs(dx) > 70) { el.style.transform = `translateX(${dx > 0 ? 110 : -110}%)`; done(); } else el.style.transform = '';
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('click', e => {
    if (Math.abs(dx) > 6 || e.target.closest('[data-a=x]')) return;
    const it = $(`.feed .fi[data-k="r:${c.id}"]`) || $(`.feed .fi[data-k="${c.id}"]`);
    done(); if (it) openFocus(it, c);
  });
}

// 글만보기 (2열 ⋯): 포맷과 상관없이 글만, 한 가지 글꼴 · 크기. 바탕은 무료 그라데이션 중 하나 + 살짝 어둡게. 누르면 닫혀요
function openRead(c) {
  const gs = FREE.filter(b => b.kind === 'g'), b = gs[Math.floor(Math.random() * gs.length)];
  const parts = c.fmt === 'rebus' ? [cardText(c)] : (c.pages || []).map(h => cardText({ ...c, pages: [h] }));
  const d = c.date || S.today(), place = (c.place || '').trim();
  const rv = document.createElement('div'); rv.className = 'rv';
  rv.innerHTML = `<div class="rbg" style="background:${b.css}"></div><div class="rin"><p class="dl">${+d.slice(0, 4)}년 ${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일${place ? ' · ' + esc(place) : ''}</p>
    ${parts.map(t => t.replace(/\n{3,}/g, '\n\n').trim()).filter(Boolean).map(t => `<div class="tx">${esc(t)}</div>`).join('<div class="pb"></div>')}</div>`;
  document.body.appendChild(rv);
  requestAnimationFrame(() => requestAnimationFrame(() => rv.classList.add('in')));
  rv.addEventListener('click', () => { rv.classList.remove('in'); setTimeout(() => rv.remove(), 300); });
}

// 비슷한 카드 (크게 보기 끝): 내 카드 중 다른 해 같은 날 → 같은 장소 → 같은 종류 · 배경 → 가까운 날짜 순으로 5장
function related(c) {
  const day = x => Date.parse((x.date || '') + 'T12:00:00') / 864e5;
  const t = day(c), place = (c.place || '').trim();
  return S.cards().filter(m => m.id !== c.id).map(m => {
    let sc = 0;
    if (m.date?.slice(5) === c.date?.slice(5) && m.date !== c.date) sc += 100;
    if (place && (m.place || '').trim() === place) sc += 50;
    if (m.fmt === c.fmt) sc += 15;
    if (c.bg?.id && m.bg?.id === c.bg.id) sc += 20;
    sc += Math.max(0, 10 - Math.abs(day(m) - t) / 3);
    return { m, sc };
  }).sort((a, b) => b.sc - a.sc).slice(0, 5).map(x => x.m);
}
function relHtml(list) {
  return list.length ? `<h4>비슷한 카드</h4><div class="rl">${list.map(m => `<button class="rr" data-id="${m.id}"><div class="th"></div><div class="m"><small>${+m.date.slice(0, 4)}년 ${+m.date.slice(5, 7)}월 ${+m.date.slice(8, 10)}일 · ${LABEL[m.fmt] || ''}</small><p>${esc(cardText(m).replace(/\s+/g, ' ').trim())}</p></div></button>`).join('')}</div>` : '';
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
  // 피드 칸 크기로 줄이면서 칸 밖(긴 카드의 아래쪽)은 같은 움직임으로 잘라요: 위 · 아래가 함께 들어가요
  const clip = () => `inset(0 0 ${Math.max(0, H - r.height * T / r.width)}px 0 round ${6 * T / r.width}px)`;
  const from = () => { const b = box.getBoundingClientRect(), k = r.width / T; return `translate(${r.left - b.left}px,${r.top - b.top}px) scale(${k})`; };
  box.style.transition = 'none'; box.style.transform = from(); box.style.clipPath = clip(); view.style.visibility = 'hidden';
  // 뒤 피드는 그대로(보던 자리 유지)
  ov.addEventListener('wheel', e => { if (sc.scrollHeight <= sc.clientHeight) e.preventDefault(); }, { passive: false });
  requestAnimationFrame(() => requestAnimationFrame(() => { box.style.transition = ''; ov.classList.add('in'); box.style.transform = ''; box.style.clipPath = 'inset(0 0 0 0 round 0px)'; }));
  ov.addEventListener('click', () => closeFocus());
  focus = { ov, box, view, from, clip, y: scrollY, c };
  if (!c.sample && c.id) {   // 끝에 비슷한 카드: 누르면 그 카드가 이 화면에서 바뀌고, 닫으면 처음 연 카드 자리로
    const rel = document.createElement('div'); rel.className = 'rel'; sc.appendChild(rel);
    const fill = cc => {
      rel.innerHTML = relHtml(related(cc));
      $$('.rr', rel).forEach(b => { const m = S.card(b.dataset.id), th = $('.th', b); th.style.background = toneOf(m); th.classList.toggle('short', arOf(m) < 1.25); mount(th, m); b.onclick = e => { e.stopPropagation(); swap(m); }; });
    };
    const swap = m => {
      box.innerHTML = ''; const el2 = renderCard(m); box.appendChild(el2); fitCard(el2, m);
      box.style.marginTop = Math.max((innerHeight - box.offsetHeight - 120) / 2, (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-t')) || 0) + 16) + 'px';
      focus.c = m; focus.swapped = true; fill(m); sc.scrollTo(0, 0);
    };
    fill(c);
  }
}
function closeFocus(now) {
  if (!focus || focus.closing) return;
  const f = focus; f.closing = true;
  const done = () => { f.view.style.visibility = ''; f.ov.remove(); if (scrollY !== f.y) scrollTo(0, f.y); focus = null; };
  if (now) return done();
  if (f.swapped) { f.view.style.visibility = ''; f.ov.classList.add('fade'); return setTimeout(done, 300); }   // 다른 카드로 바꿨으면 그냥 사라지고 처음 자리 그대로
  f.ov.classList.remove('in'); f.box.style.transform = f.from(); f.box.style.clipPath = f.clip();
  setTimeout(done, 380);
}

/* ── 포맷 고르기 ─────────────────────────────────────── */
// 예시 글을 하나 골라 글 · 아트 · 포토 카드에 보여 주고, 쓰기로 들어가면 같은 글이 흐리게 이어져요 (그림 문장은 정해 둔 예시)
let pickEx = null;
function viewPick() {
  const d = S.draft();
  pickEx = exampleText();
  const sample = f => { const c = sampleCard(f, S.today()); if (FORMATS[f].rich) c.pages = [esc(pickEx.t)]; return c; };
  const items = [...(d ? [{ key: 'draft', card: d.card, label: '이어 쓰기' }] : []), ...ORDER.map(f => ({ key: f, card: sample(f), label: FORMATS[f].name }))];
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

// 이 포맷으로 쓰기: 그 카드의 모습(배경 · 글꼴 · 크기 · 비율 · 날짜 줄 · 서명 자리)을 그대로, 글은 비우고 날짜는 오늘로.
// 내 사진 · 영상은 그 카드 것이라 빼요 (포토 포맷은 빈 사진 자리로)
function likeCard(src) {
  if (!src || !FORMATS[src.fmt]) return null;
  const c = blank(src.fmt, S.today()), noPh = b => b?.id === 'photo' ? { id: 'photo', dim: b.dim || 'dark' } : clone(b);
  ['font', 'size', 'ratio', 'lh', 'bold', 'ink', 'inkPos', 'align', 'datePos', 'dh', 'showDate', 'placeOff', 'sg', 'filter'].forEach(k => { if (src[k] !== undefined) c[k] = clone(src[k]); });
  c.signTxt = S.pref('sign', src.signTxt || '');
  if (src.bg && c.pages) c.bg = noPh(src.bg);   // 아트 그림도 같은 씨앗 그대로
  if (src.pst?.[0] && c.pages) c.pst = [{ bg: noPh(src.pst[0].bg), align: clone(src.pst[0].align) }];
  if (FORMATS[c.fmt].rich) c.ex = exampleText();
  return c;
}

/* ── 쓰기 ───────────────────────────────────────────── */
// 시안(write2) 그대로: 위 줄 · 날짜·제목·장소 · 카드(모든 포맷 카드 위에 바로 써요) · 도구 줄 · 키보드 자리(키보드 또는 패널)
// 키보드 처리는 지금 앱(shell.js trackKeyboard · editor.css)에서 아이폰으로 검증한 방식을 그대로 써요:
// 키보드가 있을 때만 보이는 화면(--vvt · --vvh)에 맞춰 고정. 카드는 키보드 위 공간에 통째로 들어가는 크기로 한 번 정하고 바꾸지 않아요
function viewWrite({ fmt, id, like }) {
  const isNew = !id;
  let card;
  if (id) card = S.card(id);
  else if (fmt === 'draft') card = S.draft()?.card;
  else if (like) card = likeCard(S.card(like));
  else {   // 새 카드는 마지막에 쓴 글꼴 · 날짜 줄 · 비율 · 서명 자리로
    card = blank(fmt, S.today());
    if (card.fmt === 'text') { card.font = fontOf(S.pref('font', card.font)).id; const dp = S.pref('datePos', ''); if (dp === 'top' || dp === 'bottom') card.datePos = dp; const dh = S.pref('dh', ''); if (dh) card.dh = dh; }
    card.showDate = S.pref('showDate:' + card.fmt, dateOn(card));
    card.ratio = S.pref('ratio', '45'); card.sg = S.pref('sg', ''); card.signTxt = S.pref('sign', '');
    if (FORMATS[card.fmt]?.rich) card.ex = pickEx || exampleText();   // 흐린 예시 글: 질문 7 · 문장 3 (디자인 포맷은 정해 둔 예시). 포맷 고르기에서 본 그 글
    pickEx = null;
  }
  if (!card || !FORMATS[card.fmt]) return go('#/');
  const f = FORMATS[card.fmt], rich = !!f.rich;   // 장으로 쓰는 포맷(글 · 아트)
  if (!rich && card.html == null) { card.html = renderCard(card).querySelector('.rb').innerHTML; card.html = clean(card.html); delete card.text; }
  const st = { panel: null, tab: 'fmt', hist: [clone(card)], hi: 0, timer: 0, pg: 0, sel: null, composing: false };
  const root = document.documentElement;
  // 장마다 배경 · 글 위치 (글카드). ps() = 보고 있는 장의 값(없으면 카드 값으로 채워요). 첫 장 값은 card.bg · align에도 (피드 색 · 예전 카드)
  const ps = (i = st.pg) => {
    if (!rich) return card;
    card.pst = card.pages.map((_, j) => card.pst?.[j] || { bg: clone(card.bg), align: clone(card.align || { h: 'l', v: 'm' }) });
    return card.pst[i];
  };
  const syncFirst = () => { if (rich && card.pst?.[0]) { card.bg = clone(card.pst[0].bg); card.align = clone(card.pst[0].align); } };
  const pgLab = () => rich && card.pages.length > 1 ? `${st.pg + 1}장` : null;   // 여러 장이면 몇째 장이 바뀌었는지

  root.classList.add('wmode');
  // 키보드를 내린 스타일 보기(큰 카드 + 3줄)와 키보드를 올린 쓰기 보기(1줄). 모든 줄은 같은 7칸이라 세로로 맞아요 (늘어도 최대 8칸)
  // 1줄 = 탭: 스타일 키보드 · 서식 · 글꼴 · 배경 · 셔플 · 되돌리기 · 다시하기 / 쓰기: 키보드 · 이모티콘 · 새 장 · 사진 · (빈칸) · 되돌리기 · 다시하기
  // 2줄 = 고른 탭의 선택지 (서식: 크기 · 좌우 · 위아래 / 글꼴: ‹ › + 이름 / 배경: 사진 · 밝게어둡게 + 색)
  // 포토 포맷은 쓰는 중 줄에 사진 칸이 없어요 (팔레트 1칸 · 빈 장 가운데 버튼에서 골라요)
  // 8칸: 스타일 보기 = 키보드 · 비율 · 서식 · 글꼴 · 배경 · 셔플/필터 · ↶ · ↷ / 쓰기 보기 = 키보드 · 이모티콘 · 새 장 · 사진 · 빈칸 · 빈칸 · ↶ · ↷.
  // 지금 못 쓰는 칸은 숨겨요(빈칸). 되돌리기 · 다시하기만 흐리게 남아요
  const T1 = [['kb', ''], ['ratio', 's'], ['fmt', 's'], ['font', 's'], ['bg', 's'], [f.tools.filter ? 'filter' : 'shuf', 's'], ['emo', 'w'], ['page', 'w'], [f.tools.bg === 'photo' ? '' : 'photo', 'w'], ['', 'w'], ['', 'w'], ['undo', ''], ['redo', '']];
  app.innerHTML = `<div class="wr ${rich ? 'rich' : 'plain'}">
    <header class="top"><button class="cb" data-a="back" aria-label="뒤로">${ic('back')}</button><div class="nm stt"></div><button class="cb w" data-a="ok" aria-label="완료">${ic('check')}</button></header>
    <div class="area"><section class="stage"></section></div>
    <div class="tb g6">${T1.map(([k, m]) => k ? `<button class="k t ${m} ${k === 'ratio' ? 'rt' : ''}" data-t="${k}" aria-label="${k}">${k === 'ratio' ? '' : ic(k)}</button>` : `<span class="${m}"></span>`).join('')}</div>
    <div class="st2 g6"></div>
    <div class="st3 g6">
      <button class="wide w4 inf" aria-label="날짜 · 장소 · 서명"><span></span></button><button class="k dpc" aria-label="날짜 줄 자리"></button><button class="k sgc" aria-label="서명 자리"></button><button class="wide w2 vio svb" aria-label="이미지 저장">${ic('save')}<span>이미지 저장</span></button>
    </div>
    <div class="ipn">
      <div class="g6"><button class="wide w8 dt" aria-label="날짜">${ic('date')}<span></span></button></div>
      <div class="g6"><label class="wide w8 pl">${ic('pin')}<input class="pi" maxlength="20" placeholder="장소" aria-label="장소" enterkeyhint="next"></label></div>
      <div class="g6"><label class="wide w8 sl">${ic('pen')}<input class="si" maxlength="24" placeholder="서명" aria-label="서명" enterkeyhint="done"></label></div>
      <div class="g6"><button class="wide w8 ok" aria-label="닫기">닫기</button></div>
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
    if (wasOpen && !open && !st.panel && infOpen() && !document.activeElement?.matches?.('.ipn input')) closeInf();   // 키보드 위 ✓로 내려도 날짜 · 장소 · 서명 화면을 닫아요
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
    clearTimeout(st.timer); clearTimeout(st.waitT); clearTimeout(st.popT); V.stop();
    root.classList.remove('wmode', 'kb-open', 'pan');
  };

  /* 카드 크기는 하나: 쓰는 동안에도 화면 폭(양옆 16)을 그대로 써요. 키보드에 가려지는 아래쪽은 커서를 따라 화면이 움직여요 */
  const sizes = { w: 0, v: 0 };
  function sizeCard() {
    // 쓰기 보기 = 화면 폭(양옆 16). 스타일 보기 = 카드 한 장(4:5)이 다 보이는 크기 (작은 폰에서는 조금 좁아져요)
    const area = $('.area'), styleView = !wr.classList.contains('typ') && !wr.classList.contains('inf') && !root.classList.contains('kb-open');
    sizes.w = Math.floor(Math.max(160, wr.clientWidth - 32));
    if (styleView && area.clientHeight) sizes.v = Math.min(sizes.w, Math.floor((area.clientHeight - 20) / arOf(card)));
    else if (!sizes.v) sizes.v = sizes.w;
    applySize(true);
  }
  function applySize(force) {
    const writing = wr.classList.contains('typ') || wr.classList.contains('inf') || root.classList.contains('kb-open') || root.classList.contains('pan');
    let cw = writing ? sizes.w : sizes.v;
    if (wr.classList.contains('inf')) { const ah = $('.area').clientHeight; if (ah > 40) cw = Math.max(80, Math.min(sizes.w, Math.floor((ah - 12) / arOf(card)))); }   // 날짜 · 장소 · 서명 화면: 카드 한 장이 다 보이게 줄여요
    if (!force && wr.style.getPropertyValue('--cw') === cw + 'px') return;
    wr.style.setProperty('--cw', cw + 'px'); wr.style.setProperty('--ar', arOf(card));
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
    if (!hasText()) return (nm.textContent = card.ex?.by || '');   // 예시가 문장이면 위 가운데에 작가 이름
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

  /* 아래 줄: 날짜 · 장소 · 서명 글자(4칸, 누르면 키보드 화면에서 셋을 같이 입력) · 날짜 줄 자리(상좌 → … → 하우 → 꺼짐) · 서명 자리(좌 → 중 → 우 → 꺼짐) · 이미지 저장(2칸).
     키보드 화면은 입력만: 날짜(누르면 달력) · 장소 · 서명. 자리는 카드 전체가 보이는 쓰기 화면에서 정해요 */
  const ipn = $('.ipn'), infb = $('.st3 .inf'), dpc = $('.st3 .dpc'), sgc = $('.st3 .sgc'), dtb = $('.ipn .dt'), pi = $('.ipn .pi'), si = $('.ipn .si'), recent = $('.recent');
  const DPS = [['top', 'l', '상좌'], ['top', 'c', '상중'], ['top', 'r', '상우'], ['bottom', 'l', '하좌'], ['bottom', 'c', '하중'], ['bottom', 'r', '하우']];
  const SGN = { l: '서명 · 왼쪽', c: '서명 · 가운데', r: '서명 · 오른쪽' };
  function paintMeta() {
    const dOn = dateOn(card), sg = signOf(card);
    const parts = [dOn ? dateChip(card.date) : '', placeOn(card) ? card.place.trim() : '', sg ? card.signTxt.trim() : ''].filter(Boolean);   // 켜 둔 것만 카드에 보이는 그대로
    $('span', infb).textContent = parts.join(' · ') || '날짜 · 장소 · 서명'; infb.classList.toggle('mo', !parts.length);
    $('span', dtb).textContent = dateChip(card.date);
    if (document.activeElement !== pi) pi.value = card.place || '';
    if (document.activeElement !== si) si.value = card.signTxt || '';
    dpc.innerHTML = ic(dOn ? 'p' + infoPos(card)[0] + (card.dh || 'l') : 'poff'); dpc.classList.toggle('hid', !f.tools.dp);
    sgc.innerHTML = ic(sg ? { l: 'sl', c: 'sc', r: 'sr' }[sg] : 'soff');
  }
  const infOpen = () => wr.classList.contains('inf');
  function openInf() { if (st.panel) closePanel(false); wr.classList.add('inf'); paintMeta(); applySize(true); }
  function closeInf() {
    if (!infOpen()) return;
    if (st.panel === 'date') closePanel(false);
    wr.classList.remove('inf', 'ki'); document.activeElement?.blur?.(); flush(); paintMeta(); applySize(true);
    setTimeout(() => { if (!document.activeElement?.matches?.('input, .body')) { scrollTo(0, 0); kb(); } }, 300);
  }
  // 날짜 · 장소 · 서명 칸: 키보드 화면을 열고 장소에 커서 (아이폰은 누르는 순간에 커서를 넣어야 키보드가 올라와요)
  infb.addEventListener('pointerdown', e => { e.preventDefault(); openInf(); pi.focus({ preventScroll: true }); });
  $$('button', ipn).forEach(b => b.addEventListener('pointerdown', e => e.preventDefault()));
  $('.ok', ipn).onclick = closeInf;
  // 날짜: 키보드 자리에 우리 달력 판 (세 줄은 위에 그대로). 고르면 다시 장소로
  dtb.onclick = () => { flush(); if (st.panel === 'date') return closePanel(false); document.activeElement?.blur?.(); st.calM = card.date.slice(0, 7); openPanel('date'); };
  // 날짜 줄 자리: 상좌 → 상중 → 상우 → 하좌 → 하중 → 하우 → 꺼짐 (꺼도 날짜 · 장소 값은 그대로)
  dpc.addEventListener('pointerdown', e => e.preventDefault());
  dpc.onclick = () => {
    flush();
    const i = dateOn(card) ? DPS.findIndex(([v, h]) => v === infoPos(card) && h === (card.dh || 'l')) : -1, n = DPS[i + 1];
    if (n) { card.showDate = true; card.datePos = n[0]; card.dh = n[1]; pop(n[2], null, '날짜 줄'); } else { card.showDate = false; pop('꺼짐', null, '날짜 줄'); }
    paintMeta(); push(); draw();
  };
  // 서명 자리: 좌 → 중 → 우 → 꺼짐. 적어 둔 서명이 없으면 키보드 화면의 서명 줄로
  sgc.addEventListener('pointerdown', e => {
    e.preventDefault(); flush();
    const txt = (card.signTxt || S.pref('sign', '')).trim();
    if (!txt) { openInf(); return si.focus({ preventScroll: true }); }
    card.signTxt = txt; card.sg = { '': 'l', l: 'c', c: 'r', r: '' }[card.sg || ''] ?? '';
    paintMeta(); push(); draw(); pop(card.sg ? SGN[card.sg] : '서명 꺼짐');
  });
  // 장소: 쓰는 대로 카드에. 키보드 위에 최근 장소
  function paintRecent() {
    const q = pi.value.trim(), all = S.pref('places', []);
    const list = all.filter(x => x !== q && (!q || x.includes(q))).slice(0, 10);
    recent.innerHTML = list.map(x => `<button class="chip2">${esc(x)}</button>`).join('');
    recent.classList.toggle('none', !list.length || document.activeElement !== pi);
    $$('button', recent).forEach((b, i) => {
      b.addEventListener('pointerdown', e => e.preventDefault());
      b.onclick = () => { pi.value = list[i]; card.place = list[i]; card.placeOff = false; paintMeta(); draw(); push(); si.focus({ preventScroll: true }); };
    });
  }
  pi.addEventListener('input', () => { card.place = pi.value; card.placeOff = false; if (pi.value.trim() && !dateOn(card)) card.showDate = true; paintMeta(); paintRecent(); draw(); pushLater(); });
  si.addEventListener('input', () => {
    const v = si.value.trim(); card.signTxt = v;
    if (v && !card.sg) card.sg = S.pref('sgLast', 'r');   // 서명을 적으면 켜져요 (마지막에 둔 자리, 처음엔 오른쪽)
    paintMeta(); draw(); pushLater();
  });
  pi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); si.focus({ preventScroll: true }); } });
  si.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); closeInf(); } });
  [pi, si].forEach(x => {
    x.addEventListener('focus', () => { if (!infOpen()) openInf(); if (st.panel) closePanel(false); wr.classList.add('ki'); paintRecent(); applySize(true); });
    x.addEventListener('blur', () => { setTimeout(() => { if (!document.activeElement?.matches?.('.ipn input')) { wr.classList.remove('ki'); paintRecent(); } }, 0); if (x === si && si.value.trim()) S.setPref('sign', si.value.trim()); flush(); });
  });
  // 글을 누르면 판을 닫고 쓰기로
  stage.addEventListener('pointerdown', () => { if (infOpen()) closeInf(); }, true);
  // 사진 저장: 카드에 정한 그대로 모든 장을 바로 (쓰기 화면에 그대로 있어요. 완료 전이면 아직 쓰는 중)
  const svb = $('.st3 .svb');
  svb.addEventListener('pointerdown', e => e.preventDefault());
  svb.onclick = () => { if (!hasText()) return shake(svb); flush(); saveCard(clone(card)); };

  // 알림은 모두 위 가운데 상태 자리에 1초쯤 (글꼴 이름은 그 글꼴로). 어두운 위 줄이라 어떤 배경에서도 보여요
  function pop(text, font, kind) {   // kind가 있으면 두 줄: 작은 회색 종류 + 이름
    const nm = $('.wr .stt'); clearTimeout(st.popT);
    if (kind) nm.innerHTML = `<small>${esc(kind)}</small>${esc(text)}`; else nm.textContent = text;
    nm.classList.toggle('two', !!kind); nm.classList.add('ntc'); nm.style.fontFamily = font ? fontCssOf(font) : ''; nm.style.fontSize = font ? Math.round(20 * font.k) + 'px' : '';
    if (font) document.fonts?.load(`20px '${font.fam}'`, text);
    nm.classList.remove('flash'); void nm.offsetWidth; nm.classList.add('flash');
    st.popT = setTimeout(() => { st.popT = 0; nm.classList.remove('ntc', 'flash', 'two'); nm.style.fontFamily = nm.style.fontSize = ''; count(); }, 1200);
  }

  /* 카드 그리기. 글만 바뀌면 그 자리에서 바꾸고(키보드가 내려가지 않게), 장 수·배경·날짜 같은 틀이 바뀔 때만 새로 그려요 */
  let el = null, shape = '';
  const look = () => [card.ratio, card.lh, card.bold, card.ink, card.showDate, card.placeOff, card.sg, card.signTxt, card.dh];
  const shapeOf = () => JSON.stringify(rich ? [card.pages.length, card.bg, card.align, card.pst, card.datePos, card.date, card.place, card.font, card.size, card.filter, ...look()] : [card.date, card.place, card.size, card.align, card.datePos, ...look()]);
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
      if (rich) el.addEventListener('scroll', () => { const i = pageAtScroll(); if (i !== st.pg) { st.pg = i; count(); paintRow2(); tools(); syncVideo(); } }, { passive: true });   // 보는 장이 바뀌면 그 장의 배경 · 위치를 보여 줘요
    }
    el.classList.toggle('empty', !hasText());
    fitCard(el, card); tools(); panAxes();
    if (rich) scrollToPage(st.pg, false);
    count(); syncVideo();
  }
  // 영상인 장을 보고 있으면 그 장만 재생 (정지 상태는 기억해요). 다른 장으로 가면 멈추고 커버
  function syncVideo() {
    const pb = rich && el ? ps(st.pg).bg : null, cv = pb?.vd && $(`.pg[data-i="${st.pg}"] canvas.bgv`, el);
    if (cv) V.start(cv, pb, card.filter, { paused: !!st.vpause, onTick: tickTL }); else V.stop();
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
  // 사진이 아직 없는 장(포토 포맷): 가운데 사진 버튼 → 그 장의 사진 고르기 (글쓰기 커서는 안 생겨요)
  stage.addEventListener('pointerdown', e => { if (e.target.closest?.('.phadd')) { e.preventDefault(); e.stopPropagation(); } }, true);
  stage.addEventListener('click', e => { const b = e.target.closest?.('.phadd'); if (!b) return; e.stopPropagation(); st.pg = +b.closest('.pg').dataset.i || 0; pickPhoto(); }, true);
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
    if (i > 0 && !b.textContent) { e.preventDefault(); ps(); card.pages.splice(i, 1); card.pst.splice(i, 1); st.pg = i - 1; push(); draw(); caretEnd(st.pg); }
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
    tools(); panAxes();
  }

  /* 도구 줄. 포맷이 안 쓰는 도구는 어둡게, 누르면 살짝 흔들림 */
  const enabled = k => {
    if (k === 'kb' || k === 'undo' || k === 'redo' || k === 'ratio') return true;
    if (k === 'photo' || k === 'emo' || k === 'page') return !!f.tools[k];
    if (k === 'fmt') return !!f.tools.style;
    if (k === 'font') return !!(f.tools.style && f.tools.font);
    if (k === 'filter') return !!f.tools.filter;
    const v = f.tools[k]; return k === 'shuf' && v === 'code' ? !!findBg(ps().bg?.id).code : !!v;
  };
  function tools() {
    const typ = wr.classList.contains('typ');
    $$('.tb .t').forEach(b => {
      const k = b.dataset.t;
      if (k === 'undo') return b.classList.toggle('off', st.hi <= 0 && !st.timer);
      if (k === 'redo') return b.classList.toggle('off', st.hi >= st.hist.length - 1);
      b.classList.toggle('hid', !enabled(k));
      if (k === 'ratio') b.textContent = RATIOS.find(r => r[0] === (card.ratio || '45'))[1];
      const tab = { ink: 'fmt', hue: 'bg' }[st.tab] || st.tab;
      b.classList.toggle('on', k === 'kb' ? typ && !st.panel : ['fmt', 'font', 'bg', 'filter'].includes(k) ? tab === k && enabled(k) : st.panel === k);
    });
    $('[data-a=ok]').disabled = !hasText();
  }
  const shake = b => { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); };

  $$('.tb .t').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());   // 눌러도 키보드 · 커서가 그대로
    b.onclick = () => {
      const k = b.dataset.t;
      if (b.classList.contains('off') || b.classList.contains('hid')) return shake(b);
      flush();
      if (k === 'ratio') {   // 4:5 → 9:16 → 1:1. 카드 자체가 그 비율로 (저장 이미지도 그대로)
        const i = RATIOS.findIndex(r => r[0] === (card.ratio || '45')), [n, t] = RATIOS[(i + 1) % RATIOS.length];
        card.ratio = n; push(); sizeCard(); draw(); tools(); return pop(t, null, '비율');
      }
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
      if (k === 'shuf') { if (rich) { ps().bg.seed = newSeed(); syncFirst(); } else card.seed = newSeed(); push(); draw(); paintRow2(); return; }   // 글카드: 보고 있는 장만
      if (k === 'page') {
        ps(); card.pages.splice(st.pg + 1, 0, ''); card.pst.splice(st.pg + 1, 0, clone(card.pst[st.pg])); st.pg += 1;   // 새 장은 앞 장 배경 · 위치를 이어받아요
        push(); draw(); scrollToPage(st.pg);
        if (st.panel) closePanel(false); caretEnd(st.pg); return;
      }
      if (k === 'fmt' || k === 'font' || k === 'bg' || k === 'filter') { st.tab = k; paintRow2(); return tools(); }
      if (k === 'photo') return pickPhoto();   // 쓰는 중에도 이 장의 사진을 고를 수 있어요 (포토 포맷)
      if (k === 'emo') return st.panel === k ? closePanel(true) : openPanel(k);
      pop('다음 단계에서 열려요');
    };
  });

  /* 2줄 (스타일 보기). 서식: 글꼴 · 크기 · 좌우 · 위아래, 누를 때마다 다음 값으로(카드 전체). 배경: 내 사진 · 밝게/어둡게 + 색 칸(옆으로 밀어요) */
  const row2 = $('.st2');
  // 서식: 크기 5단계 · 줄 간격 3단계 · 좌우 · 위아래 5자리 · 굵게 · 글자색. 누를 때마다 다음 값, 위 가운데에 값 (그림 문장은 앞 4칸만)
  const SZN = { xs: '가장 작게', s: '작게', m: '보통', l: '크게', xl: '가장 크게' }, LHN = { s: '좁게', m: '보통', l: '넓게' };
  const AH = { l: ['c', '가운데'], c: ['r', '오른쪽'], r: ['l', '왼쪽'] }, VN = { t: '위', tm: '위쪽', m: '가운데', bm: '아래쪽', b: '아래' };
  const next = (list, v) => list[(list.indexOf(v) + 1) % list.length];
  function paintRow2() {
    if (st.tab === 'ink') return paintHue('ink');
    if (st.tab === 'hue') return paintHue('bg');
    if (st.tab === 'bg' && f.tools.bg === 'art') return paintArtRow();
    if (st.tab === 'bg' && f.tools.bg === 'photo') return paintPhotoRow();
    if (st.tab === 'filter' && f.tools.filter) return paintFilterRow();
    if (st.tab === 'bg' && f.tools.bg) return paintBgRow();
    if (st.tab === 'font' && f.tools.font) return paintFontRow();
    const a = ps().align || { h: 'l', v: rich ? 'm' : 't' };
    row2.className = 'st2 g6';
    row2.innerHTML = `<button class="k" data-s="size" aria-label="크기">${ic('size')}</button><button class="k" data-s="lh" aria-label="줄 간격">${ic('lh')}</button>
      <button class="k" data-s="h" aria-label="좌우">${ic('a' + (a.h || 'l'))}</button><button class="k" data-s="v" aria-label="위아래">${ic('v' + (a.v || 'm'))}</button>
      ${rich ? `<button class="k ${card.bold ? 'on' : ''}" data-s="bold" aria-label="굵게">${ic('bold')}</button><button class="k" data-s="ink" aria-label="글자색" style="--ink:${card.ink || '#F4B860'}">${ic('col')}</button>` : '<span></span><span></span>'}<span></span><span></span>`;
    $$('.k', row2).forEach(x => {
      x.addEventListener('pointerdown', e => e.preventDefault());
      x.onclick = () => {
        flush();
        const k = x.dataset.s;
        if (k === 'size') { card.size = next(SIZE5, card.size || 'm'); push(); draw(); pop(SZN[card.size], null, '글자 크기'); }
        if (k === 'lh') { card.lh = next(['s', 'm', 'l'], card.lh || 'm'); push(); draw(); pop(LHN[card.lh], null, '줄 간격'); }
        if (k === 'h') { const [n, t] = AH[a.h || 'l']; ps().align = { ...a, h: n }; syncFirst(); push(); draw(); pop(t, null, pgLab()); }
        if (k === 'v') { const n = next(V5, a.v || (rich ? 'm' : 't')); ps().align = { ...a, v: n }; syncFirst(); push(); draw(); pop(VN[n], null, pgLab()); }
        if (k === 'bold') { card.bold = !card.bold; push(); draw(); pop(card.bold ? '굵게' : '보통 굵기'); }
        if (k === 'ink') { st.tab = 'ink'; return paintRow2(); }
        paintRow2();
      };
    });
  }
  // 색 막대: ‹ (돌아가기) · (글자색은 자동) · 막대. 밀면 바로 바뀌고, 손을 떼면 기록해요. 흰색 → 색들 → 검정
  const HUE = [[0, '#ffffff'], [.08, '#ff4d4d'], [.2, '#ffb84d'], [.32, '#f7f24a'], [.46, '#4de07a'], [.6, '#4dc9ff'], [.74, '#6b5cff'], [.88, '#e04dff'], [1, '#1a1a1a']];
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const hueAt = p => {
    p = Math.max(0, Math.min(1, p)); let i = 1; while (i < HUE.length - 1 && HUE[i][0] < p) i++;
    const [p0, c0] = HUE[i - 1], [p1, c1] = HUE[i], t = (p - p0) / (p1 - p0 || 1), a = hx(c0), b = hx(c1);
    return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  function paintHue(what) {
    const pb = ps().bg, ink = what === 'ink', pos = ink ? card.inkPos : pb.id === 'hex' ? pb.pos : null;
    row2.className = 'st2 g6 hur';
    row2.innerHTML = `<button class="k" data-x="back" aria-label="돌아가기">${ic('back')}</button>${ink ? `<button class="k rt ${card.ink ? '' : 'on'}" data-x="auto">자동</button>` : ''}<div class="hbar" style="grid-column:span ${ink ? 6 : 7}"><i ${pos == null ? 'hidden' : ''} style="left:${Math.max(0, Math.min(1, pos ?? .5)) * 100}%"></i></div>`;
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $('[data-x=back]', row2).onclick = () => { st.tab = ink ? 'fmt' : 'bg'; paintRow2(); };
    if (ink) $('[data-x=auto]', row2).onclick = () => { flush(); card.ink = null; delete card.inkPos; push(); draw(); paintRow2(); pop('자동', null, '글자색'); };
    const bar = $('.hbar', row2), knob = $('i', bar);
    let d = null;
    const at = e => { const r = bar.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
    const live = p => {
      const c = hueAt(p); knob.hidden = false; knob.style.left = Math.max(0, Math.min(1, p)) * 100 + '%';
      if (ink) $$('.pg', el).forEach(pg => { pg.style.color = c; });
      else { const pg = $(`.pg[data-i="${st.pg}"]`, el); if (pg) { $$('.bgi, .dimL, canvas.bgc', pg).forEach((x, j) => { if (j) x.style.display = 'none'; else { x.className = 'bgi'; x.style.background = c; } }); if (!card.ink) pg.style.color = inkOn(c); } }
      return c;
    };
    bar.addEventListener('pointerdown', e => { e.preventDefault(); d = { id: e.pointerId }; bar.setPointerCapture?.(e.pointerId); d.c = live(d.p = at(e)); });
    bar.addEventListener('pointermove', e => { if (d && e.pointerId === d.id) d.c = live(d.p = at(e)); });
    const end = () => {
      if (!d) return; const { c, p } = d; d = null; flush();
      if (ink) { card.ink = c; card.inkPos = Math.max(0, Math.min(1, p)); }   // 막대 끝 밖으로 밀어도 끝에
      else { clearPhoto(pb); pb.id = 'hex'; pb.hex = c; pb.pos = Math.max(0, Math.min(1, p)); S.setPref('hexes', [c, ...S.pref('hexes', []).filter(x => x !== c)].slice(0, 6)); syncFirst(); }
      push(); draw(); paintRow2(); pop(ink ? '글자색' : '직접 색', null, ink ? null : pgLab());
    };
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }
  // 글꼴 줄: 1 · 2칸 = 이전 · 다음 글꼴(끝에서는 처음으로), 3~7칸 = 이름 줄(이름 하나가 2칸, 그 글꼴로). 지금 글꼴이 맨 앞, 밀어 보고 이름을 눌러 바로 골라요
  function paintFontRow() {
    const cur = fontOf(card.font).id;
    row2.className = 'st2 g6 fnr';
    row2.innerHTML = `<button class="k" data-x="prev" aria-label="이전 글꼴">${ic('prev')}</button><button class="k" data-x="next" aria-label="다음 글꼴">${ic('next')}</button>
      <div class="fst">${FONTS.map(o => `<button class="fn ${o.id === cur ? 'sel' : ''}" data-f="${o.id}" style="font-family:${fontCssOf(o).replace(/"/g, '&quot;')};font-size:${Math.round(19 * o.k)}px" data-fz="${Math.round(19 * o.k)}"><span>${o.name}</span></button>`).join('')}<span class="end"></span></div>`;
    const fs = $('.fst', row2);
    // 긴 이름은 칸에 맞게 글자를 줄여요 (글꼴 파일이 늦게 와도 한 번 더)
    const fitNames = () => $$('.fn', fs).forEach(x => { const sp = x.firstElementChild, room = x.clientWidth - 12, base = +x.dataset.fz; x.style.fontSize = base + 'px'; if (sp.offsetWidth > room) x.style.fontSize = Math.floor(base * room / sp.offsetWidth) + 'px'; });
    fitNames(); document.fonts?.ready.then(fitNames);
    const toCur = smooth => { const s = $('.sel', fs); if (s) fs.scrollTo({ left: s.offsetLeft - fs.firstElementChild.offsetLeft, behavior: smooth ? 'smooth' : 'instant' }); };
    const pick = (o, smooth) => {
      flush(); card.font = o.id; push(); draw(); pop(o.name, o, o.grp);
      $$('.fn', fs).forEach(x => x.classList.toggle('sel', x.dataset.f === o.id)); toCur(smooth);
    };
    toCur(false);
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    const step = d => { const c = FONTS.findIndex(o => o.id === fontOf(card.font).id), i = (c + d + FONTS.length) % FONTS.length; pick(FONTS[i], Math.abs(i - c) === 1); };   // 끝에서 처음으로(처음에서 끝으로) 돌아갈 땐 바로
    $('[data-x=prev]', row2).onclick = () => step(-1); $('[data-x=next]', row2).onclick = () => step(1);
    $$('[data-f]', row2).forEach(x => x.onclick = () => pick(fontOf(x.dataset.f), true));
  }
  // 포토 포맷 필터 줄: 글꼴 줄과 같은 모듈. ‹ › 로 하나씩, 나머지 칸은 이 장 사진에 필터를 건 미리보기 (필터는 카드 전체에)
  function paintFilterRow() {
    const cur = filterOf(card.filter).id, pb = ps().bg;
    row2.className = 'st2 g6 bgr flr';
    row2.innerHTML = `<button class="k" data-x="prev" aria-label="이전 필터">${ic('prev')}</button><button class="k" data-x="next" aria-label="다음 필터">${ic('next')}</button>
      <div class="swp">${FILTERS.map(o => `<button class="k sw ft ${o.id === cur ? 'sel' : ''}" data-fl="${o.id}" aria-label="${o.name}"><span>${o.name}</span></button>`).join('')}<span class="end"></span></div>`;
    const sw = $('.swp', row2);
    $$('[data-fl]', row2).forEach(x => fthumb(pb, x.dataset.fl).then(u => { if (u) x.style.backgroundImage = `url(${u})`; }));
    const toCur = smooth => { const s = $('.sel', sw); if (s) sw.scrollTo({ left: s.offsetLeft - sw.firstElementChild.offsetLeft, behavior: smooth ? 'smooth' : 'instant' }); };
    const pick = (o, smooth) => {
      flush(); card.filter = o.id; push(); draw(); pop(o.name, null, '필터');
      $$('[data-fl]', row2).forEach(x => x.classList.toggle('sel', x.dataset.fl === o.id)); toCur(smooth);
    };
    toCur(false);
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    const step = d => { const c = FILTERS.findIndex(o => o.id === cur), i = (filterOf(card.filter).m + d + FILTERS.length) % FILTERS.length; pick(FILTERS[i], Math.abs(i - c) === 1); };
    $('[data-x=prev]', row2).onclick = () => step(-1); $('[data-x=next]', row2).onclick = () => step(1);
    $$('[data-fl]', row2).forEach(x => x.onclick = () => pick(filterOf(x.dataset.fl), true));
  }
  // 포토 포맷 배경 줄(팔레트): 이 장 사진 바꾸기 · 밝게/어둡게 · 노이즈 (노이즈는 기본 꺼짐: 사진 그대로가 먼저)
  // 영상인 장은 4칸부터: 재생/정지 · 타임라인(2칸) · 커버. 사진인 장에서는 이 칸들이 없어요
  const PLAY = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/></svg>';
  const PAUSE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor" stroke="none"/></svg>';
  function paintPhotoRow() {
    const pb = ps().bg, on = !!pb.grain, has = !!P.url(pb.ph), vid = has && !!pb.vd;
    row2.className = 'st2 g6';
    row2.innerHTML = `<button class="k tl ${has ? 'phb sel' : ''}" data-x="photo" aria-label="사진 · 영상" ${has ? `style="background-image:url(${P.url(pb.ph)})"` : ''}>${has ? (vid ? '<span class="vb"><svg viewBox="0 0 10 10"><path d="M2.6 1.3l6 3.7-6 3.7z"/></svg></span>' : '') : ic('scene')}</button>${dimBtn(pb)}<button class="k" data-x="grain" aria-label="노이즈">${ic(on ? 'grain' : 'nograin')}</button>${vid
      ? `<button class="k" data-x="play" aria-label="재생 정지">${st.vpause ? PLAY : PAUSE}</button><div class="tlc" aria-label="구간"><div class="trk"></div><div class="sh2 l"></div><div class="sh2 r"></div><div class="wn"><div class="fl"></div><b></b></div></div>${pb.cvt != null ? `<button class="k cv sel" data-x="cover" aria-label="커버" style="background-image:url(${P.url(pb.ph)})"></button>` : `<button class="k" data-x="cover" aria-label="커버">${ic('cover')}</button>`}`
      : '<span></span><span></span><span></span><span></span>'}<span></span>`;
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $('[data-x=photo]', row2).onclick = pickPhoto;
    dimOn(pb, paintPhotoRow);
    $('[data-x=grain]', row2).onclick = () => { flush(); if (on) delete pb.grain; else pb.grain = true; syncFirst(); push(); draw(); paintPhotoRow(); pop(on ? '노이즈 끔' : '노이즈 켬', null, pgLab()); };
    if (!vid) return;
    $('[data-x=play]', row2).onclick = () => { st.vpause = !st.vpause; V.setPaused(st.vpause); $('[data-x=play]', row2).innerHTML = st.vpause ? PLAY : PAUSE; };
    // 커버: 지금 보이는 장면이 커버로 (재생 중이면 멈추고 그 장면). 피드에서 멈춰 있을 때 · 사진 저장에 쓰여요
    $('[data-x=cover]', row2).onclick = async () => {
      st.vpause = true; V.setPaused(true);
      const t = V.playing()?.v.currentTime;
      try {
        const c = await V.capture(pb); flush(); Object.assign(pb, { ph: c.ph, tone: c.tone }); pb.cvt = t ?? pb.t0 ?? 0;
        syncFirst(); push(); draw(); paintPhotoRow(); pop('커버', null, pgLab());
      } catch (e) { console.error(e); }
    };
    timeline(pb);
  }
  // 타임라인 2칸: 가운데 고정 창(= 쓰는 10초) 아래로 영상 전체 띠가 휠처럼 지나가요. 창 안은 재생하며 채워지고 초 숫자만.
  // 띠를 미는 동안은 멈추고 카드에 그 장면, 손을 떼면 창 안 구간이 처음부터 다시 돌아요. 10초 이하 영상은 창에 꼭 맞고 움직이지 않아요
  function timeline(pb) {
    const tl = $('.tlc', row2), trk = $('.trk', tl), Wt = tl.clientWidth, H = tl.clientHeight;
    const len = V.lenOf(pb), dur = Math.max(len, pb.dur || len), ww = Wt * .44, wl = (Wt - ww) / 2, pps = ww / len, tw = dur * pps;
    const place = t => { trk.style.left = (wl - t * pps) + 'px'; };
    $('.wn', tl).style.cssText = `left:${wl}px;width:${ww}px`;
    $('.sh2.l', tl).style.width = wl + 'px'; $('.sh2.r', tl).style.width = wl + 'px';
    trk.style.width = tw + 'px'; place(pb.t0 || 0);
    const fw = Math.max(8, Math.round(H * .56)), n = Math.max(1, Math.min(48, Math.ceil(tw / fw))), k = Math.min(2, devicePixelRatio || 1);
    V.strip(pb, n, Math.round(fw * k), Math.round(H * k)).then(u => { if (u && trk.isConnected) { trk.style.backgroundImage = `url(${u})`; trk.style.backgroundSize = `${tw}px ${H}px`; } });
    tickTL(0, len);
    if (dur <= len + .05) return;
    let d = null;
    tl.addEventListener('pointerdown', e => { e.preventDefault(); d = { x: e.clientX, t: pb.t0 || 0, on: false, id: e.pointerId }; tl.setPointerCapture?.(e.pointerId); });
    tl.addEventListener('pointermove', e => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x; if (!d.on && Math.abs(dx) < 4) return;
      if (!d.on) { d.on = true; tl.classList.add('drag'); }
      d.now = Math.max(0, Math.min(dur - len, d.t - dx / pps)); place(d.now); V.scrub(d.now);
    });
    const end = async () => {
      if (!d) return; const x = d; d = null; tl.classList.remove('drag');
      if (!x.on) return;
      flush(); pb.t0 = Math.round(x.now * 100) / 100; st.vpause = false;
      if (pb.cvt == null) { try { const c = await V.capture(pb, pb.t0); Object.assign(pb, { ph: c.ph, tone: c.tone }); } catch {} }   // 커버를 안 골랐으면 새 구간의 첫 장면 (멈춘 채 그 자리라 바로 돼요)
      V.scrubEnd(true); syncFirst(); push(); draw(); paintPhotoRow();
    };
    tl.addEventListener('pointerup', end); tl.addEventListener('pointercancel', end);
  }
  function tickTL(t, len) {
    const wn = $('.st2 .tlc .wn'); if (!wn || $('.st2 .tlc.drag')) return;
    $('.fl', wn).style.width = (t / len * 100).toFixed(1) + '%'; const n = String(Math.floor(t)); if ($('b', wn).textContent !== n) $('b', wn).textContent = n;
  }
  // 아트 포맷 배경 줄: 그림은 셔플로 바꾸고, 여기서는 그림을 꾸미는 옵션만 (지금은 노이즈 하나, 옵션이 생기면 옆 칸에)
  function paintArtRow() {
    const pb = ps().bg, on = pb.grain !== false;
    row2.className = 'st2 g6';
    row2.innerHTML = `${dimBtn(pb)}<button class="k" data-x="grain" aria-label="노이즈">${ic(on ? 'grain' : 'nograin')}</button><span></span><span></span><span></span><span></span><span></span><span></span>`;
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    dimOn(pb, paintArtRow);
    const b = $('[data-x=grain]', row2);
    b.onclick = () => { flush(); if (on) pb.grain = false; else delete pb.grain; syncFirst(); push(); draw(); paintArtRow(); pop(on ? '노이즈 끔' : '노이즈 켬', null, pgLab()); };
  }
  // 딤: 약 → 중 → 강 (아이콘 = 네모가 칠해지는 만큼). 글이 또렷해져요
  const DIMN = { 1: '약', 2: '중', 3: '강' };
  const dimBtn = pb => `<button class="k" data-x="dim" aria-label="딤">${ic('d' + dimLv(pb.dim))}</button>`;
  const dimOn = (pb, repaint) => { $('[data-x=dim]', row2).onclick = () => { flush(); const n = dimLv(pb.dim) % 3 + 1; pb.dim = n === 1 ? 'dark' : 'd' + n; syncFirst(); push(); draw(); repaint(); pop(DIMN[n], null, ['딤', pgLab()].filter(Boolean).join(' · ')); }; };
  // 배경 줄(글): 내 사진 · 딤 · 컬러칩(색 막대) · 색 칸(최근 직접 고른 색이 맨 앞, 옆으로 밀어요)
  function paintBgRow() {
    const pb = ps().bg, keep = $('.swp', row2)?.scrollLeft;
    row2.className = 'st2 g6 bgr';
    const isPh = pb.id === 'photo' && P.url(pb.ph), hexes = S.pref('hexes', []);
    row2.innerHTML = `<button class="k tl ${isPh ? 'phb sel' : ''}" data-x="photo" aria-label="내 사진" ${isPh ? `style="background-image:url(${P.url(pb.ph)})"` : ''}>${isPh ? '' : ic('scene')}</button>${dimBtn(pb)}<button class="k hue" data-x="hue" aria-label="직접 색"><i></i></button>
      <div class="swp">${hexes.map(h => `<button class="k sw ${pb.id === 'hex' && pb.hex === h ? 'sel' : ''}" data-h="${h}" style="background:${h}"></button>`).join('')}${FREE.map(b => `<button class="k sw ${b.id === pb.id ? 'sel' : ''}" data-b="${b.id}" style="${b.css ? `background:${b.css}` : ''}">${b.code ? '<canvas width="88" height="88"></canvas>' : ''}</button>`).join('')}<span class="end"></span></div>`;
    $$('canvas', row2).forEach(cv => drawCode(cv, pb.seed || 1, .5));
    const sw = $('.swp', row2), sel = $('.sel', sw);
    if (keep != null) sw.scrollLeft = keep; else if (sel) sw.scrollLeft = Math.max(0, sel.offsetLeft - sw.offsetLeft);
    $$('button', row2).forEach(x => x.addEventListener('pointerdown', e => e.preventDefault()));
    $('[data-x=photo]', row2).onclick = pickPhoto;   // 폰 사진첩(PC는 파일 찾기)이 열려요. 사진 칸을 다시 누르면 다른 사진으로
    dimOn(pb, paintBgRow);
    $('[data-x=hue]', row2).onclick = () => { st.tab = 'hue'; paintRow2(); };
    $$('[data-h]', row2).forEach(t => t.onclick = () => { flush(); clearPhoto(pb); pb.id = 'hex'; pb.hex = t.dataset.h; syncFirst(); push(); draw(); paintBgRow(); pop('직접 색', null, pgLab()); });
    $$('[data-b]', row2).forEach(t => t.onclick = () => { flush(); clearPhoto(pb); delete pb.hex; delete pb.pos; pb.id = t.dataset.b; if (!pb.seed) pb.seed = newSeed(); syncFirst(); push(); draw(); paintBgRow(); const b = findBg(pb.id); pop(b.name, null, [pgLab(), KIND[b.kind]].filter(Boolean).join(' · ')); });
  }

  /* 내 사진 배경: 고른 사진이 보고 있는 장의 배경으로. 색 칸을 누르면 사진이 빠져요 */
  const clearPhoto = b => { ['ph', 'x', 'y', 'w', 'h', 'tone', 'vd', 'dur', 't0', 'cvt', 'hex', 'pos'].forEach(k => delete b[k]); };
  const picker = document.createElement('input'); picker.type = 'file'; picker.accept = f.tools.bg === 'photo' ? 'image/*,video/*' : 'image/*'; picker.hidden = true; wr.appendChild(picker);   // 포토 포맷은 영상도
  function pickPhoto() { picker.value = ''; picker.click(); }
  picker.onchange = async () => {
    const file = picker.files?.[0]; if (!file) return;
    let vid = (/^video\//.test(file.type) || /\.(mov|mp4|m4v|webm|3gp|hevc)$/i.test(file.name)) && f.tools.bg === 'photo';   // 아이폰은 종류(type)가 빈 채로 올 때가 있어요
    let busy = 0; const wait = () => { pop('영상 읽는 중…'); busy = setInterval(() => pop('영상 읽는 중…'), 1000); };   // 다 읽을 때까지 위에 계속
    try {
      if (vid) wait();
      let p;
      if (vid) p = await V.add(file);
      else try { p = await P.add(file); } catch (e) { if (f.tools.bg !== 'photo' || /^image\//.test(file.type)) throw e; vid = true; wait(); p = await V.add(file); }   // 사진으로 안 열리면 영상으로 한 번 더
      clearInterval(busy);
      const pb = ps().bg;
      flush(); clearPhoto(pb); Object.assign(pb, { id: 'photo', ...p, x: 50, y: 50 }); if (!pb.dim) pb.dim = 'dark';
      if (vid) st.vpause = false;
      syncFirst(); push(); draw(); paintRow2(); pop(vid ? '내 영상' : '내 사진', null, pgLab());
    } catch (e) { clearInterval(busy); console.error(e); pop(vid ? '영상을 열지 못했어요' : '사진을 열지 못했어요', null, vid ? String(e?.message || e).slice(0, 40) : null); }   // 원인을 작게 (고칠 때 보려고)
  };
  // 스타일 보기에서 카드를 끌면 사진이 따라 움직여요 (보일 부분 고르기). 남는 쪽(가로 · 세로)으로만 움직이고,
  // 가로로 남는 사진은 끝까지 간 뒤 더 밀면 옆 장으로 넘어가요
  function photoPan() {
    let d = null;
    stage.addEventListener('pointerdown', e => {
      if (typingNow() || st.panel || !el) return;
      const pg = e.target.closest?.('.pg'); if (!pg || !el.contains(pg)) return;
      const i = +pg.dataset.i, pb = ps(i).bg; if (pb.id !== 'photo' || !pb.w) return;
      const W = pg.offsetWidth, H = pg.offsetHeight, k = Math.max(W / pb.w, H / pb.h);
      d = { i, pb, pg, x0: e.clientX, y0: e.clientY, x: pb.x ?? 50, y: pb.y ?? 50, sx: pb.w * k - W, sy: pb.h * k - H, on: false, over: 0, id: e.pointerId, mouse: e.pointerType === 'mouse' };
      if (d.mouse) e.preventDefault();   // PC: 누르자마자 글쓰기로 넘어가지 않게. 끌지 않고 떼면 그 자리에 커서를 놓아요
    });
    stage.addEventListener('pointermove', e => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.on) {
        if (Math.hypot(dx, dy) < 8) return;
        const ax = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if ((ax === 'x' ? d.sx : d.sy) < 2) { d = null; return; }   // 그쪽으로 남는 게 없으면 원래대로(옆 장 넘기기 · 스크롤)
        d.on = ax; stage.setPointerCapture?.(e.pointerId); pop('사진 위치');
      }
      e.preventDefault();
      const clamp = v => Math.max(0, Math.min(100, v));
      if (d.on === 'x') { const v = d.x - dx / d.sx * 100; d.pb.x = clamp(v); d.over = v < 0 ? -v / 100 * d.sx : v > 100 ? -(v - 100) / 100 * d.sx : 0; }
      else d.pb.y = clamp(d.y - dy / d.sy * 100);
      const bgi = $('.bgi.ph', d.pg); if (bgi) bgi.style.backgroundPosition = `${d.pb.x}% ${d.pb.y}%`;
    }, { passive: false });
    const end = e => {
      if (!d) return; const x = d; d = null;
      if (!x.on) {
        if (x.mouse && e.type === 'pointerup') { const body = $('.body', x.pg), r = document.caretRangeFromPoint?.(e.clientX, e.clientY); body.focus(); if (r && body.contains(r.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(r); } }
        return;
      }
      const t = x.over > 60 ? x.i - 1 : x.over < -60 ? x.i + 1 : -1;
      st.panJust = true; setTimeout(() => { st.panJust = false; }, 0);
      syncFirst(); push();
      if (t >= 0 && t < card.pages.length) { st.pg = t; scrollToPage(t); }
    };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    // 끄는 동안 카드가 옆으로 넘어가거나 글이 눌리지 않게
    stage.addEventListener('click', e => { if (st.panJust) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  if (rich) photoPan();
  // 손가락 끌기를 브라우저가 가져가지 않게: 사진이 세로로 남으면 세로 끌기는 우리 몫(가로는 장 넘기기), 가로로 남으면 그 반대
  function panAxes() {
    if (!rich || !el) return;
    const style = !typingNow() && !st.panel;
    $$('.pg', el).forEach(pg => {
      const pb = ps(+pg.dataset.i).bg; let ta = '';
      if (style && pb.id === 'photo' && pb.w) {
        const W = pg.offsetWidth, H = pg.offsetHeight, k = Math.max(W / pb.w, H / pb.h);
        ta = pb.h * k - H > 2 ? 'pan-x' : pb.w * k - W > 2 ? 'pan-y' : '';
      }
      pg.style.touchAction = ta;
    });
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
    $$('[data-d]', panel).forEach(x => x.onclick = () => { flush(); card.date = x.dataset.d; card.showDate = true; paintMeta(); push(); draw(); closePanel(false); if (infOpen()) pi.focus({ preventScroll: true }); });
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
    delete card.sample; delete card.ex; S.saveCard(card);
    const pl = (card.place || '').trim();   // 최근 장소 (장소 칸에서 다시 고를 수 있게)
    if (pl) S.setPref('places', [pl, ...S.pref('places', []).filter(x => x !== pl)].slice(0, 20));
    if (card.fmt === 'text') { S.setPref('font', card.font); S.setPref('datePos', infoPos(card)); S.setPref('dh', card.dh || 'l'); }   // 다음 새 카드는 이 글꼴 · 날짜 줄 자리로 시작
    S.setPref('ratio', card.ratio || '45'); S.setPref('sg', card.sg || ''); if (card.sg) S.setPref('sgLast', card.sg); S.setPref('showDate:' + card.fmt, dateOn(card));
    // 다 됐다는 표시: 가운데 큰 체크가 잠깐 떴다가 피드로
    const ok = $('[data-a=ok]'); ok.disabled = true; document.activeElement?.blur?.();
    const mk = document.createElement('div'); mk.className = 'okmark'; mk.innerHTML = `<span>${ic('check')}</span>`; document.body.appendChild(mk);
    setTimeout(() => { mk.remove(); go(`#/feed/${card.id}`); }, 900);
  };

  paintMeta(); paintRow2(); mode(); sizeCard(); draw(); kb();
  document.fonts?.ready.then(() => el && fitCard(el, card));
}

// 카드에 쓰인 내 사진을 먼저 읽어 두고 시작해요
const usedPhotos = () => [...S.cards(), ...S.trash(), S.draft()?.card].filter(Boolean).flatMap(c => [c.bg, ...(c.pst || []).map(p => p.bg)]).flatMap(b => [b?.ph, b?.vd]).filter(Boolean);   // 영상 파일도
P.boot(usedPhotos()).then(route);
