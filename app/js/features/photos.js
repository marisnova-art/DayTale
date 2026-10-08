/* 사진: 기기에서 줄이고(본문 ~200KB, 미리보기 ~30KB) 먼저 이 기기에 저장한 뒤, 연결되면 서버(R2)로 올려요.
   기록의 photos 칸: [{ id, key?, w, h, pending? }] — 첫 장이 큰 커버, 나머지 3장은 작게. */
import { CFG, LIMITS } from '../core/config.js';
import { esc, uid } from '../core/utils.js';
import { S, emit, saveEntry } from '../data/store.js';
import { configured, getSupabase } from '../data/supabase.js';

const FULL = { side: 1600, bytes: 220e3 }, THUMB = { side: 480, bytes: 32e3 };
const urls = new Map();          // 사진 id → 이 기기 blob 주소
let busy = false;

/* ---------- 줄이기 ---------- */
async function encode(bmp, { side, bytes }) {
  let scale = Math.min(1, side / Math.max(bmp.width, bmp.height)), out = null;
  for (let round = 0; round < 4; round++) {
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.72, 0.62, 0.5]) {
      let b = await new Promise(r => c.toBlob(r, 'image/webp', q));
      if (!b || b.type !== 'image/webp') b = await new Promise(r => c.toBlob(r, 'image/jpeg', q));   // 사파리
      out = b; if (b.size <= bytes) return { blob: b, w: c.width, h: c.height };
    }
    scale *= 0.8;
  }
  return { blob: out, w: 0, h: 0 };
}
async function prepare(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const full = await encode(bmp, FULL), thumb = await encode(bmp, THUMB);
  bmp.close?.();
  return { full: full.blob, thumb: thumb.blob, w: full.w || bmp.width, h: full.h || bmp.height };
}

/* ---------- 한도 ---------- */
function usage() {
  const pending = [...S.entries.values()].reduce((n, e) => n + (e.photos || []).filter(p => p.pending).length, 0);
  return { count: (S.status?.photo_count || 0) + pending, bytes: S.status?.photo_bytes || 0, subscriber: !!S.status?.subscriber };
}
function room() {
  const u = usage();
  return u.subscriber ? u.bytes < LIMITS.paidBytes : u.count < LIMITS.trialPhotos;
}

