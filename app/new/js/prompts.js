// 빈 카드의 흐린 예시 글: 10번 중 7번은 쓰기를 여는 질문, 3번은 모아 둔 문장 (지금 앱 홈과 같은 7:3)
// 질문은 지금 앱 홈 질문(story/questions.js)에서 할 일 · 일정에 묶인 것만 뺐어요. 문장은 지금 앱 데이터를 그대로 읽어요
// (힘이 되는 한 마디 words.js + 문학 구절 lit/ko.js의 굵은 부분). 14일 안에는 같은 글이 다시 나오지 않아요
// 디자인 포맷은 디자인에 맞춘 예시가 정해져 있어서 쓰지 않아요
import { WORD_PACKS } from '../../js/story/words.js';
import { CATALOGUE } from '../../js/story/lit/catalogue.js';
import LIT from '../../js/story/lit/ko.js';

const Q = {
  morning: { base: ['오늘은 어떤 하루를 보내고 싶나요?', '오늘 꼭 챙길 한 가지는 무엇인가요?', '눈뜨자마자 떠오른 생각이 있나요?', '오늘 기대되는 일이 있나요?', '어젯밤 잠은 잘 잤나요?'],
    dow1: ['한 주의 시작이에요. 이번 주에 해내고 싶은 건요?'], dow5: ['금요일 아침이에요. 이번 주 남은 일은 무엇인가요?'], weekend: ['여유로운 주말 아침이에요. 오늘은 무엇을 하고 싶나요?'] },
  day: { base: ['지금 떠오른 걸 적어 둘까요?', '점심은 무엇을 먹었나요?', '오전에 있었던 일 중 기억할 만한 게 있나요?', '잊기 전에 적어 둘 게 있나요?', '오후에 남은 일은 무엇인가요?'] },
  evening: { base: ['오늘은 어떤 하루였나요?', '오늘 가장 좋았던 순간은 언제였나요?', '오늘 누구와 이야기를 나눴나요?', '오늘 새로 알게 된 게 있나요?', '오늘 하루를 한 줄로 남긴다면요?'],
    dow1: ['월요일을 잘 넘겼어요. 어땠나요?'], dow5: ['한 주를 마무리하는 금요일이에요. 이번 주는 어땠나요?'], weekend: ['주말 저녁이에요. 오늘 쉰 만큼 무엇이 채워졌나요?'] },
  night: { base: ['자기 전에 남기고 싶은 말이 있나요?', '오늘 마음에 남은 장면은 무엇인가요?', '오늘 고마웠던 사람이 있나요?', '내일의 나에게 남길 말이 있나요?', '오늘 하루, 몇 점이었나요?'],
    monthEnd: ['한 달이 끝나 가요. 이번 달 가장 기억에 남는 일은요?'] },
};
const slotOf = h => h >= 5 && h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
const seasonOf = m => [11, 0, 1].includes(m) ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';

// 문학 구절: "릴케는 … **굵은 부분** …라고 썼어요" → 굵은 부분만, 작가는 맨 앞 이름. 카드에 맞게 짧은 것만
const LINES = CATALOGUE.map(r => {
  const s = LIT[r.id]; if (!s) return null;
  const q = s.match(/\*\*(.+?)\*\*/)?.[1], by = s.match(/^(.+?)[은는] /)?.[1];
  if (!q || !by || q.length < 10 || q.length > 60 || /[「『]/.test(by)) return null;
  return { k: 'l' + r.id, q, by, s: r.s, t: r.t, sun: r.sun };
}).filter(Boolean);
const WORDS = (WORD_PACKS.ko || []).filter(w => w.q.length <= 60).map(w => ({ k: 'w' + w.id, q: w.q, by: w.by }));

const LOG = 'dz.exhist';
const read = () => { try { return JSON.parse(localStorage.getItem(LOG) || '[]'); } catch { return []; } };
const pick = (list, used) => { const fresh = list.filter(x => !used.has(x.k ?? x)); const from = fresh.length ? fresh : list; return from[Math.floor(Math.random() * from.length)]; };

