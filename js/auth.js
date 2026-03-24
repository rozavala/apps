/* ================================================================
   SHARED LOGIN SYSTEM
   All apps read: localStorage.getItem('zs_active_user')
   Returns: { name, avatar, color, age } or null
   ================================================================ */

const AVATARS = ['🦊','🐱','🐶','🦋','🐰','🐸','🦄','🐨','🦁','🐧','🦖','🐬'];
const COLORS  = ['#7C3AED','#EF4444','#F59E0B','#10B981','#0EA5E9','#EC4899','#F97316','#14B8A6'];
const AGE_OPTIONS = [
  { age: 4,  label: '4' },
  { age: 5,  label: '5' },
  { age: 6,  label: '6' },
  { age: 7,  label: '7' },
  { age: 8,  label: '8' },
  { age: 9,  label: '9' },
  { age: 10, label: '10' },
  { age: 11, label: '11' },
  { age: 12, label: '12' },
];
const STORAGE_KEY = 'zs_profiles';
const ACTIVE_KEY  = 'zs_active_user';

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveProfiles(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function getActiveUser() {
  try { return JSON.parse(localStorage.getItem(ACTIVE_KEY)); }
  catch { return null; }
}
function setActiveUser(user) { localStorage.setItem(ACTIVE_KEY, JSON.stringify(user)); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 17) return 'Good afternoon!';
  return 'Good evening!';
}

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ================================================================
   GLOBAL STAR COUNTER
   Aggregates stars across all apps for the active user.
   ================================================================ */

function getTotalStars(userName) {
  const name = userName || (getActiveUser() ? getActiveUser().name : null);
  if (!name) return 0;
  const key = name.toLowerCase().replace(/\s+/g, '_');
  let total = 0;

  // Math Galaxy: { cadet: { bestStars: 3 }, explorer: { bestStars: 2 }, ... }
  try {
    const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {};
    Object.values(mg).forEach(level => { total += (level.bestStars || 0); });
  } catch {}

  // Descubre Chile: { geography: { bestStars: 2 }, ... } (skip vr, memBest)
  try {
    const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {};
    Object.entries(dc).forEach(([k, v]) => {
      if (k !== 'vr' && k !== 'memBest' && v && v.bestStars) total += v.bestStars;
    });
  } catch {}

  // Chess Quest: puzzlesSolved counts as stars, wins count as stars
  try {
    const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {};
    total += (cq.puzzlesSolved || 0);
    total += (cq.wins || 0);
  } catch {}

  // Little Maestro: progress.{songId}.stars
  try {
    const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {};
    if (lm.progress) {
      Object.entries(lm.progress).forEach(([sid, val]) => {
        if (typeof val === 'object' && val !== null && val.stars > 0) {
          total += val.stars;
        }
      });
      // Legacy fallback: songStars sub-object
      const songStars = lm.progress.songStars || {};
      Object.values(songStars).forEach(s => { if (s > 0) total += s; });
    }
  } catch {}

  // Fe Explorador: zs_fe_{key} -> { totalStars: 10 }
  try {
    const fe = JSON.parse(localStorage.getItem(`zs_fe_${key}`)) || {};
    total += (fe.totalStars || 0);
  } catch {}

  return total;
}

/**
 * Returns a difficulty tier based on the active user's age.
 * All apps should use this instead of raw age checks.
 *
 * Returns: 'beginner' (ages 4-5), 'intermediate' (ages 6-7),
 *          'advanced' (ages 8-9), 'expert' (ages 10-12),
 *          or 'intermediate' as default if no age set.
 */
function getAgeTier(age) {
  const a = age || (getActiveUser() ? getActiveUser().age : null);
  if (!a) return 'intermediate';
  if (a <= 5) return 'beginner';
  if (a <= 7) return 'intermediate';
  if (a <= 9) return 'advanced';
  return 'expert';
}