/* ---------- 추가 · 빼기 ---------- */
/* files를 줄여 기록에 붙여요. 넣은 개수를 돌려줘요. */
async function addFiles(e, files) {
  if (!S.canWrite) { emit('locked'); return 0; }
  let n = 0;
  for (const f of files) {
    if ((e.photos || []).length >= LIMITS.photosPerEntry) { emit({ type: 'photo', error: 'per_entry' }); break; }
    if (!room()) { emit({ type: 'photo', error: 'photo_quota' }); break; }
    if (!/^image\//.test(f.type)) continue;
    try {
      const p = await prepare(f); const id = uid();
      await S.db.set('ph:' + id, { full: p.full, thumb: p.thumb });
      urls.set(id, URL.createObjectURL(p.thumb)); urls.set(id + ':f', URL.createObjectURL(p.full));
      e.photos = [...(e.photos || []), { id, w: p.w, h: p.h, pending: true }]; n++;
    } catch (err) { console.warn('photo', err); emit({ type: 'photo', error: 'read' }); }
  }
  return n;
}
/* 기록에서 빼요. 서버 파일은 하루 뒤 정리 작업이 지워요(어느 기록에도 없는 사진). */
async function remove(e, id) {
  e.photos = (e.photos || []).filter(p => p.id !== id);
  await S.db.del('kv', 'ph:' + id).catch(() => {});
}
function makeCover(e, id) {
  const p = e.photos.find(x => x.id === id); if (!p) return;
  e.photos = [p, ...e.photos.filter(x => x.id !== id)];
}

/* ---------- 보이기 ---------- */
const pub = key => CFG.PHOTOS_URL ? CFG.PHOTOS_URL.replace(/\/$/, '') + '/' + key : '';
const thumbKey = key => key.replace(/\.(webp|jpg)$/, '.t.$1');
/* 동기 주소 (없으면 '' → hydrate가 채워요) */
function src(p, thumb = true) {
  if (p.key && CFG.PHOTOS_URL) return pub(thumb ? thumbKey(p.key) : p.key);
  return urls.get(thumb ? p.id : p.id + ':f') || urls.get(p.id) || '';
}
/* data-photo 이미지 중 아직 주소가 없는 것을 이 기기 저장소에서 채워요 */
async function hydrate(root) {
  for (const img of root.querySelectorAll('img[data-photo]:not([src])')) {
    const id = img.dataset.photo, full = img.dataset.full === '1';
    let u = urls.get(full ? id + ':f' : id);
    if (!u) { const b = await S.db.get('ph:' + id); if (b) { urls.set(id, URL.createObjectURL(b.thumb)); urls.set(id + ':f', URL.createObjectURL(b.full)); u = urls.get(full ? id + ':f' : id); } }
    if (u) img.src = u; else img.closest('.ph')?.classList.add('missing');
  }
}
const imgTag = (p, { full = false, cls = '', alt = '' } = {}) => {
  const s = src(p, !full);
  const w = Math.round(Number(p.w)) || 0, h = Math.round(Number(p.h)) || 0;
  return `<img data-photo="${esc(p.id)}" data-full="${full ? 1 : 0}" ${s ? `src="${esc(s)}"` : ''} class="${esc(cls)}" alt="${esc(alt)}" loading="lazy" decoding="async"${w && h ? ` width="${w}" height="${h}"` : ''}>`;
};

/* ---------- 올리기 ---------- */
async function upload(e, p) {
  const blobs = await S.db.get('ph:' + p.id); if (!blobs) return 'missing';
  const sb = await getSupabase(); const tok = (await sb.auth.getSession()).data.session?.access_token; if (!tok) return 'auth';
  const fd = new FormData();
  fd.set('id', p.id); fd.set('entry_id', e.id); fd.set('w', p.w || ''); fd.set('h', p.h || '');
  fd.set('full', blobs.full, 'full'); fd.set('thumb', blobs.thumb, 'thumb');
  const r = await fetch(`${CFG.SUPABASE_URL}/functions/v1/photos`, { method: 'POST', headers: { apikey: CFG.SUPABASE_ANON_KEY, authorization: 'Bearer ' + tok }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return j.error || 'net';
  const cur = (e.photos || []).find(x => x.id === p.id); if (!cur) return 'gone';
  cur.key = j.key; delete cur.pending;
  await saveEntry(e, { quiet: true });
  if (S.status) { S.status.photo_count = (S.status.photo_count || 0) + 1; S.status.photo_bytes = (S.status.photo_bytes || 0) + blobs.full.size + blobs.thumb.size; }
  await S.db.del('kv', 'ph:' + p.id);
  return 'ok';
}
/* 기다리는 사진을 차례로 올려요 (켜질 때 · 다시 연결될 때 · 사진을 넣은 뒤) */
async function flush() {
  if (busy || !configured() || !S.user || !navigator.onLine || !S.canWrite) return;
  busy = true;
  try {
    for (const e of [...S.entries.values()]) {
      if (e.deleted_at) continue;
      for (const p of (e.photos || []).filter(x => x.pending)) {
        const r = await upload(e, p).catch(() => 'net');
        if (r === 'net' || r === 'auth' || r === 'storage') return;
        if (r === 'write_locked') { S.canWrite = false; emit('locked'); return; }
        if (r === 'photo_quota' || r === 'bad_image') { await remove(e, p.id); await saveEntry(e, { quiet: true }); emit({ type: 'photo', error: r, id: e.id }); }
      }
    }
    emit('entries');
  } finally { busy = false; }
}
addEventListener('online', () => flush());

export const Photos = { addFiles, remove, makeCover, src, imgTag, hydrate, flush, usage, room };
