/* ================================================================
   ACTIVE LEARNING CHECKS — learning-checks.js
   
   Mid-session quiz gates to ensure kids are actively engaged.
   Apps call LearningCheck.maybePrompt() periodically.
   If triggered, a brief quiz popup appears. Get it right → continue.
   Wrong → gentle encouragement + retry.
   
   Requires: auth.js (getActiveUser)
   
   Usage in any app:
     // After a milestone or every N minutes:
     LearningCheck.maybePrompt('math', () => {
       // callback: resume gameplay
     });
   
   Storage: zs_lcheck_{user} → { lastCheck, checksToday, streak }
   ================================================================ */

const LearningCheck = (() => {
  'use strict';

  const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between checks
  const MAX_CHECKS_PER_SESSION = 4;

  // ── Question banks by subject ──
  const QUESTIONS = {
    math: [
      { q: 'What is 7 × 8?', options: ['54', '56', '48', '64'], answer: 1 },
      { q: 'What is 144 ÷ 12?', options: ['11', '13', '12', '14'], answer: 2 },
      { q: 'What shape has 6 sides?', options: ['Pentagon', 'Hexagon', 'Octagon', 'Heptagon'], answer: 1 },
      { q: 'What is 25% of 80?', options: ['15', '20', '25', '30'], answer: 1 },
      { q: 'What is 3² + 4²?', options: ['7', '25', '12', '49'], answer: 1 },
      { q: 'How many minutes in 2 hours?', options: ['100', '120', '90', '150'], answer: 1 },
      { q: 'What is 15 × 4?', options: ['45', '50', '60', '55'], answer: 2 },
      { q: 'Which is larger: ⅓ or ¼?', options: ['⅓', '¼', 'They are equal'], answer: 0 },
    ],
    music: [
      { q: 'How many notes in a musical octave?', options: ['6', '7', '8', '12'], answer: 2 },
      { q: 'What note comes after G?', options: ['H', 'A', 'F', 'B'], answer: 1 },
      { q: 'How many beats does a whole note get?', options: ['1', '2', '3', '4'], answer: 3 },
      { q: 'What does "forte" mean?', options: ['Slow', 'Loud', 'Soft', 'Fast'], answer: 1 },
      { q: 'How many strings on a standard guitar?', options: ['4', '5', '6', '8'], answer: 2 },
      { q: 'What clef is used for piano right hand?', options: ['Bass', 'Alto', 'Treble', 'Tenor'], answer: 2 },
    ],
    chess: [
      { q: 'Which piece can jump over others?', options: ['Bishop', 'Rook', 'Knight', 'Queen'], answer: 2 },
      { q: 'How does a pawn capture?', options: ['Forward', 'Diagonally', 'Sideways', 'Backward'], answer: 1 },
      { q: 'What is it called when the king is in danger?', options: ['Stalemate', 'Check', 'Castling', 'Fork'], answer: 1 },
      { q: 'How many squares on a chessboard?', options: ['32', '48', '64', '100'], answer: 2 },
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Knight', 'Rook', 'Pawn'], answer: 1 },
    ],
    history: [
      { q: 'In what year was Santiago founded?', options: ['1441', '1541', '1641', '1741'], answer: 1 },
      { q: 'What mountain range runs through Chile?', options: ['Alps', 'Rockies', 'Andes', 'Himalayas'], answer: 2 },
      { q: 'Who are the indigenous people of southern Chile?', options: ['Inca', 'Maya', 'Mapuche', 'Aztec'], answer: 2 },
      { q: 'What desert is in northern Chile?', options: ['Sahara', 'Gobi', 'Atacama', 'Kalahari'], answer: 2 },
      { q: 'What is Chile\'s capital city?', options: ['Valparaíso', 'Concepción', 'Santiago', 'Temuco'], answer: 2 },
    ],
    art: [
      { q: 'What are the three primary colors?', options: ['Red, Green, Blue', 'Red, Yellow, Blue', 'Red, Orange, Purple', 'Blue, Green, Yellow'], answer: 1 },
      { q: 'What technique uses tiny dots to create an image?', options: ['Cubism', 'Pointillism', 'Surrealism', 'Impressionism'], answer: 1 },
      { q: 'What do you call a painting of a landscape?', options: ['Portrait', 'Still life', 'Landscape', 'Abstract'], answer: 2 },
      { q: 'Mixing red and blue makes what color?', options: ['Green', 'Orange', 'Purple', 'Brown'], answer: 2 },
    ],
    faith: [
      { q: 'What is the first prayer Jesus taught?', options: ['Ave María', 'Padre Nuestro', 'Gloria', 'Credo'], answer: 1 },
      { q: 'How many decades are in a rosary?', options: ['3', '4', '5', '10'], answer: 2 },
      { q: 'Who is the patron saint of Chile?', options: ['San Pedro', 'Santiago', 'San Francisco', 'San José'], answer: 1 },
    ],
    general: [
      { q: 'What planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mercury', 'Mars'], answer: 2 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'What is H₂O?', options: ['Oxygen', 'Hydrogen', 'Water', 'Salt'], answer: 2 },
      { q: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
      { q: 'How many days are in a leap year?', options: ['364', '365', '366', '367'], answer: 2 },
    ]
  };

  // ── Storage ──

  function _key() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return null;
    return 'zs_lcheck_' + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    const key = _key();
    if (!key) return { lastCheck: 0, checksToday: 0, streak: 0, date: '' };
    try {
      const data = JSON.parse(localStorage.getItem(key)) || {};
      const today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
        data.date = today;
        data.checksToday = 0;
        _saveData(data);
      }
      return data;
    } catch { return { lastCheck: 0, checksToday: 0, streak: 0, date: '' }; }
  }

  function _saveData(data) {
    const key = _key();
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  // ── Core: decide whether to show a check ──

  function shouldCheck() {
    const data = _getData();
    if (data.checksToday >= MAX_CHECKS_PER_SESSION) return false;
    if (Date.now() - (data.lastCheck || 0) < CHECK_INTERVAL_MS) return false;
    return true;
  }

  // ── Main entry point for apps ──

  function maybePrompt(subject, onPass) {
    if (!shouldCheck()) {
      // Not time yet — just continue
      if (onPass) onPass();
      return;
    }

    // Pick a random question from the subject or general
    const bank = QUESTIONS[subject] || QUESTIONS.general;
    const allQ = [...bank, ...QUESTIONS.general];
    const question = allQ[Math.floor(Math.random() * allQ.length)];

    _showCheckOverlay(question, subject, onPass);
  }

  // ── Force a check (for testing or explicit triggers) ──

  function forcePrompt(subject, onPass) {
    const bank = QUESTIONS[subject] || QUESTIONS.general;
    const question = bank[Math.floor(Math.random() * bank.length)];
    _showCheckOverlay(question, subject, onPass);
  }

  // ── UI: overlay ──

  function _showCheckOverlay(question, subject, onPass) {
    // Remove existing if any
    const existing = document.getElementById('lcheck-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lcheck-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(11, 11, 26, 0.92); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Nunito', sans-serif; animation: lcFadeIn 0.3s ease-out;
    `;

    const SUBJECT_ICONS = { math: '🧮', music: '🎵', chess: '♟️', history: '🇨🇱', art: '🎨', faith: '⛪', general: '🌟' };
    const icon = SUBJECT_ICONS[subject] || '🌟';

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(30, 30, 60, 0.95); border: 1.5px solid rgba(167, 139, 250, 0.3);
      border-radius: 24px; padding: 32px 28px; max-width: 420px; width: 90%;
      text-align: center; color: #F0EDFF; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: lcPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    card.innerHTML = `
      <div style="font-size:2.5rem; margin-bottom:8px;">${icon}</div>
      <div style="font-family:'Baloo 2',cursive; font-size:1.3rem; font-weight:800; margin-bottom:4px; color:#C084FC;">
        Quick Brain Check!
      </div>
      <div style="font-size:0.85rem; color:rgba(240,237,255,0.6); margin-bottom:20px;">
        Answer correctly to keep playing
      </div>
      <div style="font-size:1.15rem; font-weight:700; margin-bottom:20px; line-height:1.4;" id="lcheck-question">
        ${_escHtml(question.q)}
      </div>
      <div id="lcheck-options" style="display:flex; flex-direction:column; gap:10px;"></div>
      <div id="lcheck-feedback" style="margin-top:16px; font-weight:700; font-size:1rem; min-height:28px;"></div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Add style keyframes
    if (!document.getElementById('lcheck-styles')) {
      const style = document.createElement('style');
      style.id = 'lcheck-styles';
      style.textContent = `
        @keyframes lcFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lcPopIn { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes lcShake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
        .lcheck-opt { 
          padding: 14px 20px; border-radius: 14px; border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #F0EDFF; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.2s; font-family: 'Nunito', sans-serif; text-align: left;
        }
        .lcheck-opt:hover { background: rgba(167,139,250,0.15); border-color: rgba(167,139,250,0.4); }
        .lcheck-opt.correct { background: rgba(16,185,129,0.2); border-color: #10B981; color: #34D399; }
        .lcheck-opt.wrong { background: rgba(239,68,68,0.15); border-color: #EF4444; color: #F87171; animation: lcShake 0.4s; }
        .lcheck-opt.disabled { pointer-events: none; opacity: 0.5; }
      `;
      document.head.appendChild(style);
    }

    // Render options
    const optionsEl = card.querySelector('#lcheck-options');
    const feedbackEl = card.querySelector('#lcheck-feedback');

    question.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'lcheck-opt';
      btn.textContent = opt;
      btn.onclick = () => _handleAnswer(i, question.answer, btn, optionsEl, feedbackEl, overlay, onPass);
      optionsEl.appendChild(btn);
    });
  }

  function _handleAnswer(selected, correct, btn, optionsEl, feedbackEl, overlay, onPass) {
    const allBtns = optionsEl.querySelectorAll('.lcheck-opt');

    if (selected === correct) {
      // Correct!
      btn.classList.add('correct');
      allBtns.forEach(b => b.classList.add('disabled'));
      feedbackEl.innerHTML = '<span style="color:#34D399;">✅ Correct! Keep going!</span>';

      // Update tracking
      const data = _getData();
      data.lastCheck = Date.now();
      data.checksToday = (data.checksToday || 0) + 1;
      data.streak = (data.streak || 0) + 1;
      _saveData(data);

      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => {
          overlay.remove();
          if (onPass) onPass();
        }, 300);
      }, 1200);

    } else {
      // Wrong — allow retry
      btn.classList.add('wrong');
      feedbackEl.innerHTML = '<span style="color:#F87171;">Not quite — try again!</span>';

      setTimeout(() => {
        btn.classList.remove('wrong');
        feedbackEl.innerHTML = '';
      }, 1500);
    }
  }

  function _escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Add custom questions (for parent content creator) ──

  function addQuestion(subject, questionObj) {
    if (!QUESTIONS[subject]) QUESTIONS[subject] = [];
    QUESTIONS[subject].push(questionObj);
  }

  return {
    shouldCheck,
    maybePrompt,
    forcePrompt,
    addQuestion,
    QUESTIONS
  };
})();