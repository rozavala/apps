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
    }
  ];

  const SAINTS = [
    {
      id: 'francisco',
      name: 'San Francisco de Asís',
      dates: '1181–1226',
      country: 'Italia 🇮🇹',
      bio: 'Nació en Italia. Es conocido por su amor a la naturaleza y a los animales. Fundó la orden de los franciscanos y escribió el Cántico de las Criaturas.',
      questions: [
        { q: '¿Por qué es más conocido San Francisco?', a: ['Amor a la naturaleza', 'Ser un gran rey', 'Inventar el piano'], correct: 0 },
        { q: '¿En qué país nació?', a: ['Chile', 'Italia', 'España'], correct: 1 }
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
        { q: 'Fue la primera santa de...', a: ['Argentina', 'España', 'Chile'], correct: 2 }
      ]
    },
    {
      id: 'jorge',
      name: 'San Jorge',
      dates: 'siglo III',
      country: 'Capadocia ⚔️',
      bio: 'Fue un soldado romano que defendió su fe con gran valentía. Es el patrono de los exploradores y se le representa como un caballero valiente.',
      questions: [
        { q: '¿Qué profesión tenía San Jorge?', a: ['Pintor', 'Soldado', 'Cocinero'], correct: 1 },
        { q: 'Es el patrono de los...', a: ['Exploradores', 'Navegantes', 'Músicos'], correct: 0 }
      ]
    },
    {
      id: 'alberto_hurtado',
      name: 'San Alberto Hurtado',
      dates: '1901–1952',
      country: 'Chile 🇨🇱',
      bio: 'Sacerdote jesuita chileno que fundó el Hogar de Cristo para ayudar a las personas más pobres. Siempre decía: "Contento, Señor, contento".',
      questions: [
        { q: '¿Qué institución fundó el Padre Hurtado?', a: ['Un banco', 'El Hogar de Cristo', 'Una universidad'], correct: 1 },
        { q: '¿Cuál era su frase más famosa?', a: ['"Hola amigos"', '"Contento, Señor, contento"', '"A estudiar mucho"'], correct: 1 }
      ]
    },
    {
      id: 'tomas_aquino',
      name: 'Santo Tomás de Aquino',
      dates: '1225–1274',
      country: 'Italia 🇮🇹',
      bio: 'Fue un gran sabio y maestro que amaba estudiar. Escribió muchos libros sobre la fe y la razón, y es conocido como el "Doctor Angélico".',
      questions: [
        { q: '¿Qué le gustaba mucho hacer a Santo Tomás?', a: ['Cazar', 'Estudiar y escribir', 'Navegar'], correct: 1 },
        { q: '¿Cómo es conocido también?', a: ['El Doctor Angélico', 'El Rey Sabio', 'El Gran Viajero'], correct: 0 }
      ]
    },
    {
      id: 'rosa_lima',
      name: 'Santa Rosa de Lima',
      dates: '1586–1617',
      country: 'Perú 🇵🇪',
      bio: 'Es la primera santa de América. Vivió en Lima y dedicó su vida a ayudar a los enfermos y a los necesitados en su propia casa.',
      questions: [
        { q: 'Fue la primera santa de...', a: ['Europa', 'América', 'Asia'], correct: 1 },
        { q: '¿En qué ciudad vivió?', a: ['Santiago', 'Lima', 'Bogotá'], correct: 1 }
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
        { q: '¿Qué animales se dice que alimentó juntos?', a: ['Leones y tigres', 'Perros, gatos y ratones', 'Elefantes y jirafas'], correct: 1 }
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
        { q: '¿Qué era antes de dedicar su vida a Dios?', a: ['Marinero', 'Soldado', 'Panadero'], correct: 1 }
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
        { q: '¿Qué fundó en España?', a: ['Muchos hospitales', 'Muchos conventos', 'Muchas escuelas'], correct: 1 }
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
        { q: '¿Qué usaba para divertir a los niños?', a: ['Magia y juegos', 'Barcos de vela', 'Espadas de madera'], correct: 0 }
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
    }
  ];

  const MYSTERIES = [
    { name: 'La Encarnación', desc: 'El ángel Gabriel visita a María.' },
    { name: 'La Visitación', desc: 'María visita a su prima Isabel.' },
    { name: 'El Nacimiento', desc: 'Jesús nace en Belén.' },
    { name: 'La Presentación', desc: 'María y José llevan al Niño al Templo.' },
    { name: 'El Niño Perdido', desc: 'Encuentran a Jesús en el Templo.' }
  ];

  const HERITAGE = [
    {
      id: 'carmen',
      title: 'Virgen del Carmen',
      info: 'Es la Patrona de Chile. Fue declarada así en 1923. Cada 16 de julio se celebra su fiesta con procesiones y bailes religiosos.',
      q: '¿Qué día es la fiesta de la Virgen del Carmen?', a: ['18 de septiembre', '16 de julio', '25 de diciembre'], correct: 1
    },
    {
      id: 'vasquez',
      title: 'Santuario de Lo Vásquez',
      info: 'Ubicado cerca de Casablanca, es el lugar de peregrinación más grande de Chile. Cada 8 de diciembre miles de personas caminan hacia allá.',
      q: '¿En qué fecha es la gran peregrinación?', a: ['1 de enero', '8 de diciembre', '12 de octubre'], correct: 1
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
    PRAYERS, SAINTS, MYSTERIES, HERITAGE, addStar, 
    getStatus: _getData
  };
})();
