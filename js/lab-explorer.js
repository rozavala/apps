/* ================================================================
   LAB EXPLORER — lab-explorer.js  (core)
   Virtual science lab for kids: ten hands-on experiments, each with
   its own challenges (goals and predict-then-test questions).

   Files:
     lab-explorer-art.js    illustrated cards + shared canvas art (LXArt)
     lab-explorer-data.js   star catalogue for the Night Sky (LXData)
     lab-explorer-labs1.js  colors, water, plants, physics, magnets
     lab-explorer-labs2.js  weather, astronomy, sound, crystals, static
     lab-explorer.js        this file: screens, storage, challenge engine

   Requires: auth.js, sounds.js, dialog.js
   Storage key: zs_lab_[username] via getUserAppKey('zs_lab_')

   Saved shape (every field the earlier version wrote is kept):
     { <labId>: { completed, stars,        <- as before
                  base,                    <- ADDED: stars held before v3
                  ch: { <challengeId>: n } <- ADDED: best stars per challenge
                },
       weather: { log: [...], ...same lab fields },
       totalStars }                        <- what the suite's star rule reads
   totalStars only ever grows: each new challenge star adds 1 to it, and
   logging the weather on a new day adds 1 as it always did.
   ================================================================ */

const LabExplorer = (() => {
  'use strict';

  // ── Lab Topics ── (ids and experiment ids unchanged from v2)
  const LABS = [
    { id: 'colors', icon: '🎨', category: 'chemistry',    title: 'Color Mixing',       es: 'Mezcla de colores',   ageMin: 4, accent: '#DB2777',
      desc: 'Paint on a palette and beams of light: two different ways colors mix.',
      experiments: [{ id: 'primary', title: 'Color Mixing' }] },
    { id: 'water', icon: '💧', category: 'earth_science',     title: 'Water Cycle',        es: 'El ciclo del agua',   ageMin: 5, accent: '#0284C7',
      desc: 'Heat the sea, build a cloud, blow it to the mountains and make it rain.',
      experiments: [{ id: 'cycle', title: 'The Water Cycle' }] },
    { id: 'plants', icon: '🌱', category: 'biology',    title: 'Plant Growth',       es: 'Crecen las plantas',  ageMin: 4, accent: '#16A34A',
      desc: 'Two bean pots, day by day. Change the light or the water and compare.',
      experiments: [{ id: 'growth', title: 'Growing Plants' }] },
    { id: 'physics', icon: '⚙️', category: 'physics',   title: 'Simple Machines',    es: 'La palanca',          ageMin: 6, accent: '#B45309',
      desc: 'A seesaw lever with real weights. Balance heavy with light.',
      experiments: [{ id: 'lever', title: 'Levers & Balance' }] },
    { id: 'magnets', icon: '🧲', category: 'physics',   title: 'Magnets',            es: 'Imanes',              ageMin: 5, accent: '#DC2626',
      desc: 'Iron filings, compasses and a bar magnet. See the invisible field.',
      experiments: [{ id: 'magnetism', title: 'Magnetic Fields' }] },
    { id: 'weather', icon: '☁️', category: 'earth_science',   title: 'Weather Station',    es: 'Estación del tiempo', ageMin: 5, accent: '#2563EB',
      desc: 'Spot cloud types, then log the real weather outside every day.',
      experiments: [{ id: 'log', title: 'Weather Station' }] },
    { id: 'astronomy', icon: '🌙', category: 'astronomy', title: 'Night Sky',          es: 'El cielo de Chile',   ageMin: 6, accent: '#4338CA',
      desc: 'The southern sky from Chile: Cruz del Sur, Orion, Scorpius and more.',
      experiments: [{ id: 'space', title: 'Southern Sky' }] },
    { id: 'sound', icon: '🔊', category: 'physics',     title: 'Sound Waves',        es: 'Ondas de sonido',     ageMin: 6, accent: '#0D9488',
      desc: 'A speaker and an oscilloscope. Change the pitch and see the wave.',
      experiments: [{ id: 'oscilloscope', title: 'Oscilloscope' }] },
    { id: 'crystals', icon: '💎', category: 'chemistry',  title: 'Crystal Growing',    es: 'Cristales',           ageMin: 7, accent: '#7C3AED',
      desc: 'Dissolve, hang a string, cool slowly and grow crystals in a jar.',
      experiments: [{ id: 'grow', title: 'Crystal Jar' }] },
    { id: 'static', icon: '⚡', category: 'physics',    title: 'Static Electricity', es: 'Electricidad estática', ageMin: 6, accent: '#EA580C',
      desc: 'Rub a balloon on hair. Lift paper bits and bend a stream of water.',
      experiments: [{ id: 'balloon', title: 'Balloon Lab' }] }
  ];

  const TIERS = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

  // ── State ──
  let currentLab = null;     // LABS entry
  let mod = null;            // LXLabs[id]
  let api = null;
  let stars = 0;             // stars earned this session (results screen)
  let journalEntries = [];
  let canvas, ctx, wrap;
  let raf = 0, lastT = 0;
  let view = { W: 600, H: 420, narrow: false, scale: 1, cssW: 600 };
  let active = 0;            // index into visible challenges
  let predictions = {};      // challengeId -> choice index (this session)
  let pointerId = null;
  let winTimer = 0;

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    // Saves used to land on a bare `lab<kid>` key — see
    // adoptLegacyAppKey in auth.js for what that cost.
    if (typeof adoptLegacyAppKey === 'function') adoptLegacyAppKey('lab', 'zs_lab_');
    return getUserAppKey('zs_lab_');
  }

  function _load() {
    const key = _key();
    if (!key) return {};
    try {
      const d = JSON.parse(localStorage.getItem(key));
      return (d && typeof d === 'object') ? d : {};
    } catch (e) { return {}; }
  }

  function _save(data) {
    const key = _key();
    if (key) {
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* full */ }
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
    }
  }

  // The record for one lab, created if missing. Old records keep
  // their fields; `base` freezes the stars they held before
  // challenges existed so those are never lost.
  function _rec(data, labId) {
    let rec = data[labId];
    if (!rec || typeof rec !== 'object') rec = data[labId] = {};
    if (typeof rec.completed !== 'number') rec.completed = rec.completed ? +rec.completed || 0 : 0;
    if (typeof rec.stars !== 'number') rec.stars = +rec.stars || 0;
    if (typeof rec.base !== 'number') rec.base = rec.stars || 0;
    if (!rec.ch || typeof rec.ch !== 'object') rec.ch = {};
    return rec;
  }

  function _chSum(rec) {
    let n = 0;
    for (const k in (rec.ch || {})) n += Math.max(0, +rec.ch[k] || 0);
    return n;
  }

  function _tierLevel() {
    const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    const t = typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate';
    return TIERS[t] != null ? TIERS[t] : 1;
  }

  function _visible(m) {
    const lv = _tierLevel();
    return ((m && m.challenges) || []).filter(c => {
      const t = c.tier || [0, 3];
      return lv >= t[0] && lv <= t[1];
    });
  }

  function _modFor(id) { return (window.LXLabs || {})[id] || null; }

  function _refreshNavStars() {
    const el = document.getElementById('zs-star-count');
    if (el && typeof getTotalStars === 'function') {
      try { el.textContent = '⭐ ' + getTotalStars(); } catch (e) { /* ignore */ }
    }
  }

  // ── Home ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    const age = user.age || 6;
    const grid = document.getElementById('lab-grid');
    const data = _load();

    const greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = 'Welcome, ' + user.name + '!';
    const hero = document.getElementById('lx-hero');
    if (hero && window.LXArt && !hero.firstChild) hero.innerHTML = LXArt.hero();

    const available = LABS.filter(l => age >= l.ageMin);
    let doneAll = 0, totalAll = 0;

    if (grid) {
      grid.innerHTML = available.map(lab => {
        const rec = data[lab.id] && typeof data[lab.id] === 'object' ? data[lab.id] : {};
        const vis = _visible(_modFor(lab.id));
        const done = vis.filter(c => rec.ch && rec.ch[c.id] > 0).length;
        const earned = vis.reduce((s, c) => s + Math.min(c.stars || 1, (rec.ch && rec.ch[c.id]) || 0), 0);
        const max = vis.reduce((s, c) => s + (c.stars || 1), 0);
        doneAll += done; totalAll += vis.length;
        const pct = vis.length ? Math.round(done / vis.length * 100) : 0;
        const art = window.LXArt ? LXArt.card(lab.id) : '';
        return '<button type="button" class="lab-card lab-' + lab.id + '" style="--acc:' + lab.accent + '" ' +
            'onclick="LabExplorer.startLab(\'' + lab.id + '\')" aria-label="' + escHtml(lab.title) + ': ' + done + ' of ' + vis.length + ' challenges done">' +
          '<span class="lab-art">' + art + '</span>' +
          '<span class="lab-body">' +
            '<span class="lab-title">' + escHtml(lab.title) + '</span>' +
            '<span class="lab-es">' + escHtml(lab.es) + '</span>' +
            '<span class="lab-desc">' + escHtml(lab.desc) + '</span>' +
            '<span class="lab-progress"><span class="lab-progress-bar" style="width:' + pct + '%"></span></span>' +
            '<span class="lab-progress-text"><span>' + done + '/' + vis.length + ' challenges</span>' +
              '<span class="lab-star">★ ' + earned + '/' + max + '</span></span>' +
          '</span>' +
        '</button>';
      }).join('');
    }

    const sum = document.getElementById('lx-summary');
    if (sum) sum.textContent = '★ ' + (data.totalStars || 0) + ' stars · ' + doneAll + ' of ' + totalAll + ' challenges done';

    canvas = document.getElementById('exp-canvas');
    wrap = document.getElementById('exp-canvas-wrap');
    if (canvas) ctx = canvas.getContext('2d');
  }

  // ── Experiment screen ──
  function startLab(labId) {
    const lab = LABS.find(l => l.id === labId);
    if (!lab) return;
    _stopLab();
    currentLab = lab;
    mod = _modFor(labId);
    stars = 0;
    journalEntries = [];
    predictions = {};
    document.getElementById('exp-journal').innerHTML = '';
    _showScreen('experiment');
    window.scrollTo(0, 0);
    _renderExperiment();
  }

  function _renderExperiment() {
    const exp = currentLab.experiments[0];
    document.getElementById('exp-title').textContent = currentLab.title;
    document.getElementById('exp-sub').textContent = currentLab.es + ' · ' + exp.title;
    const ic = document.getElementById('exp-title-ic');
    if (ic && window.LXArt) ic.innerHTML = LXArt.card(currentLab.id);
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('exp-controls').innerHTML = '';
    document.getElementById('exp-canvas-wrap').style.setProperty('--acc', currentLab.accent);
    document.getElementById('screen-experiment').style.setProperty('--acc', currentLab.accent);

    const vis = _visible(mod);
    const data = _load();
    const rec = data[currentLab.id] || {};
    active = Math.max(0, vis.findIndex(c => !(rec.ch && rec.ch[c.id] > 0)));
    _updateHeaderStars();

    _fit();
    _bindPointer();
    if (mod) {
      api = _makeApi();
      mod.start(api);
      _renderChallenge();
      _notifyActive();
    } else {
      _renderChallenge();
    }
    lastT = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(_loop);
  }

  function _fit() {
    if (!canvas || !wrap) return;
    const cssW = Math.max(240, wrap.clientWidth || 600);
    const narrow = cssW < 560;
    const W = 600, H = narrow ? 640 : 420;
    const cssH = Math.round(cssW * H / W);
    canvas.style.height = cssH + 'px';
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    view = { W, H, narrow, scale: canvas.width / W, cssW };
  }

  let _resizeT = 0;
  function _onResize() {
    if (!currentLab || !mod) return;
    clearTimeout(_resizeT);
    _resizeT = setTimeout(() => {
      const before = view.narrow, beforeW = view.cssW;
      _fit();
      if (Math.abs(beforeW - view.cssW) < 2 && before === view.narrow) return;
      api.W = view.W; api.H = view.H; api.narrow = view.narrow; api.px = view.W / view.cssW;
      if (before !== view.narrow) {
        if (mod.stop) mod.stop();
        mod.start(api);
        _notifyActive();
      } else if (mod.resize) mod.resize();
    }, 120);
  }

  function _loop(t) {
    raf = requestAnimationFrame(_loop);
    if (!currentLab || !mod || !ctx) return;
    if (document.hidden) { lastT = t; return; }
    const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
    lastT = t;
    ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
    try { mod.frame(dt, t / 1000); }
    catch (e) { cancelAnimationFrame(raf); throw e; }
  }

  function _pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * view.W / r.width, y: (e.clientY - r.top) * view.H / r.height };
  }

  function _bindPointer() {
    canvas.onpointerdown = e => {
      if (!mod || !mod.down) return;
      pointerId = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      mod.down(_pos(e), e);
      e.preventDefault();
    };
    canvas.onpointermove = e => {
      if (!mod) return;
      if (mod.move) mod.move(_pos(e), e, pointerId === e.pointerId);
    };
    const up = e => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (mod && mod.up) mod.up(_pos(e), e);
    };
    canvas.onpointerup = up;
    canvas.onpointercancel = up;
    canvas.onpointerleave = null;
  }

  function _stopLab() {
    cancelAnimationFrame(raf);
    if (mod && mod.stop) { try { mod.stop(); } catch (e) { /* ignore */ } }
    if (canvas) {
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null;
    }
    clearTimeout(winTimer);
    clearTimeout(_advT);
    _winQ = [];
    const w = document.getElementById('lx-win');
    if (w) w.remove();
  }

  // ── API handed to each lab module ──
  function _makeApi() {
    return {
      get ctx() { return ctx; },
      canvas,
      W: view.W, H: view.H, narrow: view.narrow,
      px: view.W / view.cssW,             // logical units per CSS pixel
      tier: _tierLevel(),
      age: (getActiveUser() || {}).age || 8,
      controls: document.getElementById('exp-controls'),
      emit: _emit,
      journal: _addJournalEntry,
      toast: _toast,
      sfx: _sfx,
      active: () => _visible(mod)[active] || null,
      isDone: id => { const r = _load()[currentLab.id]; return !!(r && r.ch && r.ch[id] > 0); },
      load: _load,
      save: _save,
      rec: () => _rec(_load(), currentLab.id),
      bonusStar: _bonusStar,
      refresh: _renderChallenge
    };
  }

  function _sfx(name) {
    try {
      if (typeof SFX !== 'undefined' && SFX[name]) SFX[name]();
    } catch (e) { /* audio optional */ }
  }

  let _toastT = 0;
  function _toast(text, ms) {
    const el = document.getElementById('exp-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(_toastT);
    _toastT = setTimeout(() => el.classList.remove('on'), ms || 2200);
  }

  // ── Challenge engine ──
  function _emit(evt) {
    if (!mod || !currentLab) return;
    const vis = _visible(mod);
    const data = _load();
    const rec = data[currentLab.id] || {};
    for (let i = 0; i < vis.length; i++) {
      const c = vis[i];
      if (rec.ch && rec.ch[c.id] > 0) continue;
      let ok = false;
      try { ok = !!c.test(evt); } catch (e) { ok = false; }
      if (!ok) continue;
      if (c.kind === 'predict') {
        // A prediction must be made first, on the active card.
        if (i !== active || predictions[c.id] == null) continue;
        const right = predictions[c.id] === c.answer;
        _complete(c, right ? (c.stars || 2) : Math.max(1, (c.stars || 2) - 1), right);
      } else {
        _complete(c, c.stars || 1, null);
      }
    }
  }

  function _complete(c, s, predictedRight) {
    const data = _load();
    const rec = _rec(data, currentLab.id);
    const prev = rec.ch[c.id] || 0;
    if (s > prev) {
      rec.ch[c.id] = s;
      const newStars = rec.base + _chSum(rec);
      if (newStars > rec.stars) {
        data.totalStars = (data.totalStars || 0) + (newStars - rec.stars);
        rec.stars = newStars;
      }
      const vis = _visible(mod);
      const doneN = vis.filter(v => rec.ch[v.id] > 0).length;
      if (doneN >= Math.min(3, vis.length)) rec.completed = Math.max(rec.completed || 0, 1);
      _save(data);
      stars += (s - prev);
    }
    _refreshNavStars();
    _updateHeaderStars();
    _addJournalEntry((c.journal || c.title) + '');
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Lab Explorer', '🔬', currentLab.title + ': ' + c.title + ' (' + s + '★)');
    }
    _sfx(s >= 2 ? 'cheer' : 'correct');
    setTimeout(() => _sfx('star'), 350);
    _showWin(c, s, predictedRight);

    // Move on to the next open challenge.
    const vis = _visible(mod);
    const dat = _load()[currentLab.id] || {};
    const nextIdx = vis.findIndex((v, i) => i > active && !(dat.ch && dat.ch[v.id] > 0));
    const anyIdx = vis.findIndex(v => !(dat.ch && dat.ch[v.id] > 0));
    const allDone = anyIdx < 0;
    if (allDone) document.getElementById('next-btn').style.display = '';
    _renderChallenge();
    clearTimeout(_advT);
    const labAt = currentLab && currentLab.id, cAt = c.id;
    _advT = setTimeout(() => {
      // only move on if the kid is still in this lab, on this card
      const cur = _visible(mod)[active];
      if (!currentLab || currentLab.id !== labAt || !cur || cur.id !== cAt) return;
      if (!allDone) { active = nextIdx >= 0 ? nextIdx : anyIdx; _renderChallenge(); _notifyActive(); }
    }, 2600);
  }
  let _advT = 0;

  // Stars that are not a challenge (the weather log): add straight to
  // totalStars, as the earlier version did.
  function _bonusStar(n) {
    const data = _load();
    data.totalStars = (data.totalStars || 0) + (n || 1);
    _save(data);
    stars += (n || 1);
    _refreshNavStars();
    _updateHeaderStars();
    return data;
  }

  // Banners queue up when one action finishes several challenges.
  let _winQ = [];
  function _showWin(c, s, predictedRight) {
    _winQ.push([c, s, predictedRight]);
    if (_winQ.length === 1) _nextWin();
  }
  function _nextWin() {
    if (!_winQ.length || !wrap) return;
    const [c, s, predictedRight] = _winQ[0];
    const old = document.getElementById('lx-win');
    if (old) old.remove();
    const d = document.createElement('div');
    d.id = 'lx-win';
    d.className = 'lx-win';
    d.setAttribute('role', 'status');
    const max = c.stars || 1;
    let starsHtml = '';
    for (let i = 0; i < max; i++) starsHtml += '<span class="lx-win-star' + (i < s ? ' on' : '') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's">★</span>';
    let verdict = '';
    if (predictedRight === true) verdict = '<div class="lx-win-pred ok">Your prediction was right!</div>';
    else if (predictedRight === false) verdict = '<div class="lx-win-pred">Not what you predicted — that is how scientists learn.</div>';
    d.innerHTML = '<div class="lx-win-card">' +
      '<div class="lx-win-stars">' + starsHtml + '</div>' +
      '<div class="lx-win-title">' + escHtml(c.title) + '</div>' + verdict +
      (c.explain ? '<div class="lx-win-ex">' + escHtml(c.explain) + '</div>' : '') +
      '</div>';
    const done = () => { if (!d.parentNode) return; d.remove(); _winQ.shift(); _nextWin(); };
    d.onclick = done;
    wrap.appendChild(d);
    clearTimeout(winTimer);
    winTimer = setTimeout(() => { d.classList.add('out'); setTimeout(done, 380); }, c.explain ? 4600 : 2600);
  }

  function _updateHeaderStars() {
    const el = document.getElementById('exp-stars');
    if (!el || !currentLab) return;
    const vis = _visible(mod);
    const rec = _load()[currentLab.id] || {};
    const earned = vis.reduce((s, c) => s + Math.min(c.stars || 1, (rec.ch && rec.ch[c.id]) || 0), 0);
    const max = vis.reduce((s, c) => s + (c.stars || 1), 0);
    el.textContent = '★ ' + earned + '/' + max;
    el.setAttribute('aria-label', earned + ' of ' + max + ' stars in this lab');
  }

  function _notifyActive() {
    const c = _visible(mod)[active];
    if (c && mod && mod.onActive) { try { mod.onActive(c); } catch (e) { /* ignore */ } }
  }

  function _renderChallenge() {
    const box = document.getElementById('exp-challenge');
    if (!box) return;
    const vis = _visible(mod);
    if (!vis.length) { box.innerHTML = ''; return; }
    const rec = _load()[currentLab.id] || {};
    const isDone = c => !!(rec.ch && rec.ch[c.id] > 0);
    const doneN = vis.filter(isDone).length;
    if (active >= vis.length) active = 0;
    const c = vis[active];
    const dots = vis.map((v, i) =>
      '<button type="button" class="lx-dot' + (isDone(v) ? ' done' : '') + (i === active ? ' cur' : '') + (v.kind === 'predict' ? ' pred' : '') + '" ' +
        'aria-label="Challenge ' + (i + 1) + ': ' + escHtml(v.title) + (isDone(v) ? ' (done)' : '') + '" ' +
        'onclick="LabExplorer._pick(' + i + ')">' + (isDone(v) ? '✓' : (v.kind === 'predict' ? '?' : (i + 1))) + '</button>'
    ).join('');

    let body = '';
    const got = (rec.ch && rec.ch[c.id]) || 0;
    const max = c.stars || 1;
    let st = '';
    for (let i = 0; i < max; i++) st += '<span class="' + (i < got ? 'on' : '') + '">★</span>';
    body += '<div class="lx-ch-top"><span class="lx-ch-kind ' + (c.kind === 'predict' ? 'pred' : 'goal') + '">' +
      (c.kind === 'predict' ? 'Predict, then test' : 'Goal') + '</span><span class="lx-ch-stars" aria-label="' + got + ' of ' + max + ' stars">' + st + '</span></div>';
    body += '<div class="lx-ch-title">' + escHtml(c.title) + '</div>';
    if (c.text) body += '<div class="lx-ch-text">' + escHtml(c.text) + '</div>';
    if (c.kind === 'predict' && !isDone(c)) {
      const p = predictions[c.id];
      body += '<div class="lx-ch-q">' + escHtml(c.q) + '</div><div class="lx-ch-choices">' +
        c.choices.map((ch, i) => '<button type="button" class="lx-choice' + (p === i ? ' sel' : '') + '" ' +
          'onclick="LabExplorer._predict(' + i + ')"' + (p != null ? ' disabled' : '') + '>' + escHtml(ch) + '</button>').join('') + '</div>';
      body += p == null
        ? '<div class="lx-ch-hint">Pick what you think will happen first.</div>'
        : '<div class="lx-ch-hint go">Now test it in the lab!' + (c.how ? ' ' + escHtml(c.how) : '') + '</div>';
    } else if (isDone(c)) {
      body += '<div class="lx-ch-done">Done!' + (c.explain ? ' ' + escHtml(c.explain) : '') + '</div>';
    } else if (c.how) {
      body += '<div class="lx-ch-hint">' + escHtml(c.how) + '</div>';
    }
    box.innerHTML =
      '<div class="lx-ch-head"><span>Challenges</span><span class="lx-ch-count">' + doneN + ' of ' + vis.length + ' done</span></div>' +
      '<div class="lx-dots">' + dots + '</div>' +
      '<div class="lx-ch-card">' + body +
        '<div class="lx-ch-nav">' +
          '<button type="button" class="lx-nav-btn" aria-label="Previous challenge" onclick="LabExplorer._pick(' + ((active - 1 + vis.length) % vis.length) + ')">‹</button>' +
          '<button type="button" class="lx-nav-btn" aria-label="Next challenge" onclick="LabExplorer._pick(' + ((active + 1) % vis.length) + ')">›</button>' +
        '</div>' +
      '</div>';
  }

  function _pick(i) {
    const vis = _visible(mod);
    if (i < 0 || i >= vis.length) return;
    active = i;
    _sfx('click');
    _renderChallenge();
    _notifyActive();
  }

  function _predict(i) {
    const c = _visible(mod)[active];
    if (!c || c.kind !== 'predict' || predictions[c.id] != null) return;
    predictions[c.id] = i;
    _sfx('click');
    _renderChallenge();
    _notifyActive();
    if (mod && mod.onPredict) { try { mod.onPredict(c, i); } catch (e) { /* ignore */ } }
  }

  // ── Journal & UI ──
  function _addJournalEntry(text) {
    const entry = { text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    journalEntries.push(entry);
    const journal = document.getElementById('exp-journal');
    if (!journal) return;
    if (!journal.querySelector('.journal-head')) {
      journal.insertAdjacentHTML('afterbegin', '<div class="journal-head">Lab notebook</div>');
    }
    const div = document.createElement('div');
    div.className = 'journal-entry';
    div.innerHTML = '<span class="journal-dot" aria-hidden="true"></span>' + escHtml(text) + ' <span class="journal-time">' + entry.time + '</span>';
    const head = journal.querySelector('.journal-head');
    head.insertAdjacentElement('afterend', div);
    const all = journal.querySelectorAll('.journal-entry');
    if (all.length > 30) all[all.length - 1].remove();
  }

  function _showFeedback(emoji) {
    const f = document.getElementById('feedback');
    const fe = document.getElementById('feedbackEmoji');
    if (!f || !fe) return;
    fe.textContent = emoji;
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 800);
  }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function nextExperiment() { _showResults(); }

  function _showResults() {
    const wrapEl = document.getElementById('results-wrap');
    const vis = _visible(mod);
    const rec = _load()[currentLab.id] || {};
    const earned = vis.reduce((s, c) => s + Math.min(c.stars || 1, (rec.ch && rec.ch[c.id]) || 0), 0);
    const max = vis.reduce((s, c) => s + (c.stars || 1), 0);
    const list = vis.map(c => {
      const g = (rec.ch && rec.ch[c.id]) || 0;
      return '<li class="' + (g ? 'done' : '') + '"><span>' + escHtml(c.title) + '</span><span class="rs">' + '★'.repeat(g) + '<i>' + '★'.repeat(Math.max(0, (c.stars || 1) - g)) + '</i></span></li>';
    }).join('');
    _stopLab();
    wrapEl.innerHTML =
      '<span class="results-art" aria-hidden="true">' + (window.LXArt ? LXArt.card(currentLab.id) : '') + '</span>' +
      '<div class="results-title">Lab report</div>' +
      '<div class="results-subtitle">' + escHtml(currentLab.title) + ' · ' + escHtml(currentLab.es) + '</div>' +
      '<div class="results-stats">' +
        '<div>★ ' + earned + ' of ' + max + ' stars</div>' +
        '<div>' + stars + ' new this time · ' + journalEntries.length + ' notebook entries</div>' +
        '<ul class="results-list">' + list + '</ul>' +
      '</div>' +
      '<div class="results-btns">' +
        '<button type="button" class="action-btn btn-primary" onclick="LabExplorer.startLab(\'' + currentLab.id + '\')">Back to the lab 🔁</button>' +
        '<button type="button" class="action-btn btn-secondary" onclick="LabExplorer.backToTopics()">Other labs 🔬</button>' +
      '</div>';
    _showScreen('results');
    if (typeof showConfetti === 'function' && earned >= max) showConfetti();
  }

  function backToTopics() {
    _stopLab();
    currentLab = null;
    mod = null;
    _showScreen('select');
    init();
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      labsCompleted: LABS.filter(l => ((data[l.id] && data[l.id].completed) || 0) >= l.experiments.length).length,
      totalLabs: LABS.length
    };
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', _onResize);

  return {
    startLab,
    nextExperiment,
    backToTopics,
    getStats,
    _pick,
    _predict,
    _showFeedback,
    // for tests / debugging
    _state: () => ({ lab: currentLab && currentLab.id, active, predictions, view }),
    _emit: e => _emit(e),
    _mod: () => mod
  };
})();
