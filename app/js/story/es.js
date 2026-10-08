/* Frases del relato (español). Neutro, trato de usted, cálido y sencillo, como mucho una figura por párrafo.
   'where' va seguido de una frase de 'air' cuya primera letra el motor pasa a minúscula. */
export default {
  greet: {
    morning: ['Buenos días, {name}.', 'Buenos días, {name}. ¿Durmió bien?'],
    day: ['Hola, {name}. Ya va por la mitad del día.', 'Buenas tardes, {name}.'],
    evening: ['Buenas tardes, {name}.', 'Buen trabajo hoy, {name}.'],
    night: ['Ya es tarde, {name}.', 'Una noche tranquila, {name}.']
  },
  air: [
    { if: { wx: 'sun', tod: 'morning' }, t: ['Una buena mañana para abrir un poco la ventana.', 'Un tiempo que invita a caminar con paso ligero.'] },
    { if: { wx: 'sun' }, t: ['El sol se muestra generoso hoy.', 'Buen tiempo para un paseo corto.'] },
    { if: { wx: 'suncloud' }, t: ['La luz del sol se cuela una y otra vez entre las nubes.'] },
    { if: { wx: 'cloud' }, t: ['El sol se esconde, pero es un día tranquilo.'] },
    { if: { wx: 'rain' }, t: ['Con un paraguas a mano, el día será más sencillo.', 'La lluvia pone hoy la música de fondo.'] },
    { if: { wx: 'snow' }, t: ['Puede haber hielo en el camino, así que vaya despacio.', 'El mundo se vuelve hoy un poco más silencioso.'] },
    { if: { wx: 'thunder' }, t: ['Un buen día para quedarse bajo techo.'] },
    { if: { wx: 'fog' }, t: ['Lo lejano se ve borroso, así que empiece por lo cercano.'] },
    { if: { cold: true }, t: ['Lleve una chaqueta abrigada.'], w: 2 },
    { if: { hot: true }, t: ['Recuerde beber agua.'], w: 2 },
    { if: { season: 'spring' }, t: ['Ya se nota un poco la primavera en el aire.'] },
    { if: { season: 'summer' }, t: ['Los días largos dan más espacio a todo.'] },
    { if: { season: 'autumn' }, t: ['El otoño empieza a notarse en la brisa.'] },
    { if: { season: 'winter' }, t: ['El aire frío ayuda a pensar con claridad.'] }
  ],
  where: 'En {city} está {wx},',
  plan: {
    events1: ['Hoy tiene [event] {events}. No olvide {title} a las {time}.'],
    eventsN: ['Hoy tiene [event] {events}. El primero es {title} a las {time}.'],
    eventsPast: ['Todos los [event] eventos de hoy ya pasaron.'],
    todos: ['[todo] {todos} por hacer.', 'Aún tiene [todo] {todos} por hacer.'],
    todosAlso: ['También tiene [todo] {todos} por hacer.'],
    todosDone: ['Completó todas las tareas [sparkles] Con eso basta por hoy.'],
    free: { morning: ['Hoy no tiene nada programado. Elija algo que le gustaría hacer.'], day: ['No tiene nada más programado. Puede tomarse un respiro.'], evening: ['No queda nada en la agenda. La tarde es suya.'], night: ['Por la mañana veremos juntos el día de mañana.'] }
  },
  stack: {
    first: ['Hoy es su [sparkles] primer día. Escriba una sola línea abajo y el relato comenzará.'],
    today1: ['Hoy escribió [note] {latest}.'],
    todayN: ['Hoy ha guardado [note] {count}. El más reciente es {latest}.'],
    streak: ['[fire] Lleva {streak} seguidos escribiendo.'],
    none: { evening: ['Todavía no ha escrito nada hoy.'], night: ['Todavía no ha escrito nada hoy. Una línea breve es suficiente.'] },
    week: ['Esta semana ha guardado [note] {week}.']
  },
  recall: {
    anniversary: ['Hoy es [cake] {label}.'],
    yearsAgo: ['{ago}, un día como hoy, escribió {title}.'],
    monthAgo: ['Hace un mes, un día como hoy, escribió {title}.'],
    lastWeek: ['La semana pasada, por estas fechas, escribió {title}.'],
    lastSeason: ['El año pasado, por estas fechas, escribió {title}.'],
    random: ['Viene a la memoria {title}, algo que escribió una vez.']
  },
  close: {
    morning: ['Tómese el día con calma.', 'Que tenga un buen día.'],
    day: ['Tómese un breve descanso.', 'Vaya con calma el resto del día.'],
    evening: ['Disfrute del resto de la tarde.', 'Ha llegado al final del día.'],
    night: ['Que descanse. Hasta mañana.', 'Con eso basta por hoy.']
  },
  words: {
    events: n => n === 1 ? '1 evento' : `${n} eventos`, todos: n => n === 1 ? '1 tarea' : `${n} tareas`, count: n => n === 1 ? '1 registro' : `${n} registros`, week: n => n === 1 ? '1 registro' : `${n} registros`,
    streak: n => n === 1 ? '1 día' : `${n} días`, ago: n => n === 1 ? 'Hace un año' : `Hace ${n} años`,
    wx: { sun: 'despejado', suncloud: 'parcialmente nublado', cloud: 'nublado', rain: 'lloviendo', snow: 'nevando', thunder: 'tormentoso', fog: 'con niebla' }
  }
};
