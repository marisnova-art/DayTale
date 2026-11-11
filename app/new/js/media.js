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

// 한 번 맞추기. 돌려주는 것: { sent, got } (받은 게 있으면 화면을 다시 그려요)
export async function run(c, uid, prog) {
  if (st.uid !== uid) { st = { uid, up: {} }; keep(); }
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
  return { sent, got };
}
export const pending = () => { const { up } = used(); return [...up].filter(id => !st.up?.[id]).length; };
export function forget() { st = {}; try { localStorage.removeItem(K); } catch {} }
