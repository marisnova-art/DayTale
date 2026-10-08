/* 알림 (정직하게: 앱이 열려 있거나 설치된 앱이 살아 있을 때만 울려요. 서버 푸시는 나중에.)
   - 일정: 시작 10분 전 · 할 일: 마감일 아침 9시
   - 아침 인사 / 저녁 돌아보기: 설정한 시각에 한 번 */
import { t } from '../core/i18n.js';
import { addDays, dayKey, ls, todayKey } from '../core/utils.js';
import { S, displayTitle, live, setPref } from '../data/store.js';
import { toast } from '../ui/feedback.js';

let timers = [];
const supported = () => 'Notification' in window;
const permission = () => (supported() ? Notification.permission : 'unsupported');
async function request() {
  if (!supported()) return 'unsupported';
  const p = await Notification.requestPermission();
  if (p === 'granted') setPref('notify', { ...S.prefs.notify, reminders: true });
  schedule(); return p;
}
const at = (k, hm) => new Date(`${k}T${hm || '09:00'}`).getTime();
/* 앞으로 hours 시간 안에 울릴 것 */
function upcoming(hours = 24) {
  const now = Date.now(), lim = now + hours * 3600e3, out = [], n = S.prefs.notify || {};
  if (n.reminders !== false) for (const e of live()) {
    const m = e.meta || {};
    if (e.type === 'event' && m.date && m.time) out.push({ key: e.id, at: at(m.date, m.time) - 10 * 60e3, title: displayTitle(e, t('common.untitled')), body: t('notify.eventSoon', { time: m.time }), id: e.id });
    else if (e.type === 'todo' && m.date && !m.done) out.push({ key: e.id, at: at(m.date, '09:00'), title: displayTitle(e, t('common.untitled')), body: t('notify.todoDue'), id: e.id });
  }
  for (const k of [todayKey(), dayKey(addDays(new Date(), 1))]) {
    if (n.morning) out.push({ key: 'morning', at: at(k, n.morningAt || '08:00'), title: t('notify.morning'), body: t('notify.morningBody', { n: live().filter(e => e.type === 'event' && e.meta.date === k).length }), daily: k });
    if (n.evening) out.push({ key: 'evening', at: at(k, n.eveningAt || '21:00'), title: t('notify.evening'), body: t('notify.eveningBody'), daily: k });
  }
  return out.filter(x => x.at > now - 1000 && x.at < lim).sort((a, b) => a.at - b.at);
}
function schedule() {
  timers.forEach(clearTimeout); timers = [];
  if (permission() !== 'granted') return;
  for (const x of upcoming(24)) {
    const fired = `daytale.fired.${x.key}.${x.at}`;
    if (ls.get(fired)) continue;
    timers.push(setTimeout(() => {
      ls.set(fired, 1);
      if (x.key === 'evening' && live().some(e => dayKey(new Date(e.created_at)) === x.daily)) return;   // 오늘 이미 썼으면 조용히
      fire(x);
    }, Math.max(0, x.at - Date.now())));
  }
}
async function fire(x) {
  const opts = { body: x.body, tag: x.key, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { id: x.id || null } };
  try { const reg = await navigator.serviceWorker?.getRegistration?.(); if (reg) await reg.showNotification(x.title, opts); else new Notification(x.title, opts); }
  catch { toast(x.title + ' · ' + x.body); }
}
export const Reminders = { supported, permission, request, schedule, upcoming };
