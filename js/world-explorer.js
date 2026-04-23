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
            { q: 'What bird is on Chile\'s coat of arms?', qEs: '¿Qué ave está en el escudo de Chile?', options: ['Eagle', 'Condor', 'Hawk', 'Falcon'], optionsEs: ['Águila', 'Cóndor', 'Halcón', 'Falcón'], answer: 1 }
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
            { q: 'Which rainforest is mostly in Brazil?', qEs: '¿Qué selva está mayoritariamente en Brasil?', options: ['Congo', 'Amazon', 'Daintree', 'Valdivian'], optionsEs: ['Congo', 'Amazonas', 'Daintree', 'Valdiviana'], answer: 1 }
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
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2 }
        ]
      }
    ] },
    { id: 'africa', name: 'Africa', nameEs: 'África', icon: '🌍', color: '#EF4444', countries: [
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
          { q: 'Which flower is a symbol of spring in Japan?', qEs: '¿Qué flor es símbolo de la primavera en Japón?', options: ['Rose', 'Tulip', 'Cherry blossom', 'Sunflower'], optionsEs: ['Rosa', 'Tulipán', 'Flor de cerezo', 'Girasol'], answer: 2 }
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
