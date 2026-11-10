/* ================================================================
   MATH GALAXY — game engine with user progress
   Worlds (ranks) → sectors (levels 1–4 + boss) → 10-question missions.
   Art: js/math-galaxy-art.js · models: js/math-galaxy-visuals.js
   Content: js/math-galaxy-data.js · extras: js/math-extras.js

   Saved at zs_mathgalaxy_<kid> (all older fields kept as they were):
     [rank]      = { bestStars, bestPct, plays, lastPlayed }   best mission in that world
                   (rank 'elite' is new and has the same shape)
     sprint / words / duel                                     see math-extras.js
     sectors     = { [rank]: { legacy?, '1'…'4','boss': { stars, pct, plays, last } } }
     missionLog  = { [skill]: { c, n, h, m? } }  correct-without-hint, seen, hinted, mastered date
   The suite's star rule sums bestStars over the top-level entries, so
   the two new maps (no bestStars field) never change a kid's total.
   ================================================================ */

const TOTAL_QUESTIONS = 10;
let currentLevel = '';
let currentSector = '1';
let questions = [];
let currentQ = 0;
let score = 0;
let startTime = 0;

const MG = {
  streak: 0, bestStreak: 0, hints: 0, stats: {}, answered: false, tries: 0,
  ctl: null, visShown: false, map: null, orbit: null, flight: null, arrive: null,
  lastRank: null, results: []
};

/* ---- Shared User System ---- */
function getUserProgressKey() {
  return typeof getUserAppKey === 'function' ? getUserAppKey('zs_mathgalaxy_') : null;
}
function getUserProgress() {
  const key = getUserProgressKey();
  if (!key) return {};
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch { return {}; }
}
function _writeProgress(prog) {
  const key = getUserProgressKey();
  if (!key) return;
  try { localStorage.setItem(key, JSON.stringify(prog)); } catch (e) {}
  if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
}
// Kept for compatibility: records one finished mission for a rank.
function saveUserProgress(level, stars, scorePct) {
  const prog = getUserProgress();
  _bumpRank(prog, level, stars, scorePct);
  _writeProgress(prog);
}
function _bumpRank(prog, level, stars, scorePct) {
  const prev = (prog[level] && typeof prog[level] === 'object') ? prog[level] : { bestStars: 0, bestPct: 0, plays: 0 };
  prog[level] = Object.assign({}, prev, {
    bestStars: Math.max(prev.bestStars || 0, stars),
    bestPct: Math.max(prev.bestPct || 0, scorePct),
    plays: (prev.plays || 0) + 1,
    lastPlayed: new Date().toISOString()
  });
}

function saveMission(rank, sector, stars, pct, stats) {
  const prog = getUserProgress();
  if (!prog.sectors || typeof prog.sectors !== 'object') prog.sectors = {};
  if (!prog.sectors[rank] || typeof prog.sectors[rank] !== 'object') {
    // Remember how far the kid got before worlds had sectors, so old
    // progress keeps its sectors open.
    prog.sectors[rank] = { legacy: (prog[rank] && prog[rank].bestStars) || 0 };
  }
  _bumpRank(prog, rank, stars, pct);
  const rs = prog.sectors[rank];
  const sp = rs[sector] || { stars: 0, pct: 0, plays: 0 };
  rs[sector] = { stars: Math.max(sp.stars || 0, stars), pct: Math.max(sp.pct || 0, pct), plays: (sp.plays || 0) + 1, last: new Date().toISOString() };
  if (!prog.missionLog || typeof prog.missionLog !== 'object') prog.missionLog = {};
  const newly = [];
  Object.keys(stats).forEach(id => {
    const s = stats[id];
    const rec = prog.missionLog[id] || { c: 0, n: 0, h: 0 };
    rec.c += s.c; rec.n += s.n; rec.h += s.h;
    if (!rec.m && rec.c >= 8 && rec.c / rec.n >= 0.75) { rec.m = new Date().toISOString().slice(0, 10); newly.push(id); }
    prog.missionLog[id] = rec;
  });
  _writeProgress(prog);
  return { newly: newly, sectorBest: sp.stars || 0 };
}

