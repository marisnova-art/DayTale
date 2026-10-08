// Paddle 결제 웹훅 → public.subscriptions. 브라우저 말은 믿지 않고, Paddle 서명을 확인한 이벤트만 반영해요.
// 배포: supabase functions deploy paddle-webhook --no-verify-jwt
// 비밀 값: PADDLE_WEBHOOK_SECRET(pdl_ntfset_…), PADDLE_PRICE_MONTHLY, PADDLE_PRICE_YEARLY
// Paddle → Developer tools → Notifications: URL https://<project>.supabase.co/functions/v1/paddle-webhook
//   이벤트: subscription.created · updated · activated · canceled · past_due · paused · resumed · trialing
type Deps = { fetch: typeof fetch; env: (k: string) => string | undefined; now?: () => number };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

/* Paddle-Signature: "ts=1671552777;h1=…" = HMAC-SHA256(`${ts}:${본문}`) */
export async function verify(raw: string, header: string | null, secret: string, nowSec: number) {
  if (!secret || !header) return false;
  const ts = header.split(';').find(p => p.startsWith('ts='))?.slice(3);
  const sigs = header.split(';').filter(p => p.startsWith('h1=')).map(p => p.slice(3));
  if (!ts || !sigs.length || Math.abs(nowSec - Number(ts)) > 300) return false;   // 5분 넘은 재전송 거절
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}:${raw}`)));
  return sigs.some(s => same(s, mac));
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const env = deps.env, now = deps.now ? deps.now() : Date.now();
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  const raw = await req.text();
  if (!(await verify(raw, req.headers.get('paddle-signature'), env('PADDLE_WEBHOOK_SECRET') || '', now / 1000))) return new Response('bad signature', { status: 401 });
  let ev: any; try { ev = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }
  if (!String(ev.event_type || '').startsWith('subscription.')) return new Response('ignored');
  const s = ev.data ?? {}; if (!/^sub_/.test(s.id || '')) return new Response('bad id', { status: 400 });
  const base = env('SUPABASE_URL'), srv = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = (path: string, init: RequestInit = {}) => deps.fetch(`${base}/rest/v1/${path}`, { ...init, headers: { apikey: srv, authorization: `Bearer ${srv}`, 'content-type': 'application/json', ...(init.headers || {}) } });

  const price = s.items?.[0]?.price ?? {};
  const plan = price.id === env('PADDLE_PRICE_YEARLY') ? 'yearly' : price.id === env('PADDLE_PRICE_MONTHLY') ? 'monthly' : (s.billing_cycle?.interval === 'year' ? 'yearly' : 'monthly');
  const userId = typeof s.custom_data?.user_id === 'string' && UUID.test(s.custom_data.user_id) ? s.custom_data.user_id : null;
  // 이벤트 순서가 바뀌어 와도 옛 이벤트가 새 상태를 덮지 않게
  const pr = await db(`subscriptions?subscription_id=eq.${encodeURIComponent(s.id)}&select=event_at,user_id`);
  const prev = pr.ok ? (await pr.json())[0] : null;
  if (prev?.event_at && ev.occurred_at && Date.parse(prev.event_at) > Date.parse(ev.occurred_at)) return new Response('stale');
  const amount = Number(price.unit_price?.amount); // 가장 작은 단위(센트)
  const row = {
    subscription_id: s.id, user_id: prev?.user_id ?? userId, customer_id: s.customer_id ?? null, status: String(s.status || 'active'),
    plan, price_id: price.id ?? null, currency: s.currency_code ?? price.unit_price?.currency_code ?? null,
    amount: Number.isFinite(amount) ? amount / 100 : null,
    current_period_end: s.current_billing_period?.ends_at ?? null,
    cancel_at: s.scheduled_change?.action === 'cancel' ? s.scheduled_change.effective_at : (s.canceled_at ?? null),
    update_payment_url: s.management_urls?.update_payment_method ?? null, cancel_url: s.management_urls?.cancel ?? null,
    event_at: ev.occurred_at ?? new Date(now).toISOString(), updated_at: new Date(now).toISOString()
  };
  const r = await db('subscriptions?on_conflict=subscription_id', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) { console.error(await r.text()); return new Response('db error', { status: 500 }); }   // Paddle이 다시 보내요
  return new Response('ok');
}

// @ts-ignore Deno 실행 때만
if (typeof Deno !== 'undefined') Deno.serve(req => handle(req, { fetch, env: k => Deno.env.get(k) }));
