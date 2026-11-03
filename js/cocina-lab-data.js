/* ================================================================
   COCINA LAB — recipe, measuring-task and quiz data
   (js/cocina-lab-data.js)

   Hand-written, kid-sized versions of family / Chilean recipes,
   always cooked WITH a grown-up.

   Measures are metric. One cup here is the metric cup (250 ml),
   1 tbsp = 15 ml, 1 tsp = 5 ml. Grams are approximate weights for
   that volume (flour spooned in and levelled off).

   Ingredient:  { q:'1 1/2', u:'cup'|'tbsp'|'tsp'|'whole'|'g'|'pinch'|'taste',
                  n:'English name', es:'nombre', g:grams | ml:millilitres,
                  one:'egg' (singular for u:'whole'), note:'…' }
   Step:        { t:'text', who:'kid'|'help'|'adult', young:'help'|'adult'
                  (used instead of `who` for kids under 8),
                  icons:['wash','knife','hot','oven','oil','blade','egg'],
                  timer: seconds, tip:'…' }
   ================================================================ */

var CocinaData = (function() {
  'use strict';

  var RECIPES = [
    {
      id: 'panqueques', name: 'Panqueques con manjar', en: 'Thin pancakes with manjar',
      yield: { n: 4, label: 'servings', step: 1, min: 1, max: 12 },
      makes: 'about 8 thin panqueques',
      difficulty: 2, time: 40, color: '#C2410C',
      menu: ['panqueque', 'panqueques', 'panqueques con manjar', 'crepe', 'crepes', 'pancakes'],
      about: 'Chilean panqueques are thin like French crêpes, rolled up with manjar (dulce de leche).',
      ingredients: [
        { q: '1', u: 'cup', n: 'Flour', es: 'harina', g: 130 },
        { q: '2', u: 'whole', n: 'eggs', one: 'egg', es: 'huevos', g: 110 },
        { q: '1 1/2', u: 'cup', n: 'Milk', es: 'leche', ml: 375 },
        { q: '1', u: 'tbsp', n: 'Oil', es: 'aceite', ml: 15 },
        { q: null, u: 'pinch', n: 'Salt', es: 'sal' },
        { q: '1/2', u: 'cup', n: 'Manjar', es: 'manjar', g: 150, note: 'for the filling' },
        { q: '1', u: 'tsp', n: 'Butter', es: 'mantequilla', g: 5, note: 'to grease the pan' }
      ],
      equipment: ['Big bowl', 'Whisk', 'Measuring cups & spoons', 'Non-stick frying pan (20–24 cm)', 'Ladle or ¼ cup', 'Spatula'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds and tie back long hair.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Measure the flour and a pinch of salt into the big bowl. Level the cup with the back of a knife.', who: 'kid' },
        { t: 'Crack the eggs into a small cup first, so you can fish out any bits of shell.', who: 'kid', young: 'help', icons: ['egg'] },
        { t: 'Add the eggs, milk and oil to the flour. Whisk until smooth with no lumps.', who: 'kid' },
        { t: 'Let the batter rest for 10 minutes. The flour soaks up the milk and the panqueques tear less.', who: 'kid', timer: 600 },
        { t: 'Heat the pan on medium and wipe it with a little butter.', who: 'adult', icons: ['hot'] },
        { t: 'Pour about ¼ cup of batter into the pan and swirl it into a thin circle.', who: 'adult', icons: ['hot'], tip: 'Kids: watch from a step back. The pan and handle get very hot.' },
        { t: 'Cook about 1 minute until the edges look dry, flip, and cook 30 more seconds.', who: 'adult', icons: ['hot'], timer: 60 },
        { t: 'When a panqueque has cooled a little on the plate, spread a spoon of manjar on it and roll it up.', who: 'kid' }
      ]
    },
    {
      id: 'queque', name: 'Queque de vainilla', en: 'Vanilla loaf cake',
      yield: { n: 8, label: 'slices', step: 4, min: 4, max: 16 },
      makes: '1 loaf pan (about 25 cm)',
      difficulty: 2, time: 70, color: '#B45309',
      menu: ['queque', 'queque de vainilla', 'bizcocho', 'loaf cake'],
      about: 'Queque is the classic Chilean tea-time cake for "la once".',
      batchNote: 'For 16 slices, use two loaf pans instead of one big one.',
      ingredients: [
        { q: '2', u: 'cup', n: 'Flour', es: 'harina', g: 260 },
        { q: '1', u: 'cup', n: 'Sugar', es: 'azúcar', g: 200 },
        { q: '3', u: 'whole', n: 'eggs', one: 'egg', es: 'huevos', g: 165 },
        { q: '1/2', u: 'cup', n: 'Oil', es: 'aceite', ml: 125 },
        { q: '3/4', u: 'cup', n: 'Milk', es: 'leche', ml: 190 },
        { q: '2', u: 'tsp', n: 'Baking powder', es: 'polvos de hornear', g: 8 },
        { q: '1', u: 'tsp', n: 'Vanilla', es: 'vainilla', ml: 5 },
        { q: null, u: 'pinch', n: 'Salt', es: 'sal' }
      ],
      equipment: ['Loaf pan (about 25 cm)', 'Big bowl', 'Whisk or electric mixer', 'Sieve', 'Spatula', 'Toothpick', 'Oven mitts'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Turn the oven on to 180 °C so it is hot when the batter is ready.', who: 'adult', icons: ['oven'] },
        { t: 'Rub the loaf pan with a little oil and dust it with flour.', who: 'kid' },
        { t: 'Crack the eggs into the bowl, add the sugar and beat for 3 minutes until pale and fluffy.', who: 'help', icons: ['egg'], timer: 180, tip: 'With an electric mixer, a grown-up plugs it in and keeps fingers clear of the beaters.' },
        { t: 'Whisk in the oil, milk and vanilla.', who: 'kid' },
        { t: 'Sift the flour, baking powder and salt over the bowl and fold it in gently with a spatula.', who: 'kid' },
        { t: 'Pour the batter into the pan and smooth the top.', who: 'kid' },
        { t: 'Bake for about 40 minutes. Keep the oven door closed for the first 30 minutes.', who: 'adult', icons: ['oven', 'hot'], timer: 2400 },
        { t: 'Test with a toothpick in the middle. If it comes out clean, it is done.', who: 'adult', icons: ['oven', 'hot'] },
        { t: 'Let the queque cool in the pan for 15 minutes before turning it out.', who: 'kid', timer: 900 }
      ]
    },
    {
      id: 'pan-amasado', name: 'Pan amasado', en: 'Chilean kneaded bread rolls',
      yield: { n: 8, label: 'rolls', step: 4, min: 4, max: 24 },
      makes: '8 round rolls',
      difficulty: 3, time: 120, color: '#92400E',
      menu: ['pan amasado', 'amasado', 'pan casero', 'bread rolls'],
      about: 'Pan amasado means "kneaded bread". Pricking the top with a fork is the traditional finish.',
      ingredients: [
        { q: '4', u: 'cup', n: 'Flour', es: 'harina', g: 520 },
        { q: '1', u: 'tsp', n: 'Salt', es: 'sal', g: 6 },
        { q: '2 1/2', u: 'tsp', n: 'Dry yeast', es: 'levadura seca', g: 8 },
        { q: '1', u: 'tsp', n: 'Sugar', es: 'azúcar', g: 4 },
        { q: '1 1/4', u: 'cup', n: 'Warm water', es: 'agua tibia', ml: 310 },
        { q: '1/4', u: 'cup', n: 'Lard or butter, melted', es: 'manteca', g: 55 }
      ],
      equipment: ['Big bowl', 'Cup for the yeast', 'Clean kitchen towel', 'Fork', 'Baking tray', 'Oven mitts'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Mix the yeast and sugar into the warm water. It should feel warm, like a bath, not hot.', who: 'help', tip: 'A grown-up checks the water. Too hot and the yeast stops working.' },
        { t: 'Wait 10 minutes until the yeast water is foamy.', who: 'kid', timer: 600 },
        { t: 'Put the flour and salt in the big bowl and make a hole in the middle.', who: 'kid' },
        { t: 'Melt the lard or butter.', who: 'adult', icons: ['hot'] },
        { t: 'Pour the yeast water and melted fat into the hole and mix into a soft dough.', who: 'kid' },
        { t: 'Knead on the counter for 10 minutes: push with the heel of your hand, fold, turn, repeat.', who: 'kid', timer: 600, tip: 'The dough is ready when it is smooth and springs back when you poke it.' },
        { t: 'Cover with the towel and let it rise for about 40 minutes, until it doubles in size.', who: 'kid', timer: 2400 },
        { t: 'Heat the oven to 200 °C.', who: 'adult', icons: ['oven'] },
        { t: 'Divide into 8 pieces, roll into balls, flatten a little and prick each top with a fork.', who: 'kid' },
        { t: 'Let the rolls rest on the tray for 15 minutes.', who: 'kid', timer: 900 },
        { t: 'Bake about 20 minutes until golden underneath.', who: 'adult', icons: ['oven', 'hot'], timer: 1200 }
      ]
    },
    {
      id: 'galletas-avena', name: 'Galletas de avena', en: 'Oat cookies',
      yield: { n: 20, label: 'cookies', step: 10, min: 10, max: 60 },
      makes: '20 cookies',
      difficulty: 1, time: 35, color: '#A16207',
      menu: ['galletas', 'galleta', 'galletas de avena', 'cookies', 'avena'],
      about: 'Oats make these cookies chewy. The dough is a great place to practise measuring.',
      ingredients: [
        { q: '1 1/2', u: 'cup', n: 'Rolled oats', es: 'avena', g: 135 },
        { q: '1', u: 'cup', n: 'Flour', es: 'harina', g: 130 },
        { q: '1/2', u: 'cup', n: 'Sugar', es: 'azúcar', g: 100 },
        { q: '1/2', u: 'cup', n: 'Butter, soft', es: 'mantequilla', g: 115 },
        { q: '1', u: 'whole', n: 'egg', one: 'egg', es: 'huevo', g: 55 },
        { q: '1', u: 'tsp', n: 'Baking powder', es: 'polvos de hornear', g: 4 },
        { q: '1', u: 'tsp', n: 'Vanilla', es: 'vainilla', ml: 5 },
        { q: '1/2', u: 'tsp', n: 'Cinnamon', es: 'canela', g: 1 },
        { q: null, u: 'pinch', n: 'Salt', es: 'sal' }
      ],
      equipment: ['Big bowl', 'Wooden spoon', 'Baking tray with paper', 'Two teaspoons', 'Oven mitts', 'Cooling rack'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Heat the oven to 180 °C and line the tray with baking paper.', who: 'adult', icons: ['oven'] },
        { t: 'Mash the soft butter and sugar together with the wooden spoon until creamy.', who: 'kid' },
        { t: 'Crack in the egg, add the vanilla and mix well.', who: 'kid', icons: ['egg'] },
        { t: 'Stir in the flour, oats, baking powder, cinnamon and salt.', who: 'kid' },
        { t: 'Scoop walnut-sized balls onto the tray, a hand-width apart. Press each one a little flat.', who: 'kid' },
        { t: 'Bake for 12 minutes, until the edges are golden.', who: 'adult', icons: ['oven', 'hot'], timer: 720 },
        { t: 'Leave them on the tray for 5 minutes. They are soft when hot and firm up as they cool.', who: 'kid', timer: 300 }
      ]
    },
    {
      id: 'ensalada-chilena', name: 'Ensalada chilena', en: 'Tomato & onion salad',
      yield: { n: 4, label: 'servings', step: 1, min: 1, max: 12 },
      makes: 'a big bowl for 4',
      difficulty: 1, time: 20, color: '#B91C1C',
      menu: ['ensalada chilena', 'tomate cebolla', 'tomate con cebolla', 'tomato salad'],
      about: 'Tomato with onion cut "en pluma" (thin feathers): on Chilean tables next to asados and empanadas.',
      ingredients: [
        { q: '4', u: 'whole', n: 'ripe tomatoes', one: 'ripe tomato', es: 'tomates', g: 600 },
        { q: '1', u: 'whole', n: 'onions', one: 'onion', es: 'cebolla', g: 150 },
        { q: '2', u: 'tbsp', n: 'Oil', es: 'aceite', ml: 30 },
        { q: '1/2', u: 'tsp', n: 'Salt', es: 'sal', g: 3 },
        { q: '2', u: 'tbsp', n: 'Fresh cilantro, chopped', es: 'cilantro', g: 6 }
      ],
      equipment: ['Cutting board', 'Sharp knife (grown-up)', 'Bowl of cold water', 'Kitchen scissors', 'Salad bowl'],
      steps: [
        { t: 'Wash your hands, then wash the tomatoes and cilantro under cold water.', who: 'kid', icons: ['wash'] },
        { t: 'Peel the onion and slice it into very thin half-moons ("en pluma").', who: 'adult', icons: ['knife'] },
        { t: 'Soak the onion in cold water for 10 minutes. This makes it taste milder.', who: 'kid', timer: 600 },
        { t: 'Cut the tomatoes into thin half-slices. Use the claw grip: fingertips curled under.', who: 'help', young: 'adult', icons: ['knife'], tip: 'Older kids can cut with a grown-up right beside them. Younger cooks watch and learn the claw grip.' },
        { t: 'Snip the cilantro into small pieces with kitchen scissors.', who: 'kid', young: 'help', icons: ['blade'] },
        { t: 'Drain the onion and put everything in the salad bowl.', who: 'kid' },
        { t: 'Add the oil and salt and toss gently. Serve right away.', who: 'kid' }
      ]
    },
    {
      id: 'leche-asada', name: 'Leche asada', en: 'Baked milk custard',
      yield: { n: 6, label: 'servings', step: 2, min: 2, max: 12 },
      makes: '1 mould or 6 cups',
      difficulty: 2, time: 90, color: '#B45309',
      menu: ['leche asada', 'baked custard'],
      about: 'Leche asada gets its name from the golden, browned top it gets in the oven.',
      ingredients: [
        { q: '4', u: 'cup', n: 'Milk', es: 'leche', ml: 1000 },
        { q: '5', u: 'whole', n: 'eggs', one: 'egg', es: 'huevos', g: 275 },
        { q: '3/4', u: 'cup', n: 'Sugar', es: 'azúcar', g: 150 },
        { q: '1', u: 'tsp', n: 'Vanilla', es: 'vainilla', ml: 5 },
        { q: '1/2', u: 'cup', n: 'Sugar for caramel', es: 'azúcar para caramelo', g: 100 }
      ],
      equipment: ['Small pot', 'Mould or 6 oven-safe cups', 'Big bowl', 'Whisk', 'Sieve', 'Deep oven tray', 'Oven mitts'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Heat the oven to 180 °C.', who: 'adult', icons: ['oven'] },
        { t: 'Melt the caramel sugar in the small pot until amber and pour it into the mould.', who: 'adult', icons: ['hot'], tip: 'Melted sugar is far hotter than boiling water. Kids stay back for this step.' },
        { t: 'Crack the eggs into the big bowl and whisk with the sugar.', who: 'kid', icons: ['egg'] },
        { t: 'Whisk in the milk and vanilla.', who: 'kid' },
        { t: 'Pour the mixture through the sieve into the mould.', who: 'help' },
        { t: 'Set the mould in the deep tray, pour hot water around it (baño maría) and bake about 50 minutes.', who: 'adult', icons: ['oven', 'hot'], timer: 3000 },
        { t: 'It is done when the top is golden and the middle only wobbles a little. Cool, then chill in the fridge.', who: 'adult', icons: ['oven', 'hot'] }
      ]
    },
    {
      id: 'sopaipillas', name: 'Sopaipillas', en: 'Pumpkin fried breads',
      yield: { n: 16, label: 'sopaipillas', step: 8, min: 8, max: 48 },
      makes: '16 sopaipillas',
      difficulty: 3, time: 60, color: '#C2410C',
      menu: ['sopaipilla', 'sopaipillas', 'sopaipillas pasadas', 'calzones rotos'],
      about: 'Chilean sopaipillas are made with zapallo (pumpkin). They are eaten with pebre, or "pasadas" in chancaca syrup on rainy days.',
      ingredients: [
        { q: '1', u: 'cup', n: 'Cooked mashed zapallo', es: 'zapallo cocido', g: 250 },
        { q: '3', u: 'cup', n: 'Flour', es: 'harina', g: 390 },
        { q: '1', u: 'tsp', n: 'Salt', es: 'sal', g: 6 },
        { q: '1', u: 'tsp', n: 'Baking powder', es: 'polvos de hornear', g: 4 },
        { q: '3', u: 'tbsp', n: 'Lard or butter, melted', es: 'manteca', g: 40 },
        { q: null, u: 'taste', n: 'Oil for frying', es: 'aceite para freír', note: 'grown-up only' }
      ],
      equipment: ['Big bowl', 'Potato masher', 'Rolling pin', 'Round cutter or a glass', 'Fork', 'Deep pot (grown-up)', 'Slotted spoon', 'Paper towels'],
      steps: [
        { t: 'Cook the zapallo in water until soft, then drain it.', who: 'adult', icons: ['hot', 'knife'] },
        { t: 'Wash your hands. When the zapallo is cool, mash it smooth in the big bowl.', who: 'kid', icons: ['wash'] },
        { t: 'Add the flour, salt, baking powder and melted fat. Mix into a dough.', who: 'kid' },
        { t: 'Knead for 5 minutes until soft and smooth.', who: 'kid', timer: 300 },
        { t: 'Rest the dough under a towel for 10 minutes.', who: 'kid', timer: 600 },
        { t: 'Roll the dough out about ½ cm thick and cut circles with the cutter.', who: 'kid', young: 'help' },
        { t: 'Prick each circle 2–3 times with a fork so it does not puff up like a balloon.', who: 'kid' },
        { t: 'Fry a few at a time in hot oil, about 2 minutes per side, until golden.', who: 'adult', icons: ['oil', 'hot'], timer: 120, tip: 'Hot oil is grown-up only. Kids stay two big steps away from the stove.' },
        { t: 'Lift out with the slotted spoon and drain on paper towels.', who: 'adult', icons: ['oil', 'hot'] }
      ]
    },
    {
      id: 'huevos-revueltos', name: 'Huevos revueltos', en: 'Scrambled eggs',
      yield: { n: 2, label: 'servings', step: 1, min: 1, max: 6 },
      makes: '2 plates',
      difficulty: 1, time: 10, color: '#CA8A04',
      menu: ['huevos revueltos', 'huevo revuelto', 'revuelto', 'huevos', 'scrambled eggs'],
      about: 'A first stove recipe. Low heat and gentle stirring make soft, creamy eggs.',
      ingredients: [
        { q: '4', u: 'whole', n: 'eggs', one: 'egg', es: 'huevos', g: 220 },
        { q: '2', u: 'tbsp', n: 'Milk', es: 'leche', ml: 30 },
        { q: null, u: 'pinch', n: 'Salt', es: 'sal' },
        { q: '1', u: 'tsp', n: 'Butter', es: 'mantequilla', g: 5 }
      ],
      equipment: ['Bowl', 'Fork or whisk', 'Non-stick pan', 'Silicone spatula with a long handle'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Crack each egg on the flat counter and open it over the bowl with your thumbs.', who: 'kid', icons: ['egg'], tip: 'Fish out any bit of shell with a bigger piece of shell. It works like a scoop.' },
        { t: 'Add the milk and salt and whisk until it is all one yellow colour.', who: 'kid' },
        { t: 'Melt the butter in the pan on LOW heat.', who: 'adult', icons: ['hot'] },
        { t: 'Pour in the eggs. Stir slowly, pushing the eggs from the edge to the middle, for about 2 minutes.', who: 'help', young: 'adult', icons: ['hot'], timer: 120, tip: 'The grown-up holds the pan handle; the kid stirs with the long spatula.' },
        { t: 'Take the pan off the heat while the eggs still look a little shiny. They finish cooking on the plate.', who: 'adult', icons: ['hot'] },
        { t: 'Wash your hands again after touching raw egg.', who: 'kid', icons: ['wash'] }
      ]
    },
    {
      id: 'arroz-graneado', name: 'Arroz graneado', en: 'Fluffy Chilean rice',
      yield: { n: 4, label: 'servings', step: 1, min: 2, max: 12 },
      makes: '4 side servings',
      difficulty: 2, time: 30, color: '#A16207',
      menu: ['arroz', 'arroz graneado', 'arroz blanco', 'rice', 'pollo con arroz'],
      about: '"Graneado" means every grain stays separate. Toasting the rice first and not lifting the lid are the secrets.',
      ingredients: [
        { q: '1', u: 'cup', n: 'Long-grain rice', es: 'arroz', g: 200 },
        { q: '2', u: 'cup', n: 'Boiling water', es: 'agua hirviendo', ml: 500 },
        { q: '1', u: 'tbsp', n: 'Oil', es: 'aceite', ml: 15 },
        { q: '1/2', u: 'tsp', n: 'Salt', es: 'sal', g: 3 },
        { q: '1/4', u: 'whole', n: 'carrot, grated', one: 'carrot, grated', es: 'zanahoria', g: 20, note: 'optional' }
      ],
      equipment: ['Sieve', 'Pot with a lid', 'Wooden spoon', 'Kettle (grown-up)', 'Fork'],
      steps: [
        { t: 'Measure the rice and rinse it in the sieve under cold water, stirring with your fingers.', who: 'kid' },
        { t: 'Boil the water in the kettle.', who: 'adult', icons: ['hot'] },
        { t: 'Heat the oil in the pot and stir the rice (and carrot) for about 3 minutes until the grains look white.', who: 'adult', icons: ['hot'], timer: 180 },
        { t: 'Pour in the boiling water and salt. Stand back: it steams and bubbles up.', who: 'adult', icons: ['hot'] },
        { t: 'Turn the heat to low, put the lid on and cook 18 minutes. Don\'t lift the lid!', who: 'adult', icons: ['hot'], timer: 1080 },
        { t: 'Turn off the heat and let it rest, lid on, for 5 minutes.', who: 'kid', timer: 300 },
        { t: 'Fluff the rice with a fork so the grains separate.', who: 'help', icons: ['hot'] }
      ]
    },
    {
      id: 'smoothie-platano', name: 'Smoothie de plátano', en: 'Banana smoothie',
      yield: { n: 2, label: 'glasses', step: 1, min: 1, max: 6 },
      makes: '2 tall glasses',
      difficulty: 1, time: 10, color: '#CA8A04',
      menu: ['smoothie', 'batido', 'licuado', 'leche con platano', 'smoothie de platano'],
      about: 'Chileans call a banana "plátano". Very ripe bananas with brown spots make the sweetest smoothie.',
      ingredients: [
        { q: '2', u: 'whole', n: 'ripe bananas', one: 'ripe banana', es: 'plátanos', g: 240 },
        { q: '1 1/2', u: 'cup', n: 'Cold milk', es: 'leche fría', ml: 375 },
        { q: '1/2', u: 'cup', n: 'Plain yogurt', es: 'yogur natural', g: 125 },
        { q: '1', u: 'tsp', n: 'Honey', es: 'miel', ml: 5, note: 'optional' },
        { q: '4', u: 'whole', n: 'ice cubes', one: 'ice cube', es: 'hielo', g: 100 }
      ],
      equipment: ['Blender', 'Measuring cups', 'Glasses'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Peel the bananas and break them into pieces into the blender jar.', who: 'kid' },
        { t: 'Measure the milk and yogurt and pour them in. Add the honey and ice.', who: 'kid' },
        { t: 'Put the lid on tight. Blend for 40 seconds with a hand on the lid.', who: 'help', icons: ['blade'], timer: 40, tip: 'Never put fingers or spoons in the blender. A grown-up unplugs it before anyone opens it.' },
        { t: 'Pour into glasses and enjoy straight away.', who: 'kid' }
      ]
    },
    {
      id: 'pebre', name: 'Pebre', en: 'Chilean fresh salsa',
      yield: { n: 6, label: 'servings', step: 2, min: 2, max: 12 },
      makes: 'a bowl for the table',
      difficulty: 2, time: 25, color: '#15803D',
      menu: ['pebre', 'pebre chileno'],
      about: 'Pebre goes on bread, sopaipillas and asados. Every family has its own mix.',
      ingredients: [
        { q: '3', u: 'whole', n: 'tomatoes', one: 'tomato', es: 'tomates', g: 450 },
        { q: '1/2', u: 'whole', n: 'onions', one: 'onion', es: 'cebolla', g: 75 },
        { q: '1', u: 'cup', n: 'Fresh cilantro, chopped', es: 'cilantro', g: 20 },
        { q: '3', u: 'tbsp', n: 'Oil', es: 'aceite', ml: 45 },
        { q: '1', u: 'tbsp', n: 'Lemon juice or vinegar', es: 'limón o vinagre', ml: 15 },
        { q: '1/2', u: 'tsp', n: 'Salt', es: 'sal', g: 3 },
        { q: '1', u: 'whole', n: 'green chillies (ají verde)', one: 'green chilli (ají verde)', es: 'ají verde', g: 15, note: 'optional, seeds out' }
      ],
      equipment: ['Cutting board', 'Sharp knife (grown-up)', 'Kitchen scissors', 'Bowl', 'Spoon'],
      steps: [
        { t: 'Wash your hands, the tomatoes and the cilantro.', who: 'kid', icons: ['wash'] },
        { t: 'Chop the onion very small. Take the seeds out of the ají and chop it.', who: 'adult', icons: ['knife'], tip: 'After touching ají, wash hands well and do not rub your eyes.' },
        { t: 'Dice the tomatoes into small cubes using the claw grip.', who: 'help', young: 'adult', icons: ['knife'] },
        { t: 'Snip the cilantro into tiny pieces with the scissors.', who: 'kid', young: 'help', icons: ['blade'] },
        { t: 'Put everything in the bowl. Add the oil, lemon juice and salt and stir.', who: 'kid' },
        { t: 'Let it rest 15 minutes so the flavours mix.', who: 'kid', timer: 900 }
      ]
    },
    {
      id: 'empanadas-queso', name: 'Empanadas de queso', en: 'Baked cheese empanadas',
      yield: { n: 12, label: 'empanadas', step: 6, min: 6, max: 36 },
      makes: '12 small empanadas',
      difficulty: 3, time: 75, color: '#B45309',
      menu: ['empanada', 'empanadas', 'empanadas de queso', 'empanada de queso'],
      about: 'Empanadas are a Chilean favourite, especially for Fiestas Patrias. The folded edge is called the "repulgue".',
      ingredients: [
        { q: '3', u: 'cup', n: 'Flour', es: 'harina', g: 390 },
        { q: '1', u: 'tsp', n: 'Salt', es: 'sal', g: 6 },
        { q: '1', u: 'tsp', n: 'Baking powder', es: 'polvos de hornear', g: 4 },
        { q: '1/3', u: 'cup', n: 'Butter or lard, melted', es: 'mantequilla o manteca', g: 80 },
        { q: '3/4', u: 'cup', n: 'Warm milk', es: 'leche tibia', ml: 190 },
        { q: '300', u: 'g', n: 'Mantecoso cheese, in sticks', es: 'queso mantecoso', g: 300 },
        { q: '1', u: 'whole', n: 'egg, beaten (for brushing)', one: 'egg, beaten (for brushing)', es: 'huevo', g: 55 }
      ],
      equipment: ['Big bowl', 'Rolling pin', 'Saucer (about 12 cm) to cut circles', 'Fork', 'Pastry brush', 'Baking tray', 'Oven mitts'],
      steps: [
        { t: 'Wash your hands with soap for 20 seconds.', who: 'kid', icons: ['wash'], timer: 20 },
        { t: 'Heat the oven to 200 °C.', who: 'adult', icons: ['oven'] },
        { t: 'Mix the flour, salt and baking powder in the bowl.', who: 'kid' },
        { t: 'Add the melted butter and warm milk and mix into a dough.', who: 'kid' },
        { t: 'Knead 5 minutes until smooth, then rest it 15 minutes under a towel.', who: 'kid', timer: 900 },
        { t: 'Roll the dough thin (about 3 mm) and cut circles around the saucer.', who: 'kid', young: 'help', tip: 'A grown-up can do the cutting around the saucer with a knife; younger cooks can use a big round cutter.' },
        { t: 'Put a stick of cheese on one half of each circle. Wet the edge with a fingertip of water.', who: 'kid' },
        { t: 'Fold over and press the edge closed with a fork, or fold the repulgue.', who: 'kid' },
        { t: 'Brush the tops with beaten egg, then wash your hands.', who: 'kid', icons: ['egg', 'wash'] },
        { t: 'Bake about 18 minutes until golden.', who: 'adult', icons: ['oven', 'hot'], timer: 1080 },
        { t: 'Cool for 5 minutes. Melted cheese inside stays very hot!', who: 'kid', icons: ['hot'], timer: 300 }
      ]
    }
  ];

  // ---- Measuring Lab tasks -------------------------------------------
  // scene: jug | cups | scale | count. Cups sizes are in twelfths of a cup:
  // 1 = 12, ½ = 6, ⅓ = 4, ¼ = 3.
  var LEVELS = [
    { n: 1, name: 'Little Chef',    es: 'Chef pequeño',  tier: 'beginner' },
    { n: 2, name: 'Kitchen Helper', es: 'Ayudante',      tier: 'intermediate' },
    { n: 3, name: 'Sous-chef',      es: 'Segundo chef',  tier: 'advanced' },
    { n: 4, name: 'Head Chef',      es: 'Chef principal', tier: 'expert' }
  ];

  var TASKS = [
    // Level 1
    { id: 'm1', level: 1, scene: 'jug', liquid: 'water', target: 250, cap: 500, marker: true,
      title: 'Fill to the line', prompt: 'Pour water up to the red line. That is 1 cup = 250 ml.' },
    { id: 'm2', level: 1, scene: 'cups', food: 'flour', target: 12, tools: [12, 6],
      title: 'One cup of flour', prompt: 'Scoop 1 cup of flour, level it off with the knife, then tip it into the bowl.' },
    { id: 'm3', level: 1, scene: 'scale', food: 'sugar', target: 100, bowl: 0, dial: false,
      title: 'Weigh 100 g', prompt: 'Pour sugar into the bowl until the scale says 100 g.' },
    { id: 'm4', level: 1, scene: 'count', small: 6, big: 12, answer: 2, choices: [2, 3, 4],
      title: 'Halves', prompt: 'How many ½ cups make 1 cup? Pour them in and count.' },
    // Level 2
    { id: 'm5', level: 2, scene: 'jug', liquid: 'milk', target: 150, cap: 500,
      title: 'Pour 150 ml of milk', prompt: 'Pour 150 ml of milk. Read the ml side of the jug.' },
    { id: 'm6', level: 2, scene: 'cups', food: 'flour', target: 9, tools: [12, 6, 4, 3],
      title: '¾ cup of flour', prompt: 'Measure ¾ cup of flour. Which cups add up to ¾?' },
    { id: 'm7', level: 2, scene: 'scale', food: 'sugar', target: 200, bowl: 180, dial: false,
      title: 'Tare, then 200 g', prompt: 'The empty bowl weighs something too! Press TARE to zero the scale, then pour 200 g of sugar.' },
    { id: 'm8', level: 2, scene: 'count', small: 3, big: 12, answer: 4, choices: [2, 3, 4, 5],
      title: 'Quarters', prompt: 'How many ¼ cups make 1 cup?' },
    { id: 'm9', level: 2, scene: 'count', spoon: true, small: 5, big: 15, answer: 3, choices: [2, 3, 4, 5],
      title: 'Spoons', prompt: 'How many teaspoons (5 ml) make 1 tablespoon (15 ml)?' },
    // Level 3
    { id: 'm10', level: 3, scene: 'jug', liquid: 'oil', target: 187.5, cap: 500, cupsOnly: true,
      title: '¾ cup of oil', prompt: 'Pour ¾ cup of oil. Read the CUP side of the jug this time.' },
    { id: 'm11', level: 3, scene: 'cups', food: 'oats', target: 8, tools: [12, 6, 4, 3],
      title: '⅔ cup of oats', prompt: 'Measure ⅔ cup of oats.' },
    { id: 'm12', level: 3, scene: 'cups', food: 'flour', target: 15, tools: [12, 6, 4, 3],
      title: '1¼ cups of flour', prompt: 'Measure 1¼ cups of flour using as few scoops as you can.' },
    { id: 'm13', level: 3, scene: 'scale', food: 'flour', target: 250, bowl: 220, dial: true,
      title: 'Dial scale: 250 g', prompt: 'This scale has a needle. Turn the dial to zero with the bowl on, then weigh 250 g of flour.' },
    { id: 'm14', level: 3, scene: 'count', small: 4, big: 12, answer: 3, choices: [2, 3, 4, 6],
      title: 'Thirds', prompt: 'How many ⅓ cups make 1 cup?' },
    // Level 4
    { id: 'm15', level: 4, scene: 'jug', liquid: 'milk', target: 375, cap: 1000,
      title: 'Scale it up', prompt: 'The recipe needs 1 cup of milk for 4 people. You are cooking for 6. How many ml? Pour it.',
      math: '1 cup = 250 ml · 6 ÷ 4 = 1½ · 250 × 1½ = 375 ml' },
    { id: 'm16', level: 4, scene: 'cups', food: 'sugar', target: 9, tools: [12, 6, 4, 3],
      title: 'More cookies', prompt: 'The recipe needs ½ cup of sugar for 12 cookies. Make 18 cookies.',
      math: '18 ÷ 12 = 1½ · ½ × 1½ = ¾ cup' },
    { id: 'm17', level: 4, scene: 'scale', food: 'flour', target: 150, bowl: 240, dial: true,
      title: 'Half a batch', prompt: 'The recipe needs 300 g of flour for 8 rolls. Make only 4 rolls.',
      math: '4 ÷ 8 = ½ · 300 g × ½ = 150 g' },
    { id: 'm18', level: 4, scene: 'count', small: 3, big: 18, answer: 6, choices: [4, 5, 6, 8],
      title: 'Quarters in 1½', prompt: 'How many ¼ cups make 1½ cups?' }
  ];

  // ---- Kitchen safety quiz (facts only) ------------------------------
  // a = index of the right answer. kid: true = in the short quiz for the youngest.
  var SAFETY = [
    { q: 'What do you do first, before you touch any food?', c: ['Wash hands with soap for about 20 seconds', 'Rinse hands with water for 2 seconds', 'Wipe hands on your clothes'], a: 0, kid: true,
      why: 'Soap and 20 seconds of scrubbing (about two "Happy Birthdays") wash germs away.' },
    { q: 'Which way should pot and pan handles point on the stove?', c: ['Turned in, over the counter', 'Sticking out past the edge', 'It does not matter'], a: 0, kid: true,
      why: 'A handle sticking out can be bumped and a hot pot can tip over.' },
    { q: 'Who fries food in hot oil?', c: ['Only a grown-up', 'Anyone who is careful', 'Kids, if they stand on a stool'], a: 0, kid: true,
      why: 'Hot oil is much hotter than boiling water and it can spit. Kids stay two big steps back.' },
    { q: 'How do you hold food when cutting with a knife?', c: ['Claw grip: fingertips curled under', 'Flat hand with fingers straight out', 'Hold it in the air'], a: 0, kid: true,
      why: 'Curled fingertips stay away from the blade, and your knuckles guide the knife.' },
    { q: 'After cracking raw eggs, you should…', c: ['Wash your hands', 'Lick your fingers', 'Just keep cooking'], a: 0, kid: true,
      why: 'Raw egg can carry germs like salmonella, so wash hands and the counter.' },
    { q: 'A pan of oil catches fire. What is right?', c: ['A grown-up turns off the heat and covers it with a lid', 'Throw water on it', 'Carry the pan outside'], a: 0,
      why: 'Water makes burning oil explode outwards. A lid takes away the air the fire needs.' },
    { q: 'Which oven mitt protects you best?', c: ['A dry one', 'A wet one', 'Both are the same'], a: 0,
      why: 'Water carries heat quickly, so a wet mitt can burn you with steam.' },
    { q: 'Something spills on the kitchen floor. When do you wipe it?', c: ['Right away', 'After dinner', 'Only if it is sticky'], a: 0, kid: true,
      why: 'Wet floors are slippery, and kitchens have hot pans and sharp knives around.' },
    { q: 'The blender is plugged in. Is it OK to push the food down with a spoon?', c: ['No. Unplug it first, then use a spatula', 'Yes, if it is turned off', 'Yes, if you are fast'], a: 0,
      why: 'Blades can start by accident. Unplugged is the only safe way.' },
    { q: 'How do you lift the lid off a pot of boiling water?', c: ['Tilt it so the steam goes away from you', 'Lift it straight up toward your face', 'Pull it toward you'], a: 0,
      why: 'Steam burns just like boiling water does.' },
    { q: 'How do you walk with a knife?', c: ['Point down, close to your side', 'Point up in the air', 'Point in front of you'], a: 0,
      why: 'If you trip or bump someone, a knife pointing down at your side cannot poke anyone.' },
    { q: 'Can you taste raw cookie dough or cake batter?', c: ['No, wait until it is baked', 'Yes, a big spoonful', 'Yes, if it is cold'], a: 0,
      why: 'Raw flour and raw eggs can carry germs. Baking makes them safe.' }
  ];

  // ---- Egg cracking: steps in order ------------------------------------
  var EGG_STEPS = [
    { id: 'tap',    t: 'Tap the egg firmly on the flat counter', why: 'A flat surface makes one clean crack with fewer shell bits than the bowl edge.' },
    { id: 'thumbs', t: 'Hold it over a small bowl, thumbs in the crack', why: 'Cracking into a small bowl first keeps shell out of your mixture.' },
    { id: 'pull',   t: 'Pull the shell apart gently', why: 'Pull out to the sides and let the egg drop.' },
    { id: 'fish',   t: 'Scoop out any shell bits with a bigger piece of shell', why: 'The sharp shell edge catches small bits better than a finger or spoon.' },
    { id: 'wash',   t: 'Wash your hands', why: 'Raw egg can carry germs.' }
  ];

  return { RECIPES: RECIPES, LEVELS: LEVELS, TASKS: TASKS, SAFETY: SAFETY, EGG_STEPS: EGG_STEPS };
})();
