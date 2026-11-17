/* ================================================================
   EXAMEN Y VIRTUDES — content (js/examen-data.js)
   Everything the kid reads: the four steps, the picture choices for
   each step, the ten virtues (each with a saint who is already in
   Fe Explorador, by id) and the closing prayers (by id: the texts
   themselves are read from FeManager.PRAYERS in js/fe-explorador.js,
   so they are always exactly the ones Fe Explorador shows).

   Every string is [Spanish, English].
   ================================================================ */

var ExamenData = (function() {
  'use strict';

  // ── The ten virtues ────────────────────────────────────────────
  // saint: an id in FeManager.SAINTS. why: one factual line about how
  // that saint lived the virtue (from the saint's own story).
  var VIRTUES = [
    { id: 'paciencia', color: '#2f7a9e',
      name: ['Paciencia', 'Patience'],
      little: ['Saber esperar sin enojarme.', 'Waiting without getting cross.'],
      desc: ['Es saber esperar con calma, y seguir intentándolo cuando algo cuesta.', 'Waiting calmly, and trying again when something is hard.'],
      saint: 'monica',
      why: ['Santa Mónica rezó durante muchos años por su hijo Agustín, sin rendirse. Él llegó a ser San Agustín.', 'Saint Monica prayed for her son Augustine for many years and never gave up. He became Saint Augustine.'],
      ideas: [
        ['Esperar mi turno para hablar o jugar.', 'Wait for my turn to talk or play.'],
        ['Contar hasta diez antes de reclamar.', 'Count to ten before I complain.'],
        ['Volver a intentar algo difícil, con calma.', 'Try something hard again, calmly.']
      ] },
    { id: 'amabilidad', color: '#d0587e',
      name: ['Amabilidad', 'Kindness'],
      little: ['Tratar bien a los demás.', 'Being nice to others.'],
      desc: ['Es tratar a los demás con cariño: con palabras buenas, una sonrisa y ayuda.', 'Treating others with care: good words, a smile and a helping hand.'],
      saint: 'juan_bosco',
      why: ['San Juan Bosco recibía a los niños con alegría, les enseñaba oficios y jugaba con ellos.', 'Saint John Bosco welcomed children with joy, taught them trades and played games with them.'],
      ideas: [
        ['Decir algo bonito a mi hermano o hermana.', 'Say something nice to my brother or sister.'],
        ['Invitar a jugar a alguien que está solo.', 'Ask someone who is alone to play.'],
        ['Decir "por favor" y "gracias".', 'Say "please" and "thank you".']
      ] },
    { id: 'compartir', color: '#c77d12',
      name: ['Compartir', 'Sharing'],
      little: ['Compartir lo que tengo.', 'Sharing what I have.'],
      desc: ['Es compartir lo que tengo, mi tiempo y mis cosas, con alegría.', 'Sharing what I have, my time and my things, gladly.'],
      saint: 'alberto_hurtado',
      why: ['San Alberto Hurtado fundó el Hogar de Cristo en Santiago para dar casa y comida a los más pobres.', 'Saint Alberto Hurtado founded the Hogar de Cristo in Santiago to give the poorest a home and food.'],
      ideas: [
        ['Compartir un juguete o mi colación.', 'Share a toy or my snack.'],
        ['Dejar que otro elija primero.', 'Let someone else choose first.'],
        ['Ayudar en casa sin que me lo pidan.', 'Help at home without being asked.']
      ] },
    { id: 'honestidad', color: '#3a7d44',
      name: ['Honestidad', 'Honesty'],
      little: ['Decir siempre la verdad.', 'Always telling the truth.'],
      desc: ['Es decir la verdad, también cuando cuesta, y no quedarme con lo que no es mío.', 'Telling the truth even when it is hard, and not keeping what is not mine.'],
      saint: 'bernardita',
      why: ['A Santa Bernardita le preguntaron muchas veces qué había visto en Lourdes, y siempre contó lo mismo, con sencillez.', 'Saint Bernadette was asked many times what she had seen at Lourdes, and she always told it the same way, simply.'],
      ideas: [
        ['Decir la verdad aunque me equivoque.', 'Tell the truth even when I made a mistake.'],
        ['Devolver lo que no es mío.', 'Give back what is not mine.'],
        ['Jugar limpio, sin trampas.', 'Play fair, with no cheating.']
      ] },
    { id: 'valentia', color: '#b23a3a',
      name: ['Valentía', 'Courage'],
      little: ['Hacer lo correcto aunque dé miedo.', 'Doing the right thing even when I am scared.'],
      desc: ['Es hacer lo correcto aunque me dé miedo o vergüenza.', 'Doing what is right even when I feel scared or shy.'],
      saint: 'jorge',
      why: ['San Jorge fue un soldado romano que no dejó su fe. La tradición lo pinta venciendo a un dragón.', 'Saint George was a Roman soldier who kept his faith. Tradition paints him defeating a dragon.'],
      ideas: [
        ['Probar algo nuevo.', 'Try something new.'],
        ['Pedir perdón primero.', 'Be the first to say sorry.'],
        ['Levantar la mano en clase.', 'Put my hand up in class.']
      ] },
    { id: 'gratitud', color: '#d08a1c',
      name: ['Gratitud', 'Gratitude'],
      little: ['Dar las gracias.', 'Saying thank you.'],
      desc: ['Es darme cuenta de lo bueno que tengo y dar las gracias a Dios y a los demás.', 'Noticing the good things I have and thanking God and other people.'],
      saint: 'francisco',
      why: ['San Francisco de Asís escribió el Cántico de las Criaturas, que alaba a Dios por el sol, la luna, el agua y la tierra.', 'Saint Francis of Assisi wrote the Canticle of the Creatures, which praises God for the sun, the moon, water and the earth.'],
      ideas: [
        ['Dar las gracias por la comida.', 'Say thank you for the food.'],
        ['Hacer un dibujo de agradecimiento.', 'Make a thank-you drawing.'],
        ['Decirle a mamá o papá algo que me gustó del día.', 'Tell Mum or Dad something I liked about the day.']
      ] },
    { id: 'obediencia', color: '#5b5fb8',
      name: ['Obediencia', 'Obedience'],
      little: ['Hacer caso a la primera.', 'Listening the first time.'],
      desc: ['Es escuchar a mis papás y profesores y hacer lo que me piden, a la primera y de buena gana.', 'Listening to my parents and teachers and doing what they ask, the first time and willingly.'],
      saint: 'jose',
      why: ['Según el Evangelio, cuando un ángel le habló en sueños, San José se levantó e hizo lo que Dios le pedía.', 'In the Gospel, when an angel spoke to Saint Joseph in a dream, he got up and did what God asked.'],
      ideas: [
        ['Ir a la mesa cuando me llaman.', 'Come to the table when I am called.'],
        ['Lavarme los dientes sin que me lo repitan.', 'Brush my teeth without being told twice.'],
        ['Apagar la pantalla cuando se acaba el tiempo.', 'Turn off the screen when the time is up.']
      ] },
    { id: 'humildad', color: '#7a6a4f',
      name: ['Humildad', 'Humility'],
      little: ['No creerme más que otros.', 'Not thinking I am better than others.'],
      desc: ['Es no creerme más que los demás, aceptar ayuda y alegrarme cuando a otro le va bien.', 'Not thinking I am better than others, accepting help, and being glad when someone else does well.'],
      saint: 'martin_porres',
      why: ['San Martín de Porres era llamado "el santo de la escoba": hacía los trabajos más sencillos con alegría.', 'Saint Martin de Porres was called "the saint of the broom": he did the simplest jobs gladly.'],
      ideas: [
        ['Felicitar a alguien que ganó.', 'Congratulate someone who won.'],
        ['Pedir ayuda cuando la necesito.', 'Ask for help when I need it.'],
        ['Hacer un trabajo sencillo sin quejarme.', 'Do a simple job without grumbling.']
      ] },
    { id: 'diligencia', color: '#4d7a2a',
      name: ['Diligencia', 'Diligence'],
      little: ['Hacer bien mis tareas.', 'Doing my jobs well.'],
      desc: ['Es hacer mis tareas bien y hasta el final, sin dejarlas para después.', 'Doing my jobs well and to the end, without leaving them for later.'],
      saint: 'benito',
      why: ['San Benito enseñó a sus monjes "Ora et labora": reza y trabaja.', 'Saint Benedict taught his monks "Ora et labora": pray and work.'],
      ideas: [
        ['Terminar mi tarea antes de jugar.', 'Finish my homework before playing.'],
        ['Ordenar mi pieza.', 'Tidy my room.'],
        ['Hacer algo con cuidado, sin apurarme.', 'Do something carefully, without rushing.']
      ] },
    { id: 'dominio', color: '#2e6b6b',
      name: ['Dominio propio', 'Self-control'],
      little: ['Calmarme cuando me enojo.', 'Calming down when I am cross.'],
      desc: ['Es mandar yo sobre mi enojo y mis ganas: respirar, calmarme y elegir bien.', 'Being the boss of my temper and my wants: breathe, calm down and choose well.'],
      saint: 'teresa_andes',
      why: ['Santa Teresa de los Andes contó en su diario que de niña tenía mal genio, y que con la ayuda de Dios aprendió a dominarlo.', 'Saint Teresa of the Andes wrote in her diary that she had a temper as a girl, and that with God\'s help she learned to control it.'],
      ideas: [
        ['Respirar hondo tres veces cuando me enojo.', 'Take three deep breaths when I am cross.'],
        ['Esperar al postre sin pedirlo antes.', 'Wait for pudding without asking early.'],
        ['Hablar despacio en vez de gritar.', 'Speak softly instead of shouting.']
      ] }
  ];

  // ── Picture choices for steps 1 to 3 ───────────────────────────
  // icon: a picture in js/examen-art.js. Step 3 items point to the
  // virtue that helps with them, so step 4 can suggest it.
  var THANKS = [
    { id: 'familia',   icon: 'family',  t: ['Mi familia', 'My family'] },
    { id: 'comida',    icon: 'food',    t: ['La comida', 'Food'] },
    { id: 'casa',      icon: 'home',    t: ['Mi casa', 'My home'] },
    { id: 'amigos',    icon: 'friends', t: ['Mis amigos', 'My friends'] },
    { id: 'naturaleza', icon: 'nature', t: ['La naturaleza', 'Nature'] },
    { id: 'mascota',   icon: 'pet',     t: ['Los animales', 'Animals'] },
    { id: 'salud',     icon: 'health',  t: ['Estar sano', 'Being healthy'] },
    { id: 'colegio',   icon: 'school',  t: ['Aprender', 'Learning'] },
    { id: 'juegos',    icon: 'toys',    t: ['Poder jugar', 'Playing'] },
    { id: 'iglesia',   icon: 'church',  t: ['Jesús y la Iglesia', 'Jesus and the Church'] }
  ];

  var HAPPY = [
    { id: 'jugar',     icon: 'play',    t: ['Jugué', 'I played'] },
    { id: 'aprender',  icon: 'book',    t: ['Aprendí algo', 'I learned something'] },
    { id: 'ayudar',    icon: 'help',    t: ['Ayudé a alguien', 'I helped someone'] },
    { id: 'abrazo',    icon: 'hug',     t: ['Estuve con mi familia', 'I was with my family'] },
    { id: 'deporte',   icon: 'ball',    t: ['Hice deporte', 'I did sport'] },
    { id: 'musica',    icon: 'music',   t: ['Hice música', 'I made music'] },
    { id: 'dibujar',   icon: 'art',     t: ['Dibujé o pinté', 'I drew or painted'] },
    { id: 'afuera',    icon: 'outside', t: ['Salí afuera', 'I went outside'] },
    { id: 'logro',     icon: 'star',    t: ['Me salió algo difícil', 'I did something hard'] },
    { id: 'rezar',     icon: 'pray',    t: ['Recé', 'I prayed'] }
  ];

  var BETTER = [
    { id: 'turno',     icon: 'wait',    virtue: 'paciencia',   t: ['Esperar mi turno', 'Wait for my turn'] },
    { id: 'compartir', icon: 'share',   virtue: 'compartir', t: ['Compartir', 'Share'] },
    { id: 'escuchar',  icon: 'listen',  virtue: 'obediencia',  t: ['Hacer caso a la primera', 'Listen the first time'] },
    { id: 'palabras',  icon: 'words',   virtue: 'amabilidad',  t: ['Usar palabras amables', 'Use kind words'] },
    { id: 'verdad',    icon: 'truth',   virtue: 'honestidad',  t: ['Decir la verdad', 'Tell the truth'] },
    { id: 'calma',     icon: 'calm',    virtue: 'dominio',     t: ['Calmarme', 'Calm down'] },
    { id: 'ordenar',   icon: 'tidy',    virtue: 'diligencia',  t: ['Ordenar mis cosas', 'Tidy my things'] },
    { id: 'perdon',    icon: 'sorry',   virtue: 'humildad',    t: ['Pedir perdón', 'Say sorry'] },
    { id: 'valor',     icon: 'brave',   virtue: 'valentia',    t: ['Atreverme', 'Be brave'] },
    { id: 'gracias',   icon: 'thanks',  virtue: 'gratitud',    t: ['Dar las gracias', 'Say thank you'] }
  ];

  // ── The four steps ─────────────────────────────────────────────
  var STEPS = [
    { id: 'thanks', list: 'THANKS',
      title: ['Gracias, Dios, por…', 'Thank you, God, for…'],
      little: ['¿Por qué le das gracias a Dios hoy? Toca los dibujos.', 'What do you thank God for today? Tap the pictures.'],
      ask: ['Piensa en tu día. ¿Qué cosas buenas te regaló Dios hoy?', 'Think about your day. What good things did God give you today?'],
      write: ['Gracias, Dios, por…', 'Thank you, God, for…'] },
    { id: 'happy', list: 'HAPPY',
      title: ['Hoy estuve feliz cuando…', 'Today I was happy when…'],
      little: ['¿Cuándo estuviste feliz hoy?', 'When were you happy today?'],
      ask: ['¿Qué momento del día te alegró más?', 'Which moment of the day made you happiest?'],
      write: ['Hoy estuve feliz cuando…', 'Today I was happy when…'] },
    { id: 'better', list: 'BETTER',
      title: ['Algo que puedo hacer mejor…', 'Something I could do better…'],
      little: ['¿Qué puedes hacer mejor mañana? Dios siempre nos ayuda.', 'What can you do better tomorrow? God always helps us.'],
      ask: ['Todos podemos mejorar algo. Dios nos quiere siempre y nos ayuda a crecer.', 'Everyone can do something better. God always loves us and helps us grow.'],
      write: ['Mañana quiero…', 'Tomorrow I want to…'],
      none: ['Hoy no se me ocurre nada', 'Nothing comes to mind today'] },
    { id: 'virtue',
      title: ['Mañana voy a practicar…', 'Tomorrow I\'ll practise…'],
      little: ['Elige una virtud para mañana.', 'Choose a virtue for tomorrow.'],
      ask: ['Elige una virtud. Mañana la practicas, con la ayuda de su santo.', 'Choose one virtue. Tomorrow you practise it, with its saint to help.'] }
  ];

  // The closing prayer: ids in FeManager.PRAYERS (js/fe-explorador.js).
  var PRAYERS = ['padrenuestro', 'avemaria', 'angelguarda'];

  // San Ignacio de Loyola taught this prayer (the examen).
  var IGNATIUS = { saint: 'ignacio_loyola',
    t: ['San Ignacio de Loyola enseñó esta oración: al final del día, mirar el día con Dios, darle gracias y pedirle ayuda para mañana.',
        'Saint Ignatius of Loyola taught this prayer: at the end of the day, look back at the day with God, thank Him and ask His help for tomorrow.'] };

  // How the kid answers "did you get to practise it?" the next evening.
  // Every answer is fine; "not yet" is never counted against anyone.
  var DID = [
    { id: 'yes',    t: ['¡Sí!', 'Yes!'],               icon: 'star' },
    { id: 'little', t: ['Un poquito', 'A little'],     icon: 'sprout' },
    { id: 'notyet', t: ['Todavía no', 'Not yet'],      icon: 'moon' }
  ];

  var _byId = {};
  VIRTUES.forEach(function(v) { _byId[v.id] = v; });
  function virtue(id) { return _byId[id] || null; }

  function list(name) {
    return name === 'THANKS' ? THANKS : name === 'HAPPY' ? HAPPY : name === 'BETTER' ? BETTER : [];
  }
  function item(listName, id) {
    var l = list(listName);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  return {
    VIRTUES: VIRTUES, THANKS: THANKS, HAPPY: HAPPY, BETTER: BETTER, STEPS: STEPS,
    PRAYERS: PRAYERS, IGNATIUS: IGNATIUS, DID: DID,
    virtue: virtue, list: list, item: item
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ExamenData;
