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
