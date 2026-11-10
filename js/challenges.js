/* ================================================================
   SIBLING CHALLENGES — challenges.js
   The screens for challenge-engine.js: the hub inbox and the
   "Challenge a sibling" button, the form an older kid fills in, the
   screen where the younger one answers, and the Parents Corner list.

   Everything a kid typed is untrusted. It is only ever put on the page
   as text (textContent / createTextNode), never as HTML, and the engine
   cuts it to 120 characters again when it is read.

   Hub: Challenges.renderHub(user) (called by index.js after Today's 3).
   Parents Corner: Challenges.renderParents('element-id').
   Fires 'zs:challenges-changed' on window when a star was earned.
   ================================================================ */

var Challenges = (function () {
  'use strict';

  var E = typeof ChallengeEngine !== 'undefined' ? ChallengeEngine : null;
  var KEY = 'zs_challenges';
  var ICON = { q: '❓', spell: '🔤', map: '🗺️' };
  var _loaded = {};          // script files already added to the page

  function tr(es, en) { return typeof zsT === 'function' ? zsT(es, en) : en; }

  // ── building the page without innerHTML ──
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  // ── storage ──
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    d = d && typeof d === 'object' ? d : {};
    if (!Array.isArray(d.events)) d.events = [];
    d.v = 1;
    return d;
  }
  function add(ev) {
    var d = load();
    d.events.push(ev);
    d._syncedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) { return false; }
    if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(KEY);
    return true;
  }
  // A parent deleting one: the removal is logged, and the words go from this
  // device's copy at once (other devices drop them when they next merge).
  function remove(id) {
    if (!add(E.makeRemove(id))) return false;
    var d = load();
    d.events = E.scrub(d.events);
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(KEY);
    return true;
  }
  function view() { return E.view(load().events); }
  function find(id) {
    var v = view();
    for (var i = 0; i < v.challenges.length; i++) if (v.challenges[i].id === id) return v.challenges[i];
    return null;
  }
  function people() {
    return (typeof getProfiles === 'function' ? getProfiles() : []).filter(function (p) { return p && p.name && !p.isGuest; });
  }
  function profileOf(name) {
    var all = people();
    for (var i = 0; i < all.length; i++) if (E.sameName(all[i].name, name)) return all[i];
    return null;
  }

  // The star record each kid keeps (what getPlayerStats counts) from the log.
  // Adds what is missing; never removes one.
  function reconcileStars() {
    if (!E) return false;
    var want = E.starsByKid(load().events), changed = false;
    Object.keys(want).forEach(function (k) {
      var key = E.STARS_PREFIX + k, rec = null;
      try { rec = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { rec = null; }
      rec = rec && typeof rec === 'object' ? rec : {};
      rec.stars = rec.stars && typeof rec.stars === 'object' ? rec.stars : {};
      var added = false;
      Object.keys(want[k]).forEach(function (id) {
        if (!rec.stars[id]) { rec.stars[id] = want[k][id]; added = true; }
      });
      if (!added) return;
      rec.v = 1;
      rec._syncedAt = Date.now();
      try {
        localStorage.setItem(key, JSON.stringify(rec));
        changed = true;
        if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(key);
      } catch (e) {}
    });
    return changed;
  }

  // ── map data (loaded only when a map challenge needs it) ──
  function loadScript(src, cb) {
    var rec = _loaded[src];
    if (rec && rec.done) { cb(rec.ok); return; }
    if (rec) { rec.cbs.push(cb); return; }
    rec = _loaded[src] = { cbs: [cb], done: false, ok: false };
    var s = document.createElement('script');
    s.src = src;
    var fin = function (ok) {
      rec.done = true; rec.ok = ok;
      if (!ok) { delete _loaded[src]; s.remove(); }   // a later try may succeed
      var cbs = rec.cbs; rec.cbs = [];
      cbs.forEach(function (f) { f(ok); });
    };
    s.onload = function () { fin(true); };
    s.onerror = function () { fin(false); };
    document.head.appendChild(s);
  }
  function haveAtlas() { return typeof WORLD_ATLAS_DATA !== 'undefined'; }
  function haveMap() { return haveAtlas() && typeof WorldMap !== 'undefined'; }
  function loadAtlas(cb) {
    if (haveAtlas()) { cb(true); return; }
    loadScript('js/world-atlas-data.js', cb);
  }
  function loadMap(cb) {
    if (haveMap()) { cb(true); return; }
    loadAtlas(function (ok) {
      if (!ok) { cb(false); return; }
      if (haveMap()) { cb(true); return; }
      loadScript('js/world-map-data.js?v=1', function (ok2) { cb(ok2 && haveMap()); });
    });
  }
  function country(id) {
    if (!haveAtlas()) return null;
    for (var i = 0; i < WORLD_ATLAS_DATA.length; i++) if (WORLD_ATLAS_DATA[i].id === id) return WORLD_ATLAS_DATA[i];
    return null;
  }
  function countryName(id) {
    var c = country(id);
    return c ? tr(c.nameEs, c.name) : String(id || '').toUpperCase();
  }

  // ── speaking a spelling word (the word is the exercise, so it is
  // spoken even when a parent turned read-aloud off) ──
  function sayWord(word, lang) {
    try {
      if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return false;
      var u = new SpeechSynthesisUtterance(word);
      u.lang = lang === 'es' ? 'es-CL' : 'en-US';
      var voice = typeof ZsTTS !== 'undefined' && ZsTTS.pickVoice ? ZsTTS.pickVoice(u.lang) : null;
      if (voice) u.voice = voice;
      var rate = typeof ZsTTS !== 'undefined' && ZsTTS.getSettings ? ZsTTS.getSettings().rate : 0.9;
      u.rate = Math.min(0.9, rate || 0.9);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  function isLittle(user) {
    return typeof HubPlan !== 'undefined' && HubPlan.isLittle && HubPlan.isLittle(user);
  }

  // ── a dialog on top of the page ──
  function openDialog(label, build) {
    var opener = document.activeElement;
    var overlay = h('div', { class: 'chl-overlay' });
    var modal = h('div', { class: 'chl-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': label, tabindex: '-1' });
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    var api = {
      modal: modal,
      close: function () {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (typeof ZsSpeak !== 'undefined') ZsSpeak.stop();
        try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
        if (opener && opener.focus && document.contains(opener)) { try { opener.focus(); } catch (e) {} }
      }
    };
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); api.close(); } }
    document.addEventListener('keydown', onKey, true);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) api.close(); });
    build(api);
    return api;
  }

  function note(text) { return h('p', { class: 'chl-note', text: text }); }

  // ================================================================
  // Answering
  // ================================================================
  function openSolve(id, user) {
    user = user || (typeof getActiveUser === 'function' ? getActiveUser() : null);
    var c0 = find(id);
    if (!E || !user || !c0 || c0.removed || c0.solved || !E.sameName(c0.to, user.name)) return null;
    var little = isLittle(user);
    var wrongOpts = {}, wrongCodes = {};
    var justMissed = false;    // a wrong try in this sitting (not one from an earlier visit)
    var dlg;

    function fresh() { return find(id); }
    function say(text, lang) { if (typeof ZsSpeak !== 'undefined') ZsSpeak.say(text, lang); }

    function hintNode(c) {
      if (!E.hintOpen(c)) return null;
      var text = c.hint;
      if (!text) {
        if (c.kind === 'spell') text = tr('Empieza con la letra "', 'It starts with the letter "') + Array.from(c.answer)[0].toUpperCase() + '".';
        else if (c.kind === 'map') {
          var ct = country(c.answer);
          text = ct ? tr('Está en ' + ct.regionEs + '.', 'It is in ' + ct.region + '.') : '';
        } else text = tr('Quité una respuesta que no es.', 'One wrong answer is crossed out.');
      }
      return text ? h('p', { class: 'chl-hint' }, [h('strong', { text: '💡 ' + tr('Pista', 'Hint') + ': ' }), text]) : null;
    }

    function miss(c) {
      add(E.makeMiss(c.id, user.name));
      justMissed = true;
      render();
    }

    function win(c) {
      var ok = add(E.makeSolve(c.id, user.name, c.misses + 1));
      if (!ok) { var er = dlg.modal.querySelector('.chl-error'); if (er) er.textContent = tr('No se pudo guardar. Pídele ayuda a un adulto.', 'Could not save. Ask a grown-up for help.'); return; }
      reconcileStars();
      var from = profileOf(c.from);
      dlg.modal.textContent = '';
      dlg.modal.appendChild(h('div', { class: 'chl-win' }, [
        h('div', { class: 'chl-win-star', 'aria-hidden': 'true', text: '⭐' }),
        h('h2', { text: tr('¡Lo lograste!', 'You solved it!') }),
        h('p', { text: tr('Ganaste una estrella. ' + c.from + ' también.', 'You earned a star. ' + c.from + ' did too.'), id: 'chl-win-msg' }),
        from ? h('p', { 'aria-hidden': 'true', text: from.avatar || '' }) : null,
        h('div', { class: 'chl-actions' }, [
          h('button', { type: 'button', class: 'chl-btn primary', id: 'chl-done', text: tr('¡Listo!', 'Done'), onclick: function () { dlg.close(); changed(); } })
        ])
      ]));
      var b = dlg.modal.querySelector('#chl-done');
      if (b) b.focus();
    }

    function wrong(c, msg) {
      var n = dlg.modal.querySelector('.chl-nudge');
      if (n) n.textContent = msg || tr('Casi. ¡Inténtalo otra vez!', 'Not quite. Try again!');
    }

    function render() {
      var c = fresh();
      if (!c || c.removed || c.solved) { dlg.close(); return; }
      var m = dlg.modal;
      m.textContent = '';
      var body = [
        h('h2', { text: tr('Un desafío para ti', 'A challenge for you') }),
        h('p', { class: 'chl-who', text: ICON[c.kind] + ' ' + tr('De ', 'From ') + c.from })
      ];
      var focusEl = null;

      if (c.kind === 'q') {
        var q = h('p', { class: 'chl-q', text: c.text });
        if (typeof ZsSpeak !== 'undefined' && ZsSpeak.enabled()) {
          q.insertAdjacentHTML('beforeend', ZsSpeak.button(c.text));
        }
        body.push(q);
        var order = E.shuffled(c);
        // With the hint open and no hint written, one wrong answer is crossed out.
        var crossed = -1;
        if (E.hintOpen(c) && !c.hint) {
          for (var k = 0; k < order.length; k++) if (order[k] !== c.answer && !wrongOpts[order[k]]) { crossed = order[k]; break; }
        }
        var list = h('div', { class: 'chl-opts', role: 'group', 'aria-label': tr('Respuestas', 'Answers') });
        order.forEach(function (oi) {
          var b = h('button', { type: 'button', class: 'chl-opt', text: c.options[oi], 'data-i': String(oi) });
          if (wrongOpts[oi] || oi === crossed) b.disabled = true;
          if (little) { b.setAttribute('data-zs-choice', '1'); b.setAttribute('data-say-text', c.options[oi]); }
          b.addEventListener('click', function () {
            if (E.check(c, oi)) { b.classList.add('right'); win(c); }
            else { wrongOpts[oi] = true; b.disabled = true; miss(c); }
          });
          list.appendChild(b);
          if (!focusEl && !b.disabled) focusEl = b;
        });
        body.push(list);
      } else if (c.kind === 'spell') {
        var heard = h('p', { class: 'chl-note', 'aria-live': 'polite' });
        body.push(h('p', { class: 'chl-q', text: tr('Escucha la palabra y escríbela.', 'Listen to the word and spell it.') }));
        var sayBtn = h('button', { type: 'button', class: 'chl-say', id: 'chl-hear', text: '🔊 ' + tr('Escuchar', 'Hear the word'), onclick: function () {
          if (!sayWord(c.answer, c.lang)) heard.textContent = tr('Este aparato no puede leer en voz alta. Pídele a ' + c.from + ' que te diga la palabra.', 'This device cannot read aloud. Ask ' + c.from + ' to say the word.');
        } });
        body.push(sayBtn);
        var slots = h('div', { class: 'chl-slots', 'aria-hidden': 'true' });
        Array.from(c.answer).forEach(function () { slots.appendChild(h('span', { class: 'chl-slot' })); });
        body.push(slots, heard, h('label', { class: 'chl-label', for: 'chl-spell', text: tr('Tu respuesta (' + Array.from(c.answer).length + ' letras)', 'Your answer (' + Array.from(c.answer).length + ' letters)') }));
        var inp = h('input', { type: 'text', id: 'chl-spell', class: 'chl-input', maxlength: String(E.MAX_WORD), autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done' });
        body.push(inp);
        var go = function () {
          var val = inp.value;
          if (!E.normWord(val)) return;
          if (E.check(c, val)) win(c);
          else { inp.value = ''; miss(c); }
        };
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
        body.push(h('div', { class: 'chl-actions' }, [h('button', { type: 'button', class: 'chl-btn primary', id: 'chl-check', text: tr('Revisar', 'Check'), onclick: go })]));
        focusEl = inp;
        if (!justMissed) setTimeout(function () { if (dlg.modal.isConnected) sayWord(c.answer, c.lang); }, 300);
      } else if (c.kind === 'map') {
        var mapReady = haveMap();
        body.push(h('p', { class: 'chl-q', id: 'chl-map-q', text: mapReady ? tr('Encuentra ', 'Find ') + countryName(c.answer) + tr(' en el mapa.', ' on the map.') : tr('Cargando el mapa…', 'Loading the map…') }));
        var host = h('div', { class: 'chl-map', id: 'chl-map', role: 'group', 'aria-label': tr('Mapa del mundo', 'World map') });
        body.push(host);
        var zoom = h('button', { type: 'button', class: 'chl-btn', id: 'chl-zoom', text: '🌍 ' + tr('Ver todo el mundo', 'Show the whole world') });
        body.push(h('div', { class: 'chl-actions' }, [zoom]));
        if (mapReady) {
          drawMap(host, c, wrongCodes, zoom, function (code) {
            if (E.check(c, code)) { var p = host.querySelector('[data-code="' + code + '"]'); if (p) p.classList.add('hit'); win(c); }
            else { wrongCodes[code] = true; miss(c); }
          });
        } else {
          loadMap(function (ok) {
            if (ok) { if (dlg.modal.isConnected) render(); }
            else host.textContent = tr('El mapa aún no está disponible sin internet. Ábrelo una vez en World Atlas.', 'The map is not ready without internet yet. Open World Atlas once.');
          });
        }
      }

      body.push(h('p', { class: 'chl-nudge', 'aria-live': 'polite' }));
      var hn = hintNode(c);
      if (hn) body.push(hn);
      body.push(h('p', { class: 'chl-error', role: 'alert' }));
      body.push(h('div', { class: 'chl-actions' }, [h('button', { type: 'button', class: 'chl-btn', id: 'chl-later', text: tr('Después', 'Later'), onclick: function () { dlg.close(); } })]));
      body.forEach(function (n) { m.appendChild(n); });
      if (justMissed) wrong(c);
      if (focusEl) focusEl.focus(); else m.focus();
      if (typeof ZsSpeak !== 'undefined') ZsSpeak.scan();
    }

    dlg = openDialog(tr('Un desafío para ti', 'A challenge for you'), function () {});
    render();
    return dlg;
  }

  // The tap map: framed around the answer so it is not always dead centre.
  function drawMap(host, c, wrongCodes, zoomBtn, onTap) {
    var W = WorldMap.W, H = WorldMap.H, FULL = [-20, -20, W + 40, H + 40];
    var inf = WorldMap.info(c.answer);
    var b = inf ? inf.b : [0, 0, W, H];
    var w = Math.max(560, (b[2] - b[0]) * 2.6), hh = w / 1.5;
    var seed = 0;
    for (var i = 0; i < c.id.length; i++) seed = (seed * 31 + c.id.charCodeAt(i)) | 0;
    var jx = ((Math.abs(seed) % 100) / 100 - 0.5) * w * 0.5, jy = ((Math.abs(seed >> 7) % 100) / 100 - 0.5) * hh * 0.5;
    var frame = [(b[0] + b[2]) / 2 - w / 2 + jx, (b[1] + b[3]) / 2 - hh / 2 + jy, w, hh];
    var zoomed = false;
    var svg = '<svg viewBox="' + frame.map(function (n) { return n.toFixed(1); }).join(' ') + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + tr('Mapa del mundo', 'World map') + '">' +
      '<path d="' + WorldMap.outline() + '" fill="#9fd0ea"/>' +
      '<g>' + WorldMap.codes().map(function (code) {
        return '<path class="chl-land' + (wrongCodes[code] ? ' miss' : '') + '" data-code="' + code + '" d="' + WorldMap.path(code) + '"/>';
      }).join('') + '</g></svg>';
    host.innerHTML = svg;   // trusted: built only from the map data files
    var el = host.querySelector('svg');
    var down = null;
    el.addEventListener('pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', function (e) {
      if (!down) return;
      var moved = Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]);
      down = null;
      if (moved > 14) return;
      var t = e.target && e.target.closest ? e.target.closest('[data-code]') : null;
      if (t) onTap(t.getAttribute('data-code'));
    });
    if (zoomBtn) zoomBtn.addEventListener('click', function () {
      zoomed = !zoomed;
      var f = zoomed ? FULL : frame;
      el.setAttribute('viewBox', f.map(function (n) { return n.toFixed(1); }).join(' '));
      zoomBtn.textContent = zoomed ? '🔍 ' + tr('Acercar', 'Zoom back in') : '🌍 ' + tr('Ver todo el mundo', 'Show the whole world');
    });
  }

  // ================================================================
  // Making one
  // ================================================================
  var ERRORS = {
    who: ['Elige a quién desafiar.', 'Pick who to challenge.'],
    kind: ['Elige qué tipo de desafío es.', 'Pick the kind of challenge.'],
    text: ['Escribe la pregunta.', 'Write the question.'],
    options: ['Escribe de 2 a 4 respuestas distintas.', 'Write 2 to 4 different answers.'],
    answer: ['Marca cuál es la respuesta correcta.', 'Mark the right answer.'],
    word: ['Escribe una palabra (sin números ni espacios).', 'Write one word (no numbers or spaces).'],
    country: ['Elige un país.', 'Pick a country.']
  };

  function openCreate(user) {
    user = user || (typeof getActiveUser === 'function' ? getActiveUser() : null);
    if (!E || !user || user.isGuest) return null;
    var v = view();
    var kids = E.receivers(people(), user, v.anyone);
    if (!kids.length) return null;
    var st = { to: kids.length === 1 ? kids[0].name : null, kind: null, lang: typeof getKidLang === 'function' && getKidLang() === 'es' ? 'es' : 'en', right: 0 };
    var dlg;

    function counter(input) {
      var p = h('p', { class: 'chl-count', 'aria-hidden': 'true' });
      var upd = function () { p.textContent = Array.from(input.value).length + '/' + E.MAX_TEXT; };
      input.addEventListener('input', upd); upd();
      return p;
    }
    function field(id, label, extra) {
      var input = h('input', Object.assign({ type: 'text', id: id, class: 'chl-input', maxlength: String(E.MAX_TEXT), autocomplete: 'off' }, extra || {}));
      return { input: input, node: h('div', {}, [h('label', { class: 'chl-label', for: id, text: label }), input, counter(input)]) };
    }
    function choiceGroup(legend, items, current, onPick) {
      var fs = h('fieldset', { class: 'chl-fieldset' }, [h('legend', { text: legend })]);
      var row = h('div', { class: 'chl-choices' });
      items.forEach(function (it) {
        var b = h('button', { type: 'button', class: 'chl-pick', 'aria-pressed': String(it.value === current) }, [it.node || it.label]);
        b.addEventListener('click', function () {
          onPick(it.value);
          Array.prototype.forEach.call(row.children, function (x, i) { x.setAttribute('aria-pressed', String(items[i].value === it.value)); });
        });
        row.appendChild(b);
      });
      fs.appendChild(row);
      return fs;
    }

    var fieldsHost, errEl, qText, rows = [], wordIn, countrySel, hintIn;

    function renderFields() {
      fieldsHost.textContent = '';
      rows = []; qText = wordIn = countrySel = null;
      if (st.kind === 'q') {
        var f = field('chl-text', tr('Tu pregunta', 'Your question'));
        qText = f.input;
        fieldsHost.appendChild(f.node);
        var ans = h('fieldset', { class: 'chl-fieldset' }, [h('legend', { text: tr('Las respuestas (marca la correcta)', 'The answers (mark the right one)') })]);
        var list = h('div', { id: 'chl-answers' });
        var addRow = function () {
          var i = rows.length;
          var radio = h('input', { type: 'radio', name: 'chl-right', value: String(i), 'aria-label': tr('Esta es la respuesta correcta', 'This is the right answer') + ' ' + (i + 1) });
          if (i === st.right) radio.checked = true;
          radio.addEventListener('change', function () { st.right = i; });
          var inp = h('input', { type: 'text', class: 'chl-input', maxlength: String(E.MAX_TEXT), autocomplete: 'off', 'aria-label': tr('Respuesta ', 'Answer ') + (i + 1), id: 'chl-ans-' + i });
          rows.push(inp);
          list.appendChild(h('div', { class: 'chl-answer-row' }, [radio, inp]));
        };
        addRow(); addRow();
        ans.appendChild(list);
        var ctl = h('div', { class: 'chl-choices' });
        var more = h('button', { type: 'button', class: 'chl-btn', id: 'chl-add', text: '+ ' + tr('Otra respuesta', 'Add an answer') });
        var less = h('button', { type: 'button', class: 'chl-btn', id: 'chl-less', text: '− ' + tr('Quitar una', 'Remove one') });
        var sync = function () { more.disabled = rows.length >= E.MAX_OPTIONS; less.disabled = rows.length <= E.MIN_OPTIONS; };
        more.addEventListener('click', function () { addRow(); sync(); });
        less.addEventListener('click', function () {
          if (rows.length <= E.MIN_OPTIONS) return;
          rows.pop(); list.removeChild(list.lastChild);
          if (st.right >= rows.length) { st.right = 0; var r0 = list.querySelector('input[type="radio"]'); if (r0) r0.checked = true; }
          sync();
        });
        sync();
        ctl.appendChild(more); ctl.appendChild(less);
        ans.appendChild(ctl);
        fieldsHost.appendChild(ans);
      } else if (st.kind === 'spell') {
        var w = h('div', {}, [
          h('label', { class: 'chl-label', for: 'chl-word', text: tr('La palabra', 'The word') }),
          h('input', { type: 'text', id: 'chl-word', class: 'chl-input', maxlength: String(E.MAX_WORD), autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' })
        ]);
        wordIn = w.querySelector('input');
        fieldsHost.appendChild(w);
        fieldsHost.appendChild(choiceGroup(tr('Idioma de la palabra', 'Language of the word'),
          [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }], st.lang, function (x) { st.lang = x; }));
        fieldsHost.appendChild(note(tr('Tu hermano la escuchará en voz alta y la escribirá.', 'They will hear it read aloud and type it.')));
      } else if (st.kind === 'map') {
        fieldsHost.appendChild(h('label', { class: 'chl-label', for: 'chl-country', text: tr('El país', 'The country') }));
        countrySel = h('select', { id: 'chl-country', class: 'chl-input' }, [h('option', { value: '', text: tr('Cargando…', 'Loading…') })]);
        fieldsHost.appendChild(countrySel);
        var sel = countrySel;
        loadMap(function (ok) {
          if (sel !== countrySel) return;
          sel.textContent = '';
          if (!ok) { sel.appendChild(h('option', { value: '', text: tr('El mapa no está disponible sin internet todavía', 'The map is not ready without internet yet') })); return; }
          sel.appendChild(h('option', { value: '', text: tr('Elige un país', 'Pick a country') }));
          WORLD_ATLAS_DATA.filter(function (a) { var i = WorldMap.info(a.id); return i && i.a >= 45; })
            .map(function (a) { return { id: a.id, name: tr(a.nameEs, a.name) }; })
            .sort(function (a, b) { return a.name.localeCompare(b.name); })
            .forEach(function (a) { sel.appendChild(h('option', { value: a.id, text: a.name })); });
        });
      }
    }

    function send() {
      errEl.textContent = '';
      var f = { from: user.name, to: st.to, kind: st.kind, hint: hintIn.value };
      if (st.kind === 'q') {
        f.text = qText.value; f.options = rows.map(function (r) { return r.value; }); f.answer = st.right;
      } else if (st.kind === 'spell') { f.answer = wordIn.value; f.lang = st.lang; }
      else if (st.kind === 'map') f.answer = countrySel ? countrySel.value : '';
      var r = E.make(f);
      if (!r.ok) { var m = ERRORS[r.error] || ERRORS.kind; errEl.textContent = tr(m[0], m[1]); return; }
      if (!add(r.event)) { errEl.textContent = tr('No se pudo guardar. Pídele ayuda a un adulto.', 'Could not save. Ask a grown-up for help.'); return; }
      dlg.close();
      if (typeof ZsDialog !== 'undefined') ZsDialog.toast(tr('¡Desafío enviado a ' + st.to + '!', 'Challenge sent to ' + st.to + '!'));
      changed();
    }

    dlg = openDialog(tr('Desafía a un hermano', 'Challenge a sibling'), function (d) {
      var m = d.modal;
      m.appendChild(h('h2', { text: '🤝 ' + tr('Desafía a un hermano', 'Challenge a sibling') }));
      m.appendChild(h('p', { class: 'chl-who', text: tr('Cuando lo resuelva, los dos ganan una estrella.', 'When they solve it, you both earn a star.') }));
      m.appendChild(choiceGroup(tr('¿A quién?', 'Who?'),
        kids.map(function (k) { return { value: k.name, node: h('span', {}, [(k.avatar || '') + ' ' + k.name]) }; }), st.to, function (x) { st.to = x; }));
      m.appendChild(choiceGroup(tr('¿Qué tipo?', 'What kind?'), [
        { value: 'q', label: '❓ ' + tr('Pregunta', 'Question') },
        { value: 'spell', label: '🔤 ' + tr('Deletrear', 'Spelling') },
        { value: 'map', label: '🗺️ ' + tr('Mapa', 'Find on the map') }
      ], st.kind, function (x) { st.kind = x; renderFields(); }));
      fieldsHost = h('div', { id: 'chl-fields' });
      m.appendChild(fieldsHost);
      var hf = field('chl-hint', tr('Una pista (opcional)', 'A hint (optional)'));
      hintIn = hf.input;
      m.appendChild(hf.node);
      errEl = h('p', { class: 'chl-error', role: 'alert', id: 'chl-err' });
      m.appendChild(errEl);
      m.appendChild(h('div', { class: 'chl-actions' }, [
        h('button', { type: 'button', class: 'chl-btn', id: 'chl-cancel', text: tr('Cancelar', 'Cancel'), onclick: function () { d.close(); } }),
        h('button', { type: 'button', class: 'chl-btn primary', id: 'chl-send', text: tr('Enviar', 'Send'), onclick: send })
      ]));
      var first = m.querySelector('.chl-pick');
      if (first) first.focus();
    });
    return dlg;
  }

  // ================================================================
  // The hub
  // ================================================================
  var SEEN = 'zs_chseen_';
  function seenOf(name) {
    try { var a = JSON.parse(localStorage.getItem(SEEN + E.kidKey(name)) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function markSeen(name, id) {
    var a = seenOf(name);
    if (a.indexOf(id) < 0) a.push(id);
    try { localStorage.setItem(SEEN + E.kidKey(name), JSON.stringify(a.slice(-100))); } catch (e) {}
  }

  function changed() {
    try { window.dispatchEvent(new CustomEvent('zs:challenges-changed')); } catch (e) {}
  }

  function renderHub(user) {
    var old = document.getElementById('hub-challenges');
    if (old) old.remove();
    if (!E || !user || user.isGuest) return;
    var anchor = document.getElementById('hub-today') || document.getElementById('app-grid');
    if (!anchor || !anchor.parentNode) return;

    reconcileStars();
    var v = view();
    var inbox = E.inbox(v, user.name);
    var seen = seenOf(user.name);
    var celebrate = E.solvedSent(v, user.name, Date.now() - 3 * 86400000).filter(function (c) { return seen.indexOf(c.id) < 0; });
    var canSend = E.receivers(people(), user, v.anyone).length > 0;
    if (!inbox.length && !celebrate.length && !canSend) return;

    var little = isLittle(user);
    var sec = h('section', { id: 'hub-challenges', class: 'chl-hub' + (little ? ' chl-little' : ''), 'aria-label': tr('Desafíos', 'Challenges') });
    sec.appendChild(h('h2', { class: 'chl-title', text: '🤝 ' + tr('Desafíos', 'Challenges') }));
    var list = h('div', { class: 'chl-list' });

    inbox.forEach(function (c) {
      var who = profileOf(c.from);
      var label = tr(c.from + ' te mandó un desafío', c.from + ' sent you a challenge');
      var card = h('button', { type: 'button', class: 'chl-card', 'data-ch': c.id }, [
        h('span', { class: 'chl-card-ico', 'aria-hidden': 'true', text: ICON[c.kind] }),
        h('span', { class: 'chl-card-main' }, [
          h('span', { text: label }),
          h('span', { class: 'chl-card-sub', text: (who && who.avatar ? who.avatar + ' ' : '') + tr('Toca para jugar', 'Tap to play') })
        ])
      ]);
      if (little) { card.setAttribute('data-zs-choice', '1'); card.setAttribute('data-say-text', label); }
      card.addEventListener('click', function () { openSolve(c.id, user); });
      list.appendChild(card);
    });

    celebrate.forEach(function (c) {
      var card = h('button', { type: 'button', class: 'chl-card is-solved', 'data-solved': c.id }, [
        h('span', { class: 'chl-card-ico', 'aria-hidden': 'true', text: '🎉' }),
        h('span', { class: 'chl-card-main' }, [
          h('span', { text: tr(c.to + ' resolvió tu desafío', c.to + ' solved your challenge') }),
          h('span', { class: 'chl-card-sub', text: '⭐ ' + tr('¡Ganaste una estrella!', 'You earned a star!') })
        ])
      ]);
      card.addEventListener('click', function () { markSeen(user.name, c.id); renderHub(user); });
      list.appendChild(card);
    });
    if (list.children.length) sec.appendChild(list);

    if (canSend) {
      sec.appendChild(h('button', { type: 'button', class: 'chl-send', id: 'chl-open', text: '✏️ ' + tr('Desafía a un hermano', 'Challenge a sibling'), onclick: function () { openCreate(user); } }));
    }
    anchor.parentNode.insertBefore(sec, anchor);
    if (typeof ZsSpeak !== 'undefined') ZsSpeak.scan();
  }

  // ================================================================
  // Parents Corner: see and delete any challenge, and the sibling rule
  // ================================================================
  function renderParents(hostId) {
    var host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
    if (!host || !E) return;
    host.textContent = '';
    var v = view();
    var live = v.challenges.filter(function (c) { return !c.removed; });
    var det = h('details', { class: 'chl-parents', id: 'chl-parents' });
    det.appendChild(h('summary', { text: '🤝 Sibling challenges (' + live.length + ')' }));
    det.appendChild(h('p', { class: 'chl-note', text: 'Older kids set a question, a spelling word or a map country for a younger sibling. When it is solved, both earn a star (up to 3 a day). Everything a kid wrote is shown here; delete any you do not want.' }));
    var any = h('input', { type: 'checkbox', id: 'chl-anyone' });
    any.checked = !!v.anyone;
    any.addEventListener('change', function () { add(E.makeConfig(any.checked)); renderParents(hostId); changed(); });
    det.appendChild(h('label', { style: 'display:flex; gap:8px; align-items:center; font-size:0.85rem; margin-bottom:8px;' }, [any, 'Let any kid challenge any sibling (not just a younger one)']));

    if (!live.length) det.appendChild(h('p', { class: 'chl-note', text: 'No challenges yet.' }));
    var needAtlas = live.some(function (c) { return c.kind === 'map'; }) && !haveAtlas();
    if (needAtlas) loadAtlas(function (ok) { if (ok) renderParents(hostId); });
    live.slice().reverse().forEach(function (c) {
      var what = c.kind === 'q' ? c.text + '  [' + c.options.map(function (o, i) { return (i === c.answer ? '✓ ' : '') + o; }).join(' | ') + ']'
        : c.kind === 'spell' ? 'Spell: ' + c.answer + ' (' + c.lang + ')'
        : 'Find on the map: ' + (country(c.answer) ? country(c.answer).name : c.answer.toUpperCase());
      var status = c.solved ? 'solved ✓' : (c.misses ? 'waiting, ' + c.misses + ' wrong ' + (c.misses === 1 ? 'try' : 'tries') : 'waiting');
      var del = h('button', { type: 'button', class: 'chl-del', 'data-ch': c.id, 'aria-label': 'Delete this challenge from ' + c.from + ' to ' + c.to, text: '🗑 Delete' });
      del.addEventListener('click', function () {
        var go = function () { remove(c.id); renderParents(hostId); changed(); };
        if (typeof ZsDialog !== 'undefined') ZsDialog.confirm({ title: 'Delete this challenge?', message: c.from + ' to ' + c.to + '. It is removed for everyone.', confirmLabel: 'Delete' }).then(function (yes) { if (yes) go(); });
        else go();
      });
      det.appendChild(h('div', { class: 'chl-prow', 'data-ch': c.id }, [
        h('div', { class: 'chl-prow-main' }, [
          h('div', { text: ICON[c.kind] + ' ' + c.from + ' → ' + c.to + ': ' + what }),
          c.hint ? h('div', { class: 'chl-prow-meta', text: 'Hint: ' + c.hint }) : null,
          h('div', { class: 'chl-prow-meta', text: status + ' · ' + new Date(c.ts).toLocaleDateString() })
        ]),
        del
      ]));
    });
    host.appendChild(det);
    det.open = host.__chlOpen === true;
    det.addEventListener('toggle', function () { host.__chlOpen = det.open; });
  }

  // A challenge arriving from another device: look again.
  window.addEventListener('zs:household-synced', function () {
    var u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    var hub = document.getElementById('hub-screen');
    if (u && hub && hub.classList.contains('active')) { reconcileStars(); renderHub(u); }
  });

  return {
    renderHub: renderHub, renderParents: renderParents, openCreate: openCreate, openSolve: openSolve,
    reconcileStars: reconcileStars, load: load, view: view
  };
})();
