/* 시작: 언어 · 배경 · 로그인 상태 · 화면 연결 */
import { APP_VERSION, CFG, brand } from './core/config.js';
import { applyI18n, detectLang, getLang, register, setLang, t } from './core/i18n.js';
import { $, debounce, ls } from './core/utils.js';
import ko from './i18n/ko.js';
import en from './i18n/en.js';
import ja from './i18n/ja.js';
import es from './i18n/es.js';
import fr from './i18n/fr.js';
import { Account } from './data/account.js';
import { LocalDB } from './data/local-db.js';
import { S, emit, live, onChange, purgeOldTrash, setPrefsHook, setSyncHook } from './data/store.js';
import { configured, getSupabase } from './data/supabase.js';
import { Sync } from './data/sync.js';
import { setRemote } from './story/engine.js';
import { Weather } from './features/weather.js';
import { Photos } from './features/photos.js';
import { Reminders } from './features/reminders.js';
import { Install } from './features/install.js';
import * as Backdrop from './ui/backdrop.js';
import { toast } from './ui/feedback.js';
import { go, now, render as rerender, route, start as startRouter } from './ui/router.js';
import { frame, mark } from './ui/shell.js';
import { hideAuth, showAuth } from './views/auth.js';

register('ko', ko); register('en', en); register('ja', ja); register('es', es); register('fr', fr);
setLang(S.prefs.lang || detectLang());
document.title = brand(getLang());
document.documentElement.dataset.size = S.prefs.textSize || 'm';
Backdrop.apply(document.documentElement);

/* ---------- 화면 목록 (모듈은 필요할 때 불러요) ---------- */
const V = name => () => import(`./views/${name}.js`);
route('/home', V('home'));
['/all', '/type/:type', '/todo', '/folder/:id', '/nofolder', '/trash', '/search'].forEach(p => route(p, V('list')));
route('/new', V('editor')); route('/e/:id', V('editor'));
route('/backup', V('backup'));
route('/calendar', V('calendar'));
route('/settings', V('settings')); route('/settings/:group', V('settings'));
route('/plans', V('plans')); route('/notices', V('notices'));

let mounted = null;
async function show(r) {
  const old = $('#view'); if (!old) return;
  const view = old.cloneNode(false); old.replaceWith(view);   // 화면마다 새 그릇 (이벤트가 쌓이지 않게)
  const mod = await r.view();
  if (now() !== r) return;   // 그 사이 다른 화면으로 감
  if (mounted && mounted !== mod) mounted.leave?.();
  mounted = mod; mod.render(view, r); mark();
  view.focus({ preventScroll: true }); scrollTo(0, 0);
}

