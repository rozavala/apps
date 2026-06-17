// === CONTENT GUARDIAN [2027-10-10] ===
// Math Galaxy: 8 new question types added, 8 pruned
// Descubre Chile: 6 new questions, 0 new topic (if any)
// Fe Explorador: 0 new saint/heritage items
// World Explorer: 2 new countries/0 questions
// Guitar Jam: 0 new chord/song
// Learning Checks: 0 new questions
// Story Explorer: skipped

FILE: js/math-galaxy.js
FIND:
  // PRUNED [2026-06-15]: Removed 'shape_pattern', 'star_shape' to make room for 'sun_count_2', 'planet_compare' and stay within MAX 25 limit.
  const types = ['count', 'add', 'moon_count', 'star_sub', 'planet_count', 'rocket_sub', 'astronaut_count', 'star_add', 'galaxy_count', 'alien_count', 'satellite_add', 'meteor_add', 'meteor_count', 'ufo_count', 'telescope_add', 'sun_count', 'sun_add', 'rocket_count', 'satellite_count', 'asteroid_add', 'planet_sub', 'sun_sub', 'meteor_pattern', 'sun_count_2', 'planet_compare'];
  const type = types[rand(0, types.length - 1)];
REPLACE WITH:
  // PRUNED [2026-06-15]: Removed 'shape_pattern', 'star_shape' to make room for 'sun_count_2', 'planet_compare' and stay within MAX 25 limit.
  // PRUNED [2027-10-10]: Removed 'meteor_add', 'meteor_count' to make room for 'comet_count', 'comet_add' and stay within MAX 25 limit.
  const types = ['count', 'add', 'moon_count', 'star_sub', 'planet_count', 'rocket_sub', 'astronaut_count', 'star_add', 'galaxy_count', 'alien_count', 'satellite_add', 'comet_count', 'comet_add', 'ufo_count', 'telescope_add', 'sun_count', 'sun_add', 'rocket_count', 'satellite_count', 'asteroid_add', 'planet_sub', 'sun_sub', 'meteor_pattern', 'sun_count_2', 'planet_compare'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'comet_count') { const n = rand(1, 10); return { label: 'Comets', text: '☄️'.repeat(n), hint: 'How many comets?', answer: n, options: generateDistractors(n, 3, 1, 15), mode: 'choice' }; }
  if (type === 'comet_add') { const a = rand(1,5), b = rand(1,5); return { label: 'Comet Addition', text: `${a} ☄️ + ${b} ☄️ = ?`, hint: '', answer: a+b, options: generateDistractors(a+b, 3, 2, 10), mode: 'choice' }; }

FILE: js/math-galaxy.js
FIND:
  // PRUNED [2026-06-15]: Removed 'planet_pattern', 'moon_pattern' to make room for 'alien_diff', 'asteroid_add_2' and stay within MAX 25 limit.
  const types = ['add', 'sub', 'planet_add', 'comet_compare2', 'double', 'space_compare', 'star_fraction', 'ufo_sub', 'meteor_sub', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'planet_sub', 'comet_add', 'asteroid_sub', 'meteor_add_2', 'spaceship_add', 'satellite_add2', 'alien_diff', 'asteroid_add_2'];
  const type = types[rand(0, types.length - 1)];
