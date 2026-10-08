// Daytale v1 데이터베이스 권한 검사 — 실제 Postgres(PGlite)에서 사용자별로 실행합니다.
// 준비: npm i @electric-sql/pglite   실행: node run.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const here = f => readFileSync(new URL(f, import.meta.url), 'utf8');
const db = new PGlite();
await db.exec(here('./supabase-mock.sql'));
const schema = here('../../supabase/schema.sql');
await db.exec(schema); await db.exec(schema); // 두 번 실행해도 안전해야 함
const U = { ann: 'aaaaaaaa-0000-4000-8000-000000000001', bob: 'bbbbbbbb-0000-4000-8000-000000000002', own: 'cccccccc-0000-4000-8000-000000000003' };
await db.query(`insert into auth.users(id, email) values ($1, 'ann@x.com'), ($2, 'bob@x.com'), ($3, '24Story@gmail.com')`, [U.ann, U.bob, U.own]);
async function as(who, sql, params = []) {
  return db.transaction(async tx => {
    if (who === 'service') await tx.exec('set local role service_role');
    else if (who === 'anon') await tx.exec('set local role anon');
    else {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [U[who]]);
      await tx.exec('set local role authenticated');
    }
    return (await tx.query(sql, params)).rows;
  });
}
const su = (sql, p) => db.query(sql, p).then(r => r.rows);
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const throws = async (p, m, re) => { try { await p; ok(false, m + ' (오류 없음)'); } catch (e) { ok(!re || re.test(e.message), m + ' → ' + e.message.slice(0, 70)); } };
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// 가입 → 회원 정보·체험·대표 관리자
ok((await su(`select count(*)::int n from profiles`))[0].n === 3, '가입하면 회원 정보가 생김');
ok((await su(`select count(*)::int n from admins`))[0].n === 0, '대표 이메일도 메일 확인 전에는 관리자가 아님');
await su(`update auth.users set email_confirmed_at = now() where id = $1`, [U.own]);
ok((await su(`select role from admins where user_id = $1`, [U.own]))[0]?.role === 'owner', '메일 확인이 끝난 대표 이메일(대소문자 무관)은 owner 관리자');
ok((await su(`select count(*)::int n from admins`))[0].n === 1, '다른 회원은 관리자가 아님');
const st = (await as('ann', `select my_status() s`))[0].s;
ok(st.can_write === true && st.subscriber === false && st.is_admin === false, '체험 중: 쓰기 가능, 구독 아님');
ok(Math.round((new Date(st.trial_ends_at) - Date.now()) / 864e5) === 30, '체험 30일');

// 내 정보 수정 범위
await as('ann', `update profiles set lang = 'ko', country = 'KR', timezone = 'Asia/Seoul', display_name = '앤'`);
ok((await su(`select country from profiles where id = $1`, [U.ann]))[0].country === 'KR', '언어·나라·시간대 수정 가능');
await throws(as('ann', `update profiles set trial_ends_at = now() + interval '10 years'`), '체험 기간은 못 바꿈', /permission/);
await throws(as('ann', `update profiles set bonus_days = 300`), '보너스 일수도 못 바꿈', /permission/);
ok((await as('bob', `select id from profiles`)).length === 1, '다른 사람 회원 정보는 안 보임');
await throws(as('ann', `select * from admins`), '관리자 명단은 못 읽음', /permission/);
await throws(as('anon', `select * from entries`), '로그인 안 하면 기록 못 읽음', /permission/);

