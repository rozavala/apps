/* ================================================================
   MI NEGOCIO — data tables (products, weather, town events, quiz).
   Pure data + tiny helpers. Exposes one global: MiNegocioData.
   Prices are Chilean pesos (CLP), roughly what a homemade street
   stand pays and charges in a Chilean summer.
   ================================================================ */

var MiNegocioData = (function() {
  'use strict';

  // ---- products ----------------------------------------------------
  // ref      = a fair street price (the price most people expect)
  // e        = price elasticity: how fast buyers drop off as price rises
  // base     = buyers on a normal sunny weekday at the fair price
  // batch    = units per batch (one pot, one tray, one jug…)
  // cap      = batches your home kitchen can make in a day (Pro mode)
  // perBuy   = [min,max] units one customer buys
  // keep     = what happens to leftovers: 'spoil' | 'dayold' | 'freezer'
  // fit      = weather fit: sunny, hot, cloudy, rainy
  // simple   = the three round prices offered in Simple mode
  // ings     = ingredients: pack price, units of product one pack makes
  var PRODUCTS = [
    {
      id: 'empanadas', name: 'Empanadas de pino', short: 'Empanadas', unit: 'empanada', units: 'empanadas',
      icon: '🥟', ref: 2000, e: 2.0, base: 22, batch: 12, cap: 3, perBuy: [1, 2],
      keep: 'dayold', fit: { sunny: 1.0, hot: 0.8, cloudy: 1.15, rainy: 0.9 },
      simple: [1500, 2000, 3000], color: '#B45309',
      blurb: 'Baked pastry filled with pino: beef, onion, egg, olive and raisin.',
      keepNote: 'Leftovers keep one night — sold next day at half price, then thrown out.',
      ings: [
        { id: 'harina',  name: 'Flour',        es: 'Harina',         pack: '1 kg',     cost: 1400, makes: 12, keeps: true },
        { id: 'carne',   name: 'Ground beef',  es: 'Carne molida',   pack: '800 g',    cost: 6400, makes: 12, keeps: false },
        { id: 'cebolla', name: 'Onions',       es: 'Cebollas',       pack: '1 kg',     cost: 1200, makes: 24, keeps: true },
        { id: 'huevos',  name: 'Eggs',         es: 'Huevos',         pack: '6 eggs',   cost: 1500, makes: 12, keeps: true },
        { id: 'aceit',   name: 'Olives & raisins', es: 'Aceitunas y pasas', pack: '250 g', cost: 1800, makes: 24, keeps: true },
        { id: 'manteca', name: 'Lard',         es: 'Manteca',        pack: '250 g',    cost: 1100, makes: 12, keeps: true }
      ]
    },
    {
      id: 'mote', name: 'Mote con huesillo', short: 'Mote', unit: 'cup', units: 'cups',
      icon: '🍑', ref: 1500, e: 1.65, base: 26, batch: 10, cap: 3, perBuy: [1, 1],
      keep: 'spoil', fit: { sunny: 1.0, hot: 1.55, cloudy: 0.62, rainy: 0.3 },
      simple: [1000, 1500, 2500], color: '#C2410C', cold: true,
      blurb: 'Cold peach nectar with husked wheat and a dried peach. A Chilean summer classic.',
      keepNote: 'Prepared mote must be sold the same day — leftovers spoil.',
      ings: [
        { id: 'mote',     name: 'Husked wheat', es: 'Mote de trigo', pack: '1 kg',   cost: 2000, makes: 20, keeps: true },
        { id: 'huesillo', name: 'Dried peaches', es: 'Huesillos',    pack: '1 kg',   cost: 4500, makes: 20, keeps: true },
        { id: 'chancaca', name: 'Chancaca sugar', es: 'Chancaca',    pack: '2 cakes', cost: 1200, makes: 10, keeps: true },
        { id: 'canela',   name: 'Cinnamon & orange peel', es: 'Canela', pack: '1 bag', cost: 600, makes: 20, keeps: true },
        { id: 'vasos',    name: 'Cups & spoons', es: 'Vasos y cucharas', pack: '10',  cost: 1000, makes: 10, keeps: true }
      ]
    },
    {
      id: 'sopaipillas', name: 'Sopaipillas', short: 'Sopaipillas', unit: 'sopaipilla', units: 'sopaipillas',
      icon: '🟠', ref: 300, e: 1.9, base: 70, batch: 20, cap: 4, perBuy: [2, 4],
      keep: 'spoil', fit: { sunny: 0.9, hot: 0.7, cloudy: 1.15, rainy: 1.6 },
      simple: [200, 300, 500], color: '#D97706',
      blurb: 'Fried pumpkin dough rounds, eaten hot with pebre. Rainy-day favourite.',
      keepNote: 'Cold sopaipillas go hard — leftovers are thrown out each night.',
      ings: [
        { id: 'harina',  name: 'Flour',        es: 'Harina',   pack: '1 kg',  cost: 1400, makes: 40, keeps: true },
        { id: 'zapallo', name: 'Pumpkin',      es: 'Zapallo',  pack: '1 kg',  cost: 1000, makes: 40, keeps: true },
        { id: 'manteca', name: 'Lard',         es: 'Manteca',  pack: '250 g', cost: 1100, makes: 40, keeps: true },
        { id: 'aceite',  name: 'Frying oil',   es: 'Aceite',   pack: '1 L',   cost: 2400, makes: 60, keeps: true },
        { id: 'pebre',   name: 'Fresh pebre',  es: 'Pebre',    pack: '1 bowl', cost: 1200, makes: 40, keeps: false }
      ]
    },
    {
      id: 'limonada', name: 'Limonada / jugo natural', short: 'Limonada', unit: 'glass', units: 'glasses',
      icon: '🍋', ref: 1200, e: 1.55, base: 30, batch: 10, cap: 3, perBuy: [1, 2],
      keep: 'spoil', fit: { sunny: 1.0, hot: 1.6, cloudy: 0.62, rainy: 0.3 },
      simple: [800, 1200, 2000], color: '#A16207', cold: true,
      blurb: 'Fresh-squeezed lemonade with mint, poured over ice.',
      keepNote: 'Fresh juice must be sold the same day — leftovers are poured out.',
      ings: [
        { id: 'limones', name: 'Lemons',        es: 'Limones',  pack: '1 kg',  cost: 1800, makes: 10, keeps: true },
        { id: 'azucar',  name: 'Sugar',         es: 'Azúcar',   pack: '1 kg',  cost: 1200, makes: 40, keeps: true },
        { id: 'menta',   name: 'Fresh mint',    es: 'Menta',    pack: '1 bunch', cost: 800, makes: 10, keeps: false },
        { id: 'vasos',   name: 'Cups & straws', es: 'Vasos y bombillas', pack: '10', cost: 1200, makes: 10, keeps: true }
      ]
    },
    {
      id: 'helados', name: 'Helados caseros', short: 'Helados', unit: 'ice pop', units: 'ice pops',
      icon: '🍦', ref: 800, e: 1.6, base: 34, batch: 20, cap: 2, perBuy: [1, 2],
      keep: 'freezer', fit: { sunny: 1.0, hot: 1.7, cloudy: 0.5, rainy: 0.2 },
      simple: [500, 800, 1500], color: '#BE185D', cold: true, locked: true,
      blurb: 'Homemade fruit ice pops (paletas) — strawberry, mango and lúcuma.',
      keepNote: 'Ice pops keep in the freezer, so leftovers can be sold another day.',
      ings: [
        { id: 'fruta',   name: 'Fruit',         es: 'Fruta',    pack: '1 kg',  cost: 3000, makes: 20, keeps: false },
        { id: 'azucar',  name: 'Sugar',         es: 'Azúcar',   pack: '1 kg',  cost: 1200, makes: 40, keeps: true },
        { id: 'leche',   name: 'Milk & yogurt', es: 'Leche',    pack: '1 L',   cost: 1300, makes: 20, keeps: false },
        { id: 'palitos', name: 'Sticks & moulds', es: 'Palitos', pack: '20',   cost: 1000, makes: 20, keeps: true }
      ]
    }
  ];

  PRODUCTS.forEach(function(p) {
    var c = 0;
    p.ings.forEach(function(g) { c += g.cost / g.makes; });
    p.unitCost = Math.round(c);
    p.roundCost = c >= 500 ? Math.round(c / 100) * 100 : Math.round(c / 10) * 10;
  });

  function product(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return PRODUCTS[0];
  }

  // ---- weather -----------------------------------------------------
  // traffic: how many people are out walking (1 = normal).
  var WEATHER = {
    sunny:  { id: 'sunny',  name: 'Sunny',  es: 'Soleado',  icon: '☀️', traffic: 1.0,  t: [25, 29] },
    hot:    { id: 'hot',    name: 'Hot',    es: 'Caluroso', icon: '🔥', traffic: 1.05, t: [31, 35] },
    cloudy: { id: 'cloudy', name: 'Cloudy', es: 'Nublado',  icon: '☁️', traffic: 0.92, t: [19, 23] },
    rainy:  { id: 'rainy',  name: 'Rainy',  es: 'Lluvioso', icon: '🌧️', traffic: 0.62, t: [13, 17] }
  };

  // ---- "today in town" ---------------------------------------------
  // traffic multiplies people out; fit multiplies interest per product.
  var EVENTS = {
    normal:   { icon: '🏘️', title: 'A normal day in town', es: 'Un día normal',
                note: 'Neighbours running errands and out for a walk.', traffic: 1.0, fit: {} },
    sabado:   { icon: '🛍️', title: 'Saturday', es: 'Sábado',
                note: 'No work today — families are out shopping and strolling.', traffic: 1.4, fit: {} },
    misa:     { icon: '⛪', title: 'Sunday Mass', es: 'Misa del domingo',
                note: 'After Mass, families stay to walk around the plaza.', traffic: 1.45, fit: { empanadas: 1.15 } },
    futbol:   { icon: '⚽', title: 'Football match tonight', es: 'Partido de fútbol',
                note: 'Fans walk past on their way to watch La Roja play.', traffic: 1.45,
                fit: { empanadas: 1.4, sopaipillas: 1.25, limonada: 1.1 }, fans: true },
    fiesta:   { icon: '💃', title: 'Fiesta costumbrista', es: 'Fiesta costumbrista',
                note: 'Cueca, huasos and folk music in the plaza all afternoon!', traffic: 1.8,
                fit: { empanadas: 1.3, mote: 1.2 }, bunting: true },
    procesion:{ icon: '✝️', title: "Patron saint's procession", es: 'Procesión',
                note: "The town walks in procession for its patron saint's feast day.", traffic: 1.6,
                fit: { mote: 1.1, sopaipillas: 1.1 }, bunting: true },
    feria:    { icon: '🧺', title: 'Craft fair', es: 'Feria artesanal',
                note: 'Artisans sell copper, wool and pottery in the plaza.', traffic: 1.3, fit: {} },
    tour:     { icon: '🚌', title: 'Tour bus stop', es: 'Bus de turistas',
                note: 'A bus of visitors stops to photograph the old church.', traffic: 1.3,
                fit: { mote: 1.15, helados: 1.1 } },
    obras:    { icon: '🚧', title: 'Road works', es: 'Obras en la calle',
                note: 'Half the sidewalk is closed for repairs — fewer people pass.', traffic: 0.7, fit: {} },
    rival:    { icon: '🏪', title: 'A new stand at the corner', es: 'Competencia',
                note: 'Another stand opened nearby selling the same thing. Competition!', traffic: 1.0,
                fit: { all: 0.75 }, rival: true },
    campamento:{ icon: '🏕️', title: 'Summer camp outing', es: 'Campamento de verano',
                note: 'A summer camp group visits the plaza at lunchtime.', traffic: 1.25,
                fit: { helados: 1.25, limonada: 1.2, sopaipillas: 1.1 } }
  };

  var DAY_NAMES = [
    { en: 'Monday', es: 'Lunes' }, { en: 'Tuesday', es: 'Martes' }, { en: 'Wednesday', es: 'Miércoles' },
    { en: 'Thursday', es: 'Jueves' }, { en: 'Friday', es: 'Viernes' }, { en: 'Saturday', es: 'Sábado' },
    { en: 'Sunday', es: 'Domingo' }
  ];

  var PLACES = [
    { id: 'plaza', name: 'Plaza de Armas', note: 'Old church, palm trees and the Andes behind.' },
    { id: 'playa', name: 'Costanera', note: 'Beach promenade by the Pacific.' }
  ];

  // ---- concept quiz ------------------------------------------------
  // easy: true = suitable wording for younger kids.
  var QUIZ = [
    { easy: true, q: 'You sold lemonade and got $10.000. That money coming in is called…',
      a: ['Revenue (sales)', 'Profit', 'A loan'], c: 0,
      why: 'Revenue (ventas) is ALL the money that comes in from selling — before you pay for anything.' },
    { easy: true, q: 'Profit means…',
      a: ['Money in minus money out', 'All the money you collected', 'The price on your sign'], c: 0,
      why: 'Profit (ganancia) = revenue − costs. It is what is left after paying for ingredients and the stand.' },
    { easy: true, q: 'It is a very hot day. What will probably sell the most?',
      a: ['Mote con huesillo', 'Hot sopaipillas', 'They sell the same'], c: 0,
      why: 'Cold drinks and treats fit hot weather. Matching your product to the weather is reading DEMAND.' },
    { easy: true, q: 'You make 30 cups of juice but only sell 20. What happens to the other 10?',
      a: ['They spoil — you paid for them for nothing', 'You get your money back', 'They turn into profit'], c: 0,
      why: 'Fresh juice spoils the same day. Making too much is a cost with no sale — that is waste.' },
    { easy: true, q: 'You raise your price a lot. What usually happens?',
      a: ['Fewer people buy', 'More people buy', 'Nothing changes'], c: 0,
      why: 'Higher price → fewer buyers. That is the law of demand. The trick is finding the best price, not the highest.' },
    { easy: true, q: 'Flour, meat and cups that you buy to make your product are your…',
      a: ['Costs', 'Revenue', 'Customers'], c: 0,
      why: 'Ingredients are a cost (costo). You pay them whether or not you sell everything.' },
    { easy: false, q: 'You sold everything by noon and many customers left with nothing. Next time you should…',
      a: ['Make more (or raise the price a little)', 'Make less', 'Close the stand early'], c: 0,
      why: 'Selling out early means demand was bigger than supply. More stock — or a slightly higher price — earns more.' },
    { easy: false, q: 'Supply is how much you have to sell. Demand is…',
      a: ['How much people want to buy', 'How much your ingredients cost', 'How long your stand is open'], c: 0,
      why: 'Demand (demanda) is how much customers want at a given price. When demand > supply, you sell out.' },
    { easy: false, q: 'A stand permit costs $2.000 every day, even on a rainy day with no sales. That is a…',
      a: ['Fixed cost', 'Variable cost', 'Revenue'], c: 0,
      why: 'Fixed costs (costos fijos) stay the same no matter how much you sell. Ingredients are variable costs.' },
    { easy: false, q: 'You borrow $30.000 and must pay back $33.000. The extra $3.000 is…',
      a: ['Interest', 'Profit', 'Revenue'], c: 0,
      why: 'Interest (interés) is the price of borrowing money. A loan only helps if it earns you MORE than the interest.' },
    { easy: false, q: 'Each empanada costs you $1.000 to make. You sell it for $2.000. Your profit per empanada is…',
      a: ['$1.000', '$2.000', '$3.000'], c: 0,
      why: 'Price − cost per unit = profit per unit (margen): $2.000 − $1.000 = $1.000.' },
    { easy: false, q: 'A new stand selling the same thing opens next to yours. Your sales will probably…',
      a: ['Go down', 'Go up', 'Stay exactly the same'], c: 0,
      why: 'Competition splits the customers. Businesses compete with better value, better products or a better spot.' },
    { easy: false, q: 'Why can empanadas be less risky to over-make than mote con huesillo?',
      a: ['Leftover empanadas can still sell the next day', 'Empanadas are cheaper to make', 'Mote never sells'], c: 0,
      why: 'Products that keep lose less value when unsold. Spoilage is a big risk for fresh food businesses.' },
    { easy: false, q: 'Low prices sold everything, but your profit was small. Why?',
      a: ['You earned very little on each item', 'You had too many customers', 'Your costs went to zero'], c: 0,
      why: 'Profit = (price − cost) × units sold. A tiny margin times many sales can still be a small profit.' },
    { easy: false, q: 'Good value and never running out makes customers come back. In business that is called…',
      a: ['Reputation', 'Inflation', 'Interest'], c: 0,
      why: 'Reputation (fama) is what customers think of you. It brings more buyers tomorrow.' }
  ];

  return {
    PRODUCTS: PRODUCTS, product: product, WEATHER: WEATHER, EVENTS: EVENTS,
    DAY_NAMES: DAY_NAMES, PLACES: PLACES, QUIZ: QUIZ
  };
})();
