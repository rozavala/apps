/* ================================================================
   FE EXPLORADOR — DATA & LOGIC
   Factual, historical Catholic faith module.
   ================================================================ */

const FeManager = (() => {
  const STORAGE_KEY = 'zs_fe_';

  const PRAYERS = [
    {
      id: 'padrenuestro',
      title: 'Padre Nuestro',
      lines: [
        'Padre nuestro, que estás en el cielo,',
        'santificado sea tu Nombre;',
        'venga a nosotros tu reino;',
        'hágase tu voluntad',
        'en la tierra como en el cielo.',
        'Danos hoy nuestro pan de cada día;',
        'perdona nuestras ofensas,',
        'como también nosotros perdonamos',
        'a los que nos ofenden;',
        'no nos dejes caer en la tentación,',
        'y líbranos del mal. Amén.'
      ]
    },
    {
      id: 'avemaria',
      title: 'Ave María',
      lines: [
        'Dios te salve, María, llena eres de gracia,',
        'el Señor es contigo;',
        'bendita tú eres entre todas las mujeres,',
        'y bendito es el fruto de tu vientre, Jesús.',
        'Santa María, Madre de Dios,',
        'ruega por nosotros, pecadores,',
        'ahora y en la hora de nuestra muerte. Amén.'
      ]
    },
    {
      id: 'gloria',
      title: 'Gloria',
      lines: [
        'Gloria al Padre,',
        'y al Hijo,',
        'y al Espíritu Santo.',
        'Como era en el principio,',
        'ahora y siempre,',
        'por los siglos de los siglos. Amén.'
      ]
    },
    {
      id: 'angelguarda',
      title: 'Ángel de la Guarda',
      lines: [
        'Ángel de la guarda,',
        'dulce compañía,',
        'no me desampares',
        'ni de noche ni de día.',
        'No me dejes solo,',
        'que me perdería.',
        'Amén.'
      ]
    },
    {
      id: 'salve',
      title: 'Salve',
      lines: [
        'Dios te salve, Reina y Madre de misericordia,',
        'vida, dulzura y esperanza nuestra;',
        'Dios te salve.',
        'A ti llamamos los desterrados hijos de Eva;',
        'a ti suspiramos, gimiendo y llorando,',
        'en este valle de lágrimas.',
        'Ea, pues, Señora, abogada nuestra,',
        'vuelve a nosotros esos tus ojos misericordiosos;',
        'y después de este destierro,',
        'muéstranos a Jesús, fruto bendito de tu vientre.',
        '¡Oh clemente, oh piadosa, oh dulce Virgen María!',
        'Amén.'
      ]
    },
    {
      id: 'senalcruz',
      title: 'Señal de la Cruz',
      lines: [
        'Por la señal de la Santa Cruz,',
        'de nuestros enemigos',
        'líbranos, Señor, Dios nuestro.',
        'En el nombre del Padre,',
        'y del Hijo,',
        'y del Espíritu Santo. Amén.'
      ]
    },
    {
      id: 'credo',
      title: 'Credo (Símbolo de los Apóstoles)',
      lines: [
        'Creo en Dios, Padre todopoderoso,',
        'Creador del cielo y de la tierra.',
        'Creo en Jesucristo, su único Hijo, nuestro Señor,',
        'que fue concebido por obra y gracia del Espíritu Santo,',
        'nació de Santa María Virgen,',
        'padeció bajo el poder de Poncio Pilato,',
        'fue crucificado, muerto y sepultado,',
        'descendió a los infiernos,',
        'al tercer día resucitó de entre los muertos,',
        'subió a los cielos',
        'y está sentado a la derecha de Dios, Padre todopoderoso.',
        'Desde allí ha de venir a juzgar a vivos y muertos.',
        'Creo en el Espíritu Santo,',
        'la santa Iglesia católica,',
        'la comunión de los santos,',
        'el perdón de los pecados,',
        'la resurrección de la carne',
        'y la vida eterna. Amén.'
      ]
    },
    {
      id: 'contricion',
      title: 'Acto de Contrición',
      lines: [
        'Señor mío Jesucristo,',
        'Dios y hombre verdadero,',
        'Creador, Padre y Redentor mío;',
        'por ser Tú quien eres, Bondad infinita,',
        'y porque te amo sobre todas las cosas,',
        'me pesa de todo corazón haberte ofendido.',
        'También me pesa porque puedes castigarme',
        'con las penas del infierno.',
        'Ayudado de tu divina gracia,',
        'propongo firmemente nunca más pecar,',
        'confesarme y cumplir la penitencia',
        'que me fuere impuesta. Amén.'
      ]
    },
    {
      id: 'bendicionmesa',
      title: 'Bendición de la Mesa',
      lines: [
        'Bendícenos, Señor,',
        'y bendice estos alimentos',
        'que por tu bondad vamos a recibir.',
        'Por Jesucristo, nuestro Señor. Amén.'
      ]
    }
  ];

  const SAINTS = [
    {
      id: 'benito',
      name: 'San Benito de Nursia',
      dates: '480–547',
      country: 'Italia 🇮🇹',
      bio: 'Es el patrón de Europa y fundador del monacato occidental. Su famosa regla se resume en "Ora et labora" (Reza y trabaja).',
      questions: [
        { q: '¿Cuál es el lema de San Benito?', a: ['Reza y trabaja', 'Solo trabaja', 'Estudia y duerme'], correct: 0, explain: 'San Benito de Nursia (480–547) vivió en Italia y resumió su regla monástica en el lema "Ora et labora" (Reza y trabaja).' },
        { q: '¿De qué continente es patrón?', a: ['América', 'Europa', 'Asia'], correct: 1 },
        { q: '¿Dónde nació?', a: ['España', 'Italia', 'Francia'], correct: 1 }
      ]
    },
    {
      id: 'francisco',
      name: 'San Francisco de Asís',
      dates: '1181–1226',
      country: 'Italia 🇮🇹',
      bio: 'Nació en Italia. Es conocido por su amor a la naturaleza y a los animales. Fundó la orden de los franciscanos y escribió el Cántico de las Criaturas.',
      questions: [
        { q: '¿Por qué es más conocido San Francisco?', a: ['Amor a la naturaleza', 'Ser un gran rey', 'Inventar el piano'], correct: 0, explain: 'San Francisco de Asís (1181–1226) nació en Italia, fundó la orden franciscana y es conocido por su amor a la naturaleza.' },
        { q: '¿En qué país nació?', a: ['Chile', 'Italia', 'España'], correct: 1 },
        { q: '¿Qué orden religiosa fundó?', a: ['Los Jesuitas', 'Los Dominicos', 'Los Franciscanos'], correct: 2 }
      ]
    },
    {
      id: 'teresa_andes',
      name: 'Santa Teresa de los Andes',
      dates: '1900–1920',
      country: 'Chile 🇨🇱',
      bio: 'Es la primera santa de Chile. Nació en Santiago y vivió en el monasterio de Los Andes. Es conocida por su alegría y su entrega a Dios desde joven.',
      questions: [
        { q: '¿Dónde nació Santa Teresa de los Andes?', a: ['Roma', 'Santiago', 'Concepción'], correct: 1, explain: 'Santa Teresa de los Andes (1900–1920) nació en Santiago y fue la primera santa de Chile.' },
        { q: 'Fue la primera santa de...', a: ['Argentina', 'España', 'Chile'], correct: 2 },
        { q: '¿En qué ciudad vivió en un monasterio?', a: ['Roma', 'Los Andes', 'Valparaíso'], correct: 1 }
      ]
    },
    // PRUNED [2026-04-14]: Removed 'jorge' to stay within MAX 15 limit
    {
      id: 'alberto_hurtado',
      name: 'San Alberto Hurtado',
      dates: '1901–1952',
      country: 'Chile 🇨🇱',
      bio: 'Sacerdote jesuita chileno que fundó el Hogar de Cristo para ayudar a las personas más pobres. Siempre decía: "Contento, Señor, contento".',
      questions: [
        { q: '¿Qué institución fundó el Padre Hurtado?', a: ['Un banco', 'El Hogar de Cristo', 'Una universidad'], correct: 1, explain: 'San Alberto Hurtado (1901–1952) fue un sacerdote jesuita chileno que fundó el Hogar de Cristo para ayudar a los más pobres.' },
        { q: '¿Cuál era su frase más famosa?', a: ['"Hola amigos"', '"Contento, Señor, contento"', '"A estudiar mucho"'], correct: 1 },
        { q: '¿A qué orden pertenecía el Padre Hurtado?', a: ['Franciscanos', 'Jesuitas', 'Dominicos'], correct: 1 }
      ]
    },
    // PRUNED [2026-04-14]: Removed 'tomas_aquino' to stay within MAX 15 limit
    {
      id: 'rosa_lima',
      name: 'Santa Rosa de Lima',
      dates: '1586–1617',
      country: 'Perú 🇵🇪',
      bio: 'Es la primera santa de América. Vivió en Lima y dedicó su vida a ayudar a los enfermos y a los necesitados en su propia casa.',
      questions: [
        { q: 'Fue la primera santa de...', a: ['Europa', 'América', 'Asia'], correct: 1, explain: 'Santa Rosa de Lima (1586–1617) vivió en Lima, Perú, y fue la primera santa de América.' },
        { q: '¿En qué ciudad vivió?', a: ['Santiago', 'Lima', 'Bogotá'], correct: 1 },
        { q: '¿A quiénes dedicó su vida a ayudar?', a: ['A los enfermos y necesitados', 'A los reyes', 'A los comerciantes'], correct: 0 }
      ]
    },
    {
      id: 'martin_porres',
      name: 'San Martín de Porres',
      dates: '1579–1639',
      country: 'Perú 🇵🇪',
      bio: 'Conocido como el "Santo de la Escoba" por su humildad. Era un gran enfermero y se dice que podía hacer que perros, gatos y ratones comieran del mismo plato.',
      questions: [
        { q: '¿Cómo es conocido San Martín?', a: ['El Santo de la Escoba', 'El Gran Guerrero', 'El Rey de los Mares'], correct: 0, explain: 'San Martín de Porres (1579–1639) vivió en Lima, Perú, y es conocido como el "Santo de la Escoba" por su humildad.' },
        { q: '¿Qué animales se dice que alimentó juntos?', a: ['Leones y tigres', 'Perros, gatos y ratones', 'Elefantes y jirafas'], correct: 1 },
        { q: '¿Por qué virtud es muy conocido?', a: ['Su gran riqueza', 'Su humildad', 'Sus viajes'], correct: 1 }
      ]
    },
    {
      id: 'ignacio_loyola',
      name: 'San Ignacio de Loyola',
      dates: '1491–1556',
      country: 'España 🇪🇸',
      bio: 'Fue un soldado que, tras ser herido, decidió dedicar su vida a Dios. Fundó la Compañía de Jesús (los Jesuitas) para enseñar y ayudar en todo el mundo.',
      questions: [
        { q: '¿Qué orden religiosa fundó?', a: ['Los Franciscanos', 'Los Jesuitas', 'Los Dominicos'], correct: 1, explain: 'San Ignacio de Loyola (1491–1556) era español y fundó la Compañía de Jesús (los Jesuitas).' },
        { q: '¿Qué era antes de dedicar su vida a Dios?', a: ['Marinero', 'Soldado', 'Panadero'], correct: 1 },
        { q: '¿De qué país era San Ignacio?', a: ['España', 'Francia', 'Italia'], correct: 0 }
      ]
    },
    {
      id: 'teresa_avila',
      name: 'Santa Teresa de Ávila',
      dates: '1515–1582',
      country: 'España 🇪🇸',
      bio: 'Una gran escritora y maestra que fundó muchos conventos. Es famosa por sus libros y por su valentía para reformar su orden religiosa.',
      questions: [
        { q: '¿Por qué es famosa Santa Teresa de Ávila?', a: ['Por ser una gran escritora', 'Por descubrir un país', 'Por inventar la imprenta'], correct: 0, explain: 'Santa Teresa de Ávila (1515–1582) fue una escritora española que fundó muchos conventos y reformó su orden religiosa.' },
        { q: '¿Qué fundó en España?', a: ['Muchos hospitales', 'Muchos conventos', 'Muchas escuelas'], correct: 1 },
        { q: '¿Además de fundar conventos, por qué es famosa?', a: ['Por sus viajes en barco', 'Por ser una gran escritora', 'Por inventar la imprenta'], correct: 1 }
      ]
    },
    {
      id: 'juan_bosco',
      name: 'San Juan Bosco',
      dates: '1815–1888',
      country: 'Italia 🇮🇹',
      bio: 'Dedicó su vida a ayudar a los niños y jóvenes, enseñándoles oficios y divirtiéndolos con juegos y trucos de magia para hablarles de Dios.',
      questions: [
        { q: '¿A quiénes dedicó su vida San Juan Bosco?', a: ['A los ancianos', 'A los niños y jóvenes', 'A los soldados'], correct: 1, explain: 'San Juan Bosco (1815–1888) fue un sacerdote italiano que dedicó su vida a educar a niños y jóvenes.' },
        { q: '¿Qué usaba para divertir a los niños?', a: ['Magia y juegos', 'Barcos de vela', 'Espadas de madera'], correct: 0 },
        { q: '¿A quiénes ayudó principalmente?', a: ['A los soldados', 'A los niños y jóvenes', 'A los ancianos'], correct: 1 }
      ]
    },
    {
      id: 'jose',
      name: 'San José',
      dates: 'Siglo I',
      country: 'Nazaret 🪚',
      bio: 'Fue el esposo de María y padre adoptivo de Jesús. Era carpintero y es conocido por su paciencia, silencio y trabajo duro.',
      questions: [
        { q: '¿Cuál era el oficio de San José?', a: ['Herrero', 'Carpintero', 'Pastor'], correct: 1, explain: 'San José, que vivió en Nazaret en el siglo I, era carpintero y fue el esposo de María y padre adoptivo de Jesús.' },
        { q: 'San José es el padre adoptivo de...', a: ['Juan', 'Pedro', 'Jesús'], correct: 2 },
        { q: '¿Por qué virtud es conocido San José?', a: ['Ser guerrero', 'Su paciencia y silencio', 'Sus viajes'], correct: 1 }
      ]
    },
    {
      id: 'juan_dios',
      name: 'San Juan de Dios',
      dates: '1495–1550',
      country: 'España 🇪🇸',
      bio: 'Dedicó su vida a cuidar enfermos fundando hospitales. Es un ejemplo de caridad y entrega.',
      questions: [
        { q: '¿A qué se dedicó principalmente?', a: ['A cuidar enfermos', 'A la guerra', 'Al comercio'], correct: 0, explain: 'San Juan de Dios (1495–1550) fue un español que dedicó su vida a cuidar enfermos y fundó hospitales.' },
        { q: '¿Qué tipo de institución fundó?', a: ['Escuelas', 'Hospitales', 'Bancos'], correct: 1 },
        { q: '¿De qué país era San Juan de Dios?', a: ['Francia', 'España', 'Italia'], correct: 1 }
      ]
    },
    {
      id: 'pablo',
      name: 'San Pablo',
      dates: 'Siglo I',
      country: 'Tarso 📜',
      bio: 'Escribió muchas cartas que están en la Biblia. Viajó por todo el mundo conocido para enseñar sobre Jesús.',
      questions: [
        { q: '¿Qué escribió San Pablo en la Biblia?', a: ['Muchas cartas', 'Poemas', 'Canciones'], correct: 0, explain: 'San Pablo, natural de Tarso y del siglo I, escribió muchas cartas de la Biblia y viajó para enseñar sobre Jesús.' },
        { q: '¿Qué hizo para enseñar sobre Jesús?', a: ['Viajó por el mundo', 'Construyó barcos', 'Pintó cuadros'], correct: 0 },
        { q: '¿En qué siglo vivió?', a: ['Siglo X', 'Siglo I', 'Siglo V'], correct: 1 }
      ]
    },
    {
      id: 'pedro',
      name: 'San Pedro',
      dates: 'Siglo I',
      country: 'Judea 🗝️',
      bio: 'Fue un pescador y uno de los apóstoles más cercanos a Jesús. Es considerado el primer Papa de la Iglesia Católica.',
      questions: [
        { q: '¿Cuál era la profesión original de San Pedro?', a: ['Carpintero', 'Pescador', 'Soldado'], correct: 1, explain: 'San Pedro, de Judea y del siglo I, era pescador y es considerado el primer Papa de la Iglesia Católica.' },
        { q: '¿A quién se le considera el primer Papa?', a: ['San Pablo', 'San Pedro', 'San Juan'], correct: 1 },
        { q: '¿En qué siglo vivió?', a: ['Siglo V', 'Siglo III', 'Siglo I'], correct: 2 }
      ]
    },
    {
      id: 'juan_cruz',
      name: 'San Juan de la Cruz',
      dates: '1542–1591',
      country: 'España 🇪🇸',
      bio: 'Famoso místico y poeta que ayudó a Santa Teresa de Ávila a reformar la Orden del Carmelo.',
      questions: [
        { q: '¿A quién ayudó a reformar su orden?', a: ['Santa Teresa de Ávila', 'Santa Rosa de Lima', 'San Francisco de Asís'], correct: 0, explain: 'San Juan de la Cruz (1542–1591) fue un místico y poeta español que ayudó a Santa Teresa de Ávila a reformar la Orden del Carmelo.' },
        { q: '¿Por qué es famoso?', a: ['Por ser místico y poeta', 'Por fundar Roma', 'Por inventar la imprenta'], correct: 0 },
        { q: '¿De qué país era?', a: ['España', 'Francia', 'Italia'], correct: 0 }
      ]
    },
    {
      id: 'tomas_aquino',
      name: 'Santo Tomás de Aquino',
      dates: '1225–1274',
      country: 'Italia 🇮🇹',
      bio: 'Fue un fraile dominico, filósofo y teólogo. Es autor de la "Suma Teológica" y uno de los grandes maestros de la Iglesia. Nació en Italia.',
      questions: [
        { q: '¿Cuál es la obra más famosa de Santo Tomás de Aquino?', a: ['La Divina Comedia', 'La Suma Teológica', 'El Quijote'], correct: 1, explain: 'Santo Tomás de Aquino (1225–1274) fue un fraile dominico italiano, autor de la "Suma Teológica".' },
        { q: '¿A qué orden religiosa pertenecía?', a: ['Dominicos', 'Franciscanos', 'Jesuitas'], correct: 0 },
        { q: '¿En qué siglo vivió Santo Tomás de Aquino?', a: ['Siglo XIII', 'Siglo XVI', 'Siglo X'], correct: 0 }
      ]
    },
    {
      id: 'agustin',
      name: 'San Agustín de Hipona',
      dates: '354–430',
      country: 'Tagaste, Numidia 🌍',
      bio: 'Obispo de Hipona, en el norte de África, y uno de los Padres de la Iglesia. Escribió las "Confesiones" y "La Ciudad de Dios".',
      questions: [
        { q: '¿De qué ciudad fue obispo San Agustín?', a: ['Roma', 'Hipona', 'Milán'], correct: 1, explain: 'San Agustín de Hipona (354–430) fue obispo de Hipona, en el norte de África, y escribió las "Confesiones".' },
        { q: '¿Cuál de estas obras escribió San Agustín?', a: ['Las Confesiones', 'La Odisea', 'La Eneida'], correct: 0 },
        { q: '¿En qué siglo vivió San Agustín?', a: ['Siglo IV y V', 'Siglo XII', 'Siglo I'], correct: 0 }
      ]
    },
    {
      id: 'catalina_siena',
      name: 'Santa Catalina de Siena',
      dates: '1347–1380',
      country: 'Italia 🇮🇹',
      bio: 'Religiosa dominica italiana, Doctora de la Iglesia y copatrona de Europa. Influyó para que el Papa volviera de Aviñón a Roma.',
      questions: [
        { q: '¿De qué ciudad italiana era Santa Catalina?', a: ['Siena', 'Florencia', 'Venecia'], correct: 0, explain: 'Santa Catalina de Siena (1347–1380) fue una religiosa dominica italiana, Doctora de la Iglesia y copatrona de Europa.' },
        { q: '¿A qué ciudad ayudó a que regresara el Papa?', a: ['Roma', 'París', 'Madrid'], correct: 0 },
        { q: '¿En qué siglo vivió Santa Catalina de Siena?', a: ['Siglo XIV', 'Siglo XVIII', 'Siglo IX'], correct: 0 }
      ]
    },
    {
      id: 'jorge',
      name: 'San Jorge',
      dates: 'Siglo IV',
      country: 'Capadocia 🐉',
      bio: 'Soldado romano y mártir cristiano. La tradición lo representa venciendo a un dragón. Es patrono de muchos países y ciudades.',
      questions: [
        { q: '¿Qué profesión tenía San Jorge?', a: ['Soldado romano', 'Pescador', 'Comerciante'], correct: 0, explain: 'San Jorge, de Capadocia y del siglo IV, fue un soldado romano y mártir cristiano.' },
        { q: '¿Con qué animal se le representa en la tradición?', a: ['Un dragón', 'Un león', 'Un caballo de mar'], correct: 0 },
        { q: '¿En qué siglo vivió San Jorge?', a: ['Siglo IV', 'Siglo XII', 'Siglo XVII'], correct: 0 }
      ]
    },
    {
      id: 'ambrosio',
      name: 'San Ambrosio de Milán',
      dates: '340–397',
      country: 'Milán 🇮🇹',
      bio: 'Obispo de Milán y uno de los Padres de la Iglesia. Fue un gran predicador e himnógrafo, y bautizó a San Agustín.',
      questions: [
        { q: '¿De qué ciudad fue obispo San Ambrosio?', a: ['Milán', 'Roma', 'Nápoles'], correct: 0, explain: 'San Ambrosio (340–397) fue obispo de Milán, Padre de la Iglesia, y bautizó a San Agustín.' },
        { q: '¿A qué famoso santo bautizó San Ambrosio?', a: ['San Agustín', 'San Benito', 'San Francisco'], correct: 0 },
        { q: '¿En qué siglo vivió San Ambrosio?', a: ['Siglo IV', 'Siglo X', 'Siglo XV'], correct: 0 }
      ]
    },
    {
      id: 'monica',
      name: 'Santa Mónica',
      dates: '331–387',
      country: 'Tagaste, Numidia 🌍',
      bio: 'Madre de San Agustín. Es recordada por su constancia y sus oraciones durante muchos años por la conversión de su hijo.',
      questions: [
        { q: '¿De quién fue madre Santa Mónica?', a: ['De San Agustín', 'De San Benito', 'De San Jorge'], correct: 0, explain: 'Santa Mónica (331–387) fue la madre de San Agustín y es recordada por sus oraciones por la conversión de su hijo.' },
        { q: '¿Por qué es especialmente recordada Santa Mónica?', a: ['Por sus oraciones por su hijo', 'Por fundar conventos', 'Por sus viajes'], correct: 0 },
        { q: '¿En qué siglo vivió Santa Mónica?', a: ['Siglo IV', 'Siglo XI', 'Siglo XVI'], correct: 0 }
      ]
    },
    // ── Added 2026-11: namesake saints of the family + kid favourites.
    // Always append at the END: progress is keyed by id, but the strip
    // order and the "next saint" button follow this array.
    // New fields (also filled in for the older saints below):
    //   feast  { m, d }  day the Church celebrates the saint (Chile)
    //   lesson           "Lo que podemos aprender…" one-liner
    //   bio paragraphs are separated by a blank line ("\n\n").
    {
      id: 'emilia',
      name: 'Santa Emilia',
      dates: 'Siglo IV',
      country: 'Capadocia 🏛️',
      feast: { m: 5, d: 30 },
      bio: 'Santa Emilia (también llamada Emelia) vivió en el siglo IV en Capadocia y el Ponto, tierras que hoy son parte de Turquía. Estaba casada con San Basilio el Viejo y tuvieron muchos hijos.\n\n' +
        'Fue la mamá de una familia de santos: entre sus hijos están San Basilio Magno, San Gregorio de Nisa, Santa Macrina y San Pedro de Sebaste. Cuando quedó viuda, vivió una vida de oración junto a su hija Macrina.',
      lesson: 'Lo que podemos aprender de ella: la familia es el primer lugar donde aprendemos a querer a Dios.',
      questions: [
        { q: '¿Por qué es recordada Santa Emilia?', a: ['Fue la mamá de una familia de santos', 'Fue una reina de Francia', 'Fue una exploradora del mar'], correct: 0, explain: 'Santa Emilia (siglo IV) vivió en Capadocia y fue la mamá de San Basilio Magno, San Gregorio de Nisa, Santa Macrina y San Pedro de Sebaste.' },
        { q: '¿Cuál de estos santos fue hijo de Santa Emilia?', a: ['San Basilio Magno', 'San Francisco de Asís', 'San Juan Bosco'], correct: 0 },
        { q: '¿En qué siglo vivió Santa Emilia?', a: ['Siglo IV', 'Siglo XV', 'Siglo XX'], correct: 0 }
      ]
    },
    {
      id: 'rodrigo',
      name: 'San Rodrigo de Córdoba',
      dates: 'Siglo IX (†857)',
      country: 'España 🇪🇸',
      feast: { m: 3, d: 13 },
      bio: 'San Rodrigo fue un sacerdote que vivió en Córdoba, en el sur de España, en el siglo IX. Fue acusado injustamente y lo llevaron a la cárcel. Allí conoció a otro cristiano, Salomón, y los dos se acompañaron como amigos.\n\n' +
        'Ninguno de los dos quiso dejar su fe en Jesús, y murieron mártires el 13 de marzo del año 857. Su historia la escribió San Eulogio de Córdoba, un sacerdote que vivía en esa ciudad en la misma época.',
      lesson: 'Lo que podemos aprender de él: decir siempre la verdad y ser fiel a Jesús, aunque sea difícil.',
      questions: [
        { q: '¿Qué era San Rodrigo de Córdoba?', a: ['Sacerdote', 'Rey', 'Pescador'], correct: 0, explain: 'San Rodrigo fue un sacerdote de Córdoba (España) que murió mártir el 13 de marzo del año 857, junto a San Salomón.' },
        { q: '¿En qué ciudad de España vivió?', a: ['Córdoba', 'Madrid', 'Barcelona'], correct: 0 },
        { q: '¿Junto a qué amigo es recordado San Rodrigo?', a: ['San Salomón', 'San Jorge', 'San Benito'], correct: 0 }
      ]
    },
    {
      id: 'isabel',
      name: 'Santa Isabel',
      dates: 'Siglo I',
      country: 'Judea ⛰️',
      feast: { m: 11, d: 5 },
      bio: 'Santa Isabel es la mamá de San Juan Bautista y la esposa de Zacarías, un sacerdote del Templo de Jerusalén. Su historia está en la Biblia, en el capítulo 1 del Evangelio de San Lucas. Isabel y Zacarías ya eran mayores y no tenían hijos, y Dios les regaló a Juan.\n\n' +
        'Isabel era pariente de la Virgen María; por eso se dice que era su prima. Cuando María fue a visitarla, Isabel la saludó con palabras que hoy rezamos en el Ave María: «Bendita tú entre las mujeres y bendito el fruto de tu vientre». Esa visita se llama la Visitación.',
      lesson: 'Lo que podemos aprender de ella: alegrarnos de corazón con las cosas buenas que les pasan a los demás.',
      questions: [
        { q: '¿De quién fue mamá Santa Isabel?', a: ['De San Juan Bautista', 'De San Pedro', 'De San Pablo'], correct: 0, explain: 'Santa Isabel, esposa de Zacarías, fue la mamá de San Juan Bautista. Su historia está en el Evangelio de San Lucas, capítulo 1.' },
        { q: '¿Quién fue a visitar a Santa Isabel?', a: ['La Virgen María', 'San Jorge', 'Santa Clara'], correct: 0 },
        { q: '¿Qué palabras de Isabel rezamos en el Ave María?', a: ['«Bendita tú entre las mujeres»', '«Padre nuestro que estás en el cielo»', '«Gloria al Padre»'], correct: 0 }
      ]
    },
    {
      id: 'santiago',
      name: 'Santiago Apóstol',
      dates: 'Siglo I',
      country: 'Galilea 🐚',
      feast: { m: 7, d: 25 },
      bio: 'Santiago fue uno de los doce apóstoles de Jesús. Era pescador en el mar de Galilea, como su papá Zebedeo, y hermano de San Juan Evangelista. Jesús los llamó mientras arreglaban sus redes.\n\n' +
        'Fue el primer apóstol en dar su vida por Jesús, en Jerusalén, como cuentan los Hechos de los Apóstoles. Según la tradición, sus restos están en Santiago de Compostela, en España, adonde llegan peregrinos caminando. La capital de Chile lleva su nombre: Pedro de Valdivia la fundó en 1541 como Santiago del Nuevo Extremo.',
      lesson: 'Lo que podemos aprender de él: seguir a Jesús con entusiasmo, paso a paso, como un buen peregrino.',
      questions: [
        { q: '¿Qué oficio tenía Santiago antes de seguir a Jesús?', a: ['Pescador', 'Carpintero', 'Soldado'], correct: 0, explain: 'Santiago Apóstol era pescador en el mar de Galilea y hermano de San Juan. La capital de Chile lleva su nombre.' },
        { q: '¿Qué ciudad de Chile lleva el nombre de este apóstol?', a: ['Santiago', 'Valparaíso', 'Temuco'], correct: 0 },
        { q: '¿Quién era el hermano de Santiago?', a: ['San Juan', 'San Pablo', 'San José'], correct: 0 }
      ]
    },
    {
      id: 'francisco_javier',
      name: 'San Francisco Javier',
      dates: '1506–1552',
      country: 'España 🇪🇸',
      feast: { m: 12, d: 3 },
      bio: 'Nació en 1506 en el castillo de Javier, en Navarra (España). Mientras estudiaba en la Universidad de París conoció a San Ignacio de Loyola y fue uno de los primeros jesuitas.\n\n' +
        'Viajó en barco miles de kilómetros para enseñar sobre Jesús en la India, en Japón y en otras tierras de Asia. Murió en 1552 en la isla de Shangchuan, frente a la costa de China. Es patrono de las misiones.',
      lesson: 'Lo que podemos aprender de él: compartir con alegría lo que sabemos de Jesús, aunque cueste esfuerzo.',
      questions: [
        { q: '¿A qué santo conoció San Francisco Javier en París?', a: ['San Ignacio de Loyola', 'San Benito', 'San Jorge'], correct: 0, explain: 'San Francisco Javier (1506–1552) conoció a San Ignacio de Loyola en París y fue uno de los primeros jesuitas.' },
        { q: '¿A qué continente viajó para enseñar sobre Jesús?', a: ['Asia', 'Oceanía', 'Antártica'], correct: 0 },
        { q: '¿De qué es patrono San Francisco Javier?', a: ['De las misiones', 'De los músicos', 'De los panaderos'], correct: 0 }
      ]
    },
    {
      id: 'clara',
      name: 'Santa Clara de Asís',
      dates: '1194–1253',
      country: 'Italia 🇮🇹',
      feast: { m: 8, d: 11 },
      bio: 'Nació en Asís, Italia, en 1194. Cuando era joven escuchó predicar a San Francisco de Asís y decidió seguir a Jesús con una vida sencilla y pobre.\n\n' +
        'Fundó la orden de las Hermanas Pobres, que hoy conocemos como las Clarisas, y vivió en el convento de San Damián. Según la tradición, protegió su convento de unos soldados mostrando la Eucaristía; por eso se la pinta con una custodia en las manos.',
      lesson: 'Lo que podemos aprender de ella: ser felices con las cosas sencillas y confiar en Dios.',
      questions: [
        { q: '¿Qué santo inspiró a Santa Clara?', a: ['San Francisco de Asís', 'San Agustín', 'San Pedro'], correct: 0, explain: 'Santa Clara de Asís (1194–1253) siguió el ejemplo de San Francisco de Asís y fundó la orden de las Clarisas.' },
        { q: '¿Cómo se llaman hoy las religiosas de la orden que fundó?', a: ['Clarisas', 'Jesuitas', 'Benedictinas'], correct: 0 },
        { q: '¿Qué sostiene Santa Clara en sus imágenes?', a: ['Una custodia', 'Una espada', 'Un barco'], correct: 0 }
      ]
    },
    {
      id: 'laura_vicuna',
      name: 'Beata Laura Vicuña',
      dates: '1891–1904',
      country: 'Chile 🇨🇱',
      feast: { m: 1, d: 22 },
      bio: 'Nació en Santiago de Chile el 5 de abril de 1891. Siendo pequeña se fue a vivir con su mamá y su hermana a Argentina, al otro lado de la cordillera de los Andes, y estudió en el colegio de las Hijas de María Auxiliadora en Junín de los Andes.\n\n' +
        'Era una alumna alegre y buena compañera, y rezaba mucho por su mamá. Murió el 22 de enero de 1904, con solo 12 años. San Juan Pablo II la declaró beata en 1988; «beata» es el paso anterior a ser declarada santa.',
      lesson: 'Lo que podemos aprender de ella: rezar por nuestra familia y quererla mucho.',
      questions: [
        { q: '¿En qué ciudad nació Laura Vicuña?', a: ['Santiago de Chile', 'Lima', 'Madrid'], correct: 0, explain: 'La Beata Laura Vicuña nació en Santiago de Chile en 1891 y estudió en Junín de los Andes, Argentina.' },
        { q: '¿Qué cordillera cruzó para ir a vivir a Argentina?', a: ['Los Andes', 'Los Alpes', 'El Himalaya'], correct: 0 },
        { q: '¿Qué Papa la declaró beata en 1988?', a: ['San Juan Pablo II', 'San Pedro', 'San Benito'], correct: 0 }
      ]
    },
    {
      id: 'nicolas',
      name: 'San Nicolás de Bari',
      dates: 'Siglo IV',
      country: 'Licia, actual Turquía 🎁',
      feast: { m: 12, d: 6 },
      bio: 'San Nicolás fue obispo de Mira, una ciudad de Licia, en lo que hoy es Turquía, en el siglo IV. Es conocido por lo mucho que ayudaba a los pobres, y es patrono de los niños.\n\n' +
        'Según la tradición, ayudó en secreto a un papá muy pobre dejándole bolsas de oro por la noche. En 1087 sus restos fueron llevados a Bari, en Italia; por eso lo llamamos San Nicolás de Bari. De su nombre y su fama de dar regalos viene Santa Claus, que en Chile llamamos el Viejito Pascuero.',
      lesson: 'Lo que podemos aprender de él: ayudar a los demás sin buscar que nos aplaudan.',
      questions: [
        { q: '¿De qué ciudad fue obispo San Nicolás?', a: ['Mira', 'Roma', 'Santiago'], correct: 0, explain: 'San Nicolás (siglo IV) fue obispo de Mira, en Licia (hoy Turquía); en 1087 sus restos fueron llevados a Bari, Italia.' },
        { q: '¿A qué ciudad de Italia llevaron sus restos?', a: ['Bari', 'Venecia', 'Milán'], correct: 0 },
        { q: '¿Qué personaje de Navidad viene de San Nicolás?', a: ['El Viejito Pascuero', 'Los Reyes Magos', 'El burrito del pesebre'], correct: 0 }
      ]
    },
    {
      id: 'bernardita',
      name: 'Santa Bernardita Soubirous',
      dates: '1844–1879',
      country: 'Francia 🇫🇷',
      feast: { m: 4, d: 16 },
      bio: 'Nació en Lourdes, Francia, en 1844, en una familia muy pobre. En 1858, cuando tenía 14 años, contó que la Virgen María se le apareció 18 veces en la gruta de Massabielle, mientras ella rezaba el Rosario. La Señora le dijo: «Yo soy la Inmaculada Concepción».\n\n' +
        'Hoy Lourdes es uno de los santuarios más visitados del mundo, y en Chile hay grutas de Lourdes, como la de Punta Arenas. Bernardita se hizo religiosa en Nevers, donde murió en 1879. Fue declarada santa en 1933.',
      lesson: 'Lo que podemos aprender de ella: ser sencillos y humildes, y rezar el Rosario.',
      questions: [
        { q: '¿En qué ciudad de Francia nació Santa Bernardita?', a: ['Lourdes', 'París', 'Lisieux'], correct: 0, explain: 'Santa Bernardita Soubirous (1844–1879) nació en Lourdes, Francia, donde en 1858 contó que la Virgen se le apareció en la gruta de Massabielle.' },
        { q: '¿Quién se le apareció a Bernardita en la gruta?', a: ['La Virgen María', 'San Jorge', 'Santa Clara'], correct: 0 },
        { q: '¿En qué año ocurrieron las apariciones de Lourdes?', a: ['1858', '1492', '1998'], correct: 0 }
      ]
    },
    {
      id: 'juan_pablo',
      name: 'San Juan Pablo II',
      dates: '1920–2005',
      country: 'Polonia 🇵🇱',
      feast: { m: 10, d: 22 },
      bio: 'Se llamaba Karol Wojtyła y nació en Wadowice, Polonia, en 1920. De joven le gustaban el teatro, el deporte y las caminatas por la montaña. Fue Papa desde 1978 hasta 2005 y visitó más de cien países. Una de sus frases más famosas es: «¡No tengan miedo!».\n\n' +
        'En 1987 visitó Chile. Su mediación ayudó a que Chile y Argentina firmaran el Tratado de Paz y Amistad de 1984. Declaró beata a Laura Vicuña (1988) y santa a Teresa de los Andes (1993). Fue declarado santo en 2014.',
      lesson: 'Lo que podemos aprender de él: no tener miedo de seguir a Jesús y ayudar a que haya paz.',
      questions: [
        { q: '¿En qué país nació San Juan Pablo II?', a: ['Polonia', 'Italia', 'Chile'], correct: 0, explain: 'San Juan Pablo II (1920–2005), Karol Wojtyła, nació en Polonia, fue Papa desde 1978 y visitó Chile en 1987.' },
        { q: '¿En qué año visitó Chile?', a: ['1987', '1810', '2020'], correct: 0 },
        { q: '¿Cuál era su nombre antes de ser Papa?', a: ['Karol Wojtyła', 'Juan Bosco', 'Pedro de Valdivia'], correct: 0 }
      ]
    },
    {
      id: 'teresa_lisieux',
      name: 'Santa Teresa de Lisieux',
      dates: '1873–1897',
      country: 'Francia 🇫🇷',
      feast: { m: 10, d: 1 },
      bio: 'Nació en Alençon, Francia, en 1873. A los 15 años entró al convento de las carmelitas de Lisieux con el nombre de Teresa del Niño Jesús; por eso también la llamamos Santa Teresita.\n\n' +
        'Enseñó el «caminito»: hacer con mucho amor las cosas pequeñas de cada día. Escribió la historia de su vida, «Historia de un alma». Murió en 1897, con 24 años. Es Doctora de la Iglesia y patrona de las misiones, junto a San Francisco Javier.',
      lesson: 'Lo que podemos aprender de ella: hacer con amor las cosas pequeñas de cada día.',
      questions: [
        { q: '¿Cómo se llama el camino que enseñó Santa Teresita?', a: ['El caminito', 'La gran carretera', 'El camino del mar'], correct: 0, explain: 'Santa Teresa de Lisieux (1873–1897), carmelita francesa, enseñó el «caminito»: hacer con amor las cosas pequeñas.' },
        { q: '¿En qué convento vivió Santa Teresita?', a: ['En el Carmelo de Lisieux', 'En el convento de San Damián', 'En el monasterio de Montecassino'], correct: 0 },
        { q: '¿Qué flores acompañan a Santa Teresita en sus imágenes?', a: ['Rosas', 'Girasoles', 'Tulipanes'], correct: 0 }
      ]
    }
  ];

  // Feast days (as celebrated in Chile) and a one-line lesson for the
  // saints that were in the app before these fields existed.
  const FEASTS = {
    benito: [7, 11], francisco: [10, 4], teresa_andes: [7, 13], alberto_hurtado: [8, 18],
    rosa_lima: [8, 30], martin_porres: [11, 3], ignacio_loyola: [7, 31], teresa_avila: [10, 15],
    juan_bosco: [1, 31], jose: [3, 19], juan_dios: [3, 8], pablo: [6, 29], pedro: [6, 29],
    juan_cruz: [12, 14], tomas_aquino: [1, 28], agustin: [8, 28], catalina_siena: [4, 29],
    jorge: [4, 23], ambrosio: [12, 7], monica: [8, 27]
  };
  const LESSONS = {
    benito: 'Lo que podemos aprender de él: rezar y trabajar, las dos cosas con cariño.',
    francisco: 'Lo que podemos aprender de él: cuidar a los animales y a la naturaleza, que Dios creó.',
    teresa_andes: 'Lo que podemos aprender de ella: vivir con alegría y contarle todo a Jesús.',
    alberto_hurtado: 'Lo que podemos aprender de él: ayudar a quien lo necesita, ¡contentos!',
    rosa_lima: 'Lo que podemos aprender de ella: ayudar a los enfermos y necesitados.',
    martin_porres: 'Lo que podemos aprender de él: ser humildes y servir con alegría.',
    ignacio_loyola: 'Lo que podemos aprender de él: hacer todo para la mayor gloria de Dios.',
    teresa_avila: 'Lo que podemos aprender de ella: hablar con Dios como con un amigo.',
    juan_bosco: 'Lo que podemos aprender de él: aprender y jugar con alegría.',
    jose: 'Lo que podemos aprender de él: trabajar bien y cuidar a la familia.',
    juan_dios: 'Lo que podemos aprender de él: cuidar a los enfermos con cariño.',
    pablo: 'Lo que podemos aprender de él: contar a todos lo que sabemos de Jesús.',
    pedro: 'Lo que podemos aprender de él: volver a empezar cuando nos equivocamos.',
    juan_cruz: 'Lo que podemos aprender de él: buscar a Dios también en el silencio.',
    tomas_aquino: 'Lo que podemos aprender de él: estudiar con ganas para conocer mejor a Dios.',
    agustin: 'Lo que podemos aprender de él: buscar la verdad con todo el corazón.',
    catalina_siena: 'Lo que podemos aprender de ella: ser valientes para hacer el bien.',
    jorge: 'Lo que podemos aprender de él: ser valientes y fieles.',
    ambrosio: 'Lo que podemos aprender de él: alabar a Dios con canciones y buenas palabras.',
    monica: 'Lo que podemos aprender de ella: rezar con paciencia por las personas que queremos.'
  };
  SAINTS.forEach(s => {
    if (!s.feast && FEASTS[s.id]) s.feast = { m: FEASTS[s.id][0], d: FEASTS[s.id][1] };
    if (!s.lesson && LESSONS[s.id]) s.lesson = LESSONS[s.id];
  });

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  // "13 de marzo"
  function feastLabel(s) { return s && s.feast ? s.feast.d + ' de ' + MONTHS[s.feast.m - 1] : ''; }

  /* The four sets of mysteries of the Holy Rosary, with the traditional
     weekly schedule (post-2002, including the Luminous mysteries).
     `days` uses JS Date.getDay() values: 0=Sun, 1=Mon ... 6=Sat. */
  const ROSARY_SETS = [
    {
      id: 'gozosos',
      name: 'Misterios Gozosos',
      shortName: 'Gozosos',
      emoji: '🌟',
      days: [1, 6],
      daysLabel: 'Lunes y Sábado',
      mysteries: [
        { name: 'La Anunciación', desc: 'El ángel Gabriel anuncia a María que será la Madre de Dios.' },
        { name: 'La Visitación', desc: 'María visita a su prima Isabel, que espera a Juan el Bautista.' },
        { name: 'El Nacimiento de Jesús', desc: 'Jesús nace en el portal de Belén.' },
        { name: 'La Presentación', desc: 'María y José presentan al Niño Jesús en el Templo.' },
        { name: 'El Niño hallado en el Templo', desc: 'Tras tres días, encuentran a Jesús enseñando entre los doctores del Templo.' }
      ]
    },
    {
      id: 'luminosos',
      name: 'Misterios Luminosos',
      shortName: 'Luminosos',
      emoji: '💡',
      days: [4],
      daysLabel: 'Jueves',
      mysteries: [
        { name: 'El Bautismo en el Jordán', desc: 'Juan bautiza a Jesús y el Padre lo proclama su Hijo amado.' },
        { name: 'Las Bodas de Caná', desc: 'Jesús convierte el agua en vino a petición de María.' },
        { name: 'El Anuncio del Reino', desc: 'Jesús anuncia el Reino de Dios e invita a la conversión.' },
        { name: 'La Transfiguración', desc: 'Jesús se transfigura en el monte ante Pedro, Santiago y Juan.' },
        { name: 'La Institución de la Eucaristía', desc: 'En la Última Cena, Jesús se entrega en el pan y el vino.' }
      ]
    },
    {
      id: 'dolorosos',
      name: 'Misterios Dolorosos',
      shortName: 'Dolorosos',
      emoji: '✝️',
      days: [2, 5],
      daysLabel: 'Martes y Viernes',
      mysteries: [
        { name: 'La Oración en el Huerto', desc: 'Jesús ora en Getsemaní la noche antes de su pasión.' },
        { name: 'La Flagelación', desc: 'Jesús es azotado por orden de Pilato.' },
        { name: 'La Coronación de Espinas', desc: 'Coronan a Jesús con espinas y se burlan de Él.' },
        { name: 'Jesús con la Cruz a Cuestas', desc: 'Jesús carga la cruz camino del Calvario.' },
        { name: 'La Crucifixión', desc: 'Jesús muere en la cruz por amor a todos.' }
      ]
    },
    {
      id: 'gloriosos',
      name: 'Misterios Gloriosos',
      shortName: 'Gloriosos',
      emoji: '👑',
      days: [3, 0],
      daysLabel: 'Miércoles y Domingo',
      mysteries: [
        { name: 'La Resurrección', desc: 'Jesús resucita victorioso al tercer día.' },
        { name: 'La Ascensión', desc: 'Jesús sube al Cielo a la derecha del Padre.' },
        { name: 'La Venida del Espíritu Santo', desc: 'El Espíritu Santo desciende sobre los apóstoles en Pentecostés.' },
        { name: 'La Asunción de María', desc: 'María es llevada en cuerpo y alma al Cielo.' },
        { name: 'La Coronación de María', desc: 'María es coronada como Reina del Cielo y de la Tierra.' }
      ]
    }
  ];

  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Index into ROSARY_SETS for the mysteries traditionally prayed on a given
  // weekday (defaults to today). Falls back to the Joyful mysteries.
  function getRosarySetIndexForDay(day) {
    if (typeof day !== 'number') day = new Date().getDay();
    const idx = ROSARY_SETS.findIndex(s => s.days.includes(day));
    return idx === -1 ? 0 : idx;
  }

  // Backward-compatible alias: the Joyful mysteries as a flat array.
  const MYSTERIES = ROSARY_SETS[0].mysteries;

  // Look up a prayer by its id (e.g. 'padrenuestro', 'avemaria', 'gloria',
  // 'salve'). Used by the rosary so kids can read each prayer as they pray it.
  function getPrayer(id) {
    return PRAYERS.find(p => p.id === id) || null;
  }

  const HERITAGE = [
    // PRUNED [2026-06-15]: Removed duplicate 'tirana' object (different structure) to respect MAX 8 limit
    // PRUNED [2026-06-15]: Removed 'vasquez' to make room for 'fiesta_san_pedro' and stay within MAX 8 limit
    {
      id: 'fiesta_san_pedro',
      title: 'Fiesta de San Pedro',
      info: 'Se celebra el 29 de junio. Los pescadores de la costa chilena adornan sus botes para pedir buena pesca y protección a su patrono.',
      q: '¿Qué grupo de trabajadores celebra a San Pedro?', a: ['Los pescadores', 'Los mineros', 'Los agricultores'], correct: 0,
      explain: 'La Fiesta de San Pedro se celebra el 29 de junio; los pescadores de la costa chilena adornan sus botes en honor a su patrono.'
    },
    {
      id: 'carmen',
      title: 'Virgen del Carmen',
      info: 'Es la Patrona de Chile. Fue declarada así en 1923. Cada 16 de julio se celebra su fiesta con procesiones y bailes religiosos.',
      q: '¿Qué día es la fiesta de la Virgen del Carmen?', a: ['18 de septiembre', '16 de julio', '25 de diciembre'], correct: 1,
      explain: 'La Virgen del Carmen, Patrona de Chile desde 1923, se celebra cada 16 de julio con procesiones y bailes religiosos.'
    },
    {
      id: 'sanfrancisco_stgo',
      title: 'Iglesia de San Francisco',
      info: 'Es la iglesia más antigua de Santiago. Su construcción comenzó en 1586 y ha sobrevivido a muchos terremotos.',
      q: '¿Qué tiene de especial esta iglesia?', a: ['Es la más alta', 'Es la más antigua de Santiago', 'Es de cristal'], correct: 1,
      explain: 'La Iglesia de San Francisco es la más antigua de Santiago; su construcción comenzó en 1586.'
    },
    {
      id: 'tirana',
      title: 'Fiesta de La Tirana',
      info: 'Se celebra en el norte de Chile cada 16 de julio. Es famosa por sus coloridas "Diabladas" y bailes en honor a la Virgen del Carmen.',
      q: '¿En qué zona de Chile se celebra La Tirana?', a: ['En el sur', 'En el centro', 'En el norte'], correct: 2,
      explain: 'La Fiesta de La Tirana se celebra en el norte de Chile cada 16 de julio, con coloridas "Diabladas" en honor a la Virgen del Carmen.'
    },
    {
      id: 'cuasimodo',
      title: 'Fiesta de Cuasimodo',
      info: 'Se celebra en la zona central el domingo siguiente a Pascua. Los huasos acompañan al sacerdote a caballo para llevar la comunión a los enfermos.',
      q: '¿Cómo acompañan los huasos al sacerdote en Cuasimodo?', a: ['A pie', 'En auto', 'A caballo'], correct: 2,
      explain: 'La Fiesta de Cuasimodo se celebra en la zona central el domingo después de Pascua; los huasos acompañan a caballo al sacerdote que lleva la comunión a los enfermos.'
    },
    {
      id: 'andacollo',
      title: 'Fiesta de Andacollo',
      info: 'Gran festividad mariana en el norte chico de Chile. Miles de peregrinos y bailes rinden homenaje a la Virgen.',
      q: '¿Dónde se celebra la Fiesta de Andacollo?', a: ['En el norte chico', 'En Punta Arenas', 'En Santiago'], correct: 0,
      explain: 'La Fiesta de Andacollo es una gran festividad mariana del norte chico de Chile, con miles de peregrinos y bailes.'
    },
    {
      id: 'maipu',
      title: 'Templo Votivo de Maipú',
      info: 'Construido en Santiago para cumplir la promesa hecha a la Virgen del Carmen tras ganar la independencia de Chile.',
      q: '¿A quién se le hizo la promesa de construir este templo?', a: ['A San José', 'A la Virgen del Carmen', 'A San Miguel'], correct: 1,
      explain: 'El Templo Votivo de Maipú se construyó en Santiago para cumplir la promesa hecha a la Virgen del Carmen tras la independencia de Chile.'
    },
    {
      id: 'teresa',
      title: 'Santuario de Santa Teresa de Los Andes',
      info: 'Ubicado en Auco, es un importante lugar de peregrinación donde descansan los restos de la primera santa chilena.',
      q: '¿Qué santa chilena descansa en este santuario?', a: ['Santa Rosa', 'Santa Teresa de Los Andes', 'Santa Cecilia'], correct: 1,
      explain: 'El Santuario de Santa Teresa de Los Andes está ubicado en Auco y guarda los restos de la primera santa chilena.'
    },
    {
      id: 'catedral_stgo',
      title: 'Catedral Metropolitana de Santiago',
      info: 'Ubicada en la Plaza de Armas de Santiago, es la iglesia principal de la Arquidiócesis. La construcción del edificio actual comenzó en 1748.',
      q: '¿En qué plaza se encuentra la Catedral Metropolitana?', a: ['Plaza de Armas', 'Plaza Italia', 'Plaza Brasil'], correct: 0,
      explain: 'La Catedral Metropolitana de Santiago está en la Plaza de Armas; la construcción del edificio actual comenzó en 1748.'
    },
    {
      id: 'lourdes_punta_arenas',
      title: 'Santuario de Lourdes en Punta Arenas',
      info: 'Es una gruta y santuario dedicado a la Virgen de Lourdes en la ciudad de Punta Arenas, en el extremo sur de Chile. Es un destacado lugar de peregrinación en la Patagonia.',
      q: '¿En qué ciudad del sur de Chile está este santuario?', a: ['Punta Arenas', 'La Serena', 'Arica'], correct: 0,
      explain: 'El Santuario de Lourdes está en Punta Arenas, en el extremo sur de Chile, y es un lugar de peregrinación de la Patagonia.'
    },
    {
      id: 'candelaria',
      title: 'Fiesta de la Virgen de la Candelaria',
      info: 'Se celebra el 2 de febrero, fiesta de la Presentación del Señor. En Copiapó, en el norte de Chile, se honra a la Virgen de la Candelaria con bailes religiosos.',
      q: '¿Qué día se celebra la Virgen de la Candelaria?', a: ['2 de febrero', '16 de julio', '8 de diciembre'], correct: 0,
      explain: 'La Virgen de la Candelaria se celebra el 2 de febrero, fiesta de la Presentación del Señor; en Copiapó se honra con bailes religiosos.'
    }
  ];

  function _key() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_fe_') : null;
  }

  // Saved shape (zs_fe_<user>): { totalStars, completed: [] } plus,
  // since v2, these ADDED fields (all optional; old blobs load as-is):
  //   saintsLearned    { saintId: best number of correct answers }
  //   heritageLearned  { itemId: true }
  //   prayersPrayed    { prayerId: times prayed to the end }
  //   prayersMemorized { prayerId: true }   (memory mode finished)
  //   decades          number of rosary decades prayed
  //   rosaries         number of full rosaries finished
  //   rosaryMaterial   'madera' | 'cristal'
  //   challengeBest    { tier: { score, total, stars } }
  //   favoriteSaint    saint id chosen in the "Mi santo" card (v3)
  // The star rule (js/auth.js) reads totalStars only.
  function _fresh() { return { totalStars: 0, completed: [] }; }

  function _getData() {
    const key = _key();
    if (!key) return null;
    try {
      const d = JSON.parse(localStorage.getItem(key)) || _fresh();
      if (typeof d.totalStars !== 'number') d.totalStars = Number(d.totalStars) || 0;
      if (!Array.isArray(d.completed)) d.completed = d.completed || [];
      return d;
    } catch { return _fresh(); }
  }

  function _saveData(data) {
    const key = _key();
    if (key) {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
    }
  }

  // Load, change and save in one step. fn may return false to skip saving.
  function update(fn) {
    const data = _getData();
    if (!data) return null;
    if (fn(data) === false) return data;
    _saveData(data);
    return data;
  }

  function addStar(n) {
    n = Math.max(1, Math.floor(n || 1));
    const data = _getData();
    if (!data) return;
    data.totalStars += n;
    _saveData(data);
    if (typeof showConfetti === 'function') showConfetti();

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Fe Explorador', '⛪', n > 1 ? 'Ganó ' + n + ' estrellas en Fe Explorador' : 'Ganó una estrella en Fe Explorador');
    }
  }

  function getSaint(id) { return SAINTS.find(s => s.id === id) || null; }

  return {
    PRAYERS, SAINTS, MYSTERIES, ROSARY_SETS, HERITAGE, MONTHS, addStar,
    getRosarySetIndexForDay, DAY_NAMES, getPrayer, getSaint, feastLabel,
    getStatus: _getData, update
  };
})();
