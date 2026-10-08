/* Questions d’écriture de l’accueil (français), par moment de la journée. Mêmes groupes que Q.en. */
export default {
  morning: { base: ['Quelle journée aimeriez-vous passer aujourd’hui ?', 'Quelle est la chose à ne pas oublier aujourd’hui ?', 'Une pensée vous est-elle venue au réveil ?', 'Qu’attendez-vous avec plaisir aujourd’hui ?', 'Avez-vous bien dormi cette nuit ?'],
    rain: ['Il pleut. Une idée vous est-elle venue en prenant votre parapluie ?'], sun: ['Une matinée claire. Où aimeriez-vous marcher aujourd’hui ?'], cold: ['Une matinée fraîche. Comment commencer la journée au chaud ?'],
    dow1: ['Une nouvelle semaine commence. Que voudriez-vous accomplir cette semaine ?'], dow5: ['Vendredi matin. Que reste-t-il à faire cette semaine ?'], weekend: ['Un matin de week-end tranquille. Qu’aimeriez-vous faire ?'] },
  day: { base: ['Qu’avez-vous en tête en ce moment ?', 'Qu’avez-vous mangé à midi ?', 'Un moment de la matinée à retenir ?', 'Quelque chose à noter avant de l’oublier ?', 'Que reste-t-il pour cet après-midi ?'],
    done: ['Vous avez déjà terminé {n} tâches. Quelle est la suite ?'], event: ['Il reste un événement aujourd’hui. Quelque chose à préparer ?'], item: ['Vous venez de ranger quelque chose ? Notez où il se trouve.'],
    rain: ['Un après-midi pluvieux. Des pensées en regardant dehors ?'], sun: ['Un après-midi ensoleillé. Avez-vous pris un moment pour vous reposer ?'] },
  evening: { base: ['Comment s’est passée votre journée ?', 'Quel a été le meilleur moment de la journée ?', 'Avec qui avez-vous parlé aujourd’hui ?', 'Avez-vous appris quelque chose aujourd’hui ?', 'Si la journée tenait en une ligne, laquelle serait-ce ?'],
    allDone: ['Toutes les tâches sont faites. Un mot pour vous-même ?'], someLeft: ['Le reste peut attendre demain. Qu’avez-vous le mieux réussi aujourd’hui ?'], streak: ['Voilà {n} jours que vous écrivez. Vous continuez aujourd’hui ?'],
    dow1: ['Le lundi est passé. Comment était-il ?'], dow5: ['Vendredi, la semaine s’achève. Comment s’est-elle passée ?'], weekend: ['Un soir de week-end. Que vous a apporté ce repos aujourd’hui ?'] },
  night: { base: ['Quelque chose à garder avant de dormir ?', 'Quelle scène de la journée vous reste en tête ?', 'Envers qui avez-vous ressenti de la gratitude aujourd’hui ?', 'Un mot pour vous-même, demain ?', 'Quelle note donneriez-vous à cette journée ?'],
    yearAgo: ['Il y a un an jour pour jour, vous écriviez {title}. Et aujourd’hui ?'], anniversary: ['Aujourd’hui, c’est {label}. Comment s’est passée la journée ?'], monthEnd: ['Le mois touche à sa fin. Qu’en retenez-vous le plus ?'],
    empty: ['Rien d’écrit pour l’instant aujourd’hui. Une ligne courte, peut-être ?'], gap: ['Quelques jours ont passé. Une chose à noter sur cette période ?'] }
};
