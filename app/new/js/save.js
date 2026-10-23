// 저장 시트: 겉은 아래 시트, 안은 쓰기 도구와 같은 7칸. 고른 대로 미리보기가 바로 바뀌고, 큰 버튼 하나로 저장해요.
// 칸: 4:5 · 9:16 · 날짜 · 날씨 · 장소 · 서명 · 전체/이 장(여러 장일 때만). 영상 카드는 위에 영상 · 커버 줄이 하나 더.
// 고른 것은 이번 저장에만 (카드는 그대로). 장소 · 서명은 꺼진 칸을 누르면 적어 둔 값이 든 입력 줄이 열려요:
// 그대로 확인하면 켜지고, 고쳐 쓰면 새 값으로 (장소 = 카드, 서명 = 설정에 남아요). 켜진 칸을 누르면 꺼져요
import { ic } from './icons.js';
import * as S from './store.js';
import { buildPages, cardImages, saveImages, signOn } from './export.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sv = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  r45: sv('<rect x="6" y="4" width="12" height="15" rx="2"/>'),
  r916: sv('<rect x="7.5" y="2.5" width="9" height="19" rx="2"/>'),
  all: sv('<rect x="3" y="6" width="10" height="13" rx="2"/><path d="M16 6.5v12M20 7.5v10"/>'),
  one: sv('<rect x="6" y="5" width="12" height="15" rx="2"/>'),
  play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5l11 6.5-11 6.5z"/></svg>',
  ok: '<svg class="ic ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

// 위 가운데 알림 (1.2초)
let pillT = 0;
export function pill(text, icon) {
  $$('.pill').forEach(p => p.remove()); clearTimeout(pillT);
  const p = document.createElement('div'); p.className = 'pill'; p.innerHTML = (icon ? ic(icon) : '') + esc(text);
  document.body.appendChild(p); pillT = setTimeout(() => p.remove(), 1200);
  return p;
}
const pillKeep = text => { const p = pill(text); clearTimeout(pillT); return p; };

const hasVideo = c => [c.bg, ...(c.pst || []).map(p => p?.bg)].some(b => b?.vd);
const dpOn = c => c.fmt === 'rebus' ? 'bottom' : 'top';
const LABEL = { r45: '4:5', r916: '9:16', date: '날짜', wx: '날씨', place: '장소', sign: '서명', pages: '전체 · 이 장', mp4: '영상', cover: '커버 사진' };

