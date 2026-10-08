/* 이야기 엔진: 오늘의 공기 → 오늘 할 것 → 쌓아 온 것 → 회상 → 맺음.
   문장 묶음은 앱 안 기본값 + 서버 phrase_packs(앱 배포 없이 계절·명절 문장 추가)를 합쳐 써요. */
import ko from './ko.js';
import en from './en.js';
import ja from './ja.js';
import es from './es.js';
import fr from './fr.js';
import { S, displayTitle, live, setPref } from '../data/store.js';
import { fmtHM, getLang, t } from '../core/i18n.js';
import { addDays, dayKey, esc, ls, parseDay, seasonOf, slotOf, todayKey } from '../core/utils.js';
import { sticker } from '../core/stickers.js';

const BASE = { ko, en, ja, es, fr };
let remote = {};   // { lang: { part: [{ cond, text, weight }] } }
const setRemote = rows => { remote = {}; rows.forEach(r => { ((remote[r.lang] ||= {})[r.slot] ||= []).push(r); }); };

/* ---------- 한국어 조사 ---------- */
const JOSA = { '은': ['은', '는'], '이': ['이', '가'], '을': ['을', '를'], '과': ['과', '와'], '으로': ['으로', '로'], '이에요': ['이에요', '예요'] };
function batchim(word) {
  const s = String(word).replace(/<[^>]+>/g, '').trim(); const c = s.charCodeAt(s.length - 1);
  if (c >= 0xAC00 && c <= 0xD7A3) { const jong = (c - 0xAC00) % 28; return { has: jong > 0, rieul: jong === 8 }; }
  if (/[0-9]$/.test(s)) { const d = s.slice(-1); return { has: '0136789'.includes(d), rieul: '178'.includes(d) }; }
  return { has: /[bcdfgjklmnpqstvxz]$/i.test(s) && !/e$/i.test(s), rieul: /l$/i.test(s) };
}
function josa(word, key) { const p = JOSA[key]; if (!p) return ''; const b = batchim(word); if (key === '으로' && b.rieul) return '로'; return b.has ? p[0] : p[1]; }

/* ---------- 고르기: 조건 맞춤 + 가중치 + 최근 반복 피하기 ---------- */
const seen = () => ls.get('daytale.story.seen', {});
function pickText(list, key) {
  if (!list?.length) return '';
  const recent = seen()[key] || [];
  const fresh = list.filter(x => !recent.includes(typeof x === 'string' ? x : x.text));
  const pool = fresh.length ? fresh : list;
  const total = pool.reduce((a, x) => a + (x.weight || x.w || 1), 0);
  let r = Math.random() * total, out = pool[0];
  for (const x of pool) { r -= x.weight || x.w || 1; if (r <= 0) { out = x; break; } }
  const text = typeof out === 'string' ? out : out.text;
  const all = seen(); all[key] = [text, ...(all[key] || [])].slice(0, Math.max(1, Math.floor(list.length / 2))); ls.set('daytale.story.seen', all);
  return text;
}
const match = (cond = {}, ctx) => Object.entries(cond).every(([k, v]) => k === 'tod' ? v === ctx.slot : k === 'wx' ? v === ctx.weather?.kind : k === 'season' ? v === ctx.season
  : k === 'cold' ? (ctx.weather?.temp ?? 99) <= 5 : k === 'hot' ? (ctx.weather?.temp ?? -99) >= 28 : k === 'dow' ? v === ctx.now.getDay() : k === 'holiday' ? v === ctx.holiday : true);

/* ---------- 문장 채우기 ---------- */
const link = (href, html) => `<a class="w" href="${href}">${html}</a>`;
const num = (s) => String(s).replace(/(\d[\d,.]*°?)/g, '<span class="n">$1</span>');
function fill(text, vars) {
  return text
    .replace(/\[(\w+)\]\s?/g, (_, n) => (sticker(n) ? sticker(n) + ' ' : ''))
    .replace(/\{(\w+)\}(?:\{(은|이|을|과|으로|이에요)\})?/g, (_, k, j) => {
      const v = vars[k]; if (v == null) return '';
      const html = typeof v === 'object' ? v.html : esc(v);
      const plain = typeof v === 'object' ? v.plain : v;
      return html + (j ? josa(plain, j) : '');
    });
}

