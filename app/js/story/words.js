/* 힘이 되는 한 마디: 홈 인사 아래 짧은 문장 하나 (앤드류 결정 2026-10-15)
   날마다 70%는 이 응원 명언, 30%는 예전처럼 이야기 속 문학 줄(lit.js)이에요. 명언은 가르치는 말처럼 들리지 않게
   say(누가 어떤 때에 한 말인지)로 먼저 들려주고 굵은 원문을 이어요. 저작권이 끝난 글만, 종교적인 글·출처가 불분명한 말은 넣지 않아요.
   하루에 하나, 14일 안에는 같은 문장이 다시 나오지 않고, 최근 3일 안에 나온 작가는 쉬어요.
   a: 작가 (같은 작가 쉬기에 써요) / o: 원문 나라 ('world' 세계 고전)
   언어 묶음이 없으면 홈은 예전처럼 이야기 속 문학 줄을 보여 줘요 */
import { addDays, dayKey } from '../core/utils.js';

const PACKS = {
  ko: [
    { id: 'c1', k: 'c', a: 'vangogh', o: 'world', q: '무언가 해 볼 용기가 없다면, 삶은 어떻게 될까?', by: '빈센트 반 고흐', src: '테오에게 보낸 편지', say: '반 고흐는 동생 테오에게 보낸 편지에서 이렇게 물었어요.' },
    { id: 'c2', k: 'c', a: 'montgomery', o: 'world', q: '알아낼 것이 이렇게나 많다니, 정말 멋지지 않아요?', by: '루시 모드 몽고메리', src: '『빨강 머리 앤』', say: '앤은 처음 초록 지붕 집으로 가는 마차에서 들뜬 목소리로 이렇게 말했어요.' },
    { id: 'c3', k: 'c', a: 'xunzi', o: 'world', q: '반 걸음이 쌓이지 않으면 천 리에 이를 수 없다.', by: '순자', src: '「권학」', say: '순자는 배움에 대해 쓰면서, 작은 걸음이 쌓이는 힘을 이렇게 적었어요.' },
    { id: 'c4', k: 'c', a: 'thoreau', o: 'world', q: '사물은 변하지 않는다. 우리가 변할 뿐이다.', by: '헨리 데이비드 소로', src: '『월든』', say: '소로는 『월든』 끝자락에 이렇게 적었어요.' },
    { id: 'c5', k: 'c', a: 'zhuangzi', o: 'world', q: '물이 깊지 않으면 큰 배를 띄울 힘이 없다.', by: '장자', src: '「소요유」', say: '장자는 하늘 높이 나는 큰 새 이야기를 하며, 무엇이든 넉넉히 쌓여야 멀리 간다고 했어요.' },
    { id: 'c6', k: 'c', a: 'seneca', o: 'world', q: '오늘 할 일을 붙잡으면, 내일에 덜 기대게 된다.', by: '세네카', src: '『루킬리우스에게 보내는 편지』', say: '세네카는 친구에게 시간을 아껴 쓰자는 편지를 보내며 이렇게 썼어요.' },
    { id: 'c7', k: 'c', a: 'seneca', o: 'world', q: '사람이 있는 곳이라면 어디든 친절을 베풀 기회가 있다.', by: '세네카', src: '『행복한 삶에 대하여』', say: '세네카는 좋은 삶이 무엇인지 이야기하며 이렇게 덧붙였어요.' },
    { id: 'c8', k: 'c', a: 'aurelius', o: 'world', q: '행복한 삶에 필요한 것은 아주 적다.', by: '마르쿠스 아우렐리우스', src: '『명상록』', say: '로마의 황제 마르쿠스 아우렐리우스는 전쟁터에서 쓴 일기에 이렇게 남겼어요.' },
    { id: 'c9', k: 'c', a: 'aurelius', o: 'world', q: '마음은 자주 하는 생각의 빛깔로 물든다.', by: '마르쿠스 아우렐리우스', src: '『명상록』', say: '마르쿠스 아우렐리우스는 마음을 돌보는 법을 적으며 이렇게 썼어요.' },
    { id: 'c10', k: 'c', a: 'epictetus', o: 'world', q: '사람을 괴롭히는 것은 일 그 자체가 아니라, 그 일을 바라보는 생각이다.', by: '에픽테토스', src: '『엥케이리디온』', say: '노예로 태어나 철학자가 된 에픽테토스는 이렇게 말했어요.' },
    { id: 'c11', k: 'c', a: 'montaigne', o: 'world', q: '세상에서 가장 큰 일은 스스로에게 속할 줄 아는 것이다.', by: '몽테뉴', src: '『수상록』', say: '몽테뉴는 성탑 서재에서 자기 자신을 글로 적으며 이렇게 말했어요.' },
    { id: 'c12', k: 'c', a: 'emerson', o: 'world', q: '날마다 오늘이 한 해의 가장 좋은 날이라고 마음에 새겨라.', by: '랠프 월도 에머슨', src: '「일과 날」', say: '에머슨은 하루하루를 귀하게 여기자며 이렇게 썼어요.' },
    { id: 'c13', k: 'c', a: 'emerson', o: 'world', q: '하루를 마쳤으면 그것으로 끝이다. 할 수 있는 만큼 했으니까.', by: '랠프 월도 에머슨', src: '딸에게 보낸 편지', say: '에머슨은 하루를 마치고 마음이 무거운 딸에게 이런 편지를 보냈어요.' },
    { id: 'c14', k: 'c', a: 'thoreau', o: 'world', q: '꿈을 향해 자신 있게 나아가면, 생각지 못한 때에 성공을 만난다.', by: '헨리 데이비드 소로', src: '『월든』', say: '소로는 숲속 오두막에서 2년을 지낸 뒤 이렇게 적었어요.' },
    { id: 'c15', k: 'c', a: 'thoreau', o: 'world', q: '아침마다 삶을 단순하게 살아 보라는 즐거운 초대를 받았다.', by: '헨리 데이비드 소로', src: '『월든』', say: '소로는 호숫가에서 맞던 아침을 떠올리며 이렇게 썼어요.' },
    { id: 'c16', k: 'c', a: 'franklin', o: 'world', q: '잘 말한 것보다 잘 해낸 것이 낫다.', by: '벤저민 프랭클린', src: '『가난한 리처드의 달력』', say: '벤저민 프랭클린은 해마다 펴낸 달력 한쪽에 이런 말을 적어 두었어요.' },
    { id: 'c17', k: 'c', a: 'vangogh', o: 'world', q: '큰일은 작은 일들이 모여서 이루어진다.', by: '빈센트 반 고흐', src: '테오에게 보낸 편지', say: '반 고흐는 그림이 잘 풀리지 않던 시절, 동생 테오에게 이렇게 썼어요.' },
    { id: 'c18', k: 'c', a: 'alcott', o: 'world', q: '폭풍은 두렵지 않아요. 배를 모는 법을 배우고 있으니까요.', by: '루이자 메이 올컷', src: '『작은 아씨들』', say: '『작은 아씨들』의 막내 에이미는 이렇게 말했어요.' },
    { id: 'c19', k: 'c', a: 'montgomery', o: 'world', q: '내일은 아직 아무 실수도 없는 새날이에요.', by: '루시 모드 몽고메리', src: '『빨강 머리 앤』', say: '앤은 실수투성이 하루를 보낸 저녁, 마릴라에게 이렇게 말했어요.' },
    { id: 'c20', k: 'c', a: 'montgomery', o: 'world', q: '정다운 세상아, 너는 참 아름답구나. 네 안에 살아 있어서 기뻐.', by: '루시 모드 몽고메리', src: '『빨강 머리 앤』', say: '앤은 세상을 바라보며 이렇게 속삭였어요.' },
  ],
  // 영어: 영어로 쓴 글은 원문 그대로, 옛 번역은 저작권이 끝난 번역(Long, Gummere 등)이나 직접 옮긴 말
  en: [
    { id: "c1", k: 'c', a: "vangogh", o: "world", q: "What would life be if we had no courage to attempt anything?", by: "Vincent van Gogh", src: "letter to Theo", say: "In a letter to his brother Theo, Van Gogh once asked:" },
    { id: "c2", k: 'c', a: "montgomery", o: "world", q: "Isn’t it splendid to think of all the things there are to find out about?", by: "L. M. Montgomery", src: "Anne of Green Gables", say: "On her first ride to Green Gables, Anne could hardly sit still:" },
    { id: "c3", k: 'c', a: "xunzi", o: "world", q: "Without piling up half-steps, no one ever reaches a thousand miles.", by: "Xunzi", src: "Encouraging Learning", say: "Writing about learning, the Chinese thinker Xunzi noticed how small steps add up:" },
    { id: "c4", k: 'c', a: "thoreau", o: "world", q: "Things do not change; we change.", by: "Henry David Thoreau", src: "Walden", say: "Near the end of Walden, Thoreau wrote:" },
    { id: "c5", k: 'c', a: "zhuangzi", o: "world", q: "If the water is not deep enough, it has no strength to carry a great boat.", by: "Zhuangzi", src: "Free and Easy Wandering", say: "Telling the story of a giant bird, Zhuangzi said that anything that goes far needs depth first:" },
    { id: "c6", k: 'c', a: "seneca", o: "world", q: "Lay hold of today’s task, and you will not need to depend so much upon tomorrow’s.", by: "Seneca", src: "Letters to Lucilius", say: "Seneca urged a friend not to waste his time, writing:" },
    { id: "c7", k: 'c', a: "seneca", o: "world", q: "Wherever there is a human being, there is an opportunity for a kindness.", by: "Seneca", src: "On the Happy Life", say: "Thinking about what makes a good life, Seneca added:" },
    { id: "c8", k: 'c', a: "aurelius", o: "world", q: "Very little indeed is necessary for living a happy life.", by: "Marcus Aurelius", src: "Meditations", say: "In the private notebook he kept on campaign, the emperor Marcus Aurelius wrote:" },
    { id: "c9", k: 'c', a: "aurelius", o: "world", q: "The soul is dyed by the thoughts.", by: "Marcus Aurelius", src: "Meditations", say: "Marcus Aurelius, writing about how to care for the mind, put it simply:" },
    { id: "c10", k: 'c', a: "epictetus", o: "world", q: "People are disturbed not by things, but by the views they take of them.", by: "Epictetus", src: "Enchiridion", say: "Epictetus, born a slave and later a teacher of philosophy, said:" },
    { id: "c11", k: 'c', a: "montaigne", o: "world", q: "The greatest thing in the world is to know how to belong to oneself.", by: "Michel de Montaigne", src: "Essays", say: "From his library in a castle tower, Montaigne wrote:" },
    { id: "c12", k: 'c', a: "emerson", o: "world", q: "Write it on your heart that every day is the best day in the year.", by: "Ralph Waldo Emerson", src: "Works and Days", say: "Emerson, who believed each ordinary day was worth noticing, wrote:" },
    { id: "c13", k: 'c', a: "emerson", o: "world", q: "Finish each day and be done with it. You have done what you could.", by: "Ralph Waldo Emerson", src: "letter to his daughter", say: "When his daughter felt weighed down at the end of a day, Emerson wrote to her:" },
    { id: "c14", k: 'c', a: "thoreau", o: "world", q: "If one advances confidently in the direction of his dreams, he will meet with a success unexpected in common hours.", by: "Henry David Thoreau", src: "Walden", say: "After two years in a cabin by Walden Pond, Thoreau wrote:" },
    { id: "c15", k: 'c', a: "thoreau", o: "world", q: "Every morning was a cheerful invitation to make my life of equal simplicity with Nature herself.", by: "Henry David Thoreau", src: "Walden", say: "Remembering his mornings by the pond, Thoreau wrote:" },
    { id: "c16", k: 'c', a: "franklin", o: "world", q: "Well done is better than well said.", by: "Benjamin Franklin", src: "Poor Richard’s Almanack", say: "Benjamin Franklin tucked this line into one of his yearly almanacs:" },
    { id: "c17", k: 'c', a: "vangogh", o: "world", q: "Great things are done by a series of small things brought together.", by: "Vincent van Gogh", src: "letter to Theo", say: "In a stretch when painting wasn’t going well, Van Gogh wrote to Theo:" },
    { id: "c18", k: 'c', a: "alcott", o: "world", q: "I’m not afraid of storms, for I’m learning how to sail my ship.", by: "Louisa May Alcott", src: "Little Women", say: "In Little Women, the youngest sister, Amy, said:" },
    { id: "c19", k: 'c', a: "montgomery", o: "world", q: "Isn’t it nice to think that tomorrow is a new day with no mistakes in it yet?", by: "L. M. Montgomery", src: "Anne of Green Gables", say: "After a day full of mistakes, Anne said to Marilla:" },
    { id: "c20", k: 'c', a: "montgomery", o: "world", q: "Dear old world, you are very lovely, and I am glad to be alive in you.", by: "L. M. Montgomery", src: "Anne of Green Gables", say: "Looking out at the world, Anne whispered:" },
  ]
};

