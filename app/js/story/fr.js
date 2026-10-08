/* Phrases du récit (français). Vouvoiement, ton simple et chaleureux, une figure de style au plus par paragraphe.
   La phrase « air » suit « where » (qui se termine par deux-points) : sa première lettre est mise en minuscule par le moteur. */
export default {
  greet: {
    morning: ['Bonjour, {name}.', 'Bonjour, {name}. Avez-vous bien dormi ?'],
    day: ['Bonjour, {name}. La journée est déjà à moitié passée.', 'Bon après-midi, {name}.'],
    evening: ['Bonsoir, {name}.', 'Bravo pour cette journée, {name}.'],
    night: ['Il se fait tard, {name}.', 'La nuit est calme, {name}.']
  },
  air: [
    { if: { wx: 'sun', tod: 'morning' }, t: ['Une belle matinée pour entrouvrir la fenêtre.', 'Un temps qui rend le pas plus léger.'] },
    { if: { wx: 'sun' }, t: ['Le soleil est généreux aujourd’hui.', 'Un beau temps pour une courte promenade.'] },
    { if: { wx: 'suncloud' }, t: ['Le soleil se glisse entre les nuages.'] },
    { if: { wx: 'cloud' }, t: ['Le soleil se cache, mais la journée est calme.'] },
    { if: { wx: 'rain' }, t: ['Prenez un parapluie, vous serez plus tranquille.', 'La pluie joue sa musique de fond aujourd’hui.'] },
    { if: { wx: 'snow' }, t: ['Les trottoirs peuvent être glissants, allez-y doucement.', 'Le monde se fait un peu plus silencieux aujourd’hui.'] },
    { if: { wx: 'thunder' }, t: ['Une bonne journée pour rester à l’intérieur.'] },
    { if: { wx: 'fog' }, t: ['Le lointain reste flou, commencez donc par ce qui est proche.'] },
    { if: { cold: true }, t: ['Prenez une veste chaude.'], w: 2 },
    { if: { hot: true }, t: ['Pensez à boire de l’eau.'], w: 2 },
    { if: { season: 'spring' }, t: ['Il y a un air de printemps.'] },
    { if: { season: 'summer' }, t: ['Les longues journées laissent du temps pour tout.'] },
    { if: { season: 'autumn' }, t: ['La brise commence à sentir l’automne.'] },
    { if: { season: 'winter' }, t: ['L’air froid rend les idées plus claires.'] }
  ],
  where: 'À {city}, {wx} :',
  plan: {
    events1: ['Vous avez [event] {events} aujourd’hui. N’oubliez pas {title} à {time}.'],
    eventsN: ['Vous avez [event] {events} aujourd’hui. Le premier : {title} à {time}.'],
    eventsPast: ['Tous les [event] événements de la journée sont passés.'],
    todos: ['Il reste [todo] {todos}.', 'Encore [todo] {todos} à faire.'],
    todosAlso: ['Il reste aussi [todo] {todos}.'],
    todosDone: ['Toutes les tâches sont faites [sparkles] C’est bien assez pour aujourd’hui.'],
    free: { morning: ['Rien n’est prévu aujourd’hui. Choisissez une chose que vous aimeriez faire.'], day: ['Plus rien n’est prévu. Prenez le temps de souffler.'], evening: ['Plus rien au programme. La soirée est à vous.'], night: ['Nous regarderons la journée de demain ensemble, au matin.'] }
  },
  stack: {
    first: ['Aujourd’hui, c’est le [sparkles] premier jour. Écrivez une seule ligne ci-dessous et le récit commence.'],
    today1: ['Plus tôt, vous avez écrit [note] {latest}.'],
    todayN: ['Vous avez ajouté [note] {count} aujourd’hui. La plus récente : {latest}.'],
    streak: ['[fire] Cela fait {streak} de suite que vous écrivez.'],
    none: { evening: ['Rien d’écrit pour l’instant aujourd’hui.'], night: ['Rien d’écrit pour l’instant aujourd’hui. Une ligne courte suffit.'] },
    week: ['Vous avez ajouté [note] {week} cette semaine.']
  },
  recall: {
    anniversary: ['Aujourd’hui : [cake] {label}.'],
    yearsAgo: ['{ago} jour pour jour, vous écriviez {title}.'],
    monthAgo: ['Il y a un mois jour pour jour, vous écriviez {title}.'],
    lastWeek: ['La semaine dernière à la même heure, vous écriviez {title}.'],
    lastSeason: ['L’an dernier à la même période, vous écriviez {title}.'],
    random: ['Un ancien écrit revient en mémoire : {title}.']
  },
  close: {
    morning: ['Prenez votre temps aujourd’hui.', 'Bonne journée.'],
    day: ['Accordez-vous une courte pause.', 'Ménagez-vous pour le reste de la journée.'],
    evening: ['Bonne fin de soirée.', 'Cette journée est derrière vous.'],
    night: ['Dormez bien. À demain.', 'C’est bien assez pour aujourd’hui.']
  },
  words: {
    events: n => n === 1 ? '1 événement' : `${n} événements`, todos: n => n === 1 ? '1 tâche' : `${n} tâches`, count: n => n === 1 ? '1 entrée' : `${n} entrées`, week: n => n === 1 ? '1 entrée' : `${n} entrées`,
    streak: n => n === 1 ? '1 jour' : `${n} jours`, ago: n => n === 1 ? 'Il y a un an' : `Il y a ${n} ans`,
    wx: { sun: 'ciel dégagé', suncloud: 'quelques nuages', cloud: 'ciel couvert', rain: 'pluie', snow: 'neige', thunder: 'orages', fog: 'brouillard' }
  }
};