/* ---------- 오늘 상황 모으기 ---------- */
function gather(now = new Date()) {
  const today = todayKey(), all = live();
  const created = e => dayKey(new Date(e.created_at));
  const events = all.filter(e => e.type === 'event' && e.meta.date === today).sort((a, b) => (a.meta.time || '99').localeCompare(b.meta.time || '99'));
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const upcoming = events.filter(e => !e.meta.time || e.meta.time >= hm);
  const todos = all.filter(e => e.type === 'todo' && !e.meta.done && (!e.meta.date || e.meta.date <= today));
  const doneToday = all.filter(e => e.type === 'todo' && e.meta.done && e.meta.doneAt && dayKey(new Date(e.meta.doneAt)) === today);
  const writtenToday = all.filter(e => created(e) === today && e.type !== 'todo' && e.type !== 'event').sort((a, b) => b.created_at.localeCompare(a.created_at));
  // 연속 기록 일수 (오늘 또는 어제까지)
  const days = new Set(all.map(created)); let streak = 0;
  for (let d = days.has(today) ? now : addDays(now, -1); days.has(dayKey(d)); d = addDays(d, -1)) streak++;
  const weekStart = addDays(now, -((now.getDay() + 6) % 7));
  const week = all.filter(e => created(e) >= dayKey(weekStart)).length;
  return { now, slot: slotOf(now), season: seasonOf(now), today, all, events, upcoming, todos, doneToday, writtenToday, streak, week, first: all.length === 0 };
}

/* ---------- 회상: 기념일 > N년 전 > 한 달 전 > 지난주 > 작년 이맘때 > 무작위. 2주 안 반복 금지 ---------- */
function pickRecall(ctx) {
  const used = S.prefs.recallSeen || {}; const cut = dayKey(addDays(ctx.now, -14));
  const ok = e => !used[e.id] || used[e.id] < cut;
  const mmdd = ctx.today.slice(5);
  const ann = (S.prefs.days || []).find(d => d.date.slice(-5) === mmdd);
  if (ann) return { kind: 'anniversary', label: ann.label };
  const byDay = k => ctx.all.filter(e => dayKey(new Date(e.created_at)) === k && e.type !== 'todo' && ok(e));
  const y = ctx.now.getFullYear();
  for (let n = 1; n <= 10; n++) { const k = `${y - n}-${mmdd}`; const hit = byDay(k)[0]; if (hit) return { kind: 'yearsAgo', e: hit, n }; }
  const m = byDay(dayKey(new Date(ctx.now.getFullYear(), ctx.now.getMonth() - 1, ctx.now.getDate())))[0]; if (m) return { kind: 'monthAgo', e: m };
  const w = byDay(dayKey(addDays(ctx.now, -7)))[0]; if (w) return { kind: 'lastWeek', e: w };
  const from = dayKey(addDays(ctx.now, -372)), to = dayKey(addDays(ctx.now, -358));
  const ls_ = ctx.all.filter(e => { const k = dayKey(new Date(e.created_at)); return k >= from && k <= to && ok(e) && e.type !== 'todo'; }); if (ls_.length) return { kind: 'lastSeason', e: ls_[0] };
  // 무작위: 사진이 있거나 긴 기록, 30일 넘은 것
  const old = dayKey(addDays(ctx.now, -30));
  const pool = ctx.all.filter(e => dayKey(new Date(e.created_at)) < old && ok(e) && (e.photos?.length || (e.text || '').length > 120));
  if (pool.length && Math.random() < .5) return { kind: 'random', e: pool[Math.floor(Math.random() * pool.length)] };
  return null;
}

