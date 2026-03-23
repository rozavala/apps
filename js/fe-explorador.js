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
    }
  ];

  function _key() {
    const user = getActiveUser();
    if (!user) return null;
    return STORAGE_KEY + user.name.toLowerCase().replace(/\s+/g, '_');
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
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  function addStar() {
    const data = _getData();
    data.totalStars++;
    _saveData(data);
    if (typeof showConfetti === 'function') showConfetti();
  }

  return { PRAYERS, SAINTS, MYSTERIES, HERITAGE, addStar, getStatus: _getData };
})();