/* ---------- 로그인한 사람으로 시작 ---------- */
let started = null;
async function startUser(user, { offline = false } = {}) {
  if (started === user.id) return; started = user.id;
  const md = user.user_metadata || {};
  S.user = { id: user.id, email: user.email, picture: /^https:\/\//.test(md.avatar_url || md.picture || '') ? (md.avatar_url || md.picture) : null };
  S.db = await new LocalDB(user.id).open();
  const [ents, folds] = await Promise.all([S.db.all('entries'), S.db.all('folders')]);
  S.entries = new Map(ents.map(e => [e.id, e])); S.folders = new Map(folds.map(f => [f.id, f]));
  const p = await S.db.get('prefs', null); if (p) Object.assign(S.prefs, p);
  S.lastSyncAt = await S.db.get('lastSyncAt', null);
  ls.set('daytale.lastUser', S.user);
  Account.restore();
  hideAuth(); frame(); applyI18n();
  startRouter(show);
  $('#boot').classList.add('gone');
  if (S.db.volatile) toast(t('err.noStorage'), { bad: true, ms: 7000 });
  purgeOldTrash();
  if (offline) return;
  Sync.sb = await getSupabase();
  Sync.suffix = t('sync.suffix');
  Sync.run();
  Account.load().catch(() => {}).finally(() => { Photos.flush(); trialNudge(); checkNotices(); });
  Reminders.schedule();
  Sync.pullPrefs().then(ch => { if (ch) applyPrefs(); }).catch(() => {});
  loadPhrases();
  Weather.refresh().then(w => { if (w) { Backdrop.apply(document.documentElement, { weather: w.kind }); if (now()?.path === '/home') rerender(); } });
}
/* 체험 끝나기 7일·3일 전 한 번씩 알려요 (메일은 서버가 따로 보내요) */
function trialNudge() {
  const d = Account.trialDays(); if (d == null || d > 7 || d < 1) return;
  const k = d <= 3 ? 3 : 7; const key = 'daytale.trialNudge.' + S.user.id;
  if ((ls.get(key, 99)) <= k) return; ls.set(key, k);
  toast(t('trial.nudge', { n: d }), { action: t('trial.plans'), onAction: () => go('/plans'), ms: 9000 });
}
async function checkNotices() { try { const { unread } = await import('./views/notices.js'); document.documentElement.classList.toggle('has-unread', (await unread()) > 0); } catch {} }
const reschedule = debounce(() => Reminders.schedule(), 800);
function applyPrefs() {
  const l = S.prefs.lang || detectLang(); if (l !== getLang()) { setLang(l); frame(); rerender(); }
  document.documentElement.dataset.size = S.prefs.textSize || 'm';
}
/* 서버 문장 묶음: 하루 한 번 받아 두기 */
async function loadPhrases() {
  const key = 'daytale.phrases.' + getLang(); const c = ls.get(key, null);
  if (c) setRemote(c.rows);
  if (c && Date.now() - c.at < 864e5) return;
  const { data, error } = await Sync.sb.from('phrase_packs').select('lang,slot,cond,text,weight').eq('lang', getLang()).eq('active', true).limit(2000);
  if (!error) { ls.set(key, { at: Date.now(), rows: data }); setRemote(data); }
}

/* ---------- 변경 → 화면 ---------- */
setSyncHook(() => Sync.schedule());
setPrefsHook(() => { Sync.schedulePrefs(); applyPrefs(); });
onChange(w => {
  if (w === 'locked') toast(t('err.locked'), { bad: true, action: t('trial.plans'), onAction: () => go('/plans'), ms: 7000 });
  else if (w === 'quota') toast(t('err.quota'), { bad: true });
  else if (w?.type === 'photo') toast(t(w.error === 'per_entry' ? 'photo.perEntry' : w.error === 'photo_quota' ? 'photo.quota' : w.error === 'bad_image' ? 'photo.bad_image' : 'photo.read'), { bad: true, ...(w.error === 'photo_quota' && !S.status?.subscriber ? { action: t('trial.plans'), onAction: () => go('/plans') } : {}) });
  else if (w?.type === 'conflict') toast(t('sync.conflict'), { action: t('common.open'), onAction: () => go('/e/' + w.id), ms: 8000 });
  if (w === 'entries' || w === 'prefs') reschedule();
  if (w === 'entries' && live().length && !ls.get('daytale.installAsked')) Install.maybeOffer();
  if (w === 'notices') checkNotices();
  if ((w === 'entries' || w === 'folders' || w === 'account') && mounted?.refresh && now()) mounted.refresh($('#view'), now());
});
addEventListener('online', () => { S.online = true; Sync.run(); });
addEventListener('offline', () => { S.online = false; emit('sync'); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.user) { Sync.run(); Weather.refresh(); Backdrop.apply(document.documentElement); if (now()?.path === '/home') rerender(); } });

/* ---------- 부팅 ---------- */
async function boot() {
  if (!configured()) { showAuth('signin', t('err.noServer')); return; }
  let sb;
  try { sb = await getSupabase(); } catch {
    const last = ls.get('daytale.lastUser', null);   // 오프라인 첫 실행: 이 기기 기록으로 시작
    if (last) return startUser(last, { offline: true });
    return showAuth('signin', t('sync.offline'));
  }
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY') { showAuth('newpw'); return; }
    if (ev === 'SIGNED_OUT') { started = null; S.user = null; showAuth('signin'); return; }
    if (session?.user && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) setTimeout(() => startUser(session.user), 0);
  });
  const { data: { session } } = await sb.auth.getSession();
  if (location.hash.includes('type=recovery')) return;
  if (!session) {
    const last = ls.get('daytale.lastUser', null);
    if (!navigator.onLine && last) return startUser(last, { offline: true });
    showAuth(location.hash === '#/signup' ? 'signup' : 'signin');
  }
}
boot();

/* 오프라인 앱 껍데기 */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js?v=' + APP_VERSION).catch(() => {});
navigator.serviceWorker?.addEventListener('message', e => { if (e.data?.open) go('/e/' + e.data.open); });
if (/^(app\.test|localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__daytale = { S, CFG, Sync };   // 개발·검사에서만 (배포 주소에서는 안 생겨요)
