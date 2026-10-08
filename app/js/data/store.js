/* 앱 상태: 기록, 폴더, 설정. 화면 코드와 분리돼 있어요. */
import { LIMITS } from '../core/config.js';
import { ls, nowISO, uid } from '../core/utils.js';

/* 기록 종류: 스티커(Fluent Emoji, MIT) 이름과 같아요 */
const TYPES = ['note', 'todo', 'event', 'idea', 'item', 'personal', 'scrap'];
const FOLDER_COLORS = ['#FF9D7A', '#FFC86B', '#9BD68A', '#6FD3C1', '#7FB2FF', '#B7A4FF', '#F28AB0', '#A9A5AF'];
const DEFAULT_PREFS = {
  lang: null,            // 비어 있으면 기기 언어
  mode: 'story',         // story = 감성형, tidy = 정리형
  textSize: 'm',         // m · l · xl
  weekStart: 0,          // 일요일
  defaultType: 'note',
  sort: 'updated',
  city: null,            // 'KR:seoul' 같은 도시 id. 비어 있으면 시간대로 추정
  days: [],              // 기억할 날 [{ id, label, date: 'MM-DD' | 'YYYY-MM-DD' }]
  dictation: true,
  notify: { morning: false, evening: false, reminders: true, morningAt: '08:00', eveningAt: '21:00' },
  recallSeen: {}         // 회상 2주 안 반복 금지 { entryId: 'YYYY-MM-DD' }
};

const S = {
  ns: null, user: null, db: null, mode: 'cloud',
  entries: new Map(), folders: new Map(),
  prefs: structuredClone(DEFAULT_PREFS),
  status: null,          // my_status() 결과
  canWrite: true,
  online: navigator.onLine, sync: 'idle', lastSyncAt: null
};
Object.assign(S.prefs, ls.get('daytale.prefs', {}));

const listeners = new Set();
const emit = what => listeners.forEach(f => { try { f(what); } catch (e) { console.error(e); } });
const onChange = f => { listeners.add(f); return () => listeners.delete(f); };
let syncHook = () => {};
const setSyncHook = f => { syncHook = f; };

/* ---------- 쓰기 잠금 (체험 끝, 구독 없음) ---------- */
function guard() { if (S.canWrite) return true; emit('locked'); return false; }

/* ---------- 기록 ---------- */
function newEntry(fields = {}) {
  const n = nowISO();
  return Object.assign({ id: uid(), type: S.prefs.defaultType || 'note', title: '', content: '', text: '', folder_id: null, tags: [], favorite: false, pinned: false,
    meta: {}, photos: [], created_at: n, updated_at: n, deleted_at: null, _sv: null, _dirty: true }, fields);
}
const isEmpty = e => !e.title.trim() && !e.text.trim() && !e.photos.length && !e.tags.length && !e.meta.date && !e.meta.place;
function displayTitle(e, fallback = '') {
  if (e.title.trim()) return e.title.trim();
  const first = (e.text || '').split('\n').find(l => l.trim());
  return first ? first.slice(0, 80) : fallback;
}
const live = () => [...S.entries.values()].filter(e => !e.deleted_at);
const trash = () => [...S.entries.values()].filter(e => e.deleted_at).sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));

/* 잠긴 동안에도 휴지통·복원·즐겨찾기·고정은 돼요 (서버 write_gate와 같은 규칙) */
async function saveEntry(e, { quiet = false, meta = false } = {}) {
  if (!meta && !guard()) return false;
  if (S.entries.size >= LIMITS.entries && !S.entries.has(e.id)) { emit('quota'); return false; }
  e.title = (e.title || '').slice(0, LIMITS.titleChars);
  e.tags = [...new Set((e.tags || []).map(t => t.trim().slice(0, LIMITS.tagLen)).filter(Boolean))].slice(0, LIMITS.tags);
  e.updated_at = nowISO(); e._dirty = true;
  S.entries.set(e.id, e); await S.db.put('entries', e);
  if (!quiet) emit('entries');
  syncHook();
  return true;
}
const META_KEYS = ['deleted_at', 'favorite', 'pinned'];
async function patchEntry(id, fields) { const e = S.entries.get(id); if (!e) return false; return saveEntry(Object.assign(e, fields), { meta: Object.keys(fields).every(k => META_KEYS.includes(k)) }); }
async function addEntry(fields) { const e = newEntry(fields); return (await saveEntry(e)) ? e : null; }
const trashEntry = id => patchEntry(id, { deleted_at: nowISO() });
const restoreEntry = id => patchEntry(id, { deleted_at: null });
/* 휴지통 비우기: 서버에서 지울 id를 모아 두었다가 동기화 때 보내요 */
async function purgeEntries(ids) {
  if (!ids.length) return;
  const pend = await S.db.get('pendingDeletes', []);
  ids.forEach(id => { const e = S.entries.get(id); if (e && e._sv != null) pend.push({ table: 'entries', id, sv: e._sv }); S.entries.delete(id); });
  await S.db.delMany('entries', ids); await S.db.set('pendingDeletes', pend);
  emit('entries'); syncHook();
}
async function purgeOldTrash() {
  const lim = Date.now() - LIMITS.trashDays * 864e5;
  await purgeEntries(trash().filter(e => new Date(e.deleted_at) < lim).map(e => e.id));
}

/* ---------- 폴더 ---------- */
async function saveFolder(f) {
  if (!guard()) return null;
  if (!S.folders.has(f.id) && S.folders.size >= LIMITS.folders) { emit('quota'); return null; }
  f.name = String(f.name || '').trim().slice(0, 40); if (!f.name) return null;
  f.updated_at = nowISO(); f._dirty = true; f.created_at ||= f.updated_at; f.sort ??= S.folders.size;
  S.folders.set(f.id, f); await S.db.put('folders', f); emit('folders'); syncHook();
  return f;
}
const addFolder = (name, color) => saveFolder({ id: uid(), name, color: color || FOLDER_COLORS[S.folders.size % FOLDER_COLORS.length], _sv: null });
async function deleteFolder(id) {
  if (!guard()) return;
  const f = S.folders.get(id); if (!f) return;
  const moved = live().filter(e => e.folder_id === id);
  moved.forEach(e => { e.folder_id = null; e._dirty = true; e.updated_at = nowISO(); });
  await S.db.putMany('entries', moved);
  S.folders.delete(id); await S.db.del('folders', id);
  if (f._sv != null) { const pend = await S.db.get('pendingDeletes', []); pend.push({ table: 'folders', id }); await S.db.set('pendingDeletes', pend); }
  emit('folders'); emit('entries'); syncHook();
}
const folderList = () => [...S.folders.values()].sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name));

/* ---------- 설정 ---------- */
let prefsHook = () => {};
const setPrefsHook = f => { prefsHook = f; };
function setPref(k, v) { S.prefs[k] = v; ls.set('daytale.prefs', S.prefs); S.db?.set('prefs', S.prefs); emit('prefs'); prefsHook(); }

export { DEFAULT_PREFS, FOLDER_COLORS, S, TYPES, addEntry, addFolder, deleteFolder, displayTitle, emit, folderList, isEmpty, live, newEntry, onChange,
  patchEntry, purgeEntries, purgeOldTrash, restoreEntry, saveEntry, saveFolder, setPref, setPrefsHook, setSyncHook, trash, trashEntry };
