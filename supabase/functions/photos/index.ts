// 사진: 앱이 줄여 보낸 webp/jpg(본문 ~200KB + 미리보기 ~30KB)를 용량 확인 후 Cloudflare R2에 올려요.
//  POST /photos            (multipart: id, entry_id, full, thumb, w, h)  → { id, key }
//  POST /photos?action=sweep (헤더 x-cron-secret)  → 지운 사진을 R2에서도 지우고, 기록에 안 붙은 오래된 사진 정리
// 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, CRON_SECRET, APP_ORIGIN
import { sign } from '../_shared/sigv4.ts';

type Deps = { fetch: typeof fetch; env: (k: string) => string | undefined };
const LIMITS = { trialPhotos: 100, paidBytes: 1024 ** 3, maxFull: 900_000, maxThumb: 120_000 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const isWebp = (b: Uint8Array) => b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
// 사파리는 캔버스에서 webp를 못 만들어 jpg로 보내요
const isJpg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const kindOf = (b: Uint8Array) => isWebp(b) ? 'webp' : isJpg(b) ? 'jpg' : null;

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const env = deps.env, origin = env('APP_ORIGIN') || '*';
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' };
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const base = env('SUPABASE_URL')!, srv = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = (path: string, init: RequestInit = {}) => deps.fetch(`${base}/rest/v1/${path}`, { ...init, headers: { apikey: srv, authorization: `Bearer ${srv}`, 'content-type': 'application/json', ...(init.headers || {}) } });
  const r2 = async (method: string, key: string, body?: Uint8Array, type?: string) => {
    const url = `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com/${env('R2_BUCKET')}/${key}`;
    const { headers } = await sign({ method, url, headers: type ? { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' } : {}, body, accessKey: env('R2_ACCESS_KEY_ID')!, secretKey: env('R2_SECRET_ACCESS_KEY')!, region: 'auto' });
    return deps.fetch(url, { method, headers, body });
  };
  const u = new URL(req.url);

  // ---- 정리 (예약 작업이 불러요)
  if (u.searchParams.get('action') === 'sweep') {
    if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) return json({ error: 'forbidden' }, 403);
    // 기록이 사라졌거나 하루 넘게 어디에도 안 붙은 사진 → 행 삭제(트리거가 photo_trash에 넣어요)
    await db('rpc/sweep_orphan_photos', { method: 'POST', body: '{}' });
    // 쌓인 만큼 여러 번 돌아요 (한 번에 500개씩, 최대 20번)
    let removed = 0;
    for (let round = 0; round < 20; round++) {
      const tr = await db('photo_trash?select=key&order=deleted_at&limit=500'); const keys: { key: string }[] = tr.ok ? await tr.json() : [];
      let n = 0;
      for (const { key } of keys) {
        const r = await r2('DELETE', key);
        if (r.ok || r.status === 404) { await db(`photo_trash?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' }); removed++; n++; }
      }
      if (keys.length < 500 || !n) break;
    }
    return json({ removed });
  }

  // ---- 올리기: 로그인한 사용자 확인
  const auth = req.headers.get('authorization') || '';
  const who = await deps.fetch(`${base}/auth/v1/user`, { headers: { apikey: env('SUPABASE_ANON_KEY') || srv, authorization: auth } });
  if (!who.ok) return json({ error: 'auth' }, 401);
  const user = await who.json(); const uid = user?.id;
  if (!UUID.test(uid || '')) return json({ error: 'auth' }, 401);
  let form: FormData; try { form = await req.formData(); } catch { return json({ error: 'bad_form' }, 400); }
  const id = String(form.get('id') || ''), entryId = String(form.get('entry_id') || '');
  const full = form.get('full'), thumb = form.get('thumb');
  if (!UUID.test(id) || (entryId && !UUID.test(entryId)) || !(full instanceof Blob) || !(thumb instanceof Blob)) return json({ error: 'bad_form' }, 400);
  const fb = new Uint8Array(await full.arrayBuffer()), tb = new Uint8Array(await thumb.arrayBuffer());
  const ext = kindOf(fb);
  if (fb.length > LIMITS.maxFull || tb.length > LIMITS.maxThumb || !ext || kindOf(tb) !== ext) return json({ error: 'bad_image' }, 400);
  const mime = ext === 'webp' ? 'image/webp' : 'image/jpeg';
  // 용량: 체험은 100장, 구독은 1GB. 체험이 끝나 쓰기가 막혔으면 거절.
  const q = await db('rpc/photo_allowance', { method: 'POST', body: JSON.stringify({ uid }) });
  if (!q.ok) return json({ error: 'quota_check' }, 500);
  const a = await q.json();
  if (!a.can_write) return json({ error: 'write_locked' }, 403);
  const pend = Number(a.pending) || 0;   // 지웠지만 아직 정리 안 된 사진 (한 장 ≈ 250KB로 셈)
  if (a.subscriber ? a.bytes + pend * 250_000 + fb.length + tb.length > LIMITS.paidBytes : a.count + pend >= LIMITS.trialPhotos) return json({ error: 'photo_quota', ...a }, 403);
  const key = `${uid}/${id}.${ext}`, tkey = `${uid}/${id}.t.${ext}`;
  const [p1, p2] = await Promise.all([r2('PUT', key, fb, mime), r2('PUT', tkey, tb, mime)]);
  if (!p1.ok || !p2.ok) return json({ error: 'storage' }, 502);
  const w = Number(form.get('w')) || null, h = Number(form.get('h')) || null;
  // 같은 사진을 다시 보내도(응답을 못 받고 재시도) 안전하게: 이미 내 사진으로 저장돼 있으면 성공으로 봐요
  const ins = await db('photos?on_conflict=id', { method: 'POST', headers: { prefer: 'return=representation,resolution=ignore-duplicates' }, body: JSON.stringify({ id, user_id: uid, entry_id: entryId || null, key, bytes: fb.length, thumb_bytes: tb.length, width: w, height: h }) });
  if (ins.ok) {
    const made = await ins.json().catch(() => []);
    if (!made.length) {
      const ex = await db(`photos?select=user_id,key&id=eq.${id}`); const row = ex.ok ? (await ex.json())[0] : null;
      if (!row || row.user_id !== uid || row.key !== key) { await Promise.all([r2('DELETE', key), r2('DELETE', tkey)]); return json({ error: 'save' }, 409); }
    }
  } else { await Promise.all([r2('DELETE', key), r2('DELETE', tkey)]); return json({ error: 'save' }, 500); }
  return json({ id, key, w, h });
}

// @ts-ignore Deno 실행 때만
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, { fetch, env: k => Deno.env.get(k) }));
