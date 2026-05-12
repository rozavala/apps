/* ================================================================
   VOCABULARIO VIVO — vocabulario-vivo.js
   Vocabulary through Latin/Greek roots, prefixes, suffixes.
   Hand-authored bilingual content. No external APIs.

   Requires: auth.js, sounds.js, activity-log.js, zs-diag.js
   ================================================================ */

const VocabularioVivo = (() => {
  'use strict';

  const STORE_PREFIX = 'zs_vocab_';

  // ── 30 Latin/Greek roots ─────────────────────────────────────────
  // tier: 1 = beginner (6-7), 2 = intermediate (8-9), 3 = advanced (10+)
  const ROOTS = [
    // ── Latin ──
    { id: 'aqua', origin: 'L', tier: 1,
      meaning: { en: 'water', es: 'agua' },
      words: [
        { en: 'aquarium',  es: 'acuario' },
        { en: 'aquatic',   es: 'acuático' },
        { en: 'aqueduct',  es: 'acueducto' },
        { en: 'aquamarine',es: 'aguamarina' }
      ] },
    { id: 'terra', origin: 'L', tier: 1,
      meaning: { en: 'earth, land', es: 'tierra' },
      words: [
        { en: 'terrain',     es: 'terreno' },
        { en: 'territory',   es: 'territorio' },
        { en: 'terrestrial', es: 'terrestre' },
        { en: 'extraterrestrial', es: 'extraterrestre' }
      ] },
    { id: 'bene', origin: 'L', tier: 2,
      meaning: { en: 'good, well', es: 'bueno, bien' },
      words: [
        { en: 'benefit',     es: 'beneficio' },
        { en: 'benevolent',  es: 'benévolo' },
        { en: 'benediction', es: 'bendición' },
        { en: 'beneficial',  es: 'benéfico' }
      ] },
    { id: 'mal', origin: 'L', tier: 2,
      meaning: { en: 'bad, evil', es: 'malo, mal' },
      words: [
        { en: 'malign',     es: 'maligno' },
        { en: 'malevolent', es: 'malévolo' },
        { en: 'malady',     es: 'malestar' },
        { en: 'malicious',  es: 'malicioso' }
      ] },
    { id: 'scrib', origin: 'L', tier: 2,
      meaning: { en: 'write', es: 'escribir' },
      words: [
        { en: 'scribe',     es: 'escriba' },
        { en: 'describe',   es: 'describir' },
        { en: 'inscription',es: 'inscripción' },
        { en: 'manuscript', es: 'manuscrito' }
      ] },
    { id: 'port', origin: 'L', tier: 1,
      meaning: { en: 'carry', es: 'llevar' },
      words: [
        { en: 'transport',  es: 'transporte' },
        { en: 'portable',   es: 'portátil' },
        { en: 'import',     es: 'importar' },
        { en: 'export',     es: 'exportar' }
      ] },
    { id: 'dict', origin: 'L', tier: 2,
      meaning: { en: 'say, speak', es: 'decir' },
      words: [
        { en: 'dictate',    es: 'dictar' },
        { en: 'predict',    es: 'predecir' },
        { en: 'contradict', es: 'contradecir' },
        { en: 'dictionary', es: 'diccionario' }
      ] },
    { id: 'spect', origin: 'L', tier: 2,
      meaning: { en: 'look at, watch', es: 'mirar' },
      words: [
        { en: 'inspector',   es: 'inspector' },
        { en: 'spectator',   es: 'espectador' },
        { en: 'perspective', es: 'perspectiva' },
        { en: 'spectacular', es: 'espectacular' }
      ] },
    { id: 'vid', origin: 'L', tier: 1,
      meaning: { en: 'see', es: 'ver' },
      words: [
        { en: 'video',   es: 'video' },
        { en: 'vision',  es: 'visión' },
        { en: 'visible', es: 'visible' },
        { en: 'evident', es: 'evidente' }
      ] },
    { id: 'aud', origin: 'L', tier: 1,
      meaning: { en: 'hear', es: 'oír' },
      words: [
        { en: 'audio',      es: 'audio' },
        { en: 'audience',   es: 'audiencia' },
        { en: 'auditorium', es: 'auditorio' },
        { en: 'audible',    es: 'audible' }
      ] },
    { id: 'cred', origin: 'L', tier: 3,
      meaning: { en: 'believe, trust', es: 'creer, confiar' },
      words: [
        { en: 'credit',    es: 'crédito' },
        { en: 'credible',  es: 'creíble' },
        { en: 'incredible',es: 'increíble' },
        { en: 'credo',     es: 'credo' }
      ] },
    { id: 'cent', origin: 'L', tier: 2,
      meaning: { en: 'hundred', es: 'cien' },
      words: [
        { en: 'century',    es: 'siglo' },
        { en: 'percent',    es: 'por ciento' },
        { en: 'centennial', es: 'centenario' },
        { en: 'centimeter', es: 'centímetro' }
      ] },
    { id: 'mille', origin: 'L', tier: 2,
      meaning: { en: 'thousand', es: 'mil' },
      words: [
        { en: 'million',    es: 'millón' },
        { en: 'millennium', es: 'milenio' },
        { en: 'millimeter', es: 'milímetro' },
        { en: 'millipede',  es: 'milpiés' }
      ] },
    { id: 'mort', origin: 'L', tier: 3,
      meaning: { en: 'death', es: 'muerte' },
      words: [
        { en: 'mortal',   es: 'mortal' },
        { en: 'immortal', es: 'inmortal' },
        { en: 'mortuary', es: 'mortuorio' },
        { en: 'mortify',  es: 'mortificar' }
      ] },
    { id: 'viv', origin: 'L', tier: 2,
      meaning: { en: 'life, live', es: 'vida, vivir' },
      words: [
        { en: 'vivid',    es: 'vívido' },
        { en: 'survive',  es: 'sobrevivir' },
        { en: 'revive',   es: 'revivir' },
        { en: 'vivarium', es: 'vivario' }
      ] },
    { id: 'ped', origin: 'L', tier: 2,
      meaning: { en: 'foot', es: 'pie' },
      words: [
        { en: 'pedal',      es: 'pedal' },
        { en: 'pedestrian', es: 'peatón' },
        { en: 'pedestal',   es: 'pedestal' },
        { en: 'biped',      es: 'bípedo' }
      ] },
    { id: 'man', origin: 'L', tier: 1,
      meaning: { en: 'hand', es: 'mano' },
      words: [
        { en: 'manual',     es: 'manual' },
        { en: 'manipulate', es: 'manipular' },
        { en: 'manuscript', es: 'manuscrito' },
        { en: 'manufacture',es: 'manufactura' }
      ] },
    { id: 'luc', origin: 'L', tier: 3,
      meaning: { en: 'light, clear', es: 'luz, claro' },
      words: [
        { en: 'lucid',       es: 'lúcido' },
        { en: 'translucent', es: 'translúcido' },
        { en: 'illuminate',  es: 'iluminar' },
        { en: 'elucidate',   es: 'elucidar' }
      ] },
    { id: 'sol', origin: 'L', tier: 1,
      meaning: { en: 'sun', es: 'sol' },
      words: [
        { en: 'solar',     es: 'solar' },
        { en: 'solstice',  es: 'solsticio' },
        { en: 'parasol',   es: 'parasol' },
        { en: 'solarium',  es: 'solario' }
      ] },
    { id: 'luna', origin: 'L', tier: 2,
      meaning: { en: 'moon', es: 'luna' },
      words: [
        { en: 'lunar',     es: 'lunar' },
        { en: 'lunatic',   es: 'lunático' },
        { en: 'lunation',  es: 'lunación' },
        { en: 'sublunar',  es: 'sublunar' }
      ] },

    // ── Greek ──
    { id: 'bio', origin: 'G', tier: 1,
      meaning: { en: 'life', es: 'vida' },
      words: [
        { en: 'biology',    es: 'biología' },
        { en: 'biography',  es: 'biografía' },
        { en: 'biosphere',  es: 'biosfera' },
        { en: 'antibiotic', es: 'antibiótico' }
      ] },
    { id: 'geo', origin: 'G', tier: 1,
      meaning: { en: 'earth', es: 'tierra' },
      words: [
        { en: 'geography', es: 'geografía' },
        { en: 'geology',   es: 'geología' },
        { en: 'geometry',  es: 'geometría' },
        { en: 'geothermal',es: 'geotérmico' }
      ] },
    { id: 'hydro', origin: 'G', tier: 2,
      meaning: { en: 'water', es: 'agua' },
      words: [
        { en: 'hydraulic',  es: 'hidráulico' },
        { en: 'hydrogen',   es: 'hidrógeno' },
        { en: 'dehydrate',  es: 'deshidratar' },
        { en: 'hydroplane', es: 'hidroavión' }
      ] },
    { id: 'tele', origin: 'G', tier: 1,
      meaning: { en: 'far, distant', es: 'lejos, distancia' },
      words: [
        { en: 'telephone',  es: 'teléfono' },
        { en: 'television', es: 'televisión' },
        { en: 'telescope',  es: 'telescopio' },
        { en: 'telepathy',  es: 'telepatía' }
      ] },
    { id: 'micro', origin: 'G', tier: 1,
      meaning: { en: 'small', es: 'pequeño' },
      words: [
        { en: 'microscope', es: 'microscopio' },
        { en: 'microwave',  es: 'microondas' },
        { en: 'microbe',    es: 'microbio' },
        { en: 'microbiology', es: 'microbiología' }
      ] },
    { id: 'macro', origin: 'G', tier: 3,
      meaning: { en: 'large, long', es: 'grande, largo' },
      words: [
        { en: 'macroscopic', es: 'macroscópico' },
        { en: 'macrobiotic', es: 'macrobiótico' },
        { en: 'macrocosm',   es: 'macrocosmos' },
        { en: 'macroeconomics', es: 'macroeconomía' }
      ] },
    { id: 'chrono', origin: 'G', tier: 3,
      meaning: { en: 'time', es: 'tiempo' },
      words: [
        { en: 'chronology', es: 'cronología' },
        { en: 'chronic',    es: 'crónico' },
        { en: 'anachronism',es: 'anacronismo' },
        { en: 'synchronise',es: 'sincronizar' }
      ] },
    { id: 'photo', origin: 'G', tier: 2,
      meaning: { en: 'light', es: 'luz' },
      words: [
        { en: 'photograph',    es: 'fotografía' },
        { en: 'photosynthesis',es: 'fotosíntesis' },
        { en: 'photon',        es: 'fotón' },
        { en: 'telephoto',     es: 'telefoto' }
      ] },
    { id: 'astro', origin: 'G', tier: 1,
      meaning: { en: 'star', es: 'estrella' },
      words: [
        { en: 'astronaut', es: 'astronauta' },
        { en: 'astronomy', es: 'astronomía' },
        { en: 'asteroid',  es: 'asteroide' },
        { en: 'astrology', es: 'astrología' }
      ] },
    { id: 'graph', origin: 'G', tier: 2,
      meaning: { en: 'write, draw', es: 'escribir, dibujar' },
      words: [
        { en: 'graphic',   es: 'gráfico' },
        { en: 'autograph', es: 'autógrafo' },
        { en: 'paragraph', es: 'párrafo' },
        { en: 'biography', es: 'biografía' }
      ] }
  ];

  // ── 20 build tasks: meaning + parts → assembled word ─────────────
  // tier matches the root's tier roughly. Pieces appear shuffled with
  // 2-3 decoys at runtime.
  const BUILDS = [
    { tier: 1, prefix: '',      root: 'aqua',   suffix: 'rium',
      en: { meaning: 'a tank for water creatures', word: 'aquarium' },
      es: { meaning: 'un tanque para criaturas de agua', word: 'acuario' } },
    { tier: 1, prefix: '',      root: 'aqua',   suffix: 'duct',
      en: { meaning: 'a channel that carries water', word: 'aqueduct' },
      es: { meaning: 'un canal que lleva agua', word: 'acueducto' } },
    { tier: 1, prefix: 'trans', root: 'port',   suffix: '',
      en: { meaning: 'to carry across (places or things)', word: 'transport' },
      es: { meaning: 'llevar de un lugar a otro', word: 'transporte' } },
    { tier: 1, prefix: '',      root: 'tele',   suffix: 'phone',
      en: { meaning: 'a device for far-sound', word: 'telephone' },
      es: { meaning: 'un aparato de sonido a distancia', word: 'teléfono' } },
    { tier: 1, prefix: '',      root: 'micro',  suffix: 'scope',
      en: { meaning: 'a tool to look at small things', word: 'microscope' },
      es: { meaning: 'instrumento para mirar cosas pequeñas', word: 'microscopio' } },
    { tier: 1, prefix: '',      root: 'astro',  suffix: 'naut',
      en: { meaning: 'a star-sailor (space traveller)', word: 'astronaut' },
      es: { meaning: 'navegante de las estrellas', word: 'astronauta' } },
    { tier: 1, prefix: '',      root: 'bio',    suffix: 'logy',
      en: { meaning: 'the study of life', word: 'biology' },
      es: { meaning: 'el estudio de la vida', word: 'biología' } },
    { tier: 1, prefix: '',      root: 'geo',    suffix: 'graphy',
      en: { meaning: 'writing about the earth', word: 'geography' },
      es: { meaning: 'descripción de la tierra', word: 'geografía' } },
    { tier: 2, prefix: 'pre',   root: 'dict',   suffix: '',
      en: { meaning: 'to say something before it happens', word: 'predict' },
      es: { meaning: 'decir antes de que ocurra', word: 'predecir' } },
    { tier: 2, prefix: 'in',    root: 'spect',  suffix: 'or',
      en: { meaning: 'someone who looks into things', word: 'inspector' },
      es: { meaning: 'alguien que mira con atención', word: 'inspector' } },
    { tier: 2, prefix: 'in',    root: 'cred',   suffix: 'ible',
      en: { meaning: 'not believable; amazing', word: 'incredible' },
      es: { meaning: 'que no se puede creer; asombroso', word: 'increíble' } },
    { tier: 2, prefix: '',      root: 'man',    suffix: 'ual',
      en: { meaning: 'done by hand; an instruction book', word: 'manual' },
      es: { meaning: 'hecho a mano; libro de instrucciones', word: 'manual' } },
    { tier: 2, prefix: 'sur',   root: 'viv',    suffix: 'e',
      en: { meaning: 'to continue living through hardship', word: 'survive' },
      es: { meaning: 'seguir viviendo a pesar de las dificultades', word: 'sobrevivir' } },
    { tier: 2, prefix: '',      root: 'photo',  suffix: 'graph',
      en: { meaning: 'a picture written with light', word: 'photograph' },
      es: { meaning: 'una imagen escrita con luz', word: 'fotografía' } },
    { tier: 2, prefix: 'auto',  root: 'graph',  suffix: '',
      en: { meaning: 'a self-written signature', word: 'autograph' },
      es: { meaning: 'una firma escrita por uno mismo', word: 'autógrafo' } },
    { tier: 3, prefix: 'in',    root: 'scrib',  suffix: 'e',
      en: { meaning: 'to write on a surface', word: 'inscribe' },
      es: { meaning: 'escribir sobre una superficie', word: 'inscribir' } },
    { tier: 3, prefix: 'im',    root: 'mort',   suffix: 'al',
      en: { meaning: 'never-dying', word: 'immortal' },
      es: { meaning: 'que nunca muere', word: 'inmortal' } },
    { tier: 3, prefix: 'trans', root: 'luc',    suffix: 'ent',
      en: { meaning: 'letting light through partially', word: 'translucent' },
      es: { meaning: 'que deja pasar la luz parcialmente', word: 'translúcido' } },
    { tier: 3, prefix: 'syn',   root: 'chrono', suffix: 'us',
      en: { meaning: 'happening at the same time', word: 'synchronous' },
      es: { meaning: 'que ocurre al mismo tiempo', word: 'sincrónico' } },
    { tier: 3, prefix: 'de',    root: 'hydro',  suffix: 'ate',
      en: { meaning: 'to remove water from', word: 'dehydrate' },
      es: { meaning: 'quitarle el agua a algo', word: 'deshidratar' } }
  ];

  // ── State ──
  const state = {
    lang: 'en',
    mode: null,
    rootList: 'all',  // 'all' | tier number
    matchSession: null,
    buildIdx: 0
  };

  // ── Storage ──
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try { return JSON.parse(localStorage.getItem(_storageKey())) || {}; }
    catch { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch {}
    }
  }

  function _l(obj, fallback) {
    if (!obj) return fallback || '';
    if (typeof obj === 'string') return obj;
    return obj[state.lang] || obj.en || fallback || '';
  }

  function _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // ── Screens ──
  function _showScreen(id) {
    document.querySelectorAll('.vv-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function _renderHome() {
    const prog = _loadProgress();
    const seenRoots = (prog.seenRoots || []).length;
    const matchScore = prog.matchBest || 0;
    const buildsDone = (prog.builds || []).length;
    document.getElementById('vv-roots-stat').textContent = seenRoots + '/' + ROOTS.length;
    document.getElementById('vv-match-stat').textContent = matchScore + ' ' + (state.lang === 'es' ? 'mejor' : 'best');
    document.getElementById('vv-build-stat').textContent = buildsDone + '/' + BUILDS.length;
    _showScreen('vv-screen-home');
  }

  // ── Roots browser ──
  function openRoots() {
    state.mode = 'roots';
    _renderRootList();
    _showScreen('vv-screen-roots');
  }

  function _renderRootList() {
    const grid = document.getElementById('vv-root-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const prog = _loadProgress();
    const seen = new Set(prog.seenRoots || []);
    const filter = state.rootList;
    const filtered = ROOTS.filter(r => filter === 'all' || r.tier === Number(filter));
    filtered.forEach(r => {
      const card = document.createElement('button');
      card.className = 'vv-root-card vv-tier-' + r.tier + (seen.has(r.id) ? ' vv-seen' : '');
      card.innerHTML =
        '<span class="vv-root-id">' + r.id + '-</span>' +
        '<span class="vv-root-origin">' + (r.origin === 'L' ? 'Latín' : 'Griego') + '</span>' +
        '<span class="vv-root-meaning">' + _l(r.meaning) + '</span>' +
        '<span class="vv-root-tier">' +
          '🟢'.repeat(r.tier) + '⚪'.repeat(3 - r.tier) +
        '</span>';
      card.onclick = () => _openRoot(r.id);
      grid.appendChild(card);
    });
    document.querySelectorAll('.vv-tier-filter').forEach(b => {
      b.classList.toggle('vv-active', b.dataset.tier === String(state.rootList));
    });
  }

  function _openRoot(id) {
    const r = ROOTS.find(x => x.id === id);
    if (!r) return;
    const prog = _loadProgress();
    prog.seenRoots = prog.seenRoots || [];
    if (prog.seenRoots.indexOf(r.id) === -1) {
      prog.seenRoots.push(r.id);
      _saveProgress(prog);
    }
    const wrap = document.getElementById('vv-root-detail');
    wrap.innerHTML =
      '<button class="vv-back-btn" onclick="VocabularioVivo.backToRootList()">←</button>' +
      '<div class="vv-root-header">' +
        '<div class="vv-root-big-id">' + r.id + '-</div>' +
        '<div class="vv-root-big-origin">' + (r.origin === 'L' ? '🏛️ Latín' : '🏺 Griego') + '</div>' +
        '<div class="vv-root-big-meaning">' + _l(r.meaning) + '</div>' +
      '</div>' +
      '<h3 class="vv-words-title">' + (state.lang === 'es' ? 'Familia de palabras' : 'Word family') + '</h3>' +
      '<div class="vv-words">' +
        r.words.map(w =>
          '<div class="vv-word-pair">' +
            '<span class="vv-word-en">' + w.en + '</span>' +
            '<span class="vv-word-arrow">↔</span>' +
            '<span class="vv-word-es">' + w.es + '</span>' +
          '</div>'
        ).join('') +
      '</div>';
    _showScreen('vv-screen-root-detail');
  }

  function backToRootList() { _showScreen('vv-screen-roots'); }

  function filterRoots(tier) {
    state.rootList = tier;
    _renderRootList();
  }

  // ── Match mode ──
  // For each puzzle: pick a random word from a random root, ask which
  // root it comes from, present the correct root + 3 decoys.
  const MATCH_TARGET = 10;

  function openMatch() {
    state.mode = 'match';
    state.matchSession = {
      idx: 0,
      correct: 0,
      total: MATCH_TARGET,
      queue: _buildMatchQueue(MATCH_TARGET)
    };
    _renderMatchQuestion();
    _showScreen('vv-screen-match');
  }

  function _buildMatchQueue(n) {
    // Pull from roots that have enough words; ensure no duplicate words
    const seen = new Set();
    const out = [];
    let safety = 200;
    while (out.length < n && safety-- > 0) {
      const root = ROOTS[Math.floor(Math.random() * ROOTS.length)];
      if (!root.words || !root.words.length) continue;
      const w = root.words[Math.floor(Math.random() * root.words.length)];
      const key = root.id + '|' + (state.lang === 'es' ? w.es : w.en);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ rootId: root.id, word: w });
    }
    return out;
  }

  function _renderMatchQuestion() {
    const sess = state.matchSession;
    const item = sess.queue[sess.idx];
    if (!item) return _finishMatch();
    const root = ROOTS.find(r => r.id === item.rootId);
    const wrap = document.getElementById('vv-match-wrap');
    const word = state.lang === 'es' ? item.word.es : item.word.en;

    // Pick 3 decoy roots not equal to the correct one
    const decoys = _shuffle(ROOTS.filter(r => r.id !== root.id)).slice(0, 3);
    const options = _shuffle([root, ...decoys]);

    wrap.innerHTML =
      '<div class="vv-match-meta">' +
        '<span>' + (sess.idx + 1) + ' / ' + sess.total + '</span>' +
        '<span>✓ ' + sess.correct + '</span>' +
      '</div>' +
      '<h2 class="vv-match-q">' +
        (state.lang === 'es' ? '¿De qué raíz viene' : 'Which root is in') +
        ' <span class="vv-match-word">' + word + '</span>?</h2>' +
      '<div class="vv-match-options">' +
        options.map(opt =>
          '<button class="vv-match-opt" data-root="' + opt.id + '">' +
            '<span class="vv-opt-id">' + opt.id + '-</span>' +
            '<span class="vv-opt-meaning">' + _l(opt.meaning) + '</span>' +
          '</button>'
        ).join('') +
      '</div>';

    wrap.querySelectorAll('.vv-match-opt').forEach(btn => {
      btn.onclick = () => {
        const chose = btn.dataset.root;
        const correct = chose === root.id;
        btn.classList.add(correct ? 'vv-correct' : 'vv-wrong');
        if (correct) sess.correct++;
        else {
          // Highlight the actual answer
          const actual = wrap.querySelector('[data-root="' + root.id + '"]');
          if (actual) actual.classList.add('vv-actual');
        }
        if (typeof SFX !== 'undefined') {
          (correct && SFX.correct) ? SFX.correct() : (SFX.wrong && SFX.wrong());
        }
        setTimeout(() => {
          sess.idx++;
          _renderMatchQuestion();
        }, 750);
      };
    });
  }

  function _finishMatch() {
    const sess = state.matchSession;
    const acc = sess.total > 0 ? sess.correct / sess.total : 0;
    const stars = acc >= 0.95 ? 3 : acc >= 0.80 ? 2 : 1;

    const prog = _loadProgress();
    prog.matchBest = Math.max(prog.matchBest || 0, sess.correct);
    prog.matchStars = Math.max(prog.matchStars || 0, stars);
    _saveProgress(prog);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🎯',
        (state.lang === 'es' ? 'Empareja: ' : 'Match: ') +
        sess.correct + '/' + sess.total + ' ⭐'.repeat(stars));
    }

    document.getElementById('vv-match-result').innerHTML =
      '<div class="vv-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>' +
      '<p>' + sess.correct + ' / ' + sess.total + ' ' + (state.lang === 'es' ? 'correctas' : 'correct') + '</p>' +
      '<button class="vv-primary-btn" onclick="VocabularioVivo.openMatch()">' +
        (state.lang === 'es' ? '↺ Otra vez' : '↺ Play again') +
      '</button>' +
      ' <button class="vv-secondary-btn" onclick="VocabularioVivo.goHome()">' +
        (state.lang === 'es' ? '← Inicio' : '← Home') +
      '</button>';
    _showScreen('vv-screen-match-result');
  }

  // ── Build mode ──
  function openBuild() {
    state.mode = 'build';
    const prog = _loadProgress();
    const done = new Set(prog.builds || []);
    // Start from the first undone task; if all done, restart from 0
    let idx = BUILDS.findIndex((b, i) => !done.has(i));
    if (idx < 0) idx = 0;
    state.buildIdx = idx;
    _renderBuild();
    _showScreen('vv-screen-build');
  }

  function _renderBuild() {
    const b = BUILDS[state.buildIdx];
    if (!b) return _finishBuild();

    const wrap = document.getElementById('vv-build-wrap');
    const meaning = state.lang === 'es' ? b.es.meaning : b.en.meaning;
    const answer  = state.lang === 'es' ? b.es.word    : b.en.word;

    // Build the parts: [prefix, root, suffix] — empty strings ignored.
    // Decoys: throw in 2 random affixes from other tasks.
    const realParts = [b.prefix, b.root, b.suffix].filter(Boolean);
    const decoys = _pickDecoyAffixes(b, 3);
    const tiles = _shuffle(realParts.concat(decoys)).map((p, i) => ({ id: i, text: p, real: realParts.indexOf(p) }));

    wrap.innerHTML =
      '<div class="vv-build-meta">' +
        '<span>' + (state.buildIdx + 1) + ' / ' + BUILDS.length + '</span>' +
      '</div>' +
      '<h2 class="vv-build-meaning">' + meaning + '</h2>' +
      '<div class="vv-build-slots" id="vv-build-slots">' +
        '<div class="vv-build-slot" data-slot="0"></div>' +
        '<span class="vv-build-plus">+</span>' +
        '<div class="vv-build-slot" data-slot="1"></div>' +
        '<span class="vv-build-plus">+</span>' +
        '<div class="vv-build-slot" data-slot="2"></div>' +
      '</div>' +
      '<div class="vv-build-tiles" id="vv-build-tiles">' +
        tiles.map(t =>
          '<button class="vv-build-tile" data-text="' + t.text + '">' + t.text + '-</button>'
        ).join('') +
      '</div>' +
      '<div class="vv-build-actions">' +
        '<button class="vv-secondary-btn" id="vv-build-clear">' +
          (state.lang === 'es' ? '↺ Limpiar' : '↺ Clear') +
        '</button>' +
        '<button class="vv-primary-btn" id="vv-build-check">' +
          (state.lang === 'es' ? '✓ Comprobar' : '✓ Check') +
        '</button>' +
      '</div>' +
      '<div class="vv-build-feedback" id="vv-build-feedback"></div>';

    // Tap a tile → place it in the next empty slot. Tap a filled slot to remove.
    function nextSlot() {
      for (const sl of wrap.querySelectorAll('.vv-build-slot')) {
        if (!sl.dataset.filled) return sl;
      }
      return null;
    }
    wrap.querySelectorAll('.vv-build-tile').forEach(tile => {
      tile.onclick = () => {
        if (tile.classList.contains('vv-used')) return;
        const slot = nextSlot();
        if (!slot) return;
        slot.textContent = tile.dataset.text + '-';
        slot.dataset.filled = '1';
        slot.dataset.from = tile.dataset.text;
        tile.classList.add('vv-used');
      };
    });
    wrap.querySelectorAll('.vv-build-slot').forEach(slot => {
      slot.onclick = () => {
        if (!slot.dataset.filled) return;
        const from = slot.dataset.from;
        slot.textContent = '';
        delete slot.dataset.filled;
        delete slot.dataset.from;
        const tile = wrap.querySelector('.vv-build-tile[data-text="' + from + '"].vv-used');
        if (tile) tile.classList.remove('vv-used');
      };
    });

    document.getElementById('vv-build-clear').onclick = () => _renderBuild();
    document.getElementById('vv-build-check').onclick = () => _checkBuild(b, answer);
  }

  function _pickDecoyAffixes(target, n) {
    const pool = [];
    BUILDS.forEach(b => {
      if (b === target) return;
      if (b.prefix) pool.push(b.prefix);
      if (b.suffix) pool.push(b.suffix);
    });
    const realSet = new Set([target.prefix, target.root, target.suffix].filter(Boolean));
    return _shuffle(pool.filter(p => !realSet.has(p))).slice(0, n);
  }

  function _checkBuild(b, answer) {
    const slots = document.querySelectorAll('#vv-build-slots .vv-build-slot');
    const parts = [];
    slots.forEach(s => { if (s.dataset.from) parts.push(s.dataset.from); });
    const expectedParts = [b.prefix, b.root, b.suffix].filter(Boolean);
    const fb = document.getElementById('vv-build-feedback');

    // Compare assembled parts in order to expected parts.
    const ok = parts.length === expectedParts.length &&
               parts.every((p, i) => p === expectedParts[i]);

    if (ok) {
      const prog = _loadProgress();
      prog.builds = prog.builds || [];
      if (prog.builds.indexOf(state.buildIdx) === -1) prog.builds.push(state.buildIdx);
      _saveProgress(prog);
      if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
      fb.className = 'vv-build-feedback vv-feedback-good';
      fb.innerHTML =
        '✨ <strong>' + answer + '</strong> — ' +
        (state.lang === 'es' ? '¡Bien hecho!' : 'Well done!') +
        ' <button class="vv-primary-btn vv-next-btn" id="vv-build-next">' +
          (state.lang === 'es' ? 'Siguiente →' : 'Next →') +
        '</button>';
      document.getElementById('vv-build-next').onclick = () => {
        if (state.buildIdx + 1 < BUILDS.length) {
          state.buildIdx++;
          _renderBuild();
        } else {
          _finishBuild();
        }
      };

      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Vocabulario Vivo', '🔨',
          (state.lang === 'es' ? 'Construyó "' : 'Built "') + answer + '"');
      }
    } else {
      if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
      fb.className = 'vv-build-feedback vv-feedback-bad';
      fb.textContent = (state.lang === 'es'
        ? 'Aún no. Revisa el orden de las piezas.'
        : 'Not quite. Check the order of the pieces.');
    }
  }

  function _finishBuild() {
    document.getElementById('vv-build-wrap').innerHTML =
      '<div class="vv-stars">⭐⭐⭐</div>' +
      '<p>' + (state.lang === 'es' ? '¡Completaste todas las construcciones!' : 'You finished every build!') + '</p>' +
      '<button class="vv-primary-btn" onclick="VocabularioVivo.goHome()">' +
        (state.lang === 'es' ? '← Inicio' : '← Home') +
      '</button>';
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Vocabulario Vivo', '🏆',
        (state.lang === 'es' ? 'Terminó todas las construcciones' : 'Finished every build'));
    }
  }

  // ── Language toggle + nav ──
  function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'es' : 'en';
    const lbl = document.getElementById('vv-lang-label');
    if (lbl) lbl.textContent = state.lang === 'es' ? 'ES / EN' : 'EN / ES';
    if (state.mode === 'roots') _renderRootList();
    else if (state.mode === 'match' && state.matchSession) _renderMatchQuestion();
    else if (state.mode === 'build') _renderBuild();
    _renderHome();
  }

  function goHome() {
    state.mode = null;
    _renderHome();
  }

  // ── Init ──
  function init() {
    document.getElementById('vv-tile-roots').onclick = openRoots;
    document.getElementById('vv-tile-match').onclick = openMatch;
    document.getElementById('vv-tile-build').onclick = openBuild;
    document.getElementById('vv-lang-toggle').onclick = toggleLanguage;
    document.querySelectorAll('.vv-home-btn').forEach(b => { b.onclick = goHome; });
    document.querySelectorAll('.vv-tier-filter').forEach(b => {
      b.onclick = () => filterRoots(b.dataset.tier);
    });
    _renderHome();
  }

  return {
    init, goHome,
    openRoots, openMatch, openBuild,
    backToRootList, filterRoots,
    toggleLanguage
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof VocabularioVivo !== 'undefined') VocabularioVivo.init();
});