// 기록·폴더
await as('ann', `insert into folders(id, name, color) values ($1, '회사', '#3b82f6')`, [id(1)]);
await as('ann', `insert into entries(id, type, title, content_text, folder_id, user_id) values ($1, 'note', '국숫집', '맑은 국물', $2, $3)`, [id(10), id(1), U.bob]);
const e10 = (await su(`select user_id, version from entries where id = $1`, [id(10)]))[0];
ok(e10.user_id === U.ann && e10.version === 1, '주인은 항상 본인으로 고정(다른 user_id를 넣어도)');
ok((await as('bob', `select id from entries`)).length === 0, '다른 사람 기록은 안 보임');
ok((await as('bob', `update entries set title = 'x' where id = $1 returning id`, [id(10)])).length === 0, '다른 사람 기록은 못 고침');
ok((await as('bob', `delete from entries where id = $1 returning id`, [id(10)])).length === 0, '다른 사람 기록은 못 지움');
await as('bob', `insert into entries(id, title, folder_id) values ($1, 'x', $2)`, [id(11), id(1)]);
ok((await su(`select folder_id from entries where id = $1`, [id(11)]))[0].folder_id === null, '남의 폴더 id를 넣으면 비워짐');
const up = await as('ann', `update entries set title = '국숫집 점심', version = 99 where id = $1 returning version`, [id(10)]);
ok(up[0].version === 2, '버전은 서버가 1씩 올림');
await throws(as('ann', `insert into entries(id, photos) values ($1, '[1,2,3,4,5]')`, [id(12)]), '사진은 기록당 4장까지', /check/);
await throws(as('ann', `insert into entries(id, tags) values ($1, $2)`, [id(13), Array.from({ length: 21 }, (_, i) => 't' + i)]), '태그 20개까지', /check/);

// 체험 끝 → 쓰기 잠금
await su(`update profiles set trial_ends_at = now() - interval '1 day' where id = $1`, [U.ann]);
ok((await as('ann', `select can_write() w`))[0].w === false, '체험 끝: 쓰기 불가');
await throws(as('ann', `insert into entries(id, title) values ($1, '새 글')`, [id(14)]), '새 기록 막힘', /write_locked/);
await throws(as('ann', `update entries set title = '고침' where id = $1`, [id(10)]), '내용 수정 막힘', /write_locked/);
await throws(as('ann', `insert into folders(id, name) values ($1, '새 폴더')`, [id(2)]), '새 폴더 막힘', /write_locked/);
ok((await as('ann', `update entries set deleted_at = now() where id = $1 returning id`, [id(10)])).length === 1, '휴지통으로 보내기는 됨');
ok((await as('ann', `update entries set deleted_at = null, favorite = true where id = $1 returning id`, [id(10)])).length === 1, '되살리기·즐겨찾기는 됨');
ok((await as('ann', `select title from entries`)).length === 1, '읽기는 됨');
await su(`update profiles set bonus_days = 30 where id = $1`, [U.ann]);
ok((await as('ann', `select can_write() w`))[0].w === true, '초대 보너스로 체험 연장');
await su(`update profiles set bonus_days = 0 where id = $1`, [U.ann]);

// 구독
await as('ann', `insert into subscriptions(subscription_id, user_id, status) values ('sub_x', $1, 'active')`, [U.ann]).then(() => ok(false, '스스로 구독 추가 못 함'), () => ok(true, '스스로 구독 추가 못 함'));
await as('service', `insert into subscriptions(subscription_id, user_id, status, plan) values ('sub_a', $1, 'active', 'yearly')`, [U.ann]);
ok((await as('ann', `select my_status() s`))[0].s.can_write === true, '구독하면 다시 쓰기 가능');
ok((await as('ann', `update entries set title = '다시 고침' where id = $1 returning id`, [id(10)])).length === 1, '구독 후 수정 됨');
ok((await as('bob', `select * from subscriptions`)).length === 0, '남의 구독은 안 보임');
await throws(as('ann', `select delete_my_account()`), '구독 중에는 해지 먼저', /cancel_subscription_first/);

