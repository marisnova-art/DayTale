// 갖고 싶은 하루 · 모바일 1차: 피드 → 포맷 고르기 → 쓰기 → 완료·저장
import { ic } from './icons.js';
import * as S from './store.js';
import { FORMATS, ORDER, blank, sampleCard, renderCard, fitCard, cardText, newSeed } from './formats.js';
import { FREE, PAID, find as findBg, drawCode } from './bg.js';
import { cardImages, saveImages } from './export.js';

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
    <button class="nb wr" data-n="write" aria-label="쓰기">${ic('pen')}</button>
    <button class="nb" data-n="shelf" aria-label="책장">${ic('shelf')}</button>
    <button class="nb" data-n="me" aria-label="프로필"><span class="av"></span></button></nav>`;
}
function bindNav() {
  $$('.nb').forEach(b => b.onclick = () => ({ home: () => window.scrollTo({ top: 0, behavior: 'smooth' }), write: () => go('#/pick') }[b.dataset.n] || soon)());
}

function viewFeed() {
  const mine = S.cards();
  app.innerHTML = `<header class="top"><div class="logo">Dayzine.</div><button class="cb" data-a="bell" aria-label="알림">${ic('bell')}</button></header>
    <main class="feed"></main>${nav('home')}`;
  bindNav(); $('[data-a=bell]').onclick = soon;
  const feed = $('.feed');
  // 내 카드가 적으면 우리 카드(포맷 예시)를 아래에 2~3장 섞어요
  const ours = mine.length < 6 ? ORDER.map(f => sampleCard(f, S.today())) : [];
  [...mine, ...ours].forEach(c => feed.appendChild(feedItem(c)));
}

function feedItem(c) {
  const it = document.createElement('article'); it.className = 'fi';
  const f = FORMATS[c.fmt];
  it.innerHTML = `<div class="fx"><div class="clipc"></div></div>
    <div class="row">${c.sample
      ? `<div class="ours">${f.name}<i>NEW</i></div><button class="cb w" data-a="use" aria-label="이 포맷으로 쓰기">${ic('pen')}</button>`
      : `<div class="l"><button class="cb ${c.mark ? 'on' : ''}" data-a="mark" aria-label="책갈피">${ic('bookmark')}</button></div><button class="cb" data-a="more" aria-label="더보기">${ic('more')}</button>`}</div>`;
  const clip = $('.clipc', it), el = mount(clip, c);
  // 긴 그림 문장: 첫 4:5만 보이고, 한 번 누르면 펼쳐요
  requestAnimationFrame(() => setTimeout(() => {
    if (c.fmt === 'rebus' && el.offsetHeight > el.offsetWidth * 1.25 + 2) {
      clip.classList.add('col');
      clip.insertAdjacentHTML('beforeend', `<div class="more1">펼치기</div>`);
    }
  }, 60));
  $('.fx', it).onclick = () => {
    if (clip.classList.contains('col')) { clip.classList.remove('col'); $('.more1', clip)?.remove(); return; }
    if (c.sample) return go(`#/write/${c.fmt}`);
    go(`#/done/${c.id}`);
  };
  $('[data-a=use]', it) && ($('[data-a=use]', it).onclick = () => go(`#/write/${c.fmt}`));
  $('[data-a=mark]', it) && ($('[data-a=mark]', it).onclick = e => { c.mark = !c.mark; S.saveCard(c); e.currentTarget.classList.toggle('on', c.mark); toast(c.mark ? '책갈피에 넣었어요' : '책갈피에서 뺐어요'); });
  $('[data-a=more]', it) && ($('[data-a=more]', it).onclick = () => sheet([
    { icon: 'save', label: '사진에 저장', run: () => exportCard(c) },
    { icon: 'pen', label: '고치기', run: () => go(`#/edit/${c.id}`) },
    { icon: 'trash', label: '삭제', red: true, run: () => { S.removeCard(c.id); it.remove(); toast('삭제했어요'); } },
  ]));
  return it;
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
// 시안(write2) 그대로: 위 줄 · 카드(글은 카드 위에 바로 써요) · 도구 줄 · 키보드 자리(키보드 또는 패널)
// 키보드 처리는 지금 앱(shell.js trackKeyboard · editor.css)에서 아이폰으로 검증한 방식을 그대로 써요:
// 키보드가 있을 때만 보이는 화면(--vvt · --vvh)에 맞춰 고정하고, 카드 크기는 바뀌지 않아요(안에서만 스크롤)
const ALLOWED = new Set(['B', 'STRONG', 'MARK', 'H2', 'UL', 'LI', 'BR', 'DIV', 'P']);
function clean(html) {
  const t = document.createElement('div'); t.innerHTML = html;
  const walk = n => [...n.childNodes].forEach(ch => {
    if (ch.nodeType === 1) {
      walk(ch);
      if (ch.tagName === 'SPAN' && /background/.test(ch.getAttribute('style') || '')) { const m = document.createElement('mark'); m.append(...ch.childNodes); ch.replaceWith(m); return; }
      if (ch.tagName === 'SPAN' && /font-weight:\s*(bold|[6-9]00)/.test(ch.getAttribute('style') || '')) { const b = document.createElement('b'); b.append(...ch.childNodes); ch.replaceWith(b); return; }
      if (!ALLOWED.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return; }
      [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
    } else if (ch.nodeType !== 3) ch.remove();
  });
  walk(t);
  return t.innerHTML.replace(/^(<br>)+$/, '').replace(/​/g, '');
}

// 서식은 키보드를 내린 채로 바꿔요. 고른 글자는 '본문 처음부터 몇 번째 글자'로 기억해 두고, 바꾼 뒤 다시 찾아요
function offsetsOf(root, r) {
  const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(r.startContainer, r.startOffset);
  const a = pre.toString().length; return [a, a + r.toString().length];
}
function rangeAt(root, a, b) {
  const r = document.createRange(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n, pos = 0, started = false;
  while ((n = w.nextNode())) {
    if (!started && a <= pos + n.length) { r.setStart(n, a - pos); started = true; }
    if (started && b <= pos + n.length) { r.setEnd(n, b - pos); return r; }
    pos += n.length;
  }
  r.selectNodeContents(root); if (!started) r.collapse(false);
  return r;
}
function textBits(root, r) {
  const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!r.intersectsNode(n)) continue;
    const s = n === r.startContainer ? r.startOffset : 0, e = n === r.endContainer ? r.endOffset : n.length;
    if (e > s) out.push([n, s, e]);
  }
  return out;
}
const inside = (root, n, tag) => { const t = n.parentElement?.closest(tag); return t && root.contains(t) ? t : null; };
const isOn = (root, r, tag) => { const bits = textBits(root, r); return bits.length > 0 && bits.every(([n]) => inside(root, n, tag)); };
// 강조 · 형광펜: 고른 글자를 글자 칸마다 감싸요 (줄을 넘어 골라도 줄이 깨지지 않게)
function toggleInline(root, r, tag) {
  const bits = textBits(root, r); if (!bits.length) return false;
  if (bits.every(([n]) => inside(root, n, tag))) new Set(bits.map(([n]) => inside(root, n, tag))).forEach(t => t.replaceWith(...t.childNodes));
  else for (const [n, s, e] of bits) {
    if (inside(root, n, tag)) continue;
    let t = n; if (s) t = t.splitText(s); if (e - s < t.length) t.splitText(e - s);
    const w = document.createElement(tag); t.replaceWith(w); w.appendChild(t);
  }
  root.normalize(); return true;
}
// 제목 · 목록은 줄 단위. 먼저 본문 맨 위 칸을 모두 줄(div · h2 · ul)로 맞춰요
const retag = (el, tag) => { const n = document.createElement(tag); n.append(...el.childNodes); el.replaceWith(n); return n; };
function toLines(root) {
  let run = null;
  [...root.childNodes].forEach(n => {
    if (n.nodeType === 1 && /^(DIV|P|H2|UL)$/.test(n.tagName)) { run = null; if (n.tagName === 'P') retag(n, 'div'); return; }
    if (n.nodeType === 1 && n.tagName === 'BR') { if (run) n.remove(); else { const d = document.createElement('div'); n.replaceWith(d); d.appendChild(n); } run = null; return; }
    if (!run) { run = document.createElement('div'); n.before(run); }
    run.appendChild(n);
  });
}
function linesIn(root, r) {
  const out = [];
  [...root.children].forEach(b => {
    if (b.tagName === 'UL') [...b.children].forEach(li => { if (r.intersectsNode(li)) out.push(li); });
    else if (r.intersectsNode(b)) out.push(b);
  });
  return out;
}
function unlist(li) {
  const ul = li.parentNode, after = [...ul.children].slice([...ul.children].indexOf(li) + 1);
  const d = retag(li, 'div'); ul.after(d);
  if (after.length) { const u2 = document.createElement('ul'); u2.append(...after); d.after(u2); }
  if (!ul.children.length) ul.remove();
  return d;
}
function toggleHead(root, r) {
  toLines(root); let ls = linesIn(root, r); if (!ls.length) return false;
  const all = ls.every(l => l.tagName === 'H2');
  ls.map(l => l.tagName === 'LI' ? unlist(l) : l).forEach(l => retag(l, all ? 'div' : 'h2'));
  return true;
}
function toggleList(root, r) {
  toLines(root); let ls = linesIn(root, r); if (!ls.length) return false;
  if (ls.every(l => l.tagName === 'LI')) { ls.forEach(unlist); return true; }
  ls = ls.map(l => l.tagName === 'LI' ? unlist(l) : l);
  const ul = document.createElement('ul'); ls[0].before(ul);
  ls.forEach(l => ul.appendChild(retag(l, 'li')));
  return true;
}

