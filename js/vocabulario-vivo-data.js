/* ================================================================
   VOCABULARIO VIVO — extra data (v2)
   Hand-written, no network. Exposes one global: VocabularioVivoData

   ETYMA     root id → the Latin / Greek word it comes from
   STEMS     root id → spellings the root takes inside EN/ES words
             (used to highlight the root and to check cognates)
   ICON      root id → which drawn illustration to show
   SENTENCES "spot the root" sentences; *word* marks the target
   FRIENDS   true cognates and false friends (EN ↔ ES)

   ROOTS itself stays in js/vocabulario-vivo.js (the progress catalog
   builder reads it from there).
   ================================================================ */

var VocabularioVivoData = (function() {
  'use strict';

  // g = gloss (meaning of the original word)
  var ETYMA = {
    aqua:   { orig: 'aqua',        g: { en: 'water', es: 'agua' } },
    terra:  { orig: 'terra',       g: { en: 'earth, land', es: 'tierra' } },
    bene:   { orig: 'bene',        g: { en: 'well', es: 'bien' } },
    mal:    { orig: 'malus · male', g: { en: 'bad · badly', es: 'malo · mal' } },
    scrib:  { orig: 'scribere',    g: { en: 'to write', es: 'escribir' } },
    port:   { orig: 'portare',     g: { en: 'to carry', es: 'llevar' } },
    dict:   { orig: 'dicere, dictum', g: { en: 'to say', es: 'decir' } },
    spect:  { orig: 'spectare',    g: { en: 'to look at, watch', es: 'mirar, observar' } },
    vid:    { orig: 'videre',      g: { en: 'to see', es: 'ver' } },
    aud:    { orig: 'audire',      g: { en: 'to hear', es: 'oír' } },
    cred:   { orig: 'credere',     g: { en: 'to believe, trust', es: 'creer, confiar' } },
    cent:   { orig: 'centum',      g: { en: 'a hundred', es: 'cien' } },
    mille:  { orig: 'mille',       g: { en: 'a thousand', es: 'mil' } },
    mort:   { orig: 'mors, mortis', g: { en: 'death', es: 'muerte' } },
    viv:    { orig: 'vivere',      g: { en: 'to live', es: 'vivir' } },
    ped:    { orig: 'pes, pedis',  g: { en: 'foot', es: 'pie' } },
    man:    { orig: 'manus',       g: { en: 'hand', es: 'mano' } },
    luc:    { orig: 'lux, lucis',  g: { en: 'light', es: 'luz' } },
    sol:    { orig: 'sol',         g: { en: 'sun', es: 'sol' } },
    luna:   { orig: 'luna',        g: { en: 'moon', es: 'luna' } },
    bio:    { orig: 'βίος', tr: 'bíos',     g: { en: 'life', es: 'vida' } },
    geo:    { orig: 'γῆ', tr: 'gê',         g: { en: 'earth, land', es: 'tierra' } },
    hydro:  { orig: 'ὕδωρ', tr: 'hýdōr',    g: { en: 'water', es: 'agua' } },
    tele:   { orig: 'τῆλε', tr: 'têle',     g: { en: 'far off', es: 'lejos' } },
    micro:  { orig: 'μικρός', tr: 'mikrós', g: { en: 'small', es: 'pequeño' } },
    macro:  { orig: 'μακρός', tr: 'makrós', g: { en: 'long, large', es: 'largo, grande' } },
    chrono: { orig: 'χρόνος', tr: 'khrónos', g: { en: 'time', es: 'tiempo' } },
    photo:  { orig: 'φῶς, φωτός', tr: 'phôs, phōtós', g: { en: 'light', es: 'luz' } },
    astro:  { orig: 'ἄστρον', tr: 'ástron', g: { en: 'star', es: 'estrella' } },
    graph:  { orig: 'γράφειν', tr: 'gráphein', g: { en: 'to write, to draw', es: 'escribir, dibujar' } },
    flect:  { orig: 'flectere',    g: { en: 'to bend', es: 'doblar' } },
    rupt:   { orig: 'rumpere, ruptum', g: { en: 'to break', es: 'romper' } },
    struct: { orig: 'struere, structum', g: { en: 'to build, to pile up', es: 'construir, apilar' } },
    tract:  { orig: 'trahere, tractum', g: { en: 'to pull, drag', es: 'tirar, arrastrar' } },
    vent:   { orig: 'venire, ventum', g: { en: 'to come', es: 'venir' } },
    miss:   { orig: 'mittere, missum', g: { en: 'to send', es: 'enviar' } },
    sent:   { orig: 'sentire, sensum', g: { en: 'to feel', es: 'sentir' } },
    pos:    { orig: 'ponere, positum', g: { en: 'to put, place', es: 'poner, colocar' } },
    jur:    { orig: 'ius, iuris · iurare', g: { en: 'law · to swear an oath', es: 'derecho · jurar' } },
    urb:    { orig: 'urbs, urbis', g: { en: 'city', es: 'ciudad' } },
    nav:    { orig: 'navis',       g: { en: 'ship', es: 'nave, barco' } },
    dom:    { orig: 'domus · dominus', g: { en: 'house · master', es: 'casa · dueño' } },
    reg:    { orig: 'regere · rex, regis', g: { en: 'to rule · king', es: 'gobernar · rey' } },
    sol_alone: { orig: 'solus',    g: { en: 'alone', es: 'solo' } },
    cap:    { orig: 'capere, captum', g: { en: 'to take, seize', es: 'tomar, agarrar' } },
    phon:   { orig: 'φωνή', tr: 'phōnḗ',    g: { en: 'sound, voice', es: 'sonido, voz' } },
    therm:  { orig: 'θερμός', tr: 'thermós', g: { en: 'hot', es: 'caliente' } },
    psych:  { orig: 'ψυχή', tr: 'psykhḗ',   g: { en: 'breath, soul, mind', es: 'aliento, alma, mente' } },
    philo:  { orig: 'φίλος', tr: 'phílos',  g: { en: 'loving, friend', es: 'que ama, amigo' } },
    poly:   { orig: 'πολύς', tr: 'polýs',   g: { en: 'much, many', es: 'mucho, muchos' } },
    anim:   { orig: 'anima',       g: { en: 'breath, soul', es: 'aliento, alma' } },
    ver:    { orig: 'verus',       g: { en: 'true', es: 'verdadero' } },
    fer:    { orig: 'ferre',       g: { en: 'to carry, bear', es: 'llevar, portar' } },
    vor:    { orig: 'vorare',      g: { en: 'to swallow, devour', es: 'tragar, devorar' } },
    ten:    { orig: 'tenere',      g: { en: 'to hold', es: 'tener, sostener' } },
    fort:   { orig: 'fortis',      g: { en: 'strong', es: 'fuerte' } },
    leg:    { orig: 'lex, legis · legere', g: { en: 'law · to read', es: 'ley · leer' } },
    vis:    { orig: 'videre, visum', g: { en: 'to see · seen', es: 'ver · visto' } },
    morph:  { orig: 'μορφή', tr: 'morphḗ',  g: { en: 'shape, form', es: 'forma' } },
    path:   { orig: 'πάθος', tr: 'páthos',  g: { en: 'feeling, suffering', es: 'sentimiento, sufrimiento' } },
    crat:   { orig: 'κράτος', tr: 'krátos', g: { en: 'power, rule', es: 'poder, gobierno' } },
    arch:   { orig: 'ἀρχή · ἀρχαῖος', tr: 'arkhḗ · arkhaîos', g: { en: 'beginning, rule · ancient', es: 'comienzo, mando · antiguo' } },
    scope:  { orig: 'σκοπεῖν', tr: 'skopeîn', g: { en: 'to look at, examine', es: 'mirar, examinar' } },
    derm:   { orig: 'δέρμα', tr: 'dérma',   g: { en: 'skin', es: 'piel' } },
    cycl:   { orig: 'κύκλος', tr: 'kýklos', g: { en: 'circle, wheel', es: 'círculo, rueda' } },
    polis:  { orig: 'πόλις', tr: 'pólis',   g: { en: 'city', es: 'ciudad' } },
    form:   { orig: 'forma',       g: { en: 'shape', es: 'forma' } },
    uni:    { orig: 'unus',        g: { en: 'one', es: 'uno' } },
    ann:    { orig: 'annus',       g: { en: 'year', es: 'año' } },
    ject:   { orig: 'iacere, iactum', g: { en: 'to throw', es: 'lanzar' } },
    meter:  { orig: 'μέτρον', tr: 'métron', g: { en: 'measure', es: 'medida' } },
    log:    { orig: 'λόγος', tr: 'lógos',   g: { en: 'word, reason', es: 'palabra, razón' } }
  };

  // Spellings of each root inside real words, most specific first.
  // Compared without accents and in lower case.
  var STEMS = {
    aqua: ['aqua', 'aque', 'acua', 'acue', 'agua'], terra: ['terr'], bene: ['bene', 'bend'],
    mal: ['mal'], scrib: ['script', 'scrib', 'scrip', 'escrit', 'escrib', 'scrit', 'crib'], port: ['port'],
    dict: ['dicc', 'dict', 'dic', 'dec'], spect: ['spect', 'spec'], vid: ['vid', 'vis'], aud: ['aud'],
    cred: ['cred', 'crei'], cent: ['cent'], mille: ['mill', 'mil'], mort: ['mort'], viv: ['viv'],
    ped: ['ped'], man: ['manu', 'man'], luc: ['luc', 'lum'], sol: ['sol'], luna: ['luna', 'lun'],
    bio: ['bio'], geo: ['geo'], hydro: ['hydr', 'hidr'], tele: ['tele'], micro: ['micro'],
    macro: ['macro'], chrono: ['chron', 'cron'], photo: ['photo', 'foto', 'phot'],
    astro: ['astro', 'aster', 'astr'], graph: ['graph', 'graf'], flect: ['flect', 'flex', 'flej'],
    rupt: ['rupt', 'rump'], struct: ['struct', 'struc', 'strui'], tract: ['tract', 'trac', 'trae'],
    vent: ['vent', 'ven'], miss: ['miss', 'mis', 'mit'], sent: ['sent', 'sens'], pos: ['pos', 'pon'],
    jur: ['jur', 'jus'], urb: ['urb'], nav: ['nav'], dom: ['dom'], reg: ['reg'], sol_alone: ['sol'],
    cap: ['capt', 'cap', 'cept', 'cep'], phon: ['phon', 'fon'], therm: ['therm', 'term'],
    psych: ['psych', 'psic', 'psiq'], philo: ['phil', 'fil'], poly: ['poly', 'poli'], anim: ['anim'],
    ver: ['ver'], fer: ['fer'], vor: ['vor'], ten: ['tain', 'ten'], fort: ['fort', 'fuer'],
    leg: ['leg', 'ley'], vis: ['vis'], morph: ['morph', 'morf'], path: ['path', 'pat'], crat: ['crat'],
    arch: ['arch', 'arc', 'arq'], scope: ['scop'], derm: ['derm'], cycl: ['cycl', 'cicl'],
    polis: ['polis', 'poli', 'pol'], form: ['form'], uni: ['uni'], ann: ['ann', 'anu', 'ani', 'ana'],
    ject: ['ject', 'yect'], meter: ['meter', 'metr', 'met'], log: ['log']
  };

  var ICON = {
    aqua: 'water', hydro: 'water', terra: 'earth', geo: 'earth', bio: 'sprout', viv: 'sprout',
    sol: 'sun', luna: 'moon', astro: 'star', photo: 'bulb', luc: 'candle', ped: 'foot', man: 'hand',
    cap: 'hand', nav: 'ship', urb: 'city', polis: 'city', dom: 'house', vid: 'eye', vis: 'eye',
    spect: 'eye', scope: 'lens', tele: 'far', micro: 'microbe', macro: 'mountain', chrono: 'hourglass',
    graph: 'quill', scrib: 'quill', dict: 'speech', aud: 'ear', phon: 'sound', port: 'crate', fer: 'crate',
    therm: 'thermo', cycl: 'wheel', meter: 'ruler', struct: 'bricks', philo: 'heart', reg: 'crown',
    fort: 'tower', miss: 'envelope', ann: 'calendar', ject: 'throw', flect: 'bend', rupt: 'break',
    tract: 'pull', form: 'shapes', morph: 'morph', uni: 'numI', cent: 'numC', mille: 'numM',
    poly: 'dots', vor: 'plate', jur: 'scales'
  };

  // Spot-the-root sentences. *word* = the target. Each sentence is plain
  // and factual. The kid taps the word that carries the root.
  var SENTENCES = [
    { root: 'aqua',  en: 'The fish swim in a big *aquarium* at school.', es: 'Los peces nadan en un gran *acuario* del colegio.' },
    { root: 'terra', en: 'The jeep crossed rocky *terrain* in the desert.', es: 'El jeep cruzó un *terreno* rocoso en el desierto.' },
    { root: 'port',  en: 'We took a *portable* radio to the beach.', es: 'Llevamos una radio *portátil* a la playa.' },
    { root: 'vid',   en: 'The *video* shows a condor flying over the mountains.', es: 'El *video* muestra un cóndor volando sobre los cerros.' },
    { root: 'aud',   en: 'The *audience* clapped after the concert.', es: 'La *audiencia* aplaudió después del concierto.' },
    { root: 'sol',   en: 'Grandpa put *solar* panels on the roof.', es: 'El abuelo puso paneles *solares* en el techo.' },
    { root: 'luna',  en: 'The astronauts brought *lunar* rocks back to Earth.', es: 'Los astronautas trajeron rocas *lunares* a la Tierra.' },
    { root: 'bio',   en: 'In *biology* class we looked at leaves.', es: 'En la clase de *biología* miramos hojas.' },
    { root: 'geo',   en: '*Geography* tells us where the rivers are.', es: 'La *geografía* nos dice dónde están los ríos.' },
    { root: 'tele',  en: 'Grandpa looked at Saturn through a *telescope*.', es: 'El abuelo miró Saturno con un *telescopio*.' },
    { root: 'micro', en: 'A *microscope* makes tiny cells look big.', es: 'Un *microscopio* hace que las células pequeñas se vean grandes.' },
    { root: 'astro', en: 'The *astronaut* floated inside the space station.', es: 'El *astronauta* flotó dentro de la estación espacial.' },
    { root: 'photo', en: 'Mom took a *photograph* of the volcano.', es: 'Mamá sacó una *fotografía* del volcán.' },
    { root: 'phon',  en: 'The orchestra played a *symphony* by Beethoven.', es: 'La orquesta tocó una *sinfonía* de Beethoven.' },
    { root: 'therm', en: 'The *thermometer* showed thirty degrees.', es: 'El *termómetro* marcaba treinta grados.' },
    { root: 'ped',   en: 'She pushed the bike *pedals* hard up the hill.', es: 'Ella empujó fuerte los *pedales* en la subida.' },
    { root: 'man',   en: 'The *manual* explains how to build the shelf.', es: 'El *manual* explica cómo armar el estante.' },
    { root: 'nav',   en: 'Sailors *navigate* by the stars.', es: 'Los marineros *navegan* guiándose por las estrellas.' },
    { root: 'uni',   en: 'A *unicorn* is an animal from old legends.', es: 'El *unicornio* es un animal de leyendas antiguas.' },
    { root: 'dict',  en: 'The *dictionary* has thousands of words.', es: 'El *diccionario* tiene miles de palabras.' },
    { root: 'scrib', en: 'The monk copied the *manuscript* by hand.', es: 'El monje copió el *manuscrito* a mano.' },
    { root: 'spect', en: 'The *spectators* cheered in the stadium.', es: 'Los *espectadores* gritaron en el estadio.' },
    { root: 'cent',  en: 'The ant was one *centimeter* long.', es: 'La hormiga medía un *centímetro*.' },
    { root: 'mille', en: 'A *millipede* has many legs.', es: 'Un *milpiés* tiene muchas patas.' },
    { root: 'viv',   en: 'The little plant *survived* the cold winter.', es: 'La plantita *sobrevivió* al frío invierno.' },
    { root: 'struct', en: 'The bridge is a strong *structure*.', es: 'El puente es una *estructura* fuerte.' },
    { root: 'tract', en: 'A *tractor* pulled the cart of grapes.', es: 'Un *tractor* tiró del carro de uvas.' },
    { root: 'vent',  en: 'We went on an *adventure* in the forest.', es: 'Vivimos una *aventura* en el bosque.' },
    { root: 'rupt',  en: 'Please do not *interrupt* while Dad is talking.', es: 'Por favor no *interrumpas* mientras papá habla.' },
    { root: 'flect', en: 'The calm lake *reflects* the mountains.', es: 'El lago tranquilo *refleja* las montañas.' },
    { root: 'ann',   en: 'Our school has an *annual* fair in spring.', es: 'Nuestro colegio tiene una feria *anual* en primavera.' },
    { root: 'ject',  en: 'We made a science *project* about volcanoes.', es: 'Hicimos un *proyecto* de ciencias sobre volcanes.' },
    { root: 'meter', en: 'We measured the *perimeter* of the garden.', es: 'Medimos el *perímetro* del jardín.' },
    { root: 'cycl',  en: 'I ride my *bicycle* to school.', es: 'Voy en *bicicleta* al colegio.' },
    { root: 'urb',   en: 'Many people live in *urban* areas.', es: 'Mucha gente vive en zonas *urbanas*.' },
    { root: 'dom',   en: 'Dogs and cats are *domestic* animals.', es: 'Los perros y los gatos son animales *domésticos*.' },
    { root: 'reg',   en: 'Chile is divided into *regions*.', es: 'Chile está dividido en *regiones*.' },
    { root: 'form',  en: 'The football team wore a new *uniform*.', es: 'El equipo de fútbol usó un *uniforme* nuevo.' },
    { root: 'vor',   en: 'A lion is a *carnivore*.', es: 'El león es un *carnívoro*.' },
    { root: 'hydro', en: 'Water is made of *hydrogen* and oxygen.', es: 'El agua está formada por *hidrógeno* y oxígeno.' },
    { root: 'cred',  en: 'The view from the summit was *incredible*.', es: 'La vista desde la cumbre fue *increíble*.' },
    { root: 'fort',  en: 'The old *fortress* has thick stone walls.', es: 'La vieja *fortaleza* tiene gruesos muros de piedra.' },
    { root: 'ver',   en: 'The scientist will *verify* the results.', es: 'La científica va a *verificar* los resultados.' },
    { root: 'leg',   en: 'Your handwriting is very *legible*.', es: 'Tu letra es muy *legible*.' },
    { root: 'morph', en: 'A caterpillar changes by *metamorphosis*.', es: 'La oruga cambia por *metamorfosis*.' },
    { root: 'derm',  en: 'The *epidermis* is the outer layer of the skin.', es: 'La *epidermis* es la capa exterior de la piel.' },
    { root: 'chrono', en: 'A *chronology* puts events in order of time.', es: 'Una *cronología* ordena los hechos en el tiempo.' },
    { root: 'graph', en: 'The pilot signed an *autograph* for me.', es: 'El piloto me firmó un *autógrafo*.' },
    { root: 'log',   en: 'This puzzle needs *logic*, not luck.', es: 'Este acertijo necesita *lógica*, no suerte.' },
    { root: 'poly',  en: 'A hexagon is a *polygon* with six sides.', es: 'El hexágono es un *polígono* de seis lados.' },
    { root: 'philo', en: 'The word *philosophy* means love of wisdom.', es: 'La palabra *filosofía* significa amor por la sabiduría.' },
    { root: 'arch',  en: 'Old maps are kept in the *archive*.', es: 'Los mapas antiguos se guardan en el *archivo*.' },
    { root: 'scope', en: 'The doctor listened to my heart with a *stethoscope*.', es: 'La doctora escuchó mi corazón con un *estetoscopio*.' },
    { root: 'miss',  en: 'The *mission* of the rocket was to reach the Moon.', es: 'La *misión* del cohete era llegar a la Luna.' },
    { root: 'sent',  en: 'A dog has a very *sensitive* nose.', es: 'El perro tiene un olfato muy *sensible*.' },
    { root: 'pos',   en: 'Put the book back in its *position*.', es: 'Deja el libro en su *posición*.' },
    { root: 'cap',   en: 'The net helped us *capture* the butterfly.', es: 'La red nos ayudó a *capturar* la mariposa.' },
    { root: 'luc',   en: 'Frosted glass is *translucent*.', es: 'El vidrio esmerilado es *translúcido*.' },
    { root: 'bene',  en: 'Exercise has many *benefits*.', es: 'El ejercicio tiene muchos *beneficios*.' },
    { root: 'mort',  en: 'In the old myth, the hero wanted to be *immortal*.', es: 'En el mito antiguo, el héroe quería ser *inmortal*.' },
    { root: 'anim',  en: 'We watched an *animation* about dinosaurs.', es: 'Vimos una *animación* sobre dinosaurios.' },
    { root: 'ten',   en: 'A sponge can *retain* a lot of water.', es: 'Una esponja puede *retener* mucha agua.' },
    { root: 'vis',   en: 'On a clear day the volcano is *visible* from the city.', es: 'En un día despejado el volcán es *visible* desde la ciudad.' },
    { root: 'jur',   en: 'The *jury* listened to both sides.', es: 'El *jurado* escuchó a ambas partes.' },
    { root: 'polis', en: 'Santiago is a big *metropolis*.', es: 'Santiago es una gran *metrópolis*.' }
  ];

  // same: true = true cognates (same meaning); false = false friends.
  var FRIENDS = [
    { en: 'library', es: 'librería', same: false,
      why: { en: '"Librería" is a bookshop. A library is a "biblioteca".', es: '"Library" es una biblioteca. Una librería es un "bookshop".' } },
    { en: 'exit', es: 'éxito', same: false,
      why: { en: '"Éxito" means success. An exit is a "salida".', es: '"Exit" significa salida. Éxito es "success".' } },
    { en: 'carpet', es: 'carpeta', same: false,
      why: { en: '"Carpeta" is a folder. A carpet is an "alfombra".', es: '"Carpet" es una alfombra. Una carpeta es un "folder".' } },
    { en: 'actually', es: 'actualmente', same: false,
      why: { en: '"Actualmente" means nowadays. "Actually" is "en realidad".', es: '"Actually" significa en realidad. Actualmente es "nowadays".' } },
    { en: 'large', es: 'largo', same: false,
      why: { en: '"Largo" means long. Large is "grande".', es: '"Large" significa grande. Largo es "long".' } },
    { en: 'fabric', es: 'fábrica', same: false,
      why: { en: '"Fábrica" is a factory. Fabric is "tela".', es: '"Fabric" es tela. Una fábrica es un "factory".' } },
    { en: 'soap', es: 'sopa', same: false,
      why: { en: '"Sopa" is soup. Soap is "jabón".', es: '"Soap" es jabón. Sopa es "soup".' } },
    { en: 'rope', es: 'ropa', same: false,
      why: { en: '"Ropa" means clothes. A rope is a "cuerda".', es: '"Rope" es una cuerda. Ropa es "clothes".' } },
    { en: 'lecture', es: 'lectura', same: false,
      why: { en: '"Lectura" means reading. A lecture is a talk or class: "charla" or "clase".', es: '"Lecture" es una charla o clase. Lectura es "reading".' } },
    { en: 'pie', es: 'pie', same: false,
      why: { en: 'In Spanish "pie" is a foot, from Latin pes, pedis — the same root as pedal.', es: 'En inglés "pie" es un pastel. El pie en inglés es "foot" (latín pes, pedis, como pedal).' } },
    { en: 'record', es: 'recordar', same: false,
      why: { en: '"Recordar" means to remember. To record is "grabar".', es: '"Record" significa grabar. Recordar es "remember".' } },
    { en: 'family', es: 'familia', same: true,
      why: { en: 'True friends: both come from Latin familia.', es: 'Amigos verdaderos: los dos vienen del latín familia.' } },
    { en: 'planet', es: 'planeta', same: true,
      why: { en: 'True friends: both come from Greek planḗtēs, "wanderer".', es: 'Amigos verdaderos: los dos vienen del griego planḗtēs, "errante".' } },
    { en: 'music', es: 'música', same: true,
      why: { en: 'True friends: both come from Greek mousikḗ.', es: 'Amigos verdaderos: los dos vienen del griego mousikḗ.' } },
    { en: 'history', es: 'historia', same: true,
      why: { en: 'True friends: both come from Greek historía, "inquiry".', es: 'Amigos verdaderos: los dos vienen del griego historía, "investigación".' } },
    { en: 'invent', es: 'inventar', same: true,
      why: { en: 'True friends: both carry the Latin root vent-, "come".', es: 'Amigos verdaderos: los dos llevan la raíz latina vent-, "venir".' } },
    { en: 'aquarium', es: 'acuario', same: true,
      why: { en: 'True friends: both carry Latin aqua, "water".', es: 'Amigos verdaderos: los dos llevan el latín aqua, "agua".' } },
    { en: 'telephone', es: 'teléfono', same: true,
      why: { en: 'True friends: Greek tele "far" + phōnḗ "sound".', es: 'Amigos verdaderos: griego tele "lejos" + phōnḗ "sonido".' } },
    { en: 'important', es: 'importante', same: true,
      why: { en: 'True friends: both come from Latin importare.', es: 'Amigos verdaderos: los dos vienen del latín importare.' } },
    { en: 'visible', es: 'visible', same: true,
      why: { en: 'True friends: spelled the same, from Latin visibilis, "able to be seen".', es: 'Amigos verdaderos: se escriben igual, del latín visibilis, "que se puede ver".' } }
  ];

  function plain(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  // Per-character plain form so indices line up with the original word.
  function plainChars(word) {
    return Array.from(String(word)).map(function(ch) { return plain(ch) || ch; });
  }

  // Find the root inside a word. Returns {pre, mid, post} or null.
  function split(word, rootId) {
    var stems = STEMS[rootId] || [rootId];
    var chars = Array.from(String(word));
    var flat = plainChars(word);
    var s = flat.join('');
    if (s.length !== chars.length) return null;
    for (var i = 0; i < stems.length; i++) {
      var at = s.indexOf(stems[i]);
      if (at !== -1) {
        return {
          pre: chars.slice(0, at).join(''),
          mid: chars.slice(at, at + stems[i].length).join(''),
          post: chars.slice(at + stems[i].length).join('')
        };
      }
    }
    return null;
  }
  function hasRoot(word, rootId) { return !!split(word, rootId); }

  return {
    ETYMA: ETYMA, STEMS: STEMS, ICON: ICON, SENTENCES: SENTENCES, FRIENDS: FRIENDS,
    plain: plain, split: split, hasRoot: hasRoot
  };
})();
