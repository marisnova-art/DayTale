/* 캘린더: 주 | 월. 하루 점은 종류별로 3개까지(일정·할 일·기록). 끝낸 할 일은 점에서 빠져요. */
import { S, addEntry, displayTitle, live, patchEntry } from '../data/store.js';
import { TYPE_ICON } from '../ui/shell.js';
import { fmtDate, fmtHM, t } from '../core/i18n.js';
import { addDays, dayKey, esc, icon, nowISO, parseDay, startOfWeek, todayKey } from '../core/utils.js';
import { promptDlg } from '../ui/feedback.js';
import { go } from '../ui/router.js';

const COL = { event: 'var(--event)', todo: 'var(--todo)', record: 'var(--record)' };
const isPC = () => matchMedia('(min-width: 900px)').matches;
let state = { view: null, sel: todayKey(), filter: 'all' };

/* 날짜별 묶음: 일정(meta.date), 할 일(마감일), 기록(만든 날) */
function index() {
  const m = new Map(); const put = (k, kind, e) => { if (!k) return; if (!m.has(k)) m.set(k, { event: [], todo: [], record: [] }); m.get(k)[kind].push(e); };
  for (const e of live()) {
    if (e.type === 'event') put(e.meta.date, 'event', e);
    else if (e.type === 'todo') put(e.meta.date || (e.meta.done && e.meta.doneAt ? dayKey(new Date(e.meta.doneAt)) : null), 'todo', e);
    else put(dayKey(new Date(e.created_at)), 'record', e);
  }
  m.forEach(d => { d.event.sort((a, b) => (a.meta.time || '99').localeCompare(b.meta.time || '99')); d.todo.sort((a, b) => (a.meta.done ? 1 : 0) - (b.meta.done ? 1 : 0)); d.record.sort((a, b) => a.created_at.localeCompare(b.created_at)); });
  return m;
}
const dots = d => !d ? '' : ['event', 'todo', 'record'].filter(k => k === 'todo' ? d.todo.some(e => !e.meta.done) : d[k].length).slice(0, 3).map(k => `<u style="background:${COL[k]}"></u>`).join('');
const pass = kind => state.filter === 'all' || state.filter === kind;

function item(e, kind) {
  const m = e.meta || {};
  const lead = kind === 'event' ? '<span class="bar" style="background:var(--event)"></span>'
    : kind === 'todo' ? `<button class="chk${m.done ? ' on' : ''}" data-done="${e.id}" aria-label="${esc(t('common.done'))}">${m.done ? icon('check', 12) : ''}</button>`
    : `<span class="ki">${icon(TYPE_ICON[e.type] || 'file-text', 18)}</span>`;
  const meta = kind === 'event' ? (m.time ? fmtHM(m.time) : '') : kind === 'todo' ? (!m.done && m.date === todayKey() ? t('todo.due') : '') : fmtHM(new Date(e.created_at).toTimeString().slice(0, 5));
  return `<a class="ev" href="#/e/${e.id}">${lead}<span class="t${m.done ? ' done' : ''}">${esc(displayTitle(e, t('common.untitled')))}</span><span class="mt">${esc(meta)}</span></a>`;
}
function dayBlock(k, d, { full = true } = {}) {
  const day = parseDay(k), today = todayKey();
  const list = d ? [...(pass('event') ? d.event.map(e => item(e, 'event')) : []), ...(pass('todo') ? d.todo.map(e => item(e, 'todo')) : []), ...(state.filter === 'all' ? d.record.map(e => item(e, 'record')) : [])] : [];
  const title = k === today ? t('cal.today') : fmtDate(day, full ? { weekday: 'long' } : { month: 'long', day: 'numeric' });
  const sub = k === today || full ? fmtDate(day, { month: 'long', day: 'numeric', weekday: k === today ? 'long' : undefined }) : fmtDate(day, { weekday: 'long' }) + (list.length ? ' · ' + t('cal.count', { n: list.length }) : '');
  return `<div class="dh"><span><b>${esc(title)}</b><span class="s">${esc(sub)}</span></span><button class="add${k === state.sel || !full ? '' : ' only'}" data-add="${k}" aria-label="${esc(t('cal.add'))}">${icon('plus', 15)}${k === state.sel || !full ? esc(t('cal.add')) : ''}</button></div>` +
    (list.length ? list.join('') : `<div class="blank">${esc(t('cal.empty'))}</div>`);
}

