/* ================================================================
   MEDIA — Book & Movie Check backend
   Endpoints: /api/media/lookup, /api/media/evaluate,
              /api/media/cache/:id, /api/media/library
   Provider: Gemini 2.5 Flash via REST (AI_PROVIDER=gemini)
   Cache: <DATA_DIR>/media-cache.json (family-wide, no per-kid)
   ================================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROK_KEY = process.env.GROK_API_KEY;
const CACHE_TTL_DAYS = 90;
const PROMPT_VERSION = 2;  // bump whenever media-prompt.txt is edited
const RATE_LIMIT_PER_HOUR = 60;  // per source IP, total evaluate calls

let DATA_DIR = null;
let CACHE_PATH = null;
let PROMPT_TEMPLATE = '';
const rateMap = new Map();  // ip -> [timestamps]

// ── Helpers ──────────────────────────────────────────────────────

function _loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}
function _saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function _rateOk(ip) {
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter(t => now - t < 3600 * 1000);
  if (arr.length >= RATE_LIMIT_PER_HOUR) return false;
  arr.push(now);
  rateMap.set(ip, arr);
  return true;
}

function _httpsCover(url) {
  if (!url) return null;
  return String(url).replace(/^http:\/\//i, 'https://');
}

function _upstreamStatus(errMsg) {
  // Parses "Gemini 429: ..." or "Grok 503: ..." from _evaluate*() error messages.
  const m = String(errMsg || '').match(/^(?:Gemini|Grok)\s+(\d+):/);
  return m ? parseInt(m[1], 10) : null;
}

function _canonicalIsbn(isbn) { return 'isbn13:' + String(isbn).replace(/[^0-9Xx]/g, ''); }
function _canonicalTmdb(id)   { return 'tmdb:' + id; }
function _canonicalTitle(title, year, author) {
  const slug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return 'title:' + slug + (year ? '-' + year : '') + (author ? '-' + String(author).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) : '');
}

// ── Metadata providers ───────────────────────────────────────────

async function _lookupIsbn(isbn) {
  const clean = String(isbn).replace(/[^0-9Xx]/g, '');
  try {
    const r = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + clean);
    const j = await r.json();
    if (j.items && j.items[0]) {
      const v = j.items[0].volumeInfo;
      return [{
        canonical_id: _canonicalIsbn(clean),
        type: 'book',
        title: v.title || 'Unknown',
        author_or_director: (v.authors || []).join(', ') || '',
        year: v.publishedDate ? parseInt(String(v.publishedDate).slice(0, 4)) : null,
        cover_url: _httpsCover((v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || null),
        synopsis: v.description || ''
      }];
    }
  } catch (e) { /* fall through */ }
  // OpenLibrary fallback
  try {
    const r = await fetch('https://openlibrary.org/isbn/' + clean + '.json');
    if (r.ok) {
      const j = await r.json();
      let authors = '';
      if (j.authors && j.authors[0]) {
        try {
          const ar = await fetch('https://openlibrary.org' + j.authors[0].key + '.json');
          const aj = await ar.json();
          authors = aj.name || '';
        } catch (e) {}
      }
      return [{
        canonical_id: _canonicalIsbn(clean),
        type: 'book',
        title: j.title || 'Unknown',
        author_or_director: authors,
        year: j.publish_date ? parseInt(String(j.publish_date).slice(-4)) : null,
        cover_url: j.covers && j.covers[0] ? 'https://covers.openlibrary.org/b/id/' + j.covers[0] + '-M.jpg' : null,
        synopsis: ''
      }];
    }
  } catch (e) {}
  return [];
}

