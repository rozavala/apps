/* ================================================================
   ZS LANG — lang.js
   Puts the hub's own words (header, buttons, app card descriptions
   and tags) into the kid's language: 'es', 'en' or 'both'
   (see getKidLang in auth.js). App names stay as they are.

   An element with data-es="Spanish" keeps its markup text as the
   English; ZsLang.apply() writes the right one. Add data-sub to show
   'both' as Spanish with the English on a smaller line underneath
   (otherwise "Spanish · English" on one line).

   The app cards come from CARDS below, keyed by the card's href.
   Each entry: d = description [es, en], g = tag [es, en].
   ================================================================ */

var ZsLang = (function() {
  'use strict';

  var CARDS = {
    'patron-lancha.html':      { d: ['Prepara el examen teórico de Patrón de Lancha Deportiva (Chile): estudia y practica.', 'Get ready for the Chilean Patrón de Lancha Deportiva (recreational boat skipper) theory exam: study and practice.'], g: ['🌊 Náutica', '🌊 Boating'] },
    'little-maestro.html':     { d: ['Aprende a tocar piano con lecciones interactivas, canciones reales y desafíos divertidos.', 'Learn to play piano with interactive lessons, real songs, and fun challenges.'], g: ['🎼 Música', '🎼 Music'] },
    'math-galaxy.html':        { d: ['Domina la suma, la multiplicación y más en una aventura espacial.', 'Master addition, multiplication, and more in a space adventure.'], g: ['🚀 Matemáticas', '🚀 Math'] },
    'descubre-chile.html':     { d: ['Explora la fascinante historia de Chile con relatos y cuestionarios.', 'Explore Chile\'s amazing history through stories and quizzes.'], g: ['🧭 Historia', '🧭 History'] },
    'chess-quest.html':        { d: ['Domina el ajedrez desde lo básico y juega contra una IA amistosa.', 'Master chess from the basics and play against a friendly AI.'], g: ['⚔️ Estrategia', '⚔️ Strategy'] },
    'fe-explorador.html':      { d: ['Oraciones, santos y herencia católica de Chile.', 'Prayers, saints and the Catholic heritage of Chile.'], g: ['🙏 Fe y Valores', '🙏 Faith & Values'] },
    'guitar-jam.html':         { d: ['Toca tus primeros acordes y aprende canciones populares paso a paso.', 'Strum your first chords and learn popular songs step by step.'], g: ['🎵 Música', '🎵 Music'] },
    'art-studio.html':         { d: ['Pinta obras maestras y conoce a artistas famosos.', 'Paint masterpieces and learn about famous artists.'], g: ['✨ Creatividad', '✨ Creative'] },
    'sports-arena.html':       { d: ['Anota partidos, organiza torneos y registra tus actividades al aire libre.', 'Track matches, run tournaments, and log outdoor activities.'], g: ['💪 Aire libre', '💪 Outdoor'] },
    'move-quest.html':         { d: ['Entrenamientos guiados de siete minutos con imágenes, voz de entrenador y registro de pasos.', 'Guided seven-minute workouts with pictures, a coach voice and a step log.'], g: ['💪 Movimiento', '💪 Move'] },
    'world-cup.html':          { d: ['48 selecciones, 16 sedes, 104 partidos — y un torneo de pronósticos en familia.', '48 teams, 16 venues, 104 games — and a family bracket pool.'], g: ['⚽ Torneo', '⚽ Tournament'] },
    'lab-explorer.html':       { d: ['Mezcla colores, haz crecer plantas y descubre cómo funciona el mundo.', 'Mix colors, grow plants, and discover how the world works.'], g: ['🧪 Ciencia', '🧪 Science'] },
    'world-explorer.html':     { d: ['Recorre el mundo: aprende banderas, capitales y monumentos.', 'Travel the globe — learn flags, capitals, and landmarks.'], g: ['🧭 Geografía', '🧭 Geography'] },
    'world-atlas.html':        { d: ['Capitales, monedas y poblaciones de los 195 países.', 'Capitals, currencies and populations of all 195 countries.'], g: ['🧭 Geografía', '🧭 Geography'] },
    'story-explorer.html':     { d: ['Lee cuentos de aventuras y amplía tu vocabulario.', 'Read adventure tales and build your vocabulary.'], g: ['📖 Lectura', '📖 Reading'] },
    'quest-adventure.html':    { d: ['Explora un mapa del mundo: ¡tu progreso en cada app desbloquea nuevas regiones!', 'Explore a world map — your progress in every app unlocks new regions!'], g: ['🗺️ Aventura', '🗺️ Adventure'] },
    'guess-quest.html':        { d: ['20 Preguntas: ¡adivina animales, comidas y más!', '20 Questions — guess animals, foods, and more!'], g: ['🧠 Lógica', '🧠 Logic'] },
    'book-movie-check.html':   { d: ['Descubre si un libro o una película es adecuado para nuestra familia.', 'Find out if a book or movie is right for our family.'], g: ['📚 Guía de medios', '📚 Media Guide'] },
    'dictado.html':            { d: ['Escucha y escribe lo que oyes: reglas de ortografía en español e inglés.', 'Listen, then write what you hear: spelling rules in Spanish and English.'], g: ['✍️ Ortografía', '✍️ Spelling'] },
    'repaso.html':             { d: ['Repasa lo que se te escapó en otras apps: unos 5 minutos al día.', 'Go over what slipped by in other apps: about 5 minutes a day.'], g: ['🔁 Repaso', '🔁 Review'] },
    'trophy-room.html':        { d: ['Todas las insignias, rangos y logros que has ganado, en un solo lugar.', 'Every badge, rank and milestone you\'ve earned — all in one place.'], g: ['🏅 Logros', '🏅 Achievements'] },
    'money-master.html':       { d: ['Monedas, billetes y vuelto: practica con CLP y USD.', 'Coins, bills, and change-making — practice with CLP & USD.'], g: ['🪙 Dinero', '🪙 Money'] },
    'invest-quest.html':       { d: ['Invierte en empresas de práctica, sigue el mercado y aprende sobre riesgo, retorno y ROI.', 'Invest in real-style companies, ride the market, and learn risk, return & ROI.'], g: ['💹 Inversión', '💹 Investing'] },
    'banco.html':              { d: ['Tus ahorros de verdad: mira de dónde vino tu dinero y cómo crece.', 'Your real savings: see where your money came from and watch it grow.'], g: ['🐷 Mis ahorros', '🐷 My savings'] },
    'code-cadet.html':         { d: ['Mueve al rover con bloques. Aprende lógica paso a paso.', 'Move the rover with blocks. Learn logic step by step.'], g: ['💻 Lógica', '💻 Logic'] },
    'bible-explorer.html':     { d: ['Historias, versículos y los libros de la Sagrada Escritura.', 'Stories, verses and the books of Sacred Scripture.'], g: ['📜 Escritura', '📜 Scripture'] },
    'vocabulario-vivo.html':   { d: ['Aprende inglés y español por raíces latinas y griegas.', 'Learn English and Spanish through Latin and Greek roots.'], g: ['🌱 Vocabulario', '🌱 Vocabulary'] },
    'civics-lab.html':         { d: ['Cómo funciona el gobierno de Chile y otros sistemas del mundo.', 'How the government of Chile and other systems around the world work.'], g: ['🗳️ Cívica', '🗳️ Civics'] },
    'circuit-lab.html':        { d: ['Construye circuitos reales: enciende ampolletas, haz girar motores, toca timbres — 16 acertijos y construcción libre.', 'Build real circuits: light bulbs, spin motors, ring buzzers — 16 puzzles plus free build.'], g: ['🔌 Electricidad', '🔌 Electricity'] },
    'little-engineer.html':    { d: ['Diseña puentes sobre quebradas chilenas y pruébalos con física real.', 'Design bridges across Chilean gorges, then test them with real physics.'], g: ['🏗️ Ingeniería', '🏗️ Engineering'] },
    'mi-negocio.html':         { d: ['Maneja un puesto de verano en Chile: compra, fija precios y gana una ganancia real.', 'Run a summer street stand in Chile: buy, set prices, and earn a real profit.'], g: ['🧾 Negocios', '🧾 Business'] },
    'euclid-workshop.html':    { d: ['Construye geometría real solo con compás y regla — 18 construcciones clásicas.', 'Build real geometry with only a compass and a straightedge — 18 classic constructions.'], g: ['📏 Geometría', '📏 Geometry'] },
    'cocina-lab.html':         { d: ['Cocina recetas chilenas de verdad con un adulto y aprende matemáticas de cocina midiendo.', 'Cook real Chilean recipes with a grown-up and learn kitchen math by measuring.'], g: ['🍳 Cocina', '🍳 Cooking'] },
    'marinero.html':           { d: ['Anuda nudos de navegación reales, orienta con la brújula y lee boyas y banderas de señales.', 'Tie real sailing knots, steer by compass, and read buoys and signal flags.'], g: ['⚓ Marinería', '⚓ Seamanship'] },
    'naturaleza.html':         { d: ['Guía de campo de aves, árboles y animales de Chile — ¡y luego sal a encontrarlos!', 'Field guide to Chilean birds, trees and animals — then go outside and spot them!'], g: ['🌿 Naturaleza', '🌿 Nature'] },
    'mensajes-secretos.html':  { d: ['Descifra códigos con una rueda César, telégrafo Morse, pigpen y más — 19 misiones de espías.', 'Crack codes with a Caesar wheel, Morse telegraph, pigpen and more — 19 spy missions.'], g: ['🕵️ Códigos', '🕵️ Codes'] },
    'code-lab.html':           { d: ['Escribe código de verdad y mira cómo una tortuga lo dibuja: ciclos, funciones y 40 misiones.', 'Write real code and watch a turtle draw it: loops, functions and 40 missions.'], g: ['⌨️ Programación', '⌨️ Coding'] },
    'lector.html':             { d: ['Aprende a leer: letras y sonidos, sílabas, armar palabras y libros cortos que te leen — en español e inglés.', 'Learn to read: letter sounds, syllables, building words and short read-along books, in Spanish and English.'], g: ['📖 Lectura', '📖 Reading'] },
    'arbol-familiar.html':     { d: ['Conoce a tus abuelos y a toda la familia: el árbol, de dónde venimos y un juego de preguntas.', 'Meet your grandparents and the whole family: the tree, where we came from and a question game.'], g: ['🌳 Familia', '🌳 Family'] },
    'que-hora-es.html':        { d: ['Aprende a leer la hora en un reloj de madera de verdad: ajusta, lee, planifica tu día y el calendario.', 'Learn to tell time on a real wooden clock — set, read, plan your day and the calendar.'], g: ['⏰ Tiempo', '⏰ Time'] },
    'calculo-rapido.html':     { d: ['Gana al reloj con cálculo mental, estima como un ingeniero y convierte unidades.', 'Beat the clock with mental maths, estimate like an engineer and convert units.'], g: ['🧮 Cálculo', '🧮 Calculation'] }
  };

  function _lang() {
    return typeof getKidLang === 'function' ? getKidLang() : 'en';
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var _styled = false;
  function _style() {
    if (_styled) return;
    _styled = true;
    var st = document.createElement('style');
    st.textContent = '.zs-sub{display:block;margin-top:2px;font-size:.82em;font-weight:500;opacity:.72}';
    document.head.appendChild(st);
  }

  // block = true: for 'both', the English goes on its own smaller line.
  function _set(el, es, en, block) {
    var lang = _lang();
    if (lang === 'es') el.textContent = es;
    else if (lang === 'both') {
      if (block) { _style(); el.innerHTML = _esc(es) + '<span class="zs-sub">' + _esc(en) + '</span>'; }
      else el.textContent = es + ' · ' + en;
    } else el.textContent = en;
  }

  function apply(root) {
    root = root || document;
    var els = root.querySelectorAll('[data-es]');
    Array.prototype.forEach.call(els, function(el) {
      // The markup's own text is the English.
      if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent.trim());
      _set(el, el.getAttribute('data-es'), el.getAttribute('data-en'), el.hasAttribute('data-sub'));
    });
    var cards = root.querySelectorAll('a.app-card');
    Array.prototype.forEach.call(cards, function(card) {
      var c = CARDS[card.getAttribute('href')];
      if (!c) return;
      var d = card.querySelector('.card-desc');
      var g = card.querySelector('.card-tag');
      if (d) _set(d, c.d[0], c.d[1], true);
      if (g) _set(g, c.g[0], c.g[1], false);
    });
  }

  return { apply: apply, cards: CARDS };
})();
