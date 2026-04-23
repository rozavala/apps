#!/usr/bin/env node
/* ================================================================
   DIAG → GITHUB BRIDGE
   Reads the last 24h of raw diag entries, scrubs them, and commits
   a JSON digest to the `diag` branch of the repo at DIAG_REPO_PATH.

   Run periodically (systemd timer or cron every 15 min) and on
   demand via the server's POST /api/diag/flush endpoint.

   Expected env (via vps/.env):
     DIAG_REPO_PATH       absolute path to a bare/working checkout of
                          rozavala/apps on the VPS, with a diag branch
                          configured and a deploy key that can push it
     DIAG_SALT            any long string; used to hash kid names so
                          the same kid maps to the same pseudonym
                          across commits, but the mapping is not
                          reversible by outsiders
     DIAG_WINDOW_HOURS    optional, default 24

   Never commits raw free-form text. See _scrub() for exactly what
   is kept.
   ================================================================ */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSONL_PATH = path.join(DATA_DIR, '_diag', 'diag.jsonl');

const REPO_PATH = process.env.DIAG_REPO_PATH;
const SALT = process.env.DIAG_SALT || 'zs-default-salt-please-change';
const WINDOW_HOURS = parseInt(process.env.DIAG_WINDOW_HOURS || '24', 10);
const BRANCH = 'diag';

function log() { console.log('[diag-push]', ...arguments); }
function die(msg) { console.error('[diag-push][error]', msg); process.exit(1); }

if (!REPO_PATH) die('DIAG_REPO_PATH is not set. See vps/DIAG_SETUP.md.');
if (!fs.existsSync(REPO_PATH)) die('DIAG_REPO_PATH does not exist: ' + REPO_PATH);

// ── Stable pseudonym for a profile name ──
function pseudonym(name) {
  if (!name) return null;
  const h = crypto.createHash('sha1').update(SALT + ':' + String(name)).digest('hex').slice(0, 6);
  return 'u-' + h;
}

// ── Read + filter raw entries ──
function readWindow(hours) {
  if (!fs.existsSync(JSONL_PATH)) return [];
  const cutoff = Date.now() - hours * 3600 * 1000;
  const out = [];
  const raw = fs.readFileSync(JSONL_PATH, 'utf8');
  raw.split('\n').forEach(line => {
    if (!line) return;
    try {
      const e = JSON.parse(line);
      if (e && e.ts >= cutoff) out.push(e);
    } catch {}
  });
  return out;
}

// ── Scrub: replace identifying fields; drop anything free-text ──
// Keep: kind, app, page, message, filename, lineno, colno, stack,
//       breadcrumbs (label only), pseudonym, age, ua, ts.
// Drop: profile.name, profile._ip, any fields not in the whitelist.
function scrub(entry) {
  return {
    id: entry.id || undefined,
    ts: entry.ts || null,
    clientTs: entry.clientTs || null,
    kind: entry.kind || null,
    app: entry.app || null,
    page: entry.page || null,
    message: entry.message || null,
    filename: entry.filename || null,
    lineno: entry.lineno,
    colno: entry.colno,
    stack: entry.stack || null,
    user: entry.profile && entry.profile.name ? pseudonym(entry.profile.name) : null,
    age: entry.profile && typeof entry.profile.age === 'number' ? entry.profile.age : null,
    guest: entry.profile ? !!entry.profile.isGuest : false,
    ua: entry.ua || null,
    trail: Array.isArray(entry.breadcrumbs)
      ? entry.breadcrumbs.map(b => b && b.label ? b.label : null).filter(Boolean)
      : []
  };
}

// ── Dedupe by fingerprint so the same recurring error doesn't spam ──
function fingerprint(e) {
  return [
    e.app || '',
    e.kind || '',
    (e.message || '').slice(0, 200),
    (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || ''),
    (e.stack || '').split('\n').slice(0, 3).join('|').slice(0, 300)
  ].join('§');
}

// ── Git helpers ──
// The Express service (running as root) and the systemd timer (running
// as rodrigo) both invoke this script. To avoid "dubious ownership" or
// missing-SSH-key errors when one user touches files owned by another,
// every git invocation is explicit about:
//   - safe.directory for REPO_PATH (works for any user without touching
//     /etc/gitconfig)
//   - GIT_SSH_COMMAND pinned to DIAG_SSH_KEY if set (so the key can live
//     anywhere on disk as long as it's readable by the invoking user)
const SSH_KEY = process.env.DIAG_SSH_KEY || null;