async function _searchBooks(query) {
  try {
    const r = await fetch('https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query) + '&maxResults=3');
    const j = await r.json();
    return (j.items || []).map(it => {
      const v = it.volumeInfo || {};
      const ids = (v.industryIdentifiers || []);
      const isbn13 = (ids.find(x => x.type === 'ISBN_13') || {}).identifier;
      return {
        canonical_id: isbn13 ? _canonicalIsbn(isbn13) : _canonicalTitle(v.title, v.publishedDate && v.publishedDate.slice(0, 4), (v.authors || [])[0]),
        type: 'book',
        title: v.title || 'Unknown',
        author_or_director: (v.authors || []).join(', ') || '',
        year: v.publishedDate ? parseInt(String(v.publishedDate).slice(0, 4)) : null,
        cover_url: _httpsCover((v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || null),
        synopsis: v.description || ''
      };
    });
  } catch (e) {
    return [];
  }
}

async function _searchMovies(query) {
  if (!process.env.TMDB_API_KEY) return [];
  try {
    const url = 'https://api.themoviedb.org/3/search/movie?api_key=' + process.env.TMDB_API_KEY + '&query=' + encodeURIComponent(query);
    const r = await fetch(url);
    const j = await r.json();
    return (j.results || []).slice(0, 3).map(m => ({
      canonical_id: _canonicalTmdb(m.id),
      type: 'movie',
      title: m.title,
      author_or_director: '',  // TMDb requires a second call for director; synopsis is enough for eval
      year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
      cover_url: m.poster_path ? 'https://image.tmdb.org/t/p/w200' + m.poster_path : null,
      synopsis: m.overview || ''
    }));
  } catch (e) { return []; }
}

// ── AI providers ─────────────────────────────────────────────────

function _fillPrompt(metadata) {
  return PROMPT_TEMPLATE
    .replace(/{{title}}/g, metadata.title || '')
    .replace(/{{author_or_director}}/g, metadata.author_or_director || '')
    .replace(/{{year}}/g, metadata.year || '')
    .replace(/{{type}}/g, metadata.type || 'book')
    .replace(/{{synopsis}}/g, metadata.synopsis || '');
}

function _extractJson(text) {
  // Strip markdown fences and any preamble
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  // If there's a leading preamble before the first {, cut it
  const firstBrace = t.indexOf('{');
  const lastBrace = t.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    t = t.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(t);
}

async function _evaluateGemini(metadata, imageB64) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = 'gemini-2.5-flash';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_KEY;
  const prompt = _fillPrompt(metadata);
  const parts = [{ text: prompt }];
  if (imageB64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageB64 } });
  const body = {
    contents: [{ parts: parts }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('Gemini ' + r.status + ': ' + errText.slice(0, 200));
  }
  const j = await r.json();
  const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts &&
               j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini returned empty response');
  return _extractJson(text);
}

async function _evaluateGrok(metadata, imageB64) {
  if (!GROK_KEY) throw new Error('GROK_API_KEY not set');
  const model = imageB64 ? 'grok-2-vision-1212' : 'grok-4-fast-non-reasoning';
  const prompt = _fillPrompt(metadata);
  const userContent = imageB64
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageB64 } }]
    : prompt;
  const body = {
    model: model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: userContent }]
  };
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROK_KEY
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('Grok ' + r.status + ': ' + errText.slice(0, 200));
  }
  const j = await r.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!text) throw new Error('Grok returned empty response');
  return _extractJson(text);
}

async function _evaluate(metadata, imageB64) {
  if (PROVIDER === 'grok') return _evaluateGrok(metadata, imageB64);
  return _evaluateGemini(metadata, imageB64);
}

// ── Photo identification (vision call) ───────────────────────────

