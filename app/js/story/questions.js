/* 홈 쓰기 질문: 특별한 날 → 한 일 → 날씨 → 요일 → 기본. 2주 안 반복 없음, 시간대 안에서는 고정 */
import { josa } from './engine.js';
import { getLang } from '../core/i18n.js';
import { addDays, dayKey, ls, todayKey } from '../core/utils.js';
import ja from './questions.ja.js';
import es from './questions.es.js';
import fr from './questions.fr.js';

const Q = {
  ko: {
    morning: { base: ['오늘은 어떤 하루를 보내고 싶나요?', '오늘 꼭 챙길 한 가지는 무엇인가요?', '눈뜨자마자 떠오른 생각이 있나요?', '오늘 기대되는 일이 있나요?', '어젯밤 잠은 잘 잤나요?'],
      rain: ['비가 오네요. 우산 챙기면서 떠오른 일이 있나요?'], sun: ['맑은 아침이에요. 오늘은 어디를 걷고 싶나요?'], cold: ['쌀쌀한 아침이에요. 따뜻하게 시작할 방법이 있을까요?'],
      dow1: ['한 주의 시작이에요. 이번 주에 해내고 싶은 건요?'], dow5: ['금요일 아침이에요. 이번 주 남은 일은 무엇인가요?'], weekend: ['여유로운 주말 아침이에요. 오늘은 무엇을 하고 싶나요?'] },
    day: { base: ['지금 떠오른 걸 적어 둘까요?', '점심은 무엇을 먹었나요?', '오전에 있었던 일 중 기억할 만한 게 있나요?', '잊기 전에 적어 둘 게 있나요?', '오후에 남은 일은 무엇인가요?'],
      done: ['할 일을 벌써 {n}개 끝냈어요. 다음은 무엇인가요?'], event: ['오늘 일정이 하나 남았어요. 준비할 게 있나요?'], item: ['방금 둔 물건이 있다면 위치를 적어 둘까요?'],
      rain: ['비 오는 오후예요. 창밖을 보며 떠오른 생각이 있나요?'], sun: ['햇살 좋은 오후예요. 잠깐 쉬어 갈 틈이 있었나요?'] },
    evening: { base: ['오늘은 어떤 하루였나요?', '오늘 가장 좋았던 순간은 언제였나요?', '오늘 누구와 이야기를 나눴나요?', '오늘 새로 알게 된 게 있나요?', '오늘 하루를 한 줄로 남긴다면요?'],
      allDone: ['할 일을 모두 끝냈어요. 오늘 스스로에게 한마디 해 볼까요?'], someLeft: ['남은 일은 내일로 미뤄도 괜찮아요. 오늘 가장 잘한 일은요?'], streak: ['{n}일째 기록하고 있어요. 오늘도 이어 볼까요?'],
      dow1: ['월요일을 잘 넘겼어요. 어땠나요?'], dow5: ['한 주를 마무리하는 금요일이에요. 이번 주는 어땠나요?'], weekend: ['주말 저녁이에요. 오늘 쉰 만큼 무엇이 채워졌나요?'] },
    night: { base: ['자기 전에 남기고 싶은 말이 있나요?', '오늘 마음에 남은 장면은 무엇인가요?', '오늘 고마웠던 사람이 있나요?', '내일의 나에게 남길 말이 있나요?', '오늘 하루, 몇 점이었나요?'],
      yearAgo: ['1년 전 오늘은 {title}을 적었어요. 오늘은 어떤가요?'], anniversary: ['오늘은 {label}이에요. 어떻게 보냈나요?'], monthEnd: ['한 달이 끝나 가요. 이번 달 가장 기억에 남는 일은요?'],
      empty: ['오늘은 아직 한 줄도 없어요. 짧게라도 남겨 볼까요?'], gap: ['며칠 쉬었어요. 그동안 있었던 일 하나만 적어 볼까요?'] }
  },
  en: {
    morning: { base: ['What kind of day would you like today?', 'What is the one thing to take care of today?', 'Any thought the moment you woke up?', 'Anything you are looking forward to today?', 'Did you sleep well last night?'],
      rain: ['It is raining. Anything come to mind while grabbing an umbrella?'], sun: ['A clear morning. Where would you like to walk today?'], cold: ['A chilly morning. How could you start warm?'],
      dow1: ['A new week begins. What would you like to get done this week?'], dow5: ['Friday morning. What is left for this week?'], weekend: ['A slow weekend morning. What would you like to do?'] },
    day: { base: ["What's on your mind right now?", 'What did you have for lunch?', 'Anything from this morning worth remembering?', 'Anything to note before you forget?', 'What is left for the afternoon?'],
      done: ['You have already finished {n} to-dos. What is next?'], event: ['One event left today. Anything to prepare?'], item: ['Did you just put something away? Note where it is.'],
      rain: ['A rainy afternoon. Any thoughts while looking outside?'], sun: ['A sunny afternoon. Did you get a moment to rest?'] },
    evening: { base: ['How was your day?', 'What was the best moment today?', 'Who did you talk with today?', 'Did you learn anything new today?', 'If today were one line, what would it be?'],
      allDone: ['Every to-do is done. A word for yourself?'], someLeft: ['It is fine to move the rest to tomorrow. What went best today?'], streak: ['Day {n} of keeping records. Keep it going?'],
      dow1: ['You got through Monday. How was it?'], dow5: ['Friday, the end of the week. How was this week?'], weekend: ['A weekend evening. What did resting give you today?'] },
    night: { base: ['Anything to keep before you sleep?', 'What scene from today stays with you?', 'Anyone you felt grateful for today?', 'Any note for tomorrow’s you?', 'How would you score today?'],
      yearAgo: ['A year ago today you wrote {title}. How is today?'], anniversary: ['Today is {label}. How did you spend it?'], monthEnd: ['The month is almost over. What stood out the most?'],
      empty: ['Nothing written yet today. Maybe a short line?'], gap: ['You took a few days off. Write one thing that happened?'] }
  }
  , ja, es, fr
};

