/* ================================================================
   LAB EXPLORER — lab-explorer-labs2.js
   Labs: weather, astronomy (southern sky from Chile), sound,
   crystals, static. Same module shape as lab-explorer-labs1.js.
   ================================================================ */

window.LXLabs = window.LXLabs || {};

/* ════════════════════════════════════════════════════════════════
   WEATHER STATION — spot cloud types in a drawn sky, then log the
   real weather outside. The log keeps the shape it always had:
   zs_lab_<kid>.weather.log[] = { date, cloud, wind, precip, tempC, ts }
   ════════════════════════════════════════════════════════════════ */
LXLabs.weather = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  const CLOUDS = [
    { id: 'clear',   label: 'Clear' },
    { id: 'cumulus', label: 'Cumulus (puffy)' },
    { id: 'stratus', label: 'Stratus (flat grey)' },
    { id: 'cirrus',  label: 'Cirrus (wispy high)' },
    { id: 'nimbus',  label: 'Nimbus (rain)' }
  ];
  const PRECIP = [
    { id: 'none', label: 'None' }, { id: 'rain', label: 'Rain' },
    { id: 'snow', label: 'Snow' }, { id: 'storm', label: 'Storm' }
  ];
  // Simplified, kid-observable Beaufort: 0 = calm … 5 = storm.
  const WIND = [
    { v: 0, label: 'Calm — smoke rises straight' },
    { v: 1, label: 'Light — leaves rustle' },
    { v: 2, label: 'Breeze — flags flap' },
    { v: 3, label: 'Strong — small branches sway' },
    { v: 4, label: 'Gale — hard to walk' },
    { v: 5, label: 'Storm — branches break' }
  ];
  const QUIZ = [
    { id: 'cumulus', label: 'Cumulus', hint: 'Cumulus: puffy heaps like cotton, with flat bottoms.' },
    { id: 'stratus', label: 'Stratus', hint: 'Stratus: a flat grey sheet that covers the sky.' },
    { id: 'cirrus', label: 'Cirrus', hint: 'Cirrus: thin, wispy streaks very high up.' },
    { id: 'cumulonimbus', label: 'Cumulonimbus', hint: 'Cumulonimbus: a huge tower with a flat top, the thunderstorm cloud.' }
  ];

  const challenges = [
    { id: 'id-cumulus', kind: 'goal', tier: [0, 3], stars: 1, title: 'Spot a cumulus cloud',
      how: 'Cloud spotter: look at the sky and pick its name.', journal: 'Spotted cumulus: puffy fair-weather clouds.',
      explain: 'Cumulus are puffy heaps with flat bottoms. On a sunny day they usually mean fair weather.',
      test: e => e.type === 'spot' && e.cloud === 'cumulus' },
    { id: 'id-stratus', kind: 'goal', tier: [0, 3], stars: 1, title: 'Spot a stratus cloud',
      journal: 'Spotted stratus: a flat grey layer.', explain: 'Stratus is a low, flat grey layer, like fog that does not touch the ground.',
      test: e => e.type === 'spot' && e.cloud === 'stratus' },
    { id: 'id-cirrus', kind: 'goal', tier: [1, 3], stars: 1, title: 'Spot a cirrus cloud',
      journal: 'Spotted cirrus: thin wisps high up.', explain: 'Cirrus are the highest common clouds, thin wisps made of ice crystals.',
      test: e => e.type === 'spot' && e.cloud === 'cirrus' },
    { id: 'pred-ice', kind: 'predict', tier: [2, 3], stars: 2, title: 'What are cirrus made of?',
      q: 'Cirrus clouds float very high, where it is far below freezing. What are they made of?',
      choices: ['Tiny water droplets', 'Tiny ice crystals', 'Smoke and dust'], answer: 1,
      how: 'Spot a cirrus sky to check.', journal: 'Cirrus clouds are made of ice crystals.',
      explain: 'Up where cirrus form it is so cold that the water freezes into tiny ice crystals.',
      test: e => e.type === 'spot' && e.cloud === 'cirrus' },
    { id: 'id-cb', kind: 'goal', tier: [2, 3], stars: 1, title: 'Spot a thunderstorm cloud',
      journal: 'Spotted a cumulonimbus storm cloud.', explain: 'Cumulonimbus are the tallest clouds. They bring thunder, lightning and heavy showers.',
      test: e => e.type === 'spot' && e.cloud === 'cumulonimbus' },
    { id: 'log1', kind: 'goal', tier: [0, 3], stars: 1, title: 'Log today\'s real weather',
      how: 'Go outside or look out of a window. Open "Today\'s log" and fill it in.', journal: 'Logged the real weather.',
      test: e => e.type === 'log' },
    { id: 'log3', kind: 'goal', tier: [1, 3], stars: 1, title: 'Log 3 different days',
      how: 'Come back tomorrow and the next day.', journal: 'Three days of weather logged.',
      test: e => e.type === 'log' && e.days >= 3 },
    { id: 'temp', kind: 'goal', tier: [2, 3], stars: 1, title: 'Record a real temperature',
      how: 'Read a thermometer outside, in the shade.', journal: 'Recorded a real temperature.',
      explain: 'Weather stations keep their thermometers in the shade, inside a white box with slatted sides, so the sun does not heat them.',
      test: e => e.type === 'log' && e.temp },
    { id: 'log7', kind: 'goal', tier: [2, 3], stars: 2, title: 'Log 7 different days',
      how: 'A week of observations shows you a pattern.', journal: 'A whole week of weather logged!',
      test: e => e.type === 'log' && e.days >= 7 }
  ];

  // Small sky icons for the chips (inline SVG, no external images).
  function icon(type) {
    const sky = type === 'clear' || type === 'cumulus' || type === 'cirrus' || type === 'none' ? '#5AA8E6' : type === 'snow' ? '#B9C7D6' : '#8A96A6';
    let g = '';
    if (type === 'clear' || type === 'none') g = '<circle cx="20" cy="15" r="7" fill="#FFD84A"/>';
    if (type === 'cumulus') g = '<circle cx="15" cy="18" r="6" fill="#fff"/><circle cx="22" cy="14" r="7" fill="#fff"/><circle cx="28" cy="19" r="5" fill="#fff"/><rect x="10" y="18" width="22" height="6" rx="3" fill="#E5EAF0"/>';
    if (type === 'stratus') g = '<rect x="0" y="6" width="40" height="9" fill="#C3CAD3"/><rect x="0" y="14" width="40" height="6" fill="#AEB6C1"/>';
    if (type === 'cirrus') g = '<path d="M5 10 q12 -4 24 2 M10 18 q12 -5 26 1 M4 24 q10 -3 20 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if (type === 'nimbus' || type === 'rain') g = '<rect x="0" y="4" width="40" height="10" fill="#6B7584"/><path d="M8 17 l-2 7 M16 17 l-2 7 M24 17 l-2 7 M32 17 l-2 7" stroke="#DCEBFF" stroke-width="2" stroke-linecap="round"/>';
    if (type === 'snow') g = '<rect x="0" y="4" width="40" height="9" fill="#E4E9EF"/><g fill="#fff"><circle cx="9" cy="19" r="2"/><circle cx="19" cy="23" r="2"/><circle cx="28" cy="18" r="2"/><circle cx="34" cy="24" r="2"/></g>';
    if (type === 'storm') g = '<rect x="0" y="3" width="40" height="11" fill="#4B5361"/><path d="M21 13 l-5 8 h5 l-3 7 l9 -10 h-5 l3 -5z" fill="#FFD84A"/>';
    if (type === 'cumulonimbus') g = '<path d="M8 28 L12 14 Q20 2 28 14 L32 28Z" fill="#E7ECF2"/><path d="M4 9 Q20 3 36 9 L30 12 L10 12Z" fill="#F4F7FA"/><rect x="8" y="24" width="24" height="5" fill="#69717F"/>';
    return '<svg viewBox="0 0 40 30" aria-hidden="true"><rect width="40" height="30" rx="6" fill="' + sky + '"/>' + g + '</svg>';
  }

  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function loadW() {
    const d = api.load();
    if (!d.weather || typeof d.weather !== 'object') d.weather = { log: [] };
    if (!Array.isArray(d.weather.log)) d.weather.log = [];
    return d;
  }

  function start(a) {
    api = a;
    S = { mode: 'spot', quiz: null, last: null, pick: { date: today(), cloud: null, wind: null, precip: null, tempC: null }, t: 0, puffs: {}, flash: 0 };
    newQuiz();
    buildControls();
  }

  function newQuiz(force) {
    let opts = QUIZ.filter(q => api.tier >= 1 || q.id !== 'cumulonimbus');
    const act = api.active && api.active();
    const want = act && act.test ? opts.find(q => { try { return act.test({ type: 'spot', cloud: q.id }); } catch (e) { return false; } }) : null;
    let next = want && !api.isDone(act.id) && Math.random() < 0.6 ? want : opts[Math.floor(Math.random() * opts.length)];
    if (!force && S.quiz && next.id === S.quiz.id) next = opts[(opts.indexOf(next) + 1) % opts.length];
    S.quiz = next;
    S.seed = Math.floor(Math.random() * 1000);
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    ui.mode = LXUI.seg({ value: S.mode, options: [{ v: 'spot', label: 'Cloud spotter', icon: '🔭' }, { v: 'log', label: 'Today\'s log', icon: '📒' }],
      onChange: v => { S.mode = v; renderBody(); } });
    c.appendChild(ui.mode);
    ui.body = document.createElement('div');
    c.appendChild(ui.body);
    renderBody();
  }

  function renderBody() {
    if (S.mode === 'spot') {
      const opts = QUIZ.filter(q => api.tier >= 1 || q.id !== 'cumulonimbus');
      ui.body.innerHTML = '<div class="lx-readout"><b>What kind of cloud is in this sky?</b></div>' +
        '<div class="wx-quiz" style="margin-top:8px">' + opts.map(q =>
          '<button type="button" class="wx-chip" data-q="' + q.id + '"><span class="wx-chip-ic">' + icon(q.id) + '</span><span>' + escHtml(q.label) + '</span></button>').join('') + '</div>';
      ui.body.querySelectorAll('[data-q]').forEach(b => { b.onclick = () => answer(b.dataset.q); });
    } else {
      renderForm();
    }
  }

  function answer(id) {
    if (!S.quiz) return;
    if (id === S.quiz.id) {
      api.sfx('correct');
      api.toast('Yes! ' + S.quiz.hint, 2600);
      api.emit({ type: 'spot', cloud: id });
      setTimeout(() => { if (S) { newQuiz(); } }, 1400);
    } else {
      api.sfx('wrong');
      const w = QUIZ.find(q => q.id === id);
      api.toast('Not this one. ' + (w ? w.hint : ''), 3000);
    }
  }

  function renderForm() {
    const p = S.pick;
    const chips = (items, field) => items.map(it => '<button type="button" class="wx-chip' + (p[field] === it.id ? ' sel' : '') + '" data-f="' + field + '" data-v="' + it.id + '">' +
      '<span class="wx-chip-ic">' + icon(it.id) + '</span><span>' + escHtml(it.label) + '</span></button>').join('');
    const wind = WIND.map(w => '<button type="button" class="wx-chip' + (p.wind === w.v ? ' sel' : '') + '" data-f="wind" data-v="' + w.v + '">' +
      '<span class="wx-chip-ic">' + sockIcon(w.v) + '</span><span>' + w.v + ' · ' + escHtml(w.label) + '</span></button>').join('');
    const ready = p.cloud && p.precip && p.wind !== null;
    ui.body.innerHTML = '<div class="wx-form">' +
      '<div class="wx-date">📅 ' + escHtml(p.date) + '</div>' +
      '<div class="wx-group"><div class="wx-grp-title">Clouds</div><div class="wx-chips">' + chips(CLOUDS, 'cloud') + '</div></div>' +
      '<div class="wx-group"><div class="wx-grp-title">Precipitation</div><div class="wx-chips">' + chips(PRECIP, 'precip') + '</div></div>' +
      '<div class="wx-group"><div class="wx-grp-title">Wind (0–5)</div><div class="wx-chips">' + wind + '</div></div>' +
      '<div class="wx-group"><label class="wx-grp-title" for="wx-temp">Temperature (°C, optional)</label>' +
        '<input type="number" id="wx-temp" class="wx-temp" min="-30" max="50" step="1" placeholder="e.g. 18" value="' + (p.tempC != null ? p.tempC : '') + '"></div>' +
      '<div class="wx-actions"><button type="button" class="lx-btn lx-btn-main" id="wx-save"' + (ready ? '' : ' disabled') + '>💾 Save observation</button></div>' +
      '</div><div id="wx-journal" style="margin-top:12px"></div>';
    ui.body.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = () => { const f = b.dataset.f; p[f] = f === 'wind' ? +b.dataset.v : b.dataset.v; api.sfx('click'); renderForm(); };
    });
    const t = ui.body.querySelector('#wx-temp');
    t.oninput = () => { p.tempC = t.value === '' ? null : parseInt(t.value, 10); if (isNaN(p.tempC)) p.tempC = null; };
    ui.body.querySelector('#wx-save').onclick = save;
    renderLog();
  }

  function sockIcon(v) {
    const ang = 80 - v * 16;
    return '<svg viewBox="0 0 40 30" aria-hidden="true"><rect width="40" height="30" rx="6" fill="#E8F1FB"/><rect x="6" y="5" width="2.5" height="22" fill="#6B7584"/>' +
      '<g transform="translate(8 7) rotate(' + ang + ')"><path d="M0 -3 L22 -2 L22 2 L0 3Z" fill="#F97316"/><path d="M8 -2.6 L8 2.6 M15 -2.3 L15 2.3" stroke="#fff" stroke-width="2.5"/></g></svg>';
  }

  function save() {
    const p = S.pick;
    if (!p.cloud || !p.precip || p.wind === null) return;
    const data = loadW();
    const had = data.weather.log.some(e => e.date === p.date);
    data.weather.log = data.weather.log.filter(e => e.date !== p.date);
    data.weather.log.push({ date: p.date, cloud: p.cloud, wind: p.wind, precip: p.precip, tempC: p.tempC, ts: Date.now() });
    if (data.weather.log.length > 120) {
      data.weather.log = data.weather.log.sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(-120);
    }
    api.save(data);
    // One star for each new day observed, as before (a second save on
    // the same day only corrects the entry).
    if (!had) api.bonusStar(1);
    const days = new Set(data.weather.log.map(e => e.date)).size;
    api.sfx('cheer');
    api.toast(had ? 'Today\'s entry updated.' : 'Saved! ★ +1 for observing today.');
    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      const cl = CLOUDS.find(c => c.id === p.cloud);
      ActivityLog.log('Lab Explorer', '☁️', 'Logged weather: ' + (cl ? cl.label : p.cloud) + (p.tempC != null ? ' · ' + p.tempC + '°C' : ''));
    }
    api.emit({ type: 'log', days, temp: p.tempC != null });
    renderLog();
  }

  function renderLog() {
    const el = document.getElementById('wx-journal');
    if (!el) return;
    const data = loadW();
    const log = data.weather.log.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!log.length) { el.innerHTML = '<div class="wx-journal"><p class="wx-empty">No observations yet. Fill in today\'s weather and tap Save.</p></div>'; return; }
    const counts = {}; let wet = 0;
    const since = Date.now() - 30 * 864e5;
    log.forEach(e => { const t = Date.parse(e.date + 'T00:00:00'); if (!isFinite(t) || t < since) return; counts[e.cloud] = (counts[e.cloud] || 0) + 1; if (e.precip && e.precip !== 'none') wet++; });
    el.innerHTML = '<div class="wx-journal">' +
      '<div class="wx-j-head">Last 30 days · ' + wet + ' with rain or snow</div>' +
      '<div class="wx-tallies">' + CLOUDS.map(c => '<div class="wx-tally"><span class="wx-chip-ic">' + icon(c.id) + '</span><span class="wx-tally-n">' + (counts[c.id] || 0) + '</span><span class="wx-tally-lbl">' + escHtml(c.label.split(' ')[0]) + '</span></div>').join('') + '</div>' +
      '<div class="wx-j-head" style="margin-top:10px">Recent observations</div><div class="wx-list">' +
      log.slice(0, 14).map(e => '<div class="wx-row"><span class="wx-date-sm">' + escHtml(e.date) + '</span><span class="wx-chip-ic">' + icon(e.cloud) + '</span>' +
        '<span class="wx-row-txt">' + escHtml((PRECIP.find(p => p.id === e.precip) || { label: '' }).label) + ' · wind ' + (e.wind != null ? escHtml(String(e.wind)) : '–') +
        ((e.tempC != null && !isNaN(e.tempC)) ? ' · ' + escHtml(String(e.tempC)) + '°C' : '') + '</span></div>').join('') + '</div></div>';
  }

  // ── Drawing the sky and the station ──
  function frame(dt, t) {
    S.t = t;
    const ctx = api.ctx, W = api.W, H = api.H;
    const type = S.mode === 'spot' ? (S.quiz ? S.quiz.id : 'cumulus') : (S.pick.cloud || 'clear');
    const precip = S.mode === 'spot' ? (type === 'cumulonimbus' ? 'storm' : 'none') : (S.pick.precip || 'none');
    const wind = S.mode === 'spot' ? (type === 'cumulonimbus' ? 4 : type === 'cirrus' ? 1 : 2) : (S.pick.wind == null ? 1 : S.pick.wind);
    const gy = H * (api.narrow ? 0.80 : 0.78);
    drawSky(ctx, type, precip, t, gy);
    drawGround(ctx, gy, wind, t);
    drawStation(ctx, gy, wind, precip, t);
    if (S.mode === 'log' && S.pick.tempC != null) A.label(ctx, S.pick.tempC + ' °C', W * 0.5, gy + 30, { size: api.narrow ? 22 : 16 });
  }

  function drawSky(ctx, type, precip, t, gy) {
    const W = api.W, H = api.H;
    const dull = type === 'stratus' || type === 'nimbus' || precip === 'rain' || precip === 'storm' || precip === 'snow';
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    if (dull) { g.addColorStop(0, type === 'nimbus' || precip === 'storm' ? '#59606C' : '#8E97A4'); g.addColorStop(1, '#C3C9D1'); }
    else { g.addColorStop(0, '#2F7FD0'); g.addColorStop(1, '#BFE3FA'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 2);
    if (!dull) A.sun(ctx, W * 0.84, H * 0.13, 22, 0.9, t);
    const r = A.rng((S.seed || 1) + type.length);
    if (type === 'cumulus') {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const key = 'c' + i + (S.seed || 0);
        const w = W * (0.2 + r() * 0.12), h = w * 0.55;
        const x = ((W * (0.12 + i * 0.27) + t * 6 + r() * 40) % (W + 200)) - 60, y = H * (0.18 + r() * 0.22);
        if (!S.puffs[key]) S.puffs[key] = A.cloudPuffs(w, h, 10 + i);
        A.cloud(ctx, x, y, w, h, { puffs: S.puffs[key] });
      }
    } else if (type === 'stratus' || type === 'nimbus') {
      for (let k = 0; k < 7; k++) {
        const y = H * 0.02 + k * gy * 0.09;
        const lg = ctx.createLinearGradient(0, y, 0, y + gy * 0.14);
        const c = type === 'nimbus' ? A.mix('#4A515D', '#7A828E', k / 7) : A.mix('#9AA2AE', '#C0C6CE', k / 7);
        lg.addColorStop(0, A.rgba(c, 0)); lg.addColorStop(0.5, A.rgba(c, 0.9)); lg.addColorStop(1, A.rgba(c, 0));
        ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.02 + k + t * 0.1) * 6);
        ctx.lineTo(W, y + gy * 0.14); ctx.lineTo(0, y + gy * 0.14); ctx.fill();
      }
    } else if (type === 'cirrus') {
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const x0 = r() * W * 0.9, y0 = H * (0.06 + r() * 0.32), len = W * (0.18 + r() * 0.2);
        for (let k = 0; k < 7; k++) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 + r() * 0.3) + ')';
          ctx.lineWidth = 1.5 + r() * 3;
          ctx.beginPath();
          const yy = y0 + k * 3;
          ctx.moveTo(x0 + k * 4, yy);
          ctx.bezierCurveTo(x0 + len * 0.3, yy - 10 - r() * 8, x0 + len * 0.7, yy + 4, x0 + len, yy - 14 - r() * 10);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (type === 'cumulonimbus') {
      const cx = W * 0.42, base = gy * 0.62, top = H * 0.08;
      // anvil
      const ag = ctx.createLinearGradient(0, top, 0, top + 60);
      ag.addColorStop(0, '#F6F8FB'); ag.addColorStop(1, '#BFC7D2');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.moveTo(cx - W * 0.36, top + 40); ctx.quadraticCurveTo(cx, top - 14, cx + W * 0.42, top + 28);
      ctx.lineTo(cx + W * 0.14, top + 70); ctx.lineTo(cx - W * 0.12, top + 70); ctx.closePath(); ctx.fill();
      // tower
      for (let k = 0; k < 6; k++) {
        const y = base - k * (base - top - 40) / 6, w = W * (0.36 - k * 0.025);
        const key = 'cb' + k;
        if (!S.puffs[key]) S.puffs[key] = A.cloudPuffs(w, w * 0.5, 30 + k);
        A.cloud(ctx, cx + Math.sin(k) * 10, y, w, w * 0.5, { puffs: S.puffs[key], dark: Math.max(0, 0.75 - k * 0.15) });
      }
      // rain shaft and lightning
      ctx.fillStyle = 'rgba(90,100,115,0.45)';
      ctx.beginPath(); ctx.moveTo(cx - W * 0.14, base + 20); ctx.lineTo(cx + W * 0.12, base + 20); ctx.lineTo(cx + W * 0.08, gy); ctx.lineTo(cx - W * 0.18, gy); ctx.fill();
      if (Math.sin(t * 1.7) > 0.985 || S.flash > 0) {
        S.flash = S.flash > 0 ? S.flash - 0.05 : 1;
        ctx.strokeStyle = 'rgba(255,250,200,' + S.flash + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, base + 24); ctx.lineTo(cx - 14, base + 70); ctx.lineTo(cx + 2, base + 74); ctx.lineTo(cx - 20, gy - 10); ctx.stroke();
      }
    }
    // falling weather
    if (precip === 'rain' || precip === 'storm' || type === 'nimbus') {
      ctx.strokeStyle = 'rgba(220,235,255,0.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 120; i++) { const x = (i * 53.3 + t * 40) % W, y = (i * 97.7 + t * 420) % gy; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); }
      ctx.stroke();
    }
    if (precip === 'snow') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) { const x = (i * 53.3 + Math.sin(t + i) * 12) % W, y = (i * 97.7 + t * 40) % gy; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
  }

  function drawGround(ctx, gy, wind, t) {
    const W = api.W, H = api.H;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, '#7DB75A'); gg.addColorStop(1, '#4E8A36');
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
    // distant hills
    ctx.fillStyle = '#6FA552';
    ctx.beginPath(); ctx.moveTo(0, gy + 2);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, gy - 8 - Math.sin(x * 0.012 + 1) * 10);
    ctx.lineTo(W, gy + 2); ctx.fill();
    // a tree that bends with the wind
    const tx = W * 0.12, ty = gy + 6, sway = Math.sin(t * (1 + wind * 0.6)) * wind * 1.4 + wind * 3;
    ctx.fillStyle = '#6B4A2B'; ctx.fillRect(tx - 4, ty - 60, 8, 60);
    const leaf = (x, y, r) => { const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r); g.addColorStop(0, '#6CB04A'); g.addColorStop(1, '#2F6B25'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    leaf(tx + sway, ty - 80, 30); leaf(tx - 18 + sway * 0.8, ty - 66, 22); leaf(tx + 20 + sway * 0.9, ty - 64, 22);
  }

  function drawStation(ctx, gy, wind, precip, t) {
    const W = api.W;
    const s = api.narrow ? 1.2 : 1;
    // Stevenson screen: a white louvred box on legs
    const bx = W * 0.5, by = gy - 64 * s;
    ctx.fillStyle = '#E9ECEF'; ctx.fillRect(bx - 24 * s, by + 40 * s, 4 * s, 26 * s); ctx.fillRect(bx + 20 * s, by + 40 * s, 4 * s, 26 * s);
    A.shadow(ctx, bx, gy + 4, 40 * s, 6, 0.25);
    ctx.fillStyle = '#FFFFFF'; A.rr(ctx, bx - 30 * s, by, 60 * s, 42 * s, 3); ctx.fill();
    ctx.strokeStyle = '#C9CFD6'; ctx.lineWidth = 1.2;
    for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.moveTo(bx - 27 * s, by + k * 6 * s); ctx.lineTo(bx + 27 * s, by + k * 6 * s + 2); ctx.stroke(); }
    ctx.fillStyle = '#F4F5F7'; ctx.beginPath(); ctx.moveTo(bx - 36 * s, by + 2); ctx.lineTo(bx, by - 12 * s); ctx.lineTo(bx + 36 * s, by + 2); ctx.fill();
    // wind sock on its pole
    const px = W * 0.78, ptop = gy - 120 * s;
    ctx.fillStyle = '#7B8794'; ctx.fillRect(px - 2.5, ptop, 5, gy - ptop + 4);
    const ang = (1 - Math.min(5, wind) / 5) * 1.3 + Math.sin(t * (2 + wind)) * 0.05 * (wind + 1);
    ctx.save(); ctx.translate(px, ptop + 6); ctx.rotate(ang);
    const L = 64 * s;
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? '#FFFFFF' : '#F97316';
      const x0 = k * L / 5, x1 = (k + 1) * L / 5, h0 = 12 * s * (1 - k * 0.09), h1 = 12 * s * (1 - (k + 1) * 0.09);
      const fl = Math.sin(t * 6 + k) * (wind > 0 ? 1.5 : 0);
      ctx.beginPath(); ctx.moveTo(x0, -h0 + fl); ctx.lineTo(x1, -h1 + fl); ctx.lineTo(x1, h1 + fl); ctx.lineTo(x0, h0 + fl); ctx.fill();
    }
    ctx.restore();
    // rain gauge
    const rx = W * 0.32, rtop = gy - 52 * s;
    ctx.fillStyle = 'rgba(230,240,250,0.7)'; ctx.strokeStyle = '#8FA3B8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rx - 14 * s, rtop); ctx.lineTo(rx + 14 * s, rtop); ctx.lineTo(rx + 10 * s, gy); ctx.lineTo(rx - 10 * s, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
    const lvl = precip === 'rain' ? 0.5 : precip === 'storm' ? 0.8 : precip === 'snow' ? 0.2 : 0.05;
    ctx.fillStyle = 'rgba(70,140,220,0.7)';
    const ly = gy - (gy - rtop) * lvl;
    ctx.beginPath(); ctx.moveTo(rx - 10 * s - 4 * s * lvl, ly); ctx.lineTo(rx + 10 * s + 4 * s * lvl, ly); ctx.lineTo(rx + 10 * s, gy); ctx.lineTo(rx - 10 * s, gy); ctx.fill();
  }

  function onActive(c) {
    if (/^id-|pred-ice/.test(c.id) && S.mode !== 'spot') { S.mode = 'spot'; ui.mode.set('spot'); renderBody(); }
    if (/^log|^temp/.test(c.id) && S.mode !== 'log') { S.mode = 'log'; ui.mode.set('log'); renderBody(); }
    if (/^id-|pred-ice/.test(c.id)) newQuiz(true);
  }
  function stop() {}
  return { challenges, start, frame, stop, onActive, _S: () => S, _answer: id => answer(id) };
})();