function sectorInfo(rankId, prog) {
  prog = prog || getUserProgress();
  const rk = MGData.rankById(rankId);
  const rs = (prog.sectors && prog.sectors[rankId]) || null;
  const legacy = rs ? (rs.legacy || 0) : ((prog[rankId] && prog[rankId].bestStars) || 0);
  const out = rk.sectors.map(s => {
    const r = (rs && rs[s.id]) || {};
    return { id: s.id, name: s.name, es: s.es, skills: s.skills, boss: !!s.boss, stars: r.stars || 0, pct: r.pct || 0, plays: r.plays || 0 };
  });
  out.forEach((s, i) => {
    if (i === 0) s.locked = false;
    else if (s.boss) s.locked = !(legacy >= 3 || out.slice(0, i).every(x => x.stars >= 2));
    else s.locked = !(legacy >= 2 || out[i - 1].stars >= 2);
  });
  return out;
}

/* ---- helpers ---- */
function tier() {
  const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
  return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate';
}
function kidColor() {
  const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
  return MGArt.safeColor(u && u.color, '#7C3AED');
}
function recommendedRank(age) {
  if (!age) return null;
  return age <= 5 ? 'cadet' : age <= 7 ? 'explorer' : age <= 9 ? 'pilot' : age <= 11 ? 'commander' : 'elite';
}
function esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function starsHtml(n, max, cls) {
  let h = '';
  for (let i = 0; i < (max || 3); i++) h += '<span class="mg-star ' + (cls || '') + '">' + MGArt.icon(i < n ? 'star' : 'starEmpty') + '</span>';
  return '<span class="mg-stars" role="img" aria-label="' + n + ' of ' + (max || 3) + ' stars">' + h + '</span>';
}
function rankIndex(id) { return MGData.RANKS.findIndex(r => r.id === id); }

/* ---- Screen management ---- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

/* ---- Feedback ---- */
function showFeedback(text, kind) {
  const el = document.getElementById('feedback');
  if (!el) return;
  const inner = el.querySelector('span') || el;
  inner.textContent = text;
  el.className = 'feedback show ' + (kind || '');
  clearTimeout(showFeedback._t);
  showFeedback._t = setTimeout(() => el.classList.remove('show'), 1000);
}

/* ================================================================
   HOME — galaxy map + world cards
   ================================================================ */
function initUserUI() {
  const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
  if (user) {
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.pull(getUserProgressKey());
    const greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = `Let's go, ${user.name}!`;
  }
  buildHome();
}

function buildHome() {
  const grid = document.getElementById('rankGrid');
  if (!grid) return;
  const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
  const rec = recommendedRank(user && user.age);
  ZsCanvas.releaseIn(grid); // free the old planet thumbnails now
  grid.innerHTML = MGData.RANKS.map(r => {
    const isRec = r.id === rec;
    return '<button type="button" class="level-card card-' + r.id + (isRec ? ' recommended' : '') + '" data-rank="' + r.id + '" style="--card-color:' + r.color + '">' +
      '<canvas class="rank-planet" data-planet="' + r.planet + '" aria-hidden="true"></canvas>' +
      '<span class="rank-body">' +
        '<span class="rank-name">' + r.name + '</span>' +
        '<span class="rank-world">' + r.world + ' · ages ' + r.ages + '</span>' +
        '<span class="rank-topics">' + r.topics + '</span>' +
        '<span class="rank-sectors" id="sec-' + r.id + '"></span>' +
        '<span class="best-badge empty" id="best-' + r.id + '">No missions yet</span>' +
        (isRec ? '<span class="rec-badge">Recommended for age ' + esc(user.age) + '</span>' : '') +
      '</span>' +
    '</button>';
  }).join('');
  grid.querySelectorAll('.level-card').forEach(b => b.addEventListener('click', () => openRank(b.dataset.rank, true)));
  requestAnimationFrame(() => grid.querySelectorAll('canvas.rank-planet').forEach(c => MGArt.thumb(c, c.dataset.planet)));
  renderBestScores();
  buildMap(rec);
}