function viewWrite({ fmt, id }) {
  const isNew = !id;
  let card;
  if (id) card = S.card(id);
  else if (fmt === 'draft') card = S.draft()?.card;
  else card = blank(fmt, S.today());
  if (!card || !FORMATS[card.fmt]) return go('#/');
  const f = FORMATS[card.fmt], rich = card.fmt === 'text';
  const st = { panel: null, hist: [clone(card)], hi: 0, timer: 0, pg: 0, sel: null, full: false };
  const root = document.documentElement;

  root.classList.add('wmode');
  app.innerHTML = `<div class="wr ${rich ? 'rich' : 'plain'}">
    <header class="top"><button class="cb" data-a="back" aria-label="뒤로">${ic('back')}</button><div class="nm">${f.name}</div><button class="cb w" data-a="ok" aria-label="완료">${ic('check')}</button></header>
    <section class="stage"></section>
    ${rich ? '' : '<div class="rin"><textarea class="field" rows="1" placeholder="오늘 하루를 적어 보세요"></textarea><span class="cnt"></span></div>'}
    <div class="tb">${['fmt', 'photo', 'emo', 'bg', 'page', 'shuf'].map(k => `<button class="t" data-t="${k}">${ic(k)}</button>`).join('')}<span class="sep"></span><button class="t" data-t="undo">${ic('undo')}</button><button class="t" data-t="redo">${ic('redo')}</button></div>
    <div class="panel"></div></div>`;
  const wr = $('.wr'), stage = $('.stage'), panel = $('.panel'), field = $('.rin .field');

  /* 키보드: shell.js trackKeyboard와 같은 계산. 키보드 높이는 기억해 두고 패널도 같은 높이로 열어요 */
  const vv = window.visualViewport;
  let raf = 0;
  const kb = () => {
    raf = 0; if (!vv) return;
    const h = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)), open = h > 80;
    root.style.setProperty('--vvh', Math.round(vv.height) + 'px'); root.style.setProperty('--vvt', Math.round(vv.offsetTop) + 'px');
    root.classList.toggle('kb-open', open);
    if (open && h > 160 && Math.abs(h - kbh) > 4) { kbh = h; S.setPref('kbh', h); root.style.setProperty('--kbh', h + 'px'); }
    if (open && st.waitKb) endWait();
    if (!open && (scrollY || vv.offsetTop)) scrollTo(0, 0);   // 아이폰이 키보드를 내린 뒤 화면을 밀어 둔 채로 두지 않게
    keepCaret();
  };
  const soonKb = () => { if (!raf) raf = requestAnimationFrame(kb); };
  const remeasure = () => [250, 600, 1200].forEach(ms => setTimeout(kb, ms));
  let kbh = S.pref('kbh', Math.round(innerHeight * .42));
  root.style.setProperty('--kbh', kbh + 'px');
  vv?.addEventListener('resize', soonKb); vv?.addEventListener('scroll', soonKb);
  addEventListener('focusout', remeasure);
  const onResize = () => { sizeCard(); soonKb(); };
  addEventListener('resize', onResize);
  cleanup = () => {
    vv?.removeEventListener('resize', soonKb); vv?.removeEventListener('scroll', soonKb);
    removeEventListener('focusout', remeasure); removeEventListener('resize', onResize);
    clearTimeout(st.timer); clearTimeout(st.waitT); CSS.highlights?.delete('dz-sel');
    root.classList.remove('wmode', 'kb-open', 'pan');
  };

  /* 카드 크기: 키보드가 올라와도 그대로(흔들리지 않게). 옆 장이 살짝 보이게 양옆을 남겨요 */
  function sizeCard() {
    const W = wr.clientWidth, H = innerHeight - $('.top').offsetHeight - $('.tb').offsetHeight - (field ? 64 : 0) - 28;
    const cw = Math.floor(Math.min(W - 64, H * .8));
    wr.style.setProperty('--cw', cw + 'px');
    if (el) { fitCard(el, card); scrollToPage(st.pg, false); }
  }

  // 기록: 셔플·배경·정렬은 바로, 글은 잠깐 멈췄을 때 한 칸씩
  const persist = () => { if (isNew) S.saveDraft({ card }); };
  const push = () => { clearTimeout(st.timer); st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(clone(card)); if (st.hist.length > 80) st.hist.shift(); st.hi = st.hist.length - 1; tools(); persist(); };
  const pushLater = () => { clearTimeout(st.timer); st.timer = setTimeout(push, 700); persist(); };
  const hasText = () => cardText(card).trim().length > 0;
  const count = () => {
    const n = `${cardText(card).replace(/\s/g, '').length}자`;
    $$('.wc', stage).forEach(x => x.textContent = n); if (field) $('.rin .cnt').textContent = n;
  };

  /* 카드 그리기. 글만 바뀌면 그 자리에서 바꾸고(키보드가 내려가지 않게), 장 수·배경·정렬이 바뀔 때만 새로 그려요 */
  let el = null, shape = '';
  const shapeOf = () => rich ? JSON.stringify([card.pages.length, card.bg, card.align, card.datePos]) : card.text + card.seed;
  const bodies = () => $$('.body', el);
  function draw() {
    const s = shapeOf();
    if (el && rich && s === shape) {
      bodies().forEach((b, i) => { if (b.innerHTML !== card.pages[i]) b.innerHTML = card.pages[i]; });
    } else {
      const nel = renderCard(card, { edit: rich }); el ? el.replaceWith(nel) : stage.appendChild(nel); el = nel; shape = s;
      if (rich) {
        $$('.pg', el).forEach(pg => pg.insertAdjacentHTML('beforeend', '<span class="wc"></span>'));
        el.addEventListener('scroll', () => { const i = pageAtScroll(); if (i !== st.pg) st.pg = i; }, { passive: true });
      }
    }
    fitCard(el, card); count(); tools(); overCheck();
    if (rich) scrollToPage(st.pg, false); else stage.scrollTop = stage.scrollHeight;
  }
  const step = () => el.querySelector('.pg') ? el.querySelector('.pg').offsetWidth + 12 : 1;
  const pageAtScroll = () => Math.max(0, Math.min(card.pages.length - 1, Math.round(el.scrollLeft / step())));
  function scrollToPage(i, smooth = true) { if (rich && el) el.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'instant' }); }
  let warned = false;
  function overCheck() {
    if (!rich) return;
    const over = $$('.pg', el).some(p => p.classList.contains('over'));
    $('[data-t=page]').classList.toggle('hint', over);
    if (over && !warned) { warned = true; toast('이 장이 가득 찼어요 · 새 장을 눌러 이어 써요'); }
    if (!over) warned = false;
  }

  // 커서가 늘 보이게: 카드가 보이는 칸보다 크면 칸 안에서만 스크롤 (editor.js keepCaret과 같은 방식)
  function keepCaret() {
    const s = getSelection(); if (!s.rangeCount) return;
    const n = s.anchorNode; if (!n || !(rich ? el?.contains(n) : false)) return;
    const r = s.getRangeAt(0); let rect = r.getClientRects()[0] || r.getBoundingClientRect();
    if (!rect || (!rect.height && !rect.top)) rect = (n.nodeType === 1 ? n : n.parentElement).getBoundingClientRect();
    const box = stage.getBoundingClientRect(), gap = 24;
    if (rect.bottom > box.bottom - gap) stage.scrollTop += rect.bottom - (box.bottom - gap);
    else if (rect.top < box.top + 8) stage.scrollTop -= (box.top + 8) - rect.top;
  }
  function showRange(r) {   // 패널이 열린 동안 고른 글자를 보이게 칠해 둬요
    if (!window.Highlight || !CSS.highlights) return;
    if (!r || r.collapsed) return CSS.highlights.delete('dz-sel');
    CSS.highlights.set('dz-sel', new Highlight(r));
  }

  /* 입력 */
  if (rich) {
    stage.addEventListener('input', e => {
      const b = e.target.closest?.('.body'); if (!b) return;
      const i = +b.closest('.pg').dataset.i; st.pg = i;
      card.pages[i] = clean(b.innerHTML);
      if (!b.textContent && b.innerHTML) b.innerHTML = '';   // 비우면 안내 글이 다시 보여요
      fitCard(el, card); count(); tools(); overCheck(); pushLater(); requestAnimationFrame(keepCaret);
    });
    stage.addEventListener('focusin', e => {
      const b = e.target.closest?.('.body'); if (!b) return;
      st.pg = +b.closest('.pg').dataset.i;
      if (st.panel) closePanel(false);
    });
    stage.addEventListener('paste', e => { if (!e.target.closest?.('.body')) return; e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
    // 빈 장에서 지우기를 누르면 그 장을 없애고 앞 장 끝으로
    stage.addEventListener('keydown', e => {
      const b = e.target.closest?.('.body'); if (!b || e.key !== 'Backspace') return;
      const i = +b.closest('.pg').dataset.i;
      if (i > 0 && !b.textContent) { e.preventDefault(); card.pages.splice(i, 1); st.pg = i - 1; push(); draw(); caretEnd(st.pg); }
    });
    // 카드의 빈 곳을 눌러도 쓰기로 (글 끝에 커서). 다른 장을 누르면 그 장으로
    stage.addEventListener('click', e => {
      if (e.target.closest('.body')) return;
      const pg = e.target.closest('.pg'); if (!pg) return;
      const i = +pg.dataset.i; if (i !== st.pg) { st.pg = i; scrollToPage(i); }
      caretEnd(i);
    });
  } else {
    field.addEventListener('input', () => {
      card.text = field.value; field.style.height = 'auto'; field.style.height = Math.min(field.scrollHeight, 96) + 'px';
      draw(); pushLater();
    });
    field.addEventListener('focus', () => { if (st.panel) closePanel(false); });
    stage.addEventListener('click', () => field.focus());
  }
  function caretEnd(i) {
    const b = bodies()[i]; if (!b) return;
    b.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* 도구 줄: 포맷이 안 쓰는 도구는 어둡게, 누르면 살짝 흔들림 */
  const enabled = k => { const v = f.tools[k]; return k === 'shuf' && v === 'code' ? !!findBg(card.bg?.id).code : !!v; };
  function tools() {
    $$('.tb .t').forEach(b => {
      const k = b.dataset.t;
      if (k === 'undo') return b.classList.toggle('off', st.hi <= 0);
      if (k === 'redo') return b.classList.toggle('off', st.hi >= st.hist.length - 1);
      b.classList.toggle('off', !enabled(k)); b.classList.toggle('on', st.panel === k);
    });
    $('[data-a=ok]').disabled = !hasText();
  }
  const shake = b => { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); };
  const typingNow = () => rich ? !!document.activeElement?.closest?.('.wr .body') : document.activeElement === field;

  $$('.tb .t').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());   // 눌러도 키보드 · 고른 글자가 그대로
    b.onclick = () => {
      const k = b.dataset.t;
      if (b.classList.contains('off')) return shake(b);
      if (k === 'undo' || k === 'redo') {
        clearTimeout(st.timer); st.hi += k === 'undo' ? -1 : 1;
        card = clone(st.hist[st.hi]); persist();
        if (rich) st.pg = Math.min(st.pg, card.pages.length - 1); else field.value = card.text;
        const was = typingNow(); draw(); if (was && rich && !document.activeElement?.closest?.('.body')) caretEnd(st.pg);
        if (st.panel) paintPanel(); return;
      }
      if (k === 'shuf') { card.bg.seed = newSeed(); push(); draw(); if (st.panel) paintPanel(); return; }
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
    const s = getSelection();
    if (rich) {
      const b = s.rangeCount && s.anchorNode?.parentElement?.closest('.wr .body');
      if (b) { const i = +b.closest('.pg').dataset.i; st.sel = { i, ab: offsetsOf(b, s.getRangeAt(0)) }; }
    } else if (document.activeElement === field) st.sel = { ab: [field.selectionStart, field.selectionEnd] };
    st.panel = k; clearTimeout(st.waitT); st.waitKb = false;
    root.classList.add('pan');
    document.activeElement?.blur?.();
    paintPanel(); tools();
  }
  function closePanel(toKeyboard) {
    st.panel = null; panel.innerHTML = ''; CSS.highlights?.delete('dz-sel'); tools();
    // 키보드가 다 올라올 때까지 빈 자리를 남겨 둬요 (도구 줄이 내려갔다 올라오지 않게)
    if (toKeyboard) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); rich ? caretAtSel() : field.focus(); }
    else if (typingNow() || !rich) { st.waitKb = true; st.waitT = setTimeout(endWait, 900); }
    else endWait();
  }
  function endWait() { clearTimeout(st.waitT); st.waitKb = false; if (!st.panel) root.classList.remove('pan'); }
  function caretAtSel() {
    if (!st.sel) return caretEnd(st.pg);
    const b = bodies()[st.sel.i]; if (!b) return caretEnd(st.pg);
    b.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(rangeAt(b, ...st.sel.ab));
  }
  const paintPanel = () => st.panel === 'fmt' ? panelFmt() : panelBg();

  function panelFmt() {
    const ft = f.fmtTools, a = card.align || {}, dp = card.datePos || 'top';
    const b = rich && st.sel ? bodies()[st.sel.i] : null, r = b ? rangeAt(b, ...st.sel.ab) : null;
    if (r) showRange(r);
    const on = {
      bold: r && !r.collapsed && isOn(b, r, 'b,strong'), mark: r && !r.collapsed && isOn(b, r, 'mark'),
      head: r && linesIn(b, r).length && linesIn(b, r).every(l => l.tagName === 'H2'), list: r && linesIn(b, r).length && linesIn(b, r).every(l => l.tagName === 'LI'),
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
        if (['al', 'ac', 'ar'].includes(k)) { card.align.h = k[1]; push(); draw(); return panelFmt(); }
        if (['vt', 'vm', 'vb'].includes(k)) { card.align.v = k[1]; push(); draw(); return panelFmt(); }
        if (k === 'date') { card.datePos = { top: 'bottom', bottom: 'none', none: 'top' }[dp]; push(); draw(); return panelFmt(); }
        if (!rich) return rebusBold();
        if (!b) return toast('쓸 곳을 먼저 눌러 주세요');
        if ((k === 'bold' || k === 'mark') && r.collapsed) return toast('바꿀 글자를 먼저 골라 주세요');
        const ok = k === 'bold' ? toggleInline(b, r, 'b') : k === 'mark' ? toggleInline(b, r, 'mark') : k === 'head' ? toggleHead(b, r) : toggleList(b, r);
        if (!ok) return;
        card.pages[st.sel.i] = clean(b.innerHTML); fitCard(el, card); count(); overCheck(); push();
        panelFmt();
      };
    });
  }
  function rebusBold() {
    const s = st.sel?.ab;
    if (!s || s[0] === s[1]) return toast('강조할 글자를 먼저 골라 주세요');
    const [a, z] = s, sel = field.value.slice(a, z), rep = /^\*.*\*$/.test(sel) ? sel.slice(1, -1) : `*${sel}*`;
    field.setRangeText(rep, a, z, 'select'); card.text = field.value; st.sel.ab = [a, a + rep.length];
    draw(); push();
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
      if ((t.dataset.tab === 'paid') !== isPaidId(card.bg.id)) { card.bg.id = L[0].id; push(); draw(); }
      panelBg();
    });
    $$('[data-dim]', panel).forEach(t => t.onclick = () => { card.bg.dim = t.dataset.dim; push(); draw(); panelBg(); });
    $$('[data-b]', panel).forEach(t => t.onclick = () => { card.bg.id = t.dataset.b; if (!card.bg.seed) card.bg.seed = newSeed(); push(); draw(); panelBg(); });
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

  if (field) field.value = card.text;
  sizeCard(); draw(); kb();
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
