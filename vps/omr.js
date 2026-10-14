/* ================================================================
   OMR — read a photo of sheet music into Little Maestro's notation

   POST /api/omr  { image: <base64 JPEG>, hint?: "Alfred 1B p.44" }
     → { ok: true,  piece: { title, time, key, pickup, rh, lh }, unsure: [bar…], notes, model }
     → { ok: false, error, piece?, ... }   (piece = best effort to fix by hand)

   Little Maestro's My Book editor (js/lm-builder.js) sends the photo a
   student takes of their lesson book, then opens the result for them
   to check against the page. The photo goes to Gemini and is not kept.

   Models misread the odd bar or whole line (typically a line read a
   step too high), but rarely the same way twice. So the page is read
   READS times in parallel and each bar is decided by majority; bars
   the reads disagree on come back in `unsure` for the student to
   check first. The result is checked with the compiler the app uses
   (js/lm-score.js); if a bar doesn't add up, the model gets one
   chance to fix it with the error in hand.
   ================================================================ */

const path = require('path');
const LMScore = require(path.join(__dirname, '..', 'js', 'lm-score.js'));

const GEMINI_KEY = process.env.GEMINI_API_KEY;
// Benchmarked 2026-10-14 on rendered pages, clean and "phone photo"
// (tilted, blurred, shadowed): gemini-4-argon read every note right in
// 7–15 s; gemini-3.8-flash took up to 4½ min, or got half the notes
// wrong with thinking turned down; gemini-3.1-pro-preview did worse.
const MODEL = process.env.OMR_MODEL || 'gemini-4-argon';
const READS = Math.max(1, Math.min(5, parseInt(process.env.OMR_READS, 10) || 3));
const THINKING = process.env.OMR_THINKING || null;    // Gemini 3 thinking level; null = the model's default

const PROMPT = `You are an expert music engraver. Transcribe the piano piece in this photo into the notation below.

NOTATION (one string per hand; bars separated by " | "; tokens separated by spaces):
- Note: pitch + octave + duration letter. Middle C is C4. Durations: w=whole h=half q=quarter e=eighth s=sixteenth.
  Examples: C4q  G3h  F#4e  Bb3w
- Dotted note: add "." after the duration: D4h.  (dotted half = 3 beats)
- Tie into the next note of the same pitch: add "~": E4h~
- Chord (notes on one stem): join with "+": C3+E3+G3h
- Rest: R + duration: Rq  Rh  Rw
- Finger number printed above/below a note: add ":n" (chords: comma list, lowest note first): C4q:1  C3+E3+G3h:5,3,1
- Write every pitch as it SOUNDS. Apply the key signature and any accidentals yourself: in G major write F#4, not F4.
  An accidental lasts to the end of its bar.

RULES:
- "rh" = the treble-clef (top) staff, "lh" = the bass-clef (bottom) staff, bar by bar, even when the melody passes between staves.
  If a staff is empty in a bar, fill that bar with rests. If the piece has only one staff, return it as rh and leave lh as "".
- Every bar must add up to the time signature in BOTH hands (4/4 = 4 quarter beats, 3/4 = 3, 2/4 = 2, 6/8 = 3, 3/8 = 1.5).
  Exception: a pickup (anacrusis) first bar — give its length in beats as "pickup" — and the final bar may then be short to complete it.
- Both hands must have the same number of bars.
- Read the clef of each staff carefully, and count ledger lines; octave mistakes are the most common error.
- Ignore lyrics, titles of sections, dynamics (p, f), slurs, chord symbols, teacher pencil marks and illustrations.
- Repeat signs: write the music once, as printed.

Return ONLY a JSON object, no markdown:
{"title": "...", "time": "4/4", "key": "C", "pickup": 0, "rh": "...", "lh": "...",
 "unsure": [bar numbers you could not read confidently], "notes": "anything the student should check"}
Key names: C G D A E F Bb Eb Am Em Bm Dm Gm Cm.`;

function _extractJson(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

async function _ask(parts, model, thinking) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_KEY;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: Object.assign(
        { temperature: 0.1, responseMimeType: 'application/json' },
        thinking ? { thinkingConfig: { thinkingLevel: thinking } } : {}),
    }),
  });
  if (!r.ok) throw new Error('Gemini ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  const c = j.candidates && j.candidates[0];
  const text = c && c.content && c.content.parts && c.content.parts.map(p => p.text || '').join('');
  if (!text) throw new Error('Gemini returned no text');
  return { raw: text, json: _extractJson(text) };
}

function _clean(p) {
  const pickup = Number(p.pickup) || 0;
  return {
    title: String(p.title || '').slice(0, 80),
    time: /^\d+\/\d+$/.test(p.time || '') ? p.time : '4/4',
    key: String(p.key || 'C'),
    pickup: pickup > 0 ? pickup : 0,
    rh: String(p.rh || '').trim(),
    lh: String(p.lh || '').trim(),
  };
}