function buildMap(rec) {
  const cv = document.getElementById('mgMap');
  const labels = document.getElementById('mgMapLabels');
  if (!cv || !labels) return;
  const recIdx = rec ? rankIndex(rec) + 1 : 1;
  const cur = MG.lastRank ? rankIndex(MG.lastRank) + 1 : recIdx;
  if (MG.map) { MG.map.set({ current: cur, highlight: recIdx, color: kidColor() }); return; }
  MG.map = MGArt.scene(cv, {
    mode: 'map', current: cur, highlight: recIdx, color: kidColor(),
    onLayout(layout) {
      labels.innerHTML = '';
      layout.bodies.forEach((b, i) => {
        if (i === 0) {
          const tag = document.createElement('span');
          tag.className = 'mg-map-tag home';
          tag.textContent = 'Earth';
          tag.style.left = b.x + 'px'; tag.style.top = (b.y + b.r + 6) + 'px';
          labels.appendChild(tag);
          return;
        }
        const r = MGData.RANKS[i - 1];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mg-map-btn';
        btn.style.left = b.x + 'px'; btn.style.top = b.y + 'px';
        btn.style.width = btn.style.height = Math.max(48, b.r * 2.2) + 'px';
        btn.setAttribute('aria-label', r.world + ' — ' + r.name + ' rank');
        btn.addEventListener('click', () => openRank(r.id, true));
        labels.appendChild(btn);
        const tag = document.createElement('span');
        tag.className = 'mg-map-tag';
        tag.innerHTML = '<b>' + r.name + '</b> ' + r.world;
        tag.style.left = b.x + 'px'; tag.style.top = (b.y + b.r * (r.planet === 'saturn' ? 0.95 : 1) + 6) + 'px';
        labels.appendChild(tag);
      });
    }
  });
}

function renderBestScores() {
  const prog = getUserProgress();
  MGData.RANKS.forEach(r => {
    const el = document.getElementById('best-' + r.id);
    const sec = document.getElementById('sec-' + r.id);
    const data = prog[r.id];
    if (el) {
      if (data && data.bestStars > 0) {
        el.className = 'best-badge';
        el.innerHTML = starsHtml(data.bestStars) + ' <span>' + (data.bestPct || 0) + '%</span>';
      } else {
        el.className = 'best-badge empty';
        el.textContent = 'No missions yet';
      }
    }
    if (sec) {
      const info = sectorInfo(r.id, prog);
      sec.innerHTML = info.map(s => '<i class="pip' + (s.stars >= 2 ? ' done' : s.locked ? '' : ' open') + (s.boss ? ' boss' : '') + '"></i>').join('') +
        '<em>' + info.filter(s => s.stars >= 2).length + ' / ' + info.length + ' sectors</em>';
    }
  });
  const logEl = document.getElementById('best-log');
  if (logEl) {
    const log = prog.missionLog || {};
    const total = Object.keys(MGData.SKILLS).length;
    const m = Object.keys(log).filter(k => log[k] && log[k].m && MGData.SKILLS[k]).length;
    logEl.textContent = m ? m + ' of ' + total + ' skills mastered' : 'Master skills to fill your log';
    logEl.classList.toggle('empty', !m);
  }
}

/* ================================================================
   WORLD — sector beacons
   ================================================================ */
