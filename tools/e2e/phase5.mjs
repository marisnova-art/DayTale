// 5단계: 설정 6묶음 · 알림 · 알림함 · 체험 안내 · 구독(Paddle 준비 전/구독 중) · 설치 안내 · 계정 삭제.
// 실행: node --experimental-strip-types phase5.mjs [스크린샷 폴더]
import { setup } from './harness.mjs';
const { db, as, page, ok, shot, finish, ANN } = await setup({ out: process.argv[2] || '.' });
const su = (sql, a = []) => db.query(sql, a).then(r => r.rows);
const wx = { kind: 'suncloud', temp: 19, max: 22, min: 14 }; let wxLat = null;
const net = async (route, u) => { if (u.pathname === '/functions/v1/weather') { wxLat = u.searchParams.get('lat'); await route.fulfill({ body: JSON.stringify(wx), contentType: 'application/json' }); return true; } return false; };
await as(`insert into entries(id, type, title, meta) values (gen_random_uuid(), 'event', '치과 예약', '{"date":"2026-10-08","time":"14:00"}'), (gen_random_uuid(), 'todo', '세금 신고', '{"date":"2026-10-08"}')`);
const settle = p => p.waitForTimeout(1600);
const dlgFill = async (p, v) => { await p.waitForSelector('dialog.dlg input'); await p.fill('dialog.dlg input', v); await p.click('dialog.dlg .btn.primary'); await p.waitForTimeout(250); };
const dlgOk = async p => { await p.waitForSelector('dialog.dlg .btn[value="1"]'); await p.click('dialog.dlg .btn[value="1"]'); await p.waitForTimeout(250); };

let p = await page({ width: 390, height: 844 }, { net });
await p.goto('http://app.test/#/settings'); await p.waitForSelector('.snav .srow');
ok((await p.$$('.snav .srow')).length === 6, '설정 6묶음');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); await shot(p, 'v1_30_settings');

// 화면
await p.click('a[href="#/settings/display"]'); await p.waitForSelector('[data-s=textSize]');
await p.click('[data-s=textSize][data-v=l]');
ok(await p.evaluate(() => document.documentElement.dataset.size === 'l'), '글자 크기 크게 → 바로 적용');
await p.click('[data-s=mode][data-v=tidy]'); await p.waitForTimeout(300); await shot(p, 'v1_31_settings_display');
await settle(p);
ok((await as(`select prefs->>'mode' m, prefs->>'textSize' s from user_settings`))[0]?.m === 'tidy', '설정이 서버에도 저장 (다른 기기와 같음)');
await p.click('[data-s=mode][data-v=story]'); await p.click('[data-s=textSize][data-v=m]');

// 기록: 기억할 날, 날씨 도시
await p.goto('http://app.test/#/settings/record'); await p.waitForSelector('[data-a=addDay]');
await p.click('[data-a=addDay]'); await dlgFill(p, '결혼기념일'); await dlgFill(p, '2019-10-08');
ok(await p.evaluate(() => window.__daytale.S.prefs.days.some(d => d.label === '결혼기념일' && d.date === '2019-10-08')), '기억할 날 추가');
await p.click('[data-a=city]'); await p.waitForSelector('.citypick input');
await p.fill('.citypick input', 'busan'); await p.waitForSelector('.citypick [data-v="KR:busan"]'); await shot(p, 'v1_32_city');
await p.click('.citypick [data-v="KR:busan"]'); await p.waitForTimeout(600);
ok(await p.evaluate(() => window.__daytale.S.prefs.city === 'KR:busan') && wxLat === '35.18', '날씨 도시 → 부산, 날씨 다시 받음');
await p.waitForTimeout(200); await shot(p, 'v1_33_settings_record');
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p');
ok(await p.$eval('.story', el => el.textContent.includes('부산')), '홈 이야기에 바뀐 도시');
ok(await p.$eval('.story', el => /결혼기념일/.test(el.textContent)), '기억할 날이 홈 이야기에 (오늘이 그날)');