export function openSave(c) {
  const o = {
    ratio: S.pref('saveRatio', '45'),
    date: !!c.datePos && c.datePos !== 'none',
    place: !!(c.place || '').trim(),
    sign: !!S.pref('sign', '') && S.pref('signOn', true),
    all: true,
  };
  let n = 1, at = 0, edit = null, closed = false, ready = null, timer = 0, step = null, files = null;
  const y0 = scrollY, root = document.documentElement, ov = root.style.overflow;
  root.style.overflow = 'hidden';   // 시트가 열린 동안 뒤 피드는 그대로

  const bg = document.createElement('div'); bg.className = 'sv-bg';
  const sh = document.createElement('div'); sh.className = 'sv'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', '저장');
  sh.innerHTML = `<div class="grab"></div><div class="pv"></div><div class="rec" hidden></div>
    <div class="inp" hidden><input enterkeyhint="done" maxlength="40"><button aria-label="확인">${ic('check')}</button></div>
    <div class="g7 vrow" hidden></div><div class="g7 row"></div><button class="go">${ic('save')}사진에 저장</button>`;
  document.body.append(bg, sh);

  // 이번 저장에 쓸 카드 (날짜 · 장소만 바꾼 복사본)
  const view = () => {
    const v = structuredClone(c);
    v.datePos = o.date ? (c.datePos && c.datePos !== 'none' ? c.datePos : dpOn(c)) : 'none';
    if (!o.place) v.place = '';
    return v;
  };
  const signText = () => o.sign ? S.pref('sign', '') : '';
  const pages = () => !o.all && n > 1 ? [at] : null;

  /* 미리보기: 저장과 같은 장들 (9:16이면 카드 자체가 9:16) */
  let ver = 0;
  async function preview() {
    const my = ++ver, pv = $('.pv', sh);
    const story = o.ratio === '916', ar = story ? 16 / 9 : 1.25;
    const H = Math.round(Math.max(200, Math.min(innerHeight * .5, 470, (sh.clientWidth - 32) * 1.25))), W = Math.round(H / ar);
    const v = view(), { h, nodes } = await buildPages(v, W, Math.min(2, devicePixelRatio || 1), ar);
    if (my !== ver || closed) { h.remove(); return; }
    nodes.forEach(x => x.querySelectorAll('canvas.bgv').forEach(e => e.remove()));
    signOn(nodes, v, signText());
    n = nodes.length; if (at >= n) at = 0;
    const fr = document.createElement('div'); fr.className = 'fr'; fr.style.cssText = `width:${W}px;height:${H}px`;
    const strip = document.createElement('div'); strip.className = 'pgs2'; strip.append(...nodes); fr.appendChild(strip);
    const dots = document.createElement('div'); dots.className = 'dots';
    dots.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i === at ? 'on' : ''}"></i>`).join('') : '';
    pv.replaceChildren(fr, dots);
    h.remove();
    strip.scrollLeft = at * strip.clientWidth;
    strip.addEventListener('scroll', () => {
      const i = Math.round(strip.scrollLeft / strip.clientWidth); if (i === at) return;
      at = i; [...dots.children].forEach((d, k) => d.classList.toggle('on', k === at));
      if (!o.all) { paintGo(); warm(); }
    }, { passive: true });
    paintRow(); paintGo(); warm();
  }

  /* 칸 */
  function paintRow() {
    const cell = (k, on, html, extra = '') => `<button class="k ${on === 2 ? 'dim' : on ? 'on' : ''} ${extra}" data-k="${k}" aria-label="${LABEL[k]}" aria-pressed="${on === 1}">${html}</button>`;
    const vr = $('.vrow', sh), vid = hasVideo(c);
    vr.hidden = !vid; vr.innerHTML = vid ? `${cell('mp4', 2, I.play, 'sp2')}${cell('cover', 1, ic('cover'), 'sp2')}` : '';
    $('.row', sh).innerHTML = cell('r45', o.ratio === '45' ? 1 : 0, I.r45) + cell('r916', o.ratio === '916' ? 1 : 0, I.r916)
      + cell('date', o.date ? 1 : 0, ic('date')) + cell('wx', 2, ic('sun')) + cell('place', o.place ? 1 : 0, ic('pin'))
      + cell('sign', o.sign ? 1 : 0, ic('pen')) + (n > 1 ? cell('pages', 1, o.all ? I.all : I.one) : '<span class="k"></span>');
  }
  function paintGo() {
    const k = o.all ? n : 1, b = $('.go', sh);
    if (!b.dataset.busy && !sh.classList.contains('saved')) b.innerHTML = `${ic('save')}사진에 저장${k > 1 ? ` · ${k}장` : ''}`;
  }

  const set = (msg, icon) => { pill(msg, icon); files = null; preview(); };
  const tap = k => {
    if (k === 'r45' || k === 'r916') { if (o.ratio === (k === 'r45' ? '45' : '916')) return; o.ratio = k === 'r45' ? '45' : '916'; S.setPref('saveRatio', o.ratio); return set(LABEL[k]); }
    if (k === 'date') { o.date = !o.date; return set(o.date ? '날짜 켬' : '날짜 끔', 'date'); }
    if (k === 'wx') return pill('날씨는 다음 단계에서 들어가요', 'sun');
    if (k === 'mp4') return pill('영상 저장은 다음 단계에서 열려요');
    if (k === 'cover') return pill('커버 사진으로 저장해요', 'cover');
    if (k === 'place') { if (o.place) { o.place = false; return set('장소 끔', 'pin'); } return ask('place'); }
    if (k === 'sign') { if (o.sign) { o.sign = false; S.setPref('signOn', false); return set('서명 끔', 'pen'); } return ask('sign'); }
    if (k === 'pages') { o.all = !o.all; return set(o.all ? `전체 ${n}장` : `이 장만 (${at + 1}/${n})`); }
  };
  sh.addEventListener('click', e => {
    if (sh.classList.contains('saved')) return close();
    const b = e.target.closest('.k[data-k]'); if (b) tap(b.dataset.k);
  });

  /* 장소 · 서명 적기: 미리보기를 접고 키보드 바로 위에. 장소는 최근 장소 칩도 */
  const inp = $('.inp', sh), field = $('input', inp), rec = $('.rec', sh);
  function ask(k) {
    edit = k; inp.hidden = false; sh.classList.add('ed');
    field.placeholder = k === 'place' ? '장소' : '서명 (예: @andrew)';
    field.value = k === 'place' ? (c.place || '') : S.pref('sign', '');
    const list = k === 'place' ? S.pref('places', []) : [];
    rec.hidden = !list.length;
    rec.innerHTML = list.map(x => `<button type="button">${esc(x)}</button>`).join('');
    $$('button', rec).forEach((b, i) => { b.addEventListener('pointerdown', e => e.preventDefault()); b.onclick = () => { field.value = list[i]; commit(); }; });
    field.focus(); lift();
  }
  function commit() {
    const v = field.value.trim(), k = edit; endEdit();
    if (k === 'place') {
      c.place = v; o.place = !!v; S.saveCard(c);
      if (v) S.setPref('places', [v, ...S.pref('places', []).filter(x => x !== v)].slice(0, 20));
      set(v ? '장소 켬' : '장소 끔', 'pin');
    } else if (k === 'sign') {
      S.setPref('sign', v); o.sign = !!v; S.setPref('signOn', o.sign);
      set(v ? '서명 켬' : '서명 끔', 'pen');
    }
  }
  function endEdit() {
    edit = null; inp.hidden = true; rec.hidden = true; sh.classList.remove('ed'); field.blur();
    if (scrollY !== y0) scrollTo(0, y0);   // 아이폰이 키보드 때문에 밀어 둔 화면을 제자리로
  }
  $('button', inp).addEventListener('pointerdown', e => e.preventDefault());
  $('button', inp).onclick = commit;
  field.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  field.addEventListener('blur', () => setTimeout(() => { if (edit && document.activeElement !== field) endEdit(); }, 150));

  // 보이는 화면(키보드 위)의 아래 끝에 붙여요: 쓰기 화면과 같은 방식 (아이폰은 키보드를 올리며 화면을 밀어 올려요)
  const vv = window.visualViewport;
  function lift() {
    if (!sh.classList.contains('ed')) return sh.style.removeProperty('--svt');
    const top = (vv ? vv.offsetTop + vv.height : innerHeight) - sh.offsetHeight;
    sh.style.setProperty('--svt', Math.max(0, Math.round(top)) + 'px');
  }
  const onVv = () => requestAnimationFrame(lift);
  vv?.addEventListener('resize', onVv); vv?.addEventListener('scroll', onVv);

  /* 저장: 고르는 동안 이미지를 미리 만들어 둬요 (아이폰은 누른 바로 그때 공유 창을 열어야 해서) */
  const key = () => JSON.stringify([o, signText(), pages(), c.place]);
  const make = () => { const p = cardImages(view(), { ratio: o.ratio, sign: signText(), pages: pages(), onStep: (i, t) => step = [i, t] }); ready = { k: key(), p }; p.catch(() => {}); return ready; };
  function warm() { clearTimeout(timer); timer = setTimeout(() => { if (!closed && !edit && (!ready || ready.k !== key())) make(); }, 700); }

  const go = $('.go', sh);
  go.onclick = async e => {
    e.stopPropagation();
    if (go.dataset.busy || sh.classList.contains('saved')) return;
    if (files) return share(files);
    if (!ready || ready.k !== key()) make();
    const r = ready; let t = 0;
    if (!(await settled(r.p))) {   // 아직 만드는 중: 위 가운데에 진행
      go.dataset.busy = 1; go.disabled = true;
      const p = pillKeep('');
      t = setInterval(() => { if (step) p.textContent = `만드는 중 ${step[0]}/${step[1]}`; }, 120);
    }
    try { files = await r.p; }
    catch (err) { console.error(err); clearInterval(t); unbusy(); files = null; return pill('저장하지 못했어요. 다시 해 주세요'); }
    clearInterval(t);
    if (go.dataset.busy) {   // 기다렸다면 누른 효과가 끝났을 수 있어요: 한 번 더 눌러 공유 창을 열어요
      unbusy(); go.innerHTML = `${ic('save')}사진에 저장하기`; pill('준비됐어요', 'check');
      return;
    }
    share(files);
  };
  const unbusy = () => { delete go.dataset.busy; go.disabled = false; $$('.pill').forEach(p => p.remove()); };
  const settled = p => Promise.race([p.then(() => true, () => true), new Promise(ok => setTimeout(() => ok(false), 30))]);
  async function share(fs) {
    const r = await saveImages(fs);
    if (r === 'again') { go.innerHTML = `${ic('save')}사진에 저장하기`; return pill('한 번 더 눌러 주세요'); }
    files = null;
    if (r === 'cancel') return;
    // 다 됐다는 순간: 카드가 버튼 쪽으로 내려앉고 버튼이 체크로. 잠깐 뒤 닫혀요 (누르면 바로)
    sh.classList.add('saved');
    go.innerHTML = `${I.ok}저장했어요${fs.length > 1 ? ` · ${fs.length}장` : ''}`;
    setTimeout(close, 1300);
  }

  /* 닫기: 바깥을 누르거나 아래로 밀기 */
  function close() {
    if (closed) return; closed = true; clearTimeout(timer);
    vv?.removeEventListener('resize', onVv); vv?.removeEventListener('scroll', onVv);
    if (edit) endEdit();
    root.style.overflow = ov;
    bg.classList.add('out'); sh.classList.add('out'); setTimeout(() => { bg.remove(); sh.remove(); }, 320);
  }
  bg.onclick = close;
  let ty = null;
  sh.addEventListener('touchstart', e => { if (!e.target.closest('.pgs2, .inp, .rec, .k, .go') && !edit) { ty = e.touches[0].clientY; sh.classList.add('drag'); } }, { passive: true });
  sh.addEventListener('touchmove', e => { if (ty == null) return; sh.style.transform = `translateY(${Math.max(0, e.touches[0].clientY - ty)}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => {
    if (ty == null) return; const d = e.changedTouches[0].clientY - ty; ty = null; sh.classList.remove('drag');
    if (d > 90) return close();
    sh.classList.add('back'); sh.style.transform = ''; setTimeout(() => sh.classList.remove('back'), 420);   // 손을 놓으면 제자리로 부드럽게
  });

  paintRow(); preview();
  return { close };
}
