// Daytale 관리자 API — 관리자 페이지가 부르는 유일한 서버 창구
// Deploy:  supabase functions deploy admin-api            (JWT 검사 켜 둔 채로 배포: --no-verify-jwt 쓰지 마세요)
// Secrets: (선택) ADMIN_ORIGIN — 비워 두면 https://daytale-admin.pages.dev 만 받아요. 주소가 바뀌면 쉼표로 여러 개
//          (선택) PADDLE_API_KEY=pdl_… PADDLE_ENV=sandbox|production   → 관리자 페이지에서 구독 해지
//          CRON_SECRET=…  → 예약 작업이 x-cron-secret 헤더로 {action:'ops_daily'}를 부름 (체험 안내 알림)
// 흐름: 브라우저(관리자 로그인 토큰) → 이 함수 → 토큰 주인 확인 → admins 명단 확인 → service role로 조회/처리 → admin_audit 기록
// service role 키는 이 함수 안에만 있고, 브라우저로 나가지 않습니다.

type Env = { ADMIN_ORIGIN: string; PADDLE_API_KEY: string; PADDLE_ENV: string; CRON_SECRET?: string };
type Deps = { db: any; env: Env; fetch: typeof fetch };
type Admin = { id: string; email: string; role: 'owner' | 'staff' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE = 50;
class Fail extends Error { status: number; constructor(status: number, msg: string) { super(msg); this.status = status; } }

function cors(req: Request, env: Env) {
  const allowed = env.ADMIN_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] ?? 'null'),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

async function whoIsAdmin(req: Request, db: any): Promise<Admin> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Fail(401, 'login required');
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) throw new Fail(401, 'login required');
  const { data: row } = await db.from('admins').select('role').eq('user_id', data.user.id).maybeSingle();
  if (!row) throw new Fail(403, 'not an admin');
  return { id: data.user.id, email: data.user.email ?? '', role: row.role };
}

const page = (p: unknown) => Math.max(0, Math.min(10000, Number(p) || 0));
const uid = (v: unknown) => { if (typeof v !== 'string' || !UUID.test(v)) throw new Fail(400, 'bad user id'); return v; };
const ownerOnly = (a: Admin) => { if (a.role !== 'owner') throw new Fail(403, 'owner only'); };
async function rpc(db: any, fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Fail(500, error.message);
  return data;
}
async function audit(db: any, a: Admin, action: string, target: { id?: string; email?: string } = {}, detail: Record<string, unknown> = {}) {
  await db.from('admin_audit').insert({ admin_id: a.id, admin_email: a.email, action, target_user: target.id ?? null, target_email: target.email ?? null, detail });
}
async function targetUser(db: any, id: string) {
  const { data, error } = await db.auth.admin.getUserById(id);
  if (error || !data?.user) throw new Fail(404, 'user not found');
  return data.user;
}

