// 공지·새 소식 휴대폰 알림: push_due() 가 누구에게 무엇을 고르는지 (PGlite)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const R = p => readFileSync(new URL(p, import.meta.url), 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
const pg = new PGlite();
await pg.exec(R('../../tools/sql-test/supabase-mock.sql'));
await pg.exec(R('../../supabase/schema.sql'));
// pg_cron·pg_net 과 cron 등록은 빼고 실행해요
let push = R('../../supabase/push.sql').replace(/create extension if not exists pg_(cron|net);/g, '');
push = push.slice(0, push.indexOf("select cron.schedule('daytale-push'"));
await pg.exec(push.replace(/extensions\.gen_random_bytes\(32\)/g, "'x'::bytea"));
const U = { a: '00000000-0000-0000-0000-00000000000a', b: '00000000-0000-0000-0000-00000000000b' };
for (const [k, id] of Object.entries(U)) await pg.query(`insert into auth.users(id, email) values ($1, $2)`, [id, k + '@x.test']);
await pg.query(`insert into push_subs(user_id, endpoint, p256dh, auth, tz, lang) values ($1, 'https://web.push.apple.com/a', 'p', 'a', 'Asia/Seoul', 'ko'), ($2, 'https://web.push.apple.com/b', 'p', 'a', 'Asia/Seoul', 'en')`, [U.a, U.b]);
await pg.query(`insert into user_settings(user_id, prefs) values ($1, '{"notify":{"news":true}}'), ($2, '{"notify":{"notices":false}}') on conflict (user_id) do update set prefs = excluded.prefs`, [U.a, U.b]);
const now = '2026-10-16T01:00:00Z';   // 서울 오전 10시
const ins = (o) => pg.query(`insert into notices(user_id, kind, push, lang, title, body, created_at, starts_at) values (null, $1, $2, $3, $4, 'b', $5, $6)`, [o.kind || 'announce', o.push ?? true, o.lang ?? null, o.title, o.created || '2026-10-16T00:30:00Z', o.starts || null]);
await ins({ title: 'n1' }); await ins({ title: 'off', push: false }); await ins({ title: 'news1', kind: 'news' }); await ins({ title: 'old', created: '2026-10-15T00:00:00Z' });
await ins({ title: 'later', starts: '2026-10-16T05:00:00Z' }); await ins({ title: 'ja', lang: 'ja' });
const due = async (t = now) => (await pg.query(`select d.*, s.user_id from push_due($1) d join push_subs s on s.id = d.sub_id`, [t])).rows;
let d = await due();
const got = u => d.filter(x => x.user_id === u).map(x => x.title).sort().join();
ok(got(U.a) === 'n1,news1', 'A(공지 켬·새 소식 동의): 공지 + 새 소식 — ' + got(U.a));
ok(got(U.b) === '', 'B(공지 끔·새 소식 미동의): 없음 — ' + got(U.b));
ok(d.find(x => x.title === 'n1').kind === 'notice' && /^\d+\|b$/.test(d.find(x => x.title === 'n1').extra), '종류·공지 번호 전달');
const night = await due('2026-10-16T13:00:00Z');   // 서울 밤 10시
ok(!night.some(x => x.title === 'news1') && night.some(x => x.title === 'n1') === false, '밤에는 새 소식 안 보냄 (공지는 6시간 지남)');
await pg.query(`insert into push_sent(sub_id, key) select sub_id, key from push_due($1)`, [now]);
ok((await due()).length === 0, '한 번 보낸 건 다시 안 보냄');
ok((await due('2026-10-16T05:10:00Z')).some(x => x.title === 'later'), '예약한 공지는 시작 시각에');
process.exit(fail ? 1 : 0);
