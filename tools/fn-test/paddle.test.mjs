// 결제 웹훅 검사.  node --experimental-strip-types paddle.test.mjs
import { handle } from '../../supabase/functions/paddle-webhook/index.ts';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const NOW = Date.parse('2026-10-08T00:00:00Z'), SECRET = 'pdl_ntfset_test';
const rows = new Map();
const env = k => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', PADDLE_WEBHOOK_SECRET: SECRET, PADDLE_PRICE_MONTHLY: 'pri_m', PADDLE_PRICE_YEARLY: 'pri_y' })[k];
const fetchFake = async (url, o = {}) => {
  if (o.method === 'POST') { const b = JSON.parse(o.body); rows.set(b.subscription_id, { ...(rows.get(b.subscription_id) || {}), ...b }); return new Response(null, { status: 201 }); }
  const id = decodeURIComponent(url.split('subscription_id=eq.')[1].split('&')[0]); const r = rows.get(id); return new Response(JSON.stringify(r ? [r] : []));
};
const signed = async (body, ts = NOW / 1000, secret = SECRET) => {
  const raw = JSON.stringify(body);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const h1 = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}:${raw}`)))].map(b => b.toString(16).padStart(2, '0')).join('');
  return new Request('https://f/paddle-webhook', { method: 'POST', headers: { 'paddle-signature': `ts=${ts};h1=${h1}` }, body: raw });
};
const deps = { fetch: fetchFake, env, now: () => NOW };
const U = 'aaaaaaaa-0000-4000-8000-000000000001';
const ev = (type, at, data) => ({ event_type: type, occurred_at: at, data: { id: 'sub_01', customer_id: 'ctm_1', status: 'active', currency_code: 'USD', custom_data: { user_id: U }, items: [{ price: { id: 'pri_y', unit_price: { amount: '3990', currency_code: 'USD' } } }], current_billing_period: { ends_at: '2027-10-08T00:00:00Z' }, management_urls: { update_payment_method: 'https://pay/u', cancel: 'https://pay/c' }, ...data } });
let r = await handle(await signed(ev('subscription.created', '2026-10-08T00:00:00Z', {})), deps);
const s = rows.get('sub_01');
ok(r.status === 200 && s?.user_id === U && s.plan === 'yearly' && s.amount === 39.9 && s.status === 'active', '구독 생성 → 연간 39.90 USD, 회원 연결');
r = await handle(await signed(ev('subscription.updated', '2026-10-09T00:00:00Z', { scheduled_change: { action: 'cancel', effective_at: '2027-10-08T00:00:00Z' } })), deps);
ok(rows.get('sub_01').cancel_at === '2027-10-08T00:00:00Z', '해지 예약 반영');
r = await handle(await signed(ev('subscription.updated', '2026-10-08T12:00:00Z', { status: 'past_due' })), deps);
ok(r.status === 200 && rows.get('sub_01').status === 'active', '늦게 온 옛 이벤트는 무시');
r = await handle(await signed(ev('subscription.created', '2026-10-10T00:00:00Z', { custom_data: { user_id: 'bbbbbbbb-0000-4000-8000-000000000002' } })), deps);
ok(rows.get('sub_01').user_id === U, '한 번 연결된 회원은 바뀌지 않음');
ok((await handle(await signed(ev('subscription.created', '2026-10-11T00:00:00Z', {}), NOW / 1000, 'wrong'), deps)).status === 401, '서명이 틀리면 거절');
ok((await handle(await signed(ev('subscription.created', '2026-10-11T00:00:00Z', {}), NOW / 1000 - 600), deps)).status === 401, '5분 넘은 재전송 거절');
ok((await handle(new Request('https://f', { method: 'POST', body: '{}' }), deps)).status === 401, '서명 없으면 거절');
r = await handle(await signed({ event_type: 'transaction.completed', data: {} }), deps); ok(r.status === 200 && (await r.text()) === 'ignored', '구독 외 이벤트는 무시');
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
