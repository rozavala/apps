/* ================================================================
   HUERTO 🌱 — the plant guide and the experiments (js/huerto-data.js)

   Twenty easy plants a kid can really grow, in a cup, a pot or a bed.
   The numbers are the usual seed-packet ranges for good conditions
   (warm enough soil, kept damp while sprouting), kept conservative:
   a real plant may take a few days more, never much less.

     sprout   [min, max] days from sowing until it shows above the soil
              (for a nursery plant or a seed potato: until new leaves)
     harvest  [min, max] days from sowing (or planting) until the first
              harvest (or the first flowers, for the flowers)
     sun      'full' = 6 or more hours of direct sun, 'part' = 3 to 6
     water    1 = let the top of the soil dry first, 2 = when the top
              2 cm are dry, 3 = keep the soil damp
     months   when to sow or plant outdoors in the Santa Clara Valley
              (California). Chile's months are worked out from these
              (CHILE_SHIFT): central Chile (Santiago) and the Santa
              Clara Valley both have a Mediterranean climate (warm dry
              summers, mild rainy winters), but in opposite hemispheres,
              so the same season comes six months apart.
     indoor   true: also grows on a sunny windowsill in any month

   Art: js/huerto-art.js draws each plant by its id.
   ================================================================ */

var HuertoData = (function() {
  'use strict';

  var CHILE_SHIFT = 6;

  // es, en, sci, from ('seed' | 'plant' | 'tuber'), where it grows
  var PLANTS = [
    { id: 'poroto', es: 'Poroto', en: 'Bean', sci: 'Phaseolus vulgaris', from: 'seed', kind: 'veg', easy: 1,
      where: ['cup', 'pot', 'bed'], sprout: [6, 10], harvest: [50, 65], sun: 'full', water: 2,
      months: [4, 5, 6, 7], indoor: true,
      what: ['vainas verdes', 'green pods'],
      tip: ['Siembra la semilla a 3 cm de profundidad. En un vaso con algodón mojado se ve cómo sale la raíz.',
            'Sow the seed 3 cm deep. In a cup with damp cotton you can watch the root come out.'],
      fact: ['Las dos primeras hojas gruesas son las dos mitades de la semilla (cotiledones): tienen la comida de la plantita hasta que puede hacer la suya.',
             'The first two thick leaves are the two halves of the seed (cotyledons): they feed the baby plant until it can make its own food.'] },
    { id: 'maravilla', es: 'Maravilla (girasol)', en: 'Sunflower', sci: 'Helianthus annuus', from: 'seed', kind: 'flower', easy: 1,
      where: ['pot', 'bed'], sprout: [7, 10], harvest: [70, 100], sun: 'full', water: 2,
      months: [4, 5, 6], indoor: false,
      what: ['flores (y semillas)', 'flowers (and seeds)'],
      tip: ['Siémbrala donde le dé el sol todo el día. Las altas necesitan un palo para no caerse con el viento.',
            'Sow it where it gets sun all day. Tall ones need a stake so the wind does not knock them over.'],
      fact: ['La "flor" grande está hecha de cientos de florcitas. Sus semillas forman espirales que se pueden contar.',
             'The big "flower" is made of hundreds of tiny flowers. Its seeds grow in spirals you can count.'] },
    { id: 'albahaca', es: 'Albahaca', en: 'Basil', sci: 'Ocimum basilicum', from: 'seed', kind: 'herb', easy: 1,
      where: ['cup', 'pot', 'bed'], sprout: [5, 10], harvest: [60, 90], sun: 'full', water: 2,
      months: [4, 5, 6], indoor: true,
      what: ['hojas', 'leaves'],
      tip: ['Le gusta el calor. Corta las puntas de arriba y la planta se pone más tupida.',
            'It likes warmth. Pinch off the top tips and the plant grows bushier.'],
      fact: ['Frota una hoja y huele tus dedos: el olor viene de aceites que la planta guarda en pelitos diminutos.',
             'Rub a leaf and smell your fingers: the smell comes from oils kept in tiny hairs on the leaf.'] },
    { id: 'tomate', es: 'Tomate', en: 'Tomato', sci: 'Solanum lycopersicum', from: 'seed', kind: 'veg', easy: 2,
      where: ['pot', 'bed'], sprout: [5, 10], harvest: [100, 130], sun: 'full', water: 2,
      months: [4, 5, 6], indoor: false, start: [2, 3],
      what: ['tomates', 'tomatoes'],
      note: ['Desde un almácigo comprado: unos 60 a 80 días.', 'From a nursery seedling: about 60 to 80 days.'],
      tip: ['Se siembra adentro en almácigos y se trasplanta cuando ya no hace frío. Necesita un tutor (un palo) para crecer.',
            'Start seeds indoors and plant out when the cold is over. It needs a stake to climb.'],
      fact: ['Los tomates silvestres vienen de los Andes de Sudamérica, de Perú y Ecuador.',
             'Wild tomatoes come from the Andes of South America, in Peru and Ecuador.'] },
    { id: 'lechuga', es: 'Lechuga', en: 'Lettuce', sci: 'Lactuca sativa', from: 'seed', kind: 'veg', easy: 1,
      where: ['pot', 'bed'], sprout: [4, 10], harvest: [45, 60], sun: 'part', water: 3,
      months: [2, 3, 4, 8, 9, 10], indoor: false,
      what: ['hojas', 'leaves'],
      tip: ['La semilla es muy chica: apenas cúbrela con tierra. Le gusta el fresco; con mucho calor se pone amarga.',
            'The seed is tiny: barely cover it with soil. It likes cool weather; in strong heat it turns bitter.'],
      fact: ['Una hoja de lechuga es casi toda agua: más o menos 95 de cada 100 partes.',
             'A lettuce leaf is nearly all water: about 95 parts in every 100.'] },
    { id: 'frutilla', es: 'Frutilla', en: 'Strawberry', sci: 'Fragaria × ananassa', from: 'plant', kind: 'fruit', easy: 2,
      where: ['pot', 'bed'], sprout: [7, 14], harvest: [60, 90], sun: 'full', water: 2,
      months: [2, 3, 4, 11], indoor: false,
      what: ['frutillas', 'strawberries'],
      note: ['Se planta una planta (no una semilla). Los días son para las variedades que dan fruta casi todo el año.',
             'You plant a plant (not a seed). The days are for the kinds that fruit most of the year.'],
      tip: ['Deja la corona (donde nacen las hojas) justo sobre la tierra. Las guías largas (estolones) hacen plantas nuevas.',
            'Keep the crown (where the leaves start) just above the soil. The long runners make new plants.'],
      fact: ['La frutilla de jardín nació en Francia en el siglo XVIII al cruzar una frutilla de Norteamérica con la frutilla chilena (Fragaria chiloensis).',
             'The garden strawberry began in 18th-century France as a cross of a North American strawberry and the Chilean strawberry (Fragaria chiloensis).'] },
    { id: 'rabano', es: 'Rabanito', en: 'Radish', sci: 'Raphanus sativus', from: 'seed', kind: 'veg', easy: 1,
      where: ['pot', 'bed'], sprout: [3, 7], harvest: [25, 35], sun: 'full', water: 2,
      months: [2, 3, 4, 9, 10, 11], indoor: false,
      what: ['raíces rojas', 'red roots'],
      tip: ['Es de los más rápidos del huerto: en un mes ya se come. Riega parejo para que no se agriete.',
            'One of the fastest in the garden: ready to eat in about a month. Water evenly so it does not crack.'],
      fact: ['La parte roja que comemos es la raíz engordada, donde la planta guarda comida.',
             'The red part we eat is a swollen root, where the plant stores food.'] },
    { id: 'menta', es: 'Menta', en: 'Mint', sci: 'Mentha', from: 'plant', kind: 'herb', easy: 1,
      where: ['cup', 'pot'], sprout: [7, 14], harvest: [30, 60], sun: 'part', water: 3,
      months: [3, 4, 5], indoor: true,
      what: ['hojas', 'leaves'],
      note: ['Se planta una planta o una ramita con raíces.', 'Plant a plant or a rooted cutting.'],
      tip: ['Plántala en su propia maceta: sus tallos corren bajo tierra y llenan todo el huerto.',
            'Give it its own pot: its stems run underground and fill the whole garden.'],
      fact: ['El tallo de la menta es cuadrado: pásalo entre los dedos y siente las cuatro esquinas.',
             'A mint stem is square: roll it between your fingers and feel the four corners.'] },
    { id: 'arveja', es: 'Arveja', en: 'Pea', sci: 'Pisum sativum', from: 'seed', kind: 'veg', easy: 1,
      where: ['pot', 'bed'], sprout: [7, 14], harvest: [60, 75], sun: 'full', water: 2,
      months: [1, 2, 9, 10, 11], indoor: false,
      what: ['vainas con arvejas', 'pods of peas'],
      tip: ['Le gusta el fresco. Ponle una malla o palitos: se agarra con zarcillos que se enrollan solos.',
            'It likes cool weather. Give it a net or sticks: it holds on with tendrils that curl by themselves.'],
      fact: ['Gregor Mendel, un fraile agustino, descubrió cómo se heredan los rasgos estudiando miles de plantas de arveja.',
             'Gregor Mendel, an Augustinian friar, found out how traits are passed on by studying thousands of pea plants.'] },
    { id: 'zanahoria', es: 'Zanahoria', en: 'Carrot', sci: 'Daucus carota', from: 'seed', kind: 'veg', easy: 2,
      where: ['pot', 'bed'], sprout: [10, 21], harvest: [65, 80], sun: 'full', water: 2,
      months: [2, 3, 4, 8, 9], indoor: false,
      what: ['raíces', 'roots'],
      tip: ['Tarda en brotar: mantén la tierra húmeda hasta que salga. Necesita tierra suelta y honda, sin piedras.',
            'It is slow to sprout: keep the soil damp until it shows. It needs deep, loose soil with no stones.'],
      fact: ['Hace siglos casi todas las zanahorias eran moradas o amarillas; las naranjas se hicieron comunes en Europa en los años 1600.',
             'Centuries ago most carrots were purple or yellow; orange ones became common in Europe in the 1600s.'] },
    { id: 'zapallito', es: 'Zapallo italiano', en: 'Zucchini', sci: 'Cucurbita pepo', from: 'seed', kind: 'veg', easy: 1,
      where: ['bed'], sprout: [5, 10], harvest: [45, 60], sun: 'full', water: 3,
      months: [4, 5, 6, 7], indoor: false,
      what: ['zapallitos', 'zucchini'],
      tip: ['Necesita espacio: una planta ocupa casi un metro. Riega la tierra, no las hojas.',
            'It needs room: one plant takes almost a metre. Water the soil, not the leaves.'],
      fact: ['Cada planta tiene flores macho y flores hembra; las abejas llevan el polen de unas a otras y así nace el fruto.',
             'Each plant has male and female flowers; bees carry the pollen between them and that is how the fruit starts.'] },
    { id: 'pepino', es: 'Pepino', en: 'Cucumber', sci: 'Cucumis sativus', from: 'seed', kind: 'veg', easy: 2,
      where: ['pot', 'bed'], sprout: [3, 10], harvest: [50, 70], sun: 'full', water: 3,
      months: [4, 5, 6], indoor: false,
      what: ['pepinos', 'cucumbers'],
      tip: ['Es una enredadera: si le pones una malla sube y los pepinos salen derechos y limpios.',
            'It is a vine: give it a net to climb and the cucumbers grow straight and clean.'],
      fact: ['Un pepino es más o menos 95 % agua, por eso se siente fresco.',
             'A cucumber is about 95% water, which is why it feels cool.'] },
    { id: 'choclo', es: 'Choclo', en: 'Corn', sci: 'Zea mays', from: 'seed', kind: 'veg', easy: 2,
      where: ['bed'], sprout: [7, 10], harvest: [70, 100], sun: 'full', water: 3,
      months: [4, 5, 6], indoor: false,
      what: ['choclos', 'ears of corn'],
      tip: ['Siémbralo en un grupo cuadrado (no en una sola fila): el viento lleva el polen de una planta a otra.',
            'Sow it in a square block (not one long row): the wind carries the pollen from plant to plant.'],
      fact: ['El maíz se cultivó por primera vez en México hace unos 9.000 años, a partir de una planta silvestre llamada teosinte.',
             'Corn was first grown in Mexico about 9,000 years ago, from a wild plant called teosinte.'] },
    { id: 'cilantro', es: 'Cilantro', en: 'Cilantro', sci: 'Coriandrum sativum', from: 'seed', kind: 'herb', easy: 1,
      where: ['pot', 'bed'], sprout: [7, 14], harvest: [45, 70], sun: 'part', water: 2,
      months: [2, 3, 4, 9, 10], indoor: false,
      what: ['hojas (y semillas)', 'leaves (and seeds)'],
      tip: ['Con calor florece muy rápido. Siembra un poquito cada tres semanas para tener siempre.',
            'In heat it flowers very fast. Sow a little every three weeks to always have some.'],
      fact: ['Sus semillas secas son una especia que se llama coriandro.',
             'Its dried seeds are a spice called coriander.'] },
    { id: 'perejil', es: 'Perejil', en: 'Parsley', sci: 'Petroselinum crispum', from: 'seed', kind: 'herb', easy: 2,
      where: ['cup', 'pot', 'bed'], sprout: [14, 28], harvest: [70, 90], sun: 'part', water: 2,
      months: [2, 3, 4, 9], indoor: true,
      what: ['hojas', 'leaves'],
      tip: ['Es lento: puede tardar hasta cuatro semanas en brotar. Remoja las semillas una noche antes.',
            'It is slow: it can take up to four weeks to sprout. Soak the seeds overnight first.'],
      fact: ['Vive dos años: el primero da hojas y el segundo florece y hace semillas.',
             'It lives two years: leaves the first year, flowers and seeds the second.'] },
    { id: 'ciboulette', es: 'Ciboulette', en: 'Chives', sci: 'Allium schoenoprasum', from: 'seed', kind: 'herb', easy: 1,
      where: ['cup', 'pot', 'bed'], sprout: [7, 14], harvest: [60, 90], sun: 'full', water: 2,
      months: [3, 4, 5, 9], indoor: true,
      what: ['hojas', 'leaves'],
      tip: ['Corta las hojas con tijera a 3 cm de la tierra y vuelven a crecer.',
            'Snip the leaves with scissors 3 cm above the soil and they grow back.'],
      fact: ['Es pariente de la cebolla y el ajo. Sus flores moradas también se comen.',
             'It is related to onions and garlic. Its purple flowers can be eaten too.'] },
    { id: 'calendula', es: 'Caléndula', en: 'Calendula', sci: 'Calendula officinalis', from: 'seed', kind: 'flower', easy: 1,
      where: ['pot', 'bed'], sprout: [7, 14], harvest: [45, 60], sun: 'full', water: 1,
      months: [2, 3, 4, 9, 10], indoor: false,
      what: ['flores', 'flowers'],
      tip: ['Corta las flores secas y saldrán más.', 'Pick off the dead flowers and more will come.'],
      fact: ['Sus flores se cierran en la tarde y en los días nublados, y se abren con el sol.',
             'Its flowers close in the evening and on cloudy days, and open in the sun.'] },
    { id: 'capuchina', es: 'Capuchina', en: 'Nasturtium', sci: 'Tropaeolum majus', from: 'seed', kind: 'flower', easy: 1,
      where: ['pot', 'bed'], sprout: [7, 14], harvest: [45, 65], sun: 'full', water: 1,
      months: [3, 4, 5], indoor: false,
      what: ['flores', 'flowers'],
      tip: ['Remoja la semilla una noche antes de sembrar. Florece más en tierra pobre y con poco riego.',
            'Soak the seed overnight before sowing. It flowers more in poor soil with little water.'],
      fact: ['Viene de los Andes de Sudamérica. Sus hojas redondas botan el agua como un paraguas, y sus flores se comen.',
             'It comes from the Andes of South America. Its round leaves shed water like an umbrella, and its flowers can be eaten.'] },
    { id: 'papa', es: 'Papa', en: 'Potato', sci: 'Solanum tuberosum', from: 'tuber', kind: 'veg', easy: 2,
      where: ['pot', 'bed'], sprout: [14, 28], harvest: [80, 120], sun: 'full', water: 2,
      months: [2, 3, 4], indoor: false,
      what: ['papas', 'potatoes'],
      note: ['Se planta una papa con brotes ("papa semilla"), no una semilla.', 'You plant a sprouting potato (a "seed potato"), not a seed.'],
      tip: ['Cuando la planta crezca, échale más tierra alrededor del tallo: ahí se forman más papas.',
            'As the plant grows, pile more soil around the stem: that is where more potatoes form.'],
      fact: ['La papa viene de los Andes, y en Chiloé se cultivan desde hace siglos cientos de variedades nativas.',
             'The potato comes from the Andes, and on Chiloé hundreds of native kinds have been grown for centuries.'] },
    { id: 'aji', es: 'Ají', en: 'Chili pepper', sci: 'Capsicum', from: 'seed', kind: 'veg', easy: 3,
      where: ['pot', 'bed'], sprout: [7, 21], harvest: [120, 150], sun: 'full', water: 2,
      months: [4, 5], indoor: false, start: [2, 3],
      what: ['ajíes', 'chili peppers'],
      note: ['Desde un almácigo comprado: unos 60 a 90 días.', 'From a nursery seedling: about 60 to 90 days.'],
      tip: ['Necesita mucho calor para brotar: siémbralo adentro y trasplántalo cuando las noches sean tibias. ¡No te toques los ojos después de tocar un ají!',
            'It needs a lot of warmth to sprout: start it indoors and plant out when nights are warm. Do not touch your eyes after touching a chili!'],
      fact: ['Los ajíes vienen de América. Lo que pica es la capsaicina, que está sobre todo en la parte blanca de adentro.',
             'Chili peppers come from the Americas. The heat is capsaicin, found mostly in the white part inside.'] }
  ];

  var STAGES = [
    { id: 0, es: 'Semilla', en: 'Seed' },
    { id: 1, es: 'Brote', en: 'Sprout' },
    { id: 2, es: 'Plantita', en: 'Seedling' },
    { id: 3, es: 'Creciendo', en: 'Growing' },
    { id: 4, es: 'Flores', en: 'Flowers' },
    { id: 5, es: 'Cosecha', en: 'Harvest' }
  ];

  var WHERE = {
    cup: { es: 'Vaso', en: 'Cup' },
    pot: { es: 'Maceta', en: 'Pot' },
    bed: { es: 'Huerto', en: 'Garden bed' }
  };

  var SUN = {
    full: { es: 'Sol pleno (6 horas o más)', en: 'Full sun (6 hours or more)' },
    part: { es: 'Media sombra (3 a 6 horas de sol)', en: 'Part shade (3 to 6 hours of sun)' }
  };
  var WATER = {
    1: { es: 'Poca: deja que la tierra se seque arriba', en: 'Little: let the top of the soil dry' },
    2: { es: 'Regular: cuando los 2 cm de arriba estén secos', en: 'Regular: when the top 2 cm are dry' },
    3: { es: 'Mucha: mantén la tierra húmeda', en: 'Lots: keep the soil damp' }
  };

  var MONTHS = {
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    esLong: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    enLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  // Three experiments, each with two sides (a, b) to compare, or one
  // set of seeds to watch (bag). Each: materials, steps, the guesses to
  // pick from, what to record, and what usually happens and why.
  var EXPERIMENTS = [
    { id: 'sol', icon: 'sun', es: 'Sol o sombra', en: 'Sun or shade',
      q: ['¿Qué le pasa a una planta que crece sin luz?', 'What happens to a plant that grows without light?'],
      a: ['Vaso al sol', 'Cup in the sun'], b: ['Vaso en un armario oscuro', 'Cup in a dark cupboard'],
      measure: 'height', days: 14,
      materials: [['2 vasos con tierra', '2 cups of soil'], ['4 porotos', '4 beans'], ['agua', 'water'], ['una regla', 'a ruler']],
      steps: [['Siembra 2 porotos en cada vaso y riégalos igual.', 'Sow 2 beans in each cup and water them the same.'],
              ['Pon un vaso en una ventana con sol y el otro en un armario oscuro.', 'Put one cup on a sunny windowsill and the other in a dark cupboard.'],
              ['Cada dos o tres días mide los dos y mira de qué color son.', 'Every two or three days measure both and look at their colour.']],
      guesses: [
        { id: 'a', es: 'El del sol crece más alto', en: 'The sunny one grows taller' },
        { id: 'b', es: 'El de la oscuridad crece más alto', en: 'The dark one grows taller' },
        { id: 'same', es: 'Crecen igual', en: 'They grow the same' }],
      colors: true,
      learned: ['Muchas veces el de la oscuridad crece más alto al principio, pero sale flaco y amarillo: se estira buscando luz. Sin luz la planta no puede hacer su comida (fotosíntesis), y cuando se le acaba la comida de la semilla deja de crecer. El del sol sale verde, bajo y fuerte.',
                'Often the dark one grows taller at first, but it is thin and yellow: it is stretching to find light. Without light a plant cannot make its food (photosynthesis), and once the food in the seed runs out it stops growing. The sunny one is green, shorter and strong.'] },
    { id: 'agua', icon: 'drop', es: 'Agua o sin agua', en: 'Water or no water',
      q: ['¿Puede brotar una semilla sin agua?', 'Can a seed sprout without water?'],
      a: ['Maceta regada', 'Watered pot'], b: ['Maceta sin regar', 'Pot with no water'],
      measure: 'height', days: 14,
      materials: [['2 macetas con tierra seca', '2 pots of dry soil'], ['6 semillas de rabanito o poroto', '6 radish or bean seeds'], ['agua', 'water']],
      steps: [['Siembra 3 semillas en cada maceta y ponlas juntas en el mismo lugar con luz.', 'Sow 3 seeds in each pot and put them side by side in the same bright place.'],
              ['Riega solo una de las dos. La otra nunca se riega.', 'Water only one of them. Never water the other.'],
              ['Cada dos o tres días cuenta cuántas brotaron y mide la más alta.', 'Every two or three days count how many came up and measure the tallest.']],
      guesses: [
        { id: 'a', es: 'Solo brota la regada', en: 'Only the watered one sprouts' },
        { id: 'b', es: 'Solo brota la seca', en: 'Only the dry one sprouts' },
        { id: 'same', es: 'Brotan las dos', en: 'Both sprout' }],
      count: true,
      learned: ['La semilla seca está dormida. Cuando absorbe agua se hincha, se despierta y empieza a crecer: eso se llama germinar. Sin agua no germina, aunque tenga luz y tierra.',
                'A dry seed is asleep. When it soaks up water it swells, wakes up and starts to grow: that is called germinating. Without water it does not germinate, even with light and soil.'] },
    { id: 'bolsa', icon: 'bag', es: 'Semillas en una bolsa', en: 'Seeds in a bag',
      q: ['¿Qué sale primero de una semilla: la raíz o el tallo?', 'What comes out of a seed first: the root or the shoot?'],
      a: ['Semillas', 'Seeds'], b: null,
      measure: 'checks', days: 10,
      materials: [['1 bolsa con cierre', '1 zip bag'], ['papel absorbente', 'paper towel'], ['5 porotos', '5 beans'], ['cinta adhesiva', 'tape']],
      steps: [['Moja el papel (que no gotee) y ponlo dentro de la bolsa.', 'Wet the paper towel (not dripping) and put it inside the bag.'],
              ['Pon los porotos entre el papel y la bolsa, para verlos, y cierra la bolsa.', 'Put the beans between the paper and the bag so you can see them, and close the bag.'],
              ['Pega la bolsa en una ventana (sin sol fuerte) y mírala cada día.', 'Tape the bag to a window (out of strong sun) and look every day.']],
      guesses: [
        { id: 'root', es: 'Primero la raíz', en: 'The root first' },
        { id: 'shoot', es: 'Primero el tallo', en: 'The shoot first' },
        { id: 'same', es: 'Los dos al mismo tiempo', en: 'Both at the same time' }],
      checks: [
        { id: 'swell', es: 'Las semillas se hincharon', en: 'The seeds swelled' },
        { id: 'root', es: 'Salió la raíz', en: 'A root came out' },
        { id: 'hairs', es: 'La raíz tiene pelitos', en: 'The root has tiny hairs' },
        { id: 'shoot', es: 'Salió el tallo', en: 'A shoot came out' },
        { id: 'leaves', es: 'Se ven hojitas', en: 'Little leaves show' }],
      learned: ['Primero sale la raíz (se llama radícula) y siempre crece hacia abajo, aunque des vuelta la bolsa: la planta siente la gravedad. Después sale el tallo hacia arriba. Los pelitos de la raíz ayudan a tomar agua.',
                'The root comes out first (it is called the radicle) and always grows down, even if you turn the bag around: the plant senses gravity. Then the shoot comes out and grows up. The tiny root hairs help it take in water.'] }
  ];

  function plant(id) {
    for (var i = 0; i < PLANTS.length; i++) if (PLANTS[i].id === id) return PLANTS[i];
    return null;
  }
  function experiment(id) {
    for (var i = 0; i < EXPERIMENTS.length; i++) if (EXPERIMENTS[i].id === id) return EXPERIMENTS[i];
    return null;
  }
  // Chile's planting months: the California ones, six months on.
  function chileMonths(p) {
    return (p.months || []).map(function(m) { return ((m - 1 + CHILE_SHIFT) % 12) + 1; }).sort(function(a, b) { return a - b; });
  }

  return { PLANTS: PLANTS, STAGES: STAGES, WHERE: WHERE, SUN: SUN, WATER: WATER, MONTHS: MONTHS,
           EXPERIMENTS: EXPERIMENTS, CHILE_SHIFT: CHILE_SHIFT, plant: plant, experiment: experiment, chileMonths: chileMonths };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HuertoData;
