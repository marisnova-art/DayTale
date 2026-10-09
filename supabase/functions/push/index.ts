// 웹 푸시 보내기. 두 가지 일만 해요.
//  GET  → 앱에 줄 공개 키 (VAPID). 처음 불리면 열쇠 쌍을 만들어 push_config 에 저장해요.
//  POST → pg_cron 이 1분마다 부름 (x-cron-token 확인). push_due() 가 고른 알림을 보내고 push_sent 에 적어요.
// 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase가 자동으로 넣어 줌), PUSH_CONTACT (선택, mailto)
// verify_jwt 는 꺼요: GET 은 공개 키라 누구나 봐도 되고, POST 는 cron 토큰으로 지켜요.
import * as webpush from 'jsr:@negrel/webpush@0.5.0';

const URL_ = Deno.env.get('SUPABASE_URL')!, KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: KEY, authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };
const db = (path: string, init: RequestInit = {}) => fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });

type Cfg = { vapid: webpush.ExportedVapidKeys | null; public_key: string | null; cron_token: string };
async function config(): Promise<Cfg> {
  const r = await db('push_config?id=eq.1&select=vapid,public_key,cron_token'); const [c] = await r.json();
  if (c.vapid) return c;
  const keys = await webpush.generateVapidKeys({ extractable: true });
  const vapid = await webpush.exportVapidKeys(keys), public_key = await webpush.exportApplicationServerKey(keys);
  // 동시에 두 번 만들어도 먼저 저장된 하나만 남아요
  await db('push_config?id=eq.1&vapid=is.null', { method: 'PATCH', body: JSON.stringify({ vapid, public_key }) });
  const again = await db('push_config?id=eq.1&select=vapid,public_key,cron_token'); return (await again.json())[0];
}

// 알림 글 (5개 언어). 제목은 기록 제목, 본문은 짧게
const T: Record<string, Record<string, string>> = {
  ko: { untitled: '제목 없음', event: '{time}에 시작해요', todo: '오늘까지 할 일이에요', morning: '좋은 아침이에요', morningBody: '오늘 일정 {n}개가 있어요', morningNone: '오늘 하루를 가볍게 시작해 볼까요?', evening: '오늘 하루는 어땠나요?', eveningBody: '한 줄만 적어 두어도 충분해요' },
  en: { untitled: 'Untitled', event: 'Starts at {time}', todo: 'Due today', morning: 'Good morning', morningBody: 'You have {n} events today', morningNone: 'Ready for a gentle start to your day?', evening: 'How was your day?', eveningBody: 'A single line is enough' },
  ja: { untitled: '無題', event: '{time}に始まります', todo: '今日が期限です', morning: 'おはようございます', morningBody: '今日の予定は{n}件です', morningNone: '今日も軽やかに始めましょう', evening: '今日はどんな一日でしたか？', eveningBody: '一行だけでも十分です' },
  es: { untitled: 'Sin título', event: 'Empieza a las {time}', todo: 'Vence hoy', morning: 'Buenos días', morningBody: 'Hoy tiene {n} eventos', morningNone: '¿Empezamos el día con calma?', evening: '¿Qué tal su día?', eveningBody: 'Con una sola línea basta' },
  fr: { untitled: 'Sans titre', event: 'Commence à {time}', todo: 'À faire aujourd’hui', morning: 'Bonjour', morningBody: 'Vous avez {n} événements aujourd’hui', morningNone: 'Prêt pour une journée en douceur ?', evening: 'Comment s’est passée votre journée ?', eveningBody: 'Une seule ligne suffit' }
};
type Due = { sub_id: number; endpoint: string; p256dh: string; auth: string; lang: string; key: string; kind: string; title: string | null; entry_id: string | null; extra: string | null };
export function message(d: Due) {
  const t = T[d.lang] || T.en, f = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  const title = (d.title || '').trim() || t.untitled;
  if (d.kind === 'event') return { title, body: f(t.event, { time: d.extra || '' }), id: d.entry_id, tag: d.key };
  if (d.kind === 'todo') return { title, body: t.todo, id: d.entry_id, tag: d.key };
  if (d.kind === 'morning') return { title: t.morning, body: Number(d.extra) > 0 ? f(t.morningBody, { n: d.extra! }) : t.morningNone, id: null, tag: d.key };
  return { title: t.evening, body: t.eveningBody, id: null, tag: d.key };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const cfg = await config();
    if (req.method === 'GET') return json({ key: cfg.public_key });
    if (req.method !== 'POST' || req.headers.get('x-cron-token') !== cfg.cron_token) return json({ error: 'forbidden' }, 403);
    if (new Date().getUTCMinutes() === 0) await db(`push_sent?sent_at=lt.${new Date(Date.now() - 3 * 864e5).toISOString()}`, { method: 'DELETE' });   // 한 시간에 한 번 오래된 기록 정리
    const due: Due[] = await (await db('rpc/push_due', { method: 'POST', body: '{}' })).json();
    if (!Array.isArray(due) || !due.length) return json({ sent: 0 });
    const vapidKeys = await webpush.importVapidKeys(cfg.vapid!);
    const app = await webpush.ApplicationServer.new({ contactInformation: Deno.env.get('PUSH_CONTACT') || 'mailto:24story@gmail.com', vapidKeys });
    let sent = 0; const gone: number[] = [], done: { sub_id: number; key: string }[] = [], ok = new Set<number>();
    await Promise.all(due.map(async d => {
      try {
        await app.subscribe({ endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } }).pushTextMessage(JSON.stringify(message(d)), { ttl: 3600, urgency: webpush.Urgency.High });
        sent++; ok.add(d.sub_id); done.push({ sub_id: d.sub_id, key: d.key });
      } catch (e) {
        const st = (e as webpush.PushMessageError)?.response?.status;
        if (st === 404 || st === 410) gone.push(d.sub_id);          // 앱을 지웠거나 알림을 껐어요 → 주소 정리
        else done.push({ sub_id: d.sub_id, key: d.key });          // 다른 오류는 다시 보내지 않아요 (같은 알림이 여러 번 울리지 않게)
        console.error('push fail', st, String(e));
      }
    }));
    if (done.length) await db('push_sent', { method: 'POST', headers: { prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify(done.filter(x => !gone.includes(x.sub_id))) });
    if (gone.length) await db(`push_subs?id=in.(${[...new Set(gone)].join(',')})`, { method: 'DELETE' });
    if (ok.size) await db(`push_subs?id=in.(${[...ok].join(',')})`, { method: 'PATCH', body: JSON.stringify({ last_ok_at: new Date().toISOString() }) });
    return json({ sent, gone: gone.length });
  } catch (e) {
    console.error(e); return json({ error: 'server' }, 500);
  }
});
