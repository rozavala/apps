/* ================================================================
   LÓGICA — content (js/logica-data.js)
   Names and words for the logic grids, the islanders, the nonogram
   pictures and the "clear thinking" questions. Every text is a pair
   [Spanish, English]. Examples are everyday ones only (sports, snacks,
   games, school, home): no news, politics or social issues.
   ================================================================ */

var LogicaData = (function () {
  'use strict';

  // ---------- logic grids ----------
  var GRID_PEOPLE = ['Ana', 'Tomás', 'Sofía', 'Diego', 'Pía', 'Nico', 'Coni', 'Mateo'];
  var GRID_CATS = {
    pet: {
      label: ['Mascota', 'Pet'],
      verb: { es: 'tiene', en: 'has', enNeg: 'doesn’t have' },
      items: [
        { id: 'dog', a: ['el perro', 'the dog'], s: ['Perro', 'Dog'] },
        { id: 'cat', a: ['el gato', 'the cat'], s: ['Gato', 'Cat'] },
        { id: 'fish', a: ['el pez', 'the fish'], s: ['Pez', 'Fish'] },
        { id: 'rabbit', a: ['el conejo', 'the rabbit'], s: ['Conejo', 'Rabbit'] },
        { id: 'bird', a: ['el loro', 'the parrot'], s: ['Loro', 'Parrot'] }
      ]
    },
    snack: {
      label: ['Colación', 'Snack'],
      verb: { es: 'trajo', en: 'brought', enNeg: 'didn’t bring' },
      items: [
        { id: 'empanada', a: ['las empanadas', 'the empanadas'], s: ['Empanadas', 'Empanadas'] },
        { id: 'fruit', a: ['la fruta', 'the fruit'], s: ['Fruta', 'Fruit'] },
        { id: 'sandwich', a: ['el sándwich', 'the sandwich'], s: ['Sándwich', 'Sandwich'] },
        { id: 'cookies', a: ['las galletas', 'the cookies'], s: ['Galletas', 'Cookies'] },
        { id: 'yogurt', a: ['el yogur', 'the yogurt'], s: ['Yogur', 'Yogurt'] }
      ]
    },
    sport: {
      label: ['Deporte', 'Sport'],
      verb: { es: 'juega', en: 'plays', enNeg: 'doesn’t play' },
      items: [
        { id: 'soccer', a: ['al fútbol', 'soccer'], s: ['Fútbol', 'Soccer'] },
        { id: 'tennis', a: ['al tenis', 'tennis'], s: ['Tenis', 'Tennis'] },
        { id: 'basket', a: ['al básquetbol', 'basketball'], s: ['Básquetbol', 'Basketball'] },
        { id: 'chess', a: ['al ajedrez', 'chess'], s: ['Ajedrez', 'Chess'] },
        { id: 'volley', a: ['al vóleibol', 'volleyball'], s: ['Vóleibol', 'Volleyball'] }
      ]
    }
  };

  // ---------- truth-tellers and fibbers ----------
  var ISLANDERS = ['Tito', 'Pía', 'Nico', 'Coni', 'Rafa', 'Maite', 'Beni', 'Joaco'];

  // ---------- balance scales ----------
  var BAL_OBJECTS = [
    { id: 'apple', n: ['manzana', 'apple'], un: 'una' },
    { id: 'pear', n: ['pera', 'pear'], un: 'una' },
    { id: 'orange', n: ['naranja', 'orange'], un: 'una' },
    { id: 'banana', n: ['plátano', 'banana'], un: 'un' },
    { id: 'grapes', n: ['racimo de uvas', 'bunch of grapes'], un: 'un' }
  ];

  // ---------- nonograms ('#' = filled) ----------
  var NONOGRAMS = [
    // 5 x 5
    { id: 'heart5', name: ['Corazón', 'Heart'], color: '#E0435A', rows: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
    { id: 'house5', name: ['Casa', 'House'], color: '#C2410C', rows: ['..#..', '.###.', '#####', '##.##', '##.##'] },
    { id: 'tree5', name: ['Árbol', 'Tree'], color: '#2F8F46', rows: ['..#..', '.###.', '#####', '..#..', '.###.'] },
    { id: 'boat5', name: ['Velero', 'Sailboat'], color: '#2563EB', rows: ['.#...', '.##..', '.###.', '#####', '.###.'] },
    { id: 'cross5', name: ['Cruz', 'Cross'], color: '#8B5A2B', rows: ['..#..', '#####', '..#..', '..#..', '.###.'] },
    { id: 'star5', name: ['Estrella', 'Star'], color: '#E6A817', rows: ['..#..', '#####', '.###.', '.#.#.', '#...#'] },
    { id: 'cup5', name: ['Taza', 'Mug'], color: '#0E7490', rows: ['####.', '#####', '####.', '####.', '.##..'] },
    // 7 x 7
    { id: 'umbrella7', name: ['Paraguas', 'Umbrella'], color: '#7C3AED', rows: ['...#...', '.#####.', '#######', '...#...', '...#...', '.#.#...', '..##...'] },
    { id: 'cat7', name: ['Gato', 'Cat'], color: '#6B7280', rows: ['#.....#', '##...##', '#######', '#.###.#', '#######', '.#####.', '..###..'] },
    { id: 'apple7', name: ['Manzana', 'Apple'], color: '#D62D3A', rows: ['...#...', '..#....', '.##.##.', '#######', '#######', '.#####.', '..#.#..'] },
    { id: 'sail7', name: ['Barco', 'Ship'], color: '#1D4ED8', rows: ['...#...', '...##..', '...###.', '...####', '...#...', '#######', '.#####.'] },
    { id: 'mushroom7', name: ['Hongo', 'Mushroom'], color: '#C0392B', rows: ['..###..', '.#####.', '##.#.##', '#######', '..#.#..', '..#.#..', '..###..'] },
    { id: 'bell7', name: ['Campana', 'Bell'], color: '#C9A227', rows: ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '#######', '...#...'] },
    // 10 x 10
    { id: 'anchor10', name: ['Ancla', 'Anchor'], color: '#1E3A8A', rows: ['....##....', '...#..#...', '...#..#...', '....##....', '..######..', '....##....', '#...##...#', '##..##..##', '.##.##.##.', '..######..'] },
    { id: 'heart10', name: ['Corazón grande', 'Big heart'], color: '#E0435A', rows: ['.##....##.', '####..####', '##########', '##########', '##########', '.########.', '..######..', '...####...', '....##....', '..........'] },
    { id: 'tree10', name: ['Pino', 'Pine tree'], color: '#2F7D45', rows: ['....##....', '...####...', '..######..', '.########.', '..######..', '.########.', '##########', '....##....', '....##....', '..######..'] },
    { id: 'sailboat10', name: ['Velero grande', 'Big sailboat'], color: '#2563EB', rows: ['....#.....', '....##....', '....###...', '....####..', '....#####.', '....#.....', '##########', '.########.', '..######..', '..........'] },
    { id: 'mug10', name: ['Taza de leche', 'Mug of milk'], color: '#0E7490', rows: ['.#..#..#..', '..#..#..#.', '.#..#..#..', '#########.', '########.#', '########.#', '#########.', '.#######..', '..#####...', '##########'] },
    { id: 'fish10', name: ['Pez', 'Fish'], color: '#F08A24', rows: ['..........', '....####..', '#..######.', '##.##.####', '##########', '##.#######', '#..######.', '....####..', '..........', '..........'] }
  ];

  // ---------- clear thinking ----------
  var FO = [['Hecho', 'Fact'], ['Opinión', 'Opinion']];
  var WHY_FACT = ['Se puede comprobar: contando, midiendo o buscándolo en una fuente confiable.', 'You can check it: by counting, measuring or looking it up in a good source.'];
  var WHY_OP = ['Dice lo que alguien piensa o siente. Otra persona puede pensar distinto.', 'It says what someone thinks or feels. Someone else can think differently.'];
  function fo(id, es, en, isFact, why) {
    return { id: id, q: [es, en], o: FO, a: isFact ? 0 : 1, why: why || (isFact ? WHY_FACT : WHY_OP) };
  }
  var THINK_FO = [
    fo('fo1', 'Un partido de fútbol tiene dos tiempos de 45 minutos.', 'A soccer match has two halves of 45 minutes.', 1),
    fo('fo2', 'Las empanadas de pino son la comida más rica del mundo.', 'Beef empanadas are the tastiest food in the world.', 0),
    fo('fo3', 'Una semana tiene siete días.', 'A week has seven days.', 1),
    fo('fo4', 'El ajedrez es más entretenido que las damas.', 'Chess is more fun than checkers.', 0),
    fo('fo5', 'A nivel del mar, el agua hierve a 100 °C.', 'At sea level, water boils at 100 °C.', 1),
    fo('fo6', 'El azul es el color más bonito.', 'Blue is the prettiest colour.', 0),
    fo('fo7', 'En un partido de básquetbol, cada equipo tiene cinco jugadores en la cancha.', 'In a basketball game, each team has five players on the court.', 1),
    fo('fo8', 'Los lunes son los días más aburridos.', 'Mondays are the most boring days.', 0),
    fo('fo9', 'Una araña tiene ocho patas.', 'A spider has eight legs.', 1),
    fo('fo10', 'Las vacaciones de verano son demasiado cortas.', 'Summer holidays are too short.', 0),
    fo('fo11', 'Santiago es la capital de Chile.', 'Santiago is the capital of Chile.', 1),
    fo('fo12', 'Los perros son mejores mascotas que los gatos.', 'Dogs are better pets than cats.', 0),
    fo('fo13', 'Un año tiene doce meses.', 'A year has twelve months.', 1),
    fo('fo14', 'Las frutillas son más ricas con crema.', 'Strawberries taste better with cream.', 0),
    fo('fo15', 'Un triángulo tiene tres lados.', 'A triangle has three sides.', 1),
    fo('fo16', 'Leer es más divertido que ver televisión.', 'Reading is more fun than watching TV.', 0),
    fo('fo17', 'En una cancha de fútbol juegan once jugadores por equipo.', 'A soccer team has eleven players on the field.', 1),
    fo('fo18', 'El recreo debería durar una hora.', 'Recess should last an hour.', 0),
    fo('fo19', 'El helado de chocolate es el mejor helado.', 'Chocolate is the best ice cream.', 0),
    fo('fo20', 'Un pulpo tiene ocho brazos.', 'An octopus has eight arms.', 1),
    fo('fo21', 'Hay que hacer las tareas apenas llegas del colegio.', 'You should do your homework as soon as you get home from school.', 0),
    fo('fo22', 'La cordillera de los Andes está al este de Santiago.', 'The Andes mountains are east of Santiago.', 1)
  ];

  // "What would you need to know to be sure?" — o[a] is the right one.
  function need(id, q, o, a, why) { return { id: id, q: q, o: o, a: a, why: why }; }
  var THINK_NEED = [
    need('nd1', ['Tomás dice: «Soy el más rápido de mi curso». ¿Qué necesitarías saber para estar seguro?', 'Tomás says: "I’m the fastest in my class." What would you need to know to be sure?'],
      [['Los tiempos de todo el curso en la misma carrera', 'Everyone’s time in the same race'], ['Qué zapatillas usa Tomás', 'Which sneakers Tomás wears'], ['Si a Tomás le gusta correr', 'Whether Tomás likes running']], 0,
      ['Para saber quién es el más rápido hay que comparar a todos de la misma manera.', 'To know who is fastest, you have to compare everyone in the same way.']),
    need('nd2', ['Una caja de jugo dice: «¡Ahora con más fruta!». ¿Qué necesitarías saber?', 'A juice box says: "Now with more fruit!" What would you need to know?'],
      [['Más fruta que qué, y cuánta tenía antes', 'More fruit than what, and how much it had before'], ['El color de la caja', 'The colour of the box'], ['Si trae bombilla', 'Whether it comes with a straw']], 0,
      ['«Más» siempre necesita una comparación: ¿más que qué?', '"More" always needs a comparison: more than what?']),
    need('nd3', ['Sofía dice que llovió todos los días de la semana. ¿Qué necesitarías saber?', 'Sofía says it rained every day this week. What would you need to know?'],
      [['Lo que dice el registro del tiempo de cada día', 'What the weather record says for each day'], ['Si a Sofía le gusta la lluvia', 'Whether Sofía likes rain'], ['De qué color es su paraguas', 'What colour her umbrella is']], 0,
      ['Un registro de cada día lo puede comprobar.', 'A record for each day can check it.']),
    need('nd4', ['Diego dice que su equipo ganó más partidos que el tuyo esta temporada. ¿Qué necesitarías saber?', 'Diego says his team won more games than yours this season. What would you need to know?'],
      [['Los resultados de los partidos de los dos equipos', 'The results of both teams’ games'], ['Los colores de su camiseta', 'The colours of his team’s shirt'], ['Cuántos amigos tiene Diego', 'How many friends Diego has']], 0,
      ['Contar los partidos ganados de cada equipo lo resuelve.', 'Counting each team’s wins settles it.']),
    need('nd5', ['Tu amiga dice que su mochila nueva pesa más que la antigua. ¿Cómo lo sabrías?', 'Your friend says her new backpack is heavier than her old one. How would you know?'],
      [['Pesar las dos mochilas vacías en la misma balanza', 'Weigh both empty backpacks on the same scale'], ['Ver cuál es más bonita', 'See which one is prettier'], ['Preguntar cuál costó más', 'Ask which one cost more']], 0,
      ['Vacías y en la misma balanza: así la comparación es justa.', 'Empty and on the same scale: that makes it a fair comparison.']),
    need('nd6', ['Un aviso dice: «Nueve de cada diez niños prefieren este cereal». ¿Qué necesitarías saber?', 'An ad says: "Nine out of ten kids prefer this cereal." What would you need to know?'],
      [['A cuántos niños les preguntaron, y con qué otros cereales lo compararon', 'How many kids were asked, and which other cereals it was compared with'], ['El dibujo de la caja', 'The picture on the box'], ['Si el cereal es redondo', 'Whether the cereal is round']], 0,
      ['Si preguntaron solo a diez niños, o lo compararon con un cereal sin sabor, el número dice poco.', 'If they asked only ten kids, or compared it with a plain cereal, the number tells you little.']),
    need('nd7', ['Pía dice que su planta creció más porque le habla todos los días. ¿Qué necesitarías saber?', 'Pía says her plant grew more because she talks to it every day. What would you need to know?'],
      [['Cómo crece una planta igual, con la misma agua y luz, a la que nadie le habla', 'How the same kind of plant grows, with the same water and light, when nobody talks to it'], ['Qué le dice Pía', 'What Pía says to it'], ['El color de la maceta', 'The colour of the pot']], 0,
      ['Para saber si algo es la causa, compara con un caso igual en todo menos en eso.', 'To know if something is the cause, compare with a case that is the same in every way except that one.']),
    need('nd8', ['Nico dice: «El bus siempre llega tarde». ¿Qué necesitarías saber?', 'Nico says: "The bus is always late." What would you need to know?'],
      [['A qué hora llegó el bus en muchos días distintos', 'What time the bus came on many different days'], ['De qué color es el bus', 'What colour the bus is'], ['Si a Nico le gusta el bus', 'Whether Nico likes the bus']], 0,
      ['«Siempre» se comprueba mirando muchos días, no uno solo.', '"Always" is checked by looking at many days, not just one.']),
    need('nd9', ['Seguiste la receta y el queque sigue crudo después de 30 minutos. ¿Qué te gustaría saber primero?', 'You followed the recipe and the cake is still raw after 30 minutes. What would you like to know first?'],
      [['Si el horno estaba a la temperatura que pedía la receta', 'Whether the oven was at the temperature the recipe asked for'], ['De qué color era el bol', 'What colour the bowl was'], ['Quién se comió el último pedazo ayer', 'Who ate the last slice yesterday']], 0,
      ['Busca primero lo que de verdad cambia el resultado.', 'Look first for what really changes the result.']),
    need('nd10', ['Coni dice que la cancha del colegio mide 100 metros de largo. ¿Cómo lo comprobarías?', 'Coni says the school field is 100 metres long. How would you check?'],
      [['Medirla con una huincha o mirar el plano del colegio', 'Measure it with a tape or look at the school’s plan'], ['Contar cuántos goles se hicieron ayer', 'Count how many goals were scored yesterday'], ['Ver si el pasto está verde', 'See whether the grass is green']], 0,
      ['Una medida se comprueba midiendo.', 'A length is checked by measuring.']),
    need('nd11', ['Un compañero dice que un juego nuevo es «el mejor juego del mundo». ¿Qué le preguntarías?', 'A classmate says a new game is "the best game ever." What would you ask?'],
      [['Qué entiende por «mejor» y con qué juegos lo comparó', 'What he means by "best" and which games he compared it with'], ['Cuánto pesa la caja', 'How much the box weighs'], ['A qué hora lo compró', 'What time he bought it']], 0,
      ['«Mejor» es una opinión; preguntar por qué ayuda a entenderla.', '"Best" is an opinion; asking why helps you understand it.']),
    need('nd12', ['Tu hermano dice que el perro se comió las galletas. ¿Qué necesitarías saber?', 'Your brother says the dog ate the cookies. What would you need to know?'],
      [['Si alguien lo vio, o si hay migas cerca del perro', 'Whether anyone saw it, or whether there are crumbs near the dog'], ['De qué sabor eran las galletas', 'What flavour the cookies were'], ['Cómo se llama el perro', 'What the dog’s name is']], 0,
      ['Las pistas que se pueden ver ayudan a saber qué pasó.', 'Clues you can see help you know what happened.'])
  ];

  // "Spot the weak step": each argument has one weak step (k).
  var FLAWS = {
    everyone: ['Que muchos lo hagan no lo hace bueno ni verdadero', 'Lots of people doing it doesn’t make it good or true'],
    one: ['Un solo ejemplo no prueba que siempre pase', 'One example doesn’t prove it always happens'],
    after: ['Que algo pase después no prueba que lo haya causado', 'Happening afterwards doesn’t prove it was the cause'],
    two: ['Hay más de dos opciones', 'There are more than two choices'],
    person: ['Critica a la persona en vez de su razón', 'It attacks the person instead of the reason'],
    famous: ['Ser famoso en una cosa no hace experto en otra', 'Being famous for one thing doesn’t make someone an expert in another'],
    circle: ['Repite la idea como si fuera su propia razón', 'It repeats the idea as its own reason']
  };
  var FLAW_WHY = {
    everyone: ['Hay que mirar las razones, no cuánta gente lo hace.', 'Look at the reasons, not at how many people do it.'],
    one: ['Para decir «siempre» o «todos» se necesitan muchos casos.', 'To say "always" or "all" you need many cases.'],
    after: ['Dos cosas pueden pasar una tras otra por casualidad.', 'Two things can happen one after the other by chance.'],
    two: ['Casi siempre hay otras opciones además de las dos que se nombran.', 'There are almost always other choices besides the two that are named.'],
    person: ['Una idea es buena o mala por sus razones, no por quién la dice.', 'An idea is good or bad because of its reasons, not because of who says it.'],
    famous: ['Para saber de algo, pregunta a quien lo estudia o lo comprueba.', 'To learn about something, ask someone who studies or tests it.'],
    circle: ['Decir lo mismo con otras palabras no es una razón.', 'Saying the same thing in other words is not a reason.']
  };
  function arg(id, k, es, en) { return { id: id, k: k, q: [es, en] }; }
  var ARGS = [
    arg('ar1', 'everyone', 'Todos mis compañeros comen dulces en el recreo, así que comer dulces todos los días debe ser sano.', 'All my classmates eat candy at recess, so eating candy every day must be healthy.'),
    arg('ar2', 'one', 'Jugué una vez al básquetbol y perdí. Siempre voy a perder al básquetbol.', 'I played basketball once and lost. I will always lose at basketball.'),
    arg('ar3', 'after', 'Me puse los calcetines rojos y nuestro equipo ganó. Los calcetines rojos nos hacen ganar.', 'I wore my red socks and our team won. Red socks make us win.'),
    arg('ar4', 'two', 'O vamos a la playa, o nos quedamos todo el día aburridos en la casa.', 'Either we go to the beach, or we stay bored at home all day.'),
    arg('ar5', 'person', 'Martín dice que conviene repasar las tablas, pero Martín es malo para el fútbol, así que no le hagas caso.', 'Martín says it helps to practise times tables, but Martín is bad at soccer, so don’t listen to him.'),
    arg('ar6', 'famous', 'Un futbolista famoso dice que esta pasta de dientes es la mejor, así que tiene que ser la mejor.', 'A famous soccer player says this toothpaste is the best, so it must be the best.'),
    arg('ar7', 'circle', 'Este libro es aburrido porque no es entretenido.', 'This book is boring because it isn’t fun.'),
    arg('ar8', 'one', 'Probé un mango y estaba ácido. Todos los mangos son ácidos.', 'I tried a mango and it was sour. All mangoes are sour.'),
    arg('ar9', 'everyone', 'Muchos niños se acuestan tarde, así que no importa si yo también lo hago.', 'Lots of kids go to bed late, so it doesn’t matter if I do too.'),
    arg('ar10', 'after', 'Llegó el perro nuevo y después empezó a llover más. El perro trae la lluvia.', 'The new dog arrived and then it rained more. The dog brings the rain.'),
    arg('ar11', 'two', 'Si no te gusta el fútbol, entonces no te gusta ningún deporte.', 'If you don’t like soccer, then you don’t like any sport.'),
    arg('ar12', 'person', 'No le creas a Sofía que la Tierra gira alrededor del Sol: ella siempre llega tarde.', 'Don’t believe Sofía that the Earth goes around the Sun: she is always late.'),
    arg('ar13', 'famous', 'Una actriz famosa dice que este jugo te hace mejor para las matemáticas, así que es verdad.', 'A famous actress says this juice makes you better at maths, so it’s true.'),
    arg('ar14', 'circle', 'El equipo azul es el mejor porque ningún equipo es mejor que él.', 'The blue team is the best because no team is better than it.'),
    arg('ar15', 'one', 'Ayer el bus llegó tarde. Ese bus siempre llega tarde.', 'Yesterday the bus was late. That bus is always late.'),
    arg('ar16', 'after', 'Tomé sopa y después me dio hipo. La sopa da hipo.', 'I had soup and then I got hiccups. Soup gives you hiccups.'),
    arg('ar17', 'everyone', 'Todos en el curso dicen que el examen va a ser fácil, así que no necesito estudiar.', 'Everyone in class says the test will be easy, so I don’t need to study.'),
    arg('ar18', 'two', 'O eres el mejor del equipo, o no sirves para jugar.', 'Either you are the best on the team, or you are no good at playing.')
  ];
  var FLAW_KEYS = Object.keys(FLAWS);
  // Each argument gets its own flaw plus the next three (in a fixed
  // order) as the wrong options; the round shuffles them.
  var THINK_ARG = ARGS.map(function (x) {
    var i = FLAW_KEYS.indexOf(x.k), keys = [x.k];
    for (var j = 1; keys.length < 4; j++) keys.push(FLAW_KEYS[(i + j * 2) % FLAW_KEYS.length]);
    return { id: x.id, k: x.k, q: x.q, o: keys.map(function (k) { return FLAWS[k]; }), a: 0, why: FLAW_WHY[x.k] };
  });

  var THINK = { fo: THINK_FO, need: THINK_NEED, arg: THINK_ARG };

  return {
    GRID_PEOPLE: GRID_PEOPLE, GRID_CATS: GRID_CATS, ISLANDERS: ISLANDERS, BAL_OBJECTS: BAL_OBJECTS,
    NONOGRAMS: NONOGRAMS, THINK: THINK, FLAWS: FLAWS
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LogicaData;
