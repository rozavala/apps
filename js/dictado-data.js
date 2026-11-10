/* ================================================================
   DICTADO — dictado-data.js
   The word lists, by spelling rule. Pure data (no DOM), so the page,
   the engine and the tests all read the same lists.

   A list is one family of spelling (Spanish b/v, English silent
   letters...). It is made of rules; each rule owns its items at the
   three levels:
     w  words       (level 1, ages 6-7)
     p  phrases     (level 2, ages 8-9; lowercase, no punctuation)
     s  sentences   (level 3, ages 10+; capital letter, accents and
                     punctuation all count)
   Every item belongs to exactly one rule, so the card shown after a
   mistake always matches the word that was missed.

   Rule text is [Spanish, English]: the card is shown in the kid's own
   language, whichever language is being dictated.

   Every word, phrase and sentence here is original or plain common
   language: neutral, factual, about everyday things. Written in NFC
   (accents are single characters).
   ================================================================ */

var DictadoData = (function(root) {
  'use strict';

  var LISTS = [

    // ── Spanish ──────────────────────────────────────────────────
    { id: 'es-bv', lang: 'es', badge: 'b · v', name: ['b y v', 'b and v'], probe: '[bv]', rules: [
      { id: 'bir', t: ['Verbos en -bir', 'Verbs ending in -bir'],
        tip: ['Los verbos que terminan en -bir se escriben con b: escribir, recibir, subir. (Excepciones: hervir, servir, vivir.)',
              'Verbs that end in -bir are written with b: escribir, recibir, subir. (Exceptions: hervir, servir, vivir.)'],
        w: ['escribir', 'recibir', 'subir'],
        p: ['escribir una carta', 'subir la escalera'],
        s: ['Voy a escribir una carta para mi abuelo.', 'Mi hermano recibió un libro nuevo.'] },
      { id: 'aba', t: ['Terminación -aba', 'The ending -aba'],
        tip: ['Cuando algo pasaba muchas veces, los verbos en -ar terminan en -aba, con b: jugaba, cantaba, caminaba.',
              'For things that used to happen, -ar verbs end in -aba, with a b: jugaba, cantaba, caminaba.'],
        w: ['jugaba', 'cantaba'],
        p: ['jugaba en el parque', 'cantaba una canción'],
        s: ['Mi abuela cantaba una canción bonita.', 'Los niños jugaban en el patio de la escuela.'] },
      { id: 'nv', t: ['Después de n va v', 'After n comes v'],
        tip: ['Después de n se escribe v, no b: invierno, invitar, envase.',
              'After n we write v, not b: invierno, invitar, envase.'],
        w: ['invierno', 'invitar'],
        p: ['invitar a un amigo', 'el invierno frío'],
        s: ['En invierno llevo una bufanda azul.', 'Quiero invitar a mis primos a mi casa.'] },
      { id: 'bu', t: ['bu-, bur-, bus-', 'bu-, bur-, bus-'],
        tip: ['Las palabras que empiezan con bu-, bur- o bus- se escriben con b: burro, buscar, bufanda, burbuja.',
              'Words that start with bu-, bur- or bus- are written with b: burro, buscar, bufanda, burbuja.'],
        w: ['burro', 'buscar', 'bufanda', 'burbuja'],
        p: ['buscar el tesoro', 'una bufanda azul'],
        s: ['Mis amigos buscaban conchitas en la playa.'] },
      { id: 'bi', t: ['bi- quiere decir dos', 'bi- means two'],
        tip: ['El prefijo bi- quiere decir «dos» y se escribe con b: bicicleta (dos ruedas), bilingüe (dos idiomas).',
              'The prefix bi- means "two" and is written with b: bicicleta (two wheels), bilingüe (two languages).'],
        w: ['bicicleta', 'bilingüe'],
        p: ['una bicicleta roja'],
        s: ['¿Quieres subir a mi bicicleta?'] },
      { id: 'mem', t: ['Hay que recordarla', 'Just remember it'],
        tip: ['La b y la v suenan igual. Mira bien la palabra y recuérdala: vaca, volar, nube, nueve.',
              'B and v sound the same. Look closely at the word and remember it: vaca, volar, nube, nueve.'],
        w: ['vaca', 'nube', 'nueve', 'volar'],
        p: ['una vaca blanca', 'una nube gris'],
        s: ['Una nube gris cubre el cielo.'] }
    ] },

    { id: 'es-csz', lang: 'es', badge: 'c · s · z', name: ['c, s y z', 'c, s and z'], probe: '[csz]', rules: [
      { id: 'ce_ci', t: ['ce, ci', 'ce, ci'],
        tip: ['Antes de e y de i, el sonido suave de la s se escribe con c: cena, cielo, cine, cebolla.',
              'Before e and i, the soft s sound is written with c: cena, cielo, cine, cebolla.'],
        w: ['cena', 'cielo', 'cine', 'cebolla'],
        p: ['un cielo azul', 'la cena de hoy'],
        s: ['Mi mamá prepara la cena a las siete.', 'Voy al cine con mis primos.'] },
      { id: 'za', t: ['za, zo, zu', 'za, zo, zu'],
        tip: ['Con los sonidos za, zo y zu se escribe z: zapato, zorro, zumo, zanahoria.',
              'For the sounds za, zo and zu we write z: zapato, zorro, zumo, zanahoria.'],
        w: ['zapato', 'zorro', 'zumo', 'zanahoria'],
        p: ['un zapato nuevo', 'jugo de zanahoria'],
        s: ['El zorro corre cerca del río.', 'Mi hermana guarda sus zapatos en la caja.'] },
      { id: 'ion', t: ['Terminación -ción', 'The ending -ción'],
        tip: ['Muchas palabras terminan en -ción, con c y con tilde: canción, estación, lección.',
              'Many words end in -ción, with c and an accent mark: canción, estación, lección.'],
        w: ['canción', 'estación', 'lección'],
        p: ['la estación de tren', 'una lección de música'],
        s: ['La canción del colegio es muy alegre.'] },
      { id: 'zces', t: ['La z cambia a c', 'z changes to c'],
        tip: ['Para hacer el plural, la z cambia a c: pez → peces, luz → luces, lápiz → lápices.',
              'To make the plural, z changes to c: pez → peces, luz → luces, lápiz → lápices.'],
        w: ['peces', 'luces'],
        p: ['tres peces rojos', 'las luces de la casa'],
        s: ['Los peces nadan en el agua clara.'] },
      { id: 's', t: ['Con s', 'With s'],
        tip: ['Algunas palabras llevan s con sonido suave. Mira bien la palabra y recuérdala: sol, silla, sopa.',
              'Some words have an s with a soft sound. Look closely at the word and remember it: sol, silla, sopa.'],
        w: ['sol', 'silla', 'sopa'],
        p: ['una sopa caliente', 'una silla de madera'],
        s: ['En el invierno tomamos sopa caliente.'] }
    ] },

    { id: 'es-h', lang: 'es', badge: 'h', name: ['La h muda', 'The silent h'], probe: 'h', rules: [
      { id: 'hue', t: ['hue-, hie-', 'hue-, hie-'],
        tip: ['Las palabras que empiezan con hue- o hie- llevan h: huevo, hueso, hielo, hierba.',
              'Words that start with hue- or hie- have an h: huevo, hueso, hielo, hierba.'],
        w: ['huevo', 'hueso', 'hielo', 'hierba'],
        p: ['un huevo frito', 'mucho hielo'],
        s: ['Mi hermano desayuna un huevo cada mañana.', 'Pongo hielo en el vaso de agua.'] },
      { id: 'hum', t: ['hum-', 'hum-'],
        tip: ['Las palabras que empiezan con hum- llevan h: humo, humano, humilde.',
              'Words that start with hum- have an h: humo, humano, humilde.'],
        w: ['humo', 'humano'],
        p: ['el humo del fuego'],
        s: ['El humo sube por la chimenea.'] },
      { id: 'mem', t: ['La h no suena', 'The h is silent'],
        tip: ['La h no suena, así que hay que recordarla: hormiga, hermano, hoja, hambre, helado, hospital.',
              'The h makes no sound, so we have to remember it: hormiga, hermano, hoja, hambre, helado, hospital.'],
        w: ['hormiga', 'hermano', 'hoja', 'hambre', 'helado', 'hospital'],
        p: ['una hoja verde', 'mi hermano mayor', 'un helado de fresa', 'la hormiga trabajadora'],
        s: ['La hormiga lleva una hoja pequeña.', 'Hablo con mi abuela todos los días.', '¿Quieres un helado de chocolate?'] }
    ] },

    { id: 'es-lly', lang: 'es', badge: 'll · y', name: ['ll y y', 'll and y'], probe: 'll|y', rules: [
      { id: 'll', t: ['Palabras con ll', 'Words with ll'],
        tip: ['Muchas palabras llevan ll, que suena como la y. Hay que recordarlas: llave, lluvia, calle, gallina.',
              'Many words have ll, which sounds like y. We have to remember them: llave, lluvia, calle, gallina.'],
        w: ['llave', 'lluvia', 'calle', 'gallina'],
        p: ['la llave de la casa', 'una lluvia fuerte'],
        s: ['Mi gallina pone un huevo cada día.', 'Hoy llueve mucho en la calle.'] },
      { id: 'illo', t: ['-illo, -illa', '-illo, -illa'],
        tip: ['Las terminaciones -illo e -illa se escriben con ll: castillo, ardilla, bolsillo, amarillo.',
              'The endings -illo and -illa are written with ll: castillo, ardilla, bolsillo, amarillo.'],
        w: ['castillo', 'ardilla', 'bolsillo', 'amarillo'],
        p: ['una ardilla en el árbol', 'el castillo antiguo'],
        s: ['La ardilla busca nueces en el bosque.', 'El rey vive en un castillo grande.'] },
      { id: 'y', t: ['Palabras con y', 'Words with y'],
        tip: ['Algunas palabras llevan y, que suena como la ll. Mira bien la palabra: playa, ayuda, payaso, mayo.',
              'Some words have y, which sounds like ll. Look closely at the word: playa, ayuda, payaso, mayo.'],
        w: ['playa', 'ayuda', 'payaso'],
        p: ['un payaso en la fiesta', 'una playa de arena'],
        s: ['Mi papá me ayuda con la tarea.'] },
      { id: 'yfin', t: ['y al final', 'y at the end'],
        tip: ['Al final de la palabra, el sonido «i» se escribe con y: hoy, muy, voy, rey.',
              'At the end of a word, the "ee" sound is written with y: hoy, muy, voy, rey.'],
        w: ['hoy', 'muy', 'rey'],
        p: ['muy contento hoy'],
        s: ['Hoy voy a la escuela con mi hermano.'] },
      { id: 'yconj', t: ['La palabra y', 'The word y'],
        tip: ['La palabra «y» sola une dos cosas y se escribe con y: pan y queso, sol y luna.',
              'The word "y" (and) joins two things and is written with y: pan y queso, sol y luna.'],
        w: [],
        p: ['pan y queso', 'sol y luna'],
        s: ['Voy a la playa con mi familia y mis amigos.'] }
    ] },

    { id: 'es-gj', lang: 'es', badge: 'g · j', name: ['g y j', 'g and j'], probe: '[gj]', rules: [
      { id: 'ge', t: ['ge, gi', 'ge, gi'],
        tip: ['Antes de e y de i, la g suena como j: gente, gigante, girasol, general.',
              'Before e and i, the g sounds like j: gente, gigante, girasol, general.'],
        w: ['gente', 'gigante', 'girasol'],
        p: ['un gigante amable', 'un girasol amarillo'],
        s: ['El girasol mira hacia el sol.'] },
      { id: 'je', t: ['je, ji con j', 'je, ji with j'],
        tip: ['Algunas palabras llevan j antes de e o de i. Hay que recordarlas: jirafa, jinete, ejercicio.',
              'Some words have a j before e or i. We have to remember them: jirafa, jinete, ejercicio.'],
        w: ['jirafa', 'jinete', 'ejercicio'],
        p: ['la jirafa alta', 'un jinete valiente'],
        s: ['La jirafa come hojas de los árboles altos.'] },
      { id: 'aje', t: ['Terminación -aje', 'The ending -aje'],
        tip: ['Las palabras que terminan en -aje se escriben con j: viaje, mensaje, paisaje.',
              'Words that end in -aje are written with j: viaje, mensaje, paisaje.'],
        w: ['viaje', 'mensaje', 'paisaje'],
        p: ['un viaje largo', 'un mensaje corto'],
        s: ['Mi familia hizo un viaje por el sur de Chile.', 'Desde la montaña vimos un paisaje hermoso.'] },
      { id: 'jajoju', t: ['ja, jo, ju', 'ja, jo, ju'],
        tip: ['Para el sonido fuerte de j antes de a, o y u se escribe j: caja, ojo, juego, naranja.',
              'For the strong j sound before a, o and u we write j: caja, ojo, juego, naranja.'],
        w: ['caja', 'ojo', 'juego', 'naranja'],
        p: ['mi juego favorito', 'una naranja dulce'],
        s: ['Mis hermanos y yo jugamos con una caja grande.'] },
      { id: 'gue', t: ['gue, gui', 'gue, gui'],
        tip: ['Para el sonido fuerte de g antes de e o de i se escribe gue o gui. La u no suena: guitarra, juguete, guiso.',
              'For the hard g sound before e or i we write gue or gui. The u is silent: guitarra, juguete, guiso.'],
        w: ['guitarra', 'juguete', 'guiso'],
        p: ['tocar la guitarra', 'un juguete nuevo'],
        s: ['Mi tío toca la guitarra en las fiestas.'] }
    ] },

    { id: 'es-mbmp', lang: 'es', badge: 'mb · mp', name: ['mb y mp', 'mb and mp'], probe: 'm[bp]', rules: [
      { id: 'mb', t: ['Antes de b va m', 'Before b comes m'],
        tip: ['Antes de b siempre se escribe m: cambio, hombre, también, tambor. (Y antes de v se escribe n: invitar, envase.)',
              'Before b we always write m: cambio, hombre, también, tambor. (And before v we write n: invitar, envase.)'],
        w: ['cambio', 'hombre', 'también', 'tambor', 'ombligo'],
        p: ['un tambor grande', 'también mi hermano', 'el hombre alto'],
        s: ['Mi tambor suena muy fuerte.', 'También quiero ir al campo.', 'Cambio mi lápiz cuando se acaba.'] },
      { id: 'mp', t: ['Antes de p va m', 'Before p comes m'],
        tip: ['Antes de p siempre se escribe m: campo, tiempo, siempre, limpio, lámpara.',
              'Before p we always write m: campo, tiempo, siempre, limpio, lámpara.'],
        w: ['campo', 'tiempo', 'siempre', 'limpio', 'ejemplo', 'lámpara', 'cumpleaños'],
        p: ['el campo verde', 'una lámpara encendida', 'siempre a tiempo', 'un cuarto limpio'],
        s: ['Siempre limpio mi pieza antes de dormir.', 'Pongo un ejemplo en mi cuaderno.', 'En mi cumpleaños comeremos una torta.'] }
    ] },

    { id: 'es-agudas', lang: 'es', badge: 'ó', name: ['Tilde: agudas', 'Accents: stress on the end'], probe: '[a-z]', rules: [
      { id: 'agud', t: ['Agudas con tilde', 'Accent on the last syllable'],
        tip: ['En las palabras agudas la sílaba más fuerte es la última. Llevan tilde si terminan en n, s o vocal: canción, café, sofá, jardín.',
              'In these words the strongest syllable is the last one. They carry an accent mark if they end in n, s or a vowel: canción, café, sofá, jardín.'],
        w: ['ratón', 'camión', 'jardín', 'café', 'sofá', 'mamá', 'papá', 'corazón', 'avión', 'balón'],
        p: ['un camión rojo', 'el café caliente', 'mi mamá y mi papá', 'un avión veloz', 'un balón nuevo'],
        s: ['Mi papá maneja un camión grande.', 'El avión vuela sobre la cordillera.', 'Mi corazón late más rápido cuando corro.',
            'La canción termina con un aplauso.', 'Mi mamá toma café por la mañana.'] },
      { id: 'noagud', t: ['Agudas sin tilde', 'No accent needed'],
        tip: ['Las palabras agudas que terminan en otra consonante (no n ni s) no llevan tilde: reloj, papel, ciudad.',
              'Words with the strongest syllable at the end that finish in another consonant (not n or s) have no accent mark: reloj, papel, ciudad.'],
        w: ['reloj', 'papel', 'ciudad'],
        p: ['el reloj de pared', 'un papel blanco'],
        s: ['Compré papel y lápices para el colegio.', 'El reloj de la sala marca las tres.'] }
    ] },

    { id: 'es-llanas', lang: 'es', badge: 'á', name: ['Tilde: llanas', 'Accents: stress before the end'], probe: '[a-z]', rules: [
      { id: 'llana', t: ['Llanas con tilde', 'Accent on the next-to-last syllable'],
        tip: ['En las palabras llanas la sílaba más fuerte es la penúltima. Llevan tilde cuando NO terminan en n, s ni vocal: árbol, lápiz, fácil, azúcar.',
              'In these words the strongest syllable is the next to last. They carry an accent mark when they do NOT end in n, s or a vowel: árbol, lápiz, fácil, azúcar.'],
        w: ['árbol', 'lápiz', 'fácil', 'difícil', 'azúcar', 'ángel', 'césped', 'móvil', 'útil', 'cóndor'],
        p: ['un árbol alto', 'un lápiz de color', 'el césped verde', 'azúcar en la leche', 'el cóndor de los Andes', 'un ejercicio fácil'],
        s: ['El árbol del patio da mucha sombra.', 'Escribo mi nombre con un lápiz azul.', 'Este ejercicio es fácil, pero el otro es difícil.',
            'Mi abuela echa azúcar a la leche.', 'Rezo al ángel de la guarda antes de dormir.'] },
      { id: 'sin', t: ['Llanas sin tilde', 'No accent needed'],
        tip: ['Las palabras llanas que terminan en n, s o vocal no llevan tilde: casa, joven, lunes.',
              'Words with the strongest syllable next to last that end in n, s or a vowel have no accent mark: casa, joven, lunes.'],
        w: ['casa', 'joven', 'lunes'],
        p: ['el lunes por la tarde', 'una casa grande'],
        s: ['El lunes visitamos a mis primos.'] }
    ] },

    { id: 'es-esdrujulas', lang: 'es', badge: 'í', name: ['Tilde: esdrújulas', 'Accents: stress on the third from last'], probe: '[áéíóú]', rules: [
      { id: 'esdr', t: ['Esdrújulas', 'Always an accent'],
        tip: ['En las palabras esdrújulas la sílaba más fuerte es la antepenúltima. ¡Siempre llevan tilde!: pájaro, teléfono, sábado, número.',
              'In these words the strongest syllable is the third from last. They ALWAYS carry an accent mark: pájaro, teléfono, sábado, número.'],
        w: ['pájaro', 'teléfono', 'sábado', 'número', 'cámara', 'página', 'pétalo', 'océano', 'círculo', 'máquina'],
        p: ['un pájaro azul', 'el sábado por la tarde', 'el número tres', 'mi cámara nueva', 'una página blanca'],
        s: ['Un pájaro pequeño canta en mi ventana.', 'Mi teléfono está sobre la mesa.', 'El sábado vamos a la playa en familia.',
            'Cada pétalo de la flor tiene un color distinto.'] },
      { id: 'ico', t: ['-ico, -ica', '-ico, -ica'],
        tip: ['Muchas palabras que terminan en -ico o -ica son esdrújulas y llevan tilde: música, médico, eléctrico, práctico.',
              'Many words that end in -ico or -ica have the strongest syllable third from last, and carry an accent mark: música, médico, eléctrico, práctico.'],
        w: ['música', 'médico', 'eléctrico', 'práctico'],
        p: ['la música del piano', 'el médico de la familia', 'una luz eléctrica'],
        s: ['Mi hermana toca música en el piano.', 'El médico me revisó la garganta.'] }
    ] },

    // ── English ──────────────────────────────────────────────────
    { id: 'en-magice', lang: 'en', badge: 'a_e', name: ['La e mágica', 'Magic e'], probe: 'e', rules: [
      { id: 'ae_ie', t: ['e mágica: a_e, i_e', 'Magic e: a_e, i_e'],
        tip: ['Una e muda al final hace que la vocal diga su nombre: cap → cape, kit → kite. Escucha: cake, bike, plane.',
              'A silent e at the end makes the vowel say its name: cap becomes cape, kit becomes kite. Listen for it in cake, bike, plane.'],
        w: ['cake', 'snake', 'flame', 'plane', 'bike', 'kite', 'smile'],
        p: ['a slice of cake', 'a ride on a bike', 'a kite in the sky', 'a snake in the grass', 'a smile on my face'],
        s: ['I rode my bike to the lake.', 'We made a cake for the picnic.', 'She smiled when she saw the kite.'] },
      { id: 'oe_ue', t: ['e mágica: o_e, u_e', 'Magic e: o_e, u_e'],
        tip: ['Una e muda al final hace que la vocal diga su nombre: hop → hope, cub → cube. Escucha: home, rope, stone.',
              'A silent e at the end makes the vowel say its name: hop becomes hope, cub becomes cube. Listen for it in home, rope, stone.'],
        w: ['home', 'rope', 'stone', 'globe', 'cube', 'tune'],
        p: ['a long rope', 'a big stone', 'a cube of ice', 'a tune on the radio'],
        s: ['My grandpa drove us home.', 'A tall stone stands by the road.', 'The globe shows every country.', 'He hums a happy tune.'] }
    ] },

    { id: 'en-teams', lang: 'en', badge: 'ai · ee · oa', name: ['Parejas de vocales', 'Vowel teams'], probe: 'ai|ay|ee|ea|oa|ow', rules: [
      { id: 'ai_ay', t: ['ai y ay', 'ai and ay'],
        tip: ['ai va en medio de la palabra y ay al final: rain, train; play, day.',
              'ai goes in the middle of a word and ay at the end: rain, train; play, day.'],
        w: ['rain', 'train', 'play', 'day'],
        p: ['a train on the track', 'a rainy day', 'we play outside'],
        s: ['The train goes by every day.'] },
      { id: 'ee_ea', t: ['ee y ea', 'ee and ea'],
        tip: ['ee y ea suenan igual. Mira bien la palabra y recuérdala: tree, green; beach, leaf.',
              'ee and ea sound the same. Look closely at the word and remember it: tree, green; beach, leaf.'],
        w: ['tree', 'green', 'beach', 'leaf'],
        p: ['a green tree', 'a leaf on the beach'],
        s: ['We play on the beach in the summer.', 'The green leaf fell from the tree.'] },
      { id: 'oa_ow', t: ['oa y ow', 'oa and ow'],
        tip: ['oa va en medio de la palabra y ow al final: boat, road; snow, grow.',
              'oa goes in the middle of a word and ow at the end: boat, road; snow, grow.'],
        w: ['boat', 'road', 'snow', 'grow'],
        p: ['a boat on the lake', 'a road in the snow'],
        s: ['A little boat floats on the water.', 'I like to watch the snow fall.', 'Sunflowers grow tall in the garden.'] }
    ] },

    { id: 'en-digraphs', lang: 'en', badge: 'sh · ch · th', name: ['sh, ch, th y ck', 'sh, ch, th and ck'], probe: 'sh|ch|th|ck', rules: [
      { id: 'sh', t: ['sh', 'sh'],
        tip: ['Las letras s y h juntas suenan «sh»: ship, shell, fish.',
              'The letters s and h together say "sh": ship, shell, fish.'],
        w: ['ship', 'shell', 'fish'],
        p: ['a shiny shell', 'fish in the sea'],
        s: ['The fish swims near the ship.'] },
      { id: 'ch', t: ['ch', 'ch'],
        tip: ['Las letras c y h juntas suenan «ch»: chip, chair, lunch.',
              'The letters c and h together say "ch": chip, chair, lunch.'],
        w: ['chip', 'chair', 'lunch'],
        p: ['a chair at lunch'],
        s: ['We eat lunch at the table.'] },
      { id: 'th', t: ['th', 'th'],
        tip: ['Las letras t y h juntas hacen un sonido con la lengua entre los dientes: thin, think, bath.',
              'The letters t and h together make a sound with the tongue between the teeth: thin, think, bath.'],
        w: ['thin', 'think', 'bath'],
        p: ['a thin book', 'a warm bath'],
        s: ['I think the bath is warm.'] },
      { id: 'ck', t: ['ck', 'ck'],
        tip: ['Al final de una palabra con vocal corta, el sonido «k» se escribe ck: duck, clock, black.',
              'At the end of a word with a short vowel, the "k" sound is written ck: duck, clock, black.'],
        w: ['duck', 'clock', 'black'],
        p: ['a black duck', 'a clock on the wall'],
        s: ['The duck sat on a rock.', 'She hung a clock in the kitchen.', 'Our teacher has a black bag.'] }
    ] },

    { id: 'en-silent', lang: 'en', badge: 'kn · wr', name: ['Letras mudas', 'Silent letters'], probe: 'kn|wr|mb', rules: [
      { id: 'kn', t: ['kn: la k no suena', 'kn: the k is silent'],
        tip: ['En kn la k no suena, solo se oye la n: knee, knot, know, knock.',
              'In kn the k is silent, you only hear the n: knee, knot, know, knock.'],
        w: ['knee', 'knot', 'know', 'knock'],
        p: ['a knot in the rope', 'knock on the door'],
        s: ['I know how to tie a knot.', 'Please knock before you come in.'] },
      { id: 'wr', t: ['wr: la w no suena', 'wr: the w is silent'],
        tip: ['En wr la w no suena, solo se oye la r: write, wrap, wrist, wrong.',
              'In wr the w is silent, you only hear the r: write, wrap, wrist, wrong.'],
        w: ['write', 'wrap', 'wrist', 'wrong'],
        p: ['write a letter', 'a wrong turn', 'wrap a gift'],
        s: ['I write in my notebook every day.', 'She has a bracelet on her wrist.'] },
      { id: 'mb', t: ['mb: la b no suena', 'mb: the b is silent'],
        tip: ['Al final de la palabra, la b después de la m no suena: lamb, thumb, climb, comb.',
              'At the end of a word, the b after m is silent: lamb, thumb, climb, comb.'],
        w: ['lamb', 'thumb', 'climb', 'comb'],
        p: ['a little lamb', 'climb a hill'],
        s: ['The lamb walks next to its mother.', 'We climb the hill after lunch.'] }
    ] },

    { id: 'en-double', lang: 'en', badge: '-ing', name: ['Duplicar la consonante', 'Doubling the last letter'], probe: 'ing|ed', rules: [
      { id: 'double', t: ['Duplica la consonante', 'Double the last letter'],
        tip: ['Si una palabra corta termina en una vocal y una consonante, se duplica la consonante antes de -ing o -ed: run → running, stop → stopped.',
              'When a short word ends in one vowel and one consonant, double the consonant before -ing or -ed: run becomes running, stop becomes stopped.'],
        w: ['running', 'hopping', 'stopped', 'swimming', 'sitting', 'clapped', 'digging', 'skipping', 'hugged', 'dropped'],
        p: ['running in the park', 'a dog digging a hole', 'swimming in the pool', 'we clapped and cheered', 'sitting on the grass'],
        s: ['The children are running to the playground.', 'My brother stopped at the corner.', 'We are swimming in the lake today.',
            'The audience clapped after the song.', 'The puppy is digging in the garden.'] },
      { id: 'nodouble', t: ['Sin duplicar', 'No doubling'],
        tip: ['Si la palabra termina en dos consonantes, no se duplica nada: jump → jumping, help → helping.',
              'When a word already ends in two consonants, nothing is doubled: jump becomes jumping, help becomes helping.'],
        w: ['jumping', 'helping'],
        p: ['jumping over a log', 'helping my mom'],
        s: ['She is helping her mother in the kitchen.'] }
    ] },

    { id: 'en-plurals', lang: 'en', badge: '-es', name: ['Plurales', 'Plurals'], probe: 'es', rules: [
      { id: 'es', t: ['Plural con -es', 'Plurals with -es'],
        tip: ['Si la palabra termina en s, x, z, ch o sh, el plural se hace con -es: box → boxes, dish → dishes, church → churches.',
              'When a word ends in s, x, z, ch or sh, the plural adds -es: box becomes boxes, dish becomes dishes, church becomes churches.'],
        w: ['boxes', 'buses', 'dishes', 'churches', 'glasses', 'foxes'],
        p: ['two big boxes', 'dishes in the sink', 'yellow buses'],
        s: ['We washed the dishes after dinner.', 'The buses stop at the corner.', 'Foxes live in the forest.'] },
      { id: 'ies', t: ['Plural con -ies', 'Plurals with -ies'],
        tip: ['Si la palabra termina en consonante y una y, la y cambia a i y se agrega -es: baby → babies, puppy → puppies.',
              'When a word ends in a consonant and y, the y changes to i and we add -es: baby becomes babies, puppy becomes puppies.'],
        w: ['babies', 'puppies', 'cherries', 'flies', 'stories', 'ponies'],
        p: ['three little puppies', 'ripe cherries', 'stories at night'],
        s: ['The babies sleep in their beds.', 'I read two stories before bed.', 'The farmer has two ponies and three cows.'] }
    ] },

    { id: 'en-tion', lang: 'en', badge: '-tion', name: ['-tion y -sion', '-tion and -sion'], probe: 'tion|sion', rules: [
      { id: 'tion', t: ['Terminación -tion', 'The ending -tion'],
        tip: ['El final «shun» casi siempre se escribe -tion: nation, station, action, vacation.',
              'The "shun" ending is most often written -tion: nation, station, action, vacation.'],
        w: ['nation', 'station', 'action', 'vacation', 'motion', 'fraction', 'addition', 'subtraction'],
        p: ['the train station', 'a summer vacation', 'lots of action', 'the flag of the nation'],
        s: ['We waited at the station for the train.', 'Our vacation starts on Friday.', 'I practice addition and subtraction every day.'] },
      { id: 'sion', t: ['Terminación -sion', 'The ending -sion'],
        tip: ['Algunas palabras terminan en -sion, que suena «zhun»: vision, decision, television, division.',
              'Some words end in -sion, which says "zhun": vision, decision, television, division.'],
        w: ['vision', 'decision', 'television', 'division'],
        p: ['a big decision', 'a new television'],
        s: ['I watch television after dinner.', 'Dad made a decision about the trip.', 'We learned about division in math class.'] }
    ] }
  ];

  // Cards for mistakes that are not about one word: capitals and punctuation.
  var GENERIC = {
    'case': { t: ['Mayúsculas', 'Capital letters'],
      tip: ['Una oración empieza con letra mayúscula. Los nombres propios también.',
            'A sentence starts with a capital letter. So do names.'] },
    'punct': { t: ['Signos de puntuación', 'Punctuation'],
      tip: ['Una oración termina con punto. En español las preguntas llevan ¿ al empezar y ? al terminar. Las exclamaciones, ¡ y !',
            'A sentence ends with a full stop. In Spanish a question starts with ¿ and ends with ?, and an exclamation with ¡ and !'] }
  };

  var LEVELS = [
    { n: 1, key: 'w', ages: '6–7',  t: ['Palabras', 'Words'] },
    { n: 2, key: 'p', ages: '8–9',  t: ['Frases', 'Phrases'] },
    { n: 3, key: 's', ages: '10+',  t: ['Oraciones', 'Sentences'] }
  ];

  var LANGS = ['es', 'en'];

  // ── Reading the lists ────────────────────────────────────────
  function listsFor(lang) { return LISTS.filter(function(l) { return l.lang === lang; }); }
  function list(id) { for (var i = 0; i < LISTS.length; i++) if (LISTS[i].id === id) return LISTS[i]; return null; }
  function mixId(lang) { return lang + '-mix'; }
  function isMix(id) { return /-mix$/.test(String(id)); }

  // The items of a list at a level: [{ t, rule, list, lang }]. 'es-mix' and
  // 'en-mix' are every list of the language together.
  function items(id, level) {
    var key = LEVELS[Math.max(1, Math.min(3, level | 0)) - 1].key, out = [];
    var src = isMix(id) ? listsFor(String(id).slice(0, 2)) : [list(id)];
    src.forEach(function(l) {
      if (!l) return;
      l.rules.forEach(function(r) {
        (r[key] || []).forEach(function(text) { out.push({ t: text, rule: r.id, list: l.id, lang: l.lang }); });
      });
    });
    return out;
  }
  function rule(listId, ruleId) {
    var l = list(listId);
    if (!l) return null;
    for (var i = 0; i < l.rules.length; i++) if (l.rules[i].id === ruleId) return l.rules[i];
    return null;
  }
  // Ages 6-7 words, 8-9 phrases, 10 and up sentences. No age: phrases.
  function levelForAge(age) {
    age = Number(age) || 0;
    return !age ? 2 : age <= 7 ? 1 : age <= 9 ? 2 : 3;
  }

  var api = { LISTS: LISTS, GENERIC: GENERIC, LEVELS: LEVELS, LANGS: LANGS, listsFor: listsFor, list: list,
              mixId: mixId, isMix: isMix, items: items, rule: rule, levelForAge: levelForAge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DictadoData = api;
  return api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {}));
