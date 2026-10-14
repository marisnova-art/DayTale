/* Frases del relato (español). Neutro, trato de usted, cálido y sencillo, como mucho una figura por párrafo.
   'where' va seguido de una frase de 'air' cuya primera letra el motor pasa a minúscula. */
export default {
  greet: {
    morning: ['Buenos días, {name}.', 'Buenos días, {name}. ¿Durmió bien?', 'Empieza un nuevo día, {name}.', 'Qué gusto verle, {name}.',
      { if: { dow: 1 }, t: ['Empieza una nueva semana, {name}.'] }, { if: { dow: 5 }, t: ['Viernes por la mañana, {name}.'] }, { if: { dow: 0 }, t: ['Una mañana tranquila de domingo, {name}.'] }, { if: { dow: 6 }, t: ['Sábado por la mañana, {name}.'] }],
    day: ['Hola, {name}. Ya va por la mitad del día.', 'Buenas tardes, {name}.', '¿Ya almorzó, {name}?', 'Un momento de pausa, {name}.',
      { if: { dow: 3 }, t: ['Mitad de semana, {name}.'] }, { if: { dow: 0 }, t: ['Una tarde de domingo sin prisas, {name}.'] }, { if: { dow: 6 }, t: ['Una tarde de fin de semana, {name}.'] }],
    evening: ['Buenas tardes, {name}.', 'Buen trabajo hoy, {name}.', 'El día va terminando, {name}.', 'De vuelta por aquí, {name}.',
      { if: { dow: 5 }, t: ['Terminó la semana, {name}.'] }, { if: { dow: 0 }, t: ['La última tarde del fin de semana, {name}.'] }, { if: { dow: 1 }, t: ['El lunes ya pasó, {name}.'] }],
    night: ['Ya es tarde, {name}.', 'Una noche tranquila, {name}.', 'Buenas noches, {name}.', '¿Todavía despierto, {name}?',
      { if: { dow: 0 }, t: ['Mañana empieza una nueva semana, {name}.'] }, { if: { dow: 5 }, t: ['Viernes por la noche, {name}.'] }]
  },
  air: [
    { if: { wx: 'sun', tod: 'morning', light: true }, t: ['Una buena mañana para abrir un poco la ventana.', 'Un tiempo que invita a caminar con paso ligero.', 'Hay luz suficiente para despertar a cualquiera.'] },
    { if: { wx: 'sun', light: true }, t: ['El sol se muestra generoso hoy.', 'Buen tiempo para un paseo corto.', 'El cielo está alto y azul.', 'Un buen día para tender la ropa.'] },
    { if: { wx: 'sun', light: false }, t: ['El cielo está limpio; quizá se vean las estrellas.', 'Una noche sin nubes.', 'La luna se verá nítida esta noche.'] },
    { if: { wx: 'suncloud', light: true }, t: ['La luz del sol se cuela una y otra vez entre las nubes.', 'Ni frío ni calor, un día agradable.', 'Las nubes pasan despacio.'] },
    { if: { wx: 'suncloud', light: false }, t: ['La luna aparece y desaparece entre las nubes.', 'Nubes finas cruzan el cielo de la noche.'] },
    { if: { wx: 'cloud', light: true }, t: ['El sol se esconde, pero es un día tranquilo.', 'El cielo está bajo hoy.', 'Una luz suave, agradable a la vista.'] },
    { if: { wx: 'cloud', light: false }, t: ['Las nubes tapan la luna esta noche.', 'Las estrellas descansan detrás de las nubes.', 'Un cielo bajo y callado esta noche.'] },
    { if: { wx: 'rain' }, t: ['Con un paraguas a mano, el día será más sencillo.', 'La lluvia pone hoy la música de fondo.', 'El sonido de la lluvia vuelve más lentos los pensamientos.'] },
    { if: { wx: 'rain', light: false }, t: ['Buena noche para dormirse con el sonido de la lluvia.'] },
    { if: { wx: 'snow' }, t: ['Puede haber hielo en el camino, así que vaya despacio.', 'El mundo se vuelve hoy un poco más silencioso.', 'La nieve lo suaviza todo.'] },
    { if: { wx: 'thunder' }, t: ['Un buen día para quedarse bajo techo.', 'Quédese en un lugar cálido hasta que pase la tormenta.'] },
    { if: { wx: 'fog' }, t: ['Lo lejano se ve borroso, así que empiece por lo cercano.', 'Con niebla, basta con ir despacio.'] },
    { if: { cold: true }, t: ['Lleve una chaqueta abrigada.', 'Abríguese bien las manos.', 'Un día perfecto para una taza de té caliente.'], w: 2 },
    { if: { hot: true }, t: ['Recuerde beber agua.', 'Camine por la sombra si puede.', 'Descanse de vez en cuando en un lugar fresco.'], w: 2 },
    { if: { season: 'spring' }, t: ['Ya se nota un poco la primavera en el aire.', 'Algo está floreciendo en alguna parte.'] },
    { if: { season: 'spring', light: true }, t: ['El sol de primavera se ha vuelto más suave.'] },
    { if: { season: 'summer' }, t: ['El verano está en su punto.', 'El verde de afuera es cada vez más intenso.'] },
    { if: { season: 'summer', light: true }, t: ['Los días largos dan más espacio a todo.'] },
    { if: { season: 'summer', light: false }, t: ['El aire de la noche de verano se va refrescando.'] },
    { if: { season: 'autumn' }, t: ['El otoño empieza a notarse en la brisa.', 'Las hojas cambian de color poco a poco.'] },
    { if: { season: 'autumn', light: false }, t: ['Las noches de otoño se alargan.', 'Una noche para escuchar a los grillos.'] },
    { if: { season: 'winter' }, t: ['El aire frío ayuda a pensar con claridad.', 'Una estación para agradecer los lugares cálidos.'] },
    { if: { season: 'winter', light: false }, t: ['Las noches de invierno son largas; descanse sin prisa.'] }
  ],
  where: 'En {city} está {wx},',
  plan: {
    events1: ['Hoy tiene [event] {events}. No olvide {title} a las {time}.', 'Hoy hay [event] {events}: {title} a las {time}.'],
    eventsN: ['Hoy tiene [event] {events}. El primero es {title} a las {time}.', 'Hoy hay [event] {events}; empieza con {title} a las {time}.'],
    eventsPast: ['Todos los [event] eventos de hoy ya pasaron.', 'Los [event] eventos de hoy ya terminaron.'],
    todos: ['[todo] {todos} por hacer.', 'Aún tiene [todo] {todos} por hacer.', 'Hay [todo] {todos} esperando.'],
    todosAlso: ['También tiene [todo] {todos} por hacer.', 'Y quedan [todo] {todos}.'],
    todosDone: ['Completó todas las tareas [sparkles] Con eso basta por hoy.', 'Terminó todas las tareas [sparkles] El resto del tiempo es suyo.'],
    free: {
      morning: ['Hoy no tiene nada programado. Elija algo que le gustaría hacer.', 'Un día libre. Decida con calma cómo llenarlo.'],
      day: ['No tiene nada más programado. Puede tomarse un respiro.', 'La tarde está libre. Buen momento para algo que dejó pendiente.'],
      evening: ['No queda nada en la agenda. La tarde es suya.', 'La agenda de hoy terminó. Ahora es su tiempo.'],
      night: ['Por la mañana veremos juntos el día de mañana.', 'Todo lo de hoy está hecho. Ahora solo queda descansar.']
    }
  },
  stack: {
    first: ['Hoy es su [sparkles] primer día. Escriba una sola línea abajo y el relato comenzará.'],
    today1: ['Hoy escribió [note] {latest}.', 'Hoy guardó [note] {latest}.'],
    todayN: ['Hoy ha guardado [note] {count}. El más reciente es {latest}.', 'Hoy escribió [note] {count}. El último: {latest}.'],
    streak: ['[fire] Lleva {streak} seguidos escribiendo.', '[fire] {streak} sin saltarse ni uno.'],
    none: { evening: ['Todavía no ha escrito nada hoy.', 'La página de hoy sigue en blanco.'], night: ['Todavía no ha escrito nada hoy. Una línea breve es suficiente.', 'Una línea antes de dormir basta para recordar el día.'] },
    week: ['Esta semana ha guardado [note] {week}.', 'Esta semana reunió [note] {week}.']
  },
  recall: {
    anniversary: ['Hoy es [cake] {label}.'],
    yearsAgo: ['{ago}, un día como hoy, escribió {title}.'],
    monthAgo: ['Hace un mes, un día como hoy, escribió {title}.'],
    lastWeek: ['La semana pasada, por estas fechas, escribió {title}.'],
    lastSeason: ['El año pasado, por estas fechas, escribió {title}.'],
    random: ['Viene a la memoria {title}, algo que escribió una vez.', 'Vuelve un escrito antiguo: {title}.']
  },
  close: {
    morning: ['Tómese el día con calma.', 'Que tenga un buen día.', 'Hoy, a su propio ritmo.', 'Con hacer una cosa pequeña, ya es un buen día.'],
    day: ['Tómese un breve descanso.', 'Vaya con calma el resto del día.', 'Beba un vaso de agua y siga.', 'Paso a paso esta tarde.'],
    evening: ['Disfrute del resto de la tarde.', 'Ha llegado al final del día.', 'La tarde puede ser solo para usted.', 'Repase el día con calma.'],
    night: ['Que descanse. Hasta mañana.', 'Con eso basta por hoy.', 'Que pase una noche tranquila.', 'Lo de mañana, mañana.']
  },
  words: {
    events: n => n === 1 ? '1 evento' : `${n} eventos`, todos: n => n === 1 ? '1 tarea' : `${n} tareas`, count: n => n === 1 ? '1 registro' : `${n} registros`, week: n => n === 1 ? '1 registro' : `${n} registros`,
    streak: n => n === 1 ? '1 día' : `${n} días`, ago: n => n === 1 ? 'Hace un año' : `Hace ${n} años`,
    wx: { sun: 'despejado', suncloud: 'parcialmente nublado', cloud: 'nublado', rain: 'lloviendo', snow: 'nevando', thunder: 'tormentoso', fog: 'con niebla' }
  }
};
