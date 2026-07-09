require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const media = require('./media');
const diag = require('./diag');
const ical = require('./ical');
const wcScores = require('./wc-scores');
const wcMatch = require('./wc-match');

const app = express();
const PORT = 3333;
const DATA_DIR = path.join(__dirname, '..', 'data');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Private static assets (e.g. a surprise-reveal slideshow). Because this
// server is only reachable over the Tailscale tailnet, anything here is
// served exclusively to devices on the family VPN — never to the public
// GitHub Pages site. The folder is gitignored, so private files never
// reach the repo, and they survive the deploy's `git reset --hard`
// because they're untracked. Drop files in /opt/zavala-sync/private/ and
// reach them at https://<vps-tailnet-host>/private/<file>.
const PRIVATE_DIR = path.join(__dirname, '..', 'private');
if (!fs.existsSync(PRIVATE_DIR)) fs.mkdirSync(PRIVATE_DIR, { recursive: true });
app.use('/private', express.static(PRIVATE_DIR));

// Register Book & Movie Check media endpoints
media.init(app, DATA_DIR);

// Register diag endpoints (error capture from browsers)
diag.init(app, DATA_DIR);

// Register iCal proxy (CORS-safe family calendar fetches)
ical.init(app);

// Register World Cup scores proxy (ESPN scoreboard JSON, CORS-safe live scores)
wcScores.init(app);

// Register per-match detail proxy (ESPN summary JSON — full scorers + cards)
wcMatch.init(app);

app.get('/api/kids', (req, res) => {
  try {
    const kids = fs.readdirSync(DATA_DIR).filter(f =>
      fs.statSync(path.join(DATA_DIR, f)).isDirectory()
    );
    res.json({ kids });
  } catch { res.json({ kids: [] }); }
});

app.get('/api/kids/:kid', (req, res) => {
  const kidDir = path.join(DATA_DIR, req.params.kid);
  if (!fs.existsSync(kidDir)) return res.json({});
  try {
    const files = fs.readdirSync(kidDir).filter(f => f.endsWith('.json'));
    const data = {};
    for (const f of files) {
      const appName = f.replace('.json', '');
      data[appName] = JSON.parse(fs.readFileSync(path.join(kidDir, f), 'utf8'));
    }
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/kids/:kid/:app', (req, res) => {
  const filePath = path.join(DATA_DIR, req.params.kid, `${req.params.app}.json`);
  if (!fs.existsSync(filePath)) return res.json(null);
  try {
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch { res.json(null); }
});

app.put('/api/kids/:kid/:app', (req, res) => {
  const kidDir = path.join(DATA_DIR, req.params.kid);
  if (!fs.existsSync(kidDir)) fs.mkdirSync(kidDir, { recursive: true });
  const filePath = path.join(kidDir, `${req.params.app}.json`);

  let existing = null;
  try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch {}

  const incoming = { ...req.body, _syncedAt: new Date().toISOString() };

  if (existing && existing._syncedAt && incoming._syncedAt &&
      new Date(existing._syncedAt) > new Date(incoming._syncedAt)) {
    return res.json({ status: 'skipped', reason: 'server has newer data' });
  }

  fs.writeFileSync(filePath, JSON.stringify(incoming, null, 2));
  res.json({ status: 'saved' });
});

app.put('/api/profiles', (req, res) => {
  const filePath = path.join(DATA_DIR, '_profiles.json');
  fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
  res.json({ status: 'saved' });
});

app.get('/api/profiles', (req, res) => {
  const filePath = path.join(DATA_DIR, '_profiles.json');
  if (!fs.existsSync(filePath)) return res.json([]);
  try { res.json(JSON.parse(fs.readFileSync(filePath, 'utf8'))); }
  catch { res.json([]); }
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Zavala Sync running on port ${PORT}`);
});
