/* ================================================================
   WORLD EXPLORER — world-explorer.js
   Interactive geography: Equal Earth world map, continents, country
   cards, quizzes and map challenges (tap the country, find the
   landmark, fly across the ocean). Map + flags: js/world-map-data.js;
   landmark art: js/world-explorer-art.js.
   Storage key: zs_world_[username] via getUserAppKey('zs_world_')
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
            { q: 'What is the capital of Chile?', qEs: '¿Cuál es la capital de Chile?', options: ['Lima', 'Bogotá', 'Santiago', 'Buenos Aires'], optionsEs: ['Lima', 'Bogotá', 'Santiago', 'Buenos Aires'], answer: 2, tier: 'beginner', explain: { en: 'Santiago is the capital and largest city of Chile.', es: 'Santiago es la capital y la ciudad más grande de Chile.' } },
            { q: 'What desert is in Chile?', qEs: '¿Qué desierto está en Chile?', options: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], optionsEs: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], answer: 2, tier: 'intermediate', explain: { en: 'The Atacama Desert in northern Chile is the driest place on Earth.', es: 'El desierto de Atacama, en el norte de Chile, es el lugar más seco de la Tierra.' } },
            { q: 'What bird is on Chile\'s coat of arms?', qEs: '¿Qué ave está en el escudo de Chile?', options: ['Eagle', 'Condor', 'Hawk', 'Falcon'], optionsEs: ['Águila', 'Cóndor', 'Halcón', 'Falcón'], answer: 1, tier: 'advanced', explain: { en: 'The Andean condor appears on Chile\'s coat of arms.', es: 'El cóndor andino aparece en el escudo de Chile.' } },
            { q: 'What is the currency of Chile?', qEs: '¿Cuál es la moneda de Chile?', options: ['Peso', 'Sol', 'Real', 'Boliviano'], optionsEs: ['Peso', 'Sol', 'Real', 'Boliviano'], answer: 0, tier: 'advanced', explain: { en: 'Chile uses the Chilean peso.', es: 'Chile usa el peso chileno.' } },
            { q: 'Which mountain range forms Chile\'s eastern border?', qEs: '¿Qué cordillera forma la frontera oriental de Chile?', options: ['Rocky Mountains', 'Andes', 'Alps', 'Himalayas'], optionsEs: ['Montañas Rocosas', 'Los Andes', 'Alpes', 'Himalaya'], answer: 1, tier: 'expert', explain: { en: 'The Andes run along Chile\'s entire eastern border.', es: 'Los Andes recorren toda la frontera oriental de Chile.' } }
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
            { q: 'What is the tallest peak in the Americas?', qEs: '¿Cuál es el pico más alto de América?', options: ['Everest', 'Aconcagua', 'Kilimanjaro', 'Denali'], optionsEs: ['Everest', 'Aconcagua', 'Kilimanjaro', 'Denali'], answer: 1 },
            { q: 'Which famous glacier is in Argentine Patagonia?', qEs: '¿Qué famoso glaciar está en la Patagonia argentina?', options: ['Perito Moreno', 'Grey', 'Martial', 'San Rafael'], optionsEs: ['Perito Moreno', 'Grey', 'Martial', 'San Rafael'], answer: 0, tier: 'advanced', explain: { en: 'The Perito Moreno Glacier is a large ice formation in Argentine Patagonia.', es: 'El glaciar Perito Moreno es una gran formación de hielo en la Patagonia argentina.' } }
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
            { q: 'What is the largest country in South America?', qEs: '¿Cuál es el país más grande de América del Sur?', options: ['Argentina', 'Peru', 'Brazil', 'Colombia'], optionsEs: ['Argentina', 'Perú', 'Brasil', 'Colombia'], answer: 2, tier: 'beginner', explain: { en: 'Brazil covers about half of South America\'s land area.', es: 'Brasil abarca cerca de la mitad del territorio de América del Sur.' } },
            { q: 'What language is spoken in Brazil?', qEs: '¿Qué idioma se habla en Brasil?', options: ['Spanish', 'Portuguese', 'English', 'French'], optionsEs: ['Español', 'Portugués', 'Inglés', 'Francés'], answer: 1, tier: 'beginner', explain: { en: 'Brazil is the largest Portuguese-speaking country in the world.', es: 'Brasil es el país de habla portuguesa más grande del mundo.' } },
            { q: 'Which rainforest is mostly in Brazil?', qEs: '¿Qué selva está mayoritariamente en Brasil?', options: ['Congo', 'Amazon', 'Daintree', 'Valdivian'], optionsEs: ['Congo', 'Amazonas', 'Daintree', 'Valdiviana'], answer: 1, tier: 'intermediate', explain: { en: 'Most of the Amazon Rainforest lies within Brazil.', es: 'La mayor parte de la selva amazónica se encuentra en Brasil.' } },
            { q: 'What is the currency of Brazil?', qEs: '¿Cuál es la moneda de Brasil?', options: ['Peso', 'Real', 'Dollar', 'Sol'], optionsEs: ['Peso', 'Real', 'Dólar', 'Sol'], answer: 1, tier: 'advanced', explain: { en: 'Brazil\'s currency is the Brazilian real.', es: 'La moneda de Brasil es el real brasileño.' } },
            { q: 'Which river in Brazil carries the most water in the world?', qEs: '¿Qué río de Brasil lleva más agua que ningún otro del mundo?', options: ['Nile', 'Amazon', 'Paraná', 'São Francisco'], optionsEs: ['Nilo', 'Amazonas', 'Paraná', 'São Francisco'], answer: 1, tier: 'expert', explain: { en: 'The Amazon discharges more water than the next several rivers combined.', es: 'El Amazonas descarga más agua que los siguientes ríos juntos.' } }
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
            { q: 'What famous animal lives in the Andes of Peru?', qEs: '¿Qué famoso animal vive en los Andes de Perú?', options: ['Llama', 'Tiger', 'Elephant', 'Kangaroo'], optionsEs: ['Llama', 'Tigre', 'Elefante', 'Canguro'], answer: 0 },
            { q: 'Peru is famous for thousands of varieties of which crop?', qEs: '¿De qué cultivo tiene Perú miles de variedades?', options: ['Potato', 'Wheat', 'Rice', 'Olive'], optionsEs: ['Papa', 'Trigo', 'Arroz', 'Aceituna'], answer: 0, tier: 'intermediate', explain: { en: 'Peru grows more than 3,000 varieties of potato.', es: 'En Perú se cultivan más de 3.000 variedades de papa.' } }
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
            { q: 'Which oceans does Colombia touch?', qEs: '¿Qué océanos toca Colombia?', options: ['Atlantic only', 'Pacific only', 'Atlantic and Pacific', 'Indian'], optionsEs: ['Solo Atlántico', 'Solo Pacífico', 'Atlántico y Pacífico', 'Índico'], answer: 2 },
            { q: 'Colombia is especially known for growing which crop?', qEs: '¿Qué cultivo es especialmente famoso en Colombia?', options: ['Coffee', 'Tea', 'Rice', 'Olives'], optionsEs: ['Café', 'Té', 'Arroz', 'Aceitunas'], answer: 0, tier: 'beginner', explain: { en: 'Colombia is known for its coffee-growing regions.', es: 'Colombia es conocida por sus regiones cafetaleras.' } }
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
            { q: 'What is the official language of Venezuela?', qEs: '¿Cuál es el idioma oficial de Venezuela?', options: ['English', 'Spanish', 'Portuguese', 'French'], optionsEs: ['Inglés', 'Español', 'Portugués', 'Francés'], answer: 1 },
            { q: 'Which lake in Venezuela is one of the oldest on Earth?', qEs: '¿Qué lago de Venezuela es uno de los más antiguos de la Tierra?', options: ['Lake Maracaibo', 'Lake Titicaca', 'Lake Valencia', 'Lake Geneva'], optionsEs: ['Lago de Maracaibo', 'Lago Titicaca', 'Lago de Valencia', 'Lago de Ginebra'], answer: 0, tier: 'advanced', explain: { en: 'Lake Maracaibo is one of the oldest lakes on Earth.', es: 'El Lago de Maracaibo es uno de los lagos más antiguos de la Tierra.' } }
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
            { q: 'Where is Ecuador located?', qEs: '¿Dónde está ubicado Ecuador?', options: ['On the Prime Meridian', 'On the Equator', 'At the North Pole', 'At the South Pole'], optionsEs: ['En el Meridiano de Greenwich', 'En el Ecuador', 'En el Polo Norte', 'En el Polo Sur'], answer: 1 },
            { q: 'Quito stands out as one of the world capitals that are…', qEs: 'Quito destaca por ser una de las capitales del mundo que están…', options: ['Among the highest', 'Below sea level', 'On an island', 'In a desert'], optionsEs: ['Entre las más altas', 'Bajo el nivel del mar', 'En una isla', 'En un desierto'], answer: 0, tier: 'advanced', explain: { en: 'Quito is one of the highest capital cities in the world.', es: 'Quito es una de las capitales más altas del mundo.' } }
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
            { q: 'Is Bolivia landlocked?', qEs: '¿Es Bolivia un país sin salida al mar?', options: ['Yes', 'No', 'Partially', 'Only in winter'], optionsEs: ['Sí', 'No', 'Parcialmente', 'Solo en invierno'], answer: 0 },
            { q: 'Which lake, shared by Bolivia and Peru, is the highest navigable lake?', qEs: '¿Qué lago, compartido por Bolivia y Perú, es el navegable más alto?', options: ['Titicaca', 'Poopó', 'Maracaibo', 'General Carrera'], optionsEs: ['Titicaca', 'Poopó', 'Maracaibo', 'General Carrera'], answer: 0, tier: 'advanced', explain: { en: 'Lake Titicaca, shared with Peru, is the highest navigable lake.', es: 'El lago Titicaca, compartido con Perú, es el lago navegable más alto.' } }
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
            { q: 'Is Paraguay landlocked?', qEs: '¿Paraguay es un país sin salida al mar?', options: ['Yes', 'No', 'It has one coast', 'It is an island'], optionsEs: ['Sí', 'No', 'Tiene una costa', 'Es una isla'], answer: 0 },
            { q: 'The Itaipú Dam, on the border with Brazil, is a huge source of…', qEs: 'La represa de Itaipú, en la frontera con Brasil, es una enorme fuente de…', options: ['Electricity', 'Gold', 'Salt', 'Timber'], optionsEs: ['Electricidad', 'Oro', 'Sal', 'Madera'], answer: 0, tier: 'advanced', explain: { en: 'Itaipú is one of the largest hydroelectric dams in the world.', es: 'Itaipú es una de las represas hidroeléctricas más grandes del mundo.' } }
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
            { q: 'What is a popular drink in Uruguay?', qEs: '¿Qué bebida es popular en Uruguay?', options: ['Coffee', 'Tea', 'Mate', 'Juice'], optionsEs: ['Café', 'Té', 'Mate', 'Jugo'], answer: 2 },
            { q: 'Which country hosted and won the first FIFA World Cup in 1930?', qEs: '¿Qué país organizó y ganó la primera Copa del Mundo de la FIFA en 1930?', options: ['Uruguay', 'Brazil', 'Argentina', 'Italy'], optionsEs: ['Uruguay', 'Brasil', 'Argentina', 'Italia'], answer: 0, tier: 'advanced', explain: { en: 'Uruguay hosted the first World Cup in 1930 and won it.', es: 'Uruguay organizó la primera Copa del Mundo en 1930 y la ganó.' } }
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
            { q: 'What famous waterfall is in Guyana?', qEs: '¿Qué famosa cascada está en Guyana?', options: ['Angel', 'Niagara', 'Kaieteur', 'Iguazu'], optionsEs: ['Ángel', 'Niágara', 'Kaieteur', 'Iguazú'], answer: 2 },
            { q: 'About how much of Guyana is tropical rainforest?', qEs: '¿Qué parte de Guyana está cubierta de selva tropical, aproximadamente?', options: ['About 80%', 'About 10%', 'About 40%', 'None of it'], optionsEs: ['Cerca del 80%', 'Cerca del 10%', 'Cerca del 40%', 'Nada'], answer: 0, tier: 'advanced', explain: { en: 'About 80% of Guyana is covered by tropical rainforest.', es: 'Cerca del 80% de Guyana está cubierta de selva tropical.' } }
          ]
        },
        {
          id: 'suriname', name: 'Suriname', nameEs: 'Surinam', flag: '🇸🇷',
          capital: 'Paramaribo', capitalEs: 'Paramaribo',
          facts: [
            { en: 'Suriname is the smallest country in South America.', es: 'Surinam es el país más pequeño de Sudamérica.' },
            { en: 'Dutch is the official language of Suriname.', es: 'El holandés es el idioma oficial de Surinam.' },
            { en: 'Over 90% of Suriname is covered by rainforest.', es: 'Más del 90% de Surinam está cubierto por selva tropical.' },
            { en: 'The historic center of Paramaribo is a UNESCO World Heritage site.', es: 'El centro histórico de Paramaribo es Patrimonio de la Humanidad de la UNESCO.' }
          ],
          landmark: { name: 'Central Suriname Reserve', nameEs: 'Reserva Central de Surinam', emoji: '🌳' },
          animal: { name: 'Harpy Eagle', nameEs: 'Águila Harpía', emoji: '🦅' },
          quiz: [
            { q: 'What is the official language of Suriname?', qEs: '¿Cuál es el idioma oficial de Surinam?', options: ['Spanish', 'English', 'French', 'Dutch'], optionsEs: ['Español', 'Inglés', 'Francés', 'Holandés'], answer: 3 },
            { q: 'What is the capital of Suriname?', qEs: '¿Cuál es la capital de Surinam?', options: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo'], optionsEs: ['Paramaribo', 'Lelydorp', 'Nieuw Nickerie', 'Moengo'], answer: 0 },
            { q: 'Suriname is located on which continent?', qEs: '¿Surinam está ubicado en qué continente?', options: ['Africa', 'Europe', 'South America', 'Asia'], optionsEs: ['África', 'Europa', 'América del Sur', 'Asia'], answer: 2 },
            { q: 'About how much of Suriname is rainforest?', qEs: '¿Qué parte de Surinam es selva, aproximadamente?', options: ['Over 90%', 'About 10%', 'About half', 'None of it'], optionsEs: ['Más del 90%', 'Cerca del 10%', 'Cerca de la mitad', 'Nada'], answer: 0, tier: 'advanced', explain: { en: 'Over 90% of Suriname is covered by rainforest.', es: 'Más del 90% de Surinam está cubierto de selva.' } }
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
          { q: 'What is the capital of the United States?', qEs: '¿Cuál es la capital de Estados Unidos?', options: ['New York', 'Washington, D.C.', 'Los Angeles', 'Chicago'], optionsEs: ['Nueva York', 'Washington, D.C.', 'Los Ángeles', 'Chicago'], answer: 1, tier: 'beginner', explain: { en: 'Washington, D.C. is the U.S. capital, named after George Washington.', es: 'Washington, D.C. es la capital de EE.UU., nombrada en honor a George Washington.' } },
          { q: 'How many states make up the U.S.?', qEs: '¿Cuántos estados forman EE.UU.?', options: ['48', '50', '52', '45'], optionsEs: ['48', '50', '52', '45'], answer: 1, tier: 'beginner', explain: { en: 'There are 50 states, the last two being Alaska and Hawaii.', es: 'Hay 50 estados; los dos últimos fueron Alaska y Hawái.' } },
          { q: 'In which state is the Grand Canyon?', qEs: '¿En qué estado está el Gran Cañón?', options: ['Arizona', 'Texas', 'Florida', 'Nevada'], optionsEs: ['Arizona', 'Texas', 'Florida', 'Nevada'], answer: 0, tier: 'intermediate', explain: { en: 'The Grand Canyon was carved by the Colorado River in Arizona.', es: 'El Gran Cañón fue formado por el río Colorado en Arizona.' } },
          { q: 'Where is the Statue of Liberty?', qEs: '¿Dónde está la Estatua de la Libertad?', options: ['Miami', 'Boston', 'New York', 'Seattle'], optionsEs: ['Miami', 'Boston', 'Nueva York', 'Seattle'], answer: 2, tier: 'intermediate', explain: { en: 'The statue stands on Liberty Island in New York Harbor.', es: 'La estatua se alza en la Isla de la Libertad, en el puerto de Nueva York.' } },
          { q: 'What is the U.S. national bird?', qEs: '¿Cuál es el ave nacional de EE.UU.?', options: ['Bald Eagle', 'Hawk', 'Falcon', 'Owl'], optionsEs: ['Águila Calva', 'Halcón', 'Falcón', 'Búho'], answer: 0, tier: 'advanced', explain: { en: 'The bald eagle has been the U.S. national bird since 1782.', es: 'El águila calva es el ave nacional de EE.UU. desde 1782.' } }
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
          { q: 'What is the capital of Mexico?', qEs: '¿Cuál es la capital de México?', options: ['Guadalajara', 'Monterrey', 'Mexico City', 'Cancun'], optionsEs: ['Guadalajara', 'Monterrey', 'Ciudad de México', 'Cancún'], answer: 2, tier: 'beginner', explain: { en: 'Mexico City is one of the largest cities in the world.', es: 'La Ciudad de México es una de las ciudades más grandes del mundo.' } },
          { q: 'Which ancient city is located in Mexico?', qEs: '¿Qué antigua ciudad se encuentra en México?', options: ['Machu Picchu', 'Chichén Itzá', 'Petra', 'Colosseum'], optionsEs: ['Machu Picchu', 'Chichén Itzá', 'Petra', 'Coliseo'], answer: 1, tier: 'intermediate', explain: { en: 'Chichén Itzá was a major city of the ancient Maya.', es: 'Chichén Itzá fue una gran ciudad de los antiguos mayas.' } },
          { q: 'What unique amphibian is native to Mexico?', qEs: '¿Qué anfibio único es nativo de México?', options: ['Frog', 'Salamander', 'Toad', 'Axolotl'], optionsEs: ['Rana', 'Salamandra', 'Sapo', 'Ajolote'], answer: 3, tier: 'advanced', explain: { en: 'The axolotl can regrow lost body parts and lives near Mexico City.', es: 'El ajolote puede regenerar partes del cuerpo y vive cerca de la Ciudad de México.' } },
          { q: 'What is the most populous Spanish-speaking country?', qEs: '¿Cuál es el país de habla hispana más poblado?', options: ['Spain', 'Colombia', 'Argentina', 'Mexico'], optionsEs: ['España', 'Colombia', 'Argentina', 'México'], answer: 3, tier: 'expert', explain: { en: 'Mexico has more Spanish speakers than any other country.', es: 'México tiene más hispanohablantes que cualquier otro país.' } },
          { q: 'Which food is famous worldwide from Mexico?', qEs: '¿Qué comida de México es famosa mundialmente?', options: ['Sushi', 'Tacos', 'Pasta', 'Croissants'], optionsEs: ['Sushi', 'Tacos', 'Pasta', 'Croissants'], answer: 1, tier: 'beginner', explain: { en: 'Tacos are a traditional Mexican dish enjoyed around the world.', es: 'Los tacos son un platillo tradicional mexicano disfrutado en todo el mundo.' } }
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
          { q: 'Which dance is a famous Spanish art form?', qEs: '¿Qué baile es un famoso arte español?', options: ['Salsa', 'Tango', 'Flamenco', 'Ballet'], optionsEs: ['Salsa', 'Tango', 'Flamenco', 'Ballet'], answer: 2 },
          { q: 'By number of native speakers, where does Spanish rank in the world?', qEs: 'Por número de hablantes nativos, ¿en qué lugar queda el español en el mundo?', options: ['Second', 'First', 'Fifth', 'Tenth'], optionsEs: ['Segundo', 'Primero', 'Quinto', 'Décimo'], answer: 0, tier: 'expert', explain: { en: 'More people speak Mandarin as a first language. Spanish is second.', es: 'Más personas tienen el mandarín como primera lengua. El español es el segundo.' } }
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
          { q: 'What is the capital of France?', qEs: '¿Cuál es la capital de Francia?', options: ['London', 'Berlin', 'Madrid', 'Paris'], optionsEs: ['Londres', 'Berlín', 'Madrid', 'París'], answer: 3, tier: 'beginner', explain: { en: 'Paris, on the Seine River, is the capital of France.', es: 'París, a orillas del río Sena, es la capital de Francia.' } },
          { q: 'Which famous monument is in France?', qEs: '¿Qué famoso monumento está en Francia?', options: ['Colosseum', 'Eiffel Tower', 'Big Ben', 'Parthenon'], optionsEs: ['Coliseo', 'Torre Eiffel', 'Big Ben', 'Partenón'], answer: 1, tier: 'beginner', explain: { en: 'The Eiffel Tower was built in Paris for the 1889 World\'s Fair.', es: 'La Torre Eiffel fue construida en París para la Exposición Universal de 1889.' } },
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2, tier: 'advanced', explain: { en: 'The Tour de France is the world\'s most famous cycling race.', es: 'El Tour de Francia es la carrera ciclista más famosa del mundo.' } },
          { q: 'What is the longest river in France?', qEs: '¿Cuál es el río más largo de Francia?', options: ['Seine', 'Loire', 'Rhône', 'Garonne'], optionsEs: ['Sena', 'Loira', 'Ródano', 'Garona'], answer: 1, tier: 'expert', explain: { en: 'The Loire is the longest river in France.', es: 'El Loira es el río más largo de Francia.' } },
          { q: 'What is the currency of France?', qEs: '¿Cuál es la moneda de Francia?', options: ['Franc', 'Euro', 'Pound', 'Lira'], optionsEs: ['Franco', 'Euro', 'Libra', 'Lira'], answer: 1, tier: 'intermediate', explain: { en: 'France uses the euro, shared by many European countries.', es: 'Francia usa el euro, compartido por muchos países europeos.' } }
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
          { q: 'What river flows through Egypt?', qEs: '¿Qué río fluye por Egipto?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], optionsEs: ['Amazonas', 'Nilo', 'Yangtsé', 'Misisipi'], answer: 1, tier: 'beginner', explain: { en: 'The Nile flows through Egypt and is one of the longest rivers on Earth.', es: 'El Nilo fluye por Egipto y es uno de los ríos más largos de la Tierra.' } },
          { q: 'What famous monument is in Egypt?', qEs: '¿Qué monumento famoso está en Egipto?', options: ['Colosseum', 'Eiffel Tower', 'Pyramids', 'Taj Mahal'], optionsEs: ['Coliseo', 'Torre Eiffel', 'Pirámides', 'Taj Mahal'], answer: 2, tier: 'intermediate', explain: { en: 'The Pyramids of Giza were built as tombs for ancient Egyptian pharaohs.', es: 'Las pirámides de Guiza se construyeron como tumbas para los faraones del antiguo Egipto.' } },
          { q: 'What is the capital of Egypt?', qEs: '¿Cuál es la capital de Egipto?', options: ['Cairo', 'Nairobi', 'Cape Town', 'Rabat'], optionsEs: ['El Cairo', 'Nairobi', 'Ciudad del Cabo', 'Rabat'], answer: 0, tier: 'advanced', explain: { en: 'Cairo, on the Nile, is the capital of Egypt.', es: 'El Cairo, a orillas del Nilo, es la capital de Egipto.' } },
          { q: 'What is the official language of Egypt?', qEs: '¿Cuál es el idioma oficial de Egipto?', options: ['Arabic', 'Egyptian', 'French', 'Greek'], optionsEs: ['Árabe', 'Egipcio', 'Francés', 'Griego'], answer: 0, tier: 'intermediate', explain: { en: 'Arabic is the official language of Egypt.', es: 'El árabe es el idioma oficial de Egipto.' } }
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
          { q: 'What is the capital of Japan?', qEs: '¿Cuál es la capital de Japón?', options: ['Kyoto', 'Osaka', 'Tokyo', 'Hiroshima'], optionsEs: ['Kioto', 'Osaka', 'Tokio', 'Hiroshima'], answer: 2, tier: 'beginner', explain: { en: 'Tokyo is the capital and largest metropolitan area of Japan.', es: 'Tokio es la capital y la mayor área metropolitana de Japón.' } },
          { q: 'What is the highest mountain in Japan?', qEs: '¿Cuál es la montaña más alta de Japón?', options: ['Mount Everest', 'Mount Fuji', 'Mount Kilimanjaro', 'Mount Blanc'], optionsEs: ['Monte Everest', 'Monte Fuji', 'Monte Kilimanjaro', 'Mont Blanc'], answer: 1, tier: 'intermediate', explain: { en: 'Mount Fuji, a volcano, is the tallest mountain in Japan.', es: 'El monte Fuji, un volcán, es la montaña más alta de Japón.' } },
          { q: 'Which flower is a symbol of spring in Japan?', qEs: '¿Qué flor es símbolo de la primavera en Japón?', options: ['Rose', 'Tulip', 'Cherry blossom', 'Sunflower'], optionsEs: ['Rosa', 'Tulipán', 'Flor de cerezo', 'Girasol'], answer: 2, tier: 'intermediate', explain: { en: 'Cherry blossoms (sakura) bloom across Japan each spring.', es: 'Las flores de cerezo (sakura) florecen en Japón cada primavera.' } },
          { q: 'What is the currency of Japan?', qEs: '¿Cuál es la moneda de Japón?', options: ['Won', 'Yuan', 'Yen', 'Baht'], optionsEs: ['Won', 'Yuan', 'Yen', 'Baht'], answer: 2, tier: 'advanced', explain: { en: 'Japan\'s currency is the yen.', es: 'La moneda de Japón es el yen.' } },
          { q: 'What is Japan\'s largest island called?', qEs: '¿Cómo se llama la isla más grande de Japón?', options: ['Hokkaido', 'Honshu', 'Kyushu', 'Shikoku'], optionsEs: ['Hokkaido', 'Honshu', 'Kyushu', 'Shikoku'], answer: 1, tier: 'expert', explain: { en: 'Honshu is the largest island, home to Tokyo and Mount Fuji.', es: 'Honshu es la isla más grande; allí están Tokio y el monte Fuji.' } }
        ]
      },
      {
        id: 'china', name: 'China', nameEs: 'China', flag: '🇨🇳',
        capital: 'Beijing', capitalEs: 'Pekín',
        facts: [
          { en: 'The Great Wall of China is over 21,000 km long.', es: 'La Gran Muralla China tiene más de 21.000 km de largo.' },
          { en: 'Giant pandas are native to South Central China.', es: 'Los osos panda gigantes son nativos del centro-sur de China.' },
          { en: 'More people live in China than in any other country in East Asia.', es: 'En China vive más gente que en cualquier otro país de Asia Oriental.' },
          { en: 'The Yangtze is the longest river in Asia.', es: 'El Yangtsé es el río más largo de Asia.' }
        ],
        landmark: { name: 'Great Wall', nameEs: 'Gran Muralla', emoji: '🧱' },
        animal: { name: 'Giant Panda', nameEs: 'Oso Panda', emoji: '🐼' },
        quiz: [
          { q: 'What is the capital of China?', qEs: '¿Cuál es la capital de China?', options: ['Shanghai', 'Beijing', 'Hong Kong', 'Shenzhen'], optionsEs: ['Shanghái', 'Pekín', 'Hong Kong', 'Shenzhen'], answer: 1, tier: 'beginner', explain: { en: 'Beijing has been China\'s capital for much of its history.', es: 'Pekín ha sido la capital de China durante gran parte de su historia.' } },
          { q: 'Which famous wall is located in China?', qEs: '¿Qué famosa muralla se encuentra en China?', options: ['Berlin Wall', 'Hadrian\'s Wall', 'Great Wall', 'Western Wall'], optionsEs: ['Muro de Berlín', 'Muro de Adriano', 'Gran Muralla', 'Muro de los Lamentos'], answer: 2, tier: 'intermediate', explain: { en: 'The Great Wall was built over centuries to defend China\'s borders.', es: 'La Gran Muralla se construyó durante siglos para defender las fronteras de China.' } },
          { q: 'What black and white bear is native to China?', qEs: '¿Qué oso blanco y negro es nativo de China?', options: ['Polar Bear', 'Grizzly Bear', 'Giant Panda', 'Koala'], optionsEs: ['Oso Polar', 'Oso Grizzly', 'Oso Panda', 'Koala'], answer: 2, tier: 'advanced', explain: { en: 'Giant pandas live in bamboo forests of south-central China.', es: 'Los osos panda gigantes viven en bosques de bambú del centro-sur de China.' } },
          { q: 'What is the longest river in Asia?', qEs: '¿Cuál es el río más largo de Asia?', options: ['The Yangtze', 'The Yellow River', 'The Ganges', 'The Mekong'], optionsEs: ['El Yangtsé', 'El río Amarillo', 'El Ganges', 'El Mekong'], answer: 0, tier: 'advanced', explain: { en: 'The Yangtze is the longest river in Asia.', es: 'El Yangtsé es el río más largo de Asia.' } }
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
          { q: 'What is the capital of India?', qEs: '¿Cuál es la capital de India?', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], optionsEs: ['Bombay', 'Nueva Delhi', 'Calcuta', 'Chennai'], answer: 1, tier: 'beginner', explain: { en: 'New Delhi is the capital of India.', es: 'Nueva Delhi es la capital de India.' } },
          { q: 'Which famous marble mausoleum is in India?', qEs: '¿Qué famoso mausoleo de mármol está en India?', options: ['Taj Mahal', 'Petra', 'Colosseum', 'Angkor Wat'], optionsEs: ['Taj Mahal', 'Petra', 'Coliseo', 'Angkor Wat'], answer: 0, tier: 'intermediate', explain: { en: 'The Taj Mahal in Agra was built of white marble in the 1600s.', es: 'El Taj Mahal, en Agra, fue construido en mármol blanco en el siglo XVII.' } },
          { q: 'What is the currency of India?', qEs: '¿Cuál es la moneda de India?', options: ['Rupee', 'Yen', 'Baht', 'Won'], optionsEs: ['Rupia', 'Yen', 'Baht', 'Won'], answer: 0, tier: 'advanced', explain: { en: 'India\'s currency is the Indian rupee.', es: 'La moneda de India es la rupia india.' } },
          { q: 'What sacred river flows through India?', qEs: '¿Qué río sagrado fluye por India?', options: ['Mekong', 'Ganges', 'Yangtze', 'Indus only'], optionsEs: ['Mekong', 'Ganges', 'Yangtsé', 'Solo el Indo'], answer: 1, tier: 'expert', explain: { en: 'The Ganges is considered sacred by millions of people in India.', es: 'El Ganges es considerado sagrado por millones de personas en India.' } },
          { q: 'What is the national animal of India?', qEs: '¿Cuál es el animal nacional de India?', options: ['Lion', 'Elephant', 'Bengal Tiger', 'Peacock'], optionsEs: ['León', 'Elefante', 'Tigre de Bengala', 'Pavo real'], answer: 2, tier: 'advanced', explain: { en: 'The Bengal tiger is the national animal of India.', es: 'El tigre de Bengala es el animal nacional de India.' } }
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
      },
      {
        id: 'singapore', name: 'Singapore', nameEs: 'Singapur', flag: '🇸🇬',
        capital: 'Singapore', capitalEs: 'Singapur',
        facts: [
          { en: 'Singapore is a city, an island, and a country all at once.', es: 'Singapur es una ciudad, una isla y un país a la vez.' },
          { en: 'It sits at the southern tip of Southeast Asia, near the equator.', es: 'Está en el extremo sur del sudeste asiático, cerca del ecuador.' },
          { en: 'Gardens by the Bay has giant solar-powered "Supertrees".', es: 'Gardens by the Bay tiene "Supertrees" gigantes con energía solar.' },
          { en: 'Its mascot is the Merlion, half lion and half fish.', es: 'Su mascota es el Merlión, mitad león y mitad pez.' }
        ],
        landmark: { name: 'Marina Bay Sands', nameEs: 'Marina Bay Sands', emoji: '🏙️' },
        animal: { name: 'Merlion', nameEs: 'Merlión', emoji: '🦁' },
        quiz: [
          { q: 'What is the capital of Singapore?', qEs: '¿Cuál es la capital de Singapur?', options: ['Kuala Lumpur', 'Singapore', 'Jakarta', 'Bangkok'], optionsEs: ['Kuala Lumpur', 'Singapur', 'Yakarta', 'Bangkok'], answer: 1 },
          { q: 'Singapore is best described as a…', qEs: 'Singapur se describe mejor como…', options: ['City-state', 'Continent', 'Mountain range', 'Desert'], optionsEs: ['Ciudad-estado', 'Continente', 'Cordillera', 'Desierto'], answer: 0 },
          { q: 'What is Singapore\'s mascot?', qEs: '¿Cuál es la mascota de Singapur?', options: ['Dragon', 'Merlion', 'Phoenix', 'Griffin'], optionsEs: ['Dragón', 'Merlión', 'Fénix', 'Grifo'], answer: 1 },
          { q: 'What giant structures glow at Gardens by the Bay?', qEs: '¿Qué estructuras gigantes brillan en Gardens by the Bay?', options: ['Pyramids', 'Supertrees', 'Windmills', 'Fountains'], optionsEs: ['Pirámides', 'Supertrees', 'Molinos', 'Fuentes'], answer: 1 }
        ]
      },
      {
        id: 'indonesia', name: 'Indonesia', nameEs: 'Indonesia', flag: '🇮🇩',
        capital: 'Jakarta', capitalEs: 'Yakarta',
        facts: [
          { en: 'Indonesia is made up of more than 17,000 islands.', es: 'Indonesia está formada por más de 17,000 islas.' },
          { en: 'Bali and the Gili Islands are part of Indonesia.', es: 'Bali y las islas Gili son parte de Indonesia.' },
          { en: 'It sits on the "Ring of Fire" and has many volcanoes.', es: 'Está en el "Cinturón de Fuego" y tiene muchos volcanes.' },
          { en: 'The Komodo dragon, the world\'s largest lizard, lives here.', es: 'El dragón de Komodo, el lagarto más grande del mundo, vive aquí.' }
        ],
        landmark: { name: 'Borobudur Temple', nameEs: 'Templo de Borobudur', emoji: '🛕' },
        animal: { name: 'Komodo Dragon', nameEs: 'Dragón de Komodo', emoji: '🦎' },
        quiz: [
          { q: 'What is the capital of Indonesia?', qEs: '¿Cuál es la capital de Indonesia?', options: ['Bali', 'Jakarta', 'Manila', 'Hanoi'], optionsEs: ['Bali', 'Yakarta', 'Manila', 'Hanói'], answer: 1 },
          { q: 'About how many islands make up Indonesia?', qEs: '¿Aproximadamente cuántas islas forman Indonesia?', options: ['Around 50', 'Around 500', 'More than 17,000', 'Just one'], optionsEs: ['Unas 50', 'Unas 500', 'Más de 17,000', 'Solo una'], answer: 2 },
          { q: 'Which famous island belongs to Indonesia?', qEs: '¿Qué famosa isla pertenece a Indonesia?', options: ['Bali', 'Sicily', 'Hawaii', 'Crete'], optionsEs: ['Bali', 'Sicilia', 'Hawái', 'Creta'], answer: 0 },
          { q: 'What giant lizard lives in Indonesia?', qEs: '¿Qué lagarto gigante vive en Indonesia?', options: ['Iguana', 'Komodo dragon', 'Gila monster', 'Nile monitor'], optionsEs: ['Iguana', 'Dragón de Komodo', 'Monstruo de Gila', 'Varano del Nilo'], answer: 1 }
        ]
      },
      {
        id: 'taiwan', name: 'Taiwan', nameEs: 'Taiwán', flag: '🇹🇼',
        capital: 'Taipei', capitalEs: 'Taipéi',
        facts: [
          { en: 'Taiwan is an island off the southeast coast of Asia.', es: 'Taiwán es una isla frente a la costa sudeste de Asia.' },
          { en: 'Taipei 101 was the world\'s tallest building from 2004 to 2010.', es: 'El Taipéi 101 fue el edificio más alto del mundo de 2004 a 2010.' },
          { en: 'Bubble tea (boba) was invented in Taiwan.', es: 'El té de burbujas (boba) se inventó en Taiwán.' },
          { en: 'Most of the island is covered by mountains and forest.', es: 'La mayor parte de la isla está cubierta de montañas y bosque.' }
        ],
        landmark: { name: 'Taipei 101', nameEs: 'Taipéi 101', emoji: '🗼' },
        animal: { name: 'Formosan Black Bear', nameEs: 'Oso negro de Formosa', emoji: '🐻' },
        quiz: [
          { q: 'What is the capital of Taiwan?', qEs: '¿Cuál es la capital de Taiwán?', options: ['Taipei', 'Hong Kong', 'Shanghai', 'Seoul'], optionsEs: ['Taipéi', 'Hong Kong', 'Shanghái', 'Seúl'], answer: 0 },
          { q: 'What famous tall tower is in Taipei?', qEs: '¿Qué famosa torre alta está en Taipéi?', options: ['Taipei 101', 'Eiffel Tower', 'Willis Tower', 'The Shard'], optionsEs: ['Taipéi 101', 'Torre Eiffel', 'Torre Willis', 'The Shard'], answer: 0 },
          { q: 'Which popular drink was invented in Taiwan?', qEs: '¿Qué bebida popular se inventó en Taiwán?', options: ['Bubble tea', 'Cola', 'Lemonade', 'Espresso'], optionsEs: ['Té de burbujas', 'Cola', 'Limonada', 'Espresso'], answer: 0 },
          { q: 'Taiwan is mostly covered by…', qEs: 'Taiwán está cubierto en su mayoría por…', options: ['Desert', 'Mountains and forest', 'Ice', 'Grassland'], optionsEs: ['Desierto', 'Montañas y bosque', 'Hielo', 'Praderas'], answer: 1 }
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
          { q: 'What is the capital of Australia?', qEs: '¿Cuál es la capital de Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], optionsEs: ['Sídney', 'Melbourne', 'Canberra', 'Perth'], answer: 2, tier: 'advanced', explain: { en: 'Canberra was chosen as the capital as a compromise between Sydney and Melbourne.', es: 'Canberra fue elegida capital como un acuerdo entre Sídney y Melbourne.' } },
          { q: 'Which animal is native to Australia?', qEs: '¿Qué animal es nativo de Australia?', options: ['Lion', 'Penguin', 'Kangaroo', 'Bear'], optionsEs: ['León', 'Pingüino', 'Canguro', 'Oso'], answer: 2, tier: 'beginner', explain: { en: 'Kangaroos are marsupials found only in Australia.', es: 'Los canguros son marsupiales que solo se encuentran en Australia.' } },
          { q: 'What famous reef is located here?', qEs: '¿Qué famoso arrecife se encuentra aquí?', options: ['Great Barrier Reef', 'Belize Barrier Reef', 'Palancar Reef', 'Ningaloo Reef'], optionsEs: ['Gran Barrera de Coral', 'Arrecife de Belice', 'Arrecife Palancar', 'Arrecife Ningaloo'], answer: 0, tier: 'intermediate', explain: { en: 'The Great Barrier Reef is the world\'s largest coral reef system.', es: 'La Gran Barrera de Coral es el mayor sistema de arrecifes del mundo.' } },
          { q: 'Australia is both a country and a…', qEs: 'Australia es a la vez un país y un…', options: ['Continent', 'City-state', 'European island', 'Peninsula of Asia'], optionsEs: ['Continente', 'Ciudad-Estado', 'Isla europea', 'Península de Asia'], answer: 0, tier: 'beginner', explain: { en: 'Australia is both a country and a continent.', es: 'Australia es a la vez un país y un continente.' } }
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
          { q: 'How many main islands does New Zealand have?', qEs: '¿Cuántas islas principales tiene Nueva Zelanda?', options: ['One', 'Two', 'Three', 'Four'], optionsEs: ['Una', 'Dos', 'Tres', 'Cuatro'], answer: 1 },
          { q: 'New Zealand is famous for mountains and what steep sea inlets?', qEs: 'Nueva Zelanda es famosa por sus montañas y ¿qué entradas de mar empinadas?', options: ['Fjords', 'Deltas', 'Atolls', 'Canyons'], optionsEs: ['Fiordos', 'Deltas', 'Atolones', 'Cañones'], answer: 0, tier: 'advanced', explain: { en: 'New Zealand is known for its mountains and fjords.', es: 'Nueva Zelanda es conocida por sus montañas y fiordos.' } }
        ]
      }
    ] }
  ];

  // ── Geography for the map (lon, lat). Capitals and landmark sites. ──
  // iso = ISO 3166-1 alpha-3, the key used by js/world-map-data.js.
  const GEO = {
    chile:          { iso: 'chl', cap: [-70.67, -33.45], lm: [-109.35, -27.12] },
    argentina:      { iso: 'arg', cap: [-58.38, -34.60], lm: [-54.44, -25.69] },
    brazil:         { iso: 'bra', cap: [-47.88, -15.79], lm: [-43.21, -22.95] },
    peru:           { iso: 'per', cap: [-77.04, -12.05], lm: [-72.55, -13.16] },
    colombia:       { iso: 'col', cap: [-74.07, 4.71],   lm: [-75.55, 10.42] },
    venezuela:      { iso: 'ven', cap: [-66.90, 10.48],  lm: [-62.54, 5.97] },
    ecuador:        { iso: 'ecu', cap: [-78.47, -0.18],  lm: [-90.40, -0.65] },
    bolivia:        { iso: 'bol', cap: [-65.26, -19.04], lm: [-67.49, -20.13] },
    paraguay:       { iso: 'pry', cap: [-57.58, -25.26], lm: [-54.59, -25.41] },
    uruguay:        { iso: 'ury', cap: [-56.16, -34.90], lm: [-57.84, -34.47] },
    guyana:         { iso: 'guy', cap: [-58.16, 6.80],   lm: [-59.48, 5.18] },
    suriname:       { iso: 'sur', cap: [-55.20, 5.85],   lm: [-56.50, 4.00] },
    united_states:  { iso: 'usa', cap: [-77.04, 38.91],  lm: [-74.04, 40.69] },
    canada:         { iso: 'can', cap: [-75.70, 45.42],  lm: [-79.39, 43.64] },
    mexico:         { iso: 'mex', cap: [-99.13, 19.43],  lm: [-88.57, 20.68] },
    italy:          { iso: 'ita', cap: [12.50, 41.90],   lm: [12.49, 41.89] },
    spain:          { iso: 'esp', cap: [-3.70, 40.42],   lm: [2.17, 41.40] },
    france:         { iso: 'fra', cap: [2.35, 48.86],    lm: [2.29, 48.86] },
    germany:        { iso: 'deu', cap: [13.40, 52.52],   lm: [13.38, 52.52] },
    united_kingdom: { iso: 'gbr', cap: [-0.13, 51.51],   lm: [-0.12, 51.50] },
    greece:         { iso: 'grc', cap: [23.73, 37.98],   lm: [23.73, 37.97] },
    portugal:       { iso: 'prt', cap: [-9.14, 38.72],   lm: [-9.22, 38.69] },
    kenya:          { iso: 'ken', cap: [36.82, -1.29],   lm: [37.31, -0.15] },
    egypt:          { iso: 'egy', cap: [31.24, 30.04],   lm: [31.13, 29.98] },
    south_africa:   { iso: 'zaf', cap: [28.19, -25.75],  lm: [18.40, -33.96] },
    morocco:        { iso: 'mar', cap: [-6.84, 34.02],   lm: [-7.99, 31.62] },
    nigeria:        { iso: 'nga', cap: [7.49, 9.06],     lm: [7.23, 9.13] },
    japan:          { iso: 'jpn', cap: [139.69, 35.69],  lm: [138.73, 35.36] },
    china:          { iso: 'chn', cap: [116.40, 39.90],  lm: [116.02, 40.36] },
    india:          { iso: 'ind', cap: [77.21, 28.61],   lm: [78.04, 27.18] },
    south_korea:    { iso: 'kor', cap: [126.98, 37.57],  lm: [126.98, 37.58] },
    thailand:       { iso: 'tha', cap: [100.50, 13.76],  lm: [100.49, 13.75] },
    singapore:      { iso: 'sgp', cap: [103.82, 1.35],   lm: [103.86, 1.28] },
    indonesia:      { iso: 'idn', cap: [106.85, -6.21],  lm: [110.20, -7.61] },
    taiwan:         { iso: 'twn', cap: [121.56, 25.03],  lm: [121.56, 25.03] },
    australia:      { iso: 'aus', cap: [149.13, -35.28], lm: [151.21, -33.86] },
    new_zealand:    { iso: 'nzl', cap: [174.78, -41.29], lm: [167.93, -44.67] }
  };

  // Map view of each continent [lon0, lat0, lon1, lat1] and its map code.
  const VIEW = {
    south_america: { box: [-111, -57, -32, 14], code: 'sa' },
    north_america: { box: [-168, 8, -52, 72],   code: 'na' },
    europe:        { box: [-24, 34, 42, 70],    code: 'eu' },
    africa:        { box: [-19, -36, 53, 38],   code: 'af' },
    asia:          { box: [26, -11, 150, 55],   code: 'as' },
    oceania:       { box: [111, -48, 179, -9],  code: 'oc' }
  };
  const CODE2CONT = { sa: 'south_america', na: 'north_america', eu: 'europe', af: 'africa', as: 'asia', oc: 'oceania' };

  // Land tints per continent: [land, taught country, visited country]
  const TINT = {
    sa: ['#cfe8c3', '#9dd48b', '#2f9e57'],
    na: ['#ddd3f6', '#b9a6ef', '#7357d8'],
    eu: ['#cfdff6', '#9fc1ef', '#3b78d8'],
    af: ['#f6dcc3', '#f0bb8a', '#d4742c'],
    as: ['#f6e7b9', '#efd27a', '#c99412'],
    oc: ['#f5d2e3', '#eda5c8', '#cf4f8c'],
    an: ['#f3f7fa', '#f3f7fa', '#f3f7fa']
  };

  function mix(a, b, t2) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch2 = sh => Math.round(((pa >> sh) & 255) * (1 - t2) + ((pb >> sh) & 255) * t2);
    return '#' + ((1 << 24) + (ch2(16) << 16) + (ch2(8) << 8) + ch2(0)).toString(16).slice(1);
  }
  function pale(cc) { return mix((TINT[cc] || TINT.an)[0], '#f3f2ec', 0.55); }

  // Ocean & sea names, placed on the map at [lon, lat].
  const WATERS = {
    pacific:  { en: 'Pacific Ocean',  es: 'Océano Pacífico',  at: [[-138, -6], [164, 22]] },
    atlantic: { en: 'Atlantic Ocean', es: 'Océano Atlántico', at: [[-40, 30], [-17, -24]] },
    indian:   { en: 'Indian Ocean',   es: 'Océano Índico',    at: [[78, -24]] },
    arctic:   { en: 'Arctic Ocean',   es: 'Océano Ártico',    at: [[-160, 77]] },
    southern: { en: 'Southern Ocean', es: 'Océano Austral',   at: [[25, -62]] },
    mediterranean: { en: 'Mediterranean Sea', es: 'Mar Mediterráneo', at: [[18, 34.6]], sea: true },
    caribbean: { en: 'Caribbean Sea', es: 'Mar Caribe', at: [[-75, 15]], sea: true }
  };

  // Flights between capitals, along the shortest (great-circle) route.
  // Each `cross` was checked against the 1:50m map: the route's open-water
  // stretch lies in that ocean/sea. `over` = a country the route crosses.
  const FLIGHTS = [
    { from: 'chile',          to: 'spain',          cross: 'atlantic', not: ['pacific', 'indian', 'arctic'], over: 'brazil', notOver: ['peru', 'colombia', 'venezuela'] },
    { from: 'japan',          to: 'mexico',         cross: 'pacific',  not: ['atlantic', 'indian', 'arctic'] },
    { from: 'south_africa',   to: 'australia',      cross: 'indian',   not: ['atlantic', 'pacific', 'arctic'] },
    { from: 'brazil',         to: 'nigeria',        cross: 'atlantic', not: ['pacific', 'indian', 'southern'] },
    { from: 'canada',         to: 'united_kingdom', cross: 'atlantic', not: ['pacific', 'indian', 'southern'] },
    { from: 'new_zealand',    to: 'chile',          cross: 'pacific',  not: ['atlantic', 'indian', 'arctic'] },
    { from: 'kenya',          to: 'india',          cross: 'indian',   not: ['atlantic', 'pacific', 'arctic'], over: 'somalia', notOver: ['egypt', 'saudi_arabia', 'madagascar'] },
    { from: 'india',          to: 'indonesia',      cross: 'indian',   not: ['atlantic', 'arctic', 'mediterranean'] },
    { from: 'argentina',      to: 'south_africa',   cross: 'atlantic', not: ['pacific', 'indian', 'arctic'] },
    { from: 'australia',      to: 'united_states',  cross: 'pacific',  not: ['atlantic', 'indian', 'arctic'] },
    { from: 'peru',           to: 'new_zealand',    cross: 'pacific',  not: ['atlantic', 'indian', 'arctic'] },
    { from: 'japan',          to: 'australia',      cross: 'pacific',  not: ['atlantic', 'indian', 'arctic'], over: 'papua_new_guinea', notOver: ['philippines', 'new_zealand', 'china'] },
    { from: 'thailand',       to: 'kenya',          cross: 'indian',   not: ['atlantic', 'pacific', 'arctic'], over: 'india', notOver: ['china', 'pakistan', 'madagascar'] },
    { from: 'spain',          to: 'argentina',      cross: 'atlantic', not: ['pacific', 'indian', 'arctic'], over: 'brazil', notOver: ['chile', 'peru', 'colombia'] },
    { from: 'egypt',          to: 'greece',         cross: 'mediterranean', not: ['caribbean', 'atlantic', 'indian'], minTier: 'advanced' },
    { from: 'morocco',        to: 'italy',          cross: 'mediterranean', not: ['caribbean', 'pacific', 'indian'], minTier: 'advanced' },
    { from: 'china',          to: 'united_states',  cross: 'arctic',   not: ['atlantic', 'indian', 'southern'], minTier: 'expert',
      note: { en: 'The shortest way from Beijing to Washington goes far north, over Siberia, the Arctic Ocean and Canada.', es: 'El camino más corto de Pekín a Washington va muy al norte: sobre Siberia, el océano Ártico y Canadá.' } }
  ];
  const OVER_NAMES = {
    brazil: ['Brazil', 'Brasil'], peru: ['Peru', 'Perú'], colombia: ['Colombia', 'Colombia'], venezuela: ['Venezuela', 'Venezuela'],
    somalia: ['Somalia', 'Somalia'], egypt: ['Egypt', 'Egipto'], saudi_arabia: ['Saudi Arabia', 'Arabia Saudita'], madagascar: ['Madagascar', 'Madagascar'],
    papua_new_guinea: ['Papua New Guinea', 'Papúa Nueva Guinea'], philippines: ['Philippines', 'Filipinas'], new_zealand: ['New Zealand', 'Nueva Zelanda'], china: ['China', 'China'],
    india: ['India', 'India'], pakistan: ['Pakistan', 'Pakistán'], chile: ['Chile', 'Chile']
  };

  const TIERS = ['beginner', 'intermediate', 'advanced', 'expert'];

  // Where a country's name sits on the map when its centre is awkward.
  const LABEL_AT = {
    chile: [-71.5, -30], argentina: [-65, -37], brazil: [-52, -10], peru: [-75, -9.5], united_states: [-98, 39],
    canada: [-105, 58], norway: [9, 61], indonesia: [114, -1], japan: [138, 37], united_kingdom: [-2, 53.5],
    new_zealand: [172.5, -42], italy: [12.8, 42.6], portugal: [-8.2, 39.6], greece: [22, 39.4], vietnam: [106, 15]
  };

  // ── State ──
  let currentContinent = null;
  let currentCountry = null;
  let lang = 'en';
  let mapMode = 'world';
  let worldMap = null;

  // ── Quiz state ──
  let quizPool = [];
  let quizIdx = 0;
  let quizCorrect = 0;
  let quizCountryId = null;

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    // Saves used to land on a bare `world<kid>` key — see
    // adoptLegacyAppKey in auth.js for what that cost.
    if (typeof adoptLegacyAppKey === 'function') adoptLegacyAppKey('world', 'zs_world_');
    return getUserAppKey('zs_world_');
  }
  function _load() {
    const k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; }
  }
  function _save(data) {
    const k = _key();
    if (k) {
      try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Helpers ──
  const ALL = [];
  CONTINENTS.forEach(c => c.countries.forEach(k => ALL.push({ k, c })));
  function findCountry(id) { const r = ALL.find(x => x.k.id === id); return r ? r.k : null; }
  function contOf(id) { const r = ALL.find(x => x.k.id === id); return r ? r.c : null; }
  function byIso(iso) { return ALL.find(x => GEO[x.k.id] && GEO[x.k.id].iso === iso) || null; }
  const ATLAS = {};
  if (typeof WORLD_ATLAS_DATA !== 'undefined') WORLD_ATLAS_DATA.forEach(a => { ATLAS[a.id] = a; });
  function isoName(iso) {
    const t = byIso(iso);
    if (t) return nm(t.k);
    const a = ATLAS[iso];
    return a ? (lang === 'es' ? a.nameEs : a.name) : '';
  }
  function nm(o) { return lang === 'es' ? (o.nameEs || o.name) : o.name; }
  function t(en, es) { return lang === 'es' ? es : en; }
  function esc(s) {
    if (typeof escHtml === 'function') return escHtml(String(s == null ? '' : s));
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) { /* audio optional */ } }
  function tier() { return (typeof getAgeTier === 'function') ? getAgeTier() : 'intermediate'; }
  function tierAtLeast(min) { return TIERS.indexOf(tier()) >= TIERS.indexOf(min); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hasMap() { return typeof WorldMap !== 'undefined'; }
  function flagSVG(id, cls, wave) {
    const g = GEO[id];
    if (hasMap() && g && WorldMap.hasFlag(g.iso)) return WorldMap.flag(g.iso, { cls: cls || 'we-flag', wave: !!wave, label: t('Flag of ', 'Bandera de ') + nm(findCountry(id)) });
    const k = findCountry(id);
    return '<span class="' + (cls || 'we-flag') + ' we-flag-emoji">' + (k ? k.flag : '') + '</span>';
  }
  function lmIcon(id, cls, bg) {
    const k = findCountry(id);
    if (typeof WEArt !== 'undefined' && WEArt.has(id)) return WEArt.landmarkSVG(id, cls || 'we-lm-svg', k ? nm(k.landmark) : '', bg);
    return '<span class="' + (cls || 'we-lm-svg') + ' we-lm-emoji">' + (k ? k.landmark.emoji : '') + '</span>';
  }
  function fmtLL(ll) {
    const la = Math.abs(ll[1]).toFixed(1) + '°' + (ll[1] >= 0 ? 'N' : 'S');
    const lo = Math.abs(ll[0]).toFixed(1) + '°' + (ll[0] >= 0 ? t('E', 'E') : t('W', 'O'));
    return la + ' ' + lo;
  }

  // ================================================================
  //  MAP VIEW — one interactive SVG world map (Equal Earth)
  // ================================================================
  let mapUid = 0;
  function FULL() { return [-24, -30, WorldMap.W + 48, WorldMap.H + 60]; }
  function MapView(host, opts) {
    this.host = host;
    this.o = opts || {};
    this.id = 'wem' + (++mapUid);
    this.box = FULL();
    this._build();
  }
  MapView.prototype._build = function() {
    const W = WorldMap.W, H = WorldMap.H, id = this.id;
    const ns = 'http://www.w3.org/2000/svg';
    let s = '<svg class="we-map" xmlns="' + ns + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(t('World map', 'Mapa del mundo')) + '">' +
      '<defs>' +
        '<radialGradient id="' + id + 'oc" cx="50%" cy="48%" r="62%"><stop offset="0" stop-color="#7cc1e6"/><stop offset=".6" stop-color="#94cdea"/><stop offset="1" stop-color="#c3e4f4"/></radialGradient>' +
        '<linearGradient id="' + id + 'sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1d3b5a" stop-opacity=".10"/></linearGradient>' +
      '</defs>' +
      '<path class="we-globe-shadow" d="' + WorldMap.outline() + '" transform="translate(0,9)"/>' +
      '<path class="we-ocean" d="' + WorldMap.outline() + '" fill="url(#' + id + 'oc)"/>' +
      '<path class="we-grat" d="' + WorldMap.graticule(30) + '"/>' +
      '<path class="we-equator" d="' + WorldMap.parallel(0) + '"/>' +
      '<g class="we-shelf"><path d="' + WorldMap.landPath() + '"/></g>' +
      '<g class="we-lands">';
    WorldMap.codes().forEach(code => {
      s += '<path class="we-land" data-code="' + code + '" d="' + WorldMap.path(code) + '"/>';
    });
    s += '</g><path class="we-relief" d="' + WorldMap.outline() + '" fill="url(#' + id + 'sh)"/>' +
      '<g class="we-waters"></g><g class="we-marks"></g><g class="we-over"></g></svg>';
    this.host.innerHTML = s;
    this.svg = this.host.querySelector('svg');
    this.lands = {};
    this.svg.querySelectorAll('.we-land').forEach(p => { this.lands[p.dataset.code] = p; });
    this.gWaters = this.svg.querySelector('.we-waters');
    this.gMarks = this.svg.querySelector('.we-marks');
    this.gOver = this.svg.querySelector('.we-over');
    this._wire();
  };
  // Taps: pointerdown+up with little movement → country under the finger.
  MapView.prototype._wire = function() {
    let down = null;
    this.svg.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    this.svg.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 12) return;
      const pt = this.toGrid(e.clientX, e.clientY);
      let target = e.target.closest ? e.target.closest('[data-code],[data-hit]') : null;
      let code = target ? (target.dataset.code || target.dataset.hit) : null;
      if (this.o.onTap) this.o.onTap(code, pt, e);
    });
  };
  MapView.prototype.toGrid = function(cx, cy) {
    const r = this.svg.getBoundingClientRect(), b = this.box;
    const s = Math.max(b[2] / r.width, b[3] / r.height);
    const ox = b[0] + b[2] / 2 - (r.width * s) / 2, oy = b[1] + b[3] / 2 - (r.height * s) / 2;
    return [ox + (cx - r.left) * s, oy + (cy - r.top) * s];
  };
  // User units per screen pixel at the current zoom.
  MapView.prototype.upp = function() {
    const r = this.svg.getBoundingClientRect(), b = this.box;
    if (!r.width) return b[2] / 360;
    return Math.max(b[2] / r.width, b[3] / r.height);
  };
  // Grid box that shows a lon/lat box (or a grid box with {grid:true}) in
  // this SVG's shape. topPx keeps room for the floating title bar.
  // Text scale: smaller labels on small maps.
  MapView.prototype.fs = function() {
    const r = this.svg.getBoundingClientRect();
    return Math.max(0.7, Math.min(1.1, (r.width || 700) / 760));
  };
  MapView.prototype.fit = function(llBox, pad, topPx, isGrid) {
    const b = isGrid ? llBox : WorldMap.box(llBox), r = this.svg.getBoundingClientRect();
    const rw = r.width || 360, rh = r.height || 340;
    pad = pad == null ? 0.04 : pad;
    topPx = Math.min(topPx || 0, rh * 0.3);
    // reserve topPx of the screen height above the content
    const aspect = rw / (rh - topPx);
    let x = b[0] - b[2] * pad, y = b[1] - b[3] * pad, w = b[2] * (1 + 2 * pad), h = b[3] * (1 + 2 * pad);
    if (w / h > aspect) { const nh = w / aspect; y -= (nh - h) / 2; h = nh; } else { const nw = h * aspect; x -= (nw - w) / 2; w = nw; }
    const extra = h * topPx / (rh - topPx);
    y -= extra; h += extra;
    // keep inside the map where we can
    const F = FULL();
    if (w < F[2]) x = Math.max(F[0], Math.min(x, F[0] + F[2] - w));
    if (h < F[3]) y = Math.max(F[1], Math.min(y, F[1] + F[3] - h));
    return [x, y, w, h];
  };
  MapView.prototype.setBox = function(b) {
    this.box = b.slice();
    this.svg.setAttribute('viewBox', b.map(v => v.toFixed(1)).join(' '));
    this.svg.style.setProperty('--upp', this.upp().toFixed(4));
  };
  MapView.prototype.zoomTo = function(b, ms, done) {
    const from = this.box.slice(), t0 = performance.now(), self = this;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (!ms || window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this.setBox(b); if (done) done(); return; }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    function step(now) {
      const k = Math.min(1, (now - t0) / ms), e = ease(k);
      self.setBox(from.map((v, i) => v + (b[i] - v) * e));
      if (k < 1) self._raf = requestAnimationFrame(step); else { self._raf = null; if (done) done(); }
    }
    this._raf = requestAnimationFrame(step);
  };
  MapView.prototype.paint = function(fn) {
    for (const code in this.lands) {
      const st = fn(code, WorldMap.continentOf(code)) || {};
      const p = this.lands[code];
      p.setAttribute('fill', st.fill || '#e9ecea');
      p.setAttribute('class', 'we-land' + (st.cls ? ' ' + st.cls : ''));
    }
  };
  MapView.prototype.clear = function() { this.gMarks.innerHTML = ''; this.gOver.innerHTML = ''; this.gWaters.innerHTML = ''; };
  MapView.prototype.waters = function(keys) {
    const u = this.upp();
    let s = '';
    keys.forEach(k => {
      const w = WATERS[k];
      w.at.forEach(ll => {
        const p = WorldMap.project(ll[0], ll[1]);
        const fs = (w.sea ? 10 : 12.5) * u * this.fs();
        s += '<text class="we-water' + (w.sea ? ' sea' : '') + '" x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" font-size="' + fs.toFixed(2) + '" text-anchor="middle">' + esc(lang === 'es' ? w.es : w.en) + '</text>';
      });
    });
    this.gWaters.innerHTML = s;
  };
  // Text label at a grid point; size in screen px.
  MapView.prototype.labelSVG = function(x, y, text, px, cls) {
    const u = this.upp();
    const k = cls && cls.indexOf('cont') >= 0 ? this.fs() : 1;
    return '<text class="we-label ' + (cls || '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + (px * u * k).toFixed(2) + '" stroke-width="' + (3 * u * k).toFixed(2) + '" text-anchor="middle">' + esc(text) + '</text>';
  };
  MapView.prototype.dotSVG = function(x, y, px, cls, extra) {
    const u = this.upp();
    return '<circle class="' + (cls || 'we-dot') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (px * u).toFixed(2) + '" stroke-width="' + (2 * u).toFixed(2) + '"' + (extra || '') + '/>';
  };
  // Landmark badges with leader lines, nudged apart so none overlap.
  MapView.prototype.landmarks = function(ids, opts) {
    opts = opts || {};
    const u = this.upp(), size = (opts.px || 38) * u, half = size / 2, box = this.box;
    const obst = opts.obstacles || [];
    const topSafe = box[1] + (opts.topPx || 0) * u + half + 4 * u;
    const items = ids.map(id => {
      const g = GEO[id], p = WorldMap.project(g.lm[0], g.lm[1]);
      return { id, px: p[0], py: p[1], x: p[0] + size * 0.55, y: p[1] - size * 0.85 };
    });
    for (let it = 0; it < 140; it++) {
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = size * 1.12;
        if (d < min) { const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
      }
      items.forEach(a => {
        // keep off labels and pins
        obst.forEach(o => {
          const ox = Math.max(o.x0 - half, Math.min(a.x, o.x1 + half)), oy = Math.max(o.y0 - half, Math.min(a.y, o.y1 + half));
          if (a.x > o.x0 - half && a.x < o.x1 + half && a.y > o.y0 - half && a.y < o.y1 + half) {
            const l = a.x - (o.x0 - half), r = (o.x1 + half) - a.x, t2 = a.y - (o.y0 - half), b2 = (o.y1 + half) - a.y, m = Math.min(l, r, t2, b2);
            if (m === l) a.x -= l * 0.5; else if (m === r) a.x += r * 0.5; else if (m === t2) a.y -= t2 * 0.5; else a.y += b2 * 0.5;
          }
          void ox; void oy;
        });
        items.forEach(b => { if (b === a) return; const dx = a.x - b.px, dy = a.y - b.py, d = Math.hypot(dx, dy) || 0.01; if (d < half * 1.1) { a.x += dx / d * (half * 1.1 - d) * 0.5; a.y += dy / d * (half * 1.1 - d) * 0.5; } });
        a.x += (a.px + size * 0.55 - a.x) * 0.015; a.y += (a.py - size * 0.85 - a.y) * 0.015;
        a.x = Math.max(box[0] + half + 4 * u, Math.min(box[0] + box[2] - half - 4 * u, a.x));
        a.y = Math.max(topSafe, Math.min(box[1] + box[3] - half - 4 * u, a.y));
      });
    }
    let s = '';
    const visited = opts.visited || [];
    items.forEach(a => {
      const k = findCountry(a.id);
      s += '<g class="we-lm' + (visited.indexOf(a.id) >= 0 ? ' seen' : '') + '" data-hit="lm:' + a.id + '" role="button" aria-label="' + esc(nm(k.landmark)) + '">' +
        '<path class="we-lm-lead" d="M' + a.px.toFixed(1) + ',' + a.py.toFixed(1) + 'L' + a.x.toFixed(1) + ',' + a.y.toFixed(1) + '" stroke-width="' + (1.6 * u).toFixed(2) + '"/>' +
        '<circle class="we-lm-pin" cx="' + a.px.toFixed(1) + '" cy="' + a.py.toFixed(1) + '" r="' + (3.2 * u).toFixed(2) + '" stroke-width="' + (1.5 * u).toFixed(2) + '"/>' +
        '<rect class="we-lm-shadow" x="' + (a.x - size / 2).toFixed(1) + '" y="' + (a.y - size / 2 + 2.5 * u).toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + size.toFixed(1) + '" rx="' + (size * 0.24).toFixed(1) + '"/>' +
        '<g transform="translate(' + (a.x - size / 2).toFixed(1) + ',' + (a.y - size / 2).toFixed(1) + ') scale(' + (size / 40).toFixed(4) + ')">' + WEArt.landmark(a.id, '#ffffff') +
        '<rect x="1" y="1" width="38" height="38" rx="8.4" fill="none" stroke="#fff" stroke-width="2.2"/></g></g>';
    });
    this.gMarks.insertAdjacentHTML('beforeend', s);
  };

  // ── Paint helpers ──
  function taughtIsoSet(cont) {
    const set = {};
    (cont ? cont.countries : ALL.map(x => x.k)).forEach(k => { if (GEO[k.id]) set[GEO[k.id].iso] = k.id; });
    return set;
  }

  // ================================================================
  //  EXPLORE SCREEN — world view → continent view
  // ================================================================
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }
    const data = _load();
    if (data.lang === 'es') lang = 'es';
    _applyStaticText();
    _renderExplore();
    _updateGlobalStars();
    window.addEventListener('resize', () => { if (worldMap && document.getElementById('screen-select').classList.contains('active')) _refitMap(); });
  }

  function _applyStaticText() {
    document.documentElement.lang = lang;
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'EN' : 'ES';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('we-title', t('World Explorer', 'Explorador del Mundo'));
    set('we-ch-title', t('Map challenges', 'Desafíos del mapa'));
  }

  function _renderExplore() {
    const host = document.getElementById('we-stage-map');
    if (!host) return;
    if (!hasMap()) { host.innerHTML = '<p class="we-nomap">' + esc(t('Map data did not load.', 'No se cargó el mapa.')) + '</p>'; }
    else if (!worldMap) {
      worldMap = new MapView(host, { onTap: _onExploreTap });
    }
    if (mapMode === 'continent' && currentContinent) _showContinentMode(false);
    else _showWorldMode(false);
    _renderChallengeCards();
  }

  function _paintWorld(hoverCont) {
    const visited = (_load().visited) || [];
    const taught = taughtIsoSet(null);
    worldMap.paint((code, cc) => {
      const tint = TINT[cc] || TINT.an;
      const id = taught[code];
      if (id && visited.indexOf(id) >= 0) return { fill: tint[2], cls: 'visited' + (cc !== 'an' ? ' tap' : '') };
      return { fill: id ? tint[1] : tint[0], cls: cc !== 'an' ? 'tap' : '' };
    });
  }

  function _showWorldMode(animate) {
    mapMode = 'world';
    currentContinent = null;
    const stage = document.getElementById('we-stage');
    if (stage) stage.className = 'we-stage world';
    _setHud();
    if (worldMap) {
      _paintWorld();
      worldMap.clear();
      const full = FULL();
      const after = () => {
        worldMap.waters(window.innerWidth < 560 ? ['pacific', 'atlantic', 'indian'] : ['pacific', 'atlantic', 'indian', 'arctic', 'southern']);
        // Continent names over the land
        let s = '';
        CONTINENTS.forEach(c => {
          const v = VIEW[c.id]; if (!v) return;
          const ll = c.id === 'europe' ? [15, 56] : c.id === 'asia' ? [92, 44] : c.id === 'oceania' ? [134, -25] : c.id === 'africa' ? [20, 6] : c.id === 'north_america' ? [-101, 47] : [-60, -12];
          const p = WorldMap.project(ll[0], ll[1]);
          s += worldMap.labelSVG(p[0], p[1], nm(c), 13, 'cont');
        });
        worldMap.gOver.innerHTML = s;
      };
      if (animate) { worldMap.gOver.innerHTML = ''; worldMap.zoomTo(full, 750, after); } else { worldMap.setBox(full); after(); }
    }
    _renderBelowWorld();
  }

  function _refitMap() {
    if (!worldMap) return;
    if (mapMode === 'continent' && currentContinent) _showContinentMode(false);
    else _showWorldMode(false);
  }

  function _setHud() {
    const back = document.getElementById('we-stage-back');
    const title = document.getElementById('we-stage-title');
    const hint = document.getElementById('we-stage-hint');
    if (mapMode === 'continent' && currentContinent) {
      if (back) back.hidden = false;
      if (title) title.textContent = nm(currentContinent);
      if (hint) hint.textContent = t('Tap a coloured country or a landmark', 'Toca un país de color o un monumento');
    } else {
      if (back) back.hidden = true;
      if (title) title.textContent = t('Pick a continent', 'Elige un continente');
      if (hint) hint.textContent = t('Tap the map to fly there', 'Toca el mapa para volar allí');
    }
  }

  function _onExploreTap(code, pt) {
    if (mapMode === 'world') {
      const cc = code ? WorldMap.continentOf(code) : null;
      const cont = cc && CODE2CONT[cc];
      if (cont) { sfx('click'); openContinent(cont); }
      return;
    }
    if (!code) return;
    if (code.indexOf('lm:') === 0) { sfx('click'); openCountry(code.slice(3)); return; }
    const hit = byIso(code);
    if (hit && currentContinent && hit.c.id === currentContinent.id) { sfx('click'); openCountry(hit.k.id); return; }
    // Another continent's land: fly there.
    const cc = WorldMap.continentOf(code), cont = CODE2CONT[cc];
    if (cont && (!currentContinent || cont !== currentContinent.id)) { sfx('click'); openContinent(cont); }
  }

  function openContinent(id) {
    const c = CONTINENTS.find(x => x.id === id);
    if (!c) return;
    if (c.countries.length === 0) { _showFeedback('🚧'); return; }
    currentContinent = c;
    const scr = document.getElementById('screen-select');
    if (!scr.classList.contains('active')) { _showScreen('select'); }
    if (!worldMap) _renderExplore();
    _showContinentMode(true);
    const stage = document.getElementById('we-stage');
    if (stage && stage.scrollIntoView && window.scrollY > stage.offsetTop) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _showContinentMode(animate) {
    mapMode = 'continent';
    const c = currentContinent, v = VIEW[c.id];
    const stage = document.getElementById('we-stage');
    if (stage) stage.className = 'we-stage continent';
    _setHud();
    if (!worldMap) { _renderBelowContinent(); return; }
    const visited = (_load().visited) || [];
    const taught = taughtIsoSet(c);
    worldMap.paint((code, cc) => {
      const id = taught[code];
      const tint = TINT[cc] || TINT.an;
      if (id) return { fill: visited.indexOf(id) >= 0 ? tint[2] : tint[1], cls: 'tap taught' + (visited.indexOf(id) >= 0 ? ' visited' : '') };
      if (cc === v.code) return { fill: pale(cc), cls: 'dim' };
      return { fill: cc === 'an' ? TINT.an[0] : '#e7e8e2', cls: 'far' + (CODE2CONT[cc] ? ' tap' : '') };
    });
    worldMap.clear();
    // Let the stage take its continent shape first, then fit.
    requestAnimationFrame(() => {
      const target = worldMap.fit(v.box, 0.02, 64);
      const after = () => _decorateContinent();
      if (animate) worldMap.zoomTo(target, 800, after); else { worldMap.setBox(target); after(); }
    });
    _renderBelowContinent();
  }

  function _decorateContinent() {
    const c = currentContinent;
    if (!c || !worldMap) return;
    const visited = (_load().visited) || [];
    const ids = c.countries.map(k => k.id).filter(id => GEO[id]);
    const waters = { south_america: ['pacific', 'atlantic', 'caribbean'], north_america: ['pacific', 'atlantic', 'arctic', 'caribbean'], europe: ['atlantic', 'mediterranean'], africa: ['atlantic', 'indian', 'mediterranean'], asia: ['pacific', 'indian'], oceania: ['pacific', 'indian'] }[c.id] || [];
    worldMap.waters(waters);
    let s = '';
    const u = worldMap.upp(), wide = window.innerWidth >= 700, obstacles = [];
    ids.forEach(id => {
      const g = GEO[id], inf = WorldMap.info(g.iso);
      if (!inf) return;
      const small = inf.a < 40, seen = visited.indexOf(id) >= 0;
      const k = findCountry(id);
      // tiny countries get a tappable ring so they can be reached
      if (small) s += worldMap.dotSVG(inf.c[0], inf.c[1], 9, 'we-hitring' + (seen ? ' visited' : ''), ' data-hit="' + g.iso + '"');
      const px = small ? 10.5 : (wide ? 13 : 11.5);
      const lab = LABEL_AT[id] ? WorldMap.project(LABEL_AT[id][0], LABEL_AT[id][1]) : inf.c;
      const lx = lab[0], ly = lab[1] + (small ? 19 * u : 0);
      const tw = nm(k).length * px * 0.56 * u + (seen ? 16 * u : 0);
      s += worldMap.labelSVG(lx + (seen ? 8 * u : 0), ly + px * 0.35 * u, nm(k), px, seen ? 'seen' : '');
      if (seen) s += '<g class="we-check" transform="translate(' + (lx - tw / 2 + 6 * u).toFixed(1) + ',' + ly.toFixed(1) + ') scale(' + u.toFixed(4) + ')"><circle r="7" /><path d="M-3.2,0 l2.2,2.4 4.2-4.6"/></g>';
      obstacles.push({ x0: lx - tw / 2, x1: lx + tw / 2, y0: ly - px * 0.6 * u, y1: ly + px * 0.6 * u });
    });
    worldMap.gOver.innerHTML = s;
    if (typeof WEArt !== 'undefined') worldMap.landmarks(ids, { visited, px: wide ? 46 : 28, obstacles, topPx: 60 });
  }

  function _renderBelowWorld() {
    const host = document.getElementById('we-below');
    if (!host) return;
    const visited = (_load().visited) || [];
    host.innerHTML = '<div class="continent-grid">' + CONTINENTS.map(c => {
      const count = c.countries.filter(k => visited.includes(k.id)).length;
      const total = c.countries.length;
      const pct = total ? Math.round(count / total * 100) : 0;
      return '<button type="button" class="continent-card" onclick="WorldExplorer.openContinent(\'' + c.id + '\')" style="--cc:' + c.color + '">' +
        '<span class="continent-icon">' + _continentGlyph(c.id) + '</span>' +
        '<span class="continent-text"><span class="continent-name">' + esc(nm(c)) + '</span>' +
        '<span class="continent-stats">' + count + '/' + total + ' ' + t('countries', 'países') + '</span>' +
        '<span class="we-bar"><span style="width:' + pct + '%"></span></span></span>' +
        '<span class="continent-flags">' + c.countries.slice(0, 3).map(k => flagSVG(k.id, 'we-flag mini')).join('') + '</span>' +
      '</button>';
    }).join('') + '</div>';
  }

  // A small silhouette of the continent, drawn from the map itself.
  function _continentGlyph(id) {
    if (!hasMap()) return '';
    const v = VIEW[id], b = WorldMap.box(v.box), code = v.code;
    let d = '';
    WorldMap.codes().forEach(cc => { if (WorldMap.continentOf(cc) === code) d += WorldMap.path(cc); });
    return '<svg viewBox="' + b.map(n => n.toFixed(0)).join(' ') + '" aria-hidden="true" preserveAspectRatio="xMidYMid meet"><path d="' + d + '" fill="currentColor"/></svg>';
  }

  function _renderBelowContinent() {
    const host = document.getElementById('we-below');
    if (!host || !currentContinent) return;
    const visited = (_load().visited) || [];
    host.innerHTML = '<div class="we-country-grid">' + currentContinent.countries.map(k => {
      const v = visited.includes(k.id);
      return '<button type="button" class="we-country-chip' + (v ? ' visited' : '') + '" onclick="WorldExplorer.openCountry(\'' + k.id + '\')">' +
        flagSVG(k.id, 'we-flag chip') +
        '<span class="we-chip-name">' + esc(nm(k)) + '</span>' +
        (v ? '<span class="we-chip-check" aria-label="' + esc(t('Visited', 'Visitado')) + '">✓</span>' : '') +
      '</button>';
    }).join('') + '</div>';
  }

  function backToSelect() {
    _showScreen('select');
    if (!worldMap) _renderExplore();
    _showWorldMode(mapMode === 'continent');
  }
  function backToContinent() {
    _showScreen('select');
    if (currentContinent) { if (!worldMap) _renderExplore(); _showContinentMode(false); }
    else backToSelect();
  }

  // ================================================================
  //  COUNTRY CARD
  // ================================================================
  function _locatorSVG(id) {
    if (!hasMap() || !GEO[id]) return '';
    const g = GEO[id], cont = contOf(id), v = VIEW[cont.id];
    const inf = WorldMap.info(g.iso);
    // Frame: the country plus a margin, at least a slice of its continent.
    let b = inf ? inf.b.slice() : WorldMap.box(v.box);
    let w = b[2] - b[0], h = b[3] - b[1];
    const minW = 150, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    w = Math.max(w * 1.9, minW); h = Math.max(h * 1.6, minW * 0.62);
    if (w / h > 1.6) h = w / 1.6; else w = h * 1.6;
    const box = [cx - w / 2, cy - h / 2, w, h];
    const nb = inf ? inf.n : [];
    let s = '<svg class="we-locator" viewBox="' + box.map(n => n.toFixed(1)).join(' ') + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(t('Map: where ', 'Mapa: dónde está ') + nm(findCountry(id))) + '">' +
      '<rect x="' + box[0] + '" y="' + box[1] + '" width="' + w + '" height="' + h + '" fill="#9fd3ec"/>' +
      '<path d="' + WorldMap.graticule(10) + '" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="' + (w / 400).toFixed(2) + '"/>';
    const u = w / 340;
    WorldMap.codes().forEach(code => {
      const cc = WorldMap.continentOf(code), tint = TINT[cc] || TINT.an;
      const fill = code === g.iso ? '#e8553d' : nb.indexOf(code) >= 0 ? tint[1] : tint[0];
      s += '<path d="' + WorldMap.path(code) + '" fill="' + fill + '" stroke="#fff" stroke-width="' + (u * 0.9).toFixed(2) + '" stroke-linejoin="round"/>';
    });
    const cp = WorldMap.project(g.cap[0], g.cap[1]);
    s += '<path d="' + _starPath(cp[0], cp[1], 6 * u) + '" fill="#ffd34d" stroke="#7a3b12" stroke-width="' + (u * 0.9).toFixed(2) + '"/>';
    if (inf && inf.a < 40) s += '<circle cx="' + inf.c[0] + '" cy="' + inf.c[1] + '" r="' + (13 * u).toFixed(1) + '" fill="none" stroke="#e8553d" stroke-width="' + (2.4 * u).toFixed(2) + '"/>';
    s += '</svg>';
    const nbNames = nb.map(isoName).filter(Boolean);
    return '<div class="we-locator-wrap">' + s +
      '<div class="we-locator-key"><span><i class="k-c"></i>' + esc(nm(findCountry(id))) + '</span><span><i class="k-s">★</i>' + esc(t('Capital', 'Capital')) + '</span>' +
      (nbNames.length ? '<span class="we-nb">' + esc(t('Neighbours: ', 'Vecinos: ') + nbNames.join(', ')) + '</span>' : '<span class="we-nb">' + esc(t('No land borders', 'Sin fronteras terrestres')) + '</span>') + '</div></div>';
  }
  function _starPath(x, y, r) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; d += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1); }
    return d + 'Z';
  }

  function openCountry(id) {
    const k = findCountry(id);
    if (!k) return;
    currentCountry = k;
    currentContinent = contOf(id);
    mapMode = 'continent';
    const card = document.getElementById('country-card');
    const data = _load();
    const isVisited = (data.visited || []).includes(id);
    const g = GEO[id];
    const showLL = tierAtLeast('advanced') && g;

    card.innerHTML = `
      <div class="we-cbar">
        <button class="back-btn" aria-label="${esc(t('Back to map', 'Volver al mapa'))}" onclick="WorldExplorer.backToContinent()">←</button>
        <span class="we-cbar-cont">${esc(nm(currentContinent))}</span>
        ${isVisited ? '<span class="we-visited-pill">✓ ' + esc(t('Visited', 'Visitado')) + '</span>' : ''}
      </div>
      <div class="we-hero">
        <div class="we-hero-flag">${flagSVG(id, 'we-flag big', true)}<span class="we-pole" aria-hidden="true"></span></div>
        <div class="we-hero-text">
          <div class="country-name">${esc(nm(k))}</div>
          <div class="country-capital"><span class="we-cap-star" aria-hidden="true">★</span> ${esc(t('Capital', 'Capital'))}: <b>${esc(lang === 'es' ? k.capitalEs : k.capital)}</b></div>
        </div>
      </div>
      ${_locatorSVG(id)}
      <div class="country-info-grid">
        <div class="info-box we-lm-box">
          ${lmIcon(id, 'we-lm-svg big')}
          <div>
            <div class="info-label">${esc(t('Landmark', 'Monumento'))}</div>
            <div class="info-value">${esc(nm(k.landmark))}</div>
            ${showLL ? '<div class="we-ll">📍 ' + fmtLL(g.lm) + '</div>' : ''}
          </div>
        </div>
        <div class="info-box we-animal-box">
          <span class="we-animal-emoji" aria-hidden="true">${k.animal.emoji}</span>
          <div>
            <div class="info-label">${esc(t('Animal', 'Animal'))}</div>
            <div class="info-value">${esc(nm(k.animal))}</div>
          </div>
        </div>
      </div>
      <div class="country-facts">
        ${k.facts.map(f => `<div class="fact-item"><span class="we-fact-dot" aria-hidden="true"></span><span>${esc(lang === 'es' ? f.es : f.en)}</span></div>`).join('')}
      </div>
      ${typeof WorldExplorerExtras !== 'undefined' ? WorldExplorerExtras.renderExtras(id, lang) : ''}
      <button class="action-btn btn-primary" onclick="WorldExplorer.markVisited('${id}')" ${isVisited ? 'disabled' : ''}>
        ${isVisited ? '✅ ' + esc(t('Visited', 'Visitado')) : '🗺️ ' + esc(t('Mark as Visited', 'Marcar como Visitado'))}
      </button>
      ${(k.quiz && k.quiz.length) ? `<button class="action-btn btn-quiz" onclick="WorldExplorer.startQuiz('${id}')">❓ ${esc(t('Take Quiz', 'Tomar Quiz'))}</button>` : ''}
      <button class="action-btn btn-secondary" onclick="WorldExplorer.backToContinent()">${esc(t('Back to Map', 'Volver al Mapa'))}</button>
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
      sfx('star');
      _updateGlobalStars();
      const k = findCountry(id);
      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('World Explorer', '🌍', `Visited ${k ? k.name : id}`);
      }
      if (typeof LearningCheck !== 'undefined') {
        LearningCheck.maybePrompt('geography', () => openCountry(id));
      } else {
        openCountry(id);
      }
    }
  }

  // ================================================================
  //  COUNTRY QUIZ (unchanged rules: one star per finished quiz)
  // ================================================================
  function startQuiz(id) {
    const country = findCountry(id) || currentCountry;
    if (!country || !country.quiz || !country.quiz.length) return;
    currentCountry = country;
    quizCountryId = id;
    const original = country.quiz.slice();
    const max = TIERS.indexOf(tier() || 'expert');
    let qs = original.filter(q => TIERS.indexOf(q.tier || 'intermediate') <= max);
    if (!qs.length) qs = original;
    quizPool = qs;
    quizIdx = 0;
    quizCorrect = 0;
    _renderQuizQuestion();
    _showScreen('quiz');
  }

  function _renderQuizQuestion() {
    const wrap = document.getElementById('quiz-wrap');
    if (!wrap) return;
    const q = quizPool[quizIdx];
    if (!q) return _finishQuiz();
    const opts = lang === 'es' ? (q.optionsEs || q.options) : q.options;
    wrap.innerHTML =
      '<div class="we-qbar"><button class="back-btn quiz-back" aria-label="' + esc(t('Back', 'Volver')) + '" onclick="WorldExplorer.backToCountry()">←</button>' +
      '<span class="we-qflag">' + flagSVG(quizCountryId, 'we-flag chip') + '</span>' +
      '<div class="quiz-counter">' + (quizIdx + 1) + ' / ' + quizPool.length + '</div></div>' +
      '<div class="we-progress"><span style="width:' + (quizIdx / quizPool.length * 100) + '%"></span></div>' +
      '<h2 class="quiz-q">' + esc(lang === 'es' ? q.qEs : q.q) + '</h2>' +
      '<div class="quiz-options">' +
        opts.map((o, i) => '<button class="quiz-opt" data-correct="' + (i === q.answer ? '1' : '0') + '"><span class="we-opt-letter">' + 'ABCD'[i] + '</span>' + esc(o) + '</button>').join('') +
      '</div>' +
      '<div class="quiz-explain" id="quiz-explain"></div>';

    wrap.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.onclick = () => {
        wrap.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; });
        const correct = btn.dataset.correct === '1';
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          const right = wrap.querySelector('.quiz-opt[data-correct="1"]');
          if (right) right.classList.add('correct');
        }
        if (correct) quizCorrect++;
        sfx(correct ? 'correct' : 'wrong');
        const exEl = document.getElementById('quiz-explain');
        if (exEl && q.explain && (q.explain[lang] || q.explain.en)) {
          exEl.textContent = '💡 ' + (q.explain[lang] || q.explain.en);
          exEl.classList.add('active');
        }
        const advance = document.createElement('button');
        advance.className = 'action-btn btn-primary quiz-next';
        advance.textContent = (quizIdx + 1 < quizPool.length) ? t('Next →', 'Siguiente →') : t('See Result', 'Ver Resultado');
        advance.onclick = () => { quizIdx++; _renderQuizQuestion(); };
        wrap.appendChild(advance);
      };
    });
  }

  function _finishQuiz() {
    const total = quizPool.length;
    const acc = total > 0 ? quizCorrect / total : 0;
    const earnedStars = acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : 1;
    const data = _load();
    data.totalStars = (data.totalStars || 0) + 1;
    if (!data.quizDone) data.quizDone = [];
    if (quizCountryId && !data.quizDone.includes(quizCountryId)) data.quizDone.push(quizCountryId);
    _save(data);
    _updateGlobalStars();
    sfx('cheer');
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('World Explorer', '🌍', 'Quiz ' + currentCountry.name + ': ' + quizCorrect + '/' + total);
    }
    _results({
      stars: earnedStars,
      title: nm(currentCountry),
      score: quizCorrect + ' / ' + total + ' ' + t('correct', 'correctas'),
      again: () => startQuiz(quizCountryId),
      againLabel: t('🔁 Try Again', '🔁 Reintentar'),
      back: () => backToCountry(),
      backLabel: t('Back to Country', 'Volver al País'),
      flag: quizCountryId
    });
  }

  function _results(r) {
    const wrap = document.getElementById('results-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      (r.flag ? '<div class="we-res-flag">' + flagSVG(r.flag, 'we-flag big', true) + '</div>' : '') +
      '<div class="results-title">' + esc(r.title || '') + '</div>' +
      '<div class="results-stars" aria-label="' + r.stars + ' / 3">' + [0, 1, 2].map(i => '<span class="we-rstar' + (i < r.stars ? ' on' : '') + '" style="animation-delay:' + (i * 0.18) + 's">★</span>').join('') + '</div>' +
      '<div class="results-score">' + esc(r.score) + '</div>' +
      (r.note ? '<div class="we-res-note">' + esc(r.note) + '</div>' : '') +
      '<button class="action-btn btn-primary" id="we-res-again">' + esc(r.againLabel) + '</button>' +
      '<button class="action-btn btn-secondary" id="we-res-back">' + esc(r.backLabel) + '</button>';
    document.getElementById('we-res-again').onclick = r.again;
    document.getElementById('we-res-back').onclick = r.back;
    _showScreen('results');
  }

  function backToCountry() {
    if (quizCountryId) openCountry(quizCountryId);
    else backToContinent();
  }

  // ================================================================
  //  MAP CHALLENGES — tap the country, find the landmark, fly across
  // ================================================================
  const CH_TYPES = [
    { id: 'tap',      icon: 'tap',      en: 'Tap the country',        es: 'Toca el país',
      dEn: 'Find countries on the map.', dEs: 'Encuentra países en el mapa.' },
    { id: 'landmark', icon: 'landmark', en: 'Where is this landmark?', es: '¿Dónde está este monumento?',
      dEn: 'Put famous places where they belong.', dEs: 'Ubica lugares famosos en el mapa.' },
    { id: 'flight',   icon: 'flight',   en: 'Fly across the ocean',    es: 'Vuela sobre el océano',
      dEn: 'Which ocean do you cross?', dEs: '¿Qué océano cruzas?' }
  ];
  let ch = null;   // running challenge
  let chMap = null;

  function _chIcon(kind) {
    if (kind === 'tap') return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#dff1fb"/><path d="M8,30c4-6 8-3 11-8s6-10 12-9 9,6 8,11-6,8-11,10-14,4-20-4Z" fill="#9dd48b" stroke="#fff" stroke-width="1.5"/><path d="M19,22c3-1 6,1 6,4s-3,5-6,4-4-7 0-8Z" fill="#e8553d"/><path d="M30,27v-8a2.2,2.2 0 0,1 4.4,0v6l4,1.4c1.6.6 2.2,2 1.8,3.6l-1.4,5.6c-.4,1.4-1.6,2.4-3,2.4h-5c-1.2,0-2.2-.6-2.8-1.6l-3.4-5.4c-.6-1 .2-2.4 1.4-2.2Z" fill="#ffd9b8" stroke="#8a5a3a" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    if (kind === 'landmark') return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#fde8c8"/><path d="M12,36 L21,12 h2 L32,36 h-6 q-4-7-8,0Z" fill="#8a6a4a"/><path d="M16,28 h12 M18.6,21 h6.8" stroke="#6f5338" stroke-width="1.6"/><path d="M34,10c-3.3,0-6,2.6-6,5.8 0,4.4 6,10.2 6,10.2s6-5.8 6-10.2c0-3.2-2.7-5.8-6-5.8Z" fill="#e8553d"/><circle cx="34" cy="15.8" r="2.2" fill="#fff"/></svg>';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#d6ecfb"/><path d="M6,30 q18-20 36-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 3"/><path d="M30,15l4-1.4 1.4,1-3.4,2.8 5.4,4.6-1.4,1-6.6-2.4-4,3.4.4,2.6-1,.8-1.8-3.4-3.4-1.8.8-1 2.6.4 3.4-4-2.4-6.6 1-1.4 4.6,5.4Z" fill="#3b5b8a"/></svg>';
  }

  function _renderChallengeCards() {
    const host = document.getElementById('we-challenges');
    if (!host) return;
    const best = (_load().mapBest) || {};
    host.innerHTML = CH_TYPES.map(c => {
      const b = best[c.id] || 0;
      return '<button type="button" class="we-ch-card" onclick="WorldExplorer.startChallenge(\'' + c.id + '\')">' +
        '<span class="we-ch-icon">' + _chIcon(c.icon) + '</span>' +
        '<span class="we-ch-text"><span class="we-ch-name">' + esc(lang === 'es' ? c.es : c.en) + '</span>' +
        '<span class="we-ch-desc">' + esc(lang === 'es' ? c.dEs : c.dEn) + '</span></span>' +
        '<span class="we-ch-best" aria-label="' + esc(t('Best: ', 'Mejor: ') + b + '/3') + '">' + [0, 1, 2].map(i => '<i class="' + (i < b ? 'on' : '') + '">★</i>').join('') + '</span>' +
      '</button>';
    }).join('');
  }

  function _rounds(type) {
    const T = tier();
    if (type === 'tap') return { beginner: 5, intermediate: 6, advanced: 8, expert: 8 }[T] || 6;
    if (type === 'landmark') return { beginner: 5, intermediate: 6, advanced: 6, expert: 7 }[T] || 6;
    return { beginner: 4, intermediate: 5, advanced: 6, expert: 7 }[T] || 5;
  }

  function startChallenge(type) {
    const T = tier();
    const n = _rounds(type);
    let qs = [];
    const withGeo = ALL.filter(x => GEO[x.k.id]);
    if (type === 'tap' || type === 'landmark') {
      // Younger explorers stay in one or two continents per round;
      // older ones get the whole set.
      let pool = withGeo;
      if (T === 'beginner' || T === 'intermediate') {
        const conts = shuffle(CONTINENTS.filter(c => c.countries.length >= 3)).slice(0, T === 'beginner' ? 1 : 2).map(c => c.id);
        pool = withGeo.filter(x => conts.indexOf(x.c.id) >= 0);
      }
      qs = shuffle(pool).slice(0, n).map(x => ({ id: x.k.id }));
      if (type === 'tap' && T === 'expert') qs.forEach((q, i) => { q.byCapital = i % 2 === 1; });
    } else {
      const ok = FLIGHTS.filter(f => !f.minTier || tierAtLeast(f.minTier));
      let pick = shuffle(ok);
      if (T === 'expert' && !pick.slice(0, n).some(f => f.cross === 'arctic')) {
        const arc = ok.find(f => f.cross === 'arctic'); if (arc) pick = [arc].concat(pick.filter(f => f !== arc));
        pick = shuffle(pick.slice(0, n)).concat(pick.slice(n));
      }
      qs = pick.slice(0, n).map(f => ({ flight: f, reverse: Math.random() < 0.5 }));
      // Older explorers also say which country the plane flies over.
      if (tierAtLeast('advanced')) qs.forEach(q => { q.askOver = !!q.flight.over && Math.random() < (T === 'expert' ? 0.7 : 0.4); });
    }
    ch = { type, qs, idx: 0, score: 0, tries: 0, done: false, tier: T };
    _showScreen('challenge');
    const host = document.getElementById('we-ch-map');
    if (hasMap()) chMap = new MapView(host, { onTap: _onChallengeTap });
    _renderChallengeQ();
  }

  function _chHeader() {
    const def = CH_TYPES.find(c => c.id === ch.type);
    document.getElementById('we-ch-name').textContent = lang === 'es' ? def.es : def.en;
    document.getElementById('we-ch-count').textContent = (ch.idx + 1) + ' / ' + ch.qs.length;
    document.getElementById('we-ch-fill').style.width = (ch.idx / ch.qs.length * 100) + '%';
    document.getElementById('we-ch-score').textContent = '✓ ' + (Math.round(ch.score * 10) / 10);
  }

  function _chPrompt(html) { document.getElementById('we-ch-prompt').innerHTML = html; }
  function _chFeedback(html, kind) {
    const el = document.getElementById('we-ch-feedback');
    el.className = 'we-ch-feedback' + (kind ? ' ' + kind : '');
    el.innerHTML = html || '';
  }

  function _paintChallenge(focusCont, hintIds) {
    const T = ch.tier;
    const hint = {};
    (hintIds || []).forEach(id => { if (GEO[id]) hint[GEO[id].iso] = 1; });
    chMap.paint((code, cc) => {
      const tint = TINT[cc] || TINT.an;
      if (hint[code]) return { fill: tint[1], cls: 'tap taught' };
      if (cc === 'an') return { fill: TINT.an[0] };
      if (focusCont && VIEW[focusCont] && cc !== VIEW[focusCont].code) return { fill: '#e7e8e2', cls: 'tap far' };
      return { fill: (T === 'advanced' || T === 'expert') ? '#efeee6' : pale(cc), cls: 'tap' };
    });
  }

  function _renderChallengeQ() {
    _chHeader();
    _chFeedback('');
    const next = document.getElementById('we-ch-next');
    next.hidden = true;
    const q = ch.qs[ch.idx];
    if (!q) return _finishChallenge();
    ch.tries = 0;
    ch.answered = false;
    if (!chMap) { _chPrompt('<p>' + esc(t('Map data did not load.', 'No se cargó el mapa.')) + '</p>'); return; }
    chMap.clear();
    const T = ch.tier;
    const stage = document.getElementById('we-ch-stage');
    stage.className = 'we-ch-stage ' + ch.type + (ch.type === 'landmark' && T === 'expert' && window.innerWidth >= 700 ? ' world' : '');
    const optsHost = document.getElementById('we-ch-options');
    optsHost.innerHTML = '';

    if (ch.type === 'tap') {
      const k = findCountry(q.id), cont = contOf(q.id);
      const hintIds = T === 'beginner' ? cont.countries.map(x => x.id) : [];
      _paintChallenge(cont.id, hintIds);
      requestAnimationFrame(() => {
        chMap.setBox(_fitTaught(cont));
        // tiny countries get a tap ring so they can be hit at all
        let s = '';
        cont.countries.forEach(x => { const g = GEO[x.id], inf = g && WorldMap.info(g.iso); if (inf && inf.a < 40) s += chMap.dotSVG(inf.c[0], inf.c[1], 10, 'we-hitring', ' data-hit="' + g.iso + '"'); });
        chMap.gMarks.innerHTML = s;
      });
      const clue = q.byCapital
        ? t('Tap the country whose capital is ', 'Toca el país cuya capital es ') + '<b>' + esc(lang === 'es' ? k.capitalEs : k.capital) + '</b>'
        : t('Tap ', 'Toca ') + '<b>' + esc(nm(k)) + '</b>';
      _chPrompt((T === 'beginner' || T === 'intermediate' ? flagSVG(q.id, 'we-flag prompt', true) : '') + '<div class="we-ch-q">' + clue + '</div>');
    } else if (ch.type === 'landmark') {
      const k = findCountry(q.id), cont = contOf(q.id);
      const world = T === 'expert' && window.innerWidth >= 700;
      _paintChallenge(world ? null : cont.id, T === 'beginner' ? cont.countries.map(x => x.id) : []);
      requestAnimationFrame(() => { chMap.setBox(world ? FULL() : _fitTaught(cont)); if (world) chMap.waters(['pacific', 'atlantic', 'indian']); });
      const how = (T === 'advanced' || T === 'expert')
        ? t('Tap the exact spot on the map.', 'Toca el lugar exacto en el mapa.')
        : t('Tap the country where it is.', 'Toca el país donde está.');
      _chPrompt(lmIcon(q.id, 'we-lm-svg prompt') + '<div class="we-ch-q"><b>' + esc(nm(k.landmark)) + '</b><span class="we-ch-sub">' + esc(how) + '</span></div>');
    } else {
      _renderFlightQ(q);
    }
  }

  // Frame the continent's taught countries (plus some of the land around).
  function _fitTaught(cont) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    cont.countries.forEach(k => { const g = GEO[k.id], inf = g && WorldMap.info(g.iso); if (!inf) return;
      x0 = Math.min(x0, inf.b[0]); y0 = Math.min(y0, inf.b[1]); x1 = Math.max(x1, inf.b[2]); y1 = Math.max(y1, inf.b[3]); });
    const vb = WorldMap.box(VIEW[cont.id].box);
    // never zoom closer than half the continent view
    let w = Math.max(x1 - x0, vb[2] * 0.5), h = Math.max(y1 - y0, vb[3] * 0.5);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return chMap.fit([cx - w / 2, cy - h / 2, w, h], 0.08, 0, true);
  }

  function _flightEnds(q) {
    const f = q.flight;
    return q.reverse && !f.note ? [f.to, f.from] : [f.from, f.to];
  }

  function _renderFlightQ(q) {
    const T = ch.tier, f = q.flight, ends = _flightEnds(q);
    const A = findCountry(ends[0]), B = findCountry(ends[1]);
    _paintChallenge(null, ends);
    const showNames = T === 'beginner' || T === 'intermediate';
    requestAnimationFrame(() => {
      chMap.setBox(_fitRoute(ends));
      if (showNames) chMap.waters(['pacific', 'atlantic', 'indian', 'arctic', 'southern', 'mediterranean']);
      _drawFlight(ends);
    });
    _chPrompt('<div class="we-ch-flight">' + flagSVG(ends[0], 'we-flag prompt sm') + '<span class="we-ch-arrow">✈</span>' + flagSVG(ends[1], 'we-flag prompt sm') + '</div>' +
      '<div class="we-ch-q">' + esc(t('Fly from ', 'Vuela de ') + (lang === 'es' ? A.capitalEs : A.capital) + ' (' + nm(A) + ')' + t(' to ', ' a ') + (lang === 'es' ? B.capitalEs : B.capital) + ' (' + nm(B) + ').') +
      '<span class="we-ch-sub">' + esc(t('Which ocean or sea do you cross?', '¿Qué océano o mar cruzas?')) + '</span></div>');
    let n = T === 'beginner' ? 2 : T === 'intermediate' ? 3 : 4;
    const opts = shuffle([f.cross].concat(f.not.slice(0, n - 1)));
    _options(opts.map(k => ({ key: k, label: lang === 'es' ? WATERS[k].es : WATERS[k].en })), key => _answerFlight(key));
  }

  // Frame a flight: the route plus room around it, never tighter than a
  // third of the world (routes that wrap past the map edge show it all).
  function _fitRoute(ends) {
    const pts = WorldMap.greatCircle(GEO[ends[0]].cap, GEO[ends[1]].cap, 60);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, wrap = false;
    pts.forEach((p, i) => { if (i && Math.abs(p[0] - pts[i - 1][0]) > WorldMap.W / 3) wrap = true; x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    if (wrap) return chMap.fit(FULL(), 0, 0, true);
    const w = Math.max(x1 - x0, WorldMap.W * 0.36), h = Math.max(y1 - y0, WorldMap.H * 0.3);
    return chMap.fit([(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h], 0.14, 0, true);
  }

  function _drawFlight(ends) {
    const a = GEO[ends[0]].cap, b = GEO[ends[1]].cap;
    const pts = WorldMap.greatCircle(a, b, 90), u = chMap.upp();
    // split where the route wraps around the map edge
    const segs = [[pts[0]]];
    for (let i = 1; i < pts.length; i++) {
      if (Math.abs(pts[i][0] - pts[i - 1][0]) > WorldMap.W / 3) segs.push([]);
      segs[segs.length - 1].push(pts[i]);
    }
    let s = segs.map(sg => '<path class="we-route-shadow" d="M' + sg.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + '" stroke-width="' + (5 * u).toFixed(2) + '"/>' +
      '<path class="we-route" pathLength="100" d="M' + sg.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + '" stroke-width="' + (2.6 * u).toFixed(2) + '" stroke-dasharray="' + (2 * u).toFixed(2) + ' ' + (4 * u).toFixed(2) + '"/>').join('');
    const pa = WorldMap.project(a[0], a[1]), pb = WorldMap.project(b[0], b[1]);
    s += chMap.dotSVG(pa[0], pa[1], 5, 'we-city from') + chMap.dotSVG(pb[0], pb[1], 5, 'we-city to');
    s += '<g class="we-plane" transform="translate(' + pa[0].toFixed(1) + ',' + pa[1].toFixed(1) + ') scale(' + u.toFixed(4) + ')"><path d="M-9,0 l5-1.4 3-7 2.4,0 -1.6,7 6,0 2.4-3 1.8,0 -1.2,4.4 1.2,4.4 -1.8,0 -2.4-3 -6,0 1.6,7 -2.4,0 -3-7Z" transform="rotate(0)"/></g>';
    chMap.gOver.innerHTML = s;
    // fly the plane along the route
    const plane = chMap.gOver.querySelector('.we-plane'), t0 = performance.now(), dur = 2200;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function step(now) {
      if (!plane.isConnected) return;
      const k = reduce ? 1 : Math.max(0, Math.min(1, (now - t0) / dur)), i = Math.min(pts.length - 2, Math.floor(k * (pts.length - 1)));
      const p = pts[i], p2 = pts[i + 1];
      let ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]) * 180 / Math.PI;
      if (Math.abs(p2[0] - p[0]) > WorldMap.W / 3) ang = 0;
      const pos = k >= 1 ? pts[pts.length - 1] : p;
      plane.setAttribute('transform', 'translate(' + pos[0].toFixed(1) + ',' + pos[1].toFixed(1) + ') scale(' + u.toFixed(4) + ') rotate(' + ang.toFixed(0) + ')');
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function _options(list, onPick) {
    const host = document.getElementById('we-ch-options');
    host.innerHTML = list.map((o, i) => '<button type="button" class="quiz-opt we-ch-opt" data-key="' + esc(o.key) + '"><span class="we-opt-letter">' + 'ABCD'[i] + '</span>' + esc(o.label) + '</button>').join('');
    host.querySelectorAll('.we-ch-opt').forEach(b => { b.onclick = () => onPick(b.dataset.key, b); });
  }

  function _answerFlight(key) {
    if (ch.answered) return;
    const q = ch.qs[ch.idx], f = q.flight;
    const right = key === f.cross;
    const host = document.getElementById('we-ch-options');
    host.querySelectorAll('.we-ch-opt').forEach(b => {
      b.disabled = true;
      if (b.dataset.key === f.cross) b.classList.add('correct');
      else if (b.dataset.key === key) b.classList.add('wrong');
    });
    const ends = _flightEnds(q);
    const km = Math.round(WorldMap.distanceKm(GEO[ends[0]].cap, GEO[ends[1]].cap) / 100) * 100;
    chMap.waters([f.cross]);
    const cname = lang === 'es' ? WATERS[f.cross].es : WATERS[f.cross].en;
    let msg = (right ? t('Yes! ', '¡Sí! ') : t('Not this time. ', 'Esta vez no. ')) +
      t('This flight crosses the ', 'Este vuelo cruza el ') + cname + '. ' +
      t('About ', 'Unos ') + km.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US') + ' km.';
    if (f.note) msg += ' ' + f.note[lang];
    if (q.askOver && !q.overDone) {
      // follow-up question for older explorers
      ch.score += right ? 0.5 : 0;
      sfx(right ? 'correct' : 'wrong');
      q.overDone = true;
      _chFeedback(esc(msg), right ? 'good' : 'bad');
      setTimeout(() => _askOver(q), 900);
      return;
    }
    ch.answered = true;
    if (right) ch.score += q.askOver ? 0.5 : 1;
    sfx(right ? 'correct' : 'wrong');
    _chFeedback(esc(msg), right ? 'good' : 'bad');
    _showNext();
  }

  function _askOver(q) {
    const f = q.flight;
    document.getElementById('we-ch-prompt').querySelector('.we-ch-sub').textContent = t('Which country does the plane fly over on the way?', '¿Sobre qué país vuela el avión en el camino?');
    const opts = shuffle([f.over].concat(f.notOver.slice(0, 3)));
    _options(opts.map(k => ({ key: k, label: OVER_NAMES[k] ? OVER_NAMES[k][lang === 'es' ? 1 : 0] : k })), key => {
      if (ch.answered) return;
      ch.answered = true;
      const right = key === f.over;
      document.getElementById('we-ch-options').querySelectorAll('.we-ch-opt').forEach(b => {
        b.disabled = true;
        if (b.dataset.key === f.over) b.classList.add('correct'); else if (b.dataset.key === key) b.classList.add('wrong');
      });
      if (right) ch.score += 0.5;
      sfx(right ? 'correct' : 'wrong');
      const on = OVER_NAMES[f.over][lang === 'es' ? 1 : 0];
      _chFeedback(esc((right ? t('Right! ', '¡Correcto! ') : t('Look again: ', 'Mira otra vez: ')) + t('the route passes over ', 'la ruta pasa sobre ') + on + '.'), right ? 'good' : 'bad');
      _showNext();
    });
  }

  function _onChallengeTap(code, pt) {
    if (!ch || ch.answered || ch.type === 'flight') return;
    const q = ch.qs[ch.idx];
    const T = ch.tier;
    const g = GEO[q.id], k = findCountry(q.id);
    if (ch.type === 'tap' || (ch.type === 'landmark' && (T === 'beginner' || T === 'intermediate'))) {
      if (!code || code.indexOf('lm:') === 0) return;
      const right = code === g.iso;
      const maxTries = T === 'beginner' ? 3 : T === 'intermediate' ? 2 : 1;
      ch.tries++;
      if (right) {
        ch.answered = true;
        const pts = ch.tries === 1 ? 1 : 0.5;
        ch.score += pts;
        sfx('correct');
        _flashCountry(code, 'hit');
        const extra = ch.type === 'landmark' ? ' ' + nm(k.landmark) + t(' is in ', ' está en ') + nm(k) + '.' : '';
        _chFeedback(esc((ch.tries === 1 ? t('Spot on! ', '¡Exacto! ') : t('Got it! ', '¡Lo encontraste! ')) + nm(k) + '.' + extra), 'good');
        if (ch.type === 'landmark') _revealLandmark(q.id, null);
        _showNext();
        return;
      }
      sfx('wrong');
      _flashCountry(code, 'miss');
      const said = isoName(code);
      if (ch.tries >= maxTries) {
        ch.answered = true;
        _flashCountry(g.iso, 'hit');
        _chFeedback(esc((said ? t('That is ', 'Ese es ') + said + '. ' : '') + t('Here is ', 'Aquí está ') + nm(k) + '.'), 'bad');
        if (ch.type === 'landmark') _revealLandmark(q.id, null);
        _showNext();
      } else {
        _chFeedback(esc((said ? t('That is ', 'Ese es ') + said + '. ' : t('Not quite. ', 'No exactamente. ')) + t('Try again!', '¡Inténtalo otra vez!')), 'try');
      }
      return;
    }
    // landmark, exact spot (advanced / expert)
    const ll = WorldMap.invert(pt[0], pt[1]);
    if (!ll) return;
    ch.answered = true;
    const km = WorldMap.distanceKm(ll, g.lm);
    // older explorers are scored more tightly on a continent map
    const near = T === 'expert' ? (window.innerWidth >= 700 ? [500, 1200] : [250, 700]) : [350, 900];
    const pts = km <= near[0] ? 1 : km <= near[1] ? 0.5 : 0;
    ch.score += pts;
    sfx(pts ? 'correct' : 'wrong');
    _revealLandmark(q.id, pt);
    const kmTxt = Math.round(km).toLocaleString(lang === 'es' ? 'es-CL' : 'en-US');
    const head = pts === 1 ? t('Bullseye! ', '¡En el blanco! ') : pts ? t('Close! ', '¡Cerca! ') : t('Far away. ', 'Lejos. ');
    _chFeedback(esc(head + t('You were ', 'Estabas a ') + kmTxt + ' km ' + t('away. ', 'de distancia. ') + nm(k.landmark) + t(' is in ', ' está en ') + nm(k) + '.'), pts ? 'good' : 'bad');
    _showNext();
  }

  function _flashCountry(iso, cls) {
    const p = chMap && chMap.lands[iso];
    if (!p) return;
    p.classList.remove('hit', 'miss');
    void p.getBBox();
    p.classList.add(cls);
    if (cls === 'miss') setTimeout(() => p.classList.remove('miss'), 900);
  }

  function _revealLandmark(id, tapPt) {
    const g = GEO[id], p = WorldMap.project(g.lm[0], g.lm[1]), u = chMap.upp();
    let s = '';
    if (tapPt) {
      s += '<path class="we-miss-line" d="M' + tapPt[0].toFixed(1) + ',' + tapPt[1].toFixed(1) + 'L' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + '" stroke-width="' + (2 * u).toFixed(2) + '" stroke-dasharray="' + (3 * u).toFixed(2) + ' ' + (3 * u).toFixed(2) + '"/>';
      s += chMap.dotSVG(tapPt[0], tapPt[1], 5, 'we-tapdot');
    }
    chMap.gOver.innerHTML = s;
    chMap.gMarks.innerHTML = '';
    chMap.landmarks([id], { px: 44 });
  }

  function _showNext() {
    const next = document.getElementById('we-ch-next');
    next.hidden = false;
    next.textContent = ch.idx + 1 < ch.qs.length ? t('Next →', 'Siguiente →') : t('See result', 'Ver resultado');
    next.onclick = () => { ch.idx++; _renderChallengeQ(); };
    document.getElementById('we-ch-score').textContent = '✓ ' + (Math.round(ch.score * 10) / 10);
    if (next.scrollIntoView && window.innerHeight < next.getBoundingClientRect().bottom) next.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function _finishChallenge() {
    const total = ch.qs.length, acc = total ? ch.score / total : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const data = _load();
    if (!data.mapBest) data.mapBest = {};
    const prev = data.mapBest[ch.type] || 0;
    // Stars count once per level of mastery: only an improvement adds.
    const gain = Math.max(0, stars - prev);
    if (stars > prev) data.mapBest[ch.type] = stars;
    data.totalStars = (data.totalStars || 0) + gain;
    data.mapRounds = (data.mapRounds || 0) + 1;
    _save(data);
    _updateGlobalStars();
    sfx(stars ? 'cheer' : 'click');
    const def = CH_TYPES.find(c => c.id === ch.type);
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('World Explorer', '🗺️', def.en + ': ' + (Math.round(ch.score * 10) / 10) + '/' + total);
    }
    const type = ch.type;
    _results({
      stars,
      title: lang === 'es' ? def.es : def.en,
      score: (Math.round(ch.score * 10) / 10) + ' / ' + total,
      note: gain ? t('+' + gain + ' ⭐ new best!', '+' + gain + ' ⭐ ¡nuevo récord!') : (prev >= 3 ? t('You have mastered this challenge.', 'Ya dominas este desafío.') : t('Beat your best to earn stars.', 'Supera tu récord para ganar estrellas.')),
      again: () => startChallenge(type),
      againLabel: t('🔁 Play again', '🔁 Jugar otra vez'),
      back: () => { ch = null; backToSelect(); },
      backLabel: t('Back to the map', 'Volver al mapa')
    });
  }

  function quitChallenge() { ch = null; backToSelect(); }

  // ================================================================
  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const data = _load();
    data.lang = lang;
    _save(data);
    _applyStaticText();
    const active = document.querySelector('.screen.active');
    if (!active) return;
    if (active.id === 'screen-select') { if (worldMap) { worldMap.svg.setAttribute('aria-label', t('World map', 'Mapa del mundo')); } _refitMap(); _renderChallengeCards(); }
    else if (active.id === 'screen-country' && currentCountry) openCountry(currentCountry.id);
    else if (active.id === 'screen-quiz') _renderQuizQuestion();
    else if (active.id === 'screen-challenge' && ch) { ch.answered = false; _renderChallengeQ(); }
  }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
    if (name === 'select') { _renderChallengeCards(); }
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

  return { init, openContinent, openCountry, markVisited, toggleLanguage, backToSelect, backToContinent, startQuiz, backToCountry, getStats,
    startChallenge, quitChallenge, _geo: GEO, _flights: FLIGHTS, _ch: () => ch };
})();
