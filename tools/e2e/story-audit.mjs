// 이야기 문장 점검: 해가 진 뒤에도 나올 수 있는 문장에 햇빛·파란 하늘 말이 있는지, 문학 줄에 빠진 언어가 없는지.  node tools/e2e/story-audit.mjs
import { LIT } from '../../app/js/story/lit.js';
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
for (const x of LIT) {
  for (const lang of ['ko', 'en', 'ja', 'es', 'fr']) if (!x[lang] || (x[lang].match(/\*\*/g) || []).length !== 2) { console.log('FAIL lit', lang, x.ko.slice(0, 30)); bad++; }
  if (!x.sun && x.t !== 'night' && SUN.test(x.ko.replace(/해를 그리워/, ''))) { console.log('CHECK lit (no sun flag)', x.ko.slice(0, 50)); }
}
console.log(bad ? `${bad} problems` : 'ok', `· lit ${LIT.length}`);
process.exit(bad ? 1 : 0);
