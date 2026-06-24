/* ================================================================
   WORLD EXPLORER — world-explorer.js
   Interactive geography with SVG maps and travel quests.
   Storage key: zs_world_[username] via getUserAppKey('world')
   ================================================================ */

const WorldExplorer = (() => {
  'use strict';

  // ── Continents & Regions ──
  const CONTINENTS = [
    {
      id: 'south_america',
      name: 'South America',
      nameEs: 'América del Sur',
      icon: '🌎',
      color: '#10B981',
      countries: [
        {
          id: 'chile', name: 'Chile', nameEs: 'Chile', flag: '🇨🇱',
          capital: 'Santiago', capitalEs: 'Santiago',
          facts: [
            { en: 'Chile is the longest north-south country in the world.', es: 'Chile es el país más largo del mundo de norte a sur.' },
            { en: 'The Atacama Desert is the driest place on Earth.', es: 'El desierto de Atacama es el lugar más seco del planeta.' },
            { en: 'The Moai statues are found on Chile\'s Easter Island.', es: 'Las estatuas Moai se encuentran en la Isla de Pascua de Chile.' },
            { en: 'The national dance of Chile is the Cueca.', es: 'El baile nacional de Chile es la Cueca.' }
          ],
          landmark: { name: 'Easter Island', nameEs: 'Isla de Pascua', emoji: '🗿' },
          animal: { name: 'Andean Condor', nameEs: 'Cóndor Andino', emoji: '🦅' },
          quiz: [
            { q: 'What is the capital of Chile?', qEs: '¿Cuál es la capital de Chile?', options: ['Lima', 'Bogotá', 'Santiago', 'Buenos Aires'], optionsEs: ['Lima', 'Bogotá', 'Santiago', 'Buenos Aires'], answer: 2 },
            { q: 'What desert is in Chile?', qEs: '¿Qué desierto está en Chile?', options: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], optionsEs: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], answer: 2 },
            { q: 'What bird is on Chile\'s coat of arms?', qEs: '¿Qué ave está en el escudo de Chile?', options: ['Eagle', 'Condor', 'Hawk', 'Falcon'], optionsEs: ['Águila', 'Cóndor', 'Halcón', 'Falcón'], answer: 1 },
            { q: 'What is the currency of Chile?', qEs: '¿Cuál es la moneda de Chile?', options: ['Peso', 'Sol', 'Real', 'Boliviano'], optionsEs: ['Peso', 'Sol', 'Real', 'Boliviano'], answer: 0 },
            { q: 'Which mountain range forms Chile\'s eastern border?', qEs: '¿Qué cordillera forma la frontera oriental de Chile?', options: ['Rocky Mountains', 'Andes', 'Alps', 'Himalayas'], optionsEs: ['Montañas Rocosas', 'Los Andes', 'Alpes', 'Himalaya'], answer: 1 }
          ]
        },
        {
          id: 'argentina', name: 'Argentina', nameEs: 'Argentina', flag: '🇦🇷',
          capital: 'Buenos Aires', capitalEs: 'Buenos Aires',
          facts: [
            { en: 'Argentina is the 8th largest country in the world.', es: 'Argentina es el 8° país más grande del mundo.' },
            { en: 'Aconcagua is the tallest peak in the Americas.', es: 'El Aconcagua es el pico más alto de América.' },
            { en: 'Argentina is famous for the Tango dance.', es: 'Argentina es famosa por el baile del Tango.' },
            { en: 'The Perito Moreno Glacier is a massive ice formation in Patagonia.', es: 'El glaciar Perito Moreno es una enorme formación de hielo en la Patagonia.' }
          ],
          landmark: { name: 'Iguazu Falls', nameEs: 'Cataratas del Iguazú', emoji: '💦' },
          animal: { name: 'Jaguar', nameEs: 'Jaguar', emoji: '🐆' },
          quiz: [
            { q: 'What is the capital of Argentina?', qEs: '¿Cuál es la capital de Argentina?', options: ['Buenos Aires', 'Lima', 'Bogotá', 'Santiago'], optionsEs: ['Buenos Aires', 'Lima', 'Bogotá', 'Santiago'], answer: 0 },
            { q: 'What famous dance originated in Argentina?', qEs: '¿Qué famoso baile se originó en Argentina?', options: ['Salsa', 'Tango', 'Flamenco', 'Samba'], optionsEs: ['Salsa', 'Tango', 'Flamenco', 'Samba'], answer: 1 },
            { q: 'What is the tallest peak in the Americas?', qEs: '¿Cuál es el pico más alto de América?', options: ['Everest', 'Aconcagua', 'Kilimanjaro', 'Denali'], optionsEs: ['Everest', 'Aconcagua', 'Kilimanjaro', 'Denali'], answer: 1 }
          ]
        },
        {
          id: 'brazil', name: 'Brazil', nameEs: 'Brasil', flag: '🇧🇷',
          capital: 'Brasília', capitalEs: 'Brasilia',
          facts: [
            { en: 'Brazil is the largest country in South America.', es: 'Brasil es el país más grande de América del Sur.' },
            { en: 'The Amazon Rainforest is mostly in Brazil.', es: 'La selva amazónica está mayoritariamente en Brasil.' },
            { en: 'Brazil has won the most World Cups in soccer history.', es: 'Brasil ha ganado la mayor cantidad de Copas del Mundo en la historia del fútbol.' },
            { en: 'Portuguese is the official language of Brazil.', es: 'El portugués es el idioma oficial de Brasil.' }
          ],
          landmark: { name: 'Christ the Redeemer', nameEs: 'Cristo Redentor', emoji: '⛪' },
          animal: { name: 'Macaw', nameEs: 'Guacamayo', emoji: '🦜' },
          quiz: [
            { q: 'What is the largest country in South America?', qEs: '¿Cuál es el país más grande de América del Sur?', options: ['Argentina', 'Peru', 'Brazil', 'Colombia'], optionsEs: ['Argentina', 'Perú', 'Brasil', 'Colombia'], answer: 2 },
            { q: 'What language is spoken in Brazil?', qEs: '¿Qué idioma se habla en Brasil?', options: ['Spanish', 'Portuguese', 'English', 'French'], optionsEs: ['Español', 'Portugués', 'Inglés', 'Francés'], answer: 1 },
            { q: 'Which rainforest is mostly in Brazil?', qEs: '¿Qué selva está mayoritariamente en Brasil?', options: ['Congo', 'Amazon', 'Daintree', 'Valdivian'], optionsEs: ['Congo', 'Amazonas', 'Daintree', 'Valdiviana'], answer: 1 },
            { q: 'What is the currency of Brazil?', qEs: '¿Cuál es la moneda de Brasil?', options: ['Peso', 'Real', 'Dollar', 'Sol'], optionsEs: ['Peso', 'Real', 'Dólar', 'Sol'], answer: 1 },
            { q: 'Which river in Brazil carries the most water in the world?', qEs: '¿Qué río de Brasil lleva más agua que ningún otro del mundo?', options: ['Nile', 'Amazon', 'Paraná', 'São Francisco'], optionsEs: ['Nilo', 'Amazonas', 'Paraná', 'São Francisco'], answer: 1 }
          ]
        },
        {
          id: 'peru', name: 'Peru', nameEs: 'Perú', flag: '🇵🇪',
          capital: 'Lima', capitalEs: 'Lima',
          facts: [
            { en: 'Peru was the home of the ancient Inca Empire.', es: 'Perú fue el hogar del antiguo Imperio Inca.' },
            { en: 'Machu Picchu is a famous ancient city in the Andes.', es: 'Machu Picchu es una famosa ciudad antigua en los Andes.' },
            { en: 'Peru has over 3,000 varieties of potatoes.', es: 'Perú tiene más de 3.000 variedades de papas.' }
,
            { en: 'The Amazon River starts in the Peruvian Andes.', es: 'El río Amazonas nace en los Andes peruanos.' }
          ],
          landmark: { name: 'Machu Picchu', nameEs: 'Machu Picchu', emoji: '⛰️' },
          animal: { name: 'Llama', nameEs: 'Llama', emoji: '🦙' },
          quiz: [
            { q: 'What was the ancient empire in Peru?', qEs: '¿Cuál fue el antiguo imperio en Perú?', options: ['Aztec', 'Inca', 'Maya', 'Olmec'], optionsEs: ['Azteca', 'Inca', 'Maya', 'Olmeca'], answer: 1 },
            { q: 'What is the capital of Peru?', qEs: '¿Cuál es la capital de Perú?', options: ['Lima', 'Cusco', 'Arequipa', 'Trujillo'], optionsEs: ['Lima', 'Cusco', 'Arequipa', 'Trujillo'], answer: 0 },
            { q: 'What famous animal lives in the Andes of Peru?', qEs: '¿Qué famoso animal vive en los Andes de Perú?', options: ['Llama', 'Tiger', 'Elephant', 'Kangaroo'], optionsEs: ['Llama', 'Tigre', 'Elefante', 'Canguro'], answer: 0 }
          ]
        },
        {
          id: 'colombia', name: 'Colombia', nameEs: 'Colombia', flag: '🇨🇴',
          capital: 'Bogotá', capitalEs: 'Bogotá',
          facts: [
            { en: 'Colombia is the only South American country with coastlines on both the Pacific and Atlantic oceans.', es: 'Colombia es el único país sudamericano con costas en el Pacífico y el Atlántico.' },
            { en: 'Colombia produces more emeralds than any other country.', es: 'Colombia produce más esmeraldas que cualquier otro país.' },
            { en: 'The Amazon River begins in Colombia.', es: 'El río Amazonas comienza en Colombia.' }
,
            { en: 'Colombia is known for its beautiful coffee regions.', es: 'Colombia es conocida por sus hermosas regiones cafetaleras.' }
          ],
          landmark: { name: 'Cartagena Old City', nameEs: 'Ciudad Vieja de Cartagena', emoji: '🏰' },
          animal: { name: 'Spectacled Bear', nameEs: 'Oso de Anteojos', emoji: '🐻' },
          quiz: [
            { q: 'What is the capital of Colombia?', qEs: '¿Cuál es la capital de Colombia?', options: ['Bogotá', 'Medellín', 'Cali', 'Cartagena'], optionsEs: ['Bogotá', 'Medellín', 'Cali', 'Cartagena'], answer: 0 },
            { q: 'Colombia is famous for producing what gem?', qEs: '¿Colombia es famosa por producir qué gema?', options: ['Diamond', 'Ruby', 'Emerald', 'Sapphire'], optionsEs: ['Diamante', 'Rubí', 'Esmeralda', 'Zafiro'], answer: 2 },
            { q: 'Which oceans does Colombia touch?', qEs: '¿Qué océanos toca Colombia?', options: ['Atlantic only', 'Pacific only', 'Atlantic and Pacific', 'Indian'], optionsEs: ['Solo Atlántico', 'Solo Pacífico', 'Atlántico y Pacífico', 'Índico'], answer: 2 }
          ]
        },
        {
          id: 'venezuela', name: 'Venezuela', nameEs: 'Venezuela', flag: '🇻🇪',
          capital: 'Caracas', capitalEs: 'Caracas',
          facts: [
            { en: 'Angel Falls in Venezuela is the tallest waterfall in the world at 979 meters.', es: 'El Salto Ángel en Venezuela es la cascada más alta del mundo con 979 metros.' },
            { en: 'Venezuela has one of the largest oil reserves in the world.', es: 'Venezuela tiene una de las reservas de petróleo más grandes del mundo.' },
            { en: 'Lake Maracaibo is one of the oldest lakes on Earth.', es: 'El Lago de Maracaibo es uno de los lagos más antiguos de la Tierra.' }
,
            { en: 'The Andes mountains end in Venezuela.', es: 'La cordillera de los Andes termina en Venezuela.' }
          ],
          landmark: { name: 'Angel Falls', nameEs: 'Salto Ángel', emoji: '💧' },
          animal: { name: 'Capybara', nameEs: 'Capibara', emoji: '🐹' },
          quiz: [
            { q: 'What is the capital of Venezuela?', qEs: '¿Cuál es la capital de Venezuela?', options: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto'], optionsEs: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto'], answer: 0 },
            { q: 'What is the world\'s highest waterfall located in Venezuela?', qEs: '¿Cuál es la cascada más alta del mundo ubicada en Venezuela?', options: ['Niagara', 'Angel Falls', 'Iguazu', 'Victoria'], optionsEs: ['Niágara', 'Salto Ángel', 'Iguazú', 'Victoria'], answer: 1 },
            { q: 'What is the official language of Venezuela?', qEs: '¿Cuál es el idioma oficial de Venezuela?', options: ['English', 'Spanish', 'Portuguese', 'French'], optionsEs: ['Inglés', 'Español', 'Portugués', 'Francés'], answer: 1 }
          ]
        },
        {
          id: 'ecuador', name: 'Ecuador', nameEs: 'Ecuador', flag: '🇪🇨',
          capital: 'Quito', capitalEs: 'Quito',
          facts: [
            { en: 'Ecuador is named after the Equator, which runs through it.', es: 'Ecuador lleva el nombre del Ecuador, que lo atraviesa.' },
            { en: 'The Galápagos Islands belong to Ecuador.', es: 'Las Islas Galápagos pertenecen a Ecuador.' },
            { en: 'Quito is one of the highest capital cities in the world.', es: 'Quito es una de las capitales más altas del mundo.' }
,
            { en: 'Ecuador has beautiful volcanic mountains.', es: 'Ecuador tiene hermosas montañas volcánicas.' }
          ],
          landmark: { name: 'Galápagos Islands', nameEs: 'Islas Galápagos', emoji: '🐢' },
          animal: { name: 'Giant Tortoise', nameEs: 'Tortuga Gigante', emoji: '🐢' },
          quiz: [
            { q: 'What islands belong to Ecuador?', qEs: '¿Qué islas pertenecen a Ecuador?', options: ['Canary', 'Galapagos', 'Falkland', 'Azores'], optionsEs: ['Canarias', 'Galápagos', 'Malvinas', 'Azores'], answer: 1 },
            { q: 'What is the capital of Ecuador?', qEs: '¿Cuál es la capital de Ecuador?', options: ['Quito', 'Guayaquil', 'Cuenca', 'Loja'], optionsEs: ['Quito', 'Guayaquil', 'Cuenca', 'Loja'], answer: 0 },
            { q: 'Where is Ecuador located?', qEs: '¿Dónde está ubicado Ecuador?', options: ['On the Prime Meridian', 'On the Equator', 'At the North Pole', 'At the South Pole'], optionsEs: ['En el Meridiano de Greenwich', 'En el Ecuador', 'En el Polo Norte', 'En el Polo Sur'], answer: 1 }
          ]
        },
        {
          id: 'bolivia', name: 'Bolivia', nameEs: 'Bolivia', flag: '🇧🇴',
          capital: 'Sucre', capitalEs: 'Sucre',
          facts: [
            { en: 'Bolivia has two capital cities: Sucre and La Paz.', es: 'Bolivia tiene dos capitales: Sucre y La Paz.' },
            { en: 'The Salar de Uyuni is the largest salt flat in the world.', es: 'El Salar de Uyuni es el salar más grande del mundo.' },
            { en: 'Lake Titicaca, shared with Peru, is the highest navigable lake.', es: 'El Lago Titicaca, compartido con Perú, es el lago navegable más alto.' }
,
            { en: 'Bolivia has a high-altitude climate.', es: 'Bolivia tiene un clima de gran altitud.' }
          ],
          landmark: { name: 'Salar de Uyuni', nameEs: 'Salar de Uyuni', emoji: '🏔️' },
          animal: { name: 'Llama', nameEs: 'Llama', emoji: '🦙' },
          quiz: [
            { q: 'Bolivia has two capitals: Sucre and...?', qEs: 'Bolivia tiene dos capitales: Sucre y...?', options: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Potosí'], optionsEs: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Potosí'], answer: 0 },
            { q: 'What famous salt flat is in Bolivia?', qEs: '¿Qué famoso salar está en Bolivia?', options: ['Uyuni', 'Atacama', 'Bonneville', 'Makgadikgadi'], optionsEs: ['Uyuni', 'Atacama', 'Bonneville', 'Makgadikgadi'], answer: 0 },
            { q: 'Is Bolivia landlocked?', qEs: '¿Es Bolivia un país sin salida al mar?', options: ['Yes', 'No', 'Partially', 'Only in winter'], optionsEs: ['Sí', 'No', 'Parcialmente', 'Solo en invierno'], answer: 0 }
          ]
        },
        {
          id: 'paraguay', name: 'Paraguay', nameEs: 'Paraguay', flag: '🇵🇾',
          capital: 'Asunción', capitalEs: 'Asunción',
          facts: [
            { en: 'Paraguay is one of only two landlocked countries in South America.', es: 'Paraguay es uno de los dos países sin costa en Sudamérica.' },
            { en: 'The Itaipú Dam on the Paraguay-Brazil border is one of the largest hydroelectric dams.', es: 'La represa de Itaipú en la frontera Paraguay-Brasil es una de las más grandes del mundo.' },
            { en: 'Most Paraguayans speak both Spanish and Guaraní.', es: 'La mayoría de los paraguayos hablan español y guaraní.' }
,
            { en: 'Paraguay is sometimes called the Heart of South America.', es: 'A Paraguay a veces se le llama el Corazón de Sudamérica.' }
          ],
          landmark: { name: 'Itaipú Dam', nameEs: 'Represa de Itaipú', emoji: '🌊' },
          animal: { name: 'Toucan', nameEs: 'Tucán', emoji: '🦜' },
          quiz: [
            { q: 'What is the capital of Paraguay?', qEs: '¿Cuál es la capital de Paraguay?', options: ['Asunción', 'Ciudad del Este', 'Encarnación', 'Luque'], optionsEs: ['Asunción', 'Ciudad del Este', 'Encarnación', 'Luque'], answer: 0 },
            { q: 'Paraguay is a bilingual nation. What are the languages?', qEs: 'Paraguay es una nación bilingüe. ¿Cuáles son los idiomas?', options: ['Spanish & English', 'Spanish & Guarani', 'Portuguese & Guarani', 'Spanish & French'], optionsEs: ['Español e Inglés', 'Español y Guaraní', 'Portugués y Guaraní', 'Español y Francés'], answer: 1 },
            { q: 'Is Paraguay landlocked?', qEs: '¿Paraguay es un país sin salida al mar?', options: ['Yes', 'No', 'It has one coast', 'It is an island'], optionsEs: ['Sí', 'No', 'Tiene una costa', 'Es una isla'], answer: 0 }
          ]
        },
        {
          id: 'uruguay', name: 'Uruguay', nameEs: 'Uruguay', flag: '🇺🇾',
          capital: 'Montevideo', capitalEs: 'Montevideo',
          facts: [
            { en: 'Uruguay hosted and won the first FIFA World Cup in 1930.', es: 'Uruguay fue sede y ganador de la primera Copa del Mundo FIFA en 1930.' },
            { en: 'Uruguay is one of the smallest countries in South America.', es: 'Uruguay es uno de los países más pequeños de Sudamérica.' },
            { en: 'Nearly half of all Uruguayans live in Montevideo.', es: 'Casi la mitad de todos los uruguayos viven en Montevideo.' }
,
            { en: 'Uruguay has a very long Atlantic coastline.', es: 'Uruguay tiene una costa atlántica muy larga.' }
          ],
          landmark: { name: 'Colonia del Sacramento', nameEs: 'Colonia del Sacramento', emoji: '🏛️' },
          animal: { name: 'Southern Lapwing', nameEs: 'Tero', emoji: '🐦' },
          quiz: [
            { q: 'What is the capital of Uruguay?', qEs: '¿Cuál es la capital de Uruguay?', options: ['Montevideo', 'Salto', 'Paysandú', 'Maldonado'], optionsEs: ['Montevideo', 'Salto', 'Paysandú', 'Maldonado'], answer: 0 },
            { q: 'Which ocean borders Uruguay?', qEs: '¿Qué océano bordea Uruguay?', options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], optionsEs: ['Pacífico', 'Atlántico', 'Índico', 'Ártico'], answer: 1 },
            { q: 'What is a popular drink in Uruguay?', qEs: '¿Qué bebida es popular en Uruguay?', options: ['Coffee', 'Tea', 'Mate', 'Juice'], optionsEs: ['Café', 'Té', 'Mate', 'Jugo'], answer: 2 }
          ]
        },
        {
          id: 'guyana', name: 'Guyana', nameEs: 'Guyana', flag: '🇬🇾',
          capital: 'Georgetown', capitalEs: 'Georgetown',
          facts: [
            { en: 'Guyana is the only English-speaking country in South America.', es: 'Guyana es el único país de habla inglesa en Sudamérica.' },
            { en: 'About 80% of Guyana is covered by tropical rainforest.', es: 'Cerca del 80% de Guyana está cubierto por selva tropical.' },
            { en: 'Kaieteur Falls is one of the most powerful waterfalls in the world.', es: 'Las Cataratas Kaieteur son una de las cascadas más poderosas del mundo.' }
,
            { en: 'Guyana is known as the land of many waters.', es: 'Guyana es conocida como la tierra de muchas aguas.' }
          ],
          landmark: { name: 'Kaieteur Falls', nameEs: 'Cataratas Kaieteur', emoji: '💦' },
          animal: { name: 'Giant Otter', nameEs: 'Nutria Gigante', emoji: '🦦' },
          quiz: [
            { q: 'What is the official language of Guyana?', qEs: '¿Cuál es el idioma oficial de Guyana?', options: ['Spanish', 'English', 'French', 'Dutch'], optionsEs: ['Español', 'Inglés', 'Francés', 'Holandés'], answer: 1 },
            { q: 'What is the capital of Guyana?', qEs: '¿Cuál es la capital de Guyana?', options: ['Georgetown', 'Linden', 'New Amsterdam', 'Bartica'], optionsEs: ['Georgetown', 'Linden', 'New Amsterdam', 'Bartica'], answer: 0 },
            { q: 'What famous waterfall is in Guyana?', qEs: '¿Qué famosa cascada está en Guyana?', options: ['Angel', 'Niagara', 'Kaieteur', 'Iguazu'], optionsEs: ['Ángel', 'Niágara', 'Kaieteur', 'Iguazú'], answer: 2 }
          ]
        },
        {
          id: 'suriname', name: 'Suriname', nameEs: 'Surinam', flag: '🇸🇷',
          capital: 'Paramaribo', capitalEs: 'Paramaribo',
          facts: [
            { en: 'Suriname is the smallest country in South America.', es: 'Surinam es el país más pequeño de Sudamérica.' },
            { en: 'Dutch is the official language of Suriname.', es: 'El holandés es el idioma oficial de Surinam.' },
            { en: 'Over 90% of Suriname is covered by rainforest.', es: 'Más del 90% de Surinam está cubierto por selva tropical.' }
,
            { en: 'Suriname has a very diverse culture.', es: 'Surinam tiene una cultura muy diversa.' }
          ],
          landmark: { name: 'Central Suriname Reserve', nameEs: 'Reserva Central de Surinam', emoji: '🌳' },
          animal: { name: 'Harpy Eagle', nameEs: 'Águila Harpía', emoji: '🦅' },
          quiz: [
            { q: 'What is the official language of Suriname?', qEs: '¿Cuál es el idioma oficial de Surinam?', options: ['Spanish', 'English', 'French', 'Dutch'], optionsEs: ['Español', 'Inglés', 'Francés', 'Holandés'], answer: 3 },
            { q: 'What is the capital of Suriname?', qEs: '¿Cuál es la capital de Surinam?', options: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo'], optionsEs: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo'], answer: 0 },
            { q: 'Suriname is located on which continent?', qEs: '¿Surinam está ubicado en qué continente?', options: ['Africa', 'Europe', 'South America', 'Asia'], optionsEs: ['África', 'Europa', 'América del Sur', 'Asia'], answer: 2 }
          ]
        },
      ]
    },
    { id: 'north_america', name: 'North America', nameEs: 'América del Norte', icon: '🌎', color: '#8B5CF6', countries: [
      {
        id: 'united_states', name: 'United States', nameEs: 'Estados Unidos', flag: '🇺🇸',
        capital: 'Washington, D.C.', capitalEs: 'Washington, D.C.',
        facts: [
          { en: 'The United States is made up of 50 states.', es: 'Estados Unidos está formado por 50 estados.' },
          { en: 'The Grand Canyon in Arizona is over a mile deep.', es: 'El Gran Cañón en Arizona tiene más de un kilómetro y medio de profundidad.' },
          { en: 'The Statue of Liberty was a gift from France in 1886.', es: 'La Estatua de la Libertad fue un regalo de Francia en 1886.' },
          { en: 'The Apollo 11 mission landed astronauts on the Moon in 1969.', es: 'La misión Apolo 11 llevó astronautas a la Luna en 1969.' }
        ],
        landmark: { name: 'Statue of Liberty', nameEs: 'Estatua de la Libertad', emoji: '🗽' },
        animal: { name: 'Bald Eagle', nameEs: 'Águila Calva', emoji: '🦅' },
        quiz: [
          { q: 'What is the capital of the United States?', qEs: '¿Cuál es la capital de Estados Unidos?', options: ['New York', 'Washington, D.C.', 'Los Angeles', 'Chicago'], optionsEs: ['Nueva York', 'Washington, D.C.', 'Los Ángeles', 'Chicago'], answer: 1 },
          { q: 'How many states make up the U.S.?', qEs: '¿Cuántos estados forman EE.UU.?', options: ['48', '50', '52', '45'], optionsEs: ['48', '50', '52', '45'], answer: 1 },
          { q: 'In which state is the Grand Canyon?', qEs: '¿En qué estado está el Gran Cañón?', options: ['Arizona', 'Texas', 'Florida', 'Nevada'], optionsEs: ['Arizona', 'Texas', 'Florida', 'Nevada'], answer: 0 },
          { q: 'Where is the Statue of Liberty?', qEs: '¿Dónde está la Estatua de la Libertad?', options: ['Miami', 'Boston', 'New York', 'Seattle'], optionsEs: ['Miami', 'Boston', 'Nueva York', 'Seattle'], answer: 2 },
          { q: 'What is the U.S. national bird?', qEs: '¿Cuál es el ave nacional de EE.UU.?', options: ['Bald Eagle', 'Hawk', 'Falcon', 'Owl'], optionsEs: ['Águila Calva', 'Halcón', 'Falcón', 'Búho'], answer: 0 }
        ]
      },
      {
        id: 'canada', name: 'Canada', nameEs: 'Canadá', flag: '🇨🇦',
        capital: 'Ottawa', capitalEs: 'Ottawa',
        facts: [
          { en: 'Canada is the second largest country in the world by total area.', es: 'Canadá es el segundo país más grande del mundo por área total.' },
          { en: 'The maple leaf is the national symbol of Canada.', es: 'La hoja de arce es el símbolo nacional de Canadá.' },
          { en: 'Canada has the longest coastline of any country in the world.', es: 'Canadá tiene la costa más larga de todos los países del mundo.' },
          { en: 'Ice hockey is the most popular sport in Canada.', es: 'El hockey sobre hielo es el deporte más popular en Canadá.' }
        ],
        landmark: { name: 'CN Tower', nameEs: 'Torre CN', emoji: '🗼' },
        animal: { name: 'Beaver', nameEs: 'Castor', emoji: '🦫' },
        quiz: [
          { q: 'What is the capital of Canada?', qEs: '¿Cuál es la capital de Canadá?', options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], optionsEs: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'], answer: 3 },
          { q: 'What symbol is on the Canadian flag?', qEs: '¿Qué símbolo está en la bandera de Canadá?', options: ['Star', 'Maple Leaf', 'Eagle', 'Sun'], optionsEs: ['Estrella', 'Hoja de Arce', 'Águila', 'Sol'], answer: 1 },
          { q: 'What is a popular sport in Canada?', qEs: '¿Cuál es un deporte popular en Canadá?', options: ['Baseball', 'Soccer', 'Ice Hockey', 'Cricket'], optionsEs: ['Béisbol', 'Fútbol', 'Hockey sobre hielo', 'Críquet'], answer: 2 },
          { q: 'Canada has the longest what in the world?', qEs: '¿Canadá tiene el/la más largo/a del mundo en qué?', options: ['River', 'Mountain Range', 'Coastline', 'Desert'], optionsEs: ['Río', 'Cordillera', 'Costa', 'Desierto'], answer: 2 },
          { q: 'What animal is a symbol of Canada?', qEs: '¿Qué animal es un símbolo de Canadá?', options: ['Bear', 'Moose', 'Beaver', 'Wolf'], optionsEs: ['Oso', 'Alce', 'Castor', 'Lobo'], answer: 2 }
        ]
      },
      {
        id: 'mexico', name: 'Mexico', nameEs: 'México', flag: '🇲🇽',
        capital: 'Mexico City', capitalEs: 'Ciudad de México',
        facts: [
          { en: 'Mexico is home to the ancient Mayan city of Chichén Itzá.', es: 'México alberga la antigua ciudad maya de Chichén Itzá.' },
          { en: 'It is the most populous Spanish-speaking country in the world.', es: 'Es el país de habla hispana más poblado del mundo.' },
          { en: 'Mexican cuisine, like tacos and mole, is famous worldwide.', es: 'La comida mexicana, como los tacos y el mole, es famosa en todo el mundo.' },
          { en: 'The axolotl is a unique amphibian native to Mexico.', es: 'El ajolote es un anfibio único nativo de México.' }
        ],
        landmark: { name: 'Chichén Itzá', nameEs: 'Chichén Itzá', emoji: '🏛️' },
        animal: { name: 'Axolotl', nameEs: 'Ajolote', emoji: '🦎' },
        quiz: [
          { q: 'What is the capital of Mexico?', qEs: '¿Cuál es la capital de México?', options: ['Guadalajara', 'Monterrey', 'Mexico City', 'Cancun'], optionsEs: ['Guadalajara', 'Monterrey', 'Ciudad de México', 'Cancún'], answer: 2 },
          { q: 'Which ancient city is located in Mexico?', qEs: '¿Qué antigua ciudad se encuentra en México?', options: ['Machu Picchu', 'Chichén Itzá', 'Petra', 'Colosseum'], optionsEs: ['Machu Picchu', 'Chichén Itzá', 'Petra', 'Coliseo'], answer: 1 },
          { q: 'What unique amphibian is native to Mexico?', qEs: '¿Qué anfibio único es nativo de México?', options: ['Frog', 'Salamander', 'Toad', 'Axolotl'], optionsEs: ['Rana', 'Salamandra', 'Sapo', 'Ajolote'], answer: 3 },
          { q: 'What is the most populous Spanish-speaking country?', qEs: '¿Cuál es el país de habla hispana más poblado?', options: ['Spain', 'Colombia', 'Argentina', 'Mexico'], optionsEs: ['España', 'Colombia', 'Argentina', 'México'], answer: 3 },
          { q: 'Which food is famous worldwide from Mexico?', qEs: '¿Qué comida de México es famosa mundialmente?', options: ['Sushi', 'Tacos', 'Pasta', 'Croissants'], optionsEs: ['Sushi', 'Tacos', 'Pasta', 'Croissants'], answer: 1 }
        ]
      }
    ] },
    { id: 'europe', name: 'Europe', nameEs: 'Europa', icon: '🌍', color: '#3B82F6', countries: [
      {
        id: 'italy', name: 'Italy', nameEs: 'Italia', flag: '🇮🇹',
        capital: 'Rome', capitalEs: 'Roma',
        facts: [
          { en: 'Italy is shaped like a boot.', es: 'Italia tiene forma de bota.' },
          { en: 'Rome was the center of the Roman Empire.', es: 'Roma fue el centro del Imperio Romano.' },
          { en: 'The Colosseum is an ancient amphitheater in Rome.', es: 'El Coliseo es un antiguo anfiteatro en Roma.' },
          { en: 'Mount Vesuvius is a famous volcano near Naples.', es: 'El Monte Vesubio es un famoso volcán cerca de Nápoles.' }
        ],
        landmark: { name: 'Colosseum', nameEs: 'Coliseo', emoji: '🏟️' },
        animal: { name: 'Italian Wolf', nameEs: 'Lobo italiano', emoji: '🐺' },
        quiz: [
          { q: 'What is the capital of Italy?', qEs: '¿Cuál es la capital de Italia?', options: ['Rome', 'Milan', 'Venice', 'Naples'], optionsEs: ['Roma', 'Milán', 'Venecia', 'Nápoles'], answer: 0 },
          { q: 'What shape does Italy resemble on the map?', qEs: '¿A qué forma se asemeja Italia en el mapa?', options: ['A hat', 'A boot', 'A square', 'A star'], optionsEs: ['Un sombrero', 'Una bota', 'Un cuadrado', 'Una estrella'], answer: 1 },
          { q: 'Which famous volcano is near Naples?', qEs: '¿Qué famoso volcán está cerca de Nápoles?', options: ['Etna', 'Vesuvius', 'Stromboli', 'Fuji'], optionsEs: ['Etna', 'Vesubio', 'Stromboli', 'Fuji'], answer: 1 },
          { q: 'What is the currency of Italy?', qEs: '¿Cuál es la moneda de Italia?', options: ['Lira', 'Euro', 'Franc', 'Pound'], optionsEs: ['Lira', 'Euro', 'Franco', 'Libra'], answer: 1 },
          { q: 'What is the longest river in Italy?', qEs: '¿Cuál es el río más largo de Italia?', options: ['Tiber', 'Po', 'Arno', 'Adige'], optionsEs: ['Tíber', 'Po', 'Arno', 'Adigio'], answer: 1 }
        ]
      },
      {
        id: 'spain', name: 'Spain', nameEs: 'España', flag: '🇪🇸',
        capital: 'Madrid', capitalEs: 'Madrid',
        facts: [
          { en: 'Spain is located on the Iberian Peninsula.', es: 'España se encuentra en la península ibérica.' },
          { en: 'The famous Sagrada Familia is in Barcelona.', es: 'La famosa Sagrada Familia está en Barcelona.' },
          { en: 'Spanish is the second most spoken native language in the world.', es: 'El español es el segundo idioma nativo más hablado en el mundo.' },
          { en: 'Flamenco is a famous Spanish art form of music and dance.', es: 'El flamenco es una famosa forma de arte español de música y baile.' }
        ],
        landmark: { name: 'Sagrada Familia', nameEs: 'Sagrada Familia', emoji: '⛪' },
        animal: { name: 'Iberian Lynx', nameEs: 'Lince ibérico', emoji: '🐱' },
        quiz: [
          { q: 'What is the capital of Spain?', qEs: '¿Cuál es la capital de España?', options: ['Barcelona', 'Seville', 'Madrid', 'Valencia'], optionsEs: ['Barcelona', 'Sevilla', 'Madrid', 'Valencia'], answer: 2 },
          { q: 'What famous church is in Barcelona?', qEs: '¿Qué famosa iglesia está en Barcelona?', options: ['Notre Dame', 'Sagrada Familia', 'St. Peter\'s', 'Westminster'], optionsEs: ['Notre Dame', 'Sagrada Familia', 'San Pedro', 'Westminster'], answer: 1 },
          { q: 'Which dance is a famous Spanish art form?', qEs: '¿Qué baile es un famoso arte español?', options: ['Salsa', 'Tango', 'Flamenco', 'Ballet'], optionsEs: ['Salsa', 'Tango', 'Flamenco', 'Ballet'], answer: 2 }
        ]
      },
      {
        id: 'france', name: 'France', nameEs: 'Francia', flag: '🇫🇷',
        capital: 'Paris', capitalEs: 'París',
        facts: [
          { en: 'The Eiffel Tower is located in Paris.', es: 'La Torre Eiffel está en París.' },
          { en: 'France is famous for its bread and cheese.', es: 'Francia es famosa por su pan y queso.' },
          { en: 'It is the most visited country in the world.', es: 'Es el país más visitado del mundo.' },
          { en: 'The Tour de France is a famous bicycle race.', es: 'El Tour de Francia es una famosa carrera de bicicletas.' }
        ],
        landmark: { name: 'Eiffel Tower', nameEs: 'Torre Eiffel', emoji: '🗼' },
        animal: { name: 'Rooster', nameEs: 'Gallo', emoji: '🐓' },
        quiz: [
          { q: 'What is the capital of France?', qEs: '¿Cuál es la capital de Francia?', options: ['London', 'Berlin', 'Madrid', 'Paris'], optionsEs: ['Londres', 'Berlín', 'Madrid', 'París'], answer: 3 },
          { q: 'Which famous monument is in France?', qEs: '¿Qué famoso monumento está en Francia?', options: ['Colosseum', 'Eiffel Tower', 'Big Ben', 'Parthenon'], optionsEs: ['Coliseo', 'Torre Eiffel', 'Big Ben', 'Partenón'], answer: 1 },
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2 },
          { q: 'What is the longest river in France?', qEs: '¿Cuál es el río más largo de Francia?', options: ['Seine', 'Loire', 'Rhône', 'Garonne'], optionsEs: ['Sena', 'Loira', 'Ródano', 'Garona'], answer: 1 },
          { q: 'What is the currency of France?', qEs: '¿Cuál es la moneda de Francia?', options: ['Franc', 'Euro', 'Pound', 'Lira'], optionsEs: ['Franco', 'Euro', 'Libra', 'Lira'], answer: 1 }
        ]
      },
      {
        id: 'germany', name: 'Germany', nameEs: 'Alemania', flag: '🇩🇪',
        capital: 'Berlin', capitalEs: 'Berlín',
        facts: [
          { en: 'Germany is the most populous country in the European Union.', es: 'Alemania es el país más poblado de la Unión Europea.' },
          { en: 'The Rhine and the Danube are two of its major rivers.', es: 'El Rin y el Danubio son dos de sus ríos principales.' },
          { en: 'The Brandenburg Gate in Berlin is a famous landmark.', es: 'La Puerta de Brandeburgo en Berlín es un hito famoso.' },
          { en: 'Germany is famous for its autobahn highways and engineering.', es: 'Alemania es famosa por sus autopistas autobahn y su ingeniería.' }
        ],
        landmark: { name: 'Brandenburg Gate', nameEs: 'Puerta de Brandeburgo', emoji: '🏛️' },
        animal: { name: 'Golden Eagle', nameEs: 'Águila Real', emoji: '🦅' },
        quiz: [
          { q: 'What is the capital of Germany?', qEs: '¿Cuál es la capital de Alemania?', options: ['Munich', 'Berlin', 'Hamburg', 'Frankfurt'], optionsEs: ['Múnich', 'Berlín', 'Hamburgo', 'Fráncfort'], answer: 1 },
          { q: 'What famous gate is in Berlin?', qEs: '¿Qué famosa puerta está en Berlín?', options: ['Golden Gate', 'Brandenburg Gate', 'India Gate', 'Lions\' Gate'], optionsEs: ['Puerta Dorada', 'Puerta de Brandeburgo', 'Puerta de la India', 'Puerta de los Leones'], answer: 1 },
          { q: 'What is the currency of Germany?', qEs: '¿Cuál es la moneda de Alemania?', options: ['Mark', 'Pound', 'Euro', 'Franc'], optionsEs: ['Marco', 'Libra', 'Euro', 'Franco'], answer: 2 },
          { q: 'Which major river flows through Germany?', qEs: '¿Qué río importante fluye por Alemania?', options: ['Thames', 'Rhine', 'Seine', 'Tiber'], optionsEs: ['Támesis', 'Rin', 'Sena', 'Tíber'], answer: 1 },
          { q: 'What language is spoken in Germany?', qEs: '¿Qué idioma se habla en Alemania?', options: ['Dutch', 'German', 'Austrian', 'Swiss'], optionsEs: ['Holandés', 'Alemán', 'Austriaco', 'Suizo'], answer: 1 }
        ]
      },
      {
        id: 'united_kingdom', name: 'United Kingdom', nameEs: 'Reino Unido', flag: '🇬🇧',
        capital: 'London', capitalEs: 'Londres',
        facts: [
          { en: 'The United Kingdom is made up of England, Scotland, Wales, and Northern Ireland.', es: 'El Reino Unido está formado por Inglaterra, Escocia, Gales e Irlanda del Norte.' },
          { en: 'Big Ben is the famous clock tower in London.', es: 'El Big Ben es la famosa torre del reloj en Londres.' },
          { en: 'The River Thames flows through London.', es: 'El río Támesis atraviesa Londres.' },
          { en: 'The United Kingdom is an island nation in Western Europe.', es: 'El Reino Unido es una nación insular en Europa Occidental.' }
        ],
        landmark: { name: 'Big Ben', nameEs: 'Big Ben', emoji: '🕰️' },
        animal: { name: 'Red Fox', nameEs: 'Zorro Rojo', emoji: '🦊' },
        quiz: [
          { q: 'What is the capital of the United Kingdom?', qEs: '¿Cuál es la capital del Reino Unido?', options: ['Dublin', 'London', 'Edinburgh', 'Cardiff'], optionsEs: ['Dublín', 'Londres', 'Edimburgo', 'Cardiff'], answer: 1 },
          { q: 'Which river flows through London?', qEs: '¿Qué río atraviesa Londres?', options: ['Seine', 'Thames', 'Rhine', 'Danube'], optionsEs: ['Sena', 'Támesis', 'Rin', 'Danubio'], answer: 1 },
          { q: 'What is the currency of the United Kingdom?', qEs: '¿Cuál es la moneda del Reino Unido?', options: ['Euro', 'Pound sterling', 'Dollar', 'Krona'], optionsEs: ['Euro', 'Libra esterlina', 'Dólar', 'Corona'], answer: 1 },
          { q: 'Which of these is part of the United Kingdom?', qEs: '¿Cuál de estos forma parte del Reino Unido?', options: ['Ireland', 'Scotland', 'France', 'Norway'], optionsEs: ['Irlanda', 'Escocia', 'Francia', 'Noruega'], answer: 1 },
          { q: 'What famous clock tower is in London?', qEs: '¿Qué famosa torre del reloj está en Londres?', options: ['Big Ben', 'Eiffel Tower', 'CN Tower', 'Spasskaya'], optionsEs: ['Big Ben', 'Torre Eiffel', 'Torre CN', 'Spásskaya'], answer: 0 }
        ]
      },
      {
        id: 'greece', name: 'Greece', nameEs: 'Grecia', flag: '🇬🇷',
        capital: 'Athens', capitalEs: 'Atenas',
        facts: [
          { en: 'Greece is the birthplace of democracy and the ancient Olympic Games.', es: 'Grecia es la cuna de la democracia y de los antiguos Juegos Olímpicos.' },
          { en: 'The Parthenon sits on the Acropolis in Athens.', es: 'El Partenón se encuentra en la Acrópolis de Atenas.' },
          { en: 'Greece has thousands of islands in the Aegean and Ionian seas.', es: 'Grecia tiene miles de islas en los mares Egeo y Jónico.' },
          { en: 'Mount Olympus was believed to be the home of the Greek gods.', es: 'Se creía que el monte Olimpo era el hogar de los dioses griegos.' }
        ],
        landmark: { name: 'Parthenon', nameEs: 'Partenón', emoji: '🏛️' },
        animal: { name: 'Loggerhead Turtle', nameEs: 'Tortuga Boba', emoji: '🐢' },
        quiz: [
          { q: 'What is the capital of Greece?', qEs: '¿Cuál es la capital de Grecia?', options: ['Athens', 'Sparta', 'Thessaloniki', 'Corinth'], optionsEs: ['Atenas', 'Esparta', 'Salónica', 'Corinto'], answer: 0 },
          { q: 'On which hill in Athens is the Parthenon?', qEs: '¿En qué colina de Atenas está el Partenón?', options: ['Acropolis', 'Capitoline', 'Palatine', 'Aventine'], optionsEs: ['Acrópolis', 'Capitolina', 'Palatina', 'Aventina'], answer: 0 },
          { q: 'What is the currency of Greece?', qEs: '¿Cuál es la moneda de Grecia?', options: ['Drachma', 'Euro', 'Lira', 'Dinar'], optionsEs: ['Dracma', 'Euro', 'Lira', 'Dinar'], answer: 1 },
          { q: 'Which mountain was home to the Greek gods?', qEs: '¿Qué montaña era el hogar de los dioses griegos?', options: ['Mount Olympus', 'Mount Etna', 'Mount Athos', 'Mount Ida'], optionsEs: ['Monte Olimpo', 'Monte Etna', 'Monte Athos', 'Monte Ida'], answer: 0 },
          { q: 'Greece is the birthplace of what form of government?', qEs: '¿Grecia es la cuna de qué forma de gobierno?', options: ['Monarchy', 'Democracy', 'Empire', 'Theocracy'], optionsEs: ['Monarquía', 'Democracia', 'Imperio', 'Teocracia'], answer: 1 }
        ]
      },
      {
        id: 'portugal', name: 'Portugal', nameEs: 'Portugal', flag: '🇵🇹',
        capital: 'Lisbon', capitalEs: 'Lisboa',
        facts: [
          { en: 'Portugal is on the western edge of the Iberian Peninsula.', es: 'Portugal está en el extremo occidental de la península ibérica.' },
          { en: 'Portuguese explorers led the Age of Discovery in the 1400s.', es: 'Los exploradores portugueses lideraron la Era de los Descubrimientos en el siglo XV.' },
          { en: 'Lisbon is one of the oldest cities in Western Europe.', es: 'Lisboa es una de las ciudades más antiguas de Europa Occidental.' },
          { en: 'Fado is a traditional style of Portuguese music.', es: 'El fado es un estilo tradicional de música portuguesa.' }
        ],
        landmark: { name: 'Belém Tower', nameEs: 'Torre de Belém', emoji: '🗼' },
        animal: { name: 'Iberian Wolf', nameEs: 'Lobo Ibérico', emoji: '🐺' },
        quiz: [
          { q: 'What is the capital of Portugal?', qEs: '¿Cuál es la capital de Portugal?', options: ['Porto', 'Lisbon', 'Faro', 'Braga'], optionsEs: ['Oporto', 'Lisboa', 'Faro', 'Braga'], answer: 1 },
          { q: 'On which peninsula is Portugal located?', qEs: '¿En qué península se encuentra Portugal?', options: ['Italian', 'Balkan', 'Iberian', 'Scandinavian'], optionsEs: ['Itálica', 'Balcánica', 'Ibérica', 'Escandinava'], answer: 2 },
          { q: 'What is the official language of Portugal?', qEs: '¿Cuál es el idioma oficial de Portugal?', options: ['Spanish', 'Portuguese', 'Galician', 'Catalan'], optionsEs: ['Español', 'Portugués', 'Gallego', 'Catalán'], answer: 1 },
          { q: 'What country borders Portugal by land?', qEs: '¿Qué país limita con Portugal por tierra?', options: ['France', 'Spain', 'Morocco', 'Italy'], optionsEs: ['Francia', 'España', 'Marruecos', 'Italia'], answer: 1 },
          { q: 'What traditional music style comes from Portugal?', qEs: '¿Qué estilo de música tradicional viene de Portugal?', options: ['Flamenco', 'Fado', 'Tango', 'Bolero'], optionsEs: ['Flamenco', 'Fado', 'Tango', 'Bolero'], answer: 1 }
        ]
      }
    ] },
    { id: 'africa', name: 'Africa', nameEs: 'África', icon: '🌍', color: '#EF4444', countries: [
      {
        id: 'kenya', name: 'Kenya', nameEs: 'Kenia', flag: '🇰🇪',
        capital: 'Nairobi', capitalEs: 'Nairobi',
        facts: [
          { en: 'Kenya is famous for its wildlife savannas.', es: 'Kenia es famosa por sus sabanas de vida silvestre.' },
          { en: 'Mount Kenya is the second highest mountain in Africa.', es: 'El monte Kenia es la segunda montaña más alta de África.' },
          { en: 'Swahili and English are its official languages.', es: 'El suajili y el inglés son sus idiomas oficiales.' },
          { en: 'The Great Rift Valley runs through Kenya.', es: 'El Gran Valle del Rift atraviesa Kenia.' }
        ],
        landmark: { name: 'Mount Kenya', nameEs: 'Monte Kenia', emoji: '⛰️' },
        animal: { name: 'Lion', nameEs: 'León', emoji: '🦁' },
        quiz: [
          { q: 'What is the capital of Kenya?', qEs: '¿Cuál es la capital de Kenia?', options: ['Cairo', 'Nairobi', 'Lagos', 'Pretoria'], optionsEs: ['El Cairo', 'Nairobi', 'Lagos', 'Pretoria'], answer: 1 },
          { q: 'What landscape is Kenya famous for?', qEs: '¿Por qué paisaje es famosa Kenia?', options: ['Deserts', 'Rainforests', 'Tundras', 'Savannas'], optionsEs: ['Desiertos', 'Selvas', 'Tundras', 'Sabanas'], answer: 3 },
          { q: 'What is the second highest mountain in Africa?', qEs: '¿Cuál es la segunda montaña más alta de África?', options: ['Kilimanjaro', 'Mount Kenya', 'Atlas', 'Ruwenzori'], optionsEs: ['Kilimanjaro', 'Monte Kenia', 'Atlas', 'Ruwenzori'], answer: 1 },
          { q: 'What is the currency of Kenya?', qEs: '¿Cuál es la moneda de Kenia?', options: ['Shilling', 'Rand', 'Naira', 'Pound'], optionsEs: ['Chelín', 'Rand', 'Naira', 'Libra'], answer: 0 },
          { q: 'What great valley runs through Kenya?', qEs: '¿Qué gran valle atraviesa Kenia?', options: ['Great Rift Valley', 'Death Valley', 'Indus Valley', 'Jordan Valley'], optionsEs: ['Gran Valle del Rift', 'Valle de la Muerte', 'Valle del Indo', 'Valle del Jordán'], answer: 0 }
        ]
      },
      {
        id: 'egypt', name: 'Egypt', nameEs: 'Egipto', flag: '🇪🇬',
        capital: 'Cairo', capitalEs: 'El Cairo',
        facts: [
          { en: 'The Pyramids of Giza are in Egypt.', es: 'Las pirámides de Guiza están en Egipto.' },
          { en: 'The Nile is the longest river in Africa.', es: 'El Nilo es el río más largo de África.' },
          { en: 'Egypt has a rich ancient history.', es: 'Egipto tiene una rica historia antigua.' }
        , { en: 'Arabic is the official language.', es: 'El árabe es el idioma oficial.' } ],
        landmark: { name: 'Pyramids', nameEs: 'Pirámides', emoji: '🔺' },
        animal: { name: 'Camel', nameEs: 'Camello', emoji: '🐫' },
        quiz: [
          { q: 'What river flows through Egypt?', qEs: '¿Qué río fluye por Egipto?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], optionsEs: ['Amazonas', 'Nilo', 'Yangtsé', 'Misisipi'], answer: 1 },
          { q: 'What famous monument is in Egypt?', qEs: '¿Qué monumento famoso está en Egipto?', options: ['Colosseum', 'Eiffel Tower', 'Pyramids', 'Taj Mahal'], optionsEs: ['Coliseo', 'Torre Eiffel', 'Pirámides', 'Taj Mahal'], answer: 2 },
          { q: 'What is the capital of Egypt?', qEs: '¿Cuál es la capital de Egipto?', options: ['Cairo', 'Nairobi', 'Cape Town', 'Rabat'], optionsEs: ['El Cairo', 'Nairobi', 'Ciudad del Cabo', 'Rabat'], answer: 0 }
        ]
      },
      {
        id: 'south_africa', name: 'South Africa', nameEs: 'Sudáfrica', flag: '🇿🇦',
        capital: 'Pretoria', capitalEs: 'Pretoria',
        facts: [
          { en: 'South Africa has three capital cities: Pretoria, Cape Town, and Bloemfontein.', es: 'Sudáfrica tiene tres capitales: Pretoria, Ciudad del Cabo y Bloemfontein.' },
          { en: 'Table Mountain overlooks the city of Cape Town.', es: 'La Montaña de la Mesa domina la ciudad de Ciudad del Cabo.' },
          { en: 'South Africa has 11 official languages.', es: 'Sudáfrica tiene 11 idiomas oficiales.' },
          { en: 'The country is famous for safari wildlife like the Big Five.', es: 'El país es famoso por la fauna de safari como los Cinco Grandes.' }
        ],
        landmark: { name: 'Table Mountain', nameEs: 'Montaña de la Mesa', emoji: '⛰️' },
        animal: { name: 'Springbok', nameEs: 'Springbok', emoji: '🦌' },
        quiz: [
          { q: 'What is the administrative capital of South Africa?', qEs: '¿Cuál es la capital administrativa de Sudáfrica?', options: ['Pretoria', 'Cairo', 'Lagos', 'Nairobi'], optionsEs: ['Pretoria', 'El Cairo', 'Lagos', 'Nairobi'], answer: 0 },
          { q: 'What flat-topped mountain overlooks Cape Town?', qEs: '¿Qué montaña de cima plana domina Ciudad del Cabo?', options: ['Table Mountain', 'Kilimanjaro', 'Mount Kenya', 'Atlas'], optionsEs: ['Montaña de la Mesa', 'Kilimanjaro', 'Monte Kenia', 'Atlas'], answer: 0 },
          { q: 'What is the currency of South Africa?', qEs: '¿Cuál es la moneda de Sudáfrica?', options: ['Dollar', 'Rand', 'Naira', 'Dirham'], optionsEs: ['Dólar', 'Rand', 'Naira', 'Dírham'], answer: 1 },
          { q: 'How many official languages does South Africa have?', qEs: '¿Cuántos idiomas oficiales tiene Sudáfrica?', options: ['2', '5', '11', '20'], optionsEs: ['2', '5', '11', '20'], answer: 2 },
          { q: 'At the southern tip of South Africa, two oceans meet. Which?', qEs: 'En la punta sur de Sudáfrica se encuentran dos océanos. ¿Cuáles?', options: ['Pacific and Arctic', 'Atlantic and Indian', 'Indian and Arctic', 'Atlantic and Pacific'], optionsEs: ['Pacífico y Ártico', 'Atlántico e Índico', 'Índico y Ártico', 'Atlántico y Pacífico'], answer: 1 }
        ]
      },
      {
        id: 'morocco', name: 'Morocco', nameEs: 'Marruecos', flag: '🇲🇦',
        capital: 'Rabat', capitalEs: 'Rabat',
        facts: [
          { en: 'Morocco is in northwest Africa, close to Spain across the Strait of Gibraltar.', es: 'Marruecos está en el noroeste de África, cerca de España a través del estrecho de Gibraltar.' },
          { en: 'The Sahara Desert covers much of southern Morocco.', es: 'El desierto del Sahara cubre gran parte del sur de Marruecos.' },
          { en: 'The Atlas Mountains run across the country.', es: 'La cordillera del Atlas atraviesa el país.' },
          { en: 'Marrakesh is famous for its lively markets called souks.', es: 'Marrakech es famosa por sus animados mercados llamados zocos.' }
        ],
        landmark: { name: 'Koutoubia Mosque', nameEs: 'Mezquita Kutubía', emoji: '🕌' },
        animal: { name: 'Barbary Macaque', nameEs: 'Macaco de Berbería', emoji: '🐒' },
        quiz: [
          { q: 'What is the capital of Morocco?', qEs: '¿Cuál es la capital de Marruecos?', options: ['Casablanca', 'Rabat', 'Marrakesh', 'Fez'], optionsEs: ['Casablanca', 'Rabat', 'Marrakech', 'Fez'], answer: 1 },
          { q: 'Which mountain range runs across Morocco?', qEs: '¿Qué cordillera atraviesa Marruecos?', options: ['Andes', 'Alps', 'Atlas', 'Himalayas'], optionsEs: ['Andes', 'Alpes', 'Atlas', 'Himalaya'], answer: 2 },
          { q: 'What is the currency of Morocco?', qEs: '¿Cuál es la moneda de Marruecos?', options: ['Dirham', 'Euro', 'Pound', 'Rand'], optionsEs: ['Dírham', 'Euro', 'Libra', 'Rand'], answer: 0 },
          { q: 'Which desert covers part of southern Morocco?', qEs: '¿Qué desierto cubre parte del sur de Marruecos?', options: ['Gobi', 'Sahara', 'Atacama', 'Kalahari'], optionsEs: ['Gobi', 'Sahara', 'Atacama', 'Kalahari'], answer: 1 },
          { q: 'Morocco is separated from Spain by which strait?', qEs: '¿Qué estrecho separa a Marruecos de España?', options: ['Bering', 'Gibraltar', 'Malacca', 'Hormuz'], optionsEs: ['Bering', 'Gibraltar', 'Malaca', 'Ormuz'], answer: 1 }
        ]
      },
      {
        id: 'nigeria', name: 'Nigeria', nameEs: 'Nigeria', flag: '🇳🇬',
        capital: 'Abuja', capitalEs: 'Abuya',
        facts: [
          { en: 'Nigeria is the most populous country in Africa.', es: 'Nigeria es el país más poblado de África.' },
          { en: 'The Niger River gives the country its name.', es: 'El río Níger da nombre al país.' },
          { en: 'Lagos is one of the largest cities in Africa.', es: 'Lagos es una de las ciudades más grandes de África.' },
          { en: 'English is the official language of Nigeria.', es: 'El inglés es el idioma oficial de Nigeria.' }
        ],
        landmark: { name: 'Zuma Rock', nameEs: 'Roca Zuma', emoji: '🪨' },
        animal: { name: 'African Elephant', nameEs: 'Elefante Africano', emoji: '🐘' },
        quiz: [
          { q: 'What is the capital of Nigeria?', qEs: '¿Cuál es la capital de Nigeria?', options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], optionsEs: ['Lagos', 'Abuya', 'Kano', 'Ibadán'], answer: 1 },
          { q: 'Which river gives Nigeria its name?', qEs: '¿Qué río da nombre a Nigeria?', options: ['Nile', 'Congo', 'Niger', 'Zambezi'], optionsEs: ['Nilo', 'Congo', 'Níger', 'Zambeze'], answer: 2 },
          { q: 'What is the currency of Nigeria?', qEs: '¿Cuál es la moneda de Nigeria?', options: ['Naira', 'Cedi', 'Rand', 'Shilling'], optionsEs: ['Naira', 'Cedi', 'Rand', 'Chelín'], answer: 0 },
          { q: 'What is the official language of Nigeria?', qEs: '¿Cuál es el idioma oficial de Nigeria?', options: ['French', 'English', 'Arabic', 'Portuguese'], optionsEs: ['Francés', 'Inglés', 'Árabe', 'Portugués'], answer: 1 },
          { q: 'Nigeria is the most populous country on which continent?', qEs: '¿Nigeria es el país más poblado de qué continente?', options: ['Asia', 'Africa', 'Europe', 'South America'], optionsEs: ['Asia', 'África', 'Europa', 'América del Sur'], answer: 1 }
        ]
      }
    ] },
    { id: 'asia', name: 'Asia', nameEs: 'Asia', icon: '🌏', color: '#F59E0B', countries: [
      {
        id: 'japan', name: 'Japan', nameEs: 'Japón', flag: '🇯🇵',
        capital: 'Tokyo', capitalEs: 'Tokio',
        facts: [
          { en: 'Japan is an island nation in East Asia.', es: 'Japón es un país insular en el este de Asia.' },
          { en: 'Mount Fuji is the highest mountain in Japan.', es: 'El monte Fuji es la montaña más alta de Japón.' },
          { en: 'Bullet trains in Japan can travel up to 320 km/h.', es: 'Los trenes bala en Japón pueden viajar hasta 320 km/h.' },
          { en: 'Cherry blossoms are a famous symbol of spring in Japan.', es: 'Las flores de cerezo son un famoso símbolo de la primavera en Japón.' }
        ],
        landmark: { name: 'Mount Fuji', nameEs: 'Monte Fuji', emoji: '🗻' },
        animal: { name: 'Macaque', nameEs: 'Macaco', emoji: '🐒' },
        quiz: [
          { q: 'What is the capital of Japan?', qEs: '¿Cuál es la capital de Japón?', options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'], optionsEs: ['Kioto', 'Osaka', 'Tokio', 'Hiroshima'], answer: 2 },
          { q: 'What is the highest mountain in Japan?', qEs: '¿Cuál es la montaña más alta de Japón?', options: ['Mount Everest', 'Mount Fuji', 'Mount Kilimanjaro', 'Mount Blanc'], optionsEs: ['Monte Everest', 'Monte Fuji', 'Monte Kilimanjaro', 'Mont Blanc'], answer: 1 },
          { q: 'Which flower is a symbol of spring in Japan?', qEs: '¿Qué flor es símbolo de la primavera en Japón?', options: ['Rose', 'Tulip', 'Cherry blossom', 'Sunflower'], optionsEs: ['Rosa', 'Tulipán', 'Flor de cerezo', 'Girasol'], answer: 2 },
          { q: 'What is the currency of Japan?', qEs: '¿Cuál es la moneda de Japón?', options: ['Won', 'Yuan', 'Yen', 'Baht'], optionsEs: ['Won', 'Yuan', 'Yen', 'Baht'], answer: 2 },
          { q: 'What is Japan\'s largest island called?', qEs: '¿Cómo se llama la isla más grande de Japón?', options: ['Hokkaido', 'Honshu', 'Kyushu', 'Shikoku'], optionsEs: ['Hokkaido', 'Honshu', 'Kyushu', 'Shikoku'], answer: 1 }
        ]
      },
      {
        id: 'china', name: 'China', nameEs: 'China', flag: '🇨🇳',
        capital: 'Beijing', capitalEs: 'Pekín',
        facts: [
          { en: 'The Great Wall of China is over 21,000 km long.', es: 'La Gran Muralla China tiene más de 21.000 km de largo.' },
          { en: 'Giant pandas are native to South Central China.', es: 'Los osos panda gigantes son nativos del centro-sur de China.' },
          { en: 'China has the largest population in the world.', es: 'China tiene la población más grande del mundo.' },
          { en: 'The Yangtze is the longest river in Asia.', es: 'El Yangtsé es el río más largo de Asia.' }
        ],
        landmark: { name: 'Great Wall', nameEs: 'Gran Muralla', emoji: '🧱' },
        animal: { name: 'Giant Panda', nameEs: 'Oso Panda', emoji: '🐼' },
        quiz: [
          { q: 'What is the capital of China?', qEs: '¿Cuál es la capital de China?', options: ['Shanghai', 'Beijing', 'Hong Kong', 'Shenzhen'], optionsEs: ['Shanghái', 'Pekín', 'Hong Kong', 'Shenzhen'], answer: 1 },
          { q: 'Which famous wall is located in China?', qEs: '¿Qué famosa muralla se encuentra en China?', options: ['Berlin Wall', 'Hadrian\'s Wall', 'Great Wall', 'Western Wall'], optionsEs: ['Muro de Berlín', 'Muro de Adriano', 'Gran Muralla', 'Muro de los Lamentos'], answer: 2 },
          { q: 'What black and white bear is native to China?', qEs: '¿Qué oso blanco y negro es nativo de China?', options: ['Polar Bear', 'Grizzly Bear', 'Giant Panda', 'Koala'], optionsEs: ['Oso Polar', 'Oso Grizzly', 'Oso Panda', 'Koala'], answer: 2 }
        ]
      },
      {
        id: 'india', name: 'India', nameEs: 'India', flag: '🇮🇳',
        capital: 'New Delhi', capitalEs: 'Nueva Delhi',
        facts: [
          { en: 'India is the most populous country in the world.', es: 'India es el país más poblado del mundo.' },
          { en: 'The Taj Mahal in Agra is a famous marble mausoleum.', es: 'El Taj Mahal en Agra es un famoso mausoleo de mármol.' },
          { en: 'The Ganges is a major sacred river in India.', es: 'El Ganges es un importante río sagrado en India.' },
          { en: 'India is home to the Bengal tiger, its national animal.', es: 'India es el hogar del tigre de Bengala, su animal nacional.' }
        ],
        landmark: { name: 'Taj Mahal', nameEs: 'Taj Mahal', emoji: '🕌' },
        animal: { name: 'Bengal Tiger', nameEs: 'Tigre de Bengala', emoji: '🐅' },
        quiz: [
          { q: 'What is the capital of India?', qEs: '¿Cuál es la capital de India?', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], optionsEs: ['Bombay', 'Nueva Delhi', 'Calcuta', 'Chennai'], answer: 1 },
          { q: 'Which famous marble mausoleum is in India?', qEs: '¿Qué famoso mausoleo de mármol está en India?', options: ['Taj Mahal', 'Petra', 'Colosseum', 'Angkor Wat'], optionsEs: ['Taj Mahal', 'Petra', 'Coliseo', 'Angkor Wat'], answer: 0 },
          { q: 'What is the currency of India?', qEs: '¿Cuál es la moneda de India?', options: ['Rupee', 'Yen', 'Baht', 'Won'], optionsEs: ['Rupia', 'Yen', 'Baht', 'Won'], answer: 0 },
          { q: 'What sacred river flows through India?', qEs: '¿Qué río sagrado fluye por India?', options: ['Mekong', 'Ganges', 'Yangtze', 'Indus only'], optionsEs: ['Mekong', 'Ganges', 'Yangtsé', 'Solo el Indo'], answer: 1 },
          { q: 'What is the national animal of India?', qEs: '¿Cuál es el animal nacional de India?', options: ['Lion', 'Elephant', 'Bengal Tiger', 'Peacock'], optionsEs: ['León', 'Elefante', 'Tigre de Bengala', 'Pavo real'], answer: 2 }
        ]
      },
      {
        id: 'south_korea', name: 'South Korea', nameEs: 'Corea del Sur', flag: '🇰🇷',
        capital: 'Seoul', capitalEs: 'Seúl',
        facts: [
          { en: 'South Korea is on the southern half of the Korean Peninsula.', es: 'Corea del Sur está en la mitad sur de la península de Corea.' },
          { en: 'Seoul is one of the largest and most modern cities in Asia.', es: 'Seúl es una de las ciudades más grandes y modernas de Asia.' },
          { en: 'Taekwondo, a martial art, originated in Korea.', es: 'El taekwondo, un arte marcial, se originó en Corea.' },
          { en: 'South Korea is known worldwide for its technology and K-pop music.', es: 'Corea del Sur es conocida mundialmente por su tecnología y la música K-pop.' }
        ],
        landmark: { name: 'Gyeongbokgung Palace', nameEs: 'Palacio Gyeongbokgung', emoji: '🏯' },
        animal: { name: 'Korean Magpie', nameEs: 'Urraca Coreana', emoji: '🐦' },
        quiz: [
          { q: 'What is the capital of South Korea?', qEs: '¿Cuál es la capital de Corea del Sur?', options: ['Busan', 'Seoul', 'Incheon', 'Daegu'], optionsEs: ['Busan', 'Seúl', 'Incheon', 'Daegu'], answer: 1 },
          { q: 'Which martial art originated in Korea?', qEs: '¿Qué arte marcial se originó en Corea?', options: ['Karate', 'Judo', 'Taekwondo', 'Kung Fu'], optionsEs: ['Karate', 'Judo', 'Taekwondo', 'Kung Fu'], answer: 2 },
          { q: 'What is the currency of South Korea?', qEs: '¿Cuál es la moneda de Corea del Sur?', options: ['Yen', 'Won', 'Yuan', 'Baht'], optionsEs: ['Yen', 'Won', 'Yuan', 'Baht'], answer: 1 },
          { q: 'On which peninsula is South Korea located?', qEs: '¿En qué península se encuentra Corea del Sur?', options: ['Indochina', 'Korean', 'Arabian', 'Iberian'], optionsEs: ['Indochina', 'Coreana', 'Arábiga', 'Ibérica'], answer: 1 },
          { q: 'Which country borders South Korea to the north?', qEs: '¿Qué país limita con Corea del Sur al norte?', options: ['China', 'Japan', 'North Korea', 'Russia'], optionsEs: ['China', 'Japón', 'Corea del Norte', 'Rusia'], answer: 2 }
        ]
      },
      {
        id: 'thailand', name: 'Thailand', nameEs: 'Tailandia', flag: '🇹🇭',
        capital: 'Bangkok', capitalEs: 'Bangkok',
        facts: [
          { en: 'Thailand is in Southeast Asia and was never colonized by Europeans.', es: 'Tailandia está en el sudeste asiático y nunca fue colonizada por europeos.' },
          { en: 'Bangkok is famous for its ornate Buddhist temples.', es: 'Bangkok es famosa por sus elaborados templos budistas.' },
          { en: 'The elephant is a national symbol of Thailand.', es: 'El elefante es un símbolo nacional de Tailandia.' },
          { en: 'The Mekong River forms part of Thailand\'s eastern border.', es: 'El río Mekong forma parte de la frontera oriental de Tailandia.' }
        ],
        landmark: { name: 'Grand Palace', nameEs: 'Gran Palacio', emoji: '🏯' },
        animal: { name: 'Asian Elephant', nameEs: 'Elefante Asiático', emoji: '🐘' },
        quiz: [
          { q: 'What is the capital of Thailand?', qEs: '¿Cuál es la capital de Tailandia?', options: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya'], optionsEs: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya'], answer: 0 },
          { q: 'In which region of Asia is Thailand?', qEs: '¿En qué región de Asia está Tailandia?', options: ['East Asia', 'Southeast Asia', 'South Asia', 'Central Asia'], optionsEs: ['Asia Oriental', 'Sudeste Asiático', 'Asia del Sur', 'Asia Central'], answer: 1 },
          { q: 'What is the currency of Thailand?', qEs: '¿Cuál es la moneda de Tailandia?', options: ['Baht', 'Ringgit', 'Dong', 'Kip'], optionsEs: ['Baht', 'Ringgit', 'Dong', 'Kip'], answer: 0 },
          { q: 'Which animal is a national symbol of Thailand?', qEs: '¿Qué animal es un símbolo nacional de Tailandia?', options: ['Tiger', 'Elephant', 'Panda', 'Crane'], optionsEs: ['Tigre', 'Elefante', 'Panda', 'Grulla'], answer: 1 },
          { q: 'Which major river borders Thailand?', qEs: '¿Qué río importante bordea Tailandia?', options: ['Ganges', 'Mekong', 'Yangtze', 'Indus'], optionsEs: ['Ganges', 'Mekong', 'Yangtsé', 'Indo'], answer: 1 }
        ]
      }
    ] },
    { id: 'oceania', name: 'Oceania', nameEs: 'Oceanía', icon: '🌏', color: '#EC4899', countries: [
      {
        id: 'australia', name: 'Australia', nameEs: 'Australia', flag: '🇦🇺',
        capital: 'Canberra', capitalEs: 'Canberra',
        facts: [
          { en: 'Australia is both a country and a continent.', es: 'Australia es un país y un continente.' },
          { en: 'It is famous for the Great Barrier Reef.', es: 'Es famosa por la Gran Barrera de Coral.' },
          { en: 'Kangaroos and koalas are native to Australia.', es: 'Los canguros y koalas son nativos de Australia.' },
          { en: 'The Sydney Opera House is a famous building.', es: 'La Ópera de Sídney es un edificio famoso.' }
        ],
        landmark: { name: 'Sydney Opera House', nameEs: 'Ópera de Sídney', emoji: '🏛️' },
        animal: { name: 'Kangaroo', nameEs: 'Canguro', emoji: '🦘' },
        quiz: [
          { q: 'What is the capital of Australia?', qEs: '¿Cuál es la capital de Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], optionsEs: ['Sídney', 'Melbourne', 'Canberra', 'Perth'], answer: 2 },
          { q: 'Which animal is native to Australia?', qEs: '¿Qué animal es nativo de Australia?', options: ['Lion', 'Penguin', 'Kangaroo', 'Bear'], optionsEs: ['León', 'Pingüino', 'Canguro', 'Oso'], answer: 2 },
          { q: 'What famous reef is located here?', qEs: '¿Qué famoso arrecife se encuentra aquí?', options: ['Great Barrier Reef', 'Belize Barrier Reef', 'Palancar Reef', 'Ningaloo Reef'], optionsEs: ['Gran Barrera de Coral', 'Arrecife de Belice', 'Arrecife Palancar', 'Arrecife Ningaloo'], answer: 0 }
        ]
      },
      {
        id: 'new_zealand', name: 'New Zealand', nameEs: 'Nueva Zelanda', flag: '🇳🇿',
        capital: 'Wellington', capitalEs: 'Wellington',
        facts: [
          { en: 'New Zealand consists of two main landmasses: the North Island and South Island.', es: 'Nueva Zelanda consta de dos islas principales: la Isla Norte y la Isla Sur.' },
          { en: 'It was the first country in the world to give women the right to vote in 1893.', es: 'Fue el primer país del mundo en dar a las mujeres el derecho al voto en 1893.' },
          { en: 'The kiwi is a flightless bird and a national symbol of New Zealand.', es: 'El kiwi es un ave no voladora y un símbolo nacional de Nueva Zelanda.' },
          { en: 'It is famous for its beautiful mountains and fjords.', es: 'Es famoso por sus hermosas montañas y fiordos.' }
        ],
        landmark: { name: 'Milford Sound', nameEs: 'Milford Sound', emoji: '🏔️' },
        animal: { name: 'Kiwi Bird', nameEs: 'Pájaro Kiwi', emoji: '🥝' },
        quiz: [
          { q: 'What is the capital of New Zealand?', qEs: '¿Cuál es la capital de Nueva Zelanda?', options: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], optionsEs: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], answer: 1 },
          { q: 'What is the national bird of New Zealand?', qEs: '¿Cuál es el ave nacional de Nueva Zelanda?', options: ['Eagle', 'Penguin', 'Kiwi', 'Ostrich'], optionsEs: ['Águila', 'Pingüino', 'Kiwi', 'Avestruz'], answer: 2 },
          { q: 'How many main islands does New Zealand have?', qEs: '¿Cuántas islas principales tiene Nueva Zelanda?', options: ['One', 'Two', 'Three', 'Four'], optionsEs: ['Una', 'Dos', 'Tres', 'Cuatro'], answer: 1 }
        ]
      }
    ] }
  ];

  // ── State ──
  let currentContinent = null;
  let currentCountry = null;
  let lang = 'en';
  let stars = 0;

  // ── Storage ──
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey('world') : null; }
  function _load() { 
    const k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } 
  }
  function _save(data) { 
    const k = _key(); 
    if (k) {
      localStorage.setItem(k, JSON.stringify(data)); 
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Init ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    _renderContinentSelect();
    _updateGlobalStars();
  }

  function _renderContinentSelect() {
    const grid = document.getElementById('continent-grid');
    const data = _load();
    const visited = data.visited || [];

    grid.innerHTML = CONTINENTS.map(c => {
      const count = c.countries.filter(country => visited.includes(country.id)).length;
      const total = c.countries.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      return `
        <div class="continent-card" onclick="WorldExplorer.openContinent('${c.id}')">
          <span class="continent-icon">${c.icon}</span>
          <div class="continent-name">${lang === 'es' ? c.nameEs : c.name}</div>
          <div class="continent-stats">${total > 0 ? `${count}/${total} ${lang === 'es' ? 'países' : 'countries'}` : (lang === 'es' ? 'Próximamente' : 'Coming Soon')}</div>
          <div class="lab-progress" style="height:4px; margin-top:8px;">
            <div class="lab-progress-bar" style="width:${pct}%; background:${c.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openContinent(id) {
    currentContinent = CONTINENTS.find(c => c.id === id);
    if (!currentContinent) return;

    if (currentContinent.countries.length === 0) {
      _showFeedback('🚧');
      return;
    }

    document.getElementById('continent-title').textContent = lang === 'es' ? currentContinent.nameEs : currentContinent.name;
    _renderMap();
    _showScreen('continent');
  }

  function _renderMap() {
    const wrap = document.getElementById('map-wrap');
    const data = _load();
    const visited = data.visited || [];

    // Geographically accurate simplified SVG paths for South America
    const MAP_PATHS = {
      'chile':     { path: 'M122,195 L130,205 L133,218 L130,235 L128,255 L130,270 L132,285 L130,300 L125,320 L120,340 L118,355 L120,368 L118,382 L114,398 L108,415 L104,428 L100,438 L96,448 L90,458 L84,465 L78,470 L74,468 L72,460 L75,448 L78,435 L80,420 L82,405 L85,388 L88,370 L90,352 L92,335 L95,318 L98,300 L100,282 L102,265 L105,248 L108,232 L112,218 L116,205 Z', label: { x: 72, y: 385 } },
      'argentina': { path: 'M133,218 L142,222 L152,220 L155,230 L160,240 L165,252 L168,265 L172,275 L178,285 L185,288 L192,285 L188,292 L192,298 L198,305 L195,315 L188,328 L182,342 L178,358 L175,372 L170,388 L165,402 L158,418 L148,432 L138,445 L128,455 L118,462 L108,465 L100,460 L96,448 L100,438 L104,428 L108,415 L114,398 L118,382 L120,368 L118,355 L120,340 L125,320 L130,300 L132,285 L130,270 L128,255 L130,235 Z', label: { x: 148, y: 375 } },
      'brazil':    { path: 'M148,168 L162,158 L178,150 L195,142 L215,135 L235,132 L255,135 L272,140 L288,150 L298,162 L305,178 L308,195 L305,215 L300,232 L292,248 L282,262 L270,275 L258,285 L245,292 L230,298 L215,300 L200,298 L188,292 L192,285 L185,288 L178,285 L172,275 L168,265 L165,252 L160,240 L155,230 L152,220 L158,212 L162,200 L160,188 L155,175 Z', label: { x: 232, y: 215 } },
      'peru':      { path: 'M80,155 L95,148 L110,142 L122,140 L135,145 L142,155 L148,168 L145,180 L140,192 L135,202 L130,210 L122,195 L116,205 L112,218 L108,232 L105,240 L98,238 L90,230 L82,220 L75,208 L72,195 L74,178 L76,165 Z', label: { x: 108, y: 188 } },
      'colombia':  { path: 'M80,155 L76,142 L78,128 L85,115 L95,105 L108,98 L122,95 L135,98 L145,105 L152,115 L155,128 L152,140 L148,150 L148,168 L142,155 L135,145 L122,140 L110,142 L95,148 Z', label: { x: 118, y: 125 } },
      'venezuela': { path: 'M122,95 L135,88 L150,82 L168,80 L185,82 L200,88 L210,98 L215,110 L210,122 L200,130 L190,135 L178,138 L165,140 L155,142 L155,128 L152,115 L145,105 L135,98 Z', label: { x: 170, y: 108 } },
      'ecuador':   { path: 'M68,155 L72,148 L76,142 L80,155 L76,165 L72,168 L65,165 L62,158 Z', label: { x: 55, y: 155 } },
      'bolivia':   { path: 'M135,202 L140,192 L145,180 L148,168 L155,175 L160,188 L162,200 L158,212 L152,220 L148,222 L142,222 L133,218 L130,210 Z', label: { x: 148, y: 200 } },
      'paraguay':  { path: 'M172,260 L180,255 L192,252 L200,258 L198,270 L192,280 L185,288 L178,285 L172,275 L168,265 Z', label: { x: 185, y: 272 } },
      'uruguay':   { path: 'M192,280 L200,278 L210,282 L215,292 L212,302 L205,308 L198,305 L192,298 L188,292 L192,285 Z', label: { x: 202, y: 295 } },
      'guyana':    { path: 'M210,98 L220,92 L232,90 L240,95 L242,108 L238,118 L232,125 L225,130 L218,128 L215,120 L215,110 Z', label: { x: 228, y: 112 } },
      'suriname':  { path: 'M240,95 L250,92 L258,95 L262,105 L260,115 L255,122 L248,125 L242,120 L242,108 Z', label: { x: 250, y: 112 } },
    };

    let svg = `<svg viewBox="0 0 380 520" width="100%" style="max-width:380px; margin:0 auto; display:block;" xmlns="http://www.w3.org/2000/svg">`;
    
    // Ocean background
    svg += `<rect width="380" height="520" rx="16" fill="rgba(59,130,246,0.06)" />`;

    // Render each country
    currentContinent.countries.forEach(c => {
      const mapData = MAP_PATHS[c.id];
      if (!mapData) return;

      const isVisited = visited.includes(c.id);
      const fillColor = isVisited ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)';
      const strokeColor = isVisited ? '#34D399' : 'rgba(255,255,255,0.2)';

      svg += `<path d="${mapData.path}" 
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" stroke-linejoin="round"
                style="cursor:pointer; transition: all 0.3s;"
                onclick="WorldExplorer.openCountry('${c.id}')" />`;

      // Country label with flag
      const lbl = mapData.label;
      const fontSize = ['brazil', 'argentina', 'peru', 'colombia', 'chile', 'venezuela'].includes(c.id) ? 11 : 8;
      const showFlag = ['brazil', 'argentina', 'peru', 'colombia', 'chile', 'venezuela'].includes(c.id);
      svg += `<text x="${lbl.x}" y="${lbl.y}" text-anchor="middle" 
                fill="${isVisited ? '#6EE7B7' : 'rgba(255,255,255,0.5)'}" 
                font-family="var(--font-display)" font-size="${fontSize}" font-weight="800"
                style="pointer-events:none; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
                ${showFlag ? c.flag + ' ' : ''}${lang === 'es' ? c.nameEs : c.name}
              </text>`;
    });

    svg += `</svg>`;
    wrap.innerHTML = svg;
  }

  function openCountry(id) {
    currentCountry = currentContinent.countries.find(c => c.id === id);
    if (!currentCountry) return;

    const card = document.getElementById('country-card');
    const data = _load();
    const isVisited = (data.visited || []).includes(id);

    card.innerHTML = `
      <span class="country-flag">${currentCountry.flag}</span>
      <div class="country-name">${lang === 'es' ? currentCountry.nameEs : currentCountry.name}</div>
      <div class="country-capital">${lang === 'es' ? 'Capital' : 'Capital'}: ${lang === 'es' ? currentCountry.capitalEs : currentCountry.capital}</div>
      
      <div class="country-info-grid">
        <div class="info-box">
          <div class="info-label">${lang === 'es' ? 'Hito' : 'Landmark'}</div>
          <div class="info-value">${currentCountry.landmark.emoji} ${lang === 'es' ? currentCountry.landmark.nameEs : currentCountry.landmark.name}</div>
        </div>
        <div class="info-box">
          <div class="info-label">${lang === 'es' ? 'Animal' : 'Animal'}</div>
          <div class="info-value">${currentCountry.animal.emoji} ${lang === 'es' ? currentCountry.animal.nameEs : currentCountry.animal.name}</div>
        </div>
      </div>

      <div class="country-facts">
        ${currentCountry.facts.map(f => `
          <div class="fact-item">📍 ${lang === 'es' ? f.es : f.en}</div>
        `).join('')}
      </div>

      ${typeof WorldExplorerExtras !== 'undefined' ? WorldExplorerExtras.renderExtras(id, lang) : ''}

      <button class="action-btn btn-primary" onclick="WorldExplorer.markVisited('${id}')" ${isVisited ? 'disabled' : ''}>
        ${isVisited ? '✅ ' + (lang === 'es' ? 'Visitado' : 'Visited') : '🗺️ ' + (lang === 'es' ? 'Marcar como Visitado' : 'Mark as Visited')}
      </button>
      <button class="action-btn btn-secondary" onclick="WorldExplorer.backToContinent()">
        ${lang === 'es' ? 'Volver al Mapa' : 'Back to Map'}
      </button>
    `;

    _showScreen('country');
  }

  function markVisited(id) {
    const data = _load();
    if (!data.visited) data.visited = [];
    if (!data.visited.includes(id)) {
      data.visited.push(id);
      data.totalStars = (data.totalStars || 0) + 1;
      _save(data);
      _showFeedback('⭐');
      if (typeof playSound === 'function') playSound('correct');
      _updateGlobalStars();
      
      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('World Explorer', '🌍', `Visited ${lang === 'es' ? currentCountry.nameEs : currentCountry.name}`);
      }

      // Trigger learning check
      if (typeof LearningCheck !== 'undefined') {
        LearningCheck.maybePrompt('geography', () => openCountry(id));
      } else {
        openCountry(id);
      }
    }
  }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'ES / EN' : 'EN / ES';
    
    // Refresh current screen
    const active = document.querySelector('.screen.active');
    if (active.id === 'screen-select') _renderContinentSelect();
    else if (active.id === 'screen-continent') openContinent(currentContinent.id);
    else if (active.id === 'screen-country') openCountry(currentCountry.id);
  }

  function backToSelect() { _showScreen('select'); _renderContinentSelect(); }
  function backToContinent() { _showScreen('continent'); _renderMap(); }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function _updateGlobalStars() {
    const data = _load();
    const el = document.getElementById('world-stars');
    if (el) el.textContent = `⭐ ${data.totalStars || 0}`;
  }

  function _showFeedback(emoji) {
    const f = document.getElementById('feedback');
    const fe = document.getElementById('feedbackEmoji');
    if (!f || !fe) return;
    fe.textContent = emoji;
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 800);
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      visitedCount: (data.visited || []).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, openContinent, openCountry, markVisited, toggleLanguage, backToSelect, backToContinent, getStats };
})();
