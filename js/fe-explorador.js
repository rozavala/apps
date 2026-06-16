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
    }
  ];

  const SAINTS = [
    {
      id: 'jose',
      name: 'San José',
      dates: 'Siglo I',
      country: 'Israel 🇮🇱',
      bio: 'Fue el padre adoptivo de Jesús y esposo de la Virgen María. De oficio carpintero.',
      questions: [
        { q: '¿Cuál era el oficio de San José?', a: ['Carpintero', 'Pescador', 'Pastor'], correct: 0 },
        { q: '¿De quién fue padre adoptivo?', a: ['Jesús', 'Pedro', 'Juan'], correct: 0 },
        { q: '¿Quién fue su esposa?', a: ['María', 'Isabel', 'Marta'], correct: 0 }
      ]
    },
    {
      id: 'benito',
      name: 'San Benito de Nursia',
      dates: '480–547',
      country: 'Italia 🇮🇹',
      bio: 'Es el patrón de Europa y fundador del monacato occidental. Su famosa regla se resume en "Ora et labora" (Reza y trabaja).',
      questions: [
        { q: '¿Cuál es el lema de San Benito?', a: ['Reza y trabaja', 'Solo trabaja', 'Estudia y duerme'], correct: 0 },
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
        { q: '¿Por qué es más conocido San Francisco?', a: ['Amor a la naturaleza', 'Ser un gran rey', 'Inventar el piano'], correct: 0 },
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
        { q: '¿Dónde nació Santa Teresa de los Andes?', a: ['Roma', 'Santiago', 'Concepción'], correct: 1 },
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
        { q: '¿Qué institución fundó el Padre Hurtado?', a: ['Un banco', 'El Hogar de Cristo', 'Una universidad'], correct: 1 },
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
        { q: 'Fue la primera santa de...', a: ['Europa', 'América', 'Asia'], correct: 1 },
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
        { q: '¿Cómo es conocido San Martín?', a: ['El Santo de la Escoba', 'El Gran Guerrero', 'El Rey de los Mares'], correct: 0 },
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
        { q: '¿Qué orden religiosa fundó?', a: ['Los Franciscanos', 'Los Jesuitas', 'Los Dominicos'], correct: 1 },
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
        { q: '¿Por qué es famosa Santa Teresa de Ávila?', a: ['Por ser una gran escritora', 'Por descubrir un país', 'Por inventar la imprenta'], correct: 0 },
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
        { q: '¿A quiénes dedicó su vida San Juan Bosco?', a: ['A los ancianos', 'A los niños y jóvenes', 'A los soldados'], correct: 1 },
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
        { q: '¿Cuál era el oficio de San José?', a: ['Herrero', 'Carpintero', 'Pastor'], correct: 1 },
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
        { q: '¿A qué se dedicó principalmente?', a: ['A cuidar enfermos', 'A la guerra', 'Al comercio'], correct: 0 },
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
        { q: '¿Qué escribió San Pablo en la Biblia?', a: ['Muchas cartas', 'Poemas', 'Canciones'], correct: 0 },
        { q: '¿Qué hizo para enseñar sobre Jesús?', a: ['Viajó por el mundo', 'Construyó barcos', 'Pintó cuadros'], correct: 0 },
        { q: '¿En qué siglo vivió?', a: ['Siglo X', 'Siglo I', 'Siglo V'], correct: 1 }
      ]
    },
    // PRUNED [2026-XX-XX]: Removed 'pedro' to make room for 'lucas' and stay within MAX 15 limit
    {
      id: 'lucas',
      name: 'San Lucas',
      dates: 'Siglo I',
      country: 'Grecia 🇬🇷',
      bio: 'Fue médico y compañero de San Pablo. Escribió uno de los Evangelios y los Hechos de los Apóstoles.',
      questions: [
        { q: '¿Cuál era la profesión de San Lucas?', a: ['Pescador', 'Médico', 'Carpintero'], correct: 1 },
        { q: '¿De quién fue compañero de viajes?', a: ['San Pablo', 'San Pedro', 'San Juan'], correct: 0 },
        { q: '¿Qué libros de la Biblia escribió?', a: ['Evangelio y Hechos de los Apóstoles', 'Apocalipsis', 'Génesis'], correct: 0 }
      ]
    },
    {
      id: 'juan_cruz',
      name: 'San Juan de la Cruz',
      dates: '1542–1591',
      country: 'España 🇪🇸',
      bio: 'Famoso místico y poeta que ayudó a Santa Teresa de Ávila a reformar la Orden del Carmelo.',
      questions: [
        { q: '¿A quién ayudó a reformar su orden?', a: ['Santa Teresa de Ávila', 'Santa Rosa de Lima', 'San Francisco de Asís'], correct: 0 },
        { q: '¿Por qué es famoso?', a: ['Por ser místico y poeta', 'Por fundar Roma', 'Por inventar la imprenta'], correct: 0 },
        { q: '¿De qué país era?', a: ['España', 'Francia', 'Italia'], correct: 0 }
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
      q: '¿Qué grupo de trabajadores celebra a San Pedro?', a: ['Los pescadores', 'Los mineros', 'Los agricultores'], correct: 0
    },
    // PRUNED [2026-XX-XX]: Removed 'carmen' to make room for 'santuario_teresa' and stay within MAX 8 limit
    {
      id: 'santuario_teresa',
      title: 'Santuario de Santa Teresa',
      info: 'Ubicado en Auco, Los Andes. Es un lugar de peregrinación muy importante donde descansan los restos de la primera santa de Chile.',
      q: '¿En qué ciudad se encuentra este santuario?', a: ['Santiago', 'Los Andes', 'Valparaíso'], correct: 1
    },
    {
      id: 'sanfrancisco_stgo',
      title: 'Iglesia de San Francisco',
      info: 'Es la iglesia más antigua de Santiago. Su construcción comenzó en 1586 y ha sobrevivido a muchos terremotos.',
      q: '¿Qué tiene de especial esta iglesia?', a: ['Es la más alta', 'Es la más antigua de Santiago', 'Es de cristal'], correct: 1
    },
    {
      id: 'tirana',
      title: 'Fiesta de La Tirana',
      info: 'Se celebra en el norte de Chile cada 16 de julio. Es famosa por sus coloridas "Diabladas" y bailes en honor a la Virgen del Carmen.',
      q: '¿En qué zona de Chile se celebra La Tirana?', a: ['En el sur', 'En el centro', 'En el norte'], correct: 2
    },
    {
      id: 'cuasimodo',
      title: 'Fiesta de Cuasimodo',
      info: 'Se celebra en la zona central el domingo siguiente a Pascua. Los huasos acompañan al sacerdote a caballo para llevar la comunión a los enfermos.',
      q: '¿Cómo acompañan los huasos al sacerdote en Cuasimodo?', a: ['A pie', 'En auto', 'A caballo'], correct: 2
    },
    {
      id: 'andacollo',
      title: 'Fiesta de Andacollo',
      info: 'Gran festividad mariana en el norte chico de Chile. Miles de peregrinos y bailes rinden homenaje a la Virgen.',
      q: '¿Dónde se celebra la Fiesta de Andacollo?', a: ['En el norte chico', 'En Punta Arenas', 'En Santiago'], correct: 0
    },
    {
      id: 'maipu',
      title: 'Templo Votivo de Maipú',
      info: 'Construido en Santiago para cumplir la promesa hecha a la Virgen del Carmen tras ganar la independencia de Chile.',
      q: '¿A quién se le hizo la promesa de construir este templo?', a: ['A San José', 'A la Virgen del Carmen', 'A San Miguel'], correct: 1
    },
    {
      id: 'teresa',
      title: 'Santuario de Santa Teresa de Los Andes',
      info: 'Ubicado en Auco, es un importante lugar de peregrinación donde descansan los restos de la primera santa chilena.',
      q: '¿Qué santa chilena descansa en este santuario?', a: ['Santa Rosa', 'Santa Teresa de Los Andes', 'Santa Cecilia'], correct: 1
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
