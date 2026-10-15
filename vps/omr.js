/* ================================================================
   OMR — read a photo of sheet music into Little Maestro's notation

   POST /api/omr  { images: [<base64 JPEG>, …up to 4 pages, in order] (or image: one),
                    title?: "Sonatina"     only that piece, if a page has several
                    hint?: "Alfred 1B p.44",
                    continueFrom?: { bars, time, key, rh, lh }   pages that follow bar `bars` }
     → { ok: true,  piece: { title, time, key, pickup, rh, lh, tempo, bpm, marks }, unsure: [bar…], notes, model }
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

   Voting catches random slips, not a mistake every read makes the same
   way. So the voted piece then gets one proofread: the model looks at
   the photo again with the transcription in hand (and the bars the
   reads disagreed on, with their alternatives) and checks that the
   music hangs together: staff positions, the key, finger numbers
   against hand positions, leaps, chords under the melody, repeated
   figures. The photo stays the authority: a lesson book's arrangement
   often differs from the famous tune, and must not be "corrected" to
   it. A change is kept only if the piece still compiles, and every
   changed bar comes back in `unsure` for the student to check.
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
// The API's latency for the very same request swings from ~7 s to 2 min
// or more (queueing, not thinking: thoughtsTokenCount is 0), and once
// a page took 5 minutes. So the reads race: as soon as the first good one
// is back, the others get VOTE_WINDOW_MS to join the vote, and the answer
// goes out with whatever has arrived. A read that hasn't answered within
// READ_LIMIT_MS is dropped.
const READ_LIMIT_MS = 150000;
const VOTE_WINDOW_MS = 12000;
// Proofread pass (OMR_PROOFREAD=0 turns it off). It usually takes 3–5 s,
// but the same latency swings hit it, so two race and the first answer
// counts; past the limit the voted piece goes out as it is.
const PROOFREAD = process.env.OMR_PROOFREAD !== '0';
const PROOF_RACE = 2;
const PROOF_LIMIT_MS = 40000;

const PROMPT = `You are an expert music engraver. Transcribe the piano piece in the photo(s) into the notation below.

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
- Bar marks, written as extra tokens inside the RIGHT-HAND bar they belong to:
  [: (repeat starts at this bar)   :] (repeat ends at this bar)   {1} {2} (this bar begins the 1st / 2nd ending)
  Fine   DC (D.C. al Fine at the end of this bar)   DS (D.S. al Fine)   Segno
  Example: "[: C4q D4q E4q F4q | {1} G4w :] | {2} C4w Fine"

RULES:
- "rh" = the treble-clef (top) staff, "lh" = the bass-clef (bottom) staff, bar by bar, even when the melody passes between staves.
  If a staff is empty in a bar, fill that bar with rests. If the piece has only one staff, return it as rh and leave lh as "".
- Every bar must add up to the time signature in BOTH hands (4/4 = 4 quarter beats, 3/4 = 3, 2/4 = 2, 6/8 = 3, 3/8 = 1.5).
  Exception: a pickup (anacrusis) first bar — give its length in beats as "pickup" — and the final bar may then be short to complete it.
- Both hands must have the same number of bars.
- Read the clef of each staff carefully, and count ledger lines; octave mistakes are the most common error.
- Staff positions, to check every note against (bottom to top):
  treble clef lines E4 G4 B4 D5 F5, spaces F4 A4 C5 E5; middle C (C4) is one ledger line below; G5 sits just above the top line, A5 on the first ledger line above.
  bass clef lines G2 B2 D3 F3 A3, spaces A2 C3 E3 G3; middle C (C4) is one ledger line above, B3 just above the top line.
  Reading a note one line or space too high or too low (a whole bar shifted by a third) is the second most common error: check the first note of every bar against this list.
- Write the music once, as printed, and mark repeats, endings, Fine and D.C. with the bar marks above.
- Ignore lyrics, slurs, chord symbols and illustrations.
- Bar notes ("marks"), each tied to the bar where it appears:
  kind "tip": printed instructions that help practising, e.g. hand-position cues ("RH: G position", "move thumb to C"),
              "Two RH positions", "hands together", "count aloud".
  kind "teacher": HANDWRITTEN notes (pencil or pen) such as "slow!", "practise 3x", a circled bar, a star — write what it says
              or what it marks. A handwritten finger number above a note goes into that note's ":n" instead.
  kind "dynamic": p, mp, mf, f, ff, pp, cresc., dim. — exactly as printed, at the bar where it starts.
- "tempo": the printed tempo word (e.g. "Moderately", "Allegro", "With spirit") and a sensible beats-per-minute for it.

Return ONLY a JSON object, no markdown:
{"title": "...", "time": "4/4", "key": "C", "pickup": 0, "rh": "...", "lh": "...",
 "tempo": {"text": "Moderately", "bpm": 92},
 "marks": [{"bar": 5, "kind": "tip", "text": "Move thumb to G"}],
 "unsure": [bar numbers you could not read confidently], "notes": "anything the student should check"}
Key names: C G D A E F Bb Eb Am Em Bm Dm Gm Cm.`;

const PROOF_PROMPT = `You are an expert piano teacher proofreading a transcription of the piano piece in the photo(s).
The transcription uses this notation (one string per hand, bars separated by " | "):
pitch+octave+duration (w h q e s; middle C = C4), "." dotted, "~" tie, "+" chord, "R" rest, ":n" finger number(s),
and bar marks inside right-hand bars: [: :] {1} {2} Fine DC DS Segno.

The PHOTO IS THE AUTHORITY. This is usually a beginner method-book arrangement (e.g. Alfred's Basic Piano Library):
it is often simplified, in a different key or hand position than the well-known tune, with its own rhythm.
NEVER change notes to match a version of the tune you know; change a bar only when the photo shows it was misread.

Use musical sense to find bars worth a second look, then check those against the photo:
- the first note of every bar against the staff (treble lines E4 G4 B4 D5 F5, spaces F4 A4 C5 E5; bass lines G2 B2 D3 F3 A3,
  spaces A2 C3 E3 G3; middle C one ledger line below treble / above bass). The most common errors: a note or a whole bar
  read one line/space too high or low (a third off), or an octave off.
- notes the key signature or an accidental changes (an accidental lasts to the end of its bar);
- finger numbers that don't fit the notes (a five-finger position: finger 1 on C means 2=D 3=E 4=F 5=G; a jump the
  fingering can't reach usually means a misread note or position change printed in the music);
- leaps that are unusual for a beginner piece (a sixth or more), notes far from the rest of the line;
- left-hand notes or chords that clash with the melody where the piece is otherwise consonant;
- figures and bars that repeat elsewhere in the piece but were transcribed differently;
- ties joining different pitches, rhythms that don't match the beaming you see.
If a bar looks odd but the photo really shows it, leave it alone.

Return ONLY JSON, no markdown:
{"changes": [{"hand": "rh" or "lh", "bar": <bar number, 1 = first bar>, "to": "<the whole corrected bar, same notation, same total length, keeping its bar marks and finger numbers>", "why": "<short reason>"}],
 "check": [bar numbers that still look doubtful but you could not settle from the photo],
 "notes": "<one short sentence for the student, or empty>"}
Return {"changes": [], "check": [], "notes": ""} if the transcription matches the photo.`;

// Extra instructions for several pages, a chosen piece, or a continuation
function _context(opts) {
  const out = [];
  if (opts.pages > 1) out.push('There are ' + opts.pages + ' photos: pages 1 to ' + opts.pages + ' of ONE piece, in order. ' +
    'Transcribe them as one continuous piece; bar numbers (in "marks" and "unsure") count from the first bar of page 1.');
  if (opts.title) out.push('If a page shows more than one piece, transcribe ONLY the piece titled "' + String(opts.title).slice(0, 80) + '".');
  const cf = opts.continueFrom;
  if (cf && cf.bars > 0) out.push('These photos CONTINUE a piece already transcribed up to bar ' + (cf.bars | 0) +
    ' (time ' + String(cf.time).slice(0, 5) + ', key ' + String(cf.key).slice(0, 4) + '). Its last bar was: RH "' +
    String(cf.rh || '').slice(0, 200) + '", LH "' + String(cf.lh || '').slice(0, 200) + '". ' +
    'Transcribe only the music AFTER that bar (skip it if the photo repeats it), with "pickup": 0, and number bars in "marks" ' +
    'and "unsure" from 1 for the new part. Use the same time signature and key unless the music changes them.');
  if (opts.hint) out.push('The student says this is: ' + String(opts.hint).slice(0, 120));
  return out.length ? '\n\n' + out.join('\n') : '';
}

function _extractJson(text) {
  let t = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

async function _ask(parts, model, thinking, signal) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + GEMINI_KEY;
  const r = await fetch(url, {
    signal,
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

// Small slips in token order the model makes that mean the same thing:
// "D5h.:5~" (finger before tie) → "D5h.~:5"
function _tidy(voice) {
  return String(voice || '').trim().replace(/(:[1-5](?:,[1-5])*)~/g, '~$1');
}

const MARK_KINDS = { tip: 1, teacher: 1, dynamic: 1 };

function _clean(p) {
  const pickup = Number(p.pickup) || 0;
  const tempo = p.tempo && typeof p.tempo === 'object' ? p.tempo : {};
  const bpm = Math.round(Number(tempo.bpm));
  return {
    tempo: String(tempo.text || '').slice(0, 40),
    bpm: bpm >= 30 && bpm <= 220 ? bpm : null,
    marks: (Array.isArray(p.marks) ? p.marks : []).filter(m => m && Number.isFinite(+m.bar) && m.text && MARK_KINDS[m.kind])
      .slice(0, 40).map(m => ({ bar: Math.round(+m.bar), kind: m.kind, text: String(m.text).slice(0, 120) })),
    title: String(p.title || '').slice(0, 80),
    time: /^\d+\/\d+$/.test(p.time || '') ? p.time : '4/4',
    key: String(p.key || 'C'),
    pickup: pickup > 0 ? pickup : 0,
    rh: _tidy(p.rh),
    lh: _tidy(p.lh),
  };
}

// Compile with the app's own engine; returns an error message or null
function _check(piece) {
  try {
    const score = { time: piece.time, key: piece.key, rh: piece.rh || undefined, lh: piece.lh || undefined, marks: piece.marks };
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

const BAR_MARK = /^(\[:|:\]|\{[12]\}|Fine|DC|DS|Segno)$/;
function _marksOf(bar) { return bar.split(/\s+/).filter(t => BAR_MARK.test(t)); }
function _withMarks(bar, marks) {
  // A replacement keeps the original's bar marks, in their usual places
  const notes = bar.split(/\s+/).filter(t => t && !BAR_MARK.test(t));
  const open = marks.filter(m => m === '[:' || /^\{/.test(m) || m === 'Segno');
  const close = marks.filter(m => !(m === '[:' || /^\{/.test(m) || m === 'Segno'));
  return open.concat(notes, close).join(' ');
}

// One proofreading pass over a valid piece. Returns { piece, changed: [{hand, bar, from, to, why}], check, notes }.
async function _proofread(piece, images, hint, disagree, model, thinking, log, signal) {
  const ask = 'TRANSCRIPTION TO CHECK:\n' + JSON.stringify({ title: piece.title, time: piece.time, key: piece.key, pickup: piece.pickup, rh: piece.rh, lh: piece.lh }) +
    (disagree.length ? '\n\nThe independent reads disagreed on these bars (alternatives they gave):\n' +
      disagree.map(d => d.hand + ' bar ' + d.bar + ': ' + d.options.map(o => '"' + o + '"').join(' or ')).join('\n') : '');
  const r = await _ask([{ text: PROOF_PROMPT + hint }].concat(images, [{ text: ask }]), model, thinking, signal || AbortSignal.timeout(PROOF_LIMIT_MS));
  const j = r.json || {};
  let cur = Object.assign({}, piece);
  const changed = [];
  (Array.isArray(j.changes) ? j.changes : []).slice(0, 24).forEach(ch => {
    const hand = ch && (ch.hand === 'lh' ? 'lh' : ch.hand === 'rh' ? 'rh' : null);
    const i = Math.round(+(ch && ch.bar)) - 1;
    if (!hand || !cur[hand] || !(typeof ch.to === 'string')) return;
    const bars = _bars(cur[hand]);
    if (i < 0 || i >= bars.length) return;
    const to = _withMarks(_tidy(ch.to), _marksOf(bars[i]));
    if (_norm(to) === _norm(bars[i])) return;
    const next = Object.assign({}, cur, { [hand]: bars.map((b, k) => (k === i ? to : b)).join(' | ') });
    const err = _check(next);
    if (err) { if (log) log('proofread change dropped (' + hand + ' bar ' + (i + 1) + '): ' + err); return; }
    changed.push({ hand, bar: i + 1, from: bars[i], to, why: String(ch.why || '').slice(0, 120) });
    cur = next;
  });
  const check = (Array.isArray(j.check) ? j.check : []).map(n => Math.round(+n)).filter(n => n >= 1 && n <= _bars(cur.rh || cur.lh).length);
  return { piece: cur, changed, check, notes: String(j.notes || '').slice(0, 200) };
}

// Bars the vote split on, with what each side read
function _disagreements(pieces, voted) {
  const out = [];
  voted.unsure.forEach(bar => {
    ['rh', 'lh'].forEach(h => {
      if (!voted.piece[h]) return;
      const opts = {};
      pieces.forEach(p => { const b = _bars(p[h])[bar - 1]; if (b) opts[_norm(b)] = b; });
      if (Object.keys(opts).length > 1) out.push({ hand: h, bar, options: Object.values(opts).slice(0, 3) });
    });
  });
  return out.slice(0, 16);
}

async function transcribe(imageB64, opts) {
  opts = opts || {};
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');
  const model = opts.model || MODEL;
  const reads = opts.reads || READS;
  const thinking = opts.thinking === undefined ? THINKING : opts.thinking;
  // One photo or several pages, in order
  const images = (Array.isArray(imageB64) ? imageB64 : [imageB64]).slice(0, 4)
    .map(data => ({ inlineData: { mimeType: opts.mime || 'image/jpeg', data } }));
  const hint = _context(Object.assign({}, opts, { pages: images.length }));

  const started = Date.now();
  const timings = [];
  const answers = [];
  let lastError = null;
  await new Promise(resolve => {
    let pending = reads, voteTimer = null, done = false;
    const ctrls = Array.from({ length: reads }, () => new AbortController());
    const finish = () => { if (done) return; done = true; clearTimeout(voteTimer); ctrls.forEach(c => c.abort()); resolve(); };
    ctrls.forEach((ctrl, i) => {
      const limit = setTimeout(() => ctrl.abort(), READ_LIMIT_MS);
      _ask([{ text: PROMPT + hint }].concat(images), model, thinking, ctrl.signal)
        .then(a => {
          if (done) return;
          answers.push(a);
          timings[i] = ((Date.now() - started) / 1000).toFixed(1) + 's';
          // First good read: the rest have a short window to join the vote
          if (!voteTimer && _check(_clean(a.json)) === null) voteTimer = setTimeout(finish, VOTE_WINDOW_MS);
        })
        .catch(e => { lastError = e; timings[i] = ctrl.signal.aborted ? 'cut off' : 'failed'; })
        .finally(() => {
          clearTimeout(limit);
          pending--;
          if (pending === 0) finish();
        });
    });
  });
  if (opts.log) opts.log('reads: ' + Array.from({ length: reads }, (_, i) => timings[i] || 'cut off').join(', '));
  if (!answers.length) throw lastError || new Error('No reads came back');
  // Prefer reads that compile; fall back to all of them
  const pieces = answers.map(a => _clean(a.json));
  const valid = pieces.filter(p => !_check(p));
  const voted = _vote(valid.length ? valid : pieces);
  let piece = voted.piece;
  let err = _check(piece);
  const notes = answers.map(a => String(a.json.notes || '')).find(Boolean) || '';
  if (err) {
    if (opts.log) opts.log('repairing: ' + err);
    // One repair round, with the compiler's complaint
    const fix = await _ask([
      { text: PROMPT + hint }].concat(images, [
      { text: 'Your previous answer was:\n' + JSON.stringify(piece) + '\n\nIt is invalid: ' + err +
              '\nLook at the photo again, fix that bar (and any others like it), and return the full corrected JSON.' },
    ]), model, thinking, AbortSignal.timeout(60000)).catch(() => null);
    if (!fix) return Object.assign({ ok: false, error: err }, { piece, unsure: voted.unsure, notes: notes.slice(0, 400), model, reads: voted.reads, agreed: voted.agreed });
    const piece2 = _clean(fix.json);
    const err2 = _check(piece2);
    if (!err2 || err2 !== err) { piece = piece2; err = err2; }
  }
  let unsure = voted.unsure;
  let proof = null;
  let allNotes = notes;
  const wantProof = opts.proofread === undefined ? PROOFREAD : opts.proofread;
  if (!err && wantProof) {
    const t0 = Date.now();
    const ctrls = Array.from({ length: PROOF_RACE }, () => new AbortController());
    const limit = setTimeout(() => ctrls.forEach(c => c.abort()), PROOF_LIMIT_MS);
    try {
      const disagree = _disagreements(valid.length ? valid : pieces, voted);
      const pr = await Promise.any(ctrls.map(c => _proofread(piece, images, hint, disagree, model, thinking, opts.log, c.signal)));
      piece = pr.piece;
      unsure = Array.from(new Set(unsure.concat(pr.changed.map(c => c.bar), pr.check))).sort((a, b) => a - b);
      if (pr.changed.length) allNotes = ('Proofreading changed bar' + (pr.changed.length > 1 ? 's ' : ' ') +
        Array.from(new Set(pr.changed.map(c => c.bar))).join(', ') + ' — check ' + (pr.changed.length > 1 ? 'them' : 'it') + ' against the book. ' + allNotes).trim();
      if (pr.notes && allNotes.indexOf(pr.notes) < 0) allNotes = (allNotes + ' ' + pr.notes).trim();
      proof = { changed: pr.changed, check: pr.check, ms: Date.now() - t0 };
      if (opts.log) opts.log('proofread in ' + (proof.ms / 1000).toFixed(1) + 's: ' + (pr.changed.length
        ? pr.changed.map(c => c.hand + ' bar ' + c.bar + ' "' + c.from + '" → "' + c.to + '" (' + c.why + ')').join('; ')
        : 'no changes') + (pr.check.length ? '; check bars ' + pr.check.join(',') : ''));
    } catch (e) {
      const why = e && e.errors ? (ctrls[0].signal.aborted ? 'no answer in ' + PROOF_LIMIT_MS / 1000 + ' s' : e.errors.map(x => x.message).join('; ')) : e.message;
      if (opts.log) opts.log('proofread skipped: ' + why);
    } finally {
      clearTimeout(limit);
      ctrls.forEach(c => c.abort());
    }
  }
  const out = { piece, unsure, notes: allNotes.slice(0, 400), model, reads: voted.reads, agreed: voted.agreed, proofread: proof };
  return err ? Object.assign({ ok: false, error: err }, out) : Object.assign({ ok: true }, out);
}

function init(app) {
  // Several photos can pass the app-wide 5 MB body limit (server.js skips it for this route)
  app.post('/api/omr', require('express').json({ limit: '25mb' }), async (req, res) => {
    const body = req.body || {};
    const list = (Array.isArray(body.images) ? body.images : [body.image]).filter(x => typeof x === 'string' && x.length >= 1000);
    if (!list.length) return res.status(400).json({ ok: false, error: 'No image' });
    if (list.length > 4) return res.status(400).json({ ok: false, error: 'Up to 4 pages at a time' });
    const b64 = list.map(img => img.replace(/^data:image\/\w+;base64,/, ''));
    const started = Date.now();
    try {
      const out = await transcribe(b64, {
        hint: body.hint, title: body.title, continueFrom: body.continueFrom,
        log: m => console.log('[omr] ' + m),
      });
      console.log('[omr] ' + (out.ok ? 'ok' : 'invalid: ' + out.error) + ' in ' + (Date.now() - started) + ' ms (' + out.model + ', ' + b64.length + ' page' + (b64.length > 1 ? 's' : '') + ')');
      res.json(out);
    } catch (e) {
      console.error('[omr] failed:', e.message);
      res.status(502).json({ ok: false, error: 'Could not read the photo right now. Please try again.' });
    }
  });
}

module.exports = { init, transcribe, PROMPT, _proofread };
