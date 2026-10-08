/* DOM, 문자열, 저장소, 날짜 도우미 */
import { ICONS } from './icons.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
const nowISO = () => new Date().toISOString();
const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); fn(...a); }; d.cancel = () => clearTimeout(t); return d; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const icon = (n, size = 20, cls = '') => `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.circle}</svg>`;
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d, first = 0) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() - first + 7) % 7)); };
const todayKey = () => dayKey(new Date());
const daysBetween = (a, b) => Math.round((parseDay(dayKey(b)) - parseDay(dayKey(a))) / 864e5);
/* 하루 시간대: 아침 5–11, 낮 11–17, 저녁 17–21, 밤 21–5 */
const slotOf = (d = new Date()) => { const h = d.getHours(); return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night'; };
const seasonOf = (d = new Date(), south = false) => { const m = (d.getMonth() + (south ? 6 : 0)) % 12; return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'; };
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export { $, $$, addDays, clamp, dayKey, daysBetween, debounce, esc, h, icon, ls, nowISO, pad, parseDay, seasonOf, slotOf, startOfWeek, todayKey, uid };