/* ctx: gather() 결과 + weather + recall */
function pickQuestion(ctx, { recall } = {}) {
  const lang = Q[getLang()] ? getLang() : 'en', B = Q[lang][ctx.slot];
  const key = todayKey() + ctx.slot + lang;
  const saved = ls.get('daytale.q', null);
  if (saved?.key === key) return saved.q;
  const dow = ctx.now.getDay(), wx = ctx.weather?.kind, cold = (ctx.weather?.temp ?? 99) <= 5;
  const groups = [];
  // 특별한 날
  if (recall?.kind === 'anniversary' && B.anniversary) groups.push(B.anniversary.map(q => q.replace('{label}이에요', recall.label + josa(recall.label, '이에요')).replace('{label}', recall.label)));
  if (recall?.kind === 'yearsAgo' && recall.n === 1 && B.yearAgo) groups.push(B.yearAgo.map(q => q.replace('{title}을', recall.title + josa(recall.title, '을')).replace('{title}', recall.title)));
  if (B.monthEnd && new Date(ctx.now.getFullYear(), ctx.now.getMonth() + 1, 0).getDate() - ctx.now.getDate() <= 2) groups.push(B.monthEnd);
  // 한 일
  if (B.done && ctx.doneToday.length >= 2) groups.push(B.done.map(q => q.replace('{n}', ctx.doneToday.length)));
  if (B.event && ctx.upcoming.length === 1) groups.push(B.event);
  if (B.allDone && ctx.doneToday.length && !ctx.todos.length) groups.push(B.allDone);
  if (B.someLeft && ctx.doneToday.length && ctx.todos.length) groups.push(B.someLeft);
  if (B.streak && ctx.streak >= 3) groups.push(B.streak.map(q => q.replace('{n}', ctx.streak)));
  if (B.empty && !ctx.writtenToday.length && !ctx.first) groups.push(ctx.all.length && !ctx.all.some(e => e.created_at >= addDays(ctx.now, -3).toISOString()) ? B.gap : B.empty);
  // 날씨, 요일
  if (wx === 'rain' && B.rain) groups.push(B.rain); if (wx === 'sun' && B.sun) groups.push(B.sun); if (cold && B.cold) groups.push(B.cold);
  if (dow === 1 && B.dow1) groups.push(B.dow1); if (dow === 5 && B.dow5) groups.push(B.dow5); if ((dow === 0 || dow === 6) && B.weekend) groups.push(B.weekend);
  groups.push(B.base);
  // 2주 안 반복 없음
  const hist = ls.get('daytale.qhist', []).filter(h => h.d >= dayKey(addDays(ctx.now, -14)));
  const used = new Set(hist.map(h => h.q));
  let q = null;
  for (const g of groups) { const fresh = g.filter(x => !used.has(x)); if (fresh.length) { q = fresh[Math.floor(Math.random() * fresh.length)]; break; } }
  q ||= B.base[Math.floor(Math.random() * B.base.length)];
  ls.set('daytale.qhist', [...hist, { q, d: todayKey() }].slice(-60)); ls.set('daytale.q', { key, q });
  return q;
}
/* "다른 질문 보기": 기본 묶음에서 하나 더 */
function nextQuestion(ctx, current) {
  const lang = Q[getLang()] ? getLang() : 'en', B = Q[lang][ctx.slot].base;
  const list = B.filter(q => q !== current); const q = list[Math.floor(Math.random() * list.length)];
  ls.set('daytale.q', { key: todayKey() + ctx.slot + lang, q }); return q;
}

export { nextQuestion, pickQuestion };
