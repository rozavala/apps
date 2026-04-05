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
      { q: 'What is 100 - 45?', options: ['45', '55', '65', '75'], answer: 1 }
    ],
    music: [
      { q: 'Which note is higher?', options: ['C4', 'G4', 'E4', 'D4'], answer: 1 },
      { q: 'How many beats is a whole note?', options: ['1', '2', '3', '4'], answer: 3 }
    ],
    chess: [
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Rook', 'Knight', 'Pawn'], answer: 2 },
      { q: 'Can a King move two squares?', options: ['No', 'Only when castling', 'Yes', 'Only on first move'], answer: 1 }
    ],
    history: [
      { q: 'What are the colors of the Chilean flag?', options: ['Red, White, Blue', 'Green, Yellow', 'Blue, White', 'Red, Yellow'], answer: 0 }
    ],
    general: [
      { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 }
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
