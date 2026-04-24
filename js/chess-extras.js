/* ================================================================
   CHESS QUEST — extras: Puzzle Rush + Openings Primer
   Lives alongside chess-quest.js. Reuses the existing renderBoard,
   PUZZLES array, and related globals that module exposes.

   Storage: augments zs_chess_<userkey> with
     data.rushBest = { score, playedAt }
     data.openings = { [id]: { viewed, completedAt } }

   No changes to the existing Learn / Puzzles / Play flow.
   ================================================================ */

(function() {
  'use strict';
  if (typeof window === 'undefined') return;

  // ── Storage helpers (mirror chess-quest.js) ──
  function _key() { return typeof getUserKey === 'function' ? getUserKey() : null; }
  function _load() {
    var k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; }
  }
  function _save(data) {
    var k = _key();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ============================================================
     PUZZLE RUSH — tactics trainer with timer and strikes
     ============================================================ */
  var Rush = (function() {
    var RUSH_SECONDS = 180;   // 3-minute rush
    var MAX_STRIKES = 3;

    var state = null; // { board, idx, pool, score, strikes, deadline, timerId, selected, solved }

    function open() {
      if (typeof showScreen !== 'function') return;
      showScreen('puzzle-rush');
      _renderIntro();
    }

    function _renderIntro() {
      var wrap = document.getElementById('rush-wrap');
      if (!wrap) return;
      var data = _load();
      var best = (data.rushBest && data.rushBest.score) || 0;
      wrap.innerHTML =
        '<div class="rush-intro">' +
          '<div class="rush-big">⚡</div>' +
          '<h2>Puzzle Rush</h2>' +
          '<p>Resuelve tantos como puedas en ' + (RUSH_SECONDS / 60) + ' minutos. ' +
             '3 errores y se acaba.</p>' +
          (best > 0 ? '<div class="rush-best">🏆 Mejor: ' + best + '</div>' : '') +
          '<div class="rush-actions">' +
            '<button class="btn-gold" onclick="ChessExtras.Rush.start()">▶ Empezar</button>' +
            '<button class="btn-outline" onclick="goMenu()">Volver</button>' +
          '</div>' +
        '</div>';
    }

    function start() {
      if (typeof PUZZLES === 'undefined' || !Array.isArray(PUZZLES)) return;
      // Build a shuffled pool; repeat when exhausted for long sessions.
      var pool = PUZZLES.slice().sort(function() { return Math.random() - 0.5; });
      state = {
        pool: pool,
        idx: 0,
        score: 0,
        strikes: 0,
        selected: null,
        solved: false,
        deadline: Date.now() + RUSH_SECONDS * 1000,
        timerId: null,
        board: null
      };
      _renderPlay();
      state.timerId = setInterval(_tick, 250);
      _loadCurrent();
    }

    function _tick() {
      if (!state) return;
      var remMs = state.deadline - Date.now();
      if (remMs <= 0) { _finish('time'); return; }
      var el = document.getElementById('rush-timer');
      if (el) el.textContent = Math.max(0, Math.ceil(remMs / 1000)) + 's';
    }

    function _renderPlay() {
      var wrap = document.getElementById('rush-wrap');
      if (!wrap) return;
      wrap.innerHTML =
        '<div class="rush-top">' +
          '<div class="rush-chip" id="rush-timer">' + RUSH_SECONDS + 's</div>' +
          '<div class="rush-chip rush-score" id="rush-score">✓ 0</div>' +
          '<div class="rush-chip rush-strikes" id="rush-strikes">❤️❤️❤️</div>' +
        '</div>' +
        '<div class="board-wrap"><div class="board" id="rushBoard"></div></div>' +
        '<div class="board-labels"><span>a</span><span>b</span><span>c</span><span>d</span><span>e</span><span>f</span><span>g</span><span>h</span></div>' +
        '<div class="rush-hint" id="rush-hint"></div>' +
        '<div class="rush-feedback" id="rush-feedback"></div>';
    }

    function _loadCurrent() {
      if (!state || typeof newBoard !== 'function' || typeof renderBoard !== 'function') return;
      var pz = state.pool[state.idx % state.pool.length];
      state.board = Array(8).fill(null).map(function() { return Array(8).fill(null); });
      pz.board(state.board);
      state.selected = null;
      state.solved = false;

      var hintEl = document.getElementById('rush-hint');
      if (hintEl) hintEl.textContent = pz.hint || 'Encuentra la mejor jugada';
      _renderBoard();
    }

    function _renderBoard() {
      if (!state) return;
      var el = document.getElementById('rushBoard');
      if (!el) return;
      var sel = state.selected;
      var dots = [], caps = [];
      if (sel && typeof getMoves === 'function') {
        var moves = getMoves(state.board, sel[0], sel[1]);
        moves.forEach(function(m) {
          var target = state.board[m.tr][m.tc];
          (target ? caps : dots).push([m.tr, m.tc]);
        });
      }
      renderBoard(el, state.board, {
        selected: sel,
        moveDots: dots,
        captureDots: caps,
        onClick: _onSquareClick
      });
    }

    function _onSquareClick(r, c) {
      if (!state || state.solved) return;
      var sq = state.board[r][c];
      var pz = state.pool[state.idx % state.pool.length];

      if (state.selected) {
        var fr = state.selected[0], fc = state.selected[1];
        // Only allow moving the piece at fr,fc
        var piece = state.board[fr][fc];
        if (!piece) { state.selected = null; _renderBoard(); return; }

        var moves = typeof getMoves === 'function' ? getMoves(state.board, fr, fc) : [];
        var legal = moves.some(function(m) { return m.tr === r && m.tc === c; });
        if (!legal) {
          // Re-select if tapping another of our pieces
          if (sq && sq.color === piece.color) {
            state.selected = [r, c];
            _renderBoard();
          } else {
            state.selected = null;
            _renderBoard();
          }
          return;
        }

        // Evaluate: did we play the puzzle's solution?
        var correct = pz.solution &&
          pz.solution.fr === fr && pz.solution.fc === fc &&
          pz.solution.tr === r && pz.solution.tc === c;

        if (correct) {
          state.score++;
          _setFeedback('✅', 'correct');
          if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
        } else {
          state.strikes++;
          _setFeedback('✖', 'wrong');
          if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
        }

        state.solved = true;
        _updateChips();

        setTimeout(function() {
          if (!state) return;
          if (state.strikes >= MAX_STRIKES) { _finish('strikes'); return; }
          state.idx++;
          _loadCurrent();
        }, 650);
      } else if (sq && sq.color === 'w') {
        state.selected = [r, c];
        _renderBoard();
      }
    }

    function _setFeedback(emoji, cls) {
      var el = document.getElementById('rush-feedback');
      if (!el) return;
      el.className = 'rush-feedback ' + (cls || '');
      el.textContent = emoji;
      setTimeout(function() {
        if (el && el.className.indexOf(cls) !== -1) el.textContent = '';
      }, 600);
    }

    function _updateChips() {
      var se = document.getElementById('rush-score');
      if (se) se.textContent = '✓ ' + state.score;
      var st = document.getElementById('rush-strikes');
      if (st) {
        var rem = Math.max(0, MAX_STRIKES - state.strikes);
        st.textContent = '❤️'.repeat(rem) + '🖤'.repeat(MAX_STRIKES - rem);
      }
    }

    function _finish(reason) {
      if (!state) return;
      clearInterval(state.timerId);
      var score = state.score;
      var data = _load();
      var prev = (data.rushBest && data.rushBest.score) || 0;
      var isRecord = score > prev;
      if (isRecord) {
        data.rushBest = { score: score, playedAt: new Date().toISOString() };
        _save(data);
      }
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Chess Quest', '⚡',
          'Puzzle Rush — ' + score + ' solved (' + (reason === 'time' ? 'time up' : 'strikes') + ')');
      }

      var wrap = document.getElementById('rush-wrap');
      if (!wrap) return;
      wrap.innerHTML =
        '<div class="rush-intro">' +
          '<div class="rush-big">' + (isRecord ? '🏆' : '⚡') + '</div>' +
          '<h2>' + (isRecord ? '¡Nuevo récord!' : '¡Buen intento!') + '</h2>' +
          '<div class="rush-result-num">' + score + '</div>' +
          '<div class="rush-result-sub">puzzles resueltos</div>' +
          (prev > 0 && !isRecord ? '<div class="rush-best">Mejor: ' + prev + '</div>' : '') +
          '<div class="rush-actions">' +
            '<button class="btn-gold" onclick="ChessExtras.Rush.start()">↻ Otra vez</button>' +
            '<button class="btn-outline" onclick="goMenu()">Volver</button>' +
          '</div>' +
        '</div>';
      state = null;
    }

    return { open: open, start: start };
  })();

  /* ============================================================
     OPENINGS PRIMER — hand-authored flashcards
     Text-only for v1: name, first 5 moves (SAN), "why" per move.
     Keeps the PR tight; interactive board is a follow-up.
     ============================================================ */
  var Openings = (function() {
    var OPENINGS = [
      {
        id: 'italian',
        name: 'Italian Game',
        emoji: '🇮🇹',
        era: 'Classical · played since the 1500s',
        idea: 'Develop the knight and bishop quickly. Aim at f7 — the weakest square near Black\'s king.',
        moves: [
          { san: '1. e4', note: 'Control the centre. Opens lines for the bishop and queen.' },
          { san: '1... e5', note: 'Black mirrors the claim in the centre.' },
          { san: '2. Nf3', note: 'Attacks e5 and develops a piece toward the king side.' },
          { san: '2... Nc6', note: 'Defends e5 while developing naturally.' },
          { san: '3. Bc4', note: 'Bishop points at f7, the square only defended by Black\'s king.' }
        ]
      },
      {
        id: 'ruy_lopez',
        name: 'Ruy Lopez',
        emoji: '♗',
        era: 'Named after a Spanish priest, 1561',
        idea: 'Pressure Black\'s c6 knight. Every attack on that knight is an attack on the e5 pawn it defends.',
        moves: [
          { san: '1. e4', note: 'Centre first.' },
          { san: '1... e5', note: 'Classical reply.' },
          { san: '2. Nf3', note: 'Attacks e5.' },
          { san: '2... Nc6', note: 'Defends.' },
          { san: '3. Bb5', note: 'Pins and pressures the knight that defends e5 — the signature move.' }
        ]
      },
      {
        id: 'queens_gambit',
        name: "Queen's Gambit",
        emoji: '♕',
        era: 'A cornerstone of top-level chess for 150+ years',
        idea: 'Offer the c-pawn so that if Black captures, White can build a huge centre.',
        moves: [
          { san: '1. d4', note: 'Claim the centre on the queen side.' },
          { san: '1... d5', note: 'Black matches the claim.' },
          { san: '2. c4', note: 'The gambit! If Black takes, White gets a strong centre.' },
          { san: '2... e6', note: 'One common answer: decline the pawn, prepare …Nf6.' },
          { san: '3. Nc3', note: 'Develop and put extra pressure on d5.' }
        ]
      },
      {
        id: 'sicilian',
        name: 'Sicilian Defence',
        emoji: '🌊',
        era: 'Most popular response to 1.e4 at all levels',
        idea: 'Black refuses symmetry. Trading a flank pawn for a centre pawn gives Black dynamic play.',
        moves: [
          { san: '1. e4', note: 'White takes the centre.' },
          { san: '1... c5', note: 'Black challenges d4 from the side — the Sicilian!' },
          { san: '2. Nf3', note: 'Prepares d4.' },
          { san: '2... d6', note: 'Supports an eventual …Nf6 without fearing e5.' },
          { san: '3. d4', note: 'Opens the centre; Black will capture and accept an open game.' }
        ]
      },
      {
        id: 'french',
        name: 'French Defence',
        emoji: '🥖',
        era: 'Solid and positional. A favourite of careful players.',
        idea: 'Black plans …d5 to contest White\'s e4 from a closed, slow game.',
        moves: [
          { san: '1. e4', note: 'White centre.' },
          { san: '1... e6', note: 'Prepares …d5 without exchanging yet.' },
          { san: '2. d4', note: 'White builds a big centre.' },
          { san: '2... d5', note: 'Now Black challenges e4 safely.' },
          { san: '3. Nc3', note: 'One of several classical paths — protects e4 and prepares to develop.' }
        ]
      },
      {
        id: 'kings_indian',
        name: "King's Indian Defence",
        emoji: '🐘',
        era: 'Favoured by Kasparov and Fischer',
        idea: 'Black lets White build a big centre, then attacks it later with pawn breaks and piece play.',
        moves: [
          { san: '1. d4', note: 'White centre move.' },
          { san: '1... Nf6', note: 'Develop and wait.' },
          { san: '2. c4', note: 'White expands.' },
          { san: '2... g6', note: 'Plan: fianchetto the bishop on g7.' },
          { san: '3. Nc3', note: 'Typical development; sets up a full centre to challenge later.' }
        ]
      }
    ];

    var state = null; // { idx, move }

    function open() {
      if (typeof showScreen !== 'function') return;
      showScreen('openings');
      _renderMenu();
    }

    function _renderMenu() {
      var wrap = document.getElementById('openings-wrap');
      if (!wrap) return;
      var data = _load();
      var progress = data.openings || {};
      var cards = OPENINGS.map(function(o, i) {
        var done = progress[o.id] && progress[o.id].viewed ? '✅' : '';
        return '<button class="op-card" onclick="ChessExtras.Openings._start(' + i + ')">' +
          '<span class="op-emoji">' + o.emoji + '</span>' +
          '<div class="op-name">' + _esc(o.name) + ' ' + done + '</div>' +
          '<div class="op-era">' + _esc(o.era) + '</div>' +
        '</button>';
      }).join('');

      wrap.innerHTML =
        '<div class="learn-header">' +
          '<button class="back-btn" aria-label="Back" onclick="goMenu()">←</button>' +
          '<div class="learn-title">Openings Primer</div>' +
        '</div>' +
        '<p style="text-align:center;color:var(--text-muted);font-weight:700;font-size:0.85rem;margin:8px 0 14px;">Seis aperturas clásicas. Pulsa una para conocer las primeras jugadas.</p>' +
        '<div class="op-grid">' + cards + '</div>';
    }

    function _start(idx) {
      state = { idx: idx, move: 0 };
      _renderCard();
    }

    function _renderCard() {
      if (!state) return;
      var o = OPENINGS[state.idx];
      var wrap = document.getElementById('openings-wrap');
      if (!wrap || !o) return;
      var total = o.moves.length;
      var m = o.moves[state.move];

      wrap.innerHTML =
        '<div class="learn-header">' +
          '<button class="back-btn" aria-label="Back" onclick="ChessExtras.Openings._back()">←</button>' +
          '<div class="learn-title">' + o.emoji + ' ' + _esc(o.name) + '</div>' +
        '</div>' +
        '<div class="op-card-view">' +
          '<div class="op-idea">💡 ' + _esc(o.idea) + '</div>' +
          '<div class="op-step-badge">' + (state.move + 1) + ' / ' + total + '</div>' +
          '<div class="op-move">' + _esc(m.san) + '</div>' +
          '<div class="op-note">' + _esc(m.note) + '</div>' +
          '<div class="op-nav">' +
            (state.move > 0 ? '<button class="btn-outline" onclick="ChessExtras.Openings._prev()">← Anterior</button>' : '<span></span>') +
            (state.move < total - 1
              ? '<button class="btn-gold" onclick="ChessExtras.Openings._next()">Siguiente →</button>'
              : '<button class="btn-gold" onclick="ChessExtras.Openings._finish()">Terminar ✓</button>') +
          '</div>' +
        '</div>';
    }

    function _next() { if (state) { state.move++; _renderCard(); } }
    function _prev() { if (state) { state.move--; _renderCard(); } }
    function _back() { _renderMenu(); state = null; }

    function _finish() {
      if (!state) return;
      var o = OPENINGS[state.idx];
      var data = _load();
      if (!data.openings) data.openings = {};
      data.openings[o.id] = { viewed: true, completedAt: new Date().toISOString() };
      _save(data);
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Chess Quest', '📖', 'Studied opening: ' + o.name);
      }
      state = null;
      _renderMenu();
    }

    return {
      open: open,
      _start: _start,
      _next: _next,
      _prev: _prev,
      _back: _back,
      _finish: _finish
    };
  })();

  window.ChessExtras = { Rush: Rush, Openings: Openings };
})();
