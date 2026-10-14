/* Story phrases (English, US). Plain, warm, at most one figure of speech per paragraph.
   Lists hold plain strings or { if: conditions, t: [lines] } — conditions: tod · wx · light (sun is up) · season · dow (0=Sun) · cold · hot.
   Any line about sunshine or blue sky must carry light: true, so it never shows after dark.
   When there is weather, the engine builds: greet + where + air, and lowercases the first letter of the air line.
   So every air line must also read well after "It’s clear and 64° in Austin —" (never start one with "I" or a name).
   Lines with {todos}, {events}, {count} or {week} must not use is/are, since the number can be 1 or many. */
export default {
  greet: {
    morning: ['Good morning, {name}.', 'Morning, {name}. Did you sleep well?', 'Hello, {name}. A new day is here.', 'Good morning, {name}. The day is just getting started.',
      'Hi, {name}. Good to see you this morning.', 'Up and about, {name}?', 'A fresh start, {name}.', 'Good morning, {name}. Take a moment before the day picks up.',
      { if: { dow: 1 }, t: ['A new week begins, {name}.', 'Monday morning, {name}. A fresh week starts here.'] },
      { if: { dow: 5 }, t: ['Friday morning, {name}.', 'It’s Friday, {name}. The weekend is close.'] },
      { if: { dow: 0 }, t: ['A slow Sunday morning, {name}.', 'Good morning, {name}. Sundays are for taking it easy.'] },
      { if: { dow: 6 }, t: ['Saturday morning, {name}.', 'Good morning, {name}. No rush on a Saturday.'] }],
    day: ['Hi, {name}. You’re halfway through the day.', 'How’s your day going, {name}?', 'Did you get a chance to eat lunch, {name}?', 'Hi, {name}. This is a good moment to pause.',
      'Half the day is behind you, {name}.', 'Hello, {name}. Good to see you.', 'Good to have you back, {name}.',
      { if: { dow: 3 }, t: ['Midweek already, {name}.', 'It’s Wednesday, {name}. The week is half done.'] },
      { if: { dow: 0 }, t: ['A lazy Sunday afternoon, {name}.', 'Hi, {name}. Sunday is moving at its own pace.'] },
      { if: { dow: 6 }, t: ['A weekend afternoon, {name}.', 'Saturday afternoon, {name}.'] }],
    evening: ['Good evening, {name}.', 'Nice work today, {name}.', 'The day is winding down, {name}.', 'Welcome back, {name}.', 'Evening is here, {name}.',
      'Hi, {name}. Time to ease into the evening.',
      { if: { dow: 5 }, t: ['You made it through the week, {name}.', 'Friday evening, {name}. The week is behind you.'] },
      { if: { dow: 0 }, t: ['The last evening of the weekend, {name}.', 'Sunday evening, {name}. The weekend is winding down.'] },
      { if: { dow: 1 }, t: ['Monday is done, {name}.', 'One Monday down, {name}.'] }],
    night: ['It’s getting late, {name}.', 'A quiet night, {name}.', 'Still up, {name}?', 'The night has settled in, {name}.', 'Hi, {name}. The day is almost over.',
      'Good to see you tonight, {name}.',
      { if: { dow: 0 }, t: ['A new week starts tomorrow, {name}.', 'Sunday night, {name}. Tomorrow starts a new week.'] },
      { if: { dow: 5 }, t: ['Friday night, {name}.', 'Friday night, {name}. The weekend is here.'] }]
  },
  air: [
    { if: { wx: 'sun', tod: 'morning', light: true }, t: ['A good morning to open a window.', 'The kind of morning that makes it easy to get going.', 'Bright enough to wake anyone up.', 'A bright start to the day.'] },
    { if: { wx: 'sun', light: true }, t: ['The sun is out in full today.', 'Nice weather for a short walk.', 'The sky is wide and blue.', 'A good day for drying laundry outside.', 'A good day to step outside, even for a few minutes.'] },
    { if: { wx: 'sun', light: false }, t: ['The stars may be out tonight.', 'A cloudless night.', 'The moon may be bright tonight.', 'A calm, still night.'] },
    { if: { wx: 'suncloud', light: true }, t: ['Sunlight keeps slipping through the clouds.', 'Sun and clouds are taking turns today.', 'Clouds are drifting slowly by.', 'Patches of blue are showing between the clouds.'] },
    { if: { wx: 'suncloud', light: false }, t: ['The moon keeps ducking in and out of the clouds.', 'Thin clouds are drifting across the night sky.', 'A few clouds tonight, with a few stars between them.'] },
    { if: { wx: 'cloud', light: true }, t: ['No sun today, but it’s a calm kind of gray.', 'The sky is low and gray today.', 'Soft, even light, easy on the eyes.', 'A gray day, good for quiet work.'] },
    { if: { wx: 'cloud', light: false }, t: ['Clouds are covering the moon tonight.', 'The stars are tucked behind the clouds.', 'A low, quiet sky tonight.'] },
    { if: { wx: 'rain' }, t: ['Bring an umbrella and you’ll be glad you did.', 'The rain is keeping a steady rhythm today.', 'The sound of rain has a way of slowing things down.', 'Roads may be wet, so leave a little extra time.', 'A good day for something warm to drink.'] },
    { if: { wx: 'rain', light: false }, t: ['A good night to fall asleep to the rain.', 'Listen to the rain for a minute as you wind down.'] },
    { if: { wx: 'snow' }, t: ['Sidewalks may be slippery, so take it slow.', 'Snow makes the world a little quieter.', 'Everything looks softer under the snow.', 'A good day to stay warm and dry.'] },
    { if: { wx: 'thunder' }, t: ['A good day to stay indoors.', 'Stay somewhere safe and dry until the storm passes.', 'Thunder on and off, so keep plans flexible.'] },
    { if: { wx: 'fog' }, t: ['The distance is hazy, so start with what’s close.', 'Foggy roads call for an easy pace.', 'The fog has softened the edges of everything.'] },
    { if: { cold: true }, t: ['Bring a warm jacket.', 'Keep your hands warm today.', 'A good day for a hot cup of tea.', 'Dress in layers today.'], w: 2 },
    { if: { hot: true }, t: ['Remember to drink water.', 'Stay on the shady side of the street if you can.', 'Take breaks somewhere cool.', 'Go easy during the hottest part of the day.'], w: 2 },
    { if: { season: 'spring' }, t: ['There’s a hint of spring in the air.', 'Something is blooming somewhere nearby.', 'The days are getting a little longer.'] },
    { if: { season: 'spring', light: true }, t: ['The spring sun feels gentler now.', 'Spring light makes everything look new.'] },
    { if: { season: 'summer' }, t: ['Summer is in full swing.', 'The trees are at their fullest now.'] },
    { if: { season: 'summer', light: true }, t: ['The long days give everything a little more room.', 'Plenty of daylight left to work with.'] },
    { if: { season: 'summer', light: false }, t: ['The summer air is slowly cooling off.', 'The summer night air is soft and still.'] },
    { if: { season: 'autumn' }, t: ['Fall is starting to show in the breeze.', 'The leaves are changing color, little by little.', 'The air has that crisp fall feel.'] },
    { if: { season: 'autumn', light: true }, t: ['The light has a golden fall slant.'] },
    { if: { season: 'autumn', light: false }, t: ['Fall nights are getting longer.', 'A night for the sound of crickets.', 'It gets dark earlier now.'] },
    { if: { season: 'winter' }, t: ['The cold air makes thinking feel clearer.', 'A season for being grateful for a warm room.'] },
    { if: { season: 'winter', light: true }, t: ['The days are short, so enjoy the daylight while it lasts.'] },
    { if: { season: 'winter', light: false }, t: ['Winter nights are long, so rest without hurrying.', 'A long winter night, good for an early bedtime.'] }
  ],
  // Joined as: greet + ' ' + where + ' ' + air (air starts lowercase). {wx} is words.wx + temperature, e.g. "clear and 64°".
  where: 'It’s {wx} in {city} —',
  plan: {
    // A missing time drops " at {time}" automatically, so keep the time in that exact form.
    events1: ['You have [event] {events} today: {title} at {time}.', 'There’s [event] {events} on the calendar today. Don’t forget {title} at {time}.', 'Just [event] {events} today: {title} at {time}.'],
    eventsN: ['You have [event] {events} today. First up is {title} at {time}.', 'There are [event] {events} on the calendar today, starting with {title} at {time}.', '[event] {events} today. The first is {title} at {time}.'],
    eventsPast: ['Everything on today’s [event] calendar is behind you.', 'Today’s [event] schedule is clear now.', 'That’s it for today’s [event] calendar.'],
    todos: ['You have [todo] {todos} left.', 'Your list has [todo] {todos} waiting.', 'On your list today: [todo] {todos}.', 'You still have [todo] {todos} to get to.'],
    todosAlso: ['You also have [todo] {todos} left.', 'And [todo] {todos} still to go.', 'Your list also has [todo] {todos} waiting.'],
    todosDone: ['Every to-do is checked off. [sparkles] That’s plenty for one day.', 'Your to-do list is clear. [sparkles] The rest of the time is yours.', 'Nothing left on your list. [sparkles] Nice work.'],
    free: {
      morning: ['Nothing is on the calendar today. Pick one thing you’d like to do.', 'The day is wide open. Take your time deciding what to do with it.', 'No plans yet today, which leaves room for something you enjoy.'],
      day: ['Nothing else is scheduled. Take a breath if you need one.', 'The afternoon is open. A good time for something you’ve been putting off.', 'No more plans for today. Use the time however you like.'],
      evening: ['Nothing left on the calendar. The evening is yours.', 'Your schedule is done for the day. Now the time is yours.', 'No plans tonight, so there’s room to unwind.'],
      night: ['Tomorrow’s plans can wait until morning.', 'Everything for today is done. Now just rest.', 'Nothing more to do tonight.']
    }
  },
  stack: {
    first: ['Today is [sparkles] day one. Write a single line below, and your story begins.', 'Welcome. Today is [sparkles] day one, and one line below is all it takes to start.'],
    today1: ['Earlier today you wrote [note] {latest}.', 'Today you kept [note] {latest}.', 'You’ve already written [note] {latest} today.'],
    todayN: ['You’ve written [note] {count} today. The latest is {latest}.', 'Today you’ve kept [note] {count}. The most recent is {latest}.', '[note] {count} so far today, most recently {latest}.'],
    streak: ['[fire] {streak} in a row now.', 'You’ve written for [fire] {streak} straight.', '[fire] {streak} without missing a day.'],
    none: {
      evening: ['Nothing written yet today.', 'Today’s page is still blank.', 'Nothing yet today. There’s still time for a line or two.'],
      night: ['Nothing written yet today. A short line is fine.', 'One line before bed is enough to remember today by.', 'Today’s page is still empty. Even a few words will do.']
    },
    week: ['You’ve kept [note] {week} this week.', '[note] {week} so far this week.', 'This week adds up to [note] {week}.']
  },
  recall: {
    anniversary: ['Today is [cake] {label}.', 'Today marks [cake] {label}.'],
    yearsAgo: ['{ago} today, you wrote {title}.', '{ago} on this day, you kept {title}.'],
    monthAgo: ['A month ago today, you wrote {title}.', 'One month ago, you kept {title}.'],
    lastWeek: ['This time last week, you wrote {title}.', 'Last week on this day, you kept {title}.'],
    lastSeason: ['Around this time last year, you wrote {title}.', 'About a year ago, you kept {title}.'],
    random: ['Something you once wrote: {title}.', 'An old note comes back: {title}.', 'From your earlier pages: {title}.']
  },
  close: {
    morning: ['Take it slow today.', 'Have a good day.', 'Go at your own pace today.', 'One small thing done is enough to make it a good day.', 'Start easy and see where the day goes.'],
    day: ['Take a short break.', 'Go easy on yourself this afternoon.', 'Have some water and keep going.', 'One step at a time this afternoon.', 'A few deep breaths, then back to it.'],
    evening: ['Enjoy the rest of your evening.', 'You made it through today.', 'Let the evening be just for you.', 'Take a quiet look back at today.', 'Ease into the evening.'],
    night: ['Sleep well. See you tomorrow.', 'That’s enough for today.', 'Have a restful night.', 'Tomorrow can wait until tomorrow.', 'Rest up. The day is done.']
  },
  words: {
    events: n => n === 1 ? '1 event' : `${n} events`, todos: n => n === 1 ? '1 to-do' : `${n} to-dos`, count: n => n === 1 ? '1 record' : `${n} records`, week: n => n === 1 ? '1 record' : `${n} records`,
    streak: n => `${n} days`, ago: n => n === 1 ? 'A year ago' : `${n} years ago`,
    // Followed by the temperature: "clear and 64°"
    wx: { sun: 'clear and', suncloud: 'partly cloudy and', cloud: 'cloudy and', rain: 'rainy and', snow: 'snowy and', thunder: 'stormy and', fog: 'foggy and' }
  }
};