function openRank(rankId, animate) {
  const rk = MGData.rankById(rankId);
  if (!rk) return;
  if (MG.flying) return;
  const to = rankIndex(rankId) + 1;
  const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
  const from = MG.lastRank ? rankIndex(MG.lastRank) + 1 : rankIndex(recommendedRank(user && user.age) || 'cadet') + 1;
  const onHome = document.getElementById('screen-select').classList.contains('active');
  MG.lastRank = rankId;
  let reduce = document.documentElement.classList.contains('zs-a11y-reduce-motion');
  try { reduce = reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (animate && MG.map && onHome && from !== to && !reduce) {
    MG.flying = true;
    MG.map.flyTo(from, to);
    setTimeout(() => { MG.flying = false; renderRank(rankId); }, 750);
    return;
  }
  renderRank(rankId);
}

function renderRank(rankId) {
  const rk = MGData.rankById(rankId);
  currentLevel = rankId;
  const wrap = document.getElementById('rank-wrap');
  const prog = getUserProgress();
  const info = sectorInfo(rankId, prog);
  const best = prog[rankId] && prog[rankId].bestStars ? prog[rankId].bestStars : 0;
  const nextIdx = Math.max(0, info.findIndex(s => !s.locked && s.stars < 3));
  const at = nextIdx < 0 ? info.length - 1 : nextIdx;
  wrap.innerHTML =
    '<div class="mg-bar">' +
      '<button type="button" class="back-btn" id="rankBack" aria-label="Back to the galaxy map">' + MGArt.icon('back') + '</button>' +
      '<div class="mg-bar-title"><h2>' + rk.name + ' · ' + rk.world + '</h2><p>' + rk.es + ' · ages ' + rk.ages + '</p></div>' +
      '<div class="mg-bar-stars">' + starsHtml(best) + '</div>' +
    '</div>' +
    '<div class="mg-orbit-wrap"><canvas id="mgOrbit" aria-hidden="true"></canvas><div class="mg-beacons" id="mgBeacons"></div></div>' +
    '<p class="mg-fact"><b>' + rk.world + ':</b> ' + rk.fact + '</p>' +
    '<div class="sector-list">' + info.map((s, i) => {
      const skills = s.skills.map(id => MGData.SKILLS[id].name);
      const uniq = skills.filter((n, k) => skills.indexOf(n) === k);
      return '<button type="button" class="sector-card' + (s.locked ? ' locked' : '') + (s.boss ? ' boss' : '') + (i === at ? ' next' : '') + '" data-sector="' + s.id + '"' +
        (s.locked ? ' aria-disabled="true"' : '') + '>' +
        '<span class="sector-num">' + (s.boss ? 'B' : s.id) + '</span>' +
        '<span class="sector-body"><span class="sector-name">' + (s.boss ? 'Boss: ' : 'Sector ' + s.id + ': ') + s.name + '</span>' +
        '<span class="sector-es">' + s.es + '</span>' +
        '<span class="sector-skills">' + (s.boss ? 'Every skill on ' + rk.world + ' — harder' : uniq.join(' · ')) + '</span></span>' +
        '<span class="sector-side">' + (s.locked ? '<span class="mg-lock">' + MGArt.icon('lock') + '</span>' : starsHtml(s.stars)) + '</span>' +
      '</button>';
    }).join('') + '</div>';
  document.getElementById('rankBack').addEventListener('click', goHome);
  wrap.querySelectorAll('.sector-card').forEach(b => b.addEventListener('click', () => trySector(rankId, b.dataset.sector)));
  showScreen('rank');
  if (MG.orbit) MG.orbit.destroy();
  const beacons = document.getElementById('mgBeacons');
  MG.orbit = MGArt.scene(document.getElementById('mgOrbit'), {
    mode: 'orbit', planet: rk.planet, color: kidColor(), rocketAt: at,
    beacons: info.map(s => ({ stars: s.stars, locked: s.locked, boss: s.boss })),
    onLayout(layout) {
      beacons.innerHTML = '';
      layout.beacons.forEach((p, i) => {
        const s = info[i];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mg-beacon' + (s.locked ? ' locked' : '') + (s.boss ? ' boss' : '');
        b.style.left = p.x + 'px'; b.style.top = p.y + 'px';
        b.innerHTML = '<span>' + (s.boss ? 'Boss' : s.id) + '</span>';
        b.setAttribute('aria-label', (s.boss ? 'Boss round: ' : 'Sector ' + s.id + ': ') + s.name + (s.locked ? ' (locked)' : ''));
        b.addEventListener('click', () => trySector(rankId, s.id));
        beacons.appendChild(b);
      });
    }
  });
}

function trySector(rankId, sectorId) {
  const info = sectorInfo(rankId);
  const s = info.find(x => x.id === sectorId);
  if (!s) return;
  if (s.locked) {
    const idx = info.indexOf(s);
    const msg = s.boss ? 'Earn 2 stars in every sector to open the boss round.' : 'Earn 2 stars in sector ' + info[idx - 1].id + ' to open this one.';
    if (typeof ZsDialog !== 'undefined' && ZsDialog.toast) ZsDialog.toast(msg);
    return;
  }
  startGame(rankId, sectorId);
}

/* ================================================================
   MISSION
   ================================================================ */
function missionLength() { return tier() === 'beginner' ? 8 : TOTAL_QUESTIONS; }

function startGame(level, sector) {
  const rk = MGData.rankById(level);
  if (!rk) return;
  if (!sector) {
    const info = sectorInfo(level);
    const s = info.find(x => !x.locked && x.stars < 3) || info[0];
    sector = s.id;
  }
  currentLevel = level;
  currentSector = sector;
  MG.lastRank = level;
  score = 0; currentQ = 0;
  MG.streak = 0; MG.bestStreak = 0; MG.hints = 0; MG.stats = {}; MG.results = [];
  startTime = Date.now();
  questions = MGData.mission(level, sector, missionLength());
  const sec = rk.sectors.find(s => s.id === sector);
  const badgeEl = document.getElementById('gameBadge');
  if (badgeEl) badgeEl.textContent = rk.name + ' · ' + (sec.boss ? 'Boss' : 'Sector ' + sec.id);
  const badgeName = document.getElementById('gameSector');
  if (badgeName) badgeName.textContent = sec.name;
  document.documentElement.style.setProperty('--level-color', rk.color);
  updateScore();
  renderPips();
  showScreen('game');
  if (MG.flight) MG.flight.destroy();
  MG.flight = MGArt.scene(document.getElementById('mgFlight'), {
    mode: 'flight', planet: rk.planet, from: rk.from, color: kidColor(), progress: 0, boss: !!sec.boss, hp: 1
  });
  showQuestion();
}

function updateScore() {
  const el = document.getElementById('gameScore');
  if (el) el.innerHTML = MGArt.icon('star') + '<span>' + score + '</span>';
  const c = document.getElementById('gameCombo');
  if (c) {
    c.textContent = MG.streak >= 2 ? 'Combo ×' + MG.streak : '';
    c.classList.toggle('on', MG.streak >= 2);
    c.classList.toggle('hot', MG.streak >= 5);
  }
}

function renderPips() {
  const el = document.getElementById('mgPips');
  if (!el) return;
  const n = questions.length || missionLength();
  let h = '';
  for (let i = 0; i < n; i++) {
    const r = MG.results[i];
    h += '<i class="' + (r === true ? 'ok' : r === false ? 'no' : i === currentQ ? 'cur' : '') + '"></i>';
  }
  el.innerHTML = h;
  el.setAttribute('aria-label', 'Question ' + Math.min(n, currentQ + 1) + ' of ' + n);
}

function visNeeded(q) {
  if (!q.vis) return false;
  if (q.mode === 'build') return true;
  const t = tier();
  if (t === 'beginner' || t === 'intermediate') return true;
  const v = q.vis;
  return v.type === 'tenframe' || v.type === 'shape' || (v.type === 'fraction' && v.style === 'pizza') || (v.type === 'blocks' && v.mode === 'show');
}

function showQuestion() {
  const q = questions[currentQ];
  MG.answered = false; MG.tries = 0; q.hinted = false;
  const card = document.getElementById('questionCard');
  if (card) card.className = 'question-card';
  document.getElementById('qLabel').textContent = q.label;
  const txt = document.getElementById('qText');
  txt.textContent = q.text;
  txt.classList.toggle('long', q.text.length > 46);
  const hnt = document.getElementById('qHint');
  hnt.textContent = ''; hnt.className = 'question-hint';
  const speak = document.getElementById('qSpeak');
  if (speak) {
    const ok = typeof ZsTTS !== 'undefined' && ZsTTS.supported() && ZsTTS.getSettings().enabled && (tier() === 'beginner' || currentLevel === 'cadet');
    speak.hidden = !ok;
  }
  const vis = document.getElementById('qVis');
  vis.innerHTML = '';
  MG.ctl = null; MG.visShown = false;
  if (visNeeded(q)) mountVis(q);
  const hb = document.getElementById('hintBtn');
  hb.hidden = !q.vis; hb.disabled = false;
  hb.querySelector('span').textContent = MG.visShown ? 'Hint' : 'Show me';
  const wrap = document.getElementById('answersWrap');
  wrap.innerHTML = '';
  wrap.className = 'answers' + (q.options && q.options.length === 2 ? ' two' : '') + (q.options && q.options.length === 3 ? ' three' : '');
  const check = document.getElementById('checkBtn');
  const next = document.getElementById('nextBtn');
  next.hidden = true;
  if (q.mode === 'build') {
    check.hidden = false; check.disabled = false;
  } else {
    check.hidden = true;
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = typeof opt === 'number' ? MGVis.fmt(opt) : opt;
      btn.dataset.v = String(opt);
      btn.onclick = () => handleAnswer(btn, opt, q);
      wrap.appendChild(btn);
    });
  }
  renderPips();
  if (MG.flight) MG.flight.set({ progress: currentQ / questions.length });
}