REPLACE WITH:
  // PRUNED [2026-06-15]: Removed 'planet_pattern', 'moon_pattern' to make room for 'alien_diff', 'asteroid_add_2' and stay within MAX 25 limit.
  // PRUNED [2027-10-10]: Removed 'comet_add', 'asteroid_sub' to make room for 'moon_sub', 'orbit_add' and stay within MAX 25 limit.
  const types = ['add', 'sub', 'planet_add', 'comet_compare2', 'double', 'space_compare', 'star_fraction', 'ufo_sub', 'meteor_sub', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'planet_sub', 'moon_sub', 'orbit_add', 'meteor_add_2', 'spaceship_add', 'satellite_add2', 'alien_diff', 'asteroid_add_2'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'moon_sub') { const a = rand(15,30), b = rand(5,14); return { label: 'Moon Subtraction', text: `${a} 🌕 - ${b} 🌕 = ?`, hint: 'Subtract the moons', answer: a-b, options: generateDistractors(a-b, 3, 1, 30), mode: 'choice' }; }
  if (type === 'orbit_add') { const a = rand(10, 25), b = rand(10, 25); return { label: 'Orbit Addition', text: `${a} 🛰️ + ${b} 🛰️ = ?`, hint: 'Add the numbers', answer: a+b, options: generateDistractors(a+b, 3, 10, 60), mode: 'choice' }; }

FILE: js/math-galaxy.js
FIND:
  // PRUNED [2026-06-15]: Removed 'robot_mult', 'meteor_div' to make room for 'moon_div', 'comet_mult_2' and stay within MAX 25 limit.
  const types = ['mult', 'div', 'frac_visual', 'ufo_mult', 'satellite_frac', 'comet_mult', 'asteroid_div', 'star_word', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'alien_pct', 'asteroid_mult', 'alien_div', 'blackhole_mult', 'comet_frac', 'galaxy_div', 'nebula_frac', 'star_div', 'moon_div', 'comet_mult_2'];
  const type = types[rand(0, types.length - 1)];
REPLACE WITH:
  // PRUNED [2026-06-15]: Removed 'robot_mult', 'meteor_div' to make room for 'moon_div', 'comet_mult_2' and stay within MAX 25 limit.
  // PRUNED [2027-10-10]: Removed 'moon_div', 'comet_mult_2' to make room for 'planet_frac', 'sun_mult' and stay within MAX 25 limit.
  const types = ['mult', 'div', 'frac_visual', 'ufo_mult', 'satellite_frac', 'comet_mult', 'asteroid_div', 'star_word', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'alien_pct', 'asteroid_mult', 'alien_div', 'blackhole_mult', 'comet_frac', 'galaxy_div', 'nebula_frac', 'star_div', 'planet_frac', 'sun_mult'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'planet_frac') { return { label: 'Planet Fractions', text: '🪐 🪐 ⭐ ⭐', hint: 'Fraction of planets?', answer: '1/2', options: shuffle(['1/2', '1/4', '1/3', '2/3']), mode: 'choice' }; }
  if (type === 'sun_mult') { const a = rand(5, 12), b = rand(5, 12); return { label: 'Sun Multiplication', text: `${a} ☀️ × ${b} = ?`, hint: 'Multiply', answer: a*b, options: generateDistractors(a*b, 3, 20, 150), mode: 'choice' }; }

FILE: js/math-galaxy.js
FIND:
  // PRUNED [2026-06-15]: Removed 'robot_ops', 'ufo_decimal' to make room for 'blackhole_sub', 'galaxy_pct_2' and stay within MAX 25 limit.
  const types = ['big_add', 'big_mult', 'blackhole_div', 'galaxy_frac', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'blackhole_add', 'supernova_pct', 'gravity_ops', 'orbit_dec', 'quasar_ops', 'pulsar_dec', 'pulsar_add', 'galaxy_pct', 'blackhole_sub', 'galaxy_pct_2'];
  const type = types[rand(0, types.length - 1)];
