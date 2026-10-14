/* Story phrases (English). Plain, warm, at most one figure of speech per paragraph.
   Lists hold plain strings or { if: conditions, t: [lines] } — conditions: tod · wx · light (sun is up) · season · dow (0=Sun) · cold · hot.
   Any line about sunshine or blue sky must carry light: true, so it never shows after dark. */
export default {
  greet: {
    morning: ['Good morning, {name}.', 'Morning, {name}. Did you sleep well?', 'Rise and shine, {name}.', 'A new day, {name}.', 'Hello again, {name}.',
      { if: { dow: 1 }, t: ['A new week begins, {name}.'] }, { if: { dow: 5 }, t: ['Friday morning, {name}.'] }, { if: { dow: 0 }, t: ['A slow Sunday morning, {name}.'] }, { if: { dow: 6 }, t: ['Saturday morning, {name}.'] }],
    day: ["Hi {name}, you're halfway through the day.", 'Good afternoon, {name}.', 'Did you get some lunch, {name}?', 'Time for a short pause, {name}.',
      { if: { dow: 3 }, t: ['Midweek already, {name}.'] }, { if: { dow: 0 }, t: ['A lazy Sunday afternoon, {name}.'] }, { if: { dow: 6 }, t: ['A weekend afternoon, {name}.'] }],
    evening: ['Good evening, {name}.', 'Well done today, {name}.', 'The day is winding down, {name}.', 'Welcome back, {name}.',
      { if: { dow: 5 }, t: ['You made it through the week, {name}.'] }, { if: { dow: 0 }, t: ['The last evening of the weekend, {name}.'] }, { if: { dow: 1 }, t: ['Monday is done, {name}.'] }],
    night: ["It's getting late, {name}.", 'A quiet night, {name}.', 'Still up, {name}?', 'The night is deep, {name}.',
      { if: { dow: 0 }, t: ['A new week starts tomorrow, {name}.'] }, { if: { dow: 5 }, t: ['Friday night, {name}.'] }]
  },
  air: [
    { if: { wx: 'sun', tod: 'morning', light: true }, t: ['A good morning to open the window a little.', 'The kind of weather that makes your steps lighter.', 'Bright enough to wake anyone up.'] },
    { if: { wx: 'sun', light: true }, t: ['The sun is being generous today.', 'Nice weather for a short walk.', 'The sky is high and blue.', 'A good day for laundry to dry.'] },
    { if: { wx: 'sun', light: false }, t: ['The sky is clear, so the stars may be out.', 'A cloudless night.', 'The moon should be sharp tonight.'] },
    { if: { wx: 'suncloud', light: true }, t: ['Sunlight keeps slipping between the clouds.', 'Neither hot nor cold, an easy kind of day.', 'Clouds are drifting slowly by.'] },
    { if: { wx: 'suncloud', light: false }, t: ['The moon is playing hide and seek with the clouds.', 'Thin clouds are passing over the night sky.'] },
    { if: { wx: 'cloud', light: true }, t: ['The sun is hiding, but it is a calm day.', 'The sky has settled low today.', 'Soft light, easy on the eyes.'] },
    { if: { wx: 'cloud', light: false }, t: ['Clouds are covering the moon tonight.', 'The stars are resting behind the clouds.', 'A low, quiet sky tonight.'] },
    { if: { wx: 'rain' }, t: ['Take an umbrella and you will feel better.', 'The rain is playing background music today.', 'The sound of rain slows the thoughts down.'] },
    { if: { wx: 'rain', light: false }, t: ['A good night to fall asleep to the rain.'] },
    { if: { wx: 'snow' }, t: ['Paths may be slippery, so take it slow.', 'The world gets a little quieter today.', 'Snow makes everything feel softer.'] },
    { if: { wx: 'thunder' }, t: ['A good day to stay indoors.', 'Stay somewhere warm until the thunder passes.'] },
    { if: { wx: 'fog' }, t: ['Things far away are blurry, so start with what is near.', 'Foggy paths are fine taken slowly.'] },
    { if: { cold: true }, t: ['Bring a warm jacket.', 'Keep your hands warm today.', 'A day made for a hot cup of tea.'], w: 2 },
    { if: { hot: true }, t: ['Remember to drink water.', 'Walk on the shady side if you can.', 'Take breaks somewhere cool.'], w: 2 },
    { if: { season: 'spring' }, t: ['There is a hint of spring in the air.', 'Something is blooming somewhere.'] },
    { if: { season: 'spring', light: true }, t: ['The spring sun has softened.'] },
    { if: { season: 'summer' }, t: ['Summer is in full swing.', 'The green outside keeps getting deeper.'] },
    { if: { season: 'summer', light: true }, t: ['The long days make everything feel roomier.'] },
    { if: { season: 'summer', light: false }, t: ['The summer air is slowly cooling down.'] },
    { if: { season: 'autumn' }, t: ['Autumn is starting to show in the breeze.', 'The leaves are changing colour, little by little.'] },
    { if: { season: 'autumn', light: false }, t: ['Autumn nights are getting longer.', 'A night for the sound of crickets.'] },
    { if: { season: 'winter' }, t: ['The cold air makes thoughts feel clearer.', 'A season to be grateful for warm rooms.'] },
    { if: { season: 'winter', light: false }, t: ['Winter nights are long, so rest slowly.'] }
  ],
  where: 'In {city} it is {wx},',
  plan: {
    events1: ['You have [event] {events} today. Don’t forget {title} at {time}.', 'There is [event] {events} today: {title} at {time}.'],
    eventsN: ['You have [event] {events} today. The first is {title} at {time}.', '[event] {events} today, starting with {title} at {time}.'],
    eventsPast: ['All of today’s [event] events are behind you.', 'Today’s [event] events are all done.'],
    todos: ['[todo] {todos} still waiting.', 'You have [todo] {todos} left.', '[todo] {todos} on the list today.'],
    todosAlso: ['There are also [todo] {todos} left.', 'And [todo] {todos} still to go.'],
    todosDone: ['Every to-do is done [sparkles] That is enough for today.', 'All to-dos are done [sparkles] The rest of the time is yours.'],
    free: {
      morning: ['Nothing is scheduled today. Pick one thing you would like to do.', 'An open day. Take your time deciding how to fill it.'],
      day: ['Nothing else is scheduled. Feel free to take a breath.', 'The afternoon is free. A good time for something you put off.'],
      evening: ['Nothing left on the schedule. The evening is yours.', 'The schedule is done. Now it is your time.'],
      night: ['We will look at tomorrow together in the morning.', 'Everything for today is done. Now just rest.']
    }
  },
  stack: {
    first: ['Today is [sparkles] day one. Write a single line below and the story begins.'],
    today1: ['Earlier you wrote [note] {latest}.', 'Today you kept [note] {latest}.'],
    todayN: ['You have kept [note] {count} today. The latest is {latest}.', '[note] {count} written today. The last one: {latest}.'],
    streak: ['[fire] {streak} in a row of keeping records.', '[fire] {streak} without missing a day.'],
    none: { evening: ['Nothing written yet today.', 'Today’s page is still blank.'], night: ['Nothing written yet today. A short line is fine.', 'One line before bed is enough to remember today.'] },
    week: ['You have kept [note] {week} this week.', '[note] {week} gathered this week.']
  },
  recall: {
    anniversary: ['Today is [cake] {label}.'],
    yearsAgo: ['{ago} today, you wrote {title}.', '{ago} on this day, you kept {title}.'],
    monthAgo: ['A month ago today, you wrote {title}.'],
    lastWeek: ['Around this time last week, you wrote {title}.'],
    lastSeason: ['Around this time last year, you wrote {title}.'],
    random: ['{title}, something you once wrote, comes to mind.', 'An old note comes back: {title}.']
  },
  close: {
    morning: ['Take it slow today.', 'Have a good day.', 'Go at your own pace today.', 'One small thing done makes a good day.'],
    day: ['Take a short break.', 'Go easy on the rest of the day.', 'Drink some water and carry on.', 'One step at a time this afternoon.'],
    evening: ['Enjoy the rest of your evening.', 'You made it through today.', 'The evening can be just for you.', 'Look back on today, slowly.'],
    night: ['Sleep well. See you tomorrow.', 'That is enough for today.', 'Have a restful night.', 'Tomorrow’s you can handle tomorrow.']
  },
  words: {
    events: n => n === 1 ? '1 event' : `${n} events`, todos: n => n === 1 ? '1 to-do' : `${n} to-dos`, count: n => n === 1 ? '1 record' : `${n} records`, week: n => n === 1 ? '1 record' : `${n} records`,
    streak: n => `${n} days`, ago: n => n === 1 ? 'A year ago' : `${n} years ago`,
    wx: { sun: 'clear', suncloud: 'partly cloudy', cloud: 'cloudy', rain: 'raining', snow: 'snowing', thunder: 'stormy', fog: 'foggy' }
  }
};
