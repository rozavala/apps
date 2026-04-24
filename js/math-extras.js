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
    // 20 problems per tier. Each session draws a random 5 so kids get
    // variety across plays without the bank ever feeling exhausted.
    // Chilean context used where natural (pesos, empanadas, regions).
    var BANK = {
      cadet: [
        { en: 'Lucía has 3 apples and picks 2 more. How many apples now?', es: 'Lucía tiene 3 manzanas y recoge 2 más. ¿Cuántas tiene?', answer: 5 },
        { en: 'A dog has 4 legs. How many legs do 2 dogs have?', es: 'Un perro tiene 4 patas. ¿Cuántas patas tienen 2 perros?', answer: 8 },
        { en: 'You have 10 crayons and lose 3. How many are left?', es: 'Tienes 10 crayones y pierdes 3. ¿Cuántos te quedan?', answer: 7 },
        { en: 'There are 6 birds. 2 fly away. How many remain?', es: 'Hay 6 pájaros. 2 se van volando. ¿Cuántos quedan?', answer: 4 },
        { en: 'A box has 2 rows of 3 cookies. How many cookies total?', es: 'Una caja tiene 2 filas de 3 galletas. ¿Cuántas galletas?', answer: 6 },
        { en: 'You count 5 ducks. 4 more arrive. How many ducks?', es: 'Cuentas 5 patos. Llegan 4 más. ¿Cuántos patos?', answer: 9 },
        { en: 'A plate has 8 sopaipillas. You eat 3. How many are left?', es: 'Un plato tiene 8 sopaipillas. Te comes 3. ¿Cuántas quedan?', answer: 5 },
        { en: 'A ladybug has 2 wings. How many wings do 5 ladybugs have?', es: 'Una mariquita tiene 2 alas. ¿Cuántas alas tienen 5 mariquitas?', answer: 10 },
        { en: 'You see 4 stars, then 3 more. How many stars altogether?', es: 'Ves 4 estrellas, luego 3 más. ¿Cuántas en total?', answer: 7 },
        { en: 'A week has how many days?', es: '¿Cuántos días tiene una semana?', answer: 7 },
        { en: 'How many corners does a triangle have?', es: '¿Cuántas esquinas tiene un triángulo?', answer: 3 },
        { en: 'How many sides does a square have?', es: '¿Cuántos lados tiene un cuadrado?', answer: 4 },
        { en: '2 red balloons + 3 blue balloons = ? balloons', es: '2 globos rojos + 3 globos azules = ? globos', answer: 5 },
        { en: 'Mateo eats 2 empanadas, Ana eats 2. How many together?', es: 'Mateo come 2 empanadas y Ana come 2. ¿Cuántas juntos?', answer: 4 },
        { en: 'A cat family has 1 mother and 4 kittens. How many cats?', es: 'Una familia de gatos: 1 mamá y 4 gatitos. ¿Cuántos gatos?', answer: 5 },
        { en: 'You have 9 stickers and give away 5. How many left?', es: 'Tienes 9 stickers y regalas 5. ¿Cuántos te quedan?', answer: 4 },
        { en: 'How many fingers on two hands?', es: '¿Cuántos dedos hay en dos manos?', answer: 10 },
        { en: 'A basket has 7 lemons. You add 2 more. How many?', es: 'Una canasta tiene 7 limones. Agregas 2 más. ¿Cuántos hay?', answer: 9 },
        { en: 'A bike has 2 wheels. How many wheels on 3 bikes?', es: 'Una bici tiene 2 ruedas. ¿Cuántas ruedas tienen 3 bicis?', answer: 6 },
        { en: 'There are 10 ants. 4 leave. How many ants stay?', es: 'Hay 10 hormigas. Se van 4. ¿Cuántas quedan?', answer: 6 }
      ],
      explorer: [
        { en: 'A bus holds 18 kids. 7 got off at school. How many remain?', es: 'Un bus lleva 18 niños. 7 bajaron en el colegio. ¿Cuántos quedan?', answer: 11 },
        { en: 'Four friends share 20 empanadas equally. How many each?', es: 'Cuatro amigos comparten 20 empanadas. ¿Cuántas cada uno?', answer: 5 },
        { en: 'A class has 12 boys and 15 girls. How many kids in total?', es: 'Una clase tiene 12 niños y 15 niñas. ¿Cuántos en total?', answer: 27 },
        { en: 'You walk 3 blocks, then 5 more, then back 2. How many blocks from home?', es: 'Caminas 3 cuadras, luego 5 más, y regresas 2. ¿Qué tan lejos de casa?', answer: 6 },
        { en: 'A book has 60 pages. You read 25. How many pages left?', es: 'Un libro tiene 60 páginas. Lees 25. ¿Cuántas faltan?', answer: 35 },
        { en: 'A pack has 24 crayons. You buy 2 packs. How many crayons?', es: 'Una caja tiene 24 crayones. Compras 2 cajas. ¿Cuántos crayones?', answer: 48 },
        { en: 'Juan is 9. His sister is 3 years younger. How old is she?', es: 'Juan tiene 9. Su hermana es 3 años menor. ¿Cuántos años tiene ella?', answer: 6 },
        { en: 'A cookie jar has 30 cookies. You eat 2 a day for 5 days. How many left?', es: 'Un tarro tiene 30 galletas. Comes 2 al día por 5 días. ¿Cuántas quedan?', answer: 20 },
        { en: 'A train leaves with 45 people. 12 get off. How many stay?', es: 'Un tren sale con 45 personas. Bajan 12. ¿Cuántos quedan?', answer: 33 },
        { en: 'Clara saves $500 each week. How much after 4 weeks?', es: 'Clara ahorra $500 cada semana. ¿Cuánto tiene después de 4 semanas?', answer: 2000 },
        { en: 'A soccer team has 11 players. Two teams play. How many total?', es: 'Un equipo de fútbol tiene 11 jugadores. Juegan 2 equipos. ¿Cuántos en total?', answer: 22 },
        { en: 'A pizza is cut into 8 slices. 3 friends eat 2 each. How many slices left?', es: 'Una pizza tiene 8 rebanadas. 3 amigos comen 2 cada uno. ¿Cuántas rebanadas quedan?', answer: 2 },
        { en: 'You have 3 groups of 6 marbles. How many marbles?', es: 'Tienes 3 grupos de 6 bolitas. ¿Cuántas bolitas hay?', answer: 18 },
        { en: 'A year has 12 months. Half a year has how many?', es: 'Un año tiene 12 meses. Medio año ¿cuántos?', answer: 6 },
        { en: 'A box holds 9 manzanas. You have 3 boxes. Total?', es: 'Una caja tiene 9 manzanas. Tienes 3 cajas. ¿Total?', answer: 27 },
        { en: 'You pay $800 and get $200 back. What did it cost?', es: 'Pagas $800 y te devuelven $200. ¿Cuánto costó?', answer: 600 },
        { en: 'A baker makes 40 breads in the morning and 35 in the evening. Total?', es: 'Un panadero hace 40 panes en la mañana y 35 en la tarde. ¿Total?', answer: 75 },
        { en: 'How many days are in 2 weeks?', es: '¿Cuántos días hay en 2 semanas?', answer: 14 },
        { en: 'Six friends each catch 3 fish. How many fish together?', es: 'Seis amigos pescan 3 peces cada uno. ¿Cuántos peces juntos?', answer: 18 },
        { en: 'A classroom has 5 rows of 6 desks. How many desks?', es: 'Una sala tiene 5 filas de 6 pupitres. ¿Cuántos pupitres?', answer: 30 }
      ],
      pilot: [
        { en: 'A shirt costs $8,000. You have $20,000. How much change after buying 2 shirts?', es: 'Una polera cuesta $8.000. Tienes $20.000. ¿Cuánto vuelto después de comprar 2 poleras?', answer: 4000 },
        { en: 'Pizza has 8 slices. 3 friends eat 2 each. How many slices left?', es: 'Una pizza tiene 8 rebanadas. 3 amigos comen 2 cada uno. ¿Cuántas rebanadas quedan?', answer: 2 },
        { en: 'A train travels 60 km/h for 3 hours. How far did it go?', es: 'Un tren va a 60 km/h durante 3 horas. ¿Qué distancia recorrió?', answer: 180 },
        { en: '3 × 7 + 2 = ?', es: '3 × 7 + 2 = ?', answer: 23 },
        { en: 'A recipe needs 3/4 cup sugar. You double it. How many cups?', es: 'Una receta usa 3/4 taza de azúcar. La duplicas. ¿Cuántas tazas?', answer: 1.5 },
        { en: '8 × 9 = ?', es: '8 × 9 = ?', answer: 72 },
        { en: '144 ÷ 12 = ?', es: '144 ÷ 12 = ?', answer: 12 },
        { en: 'A movie is 120 minutes long. How many hours?', es: 'Una película dura 120 minutos. ¿Cuántas horas?', answer: 2 },
        { en: '5 boxes each with 24 pencils — how many pencils?', es: '5 cajas con 24 lápices cada una. ¿Cuántos lápices?', answer: 120 },
        { en: 'A tank has 50 L. You use 12 L. How much remains?', es: 'Un estanque tiene 50 L. Usas 12 L. ¿Cuánto queda?', answer: 38 },
        { en: 'A rectangle is 9 by 4. Perimeter?', es: 'Un rectángulo mide 9 por 4. ¿Perímetro?', answer: 26 },
        { en: 'You read 35 pages a day for 4 days. How many pages?', es: 'Lees 35 páginas al día durante 4 días. ¿Cuántas páginas?', answer: 140 },
        { en: 'A water bottle is 750 mL. Two bottles = ? mL', es: 'Una botella tiene 750 mL. ¿Dos botellas cuántos mL?', answer: 1500 },
        { en: 'Half of 86 is ?', es: 'La mitad de 86 es ?', answer: 43 },
        { en: 'A farmer has 6 cows. Each gives 15 L milk/day. Total per day?', es: 'Un granjero tiene 6 vacas. Cada una da 15 L de leche/día. ¿Total diario?', answer: 90 },
        { en: 'A bus ticket costs $450. How much for 6 tickets?', es: 'Un pasaje cuesta $450. ¿Cuánto cuestan 6 pasajes?', answer: 2700 },
        { en: 'A year has 365 days. How many weeks approximately? (divide by 7, round down)', es: 'Un año tiene 365 días. ¿Cuántas semanas aprox? (divide por 7, redondea hacia abajo)', answer: 52 },
        { en: 'If 1 kg = 1,000 g, then 2.5 kg = ? g', es: 'Si 1 kg = 1.000 g, entonces 2,5 kg = ? g', answer: 2500 },
        { en: '7 × 11 − 5 = ?', es: '7 × 11 − 5 = ?', answer: 72 },
        { en: 'A rope is 8 m. You cut 1/4 off. How many metres are cut?', es: 'Una cuerda mide 8 m. Cortas 1/4. ¿Cuántos metros cortas?', answer: 2 }
      ],
      commander: [
        { en: 'A store marks a $12,000 toy 25% off. What is the sale price?', es: 'Una tienda rebaja un juguete de $12.000 un 25%. ¿Precio final?', answer: 9000 },
        { en: 'A rectangle is 6 m by 4 m. Area?', es: 'Un rectángulo mide 6 m por 4 m. ¿Área?', answer: 24 },
        { en: 'Average of 7, 9, 11, 13?', es: 'Promedio de 7, 9, 11, 13?', answer: 10 },
        { en: 'A car uses 8 L per 100 km. How much fuel for 250 km?', es: 'Un auto usa 8 L cada 100 km. ¿Cuántos litros para 250 km?', answer: 20 },
        { en: '1/2 + 1/3 = ? (as a decimal, rounded to 2 places)', es: '1/2 + 1/3 = ? (decimal con 2 cifras)', answer: 0.83 },
        { en: 'A jacket is $24,000 with 15% off. Final price?', es: 'Una chaqueta cuesta $24.000 con 15% descuento. ¿Precio final?', answer: 20400 },
        { en: 'A triangle has base 10, height 6. Area? (½ × b × h)', es: 'Un triángulo tiene base 10 y altura 6. ¿Área? (½ × b × h)', answer: 30 },
        { en: 'A recipe serves 4. You cook for 10. Multiply by how much?', es: 'Una receta es para 4. Cocinas para 10. ¿Por cuánto multiplicas?', answer: 2.5 },
        { en: 'You save $5,000/week. How many weeks to save $65,000?', es: 'Ahorras $5.000/semana. ¿Cuántas semanas para juntar $65.000?', answer: 13 },
        { en: 'A square has side 9. Area?', es: 'Un cuadrado tiene lado 9. ¿Área?', answer: 81 },
        { en: 'Convert 0.6 to a percent: ?%', es: 'Convierte 0,6 a porcentaje: ?%', answer: 60 },
        { en: 'A bag of flour is 2 kg. 15 bags weigh how many kg?', es: 'Una bolsa de harina es 2 kg. ¿Cuánto pesan 15 bolsas?', answer: 30 },
        { en: '15% of 200 = ?', es: '15% de 200 = ?', answer: 30 },
        { en: 'A circle has radius 5. Area ≈ π r² using π=3. Answer?', es: 'Un círculo tiene radio 5. Área ≈ π r² con π=3. ¿Respuesta?', answer: 75 },
        { en: 'Speed = distance/time. You drive 180 km in 3 h. Speed?', es: 'Rapidez = distancia/tiempo. Manejas 180 km en 3 h. ¿Rapidez?', answer: 60 },
        { en: 'Median of {4, 7, 9, 12, 15} = ?', es: 'Mediana de {4, 7, 9, 12, 15} = ?', answer: 9 },
        { en: 'A bottle is 3/4 full holding 750 mL. Full capacity?', es: 'Una botella llena 3/4 tiene 750 mL. ¿Capacidad total?', answer: 1000 },
        { en: 'A cube has side 4. Volume = s³ = ?', es: 'Un cubo tiene lado 4. Volumen = s³ = ?', answer: 64 },
        { en: 'If 3 kg of grapes cost $6,600, what does 1 kg cost?', es: 'Si 3 kg de uvas cuestan $6.600, ¿cuánto cuesta 1 kg?', answer: 2200 },
        { en: 'A project is 40% done after 10 days. Days to finish total?', es: 'Un proyecto va 40% tras 10 días. ¿Días totales para terminar?', answer: 25 }
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
      // Shuffle the bank and take 5 so sessions stay short and the kid
      // sees variety across plays even though the bank is ~20 items.
      var shuffled = bank.slice().sort(function() { return Math.random() - 0.5; });
      state = {
        tier: tier,
        idx: 0,
        correct: 0,
        questions: shuffled.slice(0, 5)
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
