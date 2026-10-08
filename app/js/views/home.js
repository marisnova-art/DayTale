/* 감성형 홈: 날짜 · 이야기(오늘 할 일·일정도 문장 속에) · 질문 입력창. PC는 오른쪽에 오늘 패널 */
import { Account } from '../data/account.js';
import { S, addEntry, displayTitle, live } from '../data/store.js';
import { Photos } from '../features/photos.js';
import { Weather } from '../features/weather.js';
import { compose } from '../story/engine.js';
import { nextQuestion, pickQuestion } from '../story/questions.js';
import { fmtDate, fmtTime, t } from '../core/i18n.js';
import { esc, h, icon, slotOf, todayKey } from '../core/utils.js';
import { toast } from '../ui/feedback.js';
import { todayPanel } from './today.js';

let cache = null;   // 같은 시간대·같은 기록이면 이야기를 다시 쓰지 않아요
const sig = () => { const a = live(); return a.length + ':' + a.reduce((m, e) => e.updated_at > m ? e.updated_at : m, ''); };

function story() {
  const key = todayKey() + slotOf() + sig() + (Account.name() || '') + Account.avatar().length + (Weather.current()?.at || '');
  if (cache?.key === key) return cache;
  const wx = Weather.current();
  const { ctx, paragraphs, recall } = compose({ name: Account.name(), weather: wx, city: wx?.city, max: matchMedia('(min-width: 900px)').matches ? 5 : 3 });
  ctx.weather = wx;
  const recallPh = p => p.recall && p.entry?.photos?.length ? `<a class="recall-ph" href="#/e/${p.entry.id}" aria-label="${esc(displayTitle(p.entry, t('common.untitled')))}">${p.entry.photos.slice(0, 3).map(ph => Photos.imgTag(ph)).join('')}</a>` : '';
  const html = paragraphs.map(p => typeof p === 'string' ? `<p>${p}</p>` : `<p>${p.html}</p>${recallPh(p)}`).join('');
  // 이름 앞에 스티커 크기의 프로필 사진
  const av = Account.avatar();
  const out = av ? html.replace('<a class="w" href="#/settings/account">', `<a class="w" href="#/settings/account"><img class="st av" src="${esc(av)}" alt="" referrerpolicy="no-referrer">`) : html;
  cache = { key, html: out, ctx, recall, fresh: true };
  return cache;
}

/* 정리형(실용 모드): 이야기 대신 오늘 패널과 최근 기록 */
async function renderTidy(view) {
  const { row } = await import('./list.js');
  const recent = live().filter(e => e.type !== 'todo' && e.type !== 'event').sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
  view.innerHTML = `<div class="home-wrap"><section class="home tidy">
    <div class="when"><span>${esc(fmtDate(new Date(), { month: 'long', day: 'numeric', weekday: 'long' }))}</span><i></i><b class="clock">${esc(fmtTime(new Date()))}</b></div>
    <label class="ask" style="margin-top:16px"><textarea rows="1" placeholder="${esc(t('home.ph.day'))}" aria-label="${esc(t('nav.new'))}" enterkeyhint="send" maxlength="5000"></textarea><button class="go" aria-label="${esc(t('home.send'))}" hidden>${icon('arrow-up-bold', 18)}</button></label>
    <div class="tidy-today" style="margin-top:18px;background:var(--sheet);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:4px 18px 8px"></div>
    ${recent.length ? `<div class="grp"><span>${esc(t('nav.all'))}</span><a href="#/all" style="color:var(--muted)">${esc(t('common.seeAll'))}</a></div><div class="card">${recent.map(e => row(e)).join('')}</div>` : ''}
    <div class="spacer"></div></section></div>`;
  view.querySelector('.tidy-today').append(todayPanel());
  const ta = view.querySelector('textarea'), go = view.querySelector('.go');
  ta.addEventListener('input', () => { go.hidden = !ta.value.trim(); });
  const send = async () => { const text = ta.value.trim(); if (!text) return; const e = await addEntry({ type: 'note', content: text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join(''), text }); if (e) { ta.value = ''; go.hidden = true; toast(t('home.saved')); } };
  go.onclick = send;
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); send(); } });
}

function render(view) {
  if (S.prefs.mode === 'tidy') return renderTidy(view);
  const s = story(); const now = new Date();
  const q = pickQuestion(s.ctx, { recall: s.recall });
  view.innerHTML = `<div class="home-wrap"><section class="home">
      <div class="when"><span>${esc(fmtDate(now, { month: 'long', day: 'numeric', weekday: 'long' }))}</span><i></i><b class="clock">${esc(fmtTime(now))}</b></div>
      <div class="story${s.fresh ? ' fade-in' : ''}" aria-live="polite">${s.html}</div>
      <div class="askq"><p class="q"><button class="qtext" title="${esc(t('home.questions'))}">${esc(q)}</button></p>
        <label class="ask"><textarea rows="1" placeholder="${esc(t('home.ph.' + slotOf()))}" aria-label="${esc(q)}" enterkeyhint="send" maxlength="5000"></textarea>
          <button class="go" aria-label="${esc(t('home.send'))}" hidden>${icon('arrow-up-bold', 18)}</button></label></div>
      ${s.ctx.weather ? '<p class="wxcredit">Weather data from <a href="https://www.met.no/en" target="_blank" rel="noopener">MET Norway</a></p>' : ''}
      <div class="spacer"></div>
    </section><aside class="today-side"></aside></div>`;
  s.fresh = false; Photos.hydrate(view);
  view.querySelector('.today-side').append(todayPanel());
  const ta = view.querySelector('textarea'), go = view.querySelector('.go');
  const sync = () => { go.hidden = !ta.value.trim(); };
  ta.addEventListener('input', sync);
  const send = async () => {
    const text = ta.value.trim(); if (!text) return;
    const e = await addEntry({ type: 'note', content: text.split('\n').map(l => `<p>${esc(l) || '<br>'}</p>`).join(''), text, meta: { prompt: q } });
    if (!e) return;
    ta.value = ''; sync(); toast(t('home.saved'), { action: t('common.open'), onAction: () => { location.hash = '#/e/' + e.id; } });
  };
  go.onclick = send;
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && matchMedia('(pointer:fine)').matches) { e.preventDefault(); send(); } });
  view.querySelector('.qtext').onclick = () => { const nq = nextQuestion(s.ctx, q); view.querySelector('.qtext').textContent = nq; ta.setAttribute('aria-label', nq); };
  // 시계
  clearInterval(render.timer); render.timer = setInterval(() => { const c = view.querySelector('.clock'); if (!c) return clearInterval(render.timer); c.textContent = fmtTime(new Date()); }, 30000);
}
/* 다시 그릴 때 입력 중인 글은 지키기 */
function refresh(view) {
  if (S.prefs.mode === 'tidy') { if (document.activeElement?.tagName !== 'TEXTAREA') renderTidy(view); return; }
  const ta = view.querySelector('.ask textarea'); const keep = ta?.value || ''; const focused = document.activeElement === ta;
  render(view);
  if (keep) { const n = view.querySelector('.ask textarea'); n.value = keep; n.dispatchEvent(new Event('input')); if (focused) n.focus(); }
}

export { refresh, render };
