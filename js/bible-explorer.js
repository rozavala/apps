/* ================================================================
   BIBLE EXPLORER — bible-explorer.js
   Scripture companion to Fe Explorador: stories, verses, books drill.
   All content hand-authored from public-domain Catholic sources
   (Reina-Valera 1909 / Douay-Rheims). No external APIs.

   Requires: auth.js, sounds.js, activity-log.js, zs-diag.js
   ================================================================ */

const BibleExplorer = (() => {
  'use strict';

  const STORE_PREFIX = 'zs_bible_';

  // ── 15 stories, age-graded, bilingual ─────────────────────────────
  const STORIES = [
    {
      id: 'creation', testament: 'OT', icon: '🌅', ageMin: 6,
      title: { en: 'The Creation', es: 'La Creación' },
      summary: {
        en: 'In the beginning, God made the heavens and the earth. On six days He made light, sky, sea, land, sun and moon, plants and animals. On the seventh day He rested. He saw that everything He made was good.',
        es: 'En el principio, Dios hizo los cielos y la tierra. En seis días hizo la luz, el cielo, el mar, la tierra, el sol y la luna, las plantas y los animales. En el séptimo día descansó. Vio que todo lo que había hecho era bueno.'
      },
      quiz: [
        { q: { en: 'How many days did God create in?', es: '¿En cuántos días creó Dios?' },
          options: { en: ['Five','Six','Seven','Ten'], es: ['Cinco','Seis','Siete','Diez'] }, answer: 1 },
        { q: { en: 'What did God do on the seventh day?', es: '¿Qué hizo Dios el séptimo día?' },
          options: { en: ['Sang','Worked','Rested','Walked'], es: ['Cantó','Trabajó','Descansó','Caminó'] }, answer: 2 }
      ]
    },
    {
      id: 'noah', testament: 'OT', icon: '🌈', ageMin: 6,
      title: { en: 'Noah and the Ark', es: 'Noé y el Arca' },
      summary: {
        en: 'God told Noah to build a great ark to save his family and two of every animal from a flood. After 40 days of rain, the waters went down. God set a rainbow in the sky as a sign of His promise.',
        es: 'Dios le dijo a Noé que construyera una gran arca para salvar a su familia y a dos de cada animal del diluvio. Después de 40 días de lluvia, las aguas bajaron. Dios puso un arcoíris en el cielo como señal de Su promesa.'
      },
      quiz: [
        { q: { en: 'How many of each animal did Noah take?', es: '¿Cuántos animales de cada clase llevó Noé?' },
          options: { en: ['One','Two','Three','Seven'], es: ['Uno','Dos','Tres','Siete'] }, answer: 1 },
        { q: { en: 'What did God put in the sky?', es: '¿Qué puso Dios en el cielo?' },
          options: { en: ['A star','A rainbow','A cloud','A dove'], es: ['Una estrella','Un arcoíris','Una nube','Una paloma'] }, answer: 1 }
      ]
    },
    {
      id: 'abraham', testament: 'OT', icon: '⭐', ageMin: 7,
      title: { en: 'Abraham\'s Promise', es: 'La Promesa a Abrahán' },
      summary: {
        en: 'God told Abraham to leave his country and promised that his descendants would be as many as the stars. Abraham trusted God. He is called the father of faith.',
        es: 'Dios le dijo a Abrahán que dejara su tierra y le prometió que sus descendientes serían tan numerosos como las estrellas. Abrahán confió en Dios. Es llamado el padre de la fe.'
      },
      quiz: [
        { q: { en: 'What did God compare Abraham\'s descendants to?', es: '¿Con qué comparó Dios a los descendientes de Abrahán?' },
          options: { en: ['Stars','Mountains','Trees','Fish'], es: ['Estrellas','Montañas','Árboles','Peces'] }, answer: 0 }
      ]
    },
    {
      id: 'moses', testament: 'OT', icon: '🔥', ageMin: 6,
      title: { en: 'Moses and the Exodus', es: 'Moisés y el Éxodo' },
      summary: {
        en: 'God spoke to Moses from a burning bush and sent him to free His people from Egypt. After ten plagues, Pharaoh let them go. God parted the Red Sea so they could cross to freedom.',
        es: 'Dios le habló a Moisés desde una zarza ardiente y lo envió a liberar a Su pueblo de Egipto. Después de diez plagas, el Faraón los dejó ir. Dios dividió el Mar Rojo para que pudieran cruzar hacia la libertad.'
      },
      quiz: [
        { q: { en: 'How did God speak to Moses?', es: '¿Cómo le habló Dios a Moisés?' },
          options: { en: ['From a cloud','From a burning bush','From a mountain','From a river'], es: ['Desde una nube','Desde una zarza ardiente','Desde una montaña','Desde un río'] }, answer: 1 },
        { q: { en: 'How many plagues did God send?', es: '¿Cuántas plagas envió Dios?' },
          options: { en: ['Seven','Eight','Ten','Twelve'], es: ['Siete','Ocho','Diez','Doce'] }, answer: 2 }
      ]
    },
    {
      id: 'david', testament: 'OT', icon: '🪨', ageMin: 7,
      title: { en: 'David and Goliath', es: 'David y Goliat' },
      summary: {
        en: 'When the Philistine giant Goliath challenged Israel, the young shepherd David trusted in God and faced him with only a sling and five stones. He defeated Goliath and later became king of Israel.',
        es: 'Cuando el gigante filisteo Goliat desafió a Israel, el joven pastor David confió en Dios y lo enfrentó con sólo una honda y cinco piedras. Derrotó a Goliat y más tarde llegó a ser rey de Israel.'
      },
      quiz: [
        { q: { en: 'How many stones did David take?', es: '¿Cuántas piedras tomó David?' },
          options: { en: ['Three','Five','Seven','Ten'], es: ['Tres','Cinco','Siete','Diez'] }, answer: 1 },
        { q: { en: 'What did David become later?', es: '¿En qué se convirtió David más tarde?' },
          options: { en: ['Priest','Prophet','King','Judge'], es: ['Sacerdote','Profeta','Rey','Juez'] }, answer: 2 }
      ]
    },
    {
      id: 'solomon', testament: 'OT', icon: '👑', ageMin: 8,
      title: { en: 'Solomon\'s Wisdom', es: 'La Sabiduría de Salomón' },
      summary: {
        en: 'When King Solomon, David\'s son, became king, God offered him anything he wished. Solomon asked for wisdom to rule his people well. God was pleased and gave him wisdom, riches, and a long reign.',
        es: 'Cuando el rey Salomón, hijo de David, llegó al trono, Dios le ofreció lo que quisiera. Salomón pidió sabiduría para gobernar bien a su pueblo. Dios se complació y le dio sabiduría, riquezas y un largo reinado.'
      },
      quiz: [
        { q: { en: 'What did Solomon ask for?', es: '¿Qué pidió Salomón?' },
          options: { en: ['Gold','Power','Wisdom','Long life'], es: ['Oro','Poder','Sabiduría','Larga vida'] }, answer: 2 }
      ]
    },
    {
      id: 'daniel', testament: 'OT', icon: '🦁', ageMin: 6,
      title: { en: 'Daniel in the Lions\' Den', es: 'Daniel en el Foso de los Leones' },
      summary: {
        en: 'Daniel prayed to God three times each day. His enemies tricked the king into throwing him to the lions. God sent an angel to shut the lions\' mouths, and Daniel was saved.',
        es: 'Daniel oraba a Dios tres veces al día. Sus enemigos engañaron al rey para que lo arrojaran a los leones. Dios envió un ángel a cerrar la boca de los leones, y Daniel fue salvado.'
      },
      quiz: [
        { q: { en: 'How often did Daniel pray?', es: '¿Cuántas veces al día oraba Daniel?' },
          options: { en: ['Once','Twice','Three times','Five times'], es: ['Una vez','Dos veces','Tres veces','Cinco veces'] }, answer: 2 },
        { q: { en: 'Who shut the lions\' mouths?', es: '¿Quién cerró la boca de los leones?' },
          options: { en: ['A guard','An angel','The king','Another prophet'], es: ['Un guardia','Un ángel','El rey','Otro profeta'] }, answer: 1 }
      ]
    },
    {
      id: 'jonah', testament: 'OT', icon: '🐋', ageMin: 6,
      title: { en: 'Jonah and the Great Fish', es: 'Jonás y el Gran Pez' },
      summary: {
        en: 'God told Jonah to go preach to the city of Nineveh, but Jonah ran away on a ship. A storm rose, and Jonah was swallowed by a great fish. After three days he was set free, and he obeyed God.',
        es: 'Dios le dijo a Jonás que fuera a predicar a la ciudad de Nínive, pero Jonás huyó en un barco. Se levantó una tormenta y Jonás fue tragado por un gran pez. Después de tres días fue liberado y obedeció a Dios.'
      },
      quiz: [
        { q: { en: 'How long was Jonah in the fish?', es: '¿Cuánto tiempo estuvo Jonás en el pez?' },
          options: { en: ['One day','Three days','Seven days','Forty days'], es: ['Un día','Tres días','Siete días','Cuarenta días'] }, answer: 1 }
      ]
    },
    {
      id: 'prophets', testament: 'OT', icon: '📜', ageMin: 8,
      title: { en: 'The Prophets', es: 'Los Profetas' },
      summary: {
        en: 'God sent prophets to call His people back to Him. Isaiah foretold a Saviour. Jeremiah wept for Jerusalem. Ezekiel saw visions. The prophets prepared the way for Jesus.',
        es: 'Dios envió profetas para llamar a Su pueblo de regreso a Él. Isaías anunció un Salvador. Jeremías lloró por Jerusalén. Ezequiel tuvo visiones. Los profetas prepararon el camino para Jesús.'
      },
      quiz: [
        { q: { en: 'Who foretold a Saviour?', es: '¿Quién anunció un Salvador?' },
          options: { en: ['Isaiah','Jeremiah','Ezekiel','Daniel'], es: ['Isaías','Jeremías','Ezequiel','Daniel'] }, answer: 0 }
      ]
    },
    {
      id: 'annunciation', testament: 'NT', icon: '👼', ageMin: 6,
      title: { en: 'The Annunciation', es: 'La Anunciación' },
      summary: {
        en: 'The angel Gabriel was sent to Nazareth to a young woman named Mary. He told her she would have a son, Jesus, who would be the Son of God. Mary said yes: "Behold, the handmaid of the Lord."',
        es: 'El ángel Gabriel fue enviado a Nazaret a una joven llamada María. Le dijo que tendría un hijo, Jesús, que sería el Hijo de Dios. María dijo sí: "He aquí la sierva del Señor."'
      },
      quiz: [
        { q: { en: 'Which angel visited Mary?', es: '¿Qué ángel visitó a María?' },
          options: { en: ['Michael','Raphael','Gabriel','Uriel'], es: ['Miguel','Rafael','Gabriel','Uriel'] }, answer: 2 }
      ]
    },
    {
      id: 'nativity', testament: 'NT', icon: '⭐', ageMin: 6,
      title: { en: 'The Nativity', es: 'La Navidad' },
      summary: {
        en: 'Mary and Joseph travelled to Bethlehem for the census. There was no room at the inn, so Jesus was born in a stable and laid in a manger. Shepherds came to adore Him, guided by an angel.',
        es: 'María y José viajaron a Belén para el censo. No había lugar en la posada, así que Jesús nació en un establo y fue acostado en un pesebre. Los pastores fueron a adorarlo, guiados por un ángel.'
      },
      quiz: [
        { q: { en: 'Where was Jesus born?', es: '¿Dónde nació Jesús?' },
          options: { en: ['Nazareth','Bethlehem','Jerusalem','Cana'], es: ['Nazaret','Belén','Jerusalén','Caná'] }, answer: 1 },
        { q: { en: 'Where did Mary lay Him?', es: '¿Dónde lo acostó María?' },
          options: { en: ['A bed','A boat','A manger','A throne'], es: ['Una cama','Un barco','Un pesebre','Un trono'] }, answer: 2 }
      ]
    },
    {
      id: 'baptism', testament: 'NT', icon: '🕊️', ageMin: 8,
      title: { en: 'The Baptism of Jesus', es: 'El Bautismo de Jesús' },
      summary: {
        en: 'When Jesus was thirty, He came to the river Jordan to be baptised by John the Baptist. The heavens opened, the Holy Spirit came down as a dove, and the Father\'s voice was heard: "This is my beloved Son."',
        es: 'Cuando Jesús tenía treinta años, fue al río Jordán para ser bautizado por Juan el Bautista. Los cielos se abrieron, el Espíritu Santo bajó como una paloma, y se oyó la voz del Padre: "Este es mi Hijo amado."'
      },
      quiz: [
        { q: { en: 'Who baptised Jesus?', es: '¿Quién bautizó a Jesús?' },
          options: { en: ['Peter','John the Baptist','Andrew','James'], es: ['Pedro','Juan el Bautista','Andrés','Santiago'] }, answer: 1 },
        { q: { en: 'How did the Holy Spirit appear?', es: '¿Cómo apareció el Espíritu Santo?' },
          options: { en: ['As a wind','As a flame','As a dove','As a star'], es: ['Como un viento','Como una llama','Como una paloma','Como una estrella'] }, answer: 2 }
      ]
    },
    {
      id: 'sermon', testament: 'NT', icon: '⛰️', ageMin: 8,
      title: { en: 'The Sermon on the Mount', es: 'El Sermón del Monte' },
      summary: {
        en: 'Jesus went up a mountain and taught the crowds. He spoke the Beatitudes ("Blessed are the poor in spirit…") and taught the Our Father. He showed how to love God and neighbour above all.',
        es: 'Jesús subió a un monte y enseñó a las multitudes. Habló las Bienaventuranzas ("Bienaventurados los pobres de espíritu…") y enseñó el Padre Nuestro. Mostró cómo amar a Dios y al prójimo sobre todo.'
      },
      quiz: [
        { q: { en: 'What prayer did Jesus teach here?', es: '¿Qué oración enseñó Jesús aquí?' },
          options: { en: ['Hail Mary','Our Father','Glory Be','Creed'], es: ['Ave María','Padre Nuestro','Gloria','Credo'] }, answer: 1 }
      ]
    },
    {
      id: 'passion', testament: 'NT', icon: '✝️', ageMin: 8,
      title: { en: 'Passion and Resurrection', es: 'Pasión y Resurrección' },
      summary: {
        en: 'Jesus had a Last Supper with His apostles, was arrested in the garden, and crucified on Good Friday. He died and was buried. On the third day, Easter Sunday, He rose from the dead — alleluia!',
        es: 'Jesús tuvo una Última Cena con Sus apóstoles, fue arrestado en el huerto y crucificado el Viernes Santo. Murió y fue sepultado. Al tercer día, el Domingo de Pascua, resucitó de entre los muertos — ¡aleluya!'
      },
      quiz: [
        { q: { en: 'On what day did Jesus rise?', es: '¿En qué día resucitó Jesús?' },
          options: { en: ['Friday','Saturday','Sunday','Monday'], es: ['Viernes','Sábado','Domingo','Lunes'] }, answer: 2 },
        { q: { en: 'What was the meal called?', es: '¿Cómo se llamó la comida?' },
          options: { en: ['First Supper','Last Supper','Holy Meal','Bread of Heaven'], es: ['Primera Cena','Última Cena','Comida Santa','Pan del Cielo'] }, answer: 1 }
      ]
    },
    {
      id: 'pentecost', testament: 'NT', icon: '🔥', ageMin: 8,
      title: { en: 'Pentecost', es: 'Pentecostés' },
      summary: {
        en: 'Fifty days after Easter, the apostles were gathered in prayer. A mighty wind filled the room and tongues of fire rested on each of them. Filled with the Holy Spirit, they went out to preach the Good News.',
        es: 'Cincuenta días después de Pascua, los apóstoles estaban reunidos en oración. Un viento fuerte llenó la sala y lenguas de fuego se posaron sobre cada uno. Llenos del Espíritu Santo, salieron a predicar la Buena Nueva.'
      },
      quiz: [
        { q: { en: 'How many days after Easter is Pentecost?', es: '¿Cuántos días después de Pascua es Pentecostés?' },
          options: { en: ['Forty','Fifty','Seven','Three'], es: ['Cuarenta','Cincuenta','Siete','Tres'] }, answer: 1 }
      ]
    }
  ];

  // ── 30 verses for fill-in-the-blank memorisation ─────────────────
  // Translation: Reina-Valera 1909 (ES) / Douay-Rheims (EN), both
  // public-domain. The "blank" is the word(s) the kid fills in.
  // tier: 1 = one blank, 2 = two blanks, 3 = three blanks.
  const VERSES = [
    { ref: 'Gen 1:1', tier: 1,
      en: 'In the beginning God created [heaven] and earth.',
      es: 'En el principio creó Dios los [cielos] y la tierra.' },
    { ref: 'Ps 23:1', tier: 1,
      en: 'The Lord is my [shepherd]; I shall not want.',
      es: 'Jehová es mi [pastor]; nada me faltará.' },
    { ref: 'Ps 27:1', tier: 1,
      en: 'The Lord is my [light] and my salvation.',
      es: 'Jehová es mi [luz] y mi salvación.' },
    { ref: 'Ps 100:1', tier: 1,
      en: 'Sing joyfully to God, all the [earth].',
      es: 'Cantad alegres a Dios, habitantes de toda la [tierra].' },
    { ref: 'Ps 118:24', tier: 1,
      en: 'This is the day which the Lord hath made; let us rejoice and be [glad] in it.',
      es: 'Este es el día que hizo Jehová; nos gozaremos y [alegraremos] en él.' },
    { ref: 'Prov 3:5', tier: 2,
      en: 'Trust in the [Lord] with all thy heart, and lean not on thy own [understanding].',
      es: 'Confía en [Jehová] de todo tu corazón, y no te apoyes en tu propia [prudencia].' },
    { ref: 'Isa 9:6', tier: 2,
      en: 'For a [child] is born to us, and a [son] is given to us.',
      es: 'Porque un [niño] nos es nacido, [hijo] nos es dado.' },
    { ref: 'Isa 40:31', tier: 1,
      en: 'They that hope in the Lord shall renew their [strength].',
      es: 'Los que esperan a Jehová tendrán nuevas [fuerzas].' },
    { ref: 'Mic 6:8', tier: 1,
      en: 'To do [justice], and to love mercy, and to walk humbly with thy God.',
      es: 'Hacer [justicia], y amar misericordia, y humillarte ante tu Dios.' },
    { ref: 'Mt 5:3', tier: 1,
      en: 'Blessed are the poor in [spirit]: for theirs is the kingdom of heaven.',
      es: 'Bienaventurados los pobres en [espíritu]: porque de ellos es el reino de los cielos.' },
    { ref: 'Mt 5:9', tier: 1,
      en: 'Blessed are the [peacemakers]: for they shall be called the children of God.',
      es: 'Bienaventurados los [pacificadores]: porque ellos serán llamados hijos de Dios.' },
    { ref: 'Mt 6:9', tier: 1,
      en: 'Our [Father] who art in heaven, hallowed be thy name.',
      es: '[Padre] nuestro que estás en los cielos, santificado sea tu nombre.' },
    { ref: 'Mt 6:33', tier: 2,
      en: 'Seek ye first the [kingdom] of God, and his [justice].',
      es: 'Mas buscad primeramente el [reino] de Dios y su [justicia].' },
    { ref: 'Mt 7:7', tier: 1,
      en: 'Ask, and it shall be given you: [seek], and you shall find.',
      es: 'Pedid, y se os dará; [buscad], y hallaréis.' },
    { ref: 'Mt 19:14', tier: 1,
      en: 'Suffer the little [children] to come unto me.',
      es: 'Dejad a los [niños] venir a mí.' },
    { ref: 'Mt 22:37', tier: 2,
      en: 'Thou shalt love the [Lord] thy God with thy whole [heart].',
      es: 'Amarás al [Señor] tu Dios con todo tu [corazón].' },
    { ref: 'Mt 28:19', tier: 1,
      en: 'Going therefore, teach ye all [nations].',
      es: 'Id, pues, y enseñad a todas las [naciones].' },
    { ref: 'Lk 1:38', tier: 1,
      en: 'Behold the handmaid of the [Lord]; be it done to me according to thy word.',
      es: 'He aquí la sierva del [Señor]; hágase conmigo conforme a tu palabra.' },
    { ref: 'Lk 2:14', tier: 2,
      en: 'Glory to God in the highest; and on earth [peace] to men of [good will].',
      es: 'Gloria a Dios en las alturas; y en la tierra [paz], [buena voluntad] para con los hombres.' },
    { ref: 'Lk 11:9', tier: 1,
      en: 'Ask, and it shall be given you; seek, and you shall [find].',
      es: 'Pedid, y se os dará; buscad, y [hallaréis].' },
    { ref: 'Jn 1:1', tier: 2,
      en: 'In the beginning was the [Word], and the Word was with [God].',
      es: 'En el principio era el [Verbo], y el Verbo era con [Dios].' },
    { ref: 'Jn 3:16', tier: 2,
      en: 'God so [loved] the world that he gave his only begotten [Son].',
      es: 'De tal manera [amó] Dios al mundo, que ha dado a su [Hijo] unigénito.' },
    { ref: 'Jn 8:12', tier: 1,
      en: 'I am the [light] of the world.',
      es: 'Yo soy la [luz] del mundo.' },
    { ref: 'Jn 13:34', tier: 1,
      en: 'A new commandment I give unto you: That you love one [another].',
      es: 'Un mandamiento nuevo os doy: Que os améis [unos a otros].' },
    { ref: 'Jn 14:6', tier: 3,
      en: 'I am the [way], and the [truth], and the [life].',
      es: 'Yo soy el [camino], y la [verdad], y la [vida].' },
    { ref: 'Jn 15:13', tier: 1,
      en: 'Greater [love] than this no man hath, that a man lay down his life for his friends.',
      es: 'Nadie tiene mayor [amor] que el que pone su vida por sus amigos.' },
    { ref: 'Rom 8:28', tier: 1,
      en: 'All things work together for [good] to them that love God.',
      es: 'Todas las cosas obran para [bien] de los que aman a Dios.' },
    { ref: '1 Cor 13:4', tier: 2,
      en: 'Charity is [patient], is [kind].',
      es: 'La caridad es [paciente], es [benigna].' },
    { ref: 'Phil 4:13', tier: 1,
      en: 'I can do all things in him who [strengtheneth] me.',
      es: 'Todo lo puedo en Cristo que me [fortalece].' },
    { ref: '1 Jn 4:8', tier: 1,
      en: 'God is [love].',
      es: 'Dios es [amor].' }
  ];

  // ── 73 books of the Catholic canon, grouped ─────────────────────
  const BOOK_GROUPS = [
    {
      id: 'pentateuch', testament: 'OT',
      label: { en: 'Pentateuch', es: 'Pentateuco' },
      books: ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy']
    },
    {
      id: 'historical', testament: 'OT',
      label: { en: 'Historical', es: 'Históricos' },
      books: ['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings',
              '1 Chronicles','2 Chronicles','Ezra','Nehemiah','Tobit','Judith',
              'Esther','1 Maccabees','2 Maccabees']
    },
    {
      id: 'wisdom', testament: 'OT',
      label: { en: 'Wisdom', es: 'Sapienciales' },
      books: ['Job','Psalms','Proverbs','Ecclesiastes','Song of Songs','Wisdom','Sirach']
    },
    {
      id: 'prophets', testament: 'OT',
      label: { en: 'Prophets', es: 'Proféticos' },
      books: ['Isaiah','Jeremiah','Lamentations','Baruch','Ezekiel','Daniel',
              'Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum',
              'Habakkuk','Zephaniah','Haggai','Zechariah','Malachi']
    },
    {
      id: 'gospels', testament: 'NT',
      label: { en: 'Gospels', es: 'Evangelios' },
      books: ['Matthew','Mark','Luke','John']
    },
    {
      id: 'acts', testament: 'NT',
      label: { en: 'Acts', es: 'Hechos' },
      books: ['Acts of the Apostles']
    },
    {
      id: 'letters', testament: 'NT',
      label: { en: 'Letters', es: 'Cartas' },
      books: ['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians',
              'Philippians','Colossians','1 Thessalonians','2 Thessalonians',
              '1 Timothy','2 Timothy','Titus','Philemon','Hebrews',
              'James','1 Peter','2 Peter','1 John','2 John','3 John','Jude']
    },
    {
      id: 'revelation', testament: 'NT',
      label: { en: 'Revelation', es: 'Apocalipsis' },
      books: ['Revelation']
    }
  ];
  // Quick total sanity check at module-load time.
  const TOTAL_BOOKS = BOOK_GROUPS.reduce((s, g) => s + g.books.length, 0);
  if (TOTAL_BOOKS !== 73 && typeof Debug !== 'undefined') {
    Debug.warn('[Bible] Expected 73 Catholic books, got ' + TOTAL_BOOKS);
  }

  // ── State ──
  const state = {
    lang: 'en',
    mode: null,        // 'stories' | 'verses' | 'books'
    activeStoryIdx: 0,
    activeVerseIdx: 0,
    activeGroupIdx: 0
  };

  // ── Storage ──
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try { return JSON.parse(localStorage.getItem(_storageKey())) || {}; }
    catch { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch {}
    }
  }

  function _l(obj, fallback) {
    if (!obj) return fallback || '';
    if (typeof obj === 'string') return obj;
    return obj[state.lang] || obj.en || fallback || '';
  }

  // ── Screens ──
  function _showScreen(id) {
    document.querySelectorAll('.bx-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function _renderHome() {
    const prog = _loadProgress();
    const storiesDone = (prog.stories || []).length;
    const versesDone = Object.keys(prog.verses || {}).length;
    const booksDone = Object.keys(prog.books || {}).length;
    document.getElementById('bx-stories-stat').textContent = storiesDone + '/' + STORIES.length;
    document.getElementById('bx-verses-stat').textContent = versesDone + '/' + VERSES.length;
    document.getElementById('bx-books-stat').textContent = booksDone + '/' + BOOK_GROUPS.length;
    _showScreen('bx-screen-home');
  }

  // ── Stories mode ──
  function openStories() {
    state.mode = 'stories';
    state.activeStoryIdx = 0;
    _renderStoryList();
    _showScreen('bx-screen-stories');
  }

  function _renderStoryList() {
    const grid = document.getElementById('bx-story-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = new Set(prog.stories || []);
    STORIES.forEach((s, idx) => {
      const card = document.createElement('button');
      card.className = 'bx-story-card' + (done.has(s.id) ? ' bx-done' : '');
      card.innerHTML =
        '<span class="bx-story-icon">' + s.icon + '</span>' +
        '<span class="bx-story-title">' + _l(s.title) + '</span>' +
        '<span class="bx-story-tag">' + (s.testament === 'OT' ? (state.lang === 'es' ? 'A.T.' : 'OT') : (state.lang === 'es' ? 'N.T.' : 'NT')) + '</span>' +
        (done.has(s.id) ? '<span class="bx-story-star">⭐</span>' : '');
      card.onclick = () => _openStory(idx);
      grid.appendChild(card);
    });
  }

  function _openStory(idx) {
    state.activeStoryIdx = idx;
    const s = STORIES[idx];
    if (!s) return;
    const wrap = document.getElementById('bx-story-detail');
    wrap.innerHTML =
      '<button class="bx-back-btn" onclick="BibleExplorer.backToStoryList()">←</button>' +
      '<div class="bx-story-detail-header">' +
        '<span class="bx-story-detail-icon">' + s.icon + '</span>' +
        '<h2>' + _l(s.title) + '</h2>' +
        '<span class="bx-story-detail-tag">' + (s.testament === 'OT' ? (state.lang === 'es' ? 'Antiguo Testamento' : 'Old Testament') : (state.lang === 'es' ? 'Nuevo Testamento' : 'New Testament')) + '</span>' +
      '</div>' +
      '<p class="bx-story-summary">' + _l(s.summary) + '</p>' +
      '<button class="bx-primary-btn" onclick="BibleExplorer.startStoryQuiz()">' +
        (state.lang === 'es' ? '🎯 Cuestionario' : '🎯 Take the Quiz') + '</button>';
    _showScreen('bx-screen-story-detail');
  }

  function backToStoryList() {
    _showScreen('bx-screen-stories');
  }

  let _quizIdx = 0;
  let _quizCorrect = 0;
  function startStoryQuiz() {
    const s = STORIES[state.activeStoryIdx];
    if (!s || !s.quiz || !s.quiz.length) return;
    _quizIdx = 0;
    _quizCorrect = 0;
    _renderQuizQuestion();
    _showScreen('bx-screen-story-quiz');
  }

  function _renderQuizQuestion() {
    const s = STORIES[state.activeStoryIdx];
    const q = s.quiz[_quizIdx];
    if (!q) return _finishStoryQuiz();
    const wrap = document.getElementById('bx-quiz-wrap');
    const opts = q.options[state.lang] || q.options.en;
    wrap.innerHTML =
      '<div class="bx-quiz-counter">' + (_quizIdx + 1) + ' / ' + s.quiz.length + '</div>' +
      '<h2 class="bx-quiz-q">' + _l(q.q) + '</h2>' +
      '<div class="bx-quiz-options">' +
        opts.map((o, i) =>
          '<button class="bx-quiz-opt" data-idx="' + i + '" data-correct="' + (i === q.answer ? '1' : '0') + '">' + o + '</button>'
        ).join('') +
      '</div>';
    wrap.querySelectorAll('.bx-quiz-opt').forEach(btn => {
      btn.onclick = () => {
        const correct = btn.dataset.correct === '1';
        btn.classList.add(correct ? 'bx-correct' : 'bx-wrong');
        if (correct) _quizCorrect++;
        if (typeof SFX !== 'undefined') {
          (correct && SFX.correct) ? SFX.correct() : (SFX.wrong && SFX.wrong());
        }
        setTimeout(() => { _quizIdx++; _renderQuizQuestion(); }, 700);
      };
    });
  }

  function _finishStoryQuiz() {
    const s = STORIES[state.activeStoryIdx];
    const total = s.quiz.length;
    const acc = total > 0 ? _quizCorrect / total : 0;
    const stars = acc >= 0.95 ? 3 : acc >= 0.80 ? 2 : 1;

    const prog = _loadProgress();
    prog.stories = prog.stories || [];
    if (prog.stories.indexOf(s.id) === -1) prog.stories.push(s.id);
    prog.storyStars = prog.storyStars || {};
    prog.storyStars[s.id] = Math.max(prog.storyStars[s.id] || 0, stars);
    _saveProgress(prog);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Bible Explorer', '📖',
        (state.lang === 'es' ? 'Completó "' : 'Finished "') + _l(s.title) + '" ' + '⭐'.repeat(stars));
    }

    document.getElementById('bx-quiz-result').innerHTML =
      '<div class="bx-quiz-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' +
      '<p>' + _quizCorrect + ' / ' + total + ' ' + (state.lang === 'es' ? 'correctas' : 'correct') + '</p>' +
      '<button class="bx-primary-btn" onclick="BibleExplorer.backToStoryList()">' +
        (state.lang === 'es' ? '← Volver' : '← Back') + '</button>';
    _showScreen('bx-screen-story-result');
  }

  // ── Verse memorisation mode ──
  function openVerses() {
    state.mode = 'verses';
    state.activeVerseIdx = 0;
    _renderVerseList();
    _showScreen('bx-screen-verses');
  }

  function _renderVerseList() {
    const grid = document.getElementById('bx-verse-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = prog.verses || {};
    VERSES.forEach((v, idx) => {
      const card = document.createElement('button');
      const isDone = done[v.ref] && done[v.ref].stars > 0;
      card.className = 'bx-verse-card bx-tier-' + v.tier + (isDone ? ' bx-done' : '');
      card.innerHTML =
        '<span class="bx-verse-ref">' + v.ref + '</span>' +
        '<span class="bx-verse-tier">' +
          '🟢'.repeat(v.tier) + '⚪'.repeat(3 - v.tier) +
        '</span>' +
        (isDone ? '<span class="bx-verse-star">' + '⭐'.repeat(done[v.ref].stars) + '</span>' : '');
      card.onclick = () => _openVerse(idx);
      grid.appendChild(card);
    });
  }

  // Parse a string like 'In the beginning God created [heaven] and earth.'
  // into segments and the list of blanks (lowercased for comparison).
  function _parseVerse(text) {
    const segments = [];
    const blanks = [];
    const re = /\[([^\]]+)\]/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
      segments.push({ type: 'blank', idx: blanks.length, answer: m[1] });
      blanks.push(m[1]);
      last = m.index + m[0].length;
    }
    if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
    return { segments, blanks };
  }

  function _openVerse(idx) {
    state.activeVerseIdx = idx;
    const v = VERSES[idx];
    if (!v) return;
    const text = state.lang === 'es' ? v.es : v.en;
    const parsed = _parseVerse(text);

    const wrap = document.getElementById('bx-verse-detail');
    let inputCount = 0;
    const inner = parsed.segments.map(seg => {
      if (seg.type === 'text') return seg.value.replace(/</g, '&lt;');
      const i = inputCount++;
      return '<input class="bx-blank" data-idx="' + i + '" autocomplete="off" autocorrect="off" spellcheck="false">';
    }).join('');

    wrap.innerHTML =
      '<button class="bx-back-btn" onclick="BibleExplorer.backToVerseList()">←</button>' +
      '<div class="bx-verse-ref-big">' + v.ref + '</div>' +
      '<p class="bx-verse-text">' + inner + '</p>' +
      '<div class="bx-verse-actions">' +
        '<button class="bx-primary-btn" id="bx-verse-check">' +
          (state.lang === 'es' ? '✓ Comprobar' : '✓ Check') +
        '</button>' +
        '<button class="bx-secondary-btn" id="bx-verse-hint">' +
          (state.lang === 'es' ? '💡 Pista' : '💡 Hint') +
        '</button>' +
      '</div>' +
      '<div class="bx-verse-feedback" id="bx-verse-feedback"></div>';
    _showScreen('bx-screen-verse-detail');

    document.getElementById('bx-verse-check').onclick = () => _checkVerse(idx, parsed);
    document.getElementById('bx-verse-hint').onclick = () => _hintVerse(parsed);
  }

  function backToVerseList() { _showScreen('bx-screen-verses'); }

  function _normaliseWord(s) {
    // Strip diacritics (NFD splits "é" into "e" + combining acute), then
    // drop the combining-mark range U+0300..U+036F and any punctuation
    // so the kid doesn't get marked wrong for missing an accent.
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/gi, '');
  }

  function _checkVerse(idx, parsed) {
    const inputs = document.querySelectorAll('#bx-verse-detail .bx-blank');
    let correct = 0;
    let total = parsed.blanks.length;
    inputs.forEach((inp, i) => {
      const expected = _normaliseWord(parsed.blanks[i]);
      const got = _normaliseWord(inp.value);
      if (got === expected) {
        inp.classList.add('bx-blank-correct');
        inp.classList.remove('bx-blank-wrong');
        correct++;
      } else {
        inp.classList.add('bx-blank-wrong');
        inp.classList.remove('bx-blank-correct');
      }
    });
    const fb = document.getElementById('bx-verse-feedback');
    const v = VERSES[idx];
    if (correct === total) {
      const stars = total >= 3 ? 3 : total >= 2 ? 2 : 1;
      const prog = _loadProgress();
      prog.verses = prog.verses || {};
      const prev = prog.verses[v.ref] || { stars: 0 };
      prog.verses[v.ref] = { stars: Math.max(prev.stars, stars) };
      _saveProgress(prog);
      if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
      fb.className = 'bx-verse-feedback bx-feedback-good';
      fb.textContent = (state.lang === 'es' ? '¡Bien hecho! ' : 'Great work! ') + '⭐'.repeat(stars);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Bible Explorer', '✨',
          (state.lang === 'es' ? 'Memorizó ' : 'Memorised ') + v.ref);
      }
    } else {
      if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      fb.className = 'bx-verse-feedback bx-feedback-bad';
      fb.textContent = (state.lang === 'es'
        ? correct + ' de ' + total + ' correctas. Inténtalo de nuevo o pide una pista.'
        : correct + ' of ' + total + ' correct. Try again or tap Hint.');
    }
  }

  function _hintVerse(parsed) {
    const inputs = document.querySelectorAll('#bx-verse-detail .bx-blank');
    // Fill in the first blank that isn't yet correct.
    for (let i = 0; i < inputs.length; i++) {
      const expected = _normaliseWord(parsed.blanks[i]);
      const got = _normaliseWord(inputs[i].value);
      if (got !== expected) {
        inputs[i].value = parsed.blanks[i];
        inputs[i].classList.add('bx-blank-hint');
        return;
      }
    }
  }

  // ── Books drill mode ──
  function openBooks() {
    state.mode = 'books';
    state.activeGroupIdx = 0;
    _renderBookGroups();
    _showScreen('bx-screen-books');
  }

  function _renderBookGroups() {
    const grid = document.getElementById('bx-book-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const done = prog.books || {};
    BOOK_GROUPS.forEach((g, idx) => {
      const card = document.createElement('button');
      const isDone = done[g.id] && done[g.id].stars > 0;
      card.className = 'bx-book-card' + (isDone ? ' bx-done' : '');
      card.innerHTML =
        '<span class="bx-book-tag">' + (g.testament === 'OT' ? (state.lang === 'es' ? 'A.T.' : 'OT') : (state.lang === 'es' ? 'N.T.' : 'NT')) + '</span>' +
        '<h3>' + _l(g.label) + '</h3>' +
        '<span class="bx-book-count">' + g.books.length + ' ' + (state.lang === 'es' ? 'libros' : 'books') + '</span>' +
        (isDone ? '<span class="bx-book-star">' + '⭐'.repeat(done[g.id].stars) + '</span>' : '');
      card.onclick = () => _openBookGroup(idx);
      grid.appendChild(card);
    });
  }

  // Tap-in-order drill: shuffled buttons of book names in this group,
  // tap them in canonical order. Wrong tap loses a life. 3 lives.
  function _openBookGroup(idx) {
    state.activeGroupIdx = idx;
    const g = BOOK_GROUPS[idx];
    if (!g) return;

    let order = 0;
    let lives = 3;
    const total = g.books.length;
    const shuffled = g.books.slice().sort(() => Math.random() - 0.5);

    const wrap = document.getElementById('bx-book-drill');
    function render() {
      wrap.innerHTML =
        '<button class="bx-back-btn" onclick="BibleExplorer.backToBookList()">←</button>' +
        '<div class="bx-drill-header">' +
          '<h2>' + _l(g.label) + '</h2>' +
          '<div class="bx-drill-meta">' +
            '<span class="bx-drill-progress">' + order + ' / ' + total + '</span>' +
            '<span class="bx-drill-lives">' + '❤️'.repeat(lives) + '🤍'.repeat(3 - lives) + '</span>' +
          '</div>' +
          '<p class="bx-drill-instr">' +
            (state.lang === 'es' ? 'Toca los libros en orden canónico.' : 'Tap the books in canonical order.') +
          '</p>' +
        '</div>' +
        '<div class="bx-drill-options">' +
          shuffled.map((name, i) => {
            const matchedIdx = g.books.indexOf(name);
            const done = matchedIdx < order;
            return '<button class="bx-drill-opt' + (done ? ' bx-done' : '') + '"' +
              (done ? ' disabled' : '') + ' data-book="' + name + '">' + name + '</button>';
          }).join('') +
        '</div>';

      wrap.querySelectorAll('.bx-drill-opt').forEach(btn => {
        btn.onclick = () => {
          if (btn.disabled) return;
          const book = btn.dataset.book;
          const expected = g.books[order];
          if (book === expected) {
            order++;
            if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
            if (order === total) return _finishBookDrill();
            render();
          } else {
            lives--;
            if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
            btn.classList.add('bx-shake');
            setTimeout(() => btn.classList.remove('bx-shake'), 400);
            if (lives <= 0) return _failBookDrill();
            render();
          }
        };
      });
    }

    function _finishBookDrill() {
      const stars = lives === 3 ? 3 : lives === 2 ? 2 : 1;
      const prog = _loadProgress();
      prog.books = prog.books || {};
      const prev = prog.books[g.id] || { stars: 0 };
      prog.books[g.id] = { stars: Math.max(prev.stars, stars) };
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Bible Explorer', '📚',
          (state.lang === 'es' ? 'Completó libros de ' : 'Completed books of ') + _l(g.label) + ' ⭐'.repeat(stars));
      }
      wrap.innerHTML =
        '<div class="bx-drill-win">' +
          '<div class="bx-quiz-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' +
          '<p>' + (state.lang === 'es' ? '¡Excelente!' : 'Well done!') + '</p>' +
          '<button class="bx-primary-btn" onclick="BibleExplorer.backToBookList()">' +
            (state.lang === 'es' ? '← Volver' : '← Back') +
          '</button>' +
        '</div>';
    }

    function _failBookDrill() {
      wrap.innerHTML =
        '<div class="bx-drill-fail">' +
          '<p>' + (state.lang === 'es' ? 'Inténtalo otra vez.' : 'Try again!') + '</p>' +
          '<button class="bx-primary-btn" onclick="BibleExplorer._retryBookDrill(' + idx + ')">' +
            (state.lang === 'es' ? '↺ Reintentar' : '↺ Retry') +
          '</button> ' +
          '<button class="bx-secondary-btn" onclick="BibleExplorer.backToBookList()">' +
            (state.lang === 'es' ? '← Volver' : '← Back') +
          '</button>' +
        '</div>';
    }

    render();
    _showScreen('bx-screen-book-drill');
  }

  function backToBookList() { _showScreen('bx-screen-books'); }
  function _retryBookDrill(idx) { _openBookGroup(idx); }

  // ── Language toggle ──
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const lbl = document.getElementById('bx-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';
    // Re-render current mode
    if (state.mode === 'stories') _renderStoryList();
    else if (state.mode === 'verses') _renderVerseList();
    else if (state.mode === 'books') _renderBookGroups();
    _renderHome();
  }

  // ── Init ──
  function init() {
    document.getElementById('bx-tile-stories').onclick = openStories;
    document.getElementById('bx-tile-verses').onclick = openVerses;
    document.getElementById('bx-tile-books').onclick = openBooks;
    document.getElementById('bx-lang-toggle').onclick = toggleLanguage;
    document.querySelectorAll('.bx-home-btn').forEach(b => { b.onclick = _renderHome; });
    _renderHome();
  }

  return {
    init,
    openStories, openVerses, openBooks,
    backToStoryList, backToVerseList, backToBookList,
    startStoryQuiz,
    toggleLanguage,
    _retryBookDrill
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof BibleExplorer !== 'undefined') BibleExplorer.init();
});
