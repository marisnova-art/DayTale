/* 이야기 엔진: 인사·오늘의 공기 → 문학 한 구절 → 오늘 할 것 → 쌓아 온 것·회상 → (자리가 남으면) 맺음.
   문장 묶음은 앱 안 기본값 + 서버 phrase_packs(앱 배포 없이 계절·명절 문장 추가)를 합쳐 써요. */
import ko from './ko.js';
import en from './en.js';
import ja from './ja.js';
import es from './es.js';
import fr from './fr.js';
import { S, displayTitle, emit, live, setPref } from '../data/store.js';
import { fmtHM, getLang, t } from '../core/i18n.js';
import { litById, litReady, loadLit, pickLit, setLitRemote } from './lit.js';
import { addDays, dayKey, esc, ls, parseDay, slotOf, sunUp, todayKey } from '../core/utils.js';
import { localeRegion, seasonFor, tempUnit } from '../core/countries.js';
import { sticker } from '../core/stickers.js';

const BASE = { ko, en, ja, es, fr };
let remote = {};   // { lang: { part: [{ cond, text, weight }] } }
const setRemote = rows => { remote = {}; rows.forEach(r => { ((remote[r.lang] ||= {})[r.slot] ||= []).push(r); }); setLitRemote(rows); };

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
const match = (cond = {}, ctx) => Object.entries(cond).every(([k, v]) => k === 'tod' ? (Array.isArray(v) ? v.includes(ctx.slot) : v === ctx.slot) : k === 'light' ? v === ctx.light : k === 'wx' ? v === ctx.weather?.kind : k === 'season' ? v === ctx.season
  : k === 'cold' ? (ctx.weather?.temp ?? 99) <= 5 : k === 'hot' ? (ctx.weather?.temp ?? -99) >= 28 : k === 'dow' ? v === ctx.now.getDay() : k === 'holiday' ? v === ctx.holiday
  : k === 'between' ? inDays(v, dayKey(ctx.now)) : false);   // 모르는 조건은 맞지 않는 것으로 (앱이 오래된 버전일 때 엉뚱한 날 나오지 않게)
// 관리자에서 넣는 날짜 범위: ['2026-09-24', '2026-09-27'] 또는 해마다 ['12-24', '12-25']
const inDays = (v, key) => Array.isArray(v) && v.length === 2 && (v[0].length === 5 ? (v[0] <= v[1] ? v[0] <= key.slice(5) && key.slice(5) <= v[1] : key.slice(5) >= v[0] || key.slice(5) <= v[1]) : v[0] <= key && key <= v[1]);

/* 문장 목록: 글자만 있거나 { if: 조건, t: [문장], w: 가중치 } — 조건이 맞는 것만 */
const opts = (list = [], ctx) => list.flatMap(x => typeof x === 'string' ? [{ text: x }]
  : x.text ? (match(x.cond, ctx) ? [x] : []) : match(x.if, ctx) ? [].concat(x.t).map(text => ({ text, w: x.w || 1 })) : []);

