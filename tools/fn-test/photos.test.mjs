// 사진 함수 검사 (가짜 R2·DB).  node --experimental-strip-types photos.test.mjs
import { handle } from '../../supabase/functions/photos/index.ts';
import { sign } from '../../supabase/functions/_shared/sigv4.ts';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

// AWS 문서의 S3 서명 예시(GET Object)와 같은 값이 나와야 해요
const s = await sign({ method: 'GET', url: 'https://examplebucket.s3.amazonaws.com/test.txt', headers: { Range: 'bytes=0-9' }, accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1', date: new Date('2013-05-24T00:00:00Z') });
ok(s.signature === 'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41', 'S3 서명 방식이 AWS 예시와 같음');

const UID = 'aaaaaaaa-0000-4000-8000-000000000001', PID = '11111111-0000-4000-8000-000000000001';
const webp = n => { const b = new Uint8Array(n); b.set([82, 73, 70, 70], 0); b.set([87, 69, 66, 80], 8); return new Blob([b], { type: 'image/webp' }); };
let allowance = { subscriber: false, can_write: true, count: 3, bytes: 0 }, r2 = new Map(), rows = [], trash = ['x/1.webp'];
const fetchFake = async (url, o = {}) => {
  if (url.endsWith('/auth/v1/user')) return o.headers.authorization === 'Bearer good' ? new Response(JSON.stringify({ id: UID })) : new Response('{}', { status: 401 });
  if (url.includes('rpc/photo_allowance')) return new Response(JSON.stringify(allowance));
  if (url.includes('rpc/sweep_orphan_photos')) return new Response('0');
  if (url.includes('r2.cloudflarestorage.com')) {
    ok(/^AWS4-HMAC-SHA256 Credential=AK\//.test(o.headers.authorization), 'R2 요청에 서명이 붙음 (' + o.method + ')');
    const key = url.split('/bucket/')[1];
    if (o.method === 'PUT') r2.set(key, o.body.length); else r2.delete(key);
    return new Response('', { status: 200 });
  }
  if (url.includes('/rest/v1/photos?on_conflict=id') && o.method === 'POST') { const b = JSON.parse(o.body); if (rows.some(x => x.id === b.id)) return new Response('[]', { status: 201 }); rows.push(b); return new Response(JSON.stringify([b]), { status: 201 }); }
  if (url.includes('/rest/v1/photos?select=user_id,key&id=eq.')) { const id = url.split('id=eq.')[1]; return new Response(JSON.stringify(rows.filter(x => x.id === id))); }
  if (url.includes('photo_trash?select')) return new Response(JSON.stringify(trash.map(key => ({ key }))));
  if (url.includes('photo_trash?key=eq.')) { trash = []; return new Response(null, { status: 204 }); }
  return new Response('[]');
};
const env = k => ({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', R2_ACCOUNT_ID: 'acc', R2_ACCESS_KEY_ID: 'AK', R2_SECRET_ACCESS_KEY: 'SK', R2_BUCKET: 'bucket', CRON_SECRET: 'cron' })[k];
const deps = { fetch: fetchFake, env };
const up = (auth = 'Bearer good', full = webp(150000), id = PID) => { const f = new FormData(); f.set('id', id); f.set('entry_id', PID.replace('1111', '2222')); f.set('full', full); f.set('thumb', webp(20000)); f.set('w', '1600'); f.set('h', '1200'); return handle(new Request('https://f/photos', { method: 'POST', headers: { authorization: auth }, body: f }), deps); };

let r = await up(); let j = await r.json();
ok(r.status === 200 && j.key === `${UID}/${PID}.webp`, '사진 올리기 → 내 폴더 경로');
ok(r2.get(`${UID}/${PID}.webp`) === 150000 && r2.get(`${UID}/${PID}.t.webp`) === 20000, 'R2에 원본과 미리보기 저장');
ok(rows[0]?.bytes === 150000 && rows[0]?.thumb_bytes === 20000 && rows[0]?.user_id === UID, '사진 목록에 용량 기록');
r = await up(); ok(r.status === 200 && rows.length === 1 && r2.has(`${UID}/${PID}.webp`), '응답을 못 받아 다시 보내도 사진이 지워지지 않음');
ok((await up('Bearer bad')).status === 401, '로그인 안 하면 거절');
ok((await up('Bearer good', new Blob([new Uint8Array(1000)]))).status === 400, 'webp가 아니면 거절');
ok((await up('Bearer good', webp(2_000_000))).status === 400, '너무 큰 파일 거절');
ok((await up('Bearer good', webp(100), '../etc')).status === 400, '이상한 id 거절');
allowance = { subscriber: false, can_write: true, count: 100, bytes: 0 };
r = await up(); ok(r.status === 403 && (await r.json()).error === 'photo_quota', '체험은 100장까지');
allowance = { subscriber: false, can_write: true, count: 60, bytes: 0, pending: 40 };
r = await up(); ok(r.status === 403, '올리고 지우기를 반복해도 정리 전 사진까지 셈');
allowance = { subscriber: true, can_write: true, count: 5000, bytes: 1024 ** 3 - 100 };
r = await up(); ok(r.status === 403, '구독은 1GB까지');
allowance = { subscriber: false, can_write: false, count: 0, bytes: 0 };
r = await up(); ok(r.status === 403 && (await r.json()).error === 'write_locked', '체험이 끝나면 올리기 막힘');
{ const f = new FormData(); const j1 = new Uint8Array(5000); j1.set([0xff, 0xd8, 0xff]); f.set('id', PID.replace('0001', '0009')); f.set('full', new Blob([j1])); f.set('thumb', new Blob([j1.slice(0, 900)]));
  allowance = { subscriber: false, can_write: true, count: 1, bytes: 0 };
  const rj = await handle(new Request('https://f/photos', { method: 'POST', headers: { authorization: 'Bearer good' }, body: f }), deps); const jj = await rj.json();
  ok(rj.status === 200 && jj.key.endsWith('0009.jpg') && r2.has(`${UID}/${PID.replace('0001', '0009')}.t.jpg`), '사파리용 jpg도 받음'); }
r = await handle(new Request('https://f/photos?action=sweep', { method: 'POST' }), deps); ok(r.status === 403, '정리는 예약 작업만');
r2.set('x/1.webp', 1);
r = await handle(new Request('https://f/photos?action=sweep', { method: 'POST', headers: { 'x-cron-secret': 'cron' } }), deps); j = await r.json();
ok(j.removed === 1 && !r2.has('x/1.webp') && trash.length === 0, '지운 사진을 R2에서도 지움');
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
