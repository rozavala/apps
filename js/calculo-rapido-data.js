/* ================================================================
   CÁLCULO RÁPIDO — "Estimate it" questions (calculo-rapido-data.js)
   Fermi-style questions with a slider. Each one states the reference
   value it is scored against and where that comes from. The ranges are
   wide on purpose, and a score is by how many times too big or small
   the guess is (see CalculoEngine.estimateStars), so a sensible guess
   always has room.

     id, tier (1 easy .. 3 hard), icon (art key)
     q{es,en}    the question
     unit{es,en} what the slider counts
     truth       the reference value
     min, max    slider range (log scale)
     hint{es,en} a way to think about it
     ref{es,en}  the reference value, with its reasoning, shown after
   ================================================================ */
(function (root) {
  'use strict';

  var ESTIMATES = [
    { id: 'door', tier: 1, icon: 'ruler', truth: 2, min: 0.5, max: 10,
      q: { es: '¿Qué altura tiene la puerta de una casa?', en: 'How tall is the door of a house?' },
      unit: { es: 'metros', en: 'metres' },
      hint: { es: 'Un adulto cabe por la puerta sin agacharse. ¿Cuántas veces la altura de un niño?', en: 'A grown-up walks through without ducking. How many times a child\'s height?' },
      ref: { es: 'Una puerta normal mide unos 2 metros de alto (80 pulgadas).', en: 'A standard door is about 2 metres (80 inches) tall.' } },
    { id: 'heart', tier: 1, icon: 'dots', truth: 70, min: 10, max: 400,
      q: { es: '¿Cuántas veces late el corazón de un adulto en un minuto, en reposo?', en: 'How many times does a resting grown-up\'s heart beat in one minute?' },
      unit: { es: 'latidos', en: 'beats' },
      hint: { es: 'Pon dos dedos en tu muñeca y cuenta unos segundos.', en: 'Put two fingers on your wrist and count for a few seconds.' },
      ref: { es: 'En reposo, un adulto tiene entre 60 y 100 latidos por minuto; 70 es un valor típico.', en: 'At rest a grown-up has 60 to 100 beats a minute; 70 is a typical value.' } },
    { id: 'walk1km', tier: 1, icon: 'clock', truth: 12, min: 1, max: 200,
      q: { es: '¿Cuántos minutos tarda un adulto en caminar 1 kilómetro a paso tranquilo?', en: 'How many minutes does a grown-up take to walk 1 kilometre at an easy pace?' },
      unit: { es: 'minutos', en: 'minutes' },
      hint: { es: 'Un paso tranquilo avanza unos 5 km en una hora.', en: 'An easy pace covers about 5 km in one hour.' },
      ref: { es: 'Un paso tranquilo es de unos 5 km por hora, así que 1 km toma 60 ÷ 5 = 12 minutos.', en: 'An easy walking pace is about 5 km an hour, so 1 km takes 60 ÷ 5 = 12 minutes.' } },
    { id: 'pitch', tier: 1, icon: 'ruler', truth: 105, min: 10, max: 1000,
      q: { es: '¿Cuántos metros de largo tiene una cancha de fútbol de tamaño completo?', en: 'How many metres long is a full-size soccer field?' },
      unit: { es: 'metros', en: 'metres' },
      hint: { es: 'Piensa en cuántos pasos grandes da un adulto para cruzarla.', en: 'Think how many big steps a grown-up takes to cross it.' },
      ref: { es: 'La FIFA recomienda una cancha de 105 m de largo por 68 m de ancho.', en: 'FIFA recommends a pitch 105 m long and 68 m wide.' } },
    { id: 'egg', tier: 1, icon: 'scale', truth: 57, min: 2, max: 2000,
      q: { es: '¿Cuántos gramos pesa un huevo de gallina grande?', en: 'How many grams does one large hen\'s egg weigh?' },
      unit: { es: 'gramos', en: 'grams' },
      hint: { es: 'Una moneda pesa unos 5 gramos. ¿Cuántas monedas pesaría?', en: 'A coin weighs about 5 grams. How many coins would it weigh?' },
      ref: { es: 'Un huevo "grande" de EE. UU. pesa al menos 2 onzas, unos 57 gramos.', en: 'A US "large" egg weighs at least 2 ounces, about 57 grams.' } },

    { id: 'bath', tier: 2, icon: 'drop', truth: 150, min: 5, max: 5000,
      q: { es: '¿Cuántos litros caben en una tina de baño llena?', en: 'How many litres fit in a full bathtub?' },
      unit: { es: 'litros', en: 'litres' },
      hint: { es: 'Un balde grande tiene unos 10 litros. ¿Cuántos baldes llenarían la tina?', en: 'A big bucket holds about 10 litres. How many buckets would fill the tub?' },
      ref: { es: 'Una tina común llena hasta el borde guarda unos 150 litros (40 galones de EE. UU.).', en: 'A common bathtub filled to the overflow holds about 150 litres (40 US gallons).' } },
    { id: 'steps100', tier: 2, icon: 'dots', truth: 133, min: 5, max: 5000,
      q: { es: '¿Cuántos pasos da un adulto para caminar 100 metros?', en: 'How many steps does a grown-up take to walk 100 metres?' },
      unit: { es: 'pasos', en: 'steps' },
      hint: { es: 'Un paso mide un poco menos que un metro.', en: 'One step is a little less than a metre.' },
      ref: { es: 'Un paso de adulto mide unos 0,75 m, y 100 ÷ 0,75 son casi 133 pasos.', en: 'A grown-up\'s step is about 0.75 m, and 100 ÷ 0.75 is nearly 133 steps.' } },
    { id: 'sound', tier: 2, icon: 'clock', truth: 2.9, min: 0.1, max: 100,
      q: { es: '¿Cuántos segundos tarda el sonido en viajar 1 kilómetro por el aire?', en: 'How many seconds does sound take to travel 1 kilometre through air?' },
      unit: { es: 'segundos', en: 'seconds' },
      hint: { es: 'Después de ver un rayo, el trueno llega unos 3 segundos por cada kilómetro.', en: 'After a lightning flash, thunder arrives about 3 seconds per kilometre.' },
      ref: { es: 'El sonido viaja a unos 343 m por segundo en el aire a 20 °C: 1.000 ÷ 343 son 2,9 segundos.', en: 'Sound travels about 343 m per second in air at 20 °C: 1,000 ÷ 343 is 2.9 seconds.' } },
    { id: 'bolt', tier: 2, icon: 'clock', truth: 9.58, min: 3, max: 60,
      q: { es: '¿Cuántos segundos tardó Usain Bolt en correr 100 metros en 2009?', en: 'How many seconds did Usain Bolt take to run 100 metres in 2009?' },
      unit: { es: 'segundos', en: 'seconds' },
      hint: { es: 'Un niño corre 100 m en unos 20 segundos. Un campeón es mucho más rápido.', en: 'A child runs 100 m in about 20 seconds. A champion is much faster.' },
      ref: { es: 'En 2009 Usain Bolt corrió los 100 m en 9,58 segundos, unos 10,4 metros por segundo.', en: 'In 2009 Usain Bolt ran 100 m in 9.58 seconds, about 10.4 metres per second.' } },
    { id: 'fuel', tier: 2, icon: 'drop', truth: 50, min: 5, max: 1000,
      q: { es: '¿Cuántos litros caben en el estanque de bencina de un auto familiar?', en: 'How many litres fit in the fuel tank of a family car?' },
      unit: { es: 'litros', en: 'litres' },
      hint: { es: 'Es más que un balde, y bastante menos que una tina.', en: 'It is more than a bucket and a lot less than a bathtub.' },
      ref: { es: 'Muchos autos familiares tienen un estanque de 45 a 60 litros (12 a 16 galones de EE. UU.); usamos 50.', en: 'Many family cars have a tank of 45 to 60 litres (12 to 16 US gallons); we use 50.' } },
    { id: 'moon', tier: 2, icon: 'clock', truth: 29.5, min: 1, max: 400,
      q: { es: '¿Cuántos días pasan de una luna llena a la siguiente?', en: 'How many days pass from one full Moon to the next?' },
      unit: { es: 'días', en: 'days' },
      hint: { es: 'Es más o menos lo que dura un mes.', en: 'It is about as long as a month.' },
      ref: { es: 'Las fases de la Luna se repiten cada 29,5 días.', en: 'The Moon\'s phases repeat every 29.5 days.' } },
    { id: 'condor', tier: 2, icon: 'ruler', truth: 3, min: 0.2, max: 30,
      q: { es: '¿Cuántos metros mide de punta a punta el ala extendida de un cóndor andino grande?', en: 'How many metres wide are the spread wings of a large Andean condor, tip to tip?' },
      unit: { es: 'metros', en: 'metres' },
      hint: { es: 'Compara con una puerta (2 m) o un auto (4 a 5 m).', en: 'Compare with a door (2 m) or a car (4 to 5 m).' },
      ref: { es: 'Los cóndores andinos grandes tienen una envergadura de cerca de 3 metros, una de las mayores entre las aves que vuelan.', en: 'Large Andean condors have a wingspan of about 3 metres, one of the biggest of any flying bird.' } },
    { id: 'horse', tier: 2, icon: 'scale', truth: 500, min: 5, max: 20000,
      q: { es: '¿Cuántos kilos pesa un caballo de montar?', en: 'How many kilograms does a riding horse weigh?' },
      unit: { es: 'kilos', en: 'kilograms' },
      hint: { es: 'Un adulto pesa unos 70 kilos. ¿Cuántos adultos pesaría un caballo?', en: 'A grown-up weighs about 70 kilograms. How many grown-ups would a horse weigh?' },
      ref: { es: 'Un caballo de montar pesa entre 450 y 550 kilos; usamos 500.', en: 'A riding horse weighs 450 to 550 kilograms; we use 500.' } },
    { id: 'highway', tier: 2, icon: 'gauge', truth: 110, min: 10, max: 1000,
      q: { es: '¿A cuántos kilómetros por hora es el límite típico de una autopista?', en: 'What is a typical highway speed limit, in kilometres per hour?' },
      unit: { es: 'km/h', en: 'km/h' },
      hint: { es: 'En una hora de autopista se recorre más de lo que una bicicleta recorre en un día.', en: 'In an hour on a highway you go farther than a bicycle goes in a day.' },
      ref: { es: 'En autopistas de Chile el límite es de 100 a 120 km/h; en California 65 mph son unos 105 km/h. Usamos 110.', en: 'On Chilean highways the limit is 100 to 120 km/h; in California 65 mph is about 105 km/h. We use 110.' } },
    { id: 'valpo', tier: 2, icon: 'ruler', truth: 120, min: 5, max: 5000,
      q: { es: '¿Cuántos kilómetros hay por carretera de Santiago a Valparaíso?', en: 'How many kilometres is the road from Santiago to Valparaíso?' },
      unit: { es: 'kilómetros', en: 'kilometres' },
      hint: { es: 'El viaje en auto dura cerca de una hora y media.', en: 'The drive takes about an hour and a half.' },
      ref: { es: 'Por la Ruta 68, de Santiago a Valparaíso hay unos 120 km.', en: 'By Route 68, Santiago to Valparaíso is about 120 km.' } },
    { id: 'bones', tier: 2, icon: 'dots', truth: 206, min: 10, max: 5000,
      q: { es: '¿Cuántos huesos tiene un adulto?', en: 'How many bones does a grown-up have?' },
      unit: { es: 'huesos', en: 'bones' },
      hint: { es: 'Son más que los dedos de las manos y los pies juntos, y muchísimos menos que mil.', en: 'More than all your fingers and toes together, and far fewer than a thousand.' },
      ref: { es: 'El esqueleto de un adulto tiene 206 huesos.', en: 'A grown-up\'s skeleton has 206 bones.' } },

    { id: 'eiffel', tier: 3, icon: 'ruler', truth: 330, min: 10, max: 10000,
      q: { es: '¿Cuántos metros mide la Torre Eiffel?', en: 'How many metres tall is the Eiffel Tower?' },
      unit: { es: 'metros', en: 'metres' },
      hint: { es: 'Un piso de edificio mide unos 3 metros. ¿Cuántos pisos tendría?', en: 'One floor of a building is about 3 metres. How many floors would it have?' },
      ref: { es: 'La Torre Eiffel mide 330 metros con sus antenas.', en: 'The Eiffel Tower is 330 metres tall with its antennas.' } },
    { id: 'aconcagua', tier: 3, icon: 'mountain', truth: 6961, min: 100, max: 100000,
      q: { es: '¿Cuántos metros de altura tiene el Aconcagua?', en: 'How many metres high is Aconcagua?' },
      unit: { es: 'metros', en: 'metres' },
      hint: { es: 'Es la montaña más alta de América. Los aviones vuelan a unos 10.000 metros.', en: 'It is the highest mountain in the Americas. Airliners cruise at about 10,000 metres.' },
      ref: { es: 'El Aconcagua mide 6.961 metros sobre el nivel del mar.', en: 'Aconcagua is 6,961 metres above sea level.' } },
    { id: 'chilelen', tier: 3, icon: 'ruler', truth: 4300, min: 100, max: 100000,
      q: { es: '¿Cuántos kilómetros mide Chile de norte a sur?', en: 'How many kilometres long is Chile from north to south?' },
      unit: { es: 'kilómetros', en: 'kilometres' },
      hint: { es: 'Santiago a Valparaíso son 120 km. ¿Cuántas veces cabe eso?', en: 'Santiago to Valparaíso is 120 km. How many times does that fit?' },
      ref: { es: 'Chile se extiende unos 4.300 km de norte a sur.', en: 'Chile stretches about 4,300 km from north to south.' } },
    { id: 'sfla', tier: 3, icon: 'ruler', truth: 380, min: 10, max: 50000,
      q: { es: '¿Cuántas millas hay por carretera de San Francisco a Los Ángeles?', en: 'How many miles is the road from San Francisco to Los Angeles?' },
      unit: { es: 'millas', en: 'miles' },
      hint: { es: 'El viaje dura cerca de 6 horas a 65 mph.', en: 'The drive takes about 6 hours at 65 mph.' },
      ref: { es: 'Por la Interestatal 5, de San Francisco a Los Ángeles hay unas 380 millas (610 km).', en: 'By Interstate 5, San Francisco to Los Angeles is about 380 miles (610 km).' } },
    { id: 'pool', tier: 3, icon: 'drop', truth: 2500000, min: 1000, max: 10000000000,
      q: { es: '¿Cuántos litros de agua tiene una piscina olímpica?', en: 'How many litres of water are in an Olympic swimming pool?' },
      unit: { es: 'litros', en: 'litres' },
      hint: { es: 'Largo × ancho × profundidad da metros cúbicos. 1 metro cúbico son 1.000 litros.', en: 'Length × width × depth gives cubic metres. One cubic metre is 1,000 litres.' },
      ref: { es: 'Una piscina olímpica mide 50 m × 25 m × 2 m como mínimo: 2.500 m³ son 2.500.000 litros.', en: 'An Olympic pool is at least 50 m × 25 m × 2 m: 2,500 m³ is 2,500,000 litres.' } },
    { id: 'moondist', tier: 3, icon: 'ruler', truth: 384000, min: 100, max: 100000000,
      q: { es: '¿A cuántos kilómetros está la Luna de la Tierra?', en: 'How many kilometres away is the Moon?' },
      unit: { es: 'kilómetros', en: 'kilometres' },
      hint: { es: 'Un jet vuela a 900 km por hora. ¿Cuántos días tardaría?', en: 'A jet flies at 900 km an hour. How many days would it take?' },
      ref: { es: 'La Luna está, en promedio, a unos 384.000 km de la Tierra.', en: 'The Moon is on average about 384,000 km from Earth.' } }
  ];

  var api = { ESTIMATES: ESTIMATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CalculoData = api;
})(typeof window !== 'undefined' ? window : this);
