// 이야기 문장 점검: 해가 진 뒤에도 나올 수 있는 문장에 햇빛·파란 하늘 말이 있는지, 문학 줄에 빠진 언어가 없는지.  node tools/e2e/story-audit.mjs
import { AUTHORS, CATALOGUE, PACKS, litById, litList, loadLit, pickLit, setLitPack, setLitRemote } from '../../app/js/story/lit.js';
const PK = Object.fromEntries(await Promise.all(Object.entries(PACKS).map(async ([l, f]) => [l, (await f()).default])));
const SUN = /햇살|햇빛|햇발|볕|해가 |해는|태양|파란 하늘|푸른 하늘|sunlight|sunshine|\bsun\b|blue sky|日差し|日の光|太陽|青空|青い空|\bsol\b|cielo azul|soleil|ciel bleu/i;
let bad = 0;
for (const lang of ['ko', 'en', 'ja', 'es', 'fr']) {
  const P = (await import(`../../app/js/story/${lang}.js`)).default;
  const lists = [...P.air.map(a => [a.if, a.t]), ...['greet', 'close'].flatMap(k => Object.entries(P[k]).flatMap(([tod, l]) => l.map(x => typeof x === 'string' ? [{ tod }, [x]] : [{ tod, ...x.if }, x.t])))];
  for (const [cond, t] of lists) for (const s of t) {
    const dayOnly = cond.light === true;
    if (!dayOnly && SUN.test(s)) { console.log('FAIL', lang, JSON.stringify(cond), s); bad++; }
  }
}
// 문학 목록: id 겹침 없음 · 작가·원문 언어가 있음 · 묶음마다 모든 줄이 있고 **…** 한 쌍 · 목록에 없는 id 없음
const ids = new Set();
for (const x of CATALOGUE) {
  if (ids.has(x.id)) { console.log('FAIL lit duplicate id', x.id); bad++; } ids.add(x.id);
  if (!AUTHORS[x.a] || !x.o) { console.log('FAIL lit author/origin', x.id, x.a, x.o); bad++; }
  for (const [lang, P] of Object.entries(PK)) if (!P[x.id] || (P[x.id].match(/\*\*/g) || []).length !== 2) { console.log('FAIL lit', lang, x.id); bad++; }
  const ko = PK.ko[x.id] || '';
  if (!x.sun && x.t !== 'night' && SUN.test(ko.replace(/해를 그리워/, ''))) { console.log('CHECK lit (no sun flag)', x.id, ko.slice(0, 50)); }
}
for (const [lang, P] of Object.entries(PK)) for (const id of Object.keys(P)) if (!ids.has(Number(id))) { console.log('FAIL lit', lang, 'unknown id', id); bad++; }
// 불러오기 · 서버 덧씌우기 · 없는 언어는 영어 · 묶음에 없는 줄은 건너뜀
const chk = (c, m) => { if (!c) { console.log('FAIL', m); bad++; } };
chk(await loadLit('ko') && litList('ko').length === CATALOGUE.length, 'ko 묶음 불러오기');
chk(await loadLit('de') && litList('de') === litList('en'), '묶음 없는 언어는 영어로');
setLitRemote([{ id: 9001, lang: 'ko', slot: 'lit', text: '누군가는 **새 줄**이라고 했어요.', weight: 2, cond: { a: 'someone', o: 'ko', season: 'spring', wx: 'thunder', light: true } },
  { id: 9002, lang: 'ko', slot: 'lit', text: '릴케는 **고친 줄**', cond: { id: 3 } }, { id: 9003, lang: 'ko', slot: 'air', text: '무시' }]);
const added = litById('ko', 's9001'), fixed = litById('ko', 3);
chk(litList('ko').length === CATALOGUE.length + 1, '서버 줄 하나 더해짐 (다른 자리는 무시)');
chk(added?.a === 'someone' && added.o === 'ko' && added.s === 'spring' && added.w === 'rain' && added.sun === 1 && added.weight === 2, '서버 줄 꼬리표');
chk(fixed?.text === '릴케는 **고친 줄**' && fixed.a === 'rilke', '같은 id면 글만 덮어씀 (작가 유지)');
chk(pickLit({ today: '2026-04-01', slot: 'day', season: 'spring', light: true, weather: { kind: 'rain' } }, 'ko', [], [added])?.i === 's9001', '서버 줄도 고를 수 있음');
setLitRemote([]);
// 나라 표: 남반구는 계절이 반대, 열대는 계절 없음, 표에 없는 나라는 도시 위도로, 화씨 지역
const { COUNTRIES, seasonFor, tempUnit, firstWeekday } = await import('../../app/js/core/countries.js');
const jan = new Date(2026, 0, 15);
chk(seasonFor(jan, { cc: 'KR' }) === 'winter' && seasonFor(jan, { cc: 'AU' }) === 'summer' && seasonFor(jan, { cc: 'BR' }) === 'summer', '계절: 북반구·남반구');
chk(seasonFor(jan, { cc: 'TH' }) === null && seasonFor(jan, { cc: 'ID' }) === null, '계절: 열대는 없음');
chk(seasonFor(jan, { cc: 'ZZ', lat: -34 }) === 'summer' && seasonFor(jan, { cc: 'ZZ', lat: 5 }) === null && seasonFor(jan, { cc: 'ZZ' }) === 'winter', '계절: 표에 없으면 위도');
chk(tempUnit('US') === 'F' && tempUnit('PR') === 'F' && tempUnit('GB') === 'C' && tempUnit('ZZ') === 'C', '기온 단위');
chk(firstWeekday('KR') === 0 && firstWeekday('FR') === 1, '한 주의 첫 요일');
chk(['KR', 'US', 'JP', 'ES', 'FR', 'GB', 'CA', 'AU', 'MX', 'BR', 'DE', 'TR', 'ID', 'TH', 'IN'].every(c => COUNTRIES[c]?.lang && COUNTRIES[c].city), '나라 표 기본 15개');
setLitPack('fr', { 0: PK.fr[0], 5: PK.fr[5] });
chk(litList('fr').map(x => x.id).join() === '0,5', '묶음에 없는 줄은 건너뜀');
console.log(bad ? `${bad} problems` : 'ok', `· lit ${CATALOGUE.length} · packs ${Object.keys(PK).join(' ')}`);
process.exit(bad ? 1 : 0);