// 삭제 표시·사진
await as('ann', `insert into entries(id, title) values ($1, '지울 글')`, [id(15)]);
await as('ann', `delete from entries where id = $1`, [id(15)]);
ok((await as('ann', `select record_id from deleted_records`)).some(r => r.record_id === id(15)), '삭제하면 다른 기기용 표시가 남음');
await throws(as('ann', `insert into photos(id, user_id, key, bytes) values ($1, $2, 'k.webp', 100)`, [id(20), U.ann]), '사진 목록은 서버 함수만 추가', /permission/);
await as('service', `insert into photos(id, user_id, key, bytes, thumb_bytes) values ($1, $2, $3, 200000, 20000)`, [id(20), U.ann, U.ann + '/' + id(20) + '.webp']);
ok((await as('ann', `select my_status() s`))[0].s.photo_bytes === 220000, '사진 용량 합계');
await as('ann', `delete from photos where id = $1`, [id(20)]);
ok((await su(`select count(*)::int n from photo_trash`))[0].n === 2, '지운 사진은 원본·미리보기 정리 목록에 들어감');
const al = (await as('service', `select photo_allowance($1) a`, [U.ann]))[0].a;
ok(al.count === 0 && al.can_write === true, '사진 용량 확인 함수(서버 전용)');
await throws(as('ann', `select photo_allowance($1)`, [U.ann]), '사용자는 사진 용량 함수를 못 부름', /permission/);
await as('service', `insert into photos(id, user_id, entry_id, key, bytes, created_at) values ($1, $2, $3, 'a/x.webp', 10, now() - interval '2 days'), ($4, $2, null, 'a/y.webp', 10, now())`, [id(21), U.ann, id(999), id(22)]);
await as('ann', `insert into entries(id, photos) values ($1, $2)`, [id(23), JSON.stringify([{ id: id(24), key: 'a/z.webp' }])]);
await as('service', `insert into photos(id, user_id, entry_id, key, bytes, created_at) values ($1, $2, $3, 'a/z.webp', 10, now() - interval '2 days'), ($4, $2, $3, 'a/w.webp', 10, now() - interval '2 days')`, [id(24), U.ann, id(23), id(25)]);
ok((await as('service', `select sweep_orphan_photos() n`))[0].n === 2, '기록에 없는 오래된 사진만 정리 (오늘 올린 것, 기록에 붙은 것은 남김)');
ok((await su(`select array_agg(id::text order by id) a from photos`))[0].a.join() === [id(22), id(24)].join(), '남은 사진 확인');

// 친구 초대
const code = (await as('bob', `select referral_code c from profiles`))[0].c;
ok((await as('ann', `select redeem_referral($1) r`, [code]))[0].r === true, '초대 코드 사용');
ok((await as('ann', `select redeem_referral($1) r`, [code]))[0].r === false, '초대 코드는 한 번만');
ok((await su(`select bonus_days b from profiles where id = $1`, [U.ann]))[0].b === 30, '초대 보너스는 한 번만 더해짐');
// 글 용량 한도 (100MB)
await su(`update profiles set content_bytes = 100 * 1024 * 1024 - 1000 where id = $1`, [U.bob]);
await throws(as('bob', `insert into entries(id, content) values ($1, repeat('가', 2000))`, [id(990)]), '글 용량 100MB를 넘으면 저장 거절', /limit_bytes/);
await as('bob', `insert into entries(id, content) values ($1, 'short')`, [id(991)]);
const cb = (await su(`select content_bytes b from profiles where id = $1`, [U.bob]))[0].b;
await as('bob', `delete from entries where id = $1`, [id(991)]);
ok(Number((await su(`select content_bytes b from profiles where id = $1`, [U.bob]))[0].b) < Number(cb), '지우면 용량이 줄어듦');
await su(`update profiles set content_bytes = (select coalesce(sum(entry_size(e)), 0) from entries e where e.user_id = profiles.id)`);
await throws(as('bob', `update profiles set content_bytes = 0`), '용량 숫자는 사용자가 못 바꿈', /permission/);
ok((await su(`select bonus_days b from profiles where id = $1`, [U.bob]))[0].b === 30, '초대한 사람도 30일 추가');

// 함수 공개 범위
await throws(as('anon', `select my_status()`), '로그인 안 하면 상태 함수 못 부름', /permission/);
await throws(as('ann', `select handle_new_user()`), '내부 함수는 못 부름');
await as('ann', `select touch_seen()`);
ok((await as('ann', `select read_at from notices`)).length === 0, '알림 읽기 됨');
await as('ann', `insert into folders(id, name) values ($1, 'f')`, [id(3)]);
for (let i = 0; i < 49; i++) await as('ann', `insert into folders(id, name) values ($1, 'f')`, [id(100 + i)]).catch(() => {});
await throws(as('ann', `insert into folders(id, name) values ($1, 'one too many')`, [id(300)]), '폴더 50개까지', /limit_folders/);
await as('bob', `select delete_my_account()`);
ok((await su(`select count(*)::int n from profiles where id = $1`, [U.bob]))[0].n === 0, '계정 삭제하면 회원 정보도 사라짐');
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