REPLACE WITH:
  // PRUNED [2026-06-15]: Removed 'robot_ops', 'ufo_decimal' to make room for 'blackhole_sub', 'galaxy_pct_2' and stay within MAX 25 limit.
  // PRUNED [2027-10-10]: Removed 'blackhole_sub', 'galaxy_pct_2' to make room for 'gravity_dec', 'orbit_pct' and stay within MAX 25 limit.
  const types = ['big_add', 'big_mult', 'blackhole_div', 'galaxy_frac', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'blackhole_add', 'supernova_pct', 'gravity_ops', 'orbit_dec', 'quasar_ops', 'pulsar_dec', 'pulsar_add', 'galaxy_pct', 'gravity_dec', 'orbit_pct'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'gravity_dec') { const a=(rand(10,50)/10).toFixed(1); const b=(rand(10,50)/10).toFixed(1); const ans=(parseFloat(a)-parseFloat(b)).toFixed(1); return { label: 'Decimals', text: `${a} - ${b} = ?`, hint: '', answer: ans, options: generateDistractors(ans, 3, -5, 5).map(x=>x.toFixed(1)), mode: 'choice' }; }
  if (type === 'orbit_pct') { const p = [10, 20, 25, 50][rand(0, 3)]; const base = rand(10, 50) * (100/p); const ans = base * p/100; return { label: 'Percentages', text: `${p}% of ${base} 🛰️`, hint: 'Calculate', answer: ans, options: generateDistractors(ans, 3, 5, 200), mode: 'choice' }; }

FILE: js/descubre-chile.js
FIND:
    {q:'¿Cuál será el telescopio más grande del mundo en construcción en Chile?',a:'ELT',o:['ELT','VLT','ALMA','Hubble'], tier:'expert'}
  ],
REPLACE WITH:
    {q:'¿Cuál será el telescopio más grande del mundo en construcción en Chile?',a:'ELT',o:['ELT','VLT','ALMA','Hubble'], tier:'expert'},
    {q:'¿Qué instrumento se usa para estudiar las estrellas en ALMA?',a:'Radiotelescopio',o:['Radiotelescopio','Microscopio','Sismógrafo','Barómetro'], tier:'advanced'},
    {q:'¿En qué desierto se prueban algunos vehículos espaciales por su parecido a Marte?',a:'Desierto de Atacama',o:['Desierto de Atacama','Desierto del Sahara','Desierto de Gobi','Desierto de Mojave'], tier:'intermediate'},
    {q:'¿Qué premio nacional ganó el científico Humberto Maturana?',a:'Premio Nacional de Ciencias',o:['Premio Nacional de Ciencias','Premio Nobel','Premio Nacional de Literatura','Premio Óscar'], tier:'expert'}
  ],

FILE: js/descubre-chile.js
FIND:
    {q:'¿En qué cordillera están los volcanes de Chile?',a:'Los Andes',o:['Los Andes','La Costa','Domeyko','Nahuelbuta'], tier:'beginner'}
  ],
REPLACE WITH:
    {q:'¿En qué cordillera están los volcanes de Chile?',a:'Los Andes',o:['Los Andes','La Costa','Domeyko','Nahuelbuta'], tier:'beginner'},
    {q:'¿Qué volcán entró en erupción cerca de Pucón?',a:'Villarrica',o:['Villarrica','Osorno','Chaitén','Calbuco'], tier:'intermediate'},
    {q:'¿Qué sale de un volcán durante una erupción?',a:'Lava y ceniza',o:['Lava y ceniza','Agua salada','Hielo y nieve','Arena del desierto'], tier:'beginner'},
    {q:'¿Qué forma tienen muchos volcanes en el sur de Chile?',a:'Forma de cono',o:['Forma de cono','Forma de cubo','Forma plana','Forma de estrella'], tier:'beginner'}
  ],

