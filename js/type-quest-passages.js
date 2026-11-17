/* Type Quest passages — short texts to type, lifted from Story Explorer,
   Descubre Chile and Fe Explorador. Each one names where it came from.
   Descubre Chile and Fe Explorador are written in Spanish only: their
   English entries are faithful translations of the same text (marked
   "translated" below). The English prayers use the standard traditional
   wording. */
var TypeQuestPassages = [
  // ── Story Explorer (js/story-explorer.js, STORIES) ──
  // ocean_dive, pages 1-2
  { id: 'story-ocean-dive-es', src: 'story', lang: 'es', lvl: 1, title: 'El buceo en el océano',
    text: 'Los buzos saltaron al agua azul profunda. Vieron peces coloridos y una gran tortuga marina.' },
  // atacama_desert, pages 1-2
  { id: 'story-atacama-desert-es', src: 'story', lang: 'es', lvl: 1, title: 'El desierto de Atacama',
    text: 'El desierto es muy seco. No ha llovido en años. Por la noche, el cielo está lleno de estrellas y la luna brilla.' },
  // condor_flight, pages 1 and 4
  { id: 'story-condor-flight-es', src: 'story', lang: 'es', lvl: 2, title: 'El primer vuelo del cóndor',
    text: 'En lo alto de los Andes, un bebé cóndor estaba sentado en una roca. Su nombre era Ciro. Ciro respiró profundo, abrió sus alas y saltó. ¡El viento lo levantó! ¡Estaba volando!' },
  // empanadas, pages 1-2
  { id: 'story-empanadas-es', src: 'story', lang: 'es', lvl: 2, title: 'Empanadas para la fiesta',
    text: 'Es septiembre en Chile y se acercan las Fiestas Patrias. Sofía y su abuela están haciendo empanadas. La abuela estira la masa. Sofía ayuda a rellenar cada una con pino: carne, cebolla, una aceituna y un trozo de huevo.' },
  // darwin_patagonia, pages 1-2
  { id: 'story-darwin-patagonia-es', src: 'story', lang: 'es', lvl: 3, title: 'Darwin en la Patagonia',
    text: 'En 1834, un joven naturalista llamado Charles Darwin navegó por la costa de la Patagonia a bordo del barco HMS Beagle. Había venido a observar las plantas, los animales y las rocas de Sudamérica. Darwin caminó por las llanuras secas y encontró los huesos de animales gigantes enterrados en los acantilados.' },
  // rapa_nui, pages 1 and 3
  { id: 'story-rapa-nui-es', src: 'story', lang: 'es', lvl: 3, title: 'Los moai de Rapa Nui',
    text: 'Rapa Nui, también llamada Isla de Pascua, es una pequeña isla volcánica en medio del océano Pacífico. Es parte de Chile y está a más de 3.500 kilómetros del continente. Los isleños tallaron estatuas gigantes de piedra llamadas moai. La mayoría se talló en roca volcánica blanda en una cantera llamada Rano Raraku.' },

  { id: 'story-ocean-dive-en', src: 'story', lang: 'en', lvl: 1, title: 'The Ocean Dive',
    text: 'The divers jumped into the deep blue water. They saw colorful fish and a large sea turtle.' },
  { id: 'story-atacama-desert-en', src: 'story', lang: 'en', lvl: 1, title: 'The Atacama Desert',
    text: 'The desert is very dry. It has not rained in years. At night, the sky is full of stars and the moon shines bright.' },
  { id: 'story-condor-flight-en', src: 'story', lang: 'en', lvl: 2, title: "The Condor's First Flight",
    text: 'High in the Andes mountains, a baby condor sat on a rocky ledge. His name was Ciro. Ciro took a deep breath, opened his wings, and jumped. The wind lifted him up! He was flying!' },
  { id: 'story-empanadas-en', src: 'story', lang: 'en', lvl: 2, title: 'Empanadas for the Fiesta',
    text: 'It is September in Chile, and the Fiestas Patrias are coming. Sofía and her grandma are making empanadas. Grandma rolls out the dough. Sofía helps fill each one with pino: beef, onion, an olive and a piece of egg.' },
  { id: 'story-darwin-patagonia-en', src: 'story', lang: 'en', lvl: 3, title: 'Darwin in Patagonia',
    text: 'In 1834, a young naturalist named Charles Darwin sailed along the coast of Patagonia aboard the ship HMS Beagle. He had come to observe the plants, animals, and rocks of South America. Darwin walked across the dry plains and found the bones of giant animals buried in the cliffs.' },
  { id: 'story-rapa-nui-en', src: 'story', lang: 'en', lvl: 3, title: 'The Moai of Rapa Nui',
    text: 'Rapa Nui, also called Easter Island, is a small volcanic island in the middle of the Pacific Ocean. It is part of Chile and lies more than 3,500 kilometers from the mainland. The islanders carved giant stone statues called moai. Most of them were carved from soft volcanic rock at a quarry called Rano Raraku.' },

  // ── Descubre Chile (js/descubre-chile.js REGIONS, js/descubre-chile-data.js DC_REGIONS) ──
  // REGIONS.norte, "Iquique y Arica" fact
  { id: 'chile-arica-es', src: 'chile', lang: 'es', lvl: 1, title: 'Arica',
    text: 'Arica es la ciudad más al norte de Chile y a veces se llama "la ciudad de la eterna primavera".' },
  // REGIONS.norte, "Altiplano" fact
  { id: 'chile-altiplano-es', src: 'chile', lang: 'es', lvl: 1, title: 'Altiplano',
    text: 'En las alturas del norte viven flamencos, vicuñas y llamas. Los pueblos aymaras han habitado esta zona por miles de años.' },
  // REGIONS.sur, "Chiloé" fact
  { id: 'chile-chiloe-es', src: 'chile', lang: 'es', lvl: 2, title: 'Chiloé',
    text: 'Chiloé es un archipiélago con iglesias de madera, palafitos de colores y leyendas como la del Trauco y la Pincoya. Hay 16 iglesias chilotas declaradas Patrimonio por la UNESCO.' },
  // REGIONS.patagonia, "Torres del Paine" fact
  { id: 'chile-torres-paine-es', src: 'chile', lang: 'es', lvl: 2, title: 'Torres del Paine',
    text: 'Torres del Paine es uno de los lugares más hermosos del planeta. Tiene torres de granito, lagos turquesa y glaciares impresionantes. El Glaciar Grey tiene más de 6 km de ancho.' },
  // DC_REGIONS RM: geo, history, products
  { id: 'chile-santiago-es', src: 'chile', lang: 'es', lvl: 3, title: 'Santiago',
    text: 'Santiago está en un valle entre la Cordillera de los Andes y la Cordillera de la Costa, cruzado por los ríos Mapocho y Maipo. Pedro de Valdivia fundó Santiago del Nuevo Extremo el 12 de febrero de 1541, a los pies del cerro Santa Lucía (Huelén). Hoy viven aquí más de 7 millones de personas.' },
  // DC_REGIONS AT: geo, history
  { id: 'chile-desierto-florido-es', src: 'chile', lang: 'es', lvl: 3, title: 'El desierto florido',
    text: 'Cuando llueve más de lo normal, el desierto se cubre de flores: es el desierto florido. En la cordillera se alza el Nevado Ojos del Salado, el volcán más alto del mundo (casi 6.900 m). En 1851 se inauguró aquí el primer ferrocarril de Chile, entre Caldera y Copiapó.' },

  // translated from chile-arica-es
  { id: 'chile-arica-en', src: 'chile', lang: 'en', lvl: 1, title: 'Arica',
    text: 'Arica is the northernmost city in Chile and is sometimes called "the city of eternal spring".' },
  // translated from chile-altiplano-es
  { id: 'chile-altiplano-en', src: 'chile', lang: 'en', lvl: 1, title: 'The Altiplano',
    text: 'Flamingos, vicuñas and llamas live high up in the north. The Aymara people have lived in this area for thousands of years.' },
  // translated from chile-chiloe-es
  { id: 'chile-chiloe-en', src: 'chile', lang: 'en', lvl: 2, title: 'Chiloé',
    text: 'Chiloé is an archipelago with wooden churches, colorful stilt houses and legends like those of the Trauco and the Pincoya. There are 16 churches of Chiloé declared World Heritage by UNESCO.' },
  // translated from chile-torres-paine-es (age-of-glacier clause dropped in both ES and EN to avoid the u-umlaut)
  { id: 'chile-torres-paine-en', src: 'chile', lang: 'en', lvl: 2, title: 'Torres del Paine',
    text: 'Torres del Paine is one of the most beautiful places on the planet. It has granite towers, turquoise lakes and impressive glaciers. The Grey Glacier is more than 6 km wide.' },
  // translated from chile-santiago-es
  { id: 'chile-santiago-en', src: 'chile', lang: 'en', lvl: 3, title: 'Santiago',
    text: 'Santiago lies in a valley between the Andes and the Coastal Range, crossed by the Mapocho and Maipo rivers. Pedro de Valdivia founded Santiago del Nuevo Extremo on February 12, 1541, at the foot of Santa Lucía hill (Huelén). Today more than 7 million people live here.' },
  // translated from chile-desierto-florido-es
  { id: 'chile-flowering-desert-en', src: 'chile', lang: 'en', lvl: 3, title: 'The Flowering Desert',
    text: 'When it rains more than usual, the desert is covered with flowers: this is the flowering desert. In the mountains rises Nevado Ojos del Salado, the highest volcano in the world (almost 6,900 m). In 1851 the first railway in Chile opened here, between Caldera and Copiapó.' },

  // ── Fe Explorador (js/fe-explorador.js PRAYERS, SAINTS, HERITAGE) ──
  // PRAYERS gloria
  { id: 'faith-gloria-es', src: 'faith', lang: 'es', lvl: 1, title: 'Gloria',
    text: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.' },
  // PRAYERS angelguarda
  { id: 'faith-angel-guarda-es', src: 'faith', lang: 'es', lvl: 1, title: 'Ángel de la Guarda',
    text: 'Ángel de la guarda, dulce compañía, no me desampares ni de noche ni de día. No me dejes solo, que me perdería. Amén.' },
  // PRAYERS avemaria
  { id: 'faith-ave-maria-es', src: 'faith', lang: 'es', lvl: 2, title: 'Ave María',
    text: 'Dios te salve, María, llena eres de gracia, el Señor es contigo; bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.' },
  // HERITAGE carmen
  { id: 'faith-virgen-carmen-es', src: 'faith', lang: 'es', lvl: 2, title: 'Virgen del Carmen',
    text: 'La Virgen del Carmen es la Patrona de Chile. Fue declarada así en 1923. Cada 16 de julio se celebra su fiesta con procesiones y bailes religiosos.' },
  // PRAYERS padrenuestro
  { id: 'faith-padre-nuestro-es', src: 'faith', lang: 'es', lvl: 3, title: 'Padre Nuestro',
    text: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.' },
  // SAINTS teresa_andes bio + HERITAGE teresa (santuario)
  { id: 'faith-teresa-andes-es', src: 'faith', lang: 'es', lvl: 3, title: 'Santa Teresa de los Andes',
    text: 'Santa Teresa de los Andes vivió entre 1900 y 1920. Es la primera santa de Chile. Nació en Santiago y vivió en el monasterio de Los Andes. Es conocida por su alegría y su entrega a Dios desde joven. Su santuario está en Auco y es un importante lugar de peregrinación donde descansan sus restos.' },

  // translated from SAINTS benito bio
  { id: 'faith-saint-benedict-en', src: 'faith', lang: 'en', lvl: 1, title: 'Saint Benedict',
    text: 'Saint Benedict is the patron of Europe. His famous rule is summed up in "Ora et labora": pray and work.' },
  // translated from SAINTS jose bio
  { id: 'faith-saint-joseph-en', src: 'faith', lang: 'en', lvl: 1, title: 'Saint Joseph',
    text: 'Saint Joseph was the husband of Mary. He was a carpenter and is known for his patience, silence and hard work.' },
  // standard English wording of PRAYERS avemaria
  { id: 'faith-hail-mary-en', src: 'faith', lang: 'en', lvl: 2, title: 'Hail Mary',
    text: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.' },
  // standard English wording of PRAYERS gloria
  { id: 'faith-glory-be-en', src: 'faith', lang: 'en', lvl: 2, title: 'Glory Be',
    text: 'Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.' },
  // standard English wording of PRAYERS padrenuestro
  { id: 'faith-our-father-en', src: 'faith', lang: 'en', lvl: 3, title: 'Our Father',
    text: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.' },
  // translated from faith-teresa-andes-es
  { id: 'faith-teresa-andes-en', src: 'faith', lang: 'en', lvl: 3, title: 'Saint Teresa of the Andes',
    text: 'Saint Teresa of the Andes lived from 1900 to 1920. She is the first saint of Chile. She was born in Santiago and lived in the monastery of Los Andes. She is known for her joy and for giving her life to God from a young age. Her shrine is in Auco, an important place of pilgrimage where her remains rest.' }
];
if (typeof module !== 'undefined' && module.exports) module.exports = TypeQuestPassages;
