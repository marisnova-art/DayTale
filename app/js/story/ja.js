/* 物語の文（日本語）。です・ます調、「あなた」は使わない、比喩は段落ごとに一つまで。 */
export default {
  greet: {
    morning: ['おはようございます、{name}さん。', '{name}さん、よく眠れましたか？'],
    day: ['{name}さん、一日の折り返しです。', 'こんにちは、{name}さん。'],
    evening: ['こんばんは、{name}さん。', '今日もお疲れさまでした、{name}さん。'],
    night: ['夜も更けてきましたね、{name}さん。', '静かな夜ですね、{name}さん。']
  },
  air: [
    { if: { wx: 'sun', tod: 'morning' }, t: ['窓を少し開けたくなる朝です。', '足取りが軽くなるような天気です。'] },
    { if: { wx: 'sun' }, t: ['今日は日差しがたっぷりです。', '少し散歩するのにいい天気です。'] },
    { if: { wx: 'suncloud' }, t: ['雲の間から日差しがのぞいています。'] },
    { if: { wx: 'cloud' }, t: ['日差しは隠れていますが、落ち着いた一日です。'] },
    { if: { wx: 'rain' }, t: ['傘を持って出かけると安心です。', '雨音がBGMになってくれる日です。'] },
    { if: { wx: 'snow' }, t: ['道が滑りやすいので、ゆっくり歩きましょう。', '街が少し静かになる日です。'] },
    { if: { wx: 'thunder' }, t: ['今日は屋内で過ごすのがよさそうです。'] },
    { if: { wx: 'fog' }, t: ['遠くはかすんでいても、近くのことから始めれば大丈夫です。'] },
    { if: { cold: true }, t: ['暖かい上着を持っていきましょう。'], w: 2 },
    { if: { hot: true }, t: ['こまめに水を飲みましょう。'], w: 2 },
    { if: { season: 'spring' }, t: ['風に春の気配が感じられます。'] },
    { if: { season: 'summer' }, t: ['日が長くて、一日がゆったり感じられます。'] },
    { if: { season: 'autumn' }, t: ['風に秋の気配がまじり始めました。'] },
    { if: { season: 'winter' }, t: ['空気が冷たくて、考えがすっきりする季節です。'] }
  ],
  where: '{city}は{wx}。',
  plan: {
    events1: ['今日は[event] {events}があります。{time}の{title}を忘れないでください。'],
    eventsN: ['今日は[event] {events}があります。最初は{time}の{title}です。'],
    eventsPast: ['今日の[event] 予定はすべて終わりました。'],
    todos: ['[todo] {todos}残っています。', 'まだ[todo] {todos}あります。'],
    todosAlso: ['ほかに[todo] {todos}残っています。'],
    todosDone: ['やることはすべて終わりました[sparkles] 今日はここまでで十分です。'],
    free: { morning: ['今日は決まった予定がありません。やりたいことを一つ選んでみましょう。'], day: ['このあとの予定はありません。ひと息ついても大丈夫です。'], evening: ['残りの予定はありません。夜はゆっくり過ごしましょう。'], night: ['明日の予定は、朝に一緒に確認しましょう。'] }
  },
  stack: {
    first: ['今日が[sparkles] 最初の日です。下に一行書くだけで、お話が始まります。'],
    today1: ['今日は[note] {latest}を書きました。'],
    todayN: ['今日はもう[note] {count}を残しました。いちばん新しいのは{latest}です。'],
    streak: ['[fire] {streak}続けて記録しています。'],
    none: { evening: ['今日はまだ記録がありません。'], night: ['今日はまだ記録がありません。短い一行でも大丈夫です。'] },
    week: ['今週は[note] {week}を残しました。']
  },
  recall: {
    anniversary: ['今日は[cake] {label}です。'],
    yearsAgo: ['{ago}の今日は、{title}を書きました。'],
    monthAgo: ['1か月前の今日は、{title}を書きました。'],
    lastWeek: ['先週の今ごろは、{title}を書きました。'],
    lastSeason: ['去年の今ごろは、{title}を書きました。'],
    random: ['以前書いた{title}を思い出します。']
  },
  close: {
    morning: ['今日もゆっくり始めましょう。', 'よい一日をお過ごしください。'],
    day: ['少し休んでいきましょう。', '残りの一日も無理しないでくださいね。'],
    evening: ['残りの夜はゆっくりお過ごしください。', '今日も一日、よく過ごしました。'],
    night: ['ゆっくり休んで、また明日。', '今日はここまでで十分です。']
  },
  words: {
    events: n => `${n}件の予定`, todos: n => `やることが${n}件`, count: n => `${n}件の記録`, week: n => `${n}件の記録`,
    streak: n => `${n}日`, ago: n => `${n}年前`,
    wx: { sun: '晴れ', suncloud: '晴れ時々曇り', cloud: '曇り', rain: '雨', snow: '雪', thunder: '雷雨', fog: '霧' }
  }
};