// { t: 예시 글, by: 작가(문장일 때만) }
export function exampleText(now = new Date()) {
  const slot = slotOf(now.getHours()), B = Q[slot], dow = now.getDay(), day = now.toISOString().slice(0, 10);
  const hist = read().filter(h => h.d >= new Date(now - 14 * 864e5).toISOString().slice(0, 10)), used = new Set(hist.map(h => h.k));
  let out;
  if (Math.random() < .3) {
    const season = seasonOf(now.getMonth()), lit = LINES.filter(l => (!l.s || l.s === season) && (!l.t || [].concat(l.t).includes(slot) || (slot === 'evening' && [].concat(l.t).includes('night'))) && !(l.sun && slot !== 'morning' && slot !== 'day'));
    const x = pick(Math.random() < .5 ? WORDS : lit.length ? lit : WORDS, used);
    out = { k: x.k, t: x.q, by: x.by };
  } else {
    const groups = [];
    if (B.monthEnd && new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() <= 2) groups.push(B.monthEnd);
    if (dow === 1 && B.dow1) groups.push(B.dow1); if (dow === 5 && B.dow5) groups.push(B.dow5); if ((dow === 0 || dow === 6) && B.weekend) groups.push(B.weekend);
    groups.push(B.base);
    let q = null;
    for (const g of groups) { const f = g.filter(x => !used.has(x)); if (f.length) { q = f[Math.floor(Math.random() * f.length)]; break; } }
    q ||= pick(B.base, new Set());
    out = { k: q, t: q };
  }
  try { localStorage.setItem(LOG, JSON.stringify([...hist, { k: out.k, d: day }].slice(-80))); } catch {}
  return out.by ? { t: out.t, by: out.by } : { t: out.t };
}

// 문장 넣기 (11-04): 글 없이 올리고 싶을 때. 모아 둔 문장(힘이 되는 한 마디 + 문학 구절)에서 하나씩, 14일 안에는 겹치지 않게
export function quoteText(now = new Date()) {
  const day = now.toISOString().slice(0, 10), hist = read().filter(h => h.d >= new Date(now - 14 * 864e5).toISOString().slice(0, 10));
  const x = pick([...WORDS, ...LINES], new Set(hist.map(h => h.k)));
  try { localStorage.setItem(LOG, JSON.stringify([...hist, { k: x.k, d: day }].slice(-80))); } catch {}
  return { t: x.q, by: x.by };
}

