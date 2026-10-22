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
  return t.innerHTML.replace(/^(<br>)+$/, '');
}

function viewWrite({ fmt, id }) {
  let isNew = !id, card;
  if (id) card = S.card(id);
  else if (fmt === 'draft') card = S.draft()?.card;
  else card = blank(fmt, S.today());
  if (!card || !FORMATS[card.fmt]) return go('#/');
  const f = FORMATS[card.fmt];
  const st = { panel: null, hist: [clone(card)], hi: 0, timer: 0 };

  app.innerHTML = `<div class="wr">
    <header class="top"><button class="cb" data-a="back" aria-label="뒤로">${ic('back')}</button><div class="nm">${f.name}</div><button class="cb w" data-a="ok" aria-label="완료">${ic('check')}</button></header>
    <div class="stage"><div class="cbox"></div><div class="under"></div></div>
    <div class="tb">${['fmt', 'photo', 'emo', 'bg', 'page', 'shuf'].map(k => `<button class="t" data-t="${k}">${ic(k)}</button>`).join('')}<span class="sep"></span><button class="t" data-t="undo">${ic('undo')}</button><button class="t" data-t="redo">${ic('redo')}</button></div>
    <div class="panel" hidden></div></div>`;
  const wr = $('.wr'), cbox = $('.cbox'), under = $('.under'), panel = $('.panel');

  // iPhone 키보드: 보이는 화면 높이에 맞춰 도구 줄이 키보드 바로 위에 붙어요
  const vv = window.visualViewport;
  const fitVV = () => { if (!vv) return; wr.style.height = vv.height + 'px'; wr.style.transform = `translateY(${vv.offsetTop}px)`; };
  vv?.addEventListener('resize', fitVV); vv?.addEventListener('scroll', fitVV); fitVV();
  wr.style.position = 'fixed'; wr.style.left = wr.style.right = '0'; wr.style.top = '0'; wr.style.maxWidth = '480px'; wr.style.margin = '0 auto';
  cleanup = () => { vv?.removeEventListener('resize', fitVV); vv?.removeEventListener('scroll', fitVV); clearTimeout(st.timer); };

  // 기록: 셔플·배경·정렬은 바로, 글은 잠깐 멈췄을 때 한 칸씩
  const push = () => { st.hist = st.hist.slice(0, st.hi + 1); st.hist.push(clone(card)); if (st.hist.length > 80) st.hist.shift(); st.hi = st.hist.length - 1; tools(); persist(); };
  const pushLater = () => { clearTimeout(st.timer); st.timer = setTimeout(push, 700); persist(); };
  const persist = () => { if (isNew) S.saveDraft({ card }); };
  const hasText = () => cardText(card).trim().length > 0;

  let el = null;
  function draw(focusPage) {
    cbox.innerHTML = '';
    el = mount(cbox, card, { edit: card.fmt === 'text' });
    if (card.fmt === 'text') bindText(focusPage);
    drawUnder(); tools();
  }
  function drawUnder() {
    const n = cardText(card).replace(/\s/g, '').length;
    if (card.fmt === 'rebus') {
      if (!$('.field', under)) {
        under.innerHTML = `<div class="meta"><input class="ttl" maxlength="12" placeholder="제목 (비우면 요일)"><span class="cnt"></span></div><textarea class="field" placeholder="오늘 하루를 적어 보세요"></textarea>`;
        const ta = $('.field', under), tt = $('.ttl', under);
        ta.value = card.text; tt.value = card.title || '';
        const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
        ta.oninput = () => { card.text = ta.value; redrawRebus(); pushLater(); grow(); };
        tt.oninput = () => { card.title = tt.value; redrawRebus(); pushLater(); };
        ta.onfocus = () => closePanel(true);
        requestAnimationFrame(grow);
      }
      $('.cnt', under).textContent = `${n}자`;
    } else {
      const pages = card.pages.length;
      under.innerHTML = `${pages > 1 ? `<div class="dots">${card.pages.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>` : ''}<div class="cnt">${n}자</div>`;
      markDot();
    }
  }
  function redrawRebus() {
    const nel = renderCard(card); cbox.replaceChildren(nel); fitCard(nel, card); el = nel;
    $('.cnt', under).textContent = `${cardText(card).replace(/\s/g, '').length}자`; tools();
  }
  function markDot() {
    const sc = $('.cd.text', cbox); if (!sc) return;
    const i = Math.round(sc.scrollLeft / Math.max(1, sc.clientWidth));
    $$('.dots i', under).forEach((d, k) => d.classList.toggle('on', k === i));
  }
  function curPage() { const sc = $('.cd.text', cbox); return sc ? Math.round(sc.scrollLeft / Math.max(1, sc.clientWidth)) : 0; }

  function bindText(focusPage) {
    const sc = $('.cd.text', cbox);
    sc.addEventListener('scroll', markDot, { passive: true });
    $$('.body', sc).forEach((b, i) => {
      b.addEventListener('input', () => {
        card.pages[i] = clean(b.innerHTML);
        fitCard(el, card); drawCount(); pushLater();
      });
      b.addEventListener('focus', () => closePanel(true));
      b.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
    });
    if (focusPage != null) {
      requestAnimationFrame(() => {
        sc.scrollTo({ left: focusPage * sc.clientWidth, behavior: 'smooth' });
        const b = $$('.body', sc)[focusPage]; b?.focus();
      });
    }
  }
  const drawCount = () => { const c = $('.cnt', under); if (c) c.textContent = `${cardText(card).replace(/\s/g, '').length}자`; };

  // 도구 줄: 포맷이 안 쓰는 도구는 어둡게, 누르면 살짝 흔들림
  function enabled(k) {
    const v = f.tools[k];
    if (k === 'shuf' && v === 'code') return !!findBg(card.bg?.id).code;
    return !!v;
  }
  function tools() {
    $$('.tb .t').forEach(b => {
      const k = b.dataset.t;
      if (k === 'undo') return b.classList.toggle('off', st.hi <= 0);
      if (k === 'redo') return b.classList.toggle('off', st.hi >= st.hist.length - 1);
      b.classList.toggle('off', !enabled(k));
      b.classList.toggle('on', st.panel === k);
    });
    $('[data-a=ok]').disabled = !hasText();
  }

  $$('.tb .t').forEach(b => {
    b.addEventListener('pointerdown', e => e.preventDefault());
    b.onclick = () => {
      const k = b.dataset.t;
      if (b.classList.contains('off')) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
      if (k === 'undo' || k === 'redo') {
        clearTimeout(st.timer);
        st.hi += k === 'undo' ? -1 : 1;
        card = clone(st.hist[st.hi]); persist();
        if (card.fmt === 'rebus') { const ta = $('.field', under); if (ta) { ta.value = card.text; $('.ttl', under).value = card.title || ''; } redrawRebus(); }
        else draw();
        return tools();
      }
      if (k === 'shuf') {
        if (card.fmt === 'rebus') { card.seed = newSeed(); redrawRebus(); }
        else { card.bg.seed = newSeed(); draw(); }
        return push();
      }
      if (k === 'page') {
        card.pages.push(''); push(); draw(card.pages.length - 1); return;
      }
      if (k === 'fmt' || k === 'bg') return st.panel === k ? closePanel() : openPanel(k);
      soon();
    };
  });

  let savedRange = null;
  function openPanel(k) {
    const sel = getSelection();
    savedRange = sel.rangeCount && cbox.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    if (card.fmt === 'rebus') { const ta = $('.field', under); savedRange = ta ? [ta.selectionStart, ta.selectionEnd] : null; }
    document.activeElement?.blur?.();
    st.panel = k; panel.hidden = false;
    k === 'fmt' ? panelFmt() : panelBg();
    tools();
  }
  function closePanel(keep) { if (!st.panel) return; st.panel = null; panel.hidden = true; panel.innerHTML = ''; if (!keep) tools(); else tools(); }

  function restore() {
    if (!savedRange || card.fmt === 'rebus') return false;
    const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); return !savedRange.collapsed;
  }

  function panelFmt() {
    const ft = f.fmtTools, a = card.align || {}, dp = card.datePos || 'top';
    const b = (k, icn, on, off) => `<button class="pb ${on ? 'on' : ''} ${off ? 'off' : ''}" data-f="${k}">${ic(icn)}</button>`;
    panel.innerHTML = `<div class="pgrid">${b('bold', 'bold', 0, !ft.bold)}${b('mark', 'mark', 0, !ft.mark)}${b('head', 'head', 0, !ft.head)}${b('list', 'list', 0, !ft.list)}${b('date', 'date', dp !== 'none' && ft.date, !ft.date)}</div>
      <div class="pgrid">${b('al', 'al', ft.align && a.h === 'l', !ft.align)}${b('ac', 'ac', ft.align && a.h === 'c', !ft.align)}${b('ar', 'ar', ft.align && a.h === 'r', !ft.align)}${b('vt', 'vt', ft.align && a.v === 't', !ft.align)}${b('vm', 'vm', ft.align && a.v === 'm', !ft.align)}${b('vb', 'vb', ft.align && a.v === 'b', !ft.align)}</div>`;
    if (ft.date) $('[data-f=date]', panel).insertAdjacentHTML('beforeend', `<span class="tag">${{ top: '위', bottom: '아래', none: '끔' }[dp]}</span>`);
    $$('.pb', panel).forEach(btn => {
      btn.addEventListener('pointerdown', e => e.preventDefault());
      btn.onclick = () => {
        const k = btn.dataset.f;
        if (btn.classList.contains('off')) { btn.classList.remove('shake'); return; }
        if (card.fmt === 'rebus' && k === 'bold') return rebusBold();
        if (['al', 'ac', 'ar'].includes(k)) { card.align.h = k[1]; push(); draw(); return panelFmt(); }
        if (['vt', 'vm', 'vb'].includes(k)) { card.align.v = k[1]; push(); draw(); return panelFmt(); }
        if (k === 'date') { card.datePos = { top: 'bottom', bottom: 'none', none: 'top' }[dp]; push(); draw(); return panelFmt(); }
        if (!restore()) return toast('바꿀 글자를 먼저 골라 주세요');
        if (k === 'bold') document.execCommand('bold');
        if (k === 'mark') toggleMark();
        if (k === 'head') document.execCommand('formatBlock', false, /H2/.test(document.queryCommandValue('formatBlock').toUpperCase()) ? 'div' : 'h2');
        if (k === 'list') document.execCommand('insertUnorderedList');
        syncPages(); push();
        const s = getSelection(); savedRange = s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
      };
    });
  }
  function toggleMark() {
    const s = getSelection(); if (!s.rangeCount) return;
    const r = s.getRangeAt(0), host = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode;
    const m = host.closest('mark');
    if (m) { m.replaceWith(...m.childNodes); return; }
    const frag = r.extractContents(); frag.querySelectorAll?.('mark').forEach(x => x.replaceWith(...x.childNodes));
    const mk = document.createElement('mark'); mk.appendChild(frag); r.insertNode(mk);
    s.removeAllRanges(); const nr = document.createRange(); nr.selectNodeContents(mk); s.addRange(nr);
  }
  function syncPages() { $$('.cd.text .body', cbox).forEach((b, i) => { card.pages[i] = clean(b.innerHTML); }); fitCard(el, card); drawCount(); }
  function rebusBold() {
    const ta = $('.field', under); if (!ta || !savedRange) return;
    let [a, z] = savedRange; if (a === z) return toast('강조할 글자를 먼저 골라 주세요');
    const sel = ta.value.slice(a, z), rep = /^\*.*\*$/.test(sel) ? sel.slice(1, -1) : `*${sel}*`;
    ta.setRangeText(rep, a, z, 'select'); card.text = ta.value; savedRange = [a, a + rep.length];
    redrawRebus(); push();
  }

  function panelBg() {
    const tab = isPaidId(card.bg.id) ? 'paid' : 'free', dim = card.bg.dim || 'dark';
    const list = tab === 'paid' ? PAID : FREE;
    panel.innerHTML = `<div class="pgrid">
        <button class="pb ${tab === 'free' ? 'on' : ''}" data-tab="free">${ic('grad')}</button>
        <button class="pb ${tab === 'paid' ? 'on' : ''}" data-tab="paid">${ic('spark')}</button>
        <button class="pb off" data-tab="photo">${ic('scene')}</button>
        <span></span>
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
  const isPaidId = idd => PAID.some(b => b.id === idd);

  $('[data-a=back]').onclick = () => {
    clearTimeout(st.timer);
    if (card.fmt === 'text') syncPages();
    if (isNew) { if (hasText()) S.saveDraft({ card }); else S.clearDraft(); }
    else if (hasText()) S.saveCard(card);
    history.length > 1 ? history.back() : go('#/');
  };
  $('[data-a=ok]').onclick = () => {
    if (card.fmt === 'text') syncPages();
    if (!hasText()) return;
    if (isNew) { card.id = S.uid(); card.created = new Date().toISOString(); S.clearDraft(); }
    delete card.sample;
    S.saveCard(card);
    go(`#/done/${card.id}`);
  };

  draw(card.fmt === 'text' ? null : undefined);
  if (card.fmt === 'rebus') requestAnimationFrame(() => $('.field', under)?.focus());
  else requestAnimationFrame(() => { const b = $('.cd.text .body', cbox); if (b && !b.textContent) b.focus(); });
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