// 알림
await p.context().grantPermissions(['notifications']);
await p.goto('http://app.test/#/settings/notify'); await p.waitForSelector('[data-t="notify.reminders"]');
await p.check('[data-t="notify.evening"]'); await p.waitForSelector('[data-time=eveningAt]');
const up = await p.evaluate(async () => (await import('/js/features/reminders.js')).Reminders.upcoming(24).map(x => x.key + '@' + new Date(x.at).toTimeString().slice(0, 5)));
ok(up.some(x => x.startsWith('evening@21:00')) && up.some(x => /@13:50/.test(x)) && up.some(x => /@09:00/.test(x)), '알림 예약: 일정 10분 전 · 할 일 아침 9시 · 저녁 9시');
await p.waitForTimeout(200); await shot(p, 'v1_34_settings_notify');

// 데이터
await p.goto('http://app.test/#/settings/data'); await p.waitForSelector('.usage .u');
ok((await p.$$('.usage .u')).length === 3, '사용량: 기록 · 사진 · 폴더');
await p.waitForTimeout(200); await shot(p, 'v1_35_settings_data');

// 정보 · 라이선스 · 설치 안내
await p.goto('http://app.test/#/settings/info'); await p.waitForSelector('.sabout');
ok(await p.$eval('.sgroup', el => el.innerHTML.includes('met.no')), '정보: MET Norway 출처');
await p.click('[data-a=licenses]'); await p.waitForSelector('.sheet.open');
ok((await p.$$('.sheet .srow')).length === 6, '오픈소스 라이선스 6개'); await p.waitForTimeout(300); await shot(p, 'v1_36_licenses');
await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelector('.sheet-scrim')?.click()); await p.waitForTimeout(400);
await p.click('[data-a=install]'); await p.waitForSelector('.sheet.open .inst');
ok((await p.$$('.inst .steps li')).length >= 2, '설치 안내 단계'); await p.waitForTimeout(300); await shot(p, 'v1_37_install');
await p.evaluate(() => document.querySelector('.sheet-scrim')?.click()); await p.waitForTimeout(400);

// 계정: 이름 · 초대 코드
await p.goto('http://app.test/#/settings/account'); await p.waitForSelector('.sprof');
await p.click('[data-a=name]'); await dlgFill(p, '바다별님');
ok((await as(`select display_name n from profiles`))[0].n === '바다별님', '이름 바꾸기 → 서버');
ok(await p.$eval('.sgroup', el => /[0-9a-f]{8}/.test(el.textContent)), '내 초대 코드 보임');
await p.waitForTimeout(200); await shot(p, 'v1_38_settings_account');

// 알림함: 모두에게 공지 + 나에게 체험 안내
await su(`insert into notices(user_id, kind, lang, title, body) values (null, 'announce', 'ko', '사진을 넣을 수 있어요', '기록마다 4장까지 넣을 수 있어요.'), ($1, 'trial_7d', 'ko', '무료 체험이 7일 남았어요', '구독하면 계속 쓸 수 있어요. 기록은 그대로 남아요.')`, [ANN]);
await p.goto('http://app.test/#/home'); await p.reload(); await p.waitForSelector('.story p');
await p.waitForFunction(() => document.documentElement.classList.contains('has-unread'), null, { timeout: 5000 }).catch(() => {});
ok(await p.evaluate(() => document.documentElement.classList.contains('has-unread')), '새 알림 → 종에 점');
await p.click('.topcap .bell'); await p.waitForSelector('.ntc .nt');
ok((await p.$$('.ntc .nt')).length === 2, '알림함 2개'); await p.waitForTimeout(300); await shot(p, 'v1_39_notices');
await p.waitForTimeout(500);
ok((await as(`select count(*)::int n from notices where user_id is not null and read_at is not null`))[0].n === 1, '읽음 표시 저장');
ok(!(await p.evaluate(() => document.documentElement.classList.contains('has-unread'))), '읽으면 점이 사라짐');

