/* ================================================================
   MONEY MASTER — DATA  (js/money-master-data.js)
   Denominations, the look of each piece (for MMArt), short fact
   cards, shop items and the EXAMPLE exchange rate.
   Facts are kept short and limited to well-documented ones (who is
   on the piece, what is on the back). Values in USD are in CENTS.
   ================================================================ */
(function () {
  'use strict';

  // Fixed, illustrative rate for the "Pesos ↔ Dollars" mode. It is an
  // EXAMPLE for practising — real rates change every day.
  var EXAMPLE_RATE = 1000; // pesos per US$1

  function F(en, es) { return { en: en, es: es }; }

  var CLP = [
    { v: 10, kind: 'coin', label: '$10', name: '10 pesos', nameEs: '10 pesos',
      metal: 'copper10', mm: 21, num: 10, fig: 'ohiggins', faceFlip: false,
      top: 'REPÚBLICA DE CHILE', bot: '★ ★ ★', person: "Bernardo O'Higgins",
      who: F("Bernardo O'Higgins — a leader of Chile's independence and Supreme Director of Chile from 1817 to 1823.",
             "Bernardo O'Higgins — líder de la Independencia y Director Supremo de Chile entre 1817 y 1823."),
      back: F('The value: 10 PESOS.', 'El valor: 10 PESOS.'),
      more: F('The smallest coin Chile makes today: the $1 and $5 coins stopped being made in 2017.',
              'La moneda de menor valor que se fabrica hoy: las de $1 y $5 dejaron de fabricarse en 2017.') },
    { v: 50, kind: 'coin', label: '$50', name: '50 pesos', nameEs: '50 pesos',
      metal: 'bronze50', mm: 25, num: 50, fig: 'ohiggins', faceFlip: false,
      top: 'REPÚBLICA DE CHILE', bot: '★ ★ ★', person: "Bernardo O'Higgins",
      who: F("Bernardo O'Higgins, like the $10 coin.", "Bernardo O'Higgins, igual que la moneda de $10."),
      back: F('The value: 50 PESOS.', 'El valor: 50 PESOS.'),
      more: F('Five $10 coins are worth the same as one $50 coin.', 'Cinco monedas de $10 valen lo mismo que una de $50.') },
    { v: 100, kind: 'coin', label: '$100', name: '100 pesos', nameEs: '100 pesos',
      metal: 'silver', ring: 'gold', mm: 23.5, reeded: true, num: 100, fig: 'mapuche', faceFlip: false, rev: 'arms',
      top: 'REPÚBLICA DE CHILE', bot: 'PUEBLOS ORIGINARIOS', person: 'Mujer mapuche',
      who: F('A Mapuche woman in traditional dress, wearing silver jewellery such as the trapelacucha.',
             'Una mujer mapuche con su vestimenta tradicional y joyas de plata, como la trapelacucha.'),
      back: F("Chile's coat of arms, held by a condor and a huemul, with the motto “Por la razón o la fuerza”.",
              'El escudo de Chile, sostenido por un cóndor y un huemul, con el lema «Por la razón o la fuerza».'),
      more: F("Chile's first bimetallic coin: a silver-coloured centre inside a golden ring.",
              'La primera moneda bimetálica de Chile: un centro plateado dentro de un anillo dorado.') },
    { v: 500, kind: 'coin', label: '$500', name: '500 pesos', nameEs: '500 pesos',
      metal: 'gold', mm: 26, num: 500, fig: 'silva', faceFlip: false,
      top: 'REPÚBLICA DE CHILE', bot: 'CARDENAL R. SILVA HENRÍQUEZ', small: true, person: 'Raúl Silva Henríquez',
      who: F('Cardinal Raúl Silva Henríquez — a Salesian priest who became Archbishop of Santiago in 1961 and a cardinal in 1962.',
             'El cardenal Raúl Silva Henríquez — sacerdote salesiano, arzobispo de Santiago desde 1961 y cardenal desde 1962.'),
      back: F('The value, 500 PESOS, and the year it was made.', 'El valor, 500 PESOS, y el año de acuñación.'),
      more: F("Chile's highest-value coin.", 'La moneda chilena de mayor valor.') },

    { v: 1000, kind: 'bill', label: '$1.000', name: '1.000 pesos', nameEs: '1.000 pesos',
      wmm: 120, hmm: 70, short: '1.000', words: 'MIL PESOS', fig: 'carrera', person: 'Ignacio Carrera Pinto',
      colour: F('green', 'verde'), ink: '#1d5a33', tint: '#a8d4a6', light: '#e8f4e4', accent: '#2f8f4e',
      scene: 'torres', place: 'Parque Nacional Torres del Paine',
      who: F('Ignacio Carrera Pinto — army officer and hero of the Battle of La Concepción (1882), in the War of the Pacific.',
             'Ignacio Carrera Pinto — oficial del Ejército y héroe del Combate de La Concepción (1882), en la Guerra del Pacífico.'),
      back: F('Torres del Paine National Park, in the Magallanes Region.', 'El Parque Nacional Torres del Paine, en la Región de Magallanes.'),
      more: F('Made of polymer (a strong plastic), like the $2.000 and $5.000 notes.', 'Es de polímero (un plástico resistente), como los de $2.000 y $5.000.') },
    { v: 2000, kind: 'bill', label: '$2.000', name: '2.000 pesos', nameEs: '2.000 pesos',
      wmm: 127, hmm: 70, short: '2.000', words: 'DOS MIL PESOS', fig: 'rodriguez', person: 'Manuel Rodríguez',
      colour: F('purple', 'morado'), ink: '#4a2868', tint: '#c9b1df', light: '#f1e8f7', accent: '#6d3a9c',
      scene: 'nalcas', place: 'Reserva Nacional Nalcas',
      who: F("Manuel Rodríguez — guerrilla leader in Chile's War of Independence, famous for his clever disguises.",
             'Manuel Rodríguez — guerrillero de la Independencia de Chile, famoso por sus ingeniosos disfraces.'),
      back: F('Nalcas National Reserve, in the Araucanía Region.', 'La Reserva Nacional Nalcas, en la Región de La Araucanía.'),
      more: F('Made of polymer, like the $1.000 and $5.000 notes.', 'Es de polímero, como los de $1.000 y $5.000.') },
    { v: 5000, kind: 'bill', label: '$5.000', name: '5.000 pesos', nameEs: '5.000 pesos',
      wmm: 134, hmm: 70, short: '5.000', words: 'CINCO MIL PESOS', fig: 'mistral', person: 'Gabriela Mistral',
      colour: F('pink-red', 'rojo rosado'), ink: '#8a1a3c', tint: '#f0a9be', light: '#fce8ef', accent: '#c0264f',
      scene: 'campana', place: 'Parque Nacional La Campana',
      who: F('Gabriela Mistral — Chilean poet and teacher. In 1945 she became the first Latin American to win the Nobel Prize in Literature.',
             'Gabriela Mistral — poeta y profesora chilena. En 1945 fue la primera persona latinoamericana en ganar el Premio Nobel de Literatura.'),
      back: F('La Campana National Park, with its Chilean palm trees.', 'El Parque Nacional La Campana, con sus palmas chilenas.'),
      more: F('Made of polymer, like the $1.000 and $2.000 notes.', 'Es de polímero, como los de $1.000 y $2.000.') },
    { v: 10000, kind: 'bill', label: '$10.000', name: '10.000 pesos', nameEs: '10.000 pesos',
      wmm: 141, hmm: 70, short: '10.000', words: 'DIEZ MIL PESOS', fig: 'prat', person: 'Arturo Prat',
      colour: F('blue', 'azul'), ink: '#163e78', tint: '#a0c1e9', light: '#e6effa', accent: '#1d5fbf',
      scene: 'agostini', place: 'Parque Nacional Alberto de Agostini',
      who: F('Arturo Prat — naval captain who commanded the Esmeralda in the Naval Battle of Iquique, on 21 May 1879.',
             'Arturo Prat — capitán de fragata que comandó la Esmeralda en el Combate Naval de Iquique, el 21 de mayo de 1879.'),
      back: F('Alberto de Agostini National Park, with its glaciers, in the far south (Magallanes).', 'El Parque Nacional Alberto de Agostini, con sus glaciares, en el extremo sur (Magallanes).'),
      more: F('Chilean notes get longer as their value goes up — compare them!', 'Los billetes chilenos son más largos mientras mayor es su valor. ¡Compáralos!') },
    { v: 20000, kind: 'bill', label: '$20.000', name: '20.000 pesos', nameEs: '20.000 pesos',
      wmm: 148, hmm: 70, short: '20.000', words: 'VEINTE MIL PESOS', fig: 'bello', person: 'Andrés Bello',
      colour: F('orange', 'naranjo'), ink: '#86390b', tint: '#f3b67c', light: '#fdeedd', accent: '#d0600f',
      scene: 'surire', place: 'Monumento Natural Salar de Surire',
      who: F('Andrés Bello — scholar born in Caracas in 1781. He wrote the Civil Code of Chile and was the first rector of the Universidad de Chile (1843).',
             'Andrés Bello — sabio nacido en Caracas en 1781. Redactó el Código Civil de Chile y fue el primer rector de la Universidad de Chile (1843).'),
      back: F('Salar de Surire Natural Monument, a salt flat in the Altiplano where flamingos live.', 'El Monumento Natural Salar de Surire, un salar del altiplano donde viven flamencos.'),
      more: F("Chile's highest-value note.", 'El billete chileno de mayor valor.') }
  ];

  var USD = [
    { v: 1, kind: 'coin', label: '1¢', name: 'penny', nameEs: 'penny (1 centavo)',
      metal: 'copperUS', mm: 19.05, num: 1, fig: 'lincoln', faceFlip: false, rev: 'shield', word: 'ONE CENT',
      top: 'IN GOD WE TRUST', bot: 'LIBERTY', person: 'Abraham Lincoln',
      who: F('Abraham Lincoln, the 16th President of the United States.', 'Abraham Lincoln, el 16.º presidente de Estados Unidos.'),
      back: F('A shield (the Union Shield), used since 2010.', 'Un escudo (el «Union Shield»), usado desde 2010.'),
      more: F('In 2025 the U.S. Mint stopped making new pennies for spending — but pennies are still real money.',
              'En 2025 la Casa de Moneda de EE. UU. dejó de fabricar pennies nuevos para circular, pero siguen siendo dinero válido.') },
    { v: 5, kind: 'coin', label: '5¢', name: 'nickel', nameEs: 'nickel (5 centavos)',
      metal: 'nickel', mm: 21.21, num: 5, fig: 'jefferson', faceFlip: true, rev: 'monticello', word: 'FIVE CENTS',
      top: 'IN GOD WE TRUST', bot: 'LIBERTY', person: 'Thomas Jefferson',
      who: F('Thomas Jefferson, the 3rd President of the United States.', 'Thomas Jefferson, el 3.er presidente de Estados Unidos.'),
      back: F("Monticello, Jefferson's home in Virginia.", 'Monticello, la casa de Jefferson en Virginia.'),
      more: F('A nickel is bigger than a dime, but worth less!', '¡El nickel es más grande que el dime, pero vale menos!') },
    { v: 10, kind: 'coin', label: '10¢', name: 'dime', nameEs: 'dime (10 centavos)',
      metal: 'silver', mm: 17.91, reeded: true, num: 10, fig: 'roosevelt', faceFlip: true, rev: 'torch', word: 'ONE DIME',
      top: 'LIBERTY', bot: 'IN GOD WE TRUST', person: 'Franklin D. Roosevelt',
      who: F('Franklin D. Roosevelt, the 32nd President of the United States.', 'Franklin D. Roosevelt, el 32.º presidente de Estados Unidos.'),
      back: F('A torch with an olive branch and an oak branch.', 'Una antorcha con una rama de olivo y una de roble.'),
      more: F('The smallest U.S. coin, with a ridged edge.', 'La moneda más pequeña de EE. UU., con el canto estriado.') },
    { v: 25, kind: 'coin', label: '25¢', name: 'quarter', nameEs: 'quarter (25 centavos)',
      metal: 'silver', mm: 24.26, reeded: true, num: 25, fig: 'washington', faceFlip: true, rev: 'eagle', word: 'QUARTER DOLLAR',
      top: 'LIBERTY', bot: 'IN GOD WE TRUST', person: 'George Washington',
      who: F('George Washington, the 1st President of the United States.', 'George Washington, el primer presidente de Estados Unidos.'),
      back: F('Quarters have had many different backs. This drawing shows the eagle design used for many years.',
              'El quarter ha tenido muchos reversos distintos. Este dibujo muestra el águila que se usó durante muchos años.'),
      more: F('Four quarters make one dollar.', 'Cuatro quarters forman un dólar.') },
    { v: 50, kind: 'coin', label: '50¢', name: 'half dollar', nameEs: 'half dollar (50 centavos)', rare: true,
      metal: 'silver', mm: 30.61, reeded: true, num: 50, fig: 'kennedy', faceFlip: true, rev: 'seal', word: 'HALF DOLLAR',
      top: 'LIBERTY', bot: 'IN GOD WE TRUST', person: 'John F. Kennedy',
      who: F('John F. Kennedy, the 35th President. The Kennedy half dollar was first made in 1964.', 'John F. Kennedy, el 35.º presidente. El half dollar con Kennedy se acuñó por primera vez en 1964.'),
      back: F('The Presidential Coat of Arms: an eagle holding a shield.', 'El escudo presidencial: un águila con un escudo.'),
      more: F('You rarely see one in shops today.', 'Hoy casi no se ve en las tiendas.') },

    { v: 100, kind: 'bill', label: '$1', name: 'one dollar', nameEs: 'un dólar', wmm: 156, hmm: 66, num: 1, words: 'ONE DOLLAR',
      fig: 'washington', faceFlip: true, person: 'George Washington', colour: F('green and black', 'verde y negro'),
      ink: '#1f3a29', tint: '#d6dfc7', light: '#eef2e4', accent: '#1f3a29', seal: '#2e7d4f',
      scene: 'seal1', place: 'The Great Seal',
      who: F('George Washington, the 1st President.', 'George Washington, el primer presidente.'),
      back: F('The two sides of the Great Seal of the United States (a pyramid and an eagle) and the word ONE.',
              'Las dos caras del Gran Sello de EE. UU. (una pirámide y un águila) y la palabra ONE.'),
      more: F('All U.S. notes are the same size, so read the number carefully!', 'Todos los billetes de EE. UU. tienen el mismo tamaño: ¡lee bien el número!') },
    { v: 500, kind: 'bill', label: '$5', name: 'five dollars', nameEs: 'cinco dólares', wmm: 156, hmm: 66, num: 5, words: 'FIVE DOLLARS',
      fig: 'lincoln', faceFlip: false, person: 'Abraham Lincoln', colour: F('light purple and grey', 'morado claro y gris'),
      ink: '#2c2f36', tint: '#d8cde6', light: '#f0edf4', accent: '#6b4f8a', seal: '#2e7d4f',
      scene: 'memorial', place: 'Lincoln Memorial',
      who: F('Abraham Lincoln, the 16th President.', 'Abraham Lincoln, el 16.º presidente.'),
      back: F('The Lincoln Memorial, in Washington, D.C.', 'El Monumento a Lincoln, en Washington D. C.'),
      more: F('Newer $5 notes have a light purple colour.', 'Los billetes de $5 más nuevos tienen un color morado claro.') },
    { v: 1000, kind: 'bill', label: '$10', name: 'ten dollars', nameEs: 'diez dólares', wmm: 156, hmm: 66, num: 10, words: 'TEN DOLLARS',
      fig: 'hamilton', faceFlip: true, person: 'Alexander Hamilton', colour: F('orange, yellow and red', 'naranjo, amarillo y rojo'),
      ink: '#2d2a26', tint: '#f2d0a4', light: '#f8efe2', accent: '#c2410c', seal: '#2e7d4f',
      scene: 'treasury', place: 'U.S. Treasury Building',
      who: F('Alexander Hamilton, the first Secretary of the Treasury. He was never president.', 'Alexander Hamilton, el primer secretario del Tesoro. Nunca fue presidente.'),
      back: F('The U.S. Treasury Building, in Washington, D.C.', 'El edificio del Tesoro de EE. UU., en Washington D. C.'),
      more: F('Newer $10 notes have orange, yellow and red colours.', 'Los billetes de $10 más nuevos tienen tonos naranjos, amarillos y rojos.') },
    { v: 2000, kind: 'bill', label: '$20', name: 'twenty dollars', nameEs: 'veinte dólares', wmm: 156, hmm: 66, num: 20, words: 'TWENTY DOLLARS',
      fig: 'jackson', faceFlip: true, person: 'Andrew Jackson', colour: F('green and peach', 'verde y durazno'),
      ink: '#23332a', tint: '#d7e5c4', light: '#f5efe3', accent: '#2f6b3a', seal: '#2e7d4f',
      scene: 'whitehouse', place: 'The White House',
      who: F('Andrew Jackson, the 7th President.', 'Andrew Jackson, el 7.º presidente.'),
      back: F('The White House, in Washington, D.C.', 'La Casa Blanca, en Washington D. C.'),
      more: F('Newer $20 notes have green and peach colours.', 'Los billetes de $20 más nuevos tienen tonos verdes y durazno.') }
  ];
  CLP.forEach(function (d) { d.cur = 'CLP'; });
  USD.forEach(function (d) { d.cur = 'USD'; });

  // Shop items: [id, english, español, CLP price, USD price in cents]
  var ITEMS = [
    ['apple', 'apple', 'manzana', 300, 75],
    ['banana', 'banana', 'plátano', 250, 40],
    ['bread', 'bread', 'pan', 600, 250],
    ['milk', 'milk', 'leche', 1100, 349],
    ['juice', 'juice box', 'jugo', 700, 125],
    ['pencil', 'pencil', 'lápiz', 400, 75],
    ['eraser', 'eraser', 'goma', 350, 60],
    ['notebook', 'notebook', 'cuaderno', 1500, 250],
    ['crayons', 'crayons', 'lápices de cera', 2200, 300],
    ['ball', 'ball', 'pelota', 4990, 699],
    ['car', 'toy car', 'autito', 3500, 499],
    ['cookies', 'cookies', 'galletas', 990, 249],
    ['stickers', 'stickers', 'stickers', 800, 150],
    ['empanada', 'empanada', 'empanada', 1800, 300]
  ].map(function (r) { return { id: r[0], en: r[1], es: r[2], clp: r[3], usd: r[4] }; });

  function list(cur) { return cur === 'USD' ? USD : CLP; }
  function find(cur, v) { var L = list(cur); for (var i = 0; i < L.length; i++) if (L[i].v === v) return L[i]; return null; }

  window.MM_DATA = {
    CLP: CLP,
    USD: USD,
    ITEMS: ITEMS,
    EXAMPLE_RATE: EXAMPLE_RATE,
    list: list,
    find: find,
    coinSpec: function (cur, v) { var d = find(cur, v); return d && d.kind === 'coin' ? d : null; },
    noteSpec: function (cur, v) { var d = find(cur, v); return d && d.kind === 'bill' ? d : null; }
  };
})();
