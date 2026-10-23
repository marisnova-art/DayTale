// 내 사진 배경: 고른 사진은 긴 쪽 1440으로 줄이고(위치 정보 같은 사진 속 정보는 다시 그리면서 빠져요) 이 기기(IndexedDB)에만 둬요.
// 계정 연결 후에는 서버(R2)로 옮겨요. 카드에는 사진 번호(ph)만 적고, 그릴 때는 미리 읽어 둔 주소를 써요
const DB = 'dz.photos', ST = 'p', MAX = 1440;
const urls = new Map();

function open() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((ok, no) => {
    const t = db.transaction(ST, mode), req = fn(t.objectStore(ST));
    t.oncomplete = () => { db.close(); ok(req?.result); }; t.onerror = () => { db.close(); no(t.error); };
  });
}

export const url = id => urls.get(id) || '';

// 카드들이 쓰는 사진을 읽어 둬요. 아무 카드도 안 쓰는 사진은 하루가 지나면 지워요 (골랐다가 바꾼 사진)
export async function boot(used) {
  try {
    const keys = await tx('readonly', s => s.getAllKeys()), keep = new Set(used);
    const old = id => Date.now() - parseInt(id.slice(0, 8), 36) > 864e5;
    const drop = keys.filter(k => !keep.has(k) && old(k));
    if (drop.length) await tx('readwrite', s => drop.forEach(k => s.delete(k)));
    for (const k of keys) if (keep.has(k) && !urls.has(k)) { const b = await tx('readonly', s => s.get(k)); if (b) urls.set(k, URL.createObjectURL(b)); }
  } catch (e) { console.warn('photos', e); }
}

// 파일 → 줄인 JPEG. 돌려받는 것: { ph, w, h, tone }
export async function add(file) {
  const img = await decode(file);
  const k = Math.min(1, MAX / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(img, 0, 0, w, h);
  img.close?.();
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', .86));
  const t = document.createElement('canvas'); t.width = t.height = 1; const tc = t.getContext('2d'); tc.drawImage(cv, 0, 0, 1, 1);
  const [r, g, b] = tc.getImageData(0, 0, 1, 1).data, hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  const ph = Date.now().toString(36).padStart(8, '0') + Math.random().toString(36).slice(2, 7);
  await tx('readwrite', s => s.put(blob, ph));
  urls.set(ph, URL.createObjectURL(blob));
  return { ph, w, h, tone: hex };
}
async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch {}
  return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
}
