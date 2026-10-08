/* 오늘 패널: 주간 줄, 일정, 할 일 (시트와 PC 오른쪽에서 같이 써요) */
import { S, displayTitle, live, patchEntry } from '../data/store.js';
import { fmtDate, fmtHM, t } from '../core/i18n.js';
import { addDays, dayKey, esc, h, icon, nowISO, startOfWeek, todayKey } from '../core/utils.js';

const COLORS = { event: 'var(--event)', todo: 'var(--todo)', record: 'var(--record)' };
function dotsFor(k, all) {
  const kinds = new Set();
  all.forEach(e => { const d = e.meta.date || dayKey(new Date(e.created_at)); if (d !== k) return; if (e.type === 'event') kinds.add('event'); else if (e.type === 'todo') { if (!e.meta.done) kinds.add('todo'); } else kinds.add('record'); });
  return ['event', 'todo', 'record'].filter(x => kinds.has(x)).slice(0, 3).map(x => `<i style="background:${COLORS[x]}"></i>`).join('');
}
function todayPanel({ onOpen } = {}) {
  const el = h('<div class="today"></div>');
  const paint = () => {
    const today = todayKey(), all = live(), now = new Date();
    const ws = startOfWeek(now, S.prefs.weekStart);
    const days = [...Array(7)].map((_, i) => addDays(ws, i));
    const events = all.filter(e => e.type === 'event' && e.meta.date === today).sort((a, b) => (a.meta.time || '').localeCompare(b.meta.time || ''));
    const todos = all.filter(e => e.type === 'todo' && (!e.meta.date || e.meta.date <= today) && (!e.meta.done || dayKey(new Date(e.meta.doneAt || 0)) === today))
      .sort((a, b) => (a.meta.done ? 1 : 0) - (b.meta.done ? 1 : 0) || (a.meta.date || '9').localeCompare(b.meta.date || '9'));
    const done = todos.filter(e => e.meta.done).length;
    el.innerHTML = `<div class="top"><h2>${esc(t('home.today'))}<small>${esc(fmtDate(now, { month: 'long', day: 'numeric' }))}</small></h2><a class="chip" href="#/calendar">${esc(t('common.seeAll'))}</a></div>
      <div class="weekstrip">${days.map(d => { const k = dayKey(d), we = d.getDay() === 0 || d.getDay() === 6; return `<a class="day${k === today ? ' on' : ''}${we ? ' we' : ''}" href="#/calendar?d=${k}">${esc(fmtDate(d, { weekday: 'narrow' }))}<b>${d.getDate()}</b><span class="dots">${dotsFor(k, all)}</span></a>`; }).join('')}</div>
      ${events.length ? `<div class="lbl">${esc(t('type.event'))}</div>` + events.map(e => `<a class="trow" href="#/e/${e.id}"><span class="ev">${icon('calendar', 20)}</span><span class="t">${esc(displayTitle(e, t('common.untitled')))}</span><span class="tm">${esc(e.meta.time ? fmtHM(e.meta.time) : '')}</span></a>`).join('') : ''}
      ${todos.length ? `<div class="lbl">${esc(t('type.todo'))} <em>${done}/${todos.length}</em></div>` + todos.map(e => `<div class="trow"><button class="chk${e.meta.done ? ' on' : ''}" data-done="${e.id}" aria-label="${esc(t('common.done'))}" aria-pressed="${!!e.meta.done}">${e.meta.done ? icon('check', 14) : ''}</button><a class="t${e.meta.done ? ' done' : ''}" href="#/e/${e.id}">${esc(displayTitle(e, t('common.untitled')))}</a>${!e.meta.done && e.meta.date === today ? `<span class="due">${esc(t('todo.due'))}</span>` : ''}</div>`).join('') : ''}
      ${!events.length && !todos.length ? `<div class="empty">${esc(t('home.empty'))}</div>` : ''}`;
  };
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-done]'); if (b) { const en = S.entries.get(b.dataset.done); const d = !en.meta.done; await patchEntry(en.id, { meta: { ...en.meta, done: d, doneAt: d ? nowISO() : null } }); paint(); return; }
    if (e.target.closest('a')) onOpen?.();
  });
  paint(); el.paint = paint;
  return el;
}
const leftCount = () => { const today = todayKey(); const all = live(); return all.filter(e => e.type === 'event' && e.meta.date === today).length + all.filter(e => e.type === 'todo' && !e.meta.done && (!e.meta.date || e.meta.date <= today)).length; };
const firstLeft = () => { const today = todayKey(); const all = live(); const e = all.filter(e => e.type === 'event' && e.meta.date === today).sort((a, b) => (a.meta.time || '').localeCompare(b.meta.time || ''))[0] || all.find(e => e.type === 'todo' && !e.meta.done && (!e.meta.date || e.meta.date <= today)); return e ? displayTitle(e, '') + (e.meta.time ? ' ' + e.meta.time : '') : ''; };

export { firstLeft, leftCount, todayPanel };
