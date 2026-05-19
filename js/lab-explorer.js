/* ================================================================
   LAB EXPLORER — lab-explorer.js
   Virtual science lab for kids.
   Requires: auth.js, sounds.js, timer.js, learning-checks.js
   Storage key: zs_lab_[username] via getUserAppKey('lab')
   ================================================================ */

const LabExplorer = (() => {
  'use strict';

  // ── Lab Topics ──
  const LABS = [
    {
      id: 'colors',
      title: 'Color Mixing Lab',
      icon: '🎨',
      desc: 'Mix primary colors and discover new ones!',
      category: 'chemistry',
      ageMin: 4,
      experiments: [
        { id: 'primary',   title: 'Color Mixing',       instruction: 'Drag the colors together to mix them and discover secondary colors!' },
      ]
    },
    {
      id: 'water',
      title: 'Water Cycle',
      icon: '💧',
      desc: 'Watch water evaporate, form clouds, and rain!',
      category: 'earth_science',
      ageMin: 5,
      experiments: [
        { id: 'cycle', title: 'The Water Cycle',  instruction: 'Drag the sun to heat the water and create clouds. Then tap the dark clouds to make it rain!' },
      ]
    },
    {
      id: 'plants',
      title: 'Plant Growth',
      icon: '🌱',
      desc: 'Plant a seed and watch it grow over time.',
      category: 'biology',
      ageMin: 4,
      experiments: [
        { id: 'growth',  title: 'Growing Plants',   instruction: 'Tap the Water and Sunlight buttons to help your seed grow into a flower!' },
      ]
    },
    {
      id: 'physics',
      title: 'Simple Machines',
      icon: '⚙️',
      desc: 'Levers, ramps, and how things move.',
      category: 'physics',
      ageMin: 6,
      experiments: [
        { id: 'lever',    title: 'Levers & Balance',     instruction: 'Drag weights onto the lever to balance it! Move the fulcrum to see how it affects balance.' },
      ]
    },
    {
      id: 'magnets',
      title: 'Magnets',
      icon: '🧲',
      desc: 'Discover which things stick and which repel!',
      category: 'physics',
      ageMin: 5,
      experiments: [
        { id: 'magnetism', title: 'Magnetic Magic', instruction: 'Drag objects toward the magnet. See what sticks!' },
      ]
    },
    {
      id: 'weather',
      title: 'Weather Station',
      icon: '☁️',
      desc: 'Identify clouds, log the weather outside, and watch your month.',
      category: 'earth_science',
      ageMin: 5,
      experiments: [
        { id: 'log', title: 'Log Today\'s Weather', instruction: 'Observe the sky outside. Pick what you see, then tap Save.' },
      ]
    },
    {
      id: 'astronomy',
      title: 'Night Sky',
      icon: '🌙',
      desc: 'Moon phases, planets, and constellations.',
      category: 'astronomy',
      ageMin: 6,
      experiments: [
        { id: 'space',     title: 'Space Explorer',     instruction: 'Tap the glowing stars to connect the constellations!' },
      ]
    },
    {
      id: 'sound',
      title: 'Sound Waves',
      icon: '🔊',
      desc: 'Hear pitch and see the wave it makes.',
      category: 'physics',
      ageMin: 6,
      experiments: [
        { id: 'oscilloscope', title: 'Oscilloscope', instruction: 'Tap the notes to hear them and watch their waves on the screen!' },
      ]
    },
    {
      id: 'crystals',
      title: 'Crystal Growing',
      icon: '💎',
      desc: 'Watch crystals form in different solutions.',
      category: 'chemistry',
      ageMin: 7,
      experiments: [
        { id: 'grow', title: 'Crystal Lab', instruction: 'Pick a solution, then tap to seed crystals and watch them grow!' },
      ]
    },
    {
      id: 'static',
      title: 'Static Electricity',
      icon: '⚡',
      desc: 'Charge a balloon and watch what sticks.',
      category: 'physics',
      ageMin: 6,
      experiments: [
        { id: 'balloon', title: 'Balloon Lab', instruction: 'Rub the balloon back and forth, then move it near the paper bits!' },
      ]
    }
  ];

  // ── State ──
  let currentLab = null;
  let currentExp = 0;
  let stars = 0;
  let journalEntries = [];
  let canvas, ctx;

  // ── Color Lab State ──
  let colors = [];
  let dragging = null;
  let offsetX, offsetY;

  // ── Magnet Lab State ──
  let magnetState = {
    items: [],
    magnet: { x: 300, y: 150, w: 100, h: 100 },
    tested: []
  };

  // ── Astronomy Lab State ──
  let astronomyState = {
    constellations: [],
    currentConstellation: 0,
    foundStars: [],
    animFrame: null
  };

  // ── Simple Machines Lab State ──
  let physicsState = {
    fulcrum: { x: 300, y: 250, w: 40, h: 40 },
    lever: { w: 400, h: 10, angle: 0 },
    weights: [],
    balanced: false,
    draggingFulcrum: false
  };

  // ── Storage ──
  function _key() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('lab') : null;
  }

  function _load() {
    const key = _key();
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }

  function _save(data) {
    const key = _key();
    if (key) {
      localStorage.setItem(key, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
    }
  }

  // ── Init ──
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
    if (greetEl) greetEl.textContent = `Welcome, ${user.name}!`;

    const available = LABS.filter(l => age >= l.ageMin);

    if (grid) {
      grid.innerHTML = available.map(lab => {
        const completed = (data[lab.id] || {}).completed || 0;
        const total = lab.experiments.length;
        const pct = Math.round((completed / total) * 100);

        return `
          <div class="lab-card lab-${lab.id}" onclick="LabExplorer.startLab('${lab.id}')">
            <span class="lab-icon">${lab.icon}</span>
            <div class="lab-title">${lab.title}</div>
            <div class="lab-desc">${lab.desc}</div>
            <div class="lab-progress">
              <div class="lab-progress-bar" style="width:${pct}%"></div>
            </div>
            <div class="lab-progress-text">${completed}/${total} experiments</div>
          </div>
        `;
      }).join('');
    }

    canvas = document.getElementById('exp-canvas');
    if (canvas) ctx = canvas.getContext('2d');
  }

  function startLab(labId) {
    currentLab = LABS.find(l => l.id === labId);
    if (!currentLab) return;
    currentExp = 0;
    stars = 0;
    journalEntries = [];
    document.getElementById('exp-journal').innerHTML = '';
    _renderExperiment();
    _showScreen('experiment');
  }

  function _renderExperiment() {
    const exp = currentLab.experiments[currentExp];
    document.getElementById('exp-title').textContent = `${currentLab.icon} ${exp.title}`;
    document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
    document.getElementById('next-btn').style.display = 'none';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const controls = document.getElementById('exp-controls');
    controls.innerHTML = `<p class="exp-instruction">${exp.instruction}</p>`;

    _renderExperimentType(currentLab.id, exp.id);
  }

  function _renderExperimentType(labId, expId) {
    // Reset canvas listeners
    canvas.onpointerdown = null;
    canvas.onpointermove = null;
    canvas.onpointerup = null;

    if (labId === 'colors' && expId === 'primary') {
      _initColorLab();
    } else if (labId === 'water' && expId === 'cycle') {
      _initWaterLab();
    } else if (labId === 'plants' && expId === 'growth') {
      _initPlantLab();
    } else if (labId === 'physics' && expId === 'lever') {
      _initSimpleMachinesLab();
    } else if (labId === 'magnets' && expId === 'magnetism') {
      _initMagnetsLab();
    } else if (labId === 'weather' && expId === 'log') {
      _initWeatherLab();
    } else if (labId === 'astronomy' && expId === 'space') {
      _initAstronomyLab();
    } else if (labId === 'sound' && expId === 'oscilloscope') {
      _initSoundLab();
    } else if (labId === 'crystals' && expId === 'grow') {
      _initCrystalLab();
    } else if (labId === 'static' && expId === 'balloon') {
      _initStaticLab();
    } else {
      _renderPlaceholder(currentLab.icon + ' ' + currentLab.title);
    }
  }

  // ── Weather Station ──────────────────────────────────────────
  // Not a canvas experiment — renders a DOM form into #exp-controls
  // and a month-at-a-glance chart in #exp-journal. Observations live
  // under zs_lab_<userkey>.weather.log[] as
  //   { date:"YYYY-MM-DD", cloud:"cumulus", wind:1..5,
  //     precip:"none|rain|snow|storm", tempC:number|null, note:"" }
  // Cloud choices intentionally limited to the four common types so
  // kids build recognition before nuance.
  var _WEATHER_CLOUDS = [
    { id: 'clear',     icon: '☀️', label: 'Clear' },
    { id: 'cumulus',   icon: '⛅',  label: 'Cumulus (puffy)' },
    { id: 'stratus',   icon: '🌫️', label: 'Stratus (flat grey)' },
    { id: 'cirrus',    icon: '🌤️', label: 'Cirrus (wispy high)' },
    { id: 'nimbus',    icon: '☁️',  label: 'Nimbus (rain)' }
  ];
  var _WEATHER_PRECIP = [
    { id: 'none',  icon: '🌤️', label: 'None' },
    { id: 'rain',  icon: '🌧️', label: 'Rain' },
    { id: 'snow',  icon: '🌨️', label: 'Snow' },
    { id: 'storm', icon: '⛈️', label: 'Storm' }
  ];
  // Simplified kid-observable Beaufort: 0=calm → 5=strong.
  var _WEATHER_WIND = [
    { v: 0, icon: '🍃', label: 'Calm — smoke rises straight' },
    { v: 1, icon: '🌬️', label: 'Light — leaves rustle' },
    { v: 2, icon: '🌬️', label: 'Breeze — flags flap' },
    { v: 3, icon: '💨', label: 'Strong — small branches sway' },
    { v: 4, icon: '💨', label: 'Gale — hard to walk' },
    { v: 5, icon: '🌪️', label: 'Storm — branches break' }
  ];

  function _weatherToday() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _weatherLoad() {
    var d = _load();
    if (!d.weather) d.weather = { log: [] };
    if (!Array.isArray(d.weather.log)) d.weather.log = [];
    return d;
  }

  // In-memory pick state (reset each time the lab opens).
  var _weatherPick = null;

  function _initWeatherLab() {
    // Blank the canvas — weather lab is DOM-only.
    ctx.fillStyle = '#0e1f2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 24px Baloo 2';
    ctx.textAlign = 'center';
    ctx.fillText('☁️ ☀️ 🌧️ ⛈️', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = 'bold 14px Nunito';
    ctx.fillStyle = '#A8C5E8';
    ctx.fillText('Observe the sky outside, then log it below.', canvas.width / 2, canvas.height / 2 + 20);

    _weatherPick = { date: _weatherToday(), cloud: null, wind: null, precip: null, tempC: null };
    _renderWeatherForm();
    _renderWeatherJournal();
    document.getElementById('next-btn').style.display = 'none';
  }

  function _renderWeatherForm() {
    var controls = document.getElementById('exp-controls');
    if (!controls) return;

    function chips(items, field, getV, getLabel, getIcon) {
      return items.map(function(it) {
        var v = getV(it);
        var sel = _weatherPick[field] === v ? ' sel' : '';
        return '<button type="button" class="wx-chip' + sel + '" ' +
          'onclick="LabExplorer._pickWeather(\'' + field + '\', ' + (typeof v === 'number' ? v : '\'' + v + '\'') + ')">' +
          '<span class="wx-chip-ic">' + getIcon(it) + '</span>' +
          '<span class="wx-chip-lbl">' + getLabel(it) + '</span>' +
        '</button>';
      }).join('');
    }

    var cloudChips = chips(_WEATHER_CLOUDS, 'cloud', function(c){return c.id;}, function(c){return c.label;}, function(c){return c.icon;});
    var precipChips = chips(_WEATHER_PRECIP, 'precip', function(c){return c.id;}, function(c){return c.label;}, function(c){return c.icon;});
    var windChips = _WEATHER_WIND.map(function(w) {
      var sel = _weatherPick.wind === w.v ? ' sel' : '';
      return '<button type="button" class="wx-chip wx-wind' + sel + '" onclick="LabExplorer._pickWeather(\'wind\', ' + w.v + ')">' +
        '<span class="wx-chip-ic">' + w.icon + '</span>' +
        '<span class="wx-chip-lbl">' + w.v + ' · ' + w.label + '</span>' +
      '</button>';
    }).join('');

    var ready = _weatherPick.cloud && _weatherPick.precip !== null && _weatherPick.wind !== null;

    controls.innerHTML =
      '<div class="wx-form">' +
        '<div class="wx-date">📅 ' + _weatherPick.date + '</div>' +
        '<div class="wx-group"><div class="wx-grp-title">☁️ Clouds</div><div class="wx-chips">' + cloudChips + '</div></div>' +
        '<div class="wx-group"><div class="wx-grp-title">💧 Precipitation</div><div class="wx-chips">' + precipChips + '</div></div>' +
        '<div class="wx-group"><div class="wx-grp-title">🌬️ Wind (0–5)</div><div class="wx-chips wx-chips-col">' + windChips + '</div></div>' +
        '<div class="wx-group">' +
          '<div class="wx-grp-title">🌡️ Temperature (°C, optional)</div>' +
          '<input type="number" id="wx-temp" class="wx-temp" min="-30" max="50" step="1" ' +
                 'placeholder="e.g. 18" value="' + (_weatherPick.tempC != null ? _weatherPick.tempC : '') + '" ' +
                 'oninput="LabExplorer._pickWeather(\'tempC\', this.value === \'\' ? null : parseInt(this.value,10))" />' +
        '</div>' +
        '<div class="wx-actions">' +
          '<button class="action-btn btn-primary" ' + (ready ? '' : 'disabled') + ' ' +
                  'onclick="LabExplorer._saveWeather()">💾 Save observation</button>' +
        '</div>' +
      '</div>';
  }

  function _renderWeatherJournal() {
    var journal = document.getElementById('exp-journal');
    if (!journal) return;
    var data = _weatherLoad();
    var log = data.weather.log.slice().sort(function(a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
    if (log.length === 0) {
      journal.innerHTML = '<p class="wx-empty">No observations yet. Pick today\'s weather above and tap Save — your log will show up here.</p>';
      return;
    }

    // Last-30-days mini cloud-tally
    var counts = { clear: 0, cumulus: 0, stratus: 0, cirrus: 0, nimbus: 0 };
    var precipDays = 0;
    var thirtyAgoMs = Date.now() - 30 * 24 * 3600 * 1000;
    log.forEach(function(e) {
      var t = Date.parse(e.date + 'T00:00:00');
      if (!isFinite(t) || t < thirtyAgoMs) return;
      if (counts[e.cloud] != null) counts[e.cloud]++;
      if (e.precip && e.precip !== 'none') precipDays++;
    });
    var tallyHtml = _WEATHER_CLOUDS.map(function(c) {
      var n = counts[c.id] || 0;
      return '<div class="wx-tally"><span>' + c.icon + '</span><span class="wx-tally-n">' + n + '</span><span class="wx-tally-lbl">' + c.label.split(' ')[0] + '</span></div>';
    }).join('');

    var recentHtml = log.slice(0, 14).map(function(e) {
      var cloud = _WEATHER_CLOUDS.filter(function(c){return c.id === e.cloud;})[0];
      var precip = _WEATHER_PRECIP.filter(function(p){return p.id === e.precip;})[0];
      var tempTxt = (e.tempC != null && !isNaN(e.tempC)) ? (' · ' + e.tempC + '°C') : '';
      return '<div class="wx-row">' +
        '<span class="wx-date-sm">' + e.date + '</span>' +
        '<span class="wx-row-ic">' + (cloud ? cloud.icon : '') + (precip && precip.id !== 'none' ? ' ' + precip.icon : '') + '</span>' +
        '<span class="wx-row-txt">wind ' + (e.wind != null ? e.wind : '–') + tempTxt + '</span>' +
      '</div>';
    }).join('');

    journal.innerHTML =
      '<div class="wx-journal">' +
        '<div class="wx-j-head">📊 Last 30 days · ' + precipDays + ' rainy/snowy</div>' +
        '<div class="wx-tallies">' + tallyHtml + '</div>' +
        '<div class="wx-j-head" style="margin-top:10px;">📘 Recent observations</div>' +
        '<div class="wx-list">' + recentHtml + '</div>' +
      '</div>';
  }

  function _pickWeather(field, value) {
    if (!_weatherPick) return;
    _weatherPick[field] = value;
    _renderWeatherForm();
  }

  function _saveWeather() {
    if (!_weatherPick || !_weatherPick.cloud) return;
    var data = _weatherLoad();
    var today = _weatherPick.date;
    // Replace today's entry if one exists (keeps the log tidy).
    data.weather.log = data.weather.log.filter(function(e) { return e.date !== today; });
    data.weather.log.push({
      date: today,
      cloud: _weatherPick.cloud,
      wind: _weatherPick.wind,
      precip: _weatherPick.precip,
      tempC: _weatherPick.tempC,
      ts: Date.now()
    });
    // Cap the log to last 120 entries to keep localStorage lean.
    if (data.weather.log.length > 120) {
      data.weather.log = data.weather.log
        .sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); })
        .slice(-120);
    }

    // Count this as one completed experiment for the existing star system.
    var total = (data.totalStars || 0) + 1;
    data.totalStars = total;
    _save(data);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      var cloud = _WEATHER_CLOUDS.filter(function(c){return c.id === _weatherPick.cloud;})[0];
      ActivityLog.log('Lab Explorer', '☁️',
        'Logged weather: ' + (cloud ? cloud.label : _weatherPick.cloud) +
        (_weatherPick.tempC != null ? ' · ' + _weatherPick.tempC + '°C' : ''));
    }
    if (typeof showConfetti === 'function') showConfetti();

    // Re-render to reflect the new entry and enable Next.
    _weatherPick = { date: _weatherToday(), cloud: null, wind: null, precip: null, tempC: null };
    _renderWeatherForm();
    _renderWeatherJournal();
    document.getElementById('exp-stars').textContent = '⭐ ' + (stars + 1);
    stars++;
    document.getElementById('next-btn').style.display = '';
  }

  function _renderPlaceholder(text) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '20px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(text + ' is under construction!', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Nunito';
    ctx.fillText('Check back soon for more science!', canvas.width / 2, canvas.height / 2 + 30);
    
    // For stubs, allow "Next" immediately or after a delay
    setTimeout(() => {
      document.getElementById('next-btn').style.display = 'block';
    }, 1000);
  }

  // ── Water Lab Implementation ──
  let waterState = {
    sunX: 0,
    sunY: 0,
    sunR: 40,
    cloudDarkness: 0, // 0 to 1
    raining: false,
    waterLevel: 0, // 0 to 1
    evaporating: false,
    particles: [],
    raindrops: [],
    phase: 0, // 0: Start, 1: Evaporation done, 2: Condensation done, 3: Precipitation done, 4: Collection done
    animFrame: null
  };

  function _initWaterLab() {
    if (waterState.animFrame) cancelAnimationFrame(waterState.animFrame);

    waterState = {
      sunX: 100,
      sunY: 100,
      sunR: 40,
      cloudDarkness: 0,
      raining: false,
      waterLevel: 0.1, // Starts with a little water
      evaporating: false,
      particles: [],
      raindrops: [],
      phase: 0,
      animFrame: null
    };

    let draggingSun = false;
    let offsetX = 0;
    let offsetY = 0;

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);

      // Check if tapping sun
      if (Math.hypot(waterState.sunX - mx, waterState.sunY - my) < waterState.sunR) {
        draggingSun = true;
        offsetX = mx - waterState.sunX;
        offsetY = my - waterState.sunY;
      }

      // Check if tapping cloud
      // Cloud roughly bounded by x: 400..600, y: 20..100
      if (waterState.phase >= 2 && mx > 350 && mx < 550 && my > 10 && my < 110) {
        if (!waterState.raining) {
          waterState.raining = true;
          if (waterState.phase === 2) {
            waterState.phase = 3;
            stars++;
            document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
            _showFeedback('🌧️');
            if (typeof playSound === 'function') playSound('correct');
            _addJournalEntry('Precipitation: Heavy clouds drop rain!');
          }
        }
      }
    };

    canvas.onpointermove = (e) => {
      if (!draggingSun) return;
      const { mx, my } = _getMousePos(e);
      waterState.sunX = Math.max(waterState.sunR, Math.min(canvas.width - waterState.sunR, mx - offsetX));
      waterState.sunY = Math.max(waterState.sunR, Math.min(canvas.height - waterState.sunR, my - offsetY));
    };

    canvas.onpointerup = () => {
      draggingSun = false;
    };

    canvas.onpointerleave = () => {
      draggingSun = false;
    };

    _waterLabLoop();
  }

  function _waterLabLoop() {
    // Stop loop if we navigate away from the water lab
    if (!currentLab || currentLab.id !== 'water') {
      if (waterState.animFrame) cancelAnimationFrame(waterState.animFrame);
      return;
    }

    waterState.animFrame = requestAnimationFrame(_waterLabLoop);

    // Evaporation Check
    // If sun is close to water surface (water Y is height - height * waterLevel)
    const waterY = canvas.height - (canvas.height * waterState.waterLevel);

    // If sun Y is near the water and not fully collected yet
    if (waterState.sunY > waterY - 150 && waterState.waterLevel > 0.05 && waterState.phase < 4) {
      waterState.evaporating = true;
      if (Math.random() > 0.6) {
        waterState.particles.push({
          x: waterState.sunX - 100 + Math.random() * 200,
          y: waterY,
          vy: -1 - Math.random() * 2,
          r: 2 + Math.random() * 3
        });

        // Decrease water level as it evaporates
        if (waterState.phase < 2) {
          waterState.waterLevel -= 0.0005;
          if (waterState.waterLevel < 0.05) waterState.waterLevel = 0.05;
        }
      }
      if (waterState.phase === 0) {
        waterState.phase = 1;
        stars++;
        document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
        _showFeedback('🌫️');
        if (typeof playSound === 'function') playSound('correct');
        _addJournalEntry('Evaporation: Heat turns water into vapor!');
      }
    } else {
      waterState.evaporating = false;
    }

    // Update Particles
    for (let i = waterState.particles.length - 1; i >= 0; i--) {
      let p = waterState.particles[i];
      p.y += p.vy;
      // Drift towards cloud
      if (p.x < 450) p.x += 1;
      if (p.x > 500) p.x -= 1;

      // Hit cloud
      if (p.y < 80 && p.x > 350 && p.x < 550) {
        waterState.particles.splice(i, 1);
        waterState.cloudDarkness += 0.005;
        if (waterState.cloudDarkness >= 1) waterState.cloudDarkness = 1;
      }
    }

    // Condensation Milestone
    if (waterState.cloudDarkness >= 0.8 && waterState.phase === 1) {
      waterState.phase = 2;
      stars++;
      document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
      _showFeedback('☁️');
      if (typeof playSound === 'function') playSound('correct');
      _addJournalEntry('Condensation: Vapor cools to form clouds!');
    }

    // Update Raindrops
    if (waterState.raining) {
      if (Math.random() > 0.4) {
        waterState.raindrops.push({
          x: 380 + Math.random() * 120,
          y: 70,
          vy: 4 + Math.random() * 3
        });
      }
      waterState.cloudDarkness -= 0.003;
      if (waterState.cloudDarkness < 0) {
        waterState.cloudDarkness = 0;
        waterState.raining = false;
      }
    }

    for (let i = waterState.raindrops.length - 1; i >= 0; i--) {
      let r = waterState.raindrops[i];
      r.y += r.vy;
      if (r.y >= waterY) {
        waterState.raindrops.splice(i, 1);
        waterState.waterLevel += 0.002;
        if (waterState.waterLevel >= 0.4 && waterState.phase === 3) {
          waterState.phase = 4;
          stars++;
          document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
          _showFeedback('🌊');
          if (typeof playSound === 'function') playSound('correct');
          _addJournalEntry('Collection: Water gathers in lakes and oceans!');
          document.getElementById('next-btn').style.display = 'block';
          if (typeof ActivityLog !== 'undefined') {
            ActivityLog.log('Lab Explorer', '💧', 'Completed the Water Cycle experiment!');
          }
          _saveProgress();
        }
      }
    }

    _drawWaterLab();
  }

  function _drawWaterLab() {
    // Background Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#87CEEB'); // Sky blue
    grad.addColorStop(1, '#E0F6FF'); // Lighter horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.beginPath();
    ctx.arc(waterState.sunX, waterState.sunY, waterState.sunR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700'; // Yellow
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Sun Rays (animated)
    const time = Date.now() / 200;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + time * 0.1;
      ctx.beginPath();
      ctx.moveTo(waterState.sunX + Math.cos(angle) * (waterState.sunR + 5), waterState.sunY + Math.sin(angle) * (waterState.sunR + 5));
      ctx.lineTo(waterState.sunX + Math.cos(angle) * (waterState.sunR + 15), waterState.sunY + Math.sin(angle) * (waterState.sunR + 15));
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Mountains/Land
    ctx.fillStyle = '#228B22'; // Forest green
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height - 100);
    ctx.quadraticCurveTo(100, canvas.height - 150, 200, canvas.height - 80);
    ctx.quadraticCurveTo(300, canvas.height - 10, canvas.width, canvas.height - 60);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    // Water
    const waterHeight = canvas.height * waterState.waterLevel;
    const waterY = canvas.height - waterHeight;
    ctx.fillStyle = 'rgba(0, 119, 190, 0.8)'; // Ocean blue
    ctx.fillRect(0, waterY, canvas.width, waterHeight);

    // Water surface reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, waterY, canvas.width, 5);

    // Particles (Evaporation)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let p of waterState.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Raindrops (Precipitation)
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 2;
    for (let r of waterState.raindrops) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + 2, r.y + 6);
      ctx.stroke();
    }

    // Cloud
    // Darkness maps from white (255) to dark grey (100)
    const cloudColorVal = Math.floor(255 - (155 * waterState.cloudDarkness));
    ctx.fillStyle = `rgb(${cloudColorVal}, ${cloudColorVal}, ${cloudColorVal})`;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 10;

    // Cloud shape using overlapping arcs
    ctx.beginPath();
    ctx.arc(400, 60, 30, 0, Math.PI * 2);
    ctx.arc(440, 40, 40, 0, Math.PI * 2);
    ctx.arc(480, 50, 35, 0, Math.PI * 2);
    ctx.arc(520, 60, 25, 0, Math.PI * 2);
    ctx.arc(460, 70, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cloud prompt if ready to rain
    if (waterState.phase === 2 && !waterState.raining) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Nunito';
      ctx.textAlign = 'center';
      // Bounce effect
      const offset = Math.sin(Date.now() / 150) * 5;
      ctx.fillText('Tap Cloud!', 460, 20 + offset);
    }
  }

  // ── Plant Growth Lab Implementation ──
  let plantState = {
    growth: 0,
    waterLevel: 0,
    sunlightLevel: 0,
    stage: 0, // 0: Seed, 1: Sprout, 2: Stem, 3: Flower
    particles: [],
    animFrame: null
  };

  function _initPlantLab() {
    if (plantState.animFrame) cancelAnimationFrame(plantState.animFrame);

    plantState = {
      growth: 0,
      waterLevel: 0,
      sunlightLevel: 0,
      stage: 0,
      particles: [],
      animFrame: null
    };

    const controls = document.getElementById('exp-controls');
    controls.innerHTML += `
      <div class="plant-controls">
        <button class="action-btn btn-primary" id="btn-water">💧 Give Water</button>
        <button class="action-btn btn-primary" id="btn-sun" style="background: linear-gradient(135deg, #F59E0B, #FBBF24);">☀️ Give Sunlight</button>
        <div class="resource-bars">
          <div class="resource-bar"><div class="resource-fill bg-blue" id="water-bar" style="width: 0%"></div></div>
          <div class="resource-bar"><div class="resource-fill bg-yellow" id="sun-bar" style="width: 0%"></div></div>
        </div>
      </div>
    `;

    document.getElementById('btn-water').onclick = () => {
      plantState.waterLevel = Math.min(1, plantState.waterLevel + 0.3);
      for(let i=0; i<10; i++) {
        plantState.particles.push({
          x: canvas.width/2 - 50 + Math.random()*100,
          y: 50,
          vy: 2 + Math.random()*3,
          color: '#3B82F6',
          type: 'water'
        });
      }
      if (typeof playSound === 'function') playSound('click');
    };

    document.getElementById('btn-sun').onclick = () => {
      plantState.sunlightLevel = Math.min(1, plantState.sunlightLevel + 0.3);
      for(let i=0; i<10; i++) {
        plantState.particles.push({
          x: canvas.width/2 - 100 + Math.random()*200,
          y: 0,
          vy: 1 + Math.random()*2,
          color: '#FBBF24',
          type: 'sun'
        });
      }
      if (typeof playSound === 'function') playSound('click');
    };

    _plantLabLoop();
  }

  function _plantLabLoop() {
    if (!currentLab || currentLab.id !== 'plants') {
      if (plantState.animFrame) cancelAnimationFrame(plantState.animFrame);
      return;
    }

    plantState.animFrame = requestAnimationFrame(_plantLabLoop);

    // Decrease resources slowly
    plantState.waterLevel = Math.max(0, plantState.waterLevel - 0.001);
    plantState.sunlightLevel = Math.max(0, plantState.sunlightLevel - 0.001);

    // Update UI bars
    const wBar = document.getElementById('water-bar');
    const sBar = document.getElementById('sun-bar');
    if (wBar) wBar.style.width = `${plantState.waterLevel * 100}%`;
    if (sBar) sBar.style.width = `${plantState.sunlightLevel * 100}%`;

    // Growth logic
    if (plantState.waterLevel > 0.1 && plantState.sunlightLevel > 0.1 && plantState.growth < 100) {
      plantState.growth += 0.05 + (plantState.waterLevel * 0.05) + (plantState.sunlightLevel * 0.05);

      // Stage milestones
      if (plantState.growth >= 25 && plantState.stage === 0) {
        plantState.stage = 1;
        stars++;
        document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
        _showFeedback('🌱');
        if (typeof playSound === 'function') playSound('correct');
        _addJournalEntry('Sprout: The seed has germinated and broken through the soil!');
      } else if (plantState.growth >= 50 && plantState.stage === 1) {
        plantState.stage = 2;
        stars++;
        document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
        _showFeedback('🌿');
        if (typeof playSound === 'function') playSound('correct');
        _addJournalEntry('Stem: The plant grows taller to reach more sunlight.');
      } else if (plantState.growth >= 100 && plantState.stage === 2) {
        plantState.stage = 3;
        plantState.growth = 100;
        stars++;
        document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
        _showFeedback('🌻');
        if (typeof playSound === 'function') playSound('correct');
        _addJournalEntry('Flower: The mature plant produces a flower!');
        document.getElementById('next-btn').style.display = 'block';
        if (typeof ActivityLog !== 'undefined') {
          ActivityLog.log('Lab Explorer', '🌱', 'Completed the Plant Growth experiment!');
        }
        _saveProgress();
      }
    }

    // Update particles
    for (let i = plantState.particles.length - 1; i >= 0; i--) {
      let p = plantState.particles[i];
      p.y += p.vy;
      if (p.y > canvas.height - 50) {
        plantState.particles.splice(i, 1);
      }
    }

    _drawPlantLab();
  }

  function _drawPlantLab() {
    // Sky
    ctx.fillStyle = '#E0F6FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dirt
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    const cx = canvas.width / 2;
    const groundY = canvas.height - 100;

    // Plant based on stage
    if (plantState.stage === 0) {
      // Seed
      ctx.fillStyle = '#D2B48C';
      ctx.beginPath();
      ctx.ellipse(cx, groundY + 20, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (plantState.stage === 1) {
      // Sprout
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, groundY + 10);
      ctx.lineTo(cx, groundY - 20);
      ctx.stroke();
      // Leaves
      ctx.fillStyle = '#22C55E';
      ctx.beginPath(); ctx.ellipse(cx - 10, groundY - 15, 8, 4, Math.PI/4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 10, groundY - 15, 8, 4, -Math.PI/4, 0, Math.PI * 2); ctx.fill();
    } else if (plantState.stage >= 2) {
      // Stem
      const height = plantState.stage === 2 ? 80 : 150;
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, groundY + 10);
      ctx.lineTo(cx, groundY - height);
      ctx.stroke();

      // Leaves
      ctx.fillStyle = '#16A34A';
      ctx.beginPath(); ctx.ellipse(cx - 20, groundY - 40, 15, 8, Math.PI/6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 20, groundY - 60, 15, 8, -Math.PI/6, 0, Math.PI * 2); ctx.fill();

      if (plantState.stage === 3) {
        ctx.beginPath(); ctx.ellipse(cx - 15, groundY - 100, 12, 6, Math.PI/4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 15, groundY - 120, 12, 6, -Math.PI/4, 0, Math.PI * 2); ctx.fill();

        // Flower
        const fy = groundY - 150;
        ctx.fillStyle = '#EF4444'; // Red petals
        for(let i=0; i<8; i++) {
          ctx.beginPath();
          ctx.ellipse(cx + Math.cos(i*Math.PI/4)*15, fy + Math.sin(i*Math.PI/4)*15, 12, 12, 0, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = '#FBBF24'; // Yellow center
        ctx.beginPath();
        ctx.arc(cx, fy, 15, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Particles
    plantState.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.type === 'water' ? 3 : 2, 0, Math.PI*2);
      ctx.fill();
    });
  }

  // ── Color Lab Implementation ──
  function _initColorLab() {
    colors = [
      { id: 'red',    name: 'Red',    hex: '#EF4444', x: 100, y: 200, r: 45 },
      { id: 'blue',   name: 'Blue',   hex: '#3B82F6', x: 300, y: 200, r: 45 },
      { id: 'yellow', name: 'Yellow', hex: '#FBBF24', x: 500, y: 200, r: 45 },
    ];

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      dragging = colors.find(c => Math.hypot(c.x - mx, c.y - my) < c.r);
      if (dragging) {
        offsetX = mx - dragging.x;
        offsetY = my - dragging.y;
      }
    };

    canvas.onpointermove = (e) => {
      if (!dragging) return;
      const { mx, my } = _getMousePos(e);
      dragging.x = mx - offsetX;
      dragging.y = my - offsetY;
      _drawColorLab();
    };

    canvas.onpointerup = () => {
      if (!dragging) return;
      
      // Check for overlap
      colors.forEach(c => {
        if (c !== dragging && Math.hypot(c.x - dragging.x, c.y - dragging.y) < (c.r + dragging.r) * 0.7) {
          _checkColorMix(dragging, c);
        }
      });
      
      dragging = null;
      _drawColorLab();
    };

    _drawColorLab();
  }

  function _drawColorLab() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw mixing zone
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.setLineDash([]);

    colors.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.hex;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Nunito';
      ctx.textAlign = 'center';
      ctx.fillText(c.name, c.x, c.y + 5);
    });
  }

  function _checkColorMix(a, b) {
    const MIXES = {
      'red+blue':    { name: 'Purple', hex: '#8B5CF6' },
      'red+yellow':  { name: 'Orange', hex: '#F97316' },
      'blue+yellow': { name: 'Green',  hex: '#22C55E' },
    };
    const key = [a.id, b.id].sort().join('+');
    const result = MIXES[key];

    if (result) {
      // Show feedback
      _showFeedback('✨');
      if (typeof playSound === 'function') playSound('correct');
      
      _addJournalEntry(`Discovered: ${a.name} + ${b.name} = ${result.name}!`);
      
      // Create new color at the mix point
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      
      // Remove the mixed colors and add the new one, or just reset them?
      // Let's reset them and add a star if it's a new discovery in this session
      const discoveryKey = `mixed_${result.name}`;
      if (!journalEntries.find(e => e.text.includes(result.name))) {
        stars++;
        document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
      }

      // Reset positions
      colors = [
        { id: 'red',    name: 'Red',    hex: '#EF4444', x: 100, y: 200, r: 45 },
        { id: 'blue',   name: 'Blue',   hex: '#3B82F6', x: 300, y: 200, r: 45 },
        { id: 'yellow', name: 'Yellow', hex: '#FBBF24', x: 500, y: 200, r: 45 },
      ];

      if (stars >= 3) {
        document.getElementById('next-btn').style.display = 'block';
        _saveProgress();
      }
    }
  }

  // ── Simple Machines Lab Implementation ──
  function _initSimpleMachinesLab() {
    physicsState = {
      fulcrum: { x: canvas.width / 2, y: 250, w: 40, h: 40 },
      lever: { w: 400, h: 10, angle: 0 },
      weights: [
        { id: 'w1', name: '10kg', mass: 10, x: 100, y: 350, startX: 100, startY: 350, r: 20, color: '#EF4444' },
        { id: 'w2', name: '10kg', mass: 10, x: 200, y: 350, startX: 200, startY: 350, r: 20, color: '#3B82F6' },
        { id: 'w3', name: '20kg', mass: 20, x: 300, y: 350, startX: 300, startY: 350, r: 25, color: '#10B981' },
        { id: 'w4', name: '20kg', mass: 20, x: 400, y: 350, startX: 400, startY: 350, r: 25, color: '#F59E0B' }
      ],
      balanced: false,
      draggingFulcrum: false
    };

    function updateBalance() {
      const fulcrumX = physicsState.fulcrum.x;
      let torqueLeft = 0;
      let torqueRight = 0;
      let weightsOnLever = 0;

      physicsState.weights.forEach(w => {
        // Check if weight is on the lever
        if (Math.abs(w.y - (physicsState.fulcrum.y - physicsState.lever.h)) < 30) {
          weightsOnLever++;
          const dist = w.x - fulcrumX;
          if (dist < 0) {
            torqueLeft += Math.abs(dist) * w.mass;
          } else {
            torqueRight += dist * w.mass;
          }
        }
      });

      const netTorque = torqueRight - torqueLeft;

      if (weightsOnLever === 0) {
        physicsState.lever.angle = 0;
        physicsState.balanced = false;
      } else if (Math.abs(netTorque) < 50) { // Slight tolerance
        physicsState.lever.angle = 0;
        if (!physicsState.balanced && weightsOnLever >= 2) {
          physicsState.balanced = true;
          stars++;
          document.getElementById('exp-stars').textContent = `⭐ ${stars}`;
          _showFeedback('⚖️');
          if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
          else if (typeof playSound === 'function') playSound('correct');
          _addJournalEntry('Discovered: Balanced the lever!');

          // Show factual pop-up about mechanical advantage
          setTimeout(() => {
            alert('Fact: A lever makes work easier! The fulcrum is the pivot point. When weights are balanced, the torque on both sides is equal.');
          }, 500);

          if (stars >= 3) {
            document.getElementById('next-btn').style.display = 'block';
            _saveProgress();
          }
        }
      } else {
        if (physicsState.balanced) {
            physicsState.balanced = false;
            // We just reset state, preventing infinite stars will be handled
            // by a broader tracking if needed, but for simplicity we rely on the user
            // moving items. To fully fix farming we'd need to hash positions.
        }
        physicsState.balanced = false;
        // Max angle ~15 degrees
        physicsState.lever.angle = Math.max(-15, Math.min(15, netTorque / 100)) * Math.PI / 180;
      }
    }

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      const f = physicsState.fulcrum;
      const l = physicsState.lever;

      // Check weights, correctly hit-testing rotated weights
      dragging = physicsState.weights.find(w => {
        let checkX = w.x;
        let checkY = w.y;
        // If weight is on the lever, calculate its rotated position for the hit test
        if (Math.abs(w.y - (f.y - l.h - w.r)) < 5) {
           const dist = w.x - f.x;
           checkX = f.x + dist * Math.cos(l.angle) - (-l.h - w.r) * Math.sin(l.angle);
           checkY = f.y + dist * Math.sin(l.angle) + (-l.h - w.r) * Math.cos(l.angle);
        }
        return Math.hypot(checkX - mx, checkY - my) < w.r;
      });

      if (dragging) {
        offsetX = mx - dragging.x;
        offsetY = my - dragging.y;
        return;
      }

      // Check fulcrum
      if (mx > f.x - f.w/2 && mx < f.x + f.w/2 && my > f.y && my < f.y + f.h) {
        physicsState.draggingFulcrum = true;
        offsetX = mx - f.x;
      }
    };

    canvas.onpointermove = (e) => {
      const { mx, my } = _getMousePos(e);

      if (dragging) {
        dragging.x = mx - offsetX;
        dragging.y = my - offsetY;
        _drawSimpleMachinesLab();
      } else if (physicsState.draggingFulcrum) {
        // Constrain fulcrum along the lever width loosely
        physicsState.fulcrum.x = Math.max(canvas.width/2 - 150, Math.min(canvas.width/2 + 150, mx - offsetX));
        updateBalance();
        _drawSimpleMachinesLab();
      }
    };

    canvas.onpointerup = () => {
      if (dragging) {
        // Snap to lever if close enough
        if (Math.abs(dragging.y - (physicsState.fulcrum.y - physicsState.lever.h)) < 40) {
          dragging.y = physicsState.fulcrum.y - physicsState.lever.h - dragging.r;
          // Constrain horizontally to lever
          dragging.x = Math.max(physicsState.fulcrum.x - physicsState.lever.w/2 + dragging.r,
                                Math.min(physicsState.fulcrum.x + physicsState.lever.w/2 - dragging.r, dragging.x));
        } else {
          // Snap back to start if dropped elsewhere
          dragging.x = dragging.startX;
          dragging.y = dragging.startY;
        }
        dragging = null;
      }
      physicsState.draggingFulcrum = false;
      updateBalance();
      _drawSimpleMachinesLab();
    };

    updateBalance();
    _drawSimpleMachinesLab();
  }

  function _drawSimpleMachinesLab() {
    ctx.fillStyle = '#F3F4F6'; // Light grey, using standard palette to fix display issue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const f = physicsState.fulcrum;
    const l = physicsState.lever;

    // Draw Fulcrum (Triangle)
    ctx.fillStyle = '#6B7280';
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x - f.w/2, f.y + f.h);
    ctx.lineTo(f.x + f.w/2, f.y + f.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Lever with Rotation
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(l.angle);
    ctx.fillStyle = '#D97706'; // Wood color
    ctx.fillRect(-l.w/2, -l.h, l.w, l.h);
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    ctx.strokeRect(-l.w/2, -l.h, l.w, l.h);
    ctx.restore();

    // Draw Weights
    physicsState.weights.forEach(w => {
      ctx.save();

      // If weight is on the lever, apply rotation based on fulcrum
      if (Math.abs(w.y - (f.y - l.h - w.r)) < 5) {
         const dist = w.x - f.x;
         ctx.translate(f.x, f.y);
         ctx.rotate(l.angle);
         ctx.translate(dist, -l.h);

         ctx.beginPath();
         ctx.arc(0, -w.r, w.r, 0, Math.PI * 2);
      } else {
         ctx.translate(w.x, w.y);
         ctx.beginPath();
         ctx.arc(0, 0, w.r, 0, Math.PI * 2);
      }

      ctx.fillStyle = w.color;
      ctx.fill();
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Nunito';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (Math.abs(w.y - (f.y - l.h - w.r)) < 5) {
         ctx.fillText(w.name, 0, -w.r);
      } else {
         ctx.fillText(w.name, 0, 0);
      }
      ctx.restore();
    });
  }

  // ── Magnets Lab Implementation ──
  function _initMagnetsLab() {
    magnetState.magnet = { x: canvas.width / 2, y: 150, w: 120, h: 120 };
    magnetState.tested = [];

    // Initial items setup at the bottom
    magnetState.items = [
      { id: 'nail', name: 'Iron Nail', emoji: '🔨', isMagnetic: true, x: 100, y: 350, startX: 100, startY: 350, r: 25 },
      { id: 'wood', name: 'Wood Block', emoji: '🪵', isMagnetic: false, x: 200, y: 350, startX: 200, startY: 350, r: 25 },
      { id: 'coin', name: 'Copper Coin', emoji: '🪙', isMagnetic: false, x: 300, y: 350, startX: 300, startY: 350, r: 25 },
      { id: 'paperclip', name: 'Paper Clip', emoji: '📎', isMagnetic: true, x: 400, y: 350, startX: 400, startY: 350, r: 25 },
      { id: 'glass', name: 'Glass Marble', emoji: '🔮', isMagnetic: false, x: 500, y: 350, startX: 500, startY: 350, r: 25 }
    ];

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      dragging = magnetState.items.find(item => Math.hypot(item.x - mx, item.y - my) < item.r);
      if (dragging) {
        offsetX = mx - dragging.x;
        offsetY = my - dragging.y;
      }
    };

    canvas.onpointermove = (e) => {
      if (!dragging) return;
      const { mx, my } = _getMousePos(e);
      dragging.x = mx - offsetX;
      dragging.y = my - offsetY;
      _drawMagnetsLab();
    };

    canvas.onpointerup = () => {
      if (!dragging) return;

      const magnetCenterX = magnetState.magnet.x;
      const magnetCenterY = magnetState.magnet.y;

      // Check distance to magnet ends
      const dist = Math.hypot(dragging.x - magnetCenterX, dragging.y - (magnetCenterY + magnetState.magnet.h/2));

      if (dist < 80) {
        if (dragging.isMagnetic) {
          // Snap to magnet
          dragging.x = magnetCenterX + (Math.random() * 40 - 20);
          dragging.y = magnetCenterY + magnetState.magnet.h/2 + 20;

          if (!magnetState.tested.includes(dragging.id)) {
            magnetState.tested.push(dragging.id);
            _addJournalEntry(`Discovered: ${dragging.name} is magnetic!`);
            _showFeedback('✨');
            if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
            else if (typeof playSound === 'function') playSound('correct');
            stars++;
            document.getElementById('exp-stars').textContent = `⭐ ${stars}`;

            if (stars >= 2) { // There are 2 magnetic items
              document.getElementById('next-btn').style.display = 'block';
              _saveProgress();
            }
          }
        } else {
          // Bounce back
          dragging.x = dragging.startX;
          dragging.y = dragging.startY;
          if (!magnetState.tested.includes(dragging.id)) {
            magnetState.tested.push(dragging.id);
            _addJournalEntry(`Discovered: ${dragging.name} is NOT magnetic.`);
            _showFeedback('❌');
            if (typeof SFX !== 'undefined' && SFX.wrong) SFX.wrong();
            else if (typeof playSound === 'function') playSound('error');
          }
        }
      } else {
        // Return to start if dropped too far
        dragging.x = dragging.startX;
        dragging.y = dragging.startY;
      }

      dragging = null;
      _drawMagnetsLab();
    };

    _drawMagnetsLab();
  }

  function _drawMagnetsLab() {
    ctx.fillStyle = '#E8F5E9'; // Light green background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Magnet (U-Shape)
    const m = magnetState.magnet;
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#EF4444'; // Red half
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.w/2, Math.PI, 0);
    ctx.stroke();

    // Magnet prongs
    ctx.beginPath();
    ctx.moveTo(m.x - m.w/2, m.y);
    ctx.lineTo(m.x - m.w/2, m.y + m.h/2);
    ctx.stroke();

    ctx.strokeStyle = '#3B82F6'; // Blue half
    ctx.beginPath();
    ctx.moveTo(m.x + m.w/2, m.y);
    ctx.lineTo(m.x + m.w/2, m.y + m.h/2);
    ctx.stroke();

    // Magnet ends (silver)
    ctx.fillStyle = '#9CA3AF';
    ctx.fillRect(m.x - m.w/2 - 10, m.y + m.h/2, 20, 10);
    ctx.fillRect(m.x + m.w/2 - 10, m.y + m.h/2, 20, 10);

    // N and S labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('N', m.x - m.w/2, m.y + m.h/2 - 10);
    ctx.fillText('S', m.x + m.w/2, m.y + m.h/2 - 10);

    // Draw magnetic field lines (optional flair)
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 2;
    for(let i=0; i<3; i++) {
      ctx.beginPath();
      ctx.arc(m.x, m.y + m.h/2 + 20, 30 + i*15, 0, Math.PI);
      ctx.stroke();
    }

    // Draw items
    magnetState.items.forEach(item => {
      // Circle background
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, item.x, item.y);

      // Name (if not dragging)
      if (item !== dragging) {
        ctx.fillStyle = '#4B5563';
        ctx.font = '12px Nunito';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(item.name, item.x, item.y + item.r + 15);
      }
    });

    // Draw dragging item on top
    if (dragging) {
      ctx.beginPath();
      ctx.arc(dragging.x, dragging.y, dragging.r * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = '28px Arial';
      ctx.textBaseline = 'middle';
      ctx.fillText(dragging.emoji, dragging.x, dragging.y);
    }
  }

  function _getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      mx: (e.clientX - rect.left) * scaleX,
      my: (e.clientY - rect.top) * scaleY
    };
  }

  // ── Astronomy Lab Implementation ──
  function _initAstronomyLab() {
    astronomyState.currentConstellation = 0;
    astronomyState.foundStars = [];

    astronomyState.constellations = [
      {
        id: 'ursa_major',
        name: 'Ursa Major (Big Dipper)',
        stars: [
          { x: 150, y: 250, r: 8 },
          { x: 220, y: 240, r: 8 },
          { x: 280, y: 260, r: 8 },
          { x: 350, y: 280, r: 8 },
          { x: 380, y: 350, r: 8 },
          { x: 480, y: 330, r: 8 },
          { x: 450, y: 250, r: 8 }
        ],
        connections: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]]
      },
      {
        id: 'cassiopeia',
        name: 'Cassiopeia (The Queen)',
        stars: [
          { x: 120, y: 150, r: 8 },
          { x: 200, y: 250, r: 8 },
          { x: 280, y: 180, r: 8 },
          { x: 360, y: 280, r: 8 },
          { x: 480, y: 140, r: 8 }
        ],
        connections: [[0,1], [1,2], [2,3], [3,4]]
      }
    ];

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      const constell = astronomyState.constellations[astronomyState.currentConstellation];

      let clickedStar = -1;
      for (let i = 0; i < constell.stars.length; i++) {
        const s = constell.stars[i];
        if (Math.hypot(s.x - mx, s.y - my) < s.r + 15) {
          clickedStar = i;
          break;
        }
      }

      if (clickedStar !== -1 && !astronomyState.foundStars.includes(clickedStar)) {
        astronomyState.foundStars.push(clickedStar);
        if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
        else if (typeof playSound === 'function') playSound('click');

        _drawAstronomyLab();

        if (astronomyState.foundStars.length === constell.stars.length) {
          _addJournalEntry('Discovered constellation: ' + constell.name);
          _showFeedback('✨');
          if (typeof SFX !== 'undefined' && SFX.correct) SFX.correct();
          else if (typeof playSound === 'function') playSound('correct');

          stars++;
          document.getElementById('exp-stars').textContent = '⭐ ' + stars;

          setTimeout(() => {
            if (astronomyState.currentConstellation < astronomyState.constellations.length - 1) {
              astronomyState.currentConstellation++;
              astronomyState.foundStars = [];
              _drawAstronomyLab();
            } else {
              if (typeof ActivityLog !== 'undefined') {
                ActivityLog.log('Lab Explorer', '🌙', 'Completed the Night Sky constellations!');
              }
              document.getElementById('next-btn').style.display = 'block';
              _saveProgress();
            }
          }, 1500);
        }
      }
    };

    _drawAstronomyLab();
  }

  function _drawAstronomyLab() {
    // Stop loop if we navigate away from the astronomy lab
    if (!currentLab || currentLab.id !== 'astronomy') {
      if (astronomyState.animFrame) cancelAnimationFrame(astronomyState.animFrame);
      return;
    }

    // Night sky background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some random background stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      // Use pseudo-random based on index so it stays stable-ish
      const x = (i * 73) % canvas.width;
      const y = (i * 41) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i%2), 0, Math.PI * 2);
      ctx.fill();
    }

    const constell = astronomyState.constellations[astronomyState.currentConstellation];

    // Draw connections if all stars found
    if (astronomyState.foundStars.length === constell.stars.length) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let conn of constell.connections) {
        ctx.moveTo(constell.stars[conn[0]].x, constell.stars[conn[0]].y);
        ctx.lineTo(constell.stars[conn[1]].x, constell.stars[conn[1]].y);
      }
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 24px Nunito';
      ctx.textAlign = 'center';
      ctx.fillText(constell.name, canvas.width / 2, 40);
    }

    // Draw constellation stars
    for (let i = 0; i < constell.stars.length; i++) {
      const s = constell.stars[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      if (astronomyState.foundStars.includes(i)) {
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        // Pulsing hint effect
        const pulse = Math.abs(Math.sin(Date.now() / 300));
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.3 + pulse * 0.4) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + 4 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Keep animating pulsing hint if not complete
    if (astronomyState.foundStars.length < constell.stars.length) {
      if (astronomyState.animFrame) cancelAnimationFrame(astronomyState.animFrame);
      astronomyState.animFrame = requestAnimationFrame(_drawAstronomyLab);
    } else {
      if (astronomyState.animFrame) {
        cancelAnimationFrame(astronomyState.animFrame);
        astronomyState.animFrame = null;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // SOUND WAVES LAB — tap notes, see the wave on an oscilloscope
  // ════════════════════════════════════════════════════════════════
  // Each note is a sine wave at its real frequency. Multiple notes
  // sum (additive synthesis) so a kid pressing two notes sees a
  // visibly different combined waveform. Volume envelope (ADSR-ish)
  // decays so the screen quietens between taps.
  let soundState = { voices: [], animFrame: null, audioCtx: null };

  const _SOUND_NOTES = [
    { name: 'C4', freq: 261.63, color: '#FF6B6B' },
    { name: 'D4', freq: 293.66, color: '#FF9F43' },
    { name: 'E4', freq: 329.63, color: '#FECA57' },
    { name: 'F4', freq: 349.23, color: '#1dd1a1' },
    { name: 'G4', freq: 392.00, color: '#48dbfb' },
    { name: 'A4', freq: 440.00, color: '#5f27cd' },
    { name: 'B4', freq: 493.88, color: '#a29bfe' },
    { name: 'C5', freq: 523.25, color: '#fd79a8' }
  ];

  function _initSoundLab() {
    soundState.voices = [];
    soundState.animFrame = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !soundState.audioCtx) soundState.audioCtx = new AC();
    } catch (e) { /* audio optional */ }

    const ctrls = document.getElementById('exp-controls');
    if (ctrls) {
      ctrls.innerHTML = '<div class="sound-pad" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px;">' +
        _SOUND_NOTES.map((n, i) =>
          '<button class="sound-key" data-i="' + i + '" style="' +
            'padding:14px 16px;border-radius:10px;border:2px solid ' + n.color + ';' +
            'background:rgba(255,255,255,0.06);color:#fff;font-weight:700;cursor:pointer;' +
            'font-size:0.95rem;min-width:54px;">' + n.name + '</button>'
        ).join('') +
        '</div>';
      ctrls.querySelectorAll('.sound-key').forEach(btn => {
        btn.onpointerdown = (e) => { e.preventDefault(); _playSoundNote(parseInt(btn.dataset.i, 10)); };
      });
    }
    _drawSoundLab();
  }

  function _playSoundNote(idx) {
    const note = _SOUND_NOTES[idx];
    if (!note) return;
    // Visual voice — sums into the oscilloscope render
    soundState.voices.push({ idx, freq: note.freq, color: note.color, born: performance.now(), gain: 1 });
    if (soundState.voices.length > 8) soundState.voices.shift(); // cap stack
    // Audio: a quick ADSR sine via WebAudio (no-op if context unavailable)
    const ac = soundState.audioCtx;
    if (ac) {
      try {
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        const now = ac.currentTime;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        osc.connect(g).connect(ac.destination);
        osc.start(now);
        osc.stop(now + 1.0);
      } catch (e) { /* swallow */ }
    }
    if (typeof SFX === 'undefined' && typeof playSound === 'function') playSound('click');
  }

  function _drawSoundLab() {
    if (!currentLab || currentLab.id !== 'sound') {
      if (soundState.animFrame) cancelAnimationFrame(soundState.animFrame);
      return;
    }
    const cw = canvas.width  = canvas.clientWidth  || canvas.width;
    const ch = canvas.height = canvas.clientHeight || canvas.height;

    // Dark grid background
    ctx.fillStyle = '#0E1A2E';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
    }
    for (let y = 0; y < ch; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }
    // Centre line
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, ch/2); ctx.lineTo(cw, ch/2); ctx.stroke();

    // Decay voices by age
    const now = performance.now();
    soundState.voices = soundState.voices.filter(v => {
      v.gain = Math.max(0, 1 - (now - v.born) / 1000);
      return v.gain > 0.02;
    });

    // Draw the summed waveform (additive synthesis preview)
    if (soundState.voices.length > 0) {
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const t = now / 1000;
      for (let x = 0; x < cw; x++) {
        const phase = (x / cw) * Math.PI * 8;  // ~4 wavelengths visible
        let y = 0;
        for (const v of soundState.voices) {
          // Use freq ratios so the differences are visible at screen scale
          const freqK = v.freq / 261.63;
          y += Math.sin(phase * freqK + t * v.freq * 0.005) * (ch * 0.18) * v.gain;
        }
        if (x === 0) ctx.moveTo(x, ch/2 + y);
        else ctx.lineTo(x, ch/2 + y);
      }
      ctx.stroke();

      // Per-voice colour traces, fainter
      soundState.voices.forEach(v => {
        ctx.strokeStyle = v.color + 'AA';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x < cw; x++) {
          const phase = (x / cw) * Math.PI * 8;
          const freqK = v.freq / 261.63;
          const y = Math.sin(phase * freqK + t * v.freq * 0.005) * (ch * 0.12) * v.gain;
          if (x === 0) ctx.moveTo(x, ch/2 + y);
          else ctx.lineTo(x, ch/2 + y);
        }
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 16px Nunito';
      ctx.textAlign = 'center';
      ctx.fillText('Tap a note below to see its wave', cw/2, ch/2 - 8);
    }

    soundState.animFrame = requestAnimationFrame(_drawSoundLab);
  }

  // ════════════════════════════════════════════════════════════════
  // CRYSTAL GROWING LAB — pick a solution, seed crystals, watch them grow
  // ════════════════════════════════════════════════════════════════
  // Each solution grows crystals with a different geometric habit:
  //   salt        → cubic
  //   sugar       → monoclinic (rhombic)
  //   copper      → triclinic / star-like
  let crystalState = { solution: 'salt', seeds: [], animFrame: null };

  const _CRYSTAL_SOLUTIONS = [
    { id: 'salt',   label: 'Salt',   color: '#E0E7FF', habit: 'cubic',  emoji: '🧂' },
    { id: 'sugar',  label: 'Sugar',  color: '#FBBF24', habit: 'rhombic', emoji: '🍯' },
    { id: 'copper', label: 'Copper', color: '#22D3EE', habit: 'star',   emoji: '🟦' }
  ];

  function _initCrystalLab() {
    crystalState.solution = 'salt';
    crystalState.seeds = [];
    crystalState.animFrame = null;

    const ctrls = document.getElementById('exp-controls');
    if (ctrls) {
      ctrls.innerHTML =
        '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:8px;">' +
          _CRYSTAL_SOLUTIONS.map(s =>
            '<button class="crystal-pick" data-id="' + s.id + '" style="' +
              'padding:10px 14px;border-radius:10px;border:2px solid ' + s.color + ';' +
              'background:rgba(255,255,255,0.06);color:#fff;font-weight:700;cursor:pointer;' +
              'font-size:0.95rem;">' + s.emoji + ' ' + s.label + '</button>'
          ).join('') +
        '</div>' +
        '<div style="text-align:center;font-size:0.85rem;color:#AAA;padding:4px;">' +
          'Tap the beaker to seed a crystal.' +
        '</div>';
      ctrls.querySelectorAll('.crystal-pick').forEach(btn => {
        btn.onclick = () => {
          crystalState.solution = btn.dataset.id;
          // Highlight selected
          ctrls.querySelectorAll('.crystal-pick').forEach(b => {
            b.style.background = b === btn ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)';
          });
          _drawCrystalLab();
        };
      });
      // Default-highlight salt
      const first = ctrls.querySelector('.crystal-pick');
      if (first) first.style.background = 'rgba(255,255,255,0.18)';
    }

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      // Only allow seeds inside the beaker rectangle
      if (!_insideBeaker(mx, my)) return;
      const sol = _CRYSTAL_SOLUTIONS.find(s => s.id === crystalState.solution);
      crystalState.seeds.push({
        x: mx, y: my,
        size: 0,
        targetSize: 8 + Math.random() * 14,
        color: sol.color,
        habit: sol.habit,
        rot: Math.random() * Math.PI,
        born: performance.now()
      });
      if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
      else if (typeof playSound === 'function') playSound('click');
      // Achievement when 8 crystals are grown
      if (crystalState.seeds.length === 8) {
        _addJournalEntry('Grew 8 crystals of ' + sol.label);
        stars++;
        document.getElementById('exp-stars').textContent = '⭐ ' + stars;
        _saveProgress();
      }
    };

    _drawCrystalLab();
  }

  function _insideBeaker(x, y) {
    const cw = canvas.width, ch = canvas.height;
    const bx = cw * 0.18, by = ch * 0.20;
    const bw = cw * 0.64, bh = ch * 0.62;
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
  }

  function _drawCrystalLab() {
    if (!currentLab || currentLab.id !== 'crystals') {
      if (crystalState.animFrame) cancelAnimationFrame(crystalState.animFrame);
      return;
    }
    const cw = canvas.width, ch = canvas.height;

    // Background
    ctx.fillStyle = '#0B0F1E';
    ctx.fillRect(0, 0, cw, ch);

    // Beaker
    const bx = cw * 0.18, by = ch * 0.20, bw = cw * 0.64, bh = ch * 0.62;
    const sol = _CRYSTAL_SOLUTIONS.find(s => s.id === crystalState.solution);
    // Solution fill
    const grd = ctx.createLinearGradient(0, by, 0, by + bh);
    grd.addColorStop(0, sol.color + '44');
    grd.addColorStop(1, sol.color + '88');
    ctx.fillStyle = grd;
    ctx.fillRect(bx, by, bw, bh);
    // Beaker outline + spout
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw + 6, by);
    ctx.stroke();
    // Solution label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(sol.emoji + ' ' + sol.label, cw/2, by - 12);

    // Grow each seed toward its target size
    crystalState.seeds.forEach(s => {
      s.size += Math.min(0.4, (s.targetSize - s.size) * 0.04);
      _drawCrystal(s);
    });

    // Hint if no seeds
    if (crystalState.seeds.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px Nunito';
      ctx.fillText('Tap inside the beaker to seed a crystal', cw/2, ch/2);
    }

    crystalState.animFrame = requestAnimationFrame(_drawCrystalLab);
  }

  function _drawCrystal(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = s.color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    if (s.habit === 'cubic') {
      // Square diamond
      const r = s.size;
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (s.habit === 'rhombic') {
      // Tall hexagonal rhomb
      const r = s.size, w = s.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(w, -r * 0.3);
      ctx.lineTo(w, r * 0.3); ctx.lineTo(0, r);
      ctx.lineTo(-w, r * 0.3); ctx.lineTo(-w, -r * 0.3);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      // Star / triclinic
      const r = s.size;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 === 0 ? r : r * 0.4;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════
  // STATIC ELECTRICITY LAB — rub a balloon, watch paper bits jump
  // ════════════════════════════════════════════════════════════════
  // Rubbing builds a charge on the balloon. Paper bits feel an
  // attractive force inversely proportional to distance (toy model).
  let staticState = {
    balloon: { x: 0, y: 0, charge: 0, rubLastX: null, dragging: false },
    bits: [],
    animFrame: null
  };

  function _initStaticLab() {
    const cw = canvas.width || 400, ch = canvas.height || 300;
    staticState.balloon = { x: cw * 0.30, y: ch * 0.45, charge: 0, rubLastX: null, dragging: false };
    staticState.bits = [];
    // Scatter 24 paper bits on the right half "table"
    for (let i = 0; i < 24; i++) {
      staticState.bits.push({
        x: cw * 0.55 + Math.random() * (cw * 0.40),
        y: ch * 0.72 + Math.random() * (ch * 0.20),
        vx: 0, vy: 0,
        size: 4 + Math.random() * 3,
        stuck: false
      });
    }
    staticState.animFrame = null;

    const ctrls = document.getElementById('exp-controls');
    if (ctrls) {
      ctrls.innerHTML =
        '<div style="text-align:center;padding:6px;font-size:0.85rem;color:#AAA;">' +
          'Drag the balloon left-and-right over the hair to charge it. ' +
          'Then move it near the paper bits.' +
        '</div>' +
        '<div style="text-align:center;padding:4px;">' +
          '<button id="static-reset" style="padding:8px 14px;border-radius:8px;border:none;' +
            'background:#7C3AED;color:#fff;font-weight:700;cursor:pointer;">Reset</button>' +
        '</div>';
      const reset = document.getElementById('static-reset');
      if (reset) reset.onclick = () => _initStaticLab();
    }

    canvas.onpointerdown = (e) => {
      const { mx, my } = _getMousePos(e);
      const b = staticState.balloon;
      if (Math.hypot(mx - b.x, my - b.y) < 50) {
        b.dragging = true;
        b.rubLastX = mx;
      }
    };
    canvas.onpointermove = (e) => {
      if (!staticState.balloon.dragging) return;
      const { mx, my } = _getMousePos(e);
      const b = staticState.balloon;
      // Charge accumulates when moving over the "hair" zone (left third)
      const cw = canvas.width;
      const overHair = b.x < cw * 0.40 && mx < cw * 0.40;
      if (overHair && b.rubLastX != null) {
        const dx = Math.abs(mx - b.rubLastX);
        b.charge = Math.min(1, b.charge + dx * 0.004);
      }
      b.rubLastX = mx;
      b.x = mx;
      b.y = my;
    };
    canvas.onpointerup = () => {
      staticState.balloon.dragging = false;
      staticState.balloon.rubLastX = null;
    };

    _drawStaticLab();
  }

  function _drawStaticLab() {
    if (!currentLab || currentLab.id !== 'static') {
      if (staticState.animFrame) cancelAnimationFrame(staticState.animFrame);
      return;
    }
    const cw = canvas.width, ch = canvas.height;

    // Background
    ctx.fillStyle = '#1A1030';
    ctx.fillRect(0, 0, cw, ch);

    // "Hair" zone label
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, cw * 0.40, ch);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 14px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('🧑 Hair / Pelo', cw * 0.20, 24);

    // Table line under bits
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cw * 0.50, ch * 0.85);
    ctx.lineTo(cw, ch * 0.85);
    ctx.stroke();
    ctx.fillText('📄 Paper bits', cw * 0.75, 24);

    // Update + draw paper bits
    const b = staticState.balloon;
    staticState.bits.forEach(p => {
      const dx = b.x - p.x, dy = b.y - p.y;
      const dist = Math.hypot(dx, dy);
      // Attractive force ~ charge / dist^2, capped
      if (b.charge > 0.15 && dist < 180) {
        const f = (b.charge * 12) / Math.max(dist * dist, 200);
        p.vx += dx * f;
        p.vy += dy * f;
        p.stuck = dist < 36;
      } else {
        p.stuck = false;
      }
      // Gravity if not stuck and above table
      if (!p.stuck && p.y < ch * 0.85) p.vy += 0.18;
      // Drag
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;
      // Floor
      if (!p.stuck && p.y > ch * 0.85) { p.y = ch * 0.85; p.vy = 0; }
      // Draw paper bit
      ctx.fillStyle = '#F5F5DC';
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size * 1.4);
    });

    // Balloon
    ctx.save();
    ctx.translate(b.x, b.y);
    // Body
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 48, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-12, -16, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tie + string
    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.moveTo(-4, 46); ctx.lineTo(4, 46); ctx.lineTo(0, 56); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 56); ctx.lineTo(8, 90);
    ctx.stroke();
    // Charge sparkles
    if (b.charge > 0.10) {
      ctx.strokeStyle = 'rgba(251,191,36,' + b.charge + ')';
      ctx.lineWidth = 2;
      for (let i = 0; i < Math.floor(b.charge * 14); i++) {
        const a = (Math.random() * Math.PI * 2);
        const r1 = 48, r2 = 48 + 6 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Charge meter
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(cw - 90, ch - 32, 80, 14);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(cw - 88, ch - 30, 76 * b.charge, 10);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Nunito';
    ctx.textAlign = 'right';
    ctx.fillText('⚡ Charge', cw - 12, ch - 38);

    // Award a star when charged enough and a bit stuck
    if (!staticState._awarded && b.charge > 0.6 && staticState.bits.some(p => p.stuck)) {
      staticState._awarded = true;
      _addJournalEntry('Charged the balloon and stuck a paper bit!');
      stars++;
      document.getElementById('exp-stars').textContent = '⭐ ' + stars;
      _saveProgress();
    }

    staticState.animFrame = requestAnimationFrame(_drawStaticLab);
  }

  // ── Journal & UI ──
  function _addJournalEntry(text) {
    const entry = { text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    journalEntries.push(entry);
    const journal = document.getElementById('exp-journal');
    const div = document.createElement('div');
    div.className = 'journal-entry';
    div.innerHTML = `📓 ${escHtml(text)} <span class="journal-time">${entry.time}</span>`;
    journal.prepend(div);
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

  function nextExperiment() {
    if (currentExp < currentLab.experiments.length - 1) {
      currentExp++;
      if (typeof LearningCheck !== 'undefined') {
        LearningCheck.maybePrompt('science', () => _renderExperiment());
      } else {
        _renderExperiment();
      }
    } else {
      _showResults();
    }
  }

  function _showResults() {
    const wrap = document.getElementById('results-wrap');
    const emoji = stars >= 3 ? '🏆' : stars >= 1 ? '🌟' : '🔬';
    
    wrap.innerHTML = `
      <span class="results-emoji">${emoji}</span>
      <div class="results-title">Lab Complete!</div>
      <div class="results-subtitle">${currentLab.title}</div>
      <div class="results-stats">
        <div>⭐ ${stars} stars earned</div>
        <div>📓 ${journalEntries.length} discoveries logged</div>
      </div>
      <div>
        <button class="action-btn btn-primary" onclick="LabExplorer.startLab('${currentLab.id}')">Try Again 🔁</button>
        <button class="action-btn btn-secondary" onclick="LabExplorer.backToTopics()">Other Labs 🔬</button>
      </div>
    `;
    _showScreen('results');
    _saveProgress();
  }

  function backToTopics() {
    _showScreen('select');
    init();
  }

  function _saveProgress() {
    const data = _load();
    if (!data[currentLab.id]) data[currentLab.id] = { completed: 0, stars: 0 };
    data[currentLab.id].stars = Math.max(data[currentLab.id].stars, stars);
    data[currentLab.id].completed = Math.max(data[currentLab.id].completed, currentExp + 1);
    
    // Recalculate totalStars
    data.totalStars = LABS.reduce((sum, l) => sum + (data[l.id]?.stars || 0), 0);
    _save(data);

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Lab Explorer', '🔬', `${currentLab.title} — ${stars} star${stars !== 1 ? 's' : ''}`);
    }
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      labsCompleted: LABS.filter(l => (data[l.id]?.completed || 0) >= l.experiments.length).length,
      totalLabs: LABS.length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    startLab,
    nextExperiment,
    backToTopics,
    getStats,
    // Weather Station handlers — inline onclicks call these
    _pickWeather: _pickWeather,
    _saveWeather: _saveWeather
  };
})();
