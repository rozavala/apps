/* =====================================================================
   PATRÓN DE LANCHA DEPORTIVA — motor de estudio (js/patron-lancha.js)
   Aprender · Practicar · Repaso espaciado · Examen simulado · Progreso

   Datos guardados en localStorage (zs_patron_<usuario>, sincronizado):
     read{modId:true}   módulo abierto/leído          (desde v1)
     best{modId:%}      mejor % en práctica de 1 tema (desde v1)
     examBest, examCount                              (desde v1)
     answered, correct  totales de preguntas          (desde v1)
     q{"mod:i":{n,c,l,b,d}}  por pregunta (NUEVO): intentos, aciertos,
                        último resultado (1/0), caja de repaso (0 = fuera
                        del repaso, 1..5) y día en que vuelve a tocar.
     exams[]            historial de exámenes (NUEVO, últimos 30):
                        {t, p, c, n, s, m:{modId:[aciertos,total]}}
   ===================================================================== */
(function(){
  'use strict';

  var MODULES = window.PL_MODULES || [];
  var FIGS = window.PL_FIGS || {};
  var ART = window.PLArt;

  var EXAM_N = 20, EXAM_PASS = 70, EXAM_SECONDS = 30 * 60;
  var BOX_DAYS = [0, 0, 1, 3, 7, 14];          // caja → días hasta el siguiente repaso
  var REVIEW_MAX = 20;

  /* ---------------- question index ---------------- */
  var ALLQ = [], QBYID = {};
  MODULES.forEach(function(m){
    m.questions.forEach(function(q, i){
      var o = { id: m.id + ':' + i, mod: m.id, cat: m.title, q: q.q, o: q.o, a: q.a, e: q.e };
      ALLQ.push(o); QBYID[o.id] = o;
    });
  });
  function modById(id){ for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === id) return MODULES[i]; return null; }
  function qsOf(modId){ return ALLQ.filter(function(q){ return q.mod === modId; }); }

  /* ===================================================================
     ESTADO / PERSISTENCIA
     =================================================================== */
  var STORE_PREFIX = 'zs_patron_';       // clave por perfil: zs_patron_<usuario>
  var LEGACY_KEY   = 'pl_patron_v1';     // clave global antigua (se migra 1 vez)

  function storageKey(){
    return (typeof getUserAppKey === 'function' && getUserAppKey(STORE_PREFIX)) || (STORE_PREFIX + 'default');
  }
  function defaultState(){ return { read: {}, best: {}, examBest: 0, examCount: 0, answered: 0, correct: 0, q: {}, exams: [] }; }
  function normalize(s){
    var d = defaultState();
    Object.keys(s || {}).forEach(function(k){ d[k] = s[k]; });
    if (!d.read || typeof d.read !== 'object') d.read = {};
    if (!d.best || typeof d.best !== 'object') d.best = {};
    if (!d.q || typeof d.q !== 'object') d.q = {};
    if (!Array.isArray(d.exams)) d.exams = [];
    ['examBest', 'examCount', 'answered', 'correct'].forEach(function(k){ d[k] = +d[k] || 0; });
    return d;
  }
  function loadState(){
    var key = storageKey();
    try { var s = JSON.parse(localStorage.getItem(key)); if (s) return normalize(s); } catch (e) {}
    // Migración única: el primer perfil que abra la app hereda el progreso
    // global antiguo; luego se elimina para que otros perfiles empiecen limpios.
    try {
      var old = JSON.parse(localStorage.getItem(LEGACY_KEY));
      if (old){
        localStorage.setItem(key, JSON.stringify(old));
        localStorage.removeItem(LEGACY_KEY);
        return normalize(old);
      }
    } catch (e) {}
    return defaultState();
  }
  function saveState(){
    var key = storageKey();
    try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online){ try { CloudSync.push(key); } catch (e) {} }
  }
  var state = loadState();

  /* ---------------- spaced repetition ---------------- */
  function today(){ var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function rec(id){ return state.q[id] || null; }
  // Registers an answer. Returns {was, now} box info.
  function record(id, ok, counted){
    var r = state.q[id] || { n: 0, c: 0, l: 0, b: 0, d: 0 };
    var was = r.b, td = today();
    if (counted !== false){ r.n++; if (ok) r.c++; }
    r.l = ok ? 1 : 0;
    if (!ok){ r.b = 1; r.d = td; }
    else if (r.b > 0 && r.d <= td){
      r.b++;
      if (r.b > 5){ r.b = 0; r.d = 0; } else r.d = td + BOX_DAYS[r.b];
    }
    state.q[id] = r;
    return { was: was, now: r.b, due: r.d };
  }
  function isMastered(id){ var r = rec(id); return !!(r && r.l === 1 && r.b === 0 && r.c > 0); }
  function dueList(){
    var td = today();
    return ALLQ.filter(function(q){ var r = rec(q.id); return r && r.b > 0 && r.d <= td; })
      .sort(function(a, b){ return rec(a.id).b - rec(b.id).b || rec(a.id).d - rec(b.id).d; });
  }
  function inReview(){ return ALLQ.filter(function(q){ var r = rec(q.id); return r && r.b > 0; }); }
  function modStats(modId){
    var qs = qsOf(modId), mast = 0, seen = 0, rev = 0, due = 0, td = today();
    qs.forEach(function(q){ var r = rec(q.id); if (!r) return; if (r.n > 0) seen++; if (isMastered(q.id)) mast++; if (r.b > 0){ rev++; if (r.d <= td) due++; } });
    return { total: qs.length, mastered: mast, seen: seen, review: rev, due: due };
  }

  /* ---------------- helpers ---------------- */
  function $(id){ return document.getElementById(id); }
  function esc(s){ return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Options like "a y c correctas" or "Todas las anteriores" point at other
  // options by position, so those questions keep their original order.
  var POSITIONAL = /\b[a-d] y [a-d]\b|anteriores|todas (son )?correctas|ninguna de/i;
  function orderFor(q){
    var idx = q.o.map(function(_, i){ return i; });
    return q.o.some(function(t){ return POSITIONAL.test(t); }) ? idx : shuffle(idx);
  }
  function shuffle(arr){ var a = arr.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ic(n, cls){ return ART ? ART.icon(n, cls) : ''; }
  function mmss(s){ s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function fmtDay(d){
    var td = today(); if (d <= td) return 'hoy'; if (d === td + 1) return 'mañana';
    var dt = new Date(d * 86400000); var M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return 'el ' + dt.getUTCDate() + ' ' + M[dt.getUTCMonth()];
  }
  function ring(pct, size, col, label, sub){
    var r = size / 2 - 7, C = 2 * Math.PI * r, off = C * (1 - clampPct(pct) / 100);
    return '<div class="pl-ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="pl-ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + col + '" class="pl-ring-fg" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="pl-ring-t"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  }
  function clampPct(p){ return Math.max(0, Math.min(100, p || 0)); }
  function feedback(emoji){
    var f = $('pl-feedback'); if (!f) return;
    $('pl-feedback-emoji').textContent = emoji;
    f.classList.add('show');
    setTimeout(function(){ f.classList.remove('show'); }, 650);
  }

  /* ===================================================================
     APP
     =================================================================== */
  var PL = {
    quiz: null, exam: null, view: 'learn',

    init: function(){
      if (ART) $('pl-emblem').innerHTML = ART.emblem();
      document.querySelectorAll('.pl-tab-ic').forEach(function(s){ s.innerHTML = ic(s.getAttribute('data-ic')); });
      document.querySelectorAll('.pl-tab').forEach(function(t){
        t.addEventListener('click', function(){ PL.showView(t.dataset.view); });
      });
      this.renderModules();
      this.renderPracticeChips();
      $('practice-start').addEventListener('click', function(){ PL.startPractice(); });
      document.querySelectorAll('#practice-count .pl-seg-b').forEach(function(b){
        b.addEventListener('click', function(){
          document.querySelectorAll('#practice-count .pl-seg-b').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        });
      });
      document.addEventListener('keydown', function(ev){ PL.onKey(ev); });
      this.renderExamConfig();
      this.renderReviewHome();
      this.renderProgress();
      this.updateOverall();
    },

    showView: function(v){
      this.view = v;
      document.querySelectorAll('.pl-tab').forEach(function(t){ var on = t.dataset.view === v; t.classList.toggle('active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
      document.querySelectorAll('.pl-view').forEach(function(el){ el.classList.remove('active'); });
      $('view-' + v).classList.add('active');
      if (v === 'progress') this.renderProgress();
      if (v === 'review' && !(this.quiz && this.quiz.opts.mode === 'review')) this.renderReviewHome();
      if (v === 'exam' && !this.exam) this.renderExamConfig();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /* ----------------------- APRENDER ----------------------- */
    renderModules: function(){
      var wrap = $('pl-modules'), core = 0, self = this;
      wrap.innerHTML = MODULES.map(function(m){
        var num = m.complementary ? '' : (++core) + '. ';
        var st = modStats(m.id), pct = Math.round(st.mastered / st.total * 100);
        var read = !!state.read[m.id];
        return '<div class="pl-mod' + (m.complementary ? ' comp' : '') + '" id="mod-' + m.id + '">' +
          '<button type="button" class="pl-mod-head" aria-expanded="false" aria-controls="body-' + m.id + '" data-mod="' + m.id + '">' +
            '<span class="pl-mod-icon">' + ic(m.id) + '</span>' +
            '<span class="pl-mod-info">' +
              '<span class="pl-mod-title">' + num + esc(m.title) +
                (m.complementary ? '<span class="pl-badge">Complementario</span>' : '') +
                (m.official ? '<span class="pl-badge off">Oficial DIRECTEMAR</span>' : '') + '</span>' +
              '<span class="pl-mod-sub">' + esc(m.sub) + '</span>' +
              '<span class="pl-mod-prog"><span class="pl-meter"><i style="width:' + pct + '%"></i></span>' +
                '<span class="pl-mod-meta">' + st.mastered + '/' + st.total + ' dominadas' + (st.due ? ' · <b class="due">' + st.due + ' por repasar</b>' : '') + '</span></span>' +
            '</span>' +
            '<span class="pl-check' + (read ? ' done' : '') + '" id="chk-' + m.id + '" aria-label="' + (read ? 'Leído' : 'Sin leer') + '">' + (read ? '✓' : '') + '</span>' +
            '<span class="pl-mod-chev" aria-hidden="true">›</span>' +
          '</button>' +
          '<div class="pl-mod-body" id="body-' + m.id + '" hidden></div>' +
        '</div>';
      }).join('');
      wrap.querySelectorAll('.pl-mod-head').forEach(function(h){
        h.addEventListener('click', function(){ self.toggleMod(h.getAttribute('data-mod')); });
      });
    },

    fillModBody: function(m){
      var body = $('body-' + m.id);
      if (body.getAttribute('data-filled')) return body;
      var extra = FIGS[m.id] || {};
      var st = modStats(m.id);
      body.innerHTML = m.lessons.map(function(l, i){
        var figs = (extra[i] || []).map(function(id){ return '<div class="pl-fig" data-fig="' + id + '"></div>'; }).join('');
        return '<div class="pl-lesson"><h3>' + esc(l.h) + '</h3>' + l.html + figs + '</div>';
      }).join('') +
        '<div class="pl-mod-actions">' +
          '<button type="button" class="pl-btn" data-act="single">✏️ Practicar este tema (' + m.questions.length + ' preguntas)</button>' +
          (st.review ? '<button type="button" class="pl-btn ghost" data-act="rev">↻ Repasar las falladas (' + st.review + ')</button>' : '') +
        '</div>';
      body.setAttribute('data-filled', '1');
      var self = this;
      body.querySelector('[data-act="single"]').addEventListener('click', function(){ self.startSingle(m.id); });
      var rv = body.querySelector('[data-act="rev"]');
      if (rv) rv.addEventListener('click', function(){ self.startReview(m.id); });
      return body;
    },

    toggleMod: function(id){
      var el = $('mod-' + id), m = modById(id), head = el.querySelector('.pl-mod-head');
      var wasOpen = el.classList.contains('open');
      var body = this.fillModBody(m);
      el.classList.toggle('open', !wasOpen);
      body.hidden = wasOpen;
      head.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
      if (!wasOpen && ART) ART.mount(body);
      if (!wasOpen && !state.read[id]){
        state.read[id] = true; saveState();
        var chk = $('chk-' + id);
        chk.classList.add('done'); chk.textContent = '✓'; chk.setAttribute('aria-label', 'Leído');
        this.updateOverall();
      }
    },

    /* ----------------------- CONFIG PRÁCTICA ----------------------- */
    renderPracticeChips: function(){
      var wrap = $('practice-chips');
      wrap.innerHTML =
        '<button type="button" class="pl-chip on" data-mod="all" aria-pressed="true">🌊 Todos los temas</button>' +
        MODULES.map(function(m){ return '<button type="button" class="pl-chip" data-mod="' + m.id + '" aria-pressed="false">' + ic(m.id) + ' ' + esc(m.title) + '</button>'; }).join('');
      var self = this;
      wrap.querySelectorAll('.pl-chip').forEach(function(c){ c.addEventListener('click', function(){ self.toggleChip(c); }); });
    },
    toggleChip: function(btn){
      var all = document.querySelector('.pl-chip[data-mod="all"]');
      var chips = document.querySelectorAll('#practice-chips .pl-chip');
      if (btn.dataset.mod === 'all'){
        chips.forEach(function(c){ c.classList.remove('on'); });
        btn.classList.add('on');
      } else {
        all.classList.remove('on');
        btn.classList.toggle('on');
        if (!document.querySelector('#practice-chips .pl-chip.on')) all.classList.add('on');
      }
      chips.forEach(function(c){ c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false'); });
    },

    /* ----------------------- INICIAR ----------------------- */
    startSingle: function(id){
      var m = modById(id);
      this.showView('practice');
      document.querySelectorAll('#practice-chips .pl-chip').forEach(function(c){ var on = c.dataset.mod === id; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      $('practice-config').style.display = 'none';
      this.launch(shuffle(qsOf(id)), { mode: 'practice', target: 'practice-runner', pass: 70, title: m.title, single: id });
    },
    startPractice: function(){
      var on = [].slice.call(document.querySelectorAll('#practice-chips .pl-chip.on')).map(function(c){ return c.dataset.mod; });
      var pool = on.indexOf('all') >= 0 ? ALLQ.slice() : ALLQ.filter(function(q){ return on.indexOf(q.mod) >= 0; });
      if ($('practice-unmastered').checked){
        var rest = pool.filter(function(q){ return !isMastered(q.id); });
        if (!rest.length){ if (window.ZsDialog) ZsDialog.toast('¡Ya dominas todas las preguntas de esos temas! 🎉'); return; }
        pool = rest;
      }
      pool = shuffle(pool);
      var nb = document.querySelector('#practice-count .pl-seg-b.on'), n = nb ? +nb.getAttribute('data-n') : 0;
      if (n) pool = pool.slice(0, n);
      var mods = {}; pool.forEach(function(q){ mods[q.mod] = 1; });
      var single = Object.keys(mods).length === 1 && pool.length === qsOf(Object.keys(mods)[0]).length ? Object.keys(mods)[0] : null;
      $('practice-config').style.display = 'none';
      this.launch(pool, { mode: 'practice', target: 'practice-runner', pass: 70, title: 'Práctica', single: single });
    },
    startReview: function(modId, ahead){
      var list = dueList();
      if (ahead){
        list = inReview().sort(function(a, b){ return rec(a.id).d - rec(b.id).d || rec(a.id).b - rec(b.id).b; });
      }
      if (modId) list = (dueList().length ? dueList() : inReview()).filter(function(q){ return q.mod === modId; });
      list = list.slice(0, REVIEW_MAX);
      if (!list.length){ this.showView('review'); return; }
      this.showView('review');
      $('review-home').style.display = 'none';
      this.launch(shuffle(list), { mode: 'review', target: 'review-runner', pass: 70, title: 'Repaso', ahead: !!ahead });
    },

    /* ----------------------- MOTOR DE QUIZ (práctica / repaso) ----------------------- */
    launch: function(questions, opts){
      var prepared = questions.map(function(q){
        var sh = orderFor(q);
        return { id: q.id, mod: q.mod, cat: q.cat, q: q.q, e: q.e, o: sh.map(function(i){ return q.o[i]; }), a: sh.indexOf(q.a) };
      });
      this.quiz = { qs: prepared, i: 0, correct: 0, answers: [], opts: opts, answeredCurrent: false };
      this.renderQuestion();
    },

    renderQuestion: function(){
      var Q = this.quiz, q = Q.qs[Q.i], tgt = $(Q.opts.target);
      Q.answeredCurrent = false;
      var r = rec(q.id), boxTxt = Q.opts.mode === 'review' && r && r.b ? '<span class="pl-qbox">Caja ' + r.b + ' de 5</span>' : '';
      tgt.innerHTML =
        '<div class="pl-panel pl-qpanel">' +
          '<div class="pl-quiz-top"><span>' + esc(Q.opts.title) + ' · Pregunta ' + (Q.i + 1) + ' de ' + Q.qs.length + '</span>' +
            '<span class="score">✓ ' + Q.correct + '</span></div>' +
          '<div class="pl-qbar"><div class="pl-qbar-fill" style="width:' + (Q.i / Q.qs.length * 100) + '%"></div></div>' +
          '<div class="pl-qmeta"><span class="pl-qcat">' + ic(q.mod) + esc(q.cat) + '</span>' + boxTxt + '</div>' +
          '<div class="pl-q" id="pl-qtext">' + esc(q.q) + '</div>' +
          '<div class="pl-opts" id="pl-opts" role="group" aria-labelledby="pl-qtext">' +
            q.o.map(function(op, i){ return '<button type="button" class="pl-opt" data-i="' + i + '"><span class="k">' + String.fromCharCode(65 + i) + '</span><span class="t">' + esc(op) + '</span></button>'; }).join('') +
          '</div>' +
          '<div class="pl-explain" id="pl-explain" aria-live="polite"></div>' +
          '<div class="pl-next" id="pl-next"></div>' +
          '<button type="button" class="pl-quit" id="pl-quit">Terminar aquí</button>' +
        '</div>';
      var self = this;
      tgt.querySelectorAll('.pl-opt').forEach(function(b){ b.addEventListener('click', function(){ self.answer(+b.getAttribute('data-i')); }); });
      $('pl-quit').addEventListener('click', function(){ if (Q.answers.length) self.finish(); else self.exitQuiz(Q.opts.mode); });
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    answer: function(choice){
      var Q = this.quiz;
      if (!Q || Q.answeredCurrent) return;
      Q.answeredCurrent = true;
      var q = Q.qs[Q.i], ok = choice === q.a;
      document.querySelectorAll('#pl-opts .pl-opt').forEach(function(b, i){
        b.disabled = true;
        if (i === q.a) b.classList.add('correct'); else if (i === choice) b.classList.add('wrong');
      });
      if (ok){ Q.correct++; state.correct++; }
      state.answered++;
      var box = record(q.id, ok);
      saveState();
      Q.answers.push({ id: q.id, mod: q.mod, q: q.q, correct: ok, your: q.o[choice], right: q.o[q.a], e: q.e });
      feedback(ok ? '✅' : '📚');
      var note = '';
      if (!ok) note = '<div class="pl-srs-note miss">↻ Pasa a tu repaso (caja 1): volverá hoy mismo.</div>';
      else if (box.was > 0 && box.now === 0) note = '<div class="pl-srs-note up">⭐ Dominada: sale del repaso.</div>';
      else if (box.was > 0 && box.now > box.was) note = '<div class="pl-srs-note up">↑ Sube a la caja ' + box.now + ' · próximo repaso ' + fmtDay(box.due) + '.</div>';
      var ex = $('pl-explain');
      ex.innerHTML = '<b>' + (ok ? '¡Correcto!' : 'Respuesta: ' + esc(q.o[q.a])) + '</b><br>' + esc(q.e) + note;
      ex.classList.add('show');
      var last = Q.i === Q.qs.length - 1, self = this;
      $('pl-next').innerHTML = '<button type="button" class="pl-btn" id="pl-next-b">' + (last ? 'Ver resultado 🏁' : 'Siguiente →') + '</button>';
      $('pl-next-b').addEventListener('click', function(){ self.next(); });
      $('pl-next-b').focus({ preventScroll: true });
      this.updateDueBadge();
    },

    next: function(){
      var Q = this.quiz;
      if (Q.i === Q.qs.length - 1){ this.finish(); return; }
      Q.i++; this.renderQuestion();
    },

    onKey: function(ev){
      if (ev.defaultPrevented || document.querySelector('.zsd-overlay')) return;
      if (ev.target && /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
      var k = ev.key.toUpperCase(), idx = 'ABCD'.indexOf(k); if (idx < 0) idx = '1234'.indexOf(k);
      if (this.exam && this.view === 'exam' && !this.exam.done){
        if (idx >= 0){ this.examPick(idx); ev.preventDefault(); }
        else if (ev.key === 'ArrowRight'){ this.examGo(this.exam.i + 1); }
        else if (ev.key === 'ArrowLeft'){ this.examGo(this.exam.i - 1); }
        return;
      }
      var Q = this.quiz;
      if (!Q || !$(Q.opts.target) || !$(Q.opts.target).offsetParent || !$('pl-opts')) return;
      if (!Q.answeredCurrent && idx >= 0 && idx < Q.qs[Q.i].o.length){ this.answer(idx); ev.preventDefault(); }
      else if (Q.answeredCurrent && ev.key === 'Enter' && document.activeElement && document.activeElement.id !== 'pl-next-b'){ this.next(); ev.preventDefault(); }
    },

    finish: function(){
      var Q = this.quiz, n = Q.answers.length || 1;
      var pct = Math.round(Q.correct / n * 100), pass = pct >= Q.opts.pass;
      if (Q.opts.mode === 'practice' && Q.opts.single && Q.answers.length === Q.qs.length){
        var id = Q.opts.single;
        if (pct > (state.best[id] || 0)) state.best[id] = pct;
      }
      saveState();
      this.updateOverall();
      var misses = Q.answers.filter(function(a){ return !a.correct; });
      var emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⚓' : pct >= 50 ? '💪' : '📚';
      var verdict = pass ? '¡Muy bien!' : 'Sigue repasando';
      var rev = Q.opts.mode === 'review';
      var byMod = breakdown(Q.answers);
      var tgt = $(Q.opts.target), self = this;
      tgt.innerHTML =
        '<div class="pl-panel"><div class="pl-result">' +
          '<div class="big-emoji">' + emoji + '</div><h2>' + esc(Q.opts.title) + '</h2>' +
          ring(pct, 150, pass ? 'var(--green)' : 'var(--red)', pct + '%', Q.correct + '/' + Q.answers.length) +
          '<div class="pl-verdict ' + (pass ? 'pass' : 'fail') + '">' + verdict + '</div>' +
          '<div class="sub">' + (rev ? 'Las que aciertas suben de caja; las que fallas vuelven a la caja 1.' : (misses.length ? misses.length + ' pregunta' + (misses.length > 1 ? 's' : '') + ' pasaron a tu repaso.' : '')) + '</div>' +
        '</div>' +
        (byMod.length > 1 ? '<h3 class="pl-h3">Por tema</h3>' + breakdownHTML(byMod) : '') +
        reviewList(misses) +
        '<div class="pl-row-btns"><button type="button" class="pl-btn" data-a="again">↻ Otra vez</button><button type="button" class="pl-btn ghost" data-a="exit">Salir</button></div>' +
        '</div>';
      tgt.querySelector('[data-a="again"]').addEventListener('click', function(){ self.restart(Q.opts.mode); });
      tgt.querySelector('[data-a="exit"]').addEventListener('click', function(){ self.exitQuiz(Q.opts.mode); });
      this.quiz = null;
      this.refreshBadges();
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    restart: function(mode){
      if (mode === 'review'){ this.exitQuiz('review'); this.startReview(); return; }
      $('practice-runner').innerHTML = ''; $('practice-config').style.display = ''; this.showView('practice');
    },
    exitQuiz: function(mode){
      this.quiz = null;
      if (mode === 'review'){ $('review-runner').innerHTML = ''; $('review-home').style.display = ''; this.renderReviewHome(); }
      else { $('practice-runner').innerHTML = ''; $('practice-config').style.display = ''; }
      this.refreshBadges();
    },

    /* ----------------------- REPASO (Leitner) ----------------------- */
    renderReviewHome: function(){
      var el = $('review-home'), due = dueList(), all = inReview(), td = today(), self = this;
      var boxes = [0, 0, 0, 0, 0];
      all.forEach(function(q){ boxes[rec(q.id).b - 1]++; });
      var mastered = ALLQ.filter(function(q){ return isMastered(q.id); }).length;
      var unseen = ALLQ.filter(function(q){ var r = rec(q.id); return !r || !r.n; }).length;
      var nextDue = all.map(function(q){ return rec(q.id).d; }).filter(function(d){ return d > td; }).sort(function(a, b){ return a - b; })[0];
      var maxB = Math.max.apply(null, boxes.concat([1]));
      el.innerHTML =
        '<div class="pl-panel">' +
          '<h2>Repaso espaciado</h2>' +
          '<p class="lead">Cada pregunta que fallas entra en la <b>caja 1</b>. Si la aciertas cuando le toca, sube de caja y vuelve más tarde (1, 3, 7 y 14 días). Al acertar en la caja 5 queda <b>dominada</b>. Si la fallas, vuelve a la caja 1.</p>' +
          '<div class="pl-boxes" role="img" aria-label="Preguntas por caja: ' + boxes.join(', ') + '">' +
            boxes.map(function(n, i){
              return '<div class="pl-box"><div class="pl-box-stack"><i style="height:' + Math.round(n / maxB * 100) + '%"></i></div>' +
                '<b>' + n + '</b><span>Caja ' + (i + 1) + '</span><small>' + (i === 0 ? 'hoy' : BOX_DAYS[i + 1] + ' d') + '</small></div>';
            }).join('') +
            '<div class="pl-box done"><div class="pl-box-stack"><i style="height:' + Math.round(Math.min(1, mastered / Math.max(1, ALLQ.length)) * 100) + '%"></i></div><b>' + mastered + '</b><span>Dominadas</span><small>de ' + ALLQ.length + '</small></div>' +
          '</div>' +
          (due.length
            ? '<div class="pl-due"><b>' + due.length + '</b> pregunta' + (due.length > 1 ? 's' : '') + ' por repasar hoy.</div><button type="button" class="pl-btn" id="rv-go">Repasar ahora (' + Math.min(due.length, REVIEW_MAX) + ')</button>'
            : '<div class="pl-due ok">' + (all.length ? 'Nada pendiente hoy 🎉. Próximo repaso ' + fmtDay(nextDue) + '.' : 'Tu repaso está vacío: las preguntas que falles aparecerán aquí.') + '</div>' +
              (all.length ? '<button type="button" class="pl-btn ghost" id="rv-ahead">Repasar por adelantado (' + Math.min(all.length, REVIEW_MAX) + ')</button>' : '')) +
          (unseen ? '<button type="button" class="pl-btn ghost" id="rv-new">Practicar preguntas nuevas (' + unseen + ' sin ver)</button>' : '') +
        '</div>';
      var go = $('rv-go'), ah = $('rv-ahead'), nw = $('rv-new');
      if (go) go.addEventListener('click', function(){ self.startReview(); });
      if (ah) ah.addEventListener('click', function(){ self.startReview(null, true); });
      if (nw) nw.addEventListener('click', function(){
        var pool = shuffle(ALLQ.filter(function(q){ var r = rec(q.id); return !r || !r.n; })).slice(0, 20);
        self.showView('practice'); $('practice-config').style.display = 'none';
        self.launch(pool, { mode: 'practice', target: 'practice-runner', pass: 70, title: 'Preguntas nuevas' });
      });
      this.updateDueBadge();
    },
    updateDueBadge: function(){
      var b = $('pl-due-badge'), n = dueList().length;
      b.hidden = !n; b.textContent = n > 99 ? '99+' : String(n);
    },
    refreshBadges: function(){
      this.updateDueBadge();
      // refresh module meters without closing open modules
      var self = this;
      MODULES.forEach(function(m){
        var el = $('mod-' + m.id); if (!el) return;
        var st = modStats(m.id), pct = Math.round(st.mastered / st.total * 100);
        var meter = el.querySelector('.pl-meter i'); if (meter) meter.style.width = pct + '%';
        var meta = el.querySelector('.pl-mod-meta');
        if (meta) meta.innerHTML = st.mastered + '/' + st.total + ' dominadas' + (st.due ? ' · <b class="due">' + st.due + ' por repasar</b>' : '');
      });
      self.updateOverall();
    },

    /* ----------------------- EXAMEN SIMULADO ----------------------- */
    examPool: function(){
      // Reparte las 20 preguntas en proporción al banco de cada tema (mínimo 1 por tema).
      var core = MODULES.filter(function(m){ return !m.complementary; });
      var total = core.reduce(function(s, m){ return s + m.questions.length; }, 0);
      var alloc = core.map(function(m){ var x = EXAM_N * m.questions.length / total; return { m: m, n: Math.max(1, Math.floor(x)), r: x - Math.floor(x) }; });
      var sum = alloc.reduce(function(s, a){ return s + a.n; }, 0);
      alloc.slice().sort(function(a, b){ return b.r - a.r; }).forEach(function(a){ if (sum < EXAM_N){ a.n++; sum++; } });
      while (sum > EXAM_N){ var big = alloc.slice().sort(function(a, b){ return b.n - a.n; })[0]; big.n--; sum--; }
      var pool = [];
      alloc.forEach(function(a){ pool = pool.concat(shuffle(qsOf(a.m.id)).slice(0, a.n)); });
      return shuffle(pool);
    },
    renderExamConfig: function(){
      var el = $('exam-config'), self = this;
      var core = MODULES.filter(function(m){ return !m.complementary; });
      var hist = state.exams.slice(-10);
      el.innerHTML =
        '<div class="pl-panel pl-exam-card">' +
          '<div class="pl-exam-head"><span class="pl-exam-ic">' + ic('exam') + '</span><div><h2>Examen simulado</h2>' +
          '<p class="lead">20 preguntas al azar de los temas del examen de lancha (sin el módulo de vela). Necesitas <b>70%</b> para aprobar. Las explicaciones se muestran al final.</p></div></div>' +
          '<div class="pl-exam-rules">' +
            '<div><b>' + EXAM_N + '</b><span>preguntas</span></div>' +
            '<div><b>' + (EXAM_SECONDS / 60) + ' min</b><span>tiempo de práctica</span></div>' +
            '<div><b>' + EXAM_PASS + '%</b><span>para aprobar (' + Math.ceil(EXAM_N * EXAM_PASS / 100) + ' de ' + EXAM_N + ')</span></div>' +
            '<div><b>' + core.length + '</b><span>temas</span></div>' +
          '</div>' +
          '<ul class="pl-exam-list">' +
            '<li>Las preguntas se reparten entre los ' + core.length + ' temas según el tamaño de cada banco.</li>' +
            '<li>Puedes moverte entre preguntas, cambiar respuestas y <b>marcar</b> las dudosas antes de entregar.</li>' +
            '<li>No verás si aciertas hasta el final. Si se acaba el tiempo, el examen se entrega solo.</li>' +
            '<li>El tiempo es una referencia para practicar; confirma el formato oficial en tu Capitanía de Puerto.</li>' +
          '</ul>' +
          '<button type="button" class="pl-btn" id="exam-go">Rendir examen</button>' +
          (hist.length ? '<h3 class="pl-h3">Tus últimos exámenes</h3>' + historyChart(hist) : '') +
        '</div>';
      $('exam-go').addEventListener('click', function(){ self.startExam(); });
    },
    startExam: function(){
      var qs = this.examPool().map(function(q){
        var sh = orderFor(q);
        return { id: q.id, mod: q.mod, cat: q.cat, q: q.q, e: q.e, o: sh.map(function(i){ return q.o[i]; }), a: sh.indexOf(q.a) };
      });
      this.exam = { qs: qs, pick: qs.map(function(){ return -1; }), flag: qs.map(function(){ return false; }), i: 0, start: Date.now(), done: false };
      $('exam-config').innerHTML = '';
      this.showView('exam');
      this.renderExam();
      var self = this;
      clearInterval(this._tick);
      this._tick = setInterval(function(){ self.examTick(); }, 500);
    },
    examLeft: function(){ return EXAM_SECONDS - (Date.now() - this.exam.start) / 1000; },
    examTick: function(){
      var E = this.exam; if (!E || E.done){ clearInterval(this._tick); return; }
      var left = this.examLeft(), t = $('ex-timer');
      if (t){ t.textContent = mmss(left); t.parentNode.classList.toggle('warn', left < 300); }
      if (left <= 0) this.submitExam(true);
    },
    renderExam: function(){
      var E = this.exam, q = E.qs[E.i], tgt = $('exam-runner'), self = this;
      var answered = E.pick.filter(function(p){ return p >= 0; }).length;
      tgt.innerHTML =
        '<div class="pl-exbar"><div class="pl-ex-timer' + (this.examLeft() < 300 ? ' warn' : '') + '">' + ic('clock') + '<span id="ex-timer">' + mmss(this.examLeft()) + '</span></div>' +
          '<div class="pl-ex-count"><b>' + answered + '</b>/' + E.qs.length + ' respondidas</div>' +
          '<button type="button" class="pl-btn pl-ex-submit" id="ex-submit">Entregar</button></div>' +
        '<div class="pl-panel pl-qpanel pl-exq">' +
          '<div class="pl-quiz-top"><span>Pregunta ' + (E.i + 1) + ' de ' + E.qs.length + '</span>' +
            '<button type="button" class="pl-flag' + (E.flag[E.i] ? ' on' : '') + '" id="ex-flag" aria-pressed="' + (E.flag[E.i] ? 'true' : 'false') + '">' + ic('flag') + (E.flag[E.i] ? 'Marcada' : 'Marcar para revisar') + '</button></div>' +
          '<div class="pl-qmeta"><span class="pl-qcat">' + ic(q.mod) + esc(q.cat) + '</span></div>' +
          '<div class="pl-q" id="pl-qtext">' + esc(q.q) + '</div>' +
          '<div class="pl-opts" role="radiogroup" aria-labelledby="pl-qtext">' +
            q.o.map(function(op, i){ var on = E.pick[E.i] === i; return '<button type="button" role="radio" aria-checked="' + on + '" class="pl-opt' + (on ? ' picked' : '') + '" data-i="' + i + '"><span class="k">' + String.fromCharCode(65 + i) + '</span><span class="t">' + esc(op) + '</span></button>'; }).join('') +
          '</div>' +
          '<div class="pl-ex-nav"><button type="button" class="pl-btn ghost" id="ex-prev"' + (E.i ? '' : ' disabled') + '>← Anterior</button>' +
            '<button type="button" class="pl-btn" id="ex-next">' + (E.i < E.qs.length - 1 ? 'Siguiente →' : 'Revisar y entregar') + '</button></div>' +
        '</div>' +
        '<div class="pl-panel pl-sheet"><div class="pl-sheet-h"><b>Hoja de respuestas</b><span><i class="lg a"></i>respondida <i class="lg f"></i>marcada</span></div>' +
          '<div class="pl-sheet-grid">' + E.qs.map(function(_, i){
            var cls = (E.pick[i] >= 0 ? ' a' : '') + (E.flag[i] ? ' f' : '') + (i === E.i ? ' cur' : '');
            return '<button type="button" class="pl-sq' + cls + '" data-g="' + i + '" aria-label="Pregunta ' + (i + 1) + (E.pick[i] >= 0 ? ', respondida ' + String.fromCharCode(65 + E.pick[i]) : ', sin responder') + (E.flag[i] ? ', marcada' : '') + '">' + (i + 1) + (E.pick[i] >= 0 ? '<small>' + String.fromCharCode(65 + E.pick[i]) + '</small>' : '') + '</button>';
          }).join('') + '</div>' +
          '<button type="button" class="pl-quit" id="ex-quit">Abandonar examen</button></div>';
      tgt.querySelectorAll('.pl-opt').forEach(function(b){ b.addEventListener('click', function(){ self.examPick(+b.getAttribute('data-i')); }); });
      tgt.querySelectorAll('.pl-sq').forEach(function(b){ b.addEventListener('click', function(){ self.examGo(+b.getAttribute('data-g')); }); });
      $('ex-prev').addEventListener('click', function(){ self.examGo(E.i - 1); });
      $('ex-next').addEventListener('click', function(){ if (E.i < E.qs.length - 1) self.examGo(E.i + 1); else self.submitExam(false); });
      $('ex-flag').addEventListener('click', function(){ E.flag[E.i] = !E.flag[E.i]; self.renderExam(); });
      $('ex-submit').addEventListener('click', function(){ self.submitExam(false); });
      $('ex-quit').addEventListener('click', function(){ self.abandonExam(); });
    },
    examPick: function(i){
      var E = this.exam; if (!E || E.done || i >= E.qs[E.i].o.length) return;
      E.pick[E.i] = i;
      var self = this;
      this.renderExam();
      // auto-advance after a short pause, unless it is the last question
      clearTimeout(this._adv);
      var at = E.i;
      if (E.i < E.qs.length - 1) this._adv = setTimeout(function(){ if (self.exam === E && E.i === at && !E.done) self.examGo(at + 1); }, 420);
    },
    examGo: function(i){
      var E = this.exam; if (!E || E.done) return;
      clearTimeout(this._adv);
      E.i = Math.max(0, Math.min(E.qs.length - 1, i));
      this.renderExam();
      var top = document.querySelector('.pl-exbar'); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
    },
    abandonExam: function(){
      var self = this;
      var go = function(){ clearInterval(self._tick); self.exam = null; $('exam-runner').innerHTML = ''; self.renderExamConfig(); };
      if (window.ZsDialog) ZsDialog.confirm({ title: '¿Abandonar el examen?', message: 'No se guardará el resultado.', confirmLabel: 'Abandonar', cancelLabel: 'Seguir', danger: true }).then(function(ok){ if (ok) go(); });
      else go();
    },
    submitExam: function(timeUp){
      var E = this.exam, self = this; if (!E || E.done) return;
      var blank = E.pick.filter(function(p){ return p < 0; }).length, flagged = E.flag.filter(Boolean).length;
      if (!timeUp && (blank || flagged) && window.ZsDialog){
        var msg = (blank ? 'Tienes ' + blank + ' sin responder (cuentan como error). ' : '') + (flagged ? 'Tienes ' + flagged + ' marcada' + (flagged > 1 ? 's' : '') + ' para revisar.' : '');
        ZsDialog.confirm({ title: '¿Entregar el examen?', message: msg, confirmLabel: 'Entregar', cancelLabel: 'Volver' }).then(function(ok){ if (ok) self.gradeExam(false); });
        return;
      }
      this.gradeExam(timeUp);
    },
    gradeExam: function(timeUp){
      var E = this.exam; if (!E || E.done) return;
      E.done = true; clearInterval(this._tick); clearTimeout(this._adv);
      var used = Math.min(EXAM_SECONDS, Math.round((Date.now() - E.start) / 1000));
      var answers = E.qs.map(function(q, i){
        var p = E.pick[i];
        return { id: q.id, mod: q.mod, q: q.q, correct: p === q.a, blank: p < 0, your: p >= 0 ? q.o[p] : '— sin responder —', right: q.o[q.a], e: q.e };
      });
      var correct = answers.filter(function(a){ return a.correct; }).length;
      var answered = answers.filter(function(a){ return !a.blank; }).length;
      var pct = Math.round(correct / E.qs.length * 100), pass = pct >= EXAM_PASS;
      // guardar (mismos significados que antes + historial)
      state.examCount++;
      if (pct > state.examBest) state.examBest = pct;
      state.answered += answered; state.correct += correct;
      answers.forEach(function(a){ record(a.id, a.correct, !a.blank); });
      var m = {}; breakdown(answers).forEach(function(b){ m[b.mod] = [b.c, b.n]; });
      state.exams.push({ t: Date.now(), p: pct, c: correct, n: E.qs.length, s: used, m: m });
      if (state.exams.length > 30) state.exams = state.exams.slice(-30);
      saveState();
      this.updateOverall(); this.refreshBadges();
      feedback(pass ? '🏆' : '📚');

      var byMod = breakdown(answers), weak = byMod.filter(function(b){ return b.c / b.n < 0.7; });
      var misses = answers.filter(function(a){ return !a.correct; });
      var tgt = $('exam-runner'), self = this;
      tgt.innerHTML =
        '<div class="pl-panel pl-exres">' +
          '<div class="pl-stamp ' + (pass ? 'pass' : 'fail') + '">' + (pass ? 'APROBADO' : 'NO APROBADO') + '</div>' +
          '<div class="pl-exres-top">' + ring(pct, 150, pass ? 'var(--green)' : 'var(--red)', pct + '%', correct + '/' + E.qs.length) +
            '<div class="pl-exres-facts"><div><b>' + correct + '</b> correctas</div><div><b>' + (E.qs.length - correct - (E.qs.length - answered)) + '</b> incorrectas</div>' +
            (E.qs.length - answered ? '<div><b>' + (E.qs.length - answered) + '</b> sin responder</div>' : '') +
            '<div><b>' + mmss(used) + '</b> de ' + (EXAM_SECONDS / 60) + ' min' + (timeUp ? ' · <b class="due">se acabó el tiempo</b>' : '') + '</div>' +
            '<div class="sub">Se necesita ' + EXAM_PASS + '% (' + Math.ceil(E.qs.length * EXAM_PASS / 100) + ' de ' + E.qs.length + ') para aprobar</div></div></div>' +
          '<h3 class="pl-h3">Resultado por tema</h3>' + breakdownHTML(byMod) +
          (weak.length ? '<div class="pl-weak"><b>Temas a reforzar:</b> ' + weak.map(function(b){ return esc(b.title); }).join(' · ') + '</div>' : '<div class="pl-weak ok">Todos los temas sobre 70% 👏</div>') +
          reviewList(misses, true) +
          '<div class="pl-row-btns">' +
            (misses.length ? '<button type="button" class="pl-btn" data-a="rev">↻ Repasar las falladas</button>' : '') +
            '<button type="button" class="pl-btn ' + (misses.length ? 'ghost' : '') + '" data-a="again">Otro examen</button>' +
            '<button type="button" class="pl-btn ghost" data-a="exit">Salir</button></div>' +
        '</div>';
      var done = function(){ self.exam = null; $('exam-runner').innerHTML = ''; };
      var rv = tgt.querySelector('[data-a="rev"]');
      if (rv) rv.addEventListener('click', function(){ done(); self.renderExamConfig(); self.startReview(); });
      tgt.querySelector('[data-a="again"]').addEventListener('click', function(){ done(); self.startExam(); });
      tgt.querySelector('[data-a="exit"]').addEventListener('click', function(){ done(); self.renderExamConfig(); });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /* ----------------------- PROGRESO ----------------------- */
    overallPct: function(){
      var totalMods = MODULES.length;
      var readCount = MODULES.filter(function(m){ return state.read[m.id]; }).length;
      var masterySum = MODULES.reduce(function(s, m){ return s + Math.min((state.best[m.id] || 0), 100) / 100; }, 0);
      return Math.round((readCount / totalMods * 0.5 + masterySum / totalMods * 0.5) * 100);
    },
    updateOverall: function(){
      var o = this.overallPct();
      var el = $('pl-ready');
      el.innerHTML = ring(o, 62, '#0E7490', o + '%', 'listo');
      el.setAttribute('aria-label', 'Preparación: ' + o + '% listo');
      this.updateDueBadge();
    },
    renderProgress: function(){
      var acc = state.answered ? Math.round(state.correct / state.answered * 100) : 0;
      var mastered = ALLQ.filter(function(q){ return isMastered(q.id); }).length, self = this;
      var hist = state.exams.slice(-10);
      var passN = state.exams.filter(function(x){ return x.p >= EXAM_PASS; }).length;
      $('pl-progress').innerHTML =
        '<div class="pl-stat-grid">' +
          stat(this.overallPct() + '%', 'Preparación') +
          stat(state.answered, 'Preguntas respondidas') +
          stat(acc + '%', 'Aciertos globales') +
          stat(state.examBest + '%', 'Mejor examen') +
          stat(state.examCount, 'Exámenes rendidos' + (state.exams.length ? ' · ' + passN + ' aprobados' : '')) +
          stat(mastered + '/' + ALLQ.length, 'Preguntas dominadas') +
        '</div>' +
        (hist.length ? '<div class="pl-panel"><h3 class="pl-h3 first">Últimos exámenes</h3>' + historyChart(hist) + '</div>' : '') +
        '<div class="pl-panel"><h3 class="pl-h3 first">Dominio por tema</h3>' +
        '<div class="pl-legend"><span><i class="m"></i>dominadas</span><span><i class="s"></i>vistas, por afianzar</span><span><i class="u"></i>sin ver</span></div>' +
        MODULES.map(function(m){
          var st = modStats(m.id), best = state.best[m.id] || 0, read = state.read[m.id];
          var pm = st.mastered / st.total * 100, ps = Math.max(0, (st.seen - st.mastered)) / st.total * 100;
          return '<div class="pl-modstat">' +
            '<span class="em">' + ic(m.id) + '</span>' +
            '<span class="nm"><span class="nm-t">' + esc(m.title) + (m.complementary ? ' <span class="pl-badge">Compl.</span>' : '') + '</span>' +
              '<span class="pl-stack" role="img" aria-label="' + st.mastered + ' dominadas, ' + (st.seen - st.mastered) + ' vistas, ' + (st.total - st.seen) + ' sin ver"><i class="m" style="width:' + pm + '%"></i><i class="s" style="width:' + ps + '%"></i></span>' +
              '<span class="nm-s">' + st.mastered + '/' + st.total + ' dominadas · mejor práctica ' + best + '%' + (read ? ' · <span class="rd">leído</span>' : '') + (st.due ? ' · <b class="due">' + st.due + ' por repasar</b>' : '') + '</span></span>' +
            '<button type="button" class="pl-mini-go" data-m="' + m.id + '" aria-label="Practicar ' + esc(m.title) + '">✏️</button>' +
          '</div>';
        }).join('') + '</div>' +
        '<button type="button" class="pl-btn ghost" id="pl-reset">↺ Reiniciar progreso</button>';
      $('pl-progress').querySelectorAll('.pl-mini-go').forEach(function(b){ b.addEventListener('click', function(){ self.startSingle(b.getAttribute('data-m')); }); });
      $('pl-reset').addEventListener('click', function(){ self.resetProgress(); });
    },
    resetProgress: function(){
      var self = this;
      ZsDialog.confirm({ title: '¿Reiniciar todo tu progreso de estudio?', confirmLabel: 'Reiniciar', cancelLabel: 'Cancelar', danger: true }).then(function(ok){
        if (!ok) return;
        var d = defaultState(); Object.keys(state).forEach(function(k){ delete state[k]; }); Object.keys(d).forEach(function(k){ state[k] = d[k]; });
        saveState();
        self.renderModules(); self.renderProgress(); self.updateOverall(); self.renderReviewHome(); self.renderExamConfig();
      });
    },
    feedback: feedback
  };

  function stat(v, l){ return '<div class="pl-stat"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function breakdown(answers){
    var by = {}, order = [];
    answers.forEach(function(a){ if (!by[a.mod]){ by[a.mod] = { mod: a.mod, c: 0, n: 0 }; order.push(a.mod); } by[a.mod].n++; if (a.correct) by[a.mod].c++; });
    return MODULES.filter(function(m){ return by[m.id]; }).map(function(m){ var b = by[m.id]; b.title = m.title; return b; });
  }
  function breakdownHTML(list){
    return '<div class="pl-bd">' + list.map(function(b){
      var p = Math.round(b.c / b.n * 100), ok = p >= 70;
      return '<div class="pl-bd-row"><span class="pl-bd-ic">' + ic(b.mod) + '</span><span class="pl-bd-t">' + esc(b.title) + '</span>' +
        '<span class="pl-bd-bar"><i class="' + (ok ? 'ok' : 'bad') + '" style="width:' + p + '%"></i><em style="left:70%"></em></span>' +
        '<span class="pl-bd-n">' + b.c + '/' + b.n + '</span></div>';
    }).join('') + '</div>';
  }
  function reviewList(misses, exam){
    if (!misses.length) return '<p class="pl-allok">¡Todas correctas! 🎉</p>';
    return '<div class="pl-review"><h3 class="pl-h3">📝 Repasa lo que fallaste (' + misses.length + ')</h3>' +
      misses.map(function(a){
        return '<div class="pl-rev-item miss"><div class="qq">' + esc(a.q) + '</div>' +
          '<div class="yours">Tu respuesta: ' + esc(a.your) + '</div><div class="ans">Correcta: ' + esc(a.right) + '</div>' +
          '<div class="ex">' + esc(a.e) + '</div></div>';
      }).join('') + '</div>';
  }
  function historyChart(hist){
    var W = 320, H = 120, n = hist.length, bw = Math.min(26, (W - 30) / n - 6);
    var y = function(p){ return H - 18 - p / 100 * (H - 30); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-hist" role="img" aria-label="Resultados de los últimos exámenes: ' + hist.map(function(x){ return x.p + '%'; }).join(', ') + '">' +
      '<line x1="22" x2="' + W + '" y1="' + y(70) + '" y2="' + y(70) + '" class="pl-hist-pass"/><text x="2" y="' + (y(70) + 4) + '" class="pl-hist-t">70%</text>' +
      '<line x1="22" x2="' + W + '" y1="' + y(0) + '" y2="' + y(0) + '" class="pl-hist-ax"/>';
    hist.forEach(function(x, i){
      var cx = 30 + i * ((W - 36) / n) + ((W - 36) / n - bw) / 2;
      s += '<rect x="' + cx.toFixed(1) + '" y="' + y(x.p).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (y(0) - y(x.p)).toFixed(1) + '" rx="4" class="' + (x.p >= EXAM_PASS ? 'ok' : 'bad') + '"/>' +
        '<text x="' + (cx + bw / 2).toFixed(1) + '" y="' + (y(x.p) - 4).toFixed(1) + '" class="pl-hist-v" text-anchor="middle">' + x.p + '</text>';
    });
    return s + '</svg>';
  }

  window.PL = PL;
  PL.init();

  // La sincronización con la nube (sync.js) pudo traer progreso de otro
  // dispositivo: recarga el estado del perfil activo y re-renderiza.
  window.addEventListener('zs:synced', function(){
    state = loadState();
    PL.renderModules();
    PL.renderProgress();
    PL.updateOverall();
    if (!PL.quiz) PL.renderReviewHome();
  });
})();
