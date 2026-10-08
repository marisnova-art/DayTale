// 3단계: 편집기 · 정리형 목록 · 폴더 · 찾기 · 휴지통 · 할 일 · 정리형 홈.  node phase3.mjs [스크린샷 폴더]
import { setup } from './harness.mjs';
const { as, page, ok, shot, finish } = await setup({ out: process.argv[2] || '.' });
await as(`insert into folders(id, name, color) values ('11111111-0000-4000-8000-000000000001', '회사', '#7FB2FF')`);
const seed = [['note', '국숫집 점심', '<p>점심에 동료랑 새로 생긴 국숫집에 갔어요.</p>', '2026-10-08T12:10:00+09:00'], ['idea', '냉장고 사진으로 장보기', '<p>빠진 재료를 알려 주면 편할 것 같다</p>', '2026-10-07T22:41:00+09:00'],
  ['item', '여권', '', '2026-10-07T20:15:00+09:00'], ['todo', '기획서 2장까지 쓰기', '', '2026-10-08T09:02:00+09:00'], ['event', '치과 예약', '', '2026-10-06T10:00:00+09:00']];
for (const [type, title, html, at] of seed) await as(`insert into entries(id, type, title, content, content_text, meta, created_at, client_updated_at) values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6)`,
  [type, title, html, html.replace(/<[^>]+>/g, ''), type === 'item' ? { place: '안방 서랍 두 번째 칸, 파란 파우치' } : type === 'event' ? { date: '2026-10-08', time: '14:00', place: '강남역 3번 출구' } : type === 'todo' ? { date: '2026-10-08' } : {}, at]);
const sync = p => p.waitForTimeout(1500).then(() => p.waitForFunction(() => window.__daytale.S.sync === 'synced' && ![...window.__daytale.S.entries.values()].some(e => e._dirty), null, { timeout: 8000 })).catch(() => {});

let p = await page({ width: 390, height: 844 });
await p.goto('http://app.test/#/all'); await p.waitForSelector('.r'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
ok((await p.$$('.r')).length === 5, '모든 기록 5개'); await shot(p, 'v1_10_list');
await p.click('.filters [data-f=todo]'); ok((await p.$$('.r')).length === 1, '종류 칩 거르기');

// 새 기록: 제목, 본문, 마크다운 단축, "/" 블록, 서식 막대
await p.goto('http://app.test/#/new'); await p.waitForSelector('.ed-body');
await p.click('.ed-title'); await p.keyboard.type('주말 계획'); await p.keyboard.press('Enter');
await p.keyboard.type('토요일 오전에는 집 정리부터 하고 싶어요.'); await p.keyboard.press('Enter');
await p.keyboard.type('# 할 것'); await p.keyboard.press('Enter');
await p.keyboard.type('/체크'); await p.waitForSelector('.blocks'); await shot(p, 'v1_12_blocks');
await p.keyboard.press('Enter'); await p.keyboard.type('세탁기 돌리기'); await p.keyboard.press('Enter'); await p.keyboard.type('화분 물 주기');
await p.keyboard.press('Enter'); await p.keyboard.press('Enter');
await p.keyboard.type('> 천천히 해도 괜찮아요'); 
// 첫 문장 일부를 골라 굵게
await p.evaluate(() => { const t = document.querySelector('.ed-body').firstChild.firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 6); getSelection().removeAllRanges(); getSelection().addRange(r); });
await p.waitForSelector('.fmt'); await shot(p, 'v1_11_editor_fmt'); await p.click('.fmt [data-f=bold]');
await p.click('.ed-body ul.todo li >> nth=0', { position: { x: 8, y: 12 } });
await p.waitForTimeout(900);
await p.click('[data-act=folder]'); await p.waitForSelector('.sheet.open'); await p.click('.sheet .pick button:has-text("회사")'); await p.waitForTimeout(900);
await shot(p, 'v1_13_editor');
await p.click('[data-act=done]'); await sync(p);
const [w] = await as(`select title, content, content_text, folder_id from entries where title = '주말 계획'`);
ok(!!w, '새 기록 저장 → 서버');
ok(w && /<h2>할 것<\/h2>/.test(w.content), '"# " → 제목'); ok(w && /<ul class="todo"><li class="done">세탁기 돌리기<\/li><li>화분 물 주기<\/li><\/ul>/.test(w.content), '"/체크" → 체크리스트, 체크 표시');
ok(w && /<blockquote>천천히 해도 괜찮아요<\/blockquote>/.test(w.content), '"> " → 인용'); ok(w && /<b>토요일 오전<\/b>/.test(w.content), '서식 막대 → 굵게');
ok(w && w.folder_id === '11111111-0000-4000-8000-000000000001', '폴더 옮기기'); ok(w && w.content_text.includes('☑ 세탁기'), '텍스트 버전');

