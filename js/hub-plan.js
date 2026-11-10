/* ================================================================
   HUB PLAN — hub-plan.js
   What each kid sees on the hub, and what to try today.

   - "Today's 3": three suggestions per kid per day, from the Smart
     Schedule, what the kid has not done lately (the activity log) and
     the subjects they have the fewest stars in. Picked once a day, so a
     suggestion that gets done shows a ✓ instead of changing.
   - Age 5 and under: about 8 large picture cards, the rest behind
     "More apps" (a parent can lock it).
   - Older: the full set, grouped by subject in sections that fold.
   - Parents Corner: which apps each kid sees, and the minimum age of
     each app. A parent can still open any app from there.

   One catalog below says where each app belongs. Every hub card is in
   it; a card that is not still shows, under "More".
   ================================================================ */

var HubPlan = (function() {
  'use strict';

  var GROUPS = [
    { id: 'math',    icon: '🧮', es: 'Matemáticas y lógica',   en: 'Math & Logic' },
    { id: 'science', icon: '🔬', es: 'Ciencia e ingeniería',   en: 'Science & Engineering' },
    { id: 'reading', icon: '📖', es: 'Lectura e idiomas',      en: 'Reading & Languages' },
    { id: 'world',   icon: '🌍', es: 'Mundo e historia',       en: 'World & History' },
    { id: 'faith',   icon: '⛪', es: 'Fe',                     en: 'Faith' },
    { id: 'arts',    icon: '🎨', es: 'Arte y música',          en: 'Arts & Music' },
    { id: 'money',   icon: '🪙', es: 'Dinero',                 en: 'Money' },
    { id: 'move',    icon: '💪', es: 'Movimiento',             en: 'Move' },
    { id: 'more',    icon: '✨', es: 'Más',                    en: 'More' }
  ];

  // id: the Smart Schedule / star id where the app has one.
  // minAge: a suggestion (a parent can change it); beginner: one of the
  // few for the youngest kids; names: what the app calls itself in the
  // activity log; list: false for the pages that are not activities.
  var APPS = [
    { id: 'math',       href: 'math-galaxy.html',        group: 'math',    minAge: 4,  beginner: true, names: ['math galaxy'] },
    { id: 'guess',      href: 'guess-quest.html',        group: 'math',    minAge: 4,  beginner: true, names: ['guess quest'] },
    { id: 'chess',      href: 'chess-quest.html',        group: 'math',    minAge: 5,  names: ['chess quest'] },
    { id: 'clock',      href: 'que-hora-es.html',        group: 'math',    minAge: 5,  names: ['que hora es', 'clock'] },
    { id: 'calculo',    href: 'calculo-rapido.html',     group: 'math',    minAge: 5,  names: ['calculo rapido'] },
    { id: 'euclid',     href: 'euclid-workshop.html',    group: 'math',    minAge: 8,  names: ['euclid'] },
    { id: 'lab',        href: 'lab-explorer.html',       group: 'science', minAge: 4,  beginner: true, names: ['lab explorer'] },
    { id: 'naturaleza', href: 'naturaleza.html',         group: 'science', minAge: 4,  beginner: true, names: ['naturaleza', 'explorador de naturaleza'] },
    { id: 'cocina',     href: 'cocina-lab.html',         group: 'science', minAge: 6,  names: ['cocina lab'] },
    { id: 'circuit',    href: 'circuit-lab.html',        group: 'science', minAge: 7,  names: ['circuit lab'] },
    { id: 'engineer',   href: 'little-engineer.html',    group: 'science', minAge: 7,  names: ['little engineer'] },
    { id: 'marinero',   href: 'marinero.html',           group: 'science', minAge: 7,  names: ['marinero'] },
    { id: 'secretos',   href: 'mensajes-secretos.html',  group: 'science', minAge: 7,  names: ['mensajes secretos'] },
    { id: 'code',       href: 'code-cadet.html',         group: 'science', minAge: 7,  names: ['code cadet'] },
    { id: 'codelab',    href: 'code-lab.html',           group: 'science', minAge: 9,  names: ['code lab'] },
    { id: 'story',      href: 'story-explorer.html',     group: 'reading', minAge: 4,  beginner: true, names: ['story explorer'] },
    { id: 'lector',     href: 'lector.html',             group: 'reading', minAge: 4,  beginner: true, names: ['lector'] },
    { id: 'vocab',      href: 'vocabulario-vivo.html',   group: 'reading', minAge: 7,  names: ['vocabulario vivo'] },
    { id: 'dictado',    href: 'dictado.html',            group: 'reading', minAge: 6,  names: ['dictado'] },
    { id: 'world',      href: 'world-explorer.html',     group: 'world',   minAge: 5,  names: ['world explorer'] },
    { id: 'arbol',      href: 'arbol-familiar.html',     group: 'world',   minAge: 4,  names: ['arbol familiar'] },
    { id: 'quest',      href: 'quest-adventure.html',    group: 'world',   minAge: 5,  names: ['quest adventure', 'summer quest'] },
    { id: 'linea',      href: 'linea-del-tiempo.html',   group: 'world',   minAge: 5,  names: ['linea del tiempo'] },
    { id: 'chile',      href: 'descubre-chile.html',     group: 'world',   minAge: 6,  names: ['descubre chile'] },
    { id: 'atlas',      href: 'world-atlas.html',        group: 'world',   minAge: 6,  names: ['world atlas'] },
    { id: 'civics',     href: 'civics-lab.html',         group: 'world',   minAge: 8,  names: ['civics lab'] },
    { id: 'faith',      href: 'fe-explorador.html',      group: 'faith',   minAge: 4,  names: ['fe explorador'] },
    { id: 'bible',      href: 'bible-explorer.html',     group: 'faith',   minAge: 7,  names: ['bible explorer'] },
    { id: 'piano',      href: 'little-maestro.html',     group: 'arts',    minAge: 4,  beginner: true, names: ['little maestro'] },
    { id: 'art',        href: 'art-studio.html',         group: 'arts',    minAge: 4,  beginner: true, names: ['art studio'] },
    { id: 'guitar',     href: 'guitar-jam.html',         group: 'arts',    minAge: 6,  names: ['guitar jam'] },
    { id: 'bank',       href: 'banco.html',              group: 'money',   minAge: 5,  names: ['banco familia'], list: false },
    { id: 'money',      href: 'money-master.html',       group: 'money',   minAge: 6,  names: ['money master'] },
    { id: 'negocio',    href: 'mi-negocio.html',         group: 'money',   minAge: 8,  names: ['mi negocio'] },
    { id: 'invest',     href: 'invest-quest.html',       group: 'money',   minAge: 9,  names: ['invest quest'] },
    { id: 'move',       href: 'move-quest.html',         group: 'move',    minAge: 4,  beginner: true, names: ['move quest'] },
    { id: 'sports',     href: 'sports-arena.html',       group: 'move',    minAge: 5,  names: ['sports arena'] },
    { id: 'worldcup',   href: 'world-cup.html',          group: 'move',    minAge: 6,  names: ['world cup'] },
    { id: 'review',     href: 'repaso.html',             group: 'reading', minAge: 5,  names: ['repaso'] },
    { id: 'trophy',     href: 'trophy-room.html',        group: 'more',    minAge: 4,  names: [], list: false },
    { id: 'bmcheck',    href: 'book-movie-check.html',   group: 'more',    minAge: 8,  names: ['book & movie check'], list: false },
    { id: 'patron',     href: 'patron-lancha.html',      group: 'more',    minAge: 11, names: [], list: false }
  ];

  var MINAGE_KEY = 'zs_hub_minage';
  var DAY = 86400000;

  function _byId(id) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i];
    return null;
  }
  function _byHref(href) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].href === href) return APPS[i];
    return null;
  }
  function _group(id) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i];
    return GROUPS[GROUPS.length - 1];
  }
  function _tr(es, en) { return typeof zsT === 'function' ? zsT(es, en) : en; }
  function _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ── Settings ──
  function _minAges() {
    try { return JSON.parse(localStorage.getItem(MINAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function minAge(id) {
    var o = _minAges();
    var n = Number(o[id]);
    if (o[id] !== undefined && isFinite(n)) return n;
    var app = _byId(id);
    return app ? app.minAge : 0;
  }
  function setMinAge(id, age) {
    var o = _minAges();
    var n = Math.max(0, Math.min(18, Math.round(Number(age))));
    if (!isFinite(n)) return;
    if (_byId(id) && _byId(id).minAge === n) delete o[id]; else o[id] = n;
    try {
      localStorage.setItem(MINAGE_KEY, JSON.stringify(o));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(MINAGE_KEY);
    } catch (e) {}
  }

  function _profile(user) {
    if (!user) return null;
    var list = typeof getProfiles === 'function' ? getProfiles() : [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].name === user.name) return list[i];
    return user;
  }
  function hiddenIds(user) {
    var p = _profile(user);
    return p && Array.isArray(p.hubHidden) ? p.hubHidden : [];
  }
  function moreLocked(user) {
    var p = _profile(user);
    return !!(p && p.hubMoreLocked);
  }
  function isLittle(user) {
    return !!user && typeof getAgeTier === 'function' && getAgeTier(user.age) === 'beginner' && !!user.age;
  }

  // Can this kid see this app at all? (Not the Smart Schedule; that is on top.)
  function allowed(user, app) {
    if (hiddenIds(user).indexOf(app.id) >= 0) return false;
    var age = Number(user && user.age);
    if (age && age < minAge(app.id)) return false;
    return true;
  }

  // ── Today's 3 ──
  function _dateKey(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function _hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function _norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!']/g, '').trim();
  }
  function _appForLogName(name) {
    var n = _norm(name);
    for (var i = 0; i < APPS.length; i++) {
      for (var j = 0; j < APPS[i].names.length; j++) {
        if (n === APPS[i].names[j] || n.indexOf(APPS[i].names[j]) === 0) return APPS[i];
      }
    }
    return null;
  }

  // When each app was last done, and which were done today, from the log.
  function _activity(userName, now) {
    var last = {}, today = {};
    var log = typeof ActivityLog !== 'undefined' ? ActivityLog.getForUser(userName) : [];
    var todayKey = _dateKey(now);
    log.forEach(function(e) {
      if (!e || !e.ts) return;
      var app = _appForLogName(e.app);
      if (!app) return;
      if (!last[app.id] || e.ts > last[app.id]) last[app.id] = e.ts;
      if (_dateKey(new Date(e.ts)) === todayKey) today[app.id] = true;
    });
    return { last: last, today: today };
  }

  // 0 to 2: a bonus for the subjects the kid has the fewest stars in.
  function _weakness(stats) {
    var by = {};
    APPS.forEach(function(app) {
      if (app.group === 'more') return;
      var stars = 0;
      try {
        var data = stats && stats.appStats ? stats.appStats[app.id] : null;
        stars = data && typeof getAppStars === 'function' ? getAppStars(app.id, data) : 0;
      } catch (e) {}
      by[app.group] = by[app.group] || { sum: 0, n: 0 };
      by[app.group].sum += stars; by[app.group].n++;
    });
    var groups = Object.keys(by).sort(function(a, b) { return by[a].sum / by[a].n - by[b].sum / by[b].n; });
    var out = {};
    groups.forEach(function(g, i) { out[g] = groups.length > 1 ? 2 * (1 - i / (groups.length - 1)) : 0; });
    return out;
  }

  // Three app ids for today. `eligible` are the ids the kid can see today.
  function pickToday(user, eligible, opts) {
    opts = opts || {};
    var now = opts.now || new Date();
    var act = opts.activity || _activity(user.name, now);
    var weak = _weakness(opts.stats || (typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : null));
    var scheduled = {};
    (opts.scheduled || (typeof AppSchedule !== 'undefined' ? AppSchedule.getTodayApps() : [])).forEach(function(id) { scheduled[id] = true; });
    var dateKey = _dateKey(now);

    // Repaso is only a suggestion when there is something to review.
    var reviewDue = opts.reviewDue != null ? opts.reviewDue
      : (typeof Review !== 'undefined' && Review.dueCount ? Review.dueCount(user.name) : 0);
    var cands = eligible.map(_byId).filter(function(a) {
      return a && a.list !== false && !act.today[a.id] && (a.id !== 'review' || reviewDue > 0);
    });
    var score = {};
    cands.forEach(function(a) {
      var days = act.last[a.id] ? Math.min(14, (now.getTime() - act.last[a.id]) / DAY) : 14;
      score[a.id] = (scheduled[a.id] ? 3 : 0) + (days / 14) * 3 + (weak[a.group] || 0) +
        (_hash(dateKey + '|' + user.name + '|' + a.id) % 100) / 100;
      if (a.id === 'review') score[a.id] += 5;   // what slipped by comes first
    });
    cands.sort(function(a, b) { return score[b.id] - score[a.id]; });

    // Three, no more than two from one subject.
    var picks = [], perGroup = {};
    cands.forEach(function(a) {
      if (picks.length >= 3 || (perGroup[a.group] || 0) >= 2) return;
      picks.push(a.id); perGroup[a.group] = (perGroup[a.group] || 0) + 1;
    });
    cands.forEach(function(a) { if (picks.length < 3 && picks.indexOf(a.id) < 0) picks.push(a.id); });
    return picks;
  }

  // The 3 for today, kept for the day (so a ✓ can appear on it).
  function todays3(user, eligible, opts) {
    opts = opts || {};
    var now = opts.now || new Date();
    var key = 'zs_today3_' + user.name.toLowerCase().replace(/\s+/g, '_');
    var dateKey = _dateKey(now);
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved && saved.date === dateKey && Array.isArray(saved.ids) && saved.ids.length &&
          saved.ids.every(function(id) { return eligible.indexOf(id) >= 0; })) return saved.ids;
    } catch (e) {}
    var ids = pickToday(user, eligible, opts);
    try { localStorage.setItem(key, JSON.stringify({ date: dateKey, ids: ids })); } catch (e) {}
    return ids;
  }

  // ── The hub ──
  var _cards = null;       // every card, found once, so moving them is safe
  var _holder = null;

  function _findCards() {
    if (_cards) return _cards;
    _cards = Array.prototype.slice.call(document.querySelectorAll('#app-grid a.app-card'));
    return _cards;
  }
  // The name on the app's hub card, for lists in Parents Corner.
  function nameOf(app) {
    var el = document.querySelector('a.app-card[href="' + app.href + '"] .card-title');
    return el ? el.textContent.trim() : app.id;
  }
  function _title(card) { var t = card.querySelector('.card-title'); return t ? t.textContent.trim() : ''; }
  function _icon(card) { var i = card.querySelector('.card-icon'); return i ? i.innerHTML : ''; }
  function _shown(card) { return card.style.display !== 'none'; }

  function _groupOpen(user, gid) {
    try { var o = JSON.parse(localStorage.getItem('zs_hub_fold_' + user.name.toLowerCase().replace(/\s+/g, '_'))) || {}; return o[gid] !== false; }
    catch (e) { return true; }
  }
  function _setGroupOpen(user, gid, open) {
    var k = 'zs_hub_fold_' + user.name.toLowerCase().replace(/\s+/g, '_');
    var o = {};
    try { o = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) {}
    o[gid] = open;
    try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {}
  }

  function render(user) {
    var grid = document.getElementById('app-grid');
    if (!grid || !user) return;
    var cards = _findCards();
    if (!_holder) {
      _holder = document.createElement('div');
      _holder.id = 'hub-hidden';
      _holder.hidden = true;
      grid.parentNode.insertBefore(_holder, grid);
    }
    var old = document.getElementById('hub-today');
    if (old) old.remove();
    var oldMore = document.getElementById('hub-more-wrap');
    if (oldMore) oldMore.remove();

    // Which cards this kid sees today: the Smart Schedule has already hidden
    // some by setting display; the plan hides more.
    var mine = [];
    cards.forEach(function(card) {
      var app = _byHref(card.getAttribute('href'));
      if (!app) app = { id: card.getAttribute('href'), href: card.getAttribute('href'), group: 'more', minAge: 0, names: [] };
      card.__app = app;
      var ok = allowed(user, app);
      // Faith keeps its own per-kid switch.
      if (app.id === 'faith' && user.faithVisible === false) ok = false;
      if (ok && _shown(card)) mine.push(card);
      else _holder.appendChild(card);
    });

    var little = isLittle(user);
    grid.className = 'app-grid' + (little ? ' hub-little' : ' hub-grouped');
    grid.innerHTML = '';

    var eligible = mine.map(function(c) { return c.__app.id; });
    _renderToday(user, grid, mine, eligible, little);

    if (little) {
      var main = mine.filter(function(c) { return c.__app.beginner; });
      var rest = mine.filter(function(c) { return !c.__app.beginner; });
      main.forEach(function(c) { _labelForLittle(c); grid.appendChild(c); });
      if (rest.length) {
        var wrap = document.createElement('div');
        wrap.id = 'hub-more-wrap';
        wrap.innerHTML = '<button type="button" class="hub-more-btn" id="hub-more-btn" aria-expanded="false">' +
          (moreLocked(user) ? '🔒 ' : '') + _esc(_tr('Más apps', 'More apps')) + ' ▾</button>' +
          '<div class="app-grid hub-more" id="hub-more" hidden></div>';
        grid.parentNode.insertBefore(wrap, grid.nextSibling);
        var more = wrap.querySelector('#hub-more');
        rest.forEach(function(c) { more.appendChild(c); });
        wrap.querySelector('#hub-more-btn').onclick = function() {
          var open = function() {
            var b = document.getElementById('hub-more-btn');
            var hidden = more.hidden;
            more.hidden = !hidden;
            b.setAttribute('aria-expanded', hidden ? 'true' : 'false');
          };
          if (moreLocked(user) && more.hidden && typeof requestPinThen === 'function') requestPinThen(open);
          else open();
        };
      }
    } else {
      GROUPS.forEach(function(g) {
        var inGroup = mine.filter(function(c) { return c.__app.group === g.id; });
        if (!inGroup.length) return;
        var d = document.createElement('details');
        d.className = 'hub-group';
        d.setAttribute('data-group', g.id);
        if (_groupOpen(user, g.id)) d.open = true;
        d.innerHTML = '<summary><span class="hub-group-icon">' + g.icon + '</span> ' +
          '<span class="hub-group-name">' + _esc(_tr(g.es, g.en)) + '</span> ' +
          '<span class="hub-group-count">' + inGroup.length + '</span></summary><div class="app-grid hub-group-grid"></div>';
        d.addEventListener('toggle', function() { _setGroupOpen(user, g.id, d.open); });
        var inner = d.querySelector('.hub-group-grid');
        inGroup.forEach(function(c) { inner.appendChild(c); });
        grid.appendChild(d);
      });
    }
    if (typeof ZsLang !== 'undefined') ZsLang.apply();
    if (typeof ZsSpeak !== 'undefined') ZsSpeak.scan();
  }

  // For the youngest: a picture, the name, a 🔊, and tap once to hear it.
  function _labelForLittle(card) {
    var title = card.querySelector('.card-title');
    if (title) title.setAttribute('data-speak', _title(card));
    card.setAttribute('data-zs-choice', '1');
    card.setAttribute('data-say-text', _title(card));
  }

  function _renderToday(user, grid, mine, eligible, little) {
    var ids = todays3(user, eligible);
    if (!ids.length) return;
    var done = _activity(user.name, new Date()).today;
    var byId = {};
    mine.forEach(function(c) { byId[c.__app.id] = c; });
    var allDone = ids.every(function(id) { return done[id]; });
    var sec = document.createElement('section');
    sec.id = 'hub-today';
    sec.className = 'hub-today' + (little ? ' hub-today-little' : '');
    sec.innerHTML =
      '<h2 class="hub-today-title">⭐ ' + _esc(_tr('Los 3 de hoy', 'Today\'s 3')) + '</h2>' +
      '<div class="hub-today-row">' + ids.map(function(id) {
        var c = byId[id];
        if (!c) return '';
        return '<a class="hub-today-card' + (done[id] ? ' is-done' : '') + '" href="' + _esc(c.getAttribute('href')) + '" data-app="' + _esc(id) + '"' +
          (little ? ' data-zs-choice="1" data-say-text="' + _esc(_title(c)) + '"' : '') + '>' +
          '<span class="hub-today-icon">' + _icon(c) + '</span>' +
          '<span class="hub-today-name">' + _esc(_title(c)) + '</span>' +
          (done[id] ? '<span class="hub-today-check" aria-label="' + _esc(_tr('Hecho', 'Done')) + '">✓</span>' : '') +
          '</a>';
      }).join('') + '</div>' +
      (allDone ? '<p class="hub-today-done">🎉 ' + _esc(_tr('¡Los 3 de hoy están listos!', 'All 3 done today!')) + '</p>' : '');
    grid.parentNode.insertBefore(sec, grid);
  }

  return {
    GROUPS: GROUPS, APPS: APPS,
    minAge: minAge, setMinAge: setMinAge, allowed: allowed, hiddenIds: hiddenIds, moreLocked: moreLocked,
    isLittle: isLittle, pickToday: pickToday, todays3: todays3, render: render,
    appForLogName: _appForLogName, appForHref: _byHref, nameOf: nameOf
  };
})();
