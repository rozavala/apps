/* ================================================================
   EXAMEN Y VIRTUDES 🙏 — the evening reflection (js/examen.js)
   A three-minute look back at the day with God, in the Catholic
   tradition of the examen taught by San Ignacio de Loyola:
     0  (if a virtue was chosen last time) did you get to practise it?
     1  Thank you, God, for…
     2  Today I was happy when…
     3  Something I could do better…
     4  Tomorrow I'll practise… (one of ten virtues, each with a saint)
     5  a short prayer, word for word as in Fe Explorador
   Little kids (getAgeTier 'beginner') answer with pictures only and
   hear every step read aloud; older kids can also type (longer for 9+)
   or draw.

   Private: the journal shows only the active kid's own entries. A
   parent can read any kid's journal behind the PIN. The Sunday Report
   and the activity log only ever get counts, never what was written.

   Data: js/examen-data.js · rules: js/examen-engine.js · art:
   js/examen-art.js · prayers and saints: js/fe-explorador.js and
   js/fe-explorador-art.js (loaded as they are, not copied).
   ================================================================ */

(function() {
  'use strict';

  var D = ExamenData, E = ExamenEngine, A = ExamenArt;
  var FM = (typeof FeManager !== 'undefined') ? FeManager : null;
  var FA = (typeof FeArt !== 'undefined') ? FeArt : null;
  var USER = (typeof getActiveUser === 'function') ? getActiveUser() : null;
  if (!USER) return;            // nav.js sends a signed-out visitor to the hub

  var EVENING_HOUR = 18;
  var PICKS = 3;                // pictures per step

  // ── helpers ──────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function T(es, en) { return S.lang === 'en' ? en : es; }
  function L(pair) { return pair ? T(pair[0], pair[1]) : ''; }
  function sfx(n) { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} }
  function tier() { return (typeof getAgeTier === 'function') ? getAgeTier(USER.age) : 'intermediate'; }
  function little() { return tier() === 'beginner'; }
  function older() { var t = tier(); return t === 'advanced' || t === 'expert'; }
  function today() { return E.dayKey(new Date()); }
  function firstName(n) { return String(n || '').split(/\s+/)[0]; }
  function toast(msg) { try { if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg); } catch (e) {} }

  // ── storage ──────────────────────────────────────────────────
  function key() { return (typeof getUserAppKey === 'function') ? getUserAppKey(E.PREFIX) : null; }
  function load() {
    var k = key(), raw = null;
    if (k) { try { raw = JSON.parse(localStorage.getItem(k)); } catch (e) { raw = null; } }
    return E.migrate(raw);
  }
  function save() {
    var k = key();
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) {
      // Out of room: drop the drawings (the words stay) and try once more.
      E.days(d).forEach(function(x) { delete d.entries[x].draw; });
      try { localStorage.setItem(k, JSON.stringify(d)); } catch (e2) {}
    }
    try { if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k); } catch (e) {}
  }

  var d = load();
  var S = {
    lang: 'es', view: 'home', step: 0, flow: [],
    draft: null, unlocked: false, checkDone: false, picked: null, browse: null, parentKid: null
  };
  S.lang = (typeof zsAppLang === 'function') ? (zsAppLang(d.lang) === 'en' ? 'en' : 'es') : d.lang;

  function freshDraft() {
    var e = E.entry(d, today());
    return {
      thanks: e ? (e.thanks || []).slice() : [], thanksText: e ? e.thanksText || '' : '', draw: e ? e.draw || '' : '',
      happy: e ? (e.happy || []).slice() : [], happyText: e ? e.happyText || '' : '',
      better: e ? (e.better || []).slice() : [], betterText: e ? e.betterText || '' : '', betterNone: !!(e && e.betterNone),
      virtue: e ? e.virtue || '' : '', prayer: e ? e.prayer || '' : ''
    };
  }

  // ── read-aloud ───────────────────────────────────────────────
  function ttsMode() { try { return (typeof ZsTTS !== 'undefined' && ZsTTS.supported()) ? ZsTTS.getSettings().mode : 'off'; } catch (e) { return 'off'; } }
  function canSpeak() { return ttsMode() !== 'off'; }
  function say(text, lang) {
    if (!canSpeak() || !text) return false;
    try { ZsTTS.stop(); return !!ZsTTS.speak(text, { lang: (lang || S.lang) === 'en' ? 'en-US' : 'es-CL' }); } catch (e) { return false; }
  }
  function stopSpeech() { try { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); } catch (e) {} }
  function speakBtn(text, lang) {
    if (!canSpeak()) return '';
    return '<button type="button" class="ex-say" data-say="' + esc(text) + '"' + (lang ? ' data-lang="' + lang + '"' : '') +
      ' aria-label="' + esc(T('Escuchar', 'Listen')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg></button>';
  }
  // Little-kid mode reads each screen's main line by itself.
  function autoSay(text) { if (ttsMode() === 'auto') setTimeout(function() { say(text); }, 250); }

  // ── shell ────────────────────────────────────────────────────
  function root() { return document.getElementById('ex-wrap'); }
  function langSwitch() {
    return '<div class="ex-seg" role="group" aria-label="' + esc(T('Idioma', 'Language')) + '">' +
      ['es', 'en'].map(function(l) {
        return '<button type="button" class="ex-segb' + (S.lang === l ? ' on' : '') + '" data-lang-set="' + l + '" aria-pressed="' + (S.lang === l) + '">' + (l === 'es' ? 'ES' : 'EN') + '</button>';
      }).join('') + '</div>';
  }
  function head(title, back) {
    return '<header class="ex-head">' +
      (back ? '<button type="button" class="ex-back" data-go="' + back + '" aria-label="' + esc(T('Volver', 'Back')) + '">‹</button>' : '') +
      '<h1 class="ex-title">' + esc(title) + '</h1>' + langSwitch() + '</header>';
  }
  function render(html, after) {
    stopSpeech();
    if (typeof ZsCanvas !== 'undefined') ZsCanvas.releaseIn(root());
    root().innerHTML = html;
    root().setAttribute('data-view', S.view);
    if (after) after(root());
    try { window.scrollTo(0, 0); } catch (e) {}
    var h = $('h1, h2', root());
    if (h && S.view !== 'home') { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} }
  }
  function go(view) { if (view !== 'parents') lock(); S.view = view; draw(); }
  function draw() {
    if (S.view === 'flow') return renderFlow();
    if (S.view === 'journal') return renderJournal();
    if (S.view === 'virtues') return renderVirtues();
    if (S.view === 'virtue') return renderVirtue(S.browse);
    if (S.view === 'parents') return renderParents();
    if (S.view === 'done') return renderDone();
    return renderHome();
  }

  function dateLabel(k, long) {
    var dt = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
    try { return dt.toLocaleDateString(S.lang === 'en' ? 'en-US' : 'es-CL', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch (e) { return k; }
  }
  function vName(id) { var v = D.virtue(id); return v ? L(v.name) : ''; }
  function saintName(id) { var s = FM ? FM.getSaint(id) : null; return s ? s.name : ''; }
  function saintImg(id, label) {
    if (!FA) return '';
    try { return FA.saintPortrait(id, { label: label || saintName(id) }); } catch (e) { return ''; }
  }
  function ideaFor(v) { var n = E.total(d); return v.ideas[n % v.ideas.length]; }

  // A gentle count line: only ever good news.
  function weekLine(dd, parent) {
    var w = E.thisWeek(dd, today());
    if (parent) {
      // Read by a grown-up: plain counts, no "you".
      if (!w.evenings && !w.top) return '';
      var parts = [T('Esta semana: ' + w.evenings + (w.evenings === 1 ? ' noche' : ' noches') + ' de examen', 'This week: ' + w.evenings + (w.evenings === 1 ? ' evening' : ' evenings') + ' of reflection')];
      if (w.top) parts.push(T('practicó ' + vName(w.top.id).toLowerCase() + ' ' + w.top.n + (w.top.n === 1 ? ' vez' : ' veces') + ' 🌟', 'practised ' + vName(w.top.id).toLowerCase() + ' ' + w.top.n + (w.top.n === 1 ? ' time' : ' times') + ' 🌟'));
      return parts.join(' · ');
    }
    if (w.top) return T('Esta semana practicaste ' + vName(w.top.id).toLowerCase() + ' ' + w.top.n + (w.top.n === 1 ? ' vez' : ' veces') + ' 🌟',
      'This week you practised ' + vName(w.top.id).toLowerCase() + ' ' + w.top.n + (w.top.n === 1 ? ' time' : ' times') + ' 🌟');
    if (w.evenings) return T('Esta semana hiciste el examen ' + w.evenings + (w.evenings === 1 ? ' vez' : ' veces') + '.', 'This week you did the examen ' + w.evenings + (w.evenings === 1 ? ' time' : ' times') + '.');
    return '';
  }
  function streakLine(dd) {
    var n = E.streak(dd, today()), t = E.total(dd);
    if (n >= 2) return T(n + ' noches seguidas 🌙', n + ' evenings in a row 🌙');
    if (t && !E.thisWeek(dd, today()).evenings) return T(t + (t === 1 ? ' noche' : ' noches') + ' de examen', t + (t === 1 ? ' evening' : ' evenings') + ' of reflection');
    return '';
  }

  // ── home ─────────────────────────────────────────────────────
  function renderHome() {
    S.view = 'home';
    lock();
    var done = E.isDone(d, today());
    var hour = new Date().getHours();
    var greet = hour >= EVENING_HOUR || hour < 4 ? T('Buenas noches', 'Good evening') : hour >= 12 ? T('Buenas tardes', 'Good afternoon') : T('Buenos días', 'Good morning');
    var e = E.entry(d, today());
    var h = head('Examen y Virtudes');
    h += '<section class="ex-hero">' + A.hero(T('Una ventana al atardecer, con una vela y un cuaderno', 'A window at dusk, with a candle and a notebook')) +
      '<div class="ex-hero-text"><p class="ex-hello">' + esc(greet + ', ' + firstName(USER.name)) + '</p>' +
      '<p class="ex-lead">' + esc(little() ? T('Miremos el día con Dios: dar gracias y elegir algo bueno para mañana.', 'Let\'s look at the day with God: say thank you and choose something good for tomorrow.')
        : T('Tres minutos para mirar el día con Dios: dar gracias, ver qué salió bien y elegir una virtud para mañana.', 'Three minutes to look back at the day with God: say thank you, see what went well and choose a virtue for tomorrow.')) +
      speakBtn(T('Miremos el día con Dios: dar gracias y elegir algo bueno para mañana.', 'Let\'s look at the day with God: say thank you and choose something good for tomorrow.')) + '</p></div></section>';

    if (done) {
      var v = D.virtue(e.virtue);
      h += '<section class="ex-card ex-tonight">' +
        '<div class="ex-tonight-ic">' + A.icon('moon') + '</div>' +
        '<div><h2 class="ex-h2">' + esc(T('Ya hiciste tu examen de hoy', 'You did tonight\'s examen')) + ' ✓</h2>' +
        (v ? '<p class="ex-note">' + esc(T('Mañana practicas: ', 'Tomorrow you practise: ') + L(v.name)) + '</p>' : '') +
        '<div class="ex-actions"><button type="button" class="ex-btn" data-go="journal">' + esc(T('Ver mi cuaderno', 'See my journal')) + '</button>' +
        '<button type="button" class="ex-btn ex-btn-ghost" data-start="1">' + esc(T('Cambiar algo', 'Change something')) + '</button></div></div></section>';
    } else {
      h += '<div class="ex-start-wrap"><button type="button" class="ex-btn ex-btn-big" data-start="1">' + A.candles(0, 4) +
        '<span>' + esc(T('Comenzar el examen', 'Start the examen')) + '</span><small>' + esc(T('4 pasos y una oración · 3 minutos', '4 steps and a prayer · 3 minutes')) + '</small></button></div>';
      if (hour < EVENING_HOUR && hour >= 4) h += '<p class="ex-note ex-center">' + esc(T('El examen es para el final del día. Si tu día ya terminó, puedes empezar ahora.', 'The examen is for the end of the day. If your day is done, you can start now.')) + '</p>';
    }

    var wl = weekLine(d), sl = streakLine(d);
    if (wl || sl) h += '<p class="ex-week" role="status">' + esc([sl, wl].filter(Boolean).join(' · ')) + '</p>';

    h += '<nav class="ex-menu" aria-label="' + esc(T('Más', 'More')) + '">' +
      '<button type="button" class="ex-menu-b" data-go="journal">' + A.icon('journal') + '<span>' + esc(T('Mi cuaderno', 'My journal')) + '</span></button>' +
      '<button type="button" class="ex-menu-b" data-go="virtues">' + A.virtue('gratitud') + '<span>' + esc(T('Las virtudes', 'The virtues')) + '</span></button>' +
      '</nav>';

    var ig = D.IGNATIUS;
    h += '<aside class="ex-card ex-ignatius">' + '<div class="ex-ig-pic">' + saintImg(ig.saint) + '</div>' +
      '<p>' + esc(L(ig.t)) + '</p></aside>';
    h += '<p class="ex-private">' + A.icon('lock') + '<span>' + esc(T('Tu cuaderno es tuyo. Solo tus papás pueden verlo, con su PIN.', 'Your journal is yours. Only your parents can see it, with their PIN.')) + '</span></p>' +
      '<div class="ex-center"><button type="button" class="ex-link" data-go="parents">' + esc(T('Para papás', 'For parents')) + '</button></div>';
    render(h);
    autoSay(T('Buenas noches. Miremos el día con Dios.', 'Good evening. Let\'s look back at the day with God.'));
  }

  // ── the reflection ───────────────────────────────────────────
  function startFlow() {
    S.draft = freshDraft();
    S.flow = [];
    S.pending = E.pendingCheck(d, today());
    if (S.pending) S.flow.push('check');
    S.flow.push('thanks', 'happy', 'better', 'virtue', 'prayer');
    S.step = 0;
    S.view = 'flow';
    S.checkAnswer = null;
    renderFlow();
  }
  function stepId() { return S.flow[S.step]; }
  function stepNo() { var i = ['thanks', 'happy', 'better', 'virtue'].indexOf(stepId()); return i; }

  function renderFlow() {
    var id = stepId();
    if (id === 'check') return renderCheck();
    if (id === 'prayer') return renderPrayer();
    if (id === 'virtue') return renderVirtueStep();
    return renderPickStep(id);
  }
  function progress() {
    var n = stepNo(), lit = n < 0 ? (stepId() === 'prayer' ? 4 : 0) : n + 1;
    return '<div class="ex-progress">' + A.candles(lit, 4, T('Paso ' + Math.min(4, lit) + ' de 4', 'Step ' + Math.min(4, lit) + ' of 4')) + '</div>';
  }
  function nav(nextLabel, nextOk) {
    return '<div class="ex-flow-nav">' +
      '<button type="button" class="ex-btn ex-btn-ghost" data-prev="1">' + esc(S.step === 0 ? T('Salir', 'Leave') : T('Atrás', 'Back')) + '</button>' +
      '<button type="button" class="ex-btn" data-next="1"' + (nextOk === false ? ' disabled' : '') + '>' + esc(nextLabel || T('Siguiente', 'Next')) + ' ›</button></div>';
  }

  function renderCheck() {
    var v = D.virtue(S.pending.virtue);
    var q = T('La última vez elegiste ' + L(v.name).toLowerCase() + '. ¿Pudiste practicarla?', 'Last time you chose ' + L(v.name).toLowerCase() + '. Did you get to practise it?');
    var h = head(T('Antes de empezar', 'Before we start'), null) +
      '<section class="ex-card ex-check">' +
        '<div class="ex-check-medal">' + A.virtue(v.id, L(v.name)) + '</div>' +
        '<h2 class="ex-h2">' + esc(q) + speakBtn(q) + '</h2>' +
        '<div class="ex-did" role="group" aria-label="' + esc(q) + '">' +
          D.DID.map(function(x) {
            return '<button type="button" class="ex-pick ex-did-b' + (S.checkAnswer === x.id ? ' on' : '') + '" data-did="' + x.id + '" aria-pressed="' + (S.checkAnswer === x.id) + '">' +
              A.tile(x.icon, 'did') + '<span>' + esc(L(x.t)) + '</span></button>';
          }).join('') + '</div>' +
        '<p class="ex-reply" id="ex-reply" role="status">' + esc(S.checkAnswer ? didReply(S.checkAnswer) : '') + '</p>' +
      '</section>' + nav(T('Empezar', 'Start'), !!S.checkAnswer);
    render(h);
    autoSay(q);
  }
  function didReply(id) {
    return id === 'yes' ? T('¡Qué bien! Dios se alegra contigo.', 'Well done! God is glad with you.')
      : id === 'little' ? T('¡Cada poquito cuenta!', 'Every little bit counts!')
      : T('No pasa nada. Mañana es un día nuevo, y Dios te ayuda.', 'That\'s all right. Tomorrow is a new day, and God helps you.');
  }

  function renderPickStep(id) {
    var st = D.STEPS[['thanks', 'happy', 'better'].indexOf(id)];
    var list = D.list(st.list), dr = S.draft, picks = dr[id];
    var prompt = little() ? L(st.little) : L(st.ask);
    var h = head(L(st.title), null) + progress() +
      '<section class="ex-card ex-step">' +
        '<p class="ex-ask">' + esc(prompt) + speakBtn(L(st.title) + ' ' + prompt) + '</p>' +
        '<div class="ex-picks" role="group" aria-label="' + esc(L(st.title)) + '">' +
          list.map(function(it) {
            var on = picks.indexOf(it.id) !== -1;
            return '<button type="button" class="ex-pick' + (on ? ' on' : '') + '" data-pick="' + it.id + '" aria-pressed="' + on + '">' +
              A.tile(it.icon, id) + '<span>' + esc(L(it.t)) + '</span></button>';
          }).join('') +
          (id === 'better' ? '<button type="button" class="ex-pick ex-pick-none' + (dr.betterNone ? ' on' : '') + '" data-none="1" aria-pressed="' + !!dr.betterNone + '">' +
            A.tile('sprout', 'did') + '<span>' + esc(L(st.none)) + '</span></button>' : '') +
        '</div>' +
        '<p class="ex-note ex-center">' + esc(T('Elige hasta ' + PICKS + '.', 'Choose up to ' + PICKS + '.')) + '</p>';
    if (!little()) {
      var field = id + 'Text', max = older() ? E.MAX_TEXT : 120;
      h += '<div class="ex-write"><label for="ex-text" class="ex-label">' + esc(older() ? T('Escríbelo con tus palabras (si quieres)', 'Write it in your own words (if you like)') : T('O escríbelo (si quieres)', 'Or write it (if you like)')) + '</label>' +
        (older()
          ? '<textarea id="ex-text" class="ex-text" rows="3" maxlength="' + max + '" placeholder="' + esc(L(st.write)) + '">' + esc(dr[field]) + '</textarea>'
          : '<input id="ex-text" class="ex-text" type="text" maxlength="' + max + '" placeholder="' + esc(L(st.write)) + '" value="' + esc(dr[field]) + '">') +
        '<span class="ex-count" id="ex-count" aria-live="polite">' + (dr[field] || '').length + ' / ' + max + '</span></div>';
    }
    if (id === 'thanks') h += drawBlock();
    h += '</section>' + nav();
    render(h, function(r) {
      var t = $('#ex-text', r);
      if (t) t.addEventListener('input', function() { S.draft[id + 'Text'] = t.value; var c = $('#ex-count', r); if (c) c.textContent = t.value.length + ' / ' + t.maxLength; });
      if (id === 'thanks') bindPad(r);
    });
    autoSay(L(st.title) + ' ' + prompt);
  }

  // A small drawing pad on the "thank you" step.
  function drawBlock() {
    var has = !!S.draft.draw;
    return '<div class="ex-drawwrap">' +
      '<button type="button" class="ex-btn ex-btn-ghost ex-draw-open" data-draw-open="1" aria-expanded="false">' + A.icon('brush') + '<span>' + esc(has ? T('Cambiar mi dibujo', 'Change my drawing') : T('Hacer un dibujo', 'Make a drawing')) + '</span></button>' +
      (has ? '<img class="ex-drawn" src="' + esc(S.draft.draw) + '" alt="' + esc(T('Tu dibujo', 'Your drawing')) + '">' : '') +
      '<div class="ex-pad" id="ex-pad" hidden>' +
        '<canvas id="ex-canvas" class="ex-canvas" aria-label="' + esc(T('Zona para dibujar', 'Drawing area')) + '" role="img"></canvas>' +
        '<div class="ex-inks" role="group" aria-label="' + esc(T('Colores', 'Colours')) + '">' +
          ['#3b2a4a', '#d23c4a', '#e8a01e', '#3d8a3a', '#2f6fb8', '#8a4f8f'].map(function(c, i) {
            return '<button type="button" class="ex-ink' + (i === 0 ? ' on' : '') + '" data-ink="' + c + '" style="background:' + c + '" aria-label="' + esc(T('Color', 'Colour') + ' ' + (i + 1)) + '" aria-pressed="' + (i === 0) + '"></button>';
          }).join('') +
          '<button type="button" class="ex-btn ex-btn-ghost ex-btn-sm" data-pad-clear="1">' + esc(T('Borrar', 'Clear')) + '</button>' +
          '<button type="button" class="ex-btn ex-btn-sm" data-pad-save="1">' + esc(T('Guardar', 'Save')) + '</button>' +
        '</div></div></div>';
  }
  var pad = null;
  function bindPad(r) {
    var open = $('[data-draw-open]', r);
    open.addEventListener('click', function() {
      var p = $('#ex-pad', r);
      if (!p.hidden) return;
      p.hidden = false; open.setAttribute('aria-expanded', 'true');
      var c = $('#ex-canvas', r), dpr = (typeof ZsCanvas !== 'undefined') ? ZsCanvas.dpr() : 1;
      var w = Math.min(520, c.parentNode.clientWidth || 300), h = Math.round(w * 0.6);
      c.style.width = w + 'px'; c.style.height = h + 'px';
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      var ctx = (typeof ZsCanvas !== 'undefined') ? ZsCanvas.get2d(c) : c.getContext('2d');
      if (!ctx) { p.hidden = true; toast(T('No se pudo abrir el dibujo', 'The drawing could not open')); return; }
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#fffdf7'; ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#3b2a4a';
      if (S.draft.draw) { var img = new Image(); img.onload = function() { ctx.drawImage(img, 0, 0, w, h); }; img.src = S.draft.draw; }
      pad = { c: c, ctx: ctx, w: w, h: h, down: false, dirty: false };
      function pt(ev) { var b = c.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; }
      c.addEventListener('pointerdown', function(ev) { ev.preventDefault(); try { c.setPointerCapture(ev.pointerId); } catch (e) {} pad.down = true; var p0 = pt(ev); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p0[0] + 0.1, p0[1] + 0.1); ctx.stroke(); pad.dirty = true; });
      c.addEventListener('pointermove', function(ev) { if (!pad.down) return; var p1 = pt(ev); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(n) { c.addEventListener(n, function() { pad.down = false; }); });
    });
  }
  function padSave() {
    if (!pad) return;
    // Stored small (240 × 144) so the synced journal stays light.
    var out = document.createElement('canvas'); out.width = 240; out.height = 144;
    var o = (typeof ZsCanvas !== 'undefined') ? ZsCanvas.get2d(out) : out.getContext('2d');
    if (o) { o.fillStyle = '#fffdf7'; o.fillRect(0, 0, 240, 144); o.drawImage(pad.c, 0, 0, 240, 144); S.draft.draw = out.toDataURL('image/jpeg', 0.7); }
    if (typeof ZsCanvas !== 'undefined') ZsCanvas.release(out);
    sfx('click'); toast(T('Dibujo guardado', 'Drawing saved'));
    pad = null;
    renderFlow();
  }

  function renderVirtueStep() {
    var dr = S.draft, st = D.STEPS[3];
    var sugg = {};
    dr.better.forEach(function(b) { var it = D.item('BETTER', b); if (it) sugg[it.virtue] = true; });
    var prompt = little() ? L(st.little) : L(st.ask);
    var h = head(L(st.title), null) + progress() +
      '<section class="ex-card ex-step">' +
        '<p class="ex-ask">' + esc(prompt) + speakBtn(L(st.title) + ' ' + prompt) + '</p>' +
        '<div class="ex-virtues" role="radiogroup" aria-label="' + esc(L(st.title)) + '">' +
          D.VIRTUES.map(function(v) {
            var on = dr.virtue === v.id;
            return '<button type="button" role="radio" class="ex-vpick' + (on ? ' on' : '') + (sugg[v.id] ? ' sugg' : '') + '" data-virtue="' + v.id + '" aria-checked="' + on + '">' +
              A.virtue(v.id) + '<span class="ex-vname">' + esc(L(v.name)) + '</span>' +
              (sugg[v.id] ? '<i class="ex-sugg">' + esc(T('Te ayuda', 'Helps you')) + '</i>' : '') + '</button>';
          }).join('') + '</div>';
    var v = D.virtue(dr.virtue);
    if (v) h += virtueCard(v, false);
    h += '</section>' + nav(T('Rezar', 'Pray'), !!v);
    render(h);
    autoSay(L(st.title) + ' ' + prompt);
  }

  // The card for one virtue: what it is, its saint, an idea for tomorrow.
  function virtueCard(v, full) {
    var s = FM ? FM.getSaint(v.saint) : null, idea = ideaFor(v);
    var text = L(v.name) + '. ' + (little() ? L(v.little) : L(v.desc)) + ' ' + L(v.why) + ' ' + T('Mañana puedes: ', 'Tomorrow you could: ') + L(idea);
    return '<article class="ex-vcard" style="--v:' + v.color + '" aria-live="polite">' +
      '<div class="ex-vcard-top"><div class="ex-vcard-medal">' + A.virtue(v.id, L(v.name)) + '</div>' +
        '<div><h3 class="ex-h3">' + esc(L(v.name)) + speakBtn(text) + '</h3><p>' + esc(little() ? L(v.little) : L(v.desc)) + '</p></div></div>' +
      (s ? '<div class="ex-saint"><div class="ex-saint-pic">' + saintImg(v.saint) + '</div>' +
        '<div><p class="ex-saint-name">' + esc(s.name) + ' <small>(' + esc(s.dates) + ')</small></p><p>' + esc(L(v.why)) + '</p>' +
        (full ? '<a class="ex-link" href="fe-explorador.html?saint=' + encodeURIComponent(v.saint) + '">' + esc(T('Conocer a ' + s.name + ' en Fe Explorador', 'Meet ' + s.name + ' in Fe Explorador')) + ' ›</a>' : '') +
        '</div></div>' : '') +
      (full
        ? '<h4 class="ex-h4">' + esc(T('Cómo practicarla', 'How to practise it')) + '</h4><ul class="ex-ideas">' + v.ideas.map(function(i) { return '<li>' + esc(L(i)) + '</li>'; }).join('') + '</ul>'
        : '<p class="ex-idea"><b>' + esc(T('Mañana puedes:', 'Tomorrow you could:')) + '</b> ' + esc(L(idea)) + '</p>') +
      '</article>';
  }

  function renderPrayer() {
    var dr = S.draft, ids = D.PRAYERS;
    if (!dr.prayer) dr.prayer = ids[0];
    var p = FM ? FM.getPrayer(dr.prayer) : null;
    var h = head(T('Una oración para terminar', 'A prayer to finish'), null) + progress() +
      '<section class="ex-card ex-prayer">' +
        '<div class="ex-seg ex-seg-wide" role="group" aria-label="' + esc(T('Elige la oración', 'Choose the prayer')) + '">' +
          ids.map(function(id) {
            var q = FM ? FM.getPrayer(id) : null;
            return q ? '<button type="button" class="ex-segb' + (dr.prayer === id ? ' on' : '') + '" data-prayer="' + id + '" aria-pressed="' + (dr.prayer === id) + '">' + esc(q.title) + '</button>' : '';
          }).join('') + '</div>';
    if (p) {
      h += '<div class="ex-holy">' + (FA && FA.prayerVignette ? FA.prayerVignette(p.id) : '') +
        '<h2 class="ex-h2 ex-center">' + esc(p.title) + speakBtn(p.lines.join(' '), 'es') + '</h2>' +
        '<div class="ex-lines" lang="es">' + p.lines.map(function(l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div></div>' +
        (S.lang === 'en' ? '<p class="ex-note ex-center">' + esc('We pray it in Spanish, just as in Fe Explorador.') + '</p>' : '');
    }
    h += '</section>' +
      '<div class="ex-flow-nav"><button type="button" class="ex-btn ex-btn-ghost" data-prev="1">' + esc(T('Atrás', 'Back')) + '</button>' +
      '<button type="button" class="ex-btn ex-btn-amen" data-finish="1">' + esc(T('Amén', 'Amen')) + ' ✓</button></div>';
    render(h);
  }

  function finish() {
    var k = today();
    if (S.pending && S.checkAnswer) E.answerCheck(d, S.pending.day, S.checkAnswer, k);
    var r = E.saveEntry(d, k, S.draft, Date.now());
    d.lang = S.lang;
    save();
    S.earned = r.first;
    // The star counter in the top bar (nav.js) is drawn once per page.
    try { var sc = document.getElementById('zs-star-count'); if (sc && typeof getTotalStars === 'function') sc.textContent = '⭐ ' + getTotalStars(); } catch (e) {}
    if (r.first) {
      sfx('cheer');
      try { if (typeof ActivityLog !== 'undefined') ActivityLog.log('Examen y Virtudes', '🙏', 'Ganó una estrella: terminó su examen de la noche'); } catch (e) {}
    } else sfx('click');
    go('done');
  }

  function renderDone() {
    var e = E.entry(d, today()), v = e ? D.virtue(e.virtue) : null;
    var h = head(T('Buenas noches', 'Good night'), 'home') +
      '<section class="ex-hero ex-night">' + A.night(T('El cielo de noche, con la luna y una casa con la luz encendida', 'The night sky, with the moon and a house with its light on')) +
        '<div class="ex-hero-text"><p class="ex-hello">' + esc(T('Que descanses, ', 'Sleep well, ') + firstName(USER.name)) + '</p>' +
        '<p class="ex-lead">' + esc(T('Dios te acompaña esta noche y mañana.', 'God is with you tonight and tomorrow.')) + '</p></div></section>';
    if (S.earned) h += '<p class="ex-earned" role="status"><span class="ex-star" aria-hidden="true">★</span> ' + esc(T('¡Ganaste una estrella!', 'You earned a star!')) + '</p>';
    var lines = [streakLine(d), weekLine(d)].filter(Boolean);
    if (lines.length) h += '<p class="ex-week" role="status">' + esc(lines.join(' · ')) + '</p>';
    if (v) h += '<section class="ex-card"><h2 class="ex-h2">' + esc(T('Mañana practicas…', 'Tomorrow you practise…')) + '</h2>' + virtueCard(v, true) + '</section>';
    h += '<div class="ex-actions ex-center"><button type="button" class="ex-btn" data-go="journal">' + esc(T('Ver mi cuaderno', 'See my journal')) + '</button>' +
      '<a class="ex-btn ex-btn-ghost" href="index.html">' + esc(T('Volver a las apps', 'Back to the apps')) + '</a></div>';
    render(h);
    autoSay(T('Que descanses. Dios te acompaña.', 'Sleep well. God is with you.'));
  }

  // ── journal ──────────────────────────────────────────────────
  function entryCard(e, k) {
    var parts = '';
    function row(listName, ids, text, title) {
      if (!(ids && ids.length) && !text) return '';
      return '<div class="ex-jrow"><h4 class="ex-h4">' + esc(title) + '</h4>' +
        (ids && ids.length ? '<div class="ex-jpics">' + ids.map(function(id) {
          var it = D.item(listName, id);
          return it ? '<span class="ex-jpic">' + A.tile(it.icon, listName.toLowerCase()) + esc(L(it.t)) + '</span>' : '';
        }).join('') + '</div>' : '') +
        (text ? '<p class="ex-jtext">' + esc(text) + '</p>' : '') + '</div>';
    }
    parts += row('THANKS', e.thanks, e.thanksText, L(D.STEPS[0].title));
    if (e.draw) parts += '<img class="ex-drawn" src="' + esc(e.draw) + '" alt="' + esc(T('Dibujo de agradecimiento', 'Thank-you drawing')) + '">';
    parts += row('HAPPY', e.happy, e.happyText, L(D.STEPS[1].title));
    parts += row('BETTER', e.better, e.betterText, L(D.STEPS[2].title));
    var v = D.virtue(e.virtue);
    if (v) {
      var did = e.did ? D.DID.filter(function(x) { return x.id === e.did; })[0] : null;
      parts += '<div class="ex-jvirtue"><span class="ex-jmedal">' + A.virtue(v.id, L(v.name)) + '</span><span>' + esc(T('Para el día siguiente: ', 'For the next day: ') + L(v.name)) +
        (did && e.did !== 'notyet' ? ' · ' + esc(L(did.t)) + (e.did === 'yes' ? ' 🌟' : ' 🌱') : '') + '</span></div>';
    }
    var dl = dateLabel(k, true);
    return '<article class="ex-entry"><h3 class="ex-h3">' + esc(dl.charAt(0).toUpperCase() + dl.slice(1)) + '</h3>' + parts + '</article>';
  }
  function journalBody(dd, showAll, parent) {
    var keys = E.days(dd).filter(function(k) { return dd.entries[k].done; }).reverse();
    var h = '';
    var wl = weekLine(dd, parent), sl = '';
    var n = E.streak(dd, today()), t = E.total(dd);
    sl = n >= 2 ? T(n + ' noches seguidas', n + ' evenings in a row') : '';
    h += '<div class="ex-jstats">' +
      '<div class="ex-stat"><b>' + t + '</b><span>' + esc(T('noches de examen', 'evenings of reflection')) + '</span></div>' +
      (sl ? '<div class="ex-stat"><b>' + n + '</b><span>' + esc(T('seguidas', 'in a row')) + '</span></div>' : '') + '</div>';
    if (wl) h += '<p class="ex-week" role="status">' + esc(wl) + '</p>';
    if (!keys.length) return h + '<p class="ex-empty">' + esc(T('Aquí aparecerán tus noches de examen.', 'Your evenings of reflection will show up here.')) + '</p>';
    var shown = showAll ? keys : keys.slice(0, 14);
    h += shown.map(function(k) { return entryCard(dd.entries[k], k); }).join('');
    if (shown.length < keys.length) h += '<div class="ex-center"><button type="button" class="ex-btn ex-btn-ghost" data-more="1">' + esc(T('Ver más', 'Show more')) + '</button></div>';
    return h;
  }
  function renderJournal() {
    S.view = 'journal';
    var h = head(T('Mi cuaderno', 'My journal'), 'home') +
      '<p class="ex-private">' + A.icon('lock') + '<span>' + esc(T('Solo tú y tus papás pueden ver este cuaderno.', 'Only you and your parents can see this journal.')) + '</span></p>' +
      '<div class="ex-journal">' + journalBody(d, S.showAll) + '</div>';
    render(h);
  }

  // ── the virtues ──────────────────────────────────────────────
  function renderVirtues() {
    S.view = 'virtues';
    var counts = {};
    E.days(d).forEach(function(k) { var e = d.entries[k]; if (e.virtue && (e.did === 'yes' || e.did === 'little')) counts[e.virtue] = (counts[e.virtue] || 0) + 1; });
    var h = head(T('Las virtudes', 'The virtues'), 'home') +
      '<p class="ex-lead ex-pad-x">' + esc(T('Una virtud es un hábito bueno: se hace fuerte cuando la practicas.', 'A virtue is a good habit: it grows strong when you practise it.')) + '</p>' +
      '<div class="ex-virtues ex-virtues-browse">' + D.VIRTUES.map(function(v) {
        return '<button type="button" class="ex-vpick" data-browse="' + v.id + '">' + A.virtue(v.id) + '<span class="ex-vname">' + esc(L(v.name)) + '</span>' +
          '<span class="ex-vsaint">' + esc(saintName(v.saint)) + '</span>' +
          (counts[v.id] ? '<i class="ex-sugg">' + esc(counts[v.id] + ' 🌟') + '</i>' : '') + '</button>';
      }).join('') + '</div>';
    render(h);
  }
  function renderVirtue(id) {
    var v = D.virtue(id);
    if (!v) return go('virtues');
    S.view = 'virtue';
    render(head(L(v.name), 'virtues') + '<section class="ex-card">' + virtueCard(v, true) + '</section>');
  }

  // ── parents (behind the PIN) ─────────────────────────────────
  // The PIN opens the parents' view once. The unlock lives in memory only and
  // ends when the view is left or the page goes away, so on a shared iPad the
  // next kid in the same tab is asked for the PIN again.
  function pinOk() { return S.unlocked === true; }
  function lock() { S.unlocked = false; }
  function askPin() {
    if (pinOk()) return go('parents');
    if (typeof ZsDialog === 'undefined' || !ZsDialog.prompt) return;
    ZsDialog.prompt({ title: T('Para papás', 'For parents'), message: T('Escribe el PIN de un adulto para ver los cuadernos.', 'Enter a parent PIN to see the journals.'),
      inputType: 'password', inputMode: 'numeric', placeholder: 'PIN', label: 'PIN', confirmLabel: 'OK', cancelLabel: T('Cancelar', 'Cancel') }).then(function(val) {
      if (val == null) return;
      var pin = (typeof getParentPin === 'function') ? getParentPin() : null;
      if (pin && String(val).trim() === String(pin)) {
        S.unlocked = true;
        go('parents');
        // Fetch the other kids' journals from the family server, if it is there.
        try {
          if (typeof CloudSync !== 'undefined' && CloudSync.online && CloudSync.pullAllKids) {
            var p = CloudSync.pullAllKids();
            if (p && typeof p.then === 'function') p.then(function() { if (S.view === 'parents') renderParents(); });
          }
        } catch (e) {}
      }
      else toast(T('PIN incorrecto', 'Wrong PIN'));
    });
  }
  function kidBlob(name) {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(E.PREFIX + String(name).toLowerCase().replace(/\s+/g, '_'))); } catch (e) {}
    return E.migrate(raw);
  }
  function renderParents() {
    if (!pinOk()) { S.view = 'home'; renderHome(); return askPin(); }
    S.view = 'parents';
    var kids = (typeof getProfiles === 'function') ? (getProfiles() || []) : [USER];
    if (!S.parentKid || !kids.some(function(k) { return k.name === S.parentKid; })) S.parentKid = (kids[0] || USER).name;
    var h = head(T('Para papás', 'For parents'), 'home') +
      '<p class="ex-note ex-pad-x">' + esc(T('Los cuadernos de los niños, solo para leer. El informe del domingo muestra solo cuántas noches y qué virtudes, nunca lo que escribieron.', 'The kids\' journals, read only. The Sunday Report shows only how many evenings and which virtues, never what they wrote.')) + '</p>' +
      '<div class="ex-seg ex-seg-wide" role="group" aria-label="' + esc(T('Niño', 'Kid')) + '">' +
        kids.map(function(k) { return '<button type="button" class="ex-segb' + (k.name === S.parentKid ? ' on' : '') + '" data-kid="' + esc(k.name) + '" aria-pressed="' + (k.name === S.parentKid) + '">' + esc(k.name) + '</button>'; }).join('') +
      '</div><div class="ex-journal">' + journalBody(kidBlob(S.parentKid), true, true) + '</div>';
    render(h);
  }

  // ── events ───────────────────────────────────────────────────
  function onClick(ev) {
    var b = ev.target.closest('button, a');
    if (!b || b.disabled || !root().contains(b)) return;
    var ds = b.dataset;
    if (ds.say !== undefined) { say(ds.say, ds.lang); return; }
    if (ds.langSet) { S.lang = ds.langSet; d.lang = S.lang; save(); sfx('click'); draw(); return; }
    if (ds.go) { sfx('click'); if (ds.go === 'parents') return askPin(); S.showAll = false; return go(ds.go); }
    if (ds.start) { sfx('click'); return startFlow(); }
    if (ds.more) { S.showAll = true; return renderJournal(); }
    if (ds.browse) { sfx('click'); S.browse = ds.browse; return go('virtue'); }
    if (ds.kid) { S.parentKid = ds.kid; return renderParents(); }
    if (ds.did) { S.checkAnswer = ds.did; sfx(ds.did === 'yes' ? 'correct' : 'click'); return renderCheck(); }
    if (ds.pick) {
      var id = stepId(), arr = S.draft[id], i = arr.indexOf(ds.pick);
      if (i !== -1) arr.splice(i, 1);
      else { if (arr.length >= PICKS) arr.shift(); arr.push(ds.pick); }
      if (id === 'better') S.draft.betterNone = false;
      sfx('click');
      var it = D.item(id === 'thanks' ? 'THANKS' : id === 'happy' ? 'HAPPY' : 'BETTER', ds.pick);
      if (it && i === -1 && ttsMode() === 'auto') say(L(it.t));
      return keepText(renderFlow);
    }
    if (ds.none) { S.draft.better = []; S.draft.betterNone = !S.draft.betterNone; sfx('click'); return keepText(renderFlow); }
    if (ds.virtue) { S.draft.virtue = ds.virtue; sfx('click'); renderFlow(); var c = $('.ex-vcard'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (ds.prayer) { S.draft.prayer = ds.prayer; sfx('click'); return renderPrayer(); }
    if (ds.ink && pad) { pad.ctx.strokeStyle = ds.ink; $all('.ex-ink').forEach(function(x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); return; }
    if (ds.padClear && pad) { pad.ctx.fillStyle = '#fffdf7'; pad.ctx.fillRect(0, 0, pad.w, pad.h); S.draft.draw = ''; return; }
    if (ds.padSave) return keepText(padSave);
    if (ds.next) { sfx('click'); return keepText(function() { S.step = Math.min(S.flow.length - 1, S.step + 1); renderFlow(); }); }
    if (ds.prev) {
      sfx('click');
      return keepText(function() { if (S.step === 0) { pad = null; go('home'); } else { S.step--; renderFlow(); } });
    }
    if (ds.finish) return finish();
  }
  // Text typed in the step's field is kept when the screen redraws.
  function keepText(fn) {
    var t = $('#ex-text', root()), id = stepId();
    if (t && S.view === 'flow' && S.draft) S.draft[id + 'Text'] = t.value;
    fn();
  }

  function init() {
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try {
        var k = key();
        var p = CloudSync.pull(k);
        if (p && typeof p.then === 'function') p.then(function() { d = load(); if (S.view === 'home' || S.view === 'journal') draw(); });
      } catch (e) {}
    }
    root().addEventListener('click', onClick);
    window.addEventListener('pagehide', lock);
    document.addEventListener('visibilitychange', function() { if (document.hidden && S.view === 'parents') { lock(); go('home'); } });
    try { sessionStorage.removeItem('zs_examen_pin_ok'); } catch (e) {}   // an unlock an older version kept
    renderHome();
  }

  window.ExamenUI = { state: S, go: go, start: startFlow, reload: function() { d = load(); draw(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
