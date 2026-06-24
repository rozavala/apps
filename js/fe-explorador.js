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
      country: 'Tréveris 🇮🇹',
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
    }
  ];

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

  function _getData() {
    const key = _key();
    if (!key) return null;
    try {
      return JSON.parse(localStorage.getItem(key)) || { totalStars: 0, completed: [] };
    } catch { return { totalStars: 0, completed: [] }; }
  }

  function _saveData(data) {
    const key = _key();
    if (key) {
      localStorage.setItem(key, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
    }
  }

  function addStar() {
    const data = _getData();
    data.totalStars++;
    _saveData(data);
    if (typeof showConfetti === 'function') showConfetti();

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Fe Explorador', '⛪', 'Ganó una estrella en Fe Explorador');
    }
  }

  return {
    PRAYERS, SAINTS, MYSTERIES, ROSARY_SETS, HERITAGE, addStar,
    getRosarySetIndexForDay, DAY_NAMES, getPrayer,
    getStatus: _getData
  };
})();