/* ════════════════════════════════════════════════════════════════
   NIGHT SKY — the real sky over Santiago de Chile for a month and
   an hour you choose. Stars come from LXData with their J2000
   positions; the view is a stereographic projection of the sky.
   ════════════════════════════════════════════════════════════════ */
LXLabs.astronomy = (() => {
  'use strict';
  const A = LXArt;
  const D2R = Math.PI / 180;
  let api, S, ui = {};
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const challenges = [
    { id: 'crux', kind: 'goal', tier: [0, 3], stars: 1, title: 'Find the Southern Cross',
      text: 'Cruz del Sur. Tap its 4 bright stars.', fig: 'crux', view: { m: 5, h: 22, dir: 180 },
      journal: 'Found the Southern Cross (Cruz del Sur).',
      explain: 'The Southern Cross is the smallest of the 88 constellations, and it is on the flag of several southern countries. It never sets as seen from southern Chile.',
      test: e => e.type === 'figure' && e.id === 'crux' },
    { id: 'pointers', kind: 'goal', tier: [0, 3], stars: 1, title: 'Find the two Pointers',
      text: 'Two very bright stars next to the Cross: Alpha and Beta Centauri.', fig: 'pointers', view: { m: 5, h: 22, dir: 180 },
      journal: 'Found the Pointers: Alpha and Beta Centauri.',
      explain: 'Alpha Centauri is the nearest star system to the Sun, about 4.4 light-years away. The Pointers point to the Southern Cross.',
      test: e => e.type === 'figure' && e.id === 'pointers' },
    { id: 'belt', kind: 'goal', tier: [0, 3], stars: 1, title: 'Find Las Tres Marías',
      text: 'Three stars in a neat row: the belt of Orion.', fig: 'belt', view: { m: 1, h: 23, dir: 0 },
      journal: 'Found Las Tres Marías, the belt of Orion.',
      explain: 'In Chile the belt of Orion is called Las Tres Marías. Its stars are Alnitak, Alnilam and Mintaka.',
      test: e => e.type === 'figure' && e.id === 'belt' },
    { id: 'pred-orion', kind: 'predict', tier: [2, 3], stars: 2, title: 'Orion from Chile',
      q: 'Facing north in Chile, Orion is high in the sky. Which bright star is at the TOP of Orion?',
      choices: ['Betelgeuse, the red one', 'Rigel, the blue-white one'], answer: 1, fig: 'orion', view: { m: 1, h: 23, dir: 0 },
      how: 'Find all of Orion, then look at which star is higher.', journal: 'From Chile, Orion looks upside down: Rigel is on top.',
      explain: 'From the Southern Hemisphere we see Orion "upside down" compared with pictures from Europe: blue-white Rigel is above red Betelgeuse.',
      test: e => e.type === 'figure' && e.id === 'orion' },
    { id: 'orion', kind: 'goal', tier: [1, 3], stars: 1, title: 'Find all of Orion',
      text: 'The hunter: two shoulders, the belt and two feet (7 stars).', fig: 'orion', view: { m: 1, h: 23, dir: 0 },
      journal: 'Found Orion the hunter.',
      test: e => e.type === 'figure' && e.id === 'orion' },
    { id: 'scorpius', kind: 'goal', tier: [1, 3], stars: 1, title: 'Find the Scorpion',
      text: 'Scorpius, with its red heart Antares and a curled tail (7 main stars).', fig: 'scorpius', view: { m: 7, h: 21, dir: 90 },
      journal: 'Found Scorpius and red Antares.',
      explain: 'Antares is a red supergiant star. In Chile, Scorpius is high in the sky on winter evenings.',
      test: e => e.type === 'figure' && e.id === 'scorpius' },
    { id: 'south', kind: 'goal', tier: [1, 3], stars: 2, title: 'Use the Cross to find South',
      text: 'Follow the long bar of the Cross, from Gacrux through Acrux, about 4½ times its length. Tap that empty spot of sky.',
      view: { m: 5, h: 22, dir: 180 }, journal: 'Found the South Celestial Pole using the Southern Cross.',
      explain: 'That point is the South Celestial Pole. Straight below it, on the horizon, is south. Sailors used this for centuries.',
      test: e => e.type === 'scp' },
    { id: 'pred-turn', kind: 'predict', tier: [2, 3], stars: 2, title: 'Which way does the sky turn?',
      q: 'Face south and let 4 hours go by. Which way do the stars turn around the South Celestial Pole?',
      choices: ['Clockwise', 'Counter-clockwise', 'They do not move'], answer: 0, view: { m: 5, h: 20, dir: 180 },
      how: 'Tap "Watch 4 hours" and follow the Cross.', journal: 'Facing south, the stars turn clockwise around the pole.',
      explain: 'The Earth spins, so the whole sky seems to turn once a day. Facing south from Chile, it turns clockwise around the South Celestial Pole.',
      test: e => e.type === 'timerun' && e.south },
    { id: 'canismajor', kind: 'goal', tier: [2, 3], stars: 1, title: 'Find Sirius and the Great Dog',
      text: 'Canis Major: Sirius is the brightest star in the night sky (5 stars).', fig: 'canismajor', view: { m: 2, h: 22, dir: 0 },
      journal: 'Found Canis Major and Sirius.',
      explain: 'Sirius is about 8.6 light-years away, one of the closest stars to us. That is part of why it looks so bright.',
      test: e => e.type === 'figure' && e.id === 'canismajor' },
    { id: 'teapot', kind: 'goal', tier: [3, 3], stars: 1, title: 'Find the Teapot',
      text: 'Eight stars of Sagittarius make a teapot. The Milky Way looks like steam from its spout.', fig: 'teapot', view: { m: 8, h: 21, dir: 0 },
      journal: 'Found the Teapot in Sagittarius.',
      explain: 'The centre of our galaxy, the Milky Way, lies in the direction of Sagittarius, just off the spout of the Teapot.',
      test: e => e.type === 'figure' && e.id === 'teapot' }
  ];

  // ── Astronomy maths ──
  function lst(month, hour) {
    // Chile clocks: UTC−3 from September to March, UTC−4 otherwise.
    const off = (month >= 9 || month <= 3) ? -3 : -4;
    const ms = Date.UTC(2026, month - 1, 15, 0, 0, 0) + (hour - off) * 3600e3;
    const d = (ms - Date.UTC(2000, 0, 1, 12)) / 864e5;
    const g = 18.697374558 + 24.06570982441908 * d;
    return (((g + LXData.SITE.lon / 15) % 24) + 24) % 24;
  }
  function altaz(ra, dec, L) {
    const lat = LXData.SITE.lat * D2R, H = (L - ra) * 15 * D2R, d = dec * D2R;
    const sa = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sa)));
    const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(lat) - Math.cos(d) * Math.sin(lat) * Math.cos(H));
    return [alt, (az + Math.PI * 2) % (Math.PI * 2)];
  }
  function vec(alt, az) { return [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)]; }
  function galToEq(l, b) {
    const aN = 192.85948 * D2R, dN = 27.12825 * D2R, lN = 122.93192 * D2R;
    l *= D2R; b *= D2R;
    const sd = Math.sin(dN) * Math.sin(b) + Math.cos(dN) * Math.cos(b) * Math.cos(lN - l);
    const dec = Math.asin(sd);
    const ra = aN + Math.atan2(Math.cos(b) * Math.sin(lN - l), Math.cos(dN) * Math.sin(b) - Math.sin(dN) * Math.cos(b) * Math.cos(lN - l));
    return [((ra / D2R / 15) % 24 + 24) % 24, dec / D2R];
  }

  let MW = null, BG = null;
  function buildSky() {
    if (MW) return;
    const r = A.rng(2024);
    const gauss = () => { let u = 0; for (let i = 0; i < 4; i++) u += r(); return (u - 2) * 1.2; };
    MW = [];
    for (let l = 0; l < 360; l += 1.2) {
      const dl = Math.min(l, 360 - l);
      const bright = 0.35 + 0.75 * Math.exp(-(dl / 32) * (dl / 32)) + 0.35 * Math.exp(-Math.pow((l - 300) / 22, 2)) + 0.2 * Math.exp(-Math.pow((l - 75) / 20, 2));
      const sig = 4.5 + 6 * Math.exp(-(dl / 25) * (dl / 25));
      for (let k = 0; k < 4; k++) {
        const b = gauss() * sig;
        const e = galToEq(l + (r() - 0.5) * 1.2, b);
        MW.push({ ra: e[0], dec: e[1], a: bright * (0.6 + r() * 0.5) * Math.exp(-(b * b) / (2 * sig * sig)), s: 2.2 + r() * 2.5 });
      }
    }
    // dark dust lanes: the Coalsack by the Cross and the Great Rift
    MW.dark = [{ ra: 12.85, dec: -62.5, s: 3.2 }];
    for (let l = 8; l < 60; l += 3) { const e = galToEq(l, 1.4 + Math.sin(l * 0.2) * 0.8); MW.dark.push({ ra: e[0], dec: e[1], s: 1.9 }); }
    // faint background speckle, denser along the Milky Way (decorative)
    BG = [];
    for (let i = 0; i < 1500; i++) {
      let ra, dec;
      if (i % 2) { const e = galToEq(r() * 360, gauss() * 9); ra = e[0]; dec = e[1]; }
      else { ra = r() * 24; dec = Math.asin(2 * r() - 1) / D2R; }
      BG.push({ ra, dec, m: 4.0 + Math.pow(r(), 0.6) * 2.2 });
    }
  }

  function start(a) {
    api = a;
    buildSky();
    S = { month: 5, hour: 21, az: 180 * D2R, alt: 38 * D2R, lines: api.tier <= 1, names: api.tier >= 2, found: {}, foundFig: {}, t: 0,
      drag: null, run: null, scpShow: 0, guide: 0, proj: [] };
    buildControls();
    recompute();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    ui.month = LXUI.slider({ label: '📅 Month', min: 1, max: 12, value: S.month, fmt: v => MONTHS[v - 1], onInput: v => { S.month = v; recompute(); } });
    ui.hour = LXUI.slider({ label: '🕘 Time', min: 19, max: 29, step: 0.25, value: S.hour, fmt: fmtHour, onInput: v => { S.hour = v; recompute(); } });
    c.appendChild(LXUI.row([ui.month, ui.hour], 'lx-row-2'));
    ui.dir = LXUI.seg({ label: 'Look toward', value: dirKey(), options: [{ v: 0, label: 'North' }, { v: 90, label: 'East' }, { v: 180, label: 'South' }, { v: 270, label: 'West' }],
      onChange: v => { S.az = v * D2R; recompute(); } });
    const row = [ui.dir];
    ui.run = LXUI.button('▶ Watch 4 hours', runTime, 'lx-btn-main');
    row.push(ui.run);
    c.appendChild(LXUI.row(row));
    const tg = [];
    ui.lines = LXUI.seg({ value: S.lines ? 'on' : 'off', label: 'Star lines', options: [{ v: 'on', label: 'Show' }, { v: 'off', label: 'Hide' }], onChange: v => { S.lines = v === 'on'; } });
    ui.names = LXUI.seg({ value: S.names ? 'on' : 'off', label: 'Star names', options: [{ v: 'on', label: 'Show' }, { v: 'off', label: 'Hide' }], onChange: v => { S.names = v === 'on'; } });
    tg.push(ui.lines, ui.names);
    c.appendChild(LXUI.row(tg));
    const tip = document.createElement('div'); tip.className = 'lx-readout';
    tip.innerHTML = 'Sky over <b>Santiago, Chile</b>. Drag the sky to look around; tap a star to learn its name.';
    c.appendChild(tip);
  }

  function fmtHour(v) { const h = Math.floor(v) % 24, m = Math.round((v - Math.floor(v)) * 60); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
  function dirKey() { const d = Math.round(((S.az / D2R) % 360 + 360) % 360 / 90) * 90 % 360; return d; }

  function camera() {
    const f = vec(S.alt, S.az);
    let rgt = [f[1], -f[0], 0];
    const n = Math.hypot(rgt[0], rgt[1]) || 1; rgt = [rgt[0] / n, rgt[1] / n, 0];
    const up = [rgt[1] * f[2] - 0 * f[1], 0 * f[0] - rgt[0] * f[2], rgt[0] * f[1] - rgt[1] * f[0]];
    const fov = (api.narrow ? 84 : 100) * D2R;
    const F = (api.W / 2) / (2 * Math.tan(fov / 4));
    return { f, r: rgt, u: up, F, cx: api.W / 2, cy: api.H * 0.52 };
  }
  function project(cam, v) {
    const dz = v[0] * cam.f[0] + v[1] * cam.f[1] + v[2] * cam.f[2];
    if (dz < -0.3) return null;
    const k = 2 / (1 + dz);
    const X = k * (v[0] * cam.r[0] + v[1] * cam.r[1] + v[2] * cam.r[2]);
    const Y = k * (v[0] * cam.u[0] + v[1] * cam.u[1] + v[2] * cam.u[2]);
    return [cam.cx + X * cam.F, cam.cy - Y * cam.F];
  }
  function unproject(cam, x, y) {
    const X = (x - cam.cx) / cam.F, Y = -(y - cam.cy) / cam.F;
    const rho = Math.hypot(X, Y);
    if (rho < 1e-6) return cam.f.slice();
    const c = 2 * Math.atan(rho / 2), sc = Math.sin(c) / rho, cc = Math.cos(c);
    return [0, 1, 2].map(i => cam.f[i] * cc + (cam.r[i] * X + cam.u[i] * Y) * sc);
  }

  function recompute() {
    S.lst = lst(S.month, S.hour);
    S.dirty = true;
  }

  function figById(id) { return LXData.FIGURES.find(f => f.id === id); }
  function starById(id) { return LXData.STARS.find(s => s.id === id); }

  function aimAt(fig) {
    const ids = fig.stars;
    let v = [0, 0, 0];
    ids.forEach(id => { const s = starById(id), q = altaz(s.ra, s.dec, S.lst), w = vec(q[0], q[1]); v = [v[0] + w[0], v[1] + w[1], v[2] + w[2]]; });
    const n = Math.hypot(v[0], v[1], v[2]);
    const alt = Math.asin(v[2] / n), az = Math.atan2(v[0], v[1]);
    S.az = (az + Math.PI * 2) % (Math.PI * 2);
    S.alt = Math.max(16 * D2R, Math.min(62 * D2R, alt));
  }

  function onActive(c) {
    if (c.view) {
      S.month = c.view.m; S.hour = c.view.h; S.az = c.view.dir * D2R; S.alt = 38 * D2R;
      recompute();
      if (c.fig && api.tier <= 2) aimAt(figById(c.fig));
      if (c.id === 'south' || c.id === 'pred-turn') { S.az = Math.PI; S.alt = 36 * D2R; }
      ui.month.set(S.month); ui.hour.set(S.hour); ui.dir.set(dirKey());
      S.found = {};
    }
  }

  function runTime() {
    if (S.run) return;
    S.run = { from: S.hour, to: Math.min(29, S.hour + 4) };
    if (S.run.to - S.run.from < 3.9) { S.run.from = Math.max(19, S.run.to - 4); S.hour = S.run.from; }
    S.run.to = S.run.from + 4;
    S.trail = [];
    api.sfx('click');
  }

  // ── Input ──
  function down(p) { S.drag = { x: p.x, y: p.y, az: S.az, alt: S.alt, moved: false }; }
  function move(p, e, pressed) {
    if (!S.drag || !pressed) return;
    const dx = p.x - S.drag.x, dy = p.y - S.drag.y;
    if (Math.hypot(dx, dy) > 8) S.drag.moved = true;
    if (!S.drag.moved) return;
    const cam = camera(), degPerPx = 1 / (cam.F * D2R);
    S.az = S.drag.az - dx * degPerPx * D2R;
    S.alt = Math.max(8 * D2R, Math.min(78 * D2R, S.drag.alt + dy * degPerPx * D2R));
    S.dirty = true;
  }
  function up(p) {
    const d = S.drag; S.drag = null;
    if (!d) return;
    if (d.moved) { ui.dir.set(dirKey()); return; }
    tap(p);
  }

  function tap(p) {
    const act = api.active();
    const R = api.narrow ? 34 : 26;
    let best = null;
    S.proj.forEach(q => { const dd = Math.hypot(q.x - p.x, q.y - p.y); if (dd < R && (!best || dd - (3 - q.s.mag) * 2 < best.d)) best = { d: dd - (3 - q.s.mag) * 2, q }; });
    if (act && act.id === 'south' && !api.isDone('south')) {
      const cam = camera(), v = unproject(cam, p.x, p.y);
      const lat = LXData.SITE.lat * D2R;
      const scp = vec(-lat, Math.PI);
      const ang = Math.acos(Math.max(-1, Math.min(1, v[0] * scp[0] + v[1] * scp[1] + v[2] * scp[2]))) / D2R;
      if (ang < 6) {
        S.scpShow = 1; api.sfx('correct');
        api.emit({ type: 'scp' });
      } else {
        S.guide = 3; api.sfx('wrong');
        api.toast('Not quite: follow the dotted line from the top of the Cross.', 2600);
      }
      return;
    }
    if (!best) return;
    const s = best.q.s;
    const fig = act && act.fig ? figById(act.fig) : null;
    if (fig && !api.isDone(act.id) && fig.stars.indexOf(s.id) >= 0) {
      if (!S.found[s.id]) {
        S.found[s.id] = true; api.sfx('click');
        const left = fig.stars.filter(id => !S.found[id]).length;
        if (left === 0) {
          S.foundFig[fig.id] = true;
          api.sfx('correct');
          api.emit({ type: 'figure', id: fig.id });
        } else api.toast(s.name + ' ✓ · ' + left + ' to go');
      }
    } else {
      api.toast(s.name + (s.mag < 0.5 ? ' (very bright)' : ''), 1800);
      api.sfx('click');
    }
  }

  // ── Frame ──
  function frame(dt, t) {
    S.t = t;
    if (S.run) {
      S.hour = Math.min(S.run.to, S.hour + dt * 0.8);
      ui.hour.set(S.hour);
      recompute();
      if (S.hour >= S.run.to - 1e-6) {
        const south = Math.abs(((S.az / D2R) % 360 + 360) % 360 - 180) < 50;
        S.run = null;
        api.emit({ type: 'timerun', hours: 4, south });
        api.journal('Watched the sky turn for 4 hours' + (south ? ' facing south.' : '.'));
      }
    }
    S.scpShow = Math.max(0, S.scpShow - dt * 0.15);
    S.guide = Math.max(0, S.guide - dt * 0.5);
    draw(api.ctx, t);
  }

  function draw(ctx, t) {
    const W = api.W, H = api.H, cam = camera();
    // sky gradient keyed to the horizon
    const hz = project(cam, vec(0, S.az)) || [W / 2, H];
    const sg = ctx.createLinearGradient(0, hz[1] - cam.F * 1.4, 0, hz[1]);
    sg.addColorStop(0, '#02030A'); sg.addColorStop(0.6, '#070C22'); sg.addColorStop(1, '#1A2650');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

    // Milky Way on a low-res layer, which blurs it naturally
    if (S.dirty || !S.mwc) {
      const q = 4;
      const mwc = S.mwc || A.offscreen(W / q, H / q);
      const m = mwc.getContext('2d');
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.clearRect(0, 0, mwc.width, mwc.height);
      m.scale(1 / q, 1 / q);
      const pxDeg = cam.F * D2R;
      MW.forEach(p => {
        const h = altaz(p.ra, p.dec, S.lst); if (h[0] < -0.05) return;
        const s = project(cam, vec(h[0], h[1])); if (!s || s[0] < -60 || s[0] > W + 60 || s[1] < -60 || s[1] > H + 60) return;
        m.fillStyle = 'rgba(190,205,255,' + (p.a * 0.075).toFixed(3) + ')';
        m.beginPath(); m.arc(s[0], s[1], p.s * pxDeg, 0, Math.PI * 2); m.fill();
      });
      LXData.PATCHES.forEach(p => {
        const h = altaz(p.ra, p.dec, S.lst); if (h[0] < -0.02) return;
        const s = project(cam, vec(h[0], h[1])); if (!s) return;
        m.save(); m.translate(s[0], s[1]); m.rotate(p.rot * D2R); m.scale(1, p.h / p.w);
        const g = m.createRadialGradient(0, 0, 0, 0, 0, p.w * pxDeg * 0.6);
        g.addColorStop(0, A.rgba(p.tint || '#D6DEFF', p.a)); g.addColorStop(1, A.rgba(p.tint || '#D6DEFF', 0));
        m.fillStyle = g; m.beginPath(); m.arc(0, 0, p.w * pxDeg * 0.6, 0, Math.PI * 2); m.fill();
        m.restore();
      });
      m.globalCompositeOperation = 'destination-out';
      MW.dark.forEach(p => {
        const h = altaz(p.ra, p.dec, S.lst); if (h[0] < -0.05) return;
        const s = project(cam, vec(h[0], h[1])); if (!s) return;
        const g = m.createRadialGradient(s[0], s[1], 0, s[0], s[1], p.s * pxDeg);
        g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        m.fillStyle = g; m.beginPath(); m.arc(s[0], s[1], p.s * pxDeg, 0, Math.PI * 2); m.fill();
      });
      m.globalCompositeOperation = 'source-over';
      S.mwc = mwc;
      // background speckle
      S.bgp = [];
      BG.forEach(b => {
        const h = altaz(b.ra, b.dec, S.lst); if (h[0] < 0.01) return;
        const s = project(cam, vec(h[0], h[1])); if (!s || s[0] < 0 || s[0] > W || s[1] < 0 || s[1] > H) return;
        S.bgp.push([s[0], s[1], b.m, h[0]]);
      });
      S.proj = [];
      LXData.STARS.forEach(st => {
        const h = altaz(st.ra, st.dec, S.lst); if (h[0] < 0) return;
        const s = project(cam, vec(h[0], h[1])); if (!s || s[0] < -20 || s[0] > W + 20 || s[1] < -20 || s[1] > H + 20) return;
        S.proj.push({ s: st, x: s[0], y: s[1], alt: h[0] });
      });
      S.dirty = false;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(S.mwc, 0, 0, W, H);
    ctx.restore();
    // background stars
    ctx.fillStyle = '#fff';
    S.bgp.forEach(b => {
      const a = Math.max(0.12, Math.min(0.7, (6.4 - b[2]) / 3)) * Math.min(1, b[3] / (10 * D2R));
      ctx.globalAlpha = a;
      ctx.fillRect(b[0], b[1], b[2] < 5 ? 1.4 : 1, b[2] < 5 ? 1.4 : 1);
    });
    ctx.globalAlpha = 1;

    // figure lines
    const act = api.active();
    const pos = {};
    S.proj.forEach(q => { pos[q.s.id] = q; });
    ctx.lineCap = 'round';
    LXData.FIGURES.forEach(fig => {
      if (fig.id === 'belt') return;
      const show = S.lines || S.foundFig[fig.id] || (act && act.fig === fig.id && api.isDone(act.id));
      if (!show) return;
      ctx.strokeStyle = S.foundFig[fig.id] ? 'rgba(255,214,120,0.75)' : 'rgba(130,160,255,0.45)';
      ctx.lineWidth = S.foundFig[fig.id] ? 2 : 1.4;
      ctx.beginPath();
      fig.lines.forEach(l => { const a = pos[l[0]], b = pos[l[1]]; if (!a || !b) return; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); });
      ctx.stroke();
    });
    // guide line for "find south"
    if ((act && act.id === 'south') || S.scpShow > 0) {
      const g = pos.gacrux, ac = pos.acrux;
      if (g && ac && (S.guide > 0 || S.scpShow > 0 || api.tier <= 1)) {
        const dx = ac.x - g.x, dy = ac.y - g.y;
        ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,230,160,' + (0.35 + Math.min(1, S.guide + S.scpShow) * 0.4) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + dx * 5.5, g.y + dy * 5.5); ctx.stroke(); ctx.setLineDash([]);
      }
      if (S.scpShow > 0 || (act && act.id === 'south' && api.isDone('south'))) {
        const lat = LXData.SITE.lat * D2R, s = project(cam, vec(-lat, Math.PI));
        if (s) {
          ctx.strokeStyle = '#FFD27A'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(s[0], s[1], 10, 0, Math.PI * 2); ctx.moveTo(s[0] - 16, s[1]); ctx.lineTo(s[0] + 16, s[1]); ctx.moveTo(s[0], s[1] - 16); ctx.lineTo(s[0], s[1] + 16); ctx.stroke();
          A.label(ctx, 'South Celestial Pole', s[0], s[1] - 30, { size: api.narrow ? 17 : 13, bg: 'rgba(20,24,50,0.85)', color: '#FFE7B0' });
          const h = project(cam, vec(0, Math.PI));
          if (h) { ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(s[0], s[1] + 12); ctx.lineTo(h[0], h[1]); ctx.stroke(); ctx.setLineDash([]); }
        }
      }
    }
    // named stars
    S.proj.forEach((q, i) => {
      const st = q.s;
      const ext = Math.min(1, Math.max(0.25, q.alt / (12 * D2R)));
      const tw = 0.85 + 0.15 * Math.sin(t * 3.1 + i * 1.7);
      const r = Math.max(0.9, 3.1 - 0.62 * st.mag) * (api.narrow ? 1.15 : 1);
      if (st.mag < 1.7) {
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 4.5);
        g.addColorStop(0, A.rgba(st.col, 0.45 * ext)); g.addColorStop(1, A.rgba(st.col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, r * 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = ext * tw;
      ctx.fillStyle = st.col;
      ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (S.found[st.id]) {
        ctx.strokeStyle = 'rgba(255,214,120,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(q.x, q.y, r + 7, 0, Math.PI * 2); ctx.stroke();
      }
      if (S.names && st.mag < 1.9 && !/ /.test(st.name.split(' (')[0]) || (S.names && st.mag < 1.0)) {
        ctx.fillStyle = 'rgba(210,222,255,0.8)'; ctx.font = '700 ' + (api.narrow ? 14 : 11) + 'px Nunito, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(st.name.split(' (')[0], q.x + r + 5, q.y + 4);
      }
    });
    // figure names once found
    LXData.FIGURES.forEach(fig => {
      if (!S.foundFig[fig.id]) return;
      let x = 0, y = 0, n = 0;
      fig.stars.forEach(id => { if (pos[id]) { x += pos[id].x; y += pos[id].y; n++; } });
      if (n) A.label(ctx, fig.name, x / n, y / n - 26, { size: api.narrow ? 17 : 13, bg: 'rgba(20,24,50,0.8)', color: '#FFE7B0' });
    });

    drawHorizon(ctx, cam, t);
    // what we are looking at
    A.label(ctx, MONTHS[S.month - 1] + ' · ' + fmtHour(S.hour), api.narrow ? 120 : 92, 26, { size: api.narrow ? 17 : 13, bg: 'rgba(20,24,50,0.85)', color: '#DDE6FF' });
  }

  function horizonAlt(az) {
    // Andes to the east of Santiago, low coastal hills to the west (degrees)
    const d = az / D2R;
    const east = Math.exp(-Math.pow((d - 95) / 45, 2));
    return (1.2 + east * (4.2 + 1.6 * Math.sin(d * 0.37) + 0.9 * Math.sin(d * 1.3)) + 0.5 * Math.sin(d * 0.21 + 1)) * D2R;
  }

  function drawHorizon(ctx, cam, t) {
    const W = api.W, H = api.H;
    const pts = [];
    for (let k = -80; k <= 80; k += 2) {
      const az = S.az + k * D2R;
      const p = project(cam, vec(horizonAlt(((az % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)), az));
      if (p) pts.push(p);
    }
    if (!pts.length) return;
    const g = ctx.createLinearGradient(0, Math.min.apply(null, pts.map(p => p[1])), 0, H);
    g.addColorStop(0, '#0B1024'); g.addColorStop(1, '#03050C');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(pts[0][0], H + 10);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(pts[pts.length - 1][0], H + 10); ctx.closePath(); ctx.fill();
    // a faint glow along the horizon
    ctx.strokeStyle = 'rgba(80,100,170,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    // compass points
    const names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    names.forEach((n, i) => {
      const p = project(cam, vec(-3 * D2R, i * 45 * D2R));
      if (!p || p[0] < 10 || p[0] > W - 10 || p[1] > H - 8) return;
      ctx.fillStyle = n.length === 1 ? '#FFD27A' : 'rgba(200,210,240,0.6)';
      ctx.font = '900 ' + (api.narrow ? (n.length === 1 ? 20 : 14) : (n.length === 1 ? 16 : 11)) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n, p[0], Math.min(H - 10, p[1] + 6));
    });
  }

  function stop() { if (S) S.run = null; }
  function resize() { S.mwc = null; S.dirty = true; }
  return { challenges, start, frame, down, move, up, stop, resize, onActive, _S: () => S, _lst: lst, _altaz: altaz, _tapStar: id => { const q = S.proj.find(p => p.s.id === id); if (q) tap({ x: q.x, y: q.y }); return !!q; } };
})();


/* ════════════════════════════════════════════════════════════════
   SOUND WAVES — a speaker driven by WebAudio and an oscilloscope
   that shows the wave. The scope reads the real signal from an
   AnalyserNode when audio is running.
   ════════════════════════════════════════════════════════════════ */
LXLabs.sound = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {}, AU = null;
  const WINDOW_MS = 10;          // the scope shows 10 ms across (1 ms per division)

  const challenges = [
    { id: 'play', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make a sound',
      how: 'Press Play. Look at the wave on the screen.', journal: 'The speaker made a sound and the scope drew its wave.',
      explain: 'The speaker cone moves back and forth very fast and pushes the air. Those pushes travel to your ear as sound.',
      test: e => e.type === 'tone' && e.playing },
    { id: 'high', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make a high, squeaky sound',
      how: 'Slide the pitch up past 700 Hz.', journal: 'A high sound: lots of waves squeezed together.',
      explain: 'High sounds vibrate many times each second. Hz (hertz) means vibrations per second.',
      test: e => e.type === 'tone' && e.playing && e.f >= 700 },
    { id: 'low', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make a low, deep sound',
      how: 'Slide the pitch down below 200 Hz.', journal: 'A low sound: the waves are spread out.',
      test: e => e.type === 'tone' && e.playing && e.f <= 200 },
    { id: 'loud', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make the wave taller',
      how: 'Turn the loudness up to 90% or more.', journal: 'Louder sound = taller wave.',
      explain: 'The height of the wave is its amplitude. A bigger amplitude sounds louder, but the pitch stays the same.',
      test: e => e.type === 'tone' && e.playing && e.amp >= 0.9 },
    { id: 'pred-pitch', kind: 'predict', tier: [1, 3], stars: 2, title: 'Higher pitch, closer waves?',
      q: 'When you make the pitch higher, the waves on the screen will be…',
      choices: ['Closer together', 'Farther apart', 'Taller'], answer: 0,
      how: 'Play a sound, then raise the pitch a lot (at least half as much again).', journal: 'Higher pitch = waves closer together.',
      explain: 'A higher pitch means more waves every second, so more of them fit on the screen.',
      test: e => e.type === 'tone' && e.playing && S && S.predF && e.f >= S.predF * 1.5 },
    { id: 'four', kind: 'goal', tier: [1, 3], stars: 2, title: 'Fit exactly 4 waves on the screen',
      how: 'Count the peaks. The screen shows 10 milliseconds.', journal: '4 waves in 10 ms = 400 Hz.',
      explain: '4 waves in 10 milliseconds is 400 waves in one second: 400 Hz.',
      test: e => e.type === 'tone' && e.playing && Math.abs(e.f - 400) <= 8 },
    { id: 'pred-octave', kind: 'predict', tier: [2, 3], stars: 2, title: 'One octave up',
      q: 'Play 220 Hz (the note A), then 440 Hz, the same note one octave higher. How many waves fit on the screen at 440 Hz?',
      choices: ['The same number', 'Twice as many', 'Half as many'], answer: 1,
      how: 'Use the A buttons, or the slider.', journal: 'An octave higher doubles the frequency: twice as many waves.',
      explain: 'Going up one octave doubles the frequency. 440 Hz is the A that orchestras tune to.',
      test: e => e.type === 'tone' && e.playing && Math.abs(e.f - 440) <= 6 && S && S.had220 },
    { id: 'square', kind: 'goal', tier: [2, 3], stars: 1, title: 'Make a square wave',
      how: 'Change the wave shape.', journal: 'A square wave sounds buzzy.',
      explain: 'Same pitch, different shape: a square wave contains extra higher tones, so it sounds buzzy, like an old video game.',
      test: e => e.type === 'tone' && e.playing && e.shape === 'square' },
    { id: 'period', kind: 'goal', tier: [3, 3], stars: 2, title: 'A wave that repeats every 5 ms',
      how: 'One wave every 5 milliseconds. What frequency is that?', journal: 'Period 5 ms ↔ 200 Hz.',
      explain: 'Frequency = 1 ÷ period. 1 ÷ 0.005 s = 200 Hz.',
      test: e => e.type === 'tone' && e.playing && Math.abs(e.f - 200) <= 4 }
  ];

  const fFromSlider = v => Math.round(100 * Math.pow(10, v / 100));      // 0..100 → 100..1000 Hz
  const sliderFromF = f => Math.round(Math.log10(f / 100) * 100);

  function start(a) {
    api = a;
    S = { f: 262, amp: 0.6, shape: 'sine', playing: false, t: 0, cone: 0, rings: [], ringAcc: 0, buf: null, predF: null, had220: false };
    buildControls();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    ui.play = LXUI.button('▶ Play', togglePlay, 'lx-btn-main');
    ui.freq = LXUI.slider({ label: '🎵 Pitch (frequency)', min: 0, max: 100, value: sliderFromF(S.f), fmt: v => fFromSlider(v) + ' Hz',
      ends: ['low', 'high'], onInput: v => { S.f = fFromSlider(v); apply(); } });
    ui.amp = LXUI.slider({ label: '🔊 Loudness', min: 10, max: 100, value: Math.round(S.amp * 100), fmt: v => v + '%', onInput: v => { S.amp = v / 100; apply(); } });
    c.appendChild(LXUI.row([ui.play]));
    c.appendChild(LXUI.row([ui.freq, ui.amp], 'lx-row-2'));
    const notes = api.tier >= 2
      ? [['A3 · 220 Hz', 220], ['A4 · 440 Hz', 440], ['C4 · 262 Hz', 262], ['E5 · 659 Hz', 659]]
      : [['Low', 130], ['Middle', 262], ['High', 523], ['Very high', 880]];
    const nb = notes.map(n => LXUI.button(n[0], () => { S.f = n[1]; ui.freq.set(sliderFromF(S.f)); ui.freq.querySelector('output').textContent = S.f + ' Hz'; apply(); if (!S.playing) togglePlay(); }, 'lx-btn-soft'));
    c.appendChild(LXUI.row(nb));
    if (api.tier >= 2) {
      ui.shape = LXUI.seg({ label: 'Wave shape', value: S.shape, options: [{ v: 'sine', label: 'Sine' }, { v: 'square', label: 'Square' }, { v: 'triangle', label: 'Triangle' }, { v: 'sawtooth', label: 'Sawtooth' }],
        onChange: v => { S.shape = v; apply(); } });
      c.appendChild(ui.shape);
    }
    const tip = document.createElement('div'); tip.className = 'lx-readout';
    tip.innerHTML = 'Keep the volume of your device low. The screen shows <b>10 milliseconds</b> of sound (each square is 1 ms).';
    c.appendChild(tip);
  }

  function ensureAudio() {
    if (AU) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return AU; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const gain = ctx.createGain(); gain.gain.value = 0;
      const an = ctx.createAnalyser(); an.fftSize = 2048;
      gain.connect(an); an.connect(ctx.destination);
      AU = { ctx, gain, an, osc: null };
    } catch (e) { AU = null; }
    return AU;
  }

  function togglePlay() {
    S.playing = !S.playing;
    ui.play.innerHTML = S.playing ? '■ Stop' : '▶ Play';
    const au = ensureAudio();
    if (au) {
      const now = au.ctx.currentTime;
      if (S.playing) {
        const o = au.ctx.createOscillator();
        o.type = S.shape; o.frequency.value = S.f; o.connect(au.gain); o.start();
        au.osc = o;
        au.gain.gain.cancelScheduledValues(now);
        au.gain.gain.setTargetAtTime(gainFor(), now, 0.03);
      } else if (au.osc) {
        au.gain.gain.cancelScheduledValues(now);
        au.gain.gain.setTargetAtTime(0, now, 0.03);
        const o = au.osc; au.osc = null;
        setTimeout(() => { try { o.stop(); o.disconnect(); } catch (e) { /* ignore */ } }, 250);
      }
    }
    emitTone();
  }
  function gainFor() { return S.amp * (S.shape === 'square' || S.shape === 'sawtooth' ? 0.07 : 0.16); }

  let _emT = 0;
  function apply() {
    if (AU && AU.osc) {
      const now = AU.ctx.currentTime;
      AU.osc.frequency.setTargetAtTime(S.f, now, 0.02);
      if (AU.osc.type !== S.shape) AU.osc.type = S.shape;
      AU.gain.gain.setTargetAtTime(gainFor(), now, 0.03);
    }
    clearTimeout(_emT);
    _emT = setTimeout(emitTone, 220);
  }
  function emitTone() {
    if (!S) return;
    if (S.playing && Math.abs(S.f - 220) <= 4) S.had220 = true;
    api.emit({ type: 'tone', f: S.f, amp: S.amp, shape: S.shape, playing: S.playing });
  }
  function onPredict(c) { if (c.id === 'pred-pitch') S.predF = S.f; }

  function wave(shape, ph) {
    const x = ph - Math.floor(ph);
    if (shape === 'square') return x < 0.5 ? 1 : -1;
    if (shape === 'triangle') return x < 0.25 ? x * 4 : x < 0.75 ? 2 - x * 4 : x * 4 - 4;
    if (shape === 'sawtooth') return x < 0.5 ? x * 2 : x * 2 - 2;
    return Math.sin(ph * Math.PI * 2);
  }

  // Samples for one screen: from the analyser (triggered on a rising
  // zero crossing) when sound is really playing, else computed.
  function samples(n) {
    const out = new Float32Array(n);
    if (S.playing && AU && AU.osc && AU.ctx.state === 'running') {
      const an = AU.an, len = an.fftSize;
      if (!S.buf || S.buf.length !== len) S.buf = new Float32Array(len);
      an.getFloatTimeDomainData(S.buf);
      const sr = AU.ctx.sampleRate, span = Math.round(sr * WINDOW_MS / 1000);
      let peak = 0;
      for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(S.buf[i]));
      if (peak > 0.002) {
        let start = 0;
        for (let i = 1; i < len - span; i++) if (S.buf[i - 1] < 0 && S.buf[i] >= 0) { start = i; break; }
        const norm = gainFor() || 1;
        for (let i = 0; i < n; i++) out[i] = S.buf[start + Math.floor(i / n * span)] / norm * S.amp;
        return out;
      }
    }
    if (!S.playing) return out;
    const cycles = S.f * WINDOW_MS / 1000;
    for (let i = 0; i < n; i++) out[i] = S.amp * wave(S.shape, i / n * cycles);
    return out;
  }

  function frame(dt, t) {
    S.t = t;
    const W = api.W, H = api.H, ctx = api.ctx;
    ctx.drawImage(A.wood(W, H, '#8C6239', 33), 0, 0);
    const lay = api.narrow
      ? { scope: { x: 16, y: 16, w: W - 32, h: 340 }, spk: { x: 30, y: 380, w: 170, h: 236 }, air: { x: 210, y: 380, w: W - 226, h: 236 } }
      : { scope: { x: 214, y: 22, w: W - 236, h: H - 44 }, spk: { x: 18, y: 64, w: 150, h: 280 }, air: { x: 168, y: 64, w: 44, h: 280 } };
    drawSpeaker(ctx, lay.spk, dt, t);
    drawAir(ctx, lay, dt);
    drawScope(ctx, lay.scope, t);
  }

  function drawSpeaker(ctx, b, dt, t) {
    A.shadow(ctx, b.x + b.w / 2, b.y + b.h + 4, b.w * 0.6, 8, 0.4);
    const cab = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
    cab.addColorStop(0, '#3B2718'); cab.addColorStop(0.5, '#5C3E26'); cab.addColorStop(1, '#33210F');
    ctx.fillStyle = cab; A.rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.fillStyle = '#1E1A18'; A.rr(ctx, b.x + 8, b.y + 8, b.w - 16, b.h - 16, 8); ctx.fill();
    const cx = b.x + b.w / 2, cy = b.y + b.h * 0.62, R = Math.min(b.w * 0.4, b.h * 0.26);
    // the cone moves: we slow it down a lot so you can see it
    const vis = S.playing ? Math.sin(t * Math.min(40, 6 + S.f / 40)) * S.amp : 0;
    S.cone = vis;
    ctx.fillStyle = '#0D0C0C'; ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, Math.PI * 2); ctx.fill();
    const sur = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R + 4);
    sur.addColorStop(0, '#2E2C2B'); sur.addColorStop(0.6, '#4A4644'); sur.addColorStop(1, '#1A1918');
    ctx.fillStyle = sur; ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, Math.PI * 2); ctx.fill();
    const k = 1 + vis * 0.05;
    const cone = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.1, cx, cy, R * 0.9 * k);
    cone.addColorStop(0, '#6A6A70'); cone.addColorStop(0.55, '#34343A'); cone.addColorStop(1, '#18181C');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.arc(cx, cy, R * 0.88 * k, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.arc(cx, cy, R * 0.22 * i * k + R * 0.1, 0, Math.PI * 2); ctx.stroke(); }
    const cap = ctx.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, R * 0.3 * k);
    cap.addColorStop(0, '#9A9AA2'); cap.addColorStop(1, '#2A2A30');
    ctx.fillStyle = cap; ctx.beginPath(); ctx.arc(cx, cy, R * 0.28 * k, 0, Math.PI * 2); ctx.fill();
    // tweeter
    const ty = b.y + b.h * 0.2, tr = R * 0.32;
    ctx.fillStyle = '#0D0C0C'; ctx.beginPath(); ctx.arc(cx, ty, tr + 4, 0, Math.PI * 2); ctx.fill();
    const tw = ctx.createRadialGradient(cx - 2, ty - 3, 1, cx, ty, tr);
    tw.addColorStop(0, '#C9CCD3'); tw.addColorStop(1, '#3A3C42');
    ctx.fillStyle = tw; ctx.beginPath(); ctx.arc(cx, ty, tr, 0, Math.PI * 2); ctx.fill();
    // power LED
    ctx.fillStyle = S.playing ? '#34D399' : '#3F3F46';
    ctx.beginPath(); ctx.arc(b.x + b.w - 20, b.y + b.h - 20, 4, 0, Math.PI * 2); ctx.fill();
    S.spkC = { x: cx + R, y: cy };
  }

  function drawAir(ctx, lay, dt) {
    // pressure waves leaving the speaker; spacing follows the wavelength
    if (!S.spkC) return;
    const spacing = Math.max(9, Math.min(90, 9000 / S.f));
    if (S.playing) {
      S.ringAcc += dt * 70;
      S.rings.forEach(r => { r.r += dt * 70; });
      if (!S.rings.length || S.rings[S.rings.length - 1].r >= spacing) S.rings.push({ r: 0 });
    } else S.rings.forEach(r => { r.r += dt * 70; });
    const maxR = api.narrow ? lay.air.w + 30 : lay.scope.x - S.spkC.x + 10;
    S.rings = S.rings.filter(r => r.r < maxR);
    ctx.save();
    ctx.beginPath();
    if (api.narrow) ctx.rect(S.spkC.x, lay.spk.y, api.W, lay.spk.h); else ctx.rect(S.spkC.x, 0, lay.scope.x - S.spkC.x - 4, api.H);
    ctx.clip();
    S.rings.forEach(r => {
      const a = Math.max(0, 1 - r.r / maxR) * S.amp;
      ctx.strokeStyle = 'rgba(204,251,241,' + (a * 0.8).toFixed(3) + ')';
      ctx.lineWidth = 2 + S.amp * 3;
      ctx.beginPath(); ctx.arc(S.spkC.x - 20, S.spkC.y, r.r + 20, -0.7, 0.7); ctx.stroke();
    });
    ctx.restore();
    if (api.narrow && S.playing) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '700 15px Nunito, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('wavelength ≈ ' + (343 / S.f).toFixed(2) + ' m', lay.air.x + 20, lay.air.y + lay.air.h - 14);
    }
  }

  function drawScope(ctx, b, t) {
    // metal case
    A.shadow(ctx, b.x + b.w / 2, b.y + b.h + 4, b.w * 0.55, 10, 0.45);
    const cs = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    cs.addColorStop(0, '#D7DCE2'); cs.addColorStop(1, '#8F99A5');
    ctx.fillStyle = cs; A.rr(ctx, b.x, b.y, b.w, b.h, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; A.rr(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, 13); ctx.stroke();
    const knobsW = api.narrow ? 0 : 64;
    const sx = b.x + 14, sy = b.y + 14, sw = b.w - 28 - knobsW, sh = b.h - 28 - (api.narrow ? 40 : 0);
    // screen bezel and phosphor
    ctx.fillStyle = '#2B3038'; A.rr(ctx, sx - 4, sy - 4, sw + 8, sh + 8, 10); ctx.fill();
    const scr = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 10, sx + sw / 2, sy + sh / 2, Math.max(sw, sh) * 0.7);
    scr.addColorStop(0, '#0F3A2B'); scr.addColorStop(1, '#03130D');
    ctx.fillStyle = scr; A.rr(ctx, sx, sy, sw, sh, 8); ctx.fill();
    ctx.save(); A.rr(ctx, sx, sy, sw, sh, 8); ctx.clip();
    // graticule: 10 × 8 divisions
    ctx.strokeStyle = 'rgba(90,200,150,0.18)'; ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) { const x = sx + sw * i / 10; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + sh); ctx.stroke(); }
    for (let j = 1; j < 8; j++) { const y = sy + sh * j / 8; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(120,230,180,0.3)';
    ctx.beginPath(); ctx.moveTo(sx, sy + sh / 2); ctx.lineTo(sx + sw, sy + sh / 2); ctx.moveTo(sx + sw / 2, sy); ctx.lineTo(sx + sw / 2, sy + sh); ctx.stroke();
    for (let i = 0; i <= 50; i++) { const x = sx + sw * i / 50; ctx.beginPath(); ctx.moveTo(x, sy + sh / 2 - 3); ctx.lineTo(x, sy + sh / 2 + 3); ctx.stroke(); }
    // trace
    const n = Math.round(sw);
    const ys = samples(n);
    const amp = sh * 0.42;
    const path = () => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const x = sx + i, y = sy + sh / 2 - ys[i] * amp; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    };
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(80,255,170,0.25)'; ctx.lineWidth = 9; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,255,185,0.6)'; ctx.lineWidth = 4; path(); ctx.stroke();
    ctx.strokeStyle = '#E4FFF0'; ctx.lineWidth = 1.6; path(); ctx.stroke();
    // scanlines and glass
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = sy; y < sy + sh; y += 3) ctx.fillRect(sx, y, sw, 1);
    const gl = ctx.createLinearGradient(sx, sy, sx + sw * 0.5, sy + sh * 0.6);
    gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(sx, sy, sw, sh);
    // on-screen readout
    ctx.fillStyle = 'rgba(160,255,200,0.9)'; ctx.font = '800 ' + (api.narrow ? 17 : 13) + 'px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left';
    ctx.fillText(S.playing ? 'f = ' + S.f + ' Hz' : 'no signal', sx + 10, sy + 20);
    if (api.tier >= 2 && S.playing) ctx.fillText('T = ' + (1000 / S.f).toFixed(2) + ' ms', sx + 10, sy + 40);
    ctx.textAlign = 'right';
    ctx.fillText('1 ms/div', sx + sw - 10, sy + sh - 10);
    ctx.restore();
    // knobs and labels
    if (!api.narrow) {
      const kx = b.x + b.w - 44;
      [['TIME', 0.25], ['VOLTS', 0.5], ['POS', 0.75]].forEach((k, i) => {
        const ky = b.y + 46 + i * 84;
        const kg = ctx.createRadialGradient(kx - 4, ky - 5, 2, kx, ky, 18);
        kg.addColorStop(0, '#6B7280'); kg.addColorStop(1, '#1F2937');
        ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(kx, ky, 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(-2 + k[1] * 4) * 13, ky + Math.sin(-2 + k[1] * 4) * 13); ctx.stroke();
        ctx.fillStyle = '#374151'; ctx.font = '800 10px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(k[0], kx, ky + 32);
      });
      ctx.fillStyle = '#1F2937'; ctx.font = '900 11px Nunito, sans-serif'; ctx.fillText('CH 1', kx, b.y + b.h - 24);
    } else {
      ctx.fillStyle = '#374151'; ctx.font = '900 15px Nunito, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('OSCILLOSCOPE · CH 1', b.x + 18, b.y + b.h - 18);
      ctx.fillStyle = S.playing ? '#10B981' : '#9CA3AF'; ctx.beginPath(); ctx.arc(b.x + b.w - 24, b.y + b.h - 24, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  function stop() {
    if (AU && AU.osc) { try { AU.gain.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.02); const o = AU.osc; AU.osc = null; setTimeout(() => { try { o.stop(); } catch (e) { /* ignore */ } }, 200); } catch (e) { /* ignore */ } }
    if (S) S.playing = false;
  }
  return { challenges, start, frame, stop, onPredict, _S: () => S, _set: (f, amp, shape) => { S.f = f; if (amp) S.amp = amp; if (shape) S.shape = shape; if (!S.playing) togglePlay(); else apply(); } };
})();