function mountVis(q) {
  const vis = document.getElementById('qVis');
  vis.innerHTML = '';
  MG.ctl = MGVis.render(vis, q.vis, { interactive: true });
  MG.visShown = !!MG.ctl;
}

function useHint() {
  const q = questions[currentQ];
  if (MG.answered || !q.vis) return;
  q.hinted = true; MG.hints++;
  const hb = document.getElementById('hintBtn');
  if (!MG.visShown) {
    mountVis(q);
    hb.querySelector('span').textContent = 'More help';
  } else {
    if (MG.ctl) MG.ctl.hint();
    hb.disabled = true;
  }
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
}

function speakQuestion() {
  const q = questions[currentQ];
  if (typeof ZsTTS !== 'undefined' && q) ZsTTS.speak(q.say || q.text, { lang: 'en-US' });
}

function stat(q) {
  const s = MG.stats[q.skill] || (MG.stats[q.skill] = { c: 0, n: 0, h: 0 });
  return s;
}

function checkBuild() {
  const q = questions[currentQ];
  if (MG.answered || !MG.ctl) return;
  const ok = !!q.check(MG.ctl.value());
  if (!ok && MG.tries === 0) {
    MG.tries = 1;
    const card = document.getElementById('questionCard');
    card.classList.remove('wrong'); void card.offsetWidth; card.classList.add('wrong');
    const hnt = document.getElementById('qHint');
    hnt.textContent = 'Not quite — look again and try once more.';
    hnt.className = 'question-hint try';
    if (typeof SFX !== 'undefined') SFX.wrong();
    if (MG.flight) MG.flight.pulse('wrong');
    return;
  }
  resolve(ok, q, null);
}

