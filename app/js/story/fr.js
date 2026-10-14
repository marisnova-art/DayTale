/* Phrases du récit (français). Vouvoiement, ton simple et chaleureux, une figure de style au plus par paragraphe.
   La phrase « air » suit « where » (qui se termine par deux-points) : sa première lettre est mise en minuscule par le moteur. */
export default {
  greet: {
    morning: ['Bonjour, {name}.', 'Bonjour, {name}. Avez-vous bien dormi ?', 'Une nouvelle journée commence, {name}.', 'Ravi de vous revoir, {name}.',
      { if: { dow: 1 }, t: ['Une nouvelle semaine commence, {name}.'] }, { if: { dow: 5 }, t: ['Vendredi matin, {name}.'] }, { if: { dow: 0 }, t: ['Un dimanche matin tranquille, {name}.'] }, { if: { dow: 6 }, t: ['Samedi matin, {name}.'] }],
    day: ['Bonjour, {name}. La journée est déjà à moitié passée.', 'Bon après-midi, {name}.', 'Avez-vous déjeuné, {name} ?', 'Une petite pause, {name}.',
      { if: { dow: 3 }, t: ['Déjà le milieu de la semaine, {name}.'] }, { if: { dow: 0 }, t: ['Un dimanche après-midi sans hâte, {name}.'] }, { if: { dow: 6 }, t: ['Un après-midi de week-end, {name}.'] }],
    evening: ['Bonsoir, {name}.', 'Bravo pour cette journée, {name}.', 'La journée touche à sa fin, {name}.', 'Bon retour, {name}.',
      { if: { dow: 5 }, t: ['La semaine est terminée, {name}.'] }, { if: { dow: 0 }, t: ['Le dernier soir du week-end, {name}.'] }, { if: { dow: 1 }, t: ['Le lundi est passé, {name}.'] }],
    night: ['Il se fait tard, {name}.', 'La nuit est calme, {name}.', 'Encore debout, {name} ?', 'La nuit est avancée, {name}.',
      { if: { dow: 0 }, t: ['Une nouvelle semaine commence demain, {name}.'] }, { if: { dow: 5 }, t: ['Vendredi soir, {name}.'] }]
  },
  air: [
    { if: { wx: 'sun', tod: 'morning', light: true }, t: ['Une belle matinée pour entrouvrir la fenêtre.', 'Un temps qui rend le pas plus léger.', 'Assez de lumière pour réveiller n’importe qui.'] },
    { if: { wx: 'sun', light: true }, t: ['Le soleil est généreux aujourd’hui.', 'Un beau temps pour une courte promenade.', 'Le ciel est haut et bleu.', 'Un bon jour pour faire sécher le linge.'] },
    { if: { wx: 'sun', light: false }, t: ['Le ciel est dégagé, les étoiles seront peut-être visibles.', 'Une nuit sans nuages.', 'La lune devrait être nette ce soir.'] },
    { if: { wx: 'suncloud', light: true }, t: ['Le soleil se glisse entre les nuages.', 'Ni chaud ni froid, une journée agréable.', 'Les nuages passent lentement.'] },
    { if: { wx: 'suncloud', light: false }, t: ['La lune joue à cache-cache avec les nuages.', 'De fins nuages traversent le ciel de nuit.'] },
    { if: { wx: 'cloud', light: true }, t: ['Le soleil se cache, mais la journée est calme.', 'Le ciel est bas aujourd’hui.', 'Une lumière douce, reposante pour les yeux.'] },
    { if: { wx: 'cloud', light: false }, t: ['Les nuages cachent la lune ce soir.', 'Les étoiles se reposent derrière les nuages.', 'Un ciel bas et silencieux ce soir.'] },
    { if: { wx: 'rain' }, t: ['Prenez un parapluie, vous serez plus tranquille.', 'La pluie joue sa musique de fond aujourd’hui.', 'Le bruit de la pluie ralentit les pensées.'] },
    { if: { wx: 'rain', light: false }, t: ['Une bonne nuit pour s’endormir au son de la pluie.'] },
    { if: { wx: 'snow' }, t: ['Les trottoirs peuvent être glissants, allez-y doucement.', 'Le monde se fait un peu plus silencieux aujourd’hui.', 'La neige adoucit tout.'] },
    { if: { wx: 'thunder' }, t: ['Une bonne journée pour rester à l’intérieur.', 'Restez au chaud jusqu’à ce que l’orage passe.'] },
    { if: { wx: 'fog' }, t: ['Le lointain reste flou, commencez donc par ce qui est proche.', 'Dans le brouillard, il suffit d’aller doucement.'] },
    { if: { cold: true }, t: ['Prenez une veste chaude.', 'Gardez les mains au chaud.', 'Un temps à tasse de thé bien chaude.'], w: 2 },
    { if: { hot: true }, t: ['Pensez à boire de l’eau.', 'Marchez à l’ombre si vous le pouvez.', 'Faites des pauses au frais.'], w: 2 },
    { if: { season: 'spring' }, t: ['Il y a un air de printemps.', 'Quelque chose fleurit quelque part.'] },
    { if: { season: 'spring', light: true }, t: ['Le soleil de printemps s’est adouci.'] },
    { if: { season: 'summer' }, t: ['L’été bat son plein.', 'Le vert du dehors devient plus profond.'] },
    { if: { season: 'summer', light: true }, t: ['Les longues journées laissent du temps pour tout.'] },
    { if: { season: 'summer', light: false }, t: ['L’air de la nuit d’été se rafraîchit doucement.'] },
    { if: { season: 'autumn' }, t: ['La brise commence à sentir l’automne.', 'Les feuilles changent de couleur, peu à peu.'] },
    { if: { season: 'autumn', light: false }, t: ['Les nuits d’automne s’allongent.', 'Une nuit à écouter les grillons.'] },
    { if: { season: 'winter' }, t: ['L’air froid rend les idées plus claires.', 'Une saison où l’on apprécie les pièces chaudes.'] },
    { if: { season: 'winter', light: false }, t: ['Les nuits d’hiver sont longues, reposez-vous sans hâte.'] }
  ],
  where: 'À {city}, {wx} :',
  plan: {
    events1: ['Vous avez [event] {events} aujourd’hui. N’oubliez pas {title} à {time}.', 'Au programme aujourd’hui, [event] {events} : {title} à {time}.'],
    eventsN: ['Vous avez [event] {events} aujourd’hui. Le premier : {title} à {time}.', '[event] {events} aujourd’hui, en commençant par {title} à {time}.'],
    eventsPast: ['Tous les [event] événements de la journée sont passés.', 'Les [event] événements du jour sont terminés.'],
    todos: ['Il reste [todo] {todos}.', 'Encore [todo] {todos} à faire.', '[todo] {todos} vous attendent.'],
    todosAlso: ['Il reste aussi [todo] {todos}.', 'Et encore [todo] {todos}.'],
    todosDone: ['Toutes les tâches sont faites [sparkles] C’est bien assez pour aujourd’hui.', 'Tout est fait [sparkles] Le reste du temps est à vous.'],
    free: {
      morning: ['Rien n’est prévu aujourd’hui. Choisissez une chose que vous aimeriez faire.', 'Une journée libre. Prenez le temps de décider comment la remplir.'],
      day: ['Plus rien n’est prévu. Prenez le temps de souffler.', 'L’après-midi est libre. Un bon moment pour une chose remise à plus tard.'],
      evening: ['Plus rien au programme. La soirée est à vous.', 'Le programme du jour est terminé. Place à votre temps.'],
      night: ['Nous regarderons la journée de demain ensemble, au matin.', 'Tout est fait pour aujourd’hui. Il ne reste qu’à se reposer.']
    }
  },
  stack: {
    first: ['Aujourd’hui, c’est le [sparkles] premier jour. Écrivez une seule ligne ci-dessous et le récit commence.'],
    today1: ['Plus tôt, vous avez écrit [note] {latest}.', 'Aujourd’hui, vous avez gardé [note] {latest}.'],
    todayN: ['Vous avez ajouté [note] {count} aujourd’hui. La plus récente : {latest}.', '[note] {count} écrites aujourd’hui. La dernière : {latest}.'],
    streak: ['[fire] Cela fait {streak} de suite que vous écrivez.', '[fire] {streak} sans manquer un seul jour.'],
    none: { evening: ['Rien d’écrit pour l’instant aujourd’hui.', 'La page du jour est encore blanche.'], night: ['Rien d’écrit pour l’instant aujourd’hui. Une ligne courte suffit.', 'Une ligne avant de dormir suffit pour se souvenir de la journée.'] },
    week: ['Vous avez ajouté [note] {week} cette semaine.', '[note] {week} réunies cette semaine.']
  },
  recall: {
    anniversary: ['Aujourd’hui : [cake] {label}.'],
    yearsAgo: ['{ago} jour pour jour, vous écriviez {title}.'],
    monthAgo: ['Il y a un mois jour pour jour, vous écriviez {title}.'],
    lastWeek: ['La semaine dernière à la même heure, vous écriviez {title}.'],
    lastSeason: ['L’an dernier à la même période, vous écriviez {title}.'],
    random: ['Un ancien écrit revient en mémoire : {title}.', 'Une vieille note refait surface : {title}.']
  },
  close: {
    morning: ['Prenez votre temps aujourd’hui.', 'Bonne journée.', 'Aujourd’hui, à votre rythme.', 'Une petite chose accomplie fait une bonne journée.'],
    day: ['Accordez-vous une courte pause.', 'Ménagez-vous pour le reste de la journée.', 'Un verre d’eau, et on continue.', 'Pas à pas cet après-midi.'],
    evening: ['Bonne fin de soirée.', 'Cette journée est derrière vous.', 'La soirée peut être rien qu’à vous.', 'Repensez doucement à la journée.'],
    night: ['Dormez bien. À demain.', 'C’est bien assez pour aujourd’hui.', 'Passez une nuit paisible.', 'Demain s’occupera de demain.']
  },
  words: {
    events: n => n === 1 ? '1 événement' : `${n} événements`, todos: n => n === 1 ? '1 tâche' : `${n} tâches`, count: n => n === 1 ? '1 entrée' : `${n} entrées`, week: n => n === 1 ? '1 entrée' : `${n} entrées`,
    streak: n => n === 1 ? '1 jour' : `${n} jours`, ago: n => n === 1 ? 'Il y a un an' : `Il y a ${n} ans`,
    wx: { sun: 'ciel dégagé', suncloud: 'quelques nuages', cloud: 'ciel couvert', rain: 'pluie', snow: 'neige', thunder: 'orages', fog: 'brouillard' }
  }
};