FILE: js/world-explorer.js
FIND:
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2 }
        ]
      }
    ] },
    { id: 'africa', name: 'Africa', nameEs: 'África', icon: '🌍', color: '#EF4444', countries: [
REPLACE WITH:
          { q: 'What famous bicycle race happens here?', qEs: '¿Qué famosa carrera de bicicletas ocurre aquí?', options: ['Giro d\'Italia', 'Vuelta a España', 'Tour de France', 'Paris-Roubaix'], optionsEs: ['Giro d\'Italia', 'Vuelta a España', 'Tour de Francia', 'París-Roubaix'], answer: 2 }
        ]
      },
      {
        id: 'italy', name: 'Italy', nameEs: 'Italia', flag: '🇮🇹',
        capital: 'Rome', capitalEs: 'Roma',
        facts: [
          { en: 'Italy is shaped like a boot.', es: 'Italia tiene forma de bota.' },
          { en: 'The Colosseum is a famous ancient amphitheater in Rome.', es: 'El Coliseo es un famoso anfiteatro antiguo en Roma.' },
          { en: 'Pizza and pasta are traditional Italian foods.', es: 'La pizza y la pasta son comidas tradicionales italianas.' },
          { en: 'Venice is a city with canals instead of roads.', es: 'Venecia es una ciudad con canales en lugar de calles.' }
        ],
        landmark: { name: 'Colosseum', nameEs: 'Coliseo', emoji: '🏛️' },
        animal: { name: 'Wolf', nameEs: 'Lobo', emoji: '🐺' },
        quiz: [
          { q: 'What is the capital of Italy?', qEs: '¿Cuál es la capital de Italia?', options: ['Rome', 'Milan', 'Naples', 'Venice'], optionsEs: ['Roma', 'Milán', 'Nápoles', 'Venecia'], answer: 0 },
          { q: 'What shape is the country of Italy?', qEs: '¿Qué forma tiene el país de Italia?', options: ['A boot', 'A square', 'A circle', 'A star'], optionsEs: ['Una bota', 'Un cuadrado', 'Un círculo', 'Una estrella'], answer: 0 },
          { q: 'Which ancient amphitheater is in Rome?', qEs: '¿Qué antiguo anfiteatro está en Roma?', options: ['The Colosseum', 'The Parthenon', 'The Pantheon', 'The Forum'], optionsEs: ['El Coliseo', 'El Partenón', 'El Panteón', 'El Foro'], answer: 0 }
        ]
      },
      {
        id: 'germany', name: 'Germany', nameEs: 'Alemania', flag: '🇩🇪',
        capital: 'Berlin', capitalEs: 'Berlín',
        facts: [
          { en: 'Germany is known for its many beautiful castles.', es: 'Alemania es conocida por sus muchos hermosos castillos.' },
          { en: 'The Autobahn is a famous highway system in Germany.', es: 'La Autobahn es un famoso sistema de autopistas en Alemania.' },
          { en: 'The Brandenburg Gate is a famous landmark in Berlin.', es: 'La Puerta de Brandeburgo es un famoso monumento en Berlín.' },
          { en: 'Germany has a large forest called the Black Forest.', es: 'Alemania tiene un gran bosque llamado la Selva Negra.' }
        ],
        landmark: { name: 'Brandenburg Gate', nameEs: 'Puerta de Brandeburgo', emoji: '🏛️' },
        animal: { name: 'Eagle', nameEs: 'Águila', emoji: '🦅' },
        quiz: [
          { q: 'What is the capital of Germany?', qEs: '¿Cuál es la capital de Alemania?', options: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg'], optionsEs: ['Berlín', 'Múnich', 'Fráncfort', 'Hamburgo'], answer: 0 },
          { q: 'What is the famous highway system in Germany called?', qEs: '¿Cómo se llama el famoso sistema de autopistas en Alemania?', options: ['Autobahn', 'Route 66', 'Pan-American Highway', 'M1'], optionsEs: ['Autobahn', 'Ruta 66', 'Carretera Panamericana', 'M1'], answer: 0 },
          { q: 'What famous gate is located in Berlin?', qEs: '¿Qué famosa puerta se encuentra en Berlín?', options: ['Brandenburg Gate', 'Golden Gate', 'Arc de Triomphe', 'Gateway Arch'], optionsEs: ['Puerta de Brandeburgo', 'Golden Gate', 'Arco del Triunfo', 'Gateway Arch'], answer: 0 }
        ]
      }
    ] },
    { id: 'africa', name: 'Africa', nameEs: 'África', icon: '🌍', color: '#EF4444', countries: [
