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
          options: { en: ['Stars','Mountains','Trees','Fish'], es: ['Estrellas','Montañas','Árboles','Peces'] }, answer: 0 },
        { q: { en: 'What is Abraham called?', es: '¿Cómo se llama a Abrahán?' },
          options: { en: ['The father of faith','The king of Egypt','A Roman soldier','The builder of the ark'], es: ['El padre de la fe','El rey de Egipto','Un soldado romano','El constructor del arca'] }, answer: 0 }
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
          options: { en: ['Gold','Power','Wisdom','Long life'], es: ['Oro','Poder','Sabiduría','Larga vida'] }, answer: 2 },
        { q: { en: 'Whose son was Solomon?', es: '¿De quién era hijo Salomón?' },
          options: { en: ['Moses','David','Saul','Aaron'], es: ['Moisés','David','Saúl','Aarón'] }, answer: 1 }
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
          options: { en: ['One day','Three days','Seven days','Forty days'], es: ['Un día','Tres días','Siete días','Cuarenta días'] }, answer: 1 },
        { q: { en: 'Where did God tell Jonah to preach?', es: '¿Adónde le dijo Dios a Jonás que predicara?' },
          options: { en: ['Nineveh','Jerusalem','Rome','Bethlehem'], es: ['Nínive','Jerusalén','Roma','Belén'] }, answer: 0 }
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
          options: { en: ['Isaiah','Jeremiah','Ezekiel','Daniel'], es: ['Isaías','Jeremías','Ezequiel','Daniel'] }, answer: 0 },
        { q: { en: 'Who wept for Jerusalem?', es: '¿Quién lloró por Jerusalén?' },
          options: { en: ['Jeremiah','Isaiah','Ezekiel','Daniel'], es: ['Jeremías','Isaías','Ezequiel','Daniel'] }, answer: 0 }
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
          options: { en: ['Michael','Raphael','Gabriel','Uriel'], es: ['Miguel','Rafael','Gabriel','Uriel'] }, answer: 2 },
        { q: { en: 'In which town did the angel visit Mary?', es: '¿En qué pueblo visitó el ángel a María?' },
          options: { en: ['Nazareth','Bethlehem','Jerusalem','Cana'], es: ['Nazaret','Belén','Jerusalén','Caná'] }, answer: 0 }
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
          options: { en: ['Hail Mary','Our Father','Glory Be','Creed'], es: ['Ave María','Padre Nuestro','Gloria','Credo'] }, answer: 1 },
        { q: { en: 'Which teaching begins "Blessed are the poor in spirit"?', es: '¿Qué enseñanza empieza con "Bienaventurados los pobres de espíritu"?' },
          options: { en: ['The Beatitudes','The Ten Commandments','The Creed','The Psalms'], es: ['Las Bienaventuranzas','Los Diez Mandamientos','El Credo','Los Salmos'] }, answer: 0 }
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
          options: { en: ['Forty','Fifty','Seven','Three'], es: ['Cuarenta','Cincuenta','Siete','Tres'] }, answer: 1 },
        { q: { en: 'What rested on each of the apostles?', es: '¿Qué se posó sobre cada apóstol?' },
          options: { en: ['Tongues of fire','A rainbow','A crown','A stone tablet'], es: ['Lenguas de fuego','Un arcoíris','Una corona','Una tabla de piedra'] }, answer: 0 }
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
          options: { en: ['Blessed be the name of the Lord','It is unfair','I will never trust again','I quit'], es: ['Bendito sea el nombre del Señor','Es injusto','Nunca volveré a confiar','Renuncio'] }, answer: 0 },
        { q: { en: 'What did God do for Job after the trial?', es: '¿Qué hizo Dios por Job después de la prueba?' },
          options: { en: ['Restored everything double','Left him with nothing','Sent him to Egypt','Made him a king'], es: ['Le restauró todo el doble','Lo dejó sin nada','Lo envió a Egipto','Lo hizo rey'] }, answer: 0 }
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
    { ref: 'Rev 21:4', tier: 3,
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


  // Spanish names of the 73 books, same order as BOOK_GROUPS.
  const BOOK_NAMES_ES = {
    'Genesis': 'Génesis', 'Exodus': 'Éxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números', 'Deuteronomy': 'Deuteronomio',
    'Joshua': 'Josué', 'Judges': 'Jueces', 'Ruth': 'Rut', '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel',
    '1 Kings': '1 Reyes', '2 Kings': '2 Reyes', '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas',
    'Ezra': 'Esdras', 'Nehemiah': 'Nehemías', 'Tobit': 'Tobías', 'Judith': 'Judit', 'Esther': 'Ester',
    '1 Maccabees': '1 Macabeos', '2 Maccabees': '2 Macabeos',
    'Job': 'Job', 'Psalms': 'Salmos', 'Proverbs': 'Proverbios', 'Ecclesiastes': 'Eclesiastés',
    'Song of Songs': 'Cantar de los Cantares', 'Wisdom': 'Sabiduría', 'Sirach': 'Eclesiástico',
    'Isaiah': 'Isaías', 'Jeremiah': 'Jeremías', 'Lamentations': 'Lamentaciones', 'Baruch': 'Baruc',
    'Ezekiel': 'Ezequiel', 'Daniel': 'Daniel', 'Hosea': 'Oseas', 'Joel': 'Joel', 'Amos': 'Amós',
    'Obadiah': 'Abdías', 'Jonah': 'Jonás', 'Micah': 'Miqueas', 'Nahum': 'Nahúm', 'Habakkuk': 'Habacuc',
    'Zephaniah': 'Sofonías', 'Haggai': 'Ageo', 'Zechariah': 'Zacarías', 'Malachi': 'Malaquías',
    'Matthew': 'Mateo', 'Mark': 'Marcos', 'Luke': 'Lucas', 'John': 'Juan',
    'Acts of the Apostles': 'Hechos de los Apóstoles',
    'Romans': 'Romanos', '1 Corinthians': '1 Corintios', '2 Corinthians': '2 Corintios', 'Galatians': 'Gálatas',
    'Ephesians': 'Efesios', 'Philippians': 'Filipenses', 'Colossians': 'Colosenses',
    '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses',
    '1 Timothy': '1 Timoteo', '2 Timothy': '2 Timoteo', 'Titus': 'Tito', 'Philemon': 'Filemón', 'Hebrews': 'Hebreos',
    'James': 'Santiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro', '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan',
    'Jude': 'Judas', 'Revelation': 'Apocalipsis'
  };
  // Spine colours per section (leather of the bookshelf).
  const SHELF_COLORS = {
    pentateuch: ['#7a1a22', '#8e2a2a'], historical: ['#6a4426', '#7a5232'], wisdom: ['#2f5a3a', '#3a6a46'],
    prophets: ['#3a3a7a', '#4a4a8e'], gospels: ['#9a6d14', '#b4831f'], acts: ['#a2481a', '#b85a26'],
    letters: ['#1f5a6a', '#2a6a7a'], revelation: ['#5a1a4a', '#6a2a5a']
  };

  // ── State ──
  const state = {
    lang: 'en',
    mode: null,        // 'stories' | 'verses' | 'books'
    activeStoryIdx: 0,
    activeVerseIdx: 0,
    activeGroupIdx: 0
  };

  // ── Storage ──
  // Saved shape (zs_bible_<user>), all fields kept as before:
  //   stories: [storyId]            storyStars: { storyId: 1..3 }
  //   verses:  { ref: { stars } }   books: { groupId: { stars } }
  // ADDED (v3): verses[ref].box / .due / .reps (spaced repetition),
  //   review: { lastDay, streak, done }, sortBest, lang.
  // The star rule (js/auth.js) sums storyStars, verses[].stars and
  // books[].stars only, so the added fields never change a kid's stars.
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
  const L = (en, es) => (state.lang === 'es' ? es : en);
  const esc = s => (typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'));
  const sfx = n => { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function _tier() {
    const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    return typeof getAgeTier === 'function' ? getAgeTier(u ? u.age : null) : 'intermediate';
  }
  const bookName = n => (state.lang === 'es' ? (BOOK_NAMES_ES[n] || n) : n);
  const starRow = (n, max) => { let s = ''; for (let i = 0; i < (max || 3); i++) s += '<span class="bx-st' + (i < n ? ' on' : '') + '">★</span>'; return s; };

  // ── Screens ──
  function _showScreen(id) {
    document.querySelectorAll('.bx-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  function _renderHome() {
    const prog = _loadProgress();
    const storiesDone = (prog.stories || []).length;
    const versesDone = Object.keys(prog.verses || {}).length;
    const booksDone = Object.keys(prog.books || {}).length;
    document.getElementById('bx-stories-stat').textContent = storiesDone + '/' + STORIES.length;
    document.getElementById('bx-verses-stat').textContent = versesDone + '/' + VERSES.length;
    document.getElementById('bx-books-stat').textContent = booksDone + '/' + BOOK_GROUPS.length;
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('bx-ico-stories', BibleArt.icon('stories'));
    set('bx-ico-verses', BibleArt.icon('verses'));
    set('bx-ico-books', BibleArt.icon('books'));
    set('bx-hero-art', BibleArt.scene('creation', { thumb: true }));
    const t = document.querySelectorAll('[data-l10n]');
    t.forEach(el => { const k = el.getAttribute('data-l10n').split('|'); el.textContent = state.lang === 'es' ? k[1] : k[0]; });
    // Spaced-repetition reminder on the home screen
    const due = _dueVerses(prog).length;
    const rv = document.getElementById('bx-review-banner');
    if (rv) {
      if (due) {
        rv.hidden = false;
        rv.innerHTML = BibleArt.icon('review') + '<span><strong>' + L('Review time', 'Hora de repasar') + '</strong> · ' +
          due + ' ' + L(due === 1 ? 'verse is ready' : 'verses are ready', due === 1 ? 'versículo listo' : 'versículos listos') + '</span><span class="bx-review-go">' + L('Start ➔', 'Empezar ➔') + '</span>';
      } else rv.hidden = true;
    }
    _showScreen('bx-screen-home');
  }

  // ════════════════════ STORIES ════════════════════
  function openStories() {
    state.mode = 'stories';
    state.activeStoryIdx = 0;
    _renderStoryList();
    _showScreen('bx-screen-stories');
  }

  function _renderStoryList() {
    const grid = document.getElementById('bx-story-grid');
    if (!grid) return;
    const prog = _loadProgress();
    const done = new Set(prog.stories || []);
    const stars = prog.storyStars || {};
    const card = (s, idx) =>
      '<button type="button" class="bx-story-card' + (done.has(s.id) ? ' bx-done' : '') + '" data-idx="' + idx + '">' +
        '<span class="bx-story-thumb">' + BibleArt.scene(s.id, { thumb: true }) + '</span>' +
        '<span class="bx-story-body">' +
          '<span class="bx-story-title">' + esc(_l(s.title)) + '</span>' +
          '<span class="bx-story-meta"><span class="bx-age">' + s.ageMin + '+</span>' +
          (done.has(s.id) ? '<span class="bx-story-stars" aria-label="' + (stars[s.id] || 1) + ' ' + L('stars', 'estrellas') + '">' + starRow(stars[s.id] || 1) + '</span>' : '<span class="bx-story-new">' + L('Read', 'Leer') + '</span>') +
          '</span></span></button>';
    const sec = (t, label) => {
      const list = STORIES.map((s, i) => [s, i]).filter(x => x[0].testament === t);
      const n = list.filter(x => done.has(x[0].id)).length;
      return '<section class="bx-shelf-sec"><h3 class="bx-sec-head"><span>' + label + '</span><small>' + n + ' / ' + list.length + '</small></h3>' +
        '<div class="bx-story-cards">' + list.map(x => card(x[0], x[1])).join('') + '</div></section>';
    };
    grid.innerHTML = sec('OT', L('Old Testament', 'Antiguo Testamento')) + sec('NT', L('New Testament', 'Nuevo Testamento'));
    grid.querySelectorAll('.bx-story-card').forEach(b => { b.onclick = () => { sfx('click'); _openStory(+b.dataset.idx); }; });
  }

  // Split a summary into sentences for the "put the story in order" task.
  function _sentences(text) {
    const m = text.match(/[^.!?]+[.!?]+["”»']?\s*/g) || [text];
    return m.map(x => x.trim()).filter(x => x.length > 3);
  }

  function _openStory(idx) {
    state.activeStoryIdx = idx;
    const s = STORIES[idx];
    if (!s) return;
    const prog = _loadProgress();
    const st = (prog.storyStars || {})[s.id] || 0;
    const sum = _l(s.summary);
    const wrap = document.getElementById('bx-story-detail');
    const prev = idx > 0 ? idx - 1 : null, next = idx < STORIES.length - 1 ? idx + 1 : null;
    wrap.innerHTML =
      '<div class="bx-topbar"><button type="button" class="bx-back-btn" aria-label="' + L('Back to stories', 'Volver a las historias') + '" onclick="BibleExplorer.backToStoryList()">←</button>' +
        '<span class="bx-crumb">' + L('Stories', 'Historias') + '</span></div>' +
      '<article class="bx-book">' +
        '<div class="bx-page bx-page-left"><figure class="bx-plate">' + BibleArt.scene(s.id, { label: _l(s.title) }) + '</figure></div>' +
        '<div class="bx-page bx-page-right">' +
          '<span class="bx-story-detail-tag">' + (s.testament === 'OT' ? L('Old Testament', 'Antiguo Testamento') : L('New Testament', 'Nuevo Testamento')) + '</span>' +
          '<h2 class="bx-book-title">' + esc(_l(s.title)) + '</h2>' +
          '<div class="bx-flourish" aria-hidden="true">❦</div>' +
          '<p class="bx-story-summary"><span class="bx-dropcap">' + esc(sum.charAt(0)) + '</span>' + esc(sum.slice(1)) + '</p>' +
          (st ? '<div class="bx-best">' + L('Your best', 'Tu mejor resultado') + ': ' + starRow(st) + '</div>' : '') +
          '<div class="bx-page-actions">' +
            '<button type="button" class="bx-primary-btn" onclick="BibleExplorer.startStoryQuiz()">' + L('🎯 Take the Quiz', '🎯 Cuestionario') + '</button>' +
          '</div>' +
          '<div class="bx-page-nav">' +
            (prev !== null ? '<button type="button" class="bx-secondary-btn" data-go="' + prev + '">‹ ' + esc(_l(STORIES[prev].title)) + '</button>' : '<span></span>') +
            (next !== null ? '<button type="button" class="bx-secondary-btn" data-go="' + next + '">' + esc(_l(STORIES[next].title)) + ' ›</button>' : '<span></span>') +
          '</div>' +
        '</div>' +
      '</article>';
    wrap.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => { sfx('click'); _openStory(+b.dataset.go); }; });
    _showScreen('bx-screen-story-detail');
  }

  function backToStoryList() {
    _renderStoryList();
    _showScreen('bx-screen-stories');
  }

  // Quiz: the story's own questions, with fewer choices for the
  // youngest; older kids also put the story's sentences in order.
  let _quiz = null;
  function startStoryQuiz() {
    const s = STORIES[state.activeStoryIdx];
    if (!s || !s.quiz || !s.quiz.length) return;
    const tier = _tier();
    const nOpts = tier === 'beginner' ? 2 : tier === 'intermediate' ? 3 : 4;
    const items = s.quiz.map(q => {
      const opts = q.options[state.lang] || q.options.en;
      let idx = opts.map((_, i) => i);
      if (idx.length > nOpts) idx = [q.answer].concat(shuffle(idx.filter(i => i !== q.answer)).slice(0, nOpts - 1));
      return { type: 'mc', q: _l(q.q), opts: shuffle(idx).map(i => opts[i]), answer: opts[q.answer] };
    });
    if (tier === 'advanced' || tier === 'expert') {
      const sen = _sentences(_l(s.summary));
      if (sen.length >= 3) items.push({ type: 'order', parts: sen.slice(0, tier === 'expert' ? 5 : 4) });
    }
    _quiz = { items, i: 0, correct: 0 };
    _renderQuizQuestion();
    _showScreen('bx-screen-story-quiz');
  }

  function _quizHead() {
    const s = STORIES[state.activeStoryIdx];
    return '<div class="bx-quiz-head"><span class="bx-quiz-mini">' + BibleArt.scene(s.id, { thumb: true }) + '</span>' +
      '<div><div class="bx-quiz-story">' + esc(_l(s.title)) + '</div>' +
      '<div class="bx-dots">' + _quiz.items.map((_, i) => '<i class="' + (i < _quiz.i ? 'done' : i === _quiz.i ? 'cur' : '') + '"></i>').join('') + '</div></div></div>';
  }

  function _renderQuizQuestion() {
    const it = _quiz.items[_quiz.i];
    if (!it) return _finishStoryQuiz();
    const wrap = document.getElementById('bx-quiz-wrap');
    if (it.type === 'order') return _renderOrderQuestion(wrap, it);
    wrap.innerHTML = _quizHead() +
      '<div class="bx-quiz-counter">' + (_quiz.i + 1) + ' / ' + _quiz.items.length + '</div>' +
      '<h2 class="bx-quiz-q">' + esc(it.q) + '</h2>' +
      '<div class="bx-quiz-options' + (it.opts.length === 2 ? ' bx-two' : '') + '">' +
        it.opts.map(o => '<button type="button" class="bx-quiz-opt" data-v="' + esc(o) + '">' + esc(o) + '</button>').join('') +
      '</div><div class="bx-quiz-fb" aria-live="polite"></div>';
    wrap.querySelectorAll('.bx-quiz-opt').forEach(btn => {
      btn.onclick = () => {
        if (wrap.dataset.locked === '1') return;
        wrap.dataset.locked = '1';
        const correct = btn.dataset.v === it.answer;
        btn.classList.add(correct ? 'bx-correct' : 'bx-wrong');
        wrap.querySelectorAll('.bx-quiz-opt').forEach(b => { b.disabled = true; if (b.dataset.v === it.answer) b.classList.add('bx-correct'); });
        if (correct) _quiz.correct++;
        sfx(correct ? 'correct' : 'wrong');
        const fb = wrap.querySelector('.bx-quiz-fb');
        fb.className = 'bx-quiz-fb ' + (correct ? 'bx-feedback-good' : 'bx-feedback-bad');
        fb.textContent = correct ? L('Correct!', '¡Correcto!') : L('The answer is: ', 'La respuesta es: ') + it.answer;
        setTimeout(() => { wrap.dataset.locked = ''; _quiz.i++; _renderQuizQuestion(); }, correct ? 800 : 1600);
      };
    });
  }

  function _renderOrderQuestion(wrap, it) {
    const order = [];
    let mistakes = 0;
    const pool = shuffle(it.parts.map((p, i) => i));
    const draw = () => {
      wrap.innerHTML = _quizHead() +
        '<div class="bx-quiz-counter">' + (_quiz.i + 1) + ' / ' + _quiz.items.length + '</div>' +
        '<h2 class="bx-quiz-q">' + L('Put the story in order', 'Ordena la historia') + '</h2>' +
        '<ol class="bx-order-done">' + order.map(i => '<li>' + esc(it.parts[i]) + '</li>').join('') +
          (order.length < it.parts.length ? '<li class="bx-order-slot">' + L('Tap what happens next…', 'Toca lo que pasa después…') + '</li>' : '') + '</ol>' +
        '<div class="bx-order-pool">' + pool.filter(i => order.indexOf(i) === -1).map(i => '<button type="button" class="bx-order-opt" data-i="' + i + '">' + esc(it.parts[i]) + '</button>').join('') + '</div>';
      wrap.querySelectorAll('.bx-order-opt').forEach(b => {
        b.onclick = () => {
          const i = +b.dataset.i;
          if (i === order.length) {
            order.push(i); sfx('click');
            if (order.length === it.parts.length) {
              const ok = mistakes === 0;
              if (ok) _quiz.correct++;
              sfx(ok ? 'correct' : 'wrong');
              draw();
              const fb = document.createElement('div');
              fb.className = 'bx-quiz-fb ' + (ok ? 'bx-feedback-good' : 'bx-feedback-bad');
              fb.textContent = ok ? L('Perfect order!', '¡Orden perfecto!') : L('Done — with ', 'Listo — con ') + mistakes + L(' mistake(s).', ' error(es).');
              wrap.appendChild(fb);
              setTimeout(() => { _quiz.i++; _renderQuizQuestion(); }, 1400);
              return;
            }
            draw();
          } else {
            mistakes++; sfx('wrong');
            b.classList.add('bx-shake'); setTimeout(() => b.classList.remove('bx-shake'), 400);
          }
        };
      });
    };
    draw();
  }

  function _finishStoryQuiz() {
    const s = STORIES[state.activeStoryIdx];
    const total = _quiz.items.length;
    const acc = total > 0 ? _quiz.correct / total : 0;
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
    sfx(stars === 3 ? 'cheer' : 'star');
    const next = state.activeStoryIdx < STORIES.length - 1 ? state.activeStoryIdx + 1 : null;
    document.getElementById('bx-quiz-result').innerHTML =
      '<div class="bx-result-card">' +
      '<div class="bx-result-art">' + BibleArt.scene(s.id, { thumb: true }) + '</div>' +
      '<div class="bx-quiz-stars">' + starRow(stars) + '</div>' +
      '<h2 class="bx-book-title">' + (stars === 3 ? L('Wonderful!', '¡Maravilloso!') : stars === 2 ? L('Well done!', '¡Muy bien!') : L('Good try!', '¡Buen intento!')) + '</h2>' +
      '<p>' + _quiz.correct + ' / ' + total + ' ' + (state.lang === 'es' ? 'correctas' : 'correct') + '</p>' +
      '<div class="bx-page-actions">' +
        '<button type="button" class="bx-secondary-btn" onclick="BibleExplorer.backToStoryList()">' + (state.lang === 'es' ? '← Volver' : '← Back') + '</button>' +
        (stars < 3 ? '<button type="button" class="bx-secondary-btn" onclick="BibleExplorer.startStoryQuiz()">' + L('↺ Try again', '↺ Otra vez') + '</button>' : '') +
        (next !== null ? '<button type="button" class="bx-primary-btn" id="bx-next-story">' + L('Next story ➔', 'Siguiente historia ➔') + '</button>' : '') +
      '</div></div>';
    const nb = document.getElementById('bx-next-story');
    if (nb) nb.onclick = () => _openStory(next);
    _showScreen('bx-screen-story-result');
  }

  // ════════════════════ VERSES ════════════════════
  // Leitner boxes 1–5; a verse is due again after this many days.
  const SRS_DAYS = [0, 1, 2, 4, 7, 14];
  const _today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const _addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function _dueVerses(prog) {
    const v = prog.verses || {}, t = _today();
    return VERSES.filter(x => v[x.ref] && v[x.ref].stars > 0 && (!v[x.ref].due || v[x.ref].due <= t));
  }
  function _srsUpdate(rec, ok) {
    const box = rec.box || 0;
    rec.box = ok ? Math.min(5, Math.max(1, box + 1)) : 1;
    rec.due = _addDays(ok ? SRS_DAYS[rec.box] : 1);
    rec.reps = (rec.reps || 0) + 1;
    return rec;
  }

  let _review = null; // active review session
  function openVerses() {
    state.mode = 'verses';
    state.activeVerseIdx = 0;
    _review = null;
    _renderVerseList();
    _showScreen('bx-screen-verses');
  }

  function _renderVerseList() {
    const grid = document.getElementById('bx-verse-grid');
    if (!grid) return;
    const prog = _loadProgress();
    const done = prog.verses || {};
    const due = _dueVerses(prog);
    const rv = prog.review || {};
    const tiers = [[1, L('One word', 'Una palabra')], [2, L('Two words', 'Dos palabras')], [3, L('Three or more', 'Tres o más')]];
    grid.innerHTML =
      '<div class="bx-review-card' + (due.length ? ' is-due' : '') + '">' + BibleArt.icon('review') +
        '<div class="bx-review-text"><strong>' + L('Daily review', 'Repaso diario') + '</strong><span>' +
        (due.length ? due.length + ' ' + L('verses ready to review', 'versículos para repasar')
          : (Object.keys(done).length ? L('All caught up! Come back tomorrow.', '¡Al día! Vuelve mañana.') : L('Memorise a verse to start your review deck.', 'Memoriza un versículo para empezar tu repaso.'))) +
        (rv.streak ? ' · 🔥 ' + rv.streak + ' ' + L('day streak', 'días seguidos') : '') + '</span></div>' +
        (due.length ? '<button type="button" class="bx-primary-btn" id="bx-review-start">' + L('Review', 'Repasar') + '</button>' : '') +
      '</div>' +
      tiers.map(t => '<section class="bx-shelf-sec"><h3 class="bx-sec-head"><span>' + t[1] + '</span></h3><div class="bx-verse-cards">' +
        VERSES.map((v, idx) => [v, idx]).filter(x => x[0].tier === t[0]).map(x => {
          const v = x[0], rec = done[v.ref];
          const isDone = rec && rec.stars > 0;
          const box = rec && rec.box ? rec.box : 0;
          return '<button type="button" class="bx-verse-card bx-tier-' + v.tier + (isDone ? ' bx-done' : '') + '" data-idx="' + x[1] + '">' +
            '<span class="bx-verse-ref">' + esc(v.ref) + '</span>' +
            '<span class="bx-verse-peek">' + esc((state.lang === 'es' ? v.es : v.en).replace(/\[[^\]]+\]/g, '___').slice(0, 46)) + '…</span>' +
            (isDone ? '<span class="bx-verse-star">' + starRow(rec.stars, Math.min(3, v.tier)) + '</span>' : '') +
            (box ? '<span class="bx-box" title="' + L('Review level', 'Nivel de repaso') + '">' + '●'.repeat(box) + '<i>' + '●'.repeat(5 - box) + '</i></span>' : '') +
          '</button>';
        }).join('') + '</div></section>').join('');
    grid.querySelectorAll('.bx-verse-card').forEach(b => { b.onclick = () => { sfx('click'); _openVerse(+b.dataset.idx); }; });
    const rs = document.getElementById('bx-review-start');
    if (rs) rs.onclick = startReview;
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

  // Distractor words for the word bank: other blank words of the same
  // language, never equal to an answer.
  function _distractors(answers, n) {
    const pool = [];
    VERSES.forEach(v => _parseVerse(state.lang === 'es' ? v.es : v.en).blanks.forEach(b => {
      if (!answers.some(a => _normaliseWord(a) === _normaliseWord(b)) && !pool.some(p => _normaliseWord(p) === _normaliseWord(b))) pool.push(b);
    }));
    return shuffle(pool).slice(0, n);
  }

  function _defaultVerseMode() { const t = _tier(); return t === 'beginner' || t === 'intermediate' ? 'bank' : 'type'; }

  // opts.review: called with (ok) instead of the normal end
  function _openVerse(idx, mode, opts) {
    opts = opts || {};
    state.activeVerseIdx = idx;
    const v = VERSES[idx];
    if (!v) return;
    mode = mode || _defaultVerseMode();
    const text = state.lang === 'es' ? v.es : v.en;
    const parsed = _parseVerse(text);
    const wrap = document.getElementById('bx-verse-detail');
    const tabs = [['bank', L('Word bank', 'Banco de palabras')], ['type', L('Type it', 'Escribir')], ['order', L('Word order', 'Ordenar')]];
    const head =
      '<div class="bx-topbar"><button type="button" class="bx-back-btn" aria-label="' + L('Back to verses', 'Volver a los versículos') + '" id="bx-verse-back">←</button>' +
      '<span class="bx-crumb">' + (opts.review ? L('Review', 'Repaso') + ' · ' + opts.review.label : L('Memorise', 'Memoriza')) + '</span></div>' +
      (opts.review ? '' : '<div class="bx-modes" role="tablist">' + tabs.map(t => '<button type="button" role="tab" class="bx-mode' + (t[0] === mode ? ' active' : '') + '" aria-selected="' + (t[0] === mode) + '" data-mode="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>');

    let body = '';
    if (mode === 'order') {
      body = '<div class="bx-scroll"><div class="bx-verse-ref-big">' + esc(v.ref) + '</div>' +
        '<p class="bx-verse-text bx-order-line" id="bx-order-line"></p></div>' +
        '<div class="bx-chips" id="bx-order-pool"></div>' +
        '<div class="bx-verse-actions"><button type="button" class="bx-secondary-btn" id="bx-order-hint">' + L('💡 Hint', '💡 Pista') + '</button></div>';
    } else {
      let k = 0;
      const inner = parsed.segments.map(seg => {
        if (seg.type === 'text') return esc(seg.value);
        const i = k++;
        return mode === 'type'
          ? '<label class="bx-sr" for="bx-blank-' + i + '">' + L('Missing word ', 'Palabra que falta ') + (i + 1) + '</label><input class="bx-blank" id="bx-blank-' + i + '" data-idx="' + i + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="width:' + Math.max(4, seg.answer.length + 1) + 'ch">'
          : '<button type="button" class="bx-slot" data-idx="' + i + '" aria-label="' + L('Missing word ', 'Palabra que falta ') + (i + 1) + '"> </button>';
      }).join('');
      body = '<div class="bx-scroll"><div class="bx-verse-ref-big">' + esc(v.ref) + '</div><p class="bx-verse-text">' + inner + '</p></div>' +
        (mode === 'bank' ? '<div class="bx-chips" id="bx-bank"></div>' : '') +
        '<div class="bx-verse-actions">' +
          '<button type="button" class="bx-primary-btn" id="bx-verse-check">' + (state.lang === 'es' ? '✓ Comprobar' : '✓ Check') + '</button>' +
          '<button type="button" class="bx-secondary-btn" id="bx-verse-hint">' + (state.lang === 'es' ? '💡 Pista' : '💡 Hint') + '</button>' +
        '</div>';
    }
    wrap.innerHTML = head + body + '<div class="bx-verse-feedback" id="bx-verse-feedback" aria-live="polite"></div>';
    _showScreen('bx-screen-verse-detail');
    document.getElementById('bx-verse-back').onclick = () => { _review = null; backToVerseList(); };
    wrap.querySelectorAll('.bx-mode').forEach(b => { b.onclick = () => { sfx('click'); _openVerse(idx, b.dataset.mode); }; });

    const finish = (ok) => {
      if (opts.review) return opts.review.done(ok);
      if (ok) _awardVerse(v, parsed.blanks.length);
    };

    if (mode === 'order') return _wireOrder(v, text, finish);
    if (mode === 'bank') _wireBank(parsed);
    document.getElementById('bx-verse-check').onclick = () => {
      const ok = _checkVerse(idx, parsed, mode, !!opts.review);
      if (ok) finish(true);
      else if (opts.review) { opts.review.failed = true; }
    };
    document.getElementById('bx-verse-hint').onclick = () => { if (opts.review) opts.review.failed = true; _hintVerse(parsed, mode); };
    if (opts.review) opts.review.finish = finish;
  }

  function _wireBank(parsed) {
    const bank = document.getElementById('bx-bank');
    const t = _tier();
    const extra = t === 'beginner' ? 1 : t === 'intermediate' ? 2 : 3;
    const words = shuffle(parsed.blanks.concat(_distractors(parsed.blanks, extra)));
    const slots = [...document.querySelectorAll('#bx-verse-detail .bx-slot')];
    const used = {}; // slot idx -> chip idx
    bank.innerHTML = words.map((w, i) => '<button type="button" class="bx-chip" data-c="' + i + '">' + esc(w) + '</button>').join('');
    const chips = [...bank.querySelectorAll('.bx-chip')];
    chips.forEach(c => c.onclick = () => {
      const free = slots.find(s => used[s.dataset.idx] == null);
      if (!free) return;
      used[free.dataset.idx] = +c.dataset.c;
      free.textContent = words[+c.dataset.c];
      free.classList.add('is-filled'); free.classList.remove('bx-blank-wrong', 'bx-blank-correct');
      c.disabled = true; sfx('click');
    });
    slots.forEach(s => s.onclick = () => {
      const ci = used[s.dataset.idx];
      if (ci == null || s.classList.contains('bx-blank-correct')) return;
      delete used[s.dataset.idx];
      s.textContent = ' '; s.classList.remove('is-filled', 'bx-blank-wrong');
      chips[ci].disabled = false;
    });
  }

  function _wireOrder(v, text, finish) {
    const t = _tier();
    const plain = text.replace(/\[([^\]]+)\]/g, '$1');
    const words = plain.split(/\s+/).filter(Boolean);
    const size = t === 'beginner' ? 3 : t === 'intermediate' ? 2 : 1;
    const parts = [];
    for (let i = 0; i < words.length; i += size) parts.push(words.slice(i, i + size).join(' '));
    const pool = shuffle(parts.map((p, i) => i));
    const placed = [];
    let mistakes = 0;
    const allowed = t === 'beginner' ? 2 : t === 'expert' ? 0 : 1;
    const line = document.getElementById('bx-order-line'), poolEl = document.getElementById('bx-order-pool');
    const draw = () => {
      line.innerHTML = placed.map(i => '<span class="bx-placed">' + esc(parts[i]) + '</span>').join(' ') + (placed.length < parts.length ? ' <span class="bx-caret" aria-hidden="true">▍</span>' : '');
      poolEl.innerHTML = pool.filter(i => placed.indexOf(i) === -1).map(i => '<button type="button" class="bx-chip" data-i="' + i + '">' + esc(parts[i]) + '</button>').join('');
      poolEl.querySelectorAll('.bx-chip').forEach(c => c.onclick = () => {
        const i = +c.dataset.i;
        // equal words are interchangeable: accept any piece with the right text
        if (parts[i] === parts[placed.length]) {
          placed.push(placed.length);
          sfx('click');
          if (placed.length === parts.length) return done();
          draw();
        } else {
          mistakes++; sfx('wrong');
          c.classList.add('bx-shake'); setTimeout(() => c.classList.remove('bx-shake'), 400);
          const fb = document.getElementById('bx-verse-feedback');
          fb.className = 'bx-verse-feedback bx-feedback-bad';
          fb.textContent = L('Not that one yet — read it again.', 'Esa todavía no — léelo otra vez.');
        }
      });
    };
    const done = () => {
      draw();
      const ok = mistakes <= allowed;
      const fb = document.getElementById('bx-verse-feedback');
      fb.className = 'bx-verse-feedback ' + (ok ? 'bx-feedback-good' : 'bx-feedback-bad');
      fb.textContent = ok ? L('Great work! ', '¡Bien hecho! ') + (mistakes ? '(' + mistakes + L(' slip)', ' error)') : '⭐')
        : L('Finished with ', 'Terminado con ') + mistakes + L(' mistakes — try once more!', ' errores — ¡inténtalo otra vez!');
      sfx(ok ? 'correct' : 'wrong');
      finish(ok);
    };
    document.getElementById('bx-order-hint').onclick = () => {
      mistakes++;
      const c = poolEl.querySelector('.bx-chip[data-i="' + pool.find(i => placed.indexOf(i) === -1 && parts[i] === parts[placed.length]) + '"]');
      if (c) { c.classList.add('bx-glow'); setTimeout(() => c.classList.remove('bx-glow'), 1200); }
    };
    draw();
  }

  function _awardVerse(v, total) {
    const stars = total >= 3 ? 3 : total >= 2 ? 2 : 1;
    const prog = _loadProgress();
    prog.verses = prog.verses || {};
    const prev = prog.verses[v.ref] || { stars: 0 };
    const rec = Object.assign({}, prev, { stars: Math.max(prev.stars || 0, stars) });
    if (!rec.box) { rec.box = 1; rec.due = _addDays(SRS_DAYS[1]); }
    prog.verses[v.ref] = rec;
    _saveProgress(prog);
    const fb = document.getElementById('bx-verse-feedback');
    if (fb && fb.className.indexOf('good') === -1) {
      fb.className = 'bx-verse-feedback bx-feedback-good';
      fb.textContent = (state.lang === 'es' ? '¡Bien hecho! ' : 'Great work! ') + '⭐'.repeat(stars);
    }
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Bible Explorer', '✨', (state.lang === 'es' ? 'Memorizó ' : 'Memorised ') + v.ref);
    }
  }

  function backToVerseList() { _renderVerseList(); _showScreen('bx-screen-verses'); }

  function _normaliseWord(s) {
    // Strip diacritics (NFD splits "é" into "e" + combining acute), then
    // drop the combining-mark range U+0300..U+036F and any punctuation
    // so the kid doesn't get marked wrong for missing an accent.
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/gi, '');
  }

  function _checkVerse(idx, parsed, mode, quiet) {
    const fields = mode === 'type'
      ? [...document.querySelectorAll('#bx-verse-detail .bx-blank')]
      : [...document.querySelectorAll('#bx-verse-detail .bx-slot')];
    let correct = 0;
    const total = parsed.blanks.length;
    fields.forEach((inp, i) => {
      const got = _normaliseWord(mode === 'type' ? inp.value : inp.textContent);
      const okk = got === _normaliseWord(parsed.blanks[i]);
      inp.classList.toggle('bx-blank-correct', okk);
      inp.classList.toggle('bx-blank-wrong', !okk);
      if (okk) correct++;
    });
    const fb = document.getElementById('bx-verse-feedback');
    if (correct === total) {
      sfx('correct');
      fb.className = 'bx-verse-feedback bx-feedback-good';
      const stars = total >= 3 ? 3 : total >= 2 ? 2 : 1;
      fb.textContent = (state.lang === 'es' ? '¡Bien hecho! ' : 'Great work! ') + (quiet ? '✓' : '⭐'.repeat(stars));
      fields.forEach(f => { f.disabled = true; });
      const ck = document.getElementById('bx-verse-check'); if (ck) ck.disabled = true;
      return true;
    }
    sfx('wrong');
    fb.className = 'bx-verse-feedback bx-feedback-bad';
    fb.textContent = (state.lang === 'es'
      ? correct + ' de ' + total + ' correctas. Inténtalo de nuevo o pide una pista.'
      : correct + ' of ' + total + ' correct. Try again or tap Hint.');
    return false;
  }

  function _hintVerse(parsed, mode) {
    if (mode === 'type') {
      const inputs = document.querySelectorAll('#bx-verse-detail .bx-blank');
      for (let i = 0; i < inputs.length; i++) {
        if (_normaliseWord(inputs[i].value) !== _normaliseWord(parsed.blanks[i])) {
          inputs[i].value = parsed.blanks[i];
          inputs[i].classList.add('bx-blank-hint');
          return;
        }
      }
      return;
    }
    // word bank: light up the chip that belongs in the first open slot
    const slots = [...document.querySelectorAll('#bx-verse-detail .bx-slot')];
    const first = slots.findIndex(s => _normaliseWord(s.textContent) !== _normaliseWord(parsed.blanks[+s.dataset.idx]));
    if (first < 0) return;
    const chip = [...document.querySelectorAll('#bx-bank .bx-chip:not([disabled])')].find(c => _normaliseWord(c.textContent) === _normaliseWord(parsed.blanks[first]));
    if (chip) { chip.classList.add('bx-glow'); setTimeout(() => chip.classList.remove('bx-glow'), 1400); }
  }

  // ── Spaced-repetition review ──
  function startReview() {
    const prog = _loadProgress();
    const due = shuffle(_dueVerses(prog)).slice(0, 8);
    if (!due.length) return;
    _review = { list: due, i: 0, ok: 0 };
    _nextReview();
  }
  function _nextReview() {
    const R = _review;
    if (!R) return;
    if (R.i >= R.list.length) return _finishReview();
    const v = R.list[R.i];
    const idx = VERSES.indexOf(v);
    const t = _tier();
    // alternate the two games; the oldest kids type the words
    const mode = R.i % 2 ? 'order' : (t === 'advanced' || t === 'expert' ? 'type' : 'bank');
    const item = { label: (R.i + 1) + ' / ' + R.list.length, failed: false, done: null };
    item.done = (ok) => {
      if (R.answered) return;
      R.answered = true;
      ok = ok && !item.failed;
      const prog = _loadProgress();
      prog.verses = prog.verses || {};
      prog.verses[v.ref] = _srsUpdate(Object.assign({}, prog.verses[v.ref] || { stars: 0 }), ok);
      _saveProgress(prog);
      if (ok) R.ok++;
      const fb = document.getElementById('bx-verse-feedback');
      const box = prog.verses[v.ref].box;
      const msg = ok ? L('Remembered! Next review in ', '¡Lo recordaste! Próximo repaso en ') + SRS_DAYS[box] + L(SRS_DAYS[box] === 1 ? ' day.' : ' days.', SRS_DAYS[box] === 1 ? ' día.' : ' días.')
        : L("We'll practise this one again tomorrow.", 'Lo volveremos a practicar mañana.');
      if (fb) { fb.className = 'bx-verse-feedback ' + (ok ? 'bx-feedback-good' : 'bx-feedback-bad'); fb.textContent = msg; }
      const act = document.querySelector('#bx-verse-detail .bx-verse-actions');
      if (act) act.innerHTML = '<button type="button" class="bx-primary-btn" id="bx-review-next">' + (R.i < R.list.length - 1 ? L('Next verse ➔', 'Siguiente ➔') : L('Finish ✓', 'Terminar ✓')) + '</button>' +
        '';
      const nb = document.getElementById('bx-review-next');
      if (nb) nb.onclick = () => { R.i++; R.answered = false; _nextReview(); };
    };
    // Typing / word bank: a wrong check marks the item failed but the kid
    // can still finish it; giving up moves on.
    _openVerse(idx, mode, { review: item });
    const act = document.querySelector('#bx-verse-detail .bx-verse-actions');
    if (act && mode !== 'order') {
      const skip = document.createElement('button');
      skip.type = 'button'; skip.className = 'bx-secondary-btn';
      skip.textContent = L("I don't remember", 'No me acuerdo');
      skip.onclick = () => { item.failed = true; item.done(false); };
      act.appendChild(skip);
    }
  }
  function _finishReview() {
    const R = _review; _review = null;
    const prog = _loadProgress();
    const rv = prog.review || {};
    const t = _today();
    if (rv.lastDay !== t) {
      rv.streak = rv.lastDay === _addDays(-1) ? (rv.streak || 0) + 1 : 1;
      rv.lastDay = t;
    }
    rv.done = (rv.done || 0) + R.list.length;
    prog.review = rv;
    _saveProgress(prog);
    sfx(R.ok === R.list.length ? 'cheer' : 'star');
    const wrap = document.getElementById('bx-verse-detail');
    wrap.innerHTML = '<div class="bx-result-card">' + '<div class="bx-review-big">' + BibleArt.icon('review') + '</div>' +
      '<h2 class="bx-book-title">' + L('Review complete', 'Repaso terminado') + '</h2>' +
      '<p>' + R.ok + ' / ' + R.list.length + ' ' + L('remembered', 'recordados') + ' · 🔥 ' + rv.streak + ' ' + L('day streak', 'días seguidos') + '</p>' +
      '<div class="bx-page-actions"><button type="button" class="bx-primary-btn" onclick="BibleExplorer.backToVerseList()">' + L('← Verses', '← Versículos') + '</button></div></div>';
  }

  // ════════════════════ BOOKS ════════════════════
  function openBooks() {
    state.mode = 'books';
    state.activeGroupIdx = 0;
    _renderBookGroups();
    _showScreen('bx-screen-books');
  }

  function _spine(name, g, i, extra) {
    const c = SHELF_COLORS[g.id] || ['#6a4426', '#7a5232'];
    const len = bookName(name).length;
    const h = 92 + ((name.charCodeAt(0) * 7 + i * 13) % 26);
    const w = len > 14 ? 30 : len > 9 ? 26 : 23;
    return '<span class="bx-spine' + (len > 16 ? ' is-long' : '') + (extra || '') + '" style="--c1:' + c[0] + ';--c2:' + c[1] + ';height:' + h + 'px;width:' + w + 'px"><span class="bx-spine-txt">' + esc(bookName(name)) + '</span></span>';
  }

  function _renderBookGroups() {
    const grid = document.getElementById('bx-book-grid');
    if (!grid) return;
    const prog = _loadProgress();
    const done = prog.books || {};
    const shelf = (t, label) => '<section class="bx-case"><h3 class="bx-sec-head"><span>' + label + '</span></h3><div class="bx-shelves">' +
      BOOK_GROUPS.map((g, idx) => [g, idx]).filter(x => x[0].testament === t).map(x => {
        const g = x[0], rec = done[g.id];
        return '<button type="button" class="bx-shelf-group' + (rec && rec.stars > 0 ? ' bx-done' : '') + '" data-idx="' + x[1] + '" aria-label="' + esc(_l(g.label)) + ', ' + g.books.length + ' ' + L('books', 'libros') + '">' +
          '<span class="bx-spines">' + g.books.map((b, i) => _spine(b, g, i)).join('') + '</span>' +
          '<span class="bx-plaque"><b>' + esc(_l(g.label)) + '</b><small>' + g.books.length + ' ' + (g.books.length === 1 ? L('book', 'libro') : L('books', 'libros')) + '</small>' +
          (rec && rec.stars > 0 ? '<span class="bx-plaque-stars">' + starRow(rec.stars) + '</span>' : '') + '</span>' +
          (rec && rec.stars > 0 ? '<span class="bx-ribbon" aria-hidden="true"></span>' : '') +
        '</button>';
      }).join('') + '</div></section>';
    const best = prog.sortBest;
    grid.innerHTML =
      '<p class="bx-intro">' + L('Tap a section of the shelf, then put its books back in order.', 'Toca una sección de la estantería y vuelve a ordenar sus libros.') + '</p>' +
      shelf('OT', L('Old Testament · 46 books', 'Antiguo Testamento · 46 libros')) + shelf('NT', L('New Testament · 27 books', 'Nuevo Testamento · 27 libros')) +
      '<div class="bx-sort-card"><div><strong>' + L('Where does it go?', '¿Dónde va?') + '</strong><span>' + L('Ten books — pick the right section of the shelf.', 'Diez libros: elige la sección correcta de la estantería.') + (best ? ' · ' + L('Best', 'Mejor') + ': ' + best + '/10' : '') + '</span></div>' +
      '<button type="button" class="bx-primary-btn" id="bx-sort-start">' + L('Play', 'Jugar') + '</button></div>';
    grid.querySelectorAll('.bx-shelf-group').forEach(b => { b.onclick = () => { sfx('click'); _openBookGroup(+b.dataset.idx); }; });
    document.getElementById('bx-sort-start').onclick = _startSort;
  }

  // Put-the-shelf-in-order drill: tap the books in canonical order and
  // each one slides onto the empty shelf. Stars: 0 mistakes = 3, one = 2.
  function _openBookGroup(idx) {
    state.activeGroupIdx = idx;
    const g = BOOK_GROUPS[idx];
    if (!g) return;
    const tier = _tier();
    const maxLives = tier === 'beginner' ? 5 : 3;
    let order = 0, lives = maxLives, mistakes = 0;
    const total = g.books.length;
    const shuffled = shuffle(g.books);
    const wrap = document.getElementById('bx-book-drill');

    function render() {
      wrap.innerHTML =
        '<div class="bx-topbar"><button type="button" class="bx-back-btn" aria-label="' + L('Back to the bookshelf', 'Volver a la estantería') + '" onclick="BibleExplorer.backToBookList()">←</button><span class="bx-crumb">' + L('Bookshelf', 'Estantería') + '</span></div>' +
        '<div class="bx-drill-header">' +
          '<h2>' + esc(_l(g.label)) + '</h2>' +
          '<div class="bx-drill-meta">' +
            '<span class="bx-drill-progress">' + order + ' / ' + total + '</span>' +
            '<span class="bx-drill-lives" aria-label="' + lives + ' ' + L('lives', 'vidas') + '">' + '❤️'.repeat(lives) + '🤍'.repeat(maxLives - lives) + '</span>' +
          '</div>' +
          '<p class="bx-drill-instr">' + (state.lang === 'es' ? 'Toca los libros en orden canónico.' : 'Tap the books in canonical order.') + '</p>' +
        '</div>' +
        '<div class="bx-drill-shelf"><div class="bx-spines">' + g.books.slice(0, order).map((b, i) => _spine(b, g, i, i === order - 1 ? ' is-new' : '')).join('') +
          (order < total ? '<span class="bx-gap-slot" aria-hidden="true">?</span>' : '') + '</div></div>' +
        '<div class="bx-drill-options">' +
          shuffled.map(name => {
            const placed = g.books.indexOf(name) < order;
            return placed ? '' : '<button type="button" class="bx-drill-opt" data-book="' + esc(name) + '" style="--c1:' + SHELF_COLORS[g.id][0] + '">' + esc(bookName(name)) + '</button>';
          }).join('') +
        '</div>';

      wrap.querySelectorAll('.bx-drill-opt').forEach(btn => {
        btn.onclick = () => {
          const book = btn.dataset.book;
          if (book === g.books[order]) {
            order++;
            sfx('correct');
            if (order === total) return _finishBookDrill();
            render();
          } else {
            lives--; mistakes++;
            sfx('wrong');
            btn.classList.add('bx-shake');
            if (tier !== 'expert') {
              const right = wrap.querySelector('.bx-drill-opt[data-book="' + CSS.escape(g.books[order]) + '"]');
              if (right && tier !== 'advanced') { right.classList.add('bx-glow'); }
            }
            setTimeout(() => btn.classList.remove('bx-shake'), 400);
            if (lives <= 0) return setTimeout(_failBookDrill, 450);
            const lv = wrap.querySelector('.bx-drill-lives');
            if (lv) lv.textContent = '❤️'.repeat(lives) + '🤍'.repeat(maxLives - lives);
          }
        };
      });
    }

    function _finishBookDrill() {
      const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
      const prog = _loadProgress();
      prog.books = prog.books || {};
      const prev = prog.books[g.id] || { stars: 0 };
      prog.books[g.id] = Object.assign({}, prev, { stars: Math.max(prev.stars || 0, stars) });
      _saveProgress(prog);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Bible Explorer', '📚',
          (state.lang === 'es' ? 'Completó libros de ' : 'Completed books of ') + _l(g.label) + ' ⭐'.repeat(stars));
      }
      sfx(stars === 3 ? 'cheer' : 'star');
      wrap.innerHTML =
        '<div class="bx-topbar"><button type="button" class="bx-back-btn" aria-label="' + L('Back to the bookshelf', 'Volver a la estantería') + '" onclick="BibleExplorer.backToBookList()">←</button></div>' +
        '<div class="bx-drill-shelf"><div class="bx-spines">' + g.books.map((b, i) => _spine(b, g, i)).join('') + '</div></div>' +
        '<div class="bx-drill-win">' +
          '<div class="bx-quiz-stars">' + starRow(stars) + '</div>' +
          '<p>' + (state.lang === 'es' ? '¡Excelente!' : 'Well done!') + ' ' + _l(g.label) + ' ' + L('is back in order.', 'está en orden.') + '</p>' +
          '<button type="button" class="bx-primary-btn" onclick="BibleExplorer.backToBookList()">' +
            (state.lang === 'es' ? '← Volver' : '← Back') +
          '</button>' +
        '</div>';
    }

    function _failBookDrill() {
      wrap.innerHTML =
        '<div class="bx-drill-fail">' +
          '<p>' + (state.lang === 'es' ? 'Inténtalo otra vez.' : 'Try again!') + '</p>' +
          '<p class="bx-drill-instr">' + L('The order is: ', 'El orden es: ') + g.books.map(bookName).map(esc).join(' · ') + '</p>' +
          '<button type="button" class="bx-primary-btn" onclick="BibleExplorer._retryBookDrill(' + idx + ')">' +
            (state.lang === 'es' ? '↺ Reintentar' : '↺ Retry') +
          '</button> ' +
          '<button type="button" class="bx-secondary-btn" onclick="BibleExplorer.backToBookList()">' +
            (state.lang === 'es' ? '← Volver' : '← Back') +
          '</button>' +
        '</div>';
    }

    render();
    _showScreen('bx-screen-book-drill');
  }

  // "Where does it go?": name a book, pick its section.
  function _startSort() {
    const all = [];
    BOOK_GROUPS.forEach(g => g.books.forEach(b => all.push({ b, g })));
    const qs = shuffle(all).slice(0, 10);
    const nOpts = _tier() === 'beginner' ? 2 : _tier() === 'intermediate' ? 3 : 4;
    let i = 0, score = 0;
    const wrap = document.getElementById('bx-book-drill');
    _showScreen('bx-screen-book-drill');
    const draw = () => {
      if (i >= qs.length) {
        const prog = _loadProgress();
        prog.sortBest = Math.max(prog.sortBest || 0, score);
        _saveProgress(prog);
        sfx(score >= 8 ? 'cheer' : 'star');
        wrap.innerHTML = '<div class="bx-drill-win"><div class="bx-quiz-stars">' + starRow(score >= 9 ? 3 : score >= 7 ? 2 : score >= 4 ? 1 : 0) + '</div><p>' + score + ' / 10</p>' +
          '<button type="button" class="bx-secondary-btn" id="bx-sort-again">' + L('↺ Again', '↺ Otra vez') + '</button> <button type="button" class="bx-primary-btn" onclick="BibleExplorer.backToBookList()">' + L('← Bookshelf', '← Estantería') + '</button></div>';
        document.getElementById('bx-sort-again').onclick = _startSort;
        return;
      }
      const q = qs[i];
      const opts = shuffle([q.g].concat(shuffle(BOOK_GROUPS.filter(g => g !== q.g)).slice(0, nOpts - 1)));
      wrap.innerHTML = '<div class="bx-topbar"><button type="button" class="bx-back-btn" aria-label="' + L('Back to the bookshelf', 'Volver a la estantería') + '" onclick="BibleExplorer.backToBookList()">←</button><span class="bx-crumb">' + (i + 1) + ' / 10</span></div>' +
        '<div class="bx-sort-q"><div class="bx-drill-shelf bx-one">' + _spine(q.b, q.g, 0, ' is-new is-mystery') + '</div><h2 class="bx-quiz-q">' + L('Where does ', '¿Dónde va ') + '<em>' + esc(bookName(q.b)) + '</em>' + L(' go?', '?') + '</h2></div>' +
        '<div class="bx-quiz-options">' + opts.map(g => '<button type="button" class="bx-quiz-opt" data-g="' + g.id + '">' + esc(_l(g.label)) + ' <small>(' + (g.testament === 'OT' ? L('OT', 'A.T.') : L('NT', 'N.T.')) + ')</small></button>').join('') + '</div><div class="bx-quiz-fb" aria-live="polite"></div>';
      wrap.querySelectorAll('.bx-quiz-opt').forEach(b => b.onclick = () => {
        if (wrap.dataset.locked === '1') return;
        wrap.dataset.locked = '1';
        const ok = b.dataset.g === q.g.id;
        if (ok) score++;
        b.classList.add(ok ? 'bx-correct' : 'bx-wrong');
        wrap.querySelectorAll('.bx-quiz-opt').forEach(x => { x.disabled = true; if (x.dataset.g === q.g.id) x.classList.add('bx-correct'); });
        sfx(ok ? 'correct' : 'wrong');
        setTimeout(() => { wrap.dataset.locked = ''; i++; draw(); }, ok ? 700 : 1400);
      });
    };
    draw();
  }

  function backToBookList() { _renderBookGroups(); _showScreen('bx-screen-books'); }
  function _retryBookDrill(idx) { _openBookGroup(idx); }

  // ── Language toggle ──
  function _applyLangLabel() {
    const lbl = document.getElementById('bx-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';
    document.documentElement.lang = state.lang;
  }
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const prog = _loadProgress();
    prog.lang = state.lang;
    _saveProgress(prog);
    _applyLangLabel();
    // Re-render current mode
    if (state.mode === 'stories') _renderStoryList();
    else if (state.mode === 'verses') _renderVerseList();
    else if (state.mode === 'books') _renderBookGroups();
    _renderHome();
  }

  // ── Init ──
  function init() {
    const saved = _loadProgress().lang;
    if (saved === 'es' || saved === 'en') state.lang = saved;
    _applyLangLabel();
    document.getElementById('bx-tile-stories').onclick = openStories;
    document.getElementById('bx-tile-verses').onclick = openVerses;
    document.getElementById('bx-tile-books').onclick = openBooks;
    document.getElementById('bx-lang-toggle').onclick = toggleLanguage;
    const rb = document.getElementById('bx-review-banner');
    if (rb) rb.onclick = () => { openVerses(); startReview(); };
    document.querySelectorAll('.bx-home-btn').forEach(b => { b.onclick = _renderHome; });
    _renderHome();
  }

  return {
    init,
    openStories, openVerses, openBooks,
    backToStoryList, backToVerseList, backToBookList,
    startStoryQuiz, startReview,
    toggleLanguage,
    _retryBookDrill
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof BibleExplorer !== 'undefined') BibleExplorer.init();
});
