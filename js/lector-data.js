/* ================================================================
   LECTOR — curriculum and books (js/lector-data.js)

   Two tracks, Spanish and English. Each track is a list of levels; a
   level teaches a few new letters (graphemes) and unlocks the next
   level when a kid has mastered it.

   SPANISH goes by syllables: vowels, then m p s l, t d, n r, c b v, f g.
   ENGLISH goes by sounds: s a t p i n, c e h r m d, g o u l f b x, then
   sh ch th ck j w v. Only short vowels and simple three-sound words.

   Everything a kid reads is "decodable": a page may only use letters
   taught up to its book's level, plus a few "magic words" (sight words)
   introduced at a level. tests/unit/lector.spec.js checks every word of
   every book against an independent copy of what each level teaches.

   A word entry in `pics` is 'word|tiles|picture' where tiles are what a
   kid drags to build it (syllables in Spanish, sounds in English) and
   the picture is an object drawn in js/lector-art*.js. `more` lists the
   other words the books use. Names (Pip, Lola) are listed in `names`.

   A book page is [text, backdrop, items]; items are
   [object, centreX, groundY, size, flip] in a 320 x 200 picture.
   ================================================================ */

var LectorData = (function() {
  'use strict';

  function W(s) { return s.split(/\s+/).filter(Boolean); }
  function P(list) {
    return W(list).map(function(e) {
      var p = e.split('|');
      return { w: p[0], t: p[1].split('.'), o: p[2] };
    });
  }

  // What the voice says for a letter, and the picture + word that go
  // with it on its card (the word only has to start with the sound).
  var LETTERS = {
    es: {
      a: { snd: 'a', ex: 'árbol', o: 'tree' },     e: { snd: 'e', ex: 'escalera', o: 'ladder' },
      i: { snd: 'i', ex: 'isla', o: 'island' },    o: { snd: 'o', ex: 'oso', o: 'bear' },
      u: { snd: 'u', ex: 'uvas', o: 'grapes' },
      m: { snd: 'ma', ex: 'mesa', o: 'table' },    p: { snd: 'pa', ex: 'pato', o: 'duck' },
      s: { snd: 'sa', ex: 'sol', o: 'sun' },       l: { snd: 'la', ex: 'luna', o: 'moon' },
      t: { snd: 'ta', ex: 'tomate', o: 'tomato' }, d: { snd: 'da', ex: 'dedo', o: 'finger' },
      n: { snd: 'na', ex: 'nube', o: 'cloud' },    r: { snd: 'ra', ex: 'rana', o: 'frog' },
      c: { snd: 'ca', ex: 'casa', o: 'house' },    b: { snd: 'ba', ex: 'bota', o: 'boot' },
      v: { snd: 'va', ex: 'vaca', o: 'cow' },
      f: { snd: 'fa', ex: 'foca', o: 'seal' },     g: { snd: 'ga', ex: 'gato', o: 'cat' }
    },
    en: {
      s: { snd: 'sss', ex: 'sun', o: 'sun' },      a: { snd: 'ah', ex: 'apple', o: 'apple' },
      t: { snd: 'tuh', ex: 'tent', o: 'tent' },    p: { snd: 'puh', ex: 'pig', o: 'pig' },
      i: { snd: 'ih', ex: 'igloo', o: 'igloo' },   n: { snd: 'nnn', ex: 'nest', o: 'nest' },
      c: { snd: 'kuh', ex: 'cat', o: 'cat' },      e: { snd: 'eh', ex: 'egg', o: 'egg' },
      h: { snd: 'huh', ex: 'hat', o: 'hat' },      r: { snd: 'rrr', ex: 'rat', o: 'rat' },
      m: { snd: 'mmm', ex: 'map', o: 'map' },      d: { snd: 'duh', ex: 'dog', o: 'dog' },
      g: { snd: 'guh', ex: 'grapes', o: 'grapes' }, o: { snd: 'aw', ex: 'orange', o: 'orange' },
      u: { snd: 'uh', ex: 'umbrella', o: 'umbrella' }, l: { snd: 'lll', ex: 'leaf', o: 'leaf' },
      f: { snd: 'fff', ex: 'fish', o: 'fish' },    b: { snd: 'buh', ex: 'bus', o: 'bus' },
      x: { snd: 'ks', ex: 'fox', o: 'fox', end: true },
      sh: { snd: 'shh', ex: 'ship', o: 'ship' },   ch: { snd: 'chuh', ex: 'chick', o: 'chick' },
      th: { snd: 'thh', ex: 'thumb', o: 'thumb' }, ck: { snd: 'kuh', ex: 'duck', o: 'duck', end: true },
      j: { snd: 'juh', ex: 'jam', o: 'jam' },      w: { snd: 'wuh', ex: 'web', o: 'web' },
      v: { snd: 'vvv', ex: 'van', o: 'van' }
    }
  };

  var LEVELS = [
    // ── Spanish ────────────────────────────────────────────────
    { id: 'es1', lang: 'es', letters: ['a', 'e', 'i', 'o', 'u'], acts: ['sounds'], icon: 'tree',
      title: ['Las vocales', 'The vowels'], pics: [], syl: [], more: '' },
    { id: 'es2', lang: 'es', letters: ['m', 'p', 's', 'l'], acts: ['sounds', 'syll', 'build', 'read'], icon: 'table',
      title: ['m · p · s · l', 'm · p · s · l'],
      syl: W('ma me mi mo mu pa pe pi po pu sa se si so su la le li lo lu'),
      pics: P('mamá|ma.má|mom papá|pa.pá|dad mapa|ma.pa|map puma|pu.ma|puma sopa|so.pa|soup mesa|me.sa|table sapo|sa.po|toad mula|mu.la|mule pala|pa.la|shovel lupa|lu.pa|magnifier isla|is.la|island sol|sol|sun'),
      more: 'a el la los las es me mi su sus sí le al pasa pisa sale usa ama ala sala pelo mil mal misa ' +
            'mmm lola lalo pepe mimi' },
    { id: 'es3', lang: 'es', letters: ['t', 'd'], acts: ['sounds', 'syll', 'build', 'read'], icon: 'tomato',
      title: ['t · d', 't · d'],
      syl: W('ta te ti to tu da de di do du'),
      pics: P('pato|pa.to|duck pelota|pe.lo.ta|ball tomate|to.ma.te|tomato dedo|de.do|finger dado|da.do|dice lata|la.ta|tin'),
      more: 'de da dame toma todo pela mete pum toto tapa mata tela lado sed' },
    { id: 'es4', lang: 'es', letters: ['n', 'r'], acts: ['sounds', 'syll', 'build', 'read'], icon: 'cloud',
      title: ['n · r', 'n · r'],
      syl: W('na ne ni no nu ra re ri ro ru'),
      pics: P('luna|lu.na|moon mano|ma.no|hand pino|pi.no|pine pan|pan|bread rana|ra.na|frog rosa|ro.sa|rose loro|lo.ro|parrot pera|pe.ra|pear nido|ni.do|nest'),
      more: 'un una no en mira mar arena sana roro ni uno son por para ropa rama' },
    { id: 'es5', lang: 'es', letters: ['c', 'b', 'v'], acts: ['sounds', 'syll', 'build', 'read'], icon: 'house',
      title: ['c · b · v', 'c · b · v'],
      syl: W('ca co cu ba be bi bo bu va ve vi vo vu'),
      pics: P('casa|ca.sa|house cama|ca.ma|bed bota|bo.ta|boot bola|bo.la|ball vaca|va.ca|cow vela|ve.la|candle vaso|va.so|glass nube|nu.be|cloud uva|u.va|grapes'),
      more: 'va van vamos camino come pasto canta cantan beso sube todos con como cosa dios!' },
    { id: 'es6', lang: 'es', letters: ['f', 'g'], acts: ['sounds', 'syll', 'build', 'read'], icon: 'seal',
      title: ['f · g', 'f · g'],
      syl: W('fa fe fi fo fu ga go gu'),
      pics: P('foca|fo.ca|seal faro|fa.ro|lighthouse gato|ga.to|cat lago|la.go|lake gota|go.ta|drop sofá|so.fá|sofa'),
      more: 'nada está amigo amiga gana foto' },

    // ── English ────────────────────────────────────────────────
    { id: 'en1', lang: 'en', letters: ['s', 'a', 't', 'p', 'i', 'n'], acts: ['sounds', 'blend', 'build', 'read'], icon: 'sun',
      title: ['s a t p i n', 's a t p i n'],
      pics: P('pin|p.i.n|pin pan|p.a.n|pan tin|t.i.n|tin ant|a.n.t|ant tap|t.a.p|tap nap|n.a.p|nap'),
      more: 'sat sit tip tips taps naps sits pat pit nip sip tan an in it at pip nan nat' },
    { id: 'en2', lang: 'en', letters: ['c', 'e', 'h', 'r', 'm', 'd'], acts: ['sounds', 'blend', 'build', 'read'], icon: 'cat',
      title: ['c e h r m d', 'c e h r m d'],
      pics: P('cat|c.a.t|cat cap|c.a.p|cap hen|h.e.n|hen hat|h.a.t|hat ham|h.a.m|ham rat|r.a.t|rat net|n.e.t|net pen|p.e.n|pen map|m.a.p|map dad|d.a.d|dad'),
      more: 'red ran and am can ha sad mad had set met men ten den did dip hid hit him mat man pad rip rim tim pam dan ted sam' },
    { id: 'en3', lang: 'en', letters: ['g', 'o', 'u', 'l', 'f', 'b', 'x'], acts: ['sounds', 'blend', 'build', 'read'], icon: 'dog',
      title: ['g o u l f b x', 'g o u l f b x'],
      pics: P('dog|d.o.g|dog log|l.o.g|log pot|p.o.t|pot mop|m.o.p|mop fox|f.o.x|fox box|b.o.x|box sun|s.u.n|sun bus|b.u.s|bus bug|b.u.g|bug cup|c.u.p|cup rug|r.u.g|rug bed|b.e.d|bed pig|p.i.g|pig leg|l.e.g|leg bag|b.a.g|bag'),
      more: 'got up on mom dig mud fun hug run hop top hot not dot lot gum hum bun nut cut but us big bit bat fan fat fit fin fig lip lap lid tug dug mmm' },
    { id: 'en4', lang: 'en', letters: ['sh', 'ch', 'th', 'ck', 'j', 'w', 'v'], acts: ['sounds', 'blend', 'build', 'read'], icon: 'ship',
      title: ['sh ch th ck j w v', 'sh ch th ck j w v'],
      pics: P('ship|sh.i.p|ship fish|f.i.sh|fish chick|ch.i.ck|chick duck|d.u.ck|duck sock|s.o.ck|sock rock|r.o.ck|rock jam|j.a.m|jam van|v.a.n|van web|w.e.b|web jet|j.e.t|jet'),
      more: 'wet shop shed chip chin chop thin this that then them with thick back neck pick deck luck jog job vet wig win wag wish shut shot bath math path' }
  ];

  // "Magic words": words a kid learns by sight at a level, for the
  // few that cannot be sounded out with the letters taught so far.
  var SIGHT = {
    es: { y: 2 },
    en: { a: 1, the: 1, i: 1, is: 1, to: 2, no: 2, he: 2, me: 2, we: 2, go: 3, my: 3, you: 3, was: 3, said: 3, are: 3, she: 4, they: 4, her: 4 }
  };

  // ── Books ─────────────────────────────────────────────────────
  var BOOKS = [
    // ———— Español ————
    { id: 'es-mi-mama', lang: 'es', lv: 2, title: 'Mi mamá', cover: 0, pages: [
      ['Mi mamá.', 'room', [['mom', 160, 190, 135]]],
      ['Mamá pasa la sopa.', 'kitchen', [['mom', 105, 190, 130], ['table', 225, 188, 130], ['soup', 225, 142, 60]]],
      ['¡Mmm! La sopa.', 'kitchen', [['table', 160, 188, 150], ['soup', 160, 138, 75], ['kid', 70, 190, 100]]],
      ['Mamá me ama.', 'room', [['mom', 130, 190, 135], ['kid', 205, 190, 100]]],
      ['Mamá es mi sol.', 'garden', [['sun', 255, 92, 90], ['mom', 125, 190, 135], ['kid', 200, 190, 95]]]
    ] },
    { id: 'es-el-sapo', lang: 'es', lv: 2, title: 'El sapo', cover: 0, pages: [
      ['El sapo.', 'pond', [['toad', 160, 178, 120]]],
      ['El sapo sale.', 'garden', [['toad', 190, 188, 105], ['tree', 65, 186, 100]]],
      ['El sapo pasa la mesa.', 'kitchen', [['toad', 75, 190, 85], ['table', 225, 188, 130]]],
      ['¡El sapo pisa la sopa!', 'kitchen', [['table', 160, 188, 150], ['soup', 140, 138, 66], ['toad', 195, 137, 46]]],
      ['¡Mamá! ¡El sapo!', 'kitchen', [['mom', 100, 190, 135], ['table', 230, 188, 120], ['toad', 240, 140, 40]]],
      ['Mamá le pasa la sopa al sapo.', 'kitchen', [['mom', 95, 190, 125], ['table', 205, 188, 110], ['soup', 205, 144, 50], ['toad', 280, 190, 60, true]]]
    ] },
    { id: 'es-papa-mapa', lang: 'es', lv: 2, title: 'Papá y el mapa', cover: 0, pages: [
      ['Papá usa el mapa.', 'room', [['dad', 100, 190, 135], ['table', 225, 188, 130], ['map', 225, 142, 76]]],
      ['Papá usa la lupa.', 'room', [['dad', 95, 190, 135], ['table', 215, 188, 120], ['map', 205, 144, 66], ['magnifier', 262, 150, 50]]],
      ['Es la isla.', 'sunny', [['island', 160, 172, 140]]],
      ['Papá pasa a la isla.', 'beach', [['dad', 95, 190, 115], ['island', 225, 168, 120]]],
      ['¡Sí! ¡Es la isla!', 'beach', [['dad', 115, 190, 120], ['island', 220, 168, 120], ['sun', 55, 70, 60]]]
    ] },
    { id: 'es-pato-lalo', lang: 'es', lv: 3, title: 'El pato Lalo', cover: 0, pages: [
      ['El pato Lalo.', 'pond', [['duck', 160, 176, 125]]],
      ['Lalo toma la pelota.', 'pond', [['duck', 110, 178, 110], ['ball', 215, 172, 60]]],
      ['Pum, pum, pum.', 'garden', [['ball', 150, 128, 50], ['duck', 235, 190, 105, true]]],
      ['La pelota pasa a papá.', 'garden', [['duck', 70, 190, 70], ['ball', 175, 118, 44], ['dad', 245, 190, 130]]],
      ['Papá la toma.', 'garden', [['dad', 150, 190, 135], ['ball', 205, 150, 40]]],
      ['Papá da la pelota a Lalo.', 'garden', [['dad', 105, 190, 125], ['ball', 175, 172, 44], ['duck', 240, 190, 90, true]]]
    ] },
    { id: 'es-sopa-tomate', lang: 'es', lv: 3, title: 'La sopa de tomate', cover: 0, pages: [
      ['Mamá usa el tomate.', 'kitchen', [['mom', 100, 190, 135], ['table', 228, 188, 125], ['tomato', 228, 142, 52]]],
      ['Mamá pela el tomate.', 'kitchen', [['mom', 105, 190, 135], ['table', 228, 188, 125], ['tomato', 228, 142, 60]]],
      ['Mamá mete el tomate a la sopa.', 'kitchen', [['mom', 95, 190, 130], ['table', 220, 188, 125], ['soup', 220, 142, 64], ['tomato', 222, 100, 34]]],
      ['La sopa es de tomate. ¡Mmm!', 'kitchen', [['table', 160, 188, 160], ['soup', 160, 136, 88]]],
      ['Papá toma la sopa.', 'kitchen', [['dad', 100, 190, 135], ['table', 225, 188, 120], ['soup', 225, 144, 56]]],
      ['¡Papá toma todo!', 'kitchen', [['dad', 160, 190, 140], ['table', 250, 188, 80]]]
    ] },
    { id: 'es-rana-luna', lang: 'es', lv: 4, title: 'La rana y la luna', cover: 0, pages: [
      ['La rana mira la luna.', 'night', [['frog', 105, 190, 105], ['moon', 225, 105, 105]]],
      ['La luna sale en el mar.', 'night', [['moon', 200, 98, 115]]],
      ['La rana sale a la arena.', 'beach', [['frog', 165, 188, 105]]],
      ['La rana mira el mar.', 'beach', [['frog', 120, 190, 105], ['sun', 250, 62, 70]]],
      ['¡Una luna en el mar!', 'night', [['moon', 160, 96, 100], ['frog', 75, 190, 80]]],
      ['La rana ama la luna.', 'night', [['frog', 110, 190, 105], ['moon', 225, 105, 105]]]
    ] },
    { id: 'es-pepe-pera', lang: 'es', lv: 4, title: 'Pepe y la pera', cover: 0, pages: [
      ['Pepe mira una pera.', 'garden', [['kid', 105, 190, 115], ['pear', 215, 160, 70]]],
      ['Pepe pela la pera.', 'garden', [['kid', 130, 190, 120], ['pear', 205, 150, 56]]],
      ['Pepe toma la pera.', 'garden', [['kid', 160, 190, 125], ['pear', 210, 158, 46]]],
      ['¡Mmm, una pera!', 'garden', [['kid', 160, 190, 130], ['pear', 215, 160, 56]]],
      ['Pepe da la pera a mamá.', 'garden', [['kid', 100, 190, 105], ['pear', 165, 160, 46], ['mom', 235, 190, 125]]],
      ['Es una pera sana.', 'garden', [['pear', 160, 176, 130]]]
    ] },
    { id: 'es-vaca-rosa', lang: 'es', lv: 5, title: 'La vaca Rosa', cover: 0, pages: [
      ['La vaca Rosa.', 'field', [['cow', 160, 188, 135]]],
      ['Rosa va por el camino.', 'field', [['cow', 225, 190, 105, true]]],
      ['Rosa come pasto.', 'field', [['cow', 165, 190, 130]]],
      ['Rosa mira una nube.', 'field', [['cow', 110, 190, 115], ['cloud', 225, 78, 95]]],
      ['La nube pasa.', 'field', [['cow', 100, 190, 100], ['cloud', 240, 70, 110]]],
      ['Rosa va a la casa.', 'field', [['cow', 110, 190, 105], ['house', 250, 176, 115]]]
    ] },
    { id: 'es-la-misa', lang: 'es', lv: 5, title: 'Vamos a la misa', cover: 0, pages: [
      ['Vamos a la misa.', 'church', [['mom', 105, 192, 120], ['dad', 165, 192, 125], ['kid', 225, 192, 92]]],
      ['Mamá y papá van a la misa.', 'church', [['mom', 125, 192, 130], ['dad', 205, 192, 135]]],
      ['Es la casa de Dios.', 'church', [['candle', 160, 175, 95]]],
      ['Una vela, una vela.', 'church', [['candle', 105, 190, 105], ['candle', 215, 190, 105]]],
      ['Todos cantan en la misa.', 'church', [['mom', 90, 192, 115], ['dad', 155, 192, 120], ['kid', 218, 192, 90]]],
      ['Mamá me da un beso.', 'room', [['mom', 130, 190, 135], ['kid', 205, 190, 100]]]
    ] },
    { id: 'es-la-foca', lang: 'es', lv: 6, title: 'La foca', cover: 0, pages: [
      ['La foca nada en el mar.', 'beach', [['seal', 170, 186, 125]]],
      ['La foca mira el faro.', 'beach', [['seal', 105, 190, 115], ['lighthouse', 245, 172, 135]]],
      ['El faro está en una isla.', 'beach', [['island', 160, 176, 135], ['lighthouse', 168, 140, 78]]],
      ['La foca sube a la arena.', 'beach', [['seal', 170, 190, 125]]],
      ['La foca toma sol.', 'sunny', [['seal', 170, 190, 125], ['sun', 262, 70, 72]]],
      ['La foca nada, nada, nada.', 'beach', [['seal', 150, 186, 120]]]
    ] },

    // ———— English ————
    { id: 'en-pip-ant', lang: 'en', lv: 1, title: 'Pip the Ant', cover: 0, pages: [
      ['Pip the ant.', 'garden', [['ant', 160, 188, 135]]],
      ['Pip sat in a tin.', 'garden', [['tin', 170, 190, 120], ['ant', 172, 108, 52]]],
      ['Nat the ant sat in a pan.', 'garden', [['pan', 170, 186, 135], ['ant', 158, 130, 48]]],
      ['Tap, tap, tap!', 'garden', [['ant', 105, 190, 95], ['tin', 225, 190, 105]]],
      ['Pip tips the tin.', 'garden', [['ant', 100, 190, 95], ['tin', 215, 190, 105, true]]],
      ['Pip naps. Nat naps.', 'garden', [['ant', 105, 190, 90], ['ant', 225, 190, 90, true]]]
    ] },
    { id: 'en-tap-tap', lang: 'en', lv: 1, title: 'Tap, Tap, Tap', cover: 0, pages: [
      ['Nat taps a pan.', 'garden', [['ant', 100, 190, 95], ['pan', 225, 184, 120]]],
      ['Pip taps a tin.', 'garden', [['ant', 100, 190, 95], ['tin', 225, 190, 105]]],
      ['Tap, tap, tap!', 'garden', [['ant', 70, 190, 80], ['pan', 160, 186, 95], ['ant', 245, 190, 80, true], ['tin', 205, 190, 60]]],
      ['Nat taps it. Pip taps it.', 'garden', [['ant', 80, 190, 85], ['pan', 160, 186, 100], ['ant', 245, 190, 85, true]]],
      ['Tap, tap, tap, tap!', 'garden', [['pan', 110, 186, 100], ['tin', 215, 190, 100]]],
      ['Nat naps. Pip naps.', 'garden', [['ant', 105, 190, 90], ['ant', 225, 190, 90, true]]]
    ] },
    { id: 'en-red-hen', lang: 'en', lv: 2, title: 'The Red Hen', cover: 0, pages: [
      ['The red hen.', 'field', [['hen', 160, 188, 140]]],
      ['The red hen sat.', 'field', [['hen', 160, 190, 135]]],
      ['A rat ran in.', 'field', [['hen', 105, 190, 115], ['rat', 245, 190, 80, true]]],
      ['The rat sat. The hen sat.', 'field', [['hen', 105, 190, 115], ['rat', 225, 190, 80, true]]],
      ['The hen and the rat sat.', 'field', [['hen', 120, 190, 120], ['rat', 215, 190, 85, true]]],
      ['The hen and the rat had a nap.', 'field', [['nap', 160, 190, 115]]]
    ] },
    { id: 'en-dads-hat', lang: 'en', lv: 2, title: "Dad's Hat", cover: 0, pages: [
      ['Dad had a red hat.', 'garden', [['dad', 115, 190, 140], ['hat', 225, 186, 85]]],
      ['No hat! Dad is sad.', 'garden', [['dad', 160, 190, 145]]],
      ['Dad ran and ran.', 'field', [['dad', 175, 190, 140]]],
      ['A hen sat in the hat!', 'field', [['hat', 160, 184, 115], ['hen', 160, 142, 58]]],
      ['Ha, ha, ha!', 'field', [['dad', 100, 190, 125], ['hat', 215, 186, 85], ['hen', 215, 146, 48]]],
      ['Dad is mad? No, no, no!', 'field', [['dad', 105, 190, 130], ['hat', 225, 186, 85], ['hen', 225, 146, 48]]]
    ] },
    { id: 'en-mud-fun', lang: 'en', lv: 3, title: 'Mud Fun', cover: 0, pages: [
      ['A big pig.', 'field', [['pig', 160, 188, 140]]],
      ['The pig got in the mud.', 'mud', [['pig', 165, 170, 120]]],
      ['Dig, dig, dig!', 'mud', [['pig', 165, 172, 125]]],
      ['A dog ran up.', 'mud', [['pig', 100, 168, 95], ['dog', 250, 190, 90, true]]],
      ['The dog got in the mud.', 'mud', [['pig', 110, 168, 95], ['dog', 215, 170, 95]]],
      ['The pig and the dog had fun!', 'mud', [['pig', 105, 168, 95], ['dog', 220, 170, 95], ['sun', 160, 62, 60]]]
    ] },
    { id: 'en-red-bus', lang: 'en', lv: 3, title: 'The Red Bus', cover: 0, pages: [
      ['The red bus.', 'road', [['bus', 160, 172, 160]]],
      ['Mom got on the bus.', 'road', [['bus', 220, 172, 130], ['mom', 85, 190, 120]]],
      ['Dad got on the bus.', 'road', [['bus', 220, 172, 130], ['dad', 85, 190, 125]]],
      ['I got on the bus.', 'road', [['bus', 220, 172, 130], ['kid', 85, 190, 100]]],
      ['The bus ran and ran.', 'road', [['bus', 160, 172, 160]]],
      ['Up, up, up!', 'road', [['bus', 160, 172, 150], ['sun', 265, 55, 60]]],
      ['Fun, fun, fun!', 'road', [['bus', 150, 172, 120], ['mom', 245, 190, 80], ['dad', 285, 190, 84], ['kid', 40, 190, 70]]]
    ] },
    { id: 'en-duck-chick', lang: 'en', lv: 4, title: 'Duck and Chick', cover: 0, pages: [
      ['A duck and a chick.', 'pond', [['duck', 115, 176, 105], ['chick', 225, 182, 80]]],
      ['The duck sat on a rock.', 'pond', [['rock', 160, 182, 120], ['duck', 160, 130, 78]]],
      ['The chick sat on the duck.', 'pond', [['duck', 160, 184, 120], ['chick', 160, 120, 46]]],
      ['The duck ran. The chick ran.', 'garden', [['duck', 110, 190, 100], ['chick', 230, 190, 70]]],
      ['The duck got wet.', 'pond', [['duck', 160, 168, 125]]],
      ['The chick got wet.', 'pond', [['chick', 160, 170, 105]]],
      ['Duck and chick had fun!', 'pond', [['duck', 115, 170, 105], ['chick', 220, 172, 80], ['sun', 270, 52, 50]]]
    ] },
    { id: 'en-the-ship', lang: 'en', lv: 4, title: 'The Ship', cover: 0, pages: [
      ['A big ship.', 'beach', [['ship', 165, 172, 175]]],
      ['Mom and Dad are on the ship.', 'beach', [['ship', 165, 172, 150], ['mom', 70, 190, 70], ['dad', 262, 190, 74]]],
      ['I am on the ship.', 'beach', [['ship', 190, 172, 150], ['kid', 62, 190, 90]]],
      ['A fish! A fish! A fish!', 'beach', [['fish', 80, 160, 70], ['fish', 160, 140, 80], ['fish', 240, 160, 70, true]]],
      ['Dad can fish.', 'beach', [['dad', 110, 190, 135], ['fish', 220, 150, 60]]],
      ['Dad got a big fish!', 'beach', [['dad', 115, 190, 135], ['fish', 215, 150, 90]]],
      ['Mom, Dad and I had fun!', 'beach', [['mom', 110, 190, 125], ['dad', 175, 190, 130], ['kid', 240, 190, 100], ['sun', 55, 62, 60]]]
    ] }
  ];

  // ── Derived views ─────────────────────────────────────────────
  var byId = {}, byLang = { es: [], en: [] }, bookById = {};
  LEVELS.forEach(function(l, i) { l.n = byLang[l.lang].length + 1; l.pics = l.pics || []; byId[l.id] = l; byLang[l.lang].push(l); });
  BOOKS.forEach(function(b) { bookById[b.id] = b; });

  // The letters taught up to and including a level (a list of graphemes).
  function taught(levelId) {
    var l = byId[levelId], out = [];
    byLang[l.lang].forEach(function(x) { if (x.n <= l.n) out = out.concat(x.letters); });
    return out;
  }

  return {
    LETTERS: LETTERS, SIGHT: SIGHT, LEVELS: LEVELS, BOOKS: BOOKS,
    level: function(id) { return byId[id] || null; },
    levels: function(lang) { return byLang[lang].slice(); },
    book: function(id) { return bookById[id] || null; },
    books: function(lang) { return BOOKS.filter(function(b) { return b.lang === lang; }); },
    booksOf: function(levelId) { var l = byId[levelId]; return BOOKS.filter(function(b) { return b.lang === l.lang && b.lv === l.n; }); },
    taught: taught,
    W: W
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LectorData;