const LOG = 'daytale.word';
const read = () => { try { return JSON.parse(localStorage.getItem(LOG) || '{}'); } catch { return {}; } };
const write = v => { try { localStorage.setItem(LOG, JSON.stringify(v)); } catch {} };
/* 서버 주간 묶음(phrase_packs, slot 'word')을 앱 안 명언에 더해요. cond.id 가 앱 안 번호(c1…)면 그 명언을 고쳐요.
   cond: a 작가 · o 원문 · by 이름 · src 출처 · say 들려주는 말 · season. 글(text)이 명언 원문이에요 */
let remote = {}, merged = {};
function setWordsRemote(rows = []) {
  remote = {}; merged = {};
  for (const r of rows) {
    if (r?.slot !== 'word' || !r.text || !r.cond?.by) continue;
    const c = r.cond;
    (remote[r.lang] ||= []).push({ id: c.id || 's' + r.id, k: 'c', a: c.a || c.by, o: c.o || 'world', q: r.text, by: c.by, src: c.src || '', say: c.say || '', ...(c.season ? { season: c.season } : {}) });
  }
}
function list(lang) {
  if (merged[lang]) return merged[lang];
  const mine = remote[lang] || [], over = new Map(mine.map(x => [x.id, x]));
  const out = (PACKS[lang] || []).map(x => over.get(x.id) || x), have = new Set(out.map(x => x.id));
  return (merged[lang] = [...out, ...mine.filter(x => !have.has(x.id))]);
}
const hasWords = lang => list(lang).length > 0;
const wordById = (lang, id) => list(lang).find(x => x.id === id) || null;

