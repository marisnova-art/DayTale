/* Story phrases (English). Plain, warm, at most one figure of speech per paragraph. */
export default {
  greet: {
    morning: ['Good morning, {name}.', 'Morning, {name}. Did you sleep well?'],
    day: ["Hi {name}, you're halfway through the day.", 'Good afternoon, {name}.'],
    evening: ['Good evening, {name}.', 'Well done today, {name}.'],
    night: ["It's getting late, {name}.", 'A quiet night, {name}.']
  },
  air: [
    { if: { wx: 'sun', tod: 'morning' }, t: ['A good morning to open the window a little.', 'The kind of weather that makes your steps lighter.'] },
    { if: { wx: 'sun' }, t: ['The sun is being generous today.', 'Nice weather for a short walk.'] },
    { if: { wx: 'suncloud' }, t: ['Sunlight keeps slipping between the clouds.'] },
    { if: { wx: 'cloud' }, t: ['The sun is hiding, but it is a calm day.'] },
    { if: { wx: 'rain' }, t: ['Take an umbrella and you will feel better.', 'The rain is playing background music today.'] },
    { if: { wx: 'snow' }, t: ['Paths may be slippery, so take it slow.', 'The world gets a little quieter today.'] },
    { if: { wx: 'thunder' }, t: ['A good day to stay indoors.'] },
    { if: { wx: 'fog' }, t: ['Things far away are blurry, so start with what is near.'] },
    { if: { cold: true }, t: ['Bring a warm jacket.'], w: 2 },
    { if: { hot: true }, t: ['Remember to drink water.'], w: 2 },
    { if: { season: 'spring' }, t: ['There is a hint of spring in the air.'] },
    { if: { season: 'summer' }, t: ['The long days make everything feel roomier.'] },
    { if: { season: 'autumn' }, t: ['Autumn is starting to show in the breeze.'] },
    { if: { season: 'winter' }, t: ['The cold air makes thoughts feel clearer.'] }
  ],
  where: 'In {city} it is {wx},',
  plan: {
    events1: ['You have [event] {events} today. Don’t forget {title} at {time}.'],
    eventsN: ['You have [event] {events} today. The first is {title} at {time}.'],
    eventsPast: ['All of today’s [event] events are behind you.'],
    todos: ['[todo] {todos} still waiting.', 'You have [todo] {todos} left.'],
    todosAlso: ['There are also [todo] {todos} left.'],
    todosDone: ['Every to-do is done [sparkles] That is enough for today.'],
    free: { morning: ['Nothing is scheduled today. Pick one thing you would like to do.'], day: ['Nothing else is scheduled. Feel free to take a breath.'], evening: ['Nothing left on the schedule. The evening is yours.'], night: ['We will look at tomorrow together in the morning.'] }
  },
  stack: {
    first: ['Today is [sparkles] day one. Write a single line below and the story begins.'],
    today1: ['Earlier you wrote [note] {latest}.'],
    todayN: ['You have kept [note] {count} today. The latest is {latest}.'],
    streak: ['[fire] {streak} in a row of keeping records.'],
    none: { evening: ['Nothing written yet today.'], night: ['Nothing written yet today. A short line is fine.'] },
    week: ['You have kept [note] {week} this week.']
  },
  recall: {
    anniversary: ['Today is [cake] {label}.'],
    yearsAgo: ['{ago} today, you wrote {title}.'],
    monthAgo: ['A month ago today, you wrote {title}.'],
    lastWeek: ['Around this time last week, you wrote {title}.'],
    lastSeason: ['Around this time last year, you wrote {title}.'],
    random: ['{title}, something you once wrote, comes to mind.']
  },
  close: {
    morning: ['Take it slow today.', 'Have a good day.'],
    day: ['Take a short break.', 'Go easy on the rest of the day.'],
    evening: ['Enjoy the rest of your evening.', 'You made it through today.'],
    night: ['Sleep well. See you tomorrow.', 'That is enough for today.']
  },
  words: {
    events: n => n === 1 ? '1 event' : `${n} events`, todos: n => n === 1 ? '1 to-do' : `${n} to-dos`, count: n => n === 1 ? '1 record' : `${n} records`, week: n => n === 1 ? '1 record' : `${n} records`,
    streak: n => `${n} days`, ago: n => n === 1 ? 'A year ago' : `${n} years ago`,
    wx: { sun: 'clear', suncloud: 'partly cloudy', cloud: 'cloudy', rain: 'raining', snow: 'snowing', thunder: 'stormy', fog: 'foggy' }
  }
};