function handleAnswer(btn, selected, q) {
  if (MG.answered) return;
  const correct = String(selected) === String(q.answer);
  document.querySelectorAll('.answer-btn').forEach(b => {
    b.classList.add('disabled');
    b.disabled = true;
    if (b.dataset.v === String(q.answer)) b.classList.add('reveal-correct');
  });
  btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
  resolve(correct, q, btn);
}

// Repaso (the daily review): a missed multiple-choice question comes back
// tomorrow; one that comes back and is answered right moves up a box.
function reviewNote(q, correct) {
  try {
    if (typeof Review === 'undefined' || !q || !q.options || !q.options.length || !q.text) return;
    const fmt = v => typeof v === 'number' ? MGVis.fmt(v) : String(v);
    const ans = fmt(q.answer);
    if (correct) Review.hit(null, Review.idFor('math', q.text, ans));
    else Review.add(null, { app: 'math', prompt: q.text, answer: ans, choices: q.options.map(fmt) });
  } catch (e) {}
}

function resolve(correct, q, btn) {
  MG.answered = true;
  const card = document.getElementById('questionCard');
  const hnt = document.getElementById('qHint');
  const s = stat(q);
  s.n++;
  if (q.hinted) s.h++;
  MG.results[currentQ] = correct;
  reviewNote(q, correct);
  if (MG.ctl) MG.ctl.lock();
  document.getElementById('checkBtn').hidden = true;
  document.getElementById('hintBtn').disabled = true;
  if (correct) {
    score++;
    if (!q.hinted) s.c++;
    MG.streak++;
    MG.bestStreak = Math.max(MG.bestStreak, MG.streak);
    card.classList.add('correct');
    hnt.textContent = q.explain || '';
    hnt.className = 'question-hint good';
    if ([3, 5, 8, 10].indexOf(MG.streak) >= 0) {
      showFeedback('Combo ×' + MG.streak + '!', 'combo');
      if (MG.flight) MG.flight.pulse('combo');
      if (typeof SFX !== 'undefined' && SFX.star) SFX.star(); else if (typeof SFX !== 'undefined') SFX.correct();
    } else {
      showFeedback(['Great!', 'Correct!', 'Nice flying!', 'Yes!', 'Spot on!'][Math.floor(Math.random() * 5)], 'good');
      if (typeof SFX !== 'undefined') SFX.correct();
    }
    if (MG.flight) MG.flight.pulse('correct');
  } else {
    MG.streak = 0;
    card.classList.add('wrong');
    if (q.vis && !MG.visShown) mountVis(q);
    if (MG.ctl) { MG.ctl.reveal(); MG.ctl.lock(); }
    const shown = typeof q.answer === 'number' ? MGVis.fmt(q.answer) : q.answer;
    hnt.textContent = 'The answer is ' + shown + '. ' + (q.explain || '');
    hnt.className = 'question-hint bad';
    if (typeof SFX !== 'undefined') SFX.wrong();
    if (MG.flight) MG.flight.pulse('wrong');
  }
  updateScore();
  renderPips();
  if (MG.flight) {
    const sec = MGData.rankById(currentLevel).sectors.find(x => x.id === currentSector);
    MG.flight.set({ progress: (currentQ + 1) / questions.length, hp: sec.boss ? Math.max(0, 1 - score / questions.length) : 1 });
  }
  if (correct) {
    setTimeout(nextQuestion, q.mode === 'build' || (q.vis && MG.visShown) ? 1700 : 1300);
  } else {
    const next = document.getElementById('nextBtn');
    next.hidden = false;
    setTimeout(() => next.focus({ preventScroll: true }), 50);
  }
}

