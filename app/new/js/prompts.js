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