/** 오늘이 명언 날인지 (날짜로 정해져서 하루 내내 같아요): 정확히 70% */
function wordDay(ctx) { const n = Math.round(Date.parse(ctx.today + 'T00:00:00Z') / 864e5); return (n * 7) % 10 >= 3; }   // 열흘에 사흘은 문학 줄, 고르게 섞여요

/** 오늘의 한 마디. ctx: { today, now, season, slot } */
function todayWord(ctx, lang) {
  const all = list(lang); if (!all.length) return null;
  const cut = dayKey(addDays(ctx.now, -14));
  const log = Object.fromEntries(Object.entries(read()).filter(([k]) => k >= cut));
  const got = log[ctx.today] && wordById(lang, log[ctx.today]);
  if (got) return got;
  const days = Object.keys(log).sort(), seen = days.map(d => log[d]);
  const recentA = new Set(days.filter(d => d >= dayKey(addDays(ctx.now, -3))).map(d => wordById(lang, log[d])?.a).filter(Boolean));
  const fits = all.filter(x => (!x.season || x.season === ctx.season));
  const unseen = fits.filter(x => !seen.includes(x.id)), fresh = unseen.filter(x => !recentA.has(x.a));
  const pool = fresh.length ? fresh : unseen.length ? unseen : fits;
  let h = 0; for (const c of ctx.today + lang) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
  const pick = pool[(h >>> 8) % pool.length];
  log[ctx.today] = pick.id; write(log);
  return pick;
}

export { PACKS as WORD_PACKS, hasWords, setWordsRemote, todayWord, wordById, wordDay };