/* ════════════════════════════════════════════════════════════════
   CRYSTAL GROWING — dissolve, hang a string, cool and wait. Slow
   cooling gives fewer, bigger crystals. Crystals are drawn as
   small 3D shapes: salt cubes, alum octahedra, sugar prisms and
   blue copper sulfate.
   ════════════════════════════════════════════════════════════════ */
LXLabs.crystals = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  // cap: spoonfuls that dissolve in one jar at 20 °C and 80 °C (a
  // simple teaching scale, not a recipe); cold: share left at 5 °C.
  const SUBS = {
    salt:   { name: 'Salt', es: 'sal', cap: { 20: 6, 80: 7 }, cold: 0.98, shape: 'cube', col: '#EEF5FA', sol: 'rgba(225,238,248,0.28)', alpha: 0.72 },
    sugar:  { name: 'Sugar', es: 'azúcar', cap: { 20: 12, 80: 22 }, cold: 0.9, shape: 'prism', col: '#FBF3DC', sol: 'rgba(250,236,190,0.30)', alpha: 0.75 },
    alum:   { name: 'Alum', es: 'alumbre', cap: { 20: 2, 80: 9 }, cold: 0.6, shape: 'octa', col: '#EAF1FB', sol: 'rgba(225,235,250,0.28)', alpha: 0.7 },
    copper: { name: 'Copper sulfate', es: 'sulfato de cobre', cap: { 20: 4, 80: 10 }, cold: 0.75, shape: 'tri', col: '#2F7BE0', sol: 'rgba(40,120,220,0.42)', alpha: 0.86 }
  };

  const challenges = [
    { id: 'dissolve', kind: 'goal', tier: [0, 3], stars: 1, title: 'Dissolve a spoonful',
      how: 'Pour water into the jar, then add a spoonful and stir.', journal: 'A spoonful dissolved and disappeared into the water.',
      explain: 'Dissolving: the solid breaks into pieces too small to see and spreads through the water. It is still there!',
      test: e => e.type === 'dissolve' },
    { id: 'saturate', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make a saturated solution',
      how: 'Keep adding spoonfuls until some will not dissolve.', journal: 'Saturated: the water could not dissolve any more.',
      explain: 'A saturated solution holds as much as it can. The extra sits at the bottom.',
      test: e => e.type === 'saturated' },
    { id: 'grow', kind: 'goal', tier: [0, 3], stars: 1, title: 'Grow crystals on the string',
      how: 'Hang the string, let it cool and wait a week.', journal: 'Crystals grew on the string.',
      test: e => e.type === 'harvest' && e.count > 0 },
    { id: 'pred-salt', kind: 'predict', tier: [1, 3], stars: 2, title: 'Salt in hot water',
      q: 'Does hot water dissolve a LOT more salt than cold water?',
      choices: ['Yes, a lot more', 'Only a little more', 'No, less'], answer: 1,
      how: 'Choose salt, pour HOT water and stir until it is saturated. Compare with cold water.', journal: 'Hot water dissolves only a little more salt.',
      explain: 'Salt is unusual: it dissolves only a little better in hot water. Sugar and alum dissolve much more when hot.',
      test: e => e.type === 'saturated' && e.sub === 'salt' && e.temp === 80 },
    { id: 'shapes', kind: 'goal', tier: [1, 3], stars: 2, title: 'Grow two different crystal shapes',
      how: 'Grow one jar, then start a new jar with another substance.', journal: 'Two substances, two different crystal shapes.',
      explain: 'Each substance builds its own shape: salt makes cubes, alum makes octahedra (like two pyramids), sugar makes long slanted prisms.',
      test: e => e.type === 'harvest' && e.kinds >= 2 },
    { id: 'pred-cool', kind: 'predict', tier: [2, 3], stars: 2, title: 'Slow or fast cooling?',
      q: 'Which gives BIGGER crystals?',
      choices: ['Cooling slowly on the bench', 'Cooling fast in the fridge'], answer: 0,
      how: 'Grow a jar and look at the crystal sizes.', journal: 'Slow cooling: fewer, bigger crystals.',
      explain: 'When cooling is slow, the dissolved stuff has time to join a few crystals, so they grow big. Fast cooling starts many tiny crystals at once.',
      test: e => e.type === 'harvest' && e.count > 0 },
    { id: 'big', kind: 'goal', tier: [2, 3], stars: 2, title: 'Grow a crystal bigger than 1 cm',
      how: 'Hot, saturated, a seed crystal and slow cooling help.', journal: 'Grew a crystal bigger than 1 cm!',
      test: e => e.type === 'harvest' && e.biggest >= 10 },
    { id: 'copper', kind: 'goal', tier: [3, 3], stars: 1, title: 'Grow blue copper sulfate',
      how: 'In real life only with a grown-up, gloves and goggles.', journal: 'Grew blue copper sulfate crystals.',
      explain: 'Copper sulfate crystals are a deep blue. The real chemical is harmful if swallowed and irritates skin and eyes, so it is only used with an adult.',
      test: e => e.type === 'harvest' && e.sub === 'copper' }
  ];

  function start(a) {
    api = a;
    const kinds = S && S.kinds ? S.kinds : {};
    S = { step: 'pick', sub: 'salt', temp: 80, level: 0, levelT: 0, dissolved: 0, extra: 0, seed: false, hung: false, cooling: 'slow',
      day: 0, dayAcc: 0, running: false, crystals: [], t: 0, stir: 0, grains: [], kinds, tempNow: 20, rot: 0 };
    buildControls();
  }

  function cap(sub, temp) { return SUBS[sub].cap[temp]; }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    const step = S.step;
    const subOpts = Object.keys(SUBS).filter(k => k !== 'copper' || api.tier >= 2).map(k => ({ v: k, label: SUBS[k].name }));
    if (step === 'pick') {
      c.appendChild(LXUI.seg({ label: '1 · Choose what to dissolve', value: S.sub, options: subOpts, onChange: v => { S.sub = v; buildControls(); } }));
      if (S.sub === 'copper') {
        const w = document.createElement('div'); w.className = 'lx-readout';
        w.innerHTML = '⚠️ <b>Copper sulfate</b> is harmful if swallowed and irritates skin and eyes. In real life: only with a grown-up, gloves and goggles.';
        c.appendChild(w);
      }
      c.appendChild(LXUI.seg({ label: '2 · Water', value: S.temp, options: [{ v: 20, label: 'Cold tap water · 20 °C' }, { v: 80, label: 'Hot water · 80 °C' }], onChange: v => { S.temp = v; } }));
      c.appendChild(LXUI.row([LXUI.button('💧 Pour the water', () => { S.step = 'stir'; S.levelT = 1; S.tempNow = S.temp; api.sfx('click'); buildControls(); }, 'lx-btn-main')]));
    } else if (step === 'stir') {
      const ro = document.createElement('div'); ro.className = 'lx-readout'; ro.id = 'cr-ro';
      c.appendChild(LXUI.row([
        LXUI.button('🥄 Add a spoonful and stir', spoon, 'lx-btn-main'),
        LXUI.button('Next: hang a string →', () => { if (S.dissolved < 1) { api.toast('Add at least one spoonful first.'); return; } S.step = 'hang'; buildControls(); }, 'lx-btn-soft')
      ]));
      c.appendChild(ro);
      readout();
    } else if (step === 'hang') {
      const opts = [{ v: false, label: 'Plain string' }];
      if (api.tier >= 2) opts.push({ v: true, label: 'String + a seed crystal' });
      c.appendChild(LXUI.seg({ label: '3 · Hang it from a pencil', value: S.seed, options: opts, onChange: v => { S.seed = v; } }));
      c.appendChild(LXUI.seg({ label: '4 · Let it cool', value: S.cooling, options: [{ v: 'slow', label: '🛋️ Slowly, on the bench' }, { v: 'fast', label: '🧊 Fast, in the fridge' }], onChange: v => { S.cooling = v; } }));
      c.appendChild(LXUI.row([LXUI.button('⏳ Start: wait 7 days', () => { S.hung = true; S.step = 'grow'; S.running = true; plan(); api.sfx('click'); buildControls(); }, 'lx-btn-main')]));
    } else if (step === 'grow') {
      const ro = document.createElement('div'); ro.className = 'lx-readout'; ro.id = 'cr-ro';
      c.appendChild(ro); readout();
    } else if (step === 'done') {
      const ro = document.createElement('div'); ro.className = 'lx-readout'; ro.id = 'cr-ro';
      c.appendChild(ro); readout();
      c.appendChild(LXUI.row([LXUI.button('🫙 Start a new jar', () => { start(api); api.sfx('click'); }, 'lx-btn-main')]));
    }
  }

  function readout() {
    const ro = document.getElementById('cr-ro');
    if (!ro) return;
    const sub = SUBS[S.sub];
    if (S.step === 'stir') {
      ro.innerHTML = '<b>' + escHtml(sub.name) + '</b> in water at ' + S.temp + ' °C · dissolved: <b>' + S.dissolved + ' spoon' + (S.dissolved === 1 ? '' : 's') + '</b>' +
        (S.extra ? ' · <b class="ok">Saturated!</b> ' + S.extra + ' left on the bottom' : '');
    } else if (S.step === 'grow') {
      ro.innerHTML = 'Day <b>' + S.day + '</b> of 7 · ' + (S.cooling === 'fast' ? 'in the fridge' : 'on the bench') + ' · temperature ' + Math.round(S.tempNow) + ' °C';
    } else if (S.step === 'done') {
      const big = biggest();
      ro.innerHTML = S.crystals.length
        ? '<b>' + S.crystals.length + ' crystals</b> · biggest about <b>' + big.toFixed(0) + ' mm</b> (' + (big / 10).toFixed(1) + ' cm) · ' + escHtml(shapeName(S.sub))
        : 'No crystals this time: the solution was not strong enough. Try more spoonfuls, hotter water, or more days for the water to evaporate.';
    }
  }
  function shapeName(sub) { return { salt: 'little cubes', alum: 'octahedra, like two pyramids base to base', sugar: 'long, slanted prisms', copper: 'slanted blue blocks' }[sub]; }

  function spoon() {
    S.stir = 1;
    api.sfx('click');
    if (S.dissolved < cap(S.sub, S.temp)) {
      S.dissolved++;
      api.emit({ type: 'dissolve', sub: S.sub });
    } else {
      S.extra++;
      for (let i = 0; i < 14; i++) S.grains.push({ x: (Math.random() - 0.5) * 0.8, y: Math.random(), s: 1 + Math.random() * 1.6 });
      if (S.extra === 1) api.toast('Saturated! This spoonful will not dissolve.');
      api.emit({ type: 'saturated', sub: S.sub, temp: S.temp });
    }
    readout();
  }

  // Decide how many crystals grow, where, and how big at the end.
  function plan() {
    const sub = SUBS[S.sub], r = A.rng(Math.floor(Math.random() * 1e6));
    const capCold = cap(S.sub, 20) * (S.cooling === 'fast' ? sub.cold : 1);
    const evap = S.cooling === 'fast' ? 0.02 : 0.06;
    const finalCap = capCold * (1 - evap * 7);
    S.mass = Math.max(0, S.dissolved - finalCap);
    S.massCool = Math.max(0, S.dissolved - capCold);
    S.evap = evap;
    let n = S.cooling === 'fast' ? 16 + Math.floor(r() * 8) : 4 + Math.floor(r() * 3);
    if (S.mass <= 0.05) n = 0;
    const list = [];
    for (let i = 0; i < n; i++) {
      const onString = S.cooling === 'fast' ? r() < 0.45 : r() < 0.7;
      list.push({ share: 0.4 + r(), onString, u: r(), v: r(), rx: r() * 6, ry: r() * 6, rz: r() * 6, size: 0, seed: false });
    }
    if (S.seed && n) { list[0].seed = true; list[0].onString = true; list[0].u = 0.55; }
    const tot = list.reduce((s, c) => s + c.share, 0) || 1;
    list.forEach(c => { c.share = c.seed ? 0.68 : (c.share / tot) * (S.seed ? 0.32 : 1); });
    S.crystals = list;
  }

  function sizeFor(c, m) { return 9 * Math.cbrt(Math.max(0, m * c.share)); }   // mm
  function biggest() { return S.crystals.reduce((m, c) => Math.max(m, c.size), 0); }

  function frame(dt, t) {
    S.t = t;
    if (S.levelT > S.level) S.level = Math.min(S.levelT, S.level + dt * 1.2);
    S.stir = Math.max(0, S.stir - dt * 1.2);
    if (S.running) {
      S.dayAcc += dt;
      const per = 0.85;
      const prog = Math.min(7, S.day + S.dayAcc / per);
      // temperature falls to room or fridge temperature over the first day
      const target = S.cooling === 'fast' ? 5 : 20;
      S.tempNow = S.temp === 80 ? target + (80 - target) * Math.exp(-prog * (S.cooling === 'fast' ? 6 : 2.2)) : target + (20 - target) * Math.exp(-prog * 6);
      const evapNow = 1 - S.evap * prog;
      const capNow = cap(S.sub, 20) * (S.cooling === 'fast' ? SUBS[S.sub].cold : 1) * evapNow;
      const capT = S.tempNow > 25 ? capNow + (cap(S.sub, 80) - cap(S.sub, 20)) * (S.tempNow - 20) / 60 : capNow;
      const m = Math.max(0, S.dissolved - capT);
      S.crystals.forEach(c => { c.size = Math.max(c.size, sizeFor(c, m)); });
      S.levelT = S.level = evapNow;
      if (S.dayAcc >= per) {
        S.dayAcc -= per; S.day++;
        readout();
        if (S.day >= 7) finish();
      }
    }
    draw(api.ctx, t);
  }

  function finish() {
    S.running = false; S.step = 'done';
    S.kinds[S.sub] = true;
    buildControls();
    const big = biggest();
    api.journal(SUBS[S.sub].name + ': ' + S.crystals.length + ' crystals, biggest ' + big.toFixed(0) + ' mm (' + (S.cooling === 'fast' ? 'fridge' : 'bench') + ').');
    api.emit({ type: 'harvest', sub: S.sub, count: S.crystals.length, biggest: big, cooling: S.cooling, kinds: Object.keys(S.kinds).length });
  }

  // ── 3D crystal shapes ──
  const SHAPES = (() => {
    const cube = { v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
      f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]] };
    const octa = { v: [[1.3, 0, 0], [-1.3, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1.3], [0, 0, -1.3]],
      f: [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]] };
    const pv = [], pf = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; pv.push([-1.5, Math.cos(a) * 0.62, Math.sin(a) * 0.45]); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; pv.push([1.5 + Math.cos(a) * 0.35, Math.cos(a) * 0.62, Math.sin(a) * 0.45]); }
    for (let i = 0; i < 6; i++) pf.push([i, (i + 1) % 6, 6 + (i + 1) % 6, 6 + i]);
    pf.push([0, 1, 2, 3, 4, 5]); pf.push([6, 7, 8, 9, 10, 11]);
    const prism = { v: pv, f: pf };
    const a = [1.3, 0, 0], b = [0.4, 0.9, 0], c = [0.3, 0.25, 0.65];
    const tv = [];
    [0, 1].forEach(k => [0, 1].forEach(j => [0, 1].forEach(i => tv.push([0, 1, 2].map(d => (i - 0.5) * 2 * a[d] + (j - 0.5) * 2 * b[d] + (k - 0.5) * 2 * c[d])))));
    const tri = { v: tv, f: [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]] };
    return { cube, octa, prism, tri };
  })();

  function drawCrystal(ctx, x, y, sizePx, c, sub) {
    const sh = SHAPES[sub.shape];
    const cx = Math.cos(c.rx), sx = Math.sin(c.rx), cy = Math.cos(c.ry), sy = Math.sin(c.ry), cz = Math.cos(c.rz), sz = Math.sin(c.rz);
    const rot = p => {
      let [X, Y, Z] = p;
      let y1 = Y * cx - Z * sx, z1 = Y * sx + Z * cx; Y = y1; Z = z1;
      let x2 = X * cy + Z * sy, z2 = -X * sy + Z * cy; X = x2; Z = z2;
      let x3 = X * cz - Y * sz, y3 = X * sz + Y * cz;
      return [x3, y3, Z];
    };
    const V = sh.v.map(rot);
    const cen = V.reduce((m, p) => [m[0] + p[0] / V.length, m[1] + p[1] / V.length, m[2] + p[2] / V.length], [0, 0, 0]);
    const L = [-0.45, -0.65, 0.62];
    const faces = sh.f.map(f => {
      const p0 = V[f[0]], p1 = V[f[1]], p2 = V[f[2]];
      const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], w = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
      let n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const fc = f.reduce((m, i) => [m[0] + V[i][0] / f.length, m[1] + V[i][1] / f.length, m[2] + V[i][2] / f.length], [0, 0, 0]);
      if (n[0] * (fc[0] - cen[0]) + n[1] * (fc[1] - cen[1]) + n[2] * (fc[2] - cen[2]) < 0) n = n.map(q => -q);
      const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(q => q / nl);
      return { f, n, z: fc[2] };
    }).filter(F => F.n[2] > 0).sort((p, q) => p.z - q.z);
    const s = sizePx / 2.6;
    const base = A.hex(sub.col);
    faces.forEach(F => {
      const d = Math.max(0, F.n[0] * L[0] + F.n[1] * L[1] + F.n[2] * L[2]);
      const k = 0.42 + d * 0.7;
      ctx.beginPath();
      F.f.forEach((i, j) => { const px = x + V[i][0] * s, py = y + V[i][1] * s; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + Math.min(255, base[0] * k) + ',' + Math.min(255, base[1] * k) + ',' + Math.min(255, base[2] * k) + ',' + sub.alpha + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + d * 0.4) + ')'; ctx.lineWidth = Math.max(0.6, sizePx / 40); ctx.stroke();
      if (d > 0.85) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); }
    });
  }

  function draw(ctx, t) {
    const W = api.W, H = api.H;
    const fridge = S.cooling === 'fast' && (S.step === 'grow' || S.step === 'done');
    if (fridge) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#EEF6FB'); g.addColorStop(1, '#CFE1EC');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(0, H * 0.86, W, 6);
      ctx.fillStyle = 'rgba(150,180,200,0.35)'; ctx.fillRect(0, H * 0.86 + 6, W, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(W * 0.04, 0, 10, H);
      A.label(ctx, '🧊 In the fridge · 5 °C', W * 0.5, 28, { size: api.narrow ? 18 : 14, bg: '#fff' });
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#F3EEFB'); g.addColorStop(1, '#E2D9F2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(A.wood(W, Math.round(H * 0.16), '#B88A5A', 8), 0, H * 0.86);
    }
    const floor = H * 0.86;
    const jw = api.narrow ? 300 : 230, jh = api.narrow ? 380 : 270;
    const jx = W / 2 - jw / 2, jy = floor - jh;
    A.shadow(ctx, W / 2, floor + 2, jw * 0.62, 10, 0.35);
    const sub = SUBS[S.sub];
    // solution
    const top = jy + 40 + (1 - S.level) * (jh - 60);
    if (S.level > 0.01) {
      ctx.save();
      jarPath(ctx, jx, jy, jw, jh); ctx.clip();
      ctx.fillStyle = sub.sol; ctx.fillRect(jx, top, jw, floor - top);
      const sg = ctx.createLinearGradient(0, top, 0, floor);
      sg.addColorStop(0, 'rgba(255,255,255,0.18)'); sg.addColorStop(1, 'rgba(0,30,60,0.10)');
      ctx.fillStyle = sg; ctx.fillRect(jx, top, jw, floor - top);
      // evaporation tide-marks
      if (S.step === 'grow' || S.step === 'done') { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(jx, jy + 40); ctx.lineTo(jx + jw, jy + 40); ctx.stroke(); }
      // stirring swirl
      if (S.stir > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (S.stir * 0.6) + ')'; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(W / 2, top + 50 + k * 50, jw * 0.3 * (1 - k * 0.2), 10, 0, t * 6 + k, t * 6 + k + 4); ctx.stroke(); }
      }
      // grains left on the bottom
      ctx.fillStyle = S.sub === 'copper' ? '#5AA0F0' : '#FFFFFF';
      S.grains.forEach(g => { ctx.fillRect(W / 2 + g.x * jw * 0.8, floor - 10 - g.y * 8 * Math.min(3, S.extra / 2 + 1), g.s * 1.6, g.s * 1.6); });
      // meniscus
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(W / 2, top, jw / 2 - 4, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // pencil + string
    const sx = W / 2;
    if (S.hung) {
      const pg = ctx.createLinearGradient(0, jy - 16, 0, jy - 2);
      pg.addColorStop(0, '#FCD34D'); pg.addColorStop(1, '#D97706');
      ctx.fillStyle = pg; A.rr(ctx, jx - 40, jy - 18, jw + 80, 14, 5); ctx.fill();
      ctx.fillStyle = '#F2C9A0'; ctx.beginPath(); ctx.moveTo(jx + jw + 40, jy - 18); ctx.lineTo(jx + jw + 58, jy - 11); ctx.lineTo(jx + jw + 40, jy - 4); ctx.fill();
      ctx.strokeStyle = '#F5F2EA'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, jy - 8); ctx.lineTo(sx + Math.sin(t * 0.6) * 1.5, floor - 40); ctx.stroke();
    }
    // crystals (pixels per mm for drawing)
    const pxmm = api.narrow ? 4.6 : 3.6;
    S.crystals.forEach((c, i) => {
      if (c.size < 0.4) return;
      let x, y;
      if (c.onString) { y = jy + 50 + (floor - 50 - (jy + 50)) * (0.15 + c.u * 0.75); x = sx + (c.v - 0.5) * 6; if (y < top + 6) y = top + 6 + c.u * 20; }
      else { x = W / 2 + (c.u - 0.5) * jw * 0.8; y = floor - 8 - c.size * pxmm * 0.3; }
      drawCrystal(ctx, x, y, c.size * pxmm, c, sub);
    });
    // the glass
    jarGlass(ctx, jx, jy, jw, jh);
    // thermometer readout
    if (S.step !== 'pick') A.label(ctx, Math.round(S.tempNow) + ' °C', jx + jw + (api.narrow ? -46 : 50), jy + 70, { size: api.narrow ? 20 : 15, bg: S.tempNow > 40 ? '#FEE2E2' : '#E0F2FE' });
    if (S.step === 'pick') A.label(ctx, 'Choose, then pour the water', W / 2, jy + jh / 2, { size: api.narrow ? 20 : 15 });
    // magnifier on the biggest crystal when done
    if (S.step === 'done' && S.crystals.length && api.tier >= 1) {
      const c = S.crystals.reduce((m, q) => q.size > m.size ? q : m, S.crystals[0]);
      const mx = api.narrow ? W - 100 : W - 90, my = api.narrow ? 100 : 96, mr = api.narrow ? 76 : 66;
      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.closePath();
      ctx.fillStyle = fridge ? '#E6F1F8' : '#F6F2FC'; ctx.fill(); ctx.clip();
      ctx.fillStyle = sub.sol; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
      drawCrystal(ctx, mx, my, mr * 1.1, { rx: c.rx + t * 0.3, ry: c.ry, rz: c.rz }, sub);
      ctx.restore();
      ctx.strokeStyle = '#3F3A4F'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - mr * 0.72, my + mr * 0.72); ctx.lineTo(mx - mr * 1.15, my + mr * 1.15); ctx.stroke();
      A.label(ctx, 'magnified', mx, my + mr + 18, { size: api.narrow ? 15 : 12 });
    }
  }

  function jarPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 20); ctx.lineTo(x + w - 14, y + 20);
    ctx.quadraticCurveTo(x + w, y + 30, x + w, y + 50);
    ctx.lineTo(x + w, y + h - 20); ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
    ctx.lineTo(x + 20, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
    ctx.lineTo(x, y + 50); ctx.quadraticCurveTo(x, y + 30, x + 14, y + 20); ctx.closePath();
  }
  function jarGlass(ctx, x, y, w, h) {
    jarPath(ctx, x, y, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.12, 'rgba(255,255,255,0.10)'); g.addColorStop(0.85, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0.45)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(140,150,175,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 16, y + 60); ctx.lineTo(x + 16, y + h - 40); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w - 14, y + 70); ctx.lineTo(x + w - 14, y + h * 0.5); ctx.stroke();
    // rim
    ctx.fillStyle = 'rgba(230,235,245,0.8)'; A.rr(ctx, x + 8, y + 10, w - 16, 14, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(140,150,175,0.9)'; ctx.lineWidth = 2; ctx.stroke();
  }

  function stop() { if (S) S.running = false; }
  return { challenges, start, frame, stop, _S: () => S, _fast: () => { while (S.running) { S.dayAcc += 0.9; frame(0, S.t); } } };
})();


