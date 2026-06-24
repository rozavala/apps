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
    },

    // ── v2 expansion: 15 more stories ────────────────────────────────
    // 8 OT + 7 NT, keeping a balance across testaments and difficulty.

    { id: 'joseph', testament: 'OT', icon: '🎨', ageMin: 7,
      title: { en: 'Joseph and the Coat', es: 'José y la Túnica' },
      summary: {
        en: 'Jacob loved his son Joseph and gave him a coat of many colours. His brothers grew jealous and sold him into Egypt, but God turned the evil for good — Joseph became a great ruler and saved his family from famine.',
        es: 'Jacob amaba a su hijo José y le regaló una túnica de muchos colores. Sus hermanos sintieron celos y lo vendieron a Egipto, pero Dios convirtió el mal en bien — José llegó a ser un gran gobernante y salvó a su familia del hambre.'
      },
      quiz: [
        { q: { en: 'What kind of coat did Joseph receive?', es: '¿Qué tipo de túnica recibió José?' },
          options: { en: ['Plain white','Many colours','Royal blue','Made of fur'], es: ['Blanca lisa','De muchos colores','Azul real','De piel'] }, answer: 1 },
        { q: { en: 'To which country was Joseph sold?', es: '¿A qué país fue vendido José?' },
          options: { en: ['Egypt','Babylon','Persia','Rome'], es: ['Egipto','Babilonia','Persia','Roma'] }, answer: 0 }
      ]
    },
    { id: 'joshua', testament: 'OT', icon: '📯', ageMin: 7,
      title: { en: 'Joshua at Jericho', es: 'Josué en Jericó' },
      summary: {
        en: 'God told Joshua that the people should march around the walls of Jericho once a day for six days, and seven times on the seventh day, blowing trumpets. On the seventh day they shouted and the walls came tumbling down.',
        es: 'Dios le dijo a Josué que el pueblo marchara alrededor de los muros de Jericó una vez al día durante seis días, y siete veces el séptimo día, tocando trompetas. Al séptimo día gritaron y los muros se derrumbaron.'
      },
      quiz: [
        { q: { en: 'How many times did they march on the seventh day?', es: '¿Cuántas veces marcharon el séptimo día?' },
          options: { en: ['Three','Five','Seven','Twelve'], es: ['Tres','Cinco','Siete','Doce'] }, answer: 2 },
        { q: { en: 'What instrument did they blow?', es: '¿Qué instrumento tocaron?' },
          options: { en: ['Drums','Trumpets','Flutes','Harps'], es: ['Tambores','Trompetas','Flautas','Arpas'] }, answer: 1 }
      ]
    },
    { id: 'ruth', testament: 'OT', icon: '🌾', ageMin: 7,
      title: { en: 'Ruth\'s Loyalty', es: 'La Lealtad de Rut' },
      summary: {
        en: 'After her husband died, Ruth refused to leave her mother-in-law Naomi and said: "Wherever you go, I will go." She gleaned grain in the fields of Boaz, who later married her. Ruth became the great-grandmother of King David.',
        es: 'Después de la muerte de su marido, Rut se negó a dejar a su suegra Noemí y le dijo: "A dondequiera que tú vayas, iré yo." Recogió espigas en los campos de Booz, quien luego se casó con ella. Rut llegó a ser bisabuela del rey David.'
      },
      quiz: [
        { q: { en: 'Whom did Ruth refuse to leave?', es: '¿A quién se negó Rut a dejar?' },
          options: { en: ['Her sister','Her mother-in-law','Her father','Her cousin'], es: ['Su hermana','Su suegra','Su padre','Su primo'] }, answer: 1 },
        { q: { en: 'Whom did Ruth eventually marry?', es: '¿Con quién se casó Rut finalmente?' },
          options: { en: ['Boaz','Samuel','David','Job'], es: ['Booz','Samuel','David','Job'] }, answer: 0 }
      ]
    },
    { id: 'esther', testament: 'OT', icon: '👑', ageMin: 8,
      title: { en: 'Esther the Brave Queen', es: 'Ester la Reina Valiente' },
      summary: {
        en: 'When Queen Esther learned that her people were in danger, she risked her life going before the king without being called. Her courage saved the Jewish people from destruction. The book of Esther never names God directly, yet shows His care.',
        es: 'Cuando la reina Ester supo que su pueblo estaba en peligro, arriesgó su vida al presentarse ante el rey sin ser llamada. Su valentía salvó al pueblo judío de la destrucción. El libro de Ester nunca nombra a Dios directamente, pero muestra Su cuidado.'
      },
      quiz: [
        { q: { en: 'What was Esther\'s title?', es: '¿Cuál era el título de Ester?' },
          options: { en: ['Princess','Queen','Prophetess','Judge'], es: ['Princesa','Reina','Profetisa','Jueza'] }, answer: 1 },
        { q: { en: 'Whom did Esther save?', es: '¿A quién salvó Ester?' },
          options: { en: ['Her family only','The Jewish people','The king\'s soldiers','The priests'], es: ['Sólo a su familia','Al pueblo judío','A los soldados del rey','A los sacerdotes'] }, answer: 1 }
      ]
    },
    { id: 'samuel', testament: 'OT', icon: '🕯️', ageMin: 6,
      title: { en: 'Samuel Hears God', es: 'Samuel Escucha a Dios' },
      summary: {
        en: 'When Samuel was a boy serving in the temple, God called his name in the night. Three times Samuel ran to the priest Eli, until Eli understood it was God calling. Samuel answered: "Speak, Lord, for your servant is listening."',
        es: 'Cuando Samuel era niño y servía en el templo, Dios lo llamó por su nombre en la noche. Tres veces corrió Samuel hacia el sacerdote Elí, hasta que Elí comprendió que era Dios quien llamaba. Samuel respondió: "Habla, Señor, que tu siervo escucha."'
      },
      quiz: [
        { q: { en: 'Who was the priest Samuel served under?', es: '¿Bajo qué sacerdote servía Samuel?' },
          options: { en: ['Aaron','Eli','Zechariah','Caiaphas'], es: ['Aarón','Elí','Zacarías','Caifás'] }, answer: 1 },
        { q: { en: 'How many times did Samuel run to Eli?', es: '¿Cuántas veces corrió Samuel hacia Elí?' },
          options: { en: ['Once','Twice','Three times','Seven times'], es: ['Una vez','Dos veces','Tres veces','Siete veces'] }, answer: 2 }
      ]
    },
    { id: 'elijah', testament: 'OT', icon: '🔥', ageMin: 8,
      title: { en: 'Elijah and the Fire', es: 'Elías y el Fuego' },
      summary: {
        en: 'Elijah challenged the prophets of Baal: each side would build an altar and ask their god to send fire. The prophets of Baal cried out all day to nothing. Then Elijah prayed once and fire fell from heaven, showing that the Lord is the true God.',
        es: 'Elías desafió a los profetas de Baal: cada lado construiría un altar y pediría a su dios que enviara fuego. Los profetas de Baal clamaron todo el día sin respuesta. Entonces Elías oró una vez y el fuego cayó del cielo, mostrando que el Señor es el Dios verdadero.'
      },
      quiz: [
        { q: { en: 'Whom did Elijah challenge?', es: '¿A quién desafió Elías?' },
          options: { en: ['The Pharisees','The prophets of Baal','The kings of Egypt','The Romans'], es: ['Los fariseos','Los profetas de Baal','Los reyes de Egipto','Los romanos'] }, answer: 1 },
        { q: { en: 'What fell from heaven for Elijah?', es: '¿Qué cayó del cielo para Elías?' },
          options: { en: ['Manna','Rain','Fire','Stars'], es: ['Maná','Lluvia','Fuego','Estrellas'] }, answer: 2 }
      ]
    },
    { id: 'job', testament: 'OT', icon: '🪨', ageMin: 9,
      title: { en: 'Job\'s Patience', es: 'La Paciencia de Job' },
      summary: {
        en: 'Job lost his children, his wealth, and his health, yet still trusted God: "The Lord gave, and the Lord has taken away; blessed be the name of the Lord." After his trial God restored everything to him double.',
        es: 'Job perdió a sus hijos, sus riquezas y su salud, pero siguió confiando en Dios: "El Señor me lo dio, el Señor me lo quitó; bendito sea el nombre del Señor." Tras su prueba, Dios le restauró todo el doble.'
      },
      quiz: [
        { q: { en: 'What did Job say when he lost everything?', es: '¿Qué dijo Job cuando lo perdió todo?' },
          options: { en: ['Blessed be the name of the Lord','It is unfair','I will never trust again','I quit'], es: ['Bendito sea el nombre del Señor','Es injusto','Nunca volveré a confiar','Renuncio'] }, answer: 0 }
      ]
    },
    { id: 'maccabees', testament: 'OT', icon: '🛡️', ageMin: 10,
      title: { en: 'The Maccabees', es: 'Los Macabeos' },
      summary: {
        en: 'When the Greek king Antiochus tried to outlaw the Jewish faith, the family of Mattathias rose up. His son Judas Maccabeus led a small army that defeated mighty empires and re-dedicated the Temple in Jerusalem. The books of Maccabees are part of the Catholic Old Testament.',
        es: 'Cuando el rey griego Antíoco intentó prohibir la fe judía, la familia de Matatías se levantó. Su hijo Judas Macabeo lideró un pequeño ejército que derrotó a poderosos imperios y volvió a consagrar el Templo de Jerusalén. Los libros de los Macabeos forman parte del Antiguo Testamento católico.'
      },
      quiz: [
        { q: { en: 'Who led the Maccabean revolt?', es: '¿Quién lideró la revuelta macabea?' },
          options: { en: ['Mattathias','Judas Maccabeus','Solomon','Daniel'], es: ['Matatías','Judas Macabeo','Salomón','Daniel'] }, answer: 1 },
        { q: { en: 'What did the Maccabees re-dedicate?', es: '¿Qué volvieron a consagrar los Macabeos?' },
          options: { en: ['A palace','The Temple in Jerusalem','A new city','A boat'], es: ['Un palacio','El Templo de Jerusalén','Una ciudad nueva','Un barco'] }, answer: 1 }
      ]
    },

    // ── NT additions ──
    { id: 'cana', testament: 'NT', icon: '🍷', ageMin: 7,
      title: { en: 'The Wedding at Cana', es: 'Las Bodas de Caná' },
      summary: {
        en: 'At a wedding in Cana the wine ran out. Mary said to her son Jesus, "They have no wine." Jesus had the servants fill six stone jars with water — and turned the water into wine. This was the first of His miracles.',
        es: 'En una boda en Caná se acabó el vino. María dijo a su hijo Jesús: "No tienen vino." Jesús hizo que los sirvientes llenaran seis tinajas de piedra con agua — y convirtió el agua en vino. Fue el primero de Sus milagros.'
      },
      quiz: [
        { q: { en: 'What did Jesus turn the water into?', es: '¿En qué convirtió Jesús el agua?' },
          options: { en: ['Oil','Wine','Honey','Milk'], es: ['Aceite','Vino','Miel','Leche'] }, answer: 1 },
        { q: { en: 'How many jars did the servants fill?', es: '¿Cuántas tinajas llenaron los sirvientes?' },
          options: { en: ['Three','Six','Seven','Twelve'], es: ['Tres','Seis','Siete','Doce'] }, answer: 1 }
      ]
    },
    { id: 'walking_water', testament: 'NT', icon: '🌊', ageMin: 7,
      title: { en: 'Walking on Water', es: 'Caminando Sobre el Agua' },
      summary: {
        en: 'The disciples were rowing through a storm when Jesus came walking on the water. Peter asked to come too. He walked toward Jesus on the waves until he looked at the storm and began to sink — but Jesus reached out His hand and caught him.',
        es: 'Los discípulos remaban en medio de una tormenta cuando Jesús vino caminando sobre el agua. Pedro pidió ir también. Caminó hacia Jesús sobre las olas hasta que miró la tormenta y comenzó a hundirse — pero Jesús extendió Su mano y lo sostuvo.'
      },
      quiz: [
        { q: { en: 'Which apostle walked on the water with Jesus?', es: '¿Qué apóstol caminó sobre el agua con Jesús?' },
          options: { en: ['John','Peter','Andrew','James'], es: ['Juan','Pedro','Andrés','Santiago'] }, answer: 1 },
        { q: { en: 'Why did Peter begin to sink?', es: '¿Por qué Pedro comenzó a hundirse?' },
          options: { en: ['Boat hit him','He looked at the storm','It got dark','He fell asleep'], es: ['Un barco lo golpeó','Miró la tormenta','Se hizo de noche','Se durmió'] }, answer: 1 }
      ]
    },
    { id: 'good_samaritan', testament: 'NT', icon: '🤝', ageMin: 7,
      title: { en: 'The Good Samaritan', es: 'El Buen Samaritano' },
      summary: {
        en: 'A traveller was beaten and left by the road. A priest and a Levite walked past, but a Samaritan stopped, cleaned his wounds, and paid for his stay at an inn. Jesus told this parable to teach who our neighbour is.',
        es: 'Un viajero fue golpeado y dejado en el camino. Un sacerdote y un levita pasaron de largo, pero un samaritano se detuvo, le curó las heridas y pagó por su estancia en una posada. Jesús contó esta parábola para enseñar quién es nuestro prójimo.'
      },
      quiz: [
        { q: { en: 'Who helped the wounded man?', es: '¿Quién ayudó al herido?' },
          options: { en: ['The priest','The Levite','The Samaritan','The soldier'], es: ['El sacerdote','El levita','El samaritano','El soldado'] }, answer: 2 },
        { q: { en: 'What did the Samaritan pay for?', es: '¿Por qué pagó el samaritano?' },
          options: { en: ['A new horse','The man\'s stay at an inn','New clothes','A meal'], es: ['Un caballo nuevo','La estancia del hombre en una posada','Ropa nueva','Una comida'] }, answer: 1 }
      ]
    },
    { id: 'prodigal_son', testament: 'NT', icon: '🐷', ageMin: 8,
      title: { en: 'The Prodigal Son', es: 'El Hijo Pródigo' },
      summary: {
        en: 'A younger son took his inheritance, wasted it on wild living, and ended up feeding pigs and starving. When he returned home expecting to be a servant, his father ran out to embrace him and threw a great feast — for "this son of mine was lost and is found".',
        es: 'Un hijo menor tomó su herencia, la malgastó en vida desenfrenada y terminó alimentando cerdos y muriendo de hambre. Cuando regresó a casa esperando ser un sirviente, su padre corrió a abrazarlo y organizó un gran banquete — porque "este hijo mío estaba perdido y ha sido hallado".'
      },
      quiz: [
        { q: { en: 'What did the prodigal son end up doing?', es: '¿Qué terminó haciendo el hijo pródigo?' },
          options: { en: ['Teaching','Feeding pigs','Building boats','Selling spices'], es: ['Enseñando','Alimentando cerdos','Construyendo barcos','Vendiendo especias'] }, answer: 1 },
        { q: { en: 'How did the father greet his returning son?', es: '¿Cómo recibió el padre a su hijo que volvía?' },
          options: { en: ['With anger','With silence','With a feast','With a punishment'], es: ['Con enojo','Con silencio','Con un banquete','Con un castigo'] }, answer: 2 }
      ]
    },
    { id: 'loaves_fishes', testament: 'NT', icon: '🐟', ageMin: 6,
      title: { en: 'The Loaves and the Fishes', es: 'Los Panes y los Peces' },
      summary: {
        en: 'Five thousand people had come to hear Jesus, with no food. A boy had five loaves and two fish. Jesus blessed them, broke them, and gave to everyone — and when they finished, twelve baskets of leftovers were collected.',
        es: 'Cinco mil personas habían ido a escuchar a Jesús, sin comida. Un muchacho tenía cinco panes y dos peces. Jesús los bendijo, los partió y los repartió a todos — y al terminar, recogieron doce canastas de sobras.'
      },
      quiz: [
        { q: { en: 'How many loaves did the boy have?', es: '¿Cuántos panes tenía el muchacho?' },
          options: { en: ['Two','Five','Seven','Twelve'], es: ['Dos','Cinco','Siete','Doce'] }, answer: 1 },
        { q: { en: 'How many people were fed?', es: '¿Cuántas personas fueron alimentadas?' },
          options: { en: ['500','1,000','5,000','10,000'], es: ['500','1.000','5.000','10.000'] }, answer: 2 }
      ]
    },
    { id: 'zacchaeus', testament: 'NT', icon: '🌳', ageMin: 6,
      title: { en: 'Zacchaeus the Tax Collector', es: 'Zaqueo el Recaudador' },
      summary: {
        en: 'Zacchaeus was a short, rich tax collector that everyone disliked. To see Jesus over the crowd he climbed a sycamore tree. Jesus looked up and said, "Zacchaeus, come down, today I must stay at your house." Zacchaeus repented and gave back four times what he had wronged.',
        es: 'Zaqueo era un recaudador de impuestos bajo, rico y odiado por todos. Para ver a Jesús por encima de la multitud, subió a un sicómoro. Jesús miró hacia arriba y dijo: "Zaqueo, baja, hoy debo quedarme en tu casa." Zaqueo se arrepintió y devolvió cuatro veces lo que había estafado.'
      },
      quiz: [
        { q: { en: 'What did Zacchaeus climb?', es: '¿A qué se subió Zaqueo?' },
          options: { en: ['A house','A sycamore tree','A wall','A ladder'], es: ['Una casa','Un sicómoro','Un muro','Una escalera'] }, answer: 1 },
        { q: { en: 'How many times over did Zacchaeus give back?', es: '¿Cuántas veces devolvió Zaqueo?' },
          options: { en: ['One','Two','Three','Four'], es: ['Una','Dos','Tres','Cuatro'] }, answer: 3 }
      ]
    },
    { id: 'damascus', testament: 'NT', icon: '⚡', ageMin: 9,
      title: { en: 'Paul on the Damascus Road', es: 'Pablo en el Camino a Damasco' },
      summary: {
        en: 'Saul of Tarsus was travelling to Damascus to arrest Christians when a bright light flashed from heaven. He fell to the ground and heard a voice: "Saul, Saul, why do you persecute me?" Saul was struck blind for three days, then was healed and became the apostle Paul.',
        es: 'Saulo de Tarso iba camino a Damasco para arrestar a cristianos cuando una luz resplandeciente brilló desde el cielo. Cayó a tierra y escuchó una voz: "Saulo, Saulo, ¿por qué me persigues?" Saulo quedó ciego tres días, luego fue sanado y se convirtió en el apóstol Pablo.'
      },
      quiz: [
        { q: { en: 'What was Paul\'s name before his conversion?', es: '¿Cuál era el nombre de Pablo antes de su conversión?' },
          options: { en: ['Peter','Saul','John','Andrew'], es: ['Pedro','Saulo','Juan','Andrés'] }, answer: 1 },
        { q: { en: 'For how long was he blind?', es: '¿Cuánto tiempo quedó ciego?' },
          options: { en: ['1 day','3 days','7 days','40 days'], es: ['1 día','3 días','7 días','40 días'] }, answer: 1 }
      ]
    },
    { id: 'commandments', testament: 'OT', icon: '📜', ageMin: 8,
      title: { en: 'The Ten Commandments', es: 'Los Diez Mandamientos' },
      summary: {
        en: 'After Israel left Egypt, they camped at Mount Sinai. Moses went up the mountain, which was covered in smoke and fire. God gave him the Ten Commandments written on two tablets of stone, the law for His people to follow.',
        es: 'Después de que Israel salió de Egipto, acamparon en el monte Sinaí. Moisés subió al monte, que estaba cubierto de humo y fuego. Dios le entregó los Diez Mandamientos escritos en dos tablas de piedra, la ley para que Su pueblo la siguiera.'
      },
      quiz: [
        { q: { en: 'On what mountain were the commandments given?', es: '¿En qué monte se dieron los mandamientos?' },
          options: { en: ['Mount Sinai','Mount Carmel','Mount Tabor','Mount Olives'], es: ['Monte Sinaí','Monte Carmelo','Monte Tabor','Monte de los Olivos'] }, answer: 0 },
        { q: { en: 'On what were the commandments written?', es: '¿En qué se escribieron los mandamientos?' },
          options: { en: ['Paper scrolls','Two tablets of stone','Clay pots','A wooden door'], es: ['Rollos de papel','Dos tablas de piedra','Vasijas de barro','Una puerta de madera'] }, answer: 1 },
        { q: { en: 'Who received the commandments?', es: '¿Quién recibió los mandamientos?' },
          options: { en: ['Aaron','Joshua','Moses','David'], es: ['Aarón','Josué','Moisés','David'] }, answer: 2 }
      ]
    },
    { id: 'sheba', testament: 'OT', icon: '👑', ageMin: 9,
      title: { en: 'The Queen of Sheba', es: 'La Reina de Sabá' },
      summary: {
        en: 'The Queen of Sheba heard of Solomon\'s great wisdom and came to test him with hard questions. Solomon answered them all. She brought gold, spices, and precious stones, and marvelled at his wisdom and the temple he had built.',
        es: 'La reina de Sabá oyó de la gran sabiduría de Salomón y vino a probarlo con preguntas difíciles. Salomón respondió a todas. Ella trajo oro, especias y piedras preciosas, y se maravilló de su sabiduría y del templo que había edificado.'
      },
      quiz: [
        { q: { en: 'Why did the Queen of Sheba visit Solomon?', es: '¿Por qué visitó la reina de Sabá a Salomón?' },
          options: { en: ['To test his wisdom','To make war','To collect taxes','To build a road'], es: ['Para probar su sabiduría','Para hacer guerra','Para cobrar impuestos','Para construir un camino'] }, answer: 0 },
        { q: { en: 'What did the queen bring to Solomon?', es: '¿Qué le trajo la reina a Salomón?' },
          options: { en: ['Soldiers','Gold and spices','Cattle only','Empty hands'], es: ['Soldados','Oro y especias','Solo ganado','Manos vacías'] }, answer: 1 }
      ]
    },
    { id: 'sower', testament: 'NT', icon: '🌱', ageMin: 8,
      title: { en: 'The Parable of the Sower', es: 'La Parábola del Sembrador' },
      summary: {
        en: 'Jesus told of a sower who scattered seed. Some fell on the path and birds ate it; some on rocky ground and withered; some among thorns and was choked; and some on good soil, where it grew and bore fruit a hundredfold. He said the seed is the word of God.',
        es: 'Jesús habló de un sembrador que esparció semilla. Una parte cayó junto al camino y las aves la comieron; otra en terreno pedregoso y se secó; otra entre espinos y fue ahogada; y otra en buena tierra, donde creció y dio fruto a ciento por uno. Dijo que la semilla es la palabra de Dios.'
      },
      quiz: [
        { q: { en: 'What did the sower scatter?', es: '¿Qué esparció el sembrador?' },
          options: { en: ['Stones','Seed','Water','Gold'], es: ['Piedras','Semilla','Agua','Oro'] }, answer: 1 },
        { q: { en: 'Where did the seed bear much fruit?', es: '¿Dónde dio mucho fruto la semilla?' },
          options: { en: ['On the path','On rocky ground','Among thorns','On good soil'], es: ['Junto al camino','En terreno pedregoso','Entre espinos','En buena tierra'] }, answer: 3 },
        { q: { en: 'What does the seed represent?', es: '¿Qué representa la semilla?' },
          options: { en: ['The word of God','Money','Rain','The sun'], es: ['La palabra de Dios','El dinero','La lluvia','El sol'] }, answer: 0 }
      ]
    },
    { id: 'talents', testament: 'NT', icon: '💰', ageMin: 10,
      title: { en: 'The Parable of the Talents', es: 'La Parábola de los Talentos' },
      summary: {
        en: 'A man going on a journey gave his servants talents of money: five to one, two to another, one to a third. The first two traded and doubled theirs, but the third buried his in the ground. On returning, the master praised the first two and rebuked the one who hid his talent.',
        es: 'Un hombre que se iba de viaje dio a sus siervos talentos de dinero: cinco a uno, dos a otro, uno a un tercero. Los dos primeros negociaron y los duplicaron, pero el tercero enterró el suyo en la tierra. Al volver, el señor alabó a los dos primeros y reprendió al que escondió su talento.'
      },
      quiz: [
        { q: { en: 'How many talents did the first servant receive?', es: '¿Cuántos talentos recibió el primer siervo?' },
          options: { en: ['One','Two','Five','Ten'], es: ['Uno','Dos','Cinco','Diez'] }, answer: 2 },
        { q: { en: 'What did the third servant do with his talent?', es: '¿Qué hizo el tercer siervo con su talento?' },
          options: { en: ['Doubled it','Gave it away','Buried it in the ground','Lost it gambling'], es: ['Lo duplicó','Lo regaló','Lo enterró en la tierra','Lo perdió jugando'] }, answer: 2 },
        { q: { en: 'A talent in the parable was a measure of what?', es: '¿Un talento en la parábola era una medida de qué?' },
          options: { en: ['Money','Grain','Land','Time'], es: ['Dinero','Grano','Tierra','Tiempo'] }, answer: 0 }
      ]
    },
    { id: 'lazarus', testament: 'NT', icon: '🪦', ageMin: 9,
      title: { en: 'Lazarus Raised from the Dead', es: 'La Resurrección de Lázaro' },
      summary: {
        en: 'Lazarus of Bethany, the brother of Martha and Mary, fell sick and died. When Jesus arrived, Lazarus had been four days in the tomb. Jesus wept, then called out, "Lazarus, come forth!" Lazarus came out of the tomb still bound in burial cloths, alive again.',
        es: 'Lázaro de Betania, hermano de Marta y María, enfermó y murió. Cuando Jesús llegó, Lázaro llevaba cuatro días en el sepulcro. Jesús lloró, y luego clamó: "¡Lázaro, ven fuera!" Lázaro salió del sepulcro envuelto aún en vendas, vivo de nuevo.'
      },
      quiz: [
        { q: { en: 'How many days had Lazarus been in the tomb?', es: '¿Cuántos días llevaba Lázaro en el sepulcro?' },
          options: { en: ['One','Two','Four','Seven'], es: ['Uno','Dos','Cuatro','Siete'] }, answer: 2 },
        { q: { en: 'Who were the sisters of Lazarus?', es: '¿Quiénes eran las hermanas de Lázaro?' },
          options: { en: ['Martha and Mary','Ruth and Naomi','Rachel and Leah','Sarah and Hagar'], es: ['Marta y María','Rut y Noemí','Raquel y Lea','Sara y Agar'] }, answer: 0 },
        { q: { en: 'What did Jesus say to call Lazarus out?', es: '¿Qué dijo Jesús para llamar a Lázaro?' },
          options: { en: ['Rise and walk','Lazarus, come forth','Peace be with you','Follow me'], es: ['Levántate y anda','Lázaro, ven fuera','La paz sea contigo','Sígueme'] }, answer: 1 }
      ]
    },
    { id: 'journeys', testament: 'NT', icon: '⛵', ageMin: 10,
      title: { en: 'Paul\'s Missionary Journeys', es: 'Los Viajes Misioneros de Pablo' },
      summary: {
        en: 'After his conversion, the apostle Paul made several journeys across the Roman world, sailing the Mediterranean and travelling by land. He preached in cities such as Antioch, Philippi, Corinth, Ephesus, and Athens, founding churches and writing letters to them that are part of the New Testament.',
        es: 'Tras su conversión, el apóstol Pablo realizó varios viajes por el mundo romano, navegando el Mediterráneo y viajando por tierra. Predicó en ciudades como Antioquía, Filipos, Corinto, Éfeso y Atenas, fundando iglesias y escribiéndoles cartas que forman parte del Nuevo Testamento.'
      },
      quiz: [
        { q: { en: 'How did Paul travel across the Mediterranean?', es: '¿Cómo viajaba Pablo por el Mediterráneo?' },
          options: { en: ['By ship','By horse','By chariot','By camel'], es: ['En barco','A caballo','En carro','En camello'] }, answer: 0 },
        { q: { en: 'In which city did Paul preach at the Areopagus?', es: '¿En qué ciudad predicó Pablo en el Areópago?' },
          options: { en: ['Rome','Athens','Jerusalem','Damascus'], es: ['Roma','Atenas','Jerusalén','Damasco'] }, answer: 1 },
        { q: { en: 'What did Paul write to the churches he founded?', es: '¿Qué escribió Pablo a las iglesias que fundó?' },
          options: { en: ['Maps','Letters','Songs','Laws'], es: ['Mapas','Cartas','Canciones','Leyes'] }, answer: 1 }
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
      es: 'Dios es [amor].' },

    // ── v2 expansion: 30 more verses ─────────────────────────────────
    // Same public-domain translations (Reina-Valera 1909 / Douay-Rheims).
    // Mix of Psalms, Proverbs, Prophets, Gospels, Epistles. Distribution:
    // tier 1 = 18 · tier 2 = 9 · tier 3 = 3 (full catalog: 60 verses)

    { ref: 'Gen 1:27', tier: 1,
      en: 'God created man to his own [image].',
      es: 'Creó Dios al hombre a su [imagen].' },
    { ref: 'Ex 20:3', tier: 1,
      en: 'Thou shalt not have strange [gods] before me.',
      es: 'No tendrás [dioses] ajenos delante de mí.' },
    { ref: 'Dt 6:5', tier: 2,
      en: 'Thou shalt love the Lord thy God with thy whole [heart], and with thy whole [soul].',
      es: 'Amarás a Jehová tu Dios de todo tu [corazón], y de toda tu [alma].' },
    { ref: 'Jos 1:9', tier: 1,
      en: 'Take courage, and be strong. Fear not, and be not [dismayed].',
      es: 'Esfuérzate y sé valiente; no temas, ni desmayes ante [ningún temor].' },
    { ref: 'Ps 19:1', tier: 1,
      en: 'The heavens shew forth the [glory] of God.',
      es: 'Los cielos cuentan la [gloria] de Dios.' },
    { ref: 'Ps 23:4', tier: 1,
      en: 'I will fear no [evils], for thou art with me.',
      es: 'No temeré [mal] alguno, porque tú estarás conmigo.' },
    { ref: 'Ps 34:8', tier: 1,
      en: 'O taste, and see that the Lord is [sweet].',
      es: 'Gustad y ved cuán [bueno] es Jehová.' },
    { ref: 'Ps 46:10', tier: 1,
      en: 'Be still, and see that I am [God].',
      es: 'Estad quietos, y conoced que yo soy [Dios].' },
    { ref: 'Ps 51:10', tier: 1,
      en: 'Create a clean [heart] in me, O God.',
      es: 'Crea en mí, oh Dios, un [corazón] limpio.' },
    { ref: 'Ps 121:1', tier: 1,
      en: 'I have lifted up my eyes to the [mountains], from whence help shall come to me.',
      es: 'Alzaré mis ojos a los [montes], de donde vendrá mi socorro.' },
    { ref: 'Ps 139:14', tier: 1,
      en: 'I will praise thee, for thou art fearfully [magnified].',
      es: 'Te alabaré; porque formidables, [maravillosas] son tus obras.' },
    { ref: 'Prov 3:6', tier: 1,
      en: 'In all thy ways think on him, and he will direct thy [steps].',
      es: 'Reconócelo en todos tus caminos, y él enderezará tus [veredas].' },
    { ref: 'Prov 15:1', tier: 1,
      en: 'A mild answer breaketh [wrath].',
      es: 'La blanda respuesta quita la [ira].' },
    { ref: 'Prov 17:17', tier: 1,
      en: 'He that is a [friend] loveth at all times.',
      es: 'En todo tiempo ama el [amigo].' },
    { ref: 'Eccl 3:1', tier: 1,
      en: 'There is a time for every [purpose] under heaven.',
      es: 'Todo tiene su [tiempo] bajo el cielo.' },
    { ref: 'Isa 41:10', tier: 2,
      en: 'Fear not, for I am with thee. Be not [dismayed], for I am thy [God].',
      es: 'No temas, porque yo estoy contigo; no [desmayes], porque yo soy tu [Dios].' },
    { ref: 'Isa 53:5', tier: 2,
      en: 'He was [wounded] for our iniquities, and by his [bruises] we are healed.',
      es: 'Mas él herido fue por nuestras [rebeliones], y por su [llaga] fuimos nosotros curados.' },
    { ref: 'Jer 29:11', tier: 2,
      en: 'I know the thoughts I think over you, thoughts of [peace], and not of [affliction].',
      es: 'Yo sé los pensamientos que tengo acerca de vosotros, pensamientos de [paz], y no de [mal].' },
    { ref: 'Lam 3:22', tier: 1,
      en: 'The mercies of the Lord are [new] every morning.',
      es: 'Nuevas son cada [mañana] las misericordias del Señor.' },
    { ref: 'Mt 4:4', tier: 1,
      en: 'Not in bread alone doth man [live], but in every word that proceedeth from the mouth of God.',
      es: 'No sólo de pan [vivirá] el hombre, sino de toda palabra que sale de la boca de Dios.' },
    { ref: 'Mt 5:16', tier: 1,
      en: 'So let your light [shine] before men.',
      es: 'Así alumbre vuestra [luz] delante de los hombres.' },
    { ref: 'Mt 6:21', tier: 1,
      en: 'Where thy [treasure] is, there is thy heart also.',
      es: 'Donde está tu [tesoro], allí estará también tu corazón.' },
    { ref: 'Mt 7:12', tier: 1,
      en: 'All things therefore whatsoever you would that men should do to you, do you also to [them].',
      es: 'Así que, todas las cosas que queráis que los hombres hagan con vosotros, hacedlas vosotros con [ellos].' },
    { ref: 'Mk 12:31', tier: 1,
      en: 'Thou shalt love thy [neighbour] as thyself.',
      es: 'Amarás a tu [prójimo] como a ti mismo.' },
    { ref: 'Lk 6:31', tier: 1,
      en: 'As you would that men should do to you, do you also to them in like [manner].',
      es: 'Como queréis que hagan los hombres con vosotros, así también haced vosotros con [ellos].' },
    { ref: 'Jn 10:11', tier: 1,
      en: 'I am the good [shepherd].',
      es: 'Yo soy el buen [pastor].' },
    { ref: 'Acts 20:35', tier: 1,
      en: 'It is a more [blessed] thing to give, rather than to receive.',
      es: 'Más [bienaventurada] cosa es dar que recibir.' },
    { ref: 'Rom 12:21', tier: 1,
      en: 'Be not overcome by evil, but overcome evil by [good].',
      es: 'No seas vencido de lo malo, sino vence con el [bien] al mal.' },
    { ref: '1 Cor 13:13', tier: 3,
      en: 'Now there remain [faith], [hope], and [charity].',
      es: 'Ahora permanecen la [fe], la [esperanza], y la [caridad].' },
    { ref: 'Gal 5:22', tier: 2,
      en: 'The fruit of the Spirit is [charity], [joy], peace, patience.',
      es: 'El fruto del Espíritu es [caridad], [gozo], paz, paciencia.' },

    // ── v3 expansion: 12 more verses, with harder tier-3/tier-4 ──────
    // Same public-domain translations (Reina-Valera 1909 / Douay-Rheims).
    { ref: 'Ex 20:12', tier: 2,
      en: 'Honour thy [father] and thy [mother], that thou mayest be longlived upon the land.',
      es: 'Honra a tu [padre] y a tu [madre], para que tus días se alarguen en la tierra.' },
    { ref: 'Num 6:24', tier: 2,
      en: 'The Lord [bless] thee, and [keep] thee.',
      es: 'Jehová te [bendiga], y te [guarde].' },
    { ref: 'Dt 31:6', tier: 3,
      en: 'Be of good courage, and be [strong]: fear not, for the [Lord] thy God himself is thy [leader].',
      es: 'Esforzaos y cobrad [ánimo]; no temáis, porque [Jehová] tu Dios es el que [va] contigo.' },
    { ref: 'Jos 24:15', tier: 2,
      en: 'But as for me and my [house], we will serve the [Lord].',
      es: 'Pero yo y mi [casa] serviremos a [Jehová].' },
    { ref: 'Ps 1:1', tier: 3,
      en: 'Blessed is the [man] who hath not walked in the [counsel] of the [ungodly].',
      es: 'Bienaventurado el [varón] que no anduvo en [consejo] de [malos].' },
    { ref: 'Ps 27:14', tier: 3,
      en: '[Expect] the Lord, do [manfully], and let thy [heart] take courage.',
      es: '[Aguarda] a Jehová; esfuérzate, y aliéntese tu [corazón]; sí, espera a [Jehová].' },
    { ref: 'Ps 91:1', tier: 3,
      en: 'He that [dwelleth] in the aid of the [most High], shall abide under the [protection] of the God of heaven.',
      es: 'El que [habita] al abrigo del [Altísimo] morará bajo la [sombra] del Omnipotente.' },
    { ref: 'Prov 22:6', tier: 2,
      en: '[Train] up a child in the way he should go: and when he is old, he will not [depart] from it.',
      es: '[Instruye] al niño en su camino, y aun cuando fuere viejo no se [apartará] de él.' },
    { ref: 'Isa 6:3', tier: 3,
      en: '[Holy], holy, holy, the Lord God of [hosts], all the earth is full of his [glory].',
      es: '[Santo], santo, santo, Jehová de los [ejércitos]: toda la tierra está llena de su [gloria].' },
    { ref: 'Mt 5:14', tier: 2,
      en: 'You are the [light] of the world. A city seated on a [mountain] cannot be hid.',
      es: 'Vosotros sois la [luz] del mundo; una ciudad asentada sobre un [monte] no se puede esconder.' },
    { ref: 'Mt 11:28', tier: 3,
      en: 'Come to me, all you that [labour] and are [burdened], and I will [refresh] you.',
      es: 'Venid a mí todos los que estáis [trabajados] y [cargados], y yo os haré [descansar].' },
    { ref: 'Rev 21:4', tier: 4,
      en: 'God shall wipe away all [tears] from their eyes: and [death] shall be no more, nor [mourning], nor crying, nor [sorrow].',
      es: 'Dios enjugará toda [lágrima] de los ojos de ellos; y ya no habrá [muerte], ni habrá más [llanto], ni clamor, ni [dolor].' }
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