// 이야기 문장 조건: 앱(js/story/engine.js match)이 아는 것만 받아요
const LANGS = ['ko', 'en', 'ja', 'es', 'fr'], SLOTS = ['greet', 'air', 'close', 'lit', 'word'];
const COND: Record<string, (v: any) => boolean> = {
  tod: v => ['morning', 'day', 'evening', 'night'].includes(v),
  season: v => ['spring', 'summer', 'autumn', 'winter'].includes(v),
  wx: v => ['sun', 'suncloud', 'cloud', 'fog', 'rain', 'snow', 'thunder'].includes(v),
  dow: v => Number.isInteger(v) && v >= 0 && v <= 6,
  cold: v => v === true, hot: v => v === true,
  between: v => Array.isArray(v) && v.length === 2 && v.every(x => typeof x === 'string' && /^(\d{4}-)?\d{2}-\d{2}$/.test(x)) && v[0].length === v[1].length
};
// 문학 한 구절(slot 'lit')만: light 햇빛 줄 · id 앱 안 줄 번호(그 줄의 글을 고침) · a 작가 · o 원문 언어 (js/story/lit.js setLitRemote)
const LIT_COND: Record<string, (v: any) => boolean> = {
  light: v => v === true,
  id: v => Number.isInteger(v) && v >= 0 && v < 100000,
  a: v => typeof v === 'string' && /^[a-z0-9_]{1,40}$/.test(v),
  o: v => typeof v === 'string' && /^([a-z]{2,3}|world)$/.test(v)
};
// 힘이 되는 한 마디(slot 'word')만: id 앱 안 명언(c1…)을 고칠 때 · a 작가 · o 원문 · by 이름 · src 출처 · say 들려주는 말 · season (js/story/words.js setWordsRemote)
const str = (n: number) => (v: any) => typeof v === 'string' && v.trim().length > 0 && v.length <= n;
const WORD_COND: Record<string, (v: any) => boolean> = {
  id: v => typeof v === 'string' && /^c\d{1,4}$/.test(v),
  a: LIT_COND.a, o: LIT_COND.o, by: str(60), src: str(80), say: str(240), season: COND.season
};
function phraseRow(b: any) {
  const lang = LANGS.includes(b.lang) ? b.lang : null, slot = SLOTS.includes(b.slot) ? b.slot : null;
  const text = String(b.text ?? '').trim().slice(0, 300), weight = Math.round(Number(b.weight ?? 1));
  if (!lang || !slot) throw new Fail(400, 'bad phrase');
  if (!text) throw new Fail(400, 'text required');
  if (!(weight >= 1 && weight <= 10)) throw new Fail(400, 'bad phrase');
  const cond: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b.cond && typeof b.cond === 'object' ? b.cond : {})) {
    if (v === '' || v == null) continue;
    const ok = slot === 'word' ? WORD_COND[k] : slot === 'lit' ? (k !== 'between' && k !== 'dow' && k !== 'cold' && k !== 'hot' && (COND[k] || LIT_COND[k])) : COND[k];
    if (!ok || !ok(v)) throw new Fail(400, 'bad condition');
    cond[k] = v;
  }
  if (slot === 'word' && !cond.by) throw new Fail(400, 'bad condition');
  if (slot === 'lit' && (text.match(/\*\*/g) || []).length !== 2) throw new Fail(400, 'bad condition');
  // 나라(비우면 세계 공통) · 여는 날 · 묶음 이름
  const country = b.country ? String(b.country).toUpperCase() : null, starts_on = b.starts_on || null, batch = b.batch ? String(b.batch).trim().slice(0, 60) : null;
  if (country && !/^[A-Z]{2}$/.test(country)) throw new Fail(400, 'bad phrase');
  if (starts_on && !/^\d{4}-\d{2}-\d{2}$/.test(starts_on)) throw new Fail(400, 'bad phrase');
  return { lang, slot, text, weight, cond, country, starts_on, batch, active: b.active !== false, updated_at: new Date().toISOString() };
}

