/* 알림
   - 일정: 시작 10분 전 · 할 일: 마감일 아침 9시 · 아침 인사 / 저녁 돌아보기: 설정한 시각에 한 번
   - 웹 푸시(서버가 1분마다 확인해서 보냄)가 되면 앱을 닫아도 와요. 이때 앱 안 타이머는 쉬어요 (두 번 울리지 않게).
   - 푸시가 안 되는 곳(오래된 브라우저 등)은 예전처럼 앱이 살아 있을 때만 울려요. */
import { t } from '../core/i18n.js';
import { addDays, dayKey, ls, todayKey } from '../core/utils.js';
import { CFG } from '../core/config.js';
import { getLang } from '../core/i18n.js';
import { S, displayTitle, live, setPref } from '../data/store.js';
import { Sync } from '../data/sync.js';
import { toast } from '../ui/feedback.js';

let timers = [];
const supported = () => 'Notification' in window;
const permission = () => (supported() ? Notification.permission : 'unsupported');
async function request() {
  if (!supported()) return 'unsupported';
  const p = await Notification.requestPermission();
  if (p === 'granted') { setPref('notify', { ...S.prefs.notify, reminders: true }); await subscribe(); }
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
  if (permission() !== 'granted' || ls.get('daytale.push')) return;   // 서버 푸시가 맡고 있으면 앱 타이머는 쉬어요
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
/* ---------- 웹 푸시 ---------- */
const pushOK = () => 'PushManager' in window && 'serviceWorker' in navigator && supported();
const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
let pubKey = null;
async function subscribe() {
  if (!pushOK() || permission() !== 'granted' || !Sync.sb || !S.user || !CFG.SUPABASE_URL) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      pubKey ||= (await (await fetch(`${CFG.SUPABASE_URL}/functions/v1/push`)).json()).key;
      if (!pubKey) return false;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(pubKey) });
    }
    const j = sub.toJSON();
    const { data, error } = await Sync.sb.rpc('push_subscribe', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', p_lang: getLang() });
    if (error || !data) { ls.set('daytale.push', null); return false; }
    ls.set('daytale.push', j.endpoint); schedule(); return true;
  } catch { ls.set('daytale.push', null); return false; }
}
/* 로그아웃할 때: 이 기기로 다른 사람의 알림이 오지 않게 */
async function unsubscribe() {
  const ep = ls.get('daytale.push'); ls.set('daytale.push', null);
  try { if (ep && Sync.sb) await Sync.sb.rpc('push_unsubscribe', { p_endpoint: ep }); const reg = await navigator.serviceWorker?.getRegistration?.(); await (await reg?.pushManager.getSubscription())?.unsubscribe(); } catch {}
}
const pushOn = () => !!ls.get('daytale.push');
export const Reminders = { supported, permission, request, schedule, upcoming, subscribe, unsubscribe, pushOn, pushOK };
