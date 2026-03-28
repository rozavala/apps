/* ================================================================
   WORLD EXPLORER — world-explorer.js
   Interactive geography with SVG maps and travel quests.
   Storage key: zs_world_[username] via getUserAppKey('world')
   ================================================================ */

const WorldExplorer = (() => {
  'use strict';

  // ── Continents & Regions ──
  const CONTINENTS = [
    {
      id: 'south_america',
      name: 'South America',
      nameEs: 'América del Sur',
      icon: '🌎',
      color: '#10B981',
      countries: [
        {
          id: 'chile', name: 'Chile', nameEs: 'Chile', flag: '🇨🇱',
          capital: 'Santiago', capitalEs: 'Santiago',
          facts: [
            { en: 'Chile is the longest north-south country in the world.', es: 'Chile es el país más largo del mundo de norte a sur.' },
            { en: 'The Atacama Desert is the driest place on Earth.', es: 'El desierto de Atacama es el lugar más seco del planeta.' },
            { en: 'The Moai statues are found on Chile\'s Easter Island.', es: 'Las estatuas Moai se encuentran en la Isla de Pascua de Chile.' }
          ],
          landmark: { name: 'Easter Island', nameEs: 'Isla de Pascua', emoji: '🗿' },
          animal: { name: 'Andean Condor', nameEs: 'Cóndor Andino', emoji: '🦅' },
        },
        {
          id: 'argentina', name: 'Argentina', nameEs: 'Argentina', flag: '🇦🇷',
          capital: 'Buenos Aires', capitalEs: 'Buenos Aires',
          facts: [
            { en: 'Argentina is the 8th largest country in the world.', es: 'Argentina es el 8° país más grande del mundo.' },
            { en: 'Aconcagua is the tallest peak in the Americas.', es: 'El Aconcagua es el pico más alto de América.' },
            { en: 'Argentina is famous for the Tango dance.', es: 'Argentina es famosa por el baile del Tango.' }
          ],
          landmark: { name: 'Iguazu Falls', nameEs: 'Cataratas del Iguazú', emoji: '💦' },
          animal: { name: 'Jaguar', nameEs: 'Jaguar', emoji: '🐆' },
        },
        {
          id: 'brazil', name: 'Brazil', nameEs: 'Brasil', flag: '🇧🇷',
          capital: 'Brasília', capitalEs: 'Brasilia',
          facts: [
            { en: 'Brazil is the largest country in South America.', es: 'Brasil es el país más grande de América del Sur.' },
            { en: 'The Amazon Rainforest is mostly in Brazil.', es: 'La selva amazónica está mayoritariamente en Brasil.' },
            { en: 'Brazil has won the most World Cups in soccer history.', es: 'Brasil ha ganado la mayor cantidad de Copas del Mundo en la historia del fútbol.' }
          ],
          landmark: { name: 'Christ the Redeemer', nameEs: 'Cristo Redentor', emoji: '⛪' },
          animal: { name: 'Macaw', nameEs: 'Guacamayo', emoji: '🦜' },
        },
        {
          id: 'peru', name: 'Peru', nameEs: 'Perú', flag: '🇵🇪',
          capital: 'Lima', capitalEs: 'Lima',
          facts: [
            { en: 'Peru was the home of the ancient Inca Empire.', es: 'Perú fue el hogar del antiguo Imperio Inca.' },
            { en: 'Machu Picchu is a famous ancient city in the Andes.', es: 'Machu Picchu es una famosa ciudad antigua en los Andes.' },
            { en: 'Peru has over 3,000 varieties of potatoes.', es: 'Perú tiene más de 3.000 variedades de papas.' }
          ],
          landmark: { name: 'Machu Picchu', nameEs: 'Machu Picchu', emoji: '⛰️' },
          animal: { name: 'Llama', nameEs: 'Llama', emoji: '🦙' },
        }
      ]
    },
    { id: 'north_america', name: 'North America', nameEs: 'América del Norte', icon: '🌎', color: '#8B5CF6', countries: [] },
    { id: 'europe', name: 'Europe', nameEs: 'Europa', icon: '🌍', color: '#3B82F6', countries: [] },
    { id: 'africa', name: 'Africa', nameEs: 'África', icon: '🌍', color: '#EF4444', countries: [] },
    { id: 'asia', name: 'Asia', nameEs: 'Asia', icon: '🌏', color: '#F59E0B', countries: [] },
    { id: 'oceania', name: 'Oceania', nameEs: 'Oceanía', icon: '🌏', color: '#EC4899', countries: [] }
  ];

  // ── State ──
  let currentContinent = null;
  let currentCountry = null;
  let lang = 'en';
  let stars = 0;

  // ── Storage ──
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey('world') : null; }
  function _load() { 
    const k = _key();
    if (!k) return {};
    try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } 
  }
  function _save(data) { 
    const k = _key(); 
    if (k) {
      localStorage.setItem(k, JSON.stringify(data)); 
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Init ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    _renderContinentSelect();
    _updateGlobalStars();
  }

  function _renderContinentSelect() {
    const grid = document.getElementById('continent-grid');
    const data = _load();
    const visited = data.visited || [];

    grid.innerHTML = CONTINENTS.map(c => {
      const count = c.countries.filter(country => visited.includes(country.id)).length;
      const total = c.countries.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      return `
        <div class="continent-card" onclick="WorldExplorer.openContinent('${c.id}')">
          <span class="continent-icon">${c.icon}</span>
          <div class="continent-name">${lang === 'es' ? c.nameEs : c.name}</div>
          <div class="continent-stats">${total > 0 ? `${count}/${total} ${lang === 'es' ? 'países' : 'countries'}` : (lang === 'es' ? 'Próximamente' : 'Coming Soon')}</div>
          <div class="lab-progress" style="height:4px; margin-top:8px;">
            <div class="lab-progress-bar" style="width:${pct}%; background:${c.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openContinent(id) {
    currentContinent = CONTINENTS.find(c => c.id === id);
    if (!currentContinent) return;

    if (currentContinent.countries.length === 0) {
      _showFeedback('🚧');
      return;
    }

    document.getElementById('continent-title').textContent = lang === 'es' ? currentContinent.nameEs : currentContinent.name;
    _renderMap();
    _showScreen('continent');
  }

  function _renderMap() {
    const wrap = document.getElementById('map-wrap');
    const data = _load();
    const visited = data.visited || [];

    // Simplified but recognizable SVG paths for South America
    const countryPaths = {
      'brazil': 'M195 45 L260 55 L310 90 L340 140 L350 200 L340 260 L310 310 L260 340 L220 350 L180 330 L150 290 L130 250 L120 200 L125 150 L140 110 L160 75Z',
      'argentina': 'M145 290 L170 310 L180 340 L185 380 L175 420 L160 450 L140 470 L125 480 L115 460 L110 420 L105 380 L100 340 L110 300 L125 280Z',
      'chile': 'M90 250 L105 260 L110 290 L108 330 L105 370 L100 410 L95 445 L88 470 L80 480 L75 460 L78 420 L80 380 L82 340 L84 300 L85 270Z',
      'peru': 'M75 170 L110 145 L140 140 L155 160 L150 190 L140 220 L125 250 L105 260 L90 250 L78 225 L72 200Z'
    };

    // Country label positions (center of each shape)
    const labels = {
      'brazil':    { x: 230, y: 200 },
      'argentina': { x: 145, y: 380 },
      'chile':     { x: 70,  y: 370 },
      'peru':      { x: 115, y: 195 }
    };

    let svg = `<svg viewBox="0 0 400 520" width="100%" style="max-width:360px; margin:0 auto; display:block;">`;
    
    // Ocean background
    svg += `<rect width="400" height="520" rx="16" fill="rgba(59,130,246,0.08)" />`;

    currentContinent.countries.forEach(c => {
      const isVisited = visited.includes(c.id);
      const path = countryPaths[c.id];
      if (!path) return;

      const fillColor = isVisited ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)';
      const strokeColor = isVisited ? '#10B981' : 'rgba(255,255,255,0.25)';

      svg += `<path d="${path}" class="country ${isVisited ? 'visited' : ''}" 
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"
                style="cursor:pointer; transition: all 0.3s;"
                onclick="WorldExplorer.openCountry('${c.id}')" />`;

      // Country label
      const lbl = labels[c.id];
      if (lbl) {
        svg += `<text x="${lbl.x}" y="${lbl.y}" text-anchor="middle" 
                  fill="${isVisited ? '#34D399' : 'rgba(255,255,255,0.5)'}" 
                  font-family="var(--font-display)" font-size="13" font-weight="800"
                  style="pointer-events:none;">
                  ${c.flag} ${lang === 'es' ? c.nameEs : c.name}
                </text>`;
      }
    });

    svg += `</svg>`;
    wrap.innerHTML = svg;
  }

  function openCountry(id) {
    currentCountry = currentContinent.countries.find(c => c.id === id);
    if (!currentCountry) return;

    const card = document.getElementById('country-card');
    const data = _load();
    const isVisited = (data.visited || []).includes(id);

    card.innerHTML = `
      <span class="country-flag">${currentCountry.flag}</span>
      <div class="country-name">${lang === 'es' ? currentCountry.nameEs : currentCountry.name}</div>
      <div class="country-capital">${lang === 'es' ? 'Capital' : 'Capital'}: ${lang === 'es' ? currentCountry.capitalEs : currentCountry.capital}</div>
      
      <div class="country-info-grid">
        <div class="info-box">
          <div class="info-label">${lang === 'es' ? 'Hito' : 'Landmark'}</div>
          <div class="info-value">${currentCountry.landmark.emoji} ${lang === 'es' ? currentCountry.landmark.nameEs : currentCountry.landmark.name}</div>
        </div>
        <div class="info-box">
          <div class="info-label">${lang === 'es' ? 'Animal' : 'Animal'}</div>
          <div class="info-value">${currentCountry.animal.emoji} ${lang === 'es' ? currentCountry.animal.nameEs : currentCountry.animal.name}</div>
        </div>
      </div>

      <div class="country-facts">
        ${currentCountry.facts.map(f => `
          <div class="fact-item">📍 ${lang === 'es' ? f.es : f.en}</div>
        `).join('')}
      </div>

      <button class="action-btn btn-primary" onclick="WorldExplorer.markVisited('${id}')" ${isVisited ? 'disabled' : ''}>
        ${isVisited ? '✅ ' + (lang === 'es' ? 'Visitado' : 'Visited') : '🗺️ ' + (lang === 'es' ? 'Marcar como Visitado' : 'Mark as Visited')}
      </button>
      <button class="action-btn btn-secondary" onclick="WorldExplorer.backToContinent()">
        ${lang === 'es' ? 'Volver al Mapa' : 'Back to Map'}
      </button>
    `;

    _showScreen('country');
  }

  function markVisited(id) {
    const data = _load();
    if (!data.visited) data.visited = [];
    if (!data.visited.includes(id)) {
      data.visited.push(id);
      data.totalStars = (data.totalStars || 0) + 1;
      _save(data);
      _showFeedback('⭐');
      if (typeof playSound === 'function') playSound('correct');
      _updateGlobalStars();
      
      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('World Explorer', '🌍', `Visited ${lang === 'es' ? currentCountry.nameEs : currentCountry.name}`);
      }

      // Trigger learning check
      if (typeof LearningCheck !== 'undefined') {
        LearningCheck.maybePrompt('geography', () => openCountry(id));
      } else {
        openCountry(id);
      }
    }
  }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'ES / EN' : 'EN / ES';
    
    // Refresh current screen
    const active = document.querySelector('.screen.active');
    if (active.id === 'screen-select') _renderContinentSelect();
    else if (active.id === 'screen-continent') openContinent(currentContinent.id);
    else if (active.id === 'screen-country') openCountry(currentCountry.id);
  }

  function backToSelect() { _showScreen('select'); _renderContinentSelect(); }
  function backToContinent() { _showScreen('continent'); _renderMap(); }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function _updateGlobalStars() {
    const data = _load();
    const el = document.getElementById('world-stars');
    if (el) el.textContent = `⭐ ${data.totalStars || 0}`;
  }

  function _showFeedback(emoji) {
    const f = document.getElementById('feedback');
    const fe = document.getElementById('feedbackEmoji');
    if (!f || !fe) return;
    fe.textContent = emoji;
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 800);
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      visitedCount: (data.visited || []).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, openContinent, openCountry, markVisited, toggleLanguage, backToSelect, backToContinent, getStats };
})();