// 11-13 쓰기 탭 '오늘의 질문' (앤드류: 늘 두 줄, 적당히 길게). 질문마다 줄 바꿈 자리(\n)를 정해 둬요
// 시간대(아침 5–11 · 낮 11–17 · 저녁 17–21 · 밤) 14개 + 계절 2개 (+ 주말 4개). 날마다 하나씩 차례로 → 14일 안에는 같은 질문이 다시 안 나와요
const DQ = {
  morning: ['오늘 아침, 가장 먼저\n떠오른 얼굴은 누구인가요?', '눈을 뜨고 처음 본\n풍경을 적어 볼까요?', '오늘 하루가 끝날 때\n어떤 기분이면 좋을까요?', '어젯밤 꿈에서 기억나는\n장면이 있나요?',
    '오늘 아침 공기에서는\n어떤 냄새가 났나요?', '오늘 꼭 듣고 싶은\n한마디가 있다면요?', '아침에 마신 첫 모금은\n무엇이었나요?', '오늘 나에게 해 주고 싶은\n한마디가 있나요?',
    '창밖의 하늘은 오늘\n어떤 색으로 시작했나요?', '오늘 기대되는 일을\n하나만 골라 볼까요?', '오늘 고른 옷에는\n어떤 기분이 담겼나요?', '아침 길에서 눈에 띈\n작은 것이 있었나요?',
    '오늘의 나에게 작은\n약속을 하나 해 볼까요?', '잠에서 깨어난 순간의\n기분은 어땠나요?'],
  day: ['오늘 하루 중 가장\n오래 머문 장면은 뭐였나요?', '점심에 먹은 것 중\n기억하고 싶은 맛이 있나요?', '지금 내 곁에 있는\n물건 하나를 적어 볼까요?', '오늘 들은 말 중에\n마음에 남은 게 있나요?',
    '지금 창밖의 하늘은\n어떤 모습인가요?', '오늘 처음 해 본 일이\n하나라도 있었나요?', '오후의 햇빛이 닿은 곳을\n적어 볼까요?', '방금 나를 웃게 만든\n일이 있었나요?',
    '지금 이 순간 들리는\n소리를 적어 볼까요?', '오늘 누군가에게\n고마웠던 순간이 있나요?', '잠깐 멈춰서 바라본\n풍경이 있었나요?', '지금 가장 하고 싶은 일은\n무엇인가요?',
    '오늘 발견한 작은 기쁨을\n적어 둘까요?', '요즘 자주 듣는 노래에\n어떤 장면이 떠오르나요?'],
  evening: ['오늘 하루를 한 장면으로\n남긴다면 어떤 모습일까요?', '돌아오는 길에 본\n하늘은 어땠나요?', '오늘 가장 잘한 일을\n하나 적어 볼까요?', '저녁으로 먹은 것과\n그때의 기분은 어땠나요?',
    '오늘 만난 사람 중\n떠오르는 얼굴이 있나요?', '오늘 아쉬웠던 순간을\n가볍게 적어 둘까요?', '노을이 지는 동안\n무엇을 하고 있었나요?', '오늘 나를 웃게 한\n사람은 누구였나요?',
    '하루 중 가장 편안했던\n시간은 언제였나요?', '오늘 새로 알게 된 것을\n하나 적어 볼까요?', '집에 돌아와 가장 먼저\n한 일은 무엇인가요?', '오늘의 나에게 점수를\n준다면 몇 점일까요?',
    '오늘 들은 소리 중\n기억에 남는 게 있나요?', '내일의 나에게\n전하고 싶은 말이 있나요?'],
  night: ['잠들기 전, 오늘을\n한 문장으로 적어 볼까요?', '오늘 가장 고마웠던\n순간은 언제였나요?', '지금 떠오르는 사람에게\n하고 싶은 말이 있나요?', '오늘 밤 창밖은\n어떤 모습인가요?',
    '오늘 내 마음이 머문\n곳은 어디였나요?', '오늘 하루의 나를\n토닥여 줄 한마디는요?', '잠들기 전 들리는\n소리를 적어 볼까요?', '오늘을 색으로 칠한다면\n어떤 색일까요?',
    '내일 아침 눈뜨면 가장\n먼저 하고 싶은 일은요?', '오늘 하루 중 다시\n돌아가고 싶은 순간은요?', '요즘 마음을 차지한\n생각이 있나요?', '오늘 놓친 것 중에\n아쉬운 게 있나요?',
    '조용한 이 밤에\n떠오르는 장면이 있나요?', '오늘 하루 애쓴 나에게\n고맙다고 말해 볼까요?'],
  weekend: ['이번 주말에 가장\n하고 싶은 일은 무엇인가요?', '느긋한 주말, 지금\n어디에서 무엇을 하나요?', '이번 주 가장 기억에 남는\n장면은 무엇인가요?', '주말에만 느끼는\n작은 행복이 있나요?'],
  spring: ['봄이 온 걸 처음\n느낀 순간은 언제였나요?', '올봄 가장 먼저 본\n꽃은 무엇이었나요?'],
  summer: ['올여름 가장 시원했던\n순간은 언제였나요?', '여름밤에 떠오르는\n장면이 있나요?'],
  autumn: ['가을이 깊어진 걸\n느낀 순간이 있나요?', '올가을 걷고 싶은\n길이 있나요?'],
  winter: ['올겨울 가장 따뜻했던\n순간은 언제였나요?', '찬 공기 속에서\n떠오르는 장면이 있나요?'],
};
export function dayQuestion(now = new Date()) {
  const h = now.getHours(), m = now.getMonth() + 1, wd = now.getDay();
  const slot = h >= 5 && h < 11 ? 'morning' : h < 17 && h >= 11 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night';
  const season = m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  const pool = [...DQ[slot], ...DQ[season], ...((wd === 0 || wd === 6) && (slot === 'morning' || slot === 'day') ? DQ.weekend : [])];
  const day = Math.floor((now - now.getTimezoneOffset() * 6e4) / 864e5);
  return pool[day % pool.length];
}
