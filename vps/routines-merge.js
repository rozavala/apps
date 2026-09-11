/* ================================================================
   ROUTINES MERGE (server side)

   Mirrors _mergeRoutines in js/sync.js. The client already merges the
   server's copy into its own before pushing, but two devices can read
   the same server copy before either writes — a classic lost update,
   and with a kitchen iPad plus phones it's a routine occurrence, not a
   corner case. Express handlers here are fully synchronous, so doing
   the same merge inside the PUT gives us one serialization point where
   nothing can interleave.

   Resolution is per item, using the mark log routines.js writes
   (marks[day][routine][id] = {done, ts}):
     - both sides agree            → that value
     - one explicit mark           → that mark wins (so un-ticking
                                     propagates instead of being
                                     re-added by the other side)
     - two marks                   → the newer ts wins
     - neither (pre-marks data)    → a tick beats a blank, which is the
                                     safe direction for a checklist
   ================================================================ */

'use strict';

const DEFAULT_ROUTINES = ['morning', 'afternoon', 'evening'];
const MARK_KEEP_DAYS = 30;

function parseTs(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const n = new Date(v).getTime();
  return isNaN(n) ? 0 : n;
}

// Routine ids present in either snapshot, so a checklist added by a
// newer client build merges without an edit here.
function routineIds(...dayMaps) {
  const ids = new Set(DEFAULT_ROUTINES);
  for (const days of dayMaps) {
    for (const day of Object.keys(days || {})) {
      for (const r of Object.keys(days[day] || {})) {
        if (Array.isArray(days[day][r])) ids.add(r);
      }
    }
  }
  return [...ids];
}

function mark(data, day, routine, id) {
  const m = data && data.marks && data.marks[day] && data.marks[day][routine];
  const entry = m && m[id];
  return entry && typeof entry.ts === 'number' ? entry : null;
}

/**
 * @param {object} existing what's on disk
 * @param {object} incoming what the client just pushed
 * @returns {object} merged snapshot to write
 */
function mergeRoutines(existing, incoming) {
  const a = existing || {};
  const b = incoming || {};
  const incomingNewer = parseTs(b._syncedAt) >= parseTs(a._syncedAt);
  const out = Object.assign({}, a, b);

  // Parent-edited checklists move as a unit, newest wins.
  const aT = a.templates, bT = b.templates;
  out.templates = (aT && bT) ? (incomingNewer ? bT : aT) : (bT || aT);
  if (!out.templates) delete out.templates;

  const aDays = a.days || {}, bDays = b.days || {};
  const routines = routineIds(aDays, bDays);
  const days = new Set([...Object.keys(aDays), ...Object.keys(bDays)]);

  out.days = {};
  for (const day of days) {
    const aDay = aDays[day] || {}, bDay = bDays[day] || {};
    out.days[day] = {};
    for (const routine of routines) {
      const aList = Array.isArray(aDay[routine]) ? aDay[routine] : [];
      const bList = Array.isArray(bDay[routine]) ? bDay[routine] : [];
      const aMarks = (a.marks && a.marks[day] && a.marks[day][routine]) || {};
      const bMarks = (b.marks && b.marks[day] && b.marks[day][routine]) || {};
      const ids = new Set([...aList, ...bList, ...Object.keys(aMarks), ...Object.keys(bMarks)]);

      out.days[day][routine] = [...ids].filter(id => {
        const aDone = aList.includes(id);
        const bDone = bList.includes(id);
        if (aDone === bDone) return aDone;
        const aMark = mark(a, day, routine, id);
        const bMark = mark(b, day, routine, id);
        if (aMark && bMark) return bMark.ts > aMark.ts ? bMark.done : aMark.done;
        if (bMark) return bMark.done;
        if (aMark) return aMark.done;
        return true;
      });
    }
  }

  // Mark log: newer entry per item, trimmed to the same window the
  // client prunes to so the file can't grow without bound.
  out.marks = {};
  const markDays = new Set([...Object.keys(a.marks || {}), ...Object.keys(b.marks || {})]);
  for (const day of markDays) {
    out.marks[day] = {};
    for (const routine of routines) {
      const aM = (a.marks && a.marks[day] && a.marks[day][routine]) || {};
      const bM = (b.marks && b.marks[day] && b.marks[day][routine]) || {};
      const merged = Object.assign({}, aM);
      for (const id of Object.keys(bM)) {
        if (!merged[id] || (bM[id] && bM[id].ts > merged[id].ts)) merged[id] = bM[id];
      }
      if (Object.keys(merged).length) out.marks[day][routine] = merged;
    }
    if (!Object.keys(out.marks[day]).length) delete out.marks[day];
  }
  const kept = Object.keys(out.marks).sort();
  if (kept.length > MARK_KEEP_DAYS) {
    for (const d of kept.slice(0, kept.length - MARK_KEEP_DAYS)) delete out.marks[d];
  }

  // Streak counters: the best either side saw. lastFullDay is
  // YYYY-MM-DD, so a plain string compare picks the later day.
  out.streak = Math.max(Number(a.streak) || 0, Number(b.streak) || 0);
  out.bestStreak = Math.max(Number(a.bestStreak) || 0, Number(b.bestStreak) || 0, out.streak);
  const aFull = a.lastFullDay || '', bFull = b.lastFullDay || '';
  if (aFull || bFull) out.lastFullDay = bFull > aFull ? bFull : aFull;

  return out;
}

module.exports = mergeRoutines;