function nextQuestion() {
  if (!document.getElementById('screen-game').classList.contains('active')) return;
  if (currentQ >= questions.length) return;
  currentQ++;
  if (currentQ >= questions.length) finishGame(); else showQuestion();
}

function quitMission() {
  if (typeof ZsDialog !== 'undefined' && ZsDialog.confirm && currentQ > 0) {
    Promise.resolve(ZsDialog.confirm({ title: 'Leave this mission?', message: 'This run will not be saved.', confirmLabel: 'Leave', cancelLabel: 'Keep flying' })).then(ok => { if (ok) { currentQ = questions.length; renderRank(currentLevel); } });
    return;
  }
  currentQ = questions.length;
  renderRank(currentLevel);
}

function finishGame() {
  const n = questions.length;
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const pct = Math.round((score / n) * 100);
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  if (typeof SFX !== 'undefined' && pct >= 60) SFX.cheer();

  const prevProg = getUserProgress();
  const prevBest = prevProg[currentLevel] ? (prevProg[currentLevel].bestPct || 0) : 0;
  const isNewRecord = pct > prevBest;
  const saved = saveMission(currentLevel, currentSector, stars, pct, MG.stats);

  const rk = MGData.rankById(currentLevel);
  const sec = rk.sectors.find(s => s.id === currentSector);
  if (typeof ActivityLog !== 'undefined') {
    ActivityLog.log('Math Galaxy', '🧮', `Completed ${currentLevel} ${sec.boss ? 'boss' : 'sector ' + sec.id} — ${stars} star${stars !== 1 ? 's' : ''}`);
  }

  let title, sub;
  if (pct >= 90) { title = sec.boss ? 'Boss cleared!' : 'Mission complete!'; sub = `Amazing! ${score} out of ${n} correct.`; }
  else if (pct >= 70) { title = 'Great flying!'; sub = `${score} out of ${n} — almost perfect!`; }
  else if (pct >= 50) { title = 'Good effort!'; sub = `${score} out of ${n} — keep practising!`; }
  else { title = 'Keep going!'; sub = `${score} out of ${n} — every mission makes you stronger.`; }

  document.getElementById('resultsTitle').textContent = title;
  document.getElementById('resultsSub').textContent = rk.world + ' · ' + (sec.boss ? 'Boss: ' : 'Sector ' + sec.id + ': ') + sec.name + ' — ' + sub;
  document.getElementById('starsRow').innerHTML = starsHtml(stars, 3, 'big');
  document.getElementById('newRecordWrap').innerHTML = isNewRecord && prevBest > 0 ? '<div class="new-record">New personal best on ' + esc(rk.world) + '!</div>' : '';
  document.getElementById('resultsStats').innerHTML =
    '<div class="stat-box"><div class="stat-value c-green">' + pct + '%</div><div class="stat-label">Score</div></div>' +
    '<div class="stat-box"><div class="stat-value c-gold">' + score + '/' + n + '</div><div class="stat-label">Correct</div></div>' +
    '<div class="stat-box"><div class="stat-value c-pink">×' + MG.bestStreak + '</div><div class="stat-label">Best combo</div></div>' +
    '<div class="stat-box"><div class="stat-value c-cyan">' + mins + ':' + String(secs).padStart(2, '0') + '</div><div class="stat-label">Time</div></div>';

  const skills = Object.keys(MG.stats).map(id => {
    const s = MG.stats[id];
    const good = s.c + (s.n - s.c - s.h > 0 ? 0 : 0);
    return '<li class="' + (saved.newly.indexOf(id) >= 0 ? 'new' : '') + '"><b>' + esc(MGData.SKILLS[id].name) + '</b><span>' + s.c + ' of ' + s.n + ' on your own' + (s.h ? ' · ' + s.h + ' with help' : '') + '</span></li>';
  }).join('');
  const mastered = saved.newly.map(id => '<div class="mastered-badge">' + MGArt.icon('log') + '<span><b>Skill mastered:</b> ' + esc(MGData.SKILLS[id].name) + '</span></div>').join('');
  document.getElementById('resultsSkills').innerHTML = mastered + '<ul class="skill-list">' + skills + '</ul>';

  const info = sectorInfo(currentLevel);
  const idx = info.findIndex(s => s.id === currentSector);
  const nxt = info[idx + 1];
  const nextBtn = document.getElementById('resultsNext');
  if (nxt && !nxt.locked) {
    nextBtn.hidden = false;
    nextBtn.textContent = (nxt.boss ? 'Boss round' : 'Sector ' + nxt.id) + ' ▶';
    nextBtn.onclick = () => startGame(currentLevel, nxt.id);
  } else nextBtn.hidden = true;

  const show = () => {
    showScreen('results');
    if (MG.arrive) MG.arrive.destroy();
    MG.arrive = MGArt.scene(document.getElementById('mgArrive'), { mode: 'arrive', planet: rk.planet, color: kidColor(), stars: stars });
  };
  if (typeof LearningCheck !== 'undefined') LearningCheck.maybePrompt('math', show);
  else show();
}