/* ════════════════════════════════════════════════════════════════
   STATIC ELECTRICITY — rub a balloon on hair, then lift paper bits
   and bend a thin stream of water.
   ════════════════════════════════════════════════════════════════ */
LXLabs.static = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  const challenges = [
    { id: 'charge', kind: 'goal', tier: [0, 3], stars: 1, title: 'Charge the balloon',
      how: 'Drag the balloon back and forth over the hair.', journal: 'Rubbing on hair charged the balloon.',
      explain: 'Rubbing moves tiny charged particles, electrons, from the hair onto the balloon.',
      test: e => e.type === 'charge' },
    { id: 'hair', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make the hair stand up',
      how: 'Charge the balloon, then hold it just above the hair without touching.', journal: 'The hair lifted toward the charged balloon.',
      explain: 'The hair and the balloon now have opposite charges, and opposite charges attract.',
      test: e => e.type === 'hair' },
    { id: 'paper5', kind: 'goal', tier: [0, 3], stars: 1, title: 'Pick up 5 bits of paper',
      how: 'Move the charged balloon close to the paper bits on the table.', journal: 'The charged balloon picked up paper bits.',
      test: e => e.type === 'paper' && e.n >= 5 },
    { id: 'pred-water', kind: 'predict', tier: [1, 3], stars: 2, title: 'Balloon and running water',
      q: 'Hold a charged balloon near a thin stream of water from the tap. What will the water do?',
      choices: ['Bend toward the balloon', 'Bend away from the balloon', 'Nothing'], answer: 0,
      how: 'Charge the balloon, then bring it near the stream (do not touch).', journal: 'The water stream bent toward the charged balloon.',
      explain: 'Water molecules have a slightly positive end and a slightly negative end, so the charged balloon pulls the stream sideways.',
      test: e => e.type === 'bend' },
    { id: 'pred-plain', kind: 'predict', tier: [1, 3], stars: 2, title: 'An uncharged balloon',
      q: 'Will a balloon that has NOT been rubbed pick up the paper bits?',
      choices: ['Yes', 'No'], answer: 1,
      how: 'Start again (or wait until the charge is gone) and hold the balloon over the paper.', journal: 'An uncharged balloon did not lift any paper.',
      explain: 'No charge, no pull. The rubbing is what makes the balloon attract things.',
      test: e => e.type === 'nocharge' },
    { id: 'pred-e', kind: 'predict', tier: [2, 3], stars: 2, title: 'What moves when you rub?',
      q: 'When you rub a rubber balloon on hair, the balloon picks up extra…',
      choices: ['Electrons, so it becomes negative', 'Protons, so it becomes positive', 'Nothing at all'], answer: 0,
      how: 'Switch on "Show charges" and rub.', journal: 'Rubbing moved electrons from the hair to the balloon.',
      explain: 'Electrons are easy to move; protons stay in the atoms. The balloon ends up negative (−) and the hair positive (+).',
      test: e => e.type === 'charge' && e.shown },
    { id: 'paper15', kind: 'goal', tier: [2, 3], stars: 2, title: 'Lift 15 bits at once',
      how: 'A strong charge and a careful approach.', journal: 'Lifted 15 paper bits at once!',
      test: e => e.type === 'paper' && e.n >= 15 },
    { id: 'pred-leak', kind: 'predict', tier: [3, 3], stars: 2, title: 'Does the charge last?',
      q: 'Charge the balloon well, then leave it alone. What happens to the charge?',
      choices: ['It keeps growing', 'It slowly leaks away', 'It stays forever'], answer: 1,
      how: 'Charge it strongly, then do not touch it. Watch the meter.', journal: 'The charge leaked away over time.',
      explain: 'Charge slowly escapes into the air, faster on a humid day. That is why static tricks work best when the air is dry.',
      test: e => e.type === 'leak' }
  ];

  function start(a) {
    api = a;
    const W = api.W, H = api.H;
    S = { t: 0, charge: 0, hairQ: 0, show: false, drag: null, bits: [], hair: [], emitted: {}, near: 0, peak: 0, lastRub: 0, stuckN: 0 };
    S.table = api.narrow ? H - 70 : H - 56;
    S.head = api.narrow ? { x: 150, y: 210, r: 74 } : { x: 120, y: 190, r: 70 };
    S.b = { x: api.narrow ? 360 : 300, y: api.narrow ? 300 : 200, R: api.narrow ? 54 : 46, vx: 0, vy: 0, sx: 0, sy: 0 };
    S.tap = api.tier >= 1 ? (api.narrow ? { x: 510, y: 40, end: S.table - 10 } : { x: 520, y: 40, end: S.table - 8 }) : null;
    // hair strands from the scalp
    const r = A.rng(7);
    for (let i = 0; i < 70; i++) {
      const a = Math.PI * (1.05 + (i / 69) * 0.9) + (r() - 0.5) * 0.05;
      S.hair.push({ a, len: S.head.r * (0.5 + r() * 0.35), tip: null, cur: [0, 0], col: r() });
    }
    // paper bits on the table, right side
    const n = 26;
    const x0 = api.narrow ? 300 : 300, x1 = api.narrow ? 590 : 480;
    for (let i = 0; i < n; i++) {
      S.bits.push({ x: x0 + r() * (x1 - x0), y: S.table - 2, vx: 0, vy: 0, w: 7 + r() * 6, h: 5 + r() * 4, rot: r() * 3, vr: 0,
        col: ['#FFFFFF', '#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0'][i % 5], stuck: null, x0: 0 });
    }
    buildControls();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    const items = [LXUI.button('↺ Start again', () => { start(api); api.sfx('click'); }, 'lx-btn-soft')];
    if (api.tier >= 1) {
      ui.show = LXUI.seg({ label: 'Show charges', value: 'off', options: [{ v: 'off', label: 'Hide' }, { v: 'on', label: 'Show + and −' }], onChange: v => { S.show = v === 'on'; if (S.show && S.charge > 0.5) api.emit({ type: 'charge', shown: true }); } });
      items.unshift(ui.show);
    }
    c.appendChild(LXUI.row(items));
    const tip = document.createElement('div'); tip.className = 'lx-readout';
    tip.innerHTML = 'Rub the balloon on the hair, then bring it near the paper' + (S.tap ? ' or the water' : '') + '. <b>Try it for real</b> with a balloon on a dry day!';
    c.appendChild(tip);
  }

  // ── input ──
  function down(p) {
    const b = S.b;
    if (Math.hypot(p.x - b.x, p.y - b.y) < b.R + 18) S.drag = { dx: p.x - b.x, dy: p.y - b.y, lx: p.x, ly: p.y };
  }
  function move(p, e, pressed) {
    if (!S.drag || !pressed) return;
    const b = S.b;
    const nx = Math.max(b.R, Math.min(api.W - b.R, p.x - S.drag.dx)), ny = Math.max(b.R, Math.min(S.table - b.R - 6, p.y - S.drag.dy));
    const moved = Math.hypot(nx - b.x, ny - b.y);
    // rubbing: the balloon pressed into the hair and moving
    const h = S.head, dh = Math.hypot(nx - h.x, ny - (h.y - h.r * 0.3));
    if (dh < h.r + b.R * 0.75 && moved > 0.5) {
      S.charge = Math.min(1, S.charge + moved * 0.0022);
      S.hairQ = Math.min(1, S.hairQ + moved * 0.0018);
      S.lastRub = S.t;
      if (Math.random() < 0.08) api.sfx('click');
    }
    b.vx = nx - b.x; b.vy = ny - b.y;
    b.x = nx; b.y = ny;
  }
  function up() { S.drag = null; }

  function frame(dt, t) {
    S.t = t;
    const b = S.b, h = S.head;
    // charge leaks away slowly
    const leak = Math.exp(-dt / 30);
    S.charge *= leak; S.hairQ *= leak;
    if (S.charge > 0.5 && !S.emitted.charge) { S.emitted.charge = 1; api.emit({ type: 'charge', shown: S.show }); }
    if (S.show && S.charge > 0.5 && !S.emitted.shown) { S.emitted.shown = 1; api.emit({ type: 'charge', shown: true }); }
    S.peak = Math.max(S.peak, S.charge);
    if (S.t - S.lastRub > 2) { if (S.peak > 0.6 && S.charge < 0.3) { api.emit({ type: 'leak' }); S.peak = 0; } }
    else S.peak = Math.max(S.peak, S.charge);
    if (!S.drag) { b.vx *= 0.9; b.vy *= 0.9; }

    // paper bits: pulled by the balloon's charge, fall with gravity
    let stuck = 0, nearPaper = false;
    S.bits.forEach(p => {
      if (p.stuck) {
        const a = p.stuck.a;
        p.x = b.x + Math.cos(a) * (b.R + 2); p.y = b.y + Math.sin(a) * (b.R + 2) * 1.08; p.rot = a + Math.PI / 2;
        if (S.charge < 0.18 || Math.random() < 0.0004) { p.stuck = null; p.vy = 0; p.vx = (Math.random() - 0.5) * 40; }
        else stuck++;
        return;
      }
      const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy);
      if (d < b.R + 70) nearPaper = true;
      const f = S.charge * 2.4e6 / Math.max(d * d * d, 2000);
      let ax = dx / d * f, ay = dy / d * f + 900;
      if (p.y >= S.table - 2 && ay > 0 && f < 900) { ay = 0; p.vy = 0; }
      p.vx += ax * dt; p.vy += ay * dt;
      p.vx *= 0.96; p.vy *= 0.98;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vx * dt * 0.05;
      if (p.y > S.table - 2) { p.y = S.table - 2; p.vy = 0; p.vx *= 0.6; }
      if (d < b.R + 6 && S.charge > 0.2) { p.stuck = { a: Math.atan2(p.y - b.y, p.x - b.x) }; api.sfx('click'); }
    });
    if (stuck !== S.stuckN) { S.stuckN = stuck; if (stuck > 0) api.emit({ type: 'paper', n: stuck }); }
    if (nearPaper && S.charge < 0.1) { S.near += dt; if (S.near > 1.5) api.emit({ type: 'nocharge' }); } else S.near = 0;

    // hair lift toward the balloon (and frizz from its own charge)
    let lift = 0;
    S.hair.forEach(s => {
      const rx = h.x + Math.cos(s.a) * h.r * 0.92, ry = h.y + Math.sin(s.a) * h.r * 0.98;
      const outA = s.a + (s.a < Math.PI * 1.5 ? -0.25 : 0.25);
      let tx = rx + Math.cos(outA + Math.PI * 0.0) * s.len * 0.55, ty = ry + Math.sin(outA) * s.len * 0.25 + s.len * 0.55;
      // resting hair falls down the sides; the top lies flat
      const fr = S.hairQ * 0.7;
      tx += Math.cos(s.a) * s.len * fr; ty += Math.sin(s.a) * s.len * fr - s.len * fr * 0.3;
      const dx = b.x - rx, dy = b.y - ry, d = Math.hypot(dx, dy);
      const pull = Math.min(1, S.charge * S.hairQ * 9000 / (d * d + 1)) * (d > b.R ? 1 : 0.3);
      tx += (b.x - b.R * dx / d - tx) * pull * 0.85; ty += (b.y - b.R * dy / d - ty) * pull * 0.85;
      lift = Math.max(lift, pull);
      s.cur[0] += (tx - s.cur[0]) * Math.min(1, dt * 10); s.cur[1] += (ty - s.cur[1]) * Math.min(1, dt * 10);
      if (!s.tip) s.cur = [tx, ty], s.tip = true;
      s.root = [rx, ry];
    });
    if (lift > 0.45 && Math.hypot(b.x - h.x, b.y - h.y) > h.r + b.R * 0.4 && !S.emitted.hair) { S.emitted.hair = 1; api.emit({ type: 'hair' }); }

    draw(api.ctx, t);
  }

  function stream() {
    // a thin stream falling from the tap, pulled sideways by the balloon
    const tp = S.tap, b = S.b, pts = [];
    let x = tp.x, vx = 0, y = tp.y + 44;
    const g = 2400;
    for (; y < tp.end; y += 5) {
      const v = Math.sqrt(2 * g * (y - tp.y - 40) + 900), dtt = 5 / v;
      const dx = b.x - x, dy = b.y - y, d = Math.max(b.R, Math.hypot(dx, dy));
      vx += S.charge * 9e7 * dx / (d * d * d) * dtt * 0.5;
      x += vx * dtt;
      pts.push([x, y]);
    }
    return pts;
  }

  function draw(ctx, t) {
    const W = api.W, H = api.H, b = S.b, h = S.head;
    const wg = ctx.createLinearGradient(0, 0, 0, S.table);
    wg.addColorStop(0, '#FFF6EE'); wg.addColorStop(1, '#F7E4D4');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, S.table);
    ctx.drawImage(A.wood(W, H - S.table, '#B98A5E', 5), 0, S.table);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, S.table, W, 3);
    // tap and basin
    if (S.tap) {
      const tp = S.tap;
      const pg = ctx.createLinearGradient(tp.x - 60, 0, tp.x + 20, 0);
      pg.addColorStop(0, '#9AA3AF'); pg.addColorStop(0.5, '#F3F4F6'); pg.addColorStop(1, '#6B7280');
      ctx.fillStyle = pg;
      A.rr(ctx, tp.x + 20, 0, 22, tp.y + 10, 6); ctx.fill();
      A.rr(ctx, tp.x - 8, tp.y, 52, 18, 9); ctx.fill();
      A.rr(ctx, tp.x - 6, tp.y + 10, 12, 34, 4); ctx.fill();
      const pts = stream();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(96,165,250,0.55)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(tp.x, tp.y + 44); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tp.x - 1, tp.y + 44); pts.forEach((p, i) => ctx.lineTo(p[0] - 1 + Math.sin(i * 0.9 + t * 20) * 0.4, p[1])); ctx.stroke();
      const end = pts[pts.length - 1] || [tp.x, tp.end];
      const bend = Math.abs(end[0] - tp.x);
      if (bend > 22 && !S.emitted.bend) { S.emitted.bend = 1; api.emit({ type: 'bend' }); }
      ctx.fillStyle = 'rgba(147,197,253,0.6)'; ctx.beginPath(); ctx.ellipse(end[0], S.table - 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#CBD5E1'; A.rr(ctx, tp.x - 50, S.table - 8, 100, 10, 4); ctx.fill();
    }
    // child: shoulders, head, face, then hair
    const sh = ctx.createLinearGradient(0, h.y + h.r, 0, H);
    sh.addColorStop(0, '#3B82F6'); sh.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.moveTo(h.x - h.r * 1.5, S.table); ctx.quadraticCurveTo(h.x - h.r * 1.4, h.y + h.r * 1.1, h.x, h.y + h.r * 1.05);
    ctx.quadraticCurveTo(h.x + h.r * 1.4, h.y + h.r * 1.1, h.x + h.r * 1.5, S.table); ctx.fill();
    ctx.fillStyle = '#E8B48C'; ctx.fillRect(h.x - h.r * 0.25, h.y + h.r * 0.7, h.r * 0.5, h.r * 0.4);
    const skin = ctx.createRadialGradient(h.x - h.r * 0.3, h.y - h.r * 0.3, h.r * 0.2, h.x, h.y, h.r * 1.05);
    skin.addColorStop(0, '#FFE1C6'); skin.addColorStop(1, '#E2A57B');
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * 0.9, h.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E8AE86'; ctx.beginPath(); ctx.ellipse(h.x - h.r * 0.9, h.y + 6, 10, 15, 0, 0, Math.PI * 2); ctx.ellipse(h.x + h.r * 0.9, h.y + 6, 10, 15, 0, 0, Math.PI * 2); ctx.fill();
    // eyes follow the balloon
    const ea = Math.atan2(b.y - h.y, b.x - h.x);
    [-0.32, 0.32].forEach(o => {
      const ex = h.x + o * h.r, ey = h.y + h.r * 0.05;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3A2A20'; ctx.beginPath(); ctx.arc(ex + Math.cos(ea) * 3.5, ey + Math.sin(ea) * 3.5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + Math.cos(ea) * 3.5 - 1.5, ey + Math.sin(ea) * 3.5 - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = '#B5653A'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(h.x, h.y + h.r * 0.38, h.r * (S.hairQ > 0.3 ? 0.2 : 0.16), 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(240,130,120,0.35)'; ctx.beginPath(); ctx.arc(h.x - h.r * 0.5, h.y + h.r * 0.32, 9, 0, Math.PI * 2); ctx.arc(h.x + h.r * 0.5, h.y + h.r * 0.32, 9, 0, Math.PI * 2); ctx.fill();
    // hair cap and strands
    ctx.fillStyle = '#7A4A22';
    ctx.beginPath(); ctx.ellipse(h.x, h.y - h.r * 0.22, h.r * 0.94, h.r * 0.82, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.lineCap = 'round';
    S.hair.forEach(s => {
      if (!s.root) return;
      ctx.strokeStyle = s.col < 0.33 ? '#6B3E1A' : s.col < 0.66 ? '#7E4C24' : '#94603A';
      ctx.lineWidth = 2.6;
      const mx = (s.root[0] + s.cur[0]) / 2 + Math.cos(s.a) * 8, my = (s.root[1] + s.cur[1]) / 2 + Math.sin(s.a) * 8;
      ctx.beginPath(); ctx.moveTo(s.root[0], s.root[1]); ctx.quadraticCurveTo(mx, my, s.cur[0], s.cur[1]); ctx.stroke();
    });
    if (S.show && S.hairQ > 0.05) {
      ctx.fillStyle = '#B91C1C'; ctx.font = '900 ' + (api.narrow ? 20 : 16) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      const n = Math.round(S.hairQ * 10);
      for (let i = 0; i < n; i++) { const a = Math.PI * (1.1 + i / Math.max(1, n - 1) * 0.8); ctx.fillText('+', h.x + Math.cos(a) * h.r * 1.2, h.y + Math.sin(a) * h.r * 1.15); }
    }
    // paper bits
    S.bits.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col; ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.8;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    // balloon string
    ctx.strokeStyle = 'rgba(90,90,100,0.8)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(b.x, b.y + b.R * 1.08 + 10);
    ctx.bezierCurveTo(b.x - b.vx * 3, b.y + b.R * 1.6, b.x + Math.sin(t * 2) * 8 - b.vx * 5, b.y + b.R * 2.1, b.x - b.vx * 6, Math.min(S.table - 2, b.y + b.R * 2.8));
    ctx.stroke();
    // balloon
    A.shadow(ctx, b.x, S.table, b.R * 0.9, 6, 0.18 * Math.max(0, 1 - (S.table - b.y) / 400));
    const bg = ctx.createRadialGradient(b.x - b.R * 0.35, b.y - b.R * 0.4, b.R * 0.1, b.x, b.y, b.R * 1.15);
    bg.addColorStop(0, '#FF8A8A'); bg.addColorStop(0.45, '#E11D2E'); bg.addColorStop(1, '#7A0C15');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(b.x, b.y, b.R, b.R * 1.12, b.vx * 0.01, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(b.x - b.R * 0.38, b.y - b.R * 0.45, b.R * 0.18, b.R * 0.3, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.ellipse(b.x + b.R * 0.45, b.y + b.R * 0.35, b.R * 0.08, b.R * 0.14, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8A0F18';
    ctx.beginPath(); ctx.moveTo(b.x - 6, b.y + b.R * 1.1); ctx.lineTo(b.x + 6, b.y + b.R * 1.1); ctx.lineTo(b.x, b.y + b.R * 1.1 + 10); ctx.fill();
    if (S.show && S.charge > 0.05) {
      ctx.fillStyle = '#FFFFFF'; ctx.font = '900 ' + (api.narrow ? 22 : 18) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const n = Math.round(S.charge * 12);
      for (let i = 0; i < n; i++) { const a = i * 2.4, rr = b.R * (0.3 + (i % 3) * 0.2); ctx.fillText('−', b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr); }
      ctx.textBaseline = 'alphabetic';
    }
    // charge meter
    const mw = api.narrow ? 170 : 130, mh = api.narrow ? 34 : 26, mx = W - mw - 14, my = 14;
    A.rr(ctx, mx, my, mw, mh, mh / 2); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.strokeStyle = '#F2D3B5'; ctx.lineWidth = 1.5; ctx.stroke();
    const fg = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    fg.addColorStop(0, '#FDE047'); fg.addColorStop(1, '#F97316');
    A.rr(ctx, mx + 4, my + 4, Math.max(mh - 8, (mw - 8) * S.charge), mh - 8, (mh - 8) / 2); ctx.fillStyle = fg; ctx.fill();
    ctx.fillStyle = '#7C2D12'; ctx.font = '900 ' + (api.narrow ? 16 : 12) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ Charge ' + Math.round(S.charge * 100) + '%', mx + mw / 2, my + mh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function stop() {}
  return { challenges, start, frame, down, move, up, stop, _S: () => S };
})();