// 구독: 결제 준비 전 (가격 표시 · 버튼은 안내)
await p.goto('http://app.test/#/plans'); await p.waitForSelector('.popt');
ok(await p.$eval('.popt.on', el => el.dataset.plan === 'yearly' && el.textContent.includes('$39.90')), '연간이 기본, $39.90');
ok(await p.$eval('.popt[data-plan=monthly]', el => el.textContent.includes('$3.99')) && await p.$eval('.popt.on em', el => /17%/.test(el.textContent)), '월간 $3.99 · 연간 17% 절약');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); await shot(p, 'v1_40_plans');
await p.click('[data-buy]'); await p.waitForSelector('.toast:has-text("결제 준비 중")', { timeout: 3000 }).then(() => ok(true, 'Paddle 키 없으면 결제 대신 안내')).catch(() => ok(false, 'Paddle 키 없으면 결제 대신 안내'));
// 웹훅이 구독을 썼다고 치고 다시 확인
await su(`insert into subscriptions(subscription_id, user_id, status, plan, currency, amount, current_period_end, update_payment_url, cancel_url) values ('sub_1', $1, 'active', 'yearly', 'USD', 39.9, now() + interval '1 year', 'https://sandbox-pay/u', 'https://sandbox-pay/c')`, [ANN]);
await p.reload(); await p.waitForSelector('.pstat.on', { timeout: 6000 }).catch(() => {});
ok(await p.$eval('.pstat', el => el.classList.contains('on') && el.textContent.includes('연간 구독 중')), '구독 중 → 연간 표시');
ok((await p.$$('.pbody .scard .srow')).length === 3, '구독 관리: 결제 수단 · 해지 · 다시 확인');
await p.waitForTimeout(300); await shot(p, 'v1_41_plans_active');

// 계정 삭제: 구독 중이면 먼저 해지 안내
await p.goto('http://app.test/#/settings/data'); await p.waitForSelector('[data-a=deleteAccount]');
await p.click('[data-a=deleteAccount]');
await p.waitForSelector('.toast:has-text("구독을 먼저 해지")', { timeout: 3000 }).then(() => ok(true, '구독 중엔 계정 삭제 전에 해지 안내')).catch(() => ok(false, '구독 중엔 계정 삭제 전에 해지 안내'));
await p.context().close();

// PC 설정 · 구독
p = await page({ width: 1440, height: 900 }, { net });
await p.goto('http://app.test/#/settings'); await p.waitForSelector('.sgroup .sprof');
ok(await p.$eval('.snav', el => getComputedStyle(el).display !== 'none'), 'PC: 왼쪽 목록 + 오른쪽 내용');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400); await shot(p, 'v1_42_pc_settings');
await p.click('a[href="#/settings/display"]'); await p.waitForSelector('[data-s=textSize]'); await p.waitForTimeout(300); await shot(p, 'v1_43_pc_settings_display');
await p.context().close();

// 체험 끝나기 5일 전 → 한 번 알림, 해지 후 계정 삭제
await su(`update subscriptions set status = 'canceled', cancel_at = now()`); await su(`update profiles set trial_ends_at = now() + interval '5 days'`);
p = await page({ width: 390, height: 844 }, { net });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p');
await p.waitForSelector('.toast:has-text("남았어요. 구독하면")', { timeout: 5000 }).then(() => ok(true, '체험 끝나기 며칠 전 안내 (한 번)')).catch(() => ok(false, '체험 끝나기 며칠 전 안내 (한 번)'));
await p.goto('http://app.test/#/settings/data'); await p.waitForSelector('[data-a=deleteAccount]');
await p.click('[data-a=deleteAccount]'); await dlgOk(p); await dlgFill(p, '삭제');
await p.waitForTimeout(1500); await p.waitForSelector('#auth:not([hidden]) .auth', { timeout: 8000 }).catch(() => {});
ok((await su(`select count(*)::int n from auth.users where id = $1`, [ANN]))[0].n === 0, '계정 삭제 → 서버에서 사라짐');
ok(await p.evaluate(() => !!document.querySelector('#auth:not([hidden]) .auth')), '삭제 후 로그인 화면');
await shot(p, 'v1_44_after_delete');
await finish();