// Compile with the app's own engine; returns an error message or null
function _check(piece) {
  try {
    const score = { time: piece.time, key: piece.key, rh: piece.rh || undefined, lh: piece.lh || undefined };
    if (piece.pickup) score.pickup = piece.pickup;
    LMScore.compile({ id: 'omr', title: piece.title || 'photo', score });
    return null;
  } catch (e) {
    return e.message.replace(/^#omr [^:]*: /, '');
  }
}

// Bars of one hand, for comparing reads (fingers don't count)
function _bars(str) { return String(str || '').split('|').map(b => b.trim()); }
function _norm(bar) { return bar.replace(/:[\d,]+/g, '').replace(/\s+/g, ' ').trim(); }

// Majority vote across reads. Returns { piece, unsure } or null.
function _vote(pieces) {
  if (!pieces.length) return null;
  // Agree on the frame first: time, key, pickup and bar count
  const frame = p => [p.time, p.key, p.pickup, _bars(p.rh).length, p.lh ? _bars(p.lh).length : 0].join('|');
  const counts = {};
  pieces.forEach(p => { const f = frame(p); counts[f] = (counts[f] || 0) + 1; });
  const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const group = pieces.filter(p => frame(p) === best);
  const base = group[0];
  const unsure = new Set();
  const out = Object.assign({}, base);
  ['rh', 'lh'].forEach(h => {
    if (!base[h]) return;
    const all = group.map(p => _bars(p[h]));
    out[h] = all[0].map((_, i) => {
      const tally = {};
      all.forEach(bars => { const n = _norm(bars[i]); (tally[n] = tally[n] || []).push(bars[i]); });
      const winner = Object.keys(tally).sort((a, b) => tally[b].length - tally[a].length)[0];
      if (group.length > 1 && tally[winner].length <= group.length / 2) unsure.add(i + 1);
      return tally[winner][0];
    }).join(' | ');
  });
  return { piece: out, unsure: Array.from(unsure).sort((a, b) => a - b), agreed: group.length, reads: pieces.length };
}

async function transcribe(imageB64, opts) {
  opts = opts || {};
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = opts.model || MODEL;
  const reads = opts.reads || READS;
  const thinking = opts.thinking === undefined ? THINKING : opts.thinking;
  const image = { inlineData: { mimeType: opts.mime || 'image/jpeg', data: imageB64 } };
  const hint = opts.hint ? '\nThe student says this is: ' + String(opts.hint).slice(0, 120) : '';

  const settled = await Promise.allSettled(Array.from({ length: reads }, () => _ask([{ text: PROMPT + hint }, image], model, thinking)));
  const answers = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!answers.length) throw settled[0].reason;
  // Prefer reads that compile; fall back to all of them
  const pieces = answers.map(a => _clean(a.json));
  const valid = pieces.filter(p => !_check(p));
  const voted = _vote(valid.length ? valid : pieces);
  let piece = voted.piece;
  let err = _check(piece);
  const notes = answers.map(a => String(a.json.notes || '')).find(Boolean) || '';
  if (err) {
    // One repair round, with the compiler's complaint
    const fix = await _ask([
      { text: PROMPT + hint }, image,
      { text: 'Your previous answer was:\n' + JSON.stringify(piece) + '\n\nIt is invalid: ' + err +
              '\nLook at the photo again, fix that bar (and any others like it), and return the full corrected JSON.' },
    ], model, thinking);
    const piece2 = _clean(fix.json);
    const err2 = _check(piece2);
    if (!err2 || err2 !== err) { piece = piece2; err = err2; }
  }
  const out = { piece, unsure: voted.unsure, notes: notes.slice(0, 400), model, reads: voted.reads, agreed: voted.agreed };
  return err ? Object.assign({ ok: false, error: err }, out) : Object.assign({ ok: true }, out);
}

function init(app) {
  app.post('/api/omr', async (req, res) => {
    const img = req.body && req.body.image;
    if (!img || typeof img !== 'string' || img.length < 1000) return res.status(400).json({ ok: false, error: 'No image' });
    const b64 = img.replace(/^data:image\/\w+;base64,/, '');
    const started = Date.now();
    try {
      const out = await transcribe(b64, { hint: req.body.hint });
      console.log('[omr] ' + (out.ok ? 'ok' : 'invalid: ' + out.error) + ' in ' + (Date.now() - started) + ' ms (' + out.model + ')');
      res.json(out);
    } catch (e) {
      console.error('[omr] failed:', e.message);
      res.status(502).json({ ok: false, error: 'Could not read the photo right now. Please try again.' });
    }
  });
}

module.exports = { init, transcribe, PROMPT };