async function act(a: Admin, body: any, { db, env, fetch }: Deps) {
  switch (body.action) {
    case 'me':
      return { email: a.email, role: a.role, paddle: !!env.PADDLE_API_KEY, paddleEnv: env.PADDLE_ENV || 'sandbox' };

    case 'stats':
      return rpc(db, 'admin_stats');

    case 'usage':
      return rpc(db, 'admin_usage');

    case 'ops_daily': {
      ownerOnly(a);
      const r = await rpc(db, 'ops_daily');
      await audit(db, a, 'ops_daily', {}, r);
      return r;
    }

    case 'push':
      return rpc(db, 'admin_push');

    case 'features':
      return rpc(db, 'admin_features');

    // 회원 구성: 나라·언어·기기·처음 온 곳 (합계만). days = 30 | 90, 그 밖은 전체
    case 'audience':
      return rpc(db, 'admin_audience', { p_days: [30, 90].includes(Number(body.days)) ? Number(body.days) : null });

    case 'phrases': {
      let q = db.from('phrase_packs').select('id,lang,slot,cond,text,weight,active,updated_at,country,starts_on,batch').order('updated_at', { ascending: false }).range(0, 499);
      if (LANGS.includes(body.lang)) q = q.eq('lang', body.lang);
      if (body.batch) q = q.eq('batch', String(body.batch));
      const { data, error } = await q;
      if (error) throw new Fail(500, error.message);
      // 묶음 목록 (이름 · 언어 · 나라 · 줄 수 · 여는 날 범위 · 켜진 줄 수)
      const b = await db.from('phrase_packs').select('batch,lang,country,starts_on,active').not('batch', 'is', null).range(0, 9999);
      if (b.error) throw new Fail(500, b.error.message);
      const map = new Map<string, any>();
      const day = (v: any) => v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);
      for (const x of b.data || []) {
        x.starts_on = day(x.starts_on);
        const g = map.get(x.batch) || { batch: x.batch, lang: x.lang, country: x.country, n: 0, on: 0, from: null, to: null };
        g.n++; if (x.active) g.on++;
        if (x.starts_on && (!g.from || x.starts_on < g.from)) g.from = x.starts_on;
        if (x.starts_on && (!g.to || x.starts_on > g.to)) g.to = x.starts_on;
        map.set(x.batch, g);
      }
      return { rows: data, batches: [...map.values()].sort((x, y) => String(y.from).localeCompare(String(x.from))) };
    }

    case 'phrase_save': {
      ownerOnly(a);
      const row = phraseRow(body), id = body.id == null ? null : Number(body.id);
      if (id !== null && !(Number.isInteger(id) && id > 0)) throw new Fail(400, 'bad id');
      const { error } = id ? await db.from('phrase_packs').update(row).eq('id', id) : await db.from('phrase_packs').insert(row);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'phrase_save', {}, { id, lang: row.lang, slot: row.slot, text: row.text.slice(0, 80) });
      return { ok: true };
    }

    case 'phrase_active': {
      ownerOnly(a);
      const id = Number(body.id); if (!Number.isInteger(id) || id <= 0) throw new Fail(400, 'bad id');
      const { error } = await db.from('phrase_packs').update({ active: !!body.active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Fail(500, error.message);
      return { ok: true };
    }

    // 주간 묶음: 한 번에 여러 줄 (최대 300). 같은 batch 이름이면 묶음째 끄기·지우기
    case 'phrase_batch': {
      ownerOnly(a);
      const list = Array.isArray(body.rows) ? body.rows : [], batch = String(body.batch ?? '').trim().slice(0, 60);
      if (!batch || !list.length || list.length > 300) throw new Fail(400, 'bad batch');
      const rows = list.map((r: any) => phraseRow({ ...r, batch }));
      const { error } = await db.from('phrase_packs').insert(rows);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'phrase_batch', {}, { batch, n: rows.length });
      return { ok: true, n: rows.length };
    }

    case 'phrase_batch_set': {
      ownerOnly(a);
      const batch = String(body.batch ?? '').trim(); if (!batch) throw new Fail(400, 'bad batch');
      const q = db.from('phrase_packs');
      const { error } = body.remove === true ? await q.delete().eq('batch', batch) : await q.update({ active: !!body.active, updated_at: new Date().toISOString() }).eq('batch', batch);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, body.remove === true ? 'phrase_batch_delete' : 'phrase_batch_active', {}, { batch, active: !!body.active });
      return { ok: true };
    }

    case 'phrase_delete': {
      ownerOnly(a);
      const id = Number(body.id); if (!Number.isInteger(id) || id <= 0) throw new Fail(400, 'bad id');
      const { error } = await db.from('phrase_packs').delete().eq('id', id);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'phrase_delete', {}, { id });
      return { ok: true };
    }

    case 'notices': {
      const { data, error } = await db.from('notices').select('id,kind,push,lang,title,body,created_at,banner,audience,starts_at,ends_at,image_url,cta_label,cta_url,detail').is('user_id', null).order('created_at', { ascending: false }).range(0, 49);
      if (error) throw new Fail(500, error.message);
      return { rows: data };
    }

    case 'notice_create': {
      ownerOnly(a);
      const title = String(body.title ?? '').trim().slice(0, 120), text = String(body.body ?? '').trim().slice(0, 300), detail = String(body.detail ?? '').trim().slice(0, 5000) || null;
      const lang = ['ko', 'en', 'ja', 'es', 'fr'].includes(body.lang) ? body.lang : null;
      if (!title) throw new Fail(400, 'title required');
      // 홈 배너: 대상과 기간 (관리자 화면이 그 사람 시간대의 0시를 ISO로 보내요)
      const banner = ['strip', 'popup'].includes(body.banner) ? body.banner : null;
      const img = String(body.image_url ?? ''), image_url = banner === 'popup' && /^https:\/\/[\w.-]+\/storage\/v1\/object\/public\/notice-images\/[\w.-]+$/.test(img) ? img : null;
      const cta = String(body.cta_url ?? '').trim(), cta_url = /^#\/[\w\/-]*$/.test(cta) || /^https:\/\/[^\s"'<>]{1,290}$/.test(cta) ? cta : null;
      const cta_label = String(body.cta_label ?? '').trim().slice(0, 20) || null;
      const audience = ['all', 'trial', 'subscriber', 'ended'].includes(body.audience) ? body.audience : 'all';
      const iso = (v: unknown) => { if (!v) return null; const d = new Date(String(v)); if (isNaN(+d)) throw new Fail(400, 'bad date'); return d.toISOString(); };
      const starts_at = iso(body.starts_at), ends_at = iso(body.ends_at);
      if (starts_at && ends_at && ends_at <= starts_at) throw new Fail(400, 'bad period');
      // 종류: announce(공지) | news(새 소식, 광고성 — 앱 설정에서 따로 동의한 사람에게만, 밤에는 휴대폰 알림을 보내지 않아요). push = 휴대폰 알림도 보내기
      const kind = body.kind === 'news' ? 'news' : 'announce', push = body.push === true || body.push === 'on';
      const { error } = await db.from('notices').insert({ user_id: null, kind, push, lang, title, body: text, detail, banner, audience, starts_at, ends_at, image_url, cta_label, cta_url });
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'notice_create', {}, { title, kind, push, lang, banner, audience, starts_at, ends_at });
      return { ok: true };
    }

    // 팝업 이미지 올리기: 관리자 화면이 줄인 data URL(webp/jpeg/png, 500KB 까지) → 공개 저장소 notice-images
    case 'notice_image': {
      ownerOnly(a);
      const m = String(body.data ?? '').match(/^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+\/=]+)$/);
      if (!m) throw new Fail(400, 'bad image');
      const bytes = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
      if (bytes.length > 524288) throw new Fail(400, 'image too large');
      const name = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
      const { error } = await db.storage.from('notice-images').upload(name, bytes, { contentType: 'image/' + m[1], upsert: false });
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'notice_image', {}, { name, size: bytes.length });
      return { url: db.storage.from('notice-images').getPublicUrl(name).data.publicUrl };
    }

    case 'notice_delete': {
      ownerOnly(a);
      const id = Number(body.id); if (!Number.isInteger(id) || id <= 0) throw new Fail(400, 'bad id');
      const { error } = await db.from('notices').delete().eq('id', id).is('user_id', null);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'notice_delete', {}, { id });
      return { ok: true };
    }

    case 'extend_trial': {
      ownerOnly(a);
      const id = uid(body.id), days = Math.round(Number(body.days));
      if (!(days >= 1 && days <= 90)) throw new Fail(400, 'days must be 1-90');
      const u = await targetUser(db, id);
      const { data: p } = await db.from('profiles').select('bonus_days').eq('id', id).maybeSingle();
      const next = Math.min(365, (p?.bonus_days ?? 0) + days);
      const { error } = await db.from('profiles').update({ bonus_days: next }).eq('id', id);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'extend_trial', u, { days, reason: String(body.reason ?? '').slice(0, 500) });
      return { ok: true, bonus_days: next };
    }

    case 'vouchers': {
      const st = ['all', 'open', 'used', 'expired', 'revoked'].includes(body.status) ? body.status : 'all';
      return { ...(await rpc(db, 'admin_vouchers', { st, lim: PAGE, off: page(body.page) * PAGE })), pageSize: PAGE };
    }

    case 'voucher_create': {
      ownerOnly(a);
      // 기간: 일(1~366) 또는 개월(1~12). 무료 체험과는 따로, 남은 기간 끝에 이어 붙어요.
      const n = Math.round(Number(body.amount)), unit = body.unit === 'months' ? 'months' : 'days';
      if (!(unit === 'months' ? n >= 1 && n <= 12 : n >= 1 && n <= 366)) throw new Fail(400, 'duration must be 1 day - 1 year');
      const count = Math.round(Number(body.count ?? 1)), uses = Math.round(Number(body.uses ?? 1));
      if (!(count >= 1 && count <= 50)) throw new Fail(400, 'count must be 1-50');
      if (!(uses >= 1 && uses <= 1000)) throw new Fail(400, 'uses must be 1-1000');
      const email = String(body.email ?? '').trim().toLowerCase();
      if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254)) throw new Fail(400, 'bad email');
      if (email && count > 1) throw new Fail(400, 'one code per email');
      let expires: string | null = null;
      if (body.expires) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.expires))) throw new Fail(400, 'bad date');
        const d = new Date(body.expires + 'T23:59:59Z');
        if (isNaN(+d) || +d < Date.now()) throw new Fail(400, 'bad date');
        expires = d.toISOString();
      }
      const note = String(body.note ?? '').trim().slice(0, 200);
      const codes = await rpc(db, 'admin_voucher_create', { p_by: a.id, p_duration: `${n} ${unit}`, p_count: count, p_uses: uses, p_expires: expires, p_note: note || null, p_email: email || null });
      await audit(db, a, 'voucher_create', {}, { count, duration: `${n} ${unit}`, uses, email: email || undefined, expires: body.expires || undefined, note: note || undefined });
      return { codes };
    }

    case 'voucher_revoke': {
      ownerOnly(a);
      const code = String(body.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!/^[A-Z2-9]{12}$/.test(code)) throw new Fail(400, 'bad code');
      const { error } = await db.from('vouchers').update({ revoked_at: new Date().toISOString() }).eq('code', code);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'voucher_revoke', {}, { code });
      return { ok: true };
    }

    case 'users': {
      const filter = ['all', 'paying', 'trial', 'ended', 'past_due', 'banned', 'admins', 'inactive'].includes(body.filter) ? body.filter : 'all';
      const rows = await rpc(db, 'admin_users', { q: String(body.q ?? '').trim().slice(0, 200), filter, lim: PAGE, off: page(body.page) * PAGE });
      // 기기·처음 온 곳 (회원 구성 칸이 아직 없는 데이터베이스면 그냥 빼요)
      if (rows.length) {
        const { data: dev } = await db.from('profiles').select('id,platform,device_kind,installed,first_source').in('id', rows.map((r: any) => r.id));
        const m = new Map((dev ?? []).map((d: any) => [d.id, d]));
        for (const r of rows) { const d: any = m.get(r.id); if (d) Object.assign(r, { platform: d.platform, device_kind: d.device_kind, installed: d.installed, first_source: d.first_source }); }
      }
      return { rows, total: rows[0]?.total ?? 0, pageSize: PAGE };
    }

    case 'user':
      return (await rpc(db, 'admin_user', { uid: uid(body.id) })) ?? (() => { throw new Fail(404, 'user not found'); })();

    case 'subscriptions': {
      const st = ['all', 'active', 'trialing', 'past_due', 'paused', 'canceled', 'canceling'].includes(body.status) ? body.status : 'all';
      const rows = await rpc(db, 'admin_subscriptions', { st, lim: PAGE, off: page(body.page) * PAGE });
      return { rows, total: rows[0]?.total ?? 0, pageSize: PAGE };
    }

    case 'audit': {
      const { data, error } = await db.from('admin_audit').select('*').order('at', { ascending: false }).range(page(body.page) * PAGE, page(body.page) * PAGE + PAGE - 1);
      if (error) throw new Fail(500, error.message);
      return { rows: data, pageSize: PAGE };
    }

    case 'ban':
    case 'unban': {
      const id = uid(body.id);
      if (id === a.id) throw new Fail(400, 'cannot change your own account');
      const { data: isAdmin } = await db.from('admins').select('user_id').eq('user_id', id).maybeSingle();
      if (isAdmin) throw new Fail(400, 'remove admin role first');
      const u = await targetUser(db, id);
      const reason = String(body.reason ?? '').slice(0, 500);
      const { error } = await db.auth.admin.updateUserById(id, { ban_duration: body.action === 'ban' ? '876000h' : 'none' });
      if (error) throw new Fail(500, error.message);
      await audit(db, a, body.action, u, reason ? { reason } : {});
      return { ok: true };
    }

    case 'delete_user': {
      ownerOnly(a);
      const id = uid(body.id);
      if (id === a.id) throw new Fail(400, 'cannot delete your own account');
      const u = await targetUser(db, id);
      if (String(body.confirm_email ?? '').trim().toLowerCase() !== String(u.email ?? '').toLowerCase()) throw new Fail(400, 'email does not match');
      const { data: live } = await db.from('subscriptions').select('subscription_id').eq('user_id', id).in('status', ['active', 'trialing', 'past_due', 'paused']).is('cancel_at', null);
      if (live?.length) throw new Fail(409, 'cancel the subscription first');
      const { error } = await db.auth.admin.deleteUser(id);
      if (error) throw new Fail(500, error.message);
      await audit(db, a, 'delete_user', u, { reason: String(body.reason ?? '').slice(0, 500) });
      return { ok: true };
    }

    case 'cancel_subscription': {
      ownerOnly(a);
      if (!env.PADDLE_API_KEY) throw new Fail(400, 'PADDLE_API_KEY not set');
      const sid = String(body.subscription_id ?? '');
      if (!/^sub_[a-z0-9]+$/i.test(sid)) throw new Fail(400, 'bad subscription id');
      const when = body.when === 'immediately' ? 'immediately' : 'next_billing_period';
      const { data: sub } = await db.from('subscriptions').select('user_id').eq('subscription_id', sid).maybeSingle();
      if (!sub) throw new Fail(404, 'subscription not found');
      const base = env.PADDLE_ENV === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
      const r = await fetch(`${base}/subscriptions/${sid}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ effective_from: when })
      });
      if (!r.ok) throw new Fail(502, `paddle ${r.status}: ${(await r.text()).slice(0, 200)}`);
      // 상태 반영은 paddle-webhook이 합니다(subscription.updated / canceled)
      const { data: u } = sub.user_id ? await db.auth.admin.getUserById(sub.user_id) : { data: null };
      await audit(db, a, 'cancel_subscription', { id: sub.user_id ?? undefined, email: u?.user?.email }, { subscription_id: sid, when, reason: String(body.reason ?? '').slice(0, 500) });
      return { ok: true };
    }

    default:
      throw new Fail(400, 'unknown action');
  }
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const h = cors(req, deps.env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });
  try {
    // 예약 작업: 비밀 헤더가 맞으면 매일 운영만 실행
    const cron = req.headers.get('x-cron-secret');
    if (cron) {
      if (!deps.env.CRON_SECRET || cron !== deps.env.CRON_SECRET) throw new Fail(403, 'forbidden');
      return json(200, await rpc(deps.db, 'ops_daily'));
    }
    const a = await whoIsAdmin(req, deps.db);
    let body: any; try { body = await req.json(); } catch { throw new Fail(400, 'bad json'); }
    return json(200, await act(a, body ?? {}, deps));
  } catch (e) {
    if (e instanceof Fail) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: 'server error' });
  }
}

// @ts-ignore Deno globals
if (typeof Deno !== 'undefined' && import.meta.main) {
  // @ts-ignore Deno globals
  const env = (k: string) => Deno.env.get(k) ?? '';
  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
  const deps: Deps = { db, fetch, env: { ADMIN_ORIGIN: env('ADMIN_ORIGIN') || 'https://daytale-admin.pages.dev', PADDLE_API_KEY: env('PADDLE_API_KEY'), PADDLE_ENV: env('PADDLE_ENV'), CRON_SECRET: env('CRON_SECRET') } };
  // @ts-ignore Deno globals
  Deno.serve(req => handle(req, deps));
}