async function _identifyFromPhoto(imageB64) {
  const prompt = 'Identify the title and author of this book cover. Return ONLY a JSON object: {"title": "...", "author": "...", "confidence": "high" or "medium" or "low"}. No preamble, no markdown.';
  if (PROVIDER === 'grok') {
    const body = {
      model: 'grok-2-vision-1212',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + imageB64 } }
      ] }]
    };
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROK_KEY },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('Grok identify ' + r.status);
    const j = await r.json();
    return _extractJson(j.choices[0].message.content);
  }
  // Gemini path
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY;
  const body = {
    contents: [{ parts: [
      { text: prompt },
      { inlineData: { mimeType: 'image/jpeg', data: imageB64 } }
    ] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  };
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('Gemini identify ' + r.status);
  const j = await r.json();
  return _extractJson(j.candidates[0].content.parts[0].text);
}

// ── Route init ───────────────────────────────────────────────────

function init(app, dataDir) {
  DATA_DIR = dataDir;
  CACHE_PATH = path.join(DATA_DIR, 'media-cache.json');
  const promptPath = path.join(path.dirname(CACHE_PATH), '..', 'media-prompt.txt');
  try {
    PROMPT_TEMPLATE = fs.readFileSync(path.join(__dirname, 'media-prompt.txt'), 'utf8');
  } catch (e) {
    console.error('[media] Failed to load media-prompt.txt:', e.message);
    PROMPT_TEMPLATE = 'Evaluate: {{title}} by {{author_or_director}} ({{year}}). Return JSON with verdict field.';
  }
  if (!fs.existsSync(CACHE_PATH)) {
    try { _saveCache({}); } catch (e) { console.error('[media] Cache init failed:', e.message); }
  }
  console.log('[media] Initialized with provider=' + PROVIDER + ', cache=' + CACHE_PATH);

  // ── POST /api/media/lookup ──
  app.post('/api/media/lookup', async (req, res) => {
    try {
      const { query, isbn, image_base64, type } = req.body || {};
      let candidates = [];
      if (isbn) {
        candidates = await _lookupIsbn(isbn);
      } else if (image_base64) {
        const ident = await _identifyFromPhoto(image_base64);
        if (ident && ident.title) {
          const q = ident.title + (ident.author ? ' ' + ident.author : '');
          candidates = await _searchBooks(q);
        }
      } else if (query) {
        // Try both books and movies in parallel
        const [books, movies] = await Promise.all([
          (type === 'movie' ? Promise.resolve([]) : _searchBooks(query)),
          (type === 'book' ? Promise.resolve([]) : _searchMovies(query))
        ]);
        candidates = books.concat(movies).slice(0, 4);
      }
      res.json({ candidates });
    } catch (err) {
      console.error('[media/lookup]', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/media/evaluate ──
  app.post('/api/media/evaluate', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!_rateOk(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });

    try {
      const { canonical_id, metadata } = req.body || {};
      if (!canonical_id || !metadata) return res.status(400).json({ error: 'Missing canonical_id or metadata' });

      const cache = _loadCache();
      const now = Date.now();
      if (cache[canonical_id] && cache[canonical_id].evaluated_at
          && cache[canonical_id].prompt_version === PROMPT_VERSION
          && (now - cache[canonical_id].evaluated_at) < CACHE_TTL_DAYS * 86400000) {
        return res.json(cache[canonical_id]);
      }

      const evaluation = await _evaluate(metadata);
      // Ensure required fields
      evaluation.canonical_id = canonical_id;
      evaluation.cover_url = _httpsCover(metadata.cover_url || null);
      evaluation.evaluated_at = now;
      evaluation.prompt_version = PROMPT_VERSION;
      if (typeof evaluation.parent_reviewed !== 'boolean') evaluation.parent_reviewed = false;
      if (!evaluation.type) evaluation.type = metadata.type || 'book';
      if (!evaluation.title) evaluation.title = metadata.title;
      if (!evaluation.author_or_director) evaluation.author_or_director = metadata.author_or_director;
      if (!evaluation.year && metadata.year) evaluation.year = metadata.year;

      cache[canonical_id] = evaluation;
      _saveCache(cache);
      res.json(evaluation);
    } catch (err) {
      console.error('[media/evaluate]', err.message);
      const upstream = _upstreamStatus(err.message);
      if (upstream === 429 || upstream === 503) {
        return res.status(upstream).json({ error: err.message, upstream: upstream });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/media/cache/:id ──
  app.get('/api/media/cache/:id', (req, res) => {
    const cache = _loadCache();
    const entry = cache[req.params.id];
    if (!entry) return res.status(404).json({ error: 'Not cached' });
    res.json(entry);
  });

  // ── GET /api/media/library ──
  app.get('/api/media/library', (req, res) => {
    res.json(_loadCache());
  });

  // ── POST /api/media/review/:id ── (mark parent_reviewed = true)
  app.post('/api/media/review/:id', (req, res) => {
    const cache = _loadCache();
    const entry = cache[req.params.id];
    if (!entry) return res.status(404).json({ error: 'Not cached' });
    entry.parent_reviewed = true;
    _saveCache(cache);
    res.json(entry);
  });

  // ── POST /api/media/reevaluate/:id ── (force re-eval one entry)
  app.post('/api/media/reevaluate/:id', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!_rateOk(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });
    const cache = _loadCache();
    const entry = cache[req.params.id];
    if (!entry) return res.status(404).json({ error: 'Not cached' });
    try {
      const metadata = {
        title: entry.title,
        author_or_director: entry.author_or_director,
        year: entry.year,
        type: entry.type,
        synopsis: entry.summary || ''
      };
      const fresh = await _evaluate(metadata);
      fresh.canonical_id = entry.canonical_id;
      fresh.cover_url = entry.cover_url;
      fresh.evaluated_at = Date.now();
      fresh.prompt_version = PROMPT_VERSION;
      fresh.parent_reviewed = entry.parent_reviewed || false;
      cache[entry.canonical_id] = fresh;
      _saveCache(cache);
      res.json(fresh);
    } catch (err) {
      console.error('[media/reevaluate]', err.message);
      const upstream = _upstreamStatus(err.message);
      if (upstream === 429 || upstream === 503) {
        return res.status(upstream).json({ error: err.message, upstream: upstream });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/media/reevaluate-stale ── (walks cache, re-evals stale entries)
  app.post('/api/media/reevaluate-stale', async (req, res) => {
    const cache = _loadCache();
    const stale = Object.keys(cache).filter(id =>
      cache[id].prompt_version !== PROMPT_VERSION);
    res.json({ started: true, count: stale.length });
    // Fire-and-forget; process serially with delay to respect rate limit
    (async () => {
      for (const id of stale) {
        try {
          const entry = cache[id];
          const metadata = {
            title: entry.title,
            author_or_director: entry.author_or_director,
            year: entry.year,
            type: entry.type,
            synopsis: entry.summary || ''
          };
          const fresh = await _evaluate(metadata);
          fresh.canonical_id = id;
          fresh.cover_url = entry.cover_url;
          fresh.evaluated_at = Date.now();
          fresh.prompt_version = PROMPT_VERSION;
          fresh.parent_reviewed = entry.parent_reviewed || false;
          const current = _loadCache();
          current[id] = fresh;
          _saveCache(current);
          console.log('[media/reevaluate-stale] Updated ' + entry.title);
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.warn('[media/reevaluate-stale] Failed ' + id + ':', err.message);
        }
      }
      console.log('[media/reevaluate-stale] Done');
    })();
  });

  // ── GET /api/media/stale-count ── (how many entries need re-eval)
  app.get('/api/media/stale-count', (req, res) => {
    const cache = _loadCache();
    const total = Object.keys(cache).length;
    const stale = Object.keys(cache).filter(id =>
      cache[id].prompt_version !== PROMPT_VERSION).length;
    res.json({ total: total, stale: stale, prompt_version: PROMPT_VERSION });
  });

  // ── POST /api/media/test-evaluate ──
  // Hermetic evaluation for regression testing. Bypasses cache entirely.
  // Shares the same rate limit bucket as /evaluate.
  app.post('/api/media/test-evaluate', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!_rateOk(ip)) return res.status(429).json({ error: 'Rate limit exceeded' });
    try {
      const { metadata } = req.body || {};
      if (!metadata || !metadata.title) {
        return res.status(400).json({ error: 'Missing metadata.title' });
      }
      const evaluation = await _evaluate(metadata);
      evaluation.prompt_version = PROMPT_VERSION;
      evaluation.evaluated_at = Date.now();
      evaluation._test = true;
      res.json(evaluation);
    } catch (err) {
      console.error('[media/test-evaluate]', err.message);
      const upstream = _upstreamStatus(err.message);
      if (upstream === 429 || upstream === 503) {
        return res.status(upstream).json({ error: err.message, upstream: upstream });
      }
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { init };
