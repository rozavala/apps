/* ================================================================
   COCINA LAB — learn kitchen math and skills by cooking real
   recipes with a grown-up.

   Views: home (recipes · Measuring Lab · skills), recipe detail
   with the servings scaler, cook mode (one step at a time, timers,
   read-aloud, wake lock, grown-up PIN at the end), Measuring Lab
   tasks (canvas), egg-cracking drill, kitchen-safety quiz.

   Reads the household weekly menu (zs_menu) — never writes it.
   Per-kid progress at zs_cocina_<kid>:
     { v:1,
       cooked:  { <recipeId>: { stars:0-3, count, dates:['YYYY-MM-DD', …] } },
       measure: { <taskId>: 0-3 },
       safetyStars: 0-3, safetyBest: <correct>, eggStars: 0-3 }
   ================================================================ */

var CocinaLab = (function() {
  'use strict';

  var D = CocinaData, A = CocinaArt;
  var PREFIX = 'zs_cocina_';
  var MEASURE_BADGE = 15;          // stars in the Measuring Lab for the badge

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    return getUserAppKey(PREFIX);
  }
  function _load() {
    var key = _key();
    if (!key) return _blank();
    try {
      var d = JSON.parse(localStorage.getItem(key)) || {};
      return _normalise(d);
    } catch (e) { return _blank(); }
  }
  function _blank() { return { v: 1, cooked: {}, measure: {}, safetyStars: 0, safetyBest: 0, eggStars: 0 }; }
  function _normalise(d) {
    var b = _blank();
    if (d && typeof d === 'object') {
      if (d.cooked && typeof d.cooked === 'object') b.cooked = d.cooked;
      if (d.measure && typeof d.measure === 'object') b.measure = d.measure;
      b.safetyStars = +d.safetyStars || 0;
      b.safetyBest = +d.safetyBest || 0;
      b.eggStars = +d.eggStars || 0;
    }
    return b;
  }
  function _save(data) {
    var key = _key();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
  }
  // Same rule the hub uses (APP_STAR_CONFIGS).
  function starsOf(d) {
    var n = 0, k;
    for (k in (d.cooked || {})) n += Math.min(3, (d.cooked[k] && d.cooked[k].stars) || 0);
    for (k in (d.measure || {})) n += Math.min(3, d.measure[k] || 0);
    return n + Math.min(3, d.safetyStars || 0) + Math.min(3, d.eggStars || 0);
  }
  function measureStars(d) {
    var n = 0;
    for (var k in (d.measure || {})) n += Math.min(3, d.measure[k] || 0);
    return n;
  }
  function badges(d) {
    var eggCooked = 0;
    for (var k in (d.cooked || {})) {
      var r = _recipe(k);
      if (r && _usesEggs(r) && d.cooked[k].stars > 0) eggCooked++;
    }
    return {
      measure: { on: measureStars(d) >= MEASURE_BADGE, have: measureStars(d), need: MEASURE_BADGE },
      eggs: { on: d.eggStars >= 2 && eggCooked > 0, drill: d.eggStars >= 2, cooked: eggCooked > 0 },
      safety: { on: d.safetyStars >= 2 }
    };
  }

  // ── User ──
  var _user = null, _age = 8, _tier = 'intermediate';
  function _name() { return _user ? _user.name : 'Chef'; }
  function _young() { return _age < 8; }

  // ── Helpers ──
  function esc(s) { return (typeof escHtml === 'function') ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }
  function _recipe(id) { for (var i = 0; i < D.RECIPES.length; i++) if (D.RECIPES[i].id === id) return D.RECIPES[i]; return null; }
  function _task(id) { for (var i = 0; i < D.TASKS.length; i++) if (D.TASKS[i].id === id) return D.TASKS[i]; return null; }
  function _usesEggs(r) { return r.ingredients.some(function(g) { return /^egg/.test(g.n) || g.es.indexOf('huevo') === 0; }); }
  function _iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function _niceDate(iso) {
    var p = String(iso).split('-');
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (+p[2]) + ' ' + (M[(+p[1]) - 1] || '') + ' ' + p[0];
  }
  function _stars(n, max) {
    var s = '';
    for (var i = 0; i < (max || 3); i++) s += '<span class="ck-star' + (i < n ? ' on' : '') + '" aria-hidden="true">★</span>';
    return '<span class="ck-stars" role="img" aria-label="' + n + ' of ' + (max || 3) + ' stars">' + s + '</span>';
  }
  function _shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function sfx(name) { try { if (typeof SFX !== 'undefined' && SFX[name]) SFX[name](); } catch (e) {} }
  function logActivity(icon, text) {
    try { if (typeof ActivityLog !== 'undefined' && ActivityLog.log) ActivityLog.log('Cocina Lab', icon, text); } catch (e) {}
  }

  // ── Fractions ──
  var GLYPH = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function red(f) { var g = gcd(f[0], f[1]); return [f[0] / g, f[1] / g]; }
  function mul(a, b) { return red([a[0] * b[0], a[1] * b[1]]); }
  function parseQ(q) {
    var parts = String(q).trim().split(/\s+/), n = 0, d = 1;
    parts.forEach(function(p) {
      if (p.indexOf('/') > 0) { var x = p.split('/'); var pn = +x[0], pd = +x[1]; n = n * pd + pn * d; d = d * pd; }
      else { n += (+p) * d; }
    });
    return red([n, d]);
  }
  function friendly(f) { return [1, 2, 3, 4, 8].indexOf(f[1]) >= 0; }
  // nearest eighth or third
  function approx(v) {
    var best = null, bd = 1e9;
    [8, 3].forEach(function(den) {
      var n = Math.round(v * den), dd = Math.abs(n / den - v);
      if (dd < bd - 1e-9) { bd = dd; best = red([n, den]); }
    });
    return best;
  }
  function fracStr(f) {
    f = red(f);
    var whole = Math.floor(f[0] / f[1]), rem = f[0] - whole * f[1];
    if (rem === 0) return String(whole);
    var g = GLYPH[rem + '/' + f[1]] || (rem + '/' + f[1]);
    return (whole ? whole : '') + g;
  }
  function improperStr(f) { f = red(f); return f[1] === 1 ? String(f[0]) : f[0] + '/' + f[1]; }
  function fval(f) { return f[0] / f[1]; }
  function unitWord(u, v) {
    if (u === 'cup') return v > 1 ? 'cups' : 'cup';
    return u;
  }

  // Scale one ingredient by factor f ([n,d]). Returns { amt, metric, math, approx }
  function scaleIng(g, f) {
    var fv = fval(f), out = { amt: '', metric: '', math: '', mathMetric: '' };
    var fs = fracStr(f);
    var metricBase = g.g != null ? g.g : g.ml != null ? g.ml : null, mu = g.g != null ? 'g' : 'ml';
    if (metricBase != null) {
      var m = metricBase * fv;
      var mr = m < 20 ? Math.round(m) : m < 100 ? Math.round(m) : Math.round(m / 5) * 5;
      out.metric = mr + ' ' + mu;
      out.mathMetric = metricBase + ' ' + mu + ' × ' + (Math.round(fv * 1000) / 1000) + ' = ' + (Math.round(m * 10) / 10) + (Math.abs(mr - m) > 0.05 ? ' ≈ ' + mr : '') + ' ' + mu;
    }
    if (g.u === 'pinch') { out.amt = 'a pinch'; out.math = 'A pinch stays about a pinch.'; return out; }
    if (g.u === 'taste') { out.amt = 'as needed'; return out; }
    var q = parseQ(g.q), p = mul(q, f);
    if (g.u === 'g') { out.amt = out.metric; out.metric = ''; out.math = out.mathMetric; out.mathMetric = ''; return out; }
    if (g.u === 'whole') {
      var v = fval(p), word = function(x) { return x === 1 ? g.one : g.n; };
      if (p[1] === 1) out.amt = p[0] + ' ' + word(p[0]);
      else if (p[1] === 2 && v < 3) out.amt = fracStr(p) + ' ' + word(v <= 1 ? 1 : 2);
      else {
        var rnd = Math.max(1, Math.round(v));
        out.amt = 'about ' + rnd + ' ' + word(rnd);
        out.approx = true;
      }
      out.math = fracStr(q) + ' × ' + fs + ' = ' + fracStr(p) + (out.approx ? ' → round to ' + Math.max(1, Math.round(v)) + ' (whole ' + g.n.replace(/,.*$/, '') + ')' : '');
      return out;
    }
    // cups and spoons
    var unit = g.u, res = p, isApprox = false;
    if (!friendly(p)) {
      var pv = fval(p);
      if (unit === 'cup' && pv < 0.25) { unit = 'tbsp'; pv = pv * 16; }
      if (unit === 'tbsp' && pv < 1) { unit = 'tsp'; pv = pv * 3; }
      res = approx(pv);
      if (res[0] === 0) res = [1, 8];
      isApprox = Math.abs(fval(res) - pv) > 1e-6;
    }
    out.approx = isApprox;
    out.amt = (isApprox ? '≈ ' : '') + fracStr(res) + ' ' + unitWord(unit, fval(res));
    var step = fracStr(q) + ' ' + unitWord(g.u, fval(q)) + ' × ' + fs + ' = ';
    if (_tier === 'advanced' || _tier === 'expert') {
      step += improperStr(q) + ' × ' + improperStr(f) + ' = ' + improperStr(p) + (p[1] !== 1 && p[0] > p[1] ? ' = ' + fracStr(p) : '') + ' ' + unitWord(g.u, fval(p));
    } else {
      step += fracStr(p) + ' ' + unitWord(g.u, fval(p));
    }
    if (unit !== g.u || isApprox) step += '  →  closest spoon/cup: ' + fracStr(res) + ' ' + unitWord(unit, fval(res));
    out.math = step;
    return out;
  }

  // ── Weekly menu match (read-only) ──
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function fuzzyHas(text, alias) {
    var t = norm(text), al = norm(alias);
    if (!t || !al) return false;
    if ((' ' + t + ' ').indexOf(' ' + al + ' ') >= 0) return true;
    var tw = t.split(' '), aw = al.split(' '), k = aw.length;
    var tol = al.length <= 4 ? 0 : al.length <= 8 ? 1 : 2;
    for (var i = 0; i + k <= tw.length; i++) {
      if (lev(tw.slice(i, i + k).join(' '), al) <= tol) return true;
    }
    return false;
  }
  var DAY_EN = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  var MEAL_EN = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };
  function menuMatches() {
    var raw;
    try { raw = JSON.parse(localStorage.getItem('zs_menu') || '{}') || {}; } catch (e) { raw = {}; }
    var weeks = raw.weeks || {};
    var now = new Date(), day = now.getDay(), off = day === 0 ? -6 : 1 - day;
    var mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
    var week = weeks[_iso(mon)];
    var out = {};
    if (!week || typeof week !== 'object') return out;
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(function(dId) {
      var dd = week[dId];
      if (!dd || typeof dd !== 'object') return;
      ['breakfast', 'lunch', 'dinner'].forEach(function(mId) {
        var txt = dd[mId];
        if (typeof txt !== 'string' || !txt.trim()) return;
        D.RECIPES.forEach(function(r) {
          if (out[r.id]) return;
          for (var i = 0; i < r.menu.length; i++) {
            if (fuzzyHas(txt, r.menu[i])) { out[r.id] = { day: DAY_EN[dId], meal: MEAL_EN[mId], text: txt.slice(0, 60) }; break; }
          }
        });
      });
    });
    return out;
  }

  // ── View state ──
  var S = { view: 'home', tab: 'recipes', recipe: null, servings: 0, showMath: false };
  var wrap = null;

  function render() {
    if (!wrap) return;
    if (S.view !== 'task') Lab.stop();
    var html = '';
    if (S.view === 'home') html = vHome();
    else if (S.view === 'recipe') html = vRecipe();
    else if (S.view === 'task') html = vTask();
    else if (S.view === 'eggs') html = vEggs();
    else if (S.view === 'safety') html = vSafety();
    wrap.innerHTML = html;
    if (S.view === 'task') Lab.start(_task(S.task), document.getElementById('ck-canvas'));
    window.scrollTo(0, 0);
  }

  function go(view, extra) {
    sfx('click');
    S.view = view;
    for (var k in (extra || {})) S[k] = extra[k];
    render();
  }

  // ── Home ──
  function vHeader() {
    var d = _load();
    return '<header class="ck-header">' +
      '<div class="ck-board">' +
        '<svg class="ck-hat" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="ckhat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#E7E2D9"/></linearGradient></defs>' +
        '<path d="M16 38 C6 36 6 20 18 20 C20 10 34 6 40 14 C50 10 60 22 52 32 C51 35 49 37 48 38 Z" fill="url(#ckhat)" stroke="#B9AE9E" stroke-width="1.5"/>' +
        '<rect x="16" y="37" width="32" height="14" rx="3" fill="url(#ckhat)" stroke="#B9AE9E" stroke-width="1.5"/>' +
        '<path d="M22 38 V50 M32 38 V50 M42 38 V50" stroke="#D8CFC2" stroke-width="1.5"/></svg>' +
        '<div><h1>Cocina Lab</h1><p>Cook real recipes with a grown-up · <span lang="es">Cocina con un adulto</span></p></div>' +
      '</div>' +
      '<div class="ck-tally">⭐ ' + starsOf(d) + ' kitchen stars</div>' +
    '</header>';
  }

  function vTabs() {
    var t = [['recipes', '📖', 'Recipes', 'Recetas'], ['lab', '⚖️', 'Measuring Lab', 'Medir'], ['skills', '🏅', 'Skills', 'Insignias']];
    return '<nav class="ck-tabs" role="tablist" aria-label="Sections">' + t.map(function(x) {
      var on = S.tab === x[0];
      return '<button type="button" role="tab" aria-selected="' + on + '" class="ck-tab' + (on ? ' on' : '') + '" data-act="tab" data-id="' + x[0] + '">' +
        '<span aria-hidden="true">' + x[1] + '</span> ' + x[2] + ' <small lang="es">' + x[3] + '</small></button>';
    }).join('') + '</nav>';
  }

  function vHome() {
    var h = vHeader() + vTabs();
    if (S.tab === 'recipes') h += vRecipeList();
    else if (S.tab === 'lab') h += vLabList();
    else h += vSkills();
    return h;
  }

  function _hats(n) {
    var s = '';
    for (var i = 1; i <= 3; i++) s += '<span class="ck-hatdot' + (i <= n ? ' on' : '') + '" aria-hidden="true"></span>';
    return '<span class="ck-diff" title="Difficulty">' + s + '<span class="sr-only">Difficulty ' + n + ' of 3</span></span>';
  }

  function _card(r, d, match) {
    var c = d.cooked[r.id];
    var kidSteps = r.steps.filter(function(s) { return (_young() && s.young ? s.young : s.who) !== 'adult'; }).length;
    return '<button type="button" class="ck-card" data-act="recipe" data-id="' + r.id + '">' +
      '<span class="ck-card-art">' + A.dish(r.id) +
        (match ? '<span class="ck-ribbon">On the menu · ' + esc(match.day) + '</span>' : '') +
        (c && c.stars ? '<span class="ck-cooked">✓ Cooked' + (c.count > 1 ? ' ×' + c.count : '') + '</span>' : '') +
      '</span>' +
      '<span class="ck-card-body">' +
        '<span class="ck-card-title">' + esc(r.name) + '</span>' +
        '<span class="ck-card-en">' + esc(r.en) + '</span>' +
        '<span class="ck-card-meta"><span>⏱ ' + r.time + ' min</span>' + _hats(r.difficulty) + '<span>' + kidSteps + '/' + r.steps.length + ' kid steps</span></span>' +
        (c && c.stars ? '<span class="ck-card-stars">' + _stars(c.stars) + '</span>' : '') +
      '</span></button>';
  }

  function vRecipeList() {
    var d = _load(), m = menuMatches();
    var onMenu = D.RECIPES.filter(function(r) { return m[r.id]; });
    var rest = D.RECIPES.filter(function(r) { return !m[r.id]; });
    var h = '';
    if (onMenu.length) {
      h += '<section class="ck-section ck-menu-sec"><h2>🗓️ On this week\'s menu</h2>' +
        '<p class="ck-sub">Your family planned these. Want to help cook?</p>' +
        '<div class="ck-grid">' + onMenu.map(function(r) { return _card(r, d, m[r.id]); }).join('') + '</div></section>';
    }
    h += '<section class="ck-section"><h2>' + (onMenu.length ? 'More recipes' : 'Recipes · Recetas') + '</h2>' +
      '<p class="ck-sub">Every step shows who does it: ' +
      '<span class="ck-who kid">' + A.icon('kid') + 'You</span> ' +
      '<span class="ck-who help">' + A.icon('help') + 'With help</span> ' +
      '<span class="ck-who adult">' + A.icon('adult') + 'Grown-up only</span></p>' +
      '<div class="ck-grid">' + rest.map(function(r) { return _card(r, d, null); }).join('') + '</div></section>';
    return h;
  }

  // ── Recipe detail + servings scaler ──
  var WHO = {
    kid:   { cls: 'kid',   icon: 'kid',   label: 'You can do this', es: 'Tú puedes' },
    help:  { cls: 'help',  icon: 'help',  label: 'With a grown-up', es: 'Con ayuda' },
    adult: { cls: 'adult', icon: 'adult', label: 'Grown-up only',   es: 'Solo un adulto' }
  };
  var SAFE = {
    wash: 'Wash hands', knife: 'Sharp knife', hot: 'Hot!', oven: 'Oven', oil: 'Hot oil', blade: 'Blades', egg: 'Raw egg'
  };
  function whoOf(st) { return (_young() && st.young) ? st.young : st.who; }
  function _fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + ('0' + s).slice(-2);
  }
  function _timerLabel(sec) { return sec >= 60 ? Math.round(sec / 60) + ' min' : sec + ' s'; }

  function vRecipe() {
    var r = _recipe(S.recipe), d = _load(), m = menuMatches()[r.id];
    if (!S.servings) S.servings = r.yield.n;
    var f = red([S.servings, r.yield.n]);
    var fv = fval(f);
    var c = d.cooked[r.id];
    var h = '<div class="ck-topbar"><button type="button" class="ck-back" data-act="home">← Recipes</button></div>';
    h += '<article class="ck-recipe">' +
      '<div class="ck-hero">' + A.dish(r.id) + '<div class="ck-hero-text"><h1>' + esc(r.name) + '</h1><p>' + esc(r.en) + '</p></div></div>' +
      '<div class="ck-chips">' +
        '<span class="ck-chip">⏱ ' + r.time + ' min</span>' +
        '<span class="ck-chip">' + _hats(r.difficulty) + ' ' + ['', 'Easy', 'Medium', 'Harder'][r.difficulty] + '</span>' +
        '<span class="ck-chip">🍽 ' + esc(r.makes) + '</span>' +
        (m ? '<span class="ck-chip ck-chip-menu">🗓 On the menu: ' + esc(m.day) + ' ' + esc(m.meal) + '</span>' : '') +
      '</div>' +
      '<p class="ck-about">' + esc(r.about) + '</p>' +
      (c && c.dates && c.dates.length ? '<p class="ck-history">✓ Cooked on ' + c.dates.slice(0, 5).map(_niceDate).join(' · ') + ' ' + _stars(c.stars) + '</p>' : '');

    // scaler
    h += '<section class="ck-panel ck-scaler" aria-labelledby="ck-sc-h">' +
      '<h2 id="ck-sc-h">🧮 How many ' + esc(r.yield.label) + '?</h2>' +
      '<div class="ck-sc-row">' +
        '<button type="button" class="ck-step-btn" data-act="serv" data-d="-1" aria-label="Fewer ' + esc(r.yield.label) + '"' + (S.servings <= r.yield.min ? ' disabled' : '') + '>−</button>' +
        '<div class="ck-sc-num" aria-live="polite"><b>' + S.servings + '</b><span>' + esc(r.yield.label) + '</span></div>' +
        '<button type="button" class="ck-step-btn" data-act="serv" data-d="1" aria-label="More ' + esc(r.yield.label) + '"' + (S.servings >= r.yield.max ? ' disabled' : '') + '>+</button>' +
        '<div class="ck-factor">' + (fv === 1 ? 'Original recipe' : 'Recipe × <b>' + fracStr(f) + '</b>') + '</div>' +
      '</div>' +
      '<label class="ck-toggle"><input type="checkbox" id="ck-math" data-act="math"' + (S.showMath ? ' checked' : '') + '> <span>Show the math</span></label>' +
      (S.showMath ? '<p class="ck-math-lead">' + S.servings + ' ÷ ' + r.yield.n + ' = ' + (fv === 1 ? '1' : improperStr(f) + (f[1] !== 1 && f[0] > f[1] ? ' = ' + fracStr(f) : '')) + '. Multiply every amount by <b>' + fracStr(f) + '</b>.</p>' : '') +
      (r.batchNote && fv > 1 ? '<p class="ck-note">💡 ' + esc(r.batchNote) + '</p>' : '') +
    '</section>';

    // ingredients
    h += '<section class="ck-panel"><h2>🧺 Ingredients · <span lang="es">Ingredientes</span></h2><ul class="ck-ings">';
    r.ingredients.forEach(function(g) {
      var sc = scaleIng(g, f);
      h += '<li><span class="ck-amt">' + esc(sc.amt) + '</span>' +
        '<span class="ck-ing"><b>' + esc(g.n.charAt(0).toUpperCase() + g.n.slice(1)) + '</b> <span lang="es" class="ck-es">' + esc(g.es) + '</span>' +
        (g.note ? ' <span class="ck-ing-note">(' + esc(g.note) + ')</span>' : '') + '</span>' +
        (sc.metric ? '<span class="ck-metric">' + esc(sc.metric) + '</span>' : '') +
        (S.showMath && fv !== 1 && (sc.math || sc.mathMetric) ? '<span class="ck-mathline">' + esc(sc.math) + (sc.mathMetric ? '<br>' + esc(sc.mathMetric) : '') + '</span>' : '') +
        '</li>';
    });
    h += '</ul><p class="ck-fine">1 cup = 250 ml · 1 tbsp = 15 ml · 1 tsp = 5 ml. Grams are close estimates.</p></section>';

    // equipment
    h += '<section class="ck-panel"><h2>🥄 Equipment</h2><ul class="ck-equip">' +
      r.equipment.map(function(e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></section>';

    // steps
    h += '<section class="ck-panel"><h2>👩‍🍳 Steps · <span lang="es">Pasos</span></h2><ol class="ck-steps">';
    r.steps.forEach(function(st) {
      var w = WHO[whoOf(st)];
      h += '<li class="ck-st ' + w.cls + '"><span class="ck-who ' + w.cls + '">' + A.icon(w.icon) + w.label + '</span>' +
        '<span class="ck-st-text">' + esc(st.t) + '</span>' +
        '<span class="ck-st-icons">' + (st.icons || []).map(function(ic) { return '<span class="ck-safe ' + ic + '">' + A.icon(ic) + SAFE[ic] + '</span>'; }).join('') +
        (st.timer ? '<span class="ck-safe timer">' + A.icon('timer') + _timerLabel(st.timer) + '</span>' : '') + '</span>' +
        (st.tip ? '<span class="ck-tip">💡 ' + esc(st.tip) + '</span>' : '') + '</li>';
    });
    h += '</ol></section>';
    h += '<div class="ck-cta"><button type="button" class="ck-big" data-act="cook">👩‍🍳 Start cooking</button>' +
      '<p class="ck-sub">Cook mode shows one big step at a time, with timers and read-aloud.</p></div>';
    h += '</article>';
    return h;
  }

  // ── Cook mode ──
  var Cook = { r: null, i: 0, timers: {}, wake: null, tick: null, alarm: null, autoRead: false };

  function openCook() {
    var r = _recipe(S.recipe);
    Cook.r = r; Cook.i = 0; Cook.timers = {}; Cook.autoRead = _age <= 6 && _ttsOn();
    var el = document.getElementById('ck-cook');
    el.hidden = false;
    document.body.classList.add('ck-cooking');
    _wakeOn();
    Cook.tick = setInterval(_tickTimers, 250);
    drawCook();
    if (Cook.autoRead) speakStep();
  }
  function closeCook(force) {
    var running = Object.keys(Cook.timers).some(function(k) { return Cook.timers[k].running; });
    var done = function() {
      _stopAlarm();
      clearInterval(Cook.tick); Cook.tick = null;
      Cook.timers = {};
      _wakeOff();
      try { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); } catch (e) {}
      var el = document.getElementById('ck-cook');
      el.hidden = true; el.innerHTML = '';
      document.body.classList.remove('ck-cooking');
      render();
    };
    if (running && !force) {
      ZsDialog.confirm({ title: 'Leave cook mode?', message: 'A timer is still running. It will stop if you leave.', confirmLabel: 'Leave', cancelLabel: 'Keep cooking' })
        .then(function(ok) { if (ok) done(); });
    } else done();
  }
  function _wakeOn() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function(l) { Cook.wake = l; }).catch(function() {});
      }
    } catch (e) {}
  }
  function _wakeOff() {
    try { if (Cook.wake) Cook.wake.release(); } catch (e) {}
    Cook.wake = null;
  }
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && Cook.r && !document.getElementById('ck-cook').hidden) _wakeOn();
  });

  function _ttsOn() {
    try { return typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled; } catch (e) { return false; }
  }

  function _timerHtml(i, st) {
    var T = Cook.timers[i] || { total: st.timer, left: st.timer, running: false, done: false };
    var frac = T.left / T.total, R = 54, C = 2 * Math.PI * R;
    return '<div class="ck-timer' + (T.done ? ' done' : '') + (T.running ? ' running' : '') + '" id="ck-timer">' +
      '<svg viewBox="0 0 128 128" class="ck-timer-ring" aria-hidden="true">' +
        '<defs><linearGradient id="cktg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8FAFC"/><stop offset="1" stop-color="#CBD5E1"/></linearGradient></defs>' +
        '<circle cx="64" cy="64" r="62" fill="url(#cktg)" stroke="#94A3B8" stroke-width="2"/>' +
        '<circle cx="64" cy="64" r="' + R + '" fill="#fff" stroke="#E2E8F0" stroke-width="10"/>' + _ticks() +
        '<circle id="ck-tarc" cx="64" cy="64" r="' + R + '" fill="none" stroke="' + (T.done ? '#DC2626' : '#F59E0B') + '" stroke-width="10" stroke-linecap="round" ' +
          'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '" transform="rotate(-90 64 64)"/>' +
      '</svg>' +
      '<div class="ck-timer-read"><b id="ck-tread" aria-live="off">' + _fmtTime(T.left) + '</b><span>' + (T.done ? 'Time!' : _timerLabel(st.timer) + ' timer') + '</span></div>' +
      '<div class="ck-timer-btns">' +
        (T.done ? '<button type="button" class="ck-btn ck-btn-red" data-act="tstop">🔕 Stop alarm</button>' :
          '<button type="button" class="ck-btn" data-act="tgo">' + (T.running ? '⏸ Pause' : (T.left < T.total ? '▶ Resume' : '▶ Start timer')) + '</button>') +
        '<button type="button" class="ck-btn ck-btn-ghost" data-act="treset" aria-label="Reset timer">↺</button>' +
      '</div></div>';
  }

  function _ticks() {
    var s = '';
    for (var k = 0; k < 12; k++) {
      var a = k / 12 * Math.PI * 2, r0 = k % 3 ? 40 : 35, r1 = 45;
      s += '<line x1="' + (64 + Math.sin(a) * r0).toFixed(1) + '" y1="' + (64 - Math.cos(a) * r0).toFixed(1) + '" x2="' + (64 + Math.sin(a) * r1).toFixed(1) + '" y2="' + (64 - Math.cos(a) * r1).toFixed(1) + '" stroke="#94A3B8" stroke-width="' + (k % 3 ? 1.5 : 3) + '" stroke-linecap="round"/>';
    }
    return s + '<circle cx="64" cy="64" r="22" fill="#FEF3C7" stroke="#FCD34D" stroke-width="2"/>' +
      '<path d="M56 60 h16 l-2 12 h-12Z" fill="#fff" stroke="#B45309" stroke-width="1.6"/><path d="M60 57 h8" stroke="#B45309" stroke-width="2" stroke-linecap="round"/>';
  }
  function _chips() {
    var h = '';
    Object.keys(Cook.timers).forEach(function(k) {
      var T = Cook.timers[k];
      if (+k === Cook.i || (!T.running && !T.done)) return;
      h += '<button type="button" class="ck-tchip' + (T.done ? ' done' : '') + '" data-act="jump" data-i="' + k + '">⏱ Step ' + (+k + 1) + ' · <b data-chip="' + k + '">' + _fmtTime(T.left) + '</b></button>';
    });
    return h;
  }

  function drawCook() {
    var r = Cook.r, i = Cook.i, st = r.steps[i], w = WHO[whoOf(st)], n = r.steps.length;
    var el = document.getElementById('ck-cook');
    var last = i === n - 1;
    var h = '<div class="ck-cook-inner ' + w.cls + '" role="dialog" aria-modal="true" aria-label="Cook mode: ' + esc(r.name) + '">' +
      '<div class="ck-cook-top">' +
        '<button type="button" class="ck-x" data-act="cookclose" aria-label="Close cook mode">✕</button>' +
        '<span class="ck-cook-thumb">' + A.dish(r.id) + '</span>' +
        '<div class="ck-cook-title"><b>' + esc(r.name) + '</b><span>Step ' + (i + 1) + ' of ' + n + '</span></div>' +
        (_ttsOn() ? '<button type="button" class="ck-x ck-auto' + (Cook.autoRead ? ' on' : '') + '" data-act="autoread" aria-pressed="' + Cook.autoRead + '" aria-label="Read each step automatically">' + A.icon('speak') + '</button>' : '') +
      '</div>' +
      '<div class="ck-progress" aria-hidden="true"><span style="width:' + Math.round((i + 1) / n * 100) + '%"></span></div>' +
      '<div class="ck-tchips">' + _chips() + '</div>' +
      '<div class="ck-cook-body">' +
        '<div class="ck-cook-who ' + w.cls + '">' + A.icon(w.icon, 'big') + '<span><b>' + w.label + '</b><small lang="es">' + w.es + '</small></span></div>' +
        ((st.icons && st.icons.length) ? '<div class="ck-cook-safe">' + st.icons.map(function(ic) { return '<span class="ck-safe ' + ic + ' lg">' + A.icon(ic) + SAFE[ic] + '</span>'; }).join('') + '</div>' : '') +
        '<p class="ck-cook-text">' + esc(st.t) + '</p>' +
        (st.tip ? '<p class="ck-cook-tip">💡 ' + esc(st.tip) + '</p>' : '') +
        (st.timer ? _timerHtml(i, st) : '') +
      '</div>' +
      '<div class="ck-cook-nav">' +
        '<button type="button" class="ck-btn ck-btn-ghost" data-act="prev"' + (i === 0 ? ' disabled' : '') + '>← Back</button>' +
        (_ttsOn() ? '<button type="button" class="ck-btn ck-btn-say" data-act="say">' + A.icon('speak') + ' Read aloud</button>' : '') +
        (last ? '<button type="button" class="ck-btn ck-btn-done" data-act="done">🎉 Done!</button>' :
          '<button type="button" class="ck-btn ck-btn-next" data-act="next">Next →</button>') +
      '</div></div>';
    el.innerHTML = h;
  }

  function speakStep() {
    if (!_ttsOn()) return;
    var st = Cook.r.steps[Cook.i], w = WHO[whoOf(st)];
    var txt = 'Step ' + (Cook.i + 1) + '. ' + w.label + '. ' + st.t + (st.tip ? ' Tip: ' + st.tip : '');
    try { ZsTTS.speak(txt.replace(/°C/g, ' degrees').replace(/½/g, ' a half').replace(/¼/g, ' a quarter'), { lang: 'en-US' }); } catch (e) {}
  }

  function _tickTimers() {
    var now = Date.now(), changed = false;
    Object.keys(Cook.timers).forEach(function(k) {
      var T = Cook.timers[k];
      if (!T.running) return;
      T.left = Math.max(0, (T.endAt - now) / 1000);
      if (T.left <= 0) { T.running = false; T.done = true; changed = true; _startAlarm(+k); }
    });
    if (changed) { drawCook(); return; }
    // cheap in-place updates
    var T = Cook.timers[Cook.i];
    if (T) {
      var rd = document.getElementById('ck-tread'), arc = document.getElementById('ck-tarc');
      if (rd) rd.textContent = _fmtTime(T.left);
      if (arc) { var C = 2 * Math.PI * 54; arc.setAttribute('stroke-dashoffset', (C * (1 - T.left / T.total)).toFixed(1)); }
    }
    var chips = document.querySelectorAll('[data-chip]');
    for (var c = 0; c < chips.length; c++) {
      var TT = Cook.timers[chips[c].getAttribute('data-chip')];
      if (TT) chips[c].textContent = _fmtTime(TT.left);
    }
  }

  function timerGo() {
    var st = Cook.r.steps[Cook.i];
    var T = Cook.timers[Cook.i] || (Cook.timers[Cook.i] = { total: st.timer, left: st.timer, running: false, done: false });
    _audio(); // unlock audio on this tap
    if (T.running) { T.running = false; T.left = Math.max(0, (T.endAt - Date.now()) / 1000); }
    else { T.running = true; T.endAt = Date.now() + T.left * 1000; }
    sfx('click');
    drawCook();
  }
  function timerReset() {
    delete Cook.timers[Cook.i];
    _stopAlarm();
    drawCook();
  }

  // Kitchen-timer bell, made with Web Audio.
  var _ac = null;
  function _audio() {
    try {
      if (!_ac) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) _ac = new AC(); }
      if (_ac && _ac.state === 'suspended') _ac.resume();
    } catch (e) {}
    return _ac;
  }
  function _ding(t0) {
    var c = _audio(); if (!c) return;
    [[1318.5, 0.5], [2637, 0.18], [3955, 0.07]].forEach(function(p) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(p[1] * 0.5, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + 1.5);
    });
  }
  function _startAlarm(stepIdx) {
    _stopAlarm();
    var c = _audio(), n = 0;
    var ring = function() {
      if (n++ > 14) { _stopAlarm(); return; }
      if (c) { var t = c.currentTime; _ding(t); _ding(t + 0.28); }
      try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
    };
    ring();
    Cook.alarm = setInterval(ring, 1600);
    if (stepIdx !== Cook.i) { try { ZsDialog.toast('⏰ Timer done — step ' + (stepIdx + 1)); } catch (e) {} }
  }
  function _stopAlarm() {
    if (Cook.alarm) { clearInterval(Cook.alarm); Cook.alarm = null; }
  }
  function timerStop() {
    _stopAlarm();
    var T = Cook.timers[Cook.i];
    if (T) { T.done = false; T.left = T.total; }
    delete Cook.timers[Cook.i];
    drawCook();
  }

  function cookDone() {
    ZsDialog.prompt({
      title: 'Grown-up check ✅',
      message: 'A grown-up types the parent PIN to confirm ' + _name() + ' cooked this.',
      inputType: 'password', inputMode: 'numeric', placeholder: 'PIN', confirmLabel: 'Confirm', cancelLabel: 'Not yet'
    }).then(function(pin) {
      if (pin == null) return;
      var real = (typeof getParentPin === 'function') ? String(getParentPin()) : '1234';
      if (String(pin).trim() !== real) { sfx('wrong'); ZsDialog.toast('That PIN did not match.'); return; }
      _rateCook();
    });
  }
  function _rateCook() {
    var el = document.getElementById('ck-cook');
    var r = Cook.r;
    el.innerHTML = '<div class="ck-cook-inner kid" role="dialog" aria-modal="true" aria-label="How much did they do?">' +
      '<div class="ck-cook-top"><div class="ck-cook-title"><b>' + esc(r.name) + '</b><span>Grown-up: how much did ' + esc(_name()) + ' do?</span></div></div>' +
      '<div class="ck-cook-body ck-rate">' +
        '<div class="ck-rate-art">' + A.dish(r.id) + '</div>' +
        [[1, 'Helped and watched closely'], [2, 'Did some of the kid steps'], [3, 'Did all the kid steps']].map(function(x) {
          return '<button type="button" class="ck-rate-btn" data-act="rate" data-n="' + x[0] + '">' + _stars(x[0]) + '<span>' + x[1] + '</span></button>';
        }).join('') +
      '</div></div>';
  }
  function rateCook(n) {
    var r = Cook.r, d = _load();
    var c = d.cooked[r.id] || { stars: 0, count: 0, dates: [] };
    c.stars = Math.max(c.stars || 0, Math.max(1, Math.min(3, n)));
    c.count = (c.count || 0) + 1;
    c.dates = [_iso(new Date())].concat(c.dates || []).slice(0, 12);
    d.cooked[r.id] = c;
    _save(d);
    logActivity('👩‍🍳', 'Cooked ' + r.name + ' with a grown-up (' + n + '★)');
    sfx('cheer');
    confetti();
    closeCook(true);
    ZsDialog.toast('⭐ ' + r.name + ' — cooked on ' + _niceDate(_iso(new Date())) + '!');
  }

  // ── Measuring Lab list ──
  function _levelFor() { return { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }[_tier] || 2; }
  function vLabList() {
    var d = _load(), my = _levelFor(), ms = measureStars(d);
    var h = '<section class="ck-section"><h2>⚖️ Measuring Lab · <span lang="es">Laboratorio de medidas</span></h2>' +
      '<p class="ck-sub">Pour, scoop, level and weigh like a real cook. ' + ms + ' / ' + (D.TASKS.length * 3) + ' stars' +
      (ms < MEASURE_BADGE ? ' · ' + (MEASURE_BADGE - ms) + ' more for the Measuring badge' : ' · Measuring badge earned!') + '</p>';
    D.LEVELS.forEach(function(L) {
      var tasks = D.TASKS.filter(function(t) { return t.level === L.n; });
      h += '<div class="ck-level' + (L.n === my ? ' mine' : '') + '"><h3>Level ' + L.n + ' · ' + L.name + ' <small lang="es">' + L.es + '</small>' +
        (L.n === my ? ' <span class="ck-pill">Your level</span>' : '') + '</h3><div class="ck-tasks">';
      tasks.forEach(function(t) {
        var s = d.measure[t.id] || 0;
        h += '<button type="button" class="ck-task" data-act="task" data-id="' + t.id + '">' +
          '<span class="ck-task-ico ' + t.scene + '" aria-hidden="true">' + _sceneIcon(t.scene) + '</span>' +
          '<span class="ck-task-t"><b>' + esc(t.title) + '</b><small>' + esc(_sceneName(t)) + '</small></span>' + _stars(s) + '</button>';
      });
      h += '</div></div>';
    });
    return h + '</section>';
  }
  function _sceneName(t) {
    return { jug: 'Measuring jug · ' + (A.LIQ[t.liquid] || {}).label, cups: 'Cups & knife · ' + ({ flour: 'Flour · Harina', sugar: 'Sugar · Azúcar', oats: 'Oats · Avena' }[t.food]),
      scale: (t.dial ? 'Dial scale' : 'Digital scale') + ' · Balanza', count: t.spoon ? 'Spoons · Cucharas' : 'Cups · Tazas' }[t.scene];
  }
  function _sceneIcon(s) {
    return {
      jug: '<svg viewBox="0 0 40 40"><path d="M10 8 h20 l-2 26 h-16Z" fill="#E0F2FE" stroke="#0E7490" stroke-width="2"/><path d="M11.5 20 h17 l-1.2 14 h-14.6Z" fill="#7DD3FC"/><path d="M30 12 q7 2 5 9 q-1 4 -6 5" fill="none" stroke="#0E7490" stroke-width="2.5"/><path d="M13 14 h4 M13 20 h4 M13 26 h4" stroke="#B91C1C" stroke-width="1.6"/></svg>',
      cups: '<svg viewBox="0 0 40 40"><path d="M5 16 q0 14 12 14 q12 0 12 -14Z" fill="#CBD5E1" stroke="#475569" stroke-width="2"/><ellipse cx="17" cy="16" rx="12" ry="4" fill="#F8FAFC" stroke="#475569" stroke-width="2"/><path d="M8 15 q9 -9 18 0" fill="#FFFBEB" stroke="#D6CBB6"/><path d="M29 15 h9" stroke="#64748B" stroke-width="3.5" stroke-linecap="round"/></svg>',
      scale: '<svg viewBox="0 0 40 40"><rect x="4" y="20" width="32" height="14" rx="4" fill="#1F2937"/><rect x="10" y="24" width="14" height="7" rx="1.5" fill="#A5F3FC"/><rect x="2" y="16" width="36" height="5" rx="2.5" fill="#CBD5E1" stroke="#64748B"/><path d="M10 16 q10 -12 20 0Z" fill="#F1F5F9" stroke="#94A3B8"/></svg>',
      count: '<svg viewBox="0 0 40 40"><path d="M4 18 q0 9 8 9 q8 0 8 -9Z" fill="#CBD5E1" stroke="#475569" stroke-width="2"/><path d="M20 10 h14 l-2 24 h-10Z" fill="#E0F2FE" stroke="#0E7490" stroke-width="2"/><path d="M21.6 22 h11 l-1 12 h-9Z" fill="#7DD3FC"/><text x="12" y="16" font-size="9" text-anchor="middle" font-weight="900" fill="#B45309">?</text></svg>'
    }[s];
  }

  // ── Skills (badges, egg drill, safety quiz) ──
  function vSkills() {
    var d = _load(), b = badges(d);
    var h = '<section class="ck-section"><h2>🏅 Skill badges · <span lang="es">Insignias</span></h2><div class="ck-badges">';
    h += '<div class="ck-badge' + (b.measure.on ? ' on' : '') + '">' + A.medal('measure', b.measure.on) + '<b>Measuring</b><small lang="es">Medir</small>' +
      '<span>' + (b.measure.on ? 'Earned!' : b.measure.have + ' / ' + b.measure.need + ' Measuring Lab stars') + '</span>' +
      '<button type="button" class="ck-btn" data-act="tab" data-id="lab">Go to the Lab</button></div>';
    h += '<div class="ck-badge' + (b.eggs.on ? ' on' : '') + '">' + A.medal('eggs', b.eggs.on) + '<b>Cracking eggs</b><small lang="es">Partir huevos</small>' +
      '<span>' + (b.eggs.on ? 'Earned!' : (b.eggs.drill ? '✓' : '○') + ' Egg drill (2★) · ' + (b.eggs.cooked ? '✓' : '○') + ' Cook an egg recipe') + '</span>' +
      '<button type="button" class="ck-btn" data-act="eggs">Egg drill ' + _stars(d.eggStars) + '</button></div>';
    h += '<div class="ck-badge' + (b.safety.on ? ' on' : '') + '">' + A.medal('safety', b.safety.on) + '<b>Kitchen safety</b><small lang="es">Seguridad</small>' +
      '<span>' + (b.safety.on ? 'Earned!' : 'Score 2★ in the safety quiz') + '</span>' +
      '<button type="button" class="ck-btn" data-act="safety">Safety quiz ' + _stars(d.safetyStars) + '</button></div>';
    h += '</div></section>';
    // cooked log
    var log = [];
    Object.keys(d.cooked).forEach(function(k) {
      var r = _recipe(k), c = d.cooked[k];
      if (r && c && c.dates) c.dates.forEach(function(dt) { log.push({ r: r, dt: dt, s: c.stars }); });
    });
    log.sort(function(a, b2) { return a.dt < b2.dt ? 1 : -1; });
    h += '<section class="ck-section"><h2>📒 My cooking log</h2>';
    if (!log.length) h += '<p class="ck-sub">Nothing yet. Cook a recipe with a grown-up and it shows up here.</p>';
    else h += '<ul class="ck-log">' + log.slice(0, 20).map(function(x) {
      return '<li><span class="ck-log-art">' + A.dish(x.r.id) + '</span><span><b>' + esc(x.r.name) + '</b><small>Cooked on ' + _niceDate(x.dt) + '</small></span></li>';
    }).join('') + '</ul>';
    return h + '</section>';
  }

  // ── Egg drill ──
  var Egg = null;
  function startEggs() {
    var steps = D.EGG_STEPS.slice();
    if (_tier === 'beginner') steps = steps.filter(function(s) { return s.id !== 'fish'; });
    Egg = { order: steps, pool: _shuffle(steps), placed: [], mistakes: 0, done: false };
    go('eggs');
  }
  function _eggSvg() {
    return '<svg class="ck-egg-art" viewBox="0 0 320 150" aria-hidden="true"><defs>' +
      '<radialGradient id="ckegg" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#FFF4E6"/><stop offset=".6" stop-color="#F2D3AE"/><stop offset="1" stop-color="#C99A6B"/></radialGradient>' +
      '<radialGradient id="ckyolk" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE37A"/><stop offset=".7" stop-color="#F7A912"/><stop offset="1" stop-color="#D97706"/></radialGradient>' +
      '<linearGradient id="ckbowl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B7BEC4"/><stop offset=".3" stop-color="#fff"/><stop offset="1" stop-color="#9AA2A8"/></linearGradient>' +
      '<filter id="ckeb"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
      '<rect width="320" height="150" fill="#EFEAE3"/><path d="M0 104 H320" stroke="#D7CFC4" stroke-width="2"/>' +
      '<ellipse cx="92" cy="132" rx="46" ry="8" fill="#3A2A1A" opacity=".3" filter="url(#ckeb)"/>' +
      '<path d="M92 36 C66 36 54 74 54 96 a38 38 0 0 0 76 0 C130 74 118 36 92 36Z" fill="url(#ckegg)"/>' +
      '<path d="M70 80 l8 -6 l6 8 l8 -10 l7 9 l8 -7 l7 6" stroke="#8B6B4A" stroke-width="1.8" fill="none"/>' +
      '<path d="M70 58 q6 -14 18 -18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<ellipse cx="236" cy="138" rx="66" ry="9" fill="#3A2A1A" opacity=".3" filter="url(#ckeb)"/>' +
      '<path d="M172 92 Q176 138 236 140 Q296 138 300 92Z" fill="url(#ckbowl)"/>' +
      '<ellipse cx="236" cy="92" rx="64" ry="16" fill="#E5E7EB" stroke="#CBD5E1"/>' +
      '<ellipse cx="232" cy="94" rx="40" ry="10" fill="#FFF8E8" opacity=".85"/>' +
      '<ellipse cx="230" cy="93" rx="15" ry="8" fill="url(#ckyolk)"/><ellipse cx="226" cy="90" rx="5" ry="2.2" fill="#FFF7C2" opacity=".8"/>' +
      '<path d="M180 96 Q236 118 292 96" stroke="#2B5C93" stroke-width="3" fill="none" opacity=".75"/>' +
      '</svg>';
  }
  function vEggs() {
    var E = Egg;
    var h = '<div class="ck-topbar"><button type="button" class="ck-back" data-act="skills">← Skills</button></div>' +
      '<section class="ck-panel ck-drill"><h1>🥚 Cracking eggs · <span lang="es">Partir huevos</span></h1>' + _eggSvg() +
      '<p class="ck-sub">Tap the steps in the right order.</p><ol class="ck-slots">';
    for (var i = 0; i < E.order.length; i++) {
      var p = E.placed[i];
      h += '<li class="ck-slot' + (p ? ' filled' : '') + '"><span class="ck-slot-n">' + (i + 1) + '</span>' + (p ? '<span><b>' + esc(p.t) + '</b><small>' + esc(p.why) + '</small></span>' : '<span class="ck-slot-empty">…</span>') + '</li>';
    }
    h += '</ol>';
    if (!E.done) {
      h += '<div class="ck-pool">' + E.pool.map(function(s) {
        return '<button type="button" class="ck-pool-btn" data-act="eggpick" data-id="' + s.id + '">' + esc(s.t) + '</button>';
      }).join('') + '</div>';
    } else {
      var st = E.mistakes === 0 ? 3 : E.mistakes <= 2 ? 2 : 1;
      h += '<div class="ck-result">' + _stars(st) + '<p>' + (st === 3 ? 'Perfect order! You know how to crack an egg.' : 'All in order. ' + E.mistakes + ' wrong tap' + (E.mistakes === 1 ? '' : 's') + ' along the way.') + '</p>' +
        '<p class="ck-sub">Now practise for real with a grown-up: Huevos revueltos is a great first egg recipe.</p>' +
        '<div class="ck-row"><button type="button" class="ck-btn" data-act="eggs">↺ Again</button>' +
        '<button type="button" class="ck-btn ck-btn-next" data-act="recipe" data-id="huevos-revueltos">🍳 Huevos revueltos</button></div></div>';
    }
    return h + '</section>';
  }
  function eggPick(id, btn) {
    var E = Egg, want = E.order[E.placed.length];
    if (want.id === id) {
      E.placed.push(want);
      E.pool = E.pool.filter(function(s) { return s.id !== id; });
      sfx('correct');
      if (E.placed.length === E.order.length) {
        E.done = true;
        var st = E.mistakes === 0 ? 3 : E.mistakes <= 2 ? 2 : 1;
        var d = _load();
        if (st > d.eggStars) { d.eggStars = st; _save(d); }
        logActivity('🥚', 'Egg-cracking drill — ' + st + '★');
        sfx('cheer'); if (st === 3) confetti();
      }
      render();
    } else {
      E.mistakes++;
      sfx('wrong');
      if (btn) { btn.classList.remove('ck-shake'); void btn.offsetWidth; btn.classList.add('ck-shake'); }
    }
  }

  // ── Safety quiz ──
  var Quiz = null;
  function startSafety() {
    var pool = _tier === 'beginner' ? D.SAFETY.filter(function(q) { return q.kid; }) : D.SAFETY.slice();
    var n = _tier === 'beginner' ? 5 : _tier === 'intermediate' ? 6 : 8;
    var qs = _shuffle(pool).slice(0, n).map(function(q) {
      var idx = _shuffle(q.c.map(function(_, i) { return i; }));
      if (_tier === 'beginner' && idx.length > 2) idx = _shuffle([q.a, idx.filter(function(i) { return i !== q.a; })[0]]);
      return { q: q.q, c: idx.map(function(i) { return q.c[i]; }), a: idx.indexOf(q.a), why: q.why };
    });
    Quiz = { qs: qs, i: 0, right: 0, picked: null };
    go('safety');
  }
  function vSafety() {
    var Q = Quiz, h = '<div class="ck-topbar"><button type="button" class="ck-back" data-act="skills">← Skills</button></div>' +
      '<section class="ck-panel ck-quiz"><h1>🛡️ Kitchen safety · <span lang="es">Seguridad en la cocina</span></h1>';
    if (Q.i >= Q.qs.length) {
      var n = Q.qs.length, st = Q.right === n ? 3 : Q.right >= Math.ceil(n * 0.75) ? 2 : Q.right >= Math.ceil(n / 2) ? 1 : 0;
      h += '<div class="ck-result">' + _stars(st) + '<p><b>' + Q.right + ' of ' + n + '</b> right.</p>' +
        '<p class="ck-sub">' + (st >= 2 ? 'Kitchen safety badge unlocked!' : 'Score 2★ (' + Math.ceil(n * 0.75) + ' right) for the safety badge.') + '</p>' +
        '<div class="ck-row"><button type="button" class="ck-btn" data-act="safety">↺ New quiz</button><button type="button" class="ck-btn ck-btn-next" data-act="skills">Done</button></div></div>';
      return h + '</section>';
    }
    var q = Q.qs[Q.i];
    h += '<div class="ck-qprog">Question ' + (Q.i + 1) + ' of ' + Q.qs.length + '</div><p class="ck-q">' + esc(q.q) + '</p><div class="ck-choices">';
    q.c.forEach(function(c, i) {
      var cls = '';
      if (Q.picked != null) cls = i === q.a ? ' right' : (i === Q.picked ? ' wrong' : ' dim');
      h += '<button type="button" class="ck-choice' + cls + '" data-act="qpick" data-i="' + i + '"' + (Q.picked != null ? ' disabled' : '') + '>' + esc(c) + '</button>';
    });
    h += '</div>';
    if (Q.picked != null) {
      h += '<p class="ck-why ' + (Q.picked === q.a ? 'right' : 'wrong') + '">' + (Q.picked === q.a ? '✓ Right! ' : '✗ Not quite. ') + esc(q.why) + '</p>' +
        '<div class="ck-row"><button type="button" class="ck-btn ck-btn-next" data-act="qnext">' + (Q.i + 1 < Q.qs.length ? 'Next →' : 'See score') + '</button></div>';
    }
    return h + '</section>';
  }
  function qPick(i) {
    var Q = Quiz, q = Q.qs[Q.i];
    if (Q.picked != null) return;
    Q.picked = i;
    if (i === q.a) { Q.right++; sfx('correct'); } else sfx('wrong');
    render();
  }
  function qNext() {
    var Q = Quiz;
    Q.i++; Q.picked = null;
    if (Q.i >= Q.qs.length) {
      var n = Q.qs.length, st = Q.right === n ? 3 : Q.right >= Math.ceil(n * 0.75) ? 2 : Q.right >= Math.ceil(n / 2) ? 1 : 0;
      var d = _load();
      if (st > d.safetyStars) d.safetyStars = st;
      if (Q.right > d.safetyBest) d.safetyBest = Q.right;
      _save(d);
      logActivity('🛡️', 'Kitchen safety quiz — ' + Q.right + '/' + n);
      if (st >= 2) { sfx('cheer'); confetti(); }
    }
    render();
  }

  // ── Measuring task view (HTML around the canvas) ──
  function vTask() {
    var t = _task(S.task), d = _load();
    var h = '<div class="ck-topbar"><button type="button" class="ck-back" data-act="tab" data-id="lab">← Measuring Lab</button>' +
      '<span class="ck-topstars">Best ' + _stars(d.measure[t.id] || 0) + '</span></div>';
    h += '<section class="ck-lab">' +
      '<div class="ck-lab-head"><h1>' + esc(t.title) + '</h1><p class="ck-lab-prompt">' + esc(t.prompt) + '</p>' +
        (t.math ? '<details class="ck-hint"><summary>Need a hint?</summary><p>' + esc(t.math) + '</p></details>' : '') + '</div>' +
      '<div class="ck-stage"><canvas id="ck-canvas" aria-label="' + esc(_sceneName(t)) + '" role="img"></canvas>' +
        '<div class="ck-hud" id="ck-hud" aria-live="polite"></div></div>' +
      '<div class="ck-controls" id="ck-controls">' + Lab.controls(t) + '</div>' +
      '<div id="ck-lab-result"></div>' +
    '</section>';
    return h;
  }

  function taskResult(t, stars, msg, detail) {
    var d = _load();
    var prev = d.measure[t.id] || 0;
    if (stars > prev) { d.measure[t.id] = stars; _save(d); }
    if (stars > 0) logActivity('⚖️', 'Measuring Lab: ' + t.title + ' — ' + stars + '★');
    sfx(stars >= 2 ? 'cheer' : stars === 1 ? 'correct' : 'wrong');
    if (stars === 3) confetti();
    var idx = D.TASKS.indexOf(t), next = D.TASKS[idx + 1];
    var el = document.getElementById('ck-lab-result');
    if (!el) return;
    el.innerHTML = '<div class="ck-result ck-lab-res ' + (stars ? 'good' : 'try') + '">' + _stars(stars) +
      '<p><b>' + esc(msg) + '</b></p>' + (detail ? '<p class="ck-sub">' + esc(detail) + '</p>' : '') +
      '<div class="ck-row"><button type="button" class="ck-btn" data-act="task" data-id="' + t.id + '">↺ Try again</button>' +
      (next ? '<button type="button" class="ck-btn ck-btn-next" data-act="task" data-id="' + next.id + '">Next: ' + esc(next.title) + ' →</button>' : '<button type="button" class="ck-btn ck-btn-next" data-act="tab" data-id="lab">All tasks</button>') +
      '</div></div>';
    var top = document.querySelector('.ck-stars .ck-star');
    var tsEl = document.querySelector('.ck-topstars');
    if (tsEl) tsEl.innerHTML = 'Best ' + _stars(Math.max(prev, stars));
    try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    return top;
  }

  // ================================================================
  // MEASURING LAB ENGINE (canvas)
  // ================================================================
  var Lab = (function() {
    var L = null;   // live state
    var raf = 0;

    function fmtCups12(n) { return fracStr(red([n, 12])) + ' cup' + (n > 12 ? 's' : ''); }

    function controls(t) {
      if (t.scene === 'jug') {
        return '<button type="button" class="ck-hold" id="ck-pour" aria-label="Hold to pour">🫗 Hold to pour</button>' +
          '<button type="button" class="ck-btn ck-btn-ghost" data-lab="less">Pour a little out</button>' +
          '<button type="button" class="ck-btn ck-btn-next" data-lab="check">✓ Check</button>';
      }
      if (t.scene === 'cups') {
        return '<div class="ck-cupbtns" role="group" aria-label="Pick a measuring cup">' + t.tools.map(function(s) {
            return '<button type="button" class="ck-cupbtn" data-lab="cup" data-s="' + s + '">' + fracStr(red([s, 12])) + ' cup</button>';
          }).join('') + '</div>' +
          '<button type="button" class="ck-btn" data-lab="level" id="ck-level" disabled>🔪 Level it off</button>' +
          '<button type="button" class="ck-btn" data-lab="tip" id="ck-tip" disabled>⤵ Tip into bowl</button>' +
          '<button type="button" class="ck-btn ck-btn-ghost" data-lab="empty">Empty bowl</button>' +
          '<button type="button" class="ck-btn ck-btn-next" data-lab="check">✓ Check</button>';
      }
      if (t.scene === 'scale') {
        return (t.dial ? '<button type="button" class="ck-btn" data-lab="tare">↻ Turn dial to 0</button>' : '<button type="button" class="ck-btn" data-lab="tare">TARE (zero)</button>') +
          '<button type="button" class="ck-hold" id="ck-pour" aria-label="Hold to pour">🫗 Hold to pour</button>' +
          '<button type="button" class="ck-btn ck-btn-ghost" data-lab="less">Spoon a little out</button>' +
          '<button type="button" class="ck-btn ck-btn-next" data-lab="check">✓ Check</button>';
      }
      // count
      return '<button type="button" class="ck-btn ck-btn-big" data-lab="one">🫗 Pour one ' + (t.spoon ? 'teaspoon' : fracStr(red([t.small, 12])) + ' cup') + '</button>' +
        '<button type="button" class="ck-btn ck-btn-ghost" data-lab="empty">Empty</button>' +
        '<div class="ck-countq"><span>How many?</span>' + t.choices.map(function(c) {
          return '<button type="button" class="ck-choice sm" data-lab="ans" data-n="' + c + '">' + c + '</button>';
        }).join('') + '</div>';
    }

    function start(t, canvas) {
      stop();
      if (!canvas) return;
      L = { t: t, cv: canvas, ctx: canvas.getContext('2d'), time: 0, last: 0, done: false,
        drops: [], ripples: [], bubbles: [], grains: [], hold: false, tilt: 0 };
      if (t.scene === 'jug') { L.vol = 0; L.shown = 0; }
      if (t.scene === 'cups') { L.bowl = 0; L.scoops = []; L.active = null; L.knifeX = null; L.dragKnife = false; }
      if (t.scene === 'scale') { L.bowlW = t.bowl || 150; L.food = 0; L.tare = t.bowl ? 0 : L.bowlW; L.shown = t.bowl ? 0 : 0; L.needle = 0; L.nv = 0; L.tared = !t.bowl; L.tareFlash = 0; L.dispT = 0; L.disp = 0; }
      if (t.scene === 'count') { L.vol = 0; L.shown = 0; L.n = 0; L.anim = null; L.tries = 0; L.queue = 0; }
      _size();
      _bind();
      L.last = performance.now();
      raf = requestAnimationFrame(_frame);
      _hud();
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      _pourSound(0);
      if (L && L.ro) { try { L.ro.disconnect(); } catch (e) {} }
      L = null;
    }

    function _size() {
      var cv = L.cv, W = Math.max(280, cv.clientWidth || cv.parentNode.clientWidth || 360);
      var H = W < 520 ? Math.round(W * 1.0) : Math.round(Math.min(560, W * 0.62));
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      cv.style.height = H + 'px';
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      L.W = W; L.H = H; L.dpr = dpr;
      L.counterY = Math.round(H * (W < 520 ? 0.52 : 0.58));
      L.bg = A.makeBackdrop(W, H, L.counterY, dpr);
      _layout();
    }

    function _layout() {
      var t = L.t, W = L.W, H = L.H, cy = L.counterY;
      if (t.scene === 'jug' || t.scene === 'count') {
        var cap = t.scene === 'jug' ? t.cap : _countCap(t);
        var small = t.scene === 'count' && t.spoon;
        var hgt = H * (small ? 0.32 : 0.5), rB = Math.min(W * (small ? 0.09 : 0.15), hgt * (small ? 0.42 : 0.36));
        var cx = t.scene === 'jug' ? W * 0.6 : W * 0.6;
        L.J = A.jugGeom({ cx: cx, bottom: cy + (H - cy) * 0.55, h: hgt, rBot: rB, rTop: rB * 1.1, k: 0.2, cap: cap });
        L.marks = _marks(t, cap);
        var J = L.J;
        L.mouth = { x: cx - J.rT * 0.3, y: J.top - Math.max(26, H * 0.07) };
        L.srcScale = Math.min(H * 0.36 / 160, W * 0.3 / 60);
      }
      if (t.scene === 'cups') {
        L.sack = { x: W * 0.03, y: cy - H * 0.2, w: W * 0.26, h: H * 0.42 };
        L.bowlP = { cx: W * 0.83, y: cy + (H - cy) * 0.18, r: Math.min(W * 0.14, H * 0.17) };
        L.work = { cx: W * 0.5, y: cy + (H - cy) * 0.08 };
        L.cupBase = Math.min(W * 0.1, H * 0.12);
        L.tray = {};
        var narrow = W < 520, tools = t.tools, x0 = W * (narrow ? 0.12 : 0.36), x1 = W * (narrow ? 0.74 : 0.7), n = tools.length;
        tools.forEach(function(s, i) {
          L.tray[s] = { x: n === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (n - 1) - L.cupBase * 0.4, y: H - (H - cy) * 0.2 };
        });
      }
      if (t.scene === 'scale') {
        L.sw = Math.min(W * 0.55, H * 0.62);
        L.scx = W * 0.6;
        L.sy = t.dial ? cy + (H - cy) * 0.0 - L.sw * 0.25 : cy + (H - cy) * 0.35;
        L.bowlR = L.sw * 0.34;
        var rimY = _bowlRimY();
        L.mouth = { x: L.scx - L.bowlR * 0.3, y: rimY - L.bowlR * (t.dial ? 0.75 : 1.0) };
        L.srcScale = Math.min(H * 0.32 / 130, W * 0.28 / 68);
      }
    }

    function _countCap(t) {
      if (t.spoon) return 20;
      var ml = t.big * 250 / 12;
      return ml <= 250 ? 250 : 500;
    }
    function _marks(t, cap) {
      var m = [], v;
      if (t.scene === 'count' && t.spoon) {
        [5, 10, 15, 20].forEach(function(x) { m.push({ v: x, side: 'l', major: true, label: x + ' ml' }); });
        m.push({ v: 15, side: 'r', major: true, label: '1 tbsp' });
        return m;
      }
      var stepMl = cap > 500 ? 50 : 25, lab = cap > 500 ? 100 : 50;
      for (v = stepMl; v <= cap + 0.1; v += stepMl) m.push({ v: v, side: 'l', major: v % lab === 0, label: (v % (cap > 500 ? 200 : 100) === 0) ? String(v) : null });
      var qc = cap > 500 ? 0.5 : 0.25;
      for (v = qc; v * 250 <= cap + 0.1; v += qc) {
        var f = approx(v);
        m.push({ v: v * 250, side: 'r', major: (v * 4) % 2 === 0, label: fracStr(f) + (v === 1 ? ' CUP' : '') });
      }
      return m;
    }

    // ---- input ----
    function _bind() {
      var pour = document.getElementById('ck-pour');
      if (pour) {
        var down = function(e) { e.preventDefault(); L && (L.hold = true); _unlock(); pour.classList.add('on'); };
        var up = function() { if (L) L.hold = false; pour.classList.remove('on'); };
        pour.addEventListener('pointerdown', down);
        pour.addEventListener('pointerup', up);
        pour.addEventListener('pointerleave', up);
        pour.addEventListener('pointercancel', up);
        pour.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        pour.addEventListener('keydown', function(e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); down(e); } });
        pour.addEventListener('keyup', function(e) { if (e.key === ' ' || e.key === 'Enter') up(); });
      }
      var cv = L.cv;
      cv.addEventListener('pointerdown', _cvDown);
      cv.addEventListener('pointermove', _cvMove);
      cv.addEventListener('pointerup', _cvUp);
      cv.addEventListener('pointercancel', _cvUp);
      if (typeof ResizeObserver !== 'undefined') {
        var lastW = cv.clientWidth;
        L.ro = new ResizeObserver(function() {
          if (!L) return;
          if (Math.abs(cv.clientWidth - lastW) > 2) { lastW = cv.clientWidth; _size(); }
        });
        L.ro.observe(cv.parentNode);
      }
    }
    function _pt(e) { var r = L.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function _cvDown(e) {
      if (!L) return;
      var p = _pt(e), t = L.t;
      _unlock();
      if (t.scene === 'jug' || t.scene === 'scale') {
        if (p.y < L.counterY + 20) { L.hold = true; L.cvHold = true; try { L.cv.setPointerCapture(e.pointerId); } catch (x) {} }
        return;
      }
      if (t.scene === 'cups') {
        var a = L.active;
        if (a && a.phase === 'heaped') {
          var r = _cupR(a.size);
          if (Math.abs(p.y - L.work.y) < r * 1.4 + 30 && p.x > L.work.cx - r * 2.2 && p.x < L.work.cx + r * 2.2) {
            L.dragKnife = true; L.knifeX = Math.min(p.x, L.work.cx - r); a.levelX = L.work.cx - r;
            try { L.cv.setPointerCapture(e.pointerId); } catch (x) {}
          }
          return;
        }
        if (!a) {
          for (var s in L.tray) {
            var tp = L.tray[s], rr = _cupR(+s) * 0.7;
            if (Math.abs(p.x - tp.x) < rr + 22 && Math.abs(p.y - tp.y) < rr + 22) { pickCup(+s); return; }
          }
        }
      }
    }
    function _cvMove(e) {
      if (!L || !L.dragKnife) return;
      var p = _pt(e), a = L.active;
      if (!a) return;
      var r = _cupR(a.size);
      var nx = Math.max(L.work.cx - r * 1.3, Math.min(L.work.cx + r * 1.4, p.x));
      if (nx > L.knifeX) {
        // scrape: spill a little over the far edge as the knife moves
        _spill(nx - L.knifeX);
        L.knifeX = nx; a.levelX = Math.max(a.levelX || 0, nx);
      }
      if (L.knifeX >= L.work.cx + r * 0.98) _leveled();
    }
    function _cvUp() {
      if (!L) return;
      if (L.cvHold) { L.hold = false; L.cvHold = false; }
      L.dragKnife = false;
    }

    // ---- shared animation helpers ----
    function _frame(now) {
      if (!L) return;
      var dt = Math.min(0.05, (now - L.last) / 1000);
      L.last = now; L.time += dt;
      _update(dt);
      _draw();
      raf = requestAnimationFrame(_frame);
    }

    function _update(dt) {
      var t = L.t;
      // particles
      L.drops = L.drops.filter(function(d) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 1.6; return d.life > 0 && d.y < (d.floor || 1e9); });
      L.ripples = L.ripples.filter(function(r) { r.r += 55 * dt; r.a -= dt * 1.3; return r.a > 0; });
      L.bubbles = L.bubbles.filter(function(b) { b.y -= b.v * dt; b.x += Math.sin(L.time * 6 + b.p) * 0.2; return b.y > b.top; });
      L.grains = L.grains.filter(function(g) { g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.life -= dt * 0.8; return g.y < g.floor && g.life > 0; });

      if (t.scene === 'jug') _updJug(dt);
      else if (t.scene === 'cups') _updCups(dt);
      else if (t.scene === 'scale') _updScale(dt);
      else _updCount(dt);
    }

    // ---- JUG ----
    var REST = 1.2, POUR = 2.15;
    function _updJug(dt) {
      var t = L.t, J = L.J;
      L.tilt += (L.hold && !L.done ? 3.2 : -4.5) * dt;
      L.tilt = Math.max(0, Math.min(1, L.tilt));
      var e = L.tilt * L.tilt * (3 - 2 * L.tilt);
      L.ang = REST + (POUR - REST) * e;
      var flowFrac = L.tilt > 0.55 ? Math.pow((L.tilt - 0.55) / 0.45, 1.6) : 0;
      var maxRate = (t.cap > 500 ? 150 : 85) * (_tier === 'beginner' ? 0.8 : 1);
      var flow = flowFrac * maxRate;
      _pourSound(flowFrac);
      if (flow > 0) {
        L.vol = Math.min(J.maxMl * 0.985, L.vol + flow * dt);
        L.flowW = 2 + 7 * flowFrac;
        L.streamOn = true; L.streamTop = null;
      } else if (L.streamOn) {
        L.streamOn = false; L.streamTop = L.mouthNow ? L.mouthNow.y : 0; L.streamV = 0;
      }
      if (L.streamTop != null) { L.streamV += 900 * dt; L.streamTop += L.streamV * dt; }
      if (L.less > 0) { var dv = Math.min(L.less, 60 * dt); L.vol = Math.max(0, L.vol - dv); L.less -= dv; }
      // the shown level eases toward the true volume with a little slosh
      L.shown += (L.vol - L.shown) * Math.min(1, dt * 9);
      _impactFx(dt, flowFrac, t.liquid);
    }

    function _mouthWorld() {
      // pivot is the bottle's mouth; it rides a little arc as it tilts
      var m = L.mouth, e = (L.ang - REST) / (POUR - REST);
      return { x: m.x + e * 6, y: m.y + e * 10 };
    }

    function _impactFx(dt, flowFrac, liquid) {
      if (flowFrac <= 0 || !L.impact) return;
      L.rippleT = (L.rippleT || 0) - dt;
      if (L.rippleT <= 0) { L.ripples.push({ x: L.impact.x, r: 3, a: 0.9 }); L.rippleT = 0.09; }
      var n = Math.random() < flowFrac * 0.9 ? 1 + Math.floor(Math.random() * 2) : 0;
      for (var i = 0; i < n; i++) L.drops.push({ x: L.impact.x + (Math.random() - 0.5) * 6, y: L.impact.y - 2, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 120, r: 0.8 + Math.random() * 1.8, life: 0.6, floor: L.impact.y + 4 });
      if (liquid !== 'milk' && Math.random() < flowFrac * 0.6 && L.J) {
        L.bubbles.push({ x: L.impact.x + (Math.random() - 0.5) * 10, y: L.impact.y + 10 + Math.random() * 30, v: 30 + Math.random() * 30, r: 0.8 + Math.random() * 1.8, p: Math.random() * 6, top: L.impact.y + 2 });
      }
    }

    function _drawJugScene(vol, liquid, marker, showSource) {
      var ctx = L.ctx, J = L.J;
      var level = vol > 0.05 ? J.yFor(vol) : J.floor;
      // stream first (behind the front glass? it enters from above, so draw before the jug's front)
      var m = _mouthWorld();
      L.mouthNow = m;
      if (showSource) {
        // bottle behind the jug top
        A.drawSource(ctx, liquid, m.x, m.y, L.ang, L.srcScale);
      }
      A.drawJug(ctx, { J: J, vol: vol, liquid: liquid, marks: L.marks, unitL: L.t.spoon ? '' : 'ml', unitR: L.t.spoon ? '' : 'CUPS',
        marker: marker, ripples: L.ripples, bubbles: L.bubbles, backdrop: L.bg, W: L.W, H: L.H });
      if (showSource && (L.streamOn || L.streamTop != null)) {
        var ang = L.ang, dirx = Math.sin(ang);
        var end = A.drawStream(ctx, liquid, m.x + dirx * 3, m.y + 2, dirx * 70, level - 1, L.flowW || 3, L.time, L.streamTop);
        if (end) L.impact = { x: end[0], y: level }; else { L.streamTop = null; L.impact = null; }
      } else L.impact = null;
      A.drawDrops(ctx, L.drops, liquid);
    }

    function _drawBg() {
      var ctx = L.ctx;
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      ctx.clearRect(0, 0, L.W, L.H);
      ctx.drawImage(L.bg, 0, 0, L.W, L.H);
    }

    function _draw() {
      var t = L.t;
      _drawBg();
      if (t.scene === 'jug') _drawJugScene(L.shown, t.liquid, t.marker ? t.target : null, true);
      else if (t.scene === 'cups') _drawCups();
      else if (t.scene === 'scale') _drawScale();
      else _drawCount();
    }

    function lessJug() { L.less = (L.less || 0) + Math.max(10, Math.round(L.t.target * 0.06)); sfx('click'); }

    function checkJug() {
      var t = L.t, v = Math.round(L.vol);
      var tol = Math.max(5, t.target * 0.04);
      var err = Math.abs(L.vol - t.target);
      var st = err <= tol ? 3 : err <= tol * 2.5 ? 2 : err <= tol * 5 ? 1 : 0;
      var cupsTxt = fracStr(approx(L.vol / 250)) + ' cup';
      var tgt = t.cupsOnly ? fracStr(approx(t.target / 250)) + ' cup (' + Math.round(t.target) + ' ml)' : Math.round(t.target) + ' ml';
      var msg = st === 3 ? 'Spot on!' : st === 2 ? 'Very close!' : st === 1 ? 'Close — keep practising.' : (L.vol < t.target ? 'A bit too little.' : 'A bit too much.');
      L.showRead = true;
      taskResult(t, st, msg, 'Your jug holds ' + v + ' ml (about ' + cupsTxt + '). The goal was ' + tgt + '. Tip: crouch down so your eyes are level with the line and read the bottom of the curved surface (the meniscus).');
    }

    // ---- CUPS ----
    function _cupR(size) { return L.cupBase * Math.cbrt(size / 12); }
    function pickCup(s) {
      if (!L || L.active || L.done) return;
      _unlock();
      sfx('click');
      L.active = { size: s, phase: 'dip', p: 0, heap: 0, levelX: null };
      L.knifeX = null;
      _ctrlState();
    }
    function _leveled() {
      var a = L.active;
      if (!a || a.phase !== 'heaped') return;
      a.phase = 'level'; a.heap = 0; L.dragKnife = false;
      sfx('correct');
      _ctrlState();
    }
    function levelAuto() {
      var a = L.active;
      if (!a || a.phase !== 'heaped') return;
      var r = _cupR(a.size);
      a.auto = true; L.knifeX = L.work.cx - r * 1.2; a.levelX = L.work.cx - r;
    }
    function tipCup() {
      var a = L.active;
      if (!a || (a.phase !== 'heaped' && a.phase !== 'level')) return;
      a.wasHeaped = a.phase === 'heaped';
      a.phase = 'pour'; a.p = 0;
      _ctrlState();
    }
    function emptyBowl() { if (!L) return; if (L.t.scene === 'cups') { L.bowl = 0; L.scoops = []; } else { L.vol = 0; L.shown = 0; L.n = 0; } sfx('click'); _hud(); }

    function _spill(dx) {
      var a = L.active, r = _cupR(a.size);
      var n = Math.min(6, Math.ceil(dx / 3));
      for (var i = 0; i < n; i++) {
        L.grains.push({ x: L.knifeX + 2 + Math.random() * 6, y: L.work.y - r * 0.15 - Math.random() * r * 0.4, vx: 20 + Math.random() * 60, vy: -20 - Math.random() * 40, s: 1 + Math.random() * 1.6, life: 1, floor: L.work.y + r * 1.1, a: Math.random() * 3 });
      }
    }

    function _updCups(dt) {
      var a = L.active;
      if (!a) return;
      if (a.phase === 'dip') {
        a.p += dt / 1.3;
        if (a.p >= 1) { a.phase = 'heaped'; a.heap = 1; a.p = 0; L.knifeX = L.work.cx - _cupR(a.size) * 1.25; sfx('click'); _ctrlState(); }
      } else if (a.phase === 'heaped' && a.auto) {
        var r = _cupR(a.size), nx = L.knifeX + dt * r * 2.2;
        _spill(nx - L.knifeX);
        L.knifeX = nx; a.levelX = Math.max(a.levelX, nx);
        if (L.knifeX >= L.work.cx + r * 0.98) { a.auto = false; _leveled(); }
      } else if (a.phase === 'pour') {
        a.p += dt / 1.6;
        var pos = _cupPos(a);
        if (a.p > 0.45 && a.p < 0.85) {
          for (var i = 0; i < 4; i++) L.grains.push({ x: pos.x - _cupR(a.size) * 0.8 + Math.random() * 6, y: pos.y + Math.random() * 4, vx: -10 + Math.random() * 20, vy: 10 + Math.random() * 30, s: 1 + Math.random() * 1.8, life: 1, floor: L.bowlP.y + 4, a: Math.random() * 3 });
        }
        if (a.p >= 1) {
          var add = a.wasHeaped ? Math.round(a.size * 1.3) : a.size;
          L.bowl += add; L.scoops.push({ s: a.size, heaped: a.wasHeaped });
          if (a.wasHeaped) { try { ZsDialog.toast('That cup was heaped — it holds more than it says!'); } catch (e) {} }
          L.active = null; L.knifeX = null;
          _ctrlState(); _hud();
        }
      }
    }

    function _ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
    function _lerp(a, b, t) { return a + (b - a) * t; }

    function _cupPos(a) {
      var tray = L.tray[a.size], work = L.work, sack = L.sack, bowl = L.bowlP;
      var dipX = sack.x + sack.w * 0.55, dipY = sack.y + sack.h * 0.18;
      if (a.phase === 'dip') {
        var p = a.p;
        if (p < 0.35) { var q = _ease(p / 0.35); return { x: _lerp(tray.x, dipX, q), y: _lerp(tray.y, dipY - 40, q), rot: -0.3 * q, dip: 0 }; }
        if (p < 0.6) { var q2 = (p - 0.35) / 0.25; return { x: dipX, y: dipY - 40 + Math.sin(q2 * Math.PI) * 46, rot: -0.3, dip: Math.sin(q2 * Math.PI) }; }
        var q3 = _ease((p - 0.6) / 0.4);
        return { x: _lerp(dipX, work.cx, q3), y: _lerp(dipY - 40, work.y, q3), rot: _lerp(-0.3, 0, q3), dip: 0 };
      }
      if (a.phase === 'pour') {
        var bx = bowl.cx + _cupR(a.size) * 0.6, by = bowl.y - bowl.r * 0.9;
        var p2 = a.p;
        if (p2 < 0.35) { var r1 = _ease(p2 / 0.35); return { x: _lerp(work.cx, bx, r1), y: _lerp(work.y, by, r1), rot: 0 }; }
        if (p2 < 0.85) { var r2 = _ease((p2 - 0.35) / 0.2); return { x: bx, y: by, rot: -2.1 * r2 }; }
        var r3 = _ease((p2 - 0.85) / 0.15);
        return { x: _lerp(bx, tray.x, r3), y: _lerp(by, tray.y, r3), rot: _lerp(-2.1, 0, r3) };
      }
      return { x: work.cx, y: work.y, rot: 0 };
    }

    function _drawCups() {
      var ctx = L.ctx, t = L.t, a = L.active;
      A.drawSack(ctx, L.sack.x, L.sack.y, L.sack.w, L.sack.h, t.food);
      var bowlAmt = Math.min(1, L.bowl / Math.max(12, t.target * 1.5));
      A.drawBowl(ctx, L.bowlP.cx, L.bowlP.y, L.bowlP.r, bowlAmt, t.food);
      // cups waiting on the counter
      t.tools.forEach(function(s) {
        if (a && a.size === s) return;
        var p = L.tray[s];
        A.drawCup(ctx, p.x, p.y - _cupR(s) * 0.62, _cupR(s) * 0.7, fracStr(red([s, 12])), null, {});
      });
      // work spot hint
      if (!a) {
        ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(120,100,80,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(L.work.cx, L.work.y + L.cupBase * 0.9, L.cupBase * 1.1, L.cupBase * 0.25, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (a) {
        var pos = _cupPos(a), r = _cupR(a.size);
        ctx.save();
        ctx.translate(pos.x, pos.y); ctx.rotate(pos.rot || 0);
        var full = a.phase === 'heaped' || a.phase === 'level' || (a.phase === 'dip' && a.p > 0.5) || (a.phase === 'pour' && a.p < 0.55);
        var heap = a.phase === 'heaped' ? 1 : (a.phase === 'dip' && a.p > 0.5) ? 1 : (a.phase === 'pour' && a.wasHeaped && a.p < 0.4) ? 1 : 0;
        var fill = full ? { food: t.food, frac: 1, heap: heap, levelX: a.levelX != null ? a.levelX - pos.x : null } : null;
        A.drawCup(ctx, 0, 0, r, fracStr(red([a.size, 12])) + ' CUP', fill, { noShadow: a.phase !== 'heaped' && a.phase !== 'level' });
        ctx.restore();
        // the sack front covers the cup while it dips
        if (a.phase === 'dip' && pos.dip > 0.3) {
          ctx.save(); ctx.beginPath(); ctx.rect(L.sack.x - 4, L.sack.y + L.sack.h * 0.26, L.sack.w + 8, L.sack.h); ctx.clip();
          A.drawSack(ctx, L.sack.x, L.sack.y, L.sack.w, L.sack.h, t.food); ctx.restore();
        }
        if (a.phase === 'heaped' || (a.phase === 'level' && L.knifeX != null && L.knifeX < L.work.cx + r * 1.6)) {
          var kx = L.knifeX != null ? L.knifeX : L.work.cx - r * 1.25;
          var len = r * 3.2, bl = len * 0.6, th = -1.25;
          var ox = kx + 0.32 * bl, oy = L.work.y - r * 0.1 - 0.95 * bl;
          A.drawKnife(ctx, ox, oy, len, th);
          if (a.phase === 'heaped' && !L.dragKnife && !a.auto) {
            // drag hint arrow
            ctx.save(); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(L.time * 4);
            ctx.strokeStyle = '#B45309'; ctx.fillStyle = '#B45309'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            var ay = L.work.y - r * 1.25;
            ctx.beginPath(); ctx.moveTo(L.work.cx - r * 0.6, ay); ctx.lineTo(L.work.cx + r * 0.6, ay); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(L.work.cx + r * 0.75, ay); ctx.lineTo(L.work.cx + r * 0.55, ay - 7); ctx.lineTo(L.work.cx + r * 0.55, ay + 7); ctx.closePath(); ctx.fill();
            ctx.font = '800 13px Nunito, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('drag the knife', L.work.cx, ay - 12);
            ctx.restore();
          }
        }
      }
      A.drawGrains(ctx, L.grains, t.food);
    }

    function checkCups() {
      var t = L.t;
      if (L.active) { try { ZsDialog.toast('Finish with the cup in your hand first.'); } catch (e) {} return; }
      var heaped = L.scoops.some(function(s) { return s.heaped; });
      var raw = L.scoops.reduce(function(n, s) { return n + s.s; }, 0);
      var minScoops = _minScoops(t.target, t.tools);
      var st, msg, det;
      if (!L.scoops.length) { try { ZsDialog.toast('Scoop some ' + t.food + ' first!'); } catch (e) {} return; }
      if (heaped) {
        st = raw === t.target ? 1 : 0;
        msg = 'Heaped cups hold too much!';
        det = 'Always level the cup with the flat back of a knife. Your bowl has more than ' + fmtCups12(raw) + '.';
      } else if (raw === t.target) {
        st = L.scoops.length <= minScoops ? 3 : 2;
        msg = st === 3 ? 'Perfect — ' + fmtCups12(raw) + '!' : 'Right amount!';
        det = L.scoops.map(function(s) { return fracStr(red([s.s, 12])); }).join(' + ') + ' = ' + fmtCups12(raw) +
          (st === 2 ? '. You can do it in ' + minScoops + ' scoop' + (minScoops > 1 ? 's' : '') + '. Try a bigger cup!' : '.');
      } else {
        st = 0;
        msg = raw < t.target ? 'Not enough yet.' : 'Too much.';
        det = 'The bowl has ' + L.scoops.map(function(s) { return fracStr(red([s.s, 12])); }).join(' + ') + ' = ' + fmtCups12(raw) + '. The goal is ' + fmtCups12(t.target) + '.';
      }
      taskResult(t, st, msg, det);
    }
    function _minScoops(target, tools) {
      var best = [0];
      for (var v = 1; v <= target; v++) {
        best[v] = Infinity;
        tools.forEach(function(s) { if (s <= v && best[v - s] + 1 < best[v]) best[v] = best[v - s] + 1; });
      }
      return best[target];
    }

    // ---- SCALE ----
    function _updScale(dt) {
      var t = L.t;
      L.tilt += (L.hold && !L.done ? 3 : -4.5) * dt;
      L.tilt = Math.max(0, Math.min(1, L.tilt));
      var e = L.tilt * L.tilt * (3 - 2 * L.tilt);
      L.ang = 1.3 + (2.25 - 1.3) * e;
      var flowFrac = L.tilt > 0.55 ? Math.pow((L.tilt - 0.55) / 0.45, 1.5) : 0;
      var rate = (t.target >= 200 ? 70 : 45) * (_tier === 'beginner' ? 0.8 : 1);
      if (flowFrac > 0) {
        L.food += flowFrac * rate * dt;
        var m = _packetMouth();
        var n = Math.ceil(flowFrac * 6);
        for (var i = 0; i < n; i++) L.grains.push({ x: m.x + (Math.random() - 0.5) * 5, y: m.y, vx: 40 + (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 30, s: 1 + Math.random() * 1.5, life: 1, floor: L.pileY || (L.sy - 6), a: Math.random() * 3 });
      }
      _pourSound(flowFrac * 0.5);
      if (L.less > 0) { var dv = Math.min(L.less, 40 * dt); L.food = Math.max(0, L.food - dv); L.less -= dv; }
      var weight = L.bowlW + L.food;
      // needle: damped spring toward the reading
      var target = weight - L.tare;
      if (t.dial) {
        var k = 60, c = 9;
        L.nv += (-(L.needle - target) * k - L.nv * c) * dt;
        L.needle += L.nv * dt;
      } else {
        // digital display settles in small steps
        L.dispT -= dt;
        if (L.dispT <= 0) { L.disp = Math.round(target + (flowFrac > 0 ? (Math.random() - 0.5) * 2 : 0)); L.dispT = 0.12; }
      }
      if (L.tareFlash > 0) L.tareFlash -= dt;
    }
    function _bowlRimY() {
      var t = L.t;
      return t.dial ? L.sy + L.sw * 0.03 - L.bowlR * 0.72 : L.sy + L.sw * 0.13 * 0.35 - L.bowlR * 0.72;
    }
    function _packetMouth() { return { x: L.mouth.x + (L.ang - 1.3) * 8, y: L.mouth.y + (L.ang - 1.3) * 10 }; }

    function _drawScale() {
      var ctx = L.ctx, t = L.t, cx = L.scx, w = L.sw;
      var topY = t.dial ? L.sy : L.sy;
      if (t.dial) A.drawDialScale(ctx, cx, topY, w, L.needle, 1000);
      else A.drawDigitalScale(ctx, cx, topY, w, L.disp, true, L.tareFlash > 0);
      // bowl on the platform
      var br = L.bowlR, by = _bowlRimY();
      var amt = Math.min(1, L.food / Math.max(150, t.target * 1.6));
      L.pileY = by + br * 0.1 - br * 0.25 * amt;
      A.drawBowl(ctx, cx, by, br, amt, t.food, {});
      var m = _packetMouth();
      A.drawGrains(ctx, L.grains, t.food);
      A.drawPacket(ctx, t.food, m.x, m.y, L.ang, L.srcScale);
    }

    function tare() {
      _unlock();
      L.tare = L.bowlW + L.food; L.tared = true; L.tareFlash = 0.25;
      if (!L.t.dial) L.disp = 0;
      sfx('click');
    }
    function lessScale() { L.less = (L.less || 0) + 5; sfx('click'); }
    function checkScale() {
      var t = L.t, food = L.food, err = Math.abs(food - t.target);
      var reading = Math.round(L.bowlW + food - L.tare);
      var tol = t.dial ? 8 : 3;
      var st = err <= tol ? 3 : err <= tol * 3 ? 2 : err <= tol * 7 ? 1 : 0;
      var det = 'You weighed ' + Math.round(food) + ' g of ' + t.food + '. The goal was ' + t.target + ' g.';
      if (!L.tared && t.bowl) det += ' The scale was counting the bowl (' + t.bowl + ' g) too — press TARE with the empty bowl on, before you pour.';
      else if (t.dial) det += ' Read where the needle points between the lines: each small line is 10 g.';
      var msg = st === 3 ? 'Spot on!' : st === 2 ? 'Very close!' : st === 1 ? 'Close.' : (food < t.target ? 'Not enough yet.' : 'Too much.');
      L.lastReading = reading;
      taskResult(t, st, msg, det);
    }

    // ---- COUNT ----
    function _updCount(dt) {
      var t = L.t, a = L.anim;
      var smallMl = t.spoon ? t.small : t.small * 250 / 12;
      if (!a && L.queue > 0) { L.queue--; L.anim = a = { p: 0, poured: 0 }; }
      if (a) {
        a.p += dt / 1.4;
        var flowing = a.p > 0.38 && a.p < 0.8;
        if (flowing) {
          var add = smallMl * dt / (0.42 * 1.4);
          a.poured += add; L.vol += add;
          L.streamOn = true; L.streamTop = null; L.flowW = t.spoon ? 2.4 : 4;
        } else if (L.streamOn) { L.streamOn = false; L.streamTop = L.cupMouth ? L.cupMouth.y : 0; L.streamV = 0; }
        if (a.p >= 1) {
          L.vol += (smallMl - a.poured);
          L.n++; L.anim = null; _hud();
        }
      }
      if (L.streamTop != null) { L.streamV += 900 * dt; L.streamTop += L.streamV * dt; }
      L.shown += (L.vol - L.shown) * Math.min(1, dt * 9);
      _impactFx(dt, L.streamOn ? 0.5 : 0, 'water');
    }

    function _drawCount() {
      var ctx = L.ctx, t = L.t, J = L.J, a = L.anim;
      var level = L.shown > 0.05 ? J.yFor(L.shown) : J.floor;
      var bigMl = t.spoon ? t.big : t.big * 250 / 12;
      A.drawJug(ctx, { J: J, vol: L.shown, liquid: 'water', marks: L.marks, unitL: t.spoon ? '' : 'ml', unitR: t.spoon ? '' : 'CUPS',
        marker: _tier === 'beginner' ? bigMl : null, ripples: L.ripples, bubbles: L.bubbles, backdrop: L.bg, W: L.W, H: L.H, spout: !t.spoon });
      // the small measure
      var r = t.spoon ? Math.max(12, J.rB * 0.5) : Math.max(16, J.rB * 0.6 * Math.cbrt(t.small / 6));
      var home = { x: L.W * 0.18, y: L.counterY + (L.H - L.counterY) * 0.45 };
      var over = { x: J.cx - J.rT - r * 0.4, y: J.top - r * 1.4 };
      var pos = home, rot = 0;
      if (a) {
        var p = a.p;
        if (p < 0.3) { var q = _ease(p / 0.3); pos = { x: _lerp(home.x, over.x, q), y: _lerp(home.y, over.y, q) }; }
        else if (p < 0.85) { pos = over; rot = 1.9 * _ease((p - 0.3) / 0.12); }
        else { var q3 = _ease((p - 0.85) / 0.15); pos = { x: _lerp(over.x, home.x, q3), y: _lerp(over.y, home.y, q3) }; rot = 1.9 * (1 - q3); }
      }
      ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(rot);
      // mirrored so the handle trails behind while tipping right
      A.drawCup(ctx, 0, 0, r, t.spoon ? '1 tsp' : fracStr(red([t.small, 12])) + ' CUP', a && a.p < 0.6 ? { food: 'sugar', frac: 0 } : null, { spoon: !!t.spoon, noShadow: !!a });
      ctx.restore();
      // stream from the cup lip
      var lip = { x: pos.x + Math.cos(rot) * r, y: pos.y + Math.sin(rot) * r };
      L.cupMouth = lip;
      if (L.streamOn || L.streamTop != null) {
        var end = A.drawStream(ctx, 'water', lip.x, lip.y, 40, level - 1, L.flowW || 3, L.time, L.streamTop);
        if (end) L.impact = { x: end[0], y: level }; else { L.streamTop = null; L.impact = null; }
      } else L.impact = null;
      A.drawDrops(ctx, L.drops, 'water');
    }

    function pourOne() { if (!L || L.done) return; _unlock(); L.queue = Math.min(3, L.queue + 1); sfx('click'); }
    function answer(n, btn) {
      var t = L.t;
      L.tries++;
      if (n === t.answer) {
        var st = L.tries === 1 ? 3 : L.tries === 2 ? 2 : 1;
        if (btn) btn.classList.add('right');
        var what = t.spoon ? '1 tablespoon = 3 teaspoons (3 × 5 ml = 15 ml).' :
          t.answer + ' × ' + fracStr(red([t.small, 12])) + ' cup = ' + fmtCups12(t.big) + '.';
        taskResult(t, st, 'Yes! ' + t.answer + '.', what);
      } else {
        sfx('wrong');
        if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
        try { ZsDialog.toast(L.n ? 'Count the pours — keep going until the line.' : 'Pour them in and count!'); } catch (e) {}
      }
    }

    // ---- HUD + controls state ----
    function _hud() {
      var el = document.getElementById('ck-hud');
      if (!el || !L) return;
      var t = L.t, h = '';
      if (t.scene === 'cups') {
        var a = L.active;
        h = a && a.phase === 'heaped' ? '🔪 Drag the knife across to level it' :
          a && a.phase === 'level' ? '✓ Level! Now tip it into the bowl' :
          L.scoops.length ? 'In the bowl: ' + L.scoops.map(function(s) { return fracStr(red([s.s, 12])) + (s.heaped ? '⚠' : ''); }).join(' + ') : 'Tap a cup to scoop';
      } else if (t.scene === 'count') {
        h = 'Poured: <b>' + L.n + '</b>';
      }
      el.innerHTML = h;
      el.hidden = !h;
    }
    function _ctrlState() {
      var a = L.active;
      var lv = document.getElementById('ck-level'), tp = document.getElementById('ck-tip');
      if (lv) lv.disabled = !(a && a.phase === 'heaped');
      if (tp) tp.disabled = !(a && (a.phase === 'heaped' || a.phase === 'level'));
      var cb = document.querySelectorAll('.ck-cupbtn');
      for (var i = 0; i < cb.length; i++) cb[i].disabled = !!a;
      _hud();
    }

    // ---- sound: soft pouring hiss ----
    var _noise = null;
    function _unlock() { _audio(); }
    function _pourSound(level) {
      var c = _ac;
      if (!c) return;
      try {
        if (!_noise) {
          if (level <= 0) return;
          var len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
          var lastOut = 0;
          for (var i = 0; i < len; i++) { var wv = Math.random() * 2 - 1; lastOut = (lastOut + 0.02 * wv) / 1.02; d[i] = lastOut * 3.5; }
          var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
          var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
          var g = c.createGain(); g.gain.value = 0;
          src.connect(bp); bp.connect(g); g.connect(c.destination); src.start();
          _noise = { g: g, bp: bp };
        }
        _noise.g.gain.setTargetAtTime(Math.min(0.25, level * 0.25), c.currentTime, 0.05);
        _noise.bp.frequency.setTargetAtTime(700 + level * 900, c.currentTime, 0.1);
      } catch (e) {}
    }

    function action(act, el) {
      if (!L) return;
      var t = L.t;
      if (act === 'check') {
        if (t.scene === 'jug') checkJug();
        else if (t.scene === 'cups') checkCups();
        else if (t.scene === 'scale') checkScale();
      } else if (act === 'less') { if (t.scene === 'jug') lessJug(); else lessScale(); }
      else if (act === 'cup') pickCup(+el.getAttribute('data-s'));
      else if (act === 'level') levelAuto();
      else if (act === 'tip') tipCup();
      else if (act === 'empty') emptyBowl();
      else if (act === 'tare') tare();
      else if (act === 'one') pourOne();
      else if (act === 'ans') answer(+el.getAttribute('data-n'), el);
    }

    return { start: start, stop: stop, controls: controls, action: action,
      _state: function() { return L; } };
  })();

  // ── Celebration ──
  function confetti() {
    var box = document.createElement('div');
    box.className = 'ck-confetti'; box.setAttribute('aria-hidden', 'true');
    var cols = ['#F59E0B', '#DC2626', '#10B981', '#2563EB', '#F472B6', '#FDE047'];
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('span');
      s.style.left = (Math.random() * 100) + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      s.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      s.style.transform = 'rotate(' + Math.round(Math.random() * 360) + 'deg)';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(function() { if (box.parentNode) box.parentNode.removeChild(box); }, 3200);
  }

  // ── Events (one delegated listener) ──
  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act],[data-lab]') : null;
    if (!el || el.disabled) return;
    var lab = el.getAttribute('data-lab');
    if (lab) { Lab.action(lab, el); return; }
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (act) {
      case 'tab': go('home', { tab: id }); break;
      case 'home': go('home', { tab: 'recipes' }); break;
      case 'skills': go('home', { tab: 'skills' }); break;
      case 'recipe': {
        var r = _recipe(id);
        if (!document.getElementById('ck-cook').hidden) closeCook(true);
        go('recipe', { recipe: id, servings: r ? r.yield.n : 0, showMath: _tier === 'advanced' || _tier === 'expert' });
        break;
      }
      case 'serv': {
        var rr = _recipe(S.recipe), dd = +el.getAttribute('data-d');
        S.servings = Math.max(rr.yield.min, Math.min(rr.yield.max, S.servings + dd * rr.yield.step));
        sfx('click');
        var y = window.scrollY; render(); window.scrollTo(0, y);
        break;
      }
      case 'cook': sfx('click'); openCook(); break;
      case 'cookclose': closeCook(false); break;
      case 'next': if (Cook.i < Cook.r.steps.length - 1) { Cook.i++; sfx('click'); drawCook(); if (Cook.autoRead) speakStep(); } break;
      case 'prev': if (Cook.i > 0) { Cook.i--; sfx('click'); drawCook(); if (Cook.autoRead) speakStep(); } break;
      case 'jump': Cook.i = +el.getAttribute('data-i'); drawCook(); break;
      case 'say': speakStep(); break;
      case 'autoread': Cook.autoRead = !Cook.autoRead; drawCook(); if (Cook.autoRead) speakStep(); break;
      case 'tgo': timerGo(); break;
      case 'treset': timerReset(); break;
      case 'tstop': timerStop(); break;
      case 'done': cookDone(); break;
      case 'rate': rateCook(+el.getAttribute('data-n')); break;
      case 'task': go('task', { task: id }); break;
      case 'eggs': startEggs(); break;
      case 'eggpick': eggPick(id, el); break;
      case 'safety': startSafety(); break;
      case 'qpick': qPick(+el.getAttribute('data-i')); break;
      case 'qnext': qNext(); break;
    }
  }
  function onChange(e) {
    if (e.target && e.target.id === 'ck-math') {
      S.showMath = !!e.target.checked;
      var y = window.scrollY; render(); window.scrollTo(0, y);
    }
  }

  function init() {
    _user = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    _age = (_user && +_user.age) || 8;
    _tier = (typeof getAgeTier === 'function') ? getAgeTier(_age) : 'intermediate';
    wrap = document.getElementById('ck-wrap');
    if (!wrap) return;
    if (typeof CloudSync !== 'undefined' && CloudSync.online && _key()) {
      try { CloudSync.pull(_key()); } catch (e) {}
    }
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !document.getElementById('ck-cook').hidden && !document.querySelector('.zsd-overlay')) closeCook(false);
    });
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    starsOf: starsOf, scaleIng: scaleIng, fuzzyHas: fuzzyHas, menuMatches: menuMatches, fracStr: fracStr,
    _lab: function() { return Lab._state(); }
  };
})();
