/* ================================================================
   TROPHY ROOM — trophy-room.js
   Aggregation-only. Reads existing localStorage keys via
   getPlayerStats()/getAppStars() and shows each app's earned stars as
   a medal or trophy in a display cabinet, the rank ladder as a
   mountain staircase, and milestone plaques.
   Read-only: no registry, no new storage writes.
   ================================================================ */

var TrophyRoom = (function() {
  'use strict';

  // App badge metadata. Mirrors the app ids used by getPlayerStats().
  // `threshold` = stars required to consider the badge "earned".
  // `href` = the app's page. `tiers` (optional) = [silver, gold] star
  // counts; apps without it use DEFAULT_TIERS.
  var APP_BADGES = [
    { id: 'math',    name: 'Math Galaxy',     emoji: '🧮', color: '#60A5FA', threshold: 1, href: 'math-galaxy.html' },
    { id: 'chile',   name: 'Descubre Chile',  emoji: '🇨🇱', color: '#F87171', threshold: 1, href: 'descubre-chile.html' },
    { id: 'chess',   name: 'Chess Quest',     emoji: '♟️',  color: '#FBBF24', threshold: 1, href: 'chess-quest.html' },
    { id: 'piano',   name: 'Little Maestro',  emoji: '🎹', color: '#A78BFA', threshold: 1, href: 'little-maestro.html' },
    { id: 'faith',   name: 'Fe Explorador',   emoji: '⛪',  color: '#F59E0B', threshold: 1, href: 'fe-explorador.html' },
    { id: 'guitar',  name: 'Guitar Jam',      emoji: '🎸', color: '#34D399', threshold: 1, href: 'guitar-jam.html' },
    { id: 'art',     name: 'Art Studio',      emoji: '🎨', color: '#F472B6', threshold: 1, href: 'art-studio.html' },
    { id: 'sports',  name: 'Sports Arena',    emoji: '🏓', color: '#10B981', threshold: 1, href: 'sports-arena.html' },
    { id: 'lab',     name: 'Lab Explorer',    emoji: '🔬', color: '#6EE7B7', threshold: 1, href: 'lab-explorer.html' },
    { id: 'world',   name: 'World Explorer',  emoji: '🌍', color: '#3B82F6', threshold: 1, href: 'world-explorer.html' },
    { id: 'story',   name: 'Story Explorer',  emoji: '📚', color: '#8B5CF6', threshold: 1, href: 'story-explorer.html' },
    { id: 'guess',   name: 'Guess Quest',     emoji: '🎯', color: '#FBBF24', threshold: 1, href: 'guess-quest.html' },
    { id: 'worldcup', name: 'World Cup 2026', emoji: '🏆', color: '#16A34A', threshold: 1, href: 'world-cup.html' },
    { id: 'money',   name: 'Money Master',    emoji: '💰', color: '#FBBF24', threshold: 1, href: 'money-master.html' },
    { id: 'invest',  name: 'Invest Quest',    emoji: '📈', color: '#22C55E', threshold: 1, href: 'invest-quest.html' },
    { id: 'bible',   name: 'Bible Explorer',  emoji: '📖', color: '#C084FC', threshold: 1, href: 'bible-explorer.html' },
    { id: 'civics',  name: 'Civics Lab',      emoji: '🏛️',  color: '#38BDF8', threshold: 1, href: 'civics-lab.html', tiers: [5, 10] },
    { id: 'codecadet', name: 'Code Cadet',    emoji: '🤖', color: '#94A3B8', threshold: 1, href: 'code-cadet.html' },
    { id: 'vocab',   name: 'Vocabulario Vivo', emoji: '📚', color: '#FB923C', threshold: 1, href: 'vocabulario-vivo.html' },
    { id: 'circuit', name: 'Circuit Lab',     emoji: '⚡', color: '#F59E0B', threshold: 1, href: 'circuit-lab.html' },
    { id: 'engineer', name: 'Little Engineer', emoji: '🌉', color: '#D97706', threshold: 1, href: 'little-engineer.html' },
    { id: 'negocio', name: 'Mi Negocio', emoji: '🥟', color: '#D9480F', threshold: 1, href: 'mi-negocio.html' },
    { id: 'secretos', name: 'Mensajes Secretos', emoji: '🔐', color: '#B8862F', threshold: 1, href: 'mensajes-secretos.html' },
    { id: 'clock', name: '¿Qué Hora Es?', emoji: '🕰️', color: '#C8952F', threshold: 1, href: 'que-hora-es.html' },
    { id: 'naturaleza', name: 'Explorador de Naturaleza', emoji: '🦅', color: '#4B6A33', threshold: 1, href: 'naturaleza.html' },
    { id: 'euclid', name: "Euclid's Workshop", emoji: '📐', color: '#B8862B', threshold: 1, href: 'euclid-workshop.html' },
    { id: 'cocina', name: 'Cocina Lab', emoji: '👩‍🍳', color: '#B45309', threshold: 1, href: 'cocina-lab.html' },
    { id: 'calculo', name: 'Cálculo Rápido', emoji: '🧮', color: '#0F766E', threshold: 1, href: 'calculo-rapido.html' },
    { id: 'marinero', name: 'Marinero', emoji: '🪢', color: '#C9A227', threshold: 1, href: 'marinero.html' },
    { id: 'review', name: 'Repaso', emoji: '🔁', color: '#0D9488', threshold: 1, href: 'repaso.html' },
    { id: 'dictado', name: 'Dictado', emoji: '✍️', color: '#4F46E5', threshold: 1, href: 'dictado.html' },
    { id: 'challenge', name: 'Sibling Challenges', emoji: '🤝', color: '#0EA5E9', threshold: 1, href: 'index.html' }
  ];

  // Stars for silver and gold (bronze = the badge's threshold).
  var DEFAULT_TIERS = [5, 15];

  // Mirror of RANKS in auth.js so we can show the progression.
  var RANKS = [
    { minStars: 0,   icon: '🛸', name: 'Cadet' },
    { minStars: 15,  icon: '🌟', name: 'Apprentice' },
    { minStars: 30,  icon: '🛡️', name: 'Veteran' },
    { minStars: 60,  icon: '🌍', name: 'Explorer' },
    { minStars: 100, icon: '🚀', name: 'Pilot' },
    { minStars: 150, icon: '🌌', name: 'Astronaut' },
    { minStars: 250, icon: '💎', name: 'Elite' },
    { minStars: 500, icon: '👑', name: 'Grand Master' }
  ];

  // Plaques on the wall. `val(ctx)` reads the number, `goal` is the target.
  var MILESTONES = [
    { id: 'star1',   icon: '⭐', name: 'First Star',     desc: 'Earn your first star',      goal: 1,   val: function(c) { return c.total; } },
    { id: 'star25',  icon: '🌟', name: '25 Stars',       desc: 'Earn 25 stars in all',      goal: 25,  val: function(c) { return c.total; } },
    { id: 'star100', icon: '💫', name: '100 Stars',      desc: 'Earn 100 stars in all',     goal: 100, val: function(c) { return c.total; } },
    { id: 'star250', icon: '✨', name: '250 Stars',      desc: 'Earn 250 stars in all',     goal: 250, val: function(c) { return c.total; } },
    { id: 'badge1',  icon: '🏅', name: 'First Badge',    desc: 'Earn a badge in any app',   goal: 1,   val: function(c) { return c.badges; } },
    { id: 'badge5',  icon: '🎖️', name: 'Five Badges',    desc: 'Earn badges in 5 apps',     goal: 5,   val: function(c) { return c.badges; } },
    { id: 'badge10', icon: '🧭', name: 'Ten Badges',     desc: 'Earn badges in 10 apps',    goal: 10,  val: function(c) { return c.badges; } },
    { id: 'silver1', icon: '🥈', name: 'First Silver',   desc: 'Reach silver in any app',   goal: 1,   val: function(c) { return c.silver + c.gold; } },
    { id: 'gold1',   icon: '🥇', name: 'First Gold',     desc: 'Win a gold trophy',         goal: 1,   val: function(c) { return c.gold; } },
    { id: 'gold5',   icon: '🏆', name: 'Five Golds',     desc: 'Win gold in 5 apps',        goal: 5,   val: function(c) { return c.gold; } },
    { id: 'allbadges', icon: '👑', name: 'Full Cabinet', desc: 'A badge from every app',    goal: APP_BADGES.length, val: function(c) { return c.badges; } }
  ];

  var _last = null;   // last computed view, for the detail popover

  // Star rules live in auth.js next to getPlayerStats. This used to
  // keep its own copy, which meant a new app could be added there and
  // silently score zero here.
  function _appStars(appId, appStats) {
    var data = appStats[appId] || {};
    if (typeof getAppStars === 'function') return getAppStars(appId, data);
    return data.totalStars || 0;
  }

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _tiers(b) { return (b.tiers && b.tiers.length === 2) ? b.tiers : DEFAULT_TIERS; }

  function _metal(b, stars) {
    if (stars < b.threshold) return null;
    var t = _tiers(b);
    if (stars >= t[1]) return 'gold';
    if (stars >= t[0]) return 'silver';
    return 'bronze';
  }

  function _nextMetal(b, stars) {
    var t = _tiers(b);
    if (stars < b.threshold) return { name: 'Bronze', need: b.threshold - stars };
    if (stars < t[0]) return { name: 'Silver', need: t[0] - stars };
    if (stars < t[1]) return { name: 'Gold', need: t[1] - stars };
    return null;
  }

  function _art(fn) {
    if (typeof TrophyArt === 'undefined') return '';
    try { return fn(TrophyArt) || ''; } catch (e) { return ''; }
  }

  function _columns(width) {
    if (width >= 900) return 7;
    if (width >= 700) return 6;
    if (width >= 520) return 5;
    if (width >= 300) return 4;
    return 3;
  }

  function render() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    var stats = typeof getPlayerStats === 'function' ? getPlayerStats(user.name) : { totalStars: 0, appStats: {} };
    var totalStars = stats.totalStars || 0;
    var appStats = stats.appStats || {};

    // Subtitle personalized (textContent: no markup from the profile)
    var sub = document.getElementById('tr-subtitle');
    if (sub) sub.textContent = user.name + "'s badges, ranks and milestones";

    // Current rank
    var curIdx = 0;
    for (var i = RANKS.length - 1; i >= 0; i--) {
      if (totalStars >= RANKS[i].minStars) { curIdx = i; break; }
    }
    var currentRank = RANKS[curIdx];
    var nextRank = RANKS[curIdx + 1] || null;
    var pct = 1;
    if (nextRank) {
      var span = nextRank.minStars - currentRank.minStars;
      pct = span > 0 ? Math.min(1, Math.max(0, (totalStars - currentRank.minStars) / span)) : 1;
    }

    // Per-app badges
    var view = APP_BADGES.map(function(b) {
      var s = _appStars(b.id, appStats);
      return { b: b, stars: s, metal: _metal(b, s) };
    });
    _last = view;
    var ctx = { total: totalStars, badges: 0, silver: 0, gold: 0 };
    view.forEach(function(v) {
      if (v.metal) ctx.badges++;
      if (v.metal === 'silver') ctx.silver++;
      if (v.metal === 'gold') ctx.gold++;
    });

    // Rank banner
    var banner = document.getElementById('tr-rank-banner');
    if (banner) {
      banner.innerHTML =
        '<div class="tr-rank-head">' +
          '<div class="tr-rank-icon" aria-hidden="true">' + currentRank.icon + '</div>' +
          '<div class="tr-rank-body">' +
            '<div class="tr-rank-label">Current Rank</div>' +
            '<div class="tr-rank-name">' + _esc(currentRank.name) + '</div>' +
            '<div class="tr-rank-stars">⭐ ' + totalStars + ' total star' + (totalStars === 1 ? '' : 's') + '</div>' +
          '</div>' +
          '<div class="tr-rank-count"><strong>' + ctx.badges + '</strong><span>of ' + APP_BADGES.length + ' badges</span></div>' +
        '</div>' +
        '<div class="tr-mountain" id="tr-mountain"></div>';
    }
    _mountainArgs = [RANKS, curIdx, { avatar: user.avatar, color: typeof safeColor === 'function' ? safeColor(user.color) : user.color }, pct];
    _renderMountain();

    // Progress strip
    var strip = document.getElementById('tr-progress-strip');
    if (strip) {
      var labelRight = nextRank
        ? (nextRank.minStars - totalStars) + ' ⭐ to ' + nextRank.name + ' ' + nextRank.icon
        : 'Max rank reached! 👑';
      var ranksHtml = RANKS.map(function(r) {
        var cls = 'tr-ps-rank';
        if (totalStars >= r.minStars) cls += ' earned';
        if (r.name === currentRank.name) cls += ' current';
        return '<span class="' + cls + '" title="' + _esc(r.name) + ' (' + r.minStars + ' ⭐)">' +
          '<span class="tr-ps-icon">' + r.icon + '</span><span class="tr-ps-min">' + r.minStars + '</span></span>';
      }).join('');
      strip.innerHTML =
        '<div class="tr-ps-label"><span>' + _esc(currentRank.name) + '</span><span>' + labelRight + '</span></div>' +
        '<div class="tr-ps-bar"><div class="tr-ps-fill" style="width:' + Math.round(pct * 100) + '%"></div></div>' +
        '<div class="tr-ps-ranks">' + ranksHtml + '</div>';
    }

    _renderCabinet(view);
    _renderMoney(user);

    // Milestone plaques
    var ms = document.getElementById('tr-milestones');
    if (ms) {
      ms.innerHTML = MILESTONES.map(function(m) {
        var v = Math.min(m.goal, m.val(ctx));
        var done = v >= m.goal;
        return '<div class="tr-plaque' + (done ? ' done' : '') + '">' +
          '<span class="tr-screw tl"></span><span class="tr-screw tr"></span><span class="tr-screw bl"></span><span class="tr-screw br"></span>' +
          '<div class="tr-plate">' +
            '<span class="tr-plaque-icon" aria-hidden="true">' + m.icon + '</span>' +
            '<span class="tr-plaque-name">' + _esc(m.name) + '</span>' +
            '<span class="tr-plaque-desc">' + _esc(m.desc) + '</span>' +
            (done ? '<span class="tr-plaque-done">Achieved</span>'
                  : '<span class="tr-plaque-bar"><span style="width:' + Math.round(v / m.goal * 100) + '%"></span></span>' +
                    '<span class="tr-plaque-left">' + v + ' / ' + m.goal + '</span>') +
          '</div></div>';
      }).join('');
    }

    // Next up: first unearned badge
    var nextLabel = document.getElementById('tr-next-label');
    var nextEl = document.getElementById('tr-next');
    if (nextEl) {
      var unearned = view.filter(function(v) { return !v.metal; });
      if (unearned.length > 0) {
        var pick = unearned[0].b;
        nextEl.innerHTML =
          '<div class="tr-next-emoji" aria-hidden="true">' + pick.emoji + '</div>' +
          '<div class="tr-next-body">' +
            '<div class="tr-next-title">Try ' + _esc(pick.name) + '</div>' +
            '<div class="tr-next-desc">Earn your first star to unlock this badge.</div>' +
          '</div>' +
          '<a class="tr-next-link" href="' + _esc(pick.href) + '">Open →</a>';
      } else {
        nextEl.innerHTML = '<div class="tr-next-body" style="text-align:center;width:100%;">' +
          '<div class="tr-next-title">🎉 Every app badge earned!</div>' +
          '<div class="tr-next-desc">Keep playing to climb the ranks.</div>' +
        '</div>';
      }
      if (nextLabel) nextLabel.style.display = '';
    }
  }

  function _renderCabinet(view, gridId, onOpen) {
    var grid = document.getElementById(gridId || 'tr-grid');
    if (!grid) return;
    onOpen = onOpen || _openDetail;
    var cols = _columns(grid.clientWidth || window.innerWidth);
    grid.setAttribute('data-cols', cols);
    var html = '';
    for (var r = 0; r < view.length; r += cols) {
      html += '<div class="tr-shelf"><div class="tr-shelf-items" style="--cols:' + cols + '">';
      view.slice(r, r + cols).forEach(function(v, k) {
        var b = v.b;
        var label = b.name + ': ' + (v.metal ? (v.metal + (v.sub ? ', ' + v.sub : ', ' + v.stars + ' star' + (v.stars === 1 ? '' : 's'))) : 'locked');
        html += '<button type="button" class="tr-badge ' + (v.metal ? 'earned tr-' + v.metal : 'locked') + '" data-id="' + _esc(b.id) + '"' +
          ' aria-label="' + _esc(label) + '" style="animation-delay:' + ((r + k) * 0.025).toFixed(3) + 's">' +
          '<span class="tr-badge-art">' + _art(function(A) { return A.badge(v.metal, b.emoji, b.color); }) + '</span>' +
          '<span class="tr-nameplate"><span class="tr-badge-name">' + _esc(b.name) + '</span>' +
          (v.metal ? '<span class="tr-badge-stars">' + (v.sub ? _esc(v.sub) : '⭐ ' + v.stars) + '</span>' : '') + '</span>' +
        '</button>';
      });
      html += '</div><div class="tr-glass" aria-hidden="true"></div></div>';
    }
    grid.innerHTML = html;
    // Pop the badges in once; a re-layout on resize should not replay it.
    if (!grid.__animated) { grid.classList.add('tr-anim'); grid.__animated = true; setTimeout(function() { grid.classList.remove('tr-anim'); }, 1600); }
    Array.prototype.forEach.call(grid.querySelectorAll('.tr-badge'), function(btn) {
      btn.addEventListener('click', function() { onOpen(btn.getAttribute('data-id'), btn); });
    });
  }

  // ── Saving & giving badges (Banco Familia) ──
  // Worked out from the bank's own log by BankEngine.badges(); nothing is
  // stored here and they don't count toward stars or the app-badge
  // milestones. Shown only for a kid who has a bank account.
  var _lastMoney = null;
  var MONEY_COLOR = { first: '#10B981', saved50: '#10B981', saved100: '#10B981', saved250: '#10B981',
    months3: '#38BDF8', months6: '#38BDF8', months12: '#38BDF8',
    gift1: '#F472B6', places3: '#F472B6', giveMore: '#F472B6', steady: '#A78BFA' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function _fmtDay(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return '';
    var p = d.split('-');
    return MONTHS[+p[1] - 1] + ' ' + (+p[2]) + ', ' + p[0];
  }
  function _moneyBadges(user) {
    if (typeof BankEngine === 'undefined' || !user) return null;
    try {
      var bank = JSON.parse(localStorage.getItem('zs_bank') || 'null') || {};
      var events = Array.isArray(bank.events) ? bank.events : [];
      if (!BankEngine.accounts(events).some(function(a) { return BankEngine.isMember(a, user.name); })) return null;
      var spx = (JSON.parse(localStorage.getItem('zs_bank_spx') || 'null') || {}).prices || {};
      return BankEngine.badges(events, user.name, spx);
    } catch (e) { return null; }
  }
  function _renderMoney(user) {
    var list = _moneyBadges(user);
    var label = document.getElementById('tr-money-label'), cab = document.getElementById('tr-money-cab');
    if (!label || !cab) return;
    if (!list) { label.style.display = 'none'; cab.style.display = 'none'; _lastMoney = null; return; }
    var got = list.filter(function(b) { return b.earned; }).length;
    label.style.display = ''; cab.style.display = '';
    label.textContent = 'Saving & Giving · ' + got + ' of ' + list.length;
    _lastMoney = list.map(function(b) {
      return { b: { id: b.id, name: b.name, emoji: b.emoji, color: MONEY_COLOR[b.id] || '#10B981', href: 'banco.html' },
        stars: 0, metal: b.earned ? b.metal : null, sub: b.earned ? _fmtDay(b.date) : '', money: b };
    });
    _renderCabinet(_lastMoney, 'tr-money-grid', _openMoneyDetail);
  }
  function _openMoneyDetail(id, from) {
    var v = null;
    (_lastMoney || []).forEach(function(x) { if (x.b.id === id) v = x; });
    if (!v) return;
    _closeDetail();
    _popReturn = from || null;
    var b = v.money;
    var status = b.earned ? (b.metal.charAt(0).toUpperCase() + b.metal.slice(1) + ' · ' + _fmtDay(b.date)) : 'Locked';
    var ov = document.createElement('div');
    ov.className = 'tr-pop-overlay';
    ov.innerHTML =
      '<div class="tr-pop" role="dialog" aria-modal="true" aria-labelledby="tr-pop-title">' +
        '<button type="button" class="tr-pop-close" aria-label="Close">✕</button>' +
        '<div class="tr-pop-art">' + _art(function(A) { return A.badge(v.metal, b.emoji, v.b.color); }) + '</div>' +
        '<h2 id="tr-pop-title">' + _esc(b.name) + '</h2>' +
        '<div class="tr-pop-metal tr-pm-' + (v.metal || 'locked') + '">' + _esc(status) + '</div>' +
        '<p class="tr-pop-next">' + _esc(b.desc) + '.' + (!b.earned && b.goal > 1 ? ' You have ' + (b.id.indexOf('saved') === 0 ? '$' + Math.floor(b.have) : b.have) + ' of ' + (b.id.indexOf('saved') === 0 ? '$' + b.goal : b.goal) + '.' : '') + '</p>' +
        '<a class="tr-next-link tr-pop-open" href="banco.html">Open Banco Familia →</a>' +
      '</div>';
    document.body.appendChild(ov);
    _pop = ov;
    ov.addEventListener('click', function(e) { if (e.target === ov) _closeDetail(); });
    ov.querySelector('.tr-pop-close').addEventListener('click', _closeDetail);
    document.addEventListener('keydown', _onKey, true);
    try { ov.querySelector('.tr-pop-close').focus(); } catch (e) {}
  }

  // ── Badge detail popover ──
  var _pop = null, _popReturn = null;
  function _openDetail(id, from) {
    var v = null;
    (_last || []).forEach(function(x) { if (x.b.id === id) v = x; });
    if (!v) return;
    _closeDetail();
    _popReturn = from || null;
    var b = v.b;
    var next = _nextMetal(b, v.stars);
    var t = _tiers(b);
    var metalName = v.metal ? v.metal.charAt(0).toUpperCase() + v.metal.slice(1) : 'Locked';
    var steps = [
      { name: 'Bronze', at: b.threshold, on: v.stars >= b.threshold },
      { name: 'Silver', at: t[0], on: v.stars >= t[0] },
      { name: 'Gold', at: t[1], on: v.stars >= t[1] }
    ];
    var ov = document.createElement('div');
    ov.className = 'tr-pop-overlay';
    ov.innerHTML =
      '<div class="tr-pop" role="dialog" aria-modal="true" aria-labelledby="tr-pop-title">' +
        '<button type="button" class="tr-pop-close" aria-label="Close">✕</button>' +
        '<div class="tr-pop-art">' + _art(function(A) { return A.badge(v.metal, b.emoji, b.color); }) + '</div>' +
        '<h2 id="tr-pop-title">' + _esc(b.name) + '</h2>' +
        '<div class="tr-pop-metal tr-pm-' + (v.metal || 'locked') + '">' + metalName + ' · ⭐ ' + v.stars + '</div>' +
        '<div class="tr-pop-steps">' + steps.map(function(s) {
          return '<span class="' + (s.on ? 'on' : '') + ' tr-ps-' + s.name.toLowerCase() + '"><b>' + s.name + '</b>' + s.at + ' ⭐</span>';
        }).join('') + '</div>' +
        '<p class="tr-pop-next">' + (next ? next.need + ' more star' + (next.need === 1 ? '' : 's') + ' for ' + next.name + '.' : 'Top metal won. Well done!') + '</p>' +
        '<a class="tr-next-link tr-pop-open" href="' + _esc(b.href) + '">Open ' + _esc(b.name) + ' →</a>' +
      '</div>';
    document.body.appendChild(ov);
    _pop = ov;
    ov.addEventListener('click', function(e) { if (e.target === ov) _closeDetail(); });
    ov.querySelector('.tr-pop-close').addEventListener('click', _closeDetail);
    document.addEventListener('keydown', _onKey, true);
    try { ov.querySelector('.tr-pop-close').focus(); } catch (e) {}
  }
  function _onKey(e) {
    if (!_pop) return;
    if (e.key === 'Escape') { e.preventDefault(); _closeDetail(); }
    else if (e.key === 'Tab') {
      var f = _pop.querySelectorAll('button, a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function _closeDetail() {
    if (!_pop) return;
    if (_pop.parentNode) _pop.parentNode.removeChild(_pop);
    _pop = null;
    document.removeEventListener('keydown', _onKey, true);
    try { if (_popReturn) _popReturn.focus(); } catch (e) {}
    _popReturn = null;
  }

  var _mountainArgs = null, _mountainW = 0;
  // The scene widens with the screen (an iPad or desktop shows a long
  // ridge, a phone a steep one); the steps keep their size.
  function _renderMountain() {
    var el = document.getElementById('tr-mountain');
    if (!el || !_mountainArgs) return;
    var w = el.clientWidth || 360;
    var vbW = Math.min(820, Math.max(360, Math.round(w * 220 / Math.max(200, Math.min(320, w * 0.6)))));
    _mountainW = w;
    el.innerHTML = _art(function(A) {
      return A.mountain(_mountainArgs[0], _mountainArgs[1], _mountainArgs[2], _mountainArgs[3], vbW);
    });
  }

  var _lastCols = 0, _rt = null;
  function _onResize() {
    clearTimeout(_rt);
    _rt = setTimeout(function() {
      var grid = document.getElementById('tr-grid');
      if (!grid || !_last) return;
      var c = _columns(grid.clientWidth || window.innerWidth);
      if (c !== _lastCols) { _lastCols = c; _renderCabinet(_last); if (_lastMoney) _renderCabinet(_lastMoney, 'tr-money-grid', _openMoneyDetail); }
      var m = document.getElementById('tr-mountain');
      if (m && Math.abs(m.clientWidth - _mountainW) > 40) _renderMountain();
    }, 120);
  }

  function init() {
    render();
    var grid = document.getElementById('tr-grid');
    _lastCols = grid ? +grid.getAttribute('data-cols') : 0;
    window.addEventListener('resize', _onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { render: render };
})();
