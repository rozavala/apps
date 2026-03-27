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
        { id: 'cycle', title: 'The Water Cycle',  instruction: 'Interactive water cycle experiment coming soon!' },
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
        { id: 'growth',  title: 'Growing Plants',   instruction: 'Plant growth simulation coming soon!' },
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
        { id: 'lever',    title: 'Levers & Pulleys',     instruction: 'Physics experiments coming soon!' },
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
        { id: 'magnetism', title: 'Magnetic Magic', instruction: 'Magnetism lab coming soon!' },
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
        { id: 'space',     title: 'Space Explorer',     instruction: 'Astronomy lab coming soon!' },
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

    switch (labId) {
      case 'colors':
        _initColorLab();
        break;
      default:
        _renderPlaceholder(currentLab.icon + ' ' + currentLab.title);
        break;
    }
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

  function _getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      mx: (e.clientX - rect.left) * scaleX,
      my: (e.clientY - rect.top) * scaleY
    };
  }

  // ── Journal & UI ──
  function _addJournalEntry(text) {
    const entry = { text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    journalEntries.push(entry);
    const journal = document.getElementById('exp-journal');
    const div = document.createElement('div');
    div.className = 'journal-entry';
    div.innerHTML = `📓 ${text} <span class="journal-time">${entry.time}</span>`;
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
    getStats
  };
})();
