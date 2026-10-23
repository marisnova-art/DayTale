// 저장 시트: 겉은 아래 시트, 안은 쓰기 도구와 같은 7칸. 고른 대로 미리보기가 바로 바뀌고, 큰 버튼 하나로 저장해요.
// 칸: 4:5 · 9:16 · 날짜 · 날씨 · 장소 · 서명 · 전체/이 장(여러 장일 때만). 영상 카드는 위에 영상 · 커버 줄이 하나 더.
// 고른 것은 이번 저장에만 (카드는 그대로). 비어 있던 장소 · 서명을 여기서 적으면 그건 남아요 (장소 = 카드, 서명 = 설정)
import { ic } from './icons.js';
import * as S from './store.js';
import { buildPages, cardImages, saveImages, signOn } from './export.js';
import { pageBg } from './formats.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sv = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  r45: sv('<rect x="6" y="4" width="12" height="15" rx="2"/>'),
  r916: sv('<rect x="7.5" y="2.5" width="9" height="19" rx="2"/>'),
  all: sv('<rect x="3" y="6" width="10" height="13" rx="2"/><path d="M16 6.5v12M20 7.5v10"/>'),
  one: sv('<rect x="6" y="5" width="12" height="15" rx="2"/>'),
  play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5l11 6.5-11 6.5z"/></svg>',
};

// 위 가운데 알림 (1.2초)
let pillT = 0;
export function pill(text, icon) {
  document.querySelectorAll('.pill').forEach(p => p.remove()); clearTimeout(pillT);
  const p = document.createElement('div'); p.className = 'pill'; p.innerHTML = (icon ? ic(icon) : '') + esc(text);
  document.body.appendChild(p); pillT = setTimeout(() => p.remove(), 1200);
  return p;
}
const pillKeep = text => { const p = pill(text); clearTimeout(pillT); return p; };

const hasVideo = c => [c.bg, ...(c.pst || []).map(p => p?.bg)].some(b => b?.vd);
const dpOn = c => c.fmt === 'rebus' ? 'bottom' : 'top';

