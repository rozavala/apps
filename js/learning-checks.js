/* ================================================================
   LEARNING CHECKS — Shared Logic
   Interrupts gameplay occasionally to ask a subject-related question.
   ================================================================ */

var LearningCheck = (function() {
  'use strict';

  var CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between checks
  var MAX_CHECKS_PER_SESSION = 4;

  var QUESTIONS = {
    math: [
      { q: 'What is 12 + 15?', options: ['25', '27', '29', '30'], answer: 1 },
      { q: 'What is 30 / 5?', options: ['5', '6', '7', '8'], answer: 1 },
      { q: 'What is 8 x 4?', options: ['32', '36', '40', '28'], answer: 0 },
      { q: 'What is 100 - 45?', options: ['45', '55', '65', '75'], answer: 1 },
      { q: 'What is 20 / 4?', options: ['4', '5', '6', '10'], answer: 1 },
      { q: 'What is 9 x 9?', options: ['81', '72', '90', '99'], answer: 0 },
      { q: 'What is 50 + 50?', options: ['90', '100', '110', '120'], answer: 1 },
      { q: 'What is 6 x 6?', options: ['36', '30', '42', '48'], answer: 0 },
      { q: 'What is 7 x 8?', options: ['54', '56', '63', '64'], answer: 1 },
      { q: 'What is 15 + 28?', options: ['33', '43', '45', '53'], answer: 1 },
      { q: 'What is 100 - 37?', options: ['63', '67', '73', '137'], answer: 0 },
      { q: 'What is 81 / 9?', options: ['7', '8', '9', '10'], answer: 2 },
      { q: 'What is 3 x 12?', options: ['24', '30', '36', '48'], answer: 2 },
      { q: 'What is half of 20?', options: ['5', '8', '10', '12'], answer: 2 },
      { q: 'What is 25 + 17?', options: ['32', '40', '42', '52'], answer: 2 },
      { q: 'What is 144 / 12?', options: ['10', '11', '12', '14'], answer: 2 }
    ],
    music: [
      { q: 'Which note is higher?', options: ['C4', 'G4', 'E4', 'D4'], answer: 1 },
      { q: 'Which note comes after C?', options: ['A', 'B', 'D', 'E'], answer: 2 },
      { q: 'What instrument is a flute?', options: ['Brass', 'Woodwind', 'String', 'Percussion'], answer: 1 },
      { q: 'How many beats is a whole note?', options: ['1', '2', '3', '4'], answer: 3 },
      { q: 'What is a sharp symbol (#)?', options: ['Lowers note', 'Raises note', 'Silences note', 'Lengthens note'], answer: 1 },
      { q: 'How many strings on a standard guitar?', options: ['4', '5', '6', '7'], answer: 2 },
      { q: 'What is the clef used for higher notes?', options: ['Bass', 'Treble', 'Alto', 'Tenor'], answer: 1 },
      { q: 'What instrument has black and white keys?', options: ['Guitar', 'Violin', 'Piano', 'Drums'], answer: 2 },
      { q: 'How many beats is a half note?', options: ['1', '2', '3', '4'], answer: 1 },
      { q: 'How many beats is a quarter note?', options: ['1', '2', '3', '4'], answer: 0 },
      { q: 'What does a flat symbol (♭) do?', options: ['Raises the note', 'Lowers the note', 'Silences the note', 'Doubles the note'], answer: 1 },
      { q: 'How many lines are on a music staff?', options: ['4', '5', '6', '8'], answer: 1 },
      { q: 'What is a rest in music?', options: ['A louder note', 'A silence', 'A repeat sign', 'A high note'], answer: 1 },
      { q: 'Which family is the trumpet in?', options: ['Strings', 'Woodwind', 'Brass', 'Percussion'], answer: 2 },
      { q: 'After G, the musical alphabet goes back to…', options: ['H', 'A', 'Z', 'K'], answer: 1 },
      { q: 'How many strings does a violin have?', options: ['3', '4', '5', '6'], answer: 1 }
    ],
    chess: [
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Rook', 'Knight', 'Pawn'], answer: 2 },
      { q: 'How many squares on a chessboard?', options: ['60', '64', '68', '72'], answer: 1 },
      { q: 'Which piece moves horizontally and vertically?', options: ['Rook', 'Knight', 'Bishop', 'Pawn'], answer: 0 },
      { q: 'Can a King move two squares?', options: ['No', 'Only when castling', 'Yes', 'Only on first move'], answer: 1 },
      { q: 'Which piece can move diagonally?', options: ['Rook', 'Knight', 'Bishop', 'Pawn'], answer: 2 },
      { q: 'What is it called when a pawn reaches the other side?', options: ['Castling', 'Check', 'Promotion', 'En passant'], answer: 2 },
      { q: 'Which piece is placed in the corners at the start?', options: ['Bishop', 'Knight', 'Rook', 'Queen'], answer: 2 },
      { q: 'How many pawns does each player start with?', options: ['6', '8', '10', '12'], answer: 1 },
      { q: 'Which piece is the most powerful?', options: ['King', 'Queen', 'Rook', 'Bishop'], answer: 1 },
      { q: 'Which side moves first?', options: ['Black', 'White', 'Whoever captured last', 'The king'], answer: 1 },
      { q: 'How many knights does each player start with?', options: ['1', '2', '4', '8'], answer: 1 },
      { q: 'Which piece moves any number of squares diagonally?', options: ['Rook', 'Knight', 'Bishop', 'King'], answer: 2 },
      { q: 'What is checkmate?', options: ['The king is attacked and cannot escape', 'A draw', 'A pawn reaches the end', 'Both queens are captured'], answer: 0 },
      { q: 'What is a stalemate?', options: ['The king is in check', 'No legal move, and the king is not in check', 'A queen is trapped', 'A pawn is blocked'], answer: 1 },
      { q: 'En passant is a special move for which piece?', options: ['Knight', 'Bishop', 'Pawn', 'Rook'], answer: 2 },
      { q: 'How many bishops does each player start with?', options: ['1', '2', '4', '8'], answer: 1 }
    ],
    history: [
      { q: 'What are the colors of the Chilean flag?', options: ['Red, White, Blue', 'Green, Yellow', 'Blue, White', 'Red, Yellow'], answer: 0 },
      { q: 'Who discovered America?', options: ['Christopher Columbus', 'Ferdinand Magellan', 'Marco Polo', 'Vasco da Gama'], answer: 0 },
      { q: 'In what year did World War II end?', options: ['1945', '1939', '1918', '1950'], answer: 0 },
      { q: 'Who founded Santiago in 1541?', options: ['Pedro de Valdivia', 'Bernardo O\'Higgins', 'Arturo Prat', 'Manuel Blanco'], answer: 0 },
      { q: 'In what year did Chile declare independence?', options: ['1818', '1810', '1850', '1900'], answer: 0 },
      { q: 'What ancient civilization built Machu Picchu?', options: ['Aztecs', 'Maya', 'Inca', 'Olmec'], answer: 2 },
      { q: 'Who invented the light bulb?', options: ['Thomas Edison', 'Nikola Tesla', 'Albert Einstein', 'Isaac Newton'], answer: 0 },
      { q: 'Who was the first person to walk on the moon?', options: ['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'John Glenn'], answer: 0 },
      { q: 'In what year was Chile\'s first government junta?', options: ['1492', '1810', '1818', '1900'], answer: 1 },
      { q: 'Who was the first president of the United States?', options: ['Abraham Lincoln', 'George Washington', 'Thomas Jefferson', 'John Adams'], answer: 1 },
      { q: 'Who built the pyramids at Giza?', options: ['The Romans', 'The ancient Egyptians', 'The Incas', 'The Vikings'], answer: 1 },
      { q: 'In what year did people first walk on the Moon?', options: ['1957', '1961', '1969', '1975'], answer: 2 },
      { q: 'Which ocean did Magellan name?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
      { q: 'Who is the traditional author of the Iliad?', options: ['Homer', 'Plato', 'Virgil', 'Shakespeare'], answer: 0 },
      { q: 'The Great Wall is in which country?', options: ['Japan', 'India', 'China', 'Egypt'], answer: 2 },
      { q: 'In what year did Columbus reach the Americas?', options: ['1066', '1492', '1776', '1810'], answer: 1 }
    ],
    art: [
      { q: 'What are the primary colors?', options: ['Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White, Gray', 'Red, Green, Blue'], answer: 0 },
      { q: 'What are secondary colors?', options: ['Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White', 'Pink, Brown'], answer: 1 },
      { q: 'What do you use to draw?', options: ['Hammer', 'Screwdriver', 'Pencil', 'Wrench'], answer: 2 },
      { q: 'What tool is used to paint on a canvas?', options: ['Hammer', 'Brush', 'Wrench', 'Spoon'], answer: 1 },
      { q: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Monet'], answer: 2 },
      { q: 'Mixing red and yellow makes what color?', options: ['Green', 'Orange', 'Purple', 'Brown'], answer: 1 },
      { q: 'Mixing blue and yellow makes what color?', options: ['Green', 'Orange', 'Purple', 'Pink'], answer: 0 },
      { q: 'What material is used to make pottery?', options: ['Wood', 'Clay', 'Metal', 'Glass'], answer: 1 },
      { q: 'Who painted The Starry Night?', options: ['Claude Monet', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dalí'], answer: 1 },
      { q: 'Who painted the ceiling of the Sistine Chapel?', options: ['Michelangelo', 'Raphael', 'Donatello', 'Leonardo da Vinci'], answer: 0 },
      { q: 'A portrait is a picture of…', options: ['A mountain', 'A person', 'A building only', 'A map'], answer: 1 },
      { q: 'A landscape is a picture of…', options: ['An outdoor place', 'A bowl of fruit', 'A letter', 'A number chart'], answer: 0 },
      { q: 'Pointillism builds a picture from…', options: ['One thick line', 'Small dots of color', 'Torn paper only', 'Letters of the alphabet'], answer: 1 },
      { q: 'Which colors are warm colors?', options: ['Blue, green, purple', 'Red, orange, yellow', 'Black, white, gray', 'Pink, brown, black'], answer: 1 },
      { q: 'Which colors are cool colors?', options: ['Red, orange, yellow', 'Blue, green, purple', 'Black and white', 'Gold and silver'], answer: 1 },
      { q: 'What do you call a picture made by pressing ink onto paper?', options: ['A print', 'A fresco', 'A mosaic', 'A collage'], answer: 0 }
    ],
    faith: [
      { q: 'Who is the foster father of Jesus?', options: ['Peter', 'Paul', 'Joseph', 'John'], answer: 2 },
      { q: 'Who was the first Pope?', options: ['Paul', 'John', 'Peter', 'James'], answer: 2 },
      { q: 'Where did Jesus grow up?', options: ['Nazareth', 'Bethlehem', 'Jerusalem', 'Rome'], answer: 0 },
      { q: 'What prayer begins with "Our Father"?', options: ['Hail Mary', 'Gloria', 'Lord\'s Prayer', 'Creed'], answer: 2 },
      { q: 'How many apostles did Jesus have?', options: ['10', '12', '14', '7'], answer: 1 },
      { q: 'Who was the mother of Jesus?', options: ['Elizabeth', 'Mary', 'Martha', 'Ruth'], answer: 1 },
      { q: 'In what city was Jesus born?', options: ['Jerusalem', 'Nazareth', 'Bethlehem', 'Rome'], answer: 2 },
      { q: 'Who baptized Jesus?', options: ['Peter', 'John the Baptist', 'Matthew', 'James'], answer: 1 },
      { q: 'How many days did Jesus fast in the desert?', options: ['7', '12', '40', '100'], answer: 2 },
      { q: 'What is the first book of the Bible?', options: ['Exodus', 'Genesis', 'Psalms', 'Matthew'], answer: 1 },
      { q: 'Who built the ark before the flood?', options: ['Moses', 'Noah', 'Abraham', 'David'], answer: 1 },
      { q: 'Where does the Pope live?', options: ['Jerusalem', 'Vatican City', 'Santiago', 'Nazareth'], answer: 1 },
      { q: 'Who denied knowing Jesus three times?', options: ['Peter', 'John', 'Paul', 'Andrew'], answer: 0 },
      { q: 'What is the last book of the Bible?', options: ['Genesis', 'Acts', 'Revelation', 'Proverbs'], answer: 2 },
      { q: 'Easter celebrates…', options: ['The birth of Jesus', 'The Resurrection of Jesus', 'The first Christmas tree', 'The building of the ark'], answer: 1 },
      { q: 'How many books are in the New Testament?', options: ['12', '27', '39', '66'], answer: 1 }
    ],
    general: [
      { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
      { q: 'What do bees make?', options: ['Milk', 'Honey', 'Water', 'Syrup'], answer: 1 },
      { q: 'What is the largest mammal in the world?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], answer: 1 },
      { q: 'What force keeps us on the ground?', options: ['Magnetism', 'Friction', 'Gravity', 'Electricity'], answer: 2 },
      { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
      { q: 'How many planets in the solar system?', options: ['7', '8', '9', '10'], answer: 1 },
      { q: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], answer: 2 },
      { q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
      { q: 'What is the capital of the United States?', options: ['New York', 'Washington, D.C.', 'Los Angeles', 'Chicago'], answer: 1 },
      { q: 'Which metal is liquid at room temperature?', options: ['Iron', 'Gold', 'Mercury', 'Copper'], answer: 2 },
      { q: 'How many hours are in one day?', options: ['12', '24', '48', '60'], answer: 1 },
      { q: 'What is H2O?', options: ['Salt', 'Air', 'Water', 'Sand'], answer: 2 },
      { q: 'The Sun rises in which direction?', options: ['North', 'South', 'East', 'West'], answer: 2 },
      { q: 'How many letters are in the English alphabet?', options: ['24', '25', '26', '27'], answer: 2 }
    ],
    science: [
      { q: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], answer: 1 },
      { q: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Quartz'], answer: 2 },
      { q: 'What part of the plant conducts photosynthesis?', options: ['Root', 'Stem', 'Flower', 'Leaf'], answer: 3 },
      { q: 'What type of animal is a frog?', options: ['Reptile', 'Amphibian', 'Mammal', 'Fish'], answer: 1 },
      { q: 'At what temperature does water boil?', options: ['50°C', '90°C', '100°C', '120°C'], answer: 2 },
      { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], answer: 2 },
      { q: 'What is the closest star to Earth?', options: ['Sirius', 'Alpha Centauri', 'The Sun', 'Polaris'], answer: 2 },
      { q: 'What force pulls objects toward the center of the Earth?', options: ['Magnetism', 'Friction', 'Gravity', 'Electricity'], answer: 2 },
      { q: 'About how many bones are in an adult human body?', options: ['106', '206', '306', '506'], answer: 1 },
      { q: 'Which planet is famous for its bright rings?', options: ['Mars', 'Venus', 'Saturn', 'Mercury'], answer: 2 },
      { q: 'At what temperature does water freeze?', options: ['0°C', '32°C', '100°C', '−10°C'], answer: 0 },
      { q: 'What gas do people need from the air to live?', options: ['Carbon dioxide', 'Oxygen', 'Helium', 'Hydrogen'], answer: 1 },
      { q: 'A butterfly starts life as a…', options: ['Tadpole', 'Caterpillar', 'Fry', 'Calf'], answer: 1 },
      { q: 'What is the center of an atom called?', options: ['The nucleus', 'The crust', 'The orbit', 'The shell'], answer: 0 },
      { q: 'Which organ do you use to hear?', options: ['Eyes', 'Ears', 'Nose', 'Skin'], answer: 1 },
      { q: 'What do herbivores eat?', options: ['Only meat', 'Only plants', 'Only fish', 'Only insects'], answer: 1 }
    ],
    geography: [
      { q: 'What is the capital of Chile?', options: ['Valparaíso', 'Santiago', 'Lima', 'Buenos Aires'], answer: 1 },
      { q: 'Which river carries the most water?', options: ['The Nile', 'The Amazon', 'The Mississippi', 'The Thames'], answer: 1 },
      { q: 'Which continent is the largest?', options: ['Africa', 'Europe', 'Asia', 'North America'], answer: 2 },
      { q: 'Which continent is the smallest?', options: ['Europe', 'Australia', 'South America', 'Antarctica'], answer: 1 },
      { q: 'What is the capital of France?', options: ['Lyon', 'Paris', 'Madrid', 'Rome'], answer: 1 },
      { q: 'Which mountains stand between Chile and Argentina?', options: ['The Alps', 'The Andes', 'The Rockies', 'The Himalayas'], answer: 1 },
      { q: 'What is the largest hot desert?', options: ['The Gobi', 'The Sahara', 'The Atacama', 'The Kalahari'], answer: 1 },
      { q: 'Which ocean lies between the Americas and Europe?', options: ['Pacific', 'Indian', 'Atlantic', 'Arctic'], answer: 2 },
      { q: 'What is the capital of Japan?', options: ['Kyoto', 'Tokyo', 'Seoul', 'Beijing'], answer: 1 },
      { q: 'Which country is shaped like a boot?', options: ['Spain', 'Greece', 'Italy', 'Portugal'], answer: 2 },
      { q: 'What is the highest mountain above sea level?', options: ['Aconcagua', 'Kilimanjaro', 'Mount Everest', 'Denali'], answer: 2 },
      { q: 'What line divides Earth into north and south?', options: ['The Equator', 'The Prime Meridian', 'The Tropic of Cancer', 'The Arctic Circle'], answer: 0 },
      { q: 'What is the capital of Peru?', options: ['Cusco', 'Lima', 'Quito', 'La Paz'], answer: 1 },
      { q: 'The Great Barrier Reef is off the coast of…', options: ['Brazil', 'Australia', 'South Africa', 'Mexico'], answer: 1 },
      { q: 'What is the capital of Spain?', options: ['Barcelona', 'Seville', 'Madrid', 'Lisbon'], answer: 2 },
      { q: 'Chile is on which continent?', options: ['Europe', 'Africa', 'South America', 'Asia'], answer: 2 }
    ]
  };

  // The device's own calendar day. toISOString() is UTC, which in
  // California rolls over at 4–5 PM and handed out a second day's allowance.
  function _today(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _key() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return null;
    return 'zs_lcheck_' + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    var key = _key();
    if (!key) return {};
    try {
      var data = JSON.parse(localStorage.getItem(key)) || {};
      var today = _today();
      if (data.date !== today) {
        data = { date: today, count: 0, lastCheck: 0 };
      }
      return data;
    } catch(e) { return {}; }
  }

  function maybePrompt(subject, onPass) {
    var key = _key();
    if (!key) { if (onPass) onPass(); return; }

    var data = _getData();
    var now = Date.now();

    if (data.count >= MAX_CHECKS_PER_SESSION) { if (onPass) onPass(); return; }
    if (now - data.lastCheck < CHECK_INTERVAL_MS) { if (onPass) onPass(); return; }

    // Pick a question
    var bank = QUESTIONS[subject] || QUESTIONS.general;
    var question = bank[Math.floor(Math.random() * bank.length)];
    
    _showOverlay(subject, question, onPass);
  }

  // The overlay used to borrow the hub's .dash-panel / .parent-btn
  // classes, which only css/index.css styles. Inside an app the card had
  // no background and the answers were unreadable, so it styles itself.
  function _ensureStyles() {
    if (document.getElementById('lcheck-style')) return;
    var st = document.createElement('style');
    st.id = 'lcheck-style';
    st.textContent =
      '#lcheck-overlay .lcheck-card{background:#fff;color:#1c1b29;border-radius:24px;padding:26px 22px 20px;' +
        'box-shadow:0 18px 50px rgba(0,0,0,.35);max-width:420px;width:100%;text-align:center;' +
        'animation:popIn .5s cubic-bezier(.34,1.56,.64,1);font-family:var(--font-display,"Baloo 2",system-ui,sans-serif)}' +
      '#lcheck-overlay h3{margin:0;font-size:1.35rem;color:#312e81}' +
      '#lcheck-overlay .lcheck-q{font-size:1.15rem;font-weight:700;margin:16px 0 18px;color:#1c1b29;' +
        'font-family:var(--font-body,"Nunito",system-ui,sans-serif)}' +
      '#lcheck-overlay .lcheck-opt{min-height:52px;padding:10px 12px;border-radius:14px;border:2px solid #d6d2ea;' +
        'background:#f6f4fd;color:#1c1b29;font:800 1rem var(--font-body,"Nunito",system-ui,sans-serif);cursor:pointer;' +
        'transition:background .15s,border-color .15s,transform .1s}' +
      '#lcheck-overlay .lcheck-opt:hover:not(:disabled){border-color:#6D28D9;background:#ede9fe}' +
      '#lcheck-overlay .lcheck-opt:active:not(:disabled){transform:scale(.97)}' +
      '#lcheck-overlay .lcheck-opt:focus-visible{outline:3px solid #6D28D9;outline-offset:2px}' +
      '#lcheck-overlay .lcheck-opt:disabled{cursor:default;opacity:.75}' +
      '#lcheck-overlay .lcheck-opt.is-right{background:#059669;border-color:#059669;color:#fff;opacity:1}' +
      '#lcheck-overlay .lcheck-opt.is-wrong{background:#B91C1C;border-color:#B91C1C;color:#fff;opacity:1}' +
      '#lcheck-overlay .lcheck-fb{margin-top:16px;min-height:24px;font-weight:800;' +
        'font-family:var(--font-body,"Nunito",system-ui,sans-serif)}';
    document.head.appendChild(st);
  }

  function _showOverlay(subject, question, onPass) {
    var existing = document.getElementById('lcheck-overlay');
    if (existing) existing.remove();
    _ensureStyles();

    var overlay = document.createElement('div');
    overlay.id = 'lcheck-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,15,35,0.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Quick Learning Check');

    var SUBJECT_ICONS = { math: '🧮', music: '🎵', chess: '♟️', history: '🇨🇱', art: '🎨', faith: '⛪', science: '🔬', geography: '🌍', general: '🌟' };
    var icon = SUBJECT_ICONS[subject] || '🌟';

    var card = document.createElement('div');
    card.className = 'lcheck-card';

    card.innerHTML = 
      '<div style="font-size:3rem; margin-bottom:15px;">' + icon + '</div>' +
      '<h3>Quick Learning Check!</h3>' +
      '<p class="lcheck-q">' + _escHtml(question.q) + '</p>' +
      '<div id="lcheck-options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"></div>' +
      '<div id="lcheck-feedback" class="lcheck-fb" aria-live="polite"></div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var optionsEl = card.querySelector('#lcheck-options');
    var feedbackEl = card.querySelector('#lcheck-feedback');

    question.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lcheck-opt';
      btn.textContent = opt;
      btn.onclick = function() { _handleAnswer(i, question.answer, btn, optionsEl, feedbackEl, overlay, onPass); };
      optionsEl.appendChild(btn);
    });
  }

  function _handleAnswer(idx, correct, btn, optionsEl, feedbackEl, overlay, onPass) {
    var allBtns = optionsEl.querySelectorAll('button');
    for (var i = 0; i < allBtns.length; i++) { allBtns[i].disabled = true; }

    if (idx === correct) {
      btn.classList.add('is-right');
      feedbackEl.style.color = '#059669';
      feedbackEl.textContent = 'Correct! 🌟';
      
      var data = _getData();
      data.count++;
      data.lastCheck = Date.now();
      try { localStorage.setItem(_key(), JSON.stringify(data)); } catch(e) {}

      setTimeout(function() {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';
        setTimeout(function() {
          overlay.remove();
          if (onPass) onPass();
        }, 500);
      }, 1000);
    } else {
      btn.classList.add('is-wrong');
      feedbackEl.style.color = '#B91C1C';
      feedbackEl.textContent = 'Try again! 💪';
      setTimeout(function() {
        for (var j = 0; j < allBtns.length; j++) { allBtns[j].disabled = false; }
        btn.classList.remove('is-wrong');
        feedbackEl.innerHTML = '';
      }, 1500);
    }
  }

  function _escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { maybePrompt: maybePrompt };
})();
