// 동기화 (11-06): 이 기기가 먼저 (쓰기는 늘 바로 저장), 로그인하면 뒤에서 서버와 맞춰요.
// 바뀐 것만 표시해 두었다가 올리고(push), 다른 기기에서 바뀐 것을 받아요(pull). 같은 카드를 양쪽에서 고쳤으면 나중에 고친 쪽이 이겨요
import * as S from './store.js';
import * as A from './account.js';
import * as M from './media.js';

const K = 'dz.sync.v1';
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
const keep = st => { try { localStorage.setItem(K, JSON.stringify(st)); } catch {} };
let st = load(), timer = 0, running = null, again = false, onPulled = null;
const key = (kind, id) => kind + ':' + id;

// 로그인 전에도 표시는 해 둬요 (첫 동기화 때는 어차피 전부 올려요)
S.onChange((kind, id, del) => {
  if (kind === 'pref') st.pref = 1; else (st.dirty ||= {})[key(kind, id)] = del ? 1 : 0;
  keep(st); if (A.user()) soon();
});
export const pending = () => Object.keys(st.dirty || {}).length + (st.pref ? 1 : 0) + M.pending();
export const lastAt = () => st.at || '';
export const whenPulled = f => { onPulled = f; };
const soon = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(() => run().catch(() => {}), ms); };

// 처음 이 계정으로 맞출 때: 이 기기 것을 모두 올릴 목록에 넣어요
function markAll() {
  st.dirty = {};
  ['card', 'book', 'trash'].forEach(k => S.rawList(k).forEach(x => { st.dirty[key(k, x.id)] = 0; }));
  st.pref = Object.keys(S.rawPrefs()).length ? 1 : 0; st.first = 1;
}
const stamp = (kind, d) => d ? (kind === 'trash' ? d.deleted : d.updated || d.created) || '' : '';

async function pull(c) {
  const since = st.pulled || '1970-01-01T00:00:00Z';
  let changed = 0, from = since, rows;
  do {
    const r = await c.from('dz_items').select('kind,id,data,deleted,server_at').gt('server_at', from).order('server_at').limit(500);
    if (r.error) throw r.error; rows = r.data || [];
    for (const x of rows) {
      const k = key(x.kind, x.id), mine = st.dirty?.[k];
      if (mine !== undefined) {   // 여기서도 바꿨어요: 나중에 바꾼 쪽이 이겨요 (지운 건 지운 쪽)
        const local = S.rawList(x.kind).find(y => y.id === x.id);
        if (mine === 1 || x.deleted || stamp(x.kind, local) >= stamp(x.kind, x.data)) continue;
        delete st.dirty[k];
      }
      S.putRemote(x.kind, x.id, x.deleted ? null : x.data); changed++;
    }
    if (rows.length) from = rows[rows.length - 1].server_at;
  } while (rows.length === 500);
  const p = await c.from('dz_prefs').select('data,server_at').maybeSingle();
  if (p.error) throw p.error;
  if (p.data && st.first) { S.putPrefs({ ...S.rawPrefs(), ...p.data.data }); st.pref = 1; changed++; }   // 처음 맞출 때: 계정 쪽 설정(이름 · 사진 등)이 이겨요
  else if (p.data && p.data.server_at > (st.prefAt || '') && !st.pref) { S.putPrefs(p.data.data); changed++; }
  st.first = 0;
  if (p.data) st.prefAt = p.data.server_at;
  st.pulled = from; keep(st);
  return changed;
}

async function push(c, prog) {
  const ks = Object.keys(st.dirty || {}), n = ks.length + (st.pref ? 1 : 0); let done = 0;
  for (let i = 0; i < ks.length; i += 50) {
    const part = ks.slice(i, i + 50), rows = part.map(k => {
      const [kind, ...r] = k.split(':'), id = r.join(':'), del = st.dirty[k] === 1;
      const data = del ? null : S.rawList(kind).find(y => y.id === id) || null;
      return { kind, id, data, deleted: del || !data };
    });
    const { error } = await c.from('dz_items').upsert(rows, { onConflict: 'user_id,kind,id' });
    if (error) throw error;
    part.forEach(k => delete st.dirty[k]); keep(st);
    done += part.length; prog?.(done, n);
  }
  if (st.pref) {
    const { error } = await c.from('dz_prefs').upsert({ data: S.rawPrefs() }, { onConflict: 'user_id' });
    if (error) throw error;
    st.pref = 0; keep(st); prog?.(n, n);
  }
  return n;
}

// 한 번 맞추기: 받고 → 올리고. 돌고 있으면 끝난 뒤 한 번 더
export async function run(prog) {
  const u = A.user(); if (!u) return 0;
  if (running) { again = true; return running; }
  running = (async () => {
    const c = await A.sb();
    if (st.uid !== u.id) { st = { uid: u.id }; markAll(); keep(st); }   // 이 계정과 처음: 이 기기 것을 모두 올려요
    const got = await pull(c);
    const sent = await push(c, prog);
    let med = { sent: 0, got: 0 };   // 11-11: 사진 · 영상 (막혀도 카드 동기화는 그대로)
    try { med = await M.run(c, u.id); } catch (e) { console.warn('media', e); }
    st.at = new Date().toISOString(); keep(st);
    if (got || med.got) onPulled?.();
    return sent;
  })();
  try { return await running; } finally { running = null; if (again) { again = false; soon(300); } }
}
export const firstTime = () => !!A.user() && st.uid !== A.user().id;

// 로그아웃 · 탈퇴: 기록을 비우고 동기화 표시도 지워요
export function forget() { M.forget(); st = {}; try { localStorage.removeItem(K); } catch {} }

// 앱으로 돌아오거나 인터넷이 다시 되면 맞춰요
addEventListener('online', () => soon(500));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') soon(500); });