export function openSave(c0) {
  const c = c0;   // 장소를 여기서 적으면 이 카드에 남겨요
  const o = {
    ratio: S.pref('saveRatio', '45'),
    date: !!c.datePos && c.datePos !== 'none',
    place: !!(c.place || '').trim(),
    sign: !!S.pref('sign', '') && S.pref('signOn', true),
    all: true,
  };
  let n = 1, at = 0, edit = null, closed = false, ready = null, timer = 0, step = null;

  const bg = document.createElement('div'); bg.className = 'sv-bg';
  const sh = document.createElement('div'); sh.className = 'sv'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', '저장');
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

  /* 미리보기: 피드와 같은 장들. 9:16이면 흐린 바탕 위 가운데에 */
  let ver = 0;
  async function preview() {
    const my = ++ver, pv = $('.pv', sh); if (!pv) return;
    const maxH = Math.max(200, Math.min(innerHeight * .5, 470)), box = sh.clientWidth - 32;
    const H = Math.round(Math.min(maxH, box * 1.25)), story = o.ratio === '916';
    const FW = story ? Math.round(H * 9 / 16) : Math.round(H * .8), CW = story ? Math.round(FW * .86) : FW;
    const v = view(), { h, nodes } = await buildPages(v, CW, Math.min(2, devicePixelRatio || 1));
    if (my !== ver || closed) { h.remove(); return; }
    nodes.forEach(x => x.querySelectorAll('canvas.bgv').forEach(e => e.remove()));
    signOn(nodes, v, signText());
    n = nodes.length; if (at >= n) at = 0;
    const fr = document.createElement('div'); fr.className = 'fr'; fr.style.cssText = `width:${FW}px;height:${story ? H : Math.round(CW * 1.25)}px`;
    const strip = document.createElement('div'); strip.className = 'pgs2'; strip.append(...nodes);
    if (story) {
      const blr = document.createElement('div'); blr.className = 'blr';
      const cp = nodes[at].cloneNode(true); copyCanvas(nodes[at], cp); blr.appendChild(cp);
      const inn = document.createElement('div'); inn.className = 'in'; inn.appendChild(strip);
      fr.append(blr, inn);
    } else fr.appendChild(strip);
    const dots = document.createElement('div'); dots.className = 'dots';
    dots.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i === at ? 'on' : ''}"></i>`).join('') : '';
    pv.replaceChildren(fr, dots);
    h.remove();
    strip.scrollLeft = at * strip.clientWidth;
    strip.addEventListener('scroll', () => {
      const i = Math.round(strip.scrollLeft / strip.clientWidth); if (i === at) return;
      at = i; [...dots.children].forEach((d, k) => d.classList.toggle('on', k === at));
      if (!o.all) paintGo();
    }, { passive: true });
    paintRow(); paintGo(); warm();
  }
  const copyCanvas = (a, b) => { const x = [...a.querySelectorAll('canvas')], y = [...b.querySelectorAll('canvas')]; x.forEach((cv, i) => { try { y[i].width = cv.width; y[i].height = cv.height; y[i].getContext('2d').drawImage(cv, 0, 0); } catch {} }); };

  /* 칸 */
  function paintRow() {
    const vid = hasVideo(c), multi = n > 1;
    const cell = (k, on, html, extra = '') => `<button class="k ${on === 2 ? 'dim' : on ? 'on' : ''} ${extra}" data-k="${k}" aria-label="${LABEL[k]}" aria-pressed="${on === 1}">${html}</button>`;
    $('.vrow', sh).innerHTML = vid ? `${cell('mp4', 2, I.play, 'sp2')}${cell('cover', 1, ic('cover'), 'sp2')}` : '';
    $('.vrow', sh).hidden = !vid;
    $('.row', sh).innerHTML = cell('r45', o.ratio === '45' ? 1 : 0, I.r45) + cell('r916', o.ratio === '916' ? 1 : 0, I.r916)
      + cell('date', o.date ? 1 : 0, ic('date')) + cell('wx', 2, ic('sun')) + cell('place', o.place ? 1 : 0, ic('pin'))
      + cell('sign', o.sign ? 1 : 0, ic('pen')) + (multi ? cell('pages', 1, o.all ? I.all : I.one) : '<span class="k"></span>');
  }
  function paintGo() {
    const k = o.all ? n : 1, b = $('.go', sh);
    if (b && !b.dataset.busy) b.innerHTML = `${ic('save')}사진에 저장${k > 1 ? ` · ${k}장` : ''}`;
  }
  const LABEL = { r45: '4:5', r916: '9:16', date: '날짜', wx: '날씨', place: '장소', sign: '서명', pages: '전체 · 이 장', mp4: '영상', cover: '커버 사진' };

  sh.innerHTML = `<div class="grab"></div><div class="pv"></div><div class="inp" hidden><input enterkeyhint="done" maxlength="40"><button aria-label="확인">${ic('check')}</button></div>
    <div class="g7 vrow" hidden></div><div class="g7 row"></div><button class="go">${ic('save')}사진에 저장</button>`;
  paintRow(); preview();

  const set = (k, msg, icon) => { pill(msg, icon); ready = null; preview(); };
  const tap = k => {
    if (k === 'r45' || k === 'r916') { o.ratio = k === 'r45' ? '45' : '916'; S.setPref('saveRatio', o.ratio); return set(k, LABEL[k]); }
    if (k === 'date') { o.date = !o.date; return set(k, o.date ? '날짜 켬' : '날짜 끔', 'date'); }
    if (k === 'wx') return pill('날씨는 다음 단계에서 들어가요', 'sun');
    if (k === 'mp4') return pill('영상 저장은 다음 단계에서 열려요');
    if (k === 'cover') return pill('커버 사진으로 저장해요', 'cover');
    if (k === 'place') { if (!(c.place || '').trim()) return ask('place'); o.place = !o.place; return set(k, o.place ? '장소 켬' : '장소 끔', 'pin'); }
    if (k === 'sign') { if (!S.pref('sign', '')) return ask('sign'); o.sign = !o.sign; S.setPref('signOn', o.sign); return set(k, o.sign ? '서명 켬' : '서명 끔', 'pen'); }
    if (k === 'pages') { o.all = !o.all; return set(k, o.all ? `전체 ${n}장` : `이 장만 (${at + 1}/${n})`); }
  };
  // 길게 누르면 장소 · 서명을 다시 적어요
  let lp = 0, lpDone = false;
  sh.addEventListener('pointerdown', e => {
    const b = e.target.closest('.k[data-k]'); lpDone = false; clearTimeout(lp);
    if (b && (b.dataset.k === 'place' || b.dataset.k === 'sign')) lp = setTimeout(() => { lpDone = true; ask(b.dataset.k); }, 520);
  });
  sh.addEventListener('pointerup', () => clearTimeout(lp)); sh.addEventListener('pointercancel', () => clearTimeout(lp));
  sh.addEventListener('click', e => {
    const b = e.target.closest('.k[data-k]'); if (!b) return;
    if (lpDone) { lpDone = false; return; }
    tap(b.dataset.k);
  });

  /* 장소 · 서명 적기: 시트 안 한 줄. 키보드 위로 시트가 올라와요 */
  const inp = $('.inp', sh), field = $('input', inp);
  function ask(k) {
    edit = k; inp.hidden = false;
    field.placeholder = k === 'place' ? '장소' : '서명 (예: @andrew)';
    field.value = k === 'place' ? (c.place || '') : S.pref('sign', '');
    field.focus();
  }
  function commit() {
    const v = field.value.trim(), k = edit; edit = null; inp.hidden = true; field.blur();
    if (k === 'place') {
      c.place = v; o.place = !!v; S.saveCard(c);
      if (v) S.setPref('places', [v, ...S.pref('places', []).filter(x => x !== v)].slice(0, 20));
      pill(v ? '장소 켬' : '장소 끔', 'pin');
    } else if (k === 'sign') {
      S.setPref('sign', v); o.sign = !!v; S.setPref('signOn', o.sign);
      pill(v ? '서명 켬' : '서명 끔', 'pen');
    }
    ready = null; preview();
  }
  $('button', inp).addEventListener('pointerdown', e => e.preventDefault());
  $('button', inp).onclick = commit;
  field.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  field.addEventListener('blur', () => setTimeout(() => { if (edit && document.activeElement !== field) { edit = null; inp.hidden = true; } }, 120));

  const vv = window.visualViewport;
  const lift = () => {
    const h = vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0;
    sh.style.setProperty('--svb', (h > 80 ? h : 0) + 'px'); sh.classList.toggle('kb', h > 80);
  };
  vv?.addEventListener('resize', lift); vv?.addEventListener('scroll', lift);

  /* 저장: 고르는 동안 이미지를 미리 만들어 둬요 (아이폰은 누른 바로 그때 공유 창을 열어야 해서) */
  const key = () => JSON.stringify([o, signText(), pages(), c.place]);
  const make = () => { const k = key(); const p = cardImages(view(), { ratio: o.ratio, sign: signText(), pages: pages(), onStep: (i, t) => step = [i, t] }); ready = { k, p }; p.catch(() => {}); return ready; };
  const warm = () => { clearTimeout(timer); timer = setTimeout(() => { if (!closed && !edit && (!ready || ready.k !== key())) make(); }, 700); };
  warm();

  const go = $('.go', sh);
  let files = null;
  go.onclick = async () => {
    if (go.dataset.busy) return;
    if (files) return share(files);
    if (!ready || ready.k !== key()) make();
    const r = ready; let t = 0;
    if (!(await done(r.p))) {   // 아직 만드는 중: 진행을 보여 줘요
      go.dataset.busy = 1; go.disabled = true;
      const p = pillKeep('');
      t = setInterval(() => { if (step) p.textContent = `만드는 중 ${step[0]}/${step[1]}`; }, 120);
    }
    try { files = await r.p; }
    catch (e) { console.error(e); clearInterval(t); unbusy(); files = null; return pill('저장하지 못했어요. 다시 해 주세요'); }
    clearInterval(t);
    if (go.dataset.busy) {   // 기다렸다면 누른 효과가 끝났을 수 있어요: 한 번 더 눌러 공유 창을 열어요
      unbusy(); go.innerHTML = `${ic('save')}사진에 저장하기`; pill('준비됐어요', 'check');
      return;
    }
    share(files);
  };
  const unbusy = () => { delete go.dataset.busy; go.disabled = false; document.querySelectorAll('.pill').forEach(p => p.remove()); };
  const done = p => Promise.race([p.then(() => true, () => true), new Promise(ok => setTimeout(() => ok(false), 30))]);
  async function share(fs) {
    const r = await saveImages(fs);
    if (r === 'again') { go.innerHTML = `${ic('save')}사진에 저장하기`; return pill('한 번 더 눌러 주세요'); }
    files = null;
    if (r === 'cancel') return;
    close(); pill(`사진 ${fs.length}장을 저장했어요`, 'check');
  }

  /* 닫기: 바깥을 누르거나 아래로 밀기 */
  function close() {
    if (closed) return; closed = true; clearTimeout(timer);
    vv?.removeEventListener('resize', lift); vv?.removeEventListener('scroll', lift);
    bg.classList.add('out'); sh.classList.add('out'); setTimeout(() => { bg.remove(); sh.remove(); }, 200);
  }
  bg.onclick = close;
  let y0 = null;
  sh.addEventListener('touchstart', e => { if (!e.target.closest('.pgs2, .inp, .k, .go')) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 == null) return; const d = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${d}px)`; }, { passive: true });
  sh.addEventListener('touchend', e => { if (y0 == null) return; const d = e.changedTouches[0].clientY - y0; y0 = null; sh.style.transform = ''; if (d > 90) close(); });
  return { close };
}