// 빈 새 기록은 저장 안 함
const before = (await as(`select count(*)::int n from entries`))[0].n;
await p.goto('http://app.test/#/new'); await p.waitForSelector('.ed-body'); await p.click('[data-act=back]'); await p.waitForTimeout(800);
ok((await as(`select count(*)::int n from entries`))[0].n === before, '빈 새 기록은 버림');

// 할 일: 추가, 체크
await p.goto('http://app.test/#/todo'); await p.waitForSelector('.addrow input');
await p.fill('.addrow input', '우유 사기'); await p.press('.addrow input', 'Enter'); await p.waitForTimeout(300);
await p.click('.r:has-text("우유 사기") .chk'); await sync(p); await shot(p, 'v1_14_todo');
ok((await as(`select meta->>'done' d from entries where title = '우유 사기'`))[0]?.d === 'true', '할 일 추가·체크');

// 찾기
await p.goto('http://app.test/#/search?q=' + encodeURIComponent('파란')); await p.waitForSelector('.r'); await p.waitForTimeout(300);
ok((await p.textContent('.body')).includes('여권'), '찾기: 장소 글자로 찾기'); await shot(p, 'v1_15_search');

// 폴더 화면, 휴지통 → 되살리기 → 완전히 지우기
await p.goto('http://app.test/#/folder/11111111-0000-4000-8000-000000000001'); await p.waitForSelector('.r');
ok((await p.textContent('.lst-head h1')) === '회사' && (await p.$$('.r')).length === 1, '폴더 화면');
await p.click('.r'); await p.waitForSelector('.ed-body'); await p.click('[data-act=more]'); await p.click('.sheet [data-v=trash]'); await sync(p);
ok((await as(`select deleted_at is not null d from entries where title = '주말 계획'`))[0].d, '휴지통으로');
await p.goto('http://app.test/#/trash'); await p.waitForSelector('[data-restore]'); await shot(p, 'v1_16_trash');
await p.click('[data-restore]'); await sync(p); ok((await as(`select deleted_at is null d from entries where title = '주말 계획'`))[0].d, '되살리기');
const id = (await as(`select id from entries where title = '국숫집 점심'`))[0].id;
await p.evaluate(id => import('./js/data/store.js').then(m => m.trashEntry(id)), id); await p.goto('http://app.test/#/trash'); await p.waitForSelector('[data-purge]');
await p.click('[data-purge]'); await p.click('dialog .btn.danger'); await p.waitForTimeout(1600); await sync(p);
ok((await as(`select count(*)::int n from entries where id = $1`, [id]))[0].n === 0, '완전히 지우기 → 서버에서 삭제');
// 다른 기기에서 되살리고 고친 기록은, 이 기기의 오래된 휴지통 정리가 지우지 않아요
const id2 = (await as(`select id from entries where title = '주말 계획'`))[0].id;
await p.evaluate(id => import('./js/data/store.js').then(m => m.trashEntry(id)), id2); await sync(p);
await p.evaluate(() => { window.__daytale.Sync.sb = null; });   // 이 기기는 잠시 오프라인
await as(`update entries set deleted_at = null, title = '주말 계획 (다른 기기)' where id = $1`, [id2]);
await p.evaluate(id => import('./js/data/store.js').then(m => m.purgeEntries([id])), id2);
await p.reload(); await p.waitForTimeout(1500); await sync(p);
ok((await as(`select count(*)::int n from entries where id = $1 and deleted_at is null`, [id2]))[0].n === 1, '다른 기기에서 되살린 기록은 지워지지 않음');
await as(`update entries set title = '주말 계획' where id = $1`, [id2]);
await p.context().close();

// 정리형 홈 (PC)
p = await page({ width: 1440, height: 900 });
await p.addInitScript(() => { const pr = JSON.parse(localStorage.getItem('daytale.prefs') || '{}'); pr.mode = 'tidy'; localStorage.setItem('daytale.prefs', JSON.stringify(pr)); });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.tidy'); await p.waitForTimeout(500); await shot(p, 'v1_17_tidy_desktop');
ok(!(await p.$('.story')), '정리형 홈엔 이야기 없음');
await p.goto('http://app.test/#/e/' + (await as(`select id from entries where title = '주말 계획'`))[0].id); await p.waitForSelector('.ed-body'); await p.waitForTimeout(300); await shot(p, 'v1_18_editor_desktop');
await p.context().close();
await finish();
