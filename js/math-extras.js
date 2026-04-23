/* ================================================================
   MATH GALAXY — extras: Sprint mode + Word Problems
   Lives alongside math-galaxy.js. Two independent sub-modules that
   render into their own screens (#screen-sprint, #screen-words).

   Storage: augments zs_mathgalaxy_<userkey> with:
     data.sprint = { best: { [table]: { count, accuracy, playedAt } } }
     data.words  = { [tier]: { bestStars, bestPct, plays, lastPlayed } }

   No changes to the existing 10-question flow.
   ================================================================ */

var MathExtras = (function() {
  'use strict';

  // ── Shared storage helpers (mirror math-galaxy.js) ──
  function _key() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_mathgalaxy_') : null;
  }
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

  function _showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  function goHome() { _showScreen('screen-select'); _refreshBestBadges(); }

  function _refreshBestBadges() {
    // Refresh sprint best + words best tags on the select screen.
    var data = _load();
    var sprint = data.sprint || { best: {} };
    var words = data.words || {};

    var sprintEl = document.getElementById('best-sprint');
    if (sprintEl) {
      var bestAny = null;
      Object.keys(sprint.best || {}).forEach(function(k) {
        var b = sprint.best[k];
        if (!bestAny || (b && b.count > bestAny.count)) bestAny = { count: b.count, table: k };
      });
      sprintEl.textContent = bestAny
        ? 'Best: ' + bestAny.count + ' correct (×' + bestAny.table + ')'
        : 'Beat your first time!';
      sprintEl.classList.toggle('empty', !bestAny);
    }

    var wordsEl = document.getElementById('best-words');
    if (wordsEl) {
      var anyWords = Object.keys(words).some(function(t) { return (words[t] && words[t].bestStars > 0); });
      if (anyWords) {
        var total = 0;
        Object.keys(words).forEach(function(t) { total += (words[t].bestStars || 0); });
        wordsEl.textContent = '⭐ ' + total + ' across tiers';
        wordsEl.classList.remove('empty');
      } else {
        wordsEl.textContent = 'Try your first problem!';
        wordsEl.classList.add('empty');
      }
    }
  }

  /* ============================================================
     SPRINT — 60-second times-tables
     ============================================================ */
  var Sprint = (function() {
    var SPRINT_SECONDS = 60;
    var state = null; // { table, correct, wrong, deadline, current, timerId }

    function open() {
      _showScreen('screen-sprint');
      _renderPicker();
    }

    function _renderPicker() {
      var wrap = document.getElementById('sprint-wrap');
      if (!wrap) return;
      var data = _load();
      var best = (data.sprint && data.sprint.best) || {};

      var tables = [2,3,4,5,6,7,8,9,10,11,12];
      var cards = tables.map(function(t) {
        var b = best[t];
        var line = b ? 'Mejor: ' + b.count + ' en ' + SPRINT_SECONDS + 's' : '—';
        return '<button class="sprint-pick" onclick="MathExtras.Sprint.start(' + t + ')">' +
          '<div class="sprint-pick-num">×' + t + '</div>' +
          '<div class="sprint-pick-best">' + line + '</div>' +
        '</button>';
      }).join('');

      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<button class="back-btn" onclick="MathExtras._goHome()" aria-label="Back">←</button>' +
          '<h2>⚡ Sprint de Tablas</h2>' +
          '<p>Responde tantas como puedas en ' + SPRINT_SECONDS + ' segundos.</p>' +
        '</div>' +
        '<div class="sprint-mixed" onclick="MathExtras.Sprint.start(0)" style="cursor:pointer;" role="button">' +
          '<span>🎲</span> Mixed tables (2–12)' +
        '</div>' +
        '<div class="sprint-picker">' + cards + '</div>';
    }

    function _genQuestion(table) {
      var t = table === 0 ? (2 + Math.floor(Math.random() * 11)) : table;
      var n = 1 + Math.floor(Math.random() * 12);
      return { a: t, b: n, answer: t * n };
    }

    function start(table) {
      state = {
        table: table,
        correct: 0,
        wrong: 0,
        current: _genQuestion(table),
        deadline: Date.now() + SPRINT_SECONDS * 1000,
        timerId: null
      };
      _renderPlay();
      state.timerId = setInterval(_tick, 250);
      // Focus the input on next frame
      setTimeout(function() {
        var inp = document.getElementById('sprint-input');
        if (inp) inp.focus();
      }, 80);
    }

    function _tick() {
      if (!state) return;
      var remMs = state.deadline - Date.now();
      if (remMs <= 0) { _finish(); return; }
      var el = document.getElementById('sprint-time');
      if (el) el.textContent = Math.max(0, Math.ceil(remMs / 1000)) + 's';
    }

    function _renderPlay() {
      var wrap = document.getElementById('sprint-wrap');
      if (!wrap || !state) return;
      var q = state.current;
      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<div class="sprint-chip" id="sprint-time">' + SPRINT_SECONDS + 's</div>' +
          '<h2>×' + (state.table || 'Mix') + '</h2>' +
          '<div class="sprint-chip correct">✓ ' + state.correct + '</div>' +
        '</div>' +
        '<div class="sprint-question">' +
          '<div class="sprint-q-text">' + q.a + ' × ' + q.b + ' = ?</div>' +
          '<input type="number" id="sprint-input" class="sprint-input" autocomplete="off" inputmode="numeric" />' +
        '</div>' +
        '<div class="sprint-hint">Presiona Enter para enviar</div>';
      var inp = document.getElementById('sprint-input');
      if (inp) {
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            _submit();
          }
        });
      }
    }

    function _submit() {
      if (!state) return;
      var inp = document.getElementById('sprint-input');
      if (!inp) return;
      var val = parseInt(inp.value, 10);
      if (isNaN(val)) return;
      if (val === state.current.answer) {
        state.correct++;
        if (typeof SFX !== 'undefined' && SFX.tick) SFX.tick();
      } else {
        state.wrong++;
        if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      }
      state.current = _genQuestion(state.table);
      _renderPlay();
      var next = document.getElementById('sprint-input');
      if (next) next.focus();
    }

    function _finish() {
      if (!state) return;
      clearInterval(state.timerId);
      var correct = state.correct, wrong = state.wrong, table = state.table;
      var attempts = correct + wrong;
      var accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

      // Save best
      var data = _load();
      if (!data.sprint) data.sprint = { best: {} };
      var key = String(table);
      var prev = data.sprint.best[key];
      if (!prev || correct > prev.count) {
        data.sprint.best[key] = { count: correct, accuracy: accuracy, playedAt: new Date().toISOString() };
      }
      _save(data);

      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Math Galaxy', '⚡',
          'Sprint ×' + (table || 'Mix') + ' — ' + correct + ' correct / ' + accuracy + '%');
      }

      var wrap = document.getElementById('sprint-wrap');
      var isRecord = !prev || correct > prev.count;
      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<button class="back-btn" onclick="MathExtras.Sprint.open()" aria-label="Back">←</button>' +
          '<h2>' + (isRecord ? '🏆 ¡Nuevo récord!' : '¡Bien hecho!') + '</h2>' +
        '</div>' +
        '<div class="sprint-result">' +
          '<div class="sprint-result-num">' + correct + '</div>' +
          '<div class="sprint-result-label">correctas en ' + SPRINT_SECONDS + 's</div>' +
          '<div class="sprint-result-sub">Precisión: ' + accuracy + '% · Errores: ' + wrong + '</div>' +
          (prev && !isRecord ? '<div class="sprint-result-best">Mejor: ' + prev.count + '</div>' : '') +
        '</div>' +
        '<div class="sprint-actions">' +
          '<button class="action-btn btn-primary" onclick="MathExtras.Sprint.start(' + table + ')">Otra vez 🔁</button>' +
          '<button class="action-btn btn-secondary" onclick="MathExtras.Sprint.open()">Elegir tabla</button>' +
          '<button class="action-btn btn-secondary" onclick="MathExtras._goHome()">🪐 Home</button>' +
        '</div>';
      state = null;
    }

    return { open: open, start: start };
  })();

  /* ============================================================
     WORD PROBLEMS — age-graded bilingual banks
     ============================================================ */
  var Words = (function() {
    // 5 problems per tier for v1. Plain text, no free-form input —
    // we generate plausible distractors and surface them as choices.
    var BANK = {
      cadet: [
        { en: 'Lucía has 3 apples and picks 2 more. How many apples now?', es: 'Lucía tiene 3 manzanas y recoge 2 más. ¿Cuántas tiene?', answer: 5, unit: 'apples', unitEs: 'manzanas' },
        { en: 'A dog has 4 legs. How many legs do 2 dogs have?', es: 'Un perro tiene 4 patas. ¿Cuántas patas tienen 2 perros?', answer: 8, unit: 'legs', unitEs: 'patas' },
        { en: 'You have 10 crayons and lose 3. How many are left?', es: 'Tienes 10 crayones y pierdes 3. ¿Cuántos te quedan?', answer: 7, unit: 'crayons', unitEs: 'crayones' },
        { en: 'There are 6 birds. 2 fly away. How many remain?', es: 'Hay 6 pájaros. 2 se van volando. ¿Cuántos quedan?', answer: 4, unit: 'birds', unitEs: 'pájaros' },
        { en: 'A box has 2 rows of 3 cookies. How many cookies total?', es: 'Una caja tiene 2 filas de 3 galletas. ¿Cuántas galletas?', answer: 6, unit: 'cookies', unitEs: 'galletas' }
      ],
      explorer: [
        { en: 'A bus holds 18 kids. 7 got off at school. How many remain?', es: 'Un bus lleva 18 niños. 7 bajaron en el colegio. ¿Cuántos quedan?', answer: 11, unit: 'kids', unitEs: 'niños' },
        { en: 'Four friends share 20 empanadas equally. How many each?', es: 'Cuatro amigos comparten 20 empanadas. ¿Cuántas cada uno?', answer: 5, unit: 'each', unitEs: 'cada uno' },
        { en: 'A class has 12 boys and 15 girls. How many kids in total?', es: 'Una clase tiene 12 niños y 15 niñas. ¿Cuántos en total?', answer: 27, unit: 'kids', unitEs: 'niños' },
        { en: 'You walk 3 blocks, then 5 more, then back 2. How many blocks from home?', es: 'Caminas 3 cuadras, luego 5 más, y regresas 2. ¿Qué tan lejos de casa?', answer: 6, unit: 'blocks', unitEs: 'cuadras' },
        { en: 'A book has 60 pages. You read 25. How many pages left?', es: 'Un libro tiene 60 páginas. Lees 25. ¿Cuántas faltan?', answer: 35, unit: 'pages', unitEs: 'páginas' }
      ],
      pilot: [
        { en: 'A shirt costs $8,000. You have $20,000. How much change after buying 2 shirts?', es: 'Una polera cuesta $8.000. Tienes $20.000. ¿Cuánto vuelto después de comprar 2 poleras?', answer: 4000, unit: 'CLP', unitEs: 'CLP' },
        { en: 'Pizza has 8 slices. 3 friends eat 2 each. How many slices left?', es: 'Una pizza tiene 8 rebanadas. 3 amigos comen 2 cada uno. ¿Cuántas rebanadas quedan?', answer: 2, unit: 'slices', unitEs: 'rebanadas' },
        { en: 'A train travels 60 km/h for 3 hours. How far did it go?', es: 'Un tren va a 60 km/h durante 3 horas. ¿Qué distancia recorrió?', answer: 180, unit: 'km', unitEs: 'km' },
        { en: '3 × 7 + 2 = ?', es: '3 × 7 + 2 = ?', answer: 23, unit: '', unitEs: '' },
        { en: 'A recipe needs 3/4 cup sugar. You double it. How many cups?', es: 'Una receta usa 3/4 taza de azúcar. La duplicas. ¿Cuántas tazas?', answer: 1.5, unit: 'cups', unitEs: 'tazas' }
      ],
      commander: [
        { en: 'A store marks a $12,000 toy 25% off. What is the sale price?', es: 'Una tienda rebaja un juguete de $12.000 un 25%. ¿Precio final?', answer: 9000, unit: 'CLP', unitEs: 'CLP' },
        { en: 'A rectangle is 6 m by 4 m. Area?', es: 'Un rectángulo mide 6 m por 4 m. ¿Área?', answer: 24, unit: 'm²', unitEs: 'm²' },
        { en: 'Average of 7, 9, 11, 13?', es: 'Promedio de 7, 9, 11, 13?', answer: 10, unit: '', unitEs: '' },
        { en: 'A car uses 8 L per 100 km. How much fuel for 250 km?', es: 'Un auto usa 8 L cada 100 km. ¿Cuántos litros para 250 km?', answer: 20, unit: 'L', unitEs: 'L' },
        { en: '1/2 + 1/3 = ? (as a decimal, rounded to 2 places)', es: '1/2 + 1/3 = ? (decimal con 2 cifras)', answer: 0.83, unit: '', unitEs: '' }
      ]
    };

    var state = null; // { tier, idx, correct, questions }
    var lang = 'es';

    function open() {
      _showScreen('screen-words');
      _renderPicker();
    }

    function _renderPicker() {
      var wrap = document.getElementById('words-wrap');
      if (!wrap) return;
      var data = _load();
      var words = data.words || {};

      var tiers = [
        { id: 'cadet',     emoji: '🛸', label: 'Cadet',     ages: '4–6' },
        { id: 'explorer',  emoji: '🚀', label: 'Explorer',  ages: '6–8' },
        { id: 'pilot',     emoji: '🌟', label: 'Pilot',     ages: '8–10' },
        { id: 'commander', emoji: '👨‍🚀', label: 'Commander', ages: '10+' }
      ];

      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<button class="back-btn" onclick="MathExtras._goHome()" aria-label="Back">←</button>' +
          '<h2>🧠 Problemas con palabras</h2>' +
          '<p>Cinco problemas por nivel. Lee con atención.</p>' +
          '<div class="words-lang" onclick="MathExtras.Words.toggleLang()"><span id="words-lang-label">' +
          (lang === 'es' ? 'ES / EN' : 'EN / ES') + '</span> 🌐</div>' +
        '</div>' +
        '<div class="words-tiers">' +
          tiers.map(function(t) {
            var rec = words[t.id] || { bestStars: 0, plays: 0 };
            var starLine = rec.bestStars > 0
              ? '⭐'.repeat(Math.min(3, rec.bestStars / 5 >> 0)) + ' · ' + rec.bestStars + ' total'
              : '—';
            return '<button class="words-tier" onclick="MathExtras.Words.start(\'' + t.id + '\')">' +
              '<div class="words-tier-icon">' + t.emoji + '</div>' +
              '<div class="words-tier-name">' + t.label + '</div>' +
              '<div class="words-tier-ages">' + t.ages + '</div>' +
              '<div class="words-tier-best">' + starLine + '</div>' +
            '</button>';
          }).join('') +
        '</div>';
    }

    function toggleLang() {
      lang = lang === 'es' ? 'en' : 'es';
      if (state) _renderQuestion(); else _renderPicker();
    }

    function start(tier) {
      var bank = BANK[tier];
      if (!bank) return;
      state = {
        tier: tier,
        idx: 0,
        correct: 0,
        questions: bank.slice() // sequential; keep order stable so sharing a score is meaningful
      };
      _renderQuestion();
    }

    function _distractors(answer) {
      // Deterministic-ish near-misses.
      var set = new Set();
      set.add(answer);
      var candidates = [answer + 1, answer - 1, answer + 2, answer - 2, Math.round(answer * 1.5), Math.round(answer / 2)];
      var out = [];
      for (var i = 0; i < candidates.length && out.length < 3; i++) {
        var c = candidates[i];
        if (c < 0 || set.has(c)) continue;
        out.push(c);
        set.add(c);
      }
      while (out.length < 3) {
        var fill = answer + (out.length + 3);
        if (!set.has(fill)) { out.push(fill); set.add(fill); }
        else break;
      }
      // Shuffle the final [answer, ...out]
      var all = out.concat([answer]);
      all.sort(function() { return Math.random() - 0.5; });
      return all;
    }

    function _renderQuestion() {
      var wrap = document.getElementById('words-wrap');
      if (!wrap || !state) return;
      var q = state.questions[state.idx];
      var text = lang === 'es' ? q.es : q.en;
      var options = _distractors(q.answer);

      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<div class="sprint-chip">' + (state.idx + 1) + ' / ' + state.questions.length + '</div>' +
          '<h2>' + state.tier[0].toUpperCase() + state.tier.slice(1) + '</h2>' +
          '<div class="sprint-chip correct">✓ ' + state.correct + '</div>' +
        '</div>' +
        '<div class="words-q">' + text + '</div>' +
        '<div class="words-options">' +
          options.map(function(o, i) {
            return '<button class="words-opt" onclick="MathExtras.Words._answer(' + o + ')">' +
              String.fromCharCode(65 + i) + '. ' + o +
            '</button>';
          }).join('') +
        '</div>';
    }

    function _answer(val) {
      if (!state) return;
      var q = state.questions[state.idx];
      var right = val === q.answer;
      if (right) {
        state.correct++;
        if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
      } else {
        if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      }
      // Light feedback: flash the button then advance after a beat.
      var wrap = document.getElementById('words-wrap');
      if (wrap) {
        var opts = wrap.querySelectorAll('.words-opt');
        for (var i = 0; i < opts.length; i++) {
          var btn = opts[i];
          btn.disabled = true;
          // Mark right answer and mark the kid's pick
          if (btn.textContent.endsWith(' ' + q.answer)) btn.classList.add('right');
          if (btn.textContent.endsWith(' ' + val) && !right) btn.classList.add('wrong');
        }
      }
      setTimeout(function() {
        state.idx++;
        if (state.idx >= state.questions.length) _finish();
        else _renderQuestion();
      }, 900);
    }

    function _finish() {
      var total = state.questions.length;
      var correct = state.correct;
      var pct = Math.round((correct / total) * 100);
      var stars = correct === total ? 3 : correct >= Math.ceil(total * 0.6) ? 2 : correct > 0 ? 1 : 0;

      var data = _load();
      if (!data.words) data.words = {};
      var prev = data.words[state.tier] || { bestStars: 0, bestPct: 0, plays: 0 };
      data.words[state.tier] = {
        bestStars: Math.max(prev.bestStars, stars),
        bestPct: Math.max(prev.bestPct, pct),
        plays: (prev.plays || 0) + 1,
        lastPlayed: new Date().toISOString()
      };
      _save(data);

      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Math Galaxy', '🧠',
          'Word Problems (' + state.tier + ') — ' + correct + '/' + total + ' · ' + stars + '⭐');
      }

      var wrap = document.getElementById('words-wrap');
      wrap.innerHTML =
        '<div class="sprint-header">' +
          '<button class="back-btn" onclick="MathExtras.Words.open()" aria-label="Back">←</button>' +
          '<h2>' + (stars === 3 ? '🌟 ¡Perfecto!' : '¡Bien!') + '</h2>' +
        '</div>' +
        '<div class="sprint-result">' +
          '<div class="sprint-result-num">' + correct + '/' + total + '</div>' +
          '<div class="sprint-result-label">' + '⭐'.repeat(stars) + ((3 - stars) > 0 ? '☆'.repeat(3 - stars) : '') + '</div>' +
          '<div class="sprint-result-sub">' + pct + '% correcto</div>' +
        '</div>' +
        '<div class="sprint-actions">' +
          '<button class="action-btn btn-primary" onclick="MathExtras.Words.start(\'' + state.tier + '\')">Otra vez 🔁</button>' +
          '<button class="action-btn btn-secondary" onclick="MathExtras.Words.open()">Otros niveles</button>' +
          '<button class="action-btn btn-secondary" onclick="MathExtras._goHome()">🪐 Home</button>' +
        '</div>';
      state = null;
    }

    return { open: open, start: start, toggleLang: toggleLang, _answer: _answer };
  })();

  return {
    Sprint: Sprint,
    Words: Words,
    _goHome: goHome,
    _refreshBestBadges: _refreshBestBadges
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  MathExtras._refreshBestBadges();
});
