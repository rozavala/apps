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
      { q: 'What is 8 x 4?', options: ['32', '36', '40', '28'], answer: 0 },
      { q: 'What is 100 - 45?', options: ['45', '55', '65', '75'], answer: 1 },
      { q: 'What is 20 / 4?', options: ['4', '5', '6', '10'], answer: 1 },
      { q: 'What is 9 x 9?', options: ['81', '72', '90', '99'], answer: 0 },
      { q: 'What is 50 + 50?', options: ['90', '100', '110', '120'], answer: 1 },
      { q: 'What is 6 x 6?', options: ['36', '30', '42', '48'], answer: 0 }
    ],
    music: [
      { q: 'Which note is higher?', options: ['C4', 'G4', 'E4', 'D4'], answer: 1 },
      { q: 'How many beats is a whole note?', options: ['1', '2', '3', '4'], answer: 3 },
      { q: 'What is a sharp symbol (#)?', options: ['Lowers note', 'Raises note', 'Silences note', 'Lengthens note'], answer: 1 },
      { q: 'How many strings on a standard guitar?', options: ['4', '5', '6', '7'], answer: 2 },
      { q: 'What is the clef used for higher notes?', options: ['Bass', 'Treble', 'Alto', 'Tenor'], answer: 1 },
      { q: 'What instrument has black and white keys?', options: ['Guitar', 'Violin', 'Piano', 'Drums'], answer: 2 }
    ],
    chess: [
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Rook', 'Knight', 'Pawn'], answer: 2 },
      { q: 'Can a King move two squares?', options: ['No', 'Only when castling', 'Yes', 'Only on first move'], answer: 1 },
      { q: 'Which piece can move diagonally?', options: ['Rook', 'Knight', 'Bishop', 'Pawn'], answer: 2 },
      { q: 'What is it called when a pawn reaches the other side?', options: ['Castling', 'Check', 'Promotion', 'En passant'], answer: 2 },
      { q: 'Which piece is placed in the corners at the start?', options: ['Bishop', 'Knight', 'Rook', 'Queen'], answer: 2 },
      { q: 'How many pawns does each player start with?', options: ['6', '8', '10', '12'], answer: 1 }
    ],
    history: [
      { q: 'What are the colors of the Chilean flag?', options: ['Red, White, Blue', 'Green, Yellow', 'Blue, White', 'Red, Yellow'], answer: 0 },
      { q: 'Who founded Santiago in 1541?', options: ['Pedro de Valdivia', 'Bernardo O\'Higgins', 'Arturo Prat', 'Manuel Blanco'], answer: 0 },
      { q: 'In what year did Chile declare independence?', options: ['1818', '1810', '1850', '1900'], answer: 0 },
      { q: 'What ancient civilization built Machu Picchu?', options: ['Aztecs', 'Maya', 'Inca', 'Olmec'], answer: 2 },
      { q: 'Who invented the light bulb?', options: ['Thomas Edison', 'Nikola Tesla', 'Albert Einstein', 'Isaac Newton'], answer: 0 },
      { q: 'Who was the first person to walk on the moon?', options: ['Neil Armstrong', 'Yuri Gagarin', 'Buzz Aldrin', 'John Glenn'], answer: 0 }
    ],
    art: [
      { q: 'What are the primary colors?', options: ['Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White, Gray', 'Red, Green, Blue'], answer: 0 },
      { q: 'What tool is used to paint on a canvas?', options: ['Hammer', 'Brush', 'Wrench', 'Spoon'], answer: 1 },
      { q: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Monet'], answer: 2 },
      { q: 'Mixing red and yellow makes what color?', options: ['Green', 'Orange', 'Purple', 'Brown'], answer: 1 },
      { q: 'Mixing blue and yellow makes what color?', options: ['Green', 'Orange', 'Purple', 'Pink'], answer: 0 },
      { q: 'What material is used to make pottery?', options: ['Wood', 'Clay', 'Metal', 'Glass'], answer: 1 }
    ],
    faith: [
      { q: 'Who is the foster father of Jesus?', options: ['Peter', 'Paul', 'Joseph', 'John'], answer: 2 },
      { q: 'What prayer begins with "Our Father"?', options: ['Hail Mary', 'Gloria', 'Lord\'s Prayer', 'Creed'], answer: 2 },
      { q: 'How many apostles did Jesus have?', options: ['10', '12', '14', '7'], answer: 1 },
      { q: 'Who was the mother of Jesus?', options: ['Elizabeth', 'Mary', 'Martha', 'Ruth'], answer: 1 },
      { q: 'In what city was Jesus born?', options: ['Jerusalem', 'Nazareth', 'Bethlehem', 'Rome'], answer: 2 },
      { q: 'Who baptized Jesus?', options: ['Peter', 'John the Baptist', 'Matthew', 'James'], answer: 1 }
    ],
    general: [
      { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
      { q: 'What do bees make?', options: ['Milk', 'Honey', 'Water', 'Syrup'], answer: 1 },
      { q: 'What is the largest mammal in the world?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], answer: 1 },
      { q: 'What force keeps us on the ground?', options: ['Magnetism', 'Friction', 'Gravity', 'Electricity'], answer: 2 }
    ]
  };

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
      var today = new Date().toISOString().split('T')[0];
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

  function _showOverlay(subject, question, onPass) {
    var existing = document.getElementById('lcheck-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'lcheck-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--font-display);color:#fff;';

    var SUBJECT_ICONS = { math: '🧮', music: '🎵', chess: '♟️', history: '🇨🇱', art: '🎨', faith: '⛪', general: '🌟' };
    var icon = SUBJECT_ICONS[subject] || '🌟';

    var card = document.createElement('div');
    card.className = 'dash-panel';
    card.style.maxWidth = '400px';
    card.style.width = '100%';
    card.style.textAlign = 'center';
    card.style.animation = 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

    card.innerHTML = 
      '<div style="font-size:3rem; margin-bottom:15px;">' + icon + '</div>' +
      '<h3>Quick Learning Check!</h3>' +
      '<p style="font-size:1.2rem; font-weight:700; margin:20px 0;">' + _escHtml(question.q) + '</p>' +
      '<div id="lcheck-options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;"></div>' +
      '<div id="lcheck-feedback" style="margin-top:20px; height:24px; font-weight:800;"></div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    var optionsEl = card.querySelector('#lcheck-options');
    var feedbackEl = card.querySelector('#lcheck-feedback');

    question.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'parent-btn'; // reuse style
      btn.style.margin = '0';
      btn.textContent = opt;
      btn.onclick = function() { _handleAnswer(i, question.answer, btn, optionsEl, feedbackEl, overlay, onPass); };
      optionsEl.appendChild(btn);
    });
  }

  function _handleAnswer(idx, correct, btn, optionsEl, feedbackEl, overlay, onPass) {
    var allBtns = optionsEl.querySelectorAll('button');
    for (var i = 0; i < allBtns.length; i++) { allBtns[i].disabled = true; }

    if (idx === correct) {
      btn.style.background = '#10B981';
      feedbackEl.style.color = '#10B981';
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
      btn.style.background = '#EF4444';
      feedbackEl.style.color = '#EF4444';
      feedbackEl.textContent = 'Try again! 💪';
      setTimeout(function() {
        for (var j = 0; j < allBtns.length; j++) { allBtns[j].disabled = false; }
        btn.style.background = '';
        feedbackEl.innerHTML = '';
      }, 1500);
    }
  }

  function _escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { maybePrompt: maybePrompt };
})();
