/* ================================================================
   DAILY WORD — daily-word.js
   A local-only, Wordle-style daily puzzle. One puzzle per day,
   deterministic from the date so the whole family shares the same
   word. Separate streaks per kid.

   Mounts into the existing guess-quest.html page, using a new
   "screen-daily" screen. Word bank bundled locally — no network.
   Storage key: zs_guess_daily_<username>
   ================================================================ */

var DailyWord = (function() {
  'use strict';

  // Epoch anchor (Mon Jan 1, 2024). Keeps index small and stable.
  var EPOCH = Date.UTC(2024, 0, 1);

  // Curated 5-letter word banks. Age-appropriate. Bilingual.
  // Each bank is independent; a given date picks the same *position*
  // in both banks, but only the active language is revealed.
  var BANK_EN = [
    'APPLE','HOUSE','RIVER','OCEAN','MOUSE','EARTH','HEART','PLANE','STORY','LIGHT',
    'MUSIC','PAPER','CHAIR','TABLE','BEACH','CLOUD','SMILE','DREAM','GRASS','HAPPY',
    'HORSE','SHEEP','TIGER','ZEBRA','BREAD','SUGAR','HONEY','MANGO','PEACH','LEMON',
    'TRAIN','TRUCK','PIANO','DRUMS','PAINT','BRUSH','POINT','QUEEN','KNIGHT','TOWER',
    'CHESS','CARDS','LIONS','BIRDS','FISHY','PLANT','LEAVE','STARS','MOONS','SUNNY'
  ];
  var BANK_ES = [
    'CASAS','PERRO','GATOS','NIDOS','PAPEL','MESAS','SILLA','AGUAS','PLAYA','LIBRO',
    'NUBES','LUNAS','MUNDO','DULCE','FRUTA','RUEDA','PISTA','RISAS','PIANO','SALSA',
    'TANGO','POEMA','VERSO','LETRA','FIRMA','GRADO','ORUGA','GANSO','COSTA','VIAJE',
    'TARDE','NOCHE','CIELO','RAYOS','VACAS','ZORRO','PATIO','BANDA','ARTES','PODIO',
    'CARTA','FLORA','FAUNA','PLATO','PINTA','FUEGO','BALSA','GRITO','CANTO','HOJAS'
  ];
  // Note: ES bank uses words normalised without accents for v1 to
  // keep the on-screen keyboard simple.

  var MAX_GUESSES = 6;
  var WORD_LEN = 5;

  var lang = 'en';
  var state = null;

  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey('zs_guess_daily_')
      : 'zs_guess_daily_default';
  }

  function _load() {
    try {
      var k = _storageKey();
      return k ? (JSON.parse(localStorage.getItem(k)) || {}) : {};
    } catch (e) { return {}; }
  }

  function _save(data) {
    try {
      var k = _storageKey();
      if (k) localStorage.setItem(k, JSON.stringify(data));
    } catch (e) {}
  }

  function _dayIndex() {
    var now = new Date();
    var utc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.floor((utc - EPOCH) / (24 * 60 * 60 * 1000)));
  }

  function _todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _solution() {
    var bank = lang === 'es' ? BANK_ES : BANK_EN;
    return bank[_dayIndex() % bank.length].toUpperCase();
  }

  function _loadOrInitState() {
    var data = _load();
    var today = _todayKey();
    if (!data.days) data.days = {};
    var day = data.days[today];
    if (!day || day.lang !== lang) {
      day = {
        lang: lang,
        solution: _solution(),
        guesses: [],
        won: null,
        finishedAt: null
      };
      data.days[today] = day;
      _save(data);
    }
    state = { data: data, today: today, day: day };
  }

  // ── Rendering ──

  function _renderBoard() {
    var boardEl = document.getElementById('dw-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    var cur = state.day.guesses || [];
    for (var r = 0; r < MAX_GUESSES; r++) {
      var row = document.createElement('div');
      row.className = 'dw-row';
      var guess = cur[r] || '';
      var isCurrent = (r === cur.length && state.day.won == null);
      var currentInput = isCurrent ? (document.getElementById('dw-current-input') || {}).value || '' : '';
      for (var c = 0; c < WORD_LEN; c++) {
        var tile = document.createElement('div');
        tile.className = 'dw-tile';
        if (guess) {
          var letter = guess[c] || '';
          tile.textContent = letter;
          var color = _tileColor(letter, c, state.day.solution, guess);
          tile.classList.add('filled', color);
        } else if (isCurrent && currentInput[c]) {
          tile.textContent = currentInput[c];
          tile.classList.add('typing');
        }
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function _tileColor(letter, index, solution, guess) {
    if (!letter) return '';
    if (solution[index] === letter) return 'correct';
    if (solution.indexOf(letter) === -1) return 'absent';
    // "present" but need to account for duplicates in the guess/solution.
    var countInSolution = 0;
    for (var i = 0; i < solution.length; i++) if (solution[i] === letter) countInSolution++;
    var matchedByCorrect = 0;
    var earlierPresent = 0;
    for (var j = 0; j < guess.length; j++) {
      if (guess[j] === letter) {
        if (solution[j] === letter) matchedByCorrect++;
        else if (j < index) earlierPresent++;
      }
    }
    if (matchedByCorrect + earlierPresent < countInSolution) return 'present';
    return 'absent';
  }

  function _renderKeyboard() {
    var kbEl = document.getElementById('dw-keyboard');
    if (!kbEl) return;
    var rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L','Ñ'],
      ['ENTER','Z','X','C','V','B','N','M','DEL']
    ];
    // Derive per-letter state from past guesses
    var keyState = {};
    (state.day.guesses || []).forEach(function(g) {
      for (var i = 0; i < g.length; i++) {
        var L = g[i];
        var col = _tileColor(L, i, state.day.solution, g);
        // Priority: correct > present > absent
        var cur = keyState[L];
        if (col === 'correct' || (col === 'present' && cur !== 'correct') || (!cur && col === 'absent')) {
          keyState[L] = col;
        }
      }
    });

    var html = '';
    rows.forEach(function(row) {
      html += '<div class="dw-kb-row">';
      row.forEach(function(k) {
        var cls = 'dw-key';
        if (keyState[k]) cls += ' ' + keyState[k];
        if (k === 'ENTER' || k === 'DEL') cls += ' wide';
        var label = k === 'DEL' ? '⌫' : k;
        html += '<button class="' + cls + '" data-key="' + k + '">' + label + '</button>';
      });
      html += '</div>';
    });
    kbEl.innerHTML = html;

    // Wire clicks
    kbEl.querySelectorAll('.dw-key').forEach(function(btn) {
      btn.addEventListener('click', function() { _handleKey(btn.dataset.key); });
    });
  }

  function _renderStatus() {
    var sEl = document.getElementById('dw-status');
    if (!sEl) return;
    var data = state.data;
    var streak = data.streak || 0;
    var maxStreak = data.maxStreak || 0;
    var played = data.played || 0;
    var won = data.won || 0;
    var winPct = played > 0 ? Math.round((won / played) * 100) : 0;

    var today = state.day;
    var line = '';
    if (today.won === true) {
      line = lang === 'es'
        ? '¡Lo resolviste en ' + today.guesses.length + '! Vuelve mañana.'
        : 'Solved in ' + today.guesses.length + '! Come back tomorrow.';
    } else if (today.won === false) {
      line = (lang === 'es'
        ? 'La palabra era '
        : 'The word was ') + today.solution + '.';
    } else {
      line = lang === 'es'
        ? 'Adivina la palabra de hoy en 6 intentos.'
        : 'Guess today\'s word in 6 tries.';
    }

    sEl.innerHTML =
      '<div class="dw-status-line">' + line + '</div>' +
      '<div class="dw-stats">' +
        '<div class="dw-stat"><div class="dw-stat-num">' + played + '</div><div class="dw-stat-lbl">' + (lang === 'es' ? 'Jugadas' : 'Played') + '</div></div>' +
        '<div class="dw-stat"><div class="dw-stat-num">' + winPct + '%</div><div class="dw-stat-lbl">' + (lang === 'es' ? 'Ganadas' : 'Win %') + '</div></div>' +
        '<div class="dw-stat"><div class="dw-stat-num">' + streak + '</div><div class="dw-stat-lbl">' + (lang === 'es' ? 'Racha' : 'Streak') + '</div></div>' +
        '<div class="dw-stat"><div class="dw-stat-num">' + maxStreak + '</div><div class="dw-stat-lbl">' + (lang === 'es' ? 'Mejor' : 'Best') + '</div></div>' +
      '</div>';
  }

  function _renderAll() {
    _renderBoard();
    _renderKeyboard();
    _renderStatus();
    var hint = document.getElementById('dw-title-lang');
    if (hint) hint.textContent = lang === 'es' ? 'ES' : 'EN';
  }

  // ── Input ──

  function _getCurrentBuffer() {
    var inp = document.getElementById('dw-current-input');
    return inp ? inp.value : '';
  }

  function _setCurrentBuffer(v) {
    var inp = document.getElementById('dw-current-input');
    if (inp) inp.value = v;
    _renderBoard();
  }

  function _handleKey(key) {
    if (!state || state.day.won !== null) return;
    if (key === 'ENTER') { _submitGuess(); return; }
    if (key === 'DEL') {
      var cur = _getCurrentBuffer();
      _setCurrentBuffer(cur.slice(0, -1));
      return;
    }
    if (/^[A-ZÑ]$/.test(key)) {
      var buf = _getCurrentBuffer();
      if (buf.length < WORD_LEN) _setCurrentBuffer(buf + key);
    }
  }

  function _submitGuess() {
    var buf = _getCurrentBuffer();
    if (buf.length < WORD_LEN) {
      _flashMessage(lang === 'es' ? 'Muy corto' : 'Too short');
      return;
    }
    state.day.guesses.push(buf);
    _setCurrentBuffer('');

    var won = buf === state.day.solution;
    var finished = won || state.day.guesses.length >= MAX_GUESSES;
    if (finished) {
      state.day.won = won;
      state.day.finishedAt = Date.now();
      var d = state.data;
      d.played = (d.played || 0) + 1;
      if (won) {
        d.won = (d.won || 0) + 1;
        d.streak = (d.streak || 0) + 1;
        d.maxStreak = Math.max(d.maxStreak || 0, d.streak);
      } else {
        d.streak = 0;
      }
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Guess Quest', '🎯',
          (won ? 'Solved Daily Word' : 'Missed Daily Word') +
          ' (' + state.day.guesses.length + '/' + MAX_GUESSES + ')');
      }
    }
    _save(state.data);
    _renderAll();
  }

  function _flashMessage(msg) {
    var el = document.getElementById('dw-flash');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_flashMessage._t);
    _flashMessage._t = setTimeout(function() { el.classList.remove('show'); }, 1200);
  }

  // ── Share ──

  function share() {
    if (!state || state.day.won === null) return;
    var emojiRows = state.day.guesses.map(function(g) {
      var row = '';
      for (var i = 0; i < g.length; i++) {
        var col = _tileColor(g[i], i, state.day.solution, g);
        row += col === 'correct' ? '🟩' : col === 'present' ? '🟨' : '⬛';
      }
      return row;
    }).join('\n');

    var title = 'Palabra del Día ' + (lang === 'es' ? '(ES)' : '(EN)') + ' — ' + state.today;
    var score = state.day.won ? (state.day.guesses.length + '/6') : 'X/6';
    var text = title + '\n' + score + '\n\n' + emojiRows;

    if (navigator.share) {
      navigator.share({ title: title, text: text }).catch(function() {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        _flashMessage(lang === 'es' ? 'Copiado' : 'Copied');
      });
    }
  }

  // ── Public API ──

  function open(options) {
    lang = (options && options.lang) || lang;
    _loadOrInitState();
    _ensureScreen();
    _renderAll();
    _showScreen();
  }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    _loadOrInitState();
    _renderAll();
  }

  function _ensureScreen() {
    if (document.getElementById('screen-daily')) return;
    var app = document.querySelector('.app');
    if (!app) return;
    var screen = document.createElement('div');
    screen.className = 'screen';
    screen.id = 'screen-daily';
    screen.innerHTML =
      '<div class="gq-header">' +
        '<button class="back-btn" aria-label="Back" onclick="GuessQuest.backToSelect()">←</button>' +
        '<h2>🌟 <span>' + (lang === 'es' ? 'Palabra del Día' : 'Daily Word') + '</span> <small id="dw-title-lang" style="font-size:0.7em;opacity:0.6;">EN</small></h2>' +
        '<button class="lang-toggle" onclick="DailyWord.toggleLanguage()" style="margin-left:auto;">🌐</button>' +
      '</div>' +
      '<div id="dw-status" class="dw-status"></div>' +
      '<div id="dw-board" class="dw-board"></div>' +
      '<input type="text" id="dw-current-input" autocomplete="off" autocapitalize="characters" inputmode="none" aria-hidden="true" tabindex="-1" style="position:absolute;left:-9999px;" />' +
      '<div id="dw-flash" class="dw-flash"></div>' +
      '<div id="dw-keyboard" class="dw-keyboard"></div>' +
      '<div class="dw-actions">' +
        '<button class="action-btn btn-secondary" onclick="DailyWord.share()">📤 ' + (lang === 'es' ? 'Compartir' : 'Share') + '</button>' +
      '</div>';
    app.appendChild(screen);

    // Physical keyboard
    document.addEventListener('keydown', function(e) {
      if (!document.getElementById('screen-daily') || !document.getElementById('screen-daily').classList.contains('active')) return;
      if (e.key === 'Enter') { e.preventDefault(); _handleKey('ENTER'); return; }
      if (e.key === 'Backspace') { e.preventDefault(); _handleKey('DEL'); return; }
      var k = e.key.toUpperCase();
      if (/^[A-ZÑ]$/.test(k)) { e.preventDefault(); _handleKey(k); }
    });
  }

  function _showScreen() {
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    var el = document.getElementById('screen-daily');
    if (el) el.classList.add('active');
  }

  return {
    open: open,
    toggleLanguage: toggleLanguage,
    share: share
  };
})();