/* ---------- 문장 채우기 ---------- */
const SLOT_ST = { morning: 'sunrise', day: 'sunflower', evening: 'night', night: 'moon' };
// 계절 스티커는 달의 날짜로 대략 한 주마다 바뀌어요 (1~8일, 9~16일, 17~24일, 25일~)
const SEASON_ST = { spring: ['blossom', 'tulip', 'sprout', 'strawberry'], summer: ['sunflower', 'watermelon', 'shell', 'icecream'], autumn: ['leaf', 'ginkgo', 'acorn', 'mushroom'], winter: ['snowman', 'mitten', 'tangerine', 'snowflake'] };
const seasonSt = (season, d) => SEASON_ST[season][Math.min(3, Math.floor((d.getDate() - 1) / 8))];
// 회상 제목 앞 스티커: 사진이 있으면 사진, 아니면 기록 종류
const TYPE_ST = { note: 'note', todo: 'todo', event: 'event', idea: 'idea', item: 'item', personal: 'personal', scrap: 'scrap' };
/* 스티커는 바로 뒤 낱말과 한 덩어리(nowrap)라서 줄이 바뀌어도 같이 움직여요 */
// 스티커와 바로 뒤 글자 몇 자만 한 줄에 묶어요 (띄어쓰기 없는 긴 글이 통째로 묶이면 화면 밖으로 나가요). {latest}{을} 같은 자리표시는 쪼개지 않아요
const glue = (n, html = '') => { const st = sticker(n); if (!st) return html; const m = /^((?:\{\w+\}(?:\{[^}]+\})?|&[a-z0-9#]+;|[^\s<&{]){1,4})([\s\S]*)$/i.exec(html); return m ? `<span class="glue">${st}${m[1]}</span>${m[2]}` : st + html; };
const link = (href, html) => `<a class="w" href="${href}">${html}</a>`;
/* 기온: 미국 등 화씨를 쓰는 지역(휴대폰 언어 설정의 지역, core/countries.js temp)은 °F로 보여요. 덥다·춥다 판단은 그대로 섭씨 */
const useF = tempUnit() === 'F';
const deg = c => Math.round(useF ? c * 9 / 5 + 32 : c);
const num = (s) => String(s).replace(/(\d[\d,.]*°?)/g, '<span class="n">$1</span>');
function fill(text, vars) {
  return text
    .replace(/\[(\w+)\]\s?([^\s<[]*)/g, (_, n, w) => glue(n, w))
    .replace(/\{(\w+)\}(?:\{(은|이|을|과|으로|이에요)\})?/g, (_, k, j) => {
      const v = vars[k]; if (v == null) return '';
      const html = typeof v === 'object' ? v.html : esc(v);
      const plain = typeof v === 'object' ? v.plain : v;
      return html + (j ? josa(plain, j) : '');
    });
}

/* ---------- 오늘 상황 모으기 ---------- */
/* 계절은 나라 표(core/countries.js)를 따라요: 남반구는 반대, 열대는 null(계절 문장 없음). place: 날씨 도시 { cc, lat } */
function gather(now = new Date(), place = {}) {
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
  return { now, slot: slotOf(now), season: seasonFor(now, { cc: place.cc || localeRegion(), lat: place.lat ?? null }), today, all, events, upcoming, todos, doneToday, writtenToday, streak, week, first: all.length === 0 };
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
function compose({ name, weather = null, city = null, geo = null, holiday = null, max = 4 } = {}) {
  const lang = BASE[getLang()] ? getLang() : 'en', P = BASE[lang], R = remote[lang] || {};
  const ctx = gather(new Date(), { cc: geo?.cc, lat: geo?.lat }); ctx.weather = weather; ctx.holiday = holiday;
  ctx.light = sunUp(ctx.now, geo?.lat, geo?.lon);   // 해가 졌으면 햇살·푸른 하늘 문장은 나오지 않아요
  const W = P.words, out = [];
  // 이야기 속 제목은 짧게: 긴 글의 첫 줄이 홈을 길게 늘리지 않게 (글자 24자까지)
  const short = e => { const s = Array.from(displayTitle(e, t('common.untitled'))); return s.length > 24 ? s.slice(0, 23).join('').trimEnd() + '…' : s.join(''); };
  const entryLink = e => ({ html: link('#/e/' + e.id, esc(short(e))), plain: short(e) });
  const vars = { name: { html: link('#/settings/account', esc(name)), plain: name } };
  const extra = part => (R[part] || []).filter(r => match(r.cond, ctx));

  // 1. 오늘의 공기
  // 문단마다 스티커 하나: 날씨 > 계절 > 시간대 순으로 첫 문단에 하나만 붙여요
  let p1 = fill(pickText([...opts(P.greet[ctx.slot], ctx), ...extra('greet')], 'greet.' + ctx.slot), vars);
  const airs = [...P.air.filter(a => match(a.if, ctx)).flatMap(a => a.t.map(text => ({ text, w: a.w || (a.if.wx ? 3 : 1), st: a.if.season ? seasonSt(a.if.season, ctx.now) : '' }))), ...extra('air')];
  let air = pickText(airs, 'air');
  const airSt = weather ? '' : airs.find(a => a.text === air)?.st || '';
  if (airSt) air = glue(airSt, air);
  else if (!weather) p1 = glue(SLOT_ST[ctx.slot], p1);
  if (weather) {
    const wxw = `${W.wx[weather.kind] || ''} ${deg(weather.temp)}°`;
    // 날씨는 몇 시간 전에 받아 둔 것일 수 있어서, 해가 졌으면 해 그림 대신 달·구름으로
    const ic = !ctx.light && weather.kind === 'sun' ? 'moon' : !ctx.light && weather.kind === 'suncloud' ? 'mooncloud' : ctx.light && weather.icon === 'moon' ? 'sun' : weather.icon || weather.kind;
    const where = fill(P.where, { city: city || '', wx: { html: link('#/settings/record', glue(ic, num(esc(wxw)))), plain: wxw } });
    if (lang === 'en' || lang === 'es' || lang === 'fr') air = air.charAt(0).toLowerCase() + air.slice(1);
    p1 += ' ' + (city ? where : '') + ' ' + air;
  } else p1 += ' ' + air;
  out.push(p1);

  // 2. 문학 한 구절: 저작권이 끝난 작가의 글을 2~3줄로. 날짜·시간대마다 하나, 2주 안에는 되풀이하지 않아요
  const lit = litLine(ctx, lang); if (lit) out.push({ lit: true, html: lit });

  // 3. 오늘 할 것
  const plan = [];
  if (ctx.upcoming.length) {
    const e = ctx.upcoming[0];
    const v = { events: { html: link('#/calendar', num(esc(W.events(ctx.events.length)))), plain: W.events(ctx.events.length) }, title: entryLink(e), time: e.meta.time ? fmtHM(e.meta.time) : '' };
    let tx = pickText(ctx.events.length === 1 ? P.plan.events1 : P.plan.eventsN, 'plan.events');
    if (!v.time) tx = tx.replace(/\s?(?:at |a las |à )?\{time\}(?:에|に|の|、|,)?/g, '');   // 시간이 없는 일정
    plan.push(fill(tx, v).replace(/\s{2,}/g, ' '));
  } else if (ctx.events.length) plan.push(fill(pickText(P.plan.eventsPast, 'plan.past'), {}));
  if (ctx.todos.length) plan.push(fill(pickText(plan.length ? P.plan.todosAlso : P.plan.todos, plan.length ? 'plan.todosAlso' : 'plan.todos'), { todos: { html: link('#/todo', num(esc(W.todos(ctx.todos.length)))), plain: W.todos(ctx.todos.length) } }));
  else if (ctx.doneToday.length) plan.push(fill(pickText(P.plan.todosDone, 'plan.done'), {}));
  if (!plan.length && !ctx.first) plan.push(fill(pickText(opts(P.plan.free[ctx.slot], ctx), 'plan.free.' + ctx.slot), {}));
  if (plan.length) out.push(plan.join(' '));

  // 4. 쌓아 온 것
  const st = [];
  if (ctx.first) st.push(fill(pickText(P.stack.first, 'stack.first'), {}));
  else {
    if (ctx.writtenToday.length === 1) st.push(fill(pickText(P.stack.today1, 'stack.1'), { latest: entryLink(ctx.writtenToday[0]) }));
    else if (ctx.writtenToday.length > 1) st.push(fill(pickText(P.stack.todayN, 'stack.n'), { latest: entryLink(ctx.writtenToday[0]), count: { html: link('#/all', num(esc(W.count(ctx.writtenToday.length)))), plain: W.count(ctx.writtenToday.length) } }));
    else if (P.stack.none[ctx.slot]) st.push(fill(pickText(opts(P.stack.none[ctx.slot], ctx), 'stack.none'), {}));
    if (ctx.streak >= 2) st.push(fill(pickText(P.stack.streak, 'stack.streak').replace('[fire]', ctx.streak >= 30 ? '[trophy]' : '[fire]'), { streak: { html: num(esc(W.streak(ctx.streak))), plain: W.streak(ctx.streak) } }));
    else if (ctx.week >= 3 && !ctx.writtenToday.length) st.push(fill(pickText(P.stack.week, 'stack.week'), { week: { html: link('#/all', num(esc(W.week(ctx.week)))), plain: W.week(ctx.week) } }));
  }
  const stackP = st.length ? st.join(' ') : null;

  // 4-2. 회상
  const rc = ctx.first ? null : pickRecall(ctx);
  let recallP = null;
  if (rc) {
    const tl = rc.e && entryLink(rc.e);
    if (tl) tl.html = tl.html.replace(/^(.*?">)([\s\S]*)$/, (_, a, b) => a + glue(rc.e.photos?.length ? 'photo' : TYPE_ST[rc.e.type] || 'note', b));
    const v = rc.e ? { title: tl, ago: W.ago(rc.n || 1) } : { label: { html: `<b class="w">${esc(rc.label)}</b>`, plain: rc.label } };
    recallP = { recall: true, entry: rc.e || null, html: fill(pickText(P.recall[rc.kind], 'recall.' + rc.kind), v) };
    if (rc.e) { const used = { ...(S.prefs.recallSeen || {}) }; used[rc.e.id] = ctx.today; Object.keys(used).forEach(k => { if (used[k] < dayKey(addDays(ctx.now, -30))) delete used[k]; }); setPref('recallSeen', used); }
  }

  // 화면이 좁으면 문단을 줄여요: 공기 · 문학 · 할 것 · (회상 또는 쌓아 온 것) · 맺음은 자리가 남을 때만
  const rest = [stackP, recallP].filter(Boolean);
  if (out.length + rest.length > max) { const one = recallP || stackP; if (one) out.push(one); } else out.push(...rest);
  // 5. 맺음
  if (out.length < max) out.push(fill(pickText([...opts(P.close[ctx.slot], ctx), ...extra('close')], 'close.' + ctx.slot), {}) + ' ' + sticker(ctx.slot === 'evening' || ctx.slot === 'night' ? 'moon' : 'sparkles'));
  return { ctx, paragraphs: out, recall: rc ? { kind: rc.kind, n: rc.n, label: rc.label, title: rc.e ? displayTitle(rc.e, '') : '' } : null };
}

function litLine(ctx, lang) {
  const key = ctx.today + '|' + ctx.slot, cut = dayKey(addDays(ctx.now, -14));
  const log = Object.fromEntries(Object.entries(ls.get('daytale.lit') || {}).filter(([k]) => k.slice(0, 10) >= cut));
  // 그 언어 묶음을 아직 안 불렀으면 불러 두고 이번에는 건너뛰어요 (다 불러오면 화면이 이야기를 다시 써요)
  if (!litReady(lang)) { loadLit(lang).then(ok => ok && emit('lit')); return ''; }
  let i = log[key], x = i != null ? litById(lang, i) : null;
  if (!x) { const p = pickLit(ctx, lang, Object.values(log)); if (!p) return ''; i = p.i; log[key] = i; ls.set('daytale.lit', log); x = litById(lang, i); }
  return x ? esc(x.text).replace(/\*\*(.+?)\*\*/g, '<b class="w">$1</b>') : '';
}

export { batchim, compose, gather, josa, setRemote };
