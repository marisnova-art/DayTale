// 7단계: 영어·일본어·스페인어·프랑스어 화면 (번역 빠짐 · 화면 넘침 · 이야기 문장)
// 실행: node --experimental-strip-types phase7.mjs [스크린샷 폴더]
import { setup } from './harness.mjs';
const { as, page, ok, shot, finish } = await setup({ out: process.argv[2] || '.' });
const net = async (route, u) => { if (u.pathname === '/functions/v1/weather') { await route.fulfill({ body: JSON.stringify({ kind: 'rain', temp: 12, max: 14, min: 9 }), contentType: 'application/json' }); return true; } return false; };
await as(`insert into entries(id, type, title, meta) values (gen_random_uuid(), 'event', 'Dentist', '{"date":"2026-10-08","time":"14:00"}'), (gen_random_uuid(), 'todo', 'Taxes', '{"date":"2026-10-08"}'), (gen_random_uuid(), 'note', 'Walk', '{}')`);
const RAW = /\b(common|nav|type|trial|sync|err|auth|home|list|todo|ed|tpl|folder|cal|photo|bk|set|lang|inst|notify|notice|plan|sub|time|w)\.[a-zA-Z]+/;
const L = [['en', 'en-US', 'America/New_York', 'New York'], ['ja', 'ja-JP', 'Asia/Tokyo', '東京|Tokyo'], ['es', 'es-ES', 'Europe/Madrid', 'Madrid'], ['fr', 'fr-FR', 'Europe/Paris', 'Paris']];
for (const [l, locale, timezoneId, city] of L) {
  const p = await page({ width: 390, height: 844 }, { net, locale, timezoneId });
  const check = async (where) => {
    const txt = await p.evaluate(() => document.body.innerText);
    const raw = txt.match(RAW); ok(!raw, `${l} ${where}: 번역 빠짐 없음${raw ? ' → ' + raw[0] : ''}`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${l} ${where}: 가로 넘침 없음`);
  };
  await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.waitForTimeout(800);
  ok(await p.evaluate(() => document.documentElement.lang) === l, `${l}: 기기 언어를 따라감`);
  const story = await p.$eval('.story', el => el.innerText);
  ok(new RegExp(city).test(story), `${l}: 이야기에 도시 날씨`);
  ok(!/[가-힣]/.test(story.replace('바다별', '')), `${l}: 이야기에 한국어 섞임 없음`);
  await check('홈'); await p.evaluate(() => document.fonts.ready); await shot(p, `v1_50_${l}_home`);
  await p.goto('http://app.test/#/settings/display'); await p.waitForSelector('[data-s=textSize]'); await p.waitForTimeout(300); await check('설정'); await shot(p, `v1_51_${l}_settings`);
  await p.goto('http://app.test/#/plans'); await p.waitForSelector('.popt'); await p.waitForTimeout(300); await check('구독'); await shot(p, `v1_52_${l}_plans`);
  await p.goto('http://app.test/#/calendar'); await p.waitForTimeout(600); await check('캘린더');
  await p.goto('http://app.test/#/all'); await p.waitForTimeout(400); await check('목록');
  await p.context().close();
}
// 언어 직접 바꾸기: 설정 > 화면 > 언어
let p = await page({ width: 390, height: 844 }, { net });
await p.goto('http://app.test/#/settings/display'); await p.waitForSelector('[data-s=lang]');
await p.click('[data-s=lang][data-v=ja]'); await p.waitForTimeout(500);
ok(await p.evaluate(() => document.documentElement.lang === 'ja'), '설정에서 일본어로 바꾸면 바로 적용');
await shot(p, 'v1_53_lang_switch');
await p.click('[data-s=lang][data-v=""]'); await p.context().close();
// PC 영어 홈
p = await page({ width: 1440, height: 900 }, { net, locale: 'en-US', timezoneId: 'America/New_York' });
await p.goto('http://app.test/#/home'); await p.waitForSelector('.story p'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800); await shot(p, 'v1_54_en_pc_home');
await finish();