function playAgain() { startGame(currentLevel, currentSector); }
function goHome() {
  if (MG.orbit) { MG.orbit.destroy(); MG.orbit = null; }
  showScreen('select');
  buildHome();
  if (typeof MathExtras !== 'undefined') MathExtras._refreshBestBadges();
}
function backToRank() { renderRank(currentLevel); }

/* ================================================================
   MISSION LOG — every skill, how it's going, and mastery
   ================================================================ */
function openLog() {
  const prog = getUserProgress();
  const log = prog.missionLog || {};
  const wrap = document.getElementById('log-wrap');
  const all = Object.keys(MGData.SKILLS);
  const done = all.filter(id => log[id] && log[id].m).length;
  ZsCanvas.releaseIn(wrap);
  wrap.innerHTML =
    '<div class="mg-bar">' +
      '<button type="button" class="back-btn" id="logBack" aria-label="Back to the galaxy map">' + MGArt.icon('back') + '</button>' +
      '<div class="mg-bar-title"><h2>Mission Log</h2><p>Bitácora · ' + done + ' of ' + all.length + ' skills mastered</p></div>' +
    '</div>' +
    '<p class="mg-log-note">A skill is <b>mastered</b> after 8 correct answers without a hint, with at least 3 out of 4 right.</p>' +
    MGData.RANKS.map(r => {
      const ids = all.filter(id => MGData.SKILLS[id].rank === r.id);
      return '<section class="log-rank">' +
        '<h3><canvas class="log-planet" data-planet="' + r.planet + '" aria-hidden="true"></canvas>' + r.name + ' · ' + r.world + '</h3>' +
        '<ul>' + ids.map(id => {
          const s = MGData.SKILLS[id], rec = log[id] || { c: 0, n: 0 };
          const pctDone = Math.min(100, Math.round((rec.c || 0) / 8 * 100));
          const acc = rec.n ? Math.round(rec.c / rec.n * 100) : 0;
          return '<li class="log-skill' + (rec.m ? ' mastered' : '') + '">' +
            '<span class="log-medal">' + (rec.m ? MGArt.icon('star') : '') + '</span>' +
            '<span class="log-name"><b>' + esc(s.name) + '</b><i>' + esc(s.es) + '</i></span>' +
            '<span class="log-bar"><span style="width:' + pctDone + '%"></span></span>' +
            '<span class="log-num">' + (rec.m ? 'Mastered ' + esc(rec.m) : rec.n ? (rec.c || 0) + '/8 · ' + acc + '%' : 'Not yet') + '</span>' +
          '</li>';
        }).join('') + '</ul></section>';
    }).join('');
  document.getElementById('logBack').addEventListener('click', goHome);
  showScreen('log');
  requestAnimationFrame(() => wrap.querySelectorAll('canvas.log-planet').forEach(c => MGArt.thumb(c, c.dataset.planet)));
}

// ── Boot safely after DOM is ready ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = MGArt.icon(el.getAttribute('data-icon')); });
  const gb = document.getElementById('gameBack'); if (gb) gb.innerHTML = MGArt.icon('back');
  const sp = document.getElementById('qSpeak'); if (sp) sp.innerHTML = MGArt.icon('speaker');
  initUserUI();
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  on('hintBtn', useHint);
  on('checkBtn', checkBuild);
  on('nextBtn', nextQuestion);
  on('qSpeak', speakQuestion);
  on('gameBack', quitMission);
  on('card-log', openLog);
  document.addEventListener('keydown', e => {
    if (!document.getElementById('screen-game').classList.contains('active')) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !MG.answered) {
      const b = document.querySelectorAll('#answersWrap .answer-btn')[n - 1];
      if (b) b.click();
    }
  });
});