/* 하루 한 시간대 동안은 같은 이야기를 보여 줘요 (새 기록이 생기면 다시 씀) */
function compose({ name, weather = null, city = null, holiday = null, max = 3 } = {}) {
  const lang = BASE[getLang()] ? getLang() : 'en', P = BASE[lang], R = remote[lang] || {};
  const ctx = gather(); ctx.weather = weather; ctx.holiday = holiday;
  const W = P.words, out = [];
  const entryLink = e => ({ html: link('#/e/' + e.id, esc(displayTitle(e, t('common.untitled')))), plain: displayTitle(e, t('common.untitled')) });
  const vars = { name: { html: link('#/settings/account', esc(name)), plain: name } };
  const extra = part => (R[part] || []).filter(r => match(r.cond, ctx));

  // 1. 오늘의 공기
  let p1 = fill(pickText([...P.greet[ctx.slot], ...extra('greet').map(r => r)], 'greet.' + ctx.slot), vars);
  const airs = [...P.air.filter(a => match(a.if, ctx)).flatMap(a => a.t.map(text => ({ text, w: a.w || (a.if.wx ? 3 : 1) }))), ...extra('air')];
  let air = pickText(airs, 'air');
  if (weather) {
    const wxw = `${W.wx[weather.kind] || ''} ${Math.round(weather.temp)}°`;
    const where = fill(P.where, { city: city || '', wx: { html: link('#/settings/record', sticker(weather.icon || weather.kind) + ' ' + num(esc(wxw))), plain: wxw } });
    if (lang === 'en' || lang === 'es' || lang === 'fr') air = air.charAt(0).toLowerCase() + air.slice(1);
    p1 += ' ' + (city ? where : '') + ' ' + air;
  } else p1 += ' ' + air;
  out.push(p1);

  // 2. 오늘 할 것
  const plan = [];
  if (ctx.upcoming.length) {
    const e = ctx.upcoming[0];
    const v = { events: { html: link('#/calendar', num(esc(W.events(ctx.events.length)))), plain: W.events(ctx.events.length) }, title: entryLink(e), time: e.meta.time ? fmtHM(e.meta.time) : '' };
    plan.push(fill(pickText(ctx.events.length === 1 ? P.plan.events1 : P.plan.eventsN, 'plan.events'), v).replace(/\s{2,}/g, ' '));
  } else if (ctx.events.length) plan.push(fill(pickText(P.plan.eventsPast, 'plan.past'), {}));
  if (ctx.todos.length) plan.push(fill(pickText(plan.length ? P.plan.todosAlso : P.plan.todos, plan.length ? 'plan.todosAlso' : 'plan.todos'), { todos: { html: link('#/todo', num(esc(W.todos(ctx.todos.length)))), plain: W.todos(ctx.todos.length) } }));
  else if (ctx.doneToday.length) plan.push(fill(pickText(P.plan.todosDone, 'plan.done'), {}));
  if (!plan.length && !ctx.first) plan.push(fill(pickText(P.plan.free[ctx.slot], 'plan.free.' + ctx.slot), {}));
  if (plan.length) out.push(plan.join(' '));

  // 3. 쌓아 온 것
  const st = [];
  if (ctx.first) st.push(fill(pickText(P.stack.first, 'stack.first'), {}));
  else {
    if (ctx.writtenToday.length === 1) st.push(fill(pickText(P.stack.today1, 'stack.1'), { latest: entryLink(ctx.writtenToday[0]) }));
    else if (ctx.writtenToday.length > 1) st.push(fill(pickText(P.stack.todayN, 'stack.n'), { latest: entryLink(ctx.writtenToday[0]), count: { html: link('#/all', num(esc(W.count(ctx.writtenToday.length)))), plain: W.count(ctx.writtenToday.length) } }));
    else if (P.stack.none[ctx.slot]) st.push(fill(pickText(P.stack.none[ctx.slot], 'stack.none'), {}));
    if (ctx.streak >= 2) st.push(fill(pickText(P.stack.streak, 'stack.streak'), { streak: { html: num(esc(W.streak(ctx.streak))), plain: W.streak(ctx.streak) } }));
    else if (ctx.week >= 3 && !ctx.writtenToday.length) st.push(fill(pickText(P.stack.week, 'stack.week'), { week: { html: link('#/all', num(esc(W.week(ctx.week)))), plain: W.week(ctx.week) } }));
  }
  const stackP = st.length ? st.join(' ') : null;

  // 4. 회상
  const rc = ctx.first ? null : pickRecall(ctx);
  let recallP = null;
  if (rc) {
    const v = rc.e ? { title: entryLink(rc.e), ago: W.ago(rc.n || 1) } : { label: { html: `<b class="w">${esc(rc.label)}</b>`, plain: rc.label } };
    recallP = { recall: true, entry: rc.e || null, html: fill(pickText(P.recall[rc.kind], 'recall.' + rc.kind), v) };
    if (rc.e) { const used = { ...(S.prefs.recallSeen || {}) }; used[rc.e.id] = ctx.today; Object.keys(used).forEach(k => { if (used[k] < dayKey(addDays(ctx.now, -30))) delete used[k]; }); setPref('recallSeen', used); }
  }

  // 화면이 좁으면 문단을 줄여요: 공기 · 할 것 · (회상 또는 쌓아 온 것) · 맺음은 자리가 남을 때만
  const rest = [stackP, recallP].filter(Boolean);
  if (out.length + rest.length > max) out.push(recallP || stackP); else out.push(...rest);
  // 5. 맺음
  if (out.length < max) out.push(fill(pickText([...P.close[ctx.slot], ...extra('close')], 'close.' + ctx.slot), {}));
  return { ctx, paragraphs: out, recall: rc ? { kind: rc.kind, n: rc.n, label: rc.label, title: rc.e ? displayTitle(rc.e, '') : '' } : null };
}

export { batchim, compose, gather, josa, setRemote };