function render(view, r) {
  if (r.query.d) state.sel = r.query.d;
  if (!state.view) state.view = isPC() ? 'month' : 'week';
  view.innerHTML = `<section class="cal"></section>`;
  const root = view.querySelector('.cal');
  root.addEventListener('click', async ev => {
    const b = ev.target.closest('button,[data-day]'); if (!b) return;
    if (b.dataset.done) { ev.preventDefault(); const e = S.entries.get(b.dataset.done); const d = !e.meta.done; await patchEntry(e.id, { meta: { ...e.meta, done: d, doneAt: d ? nowISO() : null } }); return; }
    if (b.dataset.v) { state.view = b.dataset.v; }
    else if (b.dataset.nav) { const n = +b.dataset.nav; const d = parseDay(state.sel); state.sel = dayKey(state.view === 'week' ? addDays(d, 7 * n) : new Date(d.getFullYear(), d.getMonth() + n, 1)); }
    else if ('today' in b.dataset) state.sel = todayKey();
    else if (b.dataset.f) state.filter = b.dataset.f;
    else if (b.dataset.add) { quickAdd(b.dataset.add); return; }
    else if (b.dataset.day) { if (isPC() && state.view === 'month' && state.sel === b.dataset.day && !ev.target.closest('a')) { quickAdd(b.dataset.day); return; } state.sel = b.dataset.day; }
    else return;
    paint(root);
  });
  view.paintCal = () => paint(root);
  paint(root);
}
async function quickAdd(k) {
  if (!isPC()) { go('/new?type=event&date=' + k); return; }
  const title = await promptDlg(t('cal.quick', { date: fmtDate(parseDay(k), { month: 'long', day: 'numeric' }) }), { placeholder: t('ed.title'), ok: t('cal.asEvent') });
  if (title) await addEntry({ type: 'event', title, meta: { date: k } });
}
function paint(root) {
  const idx = index(), sel = parseDay(state.sel), today = todayKey(), ws = S.prefs.weekStart || 0;
  root.className = 'cal ' + state.view;
  const wdays = [...Array(7)].map((_, i) => addDays(startOfWeek(new Date(2026, 0, 4), ws), i));
  const wkh = `<div class="wkh">${wdays.map(d => `<span class="${d.getDay() === 0 || d.getDay() === 6 ? 'we' : ''}">${esc(fmtDate(d, { weekday: 'narrow' }))}</span>`).join('')}</div>`;
  const head = `<div class="cal-head"><h1>${esc(fmtDate(sel, { month: 'long' }))}<small>${sel.getFullYear()}</small></h1><span class="r">
    <button class="today-btn" data-today>${esc(t('cal.today'))}</button>
    <span class="seg" role="tablist"><button data-v="week" class="${state.view === 'week' ? 'on' : ''}" role="tab">${esc(t('cal.week'))}</button><button data-v="month" class="${state.view === 'month' ? 'on' : ''}" role="tab">${esc(t('cal.month'))}</button></span></span></div>
    <div class="filters">${['all', 'event', 'todo'].map(f => `<button class="chip${state.filter === f ? ' on' : ''}" data-f="${f}">${esc(t(f === 'all' ? 'list.all' : f === 'event' ? 'cal.events' : 'cal.todos'))}</button>`).join('')}</div>`;
  let main = '', side = '';
  if (state.view === 'week') {
    const s0 = startOfWeek(sel, ws), days = [...Array(7)].map((_, i) => addDays(s0, i));
    main = `<div class="wkrow"><button class="navbtn" data-nav="-1" aria-label="${esc(t('cal.prevWeek'))}">${icon('chevron-left', 18)}</button>
      <div class="weekstrip">${days.map(d => { const k = dayKey(d); return `<button class="day${k === state.sel ? ' on' : ''}${d.getDay() === 0 || d.getDay() === 6 ? ' we' : ''}" data-day="${k}">${esc(fmtDate(d, { weekday: 'narrow' }))}<b>${d.getDate()}</b><span class="dots">${dots(idx.get(k)).replace(/<u /g, '<i ').replace(/<\/u>/g, '</i>')}</span></button>`; }).join('')}</div>
      <button class="navbtn" data-nav="1" aria-label="${esc(t('cal.nextWeek'))}">${icon('chevron-right', 18)}</button></div>
      <div class="agenda">${days.filter(d => !days.some(x => dayKey(x) === today) || dayKey(d) >= today).map(d => dayBlock(dayKey(d), idx.get(dayKey(d)))).join('')}</div>
      <div class="pcw">${days.map(d => { const k = dayKey(d), x = idx.get(k); const list = x ? [...(pass('event') ? x.event.map(e => item(e, 'event')) : []), ...(pass('todo') ? x.todo.map(e => item(e, 'todo')) : []), ...(state.filter === 'all' ? x.record.map(e => item(e, 'record')) : [])] : [];
        return `<div class="col${k === today ? ' today' : ''}"><div class="hd" data-day="${k}">${esc(fmtDate(d, { weekday: 'short' }))}<b>${d.getDate()}</b></div>${list.join('')}<button class="add only" data-add="${k}" aria-label="${esc(t('cal.add'))}" style="align-self:flex-start;margin-top:auto">${icon('plus', 15)}</button></div>`; }).join('')}</div>`;
  } else {
    const first = new Date(sel.getFullYear(), sel.getMonth(), 1), g0 = startOfWeek(first, ws);
    const weeks = Math.ceil(((first - g0) / 864e5 + new Date(sel.getFullYear(), sel.getMonth() + 1, 0).getDate()) / 7);
    const cells = [...Array(weeks * 7)].map((_, i) => addDays(g0, i));
    main = `<div class="mbox"><div class="bar"><button class="navbtn" data-nav="-1" aria-label="${esc(t('cal.prevMonth'))}">${icon('chevron-left', 18)}</button>
        <span class="legend"><span><u style="background:var(--event)"></u>${esc(t('cal.events'))}</span><span><u style="background:var(--todo)"></u>${esc(t('cal.todos'))}</span><span><u style="background:var(--record)"></u>${esc(t('cal.recs'))}</span></span>
        <button class="navbtn" data-nav="1" aria-label="${esc(t('cal.nextMonth'))}">${icon('chevron-right', 18)}</button></div>${wkh}
      <div class="mgrid">${cells.map(d => { const k = dayKey(d); const cls = [d.getMonth() !== sel.getMonth() && 'o', (d.getDay() === 0 || d.getDay() === 6) && 'we', k === state.sel && 'on', k === today && 'today'].filter(Boolean).join(' '); return `<button class="mc ${cls}" data-day="${k}">${d.getDate()}<i>${d.getMonth() === sel.getMonth() ? dots(idx.get(k)) : ''}</i></button>`; }).join('')}</div></div>
      <div class="pcm"><div class="bar" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px 0"><button class="navbtn" data-nav="-1" aria-label="${esc(t('cal.prevMonth'))}">${icon('chevron-left', 18)}</button><span class="legend"><span><u style="background:var(--event)"></u>${esc(t('cal.events'))}</span><span><u style="background:var(--todo)"></u>${esc(t('cal.todos'))}</span><span><u style="background:var(--record)"></u>${esc(t('cal.recs'))}</span></span><button class="navbtn" data-nav="1" aria-label="${esc(t('cal.nextMonth'))}">${icon('chevron-right', 18)}</button></div>${wkh}
        <div class="g">${cells.map(d => { const k = dayKey(d), x = idx.get(k); const cls = [d.getMonth() !== sel.getMonth() && 'o', (d.getDay() === 0 || d.getDay() === 6) && 'we', k === state.sel && 'on', k === today && 'today'].filter(Boolean).join(' ');
          const chips = x ? [...(pass('event') ? x.event.map(e => `<a class="chipx e" href="#/e/${e.id}">${e.meta.time ? `<span class="tm">${esc(e.meta.time)}</span>` : ''}${esc(displayTitle(e, ''))}</a>`) : []), ...(pass('todo') ? x.todo.map(e => `<a class="chipx t${e.meta.done ? ' done' : ''}" href="#/e/${e.id}">${esc(displayTitle(e, ''))}</a>`) : [])] : [];
          return `<div class="c ${cls}" data-day="${k}"><span class="n">${d.getDate()}</span>${chips.slice(0, 3).join('')}${chips.length > 3 ? `<span class="more">${esc(t('cal.more', { n: chips.length - 3 }))}</span>` : ''}${x?.record.length && state.filter === 'all' ? `<span class="rec">${esc(t('cal.records', { n: x.record.length }))}</span>` : ''}</div>`; }).join('')}</div></div>`;
    side = `<div class="agenda">${dayBlock(state.sel, idx.get(state.sel), { full: false })}</div>`;
  }
  root.innerHTML = head + `<div class="cal-body"><div class="cal-main">${main}${state.view === 'month' && !isPC() ? side : ''}</div>${isPC() && state.view === 'month' ? `<aside class="cal-side">${side}</aside>` : ''}</div><div style="height:120px"></div>`;
}
const refresh = view => view.paintCal?.();

export { refresh, render };
