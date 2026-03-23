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

  return total;
}
