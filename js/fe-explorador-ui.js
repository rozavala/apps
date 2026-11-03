/* ================================================================
   FE EXPLORADOR — UI (js/fe-explorador-ui.js)
   Tabs: Oración (holy-card prayers, memory mode), Santos (stained
   glass windows + quiz), Rosario (interactive rosary), Herencia
   (illustrated Chilean heritage + quiz) and Desafío (age-scaled
   rounds that mix all four).
   Requires: auth.js, sounds.js, learning-checks.js, fe-explorador.js,
             fe-explorador-art.js
   ================================================================ */

(function () {
  'use strict';

  const FM = FeManager;
  const esc = s => (typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'));
  const sfx = name => { try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); } catch (e) {} };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const user = () => (typeof getActiveUser === 'function' ? getActiveUser() : null);
  const tier = () => { const u = user(); return typeof getAgeTier === 'function' ? getAgeTier(u ? u.age : null) : 'intermediate'; };
  const data = () => FM.getStatus() || { totalStars: 0, completed: [] };

  // ── State ──
  const S = {
    tab: 'prayer',
    prayerIndex: 0, prayerLine: 0, memory: false, memPicked: {},
    saintIndex: 0, saintQ: 0, saintCorrect: 0, saintAnswered: null,
    heritageIndex: 0, heritageAnswered: null,
    rosarySet: null, rosaryDecade: 0, rosaryStep: 0, rosarySalve: false, rosaryIntro: -1,
    round: null
  };

  // The prayers prayed in each decade of the rosary, in order:
  // 1 Padre Nuestro, 10 Ave Marías, 1 Gloria. After the 5th decade
  // comes the Salve.
  const DECADE_PRAYERS = ['padrenuestro',
    'avemaria', 'avemaria', 'avemaria', 'avemaria', 'avemaria',
    'avemaria', 'avemaria', 'avemaria', 'avemaria', 'avemaria', 'gloria'];
  // Optional opening prayers on the crucifix and pendant.
  const INTRO_PRAYERS = ['senalcruz', 'credo', 'padrenuestro', 'avemaria', 'avemaria', 'avemaria', 'gloria'];

  const TABS = [
    { id: 'prayer', label: 'Oración', icon: 'prayer' },
    { id: 'saint', label: 'Santos', icon: 'saint' },
    { id: 'rosary', label: 'Rosario', icon: 'rosary' },
    { id: 'heritage', label: 'Herencia', icon: 'heritage' },
    { id: 'challenge', label: 'Desafío', icon: 'challenge' }
  ];

  const ORD = ['Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto'];
  const SINGULAR = { gozosos: 'Gozoso', luminosos: 'Luminoso', dolorosos: 'Doloroso', gloriosos: 'Glorioso' };

  function main() { return document.getElementById('content-main'); }

  // ── Header / tabs ──
  function renderChrome() {
    const tabs = document.getElementById('fe-tabs');
    tabs.innerHTML = TABS.map(t =>
      '<button type="button" class="fe-tab' + (t.id === S.tab ? ' active' : '') + '" role="tab" aria-selected="' + (t.id === S.tab) + '" data-tab="' + t.id + '">' +
      FeArt.icon(t.icon) + '<span>' + t.label + '</span></button>').join('');
    const rose = document.getElementById('fe-rose');
    if (rose && !rose.innerHTML) rose.innerHTML = FeArt.icon('rose');
    updateStars();
  }

  function updateStars() {
    const el = document.getElementById('star-count');
    if (el) el.textContent = '⭐ ' + (data().totalStars || 0);
  }

  function showTab(tab) {
    S.tab = tab;
    sfx('click');
    renderChrome();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    const m = main();
    if (S.tab === 'prayer') m.innerHTML = renderPrayer();
    else if (S.tab === 'saint') m.innerHTML = renderSaint();
    else if (S.tab === 'rosary') m.innerHTML = renderRosary();
    else if (S.tab === 'heritage') m.innerHTML = renderHeritage();
    else if (S.tab === 'challenge') m.innerHTML = renderChallenge();
    updateStars();
    if (S.tab === 'saint') { const a = m.querySelector('.fe-strip .active'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    if (S.tab === 'heritage') { const a = m.querySelector('.fe-strip .active'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' }); }
  }

  // ════════════════════════ ORACIÓN ════════════════════════
  const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
  const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Words hidden in memory mode: the longest word of the line (two for
  // the oldest kids when the line is long enough).
  function blanksFor(line) {
    const words = [];
    let m; WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(line)) !== null) words.push({ w: m[0], i: m.index });
    const cands = words.filter(x => x.w.length >= 4).sort((a, b) => b.w.length - a.w.length || a.i - b.i);
    if (!cands.length) return [];
    const n = tier() === 'expert' && cands.length >= 3 ? 2 : 1;
    return cands.slice(0, n).sort((a, b) => a.i - b.i);
  }

  function lineHTML(line, blanks, revealed) {
    if (!blanks.length) return esc(line);
    let out = '', last = 0;
    blanks.forEach((b, k) => {
      out += esc(line.slice(last, b.i));
      out += revealed[k] ? '<span class="fe-word-ok">' + esc(b.w) + '</span>' : '<span class="fe-gap" aria-label="palabra que falta">' + ' '.repeat(Math.max(4, Math.round(b.w.length * 0.9))) + '</span>';
      last = b.i + b.w.length;
    });
    return out + esc(line.slice(last));
  }

  function memoryOptions(p, word) {
    const pool = [];
    p.lines.join(' ').replace(WORD_RE, w => { if (w.length >= 4 && norm(w) !== norm(word) && !pool.some(x => norm(x) === norm(w))) pool.push(w); return w; });
    // fall back to words of other prayers for very short prayers
    if (pool.length < 2) FM.PRAYERS.forEach(q => q.lines.join(' ').replace(WORD_RE, w => { if (w.length >= 4 && norm(w) !== norm(word) && pool.length < 12) pool.push(w); return w; }));
    const n = tier() === 'beginner' ? 1 : (tier() === 'intermediate' ? 2 : 3);
    return shuffle([word].concat(shuffle(pool).slice(0, n)));
  }

  function renderPrayer() {
    const d = data();
    const prayed = d.prayersPrayed || {}, memo = d.prayersMemorized || {};
    const p = FM.PRAYERS[S.prayerIndex];
    const canMemory = tier() !== 'beginner';
    const memory = S.memory && canMemory;

    let lines = '';
    p.lines.forEach((l, i) => {
      const state = i < S.prayerLine ? 'past' : (i === S.prayerLine ? 'current' : 'future');
      let body;
      if (memory && i >= S.prayerLine) {
        const blanks = blanksFor(l);
        const rev = i === S.prayerLine ? (S.memPicked[i] || []) : [];
        body = lineHTML(l, blanks, rev);
      } else body = esc(l);
      lines += '<li class="fe-line is-' + state + '">' + body + '</li>';
    });

    // Memory mode: options for the next hidden word of the current line
    let memBox = '';
    if (memory) {
      const blanks = blanksFor(p.lines[S.prayerLine]);
      const rev = S.memPicked[S.prayerLine] || [];
      const k = rev.length;
      if (k < blanks.length) {
        if (!S._memOpts || S._memOpts.key !== S.prayerIndex + ':' + S.prayerLine + ':' + k) {
          S._memOpts = { key: S.prayerIndex + ':' + S.prayerLine + ':' + k, opts: memoryOptions(p, blanks[k].w) };
        }
        memBox = '<div class="fe-mem"><div class="fe-mem-q">¿Qué palabra falta?</div><div class="fe-mem-opts">' +
          S._memOpts.opts.map(w => '<button type="button" class="fe-mem-opt" data-act="mem" data-w="' + esc(w) + '">' + esc(w) + '</button>').join('') + '</div></div>';
      }
    }
    const lineDone = !memory || (S.memPicked[S.prayerLine] || []).length >= blanksFor(p.lines[S.prayerLine]).length;
    const last = S.prayerLine >= p.lines.length - 1;

    return '<section class="fe-prayer" aria-label="Oraciones">' +
      '<div class="fe-chips" role="group" aria-label="Elige una oración">' +
      FM.PRAYERS.map((q, i) => '<button type="button" class="fe-chip' + (i === S.prayerIndex ? ' active' : '') + '" data-act="prayer" data-i="' + i + '">' +
        esc(q.title.replace(/ \(.*\)$/, '')) + (memo[q.id] ? ' <span class="fe-chip-mark" title="Memorizada">✦</span>' : (prayed[q.id] ? ' <span class="fe-chip-mark" title="Rezada">✓</span>' : '')) + '</button>').join('') +
      '</div>' +
      '<article class="fe-holycard">' +
        '<div class="fe-hc-inner">' +
          '<div class="fe-hc-pic">' + FeArt.prayerVignette(p.id) + '</div>' +
          '<h2 class="fe-hc-title">' + esc(p.title) + '</h2>' +
          '<div class="fe-hc-rule" aria-hidden="true"><span>✠</span></div>' +
          '<ol class="fe-lines' + (memory ? ' is-memory' : '') + '">' + lines + '</ol>' +
          memBox +
          '<div class="fe-dots" aria-hidden="true">' + p.lines.map((_, i) => '<i class="' + (i < S.prayerLine ? 'done' : (i === S.prayerLine ? 'cur' : '')) + '"></i>').join('') + '</div>' +
        '</div>' +
      '</article>' +
      '<div class="fe-actions">' +
        (canMemory ? '<button type="button" class="fe-btn fe-btn-ghost' + (memory ? ' is-on' : '') + '" data-act="memory" aria-pressed="' + memory + '">' + (memory ? '📖 Leer la oración' : '🧠 Modo memoria') + '</button>' : '') +
        '<button type="button" class="fe-btn fe-btn-primary" data-act="next-line"' + (lineDone ? '' : ' disabled') + '>' + (last ? 'Amén · Terminar ✓' : 'Continuar ➔') + '</button>' +
      '</div>' +
      '<p class="fe-hint">' + (prayed[p.id] ? 'Has rezado esta oración ' + prayed[p.id] + (prayed[p.id] === 1 ? ' vez' : ' veces') + '.' : 'Lee cada línea despacio y toca «Continuar».') + '</p>' +
      '</section>';
  }

  function pickMemory(w) {
    const p = FM.PRAYERS[S.prayerIndex];
    const blanks = blanksFor(p.lines[S.prayerLine]);
    const rev = S.memPicked[S.prayerLine] || [];
    const want = blanks[rev.length];
    if (!want) return;
    const btn = main().querySelector('.fe-mem-opt[data-w="' + CSS.escape(w) + '"]');
    if (norm(w) === norm(want.w)) {
      sfx('correct');
      S.memPicked[S.prayerLine] = rev.concat([true]);
      render();
      // all words of the line found → move on by itself
      if (S.memPicked[S.prayerLine].length >= blanks.length && S.prayerLine < p.lines.length - 1) {
        setTimeout(() => { if (S.tab === 'prayer') nextPrayerLine(); }, 650);
      }
    } else {
      sfx('wrong');
      if (btn) { btn.classList.add('is-wrong'); btn.disabled = true; }
    }
  }

  function nextPrayerLine() {
    const p = FM.PRAYERS[S.prayerIndex];
    if (S.prayerLine < p.lines.length - 1) {
      S.prayerLine++;
      sfx('click');
      render();
      const cur = main().querySelector('.fe-line.is-current');
      if (cur && cur.getBoundingClientRect().bottom > window.innerHeight - 120) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const memorized = S.memory && tier() !== 'beginner';
    FM.update(d => {
      d.prayersPrayed = d.prayersPrayed || {};
      d.prayersPrayed[p.id] = (d.prayersPrayed[p.id] || 0) + 1;
      if (memorized) { d.prayersMemorized = d.prayersMemorized || {}; d.prayersMemorized[p.id] = true; }
    });
    FM.addStar();
    sfx('star');
    toast(memorized ? '¡Oración memorizada! ⭐' : '¡Amén! ⭐');
    S.prayerLine = 0; S.memPicked = {};
    S.prayerIndex = (S.prayerIndex + 1) % FM.PRAYERS.length;
    render();
  }

  // ════════════════════════ SANTOS ════════════════════════
  function saintQuestions(s) {
    const n = { beginner: 1, intermediate: 2 }[tier()] || 3;
    return s.questions.slice(0, n);
  }
  function optionsFor(q) {
    let idx = q.a.map((_, i) => i);
    if (tier() === 'beginner' && idx.length > 2) idx = shuffle([q.correct, pick(idx.filter(i => i !== q.correct))]);
    else if (tier() !== 'beginner') idx = shuffle(idx);
    return idx;
  }

  function renderSaint() {
    const d = data(), learned = d.saintsLearned || {};
    const s = FM.SAINTS[S.saintIndex];
    const qs = saintQuestions(s);
    const q = qs[S.saintQ];
    if (!S._saintOpts || S._saintOpts.key !== s.id + S.saintQ) S._saintOpts = { key: s.id + S.saintQ, idx: optionsFor(q) };
    const ans = S.saintAnswered;
    const finished = ans !== null && S.saintQ >= qs.length - 1;
    const learnedCount = Object.keys(learned).filter(k => learned[k] > 0).length;

    const strip = FM.SAINTS.map((x, i) => '<button type="button" class="fe-medallion' + (i === S.saintIndex ? ' active' : '') + (learned[x.id] ? ' is-learned' : '') + '" data-act="saint" data-i="' + i + '" aria-label="' + esc(x.name) + '">' +
      FeArt.saintPortrait(x.id) + '<span>' + esc(x.name.replace(/^(San|Santa|Santo) /, '')) + '</span></button>').join('');

    let quiz = '<div class="fe-quiz" aria-live="polite">' +
      '<div class="fe-quiz-head"><span class="fe-quiz-tag">Pregunta ' + (S.saintQ + 1) + ' de ' + qs.length + '</span></div>' +
      '<div class="fe-quiz-q">' + esc(q.q) + '</div><div class="fe-quiz-opts">' +
      S._saintOpts.idx.map(i => {
        let cls = '';
        if (ans !== null) { if (i === q.correct) cls = ' is-correct'; else if (i === ans) cls = ' is-wrong'; }
        return '<button type="button" class="fe-opt' + cls + '" data-act="saint-ans" data-i="' + i + '"' + (ans !== null ? ' disabled' : '') + '>' + esc(q.a[i]) + '</button>';
      }).join('') + '</div>';
    if (ans !== null) {
      const ok = ans === q.correct;
      quiz += '<div class="fe-explain ' + (ok ? 'is-good' : 'is-bad') + '">' + (ok ? '¡Correcto! ⭐ ' : 'La respuesta es: <strong>' + esc(q.a[q.correct]) + '</strong>. ') + (q.explain ? esc(q.explain) : '') + '</div>' +
        '<div class="fe-actions"><button type="button" class="fe-btn fe-btn-primary" data-act="saint-next">' + (finished ? 'Siguiente santo ➔' : 'Siguiente pregunta ➔') + '</button></div>';
    }
    quiz += '</div>';

    return '<section class="fe-saints" aria-label="Santos">' +
      '<div class="fe-strip-head"><span>' + learnedCount + ' de ' + FM.SAINTS.length + ' santos aprendidos</span></div>' +
      '<div class="fe-strip" role="group" aria-label="Elige un santo">' + strip + '</div>' +
      '<article class="fe-saint-card">' +
        '<div class="fe-window">' + FeArt.saintPortrait(s.id, { full: true, label: 'Vitral de ' + s.name }) +
          '<div class="fe-window-name">' + esc(s.name) + '</div></div>' +
        '<div class="fe-saint-info">' +
          '<h2 class="fe-item-title">' + esc(s.name) + '</h2>' +
          '<div class="fe-item-meta"><span>' + esc(s.dates) + '</span><span>' + esc(s.country) + '</span></div>' +
          '<p class="fe-bio">' + esc(s.bio) + '</p>' +
          '<p class="fe-symbol">En el vitral: ' + esc(FeArt.saintSymbol(s.id)) + '.</p>' +
          quiz +
        '</div>' +
      '</article></section>';
  }

  function answerSaint(i) {
    if (S.saintAnswered !== null) return;
    const s = FM.SAINTS[S.saintIndex];
    const q = saintQuestions(s)[S.saintQ];
    S.saintAnswered = i;
    if (i === q.correct) { S.saintCorrect++; FM.addStar(); sfx('correct'); } else sfx('wrong');
    render();
  }

  function nextSaintStep() {
    const s = FM.SAINTS[S.saintIndex];
    const qs = saintQuestions(s);
    if (S.saintQ < qs.length - 1) { S.saintQ++; S.saintAnswered = null; render(); return; }
    const correct = S.saintCorrect;
    FM.update(d => { d.saintsLearned = d.saintsLearned || {}; d.saintsLearned[s.id] = Math.max(d.saintsLearned[s.id] || 0, correct); });
    const go = () => { selectSaint((S.saintIndex + 1) % FM.SAINTS.length); };
    if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('faith', go); else go();
  }

  function selectSaint(i) {
    S.saintIndex = i; S.saintQ = 0; S.saintCorrect = 0; S.saintAnswered = null;
    render();
  }

  // ════════════════════════ HERENCIA ════════════════════════
  function renderHeritage() {
    const d = data(), learned = d.heritageLearned || {};
    const h = FM.HERITAGE[S.heritageIndex];
    if (!S._herOpts || S._herOpts.key !== h.id) S._herOpts = { key: h.id, idx: optionsFor(h) };
    const ans = S.heritageAnswered;
    const n = Object.keys(learned).length;

    const strip = FM.HERITAGE.map((x, i) => '<button type="button" class="fe-hchip' + (i === S.heritageIndex ? ' active' : '') + (learned[x.id] ? ' is-learned' : '') + '" data-act="heritage" data-i="' + i + '">' +
      esc(x.title) + '</button>').join('');

    let quiz = '<div class="fe-quiz" aria-live="polite"><div class="fe-quiz-q">' + esc(h.q) + '</div><div class="fe-quiz-opts">' +
      S._herOpts.idx.map(i => {
        let cls = '';
        if (ans !== null) { if (i === h.correct) cls = ' is-correct'; else if (i === ans) cls = ' is-wrong'; }
        return '<button type="button" class="fe-opt' + cls + '" data-act="her-ans" data-i="' + i + '"' + (ans !== null ? ' disabled' : '') + '>' + esc(h.a[i]) + '</button>';
      }).join('') + '</div>';
    if (ans !== null) {
      const ok = ans === h.correct;
      quiz += '<div class="fe-explain ' + (ok ? 'is-good' : 'is-bad') + '">' + (ok ? '¡Correcto! ⭐ ' : 'La respuesta es: <strong>' + esc(h.a[h.correct]) + '</strong>. ') + (h.explain ? esc(h.explain) : '') + '</div>' +
        '<div class="fe-actions"><button type="button" class="fe-btn fe-btn-primary" data-act="her-next">Siguiente ➔</button></div>';
    }
    quiz += '</div>';

    return '<section class="fe-heritage" aria-label="Herencia de Chile">' +
      '<div class="fe-strip-head"><span>' + n + ' de ' + FM.HERITAGE.length + ' lugares y fiestas conocidos</span></div>' +
      '<div class="fe-strip fe-strip-chips" role="group" aria-label="Elige un lugar o fiesta">' + strip + '</div>' +
      '<article class="fe-her-card">' +
        '<figure class="fe-her-pic">' + FeArt.heritageScene(h.id) + '<figcaption>Ilustración</figcaption></figure>' +
        '<div class="fe-her-body">' +
          '<div class="fe-item-meta"><span>🇨🇱 Herencia de Chile</span></div>' +
          '<h2 class="fe-item-title">' + esc(h.title) + '</h2>' +
          '<p class="fe-bio">' + esc(h.info) + '</p>' + quiz +
        '</div></article></section>';
  }

  function answerHeritage(i) {
    if (S.heritageAnswered !== null) return;
    const h = FM.HERITAGE[S.heritageIndex];
    S.heritageAnswered = i;
    if (i === h.correct) {
      FM.addStar(); sfx('correct');
      FM.update(d => { d.heritageLearned = d.heritageLearned || {}; d.heritageLearned[h.id] = true; });
    } else sfx('wrong');
    render();
  }
  function nextHeritage() {
    const go = () => { S.heritageIndex = (S.heritageIndex + 1) % FM.HERITAGE.length; S.heritageAnswered = null; render(); };
    if (S.heritageAnswered === FM.HERITAGE[S.heritageIndex].correct && typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('faith', go); else go();
  }

  // ════════════════════════ ROSARIO ════════════════════════
  function rosaryPhase() {
    if (S.rosarySalve) return 'salve';
    if (S.rosaryIntro >= 0) return 'intro';
    return 'decade';
  }

  function renderRosary() {
    const today = new Date().getDay();
    const todayIdx = FM.getRosarySetIndexForDay(today);
    if (S.rosarySet === null) S.rosarySet = todayIdx;
    const sets = FM.ROSARY_SETS, set = sets[S.rosarySet], todaySet = sets[todayIdx];
    const d = data();
    const mat = d.rosaryMaterial === 'cristal' ? 'cristal' : 'madera';
    const phase = rosaryPhase();

    let prayerId, label, centerTop, centerMain, centerSub, nextLabel;
    if (phase === 'salve') {
      prayerId = 'salve'; label = 'Salve';
      centerTop = '¡Rosario completo!'; centerMain = 'La Salve'; centerSub = 'en la medalla';
      nextLabel = '¡Terminar! 🌟';
    } else if (phase === 'intro') {
      prayerId = INTRO_PRAYERS[S.rosaryIntro];
      const p = FM.getPrayer(prayerId);
      const aveN = S.rosaryIntro >= 3 && S.rosaryIntro <= 5 ? S.rosaryIntro - 2 : 0;
      label = p.title.replace(/ \(.*\)$/, '') + (aveN ? ' (' + aveN + ' de 3)' : '');
      centerTop = 'Oraciones iniciales'; centerMain = S.rosaryIntro <= 1 ? 'En la cruz' : (S.rosaryIntro === 6 ? 'En la cadena' : 'En el colgante');
      centerSub = label;
      nextLabel = S.rosaryIntro === INTRO_PRAYERS.length - 1 ? 'Primer misterio ➔' : 'Continuar ➔';
    } else {
      prayerId = DECADE_PRAYERS[S.rosaryStep];
      const p = FM.getPrayer(prayerId);
      label = prayerId === 'avemaria' ? p.title + ' (' + S.rosaryStep + ' de 10)' : p.title.replace(/ \(.*\)$/, '');
      centerTop = ORD[S.rosaryDecade] + ' Misterio ' + (SINGULAR[set.id] || '');
      centerMain = set.mysteries[S.rosaryDecade].name;
      centerSub = label;
      const lastStep = S.rosaryStep === DECADE_PRAYERS.length - 1, lastDec = S.rosaryDecade === set.mysteries.length - 1;
      nextLabel = lastStep ? (lastDec ? 'Rezar la Salve ➔' : 'Siguiente misterio ➔') : 'Continuar ➔';
    }
    const prayer = FM.getPrayer(prayerId);
    const svg = FeArt.rosary({ mat, phase, introStep: S.rosaryIntro, decade: S.rosaryDecade, step: S.rosaryStep, label: 'Rosario: ' + centerMain + ', ' + label });

    const mlist = '<ol class="fe-mysteries">' +
      '<li><button type="button" class="fe-myst fe-myst-intro' + (phase === 'intro' ? ' active' : '') + '" data-act="intro"><span class="fe-myst-num">✝</span><span class="fe-myst-text"><span class="fe-myst-name">Inicio: la Cruz y el Credo</span>' +
        (phase === 'intro' ? '<span class="fe-myst-desc">Señal de la Cruz, Credo, Padre Nuestro, tres Ave Marías y Gloria.</span>' : '') + '</span></button></li>' +
      set.mysteries.map((my, i) => '<li><button type="button" class="fe-myst' + (phase === 'decade' && i === S.rosaryDecade ? ' active' : '') + (phase === 'salve' || (phase === 'decade' && i < S.rosaryDecade) ? ' done' : '') + '" data-act="decade" data-i="' + i + '">' +
        '<span class="fe-myst-num">' + (i + 1) + '</span><span class="fe-myst-text"><span class="fe-myst-name">' + esc(my.name) + '</span>' +
        (phase === 'decade' && i === S.rosaryDecade ? '<span class="fe-myst-desc">' + esc(my.desc) + '</span>' : '') + '</span></button></li>').join('') +
      '</ol>';

    return '<section class="fe-rosary" aria-label="Santo Rosario">' +
      '<div class="fe-rosary-top">' +
        '<h2 class="fe-sec-title">Santo Rosario</h2>' +
        '<p class="fe-today">Hoy es ' + esc(FM.DAY_NAMES[today]) + ': se rezan los <strong>' + esc(todaySet.name) + '</strong></p>' +
        '<div class="fe-sets" role="group" aria-label="Misterios">' + sets.map((s, i) =>
          '<button type="button" class="fe-set' + (i === S.rosarySet ? ' active' : '') + (i === todayIdx ? ' is-today' : '') + '" data-act="set" data-i="' + i + '" aria-pressed="' + (i === S.rosarySet) + '">' +
          esc(s.shortName) + (i === todayIdx ? ' <small>Hoy</small>' : '') + '</button>').join('') + '</div>' +
        '<div class="fe-set-days">' + esc(set.name) + ' — se rezan ' + esc(set.daysLabel) + '</div>' +
      '</div>' +
      '<div class="fe-rosary-layout">' +
        '<div class="fe-rosary-stage">' + svg +
          '<div class="fe-rosary-center" aria-live="polite"><div class="fe-rc-top">' + esc(centerTop) + '</div><div class="fe-rc-main">' + esc(centerMain) + '</div><div class="fe-rc-sub">' + esc(centerSub) + '</div></div>' +
          '<div class="fe-mat" role="group" aria-label="Cuentas del rosario">' +
            '<button type="button" class="fe-mat-btn' + (mat === 'madera' ? ' active' : '') + '" data-act="mat" data-m="madera" aria-pressed="' + (mat === 'madera') + '"><i class="sw-wood"></i>Madera</button>' +
            '<button type="button" class="fe-mat-btn' + (mat === 'cristal' ? ' active' : '') + '" data-act="mat" data-m="cristal" aria-pressed="' + (mat === 'cristal') + '"><i class="sw-glass"></i>Cristal</button>' +
          '</div>' +
        '</div>' +
        '<div class="fe-rosary-side">' +
          '<article class="fe-holycard fe-holycard-sm"><div class="fe-hc-inner">' +
            '<h3 class="fe-hc-title">' + esc(label) + '</h3><div class="fe-hc-rule" aria-hidden="true"><span>✠</span></div>' +
            '<ol class="fe-lines is-all">' + prayer.lines.map(l => '<li class="fe-line is-current">' + esc(l) + '</li>').join('') + '</ol>' +
          '</div></article>' +
          '<div class="fe-actions"><button type="button" class="fe-btn fe-btn-primary fe-btn-wide" data-act="rosary-next">' + nextLabel + '</button></div>' +
          mlist +
          '<p class="fe-hint">Toca una cuenta para ir a esa oración. ' + ((d.rosaries || 0) ? 'Rosarios completos: ' + d.rosaries + '.' : '') + '</p>' +
        '</div>' +
      '</div></section>';
  }

  function nextRosaryStep() {
    const phase = rosaryPhase();
    if (phase === 'salve') return finishRosary();
    if (phase === 'intro') {
      if (S.rosaryIntro < INTRO_PRAYERS.length - 1) S.rosaryIntro++;
      else { S.rosaryIntro = -1; S.rosaryDecade = 0; S.rosaryStep = 0; }
      sfx('click'); render(); return;
    }
    if (S.rosaryStep < DECADE_PRAYERS.length - 1) { S.rosaryStep++; sfx('click'); render(); return; }
    // Decade complete — award a star and move on.
    FM.update(d => { d.decades = (d.decades || 0) + 1; });
    FM.addStar(); sfx('star');
    S.rosaryStep = 0;
    const set = FM.ROSARY_SETS[S.rosarySet];
    if (S.rosaryDecade < set.mysteries.length - 1) { S.rosaryDecade++; toast('Misterio completo ⭐'); }
    else S.rosarySalve = true;
    render();
  }

  function finishRosary() {
    FM.update(d => { d.rosaries = (d.rosaries || 0) + 1; });
    FM.addStar(); sfx('cheer');
    toast('¡Rosario completo! ⭐');
    S.rosarySalve = false; S.rosaryDecade = 0; S.rosaryStep = 0; S.rosaryIntro = -1;
    render();
  }

  function goToBead(key) {
    if (!key) return;
    if (key === 'salve') return; // reached only by praying the five decades
    if (key[0] === 'i') { S.rosaryIntro = +key.slice(1); if (S.rosaryIntro === 1) S.rosaryIntro = 0; S.rosarySalve = false; }
    else { const m = /^d(\d)-(\d+)$/.exec(key); if (!m) return; S.rosaryIntro = -1; S.rosarySalve = false; S.rosaryDecade = +m[1]; S.rosaryStep = +m[2]; }
    sfx('click'); render();
  }

  // ════════════════════════ DESAFÍO ════════════════════════
  const LEVELS = [
    { id: 'beginner', name: 'Nivel 1 · Inicial', n: 5, opts: 2 },
    { id: 'intermediate', name: 'Nivel 2 · Intermedio', n: 6, opts: 3 },
    { id: 'advanced', name: 'Nivel 3 · Avanzado', n: 8, opts: 3 },
    { id: 'expert', name: 'Nivel 4 · Experto', n: 10, opts: 4 }
  ];
  const cleanCountry = c => c.replace(/[^\p{L}\s,.]/gu, '').trim();
  const firstYear = s => {
    const m = /^(\d+)/.exec(s.dates); if (m) return [+m[1], +(/(\d+)\s*$/.exec(s.dates) || m)[1]];
    const r = { I: 1, II: 2, III: 3, IV: 4, V: 5 }[(/Siglo ([IVX]+)/.exec(s.dates) || [])[1]];
    return r ? [(r - 1) * 100 + 1, r * 100] : null;
  };

  function mkOpts(correct, pool, n) {
    const uniq = [];
    pool.forEach(x => { if (x !== correct && uniq.indexOf(x) === -1) uniq.push(x); });
    return shuffle([correct].concat(shuffle(uniq).slice(0, n - 1)));
  }

  // Each generator returns {q, opts, answer, pic?, explain?} or null.
  const GEN = {
    portrait(lv) {
      const s = pick(FM.SAINTS);
      return { kind: 'portrait', q: '¿Qué santo muestra este vitral?', pic: FeArt.saintPortrait(s.id), answer: s.name, opts: mkOpts(s.name, FM.SAINTS.map(x => x.name), lv.opts), explain: 'Es ' + s.name + ': ' + FeArt.saintSymbol(s.id) + '.' };
    },
    attribute(lv) {
      const counts = {};
      FM.SAINTS.forEach(s => { const a = FeArt.saintAttr(s.id); counts[a] = (counts[a] || 0) + 1; });
      const s = pick(FM.SAINTS.filter(x => counts[FeArt.saintAttr(x.id)] === 1));
      return { q: 'En el vitral de este santo se ve ' + FeArt.saintSymbol(s.id) + '. ¿Quién es?', answer: s.name, opts: mkOpts(s.name, FM.SAINTS.map(x => x.name), lv.opts) };
    },
    country(lv) {
      const s = pick(FM.SAINTS);
      const c = cleanCountry(s.country);
      return { q: '¿De dónde era ' + s.name + '?', answer: c, opts: mkOpts(c, FM.SAINTS.map(x => cleanCountry(x.country)), lv.opts), explain: s.name + ' (' + s.dates + ') — ' + c + '.' };
    },
    saintQ(lv) {
      const s = pick(FM.SAINTS); const q = pick(s.questions);
      return { q: q.q.indexOf(s.name.split(' ').slice(-1)[0]) >= 0 ? q.q : s.name + ': ' + q.q, answer: q.a[q.correct], opts: mkOpts(q.a[q.correct], q.a, Math.min(lv.opts, q.a.length)), explain: q.explain };
    },
    earlier(lv) {
      for (let tries = 0; tries < 40; tries++) {
        const pair = shuffle(FM.SAINTS).slice(0, 2);
        const a = firstYear(pair[0]), b = firstYear(pair[1]);
        if (!a || !b || !(a[1] < b[0] || b[1] < a[0])) continue;
        const first = a[1] < b[0] ? pair[0] : pair[1];
        return { q: '¿Quién vivió primero?', answer: first.name, opts: shuffle([pair[0].name, pair[1].name]), explain: pair[0].name + ': ' + pair[0].dates + ' · ' + pair[1].name + ': ' + pair[1].dates + '.' };
      }
      return null;
    },
    heritage(lv) {
      const h = pick(FM.HERITAGE);
      return { q: h.q.indexOf('esta') >= 0 || h.q.indexOf('este') >= 0 ? h.title + ': ' + h.q : h.q, answer: h.a[h.correct], opts: mkOpts(h.a[h.correct], h.a, Math.min(lv.opts, h.a.length)), explain: h.explain };
    },
    scene(lv) {
      const h = pick(FM.HERITAGE);
      return { kind: 'scene', q: '¿Qué lugar o fiesta de Chile muestra la ilustración?', pic: FeArt.heritageScene(h.id), answer: h.title, opts: mkOpts(h.title, FM.HERITAGE.map(x => x.title), lv.opts), explain: h.info };
    },
    beads(lv) {
      return pick([
        { q: '¿Cuántas Ave Marías se rezan en cada misterio del Rosario?', answer: '10', opts: mkOpts('10', ['10', '5', '3', '12'], lv.opts), explain: 'Cada misterio: un Padre Nuestro, diez Ave Marías y un Gloria.' },
        { q: '¿Cuántos misterios se rezan en un Rosario?', answer: '5', opts: mkOpts('5', ['5', '3', '10', '7'], lv.opts), explain: 'Un Rosario tiene cinco misterios.' },
        { q: '¿Con qué oración termina el Rosario en esta app?', answer: 'La Salve', opts: mkOpts('La Salve', ['La Salve', 'El Credo', 'El Ángel de la Guarda', 'La Bendición de la Mesa'], lv.opts) }
      ]);
    },
    rosaryDay(lv) {
      const day = Math.floor(Math.random() * 7);
      const set = FM.ROSARY_SETS[FM.getRosarySetIndexForDay(day)];
      return { q: '¿Qué misterios se rezan el ' + FM.DAY_NAMES[day] + '?', answer: set.name, opts: mkOpts(set.name, FM.ROSARY_SETS.map(s => s.name), lv.opts), explain: set.name + ': ' + set.daysLabel + '.' };
    },
    mysterySet(lv) {
      const set = pick(FM.ROSARY_SETS), m = pick(set.mysteries);
      return { q: '«' + m.name + '» es uno de los…', answer: set.name, opts: mkOpts(set.name, FM.ROSARY_SETS.map(s => s.name), lv.opts), explain: m.desc };
    },
    mysteryOrder(lv) {
      const set = pick(FM.ROSARY_SETS), i = Math.floor(Math.random() * 5);
      return { q: '¿Cuál es el ' + ORD[i].toLowerCase() + ' de los ' + set.name + '?', answer: set.mysteries[i].name, opts: mkOpts(set.mysteries[i].name, set.mysteries.map(m => m.name), lv.opts) };
    },
    prayerWord(lv) {
      const p = pick(FM.PRAYERS.filter(x => x.id !== 'bendicionmesa'));
      const lines = p.lines.filter(l => blanksFor(l).length);
      const line = pick(lines), b = blanksFor(line)[0];
      return { q: 'Completa: «' + line.slice(0, b.i) + '____' + line.slice(b.i + b.w.length) + '» (' + p.title.replace(/ \(.*\)$/, '') + ')', answer: b.w, opts: memoryOptionsN(p, b.w, lv.opts) };
    }
  };
  function memoryOptionsN(p, word, n) {
    const pool = [];
    p.lines.join(' ').replace(WORD_RE, w => { if (w.length >= 4 && norm(w) !== norm(word) && !pool.some(x => norm(x) === norm(w))) pool.push(w); return w; });
    return shuffle([word].concat(shuffle(pool).slice(0, n - 1)));
  }
  const MIX = {
    beginner: ['saintQ', 'saintQ', 'heritage', 'country', 'beads', 'portrait'],
    intermediate: ['saintQ', 'heritage', 'scene', 'country', 'beads', 'rosaryDay', 'attribute', 'portrait'],
    advanced: ['saintQ', 'heritage', 'scene', 'attribute', 'earlier', 'rosaryDay', 'mysterySet', 'prayerWord', 'country'],
    expert: ['saintQ', 'scene', 'attribute', 'earlier', 'earlier', 'mysterySet', 'mysteryOrder', 'prayerWord', 'prayerWord', 'heritage', 'rosaryDay']
  };

  function buildRound(lv) {
    const qs = [], seen = new Set();
    const kinds = shuffle(MIX[lv.id]);
    let k = 0, guard = 0;
    while (qs.length < lv.n && guard++ < 200) {
      const g = GEN[kinds[k++ % kinds.length]](lv);
      if (!g || seen.has(g.q + g.answer)) continue;
      seen.add(g.q + g.answer);
      qs.push(g);
    }
    return { level: lv.id, qs, i: 0, correct: 0, answered: null };
  }

  function levelUnlocked(i, best) {
    const mine = LEVELS.findIndex(l => l.id === tier());
    if (i <= mine) return true;
    const prev = best[LEVELS[i - 1].id];
    return !!(prev && prev.stars >= 2);
  }

  function renderChallenge() {
    const best = data().challengeBest || {};
    const R = S.round;
    if (!R) {
      return '<section class="fe-challenge" aria-label="Desafío">' +
        '<h2 class="fe-sec-title">Desafío de fe</h2>' +
        '<p class="fe-today">Preguntas de santos, rosario, oraciones y herencia de Chile. Gana hasta 3 estrellas por nivel; con 2 estrellas se abre el nivel siguiente.</p>' +
        '<div class="fe-levels">' + LEVELS.map((l, i) => {
          const b = best[l.id], open = levelUnlocked(i, best), mine = l.id === tier();
          return '<button type="button" class="fe-level' + (mine ? ' is-mine' : '') + (open ? '' : ' is-locked') + '" data-act="level" data-l="' + l.id + '"' + (open ? '' : ' disabled aria-disabled="true"') + '>' +
            '<span class="fe-level-name">' + l.name + (mine ? ' <small>tu nivel</small>' : '') + '</span>' +
            '<span class="fe-level-meta">' + l.n + ' preguntas · ' + l.opts + ' opciones</span>' +
            '<span class="fe-level-stars" aria-label="' + (b ? b.stars : 0) + ' de 3 estrellas">' + starRow(b ? b.stars : 0) + '</span>' +
            (b ? '<span class="fe-level-best">Mejor: ' + b.score + '/' + b.total + '</span>' : '') +
            (open ? '' : '<span class="fe-level-lock">🔒 Gana 2 ⭐ en el nivel anterior</span>') +
            '</button>';
        }).join('') + '</div></section>';
    }
    if (R.i >= R.qs.length) {
      const total = R.qs.length, stars = starsFor(R.correct, total);
      return '<section class="fe-challenge"><div class="fe-result">' +
        '<div class="fe-result-stars">' + starRow(stars, true) + '</div>' +
        '<h2 class="fe-sec-title">' + (stars === 3 ? '¡Excelente!' : stars >= 2 ? '¡Muy bien!' : stars === 1 ? '¡Buen intento!' : 'Sigue practicando') + '</h2>' +
        '<p class="fe-today">' + R.correct + ' de ' + total + ' correctas' + (R.gained ? ' · ganaste ' + R.gained + ' ⭐' : '') + '</p>' +
        '<div class="fe-actions"><button type="button" class="fe-btn fe-btn-ghost" data-act="levels">Niveles</button><button type="button" class="fe-btn fe-btn-primary" data-act="level" data-l="' + R.level + '">Otra ronda ↻</button></div>' +
        '</div></section>';
    }
    const q = R.qs[R.i], ans = R.answered;
    return '<section class="fe-challenge"><div class="fe-round">' +
      '<div class="fe-round-head"><button type="button" class="fe-btn fe-btn-ghost fe-btn-sm" data-act="levels" aria-label="Volver a los niveles">← Niveles</button>' +
        '<div class="fe-progress" aria-label="Pregunta ' + (R.i + 1) + ' de ' + R.qs.length + '">' + R.qs.map((_, i) => '<i class="' + (i < R.i ? 'done' : i === R.i ? 'cur' : '') + '"></i>').join('') + '</div></div>' +
      (q.pic ? '<div class="fe-round-pic' + (q.kind === 'portrait' ? ' is-portrait' : '') + '">' + q.pic + '</div>' : '') +
      '<div class="fe-quiz-q">' + esc(q.q) + '</div>' +
      '<div class="fe-quiz-opts">' + q.opts.map(o => {
        let cls = '';
        if (ans !== null) { if (o === q.answer) cls = ' is-correct'; else if (o === ans) cls = ' is-wrong'; }
        return '<button type="button" class="fe-opt' + cls + '" data-act="round-ans" data-v="' + esc(o) + '"' + (ans !== null ? ' disabled' : '') + '>' + esc(o) + '</button>';
      }).join('') + '</div>' +
      (ans !== null ? '<div class="fe-explain ' + (ans === q.answer ? 'is-good' : 'is-bad') + '">' + (ans === q.answer ? '¡Correcto! ' : 'Respuesta: <strong>' + esc(q.answer) + '</strong>. ') + (q.explain ? esc(q.explain) : '') + '</div>' +
        '<div class="fe-actions"><button type="button" class="fe-btn fe-btn-primary" data-act="round-next">' + (R.i === R.qs.length - 1 ? 'Ver resultado ➔' : 'Siguiente ➔') + '</button></div>' : '') +
      '</div></section>';
  }
  function starsFor(c, t) { const r = t ? c / t : 0; return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0; }
  function starRow(n, big) { let s = ''; for (let i = 0; i < 3; i++) s += '<span class="fe-st' + (i < n ? ' on' : '') + (big ? ' big' : '') + '">★</span>'; return s; }

  function answerRound(v) {
    const R = S.round; if (!R || R.answered !== null) return;
    R.answered = v;
    if (v === R.qs[R.i].answer) { R.correct++; sfx('correct'); } else sfx('wrong');
    render();
  }
  function nextRound() {
    const R = S.round; if (!R) return;
    R.i++; R.answered = null;
    if (R.i >= R.qs.length) {
      const total = R.qs.length, stars = starsFor(R.correct, total);
      let gained = 0;
      FM.update(d => {
        d.challengeBest = d.challengeBest || {};
        const prev = d.challengeBest[R.level] || { score: 0, total, stars: 0 };
        gained = Math.max(0, stars - (prev.stars || 0));
        if (R.correct > (prev.score || 0) || stars > (prev.stars || 0)) d.challengeBest[R.level] = { score: Math.max(R.correct, prev.score || 0), total, stars: Math.max(stars, prev.stars || 0) };
        else return false;
      });
      R.gained = gained;
      if (gained) FM.addStar(gained);
      sfx(stars >= 2 ? 'cheer' : 'click');
    }
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Toast + confetti ──
  function toast(msg) {
    if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) { try { ZsDialog.toast(msg); return; } catch (e) {} }
    let t = document.getElementById('fe-toast');
    if (!t) { t = document.createElement('div'); t.id = 'fe-toast'; t.className = 'fe-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600);
  }

  window.showConfetti = function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 36; i++) {
      const c = document.createElement('div');
      c.className = 'fe-confetti';
      c.style.background = ['#F59E0B', '#FBBF24', '#FFF7D6', '#2457a8', '#b3122e'][i % 5];
      c.style.left = Math.random() * 100 + 'vw';
      document.body.appendChild(c);
      const duration = 1800 + Math.random() * 2200;
      c.animate([{ transform: 'translateY(-10px) rotate(0)', opacity: 1 }, { transform: 'translateY(100vh) rotate(' + (Math.random() * 900) + 'deg)', opacity: 0 }], { duration, easing: 'cubic-bezier(0,.9,.57,1)' });
      setTimeout(() => c.remove(), duration);
    }
  };

  // ── Events ──
  function onClick(e) {
    const tabBtn = e.target.closest('.fe-tab');
    if (tabBtn) return showTab(tabBtn.dataset.tab);
    const bead = e.target.closest('[data-bead]');
    if (bead && S.tab === 'rosary') return goToBead(bead.getAttribute('data-bead'));
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const i = +b.dataset.i;
    switch (b.dataset.act) {
      case 'prayer': S.prayerIndex = i; S.prayerLine = 0; S.memPicked = {}; sfx('click'); render(); break;
      case 'memory': S.memory = !S.memory; S.prayerLine = 0; S.memPicked = {}; sfx('click'); render(); break;
      case 'mem': pickMemory(b.dataset.w); break;
      case 'next-line': nextPrayerLine(); break;
      case 'saint': sfx('click'); selectSaint(i); break;
      case 'saint-ans': answerSaint(i); break;
      case 'saint-next': nextSaintStep(); break;
      case 'heritage': sfx('click'); S.heritageIndex = i; S.heritageAnswered = null; render(); break;
      case 'her-ans': answerHeritage(i); break;
      case 'her-next': nextHeritage(); break;
      case 'set': S.rosarySet = i; S.rosaryDecade = 0; S.rosaryStep = 0; S.rosarySalve = false; S.rosaryIntro = -1; sfx('click'); render(); break;
      case 'decade': S.rosaryDecade = i; S.rosaryStep = 0; S.rosarySalve = false; S.rosaryIntro = -1; sfx('click'); render(); break;
      case 'intro': S.rosaryIntro = 0; S.rosarySalve = false; sfx('click'); render(); break;
      case 'rosary-next': nextRosaryStep(); break;
      case 'mat': FM.update(d => { d.rosaryMaterial = b.dataset.m; }); sfx('click'); render(); break;
      case 'level': S.round = buildRound(LEVELS.find(l => l.id === b.dataset.l)); sfx('click'); render(); break;
      case 'levels': S.round = null; render(); break;
      case 'round-ans': answerRound(b.dataset.v); break;
      case 'round-next': nextRound(); break;
    }
  }

  function init() {
    // Auto-pull sync
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      const u = user();
      if (u) CloudSync.pull('zs_fe_' + u.name.toLowerCase().replace(/\s+/g, '_'));
    }
    document.addEventListener('click', onClick);
    renderChrome();
    render();
  }

  // Kept for anything that still calls the old global names.
  window.showTab = showTab;
  window.FeUI = { showTab, render, _state: S };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
