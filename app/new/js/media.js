// 사진 · 영상 동기화 (11-11): 카드가 쓰는 사진 · 줄인 영상을 내 계정 저장소(Supabase Storage, 비공개 'dz-media/내 번호/사진 번호')에 올리고,
// 다른 기기에서는 없는 것만 받아 이 기기(IndexedDB)에 넣어요. 올린 번호는 기억해 두고 다시 올리지 않아요.
// 원본 영상(줄이기 전)은 올리지 않아요: 완료 뒤 10초 · 720p로 줄인 것(small)만. 출시 준비 때 R2로 옮길 수 있게 이 파일 하나에 모아 뒀어요
import * as S from './store.js';
import * as P from './photos.js';

const BK = 'dz-media', K = 'dz.media.v1', MAXB = 20 * 1024 * 1024;
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
let st = load();
const keep = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch {} };

// 카드 · 휴지통 · 쓰다 만 글이 쓰는 사진 · 영상 번호. up = 올려도 되는 것 (원본 영상은 빼요)
function used() {
  const all = new Set(), up = new Set();
  [...S.cards(), ...S.trash(), ...S.drafts().map(d => d.card)].filter(Boolean)
    .flatMap(c => [c.bg, ...(c.pst || []).map(p => p?.bg)]).filter(Boolean)
    .forEach(b => { if (b.ph) { all.add(b.ph); up.add(b.ph); } if (b.vd) { all.add(b.vd); if (b.small) up.add(b.vd); } });
  return { all, up };
}

// 75차 (11-13): 아주 지운 카드의 사진 · 영상 번호를 모아 두었다가, 다음 맞추기 때 저장소에서도 지워요.
// 다른 카드 · 휴지통 · 쓰다 만 글이 아직 같은 사진을 쓰면 남겨요 (이 기기에 없는 다른 기기의 쓰다 만 글은 알 수 없어요)
const idsOf = cs => cs.flatMap(c => [c?.bg, ...(c?.pst || []).map(p => p?.bg)]).filter(Boolean).flatMap(b => [b.ph, b.vd]).filter(Boolean);
S.onGone(cs => { const ids = idsOf(cs); if (!ids.length) return; st.del = [...new Set([...(st.del || []), ...ids])]; keep(); });
async function prune(c, uid) {
  if (!st.del?.length) return 0;
  const { all } = used(), go = st.del.filter(id => !all.has(id)); let n = 0;
  for (let i = 0; i < go.length; i += 100) {   // 한 번에 100개씩
    const part = go.slice(i, i + 100);
    const { error } = await c.storage.from(BK).remove(part.map(id => `${uid}/${id}`));
    if (error) { console.warn('media del', error); return n; }
    part.forEach(id => delete st.up[id]); n += part.length;
    st.del = st.del.filter(id => !part.includes(id)); keep();
  }
  st.del = st.del.filter(id => !all.has(id) && !go.includes(id)); keep();   // 아직 쓰는 건 목록에서만 빼요
  return n;
}

// 한 번 맞추기. 돌려주는 것: { sent, got, del } (받은 게 있으면 화면을 다시 그려요)
export async function run(c, uid, prog) {
  if (st.uid !== uid) { st = { uid, up: {}, del: st.uid ? [] : st.del || [] }; keep(); }   // 로그인 전에 지운 것도 이 계정에서 지워요
  const del = await prune(c, uid);
  const { all, up } = used(); let sent = 0, got = 0;
  const todo = [...up].filter(id => !st.up[id]);
  for (const id of todo) {   // 올리기
    const b = await P.blob(id); if (!b) continue;
    if (b.size > MAXB) { st.up[id] = 'big'; keep(); continue; }
    const type = b.type || 'image/jpeg';
    const { error } = await c.storage.from(BK).upload(`${uid}/${id}`, b, { contentType: type, upsert: false, cacheControl: '31536000' });
    if (error && !/exist|duplicate|409/i.test(error.message + (error.statusCode || ''))) { console.warn('media up', id, error); continue; }
    st.up[id] = 1; keep(); sent++; prog?.(sent, todo.length);
  }
  for (const id of all) {   // 받기: 이 기기에 없는 것만
    if (await P.ensure(id)) continue;
    const { data, error } = await c.storage.from(BK).download(`${uid}/${id}`);
    if (error || !data) continue;
    await P.put(id, data); st.up[id] = 1; keep(); got++;
  }
  return { sent, got, del };
}
export const pending = () => { const { up } = used(); return [...up].filter(id => !st.up?.[id]).length; };
export function forget() { st = {}; try { localStorage.removeItem(K); } catch {} }