function git(args, opts) {
  const prefixed = ['-c', 'safe.directory=' + REPO_PATH].concat(args);
  const childEnv = Object.assign({}, process.env);
  if (SSH_KEY) {
    childEnv.GIT_SSH_COMMAND = 'ssh -i "' + SSH_KEY + '"'
      + ' -o IdentitiesOnly=yes'
      + ' -o StrictHostKeyChecking=accept-new'
      + ' -o UserKnownHostsFile=' + (process.env.DIAG_KNOWN_HOSTS || '~/.ssh/known_hosts');
  }
  return execFileSync('git', prefixed, Object.assign(
    { cwd: REPO_PATH, encoding: 'utf8', env: childEnv },
    opts || {}
  )).trim();
}

function ensureBranch() {
  // Fetch first so we don't push stale
  try { git(['fetch', 'origin', BRANCH]); } catch {}
  // Check if branch exists locally or on origin
  let exists = false;
  try { git(['rev-parse', '--verify', BRANCH]); exists = true; } catch {}
  if (!exists) {
    try { git(['rev-parse', '--verify', 'origin/' + BRANCH]); exists = true; } catch {}
  }
  if (exists) {
    // Checkout a clean working tree on the branch
    try { git(['checkout', BRANCH]); } catch { git(['checkout', '-t', 'origin/' + BRANCH]); }
    try { git(['reset', '--hard', 'origin/' + BRANCH]); } catch {}
  } else {
    // Create an orphan branch for diag — no history shared with main.
    git(['checkout', '--orphan', BRANCH]);
    try { git(['rm', '-rf', '.']); } catch {}
    fs.writeFileSync(path.join(REPO_PATH, 'README.md'),
      '# Diagnostic logs\n\nAuto-scrubbed error digests pushed by the VPS.\n' +
      'Raw logs stay on the Tailscale-only VPS.\n');
    git(['add', 'README.md']);
    git(['-c', 'user.name=zs-diag', '-c', 'user.email=diag@zavalaserra.local',
         'commit', '-m', 'Initialise diag branch']);
    git(['push', '-u', 'origin', BRANCH]);
  }
}

// ── Build digest ──
function buildDigest() {
  const raw = readWindow(WINDOW_HOURS);
  const byDay = {}; // yyyy-mm-dd → Map<fingerprint, { entry, count, firstTs, lastTs }>

  raw.forEach(r => {
    const s = scrub(r);
    const d = new Date(s.ts || Date.now());
    const day = d.toISOString().slice(0, 10);
    const fp = fingerprint(s);
    if (!byDay[day]) byDay[day] = new Map();
    const bucket = byDay[day];
    if (bucket.has(fp)) {
      const b = bucket.get(fp);
      b.count++;
      b.lastTs = Math.max(b.lastTs, s.ts);
      if (b.users.indexOf(s.user) === -1 && s.user) b.users.push(s.user);
    } else {
      bucket.set(fp, {
        entry: s,
        count: 1,
        firstTs: s.ts,
        lastTs: s.ts,
        users: s.user ? [s.user] : []
      });
    }
  });

  const digest = {
    generatedAt: new Date().toISOString(),
    windowHours: WINDOW_HOURS,
    days: Object.keys(byDay).sort().map(day => ({
      day,
      groups: Array.from(byDay[day].values())
        .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs)
    }))
  };

  // Also a latest.json for easy reading
  const latest = {
    generatedAt: digest.generatedAt,
    totalGroups: digest.days.reduce((acc, d) => acc + d.groups.length, 0),
    totalEvents: digest.days.reduce((acc, d) => acc + d.groups.reduce((a, g) => a + g.count, 0), 0)
  };

  return { digest, latest };
}

// ── Main ──
(function main() {
  log('Reading raw diag, scrubbing, preparing digest…');
  ensureBranch();

  const { digest, latest } = buildDigest();

  const diagDir = path.join(REPO_PATH, 'diag');
  if (!fs.existsSync(diagDir)) fs.mkdirSync(diagDir, { recursive: true });

  fs.writeFileSync(path.join(diagDir, 'latest.json'), JSON.stringify(latest, null, 2));
  fs.writeFileSync(path.join(diagDir, 'window.json'), JSON.stringify(digest, null, 2));

  // Per-day archive (overwrites each run with the latest grouping for that day)
  digest.days.forEach(d => {
    fs.writeFileSync(path.join(diagDir, d.day + '.json'), JSON.stringify(d, null, 2));
  });

  // Commit if anything changed
  const status = git(['status', '--porcelain']);
  if (!status) {
    log('No changes to push.');
    return;
  }
  git(['add', 'diag']);
  const msg = 'diag: refresh ' + latest.generatedAt + ' (' + latest.totalGroups + ' groups, ' + latest.totalEvents + ' events)';
  git(['-c', 'user.name=zs-diag', '-c', 'user.email=diag@zavalaserra.local', 'commit', '-m', msg]);
  git(['push', 'origin', BRANCH]);
  log('Pushed:', msg);
})();
