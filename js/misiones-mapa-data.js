/* ================================================================
   MISIONES DE MAPA — misiones-mapa-data.js
   Content for the map-missions app: cities with their time zones,
   mystery places and their clues, trip missions, the picture map for
   compass work, two Andes cross-sections, and the Chile pack (the 16
   regions north to south, the Ruta 5, Rapa Nui and Antarctica).

   Every pair is [Spanish, English]. Coordinates are [longitude,
   latitude] in degrees (west and south are negative). Country codes
   are ISO 3166-1 alpha-3 in lowercase, the same ids js/world-map-data.js
   uses for outlines, neighbours and flags.

   Sources: city coordinates and elevations from each place's
   Wikipedia/Wikidata entry, rounded; time zones are IANA names and the
   offsets come from the device's own time-zone data (Intl), so summer
   time is always right. Ruta 5 kilometres are approximate road
   distances from Santiago, rounded to the nearest 5 km, for practice.
   ================================================================ */
'use strict';

var MapaData = (function () {

  // ---------------------------------------------------------------
  // Cities. tz: IANA zone; off: [January, July] UTC offset in hours,
  // used only when the device has no time-zone data.
  // ---------------------------------------------------------------
  var CITIES = [
    { id: 'scl', n: ['Santiago', 'Santiago'], c: 'chl', ll: [-70.65, -33.45], tz: 'America/Santiago', off: [-3, -4] },
    { id: 'pnt', n: ['Punta Arenas', 'Punta Arenas'], c: 'chl', ll: [-70.92, -53.16], tz: 'America/Punta_Arenas', off: [-3, -3] },
    { id: 'anf', n: ['Antofagasta', 'Antofagasta'], c: 'chl', ll: [-70.40, -23.65], tz: 'America/Santiago', off: [-3, -4] },
    { id: 'ipc', n: ['Hanga Roa (Rapa Nui)', 'Hanga Roa (Easter Island)'], short: ['Rapa Nui', 'Easter Island'], c: 'chl', ll: [-109.43, -27.15], tz: 'Pacific/Easter', off: [-5, -6] },
    { id: 'bue', n: ['Buenos Aires', 'Buenos Aires'], c: 'arg', ll: [-58.38, -34.60], tz: 'America/Argentina/Buenos_Aires', off: [-3, -3] },
    { id: 'lim', n: ['Lima', 'Lima'], c: 'per', ll: [-77.04, -12.05], tz: 'America/Lima', off: [-5, -5] },
    { id: 'sao', n: ['São Paulo', 'São Paulo'], c: 'bra', ll: [-46.63, -23.55], tz: 'America/Sao_Paulo', off: [-3, -3] },
    { id: 'bog', n: ['Bogotá', 'Bogotá'], c: 'col', ll: [-74.07, 4.71], tz: 'America/Bogota', off: [-5, -5] },
    { id: 'mex', n: ['Ciudad de México', 'Mexico City'], c: 'mex', ll: [-99.13, 19.43], tz: 'America/Mexico_City', off: [-6, -6] },
    { id: 'mia', n: ['Miami', 'Miami'], c: 'usa', ll: [-80.19, 25.76], tz: 'America/New_York', off: [-5, -4] },
    { id: 'nyc', n: ['Nueva York', 'New York'], c: 'usa', ll: [-74.01, 40.71], tz: 'America/New_York', off: [-5, -4] },
    { id: 'sfo', n: ['San Francisco', 'San Francisco'], c: 'usa', ll: [-122.42, 37.77], tz: 'America/Los_Angeles', off: [-8, -7] },
    { id: 'hnl', n: ['Honolulu', 'Honolulu'], c: 'usa', ll: [-157.86, 21.31], tz: 'Pacific/Honolulu', off: [-10, -10] },
    { id: 'lon', n: ['Londres', 'London'], c: 'gbr', ll: [-0.13, 51.51], tz: 'Europe/London', off: [0, 1] },
    { id: 'par', n: ['París', 'Paris'], c: 'fra', ll: [2.35, 48.86], tz: 'Europe/Paris', off: [1, 2] },
    { id: 'mad', n: ['Madrid', 'Madrid'], c: 'esp', ll: [-3.70, 40.42], tz: 'Europe/Madrid', off: [1, 2] },
    { id: 'rom', n: ['Roma', 'Rome'], c: 'ita', ll: [12.50, 41.90], tz: 'Europe/Rome', off: [1, 2] },
    { id: 'cai', n: ['El Cairo', 'Cairo'], c: 'egy', ll: [31.24, 30.04], tz: 'Africa/Cairo', off: [2, 3] },
    { id: 'jnb', n: ['Johannesburgo', 'Johannesburg'], c: 'zaf', ll: [28.05, -26.20], tz: 'Africa/Johannesburg', off: [2, 2] },
    { id: 'dxb', n: ['Dubái', 'Dubai'], c: 'are', ll: [55.27, 25.20], tz: 'Asia/Dubai', off: [4, 4] },
    { id: 'del', n: ['Nueva Delhi', 'New Delhi'], c: 'ind', ll: [77.21, 28.61], tz: 'Asia/Kolkata', off: [5.5, 5.5] },
    { id: 'pek', n: ['Pekín', 'Beijing'], c: 'chn', ll: [116.40, 39.90], tz: 'Asia/Shanghai', off: [8, 8] },
    { id: 'tyo', n: ['Tokio', 'Tokyo'], c: 'jpn', ll: [139.69, 35.69], tz: 'Asia/Tokyo', off: [9, 9] },
    { id: 'syd', n: ['Sídney', 'Sydney'], c: 'aus', ll: [151.21, -33.87], tz: 'Australia/Sydney', off: [11, 10] },
    { id: 'akl', n: ['Auckland', 'Auckland'], c: 'nzl', ll: [174.76, -36.85], tz: 'Pacific/Auckland', off: [13, 12] }
  ];

  // The eight cities on the little kids' picture map.
  var LITTLE_CITIES = ['scl', 'nyc', 'mad', 'cai', 'tyo', 'syd', 'pnt', 'ipc'];

  // ---------------------------------------------------------------
  // Trip missions. dep: local departure time; mon: 0 = 15 January
  // (summer in Chile), 6 = 15 July (winter in Chile).
  // ---------------------------------------------------------------
  var TRIPS = [
    { id: 'sfo', from: 'scl', to: 'sfo', dep: '22:00', mon: 0, why: ['Un vuelo de noche hacia el norte, a California.', 'A night flight north to California.'] },
    { id: 'pnt', from: 'scl', to: 'pnt', dep: '08:00', mon: 6, why: ['Al sur de Chile, cerca del estrecho de Magallanes.', 'To the south of Chile, near the Strait of Magellan.'] },
    { id: 'ipc', from: 'scl', to: 'ipc', dep: '09:30', mon: 0, why: ['A Rapa Nui, en medio del océano Pacífico.', 'To Easter Island, in the middle of the Pacific Ocean.'] },
    { id: 'bue', from: 'scl', to: 'bue', dep: '07:00', mon: 6, why: ['Cruzando la cordillera de los Andes.', 'Across the Andes mountains.'] },
    { id: 'lim', from: 'scl', to: 'lim', dep: '13:00', mon: 0, why: ['Por la costa del Pacífico, hacia el norte.', 'North along the Pacific coast.'] },
    { id: 'mad', from: 'scl', to: 'mad', dep: '12:00', mon: 0, why: ['Cruzando el océano Atlántico hasta España.', 'Across the Atlantic Ocean to Spain.'] },
    { id: 'rom', from: 'scl', to: 'rom', dep: '16:30', mon: 6, why: ['A Roma, donde está el Vaticano.', 'To Rome, home of the Vatican.'] },
    { id: 'nyc', from: 'scl', to: 'nyc', dep: '21:00', mon: 6, why: ['De noche, de un hemisferio al otro.', 'Overnight, from one hemisphere to the other.'] },
    { id: 'syd', from: 'scl', to: 'syd', dep: '11:00', mon: 0, why: ['Cruzando todo el Pacífico y la línea de cambio de fecha.', 'Across the whole Pacific and the International Date Line.'] },
    { id: 'akl', from: 'scl', to: 'akl', dep: '23:30', mon: 6, why: ['Hacia el oeste, a Nueva Zelanda.', 'West to New Zealand.'] },
    { id: 'tyo', from: 'scl', to: 'tyo', dep: '10:00', mon: 0, why: ['Uno de los viajes más largos que se pueden hacer desde Chile.', 'One of the longest trips you can make from Chile.'] },
    { id: 'jnb', from: 'scl', to: 'jnb', dep: '19:00', mon: 6, why: ['Cruzando el Atlántico Sur hasta África.', 'Across the South Atlantic to Africa.'] }
  ];

  // ---------------------------------------------------------------
  // Mystery places. Clue kinds: cl climate, lm landmark, fl flag
  // colours (drawn too), nb neighbours (codes, checked against the map
  // data in the tests), rv river or water, xx another fact.
  // reg: the map zoom that shows it best.
  // ---------------------------------------------------------------
  var MYSTERY = [
    { c: 'arg', reg: 'sa', cl: ['Hace calor en el norte y mucho frío en la Patagonia, al sur.', 'It is hot in the north and very cold in Patagonia, in the south.'],
      lm: ['Las cataratas del Iguazú y el cerro Aconcagua, la montaña más alta de América, están aquí o en su frontera.', 'The Iguazú Falls and Mount Aconcagua, the highest mountain in the Americas, are here.'],
      fl: ['Su bandera es celeste y blanca, con un sol en el medio.', 'Its flag is light blue and white, with a sun in the middle.'],
      nb: ['chl', 'bol', 'pry', 'bra', 'ury'], rv: ['El río de la Plata separa su capital de Uruguay.', 'The Río de la Plata separates its capital from Uruguay.'] },
    { c: 'per', reg: 'sa', cl: ['Tiene costa con desierto, montañas altísimas y selva amazónica.', 'It has a desert coast, very high mountains and Amazon rainforest.'],
      lm: ['Aquí está Machu Picchu, la ciudadela inca en lo alto de los Andes.', 'Machu Picchu, the Inca citadel high in the Andes, is here.'],
      fl: ['Su bandera tiene tres franjas verticales: roja, blanca y roja.', 'Its flag has three vertical stripes: red, white and red.'],
      nb: ['chl', 'bol', 'bra', 'col', 'ecu'], rv: ['El río Amazonas nace en sus montañas.', 'The Amazon River begins in its mountains.'] },
    { c: 'bra', reg: 'sa', cl: ['Casi todo el país es cálido; tiene la selva tropical más grande del mundo.', 'Almost all of it is warm; it has the largest rainforest in the world.'],
      lm: ['El Cristo Redentor mira la ciudad de Río de Janeiro desde un cerro.', 'Christ the Redeemer looks over the city of Rio de Janeiro from a hill.'],
      fl: ['Su bandera es verde, con un rombo amarillo y un círculo azul con estrellas.', 'Its flag is green, with a yellow diamond and a blue circle with stars.'],
      nb: ['arg', 'ury', 'pry', 'bol', 'per', 'col', 'ven'], rv: ['El río Amazonas lo cruza hasta llegar al océano Atlántico.', 'The Amazon River crosses it to reach the Atlantic Ocean.'],
      xx: ['Es el país más grande de América del Sur.', 'It is the largest country in South America.'] },
    { c: 'bol', reg: 'sa', cl: ['Tiene un altiplano frío y seco, y llanos calurosos al este.', 'It has a cold, dry high plateau and hot lowlands to the east.'],
      lm: ['El salar de Uyuni, el desierto de sal más grande del mundo, está aquí.', 'The Uyuni salt flat, the largest salt flat in the world, is here.'],
      fl: ['Su bandera tiene tres franjas: roja, amarilla y verde.', 'Its flag has three stripes: red, yellow and green.'],
      nb: ['chl', 'per', 'bra', 'pry', 'arg'], rv: ['Comparte con Perú el lago Titicaca, uno de los lagos navegables más altos del mundo.', 'It shares Lake Titicaca with Peru, one of the highest navigable lakes in the world.'],
      xx: ['No tiene costa: no llega a ningún mar.', 'It has no coast: it does not reach any sea.'] },
    { c: 'col', reg: 'sa', cl: ['Está cerca del ecuador: en la costa hace calor todo el año.', 'It is close to the equator: the coast is hot all year.'],
      lm: ['Es famosa por su café, que crece en las laderas de los Andes.', 'It is famous for its coffee, grown on the slopes of the Andes.'],
      fl: ['Su bandera es amarilla arriba (la mitad), azul y roja abajo.', 'Its flag is yellow on top (half of it), then blue and red.'],
      nb: ['pan', 'ven', 'bra', 'per', 'ecu'], rv: ['Tiene costa en dos océanos: el Pacífico y el mar Caribe.', 'It has coasts on two seas: the Pacific Ocean and the Caribbean Sea.'] },
    { c: 'ecu', reg: 'sa', cl: ['La línea del ecuador pasa por él: por eso tiene ese nombre.', 'The equator runs through it: that is where its name comes from.'],
      lm: ['Las islas Galápagos, con sus tortugas gigantes, son parte de este país.', 'The Galápagos Islands, with their giant tortoises, belong to it.'],
      fl: ['Su bandera es amarilla, azul y roja, con un cóndor en el escudo.', 'Its flag is yellow, blue and red, with a condor on the coat of arms.'],
      nb: ['col', 'per'], rv: ['Tiene costa en el Pacífico; el río Guayas llega al mar en Guayaquil.', 'It has a Pacific coast; the Guayas River reaches the sea at Guayaquil.'],
      xx: ['Su volcán Chimborazo tiene la cumbre más lejana del centro de la Tierra.', 'The summit of its Chimborazo volcano is the farthest point from the centre of the Earth.'] },
    { c: 'mex', reg: 'na', cl: ['Tiene desiertos en el norte y selvas en el sur.', 'It has deserts in the north and jungles in the south.'],
      lm: ['Aquí están las pirámides mayas de Chichén Itzá y la Basílica de Guadalupe.', 'The Maya pyramids of Chichén Itzá and the Basilica of Guadalupe are here.'],
      fl: ['Su bandera es verde, blanca y roja, con un águila sobre un nopal.', 'Its flag is green, white and red, with an eagle on a cactus.'],
      nb: ['usa', 'gtm', 'blz'], rv: ['El río Bravo marca una parte de su frontera norte.', 'The Rio Grande forms part of its northern border.'] },
    { c: 'usa', reg: 'na', cl: ['Es tan grande que tiene nieve, desiertos y playas tropicales.', 'It is so big that it has snow, deserts and tropical beaches.'],
      lm: ['El Gran Cañón y la Estatua de la Libertad están aquí.', 'The Grand Canyon and the Statue of Liberty are here.'],
      fl: ['Su bandera tiene 50 estrellas y 13 franjas rojas y blancas.', 'Its flag has 50 stars and 13 red and white stripes.'],
      nb: ['can', 'mex'], rv: ['El río Misisipi lo cruza de norte a sur.', 'The Mississippi River crosses it from north to south.'] },
    { c: 'can', reg: 'na', cl: ['Sus inviernos son muy fríos y largos.', 'Its winters are very cold and long.'],
      lm: ['Comparte las cataratas del Niágara con su único vecino.', 'It shares Niagara Falls with its only neighbour.'],
      fl: ['Su bandera es roja y blanca, con una hoja de arce.', 'Its flag is red and white, with a maple leaf.'],
      nb: ['usa'], rv: ['El río San Lorenzo une los Grandes Lagos con el océano Atlántico.', 'The St. Lawrence River joins the Great Lakes to the Atlantic Ocean.'],
      xx: ['Es el segundo país más grande del mundo.', 'It is the second largest country in the world.'] },
    { c: 'cub', reg: 'na', cl: ['Es una isla tropical: hace calor todo el año.', 'It is a tropical island: it is warm all year.'],
      lm: ['Su capital, La Habana, tiene un fuerte antiguo a la entrada del puerto: el Morro.', 'Its capital, Havana, has an old fort at the harbour entrance: El Morro.'],
      fl: ['Su bandera tiene franjas azules y blancas y un triángulo rojo con una estrella.', 'Its flag has blue and white stripes and a red triangle with a star.'],
      nb: [], rv: ['Es la isla más grande del mar Caribe.', 'It is the largest island in the Caribbean Sea.'] },
    { c: 'esp', reg: 'eu', cl: ['Tiene veranos secos y calurosos, y sol casi todo el año.', 'It has hot, dry summers and sun most of the year.'],
      lm: ['La basílica de la Sagrada Familia, en Barcelona, y la catedral de Santiago de Compostela están aquí.', 'The Sagrada Família basilica in Barcelona and the cathedral of Santiago de Compostela are here.'],
      fl: ['Su bandera es roja, amarilla y roja, con la franja amarilla más ancha.', 'Its flag is red, yellow and red, with a wider yellow stripe.'],
      nb: ['prt', 'fra', 'and'], rv: ['El río Tajo nace aquí y llega al mar en Lisboa, en el país vecino.', 'The Tagus River starts here and reaches the sea at Lisbon, in the country next door.'] },
    { c: 'prt', reg: 'eu', cl: ['Su clima es suave, con viento del océano Atlántico.', 'Its climate is mild, with wind off the Atlantic Ocean.'],
      lm: ['El santuario de Fátima está aquí, y también la Torre de Belém en Lisboa.', 'The shrine of Fátima is here, and so is the Belém Tower in Lisbon.'],
      fl: ['Su bandera es verde y roja, con una esfera armilar dorada y un escudo.', 'Its flag is green and red, with a golden armillary sphere and a shield.'],
      nb: ['esp'], rv: ['El río Tajo llega al océano Atlántico en su capital, Lisboa.', 'The Tagus River reaches the Atlantic Ocean at its capital, Lisbon.'],
      xx: ['Es el país más al oeste de la Europa continental.', 'It is the westernmost country of mainland Europe.'] },
    { c: 'fra', reg: 'eu', cl: ['Tiene montañas con nieve (los Alpes) y playas en el sur.', 'It has snowy mountains (the Alps) and beaches in the south.'],
      lm: ['La torre Eiffel y el santuario de Lourdes están aquí.', 'The Eiffel Tower and the shrine of Lourdes are here.'],
      fl: ['Su bandera tiene tres franjas verticales: azul, blanca y roja.', 'Its flag has three vertical stripes: blue, white and red.'],
      nb: ['esp', 'ita', 'che', 'deu', 'bel'], rv: ['El río Sena cruza su capital.', 'The River Seine flows through its capital.'] },
    { c: 'ita', reg: 'eu', cl: ['Tiene inviernos fríos en el norte y veranos calurosos en el sur.', 'It has cold winters in the north and hot summers in the south.'],
      lm: ['El Coliseo está aquí, y el Vaticano queda dentro de su capital.', 'The Colosseum is here, and the Vatican is inside its capital.'],
      fl: ['Su bandera tiene tres franjas verticales: verde, blanca y roja.', 'Its flag has three vertical stripes: green, white and red.'],
      nb: ['fra', 'che', 'aut', 'svn'], rv: ['El río Tíber cruza su capital.', 'The River Tiber flows through its capital.'],
      xx: ['En el mapa tiene forma de bota.', 'On the map it is shaped like a boot.'] },
    { c: 'gbr', reg: 'eu', cl: ['Llueve seguido y el clima es suave.', 'It rains often and the weather is mild.'],
      lm: ['El reloj Big Ben, en Londres, está aquí.', 'The Big Ben clock in London is here.'],
      fl: ['Su bandera combina cruces rojas y blancas sobre un fondo azul.', 'Its flag combines red and white crosses on a blue background.'],
      nb: ['irl'], rv: ['El río Támesis cruza su capital.', 'The River Thames flows through its capital.'] },
    { c: 'deu', reg: 'eu', cl: ['Tiene cuatro estaciones bien marcadas, con inviernos fríos.', 'It has four clear seasons, with cold winters.'],
      lm: ['La puerta de Brandeburgo y la catedral de Colonia están aquí.', 'The Brandenburg Gate and Cologne Cathedral are here.'],
      fl: ['Su bandera tiene tres franjas: negra, roja y dorada.', 'Its flag has three stripes: black, red and gold.'],
      nb: ['fra', 'pol', 'aut', 'che', 'nld', 'dnk'], rv: ['El río Rin pasa por aquí en camino al mar del Norte.', 'The River Rhine passes through on its way to the North Sea.'] },
    { c: 'nld', reg: 'eu', cl: ['Es plano y con mucho viento.', 'It is flat and very windy.'],
      lm: ['Es famoso por sus molinos de viento y sus campos de tulipanes.', 'It is famous for its windmills and fields of tulips.'],
      fl: ['Su bandera tiene tres franjas horizontales: roja, blanca y azul.', 'Its flag has three horizontal stripes: red, white and blue.'],
      nb: ['deu', 'bel'], rv: ['Una gran parte de su tierra está bajo el nivel del mar, protegida con diques.', 'Much of its land is below sea level, protected by dikes.'] },
    { c: 'grc', reg: 'eu', cl: ['Tiene veranos secos y soleados.', 'It has dry, sunny summers.'],
      lm: ['El Partenón, un templo antiguo, está en la Acrópolis de su capital.', 'The Parthenon, an ancient temple, stands on the Acropolis of its capital.'],
      fl: ['Su bandera tiene franjas azules y blancas y una cruz blanca.', 'Its flag has blue and white stripes and a white cross.'],
      nb: ['alb', 'mkd', 'bgr', 'tur'], rv: ['Tiene miles de islas en el mar Mediterráneo.', 'It has thousands of islands in the Mediterranean Sea.'] },
    { c: 'nor', reg: 'eu', cl: ['En verano, en el norte, el sol no se pone de noche.', 'In summer, in the north, the sun does not set at night.'],
      lm: ['Su costa tiene fiordos: brazos de mar largos entre montañas.', 'Its coast has fjords: long arms of the sea between mountains.'],
      fl: ['Su bandera es roja con una cruz azul bordeada de blanco.', 'Its flag is red with a blue cross edged in white.'],
      nb: ['swe', 'fin'], rv: ['Su costa larga, llena de islas, mira al océano Atlántico.', 'Its long coast, full of islands, faces the Atlantic Ocean.'],
      xx: ['Desde el norte se ven auroras boreales en invierno.', 'In winter you can see the northern lights from the north.'] },
    { c: 'isl', reg: 'eu', cl: ['Es una isla fría con glaciares y volcanes.', 'It is a cold island with glaciers and volcanoes.'],
      lm: ['Tiene géiseres: fuentes que lanzan agua caliente al aire.', 'It has geysers: springs that shoot hot water into the air.'],
      fl: ['Su bandera es azul con una cruz roja bordeada de blanco.', 'Its flag is blue with a red cross edged in white.'],
      nb: [], rv: ['Está en el norte del océano Atlántico, cerca del círculo polar ártico.', 'It is in the North Atlantic, close to the Arctic Circle.'] },
    { c: 'rus', reg: 'as', cl: ['Tiene inviernos muy fríos; en Siberia el suelo pasa congelado.', 'It has very cold winters; in Siberia the ground stays frozen.'],
      lm: ['El Kremlin y la catedral de San Basilio, con cúpulas de colores, están en su capital.', 'The Kremlin and St. Basil\'s Cathedral, with colourful domes, are in its capital.'],
      fl: ['Su bandera tiene tres franjas: blanca, azul y roja.', 'Its flag has three stripes: white, blue and red.'],
      nb: [], rv: ['El río Volga, el más largo de Europa, está aquí.', 'The Volga, the longest river in Europe, is here.'],
      xx: ['Es el país más grande del mundo: tiene 11 husos horarios.', 'It is the largest country in the world: it has 11 time zones.'] },
    { c: 'egy', reg: 'af', cl: ['Casi todo es desierto, caluroso y seco.', 'Almost all of it is desert, hot and dry.'],
      lm: ['Las pirámides de Guiza y la Esfinge están aquí.', 'The pyramids of Giza and the Sphinx are here.'],
      fl: ['Su bandera es roja, blanca y negra, con un águila dorada.', 'Its flag is red, white and black, with a golden eagle.'],
      nb: ['lby', 'sdn'], rv: ['El río Nilo lo cruza de sur a norte hasta el Mediterráneo.', 'The River Nile crosses it from south to north, to the Mediterranean.'] },
    { c: 'mar', reg: 'af', cl: ['Tiene montañas con nieve (el Atlas) y el desierto del Sahara.', 'It has snowy mountains (the Atlas) and the Sahara Desert.'],
      lm: ['Su costa mira a dos mares: el Atlántico y el Mediterráneo.', 'Its coast faces two seas: the Atlantic and the Mediterranean.'],
      fl: ['Su bandera es roja con una estrella verde de cinco puntas.', 'Its flag is red with a green five-pointed star.'],
      nb: ['dza'], rv: ['Desde su costa norte se ve España, al otro lado del estrecho de Gibraltar.', 'From its northern coast you can see Spain, across the Strait of Gibraltar.'] },
    { c: 'ken', reg: 'af', cl: ['El ecuador lo cruza; tiene sabanas con jirafas, leones y elefantes.', 'The equator crosses it; it has savannas with giraffes, lions and elephants.'],
      lm: ['El monte Kenia, con nieve cerca del ecuador, le da su nombre.', 'Mount Kenya, with snow near the equator, gives it its name.'],
      fl: ['Su bandera es negra, roja y verde, con un escudo y dos lanzas.', 'Its flag is black, red and green, with a shield and two spears.'],
      nb: ['tza', 'uga', 'eth', 'som'], rv: ['Toca el lago Victoria, el lago más grande de África.', 'It touches Lake Victoria, the largest lake in Africa.'] },
    { c: 'zaf', reg: 'af', cl: ['Está en el sur de África: tiene invierno cuando en Chile también.', 'It is in the south of Africa: it has winter at the same time as Chile.'],
      lm: ['La montaña de la Mesa, plana arriba, mira a Ciudad del Cabo.', 'Table Mountain, flat on top, looks over Cape Town.'],
      fl: ['Su bandera tiene seis colores y una forma de Y acostada.', 'Its flag has six colours and a sideways Y shape.'],
      nb: ['nam', 'bwa', 'zwe', 'moz'], rv: ['El cabo de Buena Esperanza está en su costa.', 'The Cape of Good Hope is on its coast.'],
      xx: ['Tiene un país vecino completamente rodeado por él: Lesoto.', 'It completely surrounds a neighbouring country: Lesotho.'] },
    { c: 'ind', reg: 'as', cl: ['Tiene monzones: meses de lluvias muy fuertes.', 'It has monsoons: months of very heavy rain.'],
      lm: ['El Taj Mahal, de mármol blanco, está aquí.', 'The Taj Mahal, made of white marble, is here.'],
      fl: ['Su bandera es naranja, blanca y verde, con una rueda azul.', 'Its flag is orange, white and green, with a blue wheel.'],
      nb: ['pak', 'chn', 'npl', 'bgd'], rv: ['El río Ganges nace en el Himalaya y cruza el país.', 'The River Ganges starts in the Himalayas and crosses the country.'] },
    { c: 'chn', reg: 'as', cl: ['Tiene desiertos, montañas altísimas y costas templadas.', 'It has deserts, very high mountains and mild coasts.'],
      lm: ['La Gran Muralla está aquí.', 'The Great Wall is here.'],
      fl: ['Su bandera es roja con cinco estrellas amarillas.', 'Its flag is red with five yellow stars.'],
      nb: ['mng', 'ind', 'npl', 'vnm', 'kaz'], rv: ['El río Yangtsé, uno de los más largos del mundo, lo cruza.', 'The Yangtze, one of the longest rivers in the world, crosses it.'],
      xx: ['Aquí viven los osos panda en libertad.', 'Giant pandas live in the wild here.'] },
    { c: 'mng', reg: 'as', cl: ['Tiene inviernos muy fríos y el desierto de Gobi.', 'It has very cold winters and the Gobi Desert.'],
      lm: ['Muchas familias viven en gers: tiendas redondas que se pueden mover.', 'Many families live in gers: round tents that can be moved.'],
      fl: ['Su bandera es roja, azul y roja, con un símbolo dorado.', 'Its flag is red, blue and red, with a golden symbol.'],
      nb: ['chn'], rv: ['No tiene costa y está entre solo dos países: China y Rusia.', 'It has no coast and lies between just two countries: China and Russia.'] },
    { c: 'jpn', reg: 'as', cl: ['Tiene cuatro estaciones, con cerezos en flor en primavera.', 'It has four seasons, with cherry blossom in spring.'],
      lm: ['El monte Fuji, un volcán con nieve en la cumbre, está aquí.', 'Mount Fuji, a volcano with snow on top, is here.'],
      fl: ['Su bandera es blanca con un círculo rojo.', 'Its flag is white with a red circle.'],
      nb: [], rv: ['Son miles de islas, y como Chile tiene muchos terremotos y volcanes.', 'It is thousands of islands and, like Chile, has many earthquakes and volcanoes.'] },
    { c: 'phl', reg: 'as', cl: ['Es tropical, con lluvias fuertes y tifones.', 'It is tropical, with heavy rain and typhoons.'],
      lm: ['Es el país de Asia con más católicos.', 'It is the country in Asia with the most Catholics.'],
      fl: ['Su bandera es azul y roja, con un triángulo blanco con un sol y tres estrellas.', 'Its flag is blue and red, with a white triangle holding a sun and three stars.'],
      nb: [], rv: ['Son más de 7.000 islas en el océano Pacífico.', 'It is more than 7,000 islands in the Pacific Ocean.'] },
    { c: 'aus', reg: 'oc', cl: ['El centro es un desierto rojo y caluroso.', 'The middle is a hot, red desert.'],
      lm: ['La roca Uluru y la Ópera de Sídney están aquí; viven canguros y koalas.', 'Uluru rock and the Sydney Opera House are here; kangaroos and koalas live here.'],
      fl: ['Su bandera es azul, con la bandera británica y las estrellas de la Cruz del Sur.', 'Its flag is blue, with the British flag and the stars of the Southern Cross.'],
      nb: [], rv: ['Está entre el océano Índico y el océano Pacífico.', 'It lies between the Indian Ocean and the Pacific Ocean.'],
      xx: ['Es un país y también un continente entero.', 'It is a country and also a whole continent.'] },
    { c: 'nzl', reg: 'oc', cl: ['Su clima es templado y lluvioso, como el sur de Chile.', 'Its climate is mild and rainy, like the south of Chile.'],
      lm: ['Aquí vive el kiwi, un ave que no vuela.', 'The kiwi, a bird that cannot fly, lives here.'],
      fl: ['Su bandera es azul, con la bandera británica y cuatro estrellas rojas.', 'Its flag is blue, with the British flag and four red stars.'],
      nb: [], rv: ['Tiene dos islas grandes: la isla Norte y la isla Sur.', 'It has two big islands: the North Island and the South Island.'] }
  ];

  // Map zooms, as lon/lat boxes [west, south, east, north].
  var REGIONS = [
    { id: 'world', n: ['Mundo', 'World'], b: [-180, -60, 180, 84] },
    { id: 'sa', n: ['Sudamérica', 'South America'], b: [-92, -56, -32, 14] },
    { id: 'na', n: ['Norte y Centroamérica', 'North & Central America'], b: [-170, 5, -50, 75] },
    { id: 'eu', n: ['Europa', 'Europe'], b: [-26, 34, 42, 72] },
    { id: 'af', n: ['África', 'Africa'], b: [-20, -36, 54, 38] },
    { id: 'as', n: ['Asia', 'Asia'], b: [25, -12, 150, 78] },
    { id: 'oc', n: ['Oceanía', 'Oceania'], b: [105, -50, 180, 5] }
  ];

  // ---------------------------------------------------------------
  // The picture map for compass work: a small valley with the sea to
  // the west and the Andes to the east, like central Chile. Grid x
  // grows east, y grows south; the plaza is the middle.
  // ---------------------------------------------------------------
  var VILLAGE = [
    { id: 'plaza', n: ['la plaza', 'the square'], x: 1, y: 1, art: 'plaza' },
    { id: 'school', n: ['la escuela', 'the school'], x: 1, y: 0, art: 'school' },
    { id: 'farm', n: ['la granja', 'the farm'], x: 1, y: 2, art: 'farm' },
    { id: 'andes', n: ['la cordillera', 'the mountains'], x: 2, y: 1, art: 'andes' },
    { id: 'sea', n: ['el faro', 'the lighthouse'], x: 0, y: 1, art: 'lighthouse' },
    { id: 'forest', n: ['el bosque', 'the forest'], x: 2, y: 0, art: 'forest' },
    { id: 'house', n: ['la casa', 'the house'], x: 0, y: 0, art: 'house' },
    { id: 'lake', n: ['el lago', 'the lake'], x: 2, y: 2, art: 'lake' },
    { id: 'boat', n: ['el muelle', 'the pier'], x: 0, y: 2, art: 'pier' }
  ];

  var DIRS = [
    { id: 'N', n: ['norte', 'north'], deg: 0 }, { id: 'NE', n: ['noreste', 'northeast'], deg: 45 },
    { id: 'E', n: ['este', 'east'], deg: 90 }, { id: 'SE', n: ['sureste', 'southeast'], deg: 135 },
    { id: 'S', n: ['sur', 'south'], deg: 180 }, { id: 'SO', en: 'SW', n: ['suroeste', 'southwest'], deg: 225 },
    { id: 'O', en: 'W', n: ['oeste', 'west'], deg: 270 }, { id: 'NO', en: 'NW', n: ['noroeste', 'northwest'], deg: 315 }
  ];

  // ---------------------------------------------------------------
  // Cross-sections (simplified: the line between the places is not
  // perfectly straight). pts: [km from the left end, metres above sea].
  // marks: labelled points the questions use.
  // ---------------------------------------------------------------
  var PROFILES = [
    { id: 'andes33', t: ['Los Andes a la altura de Santiago', 'The Andes at the latitude of Santiago'],
      s: ['De la costa de Valparaíso hasta Mendoza, en Argentina (oeste a este).', 'From the coast at Valparaíso to Mendoza, Argentina (west to east).'],
      left: ['Oeste', 'West'], right: ['Este', 'East'], sea: ['Océano Pacífico', 'Pacific Ocean'],
      pts: [[0, 0], [8, 260], [18, 700], [30, 1500], [40, 2000], [50, 1300], [62, 800], [78, 620], [100, 570], [112, 800], [124, 1700], [136, 3000], [150, 4300], [164, 5300], [180, 6961], [192, 5200], [204, 4100], [214, 3300], [226, 2600], [238, 1900], [250, 1200], [262, 850], [270, 750]],
      marks: [
        { id: 'valpo', n: ['Valparaíso', 'Valparaíso'], km: 0, m: 0 },
        { id: 'costa', n: ['Cordillera de la Costa', 'Coastal Range'], km: 40, m: 2000 },
        { id: 'stgo', n: ['Santiago', 'Santiago'], km: 100, m: 570 },
        { id: 'acon', n: ['Aconcagua', 'Aconcagua'], km: 180, m: 6961 },
        { id: 'mza', n: ['Mendoza', 'Mendoza'], km: 270, m: 750 }
      ] },
    { id: 'atacama', t: ['El desierto de Atacama', 'The Atacama Desert'],
      s: ['De Antofagasta, en la costa, hasta el volcán Licancabur (oeste a este).', 'From Antofagasta on the coast to the Licancabur volcano (west to east).'],
      left: ['Oeste', 'West'], right: ['Este', 'East'], sea: ['Océano Pacífico', 'Pacific Ocean'],
      pts: [[0, 0], [10, 600], [24, 1200], [40, 1000], [70, 1250], [100, 1500], [130, 1800], [160, 2050], [190, 2260], [220, 2700], [250, 2600], [275, 2450], [290, 2400], [300, 3300], [310, 4600], [320, 5916], [330, 4700], [340, 4300]],
      marks: [
        { id: 'anf', n: ['Antofagasta', 'Antofagasta'], km: 0, m: 0 },
        { id: 'cal', n: ['Calama', 'Calama'], km: 190, m: 2260 },
        { id: 'spa', n: ['San Pedro de Atacama', 'San Pedro de Atacama'], km: 290, m: 2400 },
        { id: 'lic', n: ['Volcán Licancabur', 'Licancabur volcano'], km: 320, m: 5916 }
      ] }
  ];

  // ---------------------------------------------------------------
  // Chile pack.
  // ---------------------------------------------------------------
  // The 16 regions, north to south, with their capitals.
  var REGIONS_CL = [
    { id: 'ap', n: ['Arica y Parinacota', 'Arica y Parinacota'], cap: 'Arica', ll: [-70.31, -18.48], zone: 'n',
      f: ['El lago Chungará está a unos 4.500 metros de altura.', 'Lake Chungará lies about 4,500 metres above sea level.'] },
    { id: 'ta', n: ['Tarapacá', 'Tarapacá'], cap: 'Iquique', ll: [-70.15, -20.21], zone: 'n',
      f: ['Las antiguas salitreras de Humberstone son Patrimonio de la Humanidad.', 'The old saltpetre works at Humberstone are a World Heritage Site.'] },
    { id: 'an', n: ['Antofagasta', 'Antofagasta'], cap: 'Antofagasta', ll: [-70.40, -23.65], zone: 'n',
      f: ['Tiene La Portada, un arco de roca en el mar, y el desierto de Atacama.', 'It has La Portada, a rock arch in the sea, and the Atacama Desert.'] },
    { id: 'at', n: ['Atacama', 'Atacama'], cap: 'Copiapó', ll: [-70.33, -27.37], zone: 'n',
      f: ['Los años de lluvia, el desierto se llena de flores: el desierto florido.', 'In rainy years the desert fills with flowers: the flowering desert.'] },
    { id: 'co', n: ['Coquimbo', 'Coquimbo'], cap: 'La Serena', ll: [-71.25, -29.90], zone: 'n',
      f: ['Sus cielos limpios atraen observatorios astronómicos, como en el valle de Elqui.', 'Its clear skies draw astronomical observatories, as in the Elqui Valley.'] },
    { id: 'va', n: ['Valparaíso', 'Valparaíso'], cap: 'Valparaíso', ll: [-71.62, -33.05], zone: 'c',
      f: ['Rapa Nui y el archipiélago de Juan Fernández son parte de esta región.', 'Easter Island and the Juan Fernández Islands belong to this region.'] },
    { id: 'rm', n: ['Metropolitana de Santiago', 'Santiago Metropolitan'], cap: 'Santiago', ll: [-70.65, -33.45], zone: 'c',
      f: ['Aquí está Santiago, la capital de Chile.', 'Santiago, the capital of Chile, is here.'] },
    { id: 'oh', n: ["Libertador General Bernardo O'Higgins", "Libertador General Bernardo O'Higgins"], short: ["O'Higgins", "O'Higgins"], cap: 'Rancagua', ll: [-70.74, -34.17], zone: 'c',
      f: ['El antiguo campamento minero de Sewell es Patrimonio de la Humanidad.', 'The old mining town of Sewell is a World Heritage Site.'] },
    { id: 'ma', n: ['Maule', 'Maule'], cap: 'Talca', ll: [-71.66, -35.43], zone: 'c',
      f: ['El río Maule le da su nombre; Talca fue fundada en 1742.', 'The Maule River gives it its name; Talca was founded in 1742.'] },
    { id: 'nu', n: ['Ñuble', 'Ñuble'], cap: 'Chillán', ll: [-72.10, -36.61], zone: 'c',
      f: ['Es la región más nueva de Chile: se creó en 2018.', 'It is the newest region of Chile: it was created in 2018.'] },
    { id: 'bi', n: ['Biobío', 'Biobío'], cap: 'Concepción', ll: [-73.05, -36.83], zone: 's',
      f: ['El río Biobío, uno de los más largos de Chile, llega al mar aquí.', 'The Biobío, one of the longest rivers in Chile, reaches the sea here.'] },
    { id: 'ar', n: ['La Araucanía', 'La Araucanía'], cap: 'Temuco', ll: [-72.59, -38.74], zone: 's',
      f: ['Tiene bosques de araucarias y el volcán Villarrica.', 'It has monkey-puzzle forests and the Villarrica volcano.'] },
    { id: 'lr', n: ['Los Ríos', 'Los Ríos'], cap: 'Valdivia', ll: [-73.25, -39.81], zone: 's',
      f: ['Valdivia es una ciudad de ríos, con antiguos fuertes españoles cerca de la costa.', 'Valdivia is a city of rivers, with old Spanish forts near the coast.'] },
    { id: 'll', n: ['Los Lagos', 'Los Lagos'], cap: 'Puerto Montt', ll: [-72.94, -41.47], zone: 's',
      f: ['Tiene el lago Llanquihue, el volcán Osorno y la isla de Chiloé.', 'It has Lake Llanquihue, the Osorno volcano and the island of Chiloé.'] },
    { id: 'ai', n: ['Aysén del General Carlos Ibáñez del Campo', 'Aysén del General Carlos Ibáñez del Campo'], short: ['Aysén', 'Aysén'], cap: 'Coyhaique', ll: [-72.07, -45.57], zone: 's',
      f: ['La Carretera Austral la recorre entre bosques, ríos y glaciares.', 'The Carretera Austral runs through it among forests, rivers and glaciers.'] },
    { id: 'mg', n: ['Magallanes y de la Antártica Chilena', 'Magallanes and Chilean Antarctica'], short: ['Magallanes', 'Magallanes'], cap: 'Punta Arenas', ll: [-70.92, -53.16], zone: 's',
      f: ['Tiene el estrecho de Magallanes, las Torres del Paine y colonias de pingüinos.', 'It has the Strait of Magellan, Torres del Paine and penguin colonies.'] }
  ];

  // Cities on (or right next to) the Ruta 5, the Chilean part of the
  // Pan-American Highway, with approximate road km from Santiago.
  // North of Santiago the km count up going north; south, going south.
  var RUTA5 = [
    { id: 'ari', n: 'Arica', km: 2060, side: 'n', ll: [-70.31, -18.48] },
    { id: 'anf', n: 'Antofagasta', km: 1360, side: 'n', ll: [-70.40, -23.65] },
    { id: 'cpo', n: 'Copiapó', km: 805, side: 'n', ll: [-70.33, -27.37] },
    { id: 'lsc', n: 'La Serena', km: 470, side: 'n', ll: [-71.25, -29.90] },
    { id: 'scl', n: 'Santiago', km: 0, side: 'c', ll: [-70.65, -33.45] },
    { id: 'rgua', n: 'Rancagua', km: 85, side: 's', ll: [-70.74, -34.17] },
    { id: 'tlx', n: 'Talca', km: 255, side: 's', ll: [-71.66, -35.43] },
    { id: 'yai', n: 'Chillán', km: 405, side: 's', ll: [-72.10, -36.61] },
    { id: 'lsq', n: 'Los Ángeles', km: 510, side: 's', ll: [-72.35, -37.47] },
    { id: 'zco', n: 'Temuco', km: 680, side: 's', ll: [-72.59, -38.74] },
    { id: 'zos', n: 'Osorno', km: 915, side: 's', ll: [-73.13, -40.57] },
    { id: 'pmc', n: 'Puerto Montt', km: 1030, side: 's', ll: [-72.94, -41.47] },
    { id: 'cas', n: 'Castro', km: 1190, side: 's', ll: [-73.76, -42.48] },
    { id: 'que', n: 'Quellón', km: 1280, side: 's', ll: [-73.60, -43.12] }
  ];

  // Rapa Nui and Antarctica: fixed points for the special missions.
  var PLACES = {
    scl: { n: ['Santiago', 'Santiago'], ll: [-70.65, -33.45] },
    ipc: { n: ['Hanga Roa, Rapa Nui', 'Hanga Roa, Easter Island'], ll: [-109.43, -27.15] },
    cal: { n: ['Caldera', 'Caldera'], ll: [-70.82, -27.07] },
    jfz: { n: ['Isla Robinson Crusoe', 'Robinson Crusoe Island'], ll: [-78.83, -33.64] },
    pnt: { n: ['Punta Arenas', 'Punta Arenas'], ll: [-70.92, -53.16] },
    horn: { n: ['Cabo de Hornos', 'Cape Horn'], ll: [-67.27, -55.98] },
    vle: { n: ['Villa Las Estrellas', 'Villa Las Estrellas'], ll: [-58.97, -62.20] },
    pole: { n: ['Polo Sur', 'South Pole'], ll: [0, -90] }
  };

  // Big picture-zones for the youngest (north, centre, south, island).
  var ZONES = [
    { id: 'n', n: ['Norte', 'North'], art: 'desert', d: ['El norte: el desierto más seco del mundo, con llamas y salares.', 'The north: the driest desert in the world, with llamas and salt flats.'] },
    { id: 'c', n: ['Centro', 'Centre'], art: 'valley', d: ['El centro: Santiago, viñas y la cordillera con nieve.', 'The centre: Santiago, vineyards and the snowy mountains.'] },
    { id: 's', n: ['Sur', 'South'], art: 'glacier', d: ['El sur: lagos, volcanes, bosques, glaciares y pingüinos.', 'The south: lakes, volcanoes, forests, glaciers and penguins.'] },
    { id: 'i', n: ['Isla', 'Island'], art: 'moai', d: ['Rapa Nui: una isla en medio del océano, con los moáis.', 'Easter Island: an island in the middle of the ocean, with the moai.'] }
  ];
  var ZONE_THINGS = [
    { z: 'n', n: ['las llamas', 'llamas'], art: 'llama' },
    { z: 'n', n: ['el desierto de Atacama', 'the Atacama Desert'], art: 'cactus' },
    { z: 'c', n: ['Santiago, la capital', 'Santiago, the capital'], art: 'city' },
    { z: 'c', n: ['las viñas', 'the vineyards'], art: 'grapes' },
    { z: 's', n: ['los pingüinos', 'the penguins'], art: 'penguin' },
    { z: 's', n: ['los glaciares', 'the glaciers'], art: 'ice' },
    { z: 's', n: ['las araucarias', 'the monkey-puzzle trees'], art: 'araucaria' },
    { z: 'i', n: ['los moáis', 'the moai'], art: 'moai' }
  ];

  var APP_LINKS = {
    chile: { href: 'descubre-chile.html', es: 'Descubre Chile', en: 'Descubre Chile' },
    explorer: { href: 'world-explorer.html', es: 'World Explorer', en: 'World Explorer' },
    atlas: { href: 'world-atlas.html', es: 'World Atlas', en: 'World Atlas' },
    marinero: { href: 'marinero.html', es: 'Marinero (rumbos con compás)', en: 'Marinero (compass bearings)' },
    vacation: { href: 'vacation.html', es: 'Planificador de vacaciones', en: 'Vacation Planner' }
  };

  var BY_CITY = {};
  CITIES.forEach(function (c) { BY_CITY[c.id] = c; });
  var BY_TRIP = {};
  TRIPS.forEach(function (t) { BY_TRIP[t.id] = t; });

  return {
    CITIES: CITIES, BY_CITY: BY_CITY, LITTLE_CITIES: LITTLE_CITIES, TRIPS: TRIPS, BY_TRIP: BY_TRIP,
    MYSTERY: MYSTERY, REGIONS: REGIONS, VILLAGE: VILLAGE, DIRS: DIRS, PROFILES: PROFILES,
    REGIONS_CL: REGIONS_CL, RUTA5: RUTA5, PLACES: PLACES, ZONES: ZONES, ZONE_THINGS: ZONE_THINGS,
    APP_LINKS: APP_LINKS
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MapaData;