function getExplorerRank(userName) {
  const name = userName || (getActiveUser() ? getActiveUser().name : null);
  if (!name) return { name: 'Cadet', icon: '🛸', level: 0 };
  const key = name.toLowerCase().replace(/\s+/g, '_');
  const totalStars = getTotalStars(name);

  // Count how many apps have at least 1 star
  let appsWithStars = 0;
  try { const mg = JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`)) || {}; if (Object.values(mg).some(l => l.bestStars > 0)) appsWithStars++; } catch {}
  try { const dc = JSON.parse(localStorage.getItem(`zs_chile_${key}`)) || {}; if (Object.entries(dc).some(([k,v]) => k !== 'vr' && k !== 'memBest' && v && v.bestStars > 0)) appsWithStars++; } catch {}
  try { const cq = JSON.parse(localStorage.getItem(`zs_chess_${key}`)) || {}; if ((cq.puzzlesSolved || 0) + (cq.wins || 0) > 0) appsWithStars++; } catch {}
  try { const lm = JSON.parse(localStorage.getItem(`littlemaestro_${key}`)) || {}; const p = lm.progress || {}; if (Object.values(p).some(v => typeof v === 'object' && v !== null && v.stars > 0)) appsWithStars++; } catch {}
  try { const fe = JSON.parse(localStorage.getItem(`zs_fe_${key}`)) || {}; if ((fe.totalStars || 0) > 0) appsWithStars++; } catch {}

  const RANKS = [
    { name: 'Legend',    icon: '🏆', stars: 50, apps: 4 },
    { name: 'Commander', icon: '👨‍🚀', stars: 30, apps: 3 },
    { name: 'Pilot',     icon: '🌟', stars: 15, apps: 2 },
    { name: 'Explorer',  icon: '🚀', stars: 5,  apps: 1 },
    { name: 'Cadet',     icon: '🛸', stars: 0,  apps: 0 },
  ];

  for (const rank of RANKS) {
    if (totalStars >= rank.stars && appsWithStars >= rank.apps) {
      return { name: rank.name, icon: rank.icon, level: RANKS.length - RANKS.indexOf(rank) - 1 };
    }
  }
  return { name: 'Cadet', icon: '🛸', level: 0 };
}

/* ================================================================
   CHESS PLAY LIMITS
   ================================================================ */

function getChessPlaysThisWeek(userName) {
  const name = userName || (getActiveUser() ? getActiveUser().name : null);
  if (!name) return 0;
  const key = 'zs_chess_plays_' + name.toLowerCase().replace(/\s+/g, '_');
  try {
    const plays = JSON.parse(localStorage.getItem(key)) || [];
    // Count plays in the last 7 days
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return plays.filter(d => new Date(d).getTime() > weekAgo).length;
  } catch { return 0; }
}

function getChessLimit(userName) {
  // Read from profile; default 2
  const profiles = getProfiles();
  const name = userName || (getActiveUser() ? getActiveUser().name : null);
  if (!name) return 2;
  const profile = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
  return (profile && typeof profile.chessPlaysPerWeek === 'number') 
    ? profile.chessPlaysPerWeek : 2;
}

function canPlayChess(userName) {
  const limit = getChessLimit(userName);
  if (limit === 0) return false;       // Disabled by parent
  if (limit >= 7) return true;         // Daily = always
  return getChessPlaysThisWeek(userName) < limit;
}

function recordChessPlay(userName) {
  const name = userName || (getActiveUser() ? getActiveUser().name : null);
  if (!name) return;
  const key = 'zs_chess_plays_' + name.toLowerCase().replace(/\s+/g, '_');
  try {
    const plays = JSON.parse(localStorage.getItem(key)) || [];
    plays.push(new Date().toISOString());
    // Keep only last 30 days of history
    const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const trimmed = plays.filter(d => new Date(d).getTime() > monthAgo);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {}
}

function chessPlaysRemaining(userName) {
  const limit = getChessLimit(userName);
  if (limit >= 7) return 99;
  return Math.max(0, limit - getChessPlaysThisWeek(userName));
}



